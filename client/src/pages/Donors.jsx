import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HeartHandshake,
  Search,
  Filter,
  Calendar,
  Receipt,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Building2,
  Shield,
  Volume2,
  Landmark,
  HelpCircle,
} from 'lucide-react';
import { SEO } from '../components/common/SEO.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { EightPointStar, StarDivider } from '../components/common/EightPointStar.jsx';
import { BottomSheet } from '../components/common/BottomSheet.jsx';
import { Breadcrumb } from '../components/common/Breadcrumb.jsx';

export function Donors() {
  const { locale, toBanglaNum, formatBDT, getLocalized } = useLanguage();

  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPurpose, setSelectedPurpose] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [globalShowAmount, setGlobalShowAmount] = useState(false);
  const [totalVisibleAmount, setTotalVisibleAmount] = useState(0);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [isArchived, setIsArchived] = useState(false);

  const purposes = [
    { value: 'CONSTRUCTION', labelBn: 'নির্মাণ তহবিল', labelEn: 'Construction Fund', icon: Building2 },
    { value: 'BOUNDARY_WALL', labelBn: 'সীমানা প্রাচীর', labelEn: 'Boundary Wall', icon: Shield },
    { value: 'LAND_PURCHASE', labelBn: 'জমি ক্রয় / ওয়াকফ', labelEn: 'Land Purchase', icon: Landmark },
    { value: 'SOUND_SYSTEM', labelBn: 'সাউন্ড সিস্টেম', labelEn: 'Sound System', icon: Volume2 },
    { value: 'GENERAL', labelBn: 'সাধারণ তহবিল', labelEn: 'General Fund', icon: HeartHandshake },
    { value: 'OTHER', labelBn: 'অন্যান্য', labelEn: 'Other', icon: HelpCircle },
  ];

  useEffect(() => {
    fetchDonors();
  }, [searchQuery, selectedPurpose, selectedYear, currentPage]);

  const fetchDonors = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '15',
      });
      if (searchQuery.trim()) params.append('q', searchQuery.trim());
      if (selectedPurpose) params.append('purpose', selectedPurpose);
      if (selectedYear) params.append('year', selectedYear);

      const res = await fetch(`/api/public/donors?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch donors');
      const data = await res.json();
      if (data.success) {
        if (data.enabled === false) {
          setIsArchived(true);
        } else {
          setIsArchived(false);
          setDonors(data.donors || []);
          setPagination(data.pagination || { page: 1, limit: 15, total: 0, totalPages: 1 });
          setGlobalShowAmount(data.globalShowAmount);
          setTotalVisibleAmount(data.totalVisibleAmount || 0);
        }
      }
    } catch (err) {
      console.error('Error fetching donors:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPurposeInfo = (val) => {
    const found = purposes.find((p) => p.value === val);
    if (!found) return { label: val, icon: HeartHandshake };
    return {
      label: locale === 'bn' ? found.labelBn : found.labelEn,
      icon: found.icon,
    };
  };

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: currentYear - 2014 }, (_, i) => currentYear - i);

  return (
    <div className="py-6 sm:py-12">
      <SEO
        title={locale === 'bn' ? 'সম্মানিত অনুদানকারী' : 'Honored Donors'}
        description={
          locale === 'bn'
            ? 'মানিকপুর ঈদগাহ উন্নয়ন তহবিলের সম্মানিত দাতাবৃন্দের তালিকা।'
            : 'Honored donors ledger supporting Manikpur Eidgah.'
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-12">
        <Breadcrumb items={[{ label: locale === 'bn' ? 'সম্মানিত অনুদানকারী' : 'Donors Ledger' }]} />

        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-soft text-primary-dark text-xs sm:text-sm font-semibold mb-3 border border-primary/20 shadow-sakinah-sm">
            <EightPointStar className="w-3.5 h-3.5 text-gold-text" />
            <span>{locale === 'bn' ? 'স্বচ্ছতা ও কৃতজ্ঞতা' : 'Transparency & Gratitude'}</span>
            <EightPointStar className="w-3.5 h-3.5 text-gold-text" />
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-extrabold text-primary-dark tracking-tight mb-4">
            {locale === 'bn' ? 'সম্মানিত অনুদানকারী' : 'Donors Ledger'}
          </h1>
          <p className="text-ink-muted text-sm sm:text-base leading-relaxed">
            {locale === 'bn'
              ? 'ঈদগাহের মিম্বর, সীমানা প্রাচীর, মাটি ভরাট ও অবকাঠামোগত উন্নয়নে নিবেদিতপ্রাণ দাতা ও পৃষ্ঠপোষকবৃন্দ।'
              : 'Recognizing all generous donors who contributed to the development and preservation of the Eidgah.'}
          </p>
          <StarDivider className="my-4" />
        </div>

        {/* Archived Notice when enable_money_donors is false */}
        {isArchived && (
          <div className="bg-surface rounded-3xl p-8 border border-sand text-center space-y-4 max-w-xl mx-auto shadow-sakinah-card">
            <Landmark className="w-12 h-12 text-primary mx-auto" />
            <h2 className="font-serif font-bold text-xl text-primary-dark">
              {locale === 'bn' ? 'আর্থিক অনুদানের তালিকাটি সংরক্ষিত (আর্কাইভ)' : 'Monetary Donations List is Archived'}
            </h2>
            <p className="text-sm text-ink-muted leading-relaxed">
              {locale === 'bn'
                ? 'বর্তমানে মানিকপুর ঈদগাহের জমিদাতা পরিষদ উন্মুক্ত রয়েছে। জমিদাতা পরিষদ দেখতে নিচের বাটনে ক্লিক করুন।'
                : 'The official Land Donors register is currently active. Please explore the Land Donors page.'}
            </p>
            <div className="pt-2">
              <Link
                to="/land-donors"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-bold text-sm shadow-sakinah-sm hover:bg-primary-hover transition-colors"
              >
                <Landmark className="w-4 h-4" />
                <span>{locale === 'bn' ? 'জমিদাতা পরিষদ দেখুন' : 'View Land Donors'}</span>
              </Link>
            </div>
          </div>
        )}

        {/* Summary Card */}
        {!isArchived && globalShowAmount && totalVisibleAmount > 0 && (
          <div className="bg-surface rounded-2xl p-6 border-gold-double shadow-sakinah-card flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="w-12 h-12 rounded-2xl bg-primary-soft border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-primary-dark">
                  {locale === 'bn' ? 'উন্নয়ন তহবিলের প্রকাশ্য হিসাব' : 'Public Development Fund Ledger'}
                </h3>
                <p className="text-xs text-ink-muted">
                  {locale === 'bn' ? 'সম্মতিপ্রাপ্ত ও সার্বজনীন অনুদানের সমষ্টি' : 'Sum of all authorized public donor contributions'}
                </p>
              </div>
            </div>
            <div className="text-center sm:text-right">
              <span className="text-xs text-gold-text font-semibold block mb-0.5">
                {locale === 'bn' ? 'মোট অনুদান' : 'Total Contributions'}
              </span>
              <span className="font-serif font-extrabold text-2xl sm:text-3xl text-primary-dark tabular-nums">
                {formatBDT(totalVisibleAmount)}
              </span>
            </div>
          </div>
        )}

        {/* Filter and Control Bar */}
        {!isArchived && (
          <>
            <div className="bg-surface rounded-2xl p-4 sm:p-6 border border-sand shadow-sakinah-sm space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="relative sm:col-span-2">
                  <input
                    type="text"
                    placeholder={
                      locale === 'bn' ? 'দাতার নাম, রশিদ নং বা ঠিকানা দিয়ে খুঁজুন...' : 'Search by donor name, receipt no, or address...'
                    }
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-sand focus:outline-none focus:ring-2 focus:ring-gold/50 text-base sm:text-sm bg-canvas-alt/60 text-ink"
                  />
                  <Search className="w-4 h-4 text-ink-muted absolute left-3.5 top-3.5" />
                </div>

                <div className="relative">
                  <select
                    value={selectedPurpose}
                    onChange={(e) => {
                      setSelectedPurpose(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-sand focus:outline-none focus:ring-2 focus:ring-gold/50 text-base sm:text-sm bg-canvas-alt/60 appearance-none text-ink"
                  >
                    <option value="">{locale === 'bn' ? 'সব খাত / উদ্দেশ্য' : 'All Purposes'}</option>
                    {purposes.map((p) => (
                      <option key={p.value} value={p.value}>
                        {locale === 'bn' ? p.labelBn : p.labelEn}
                      </option>
                    ))}
                  </select>
                  <Filter className="w-4 h-4 text-ink-muted absolute right-3.5 top-3.5 pointer-events-none" />
                </div>

                <div className="relative">
                  <select
                    value={selectedYear}
                    onChange={(e) => {
                      setSelectedYear(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-sand focus:outline-none focus:ring-2 focus:ring-gold/50 text-base sm:text-sm bg-canvas-alt/60 appearance-none text-ink"
                  >
                    <option value="">{locale === 'bn' ? 'সব বছর' : 'All Years'}</option>
                    {yearOptions.map((y) => (
                      <option key={y} value={y}>
                        {locale === 'bn' ? `${toBanglaNum(y)} সাল` : y}
                      </option>
                    ))}
                  </select>
                  <Calendar className="w-4 h-4 text-ink-muted absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-sand text-xs sm:text-sm text-ink-muted">
                <div>
                  {locale === 'bn' ? 'মোট প্রাপ্ত রেকর্ড: ' : 'Total Records: '}
                  <span className="font-bold text-primary-dark font-serif text-base tabular-nums">
                    {locale === 'bn' ? toBanglaNum(pagination.total) : pagination.total}
                  </span>
                  {locale === 'bn' ? ' টি' : ''}
                </div>
              </div>
            </div>

            {loading ? (
              <div className="bg-surface rounded-2xl border border-sand p-8 space-y-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-12 bg-canvas-alt rounded-lg animate-pulse" />
                ))}
              </div>
            ) : donors.length === 0 ? (
              <div className="text-center py-20 bg-surface rounded-3xl border border-sand space-y-4">
                <HeartHandshake className="w-12 h-12 text-ink-muted/50 mx-auto" />
                <h3 className="font-serif text-xl font-bold text-primary-dark">
                  {locale === 'bn' ? 'কোনো অনুদানের তথ্য পাওয়া যায়নি' : 'No Donor Records Found'}
                </h3>
                <p className="text-ink-muted text-sm max-w-md mx-auto">
                  {locale === 'bn' ? 'অনুসন্ধানের মান পরিবর্তন করে পুনরায় চেষ্টা করুন।' : 'Try adjusting your search criteria or filters.'}
                </p>
              </div>
            ) : (
              <div className="bg-surface rounded-2xl border border-sand overflow-hidden shadow-sakinah-sm">
                {/* Mobile View */}
                <div className="block md:hidden divide-y divide-sand">
                  {donors.map((donor) => {
                    const name = getLocalized(donor, 'donorName');
                    if (locale === 'en' && !name) return null;
                    const purposeInfo = getPurposeInfo(donor.purpose);
                    const dateFormatted = donor.donationDate
                      ? new Date(donor.donationDate).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-GB', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : '—';

                    return (
                      <div
                        key={donor.id}
                        onClick={() => setSelectedDonor(donor)}
                        className="p-4 hover:bg-canvas-alt cursor-pointer transition-colors space-y-2.5 active:scale-[0.99]"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono font-bold text-primary-dark bg-primary-soft px-2.5 py-0.5 rounded-full border border-primary/20 tabular-nums">
                            {donor.receiptNo
                              ? `${locale === 'bn' ? 'রশিদ: ' : 'Receipt: '} ${locale === 'bn' ? toBanglaNum(donor.receiptNo) : donor.receiptNo}`
                              : '—'}
                          </span>
                          <span className="text-ink-muted text-[11px] tabular-nums">{dateFormatted}</span>
                        </div>

                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-serif font-bold text-base text-ink leading-snug">{name}</h4>
                            {donor.addressBn && (
                              <p className="text-xs text-ink-muted mt-0.5">{getLocalized(donor, 'address')}</p>
                            )}
                          </div>

                          {globalShowAmount && donor.amount !== null && (
                            <span className="font-serif font-extrabold text-base text-primary-dark shrink-0 tabular-nums">
                              {formatBDT(donor.amount)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary-soft text-primary-dark border border-primary/20">
                            {purposeInfo.label}
                          </span>
                          <span className="text-[11px] text-gold-text font-semibold">
                            {locale === 'bn' ? 'রশিদ দেখুন →' : 'View receipt →'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-sm text-ink">
                    <thead className="bg-primary-soft text-primary-dark text-xs uppercase tracking-wider font-bold border-b border-sand">
                      <tr>
                        <th scope="col" className="px-6 py-4">{locale === 'bn' ? 'রশিদ নং' : 'Receipt No'}</th>
                        <th scope="col" className="px-6 py-4">{locale === 'bn' ? 'দাতার নাম' : 'Donor Name'}</th>
                        <th scope="col" className="px-6 py-4">{locale === 'bn' ? 'ঠিকানা' : 'Address'}</th>
                        <th scope="col" className="px-6 py-4">{locale === 'bn' ? 'উদ্দেশ্য / খাত' : 'Purpose'}</th>
                        <th scope="col" className="px-6 py-4">{locale === 'bn' ? 'তারিখ' : 'Date'}</th>
                        {globalShowAmount && (
                          <th scope="col" className="px-6 py-4 text-right">{locale === 'bn' ? 'পরিমাণ' : 'Amount'}</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sand">
                      {donors.map((donor) => {
                        const name = getLocalized(donor, 'donorName');
                        if (locale === 'en' && !name) return null;
                        const purposeInfo = getPurposeInfo(donor.purpose);
                        const dateFormatted = donor.donationDate
                          ? new Date(donor.donationDate).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-GB', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : '—';

                        return (
                          <tr
                            key={donor.id}
                            onClick={() => setSelectedDonor(donor)}
                            className="hover:bg-canvas-alt cursor-pointer transition-colors"
                          >
                            <td className="px-6 py-4 font-mono font-medium text-primary-dark tabular-nums">
                              {donor.receiptNo ? (locale === 'bn' ? toBanglaNum(donor.receiptNo) : donor.receiptNo) : '—'}
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-serif font-bold text-ink">{name}</span>
                            </td>
                            <td className="px-6 py-4 text-ink-muted max-w-xs truncate">
                              {getLocalized(donor, 'address') || '—'}
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-soft text-primary-dark border border-primary/20">
                                {purposeInfo.label}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-ink-muted text-xs tabular-nums">{dateFormatted}</td>
                            {globalShowAmount && (
                              <td className="px-6 py-4 text-right font-serif font-bold text-primary-dark text-base tabular-nums">
                                {donor.amount !== null ? formatBDT(donor.amount) : '—'}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-xl bg-surface border border-sand text-ink text-sm font-medium hover:bg-canvas-alt disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 min-h-[44px]"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>{locale === 'bn' ? 'পূর্ববর্তী' : 'Previous'}</span>
                </button>

                <span className="px-4 py-2 text-sm text-ink-muted font-medium tabular-nums">
                  {locale === 'bn' ? 'পৃষ্ঠা ' : 'Page '}
                  <span className="font-bold text-primary-dark">
                    {locale === 'bn' ? toBanglaNum(currentPage) : currentPage}
                  </span>
                  {locale === 'bn' ? ' / ' : ' of '}
                  <span className="font-bold text-primary-dark">
                    {locale === 'bn' ? toBanglaNum(pagination.totalPages) : pagination.totalPages}
                  </span>
                </span>

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={currentPage >= pagination.totalPages}
                  className="px-4 py-2 rounded-xl bg-surface border border-sand text-ink text-sm font-medium hover:bg-canvas-alt disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 min-h-[44px]"
                >
                  <span>{locale === 'bn' ? 'পরবর্তী' : 'Next'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail BottomSheet */}
      <BottomSheet
        isOpen={!!selectedDonor}
        onClose={() => setSelectedDonor(null)}
        title={selectedDonor ? getLocalized(selectedDonor, 'donorName') : ''}
      >
        {selectedDonor && (
          <div className="space-y-4 py-2">
            <div className="text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-primary-soft border border-primary/20 flex items-center justify-center text-primary mb-3">
                <Receipt className="w-7 h-7" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-primary-dark">
                {getLocalized(selectedDonor, 'donorName')}
              </h3>
              {selectedDonor.receiptNo && (
                <p className="text-xs text-gold-text mt-1 font-mono tabular-nums font-semibold">
                  {locale === 'bn' ? 'রশিদ নং: ' : 'Receipt No: '}
                  {locale === 'bn' ? toBanglaNum(selectedDonor.receiptNo) : selectedDonor.receiptNo}
                </p>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-canvas-alt border border-sand space-y-3 text-sm text-ink">
              {selectedDonor.addressBn && (
                <div className="flex justify-between py-1.5 border-b border-sand">
                  <span className="text-ink-muted">{locale === 'bn' ? 'ঠিকানা' : 'Address'}</span>
                  <span className="font-semibold text-right">{getLocalized(selectedDonor, 'address')}</span>
                </div>
              )}
              <div className="flex justify-between py-1.5 border-b border-sand">
                <span className="text-ink-muted">{locale === 'bn' ? 'খাত / উদ্দেশ্য' : 'Purpose'}</span>
                <span className="font-semibold text-primary-dark">{getPurposeInfo(selectedDonor.purpose).label}</span>
              </div>
              {selectedDonor.donationDate && (
                <div className="flex justify-between py-1.5 border-b border-sand">
                  <span className="text-ink-muted">{locale === 'bn' ? 'তারিখ' : 'Date'}</span>
                  <span className="font-semibold tabular-nums">
                    {new Date(selectedDonor.donationDate).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-GB', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              )}
              {selectedDonor.amount !== null && selectedDonor.amount !== undefined && (
                <div className="flex justify-between py-1.5 border-b border-sand">
                  <span className="text-ink-muted">{locale === 'bn' ? 'অনুদানের পরিমাণ' : 'Amount'}</span>
                  <span className="font-serif font-bold text-primary-dark text-lg tabular-nums">
                    {formatBDT(selectedDonor.amount)}
                  </span>
                </div>
              )}
              {selectedDonor.noteBn && (
                <div className="py-2">
                  <span className="text-ink-muted block mb-1">{locale === 'bn' ? 'মন্তব্য' : 'Note'}</span>
                  <p className="text-ink bg-surface p-3 rounded-xl border border-sand text-xs">
                    {getLocalized(selectedDonor, 'note')}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
