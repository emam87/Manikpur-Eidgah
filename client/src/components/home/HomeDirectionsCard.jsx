import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Navigation, ArrowUpRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';

export function HomeDirectionsCard() {
  const { locale, t } = useLanguage();
  const { getSetting } = useSettings();

  const location = getSetting('location', locale, 'মানিকপুর, মানিকপুর বাজার, বাংলাদেশ');
  const siteName = getSetting('site_name', locale, t('common.site_name'));
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(siteName + ' ' + location)}`;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
      <div className="rounded-2xl bg-surface border border-sand p-4 sm:p-6 shadow-sakinah-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 overflow-hidden">
        <div className="flex items-start gap-3.5 w-full sm:w-auto flex-1 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-primary-soft border border-primary/20 flex items-center justify-center text-primary shrink-0 mt-0.5">
            <MapPin className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gold-text block mb-1">
              {locale === 'bn' ? 'ঈদগাহের অবস্থান ও ঠিকানা' : 'Location & Address'}
            </span>
            <p className="font-serif font-bold text-base sm:text-lg text-primary-dark leading-snug break-words">
              {location}
            </p>
            <p className="text-xs text-ink-muted mt-1 leading-relaxed break-words">
              {locale === 'bn' ? 'মানিকপুর বাজার সংলগ্ন ওয়াকফ এস্টেট' : 'Adjacent to Manikpur Bazar Waqf Estate'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-sand">
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-bold shadow-sakinah-sm hover:shadow-sakinah-card active:scale-[0.98] transition-all min-h-[44px] tap-feedback whitespace-nowrap"
          >
            <Navigation className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{locale === 'bn' ? 'দিকনির্দেশনা পান' : 'Get Directions'}</span>
            <ArrowUpRight className="w-3.5 h-3.5 shrink-0 opacity-80" aria-hidden="true" />
          </a>

          <Link
            to="/contact#map"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-canvas-alt hover:bg-primary-soft/50 text-primary-dark text-xs sm:text-sm font-bold border border-sand transition-colors min-h-[44px] tap-feedback whitespace-nowrap"
          >
            <span>{locale === 'bn' ? 'যোগাযোগ' : 'Contact'}</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
