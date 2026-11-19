import React from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';

export function SkipToContent() {
  const { locale } = useLanguage();

  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50 px-4 py-2 bg-primary text-white font-bold text-xs rounded-xl border border-gold shadow-sakinah-card focus-heritage"
    >
      {locale === 'bn' ? 'মূল বিষয়বস্তুতে যান' : 'Skip to main content'}
    </a>
  );
}
