import React from 'react';
import { Link } from 'react-router-dom';
import { Users2, ChevronRight, Award } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { EightPointStar } from '../common/EightPointStar.jsx';

export function CommitteePreviewSection({ leaders = [] }) {
  const { locale, t, getLocalized } = useLanguage();

  if (!leaders || leaders.length === 0) {
    return null;
  }

  return (
    <section className="py-12 sm:py-16 bg-ivory-100 border-t border-gold-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-gold-600 text-xs sm:text-sm font-semibold uppercase tracking-wider mb-2">
              <Users2 className="w-4 h-4 text-emerald-700" />
              <span>{t('committee_preview_title')}</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
              {t('committee_preview_desc')}
            </h2>
          </div>
          <Link
            to="/about"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-800 hover:text-emerald-950 transition-colors"
          >
            <span>{locale === 'bn' ? 'পূর্ণাঙ্গ কমিটি দেখুন' : 'View Full Committee'}</span>
            <ChevronRight className="w-4 h-4 text-gold-500" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
          {leaders.slice(0, 4).map((member) => {
            const name = getLocalized(member, 'name');
            const designation = getLocalized(member, 'designation') || getLocalized(member, 'role');
            const photoUrl = member.photoPath ? `/uploads/${member.photoPath}` : null;
            const initialChar = name ? name.trim().charAt(0) : 'ক';

            return (
              <div
                key={member.id}
                className="bg-white rounded-2xl p-3.5 sm:p-5 border border-gold-500/30 text-center flex flex-col items-center shadow-sm hover:shadow-lg transition-all duration-300 group"
              >
                <div className="w-16 h-20 sm:w-20 sm:h-24 rounded-t-full rounded-b-lg border-2 border-gold-500 overflow-hidden bg-emerald-950 shadow-sm flex items-center justify-center mb-2.5 sm:mb-3 shrink-0">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-full h-full flex items-center justify-center font-serif text-2xl font-bold text-gold-300 bg-emerald-950 ${
                      photoUrl ? 'hidden' : 'flex'
                    }`}
                  >
                    {initialChar}
                  </div>
                </div>

                <h3 className="font-serif font-bold text-xs sm:text-base text-stone-900 group-hover:text-emerald-800 transition-colors line-clamp-1">
                  {name}
                </h3>
                <span className="text-[11px] sm:text-xs text-gold-600 font-semibold mt-0.5 sm:mt-1 line-clamp-1">
                  {designation}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

