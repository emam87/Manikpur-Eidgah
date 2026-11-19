/**
 * Resolves a stored image path/key to an absolute, browser-accessible URL.
 * Handles:
 * - null / undefined / empty -> fallback
 * - Full URLs ('http://...', 'https://...', 'data:...') -> untouched
 * - Already absolute paths ('/uploads/...', '/defaults/...') -> untouched
 * - Relative upload keys ('members/...', 'albums/...', 'designs/...') -> '/uploads/' + key
 * - Leading slash without uploads ('/members/...') -> '/uploads' + path
 *
 * @param {string|null|undefined} path - The raw photo path or S3 key
 * @param {string} [fallback=''] - Optional fallback image URL
 * @returns {string} - The resolved, browser-accessible URL
 */
export function getImageUrl(path, fallback = '') {
  if (!path || typeof path !== 'string' || !path.trim()) {
    return fallback;
  }

  const trimmed = path.trim();

  // Full URLs and data/blob URIs
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  // Already prefixed with /uploads/
  if (trimmed.startsWith('/uploads/')) {
    return trimmed;
  }

  // Prefixed with uploads/ (without leading slash)
  if (trimmed.startsWith('uploads/')) {
    return `/${trimmed}`;
  }

  // Static default assets packaged under client/public/defaults
  if (trimmed.startsWith('defaults/')) {
    return `/${trimmed}`;
  }

  // Other absolute paths (e.g. /defaults/eidgah-hero.webp, /icon-192.svg)
  if (trimmed.startsWith('/')) {
    // If it looks like a known subfolder without /uploads, e.g. /members/ or /albums/
    if (/^\/(members|land-donors|albums|photos|designs|documents|notices|settings)\//.test(trimmed)) {
      return `/uploads${trimmed}`;
    }
    return trimmed;
  }

  // Relative keys: e.g. "members/abc.webp", "albums/fitr-2025/xyz.webp", "designs/layout.jpg"
  return `/uploads/${trimmed}`;
}

