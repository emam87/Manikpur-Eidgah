import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  Filter,
  Sparkles,
  MapPin,
  Calendar,
  X,
  User,
  Award,
  ChevronRight,
} from 'lucide-react';
import { SEO } from '../components/common/SEO.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { BottomSheet } from '../components/common/BottomSheet.jsx';
import { Breadcrumb } from '../components/common/Breadcrumb.jsx';
import { ImageWithBlur } from '../components/common/ImageWithBlur.jsx';
import { EightPointStar, StarDivider } from '../components/common/EightPointStar.jsx';
import { getImageUrl } from '../utils/imageUrl.js';

function LifetimeMemberCard({
  member,
  index,
  locale,
  toBanglaNum,
  formatBDT,
  getLocalized,
  globalShowAmount,
  onSelect,
}) {
  const name = getLocalized(member, 'name');
  if (locale === 'en' && !name) return null;

  const fatherName = getLocalized(member, 'fatherName');
  const address = getLocalized(member, 'address');
  const photoUrl = member.photoPath ? getImageUrl(member.photoPath) : null;
  const memberNo =
    locale === 'bn'
      ? toBanglaNum(member.membershipNo || member.id)
      : member.membershipNo || member.id;
  const rawAmount = member.amountPaid ?? member.amount;
  const hasAmount =
    globalShowAmount &&
    rawAmount !== null &&
    rawAmount !== undefined &&
    Number(rawAmount) > 0;

  const handleMouseMove = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--spot-x', `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty('--spot-y', `${e.clientY - rect.top}px`);
  }, []);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(member)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(member);
        }
      }}
      onMouseMove={handleMouseMove}
      style={{ animationDelay: `${Math.min(index, 10) * 45}ms` }}
      className="group member-card-premium relative rounded-2xl border border-gold/45 hover:border-gold p-3.5 sm:p-4 pl-4 sm:pl-5 shadow-sakinah-sm cursor-pointer active:scale-[0.99] tap-feedback overflow-hidden ring-1 ring-inset ring-gold/15 hover:ring-gold/40 animate-fade-in opacity-0"
    >
      {/* Metallic Gold Left Ribbon Bar */}
      <div
        className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-gold-plate-from via-gold to-gold-text group-hover:w-2 transition-all duration-300"
        aria-hidden="true"
      />

      {/* Top Subtle Gold Highlight Line */}
      <div
        className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-300"
        aria-hidden="true"
      />

      {/* Pointer-Tracking Warm Golden Spotlight */}
      <div
        className="member-card-spotlight pointer-events-none absolute inset-0"
        aria-hidden="true"
      />

      {/* Glossy Diagonal Gold-Foil Sheen Sweep on Hover */}
      <div
        className="member-card-sheen pointer-events-none absolute -inset-y-4 -left-1/3 w-2/3"
        aria-hidden="true"
      />

      {/* Subtle Islamic 8-Point Star Watermark */}
      <EightPointStar
        className="pointer-events-none absolute -right-4 -bottom-4 w-24 h-24 text-gold opacity-[0.07] group-hover:opacity-[0.16] group-hover:rotate-45 group-hover:scale-110 transition-all duration-700 ease-heritage"
        filled={false}
      />

      <div className="relative z-10 flex items-center gap-3.5 sm:gap-4">
        {/* Left: Double-Framed Arch Portrait Photo with Golden Halo */}
        <div className="relative flex-shrink-0">
          <div className="p-[2px] rounded-t-full rounded-b-xl bg-gradient-to-b from-gold-plate-from via-gold to-gold-text/80 shadow-sakinah-sm group-hover:shadow-gold-glow transition-shadow duration-300">
            <div className="w-16 h-[74px] sm:w-20 sm:h-24 rounded-t-full rounded-b-[10px] overflow-hidden bg-primary-soft flex items-center justify-center ring-1 ring-inset ring-white/40">
              {photoUrl ? (
                <ImageWithBlur
                  src={photoUrl}
                  alt={name}
                  aspectRatio=""
                  className="w-full h-full"
                  imageClassName="group-hover:scale-105"
                />
              ) : (
                <span className="font-serif text-2xl sm:text-3xl font-bold text-primary-dark group-hover:scale-110 transition-transform duration-300">
                  {name?.charAt(0) || 'M'}
                </span>
              )}
            </div>
          </div>

          {/* Tiny Golden Star Crest at Portrait Base */}
          <span
            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-surface border border-gold/70 shadow-sm flex items-center justify-center group-hover:scale-110 group-hover:border-gold transition-transform duration-300"
            aria-hidden="true"
          >
            <EightPointStar className="w-3 h-3 text-gold-text" />
          </span>
        </div>

        {/* Center: Identity & Details */}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary-soft/90 text-primary-dark text-[11px] font-bold border border-gold/40 shadow-sm group-hover:border-gold/70 transition-colors">
              <Award className="w-3 h-3 text-gold-text shrink-0" aria-hidden="true" />
              <span className="tabular-nums">#{memberNo}</span>
            </span>

            {member.memberSince && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-canvas-alt/80 text-[11px] font-semibold text-ink-muted border border-sand/70">
                <Calendar className="w-2.5 h-2.5 text-gold-text shrink-0" aria-hidden="true" />
                <span className="tabular-nums">
                  {locale === 'bn' ? toBanglaNum(member.memberSince) : member.memberSince}
                </span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <h3 className="font-serif font-bold text-base sm:text-lg text-primary-dark group-hover:text-primary leading-snug truncate transition-colors">
              {name}
            </h3>
            <ChevronRight
              className="w-4 h-4 text-gold-text/60 group-hover:text-gold-text group-hover:translate-x-0.5 transition-all shrink-0 opacity-0 sm:opacity-70 group-hover:opacity-100"
              aria-hidden="true"
            />
          </div>

          {fatherName && (
            <p className="text-xs text-ink-muted truncate flex items-center gap-1.5">
              <User className="w-3 h-3 text-gold-text shrink-0" aria-hidden="true" />
              <span className="truncate">
                {locale === 'bn' ? 'পিতা: ' : 'Father: '}
                {fatherName}
              </span>
            </p>
          )}

          {address && (
            <p className="text-xs text-ink-muted truncate flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-primary/75 shrink-0" aria-hidden="true" />
              <span className="truncate">{address}</span>
            </p>
          )}

          {/* Mobile Amount Plate (shown inline below details on narrow phones < 640px) */}
          {hasAmount && (
            <div className="sm:hidden pt-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-gold-plate gold-plate-premium border border-gold/80">
                <Sparkles className="w-3 h-3 text-ink/75 shrink-0" aria-hidden="true" />
                <span className="text-[10px] font-bold uppercase tracking-wide text-ink/80">
                  {locale === 'bn' ? 'অনুদান' : 'Amount'}
                </span>
                <span className="w-px h-3 bg-ink/20" aria-hidden="true" />
                <span className="font-serif font-extrabold text-sm text-ink tabular-nums whitespace-nowrap">
                  {formatBDT(rawAmount)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Prominent Engraved Gold-Plate Taka Amount (sm+ horizontal layout) */}
        {hasAmount && (
          <div className="hidden sm:flex flex-col items-end justify-center shrink-0 pl-2">
            <div className="px-3.5 py-2 rounded-xl bg-gold-plate gold-plate-premium border border-gold/85 text-right">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-ink/75 leading-none">
                <Sparkles className="w-2.5 h-2.5 text-ink/70" aria-hidden="true" />
                <span>{locale === 'bn' ? 'অনুদান' : 'Contribution'}</span>
              </span>
              <span className="block font-serif font-extrabold text-base lg:text-lg text-ink tabular-nums leading-tight mt-1 whitespace-nowrap">
                {formatBDT(rawAmount)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function LifetimeMembers() {
  const { locale, t, toBanglaNum, formatBDT, getLocalized } = useLanguage();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [sortBy, setSortBy] = useState('membership_no');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [availableYears, setAvailableYears] = useState([]);
  const [globalShowAmount, setGlobalShowAmount] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  // Reset & load page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
    loadMembers(1, false);
  }, [searchQuery, selectedYear, sortBy]);

  const loadMembers = async (page = 1, append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        sort: sortBy,
      });
      if (searchQuery.trim()) params.append('q', searchQuery.trim());
      if (selectedYear) params.append('year', selectedYear);

      const res = await fetch(`/api/public/members?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load members');
      const data = await res.json();
      if (data.success) {
        if (append) {
          setMembers((prev) => [...prev, ...(data.members || [])]);
        } else {
          setMembers(data.members || []);
        }
        setPagination(data.pagination || { page, limit: 20, total: 0, totalPages: 1 });
        if (data.years && data.years.length > 0) {
          setAvailableYears(data.years);
        }
        setGlobalShowAmount(data.globalShowAmount);
      }
    } catch (err) {
      console.error('Error fetching members:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    loadMembers(nextPage, true);
  };

  const hasMore = members.length < pagination.total;

  return (
    <div className="py-4 sm:py-8 page-enter">
      <SEO title={t('members.title')} description={t('members.subtitle')} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <Breadcrumb items={[{ label: t('members.title') }]} />

        {/* Page Title & Total Count Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-sand pb-3">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-primary-dark tracking-tight">
              {t('members.title')}
            </h1>
            <p className="text-xs sm:text-sm text-ink-muted mt-0.5">
              {t('members.subtitle')}
            </p>
          </div>
          <div className="text-xs font-semibold text-primary-dark bg-primary-soft px-3 py-1 rounded-full border border-primary/20 w-fit">
            <span>{t('members.total_count')}: </span>
            <span className="font-bold tabular-nums">
              {locale === 'bn' ? toBanglaNum(pagination.total) : pagination.total}
            </span>
            <span>{locale === 'bn' ? ' জন' : ''}</span>
          </div>
        </div>

        {/* Sticky Search Field + Filter Button */}
        <div className="sticky top-14 sm:top-16 z-20 bg-canvas/95 backdrop-blur-md py-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder={t('members.search_placeholder') || 'Search by name or number...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-sand bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 shadow-sakinah-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-ink-muted hover:text-ink"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Button (Opens Bottom Sheet) */}
            <button
              type="button"
              onClick={() => setFilterSheetOpen(true)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-bold shadow-sakinah-sm transition-all min-h-[44px] tap-feedback shrink-0 ${selectedYear || sortBy !== 'membership_no'
                ? 'bg-primary text-white border-primary'
                : 'bg-surface text-primary-dark border-sand hover:bg-primary-soft/50'
                }`}
              aria-label="Open filter options"
            >
              <Filter className="w-4 h-4" />
              <span>{locale === 'bn' ? 'ফিল্টার' : 'Filter'}</span>
              {(selectedYear || sortBy !== 'membership_no') && (
                <span className="w-2 h-2 rounded-full bg-gold" />
              )}
            </button>
          </div>
        </div>

        {/* Members List: Horizontal Premium Cards */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-28 sm:h-32 rounded-2xl bg-surface border border-sand animate-pulse"
              />
            ))}
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-16 bg-surface rounded-2xl border border-sand shadow-sakinah-sm space-y-3">
            <Users className="w-10 h-10 text-ink-muted/50 mx-auto" />
            <h3 className="font-serif text-lg font-bold text-primary-dark">
              {locale === 'bn' ? 'কোনো সদস্য পাওয়া যায়নি' : 'No Members Found'}
            </h3>
            <p className="text-xs text-ink-muted">
              {locale === 'bn'
                ? 'অনুসন্ধান বা ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন।'
                : 'Try adjusting your search criteria.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-4">
            {members.map((member, index) => (
              <LifetimeMemberCard
                key={member.id}
                member={member}
                index={index}
                locale={locale}
                toBanglaNum={toBanglaNum}
                formatBDT={formatBDT}
                getLocalized={getLocalized}
                globalShowAmount={globalShowAmount}
                onSelect={setSelectedMember}
              />
            ))}
          </div>
        )}

        {/* Load More Button (No numbered pagination) */}
        {!loading && hasMore && (
          <div className="text-center pt-4 pb-6">
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-surface border border-sand hover:border-primary/40 text-primary-dark text-sm font-bold shadow-sakinah-sm hover:shadow-sakinah-card transition-all disabled:opacity-50 min-h-[46px] tap-feedback"
            >
              {loadingMore ? (
                <span>{locale === 'bn' ? 'লোড হচ্ছে...' : 'Loading...'}</span>
              ) : (
                <span>
                  {locale === 'bn' ? 'আরও দেখুন (২০টি)' : 'Load More (20)'}
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Filter Bottom Sheet */}
      <BottomSheet
        isOpen={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        title={locale === 'bn' ? 'সদস্য তালিকা ফিল্টার' : 'Filter Members'}
      >
        <div className="space-y-4 py-2 text-ink">
          {/* Year Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-primary-dark uppercase tracking-wider">
              {locale === 'bn' ? 'যোগদানের বছর' : 'Enrollment Year'}
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-sand bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 min-h-[44px]"
            >
              <option value="">{locale === 'bn' ? 'সব বছর' : 'All Years'}</option>
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {locale === 'bn' ? `${toBanglaNum(y)} সাল` : y}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-primary-dark uppercase tracking-wider">
              {locale === 'bn' ? 'ক্রমানুসার' : 'Sort Order'}
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-sand bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 min-h-[44px]"
            >
              <option value="membership_no">{t('members.sort_no_asc') || 'By Member No'}</option>
              <option value="name">{t('members.sort_name_asc') || 'By Name'}</option>
              <option value="member_since">{t('members.sort_year_desc') || 'By Year'}</option>
              {globalShowAmount && (
                <option value="amount">
                  {locale === 'bn' ? 'অনুদানের পরিমাণ অনুসারে' : 'By Amount'}
                </option>
              )}
            </select>
          </div>

          <div className="flex gap-2 pt-3">
            <button
              type="button"
              onClick={() => {
                setSelectedYear('');
                setSortBy('membership_no');
                setFilterSheetOpen(false);
              }}
              className="flex-1 py-2.5 rounded-xl border border-sand text-xs font-bold text-ink-muted hover:bg-canvas-alt transition-colors min-h-[44px]"
            >
              {locale === 'bn' ? 'রিসেট' : 'Reset'}
            </button>
            <button
              type="button"
              onClick={() => setFilterSheetOpen(false)}
              className="flex-1 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-sakinah-sm transition-all min-h-[44px]"
            >
              {locale === 'bn' ? 'প্রয়োগ করুন' : 'Apply'}
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* Member Profile Detail BottomSheet with Royal Gold-Plate Certificate Presentation */}
      <BottomSheet
        isOpen={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        title={t('members.certificate_badge') || (locale === 'bn' ? 'আজীবন সদস্য সনদ' : 'Lifetime Member')}
        subtitle={
          selectedMember
            ? `${t('members.member_no')}: #${
                locale === 'bn'
                  ? toBanglaNum(selectedMember.membershipNo || selectedMember.id)
                  : selectedMember.membershipNo || selectedMember.id
              }`
            : ''
        }
      >
        {selectedMember && (
          <div className="certificate-frame bg-star-pattern-light relative rounded-2xl border border-gold/55 p-5 sm:p-6 overflow-hidden text-ink">
            {/* Ornamental Corner Accents */}
            <span className="pointer-events-none absolute top-2.5 left-2.5 w-4 h-4 border-t-2 border-l-2 border-gold/70 rounded-tl-sm" aria-hidden="true" />
            <span className="pointer-events-none absolute top-2.5 right-2.5 w-4 h-4 border-t-2 border-r-2 border-gold/70 rounded-tr-sm" aria-hidden="true" />
            <span className="pointer-events-none absolute bottom-2.5 left-2.5 w-4 h-4 border-b-2 border-l-2 border-gold/70 rounded-bl-sm" aria-hidden="true" />
            <span className="pointer-events-none absolute bottom-2.5 right-2.5 w-4 h-4 border-b-2 border-r-2 border-gold/70 rounded-br-sm" aria-hidden="true" />

            {/* Subtle Background Watermark */}
            <EightPointStar
              className="pointer-events-none absolute -right-8 -top-8 w-36 h-36 text-gold opacity-[0.08]"
              filled={false}
            />

            <div className="relative z-10 flex flex-col items-center text-center space-y-3.5">
              {/* Official Membership Ribbon Badge */}
              <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-primary-soft/90 text-primary-dark font-bold text-xs border border-gold/50 shadow-sm">
                <Award className="w-3.5 h-3.5 text-gold-text" />
                <span>
                  {t('members.member_no')}:{' '}
                  <span className="tabular-nums">
                    #
                    {locale === 'bn'
                      ? toBanglaNum(selectedMember.membershipNo || selectedMember.id)
                      : selectedMember.membershipNo || selectedMember.id}
                  </span>
                </span>
              </div>

              {/* Double-Ringed Arch-Top Portrait with Golden Halo */}
              <div className="relative pt-1">
                <div className="p-[3px] rounded-t-full rounded-b-2xl bg-gradient-to-b from-gold-plate-from via-gold to-gold-text/80 shadow-gold-glow">
                  <div className="w-24 h-32 rounded-t-full rounded-b-[13px] overflow-hidden bg-primary-soft flex items-center justify-center ring-1 ring-inset ring-white/40">
                    {selectedMember.photoPath ? (
                      <img
                        src={getImageUrl(selectedMember.photoPath)}
                        alt={getLocalized(selectedMember, 'name')}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="font-serif text-3xl font-bold text-primary-dark">
                        {getLocalized(selectedMember, 'name')?.charAt(0) || 'M'}
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-surface border border-gold shadow-sm flex items-center justify-center"
                  aria-hidden="true"
                >
                  <EightPointStar className="w-3.5 h-3.5 text-gold-text" />
                </span>
              </div>

              <div className="pt-1">
                <h3 className="font-serif font-bold text-xl sm:text-2xl text-primary-dark leading-snug">
                  {getLocalized(selectedMember, 'name')}
                </h3>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gold-text mt-0.5">
                  {t('members.certificate_badge') || (locale === 'bn' ? 'সম্মানিত আজীবন সদস্য' : 'Honored Lifetime Member')}
                </p>
              </div>

              <StarDivider className="my-1" />

              {/* Structured Info Chips */}
              <div className="w-full space-y-2 text-left">
                {(selectedMember.fatherNameBn || selectedMember.fatherNameEn) && (
                  <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-surface/85 border border-sand/80 text-xs text-ink">
                    <User className="w-3.5 h-3.5 text-gold-text shrink-0" />
                    <span className="text-ink-muted shrink-0">
                      {locale === 'bn' ? 'পিতা:' : 'Father:'}
                    </span>
                    <span className="font-semibold text-primary-dark truncate">
                      {getLocalized(selectedMember, 'fatherName')}
                    </span>
                  </div>
                )}

                {(selectedMember.addressBn || selectedMember.addressEn) && (
                  <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-surface/85 border border-sand/80 text-xs text-ink">
                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="text-ink-muted shrink-0">
                      {locale === 'bn' ? 'ঠিকানা:' : 'Address:'}
                    </span>
                    <span className="font-semibold text-primary-dark truncate">
                      {getLocalized(selectedMember, 'address')}
                    </span>
                  </div>
                )}

                {selectedMember.memberSince && (
                  <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-surface/85 border border-sand/80 text-xs text-ink">
                    <Calendar className="w-3.5 h-3.5 text-gold-text shrink-0" />
                    <span className="text-ink-muted shrink-0">
                      {locale === 'bn' ? 'যোগদানের বছর:' : 'Enrolled Year:'}
                    </span>
                    <span className="font-semibold text-primary-dark tabular-nums">
                      {locale === 'bn'
                        ? `${toBanglaNum(selectedMember.memberSince)} সাল`
                        : selectedMember.memberSince}
                    </span>
                  </div>
                )}
              </div>

              {/* Contribution Amount (Engraved Gold Plate) */}
              {globalShowAmount &&
                (selectedMember.amountPaid ?? selectedMember.amount) &&
                Number(selectedMember.amountPaid ?? selectedMember.amount) > 0 && (
                  <div className="w-full py-3.5 px-4 rounded-xl bg-gold-plate gold-plate-premium border border-gold/90 text-ink flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink/80">
                      <Sparkles className="w-3.5 h-3.5 text-ink/75" />
                      <span>{locale === 'bn' ? 'মোট অনুদান' : 'Total Contribution'}</span>
                    </span>
                    <span className="font-serif font-extrabold text-lg sm:text-xl tabular-nums">
                      {formatBDT(selectedMember.amountPaid ?? selectedMember.amount)}
                    </span>
                  </div>
                )}

              {/* Bio or Notes */}
              {(selectedMember.notesBn || selectedMember.notesEn) && (
                <div className="w-full pt-3 border-t border-gold/25 text-left text-xs leading-relaxed text-ink-muted">
                  <p className="font-bold text-primary-dark mb-1">
                    {locale === 'bn' ? 'মন্তব্য / তথ্য:' : 'Notes:'}
                  </p>
                  <p className="whitespace-pre-line">{getLocalized(selectedMember, 'notes')}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
