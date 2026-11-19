import React, { useState, useEffect, useMemo } from 'react';
import {
  Landmark,
  Search,
  Filter,
  MapPin,
  Calendar,
  FileText,
  Share2,
  Check,
  X,
  Compass,
} from 'lucide-react';
import { SEO } from '../components/common/SEO.jsx';
import { Breadcrumb } from '../components/common/Breadcrumb.jsx';
import { BottomSheet } from '../components/common/BottomSheet.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { getImageUrl } from '../utils/imageUrl.js';

export function LandDonors() {
  const { locale, toBanglaNum, getLocalized } = useLanguage();
  const { showToast } = useToast();

  const [donors, setDonors] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLandUse, setSelectedLandUse] = useState('');
  const [selectedDonationType, setSelectedDonationType] = useState('');
  const [selectedMouza, setSelectedMouza] = useState('');
  const [selectedDeceased, setSelectedDeceased] = useState('');
  const [sortOrder, setSortOrder] = useState('custom');

  const [displayUnit, setDisplayUnit] = useState('decimal');
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });

  // Reset to page 1 on filter/search change
  useEffect(() => {
    setCurrentPage(1);
    loadDonors(1, false);
  }, [searchQuery, selectedLandUse, selectedDonationType, selectedMouza, selectedDeceased, sortOrder]);

  const loadDonors = async (page = 1, append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);

    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (selectedLandUse) params.set('landUse', selectedLandUse);
      if (selectedDonationType) params.set('donationType', selectedDonationType);
      if (selectedMouza) params.set('mouza', selectedMouza);
      if (selectedDeceased) params.set('isDeceased', selectedDeceased);
      if (sortOrder) params.set('sort', sortOrder);
      params.set('page', page.toString());
      params.set('limit', '20');

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
        setPagination(data.pagination || { page, limit: 20, total: data.summary?.totalDonors || data.donors?.length || 0, totalPages: 1 });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    loadDonors(nextPage, true);
  };

  const convertedTotalLand = useMemo(() => {
    if (!summary || !summary.totalLandInDecimal) return '০';
    const totalDec = summary.totalLandInDecimal;
    const factors = summary.conversionFactors || { acre: 100, bigha: 33, katha: 1.65, sqft: 435.6 };

    let val = totalDec;
    let unitLabel = locale === 'bn' ? 'শতাংশ' : 'Decimal';

    if (displayUnit === 'katha') {
      val = totalDec / (factors.katha || 1.65);
      unitLabel = locale === 'bn' ? 'কাঠা' : 'Katha';
    } else if (displayUnit === 'bigha') {
      val = totalDec / (factors.bigha || 33);
      unitLabel = locale === 'bn' ? 'বিঘা' : 'Bigha';
    } else if (displayUnit === 'acre') {
      val = totalDec / (factors.acre || 100);
      unitLabel = locale === 'bn' ? 'একর' : 'Acre';
    }

    const formattedNum = locale === 'bn' ? toBanglaNum(Math.round(val * 100) / 100) : Math.round(val * 100) / 100;
    return `${formattedNum} ${unitLabel}`;
  }, [summary, displayUnit, locale, toBanglaNum]);

  const handleShare = (donor) => {
    const donorName = `${donor.isDeceased ? (locale === 'bn' ? 'মরহুম ' : 'Late ') : ''}${getLocalized(donor, 'name')}`;
    const text = `${donorName} - মানিকপুর ঈদগাহের ওয়াকফকৃত জমিদাতা। মোট জমি: ${donor.areaValue} ${donor.unit}।`;
    if (navigator.share) {
      navigator.share({ title: donorName, text, url: window.location.href }).catch(() => { });
    } else {
      navigator.clipboard.writeText(`${text}\n${window.location.href}`).then(() => {
        setCopied(true);
        if (showToast) showToast(locale === 'bn' ? 'লিংক ও তথ্য কপি হয়েছে!' : 'Details copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const landUseLabels = {
    EIDGAH_GROUND: { bn: 'ঈদগাহ ময়দান', en: 'Eidgah Ground' },
    GRAVEYARD: { bn: 'কবরস্থান', en: 'Graveyard' },
    MOSQUE: { bn: 'মসজিদ', en: 'Mosque' },
    ROAD: { bn: 'রাস্তা', en: 'Road' },
    BOUNDARY_WALL: { bn: 'সীমানা প্রাচীর', en: 'Boundary Wall' },
  };

  const hasMore = donors.length < (summary?.totalDonors || pagination.total);

  return (
    <div className="py-4 sm:py-8 page-enter">
      <SEO
        title={locale === 'bn' ? 'ওয়াকফকৃত জমিদাতা সংরক্ষণাগার' : 'Waqf Land Donors'}
        description={locale === 'bn' ? 'মানিকপুর ঈদগাহের ওয়াকফকৃত জমিদাতাদের ঐতিহাসিক তালিকা ও খতিয়ান বিবরণ।' : 'Historical archive of land donors who endowed waqf land to Manikpur Eidgah.'}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <Breadcrumb items={[{ label: locale === 'bn' ? 'জমিদাতা সংরক্ষণাগার' : 'Land Donors' }]} />

        {/* Page Title & Total Summary Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-sand pb-3">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-primary-dark tracking-tight">
              {locale === 'bn' ? 'ওয়াকফকৃত জমিদাতা সংরক্ষণাগার' : 'Waqf Land Donors Archive'}
            </h1>
            <p className="text-xs sm:text-sm text-ink-muted mt-0.5">
              {locale === 'bn'
                ? 'ঈদগাহ ময়দান, কবরস্থান ও রাস্তার জন্য জমিদানকারীদের তথ্য'
                : 'Permanent waqf records of land donors for Manikpur Eidgah'}
            </p>
          </div>
          {summary && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-primary-dark bg-primary-soft px-3 py-1 rounded-full border border-primary/20">
                {locale === 'bn' ? 'মোট জমি: ' : 'Total: '}
                <span className="font-bold tabular-nums">{convertedTotalLand}</span>
              </span>
            </div>
          )}
        </div>

        {/* Sticky Search Field + Filter Button */}
        <div className="sticky top-14 sm:top-16 z-20 bg-canvas/95 backdrop-blur-md py-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder={locale === 'bn' ? 'নাম, পিতা, গ্রাম বা মৌজা দিয়ে খুঁজুন...' : 'Search by name, father, village, mouza...'}
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
                selectedLandUse || selectedDonationType || selectedMouza || selectedDeceased
                  ? 'bg-primary text-white border-primary'
                  : 'bg-surface text-primary-dark border-sand hover:bg-primary-soft/50'
              }`}
              aria-label="Open filter options"
            >
              <Filter className="w-4 h-4" />
              <span>{locale === 'bn' ? 'ফিল্টার' : 'Filter'}</span>
              {(selectedLandUse || selectedDonationType || selectedMouza || selectedDeceased) && (
                <span className="w-2 h-2 rounded-full bg-gold" />
              )}
            </button>
          </div>
        </div>

        {/* Donors List: Mobile 56px Card List, Desktop Grid */}
        {loading ? (
          <div className="space-y-3 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:space-y-0 sm:gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-20 sm:h-64 rounded-2xl bg-surface border border-sand animate-pulse"
              />
            ))}
          </div>
        ) : donors.length === 0 ? (
          <div className="text-center py-16 bg-surface rounded-2xl border border-sand shadow-sakinah-sm space-y-3">
            <Landmark className="w-10 h-10 text-ink-muted/50 mx-auto" />
            <h3 className="font-serif text-lg font-bold text-primary-dark">
              {locale === 'bn' ? 'কোনো জমিদাতার তথ্য পাওয়া যায়নি' : 'No Land Donors Found'}
            </h3>
            <p className="text-xs text-ink-muted">
              {locale === 'bn'
                ? 'অনুসন্ধান বা ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন।'
                : 'Try adjusting your search criteria or filter options.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:space-y-0 sm:gap-4">
            {donors.map((donor) => {
              const name = getLocalized(donor, 'name');
              if (locale === 'en' && !name) return null;
              const photoUrl = donor.photoPath ? getImageUrl(donor.photoPath) : null;
              const honorific = donor.isDeceased ? (locale === 'bn' ? 'মরহুম ' : 'Late ') : '';
              const useLabel = landUseLabels[donor.landUse]?.[locale] || donor.landUse;

              return (
                <div
                  key={donor.id}
                  onClick={() => setSelectedDonor(donor)}
                  className="bg-surface rounded-2xl border border-sand hover:border-gold/60 p-3 sm:p-5 shadow-sakinah-sm hover:shadow-sakinah-card transition-all cursor-pointer flex items-center gap-3.5 sm:flex-col sm:text-center active:scale-[0.98] tap-feedback overflow-hidden"
                >
                  {/* Photo: 56px square on mobile, arch frame on desktop */}
                  <div className="w-14 h-14 sm:w-24 sm:h-28 rounded-xl sm:rounded-t-full sm:rounded-b-lg overflow-hidden bg-primary-soft border border-sand flex-shrink-0 flex items-center justify-center">
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={name}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="font-serif text-xl sm:text-3xl font-bold text-primary-dark">
                        {name?.charAt(0) || 'L'}
                      </span>
                    )}
                  </div>

                  {/* Info: 1 key fact on mobile (land area) */}
                  <div className="min-w-0 flex-1 sm:w-full">
                    <div className="flex items-center gap-1.5 sm:justify-center mb-0.5">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-primary-soft text-primary-dark text-[10px] font-bold border border-primary/20">
                        {useLabel}
                      </span>
                      {donor.donationYear && (
                        <span className="text-[11px] text-ink-muted sm:hidden">
                          • {locale === 'bn' ? `${toBanglaNum(donor.donationYear)} সাল` : donor.donationYear}
                        </span>
                      )}
                    </div>

                    <h3 className="font-serif font-bold text-sm sm:text-base text-primary-dark truncate">
                      {honorific}
                      {name}
                    </h3>

                    {/* Single Key Fact: Donated Area */}
                    <p className="text-xs text-gold-text font-semibold truncate mt-0.5">
                      {locale === 'bn' ? 'দানকৃত জমি: ' : 'Donated Land: '}
                      <span className="font-bold text-primary-dark">
                        {locale === 'bn' ? toBanglaNum(donor.areaValue) : donor.areaValue} {donor.unit}
                      </span>
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
        title={locale === 'bn' ? 'জমিদাতা তালিকা ফিল্টার' : 'Filter Land Donors'}
      >
        <div className="space-y-4 py-2 text-ink">
          {/* Unit Toggle */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-primary-dark uppercase tracking-wider">
              {locale === 'bn' ? 'পরিমাপ একক' : 'Display Unit'}
            </label>
            <div className="grid grid-cols-4 gap-1 bg-canvas-alt p-1 rounded-xl border border-sand">
              {[
                { key: 'decimal', label: locale === 'bn' ? 'শতক' : 'Decimal' },
                { key: 'katha', label: locale === 'bn' ? 'কাঠা' : 'Katha' },
                { key: 'bigha', label: locale === 'bn' ? 'বিঘা' : 'Bigha' },
                { key: 'acre', label: locale === 'bn' ? 'একর' : 'Acre' },
              ].map((u) => (
                <button
                  key={u.key}
                  type="button"
                  onClick={() => setDisplayUnit(u.key)}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all min-h-[36px] ${displayUnit === u.key
                    ? 'bg-primary text-white shadow-sakinah-sm'
                    : 'text-ink-muted hover:text-primary-dark'
                    }`}
                >
                  {u.label}
                </button>
              ))}
            </div>
          </div>

          {/* Land Use Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-primary-dark uppercase tracking-wider">
              {locale === 'bn' ? 'ব্যবহারের খাত' : 'Land Use'}
            </label>
            <select
              value={selectedLandUse}
              onChange={(e) => setSelectedLandUse(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-sand bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 min-h-[44px]"
            >
              <option value="">{locale === 'bn' ? 'সকল খাত' : 'All Land Uses'}</option>
              <option value="EIDGAH_GROUND">{locale === 'bn' ? 'ঈদগাহ ময়দান' : 'Eidgah Ground'}</option>
              <option value="GRAVEYARD">{locale === 'bn' ? 'কবরস্থান' : 'Graveyard'}</option>
              <option value="MOSQUE">{locale === 'bn' ? 'মসজিদ কমপ্লেক্স' : 'Mosque Complex'}</option>
              <option value="ROAD">{locale === 'bn' ? 'চলাচলের রাস্তা' : 'Access Road'}</option>
              <option value="BOUNDARY_WALL">{locale === 'bn' ? 'সীমানা প্রাচীর' : 'Boundary Wall'}</option>
            </select>
          </div>

          {/* Sort Order */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-primary-dark uppercase tracking-wider">
              {locale === 'bn' ? 'ক্রমানুসার' : 'Sort Order'}
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-sand bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 min-h-[44px]"
            >
              <option value="custom">{locale === 'bn' ? 'নির্ধারিত ক্রম' : 'Custom Order'}</option>
              <option value="area_desc">{locale === 'bn' ? 'জমির পরিমাণ (বেশি থেকে কম)' : 'Land Area (High to Low)'}</option>
              <option value="year_asc">{locale === 'bn' ? 'জমিদানের বছর (আগে থেকে পরে)' : 'Donation Year (Earliest)'}</option>
              <option value="year_desc">{locale === 'bn' ? 'জমিদানের বছর (পরে থেকে আগে)' : 'Donation Year (Latest)'}</option>
              <option value="name_asc">{locale === 'bn' ? 'নাম অনুসারে (অ-ক্ষর)' : 'By Name (A-Z)'}</option>
            </select>
          </div>

          <div className="flex gap-2 pt-3">
            <button
              type="button"
              onClick={() => {
                setSelectedLandUse('');
                setSelectedDonationType('');
                setSelectedMouza('');
                setSelectedDeceased('');
                setSortOrder('custom');
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

      {/* Donor Profile Detail BottomSheet with Full Certificate / Land Deed Presentation */}
      <BottomSheet
        isOpen={!!selectedDonor}
        onClose={() => setSelectedDonor(null)}
        title={selectedDonor ? getLocalized(selectedDonor, 'name') : ''}
      >
        {selectedDonor && (
          <div className="space-y-4 py-2 text-ink">
            <div className="flex flex-col items-center text-center space-y-3 pb-3 border-b border-sand">
              <div className="w-20 h-24 rounded-t-full rounded-b-xl border-2 border-gold/70 overflow-hidden bg-primary-soft shadow-sakinah-sm flex items-center justify-center">
                {selectedDonor.photoPath ? (
                  <img
                    src={getImageUrl(selectedDonor.photoPath)}
                    alt={getLocalized(selectedDonor, 'name')}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="font-serif text-2xl font-bold text-primary-dark">
                    {getLocalized(selectedDonor, 'name')?.charAt(0) || 'L'}
                  </span>
                )}
              </div>

              <div>
                <span className="inline-block px-3 py-0.5 rounded-full bg-primary-soft text-primary-dark text-[11px] font-bold border border-primary/20 mb-1">
                  {landUseLabels[selectedDonor.landUse]?.[locale] || selectedDonor.landUse}
                </span>
                <h3 className="font-serif font-bold text-xl text-primary-dark">
                  {selectedDonor.isDeceased ? (locale === 'bn' ? 'মরহুম ' : 'Late ') : ''}
                  {getLocalized(selectedDonor, 'name')}
                </h3>
                {selectedDonor.fatherNameBn && (
                  <p className="text-xs text-ink-muted mt-0.5">
                    {locale === 'bn' ? 'পিতা: ' : 'Father: '}
                    {getLocalized(selectedDonor, 'fatherName')}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleShare(selectedDonor)}
                className="px-3.5 py-1.5 rounded-xl bg-canvas-alt border border-sand text-primary-dark text-xs font-semibold flex items-center gap-1.5 hover:bg-primary-soft transition-colors min-h-[36px]"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Share2 className="w-3.5 h-3.5 text-gold-text" />}
                <span>{copied ? (locale === 'bn' ? 'কপি হয়েছে' : 'Copied') : locale === 'bn' ? 'শেয়ার' : 'Share'}</span>
              </button>
            </div>

            {/* Land Area Gold Foil Plate */}
            <div className="bg-gold-plate p-3.5 rounded-xl text-center shadow-sakinah-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider block text-ink-muted mb-0.5">
                {locale === 'bn' ? 'দানকৃত মোট জমি' : 'Total Land Donated'}
              </span>
              <p className="font-serif font-extrabold text-xl text-primary-dark">
                {locale === 'bn' ? toBanglaNum(selectedDonor.areaValue) : selectedDonor.areaValue} {selectedDonor.unit}
              </p>
            </div>

            {/* Cadastral Records & Deed Details */}
            {(selectedDonor.deedNumber || selectedDonor.khatianNumber || selectedDonor.dagNumber || selectedDonor.mouzaBn) && (
              <div className="bg-canvas-alt p-3.5 rounded-xl border border-sand space-y-2 text-xs">
                <span className="font-bold text-primary-dark block">
                  {locale === 'bn' ? 'দলিল ও খতিয়ান তথ্য' : 'Deed & Record Details'}
                </span>
                <div className="grid grid-cols-2 gap-2 text-ink">
                  {selectedDonor.deedNumber && (
                    <div>
                      <span className="text-ink-muted block text-[10px]">{locale === 'bn' ? 'দলিল নং:' : 'Deed:'}</span>
                      <span className="font-bold">{selectedDonor.deedNumber}</span>
                    </div>
                  )}
                  {selectedDonor.khatianNumber && (
                    <div>
                      <span className="text-ink-muted block text-[10px]">{locale === 'bn' ? 'খতিয়ান:' : 'Khatian:'}</span>
                      <span className="font-bold">{selectedDonor.khatianNumber}</span>
                    </div>
                  )}
                  {selectedDonor.dagNumber && (
                    <div>
                      <span className="text-ink-muted block text-[10px]">{locale === 'bn' ? 'দাগ নং:' : 'Dag:'}</span>
                      <span className="font-bold">{selectedDonor.dagNumber}</span>
                    </div>
                  )}
                  {selectedDonor.mouzaBn && (
                    <div>
                      <span className="text-ink-muted block text-[10px]">{locale === 'bn' ? 'মৌজা:' : 'Mouza:'}</span>
                      <span className="font-bold">{getLocalized(selectedDonor, 'mouza')}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Background Story */}
            {selectedDonor.storyBn && (
              <div className="pt-2 border-t border-sand text-xs leading-relaxed text-ink">
                <p className="font-bold text-primary-dark mb-1">
                  {locale === 'bn' ? 'জমিদানের ইতিহাস ও প্রেক্ষাপট:' : 'Background Story:'}
                </p>
                <p className="whitespace-pre-line text-ink-muted">{getLocalized(selectedDonor, 'story')}</p>
              </div>
            )}
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
