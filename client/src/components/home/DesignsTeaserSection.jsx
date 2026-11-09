import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ChevronRight, Eye } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.jsx';

export function DesignsTeaserSection({ designs = [] }) {
  const { locale, t, getLocalized } = useLanguage();

  if (!designs || designs.length === 0) {
    return null;
  }

  return (
    <section className="py-12 sm:py-16 bg-white border-t border-gold-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-gold-600 text-xs sm:text-sm font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4 text-emerald-700" />
              <span>{t('designs_teaser_title')}</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
              {t('designs_teaser_desc')}
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              {locale === 'bn' ? '* এগুলো প্রস্তাবিত পূর্ণাঙ্গ ৩ডি স্থাপত্য নকশা' : '* Proposed 3D architectural renders'}
            </p>
          </div>
          <Link
            to="/designs"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-800 hover:text-emerald-950 transition-colors"
          >
            <span>{t('view_all_designs')}</span>
            <ChevronRight className="w-4 h-4 text-gold-500" />
          </Link>
        </div>

        {/* 3 Featured Design Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {designs.slice(0, 3).map((design) => {
            const caption = getLocalized(design, 'caption');
            const imgUrl = design.path ? `/uploads/${design.path}` : '';

            return (
              <Link
                key={design.id}
                to="/designs"
                className="group relative rounded-2xl bg-ivory-50 border border-gold-500/30 overflow-hidden shadow-sm hover:shadow-xl hover:border-gold-500 transition-all duration-300 flex flex-col"
              >
                <div className="relative aspect-[16/10] bg-stone-200 overflow-hidden">
                  <img
                    src={imgUrl}
                    alt={caption || 'Architectural Design'}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" fill="%230F5132"><rect width="600" height="400" fill="%230F5132"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23FAF7F0" font-family="serif" font-size="24">প্রস্তাবিত ৩ডি ডিজাইন</text></svg>';
                    }}
                  />
                  <div className="absolute inset-0 bg-emerald-950/20 group-hover:bg-emerald-950/0 transition-colors" />
                  <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-emerald-950/70 backdrop-blur-sm border border-gold-500/40 flex items-center justify-center text-gold-300 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Eye className="w-4 h-4" />
                  </div>
                </div>

                <div className="p-4 flex-grow flex items-center justify-between">
                  <span className="font-serif font-bold text-sm sm:text-base text-stone-900 group-hover:text-emerald-800 transition-colors">
                    {caption}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gold-500 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

