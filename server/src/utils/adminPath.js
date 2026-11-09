/**
 * Admin Path Validation & Helpers
 * Enforces security constraints on the secret admin prefix URL.
 */

export const FORBIDDEN_ADMIN_PATHS = [
  'admin',
  'login',
  'dashboard',
  'panel',
  'wp-admin',
  'cpanel',
  'phpmyadmin',
  'administrator',
  'auth',
  'api',
  'root',
  'manage',
];

export const ADMIN_PATH_MIN_LENGTH = 8;
export const ADMIN_PATH_MAX_LENGTH = 40;

/**
 * Validates if the path string satisfies security criteria:
 * - 8 to 40 characters long
 * - Letters, numbers, and hyphens only
 * - Not in forbidden paths list
 *
 * @param {string} path - The raw path to validate
 * @returns {{ valid: boolean, error?: string, path?: string }}
 */
export function validateAdminPath(path) {
  if (!path || typeof path !== 'string') {
    return { valid: false, error: 'ADMIN_PATH is empty or not configured.' };
  }

  const trimmed = path.trim().replace(/^\/+|\/+$/g, '');
  const normalized = trimmed.toLowerCase();

  if (trimmed === '') {
    return { valid: false, error: 'ADMIN_PATH is empty or not configured.' };
  }

  if (FORBIDDEN_ADMIN_PATHS.includes(normalized)) {
    return {
      valid: false,
      error: `The value '${trimmed}' is a forbidden common path name. Choose an obscure path.`,
    };
  }

  if (trimmed.length < ADMIN_PATH_MIN_LENGTH || trimmed.length > ADMIN_PATH_MAX_LENGTH) {
    return {
      valid: false,
      error: `Length must be between ${ADMIN_PATH_MIN_LENGTH} and ${ADMIN_PATH_MAX_LENGTH} characters (current length: ${trimmed.length}).`,
    };
  }

  if (!/^[a-zA-Z0-9-]+$/.test(trimmed)) {
    return {
      valid: false,
      error: 'Only letters, numbers, and hyphens are allowed (no underscores, spaces, or special characters).',
    };
  }

  return { valid: true, path: trimmed };
}

/**
 * Returns the validated admin path or throws an error with instructions.
 * @param {string} rawPath
 * @returns {string}
 */
export function getValidatedAdminPath(rawPath) {
  const result = validateAdminPath(rawPath);
  if (!result.valid) {
    throw new Error(
      `❌ INVALID ADMIN_PATH: '${rawPath}'. ${result.error}\n` +
      `The secret admin path must be 8-40 characters long and contain only letters, numbers, and hyphens (e.g. 'eidgah-manage-k29x').\n` +
      `Common names like 'admin', 'login', 'dashboard', 'panel', or 'wp-admin' are strictly forbidden.\n` +
      `Please fix ADMIN_PATH / VITE_ADMIN_PATH in your .env file.`
    );
  }
  return result.path;
}

