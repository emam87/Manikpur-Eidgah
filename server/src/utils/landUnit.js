/**
 * Utility functions for Land Area conversions and calculations
 * 
 * Default conversion rates:
 * - 1 Acre = 100 Decimal (শতাংশ)
 * - 1 Bigha = 33 Decimal (শতাংশ)
 * - 1 Katha = 1.65 Decimal (শতাংশ)
 * - 1 Decimal = 435.6 Sq. Ft.
 */

export const DEFAULT_UNIT_CONVERSION = {
  acre: 100,
  bigha: 33,
  katha: 1.65,
  sqft: 435.6,
};

/**
 * Computes the standardized area in Decimal (শতাংশ) given a value, unit, and conversion factors
 * @param {number|string} areaValue 
 * @param {string} areaUnit DECIMAL_SHATANGSHO | KATHA | BIGHA | ACRE | SQFT
 * @param {object} factors Optional custom conversion factors { acre, bigha, katha, sqft }
 * @returns {number} Standardized decimal value rounded to 4 places
 */
export function computeAreaInDecimal(areaValue, areaUnit, factors = {}) {
  const num = parseFloat(areaValue);
  if (isNaN(num) || num <= 0) return 0;

  const convAcre = parseFloat(factors.acre) || DEFAULT_UNIT_CONVERSION.acre;
  const convBigha = parseFloat(factors.bigha) || DEFAULT_UNIT_CONVERSION.bigha;
  const convKatha = parseFloat(factors.katha) || DEFAULT_UNIT_CONVERSION.katha;
  const convSqft = parseFloat(factors.sqft) || DEFAULT_UNIT_CONVERSION.sqft;

  let inDecimal = 0;
  switch (areaUnit) {
    case 'ACRE':
      inDecimal = num * convAcre;
      break;
    case 'BIGHA':
      inDecimal = num * convBigha;
      break;
    case 'KATHA':
      inDecimal = num * convKatha;
      break;
    case 'SQFT':
      inDecimal = num / convSqft;
      break;
    case 'DECIMAL_SHATANGSHO':
    default:
      inDecimal = num;
      break;
  }

  return Math.round(inDecimal * 10000) / 10000;
}

/**
 * Converts a value in Decimal (শতাংশ) into all supported units
 * @param {number|string} decimalValue 
 * @param {object} factors Optional custom conversion factors
 * @returns {object} Formatted equivalents
 */
export function convertDecimalToAllUnits(decimalValue, factors = {}) {
  const dec = parseFloat(decimalValue) || 0;
  const convAcre = parseFloat(factors.acre) || DEFAULT_UNIT_CONVERSION.acre;
  const convBigha = parseFloat(factors.bigha) || DEFAULT_UNIT_CONVERSION.bigha;
  const convKatha = parseFloat(factors.katha) || DEFAULT_UNIT_CONVERSION.katha;
  const convSqft = parseFloat(factors.sqft) || DEFAULT_UNIT_CONVERSION.sqft;

  return {
    decimal: Math.round(dec * 1000) / 1000,
    katha: Math.round((dec / convKatha) * 1000) / 1000,
    bigha: Math.round((dec / convBigha) * 1000) / 1000,
    acre: Math.round((dec / convAcre) * 1000) / 1000,
    sqft: Math.round((dec * convSqft) * 10) / 10,
  };
}

/**
 * Bengali & English labels for land area units
 */
export const LAND_UNIT_LABELS = {
  DECIMAL_SHATANGSHO: { bn: 'শতাংশ (শতক)', en: 'Decimal' },
  KATHA: { bn: 'কাঠা', en: 'Katha' },
  BIGHA: { bn: 'বিঘা', en: 'Bigha' },
  ACRE: { bn: 'একর', en: 'Acre' },
  SQFT: { bn: 'বর্গফুট', en: 'Sq. Ft.' },
};

export const LAND_DONATION_TYPES = {
  DANPATRA: { bn: 'দানপত্র', en: 'Deed of Gift (Danpatra)' },
  WAQF: { bn: 'ওয়াকফনামা', en: 'Waqfnama' },
  HEBA: { bn: 'হেবানামা', en: 'Hebanama' },
  REGISTERED_DEED: { bn: 'রেজিস্ট্রিকৃত দলিল', en: 'Registered Deed' },
  OTHER: { bn: 'অন্যান্য', en: 'Other' },
};

export const LAND_USE_TYPES = {
  EIDGAH_GROUND: { bn: 'ঈদগাহ ময়দান', en: 'Eidgah Ground' },
  GRAVEYARD: { bn: 'কবরস্থান', en: 'Graveyard' },
  MOSQUE: { bn: 'মসজিদ কমপ্লেক্স', en: 'Mosque Complex' },
  ROAD: { bn: 'চলাচলের রাস্তা', en: 'Access Road' },
  BOUNDARY_WALL: { bn: 'সীমানা প্রাচীর', en: 'Boundary Wall' },
  OTHER: { bn: 'অন্যান্য', en: 'Other' },
};

export const LAND_KHATIAN_TYPES = {
  CS: { bn: 'সিএস', en: 'CS' },
  SA: { bn: 'এসএ', en: 'SA' },
  RS: { bn: 'আরএস', en: 'RS' },
  BS: { bn: 'বিএস', en: 'BS' },
  OTHER: { bn: 'অন্যান্য', en: 'Other' },
};

