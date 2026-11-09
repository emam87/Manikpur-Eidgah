import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs';
import path from 'path';
import { ENV } from '../config/env.js';

const isR2Configured = Boolean(
  ENV.R2_ACCOUNT_ID &&
  ENV.R2_ACCESS_KEY_ID &&
  ENV.R2_SECRET_ACCESS_KEY &&
  ENV.R2_PUBLIC_BUCKET_NAME
);

let s3Client = null;

if (isR2Configured) {
  s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${ENV.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: ENV.R2_ACCESS_KEY_ID,
      secretAccessKey: ENV.R2_SECRET_ACCESS_KEY,
    },
  });
}

// Local fallback storage directory for development/testing when R2 is not connected
const LOCAL_STORAGE_DIR = path.resolve(process.cwd(), 'uploads');
const LOCAL_PRIVATE_DIR = path.resolve(process.cwd(), 'uploads/private');

function ensureLocalDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Upload a public file (photo, thumbnail, design render) to R2 public bucket.
 * Falls back to local storage if R2 is not configured.
 *
 * @param {string} key - S3 object key (e.g., 'members/abc123_thumb.webp')
 * @param {Buffer} buffer - File buffer
 * @param {string} mimeType - e.g., 'image/webp'
 * @returns {Promise<{ key: string, url: string }>}
 */
export async function uploadPublicFile(key, buffer, mimeType) {
  const cleanKey = key.replace(/^\/+/, '');

  if (s3Client) {
    const command = new PutObjectCommand({
      Bucket: ENV.R2_PUBLIC_BUCKET_NAME,
      Key: cleanKey,
      Body: buffer,
      ContentType: mimeType,
    });
    await s3Client.send(command);

    const publicUrl = ENV.R2_PUBLIC_URL
      ? `${ENV.R2_PUBLIC_URL}/${cleanKey}`
      : `/uploads/${cleanKey}`;

    return { key: cleanKey, url: publicUrl };
  }

  // Local fallback
  const localPath = path.join(LOCAL_STORAGE_DIR, cleanKey);
  ensureLocalDir(localPath);
  fs.writeFileSync(localPath, buffer);

  return {
    key: cleanKey,
    url: `/uploads/${cleanKey}`,
  };
}

/**
 * Upload a private document to R2 private bucket.
 * Access to this bucket is strictly gated via signed URLs.
 *
 * @param {string} key - e.g., 'documents/deed-1965-uuid.pdf'
 * @param {Buffer} buffer - File buffer
 * @param {string} mimeType - e.g., 'application/pdf'
 * @returns {Promise<{ key: string }>}
 */
export async function uploadPrivateFile(key, buffer, mimeType) {
  const cleanKey = key.replace(/^\/+/, '');

  if (s3Client && ENV.R2_PRIVATE_BUCKET_NAME) {
    const command = new PutObjectCommand({
      Bucket: ENV.R2_PRIVATE_BUCKET_NAME,
      Key: cleanKey,
      Body: buffer,
      ContentType: mimeType,
    });
    await s3Client.send(command);
    return { key: cleanKey };
  }

  // Local fallback
  const localPath = path.join(LOCAL_PRIVATE_DIR, cleanKey);
  ensureLocalDir(localPath);
  fs.writeFileSync(localPath, buffer);

  return { key: cleanKey };
}

/**
 * Generate a short-lived presigned URL for private documents.
 * Valid for 15 minutes (900 seconds) by default.
 *
 * @param {string} key - Object key in private bucket
 * @param {number} [expiresInSeconds=900]
 * @returns {Promise<string>}
 */
export async function getSignedDocumentUrl(key, expiresInSeconds = 900) {
  const cleanKey = key.replace(/^\/+/, '');

  if (s3Client && ENV.R2_PRIVATE_BUCKET_NAME) {
    const command = new GetObjectCommand({
      Bucket: ENV.R2_PRIVATE_BUCKET_NAME,
      Key: cleanKey,
    });
    return getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
  }

  // Local development fallback
  return `/api/documents/private-file?key=${encodeURIComponent(cleanKey)}`;
}

export const getPrivateSignedDownloadUrl = getSignedDocumentUrl;

/**
 * Delete a file from public storage.
 * @param {string} key
 */
export async function deletePublicFile(key) {
  if (!key) return;
  const cleanKey = key.replace(/^\/+/, '');

  if (s3Client) {
    try {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: ENV.R2_PUBLIC_BUCKET_NAME,
          Key: cleanKey,
        })
      );
    } catch (err) {
      console.warn(`Failed to delete R2 public file ${cleanKey}:`, err.message);
    }
  }

  const localPath = path.join(LOCAL_STORAGE_DIR, cleanKey);
  if (fs.existsSync(localPath)) {
    try {
      fs.unlinkSync(localPath);
    } catch {}
  }
}

/**
 * Delete a file from private storage.
 * @param {string} key
 */
export async function deletePrivateFile(key) {
  if (!key) return;
  const cleanKey = key.replace(/^\/+/, '');

  if (s3Client && ENV.R2_PRIVATE_BUCKET_NAME) {
    try {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: ENV.R2_PRIVATE_BUCKET_NAME,
          Key: cleanKey,
        })
      );
    } catch (err) {
      console.warn(`Failed to delete R2 private file ${cleanKey}:`, err.message);
    }
  }

  const localPath = path.join(LOCAL_PRIVATE_DIR, cleanKey);
  if (fs.existsSync(localPath)) {
    try {
      fs.unlinkSync(localPath);
    } catch {}
  }
}

/**
 * Get storage statistics (total files and estimated bytes) for Admin Dashboard
 * @returns {Promise<{ totalBytes: number, totalFiles: number, isR2: boolean }>}
 */
export async function getStorageUsage() {
  if (s3Client && ENV.R2_PUBLIC_BUCKET_NAME) {
    try {
      let totalBytes = 0;
      let totalFiles = 0;
      let isTruncated = true;
      let continuationToken = undefined;

      while (isTruncated) {
        const resp = await s3Client.send(
          new ListObjectsV2Command({
            Bucket: ENV.R2_PUBLIC_BUCKET_NAME,
            ContinuationToken: continuationToken,
          })
        );

        if (resp.Contents) {
          for (const item of resp.Contents) {
            totalBytes += item.Size || 0;
            totalFiles += 1;
          }
        }

        isTruncated = Boolean(resp.IsTruncated);
        continuationToken = resp.NextContinuationToken;
      }

      return { totalBytes, totalFiles, isR2: true };
    } catch (err) {
      console.warn('Error reading R2 bucket usage:', err.message);
    }
  }

  // Local storage stats
  let totalBytes = 0;
  let totalFiles = 0;

  function countDir(dirPath) {
    if (!fs.existsSync(dirPath)) return;
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        countDir(full);
      } else {
        totalFiles++;
        totalBytes += fs.statSync(full).size;
      }
    }
  }

  countDir(LOCAL_STORAGE_DIR);

  return { totalBytes, totalFiles, isR2: false };
}

