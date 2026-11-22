import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Navigation, ArrowUpRight, Map } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { DEFAULT_MAP_LOCATION, buildNavigationLinks } from '../../utils/mapUtils.js';

export function HomeDirectionsCard() {
  const { locale, t } = useLanguage();
  const { getSetting } = useSettings();

  const rawLat = getSetting('map_lat', 'bn', String(DEFAULT_MAP_LOCATION.lat));
  const rawLng = getSetting('map_lng', 'bn', String(DEFAULT_MAP_LOCATION.lng));
  const lat = parseFloat(rawLat);
  const lng = parseFloat(rawLng);
  const navLat = getSetting('map_nav_lat', 'bn', '');
  const navLng = getSetting('map_nav_lng', 'bn', '');
  const pinVerifiedAt = getSetting('map_pin_verified_at', 'bn', '');
  const placeName = getSetting(
    'map_place_name',
    locale,
    getSetting('site_name', locale, t('common.site_name'))
  );
  const mapAddress = getSetting('map_address', locale, '');
  const fallbackLocation = getSetting(
    'location',
    locale,
    locale === 'bn' ? 'মানিকপুর, মানিকপুর বাজার, বাংলাদেশ' : 'Manikpur, Manikpur Bazar, Bangladesh'
  );
  const googlePlaceUrl = getSetting(
    'map_google_place_url',
    'bn',
    DEFAULT_MAP_LOCATION.googlePlaceUrl
  );

  const navLinks = buildNavigationLinks({
    lat: Number.isFinite(lat) ? lat : DEFAULT_MAP_LOCATION.lat,
    lng: Number.isFinite(lng) ? lng : DEFAULT_MAP_LOCATION.lng,
    navLat: navLat || null,
    navLng: navLng || null,
    name: placeName,
    googlePlaceUrl,
  });

  const isAdminPreview =
    typeof window !== 'undefined' &&
    (new URLSearchParams(window.location.search).get('adminPreview') === '1' ||
      Boolean(sessionStorage.getItem('eidgah_admin_logged_in')));
  const locationStatus = !Number.isFinite(lat) || !Number.isFinite(lng)
    ? 'not_set'
    : pinVerifiedAt
      ? 'set'
      : 'needs_review';

  const displayAddress = mapAddress || fallbackLocation;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 space-y-2">
      {isAdminPreview && locationStatus !== 'set' && (
        <div
          role="status"
          className="rounded-xl bg-warning-soft border border-warning/35 px-3.5 py-2 text-xs font-semibold text-warning flex items-center justify-between gap-2"
        >
          <span>
            {locationStatus === 'not_set'
              ? locale === 'bn'
                ? 'অ্যাডমিন বিজ্ঞপ্তি: মানচিত্রের অবস্থান এখনও নির্ধারণ করা হয়নি।'
                : 'Admin notice: Eidgah map location is Not set.'
              : locale === 'bn'
                ? 'অ্যাডমিন বিজ্ঞপ্তি: মানচিত্রের পিন এখনও যাচাই করা হয়নি (Needs review)।'
                : 'Admin notice: Eidgah map pin Needs review / verification.'}
          </span>
        </div>
      )}
      <div className="rounded-2xl bg-surface border border-sand p-4 sm:p-6 shadow-sakinah-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 overflow-hidden">
        <div className="flex items-start gap-3.5 w-full sm:w-auto flex-1 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-primary-soft border border-primary/20 flex items-center justify-center text-primary shrink-0 mt-0.5">
            <MapPin className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gold-text block mb-1">
              {locale === 'bn' ? 'ঈদগাহের অবস্থান ও দিকনির্দেশনা' : 'Location & Directions'}
            </span>
            <p className="font-serif font-bold text-base sm:text-lg text-primary-dark leading-snug break-words">
              {placeName}
            </p>
            {displayAddress && (
              <p className="text-xs text-ink-muted mt-1 leading-relaxed break-words">
                {displayAddress}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-sand">
          <a
            href={navLinks.googleDirections}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-bold shadow-sakinah-sm active:scale-[0.98] transition-all min-h-[44px] tap-feedback whitespace-nowrap"
          >
            <Navigation className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{locale === 'bn' ? 'দিকনির্দেশনা পান' : 'Get Directions'}</span>
            <ArrowUpRight className="w-3.5 h-3.5 shrink-0 opacity-80" aria-hidden="true" />
          </a>

          <Link
            to="/map"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-canvas-alt hover:bg-primary-soft/50 text-primary-dark text-xs sm:text-sm font-bold border border-sand transition-colors min-h-[44px] tap-feedback whitespace-nowrap"
          >
            <Map className="w-4 h-4 shrink-0 text-primary" aria-hidden="true" />
            <span>{locale === 'bn' ? 'মানচিত্র ও পথ' : 'Map & Directions'}</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
