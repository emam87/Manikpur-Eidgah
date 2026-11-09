import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Navigation, ExternalLink, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';

export function MapTeaserSection() {
  const { locale, t } = useLanguage();
  const { getSetting } = useSettings();

  const lat = getSetting('map_lat', 'bn', '23.9875');
  const lng = getSetting('map_lng', 'bn', '90.8214');
  const locationText = getSetting('location', locale, 'মানিকপুর, মানিকপুর বাজার, বাংলাদেশ');
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  return (
    <section className="py-12 sm:py-16 bg-white border-t border-gold-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-emerald-950 text-ivory-50 rounded-3xl p-6 sm:p-10 border-2 border-gold-500/40 shadow-2xl relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Left: Info & Directions */}
          <div className="space-y-4 max-w-xl text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900 border border-gold-500/40 text-gold-300 text-xs font-semibold">
              <MapPin className="w-3.5 h-3.5" />
              <span>{t('map_preview_title')}</span>
            </div>

            <h2 className="font-serif text-2xl sm:text-4xl font-bold tracking-tight text-ivory-50">
              {t('map_preview_desc')}
            </h2>

            <p className="text-sm sm:text-base text-ivory-200/90 leading-relaxed">
              {locationText}
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gold-500 text-stone-950 font-bold hover:bg-gold-400 transition-colors shadow-lg tap-target"
              >
                <Navigation className="w-4 h-4 text-stone-900" />
                <span>{t('get_directions')}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <Link
                to="/map"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-900/80 border border-gold-500/40 text-ivory-100 hover:bg-emerald-900 transition-colors tap-target text-sm font-semibold"
              >
                <span>{locale === 'bn' ? 'ইন্টারেক্টিভ মানচিত্র খুলুন' : 'Open Interactive Map'}</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Right: Map Visual Preview */}
          <div className="w-full lg:w-1/2 aspect-[16/10] rounded-2xl overflow-hidden border-2 border-gold-500/30 relative shadow-inner bg-emerald-900">
            {/* Embed OpenStreetMap iframe (with pointer-events disabled by default to avoid mobile scroll trap) */}
            <iframe
              title="Manikpur Eidgah Map Preview"
              width="100%"
              height="100%"
              loading="lazy"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(lng) - 0.005}%2C${parseFloat(lat) - 0.003}%2C${parseFloat(lng) + 0.005}%2C${parseFloat(lat) + 0.003}&layer=mapnik&marker=${lat}%2C${lng}`}
              className="w-full h-full border-0 filter contrast-105"
            />
            <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm text-gold-300 text-[10px] px-2.5 py-1 rounded-md">
              <span>{lat}, {lng}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

