import React, { createContext, useContext, useState, useEffect } from 'react';
import bnTranslations from '../locales/bn.json';
import enTranslations from '../locales/en.json';

const LanguageContext = createContext();

const EN_DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

const translations = {
  bn: bnTranslations,
  en: enTranslations,
};

// Build flat lookup maps for backward-compatible keys like 'nav_home'
function buildFlatMap(obj, prefix = '') {
  let map = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(map, buildFlatMap(value, fullKey));
    } else {
      map[fullKey] = value;
      // Also map underscore variant e.g. "nav_home" -> "nav.home"
      const snakeKey = fullKey.replace(/\./g, '_');
      map[snakeKey] = value;
    }
  }
  return map;
}

const flatTranslations = {
  bn: buildFlatMap(bnTranslations),
  en: buildFlatMap(enTranslations),
};

export function LanguageProvider({ children }) {
  const [locale, setLocale] = useState(() => {
    return localStorage.getItem('eidgah_locale') || 'bn';
  });

  useEffect(() => {
    localStorage.setItem('eidgah_locale', locale);
    document.documentElement.lang = locale;
    document.documentElement.setAttribute('lang', locale);
    
    // Update fonts and class on root HTML
    if (locale === 'en') {
      document.documentElement.classList.add('lang-en');
      document.documentElement.classList.remove('lang-bn');
    } else {
      document.documentElement.classList.add('lang-bn');
      document.documentElement.classList.remove('lang-en');
    }
  }, [locale]);

  const toggleLocale = () => {
    setLocale((prev) => (prev === 'bn' ? 'en' : 'bn'));
  };

  /**
   * Translate key with nested path support and params interpolation
   * e.g. t('nav.home') or t('nav_home') or t('stats.missing_count', { count: 5 })
   */
  const t = (key, params = {}) => {
    if (!key) return '';

    // 1. Direct path lookup in flat map
    let text = flatTranslations[locale]?.[key];

    // 2. If missing in current locale, check nested object path directly
    if (text === undefined) {
      const parts = key.split('.');
      let cur = translations[locale];
      for (const p of parts) {
        if (cur && typeof cur === 'object') cur = cur[p];
        else { cur = undefined; break; }
      }
      if (typeof cur === 'string') text = cur;
    }

    // 3. Fall back to bn if en is missing
    if (text === undefined) {
      text = flatTranslations['bn']?.[key];
      if (text === undefined) {
        const parts = key.split('.');
        let cur = translations['bn'];
        for (const p of parts) {
          if (cur && typeof cur === 'object') cur = cur[p];
          else { cur = undefined; break; }
        }
        if (typeof cur === 'string') text = cur;
      }
    }

    // If still not found, return key
    if (text === undefined || text === null) return key;

    // Interpolation {{key}}
    if (params && typeof params === 'object') {
      for (const [pKey, pVal] of Object.entries(params)) {
        const formattedVal = typeof pVal === 'number' && locale === 'bn' 
          ? toBanglaNum(pVal) 
          : String(pVal);
        text = text.replace(new RegExp(`{{${pKey}}}`, 'g'), formattedVal);
      }
    }

    return text;
  };

  /**
   * Convert numbers to Bengali numerals when locale is 'bn'
   */
  const toBanglaNum = (val, forceBangla = false) => {
    if (val === null || val === undefined || val === '') return '';
    const str = String(val);
    if (!forceBangla && locale !== 'bn') return str;
    return str.replace(/\d/g, (d) => BN_DIGITS[parseInt(d, 10)]);
  };

  /**
   * Format numbers per active locale
   */
  const formatNumber = (val) => {
    if (val === null || val === undefined || val === '') return '';
    const num = typeof val === 'number' ? val : parseFloat(String(val));
    if (isNaN(num)) return '';
    if (locale === 'bn') {
      const formatted = num.toLocaleString('en-US');
      return toBanglaNum(formatted, true);
    }
    return num.toLocaleString('en-GB');
  };

  /**
   * Format currency amounts with ৳ / BDT
   */
  const formatMoney = (amount) => {
    if (amount === null || amount === undefined || amount === '') return '';
    const num = typeof amount === 'number' ? amount : parseFloat(String(amount));
    if (isNaN(num)) return '';
    const formatted = Math.round(num).toLocaleString('en-US');
    if (locale === 'en') {
      return `BDT ${formatted}`;
    }
    return `৳ ${toBanglaNum(formatted, true)}`;
  };

  /**
   * Format date per locale
   */
  const formatDate = (dateVal, options = {}) => {
    if (!dateVal) return '';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return '';
      const defaultOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        ...options,
      };
      const loc = locale === 'bn' ? 'bn-BD' : 'en-GB';
      return new Intl.DateTimeFormat(loc, defaultOptions).format(d);
    } catch (e) {
      return '';
    }
  };

  /**
   * Get localized field from an object
   * STRICT: On public pages (isAdmin = false), NO cross-language fallback!
   * If English is missing in English mode, returns empty string so the field can be hidden.
   * In admin mode (isAdmin = true), falls back to "—".
   */
  const getLocalized = (obj, field, isAdmin = false) => {
    if (!obj || typeof obj !== 'object') return isAdmin ? '—' : '';
    
    const camelPri = `${field}${locale.charAt(0).toUpperCase() + locale.slice(1)}`;
    const snakePri = `${field}_${locale}`;
    const directVal = obj[camelPri] ?? obj[snakePri];

    if (typeof directVal === 'string' && directVal.trim() !== '') {
      return directVal.trim();
    }

    if (locale === 'bn') {
      const raw = obj[field];
      if (typeof raw === 'string' && raw.trim() !== '') return raw.trim();
    }

    // Inside admin only: fallback to clear dash
    if (isAdmin) {
      const camelFb = locale === 'en' ? `${field}Bn` : `${field}En`;
      const snakeFb = locale === 'en' ? `${field}_bn` : `${field}_en`;
      const fb = obj[camelFb] ?? obj[snakeFb] ?? obj[field];
      return typeof fb === 'string' && fb.trim() !== '' ? fb.trim() : '—';
    }

    // Public mode: strictly NO cross-language fallback
    return '';
  };

  /**
   * Helper to translate Enum keys
   */
  const getEnumLabel = (group, enumKey) => {
    if (!group || !enumKey) return '';
    return t(`enums.${group}.${enumKey}`);
  };

  return (
    <LanguageContext.Provider
      value={{
        locale,
        setLocale,
        toggleLocale,
        t,
        toBanglaNum,
        formatNumber,
        formatMoney,
        formatBDT: formatMoney,
        formatDate,
        getLocalized,
        getEnumLabel,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
