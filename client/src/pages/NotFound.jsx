import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.jsx';
import { EightPointStar } from '../components/common/EightPointStar.jsx';
import { SEO } from '../components/common/SEO.jsx';

export function NotFound() {
  const { locale, t, toBanglaNum } = useLanguage();

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <SEO 
        title={`${locale === 'bn' ? toBanglaNum('404') : '404'} — ${t('errors.not_found')}`} 
        noIndex={true} 
      />
      <div className="max-w-md w-full text-center space-y-6 bg-surface p-8 sm:p-10 rounded-3xl border border-sand shadow-sakinah-card relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary via-gold to-primary" />

        <div className="w-16 h-16 mx-auto rounded-2xl bg-primary-soft border border-gold/40 flex items-center justify-center text-primary-dark shadow-sakinah-sm">
          <EightPointStar className="w-8 h-8 text-gold-text animate-spin-slow" />
        </div>

        <div className="space-y-2">
          <span className="text-5xl sm:text-6xl font-serif font-extrabold text-primary-dark tracking-wider">
            {locale === 'bn' ? toBanglaNum('404') : '404'}
          </span>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-ink">
            {t('errors.not_found')}
          </h1>
          <p className="text-sm text-ink-muted leading-relaxed">
            {t('errors.not_found_desc')}
          </p>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover active:scale-[0.98] text-white font-semibold transition-all shadow-sakinah-sm min-h-[44px] tap-target"
          >
            <Home className="w-4 h-4" />
            <span>{t('common.back_to_home')}</span>
          </Link>
          <button
            onClick={() => window.history.back()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-canvas-alt hover:bg-primary-soft/60 active:scale-[0.98] text-ink font-semibold transition-all border border-sand min-h-[44px] tap-target"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('common.back')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
