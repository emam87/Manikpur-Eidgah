import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Landmark,
  Search,
  Filter,
  X,
  RotateCcw,
} from 'lucide-react';
import { SEO } from '../components/common/SEO.jsx';
import { Breadcrumb } from '../components/common/Breadcrumb.jsx';
import { BottomSheet } from '../components/common/BottomSheet.jsx';
import { LandDonorCard, LandDonorCardSkeleton } from '../components/land-donors/LandDonorCard.jsx';
import { LandDonorDetailSheet } from '../components/land-donors/LandDonorDetailSheet.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import {
  formatAreaPlate,
  convertFromDecimal,
  getHonorificPrefix,
} from '../utils/landDonorHelpers.js';

const DENSITY_STORAGE_KEY = 'eidgah_land_donor_density';

export function LandDonors() {
  const { locale, toBanglaNum, formatDate, getLocalized } = useLanguage();
  const { showToast } = useToast();

  const [donors, setDonors] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Filters & controls
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedLandUse, setSelectedLandUse] = useState('');
  const [selectedDonationType, setSelectedDonationType] = useState('');
  const [selectedMouza, setSelectedMouza] = useState('');
  const [selectedDeceased, setSelectedDeceased] = useState('');
  const [sortOrder, setSortOrder] = useState('custom');
  const [displayUnit, setDisplayUnit] = useState('decimal');
  const [density, setDensity] = useState(() => {
    try {
      const saved = localStorage.getItem(DENSITY_STORAGE_KEY);
      return saved === 'compact' ? 'compact' : 'comfortable';
    } catch {
      return 'comfortable';
    }
  });

  // Modals / Sheets
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Pagination (20 per page)
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });

  const handleDensityChange = (next) => {
    setDensity(next);
    try {
      localStorage.setItem(DENSITY_STORAGE_KEY, next);
    } catch {
      // Ignore storage errors
    }
  };

  const activeFilterCount = [
    selectedYear,
    selectedLandUse,
    selectedDonationType,
    selectedMouza,
    selectedDeceased,
    sortOrder !== 'custom' ? sortOrder : '',
  ].filter(Boolean).length;

  const hasAnySearchOrFilter = Boolean(searchQuery.trim() || activeFilterCount > 0);

  const loadDonors = useCallback(
    async (page = 1, append = false) => {
      if (append) setLoadingMore(true);
      else setLoading(true);

      try {
        const params = new URLSearchParams();
        params.set('lang', locale);
        params.set('page', String(page));
        params.set('limit', '20');
        if (searchQuery.trim()) params.set('q', searchQuery.trim());
        if (selectedYear) params.set('year', selectedYear);
        if (selectedLandUse) params.set('landUse', selectedLandUse);
        if (selectedDonationType) params.set('donationType', selectedDonationType);
        if (selectedMouza) params.set('mouza', selectedMouza);
        if (selectedDeceased) params.set('isDeceased', selectedDeceased);
        if (sortOrder) params.set('sort', sortOrder);

        const res = await fetch(`/api/public/land-donors?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch land donors');
        const data = await res.json();
        if (data && data.success) {
          if (append) {
            setDonors((prev) => [...prev, ...(data.donors || [])]);
          } else {
            setDonors(data.donors || []);
          }
          if (data.summary) setSummary(data.summary);
          setPagination(
            data.pagination || {
              page,
              limit: 20,
              total: data.donors?.length || 0,
              totalPages: 1,
            }
          );
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [
      locale,
      searchQuery,
      selectedYear,
      selectedLandUse,
      selectedDonationType,
      selectedMouza,
      selectedDeceased,
      sortOrder,
    ]
  );

  // Reset to page 1 on filter/search/locale change
  useEffect(() => {
    setCurrentPage(1);
    loadDonors(1, false);
  }, [loadDonors]);

  const handleLoadMore = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    loadDonors(nextPage, true);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedYear('');
    setSelectedLandUse('');
    setSelectedDonationType('');
    setSelectedMouza('');
    setSelectedDeceased('');
    setSortOrder('custom');
  };

  // Slim summary line: "১২ জন জমিদাতা, মোট ২৪০ শতাংশ জমি" / "12 land donors, 240 decimals of land total"
  const summaryLine = useMemo(() => {
    if (!summary && loading) return '';
    const count = pagination.total ?? summary?.filteredDonors ?? donors.length;
    const totalDec =
      summary?.filteredLandInDecimal !== undefined
        ? summary.filteredLandInDecimal
        : summary?.totalLandInDecimal || 0;
    const converted = convertFromDecimal(
      totalDec,
      displayUnit,
      summary?.conversionFactors,
      locale,
      toBanglaNum
    );

    if (locale === 'bn') {
      return `${toBanglaNum(count, true)} জন জমিদাতা, মোট ${converted.summaryText} জমি`;
    }
    const donorWord = count === 1 ? 'land donor' : 'land donors';
    return `${count} ${donorWord}, ${converted.summaryText} of land total`;
  }, [summary, pagination.total, donors.length, displayUnit, locale, toBanglaNum, loading]);

  // Bilingual mouza options strictly matching active locale (zero Bengali in en mode)
  const mouzaOptions = useMemo(() => {
    if (Array.isArray(summary?.mouzaOptions) && summary.mouzaOptions.length > 0) {
      return summary.mouzaOptions
        .map((m) => {
          const label = locale === 'bn' ? m.bn : m.en;
          return label ? { value: label, label } : null;
        })
        .filter(Boolean);
    }
    if (locale === 'bn' && Array.isArray(summary?.mouzas)) {
      return summary.mouzas.map((m) => ({ value: m, label: m }));
    }
    return [];
  }, [summary, locale]);

  const handleShare = (donor) => {
    const name = getLocalized(donor, 'name');
    const honorific = getHonorificPrefix(name, donor.isDeceased, locale);
    const fullName = honorific ? `${honorific} ${name}` : name;
    const areaPlate = formatAreaPlate(
      donor.areaValue,
      donor.areaUnit || donor.unit,
      locale,
      toBanglaNum
    );

    const text =
      locale === 'bn'
        ? `${fullName} — মানিকপুর ঈদগাহের জমিদাতা। দানকৃত জমি: ${areaPlate.full}।`
        : `${fullName} — Land donor of Manikpur Eidgah. Donated land: ${areaPlate.full}.`;

    if (navigator.share) {
      navigator.share({ title: fullName, text, url: window.location.href }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(`${text}\n${window.location.href}`).then(() => {
        setCopied(true);
        if (showToast) {
          showToast(
            locale === 'bn' ? 'তথ্য ও লিংক কপি হয়েছে' : 'Details copied to clipboard'
          );
        }
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const hasMore = donors.length < pagination.total;

  return (
    <div className="py-4 sm:py-6 page-enter">
      <SEO
        title={locale === 'bn' ? 'জমিদাতা তালিকা' : 'Land Donors'}
        description={
          locale === 'bn'
            ? 'মানিকপুর ঈদগাহের ওয়াকফ ও দানকৃত জমির সম্মানিত দাতাগণের তালিকা।'
            : 'Archive of honored land donors who dedicated waqf land to Manikpur Eidgah.'
        }
      />

      {/* Full width minus 16px screen padding on mobile (px-4), centered max-w-6xl on desktop */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <Breadcrumb items={[{ label: locale === 'bn' ? 'জমিদাতা' : 'Land Donors' }]} />

        {/* Minimal Page Header (no redundant stats banner) */}
        <header className="space-y-0.5">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-primary-dark tracking-tight">
            {locale === 'bn' ? 'জমিদাতা তালিকা' : 'Land Donors'}
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted">
            {locale === 'bn'
              ? 'মানিকপুর ঈদগাহের সম্মানিত ওয়াকফ ও ভূমি দাতাগণ'
              : 'Honored patrons who dedicated land to Manikpur Eidgah'}
          </p>
        </header>

        {/* Sticky Search + Single Filter Button */}
        <div className="sticky top-14 sm:top-16 z-20 bg-canvas/95 py-2 -mx-4 px-4 sm:mx-0 sm:px-0 border-b border-sand/60">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 min-w-0">
              <Search
                className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  locale === 'bn'
                    ? 'নাম, পিতা, গ্রাম বা মৌজা খুঁজুন...'
                    : 'Search name, father, village, mouza...'
                }
                aria-label={locale === 'bn' ? 'জমিদাতা খুঁজুন' : 'Search land donors'}
                className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-sand bg-surface text-ink text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-gold/60 shadow-sakinah-sm min-h-[44px]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 text-ink-muted hover:text-ink min-w-[36px] min-h-[36px] flex items-center justify-center"
                  aria-label={locale === 'bn' ? 'অনুসন্ধান মুছুন' : 'Clear search'}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setFilterSheetOpen(true)}
              className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-bold shadow-sakinah-sm transition-colors min-h-[44px] min-w-[44px] tap-feedback shrink-0 ${
                activeFilterCount > 0
                  ? 'bg-primary text-white border-primary'
                  : 'bg-surface text-primary-dark border-sand hover:bg-primary-soft/50'
              }`}
              aria-label={locale === 'bn' ? 'ফিল্টার ও সাজানো' : 'Open filter options'}
            >
              <Filter className="w-4 h-4" aria-hidden="true" />
              <span>{locale === 'bn' ? 'ফিল্টার' : 'Filter'}</span>
              {activeFilterCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-gold text-ink text-[11px] font-bold tabular-nums">
                  {locale === 'bn' ? toBanglaNum(activeFilterCount, true) : activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* One Slim Summary Line Above the List (Results count shown strictly once) */}
        {!loading && summaryLine && (
          <p className="text-[13px] font-medium text-ink-muted tabular-nums" aria-live="polite">
            {summaryLine}
          </p>
        )}

        {/* Land Donors List: Mobile 1-col horizontal cards, md 2-col, xl 3-col */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <LandDonorCardSkeleton key={i} density={density} />
            ))}
          </div>
        ) : donors.length === 0 ? (
          <div className="text-center py-14 px-4 bg-surface rounded-2xl border border-sand shadow-sakinah-sm space-y-3">
            <Landmark className="w-10 h-10 text-ink-muted/50 mx-auto" aria-hidden="true" />
            <h2 className="font-serif text-lg font-bold text-primary-dark">
              {locale === 'bn' ? 'কোনো ফলাফল পাওয়া যায়নি' : 'No results'}
            </h2>
            <p className="text-xs sm:text-sm text-ink-muted max-w-sm mx-auto">
              {locale === 'bn'
                ? 'অনুসন্ধান বা ফিল্টারের সাথে মিল থাকা কোনো জমিদাতা পাওয়া যায়নি।'
                : 'No land donors match your current search or filter settings.'}
            </p>
            {hasAnySearchOrFilter && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-white text-xs sm:text-sm font-bold shadow-sakinah-sm hover:bg-primary-hover min-h-[44px] tap-feedback"
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{locale === 'bn' ? 'ফিল্টার মুছুন' : 'Clear filters'}</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
            {donors.map((donor, index) => (
              <LandDonorCard
                key={donor.id}
                donor={donor}
                index={index}
                density={density}
                locale={locale}
                toBanglaNum={toBanglaNum}
                getLocalized={getLocalized}
                onSelect={setSelectedDonor}
              />
            ))}
          </div>
        )}

        {/* Load More Button (20 per page) */}
        {!loading && hasMore && (
          <div className="text-center pt-3 pb-6">
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-surface border border-sand hover:border-primary/40 text-primary-dark text-sm font-bold shadow-sakinah-sm transition-colors disabled:opacity-50 min-h-[46px] tap-feedback"
            >
              {loadingMore
                ? locale === 'bn'
                  ? 'লোড হচ্ছে...'
                  : 'Loading...'
                : locale === 'bn'
                  ? 'আরও দেখুন (২০টি)'
                  : 'Load more'}
            </button>
          </div>
        )}
      </div>

      {/* Filter & Display Preferences Bottom Sheet */}
      <BottomSheet
        isOpen={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        title={locale === 'bn' ? 'ফিল্টার ও সাজানো' : 'Filter & Sort'}
      >
        <div className="space-y-4 py-1 text-ink pb-safe">
          {/* Density Control: Comfortable / Compact */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-primary-dark uppercase tracking-wider block">
              {locale === 'bn' ? 'কার্ডের ঘনত্ব' : 'Card Density'}
            </label>
            <div className="grid grid-cols-2 gap-1.5 bg-canvas-alt p-1 rounded-xl border border-sand">
              {[
                { key: 'comfortable', label: locale === 'bn' ? 'স্বাচ্ছন্দ্যময়' : 'Comfortable' },
                { key: 'compact', label: locale === 'bn' ? 'সংক্ষিপ্ত' : 'Compact' },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => handleDensityChange(opt.key)}
                  className={`py-2 text-xs font-bold rounded-lg transition-colors min-h-[40px] ${
                    density === opt.key
                      ? 'bg-primary text-white shadow-sakinah-sm'
                      : 'text-ink-muted hover:text-primary-dark'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tiny Unit Switcher for the Summary Line */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-primary-dark uppercase tracking-wider block">
              {locale === 'bn' ? 'মোট জমির একক' : 'Summary Unit'}
            </label>
            <div className="grid grid-cols-4 gap-1 bg-canvas-alt p-1 rounded-xl border border-sand">
              {[
                { key: 'decimal', label: locale === 'bn' ? 'শতাংশ' : 'Decimal' },
                { key: 'katha', label: locale === 'bn' ? 'কাঠা' : 'Katha' },
                { key: 'bigha', label: locale === 'bn' ? 'বিঘা' : 'Bigha' },
                { key: 'acre', label: locale === 'bn' ? 'একর' : 'Acre' },
              ].map((u) => (
                <button
                  key={u.key}
                  type="button"
                  onClick={() => setDisplayUnit(u.key)}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-colors min-h-[38px] ${
                    displayUnit === u.key
                      ? 'bg-primary text-white shadow-sakinah-sm'
                      : 'text-ink-muted hover:text-primary-dark'
                  }`}
                >
                  {u.label}
                </button>
              ))}
            </div>
          </div>

          {/* Donation Year */}
          {Array.isArray(summary?.years) && summary.years.length > 0 && (
            <div className="space-y-1.5">
              <label
                htmlFor="filter-year"
                className="text-xs font-bold text-primary-dark uppercase tracking-wider block"
              >
                {locale === 'bn' ? 'দানের সাল' : 'Donation Year'}
              </label>
              <select
                id="filter-year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-sand bg-surface text-ink text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 min-h-[44px]"
              >
                <option value="">{locale === 'bn' ? 'সকল সাল' : 'All Years'}</option>
                {summary.years.map((y) => (
                  <option key={y} value={y}>
                    {locale === 'bn' ? `${toBanglaNum(y, true)} সাল` : y}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Land Use */}
          <div className="space-y-1.5">
            <label
              htmlFor="filter-land-use"
              className="text-xs font-bold text-primary-dark uppercase tracking-wider block"
            >
              {locale === 'bn' ? 'ব্যবহারের ক্ষেত্র' : 'Land Use'}
            </label>
            <select
              id="filter-land-use"
              value={selectedLandUse}
              onChange={(e) => setSelectedLandUse(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-sand bg-surface text-ink text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 min-h-[44px]"
            >
              <option value="">{locale === 'bn' ? 'সকল ক্ষেত্র' : 'All Land Uses'}</option>
              <option value="EIDGAH_GROUND">{locale === 'bn' ? 'ঈদগাহ ময়দান' : 'Eidgah Ground'}</option>
              <option value="GRAVEYARD">{locale === 'bn' ? 'কবরস্থান' : 'Graveyard'}</option>
              <option value="MOSQUE">{locale === 'bn' ? 'মসজিদ' : 'Mosque'}</option>
              <option value="ROAD">{locale === 'bn' ? 'রাস্তা' : 'Road'}</option>
              <option value="BOUNDARY_WALL">{locale === 'bn' ? 'সীমানা প্রাচীর' : 'Boundary Wall'}</option>
              <option value="OTHER">{locale === 'bn' ? 'অন্যান্য' : 'Other'}</option>
            </select>
          </div>

          {/* Donation Type */}
          <div className="space-y-1.5">
            <label
              htmlFor="filter-donation-type"
              className="text-xs font-bold text-primary-dark uppercase tracking-wider block"
            >
              {locale === 'bn' ? 'দানের ধরন' : 'Donation Type'}
            </label>
            <select
              id="filter-donation-type"
              value={selectedDonationType}
              onChange={(e) => setSelectedDonationType(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-sand bg-surface text-ink text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 min-h-[44px]"
            >
              <option value="">{locale === 'bn' ? 'সকল ধরন' : 'All Types'}</option>
              <option value="DANPATRA">{locale === 'bn' ? 'দানপত্র' : 'Danpatra (Gift Deed)'}</option>
              <option value="WAQF">{locale === 'bn' ? 'ওয়াকফনামা' : 'Waqf Deed'}</option>
              <option value="HEBA">{locale === 'bn' ? 'হেবা দলিল' : 'Heba Deed'}</option>
              <option value="REGISTERED_DEED">{locale === 'bn' ? 'রেজিস্ট্রিকৃত দলিল' : 'Registered Deed'}</option>
              <option value="OTHER">{locale === 'bn' ? 'অন্যান্য' : 'Other'}</option>
            </select>
          </div>

          {/* Mouza (strictly localized) */}
          {mouzaOptions.length > 0 && (
            <div className="space-y-1.5">
              <label
                htmlFor="filter-mouza"
                className="text-xs font-bold text-primary-dark uppercase tracking-wider block"
              >
                {locale === 'bn' ? 'মৌজা' : 'Mouza'}
              </label>
              <select
                id="filter-mouza"
                value={selectedMouza}
                onChange={(e) => setSelectedMouza(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-sand bg-surface text-ink text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 min-h-[44px]"
              >
                <option value="">{locale === 'bn' ? 'সকল মৌজা' : 'All Mouzas'}</option>
                {mouzaOptions.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Living / Deceased */}
          <div className="space-y-1.5">
            <label
              htmlFor="filter-status"
              className="text-xs font-bold text-primary-dark uppercase tracking-wider block"
            >
              {locale === 'bn' ? 'অবস্থা' : 'Status'}
            </label>
            <select
              id="filter-status"
              value={selectedDeceased}
              onChange={(e) => setSelectedDeceased(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-sand bg-surface text-ink text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 min-h-[44px]"
            >
              <option value="">{locale === 'bn' ? 'সকল জমিদাতা' : 'All Donors'}</option>
              <option value="false">{locale === 'bn' ? 'জীবিত' : 'Living'}</option>
              <option value="true">{locale === 'bn' ? 'মরহুম / মরহুমা' : 'Deceased'}</option>
            </select>
          </div>

          {/* Sort Order */}
          <div className="space-y-1.5">
            <label
              htmlFor="filter-sort"
              className="text-xs font-bold text-primary-dark uppercase tracking-wider block"
            >
              {locale === 'bn' ? 'সাজানোর ক্রম' : 'Sort By'}
            </label>
            <select
              id="filter-sort"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-sand bg-surface text-ink text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 min-h-[44px]"
            >
              <option value="custom">{locale === 'bn' ? 'নির্ধারিত ক্রম' : 'Custom Order'}</option>
              <option value="name_asc">{locale === 'bn' ? 'নাম (অ–ক্ষ)' : 'Name (A–Z)'}</option>
              <option value="area_desc">{locale === 'bn' ? 'জমির পরিমাণ (বেশি–কম)' : 'Area (High to Low)'}</option>
              <option value="area_asc">{locale === 'bn' ? 'জমির পরিমাণ (কম–বেশি)' : 'Area (Low to High)'}</option>
              <option value="year_asc">{locale === 'bn' ? 'দানের সাল (পুরাতন–নতুন)' : 'Year (Earliest)'}</option>
              <option value="year_desc">{locale === 'bn' ? 'দানের সাল (নতুন–পুরাতন)' : 'Year (Latest)'}</option>
            </select>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                handleClearFilters();
                setFilterSheetOpen(false);
              }}
              className="flex-1 py-2.5 rounded-xl border border-sand text-xs font-bold text-ink-muted hover:bg-canvas-alt transition-colors min-h-[44px]"
            >
              {locale === 'bn' ? 'রিসেট' : 'Reset'}
            </button>
            <button
              type="button"
              onClick={() => setFilterSheetOpen(false)}
              className="flex-1 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-sakinah-sm transition-colors min-h-[44px]"
            >
              {locale === 'bn' ? 'প্রয়োগ করুন' : 'Apply'}
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* Donor Profile Detail Bottom Sheet (Mobile) / Centered Dialog (Desktop) */}
      <LandDonorDetailSheet
        donor={selectedDonor}
        isOpen={Boolean(selectedDonor)}
        onClose={() => setSelectedDonor(null)}
        conversionFactors={summary?.conversionFactors}
        locale={locale}
        toBanglaNum={toBanglaNum}
        formatDate={formatDate}
        getLocalized={getLocalized}
        onShare={handleShare}
        copied={copied}
      />
    </div>
  );
}
