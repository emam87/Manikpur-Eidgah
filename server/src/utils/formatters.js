/**
 * Bangla Numerals and Formatting Utilities
 */

const EN_DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

/**
 * Convert numbers or digit strings to Bengali numerals.
 * @param {string|number|null|undefined} value
 * @param {boolean} [forceBangla=true]
 * @returns {string}
 */
export function toBengaliNumerals(value, forceBangla = true) {
  if (value === null || value === undefined) {
    return '';
  }

  const str = String(value);
  if (!forceBangla) {
    return str;
  }

  return str.replace(/\d/g, (match) => BN_DIGITS[parseInt(match, 10)]);
}

/**
 * Format a number into BDT currency format with Bengali numerals and ৳ symbol.
 * e.g., 25000 -> ৳ ২৫,০০০
 * @param {number|string|null|undefined} amount
 * @param {'bn'|'en'} [locale='bn']
 * @returns {string}
 */
export function formatBDT(amount, locale = 'bn') {
  if (amount === null || amount === undefined || amount === '') {
    return '';
  }

  const num = typeof amount === 'number' ? amount : parseFloat(String(amount));
  if (isNaN(num)) {
    return '';
  }

  // Format with commas: 25000 -> 25,000
  const formattedEn = Math.round(num).toLocaleString('en-US');

  if (locale === 'en') {
    return `BDT ${formattedEn}`;
  }

  return `৳ ${toBengaliNumerals(formattedEn, true)}`;
}

/**
 * Extract localized attribute from an object with automatic fallback.
 * @param {object} obj - Data object containing field_bn / field_en or fieldBn / fieldEn
 * @param {string} field - Base field name (e.g., 'title', 'caption', 'name')
 * @param {'bn'|'en'} [locale='bn'] - Desired locale
 * @returns {string}
 */
export function getLocalized(obj, field, locale = 'bn') {
  if (!obj || typeof obj !== 'object') {
    return '';
  }

  const primarySnake = `${field}_${locale}`;
  const fallbackSnake = locale === 'en' ? `${field}_bn` : `${field}_en`;

  const primaryCamel = `${field}${locale.charAt(0).toUpperCase() + locale.slice(1)}`;
  const fallbackCamel = locale === 'en' ? `${field}Bn` : `${field}En`;

  const val = obj[primaryCamel] ?? obj[primarySnake];
  if (typeof val === 'string' && val.trim() !== '') {
    return val;
  }

  const fallbackVal = obj[fallbackCamel] ?? obj[fallbackSnake] ?? obj[field];
  return typeof fallbackVal === 'string' ? fallbackVal : '';
}

