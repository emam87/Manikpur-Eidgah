import React, { createContext, useContext, useState, useEffect } from 'react';
import translations from '../locales/translations.json';

const LanguageContext = createContext();

const EN_DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function LanguageProvider({ children }) {
  const [locale, setLocale] = useState(() => {
    return localStorage.getItem('eidgah_locale') || 'bn';
  });

  useEffect(() => {
    localStorage.setItem('eidgah_locale', locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const toggleLocale = () => {
    setLocale((prev) => (prev === 'bn' ? 'en' : 'bn'));
  };

  /**
   * Translate key with fallback
   */
  const t = (key) => {
    return translations[locale]?.[key] || translations['bn']?.[key] || key;
  };

  /**
   * Convert numbers to Bengali digits when locale is 'bn'
   */
  const toBanglaNum = (val, forceBangla = false) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (!forceBangla && locale !== 'bn') return str;
    return str.replace(/\d/g, (d) => BN_DIGITS[parseInt(d, 10)]);
  };

  /**
   * Format BDT with ৳ / BDT and comma separators
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
   * Get localized field with automatic fallback
   */
  const getLocalized = (obj, field) => {
    if (!obj || typeof obj !== 'object') return '';
    const camelPri = `${field}${locale.charAt(0).toUpperCase() + locale.slice(1)}`;
    const camelFb = locale === 'en' ? `${field}Bn` : `${field}En`;

    const snakePri = `${field}_${locale}`;
    const snakeFb = locale === 'en' ? `${field}_bn` : `${field}_en`;

    const val = obj[camelPri] ?? obj[snakePri];
    if (typeof val === 'string' && val.trim() !== '') return val;

    const fb = obj[camelFb] ?? obj[snakeFb] ?? obj[field];
    return typeof fb === 'string' ? fb : '';
  };

  return (
    <LanguageContext.Provider
      value={{
        locale,
        setLocale,
        toggleLocale,
        t,
        toBanglaNum,
        formatMoney,
        formatBDT: formatMoney,
        getLocalized,
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

