import sharp from 'sharp';
import crypto from 'crypto';
import { fileTypeFromBuffer } from 'file-type';
import { uploadPublicFile, deletePublicFile } from './r2.service.js';

export const ALLOWED_IMAGE_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
];

/**
 * Validates real buffer MIME type against allowed image types.
 * Prevents disguised malicious payloads.
 *
 * @param {Buffer} buffer
 * @returns {Promise<{ valid: boolean, mime?: string, ext?: string }>}
 */
export async function validateImageBuffer(buffer) {
  if (!buffer || buffer.length === 0) {
    return { valid: false };
  }

  const detected = await fileTypeFromBuffer(buffer);
  if (!detected || !ALLOWED_IMAGE_MIMES.includes(detected.mime)) {
    return { valid: false };
  }

  return { valid: true, mime: detected.mime, ext: detected.ext };
}

/**
 * Strips EXIF/GPS, resizes, converts to WebP, and generates an optimized thumbnail.
 *
 * @param {object} options
 * @param {Buffer} options.buffer - Raw image buffer
 * @param {string} options.directory - Target R2 subfolder (e.g. 'members', 'photos', 'designs')
 * @param {number} [options.maxWidth=1920]
 * @param {number} [options.maxHeight=1440]
 * @param {number} [options.quality=82]
 * @param {boolean} [options.createThumb=true]
 * @param {number} [options.thumbWidth=600]
 * @param {number} [options.thumbHeight=450]
 * @param {string} [options.baseKey] - Optional custom filename key
 * @returns {Promise<{ path: string, thumbPath: string|null, width: number, height: number, fileSize: number }>}
 */
export async function processAndUploadImage({
  buffer,
  directory,
  maxWidth = 1920,
  maxHeight = 1440,
  quality = 82,
  createThumb = true,
  thumbWidth = 600,
  thumbHeight = 450,
  baseKey = null,
}) {
  const validation = await validateImageBuffer(buffer);
  if (!validation.valid) {
    throw new Error('Invalid or unsupported image file format.');
  }

  const randomId = baseKey || crypto.randomBytes(12).toString('hex');
  const cleanDir = directory.replace(/^\/+|\/+$/g, '');

  // 1. Process Main Image: Strip EXIF metadata, resize to within bounds, convert to WebP
  const mainImageSharp = sharp(buffer)
    .rotate() // Auto-orient based on EXIF before stripping
    .resize({
      width: maxWidth,
      height: maxHeight,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality, effort: 4 });

  const mainBuffer = await mainImageSharp.toBuffer();
  const mainMeta = await sharp(mainBuffer).metadata();

  const mainKey = `${cleanDir}/${randomId}.webp`;
  const mainUpload = await uploadPublicFile(mainKey, mainBuffer, 'image/webp');

  let thumbKey = null;

  // 2. Process Thumbnail
  if (createThumb) {
    const thumbSharp = sharp(buffer)
      .rotate()
      .resize({
        width: thumbWidth,
        height: thumbHeight,
        fit: 'cover',
        position: 'center',
      })
      .webp({ quality: 80, effort: 4 });

    const thumbBuffer = await thumbSharp.toBuffer();
    thumbKey = `${cleanDir}/${randomId}_thumb.webp`;
    await uploadPublicFile(thumbKey, thumbBuffer, 'image/webp');
  }

  return {
    path: mainUpload.key,
    thumbPath: thumbKey,
    width: mainMeta.width || null,
    height: mainMeta.height || null,
    fileSize: mainBuffer.length,
  };
}

/**
 * Remove both main image and thumbnail from storage
 * @param {string} path
 * @param {string} [thumbPath]
 */
export async function deleteImageAssets(path, thumbPath = null) {
  if (path) {
    await deletePublicFile(path);
  }
  if (thumbPath) {
    await deletePublicFile(thumbPath);
  }
}

