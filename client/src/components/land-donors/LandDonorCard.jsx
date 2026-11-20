import React, { useState, useEffect } from 'react';
import { MapPin, Calendar, ChevronRight, Moon } from 'lucide-react';
import { useScrollReveal } from '../../hooks/useScrollReveal.js';
import {
  formatAreaPlate,
  getLandDonorThumbUrl,
  getHonorificPrefix,
  getDonorInitial,
  getLandUseMeta,
} from '../../utils/landDonorHelpers.js';

/**
 * Redesigned Horizontal Land Donor Card (জমিদাতা)
 * - Mobile (<768px): full-width horizontal flex row, min-h 112px (Comfortable) / 94px (Compact),
 *   arch-top (mihrab) photo 64x80 (72x90 at 412px+), gold-foil area plate, <= 2 neutral chips.
 * - Desktop (768px+): same component in 2-col / 3-col grid with pointer-only 4px hover lift.
 * - Strictly bilingual (hides missing active-language lines, never mixes bn/en).
 */
export function LandDonorCard({
  donor,
  index = 0,
  density = 'comfortable',
  locale,
  toBanglaNum,
  getLocalized,
  onSelect,
}) {
  const shouldReveal = index < 6;
  const revealRef = useScrollReveal({ threshold: 0.08, rootMargin: '0px 0px -20px 0px' });

  const name = getLocalized(donor, 'name');
  if (locale === 'en' && !name) return null;

  const fatherName = getLocalized(donor, 'fatherName');
  const village = getLocalized(donor, 'village');
  const honorific = getHonorificPrefix(name, donor.isDeceased, locale);
  const initial = getDonorInitial(name, locale);
  const areaPlate = formatAreaPlate(donor.areaValue, donor.areaUnit || donor.unit, locale, toBanglaNum);
  const useMeta = getLandUseMeta(donor.landUse, donor.landUseOther, locale);
  const yearDisplay = donor.donationYear
    ? locale === 'bn'
      ? toBanglaNum(donor.donationYear, true)
      : String(donor.donationYear)
    : '';

  const { thumbUrl, fullUrl } = getLandDonorThumbUrl(donor.photoPath);
  const [imgSrc, setImgSrc] = useState(thumbUrl);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgFailed, setImgFailed] = useState(!thumbUrl);

  useEffect(() => {
    setImgSrc(thumbUrl);
    setImgLoaded(false);
    setImgFailed(!thumbUrl);
  }, [thumbUrl]);

  const handleImgError = () => {
    if (imgSrc && fullUrl && imgSrc !== fullUrl) {
      setImgSrc(fullUrl);
    } else {
      setImgFailed(true);
      setImgLoaded(true);
    }
  };

  const isCompact = density === 'compact';

  const ariaLabelParts = [
    locale === 'bn' ? 'জমিদাতা:' : 'Land donor:',
    honorific ? `${honorific} ${name}` : name,
    areaPlate.full,
    yearDisplay,
  ].filter(Boolean);

  return (
    <button
      ref={shouldReveal ? revealRef : undefined}
      type="button"
      onClick={() => onSelect(donor)}
      aria-label={ariaLabelParts.join(', ')}
      style={shouldReveal ? { transitionDelay: `${index * 45}ms` } : undefined}
      className={[
        'land-donor-card group relative w-full text-left flex items-center gap-3 p-3 rounded-[14px] bg-surface border border-sand shadow-sakinah-sm overflow-hidden',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold',
        isCompact ? 'min-h-[94px]' : 'min-h-[112px]',
        shouldReveal ? 'land-donor-reveal' : '',
      ].join(' ')}
    >
      {/* Optional subtle 3px left accent bar tinted by land use (Sakinah palette) */}
      <span
        aria-hidden="true"
        className={`absolute inset-y-2.5 left-0 w-[3px] rounded-r-full opacity-80 ${useMeta.accentClass}`}
      />

      {/* Left: Arch-Top (Mihrab) Photo Frame */}
      <div className="relative flex-shrink-0 pl-0.5">
        <div
          className={[
            'relative aspect-[4/5] rounded-t-full rounded-b-[10px] overflow-hidden ring-[1.5px] ring-gold/60 bg-gradient-to-b from-primary-soft to-sage-light flex items-center justify-center',
            isCompact
              ? 'w-14 h-[70px]'
              : 'w-16 h-20 min-[412px]:w-[72px] min-[412px]:h-[90px]',
          ].join(' ')}
        >
          {!imgFailed && imgSrc ? (
            <>
              {!imgLoaded && (
                <div
                  aria-hidden="true"
                  className="absolute inset-0 skeleton-shimmer"
                />
              )}
              <img
                src={imgSrc}
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
                width={isCompact ? 56 : 72}
                height={isCompact ? 70 : 90}
                onLoad={() => setImgLoaded(true)}
                onError={handleImgError}
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  imgLoaded ? 'opacity-100' : 'opacity-0'
                }`}
              />
            </>
          ) : (
            <span
              aria-hidden="true"
              className={`font-serif font-bold text-primary-dark select-none ${
                isCompact ? 'text-xl' : 'text-2xl'
              }`}
            >
              {initial}
            </span>
          )}
        </div>

        {/* Quiet respectful crescent marker for deceased donors */}
        {donor.isDeceased && (
          <span
            aria-hidden="true"
            className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-surface border border-gold/60 flex items-center justify-center shadow-sm"
          >
            <Moon className="w-2.5 h-2.5 text-gold-text" strokeWidth={2.2} />
          </span>
        )}
      </div>

      {/* Right Column: Name, Parent, Location, Facts Row */}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
        {/* 1. Name Line (Honorific + Serif 17px Bold, max 2 lines, balanced wrap) */}
        <h3 className="font-serif text-[17px] font-bold text-primary-dark leading-[1.3] line-clamp-2 [text-wrap:balance] break-words">
          {honorific && (
            <span className="font-sans text-[12px] font-medium text-ink-muted mr-1 align-baseline">
              {honorific}
            </span>
          )}
          <span>{name}</span>
        </h3>

        {/* 2. Parent Line (hidden in Compact density or if empty in active language) */}
        {!isCompact && fatherName && (
          <p className="text-[13px] text-ink-muted leading-snug truncate">
            {locale === 'bn' ? 'পিতা: ' : 'Father: '}
            {fatherName}
          </p>
        )}

        {/* 3. Location Line (hidden if empty in active language) */}
        {village && (
          <p className="text-[13px] text-ink-muted leading-snug flex items-center gap-1 min-w-0">
            <MapPin className="w-3.5 h-3.5 text-primary/75 flex-shrink-0" aria-hidden="true" />
            <span className="truncate">{village}</span>
          </p>
        )}

        {/* 4. Facts Row: Gold-Foil Area Plate + at most 2 neutral chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {/* a) Area Plate (Gold Foil) */}
          <span className="bg-gold-plate rounded-[10px] px-2.5 py-1 inline-flex items-baseline gap-1 whitespace-nowrap border border-gold/70 leading-none">
            <span className="text-[16px] font-bold tabular-nums leading-none">
              {areaPlate.value}
            </span>
            <span className="text-[12px] font-semibold leading-none">
              {areaPlate.unit}
            </span>
          </span>

          {/* b) Neutral Chip: Donation Year */}
          {yearDisplay && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-soft text-primary-dark text-[12px] font-medium whitespace-nowrap">
              <Calendar className="w-3 h-3 shrink-0" aria-hidden="true" />
              <span className="tabular-nums">{yearDisplay}</span>
            </span>
          )}
        </div>
      </div>

      {/* Trailing Chevron Icon */}
      <ChevronRight
        className="w-4 h-4 text-ink-muted/75 flex-shrink-0"
        aria-hidden="true"
      />
    </button>
  );
}

/**
 * Horizontal Skeleton Card matching LandDonorCard dimensions (no layout shift).
 */
export function LandDonorCardSkeleton({ density = 'comfortable' }) {
  const isCompact = density === 'compact';
  return (
    <div
      aria-hidden="true"
      className={`w-full flex items-center gap-3 p-3 rounded-[14px] bg-surface border border-sand shadow-sakinah-sm ${
        isCompact ? 'min-h-[94px]' : 'min-h-[112px]'
      }`}
    >
      <div
        className={`flex-shrink-0 rounded-t-full rounded-b-[10px] skeleton-shimmer ${
          isCompact ? 'w-14 h-[70px]' : 'w-16 h-20 min-[412px]:w-[72px] min-[412px]:h-[90px]'
        }`}
      />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="h-4 w-3/4 rounded-md skeleton-shimmer" />
        {!isCompact && <div className="h-3 w-1/2 rounded-md skeleton-shimmer" />}
        <div className="h-3 w-2/5 rounded-md skeleton-shimmer" />
        <div className="flex items-center gap-1.5 pt-0.5">
          <div className="h-6 w-24 rounded-[10px] skeleton-shimmer" />
          <div className="h-5 w-14 rounded-full skeleton-shimmer" />
        </div>
      </div>
      <div className="w-4 h-4 rounded skeleton-shimmer flex-shrink-0" />
    </div>
  );
}
