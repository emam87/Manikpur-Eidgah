import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';

export function HomeDirectionsCard() {
  const { locale, t } = useLanguage();
  const { getSetting } = useSettings();

  const siteName = getSetting('site_name', locale, t('common.site_name'));
  const address = getSetting(
    'location',
    locale,
    locale === 'bn'
      ? 'মানিকপুর, ডাকঘর: মানিকপুর বাজার, বাংলাদেশ'
      : 'Manikpur, P.O: Manikpur Bazar, Bangladesh'
  );

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
      <div className="rounded-2xl bg-surface border border-sand p-4 sm:p-6 shadow-sakinah-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 overflow-hidden">
        <div className="flex items-start gap-3.5 w-full sm:w-auto flex-1 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-primary-soft border border-primary/20 flex items-center justify-center text-primary shrink-0 mt-0.5">
            <MapPin className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gold-text block mb-1">
              {locale === 'bn' ? 'ঈদগাহ ময়দানের ঠিকানা' : 'Eidgah Address'}
            </span>
            <p className="font-serif font-bold text-base sm:text-lg text-primary-dark leading-snug break-words">
              {siteName}
            </p>
            {address && (
              <p className="text-xs sm:text-sm text-ink-muted mt-1 leading-relaxed break-words">
                {address}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-sand">
          <Link
            to="/contact"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-bold shadow-sakinah-sm transition-colors min-h-[44px] tap-feedback whitespace-nowrap"
          >
            <Phone className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{locale === 'bn' ? 'যোগাযোগ ও অনুদান' : 'Contact & Donate'}</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
