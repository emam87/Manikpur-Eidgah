import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  ArrowUpDown,
  Sparkles,
  MapPin,
  Calendar,
  X,
  User,
} from 'lucide-react';
import { SEO } from '../components/common/SEO.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { BottomSheet } from '../components/common/BottomSheet.jsx';
import { Breadcrumb } from '../components/common/Breadcrumb.jsx';
import { ImageWithBlur } from '../components/common/ImageWithBlur.jsx';
import { getImageUrl } from '../utils/imageUrl.js';

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
              className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-bold shadow-sakinah-sm transition-all min-h-[44px] tap-feedback shrink-0 ${
                selectedYear || sortBy !== 'membership_no'
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

        {/* Members List: Mobile 56px Card List, Desktop Grid */}
        {loading ? (
          <div className="space-y-3 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:space-y-0 sm:gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-20 sm:h-64 rounded-2xl bg-surface border border-sand animate-pulse"
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
          <div className="space-y-2.5 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:space-y-0 sm:gap-4">
            {members.map((member) => {
              const name = getLocalized(member, 'name');
              if (locale === 'en' && !name) return null;
              const photoUrl = member.photoPath ? getImageUrl(member.photoPath) : null;
              const memberNo = locale === 'bn' ? toBanglaNum(member.membershipNo || member.id) : member.membershipNo || member.id;

              return (
                <div
                  key={member.id}
                  onClick={() => setSelectedMember(member)}
                  className="bg-surface rounded-2xl border border-sand hover:border-gold/60 p-3 sm:p-5 shadow-sakinah-sm hover:shadow-sakinah-card transition-all cursor-pointer flex items-center gap-3.5 sm:flex-col sm:text-center active:scale-[0.98] tap-feedback overflow-hidden"
                >
                  {/* Photo: 56px square on mobile, arch frame on desktop */}
                  <div className="w-14 h-14 sm:w-24 sm:h-28 rounded-xl sm:rounded-t-full sm:rounded-b-lg overflow-hidden bg-primary-soft border border-sand flex-shrink-0 flex items-center justify-center">
                    {photoUrl ? (
                      <ImageWithBlur
                        src={photoUrl}
                        alt={name}
                        aspectRatio=""
                        className="w-full h-full"
                      />
                    ) : (
                      <span className="font-serif text-xl sm:text-3xl font-bold text-primary-dark">
                        {name?.charAt(0) || 'M'}
                      </span>
                    )}
                  </div>

                  {/* Info: 1 key fact on mobile */}
                  <div className="min-w-0 flex-1 sm:w-full">
                    <div className="flex items-center gap-1.5 sm:justify-center mb-0.5">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-primary-soft text-primary-dark text-[10px] font-bold border border-primary/20">
                        #{memberNo}
                      </span>
                      {member.memberSince && (
                        <span className="text-[11px] text-ink-muted sm:hidden">
                          • {locale === 'bn' ? toBanglaNum(member.memberSince) : member.memberSince}
                        </span>
                      )}
                    </div>

                    <h3 className="font-serif font-bold text-sm sm:text-base text-primary-dark truncate">
                      {name}
                    </h3>

                    {/* Single Key Fact: Amount or enrolled year */}
                    <p className="text-xs text-gold-text font-semibold truncate mt-0.5">
                      {globalShowAmount && member.amount
                        ? `${formatBDT(member.amount)}`
                        : `${locale === 'bn' ? 'যোগদান: ' : 'Enrolled: '}${locale === 'bn' ? toBanglaNum(member.memberSince || '—') : member.memberSince || '—'}`}
                    </p>
                  </div>
                </div>
              );
            })}
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

      {/* Member Profile Detail BottomSheet with Full Gold-Plate / Certificate Presentation */}
      <BottomSheet
        isOpen={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        title={selectedMember ? getLocalized(selectedMember, 'name') : ''}
      >
        {selectedMember && (
          <div className="flex flex-col items-center text-center space-y-3.5 py-2 text-ink">
            {/* Membership Ribbon Badge */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-primary-soft text-primary-dark font-bold text-xs border border-primary/20">
              <Sparkles className="w-3.5 h-3.5 text-gold-text" />
              <span>
                {t('members.member_no')}:{' '}
                {locale === 'bn'
                  ? toBanglaNum(selectedMember.membershipNo || selectedMember.id)
                  : selectedMember.membershipNo || selectedMember.id}
              </span>
            </div>

            {/* Arch-Top Photo */}
            <div className="w-24 h-32 rounded-t-full rounded-b-xl border-2 border-gold/70 overflow-hidden bg-primary-soft shadow-sakinah-sm flex items-center justify-center">
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

            <h3 className="font-serif font-bold text-xl text-primary-dark">
              {getLocalized(selectedMember, 'name')}
            </h3>

            {/* Father's Name */}
            {selectedMember.fatherNameBn && (
              <p className="text-xs text-ink-muted flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-gold-text" />
                <span>
                  {locale === 'bn' ? 'পিতা: ' : 'Father: '}
                  {getLocalized(selectedMember, 'fatherName')}
                </span>
              </p>
            )}

            {/* Address */}
            {selectedMember.addressBn && (
              <p className="text-xs text-ink-muted flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-gold-text" />
                <span>{getLocalized(selectedMember, 'address')}</span>
              </p>
            )}

            {/* Member Since */}
            {selectedMember.memberSince && (
              <p className="text-xs text-ink-muted flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-gold-text" />
                <span>
                  {locale === 'bn' ? 'যোগদানের বছর: ' : 'Enrolled Year: '}
                  {locale === 'bn' ? toBanglaNum(selectedMember.memberSince) : selectedMember.memberSince}
                </span>
              </p>
            )}

            {/* Contribution Amount (Gold Plate) */}
            {globalShowAmount && selectedMember.amount && (
              <div className="w-full py-2.5 px-4 rounded-xl bg-gold-plate text-ink font-bold text-sm shadow-sakinah-sm">
                <span>{locale === 'bn' ? 'মোট অনুদান: ' : 'Total Contribution: '}</span>
                <span>{formatBDT(selectedMember.amount)}</span>
              </div>
            )}

            {/* Bio or Notes */}
            {(selectedMember.notesBn || selectedMember.notesEn) && (
              <div className="w-full pt-3 border-t border-sand text-left text-xs leading-relaxed text-ink-muted">
                <p className="font-bold text-primary-dark mb-1">
                  {locale === 'bn' ? 'মন্তব্য / তথ্য:' : 'Notes:'}
                </p>
                <p className="whitespace-pre-line">{getLocalized(selectedMember, 'notes')}</p>
              </div>
            )}
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
