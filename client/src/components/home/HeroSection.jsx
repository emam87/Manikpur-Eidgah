import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, HeartHandshake, Clock } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { getImageUrl } from '../../utils/imageUrl.js';
import { EightPointStar } from '../common/EightPointStar.jsx';

function GeometricCornerOrnament({ className = '', flip = false }) {
  return (
    <svg
      viewBox="0 0 220 220"
      fill="none"
      className={`${className} ${flip ? '-scale-x-100' : ''}`}
      aria-hidden="true"
    >
      <g stroke="var(--sage-deep)" strokeWidth="1" opacity="0.11">
        <path d="M0 40H140M40 0V140M0 90H90M90 0V90" />
        <polygon points="70,12 88,52 128,70 88,88 70,128 52,88 12,70 52,52" />
        <polygon points="70,26 82,58 114,70 82,82 70,114 58,82 26,70 58,58" stroke="var(--gold)" />
        <circle cx="70" cy="70" r="56" strokeDasharray="4 4" />
        <circle cx="155" cy="40" r="24" />
        <circle cx="40" cy="155" r="24" />
      </g>
    </svg>
  );
}

function SageMosqueSkylineFallback({ className = '' }) {
  return (
    <svg
      viewBox="0 0 900 460"
      fill="none"
      preserveAspectRatio="xMaxYMax slice"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M0,460 L0,355 L140,355 Q195,305 250,355 L410,355 L420,265 L430,248 L440,265 L450,355 Q540,295 630,355 L780,355 L790,280 L800,262 L810,280 L820,355 L900,355 L900,460 Z"
        fill="var(--sage-light)"
        opacity="0.88"
      />
      <path
        d="M0,460 L0,385 L120,385 Q210,320 300,385 L470,385 Q560,295 650,385 L740,385 L748,295 L758,275 L768,295 L776,385 L900,385 L900,460 Z"
        fill="var(--sage-mid)"
        opacity="0.68"
      />
      <path
        d="M0,460 L0,415 L190,415 Q265,375 340,415 L520,415 Q605,365 690,415 L900,415 L900,460 Z"
        fill="var(--sage-deep)"
        opacity="0.45"
      />
    </svg>
  );
}

function HeroWaveDivider() {
  return (
    <div
      className="relative z-10 w-full pointer-events-none leading-none overflow-hidden -mt-px"
      aria-hidden="true"
    >
      <svg
        className="block w-full h-[60px] lg:h-[108px]"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="heroBandGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--primary-dark)" />
            <stop offset="55%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--sage-mid)" stopOpacity="0.45" />
          </linearGradient>
        </defs>

        {/* Curved Deep Green Band (thick on left, thinning smoothly toward right) */}
        <path
          d="M0,26 C320,96 740,12 1440,68 L1440,120 L0,120 Z"
          fill="url(#heroBandGradient)"
        />

        {/* Thin Gold Hairline Curve tracing upper edge of the green band */}
        <path
          d="M0,24 C320,94 740,10 1440,66"
          fill="none"
          stroke="var(--gold)"
          strokeWidth="2.2"
          opacity="0.82"
        />

        {/* Solid Ivory Fill Below matching Page Canvas (--bg) */}
        <path
          d="M0,58 C340,114 760,26 1440,76 L1440,120 L0,120 Z"
          fill="var(--bg)"
        />
      </svg>
    </div>
  );
}

export function HeroSection({ jamatSchedule = '' }) {
  const { locale, t } = useLanguage();
  const { getSetting } = useSettings();
  const [imgFailed, setImgFailed] = useState(false);

  const heroBgStyle = getSetting('hero_bg_style', 'bn', 'dawn-photo-wave');
  const siteName = getSetting('site_name', locale, t('common.site_name'));
  const tagline = getSetting('tagline', locale, t('common.site_tagline'));
  const rawHeroImage = getSetting('hero_image', 'bn', '/defaults/eidgah-hero.webp');
  const resolvedHeroImage = rawHeroImage && rawHeroImage.trim() ? getImageUrl(rawHeroImage, '') : '';
  const schedule = jamatSchedule || getSetting('eid_jamat', locale, '');

  useEffect(() => {
    setImgFailed(false);
  }, [resolvedHeroImage]);

  const isDefaultHeroAsset = resolvedHeroImage === '/defaults/eidgah-hero.webp';
  const showPhotoInDawn = Boolean(resolvedHeroImage) && !imgFailed;

  // Classic optional modes (preserved for Admin hero_bg_style selector alongside new default dawn-photo-wave)
  const isDawnPhotoWave = !heroBgStyle || heroBgStyle === 'dawn-photo-wave';

  return (
    <section className="relative overflow-hidden bg-hero-dawn select-none">
      {/* Decorative Islamic Geometric Corner Line Patterns (8-12% opacity, never behind text) */}
      <GeometricCornerOrnament className="pointer-events-none absolute -top-2 -left-2 w-40 h-40 sm:w-52 sm:h-52 z-[1]" />
      <GeometricCornerOrnament flip className="pointer-events-none absolute -top-2 -right-2 w-40 h-40 sm:w-52 sm:h-52 z-[1]" />

      {/* Optional Centered Photo Wash Mode ("photo") */}
      {heroBgStyle === 'photo' && showPhotoInDawn && (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <img
            src={resolvedHeroImage}
            srcSet={
              isDefaultHeroAsset
                ? '/defaults/eidgah-hero-640.webp 640w, /defaults/eidgah-hero.webp 1024w'
                : undefined
            }
            sizes="100vw"
            width={1024}
            height={520}
            alt=""
            loading="eager"
            fetchpriority="high"
            decoding="async"
            onError={() => setImgFailed(true)}
            className="w-full h-full object-cover object-center opacity-40 dark:opacity-25"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, rgb(var(--dawn-cream-rgb) / 0.92) 0%, rgb(var(--bg-rgb) / 0.78) 55%, rgb(var(--sky-rgb) / 0.65) 100%)',
            }}
          />
        </div>
      )}

      {/* Optional Alternative Hero Styles ("eid-dawn" or "arcade" selected in Admin) */}
      {heroBgStyle === 'eid-dawn' && (
        <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true">
          <SageMosqueSkylineFallback className="w-full h-full opacity-75" />
        </div>
      )}

      {heroBgStyle === 'arcade' && (
        <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true">
          <div className="absolute inset-0 bg-star-pattern-light opacity-70" />
          <svg
            className="w-full h-full"
            viewBox="0 0 1440 560"
            fill="none"
            preserveAspectRatio="xMidYMid slice"
          >
            {[160, 460, 760, 1060, 1340].map((cx, idx) => (
              <path
                key={idx}
                d={`M${cx - 120},560 L${cx - 120},235 Q${cx - 120},135 ${cx},92 Q${cx + 120},135 ${cx + 120},235 L${cx + 120},560`}
                stroke="var(--sage-mid)"
                strokeWidth="1.8"
                fill="var(--surface)"
                fillOpacity="0.24"
              />
            ))}
          </svg>
        </div>
      )}

      {/* Main Split / Responsive Hero Wrapper (min-height >= 560px on desktop) */}
      <div className="relative z-[2] lg:min-h-[560px] flex flex-col lg:block">
        {/* RIGHT COLUMN (Desktop: 55% anchored right & bottom overlapping cleanly; Mobile: sits BELOW text column) */}
        {isDawnPhotoWave && (
          <div className="order-2 lg:order-none relative w-full h-60 sm:h-72 lg:absolute lg:inset-y-0 lg:right-0 lg:w-[55%] lg:h-full overflow-hidden">
            {/* Dawn Sun Glow Behind Mosque Architecture */}
            <div
              className="pointer-events-none absolute top-4 right-[20%] w-52 h-52 sm:w-72 sm:h-72 rounded-full blur-2xl z-[1]"
              style={{
                background:
                  'radial-gradient(circle, rgb(var(--gold-plate-from-rgb) / 0.35) 0%, rgb(var(--gold-rgb) / 0.12) 55%, transparent 75%)',
              }}
              aria-hidden="true"
            />

            {/* Crescent Moon & Birds Sky Accent */}
            <svg
              viewBox="0 0 360 120"
              fill="none"
              className="pointer-events-none absolute top-4 right-6 w-52 sm:w-72 h-20 z-[3]"
              aria-hidden="true"
            >
              {/* Delicate Golden Crescent */}
              <path
                d="M298 16 C284 16 274 26 274 40 C274 54 284 64 298 64 C289 59 285 50 285 40 C285 30 289 21 298 16 Z"
                fill="var(--gold)"
                opacity="0.88"
              />
              {/* Soft Birds Silhouette */}
              <g
                stroke="var(--primary-dark)"
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
                opacity="0.48"
              >
                <path d="M110 42 Q116 36 122 42 Q128 36 134 42" />
                <path d="M148 28 Q153 23 158 28 Q163 23 168 28" />
                <path d="M174 52 Q178 48 182 52 Q186 48 190 52" />
              </g>
            </svg>

            {/* Mosque Photo with CSS Edge Mask Fade OR Sage SVG Skyline Fallback */}
            {showPhotoInDawn ? (
              <img
                src={resolvedHeroImage}
                srcSet={
                  isDefaultHeroAsset
                    ? '/defaults/eidgah-hero-640.webp 640w, /defaults/eidgah-hero.webp 1024w'
                    : undefined
                }
                sizes={isDefaultHeroAsset ? '(max-width: 1023px) 100vw, 55vw' : undefined}
                width={1024}
                height={520}
                alt={siteName}
                loading="eager"
                fetchpriority="high"
                decoding="async"
                onError={() => setImgFailed(true)}
                className="w-full h-full object-cover object-bottom lg:object-[right_center] hero-photo-fade"
              />
            ) : (
              <div className="w-full h-full hero-photo-fade flex items-end justify-end">
                <SageMosqueSkylineFallback className="w-full h-full" />
              </div>
            )}
          </div>
        )}

        {/* LEFT COLUMN (Text Content: ~50% width on desktop, stacked FIRST on mobile) */}
        <div className="order-1 lg:order-none relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-3 sm:pt-12 sm:pb-4 lg:py-20">
          <div className="w-full lg:w-[50%] text-left space-y-3.5 sm:space-y-5">
            {/* 1. Eyebrow with 8-point Gold Star & Gold Hairline */}
            <div className="inline-flex items-center gap-2.5 max-w-full">
              <EightPointStar className="w-4 h-4 text-gold shrink-0" />
              <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.22em] text-primary-dark">
                {t('hero.eyebrow')}
              </span>
              <span
                className="h-[1.5px] w-12 sm:w-20 bg-gradient-to-r from-gold via-gold/55 to-transparent shrink-0"
                aria-hidden="true"
              />
            </div>

            {/* 2. Site Name as Large Display Serif H1 (with matra-safe line-height + subtle ivory halo) */}
            <h1
              className={`font-serif font-extrabold text-primary-dark hero-h1-halo tracking-tight py-1 ${locale === 'bn'
                ? 'text-[clamp(2.2rem,5vw,3.9rem)] leading-[1.24]'
                : 'text-[clamp(2.35rem,4.8vw,4rem)] leading-[1.1]'
                }`}
            >
              {siteName}
            </h1>

            {/* 3. Italic Serif Tagline */}
            <p className="font-serif italic text-base sm:text-xl lg:text-[22px] text-primary-dark/90 font-medium leading-relaxed max-w-xl">
              {tagline}
            </p>

            {/* 4. Action Buttons (Desktop >= 1024px: inside left column) */}
            <div className="hidden lg:flex items-center gap-3 pt-2">
              <Link
                to="/lifetime-members"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold shadow-sakinah-card hover:shadow-sakinah-lift active:scale-[0.98] transition-all text-base min-h-[46px] tap-feedback"
              >
                <span>{t('hero.cta_members')}</span>
                <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
              </Link>

              <Link
                to="/land-donors"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-primary-dark hover:text-primary hover:bg-primary-soft/50 font-bold transition-colors text-base min-h-[46px] tap-feedback"
              >
                <HeartHandshake className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                <span>{t('hero.cta_land_donors')}</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Action Buttons (< 1024px: placed BELOW the hero picture in a clean 2-col row) */}
        <div className="order-3 lg:hidden relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-3.5 pb-5">
          <div className="grid grid-cols-2 gap-2.5 sm:max-w-lg">
            <Link
              to="/lifetime-members"
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold shadow-sakinah-card hover:shadow-sakinah-lift active:scale-[0.98] transition-all text-xs sm:text-sm min-h-[44px] tap-feedback text-center leading-tight"
            >
              <span className="truncate">{t('hero.cta_members')}</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            </Link>

            <Link
              to="/land-donors"
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-surface/95 border border-primary/25 text-primary-dark hover:text-primary hover:bg-primary-soft/50 font-bold shadow-sakinah-sm transition-colors text-xs sm:text-sm min-h-[44px] tap-feedback text-center leading-tight"
            >
              <HeartHandshake className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden="true" />
              <span className="truncate">{t('hero.cta_land_donors')}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Curved Green + Gold Wave Transition into Ivory Canvas */}
      <HeroWaveDivider />
    </section>
  );
}
