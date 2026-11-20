import {
  Landmark,
  Trees,
  Building2,
  Route,
  Shield,
  Compass,
} from 'lucide-react';
import { getImageUrl } from './imageUrl.js';

export const DEFAULT_CONVERSION_FACTORS = {
  acre: 100,
  bigha: 33,
  katha: 1.65,
  sqft: 435.6,
};

/**
 * Normalize unit string or Prisma LandAreaUnit enum to canonical key.
 */
export function normalizeAreaUnit(unit) {
  if (!unit) return 'DECIMAL_SHATANGSHO';
  const u = String(unit).trim().toUpperCase();
  if (u === 'DECIMAL' || u === 'DECIMAL_SHATANGSHO' || u === 'SHATANGSHO' || u === 'শতাংশ' || u === 'শতক') {
    return 'DECIMAL_SHATANGSHO';
  }
  if (u === 'KATHA' || u === 'কাঠা') return 'KATHA';
  if (u === 'BIGHA' || u === 'বিঘা') return 'BIGHA';
  if (u === 'ACRE' || u === 'একর') return 'ACRE';
  if (u === 'SQFT' || u === 'SQ_FT' || u === 'SQ FT' || u === 'বর্গফুট') return 'SQFT';
  return 'DECIMAL_SHATANGSHO';
}

export const AREA_UNIT_LABELS = {
  DECIMAL_SHATANGSHO: { bn: 'শতাংশ', en: 'Decimal', enPlural: 'decimals' },
  KATHA: { bn: 'কাঠা', en: 'Katha', enPlural: 'katha' },
  BIGHA: { bn: 'বিঘা', en: 'Bigha', enPlural: 'bigha' },
  ACRE: { bn: 'একর', en: 'Acre', enPlural: 'acres' },
  SQFT: { bn: 'বর্গফুট', en: 'Sq Ft', enPlural: 'sq ft' },
};

export const LAND_USE_META = {
  EIDGAH_GROUND: {
    bn: 'ঈদগাহ ময়দান',
    en: 'Eidgah Ground',
    icon: Landmark,
    accentClass: 'bg-primary',
  },
  GRAVEYARD: {
    bn: 'কবরস্থান',
    en: 'Graveyard',
    icon: Trees,
    accentClass: 'bg-sage-deep',
  },
  MOSQUE: {
    bn: 'মসজিদ',
    en: 'Mosque',
    icon: Building2,
    accentClass: 'bg-sky-mist',
  },
  ROAD: {
    bn: 'রাস্তা',
    en: 'Road',
    icon: Route,
    accentClass: 'bg-sage-mid',
  },
  BOUNDARY_WALL: {
    bn: 'সীমানা প্রাচীর',
    en: 'Boundary Wall',
    icon: Shield,
    accentClass: 'bg-gold',
  },
  OTHER: {
    bn: 'অন্যান্য',
    en: 'Other',
    icon: Compass,
    accentClass: 'bg-gold',
  },
};

export const DONATION_TYPE_LABELS = {
  DANPATRA: { bn: 'দানপত্র', en: 'Danpatra (Gift Deed)' },
  WAQF: { bn: 'ওয়াকফনামা', en: 'Waqf Deed' },
  HEBA: { bn: 'হেবা দলিল', en: 'Heba Deed' },
  REGISTERED_DEED: { bn: 'রেজিস্ট্রিকৃত দলিল', en: 'Registered Deed' },
  OTHER: { bn: 'অন্যান্য', en: 'Other' },
};

export const KHATIAN_TYPE_LABELS = {
  CS: { bn: 'সিএস (CS)', en: 'CS Survey' },
  SA: { bn: 'এসএ (SA)', en: 'SA Survey' },
  RS: { bn: 'আরএস (RS)', en: 'RS Survey' },
  BS: { bn: 'বিএস (BS)', en: 'BS Survey' },
  OTHER: { bn: 'অন্যান্য', en: 'Other' },
};

/**
 * Format numeric area cleanly without trailing zeros (e.g. 20.0000 -> "20", 1.35 -> "1.35").
 */
export function formatCleanNumber(val, locale, toBanglaNum, maxDecimals = 2) {
  const num = Number(val);
  if (!Number.isFinite(num)) return locale === 'bn' ? '০' : '0';
  const rounded = Math.round(num * Math.pow(10, maxDecimals)) / Math.pow(10, maxDecimals);
  const str = rounded.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  });
  return locale === 'bn' ? toBanglaNum(str, true) : str;
}

/**
 * Returns { value, unit, canonicalUnit, full } for the card's Gold-Foil Area Plate.
 */
export function formatAreaPlate(areaValue, rawUnit, locale, toBanglaNum) {
  const canonicalUnit = normalizeAreaUnit(rawUnit);
  const value = formatCleanNumber(areaValue, locale, toBanglaNum, 2);
  const unit = AREA_UNIT_LABELS[canonicalUnit]?.[locale] || AREA_UNIT_LABELS.DECIMAL_SHATANGSHO[locale];
  return {
    value,
    unit,
    canonicalUnit,
    full: `${value} ${unit}`,
  };
}

/**
 * Convert a total/record area in decimals to any display unit ('decimal' | 'katha' | 'bigha' | 'acre' | 'sqft').
 */
export function convertFromDecimal(areaInDecimal, targetUnit, factors = DEFAULT_CONVERSION_FACTORS, locale = 'bn', toBanglaNum = (v) => String(v)) {
  const dec = Number(areaInDecimal) || 0;
  const f = { ...DEFAULT_CONVERSION_FACTORS, ...(factors || {}) };

  let val = dec;
  let key = 'DECIMAL_SHATANGSHO';
  if (targetUnit === 'katha' || targetUnit === 'KATHA') {
    val = dec / (f.katha || 1.65);
    key = 'KATHA';
  } else if (targetUnit === 'bigha' || targetUnit === 'BIGHA') {
    val = dec / (f.bigha || 33);
    key = 'BIGHA';
  } else if (targetUnit === 'acre' || targetUnit === 'ACRE') {
    val = dec / (f.acre || 100);
    key = 'ACRE';
  } else if (targetUnit === 'sqft' || targetUnit === 'SQFT') {
    val = dec * (f.sqft || 435.6);
    key = 'SQFT';
  }

  const maxDecimals = key === 'SQFT' ? 0 : 2;
  const value = formatCleanNumber(val, locale, toBanglaNum, maxDecimals);
  const meta = AREA_UNIT_LABELS[key];
  const unit = locale === 'bn' ? meta.bn : (Math.abs(val) === 1 ? meta.en : meta.enPlural);
  const unitTitle = locale === 'bn' ? meta.bn : meta.en;

  return {
    value,
    unit,
    unitTitle,
    full: `${value} ${unitTitle}`,
    summaryText: `${value} ${unit}`,
  };
}

/**
 * Compute R2/uploads thumbnail URL (~160px wide, 2x) with full-image fallback support.
 */
export function getLandDonorThumbUrl(photoPath) {
  const fullUrl = getImageUrl(photoPath);
  if (!fullUrl) return { thumbUrl: '', fullUrl: '' };

  // Derive `_thumb.webp` for Sharp-processed uploads
  if (/\.webp(\?.*)?$/i.test(fullUrl) && !fullUrl.includes('_thumb.webp') && !fullUrl.startsWith('/defaults/')) {
    const thumbUrl = fullUrl.replace(/\.webp(\?.*)?$/i, '_thumb.webp$1');
    return { thumbUrl, fullUrl };
  }

  return { thumbUrl: fullUrl, fullUrl };
}

/**
 * Check if a localized donor name already starts with an honorific so we never double-prefix.
 */
export function getHonorificPrefix(name, isDeceased, locale) {
  if (!isDeceased || !name) return '';
  const trimmed = name.trim();
  if (locale === 'bn') {
    if (/^(মরহুম|মরহুমা)\s/.test(trimmed)) return '';
    return 'মরহুম';
  }
  if (/^late\s/i.test(trimmed)) return '';
  return 'Late';
}

/**
 * Extract the clean initial letter for the arch avatar (skipping leading honorifics).
 */
export function getDonorInitial(name, locale) {
  if (!name) return locale === 'bn' ? 'জ' : 'L';
  const cleaned = name
    .trim()
    .replace(/^(মরহুম|মরহুমা|আলহাজ্ব|হাজী|মোঃ|মো\.|Late|Alhaj|Haji|Md\.?|Mr\.?)\s+/i, '')
    .trim();
  const source = cleaned || name.trim();
  return Array.from(source)[0]?.toUpperCase() || (locale === 'bn' ? 'জ' : 'L');
}

/**
 * Return strict localized label for landUse (no cross-language fallback).
 */
export function getLandUseMeta(landUse, landUseOther, locale) {
  const meta = LAND_USE_META[landUse] || LAND_USE_META.OTHER;
  if (landUse === 'OTHER' && landUseOther && typeof landUseOther === 'string') {
    const hasBengali = /[\u0980-\u09FF]/.test(landUseOther);
    if ((locale === 'bn' && hasBengali) || (locale === 'en' && !hasBengali)) {
      return { ...meta, label: landUseOther.trim() };
    }
  }
  return { ...meta, label: meta[locale] || meta.en };
}
