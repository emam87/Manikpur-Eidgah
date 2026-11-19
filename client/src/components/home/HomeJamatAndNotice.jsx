import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Bell, ChevronRight, Calendar } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';

export function HomeJamatAndNotice({ notices = [] }) {
  const { locale, t, getLocalized } = useLanguage();
  const { getSetting } = useSettings();

  const eidJamat = getSetting('eid_jamat', locale, '');
  const latestNotice = notices && notices.length > 0 ? notices[0] : null;

  // If neither exists, hide completely
  if (!eidJamat && !latestNotice) {
    return null;
  }

  const noticeTitle = latestNotice ? getLocalized(latestNotice, 'title') : '';
  const noticeDate = latestNotice?.publishedAt
    ? new Date(latestNotice.publishedAt).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-GB', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '';

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 mb-6 relative z-10">
      <div className={`grid gap-4 ${eidJamat && latestNotice ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
        {/* Eid Jamat Card (Shown once, only on Home) */}
        {eidJamat && (
          <div className="rounded-2xl bg-surface border border-gold/40 p-4 sm:p-5 shadow-sakinah-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-soft border border-primary/20 flex items-center justify-center text-primary-dark shrink-0">
              <Clock className="w-6 h-6 text-primary" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gold-text block mb-0.5">
                {locale === 'bn' ? 'ঈদের জামাত সময়সূচি' : 'Eid Jamat Schedule'}
              </span>
              <p className="font-serif font-bold text-base sm:text-lg text-primary-dark leading-snug">
                {eidJamat}
              </p>
            </div>
          </div>
        )}

        {/* Latest Notice Card (Max 1 item + "All notices" link) */}
        {latestNotice && (
          <div className="rounded-2xl bg-surface border border-sand p-4 sm:p-5 shadow-sakinah-sm flex flex-col justify-between">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-primary-soft border border-sand flex items-center justify-center text-primary-dark shrink-0 mt-0.5">
                <Bell className="w-5 h-5 text-primary" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gold-text">
                    {locale === 'bn' ? 'সর্বশেষ নোটিশ' : 'Latest Notice'}
                  </span>
                  {noticeDate && (
                    <span className="text-[11px] text-ink-muted flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-gold-text" />
                      <span>{noticeDate}</span>
                    </span>
                  )}
                </div>
                <Link
                  to={`/notices/${latestNotice.slug}`}
                  className="font-serif font-bold text-sm sm:text-base text-ink hover:text-primary transition-colors line-clamp-1 block"
                >
                  {noticeTitle}
                </Link>
              </div>
            </div>

            <div className="pt-2.5 mt-2.5 border-t border-sand flex items-center justify-end">
              <Link
                to="/notices"
                className="inline-flex items-center gap-1 text-xs font-bold text-primary-dark hover:text-primary transition-colors"
              >
                <span>{locale === 'bn' ? 'সকল নোটিশ দেখুন' : 'All Notices'}</span>
                <ChevronRight className="w-3.5 h-3.5 text-gold-text" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
