/**
 * Image processing utilities for client-side uploads.
 * Supports HEIC/HEIF to JPEG conversion, camera/gallery multi-select, and preview generation.
 */

export async function processImageUpload(file) {
  if (!file) return null;

  const isHeic =
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    /\.(heic|heif)$/i.test(file.name);

  if (isHeic) {
    try {
      // In iOS 17+ and modern WebKit/Safari, createImageBitmap can decode HEIC directly
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(bitmap, 0, 0);

      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', 0.9)
      );

      if (blob) {
        const newFileName = file.name.replace(/\.(heic|heif)$/i, '.jpg');
        return new File([blob], newFileName, { type: 'image/jpeg' });
      }
    } catch {
      // If client-side bitmap decode fails, pass original file for backend Sharp conversion
      return file;
    }
  }

  return file;
}

export async function processMultipleImages(files) {
  if (!files || !files.length) return [];
  const processed = [];
  for (let i = 0; i < files.length; i++) {
    const p = await processImageUpload(files[i]);
    if (p) processed.push(p);
  }
  return processed;
}
