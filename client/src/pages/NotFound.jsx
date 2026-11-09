import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.jsx';
import { EightPointStar } from '../components/common/EightPointStar.jsx';
import { SEO } from '../components/common/SEO.jsx';

export function NotFound() {
  const { t, toBanglaNum } = useLanguage();

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <SEO title="404 — পৃষ্ঠাটি খুঁজে পাওয়া যায়নি" noIndex={true} />
      <div className="max-w-md w-full text-center space-y-6 bg-white p-8 sm:p-10 rounded-3xl border border-gold-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-700 via-gold-500 to-emerald-700" />

        <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-50 border border-gold-500/40 flex items-center justify-center text-emerald-800 shadow-sm">
          <EightPointStar className="w-8 h-8 text-gold-500" />
        </div>

        <div className="space-y-2">
          <span className="text-5xl sm:text-6xl font-serif font-extrabold text-emerald-800 tracking-wider">
            {toBanglaNum('404')}
          </span>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-900">
            {t('not_found_title')}
          </h1>
          <p className="text-sm text-stone-600 leading-relaxed">
            {t('not_found_desc')}
          </p>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-800 text-ivory-50 font-semibold hover:bg-emerald-900 transition-colors shadow-md tap-target"
          >
            <Home className="w-4 h-4" />
            <span>{t('back_to_home')}</span>
          </Link>
          <button
            onClick={() => window.history.back()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-ivory-200 text-stone-800 font-semibold hover:bg-ivory-300 transition-colors tap-target"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>পেছনে যান</span>
          </button>
        </div>
      </div>
    </div>
  );
}
