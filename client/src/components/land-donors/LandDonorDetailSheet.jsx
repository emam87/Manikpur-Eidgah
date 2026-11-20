import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  FileText,
  Share2,
  Check,
  Compass,
  ScrollText,
  Map as MapIcon,
  UserCheck,
  ArrowUpRight,
  Landmark,
  Moon,
} from 'lucide-react';
import { BottomSheet } from '../common/BottomSheet.jsx';
import { getImageUrl } from '../../utils/imageUrl.js';
import {
  formatAreaPlate,
  convertFromDecimal,
  getHonorificPrefix,
  getDonorInitial,
  getLandUseMeta,
  DONATION_TYPE_LABELS,
  KHATIAN_TYPE_LABELS,
} from '../../utils/landDonorHelpers.js';

const STORY_COLLAPSE_THRESHOLD = 220;

export function LandDonorDetailSheet({
  donor,
  isOpen,
  onClose,
  conversionFactors,
  locale,
  toBanglaNum,
  formatDate,
  getLocalized,
  onShare,
  copied,
}) {
  const [storyExpanded, setStoryExpanded] = useState(false);

  useEffect(() => {
    setStoryExpanded(false);
  }, [donor?.id]);

  if (!donor) {
    return <BottomSheet isOpen={false} onClose={onClose} />;
  }

  const name = getLocalized(donor, 'name');
  const fatherName = getLocalized(donor, 'fatherName');
  const motherName = getLocalized(donor, 'motherName');
  const village = getLocalized(donor, 'village');
  const mouza = getLocalized(donor, 'mouza');
  const upazila = getLocalized(donor, 'upazila');
  const district = getLocalized(donor, 'district');
  const story = getLocalized(donor, 'story');

  const honorific = getHonorificPrefix(name, donor.isDeceased, locale);
  const initial = getDonorInitial(name, locale);
  const photoUrl = donor.photoPath ? getImageUrl(donor.photoPath) : '';

  const areaPlate = formatAreaPlate(donor.areaValue, donor.areaUnit || donor.unit, locale, toBanglaNum);
  const areaInDec = Number(donor.areaInDecimal) || 0;
  const decimalConverted = convertFromDecimal(areaInDec, 'decimal', conversionFactors, locale, toBanglaNum);
  const sqftConverted = convertFromDecimal(areaInDec, 'sqft', conversionFactors, locale, toBanglaNum);

  const showDecimalConversion = areaPlate.canonicalUnit !== 'DECIMAL_SHATANGSHO' && areaInDec > 0;
  const showSqftConversion = areaPlate.canonicalUnit !== 'SQFT' && areaInDec > 0;

  const useMeta = getLandUseMeta(donor.landUse, donor.landUseOther, locale);
  const UseIcon = useMeta.icon;
  const donationTypeLabel =
    DONATION_TYPE_LABELS[donor.donationType]?.[locale] || '';
  const khatianTypeLabel = donor.khatianType
    ? KHATIAN_TYPE_LABELS[donor.khatianType]?.[locale] || donor.khatianType
    : '';

  const yearOrDate = donor.donationDate
    ? formatDate(donor.donationDate)
    : donor.donationYear
      ? locale === 'bn'
        ? `${toBanglaNum(donor.donationYear, true)} সাল`
        : String(donor.donationYear)
      : '';

  // Strict bilingual helper for single-string fields (e.g. boundaries, representativeName)
  const filterByLocaleScript = (val) => {
    if (!val || typeof val !== 'string') return '';
    const trimmed = val.trim();
    if (!trimmed) return '';
    const hasBengali = /[\u0980-\u09FF]/.test(trimmed);
    if (locale === 'en' && hasBengali) return '';
    return trimmed;
  };

  const repName = filterByLocaleScript(donor.representativeName);
  const repRelation = filterByLocaleScript(donor.representativeRelation);
  const deedNumber = filterByLocaleScript(donor.deedNumber);
  const khatianNumber = filterByLocaleScript(donor.khatianNumber);
  const dagNumber = filterByLocaleScript(donor.dagNumber);
  const jlNumber = filterByLocaleScript(donor.jlNumber);

  const bNorth = filterByLocaleScript(donor.boundaryNorth);
  const bSouth = filterByLocaleScript(donor.boundarySouth);
  const bEast = filterByLocaleScript(donor.boundaryEast);
  const bWest = filterByLocaleScript(donor.boundaryWest);

  const hasDeedInfo = Boolean(deedNumber || donor.deedDate);
  const hasPlotInfo = Boolean(khatianTypeLabel || khatianNumber || dagNumber || jlNumber);
  const hasBoundaries = Boolean(bNorth || bSouth || bEast || bWest);

  const locationParts = [mouza, upazila, district].filter(Boolean);
  const locationLine = locationParts.join(', ');

  const relatedDocuments = Array.isArray(donor.relatedDocuments) ? donor.relatedDocuments : [];
  const relatedLandMap = donor.relatedLandMap || null;

  const isStoryLong = story && story.length > STORY_COLLAPSE_THRESHOLD;
  const displayedStory =
    isStoryLong && !storyExpanded
      ? `${story.slice(0, STORY_COLLAPSE_THRESHOLD).trim()}…`
      : story;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={locale === 'bn' ? 'জমিদাতার বিবরণ' : 'Land Donor Details'}
      maxWidth="max-w-xl"
    >
      <div className="space-y-5 pb-safe text-ink">
        {/* Header: Larger Arch Photo (96x120) with subtle thin gold double border, Honorific + Name, Parents, Village, Share */}
        <div className="flex flex-col items-center text-center space-y-3 pb-4 border-b border-sand">
          <div className="relative">
            {/* Subtle thin gold double border */}
            <div className="p-[3px] rounded-t-full rounded-b-[14px] border border-gold/75 bg-surface shadow-sakinah-sm">
              <div className="w-24 h-[120px] rounded-t-full rounded-b-[10px] border border-gold/55 overflow-hidden bg-gradient-to-b from-primary-soft to-sage-light flex items-center justify-center">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={name}
                    width={96}
                    height={120}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="font-serif text-3xl font-bold text-primary-dark">
                    {initial}
                  </span>
                )}
              </div>
            </div>
            {donor.isDeceased && (
              <span
                aria-hidden="true"
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-surface border border-gold/70 flex items-center justify-center shadow-sm"
              >
                <Moon className="w-3 h-3 text-gold-text" />
              </span>
            )}
          </div>

          <div className="space-y-1 max-w-md">
            <h2 className="font-serif font-bold text-xl sm:text-2xl text-primary-dark leading-snug [text-wrap:balance]">
              {honorific && (
                <span className="font-sans text-sm font-medium text-ink-muted mr-1.5">
                  {honorific}
                </span>
              )}
              <span>{name}</span>
            </h2>

            {(fatherName || motherName) && (
              <div className="text-[13px] text-ink-muted space-y-0.5">
                {fatherName && (
                  <p>
                    {locale === 'bn' ? 'পিতা: ' : 'Father: '}
                    <span className="text-ink font-medium">{fatherName}</span>
                  </p>
                )}
                {motherName && (
                  <p>
                    {locale === 'bn' ? 'মাতা: ' : 'Mother: '}
                    <span className="text-ink font-medium">{motherName}</span>
                  </p>
                )}
              </div>
            )}

            {village && (
              <p className="text-[13px] text-ink-muted inline-flex items-center justify-center gap-1 pt-0.5">
                <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" aria-hidden="true" />
                <span>{village}</span>
              </p>
            )}
          </div>

          {/* Single Primary Action: Share */}
          <button
            type="button"
            onClick={() => onShare(donor)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-bold shadow-sakinah-sm min-h-[44px] tap-feedback focus-visible:outline-2 focus-visible:outline-gold"
          >
            {copied ? (
              <Check className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Share2 className="w-4 h-4" aria-hidden="true" />
            )}
            <span>
              {copied
                ? locale === 'bn'
                  ? 'কপি হয়েছে'
                  : 'Copied'
                : locale === 'bn'
                  ? 'শেয়ার করুন'
                  : 'Share'}
            </span>
          </button>
        </div>

        {/* Gold-Foil Area Plate + Converted Units */}
        <div className="bg-gold-plate rounded-xl p-4 border border-gold/80 text-center space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-ink/80 block">
            {locale === 'bn' ? 'দানকৃত জমির পরিমাণ' : 'Donated Land Area'}
          </span>
          <p className="font-serif font-extrabold text-2xl text-ink tabular-nums leading-tight">
            {areaPlate.full}
          </p>
          {(showDecimalConversion || showSqftConversion) && (
            <p className="text-xs font-medium text-ink/80 tabular-nums">
              {[
                showDecimalConversion ? decimalConverted.full : null,
                showSqftConversion ? sqftConverted.full : null,
              ]
                .filter(Boolean)
                .join(' • ')}
            </p>
          )}
        </div>

        {/* Key Facts Grid (2 columns, icons) */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Land Use */}
          <div className="rounded-xl bg-canvas-alt border border-sand p-3 flex items-start gap-2.5">
            <UseIcon className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div className="min-w-0">
              <span className="block text-[11px] text-ink-muted">
                {locale === 'bn' ? 'ব্যবহারের ক্ষেত্র' : 'Land Use'}
              </span>
              <span className="block text-[13px] font-bold text-primary-dark leading-snug">
                {useMeta.label}
              </span>
            </div>
          </div>

          {/* Donation Year / Date */}
          {yearOrDate && (
            <div className="rounded-xl bg-canvas-alt border border-sand p-3 flex items-start gap-2.5">
              <Calendar className="w-4 h-4 text-gold-text flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div className="min-w-0">
                <span className="block text-[11px] text-ink-muted">
                  {locale === 'bn' ? 'দানের সময়' : 'Donation Date'}
                </span>
                <span className="block text-[13px] font-bold text-primary-dark tabular-nums leading-snug">
                  {yearOrDate}
                </span>
              </div>
            </div>
          )}

          {/* Donation Type */}
          {donationTypeLabel && (
            <div className="rounded-xl bg-canvas-alt border border-sand p-3 flex items-start gap-2.5">
              <ScrollText className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div className="min-w-0">
                <span className="block text-[11px] text-ink-muted">
                  {locale === 'bn' ? 'দানের ধরন' : 'Donation Type'}
                </span>
                <span className="block text-[13px] font-bold text-primary-dark leading-snug">
                  {donationTypeLabel}
                </span>
              </div>
            </div>
          )}

          {/* Mouza / Upazila / District (only when public via showPlotDetails) */}
          {locationLine && (
            <div className="rounded-xl bg-canvas-alt border border-sand p-3 flex items-start gap-2.5">
              <Landmark className="w-4 h-4 text-gold-text flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div className="min-w-0">
                <span className="block text-[11px] text-ink-muted">
                  {locale === 'bn' ? 'মৌজা ও এলাকা' : 'Mouza & Area'}
                </span>
                <span className="block text-[13px] font-bold text-primary-dark leading-snug break-words">
                  {locationLine}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Background Story with "Read more" if long */}
        {story && (
          <div className="rounded-xl bg-surface border border-sand p-3.5 space-y-1.5">
            <h3 className="text-xs font-bold text-primary-dark uppercase tracking-wider">
              {locale === 'bn' ? 'জমিদানের ইতিহাস ও পটভূমি' : 'Background Story'}
            </h3>
            <p className="text-[13px] leading-relaxed text-ink-muted whitespace-pre-line">
              {displayedStory}
            </p>
            {isStoryLong && (
              <button
                type="button"
                onClick={() => setStoryExpanded((prev) => !prev)}
                className="text-xs font-bold text-primary hover:underline min-h-[36px] inline-flex items-center"
              >
                {storyExpanded
                  ? locale === 'bn'
                    ? 'সংক্ষিপ্ত দেখুন'
                    : 'Show less'
                  : locale === 'bn'
                    ? 'আরও পড়ুন'
                    : 'Read more'}
              </button>
            )}
          </div>
        )}

        {/* Family Representative (Public name & relation only; phone NEVER exposed) */}
        {repName && (
          <div className="rounded-xl bg-canvas-alt border border-sand p-3.5 flex items-center gap-2.5">
            <UserCheck className="w-4 h-4 text-primary flex-shrink-0" aria-hidden="true" />
            <div className="text-xs">
              <span className="text-ink-muted block">
                {locale === 'bn' ? 'পরিবারের প্রতিনিধি' : 'Family Representative'}
              </span>
              <span className="font-bold text-primary-dark text-[13px]">
                {repName}
                {repRelation ? ` (${repRelation})` : ''}
              </span>
            </div>
          </div>
        )}

        {/* Gated Deed & Plot Details (rendered only when server serialized them) */}
        {(hasDeedInfo || hasPlotInfo) && (
          <div className="rounded-xl bg-canvas-alt border border-sand p-3.5 space-y-2.5">
            <h3 className="text-xs font-bold text-primary-dark uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-gold-text" aria-hidden="true" />
              <span>{locale === 'bn' ? 'দলিল ও খতিয়ান তথ্য' : 'Deed & Survey Details'}</span>
            </h3>
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              {deedNumber && (
                <div>
                  <span className="block text-[11px] text-ink-muted">
                    {locale === 'bn' ? 'দলিল নম্বর' : 'Deed Number'}
                  </span>
                  <span className="font-bold text-ink">{deedNumber}</span>
                </div>
              )}
              {donor.deedDate && (
                <div>
                  <span className="block text-[11px] text-ink-muted">
                    {locale === 'bn' ? 'দলিলের তারিখ' : 'Deed Date'}
                  </span>
                  <span className="font-bold text-ink">{formatDate(donor.deedDate)}</span>
                </div>
              )}
              {(khatianTypeLabel || khatianNumber) && (
                <div>
                  <span className="block text-[11px] text-ink-muted">
                    {locale === 'bn' ? 'খতিয়ান' : 'Khatian'}
                  </span>
                  <span className="font-bold text-ink">
                    {[khatianTypeLabel, khatianNumber].filter(Boolean).join(' — ')}
                  </span>
                </div>
              )}
              {dagNumber && (
                <div>
                  <span className="block text-[11px] text-ink-muted">
                    {locale === 'bn' ? 'দাগ নম্বর' : 'Dag Number'}
                  </span>
                  <span className="font-bold text-ink">{dagNumber}</span>
                </div>
              )}
              {jlNumber && (
                <div>
                  <span className="block text-[11px] text-ink-muted">
                    {locale === 'bn' ? 'জে.এল. নং' : 'J.L. No'}
                  </span>
                  <span className="font-bold text-ink">{jlNumber}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Gated Boundaries (rendered only when server serialized them) */}
        {hasBoundaries && (
          <div className="rounded-xl bg-canvas-alt border border-sand p-3.5 space-y-2.5">
            <h3 className="text-xs font-bold text-primary-dark uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-gold-text" aria-hidden="true" />
              <span>{locale === 'bn' ? 'চৌহদ্দি ও সীমানা' : 'Boundaries'}</span>
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {bNorth && (
                <div>
                  <span className="block text-[11px] text-ink-muted">
                    {locale === 'bn' ? 'উত্তর' : 'North'}
                  </span>
                  <span className="font-semibold text-ink">{bNorth}</span>
                </div>
              )}
              {bSouth && (
                <div>
                  <span className="block text-[11px] text-ink-muted">
                    {locale === 'bn' ? 'দক্ষিণ' : 'South'}
                  </span>
                  <span className="font-semibold text-ink">{bSouth}</span>
                </div>
              )}
              {bEast && (
                <div>
                  <span className="block text-[11px] text-ink-muted">
                    {locale === 'bn' ? 'পূর্ব' : 'East'}
                  </span>
                  <span className="font-semibold text-ink">{bEast}</span>
                </div>
              )}
              {bWest && (
                <div>
                  <span className="block text-[11px] text-ink-muted">
                    {locale === 'bn' ? 'পশ্চিম' : 'West'}
                  </span>
                  <span className="font-semibold text-ink">{bWest}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Linked Public Documents & Land Map (simple rows with arrow, gated server-side) */}
        {(relatedDocuments.length > 0 || relatedLandMap) && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-primary-dark uppercase tracking-wider">
              {locale === 'bn' ? 'সংযুক্ত দলিল ও নকশা' : 'Linked Records'}
            </h3>
            <div className="divide-y divide-sand rounded-xl border border-sand bg-surface overflow-hidden">
              {relatedDocuments.map((doc) => {
                const docTitle = getLocalized(doc, 'title');
                if (!docTitle) return null;
                return (
                  <a
                    key={doc.id}
                    href={`/api/public/documents/${doc.id}/file`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-3 px-3.5 py-3 hover:bg-canvas-alt transition-colors min-h-[44px]"
                  >
                    <span className="flex items-center gap-2.5 min-w-0 text-[13px] font-semibold text-primary-dark">
                      <FileText className="w-4 h-4 text-gold-text flex-shrink-0" aria-hidden="true" />
                      <span className="truncate">{docTitle}</span>
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-ink-muted flex-shrink-0" aria-hidden="true" />
                  </a>
                );
              })}

              {relatedLandMap && getLocalized(relatedLandMap, 'title') && (
                <Link
                  to={`/land-maps?map=${relatedLandMap.id}`}
                  onClick={onClose}
                  className="flex items-center justify-between gap-3 px-3.5 py-3 hover:bg-canvas-alt transition-colors min-h-[44px]"
                >
                  <span className="flex items-center gap-2.5 min-w-0 text-[13px] font-semibold text-primary-dark">
                    <MapIcon className="w-4 h-4 text-primary flex-shrink-0" aria-hidden="true" />
                    <span className="truncate">{getLocalized(relatedLandMap, 'title')}</span>
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-ink-muted flex-shrink-0" aria-hidden="true" />
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
