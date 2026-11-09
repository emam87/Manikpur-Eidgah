import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, Calendar, ChevronRight, Pin } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { EightPointStar } from '../common/EightPointStar.jsx';

export function LatestNoticesSection({ notices = [] }) {
  const { locale, t, toBanglaNum, getLocalized } = useLanguage();

  if (!notices || notices.length === 0) {
    return null; // Every section hides cleanly when empty
  }

  return (
    <section className="py-12 sm:py-16 bg-white border-y border-gold-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-gold-600 text-xs sm:text-sm font-semibold uppercase tracking-wider mb-2">
              <Bell className="w-4 h-4 text-emerald-700" />
              <span>{t('latest_notices')}</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
              {locale === 'bn' ? 'জরুরি ঘোষণা ও নোটিশসমূহ' : 'Recent Announcements & Notices'}
            </h2>
          </div>
          <Link
            to="/notices"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-800 hover:text-emerald-950 transition-colors"
          >
            <span>{t('view_all_notices')}</span>
            <ChevronRight className="w-4 h-4 text-gold-500" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {notices.map((notice) => {
            const title = getLocalized(notice, 'title');
            const dateStr = notice.publishedAt ? new Date(notice.publishedAt).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            }) : '';

            return (
              <Link
                key={notice.id}
                to={`/notices/${notice.slug}`}
                className="bg-ivory-50 rounded-2xl p-5 border border-gold-500/30 hover:border-gold-500 hover:shadow-lg transition-all duration-300 flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-stone-500">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-gold-600" />
                      <span>{toBanglaNum(dateStr)}</span>
                    </span>
                    {notice.isPinned && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        <Pin className="w-3 h-3 text-emerald-700" />
                        <span>{locale === 'bn' ? 'পিনযুক্ত' : 'Pinned'}</span>
                      </span>
                    )}
                  </div>
                  <h3 className="font-serif font-bold text-base text-stone-900 group-hover:text-emerald-800 transition-colors line-clamp-2 leading-snug">
                    {title}
                  </h3>
                </div>

                <div className="pt-4 mt-4 border-t border-gold-500/20 flex items-center justify-between text-xs text-emerald-800 font-semibold">
                  <span>{locale === 'bn' ? 'বিস্তারিত পড়ুন' : 'Read Full Notice'}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-gold-600 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

