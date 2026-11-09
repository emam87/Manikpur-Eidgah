import React, { useState, useEffect } from 'react';
import { 
  HeartHandshake, Search, Filter, Calendar, Award, Receipt, 
  ChevronLeft, ChevronRight, X, Sparkles, Building2, Shield, 
  Volume2, Landmark, HelpCircle, FileText 
} from 'lucide-react';
import { SEO } from '../components/common/SEO.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { EightPointStar, StarDivider } from '../components/common/EightPointStar.jsx';

export function Donors() {
  const { locale, t, toBanglaNum, formatBDT, getLocalized } = useLanguage();

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
        setDonors(data.donors || []);
        setPagination(data.pagination || { page: 1, limit: 15, total: 0, totalPages: 1 });
        setGlobalShowAmount(data.globalShowAmount);
        setTotalVisibleAmount(data.totalVisibleAmount || 0);
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
    <div className="py-10 sm:py-16">
      <SEO 
        title={locale === 'bn' ? 'সম্মানিত অনুদানকারী' : 'Honored Donors'} 
        description={locale === 'bn' ? 'মানিকপুর কেন্দ্রীয় শাহী ঈদগাহ উন্নয়ন তহবিলের সম্মানিত দাতাবৃন্দের তালিকা।' : 'Honored donors ledger supporting Manikpur Central Shahi Eidgah.'}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 sm:space-y-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950 text-gold-300 text-xs sm:text-sm font-semibold mb-3 border border-gold-500/40">
            <EightPointStar className="w-3.5 h-3.5 text-gold-400" />
            <span>{locale === 'bn' ? 'স্বচ্ছতা ও কৃতজ্ঞতা' : 'Transparency & Gratitude'}</span>
            <EightPointStar className="w-3.5 h-3.5 text-gold-400" />
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-extrabold text-stone-900 tracking-tight mb-4">
            {locale === 'bn' ? 'সম্মানিত অনুদানকারী' : 'Donors Ledger'}
          </h1>
          <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
            {locale === 'bn' 
              ? 'ঈদগাহের মিম্বর, সীমানা প্রাচীর, মাটি ভরাট ও অবকাঠামোগত উন্নয়নে নিবেদিতপ্রাণ দাতা ও পৃষ্ঠপোষকবৃন্দ।' 
              : 'Recognizing all generous donors who contributed to the development and preservation of the Eidgah.'}
          </p>
          <StarDivider className="my-4" />
        </div>

        {/* Summary Card if amount is public */}
        {globalShowAmount && totalVisibleAmount > 0 && (
          <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 rounded-2xl p-6 border border-gold-500/40 text-ivory shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="w-12 h-12 rounded-2xl bg-gold-500/20 border border-gold-400/40 flex items-center justify-center text-gold-300 shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-gold-200">
                  {locale === 'bn' ? 'উন্নয়ন তহবিলের প্রকাশ্য হিসাব' : 'Public Development Fund Ledger'}
                </h3>
                <p className="text-xs text-stone-300">
                  {locale === 'bn' ? 'সম্মতিপ্রাপ্ত ও সার্বজনীন অনুদানের সমষ্টি' : 'Sum of all authorized public donor contributions'}
                </p>
              </div>
            </div>
            <div className="text-center sm:text-right">
              <span className="text-xs text-gold-300 block mb-0.5">{locale === 'bn' ? 'মোট অনুদান' : 'Total Contributions'}</span>
              <span className="font-serif font-extrabold text-2xl sm:text-3xl text-gold-100">
                {formatBDT(totalVisibleAmount)}
              </span>
            </div>
          </div>
        )}

        {/* Filter and Control Bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gold-500/30 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Search Input */}
            <div className="relative sm:col-span-2">
              <input
                type="text"
                placeholder={locale === 'bn' ? 'দাতার নাম, রশিদ নং বা ঠিকানা দিয়ে খুঁজুন...' : 'Search by donor name, receipt no, or address...'}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50 text-sm bg-stone-50/50"
              />
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
            </div>

            {/* Purpose Filter */}
            <div className="relative">
              <select
                value={selectedPurpose}
                onChange={(e) => {
                  setSelectedPurpose(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50 text-sm bg-stone-50/50 appearance-none text-stone-700"
              >
                <option value="">{locale === 'bn' ? 'সব খাত / উদ্দেশ্য' : 'All Purposes'}</option>
                {purposes.map((p) => (
                  <option key={p.value} value={p.value}>
                    {locale === 'bn' ? p.labelBn : p.labelEn}
                  </option>
                ))}
              </select>
              <Filter className="w-4 h-4 text-stone-400 absolute right-3.5 top-3.5 pointer-events-none" />
            </div>

            {/* Year Filter */}
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50 text-sm bg-stone-50/50 appearance-none text-stone-700"
              >
                <option value="">{locale === 'bn' ? 'সব বছর' : 'All Years'}</option>
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {toBanglaNum(y)} {locale === 'bn' ? 'সাল' : ''}
                  </option>
                ))}
              </select>
              <Calendar className="w-4 h-4 text-stone-400 absolute right-3.5 top-3.5 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs sm:text-sm text-stone-600">
            <div>
              {locale === 'bn' ? 'মোট প্রাপ্ত রেকর্ড: ' : 'Total Records: '}
              <span className="font-bold text-emerald-900 font-serif text-base">{toBanglaNum(pagination.total)}</span>
              {locale === 'bn' ? ' টি' : ''}
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-8 space-y-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-12 bg-stone-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : donors.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-stone-200 space-y-4">
            <HeartHandshake className="w-12 h-12 text-stone-300 mx-auto" />
            <h3 className="font-serif text-xl font-bold text-stone-800">
              {locale === 'bn' ? 'কোনো অনুদানের তথ্য পাওয়া যায়নি' : 'No Donor Records Found'}
            </h3>
            <p className="text-stone-500 text-sm max-w-md mx-auto">
              {locale === 'bn' ? 'অনুসন্ধানের মান পরিবর্তন করে পুনরায় চেষ্টা করুন।' : 'Try adjusting your search criteria or filters.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gold-500/30 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-stone-700">
                <thead className="bg-emerald-950 text-gold-200 text-xs uppercase tracking-wider font-semibold">
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
                <tbody className="divide-y divide-stone-100">
                  {donors.map((donor) => {
                    const purposeInfo = getPurposeInfo(donor.purpose);
                    const dateFormatted = donor.donationDate 
                      ? new Date(donor.donationDate).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : '—';

                    return (
                      <tr
                        key={donor.id}
                        onClick={() => setSelectedDonor(donor)}
                        className="hover:bg-emerald-50/60 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4 font-mono font-medium text-emerald-900">
                          {donor.receiptNo ? toBanglaNum(donor.receiptNo) : '—'}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-serif font-bold text-stone-900">{getLocalized(donor, 'donorName')}</span>
                        </td>
                        <td className="px-6 py-4 text-stone-600 max-w-xs truncate">
                          {getLocalized(donor, 'address') || '—'}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
                            {purposeInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-stone-600 text-xs">
                          {dateFormatted}
                        </td>
                        {globalShowAmount && (
                          <td className="px-6 py-4 text-right font-serif font-bold text-emerald-950 text-base">
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
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-xl bg-white border border-stone-200 text-stone-700 text-sm font-medium hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{locale === 'bn' ? 'পূর্ববর্তী' : 'Previous'}</span>
            </button>

            <span className="px-4 py-2 text-sm text-stone-600 font-medium">
              {locale === 'bn' ? 'পৃষ্ঠা ' : 'Page '}
              <span className="font-bold text-emerald-900">{toBanglaNum(currentPage)}</span>
              {locale === 'bn' ? ' / ' : ' of '}
              <span className="font-bold text-emerald-900">{toBanglaNum(pagination.totalPages)}</span>
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={currentPage >= pagination.totalPages}
              className="px-4 py-2 rounded-xl bg-white border border-stone-200 text-stone-700 text-sm font-medium hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <span>{locale === 'bn' ? 'পরবর্তী' : 'Next'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedDonor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden border border-gold-500/40 shadow-2xl relative">
            <button
              onClick={() => setSelectedDonor(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="bg-gradient-to-b from-emerald-950 to-emerald-900 p-8 text-center text-ivory">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gold-500/20 border border-gold-400/40 flex items-center justify-center text-gold-300 mb-3">
                <Receipt className="w-7 h-7" />
              </div>
              <h3 className="font-serif text-2xl font-bold">{getLocalized(selectedDonor, 'donorName')}</h3>
              {selectedDonor.receiptNo && (
                <p className="text-xs text-gold-300/80 mt-1 font-mono">
                  {locale === 'bn' ? 'রশিদ নং: ' : 'Receipt No: '}
                  {toBanglaNum(selectedDonor.receiptNo)}
                </p>
              )}
            </div>

            <div className="p-6 space-y-3 text-sm text-stone-700">
              {selectedDonor.addressBn && (
                <div className="flex justify-between py-2 border-b border-stone-100">
                  <span className="text-stone-500">{locale === 'bn' ? 'ঠিকানা' : 'Address'}</span>
                  <span className="font-semibold text-right">{getLocalized(selectedDonor, 'address')}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b border-stone-100">
                <span className="text-stone-500">{locale === 'bn' ? 'খাত / উদ্দেশ্য' : 'Purpose'}</span>
                <span className="font-semibold text-emerald-900">{getPurposeInfo(selectedDonor.purpose).label}</span>
              </div>
              {selectedDonor.donationDate && (
                <div className="flex justify-between py-2 border-b border-stone-100">
                  <span className="text-stone-500">{locale === 'bn' ? 'তারিখ' : 'Date'}</span>
                  <span className="font-semibold">
                    {new Date(selectedDonor.donationDate).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              )}
              {selectedDonor.amount !== null && selectedDonor.amount !== undefined && (
                <div className="flex justify-between py-2 border-b border-stone-100">
                  <span className="text-stone-500">{locale === 'bn' ? 'অনুদানের পরিমাণ' : 'Amount'}</span>
                  <span className="font-serif font-bold text-emerald-900 text-lg">{formatBDT(selectedDonor.amount)}</span>
                </div>
              )}
              {selectedDonor.noteBn && (
                <div className="py-2 border-b border-stone-100">
                  <span className="text-stone-500 block mb-1">{locale === 'bn' ? 'মন্তব্য' : 'Note'}</span>
                  <p className="text-stone-800 bg-stone-50 p-3 rounded-xl border border-stone-200/60 text-xs">
                    {getLocalized(selectedDonor, 'note')}
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 bg-stone-50 text-center">
              <button
                onClick={() => setSelectedDonor(null)}
                className="px-6 py-2 rounded-xl bg-emerald-900 text-gold-200 text-sm font-semibold hover:bg-emerald-800 transition-colors"
              >
                {locale === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
