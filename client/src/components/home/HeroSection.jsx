import React from 'react';
import { Link } from 'react-router-dom';
import { Users, HeartHandshake, Clock, MapPin, Calendar, Sparkles } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { EightPointStar, StarDivider } from '../common/EightPointStar.jsx';

export function HeroSection({ jamatSchedule = '' }) {
  const { locale, t } = useLanguage();
  const { getSetting, isSettingEnabled } = useSettings();

  const heroBgStyle = getSetting('hero_bg_style', 'bn', 'eid-dawn'); // 'eid-dawn' | 'arcade' | 'photo'
  const siteName = getSetting('site_name', locale, t('site_name'));
  const tagline = getSetting('tagline', locale, t('site_tagline'));
  const showBismillah = isSettingEnabled('show_bismillah');
  const heroImage = getSetting('hero_image', 'bn', '');
  const schedule = jamatSchedule || getSetting('eid_jamat', locale, '');

  return (
    <section className="relative overflow-hidden pt-8 pb-20 sm:pb-28 lg:pb-32">
      {/* 1. HERO BACKGROUND STYLES */}
      {heroBgStyle === 'eid-dawn' && (
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-emerald-950 via-emerald-900 to-emerald-800">
          {/* Illustrated SVG Eid Dawn Sky: Crescent, Stars, Clouds, Mosque Silhouette */}
          <svg
            className="absolute inset-0 w-full h-full object-cover opacity-35 pointer-events-none"
            viewBox="0 0 1440 600"
            fill="none"
            preserveAspectRatio="none"
          >
            {/* Soft Sunrise Golden Horizon Glow */}
            <radialGradient id="sunriseGlow" cx="50%" cy="45%" r="50%">
              <stop offset="0%" stopColor="#B8923F" stopOpacity="0.45" />
              <stop offset="60%" stopColor="#198754" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#082E1C" stopOpacity="0" />
            </radialGradient>
            <rect width="1440" height="600" fill="url(#sunriseGlow)" />

            {/* Glowing Golden Crescent Moon */}
            <g transform="translate(1150, 70)">
              <circle cx="30" cy="30" r="28" fill="#F5EDD8" />
              <circle cx="39" cy="24" r="24" fill="#0C4128" />
              <polygon points="58,15 60,20 66,20 61,24 63,30 58,26 53,30 55,24 50,20 56,20" fill="#B8923F" />
            </g>

            {/* Faint Stars */}
            <g fill="#B8923F" opacity="0.6">
              <circle cx="150" cy="80" r="2" />
              <circle cx="320" cy="120" r="1.5" />
              <circle cx="480" cy="60" r="2" />
              <circle cx="720" cy="95" r="2.5" />
              <circle cx="950" cy="70" r="1.8" />
              <circle cx="1300" cy="140" r="2" />
            </g>

            {/* 3-Layer Traditional Mosque Skyline Silhouette */}
            {/* Background Layer: Far domes */}
            <path
              d="M0,600 L0,480 Q100,430 200,480 Q350,420 500,480 Q650,400 800,480 Q950,430 1100,480 Q1250,410 1440,480 L1440,600 Z"
              fill="#062215"
              opacity="0.4"
            />
            {/* Mid Layer: Mosque domes, minarets, and Shahi arches */}
            <path
              d="M0,600 L0,510 
                 L120,510 L120,440 L130,420 L140,440 L140,510 
                 Q240,450 340,510 
                 L480,510 Q540,430 600,510 
                 L720,510 L725,380 L735,360 L745,380 L750,510 
                 Q850,440 950,510 
                 L1100,510 Q1160,430 1220,510 
                 L1320,510 L1330,440 L1340,420 L1350,440 L1360,510 
                 L1440,510 L1440,600 Z"
              fill="#04180E"
              opacity="0.7"
            />
          </svg>
        </div>
      )}

      {heroBgStyle === 'arcade' && (
        <div className="absolute inset-0 z-0 bg-emerald-950">
          {/* Deep Emerald with Pointed Grand Arches & Golden Lantern Light */}
          <div className="absolute inset-0 bg-star-pattern opacity-40" />
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-emerald-950 to-transparent" />
          <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" viewBox="0 0 1200 400" preserveAspectRatio="none">
            <path d="M0,400 L0,200 Q150,50 300,200 L300,400 M300,400 L300,200 Q450,50 600,200 L600,400 M600,400 L600,200 Q750,50 900,200 L900,400 M900,400 L900,200 Q1050,50 1200,200 L1200,400" stroke="#B8923F" strokeWidth="3" fill="none" />
          </svg>
        </div>
      )}

      {heroBgStyle === 'photo' && (
        <div className="absolute inset-0 z-0 bg-emerald-950">
          {heroImage ? (
            <img src={heroImage} alt="Manikpur Eidgah" className="w-full h-full object-cover opacity-25" />
          ) : (
            <div className="w-full h-full bg-emerald-950" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/90 via-emerald-900/80 to-emerald-950" />
        </div>
      )}

      {/* Decorative Gold Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Hero Content Container */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Optional Bismillah Line */}
        {showBismillah && (
          <div className="mb-4">
            <span className="font-serif text-gold-300/90 text-sm sm:text-base lg:text-lg tracking-widest font-normal">
              {t('bismillah_text')}
            </span>
          </div>
        )}

        {/* Establishment Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950/80 border border-gold-500/40 text-gold-300 text-xs sm:text-sm font-semibold mb-6 shadow-sm backdrop-blur-sm">
          <EightPointStar className="w-3.5 h-3.5 text-gold-400" />
          <span>{t('hero_badge')}</span>
          <EightPointStar className="w-3.5 h-3.5 text-gold-400" />
        </div>

        {/* Grand Title */}
        <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-extrabold text-ivory-50 tracking-tight leading-tight sm:leading-tight mb-4 drop-shadow-md">
          {siteName}
        </h1>

        {/* 8-Point Star Divider */}
        <StarDivider className="my-5" />

        {/* Tagline */}
        <p className="max-w-3xl mx-auto text-base sm:text-lg lg:text-xl text-ivory-100/90 font-sans leading-relaxed mb-8 sm:mb-10">
          {tagline}
        </p>

        {/* Two Equal Primary CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-10">
          <Link
            to="/lifetime-members"
            className="w-full sm:w-1/2 inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-gold-500 text-stone-950 font-bold hover:bg-gold-400 transition-all shadow-lg hover:shadow-gold-500/30 tap-target text-sm sm:text-base"
          >
            <Users className="w-5 h-5 text-stone-900" />
            <span>{t('hero_cta_members')}</span>
          </Link>

          <Link
            to="/donors"
            className="w-full sm:w-1/2 inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-emerald-950 text-ivory-50 font-bold border border-gold-500/50 hover:bg-emerald-900 hover:border-gold-400 transition-all shadow-lg tap-target text-sm sm:text-base"
          >
            <HeartHandshake className="w-5 h-5 text-gold-400" />
            <span>{t('hero_cta_donate')}</span>
          </Link>
        </div>

        {/* Holy Eid Jamat Schedule Banner Block */}
        {schedule ? (
          <div className="max-w-2xl mx-auto bg-emerald-950/90 border border-gold-500/40 rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur-md text-ivory-100 text-left sm:text-center space-y-1.5">
            <div className="flex items-center justify-center gap-2 text-gold-400 text-xs sm:text-sm font-semibold uppercase tracking-wider">
              <Clock className="w-4 h-4 text-gold-400" />
              <span>{t('eid_jamat_schedule_title')}</span>
            </div>
            <p className="text-xs sm:text-sm text-ivory-50 font-medium leading-relaxed whitespace-pre-line text-center">
              {schedule}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
