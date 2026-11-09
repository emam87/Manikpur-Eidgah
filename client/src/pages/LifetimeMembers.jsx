import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Filter, ArrowUpDown, LayoutGrid, Table as TableIcon, 
  MapPin, Calendar, User, X, ChevronLeft, ChevronRight, Award, Sparkles 
} from 'lucide-react';
import { SEO } from '../components/common/SEO.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { EightPointStar, StarDivider } from '../components/common/EightPointStar.jsx';
import { SkeletonLoader } from '../components/common/SkeletonLoader.jsx';

export function LifetimeMembers() {
  const { locale, t, toBanglaNum, formatBDT, getLocalized } = useLanguage();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('card'); // 'card' | 'table'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [sortBy, setSortBy] = useState('membership_no');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [availableYears, setAvailableYears] = useState([]);
  const [globalShowAmount, setGlobalShowAmount] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  useEffect(() => {
    fetchMembers();
  }, [searchQuery, selectedYear, sortBy, currentPage]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        sort: sortBy,
      });
      if (searchQuery.trim()) params.append('q', searchQuery.trim());
      if (selectedYear) params.append('year', selectedYear);

      const res = await fetch(`/api/public/members?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load members');
      const data = await res.json();
      if (data.success) {
        setMembers(data.members || []);
        setPagination(data.pagination || { page: 1, limit: 12, total: 0, totalPages: 1 });
        if (data.years && data.years.length > 0) {
          setAvailableYears(data.years);
        }
        setGlobalShowAmount(data.globalShowAmount);
      }
    } catch (err) {
      console.error('Error fetching members:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchMembers();
  };

  return (
    <div className="py-10 sm:py-16">
      <SEO 
        title={locale === 'bn' ? 'আজীবন সদস্যবৃন্দ' : 'Lifetime Members'} 
        description={locale === 'bn' ? 'মানিকপুর কেন্দ্রীয় শাহী ঈদগাহের সম্মানিত আজীবন সদস্যবৃন্দের তালিকা।' : 'Honored Lifetime Members of Manikpur Central Shahi Eidgah.'}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 sm:space-y-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950 text-gold-300 text-xs sm:text-sm font-semibold mb-3 border border-gold-500/40">
            <EightPointStar className="w-3.5 h-3.5 text-gold-400" />
            <span>{locale === 'bn' ? 'সম্মাননা ও ঐতিহ্য' : 'Honor & Heritage'}</span>
            <EightPointStar className="w-3.5 h-3.5 text-gold-400" />
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-extrabold text-stone-900 tracking-tight mb-4">
            {locale === 'bn' ? 'আজীবন সদস্যবৃন্দ' : 'Lifetime Members'}
          </h1>
          <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
            {locale === 'bn' 
              ? 'যাঁদের ত্যাগ ও সার্বিক সহযোগিতায় মানিকপুর কেন্দ্রীয় শাহী ঈদগাহ আজ এক অনন্য উচ্চতায় পৌঁছেছে।' 
              : 'Honoring the patrons whose generous support and commitment built Manikpur Central Shahi Eidgah.'}
          </p>
          <StarDivider className="my-4" />
        </div>

        {/* Filter and Control Bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gold-500/30 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative sm:col-span-2">
              <input
                type="text"
                placeholder={locale === 'bn' ? 'নাম, পিতার নাম, ঠিকানা বা সদস্য নং দিয়ে খুঁজুন...' : 'Search by name, father, address, or number...'}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50 text-sm bg-stone-50/50"
              />
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
            </form>

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
                <option value="">{locale === 'bn' ? 'সব বছর (যোগদান)' : 'All Years'}</option>
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    {toBanglaNum(y)} {locale === 'bn' ? 'সাল' : ''}
                  </option>
                ))}
              </select>
              <Filter className="w-4 h-4 text-stone-400 absolute right-3.5 top-3.5 pointer-events-none" />
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50 text-sm bg-stone-50/50 appearance-none text-stone-700"
              >
                <option value="membership_no">{locale === 'bn' ? 'সদস্য নং অনুসারে' : 'By Member No.'}</option>
                <option value="name">{locale === 'bn' ? 'নাম অনুসারে (বর্ণানুক্রমিক)' : 'By Name'}</option>
                <option value="member_since">{locale === 'bn' ? 'যোগদানের সাল অনুসারে' : 'By Year Joined'}</option>
                {globalShowAmount && (
                  <option value="amount">{locale === 'bn' ? 'অনুদানের পরিমাণ অনুসারে' : 'By Amount'}</option>
                )}
              </select>
              <ArrowUpDown className="w-4 h-4 text-stone-400 absolute right-3.5 top-3.5 pointer-events-none" />
            </div>
          </div>

          {/* Bar Bottom Row: View Toggle & Record Count */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-stone-100 text-xs sm:text-sm text-stone-600">
            <div>
              {locale === 'bn' ? 'মোট নিবন্ধিত সদস্য: ' : 'Total Registered Members: '}
              <span className="font-bold text-emerald-900 font-serif text-base">{toBanglaNum(pagination.total)}</span>
              {locale === 'bn' ? ' জন' : ''}
            </div>

            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('card')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
                  viewMode === 'card' ? 'bg-white text-emerald-900 shadow-sm' : 'text-stone-500 hover:text-stone-800'
                }`}
                title="কার্ড ভিউ"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">{locale === 'bn' ? 'কার্ড ভিউ' : 'Cards'}</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
                  viewMode === 'table' ? 'bg-white text-emerald-900 shadow-sm' : 'text-stone-500 hover:text-stone-800'
                }`}
                title="টেবিল ভিউ"
              >
                <TableIcon className="w-4 h-4" />
                <span className="hidden sm:inline">{locale === 'bn' ? 'টেবিল ভিউ' : 'Table'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-96 rounded-3xl bg-emerald-950/20 animate-pulse border border-gold-500/20" />
            ))}
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-stone-200 space-y-4">
            <Users className="w-12 h-12 text-stone-300 mx-auto" />
            <h3 className="font-serif text-xl font-bold text-stone-800">
              {locale === 'bn' ? 'কোনো আজীবন সদস্যের তথ্য পাওয়া যায়নি' : 'No Lifetime Members Found'}
            </h3>
            <p className="text-stone-500 text-sm max-w-md mx-auto">
              {locale === 'bn' ? 'আপনার অনুসন্ধানের সাথে মিলে এমন কোনো সদস্য পাওয়া যায়নি। অনুসন্ধান পরিমার্জন করুন।' : 'Try adjusting your search criteria or filter options.'}
            </p>
          </div>
        ) : viewMode === 'card' ? (
          /* "Membership Certificate Card" Grid: desktop 3 per row with 3D tilt feel, mobile 1 per row */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {members.map((member) => (
              <div
                key={member.id}
                onClick={() => setSelectedMember(member)}
                className="group relative cursor-pointer rounded-3xl overflow-hidden p-6 sm:p-7 flex flex-col items-center text-center transition-all duration-300 transform hover:-translate-y-1.5 hover:shadow-2xl"
                style={{
                  background: 'linear-gradient(145deg, #093721 0%, #0F5132 45%, #072818 100%)',
                  boxShadow: '0 12px 30px -10px rgba(15, 81, 50, 0.4), inset 0 0 0 1.5px rgba(184, 146, 63, 0.45)',
                }}
              >
                {/* Double Gold Hairline Border & Corner Star Accents */}
                <div className="absolute inset-2 pointer-events-none rounded-2xl border border-gold-500/30" />
                <div className="absolute top-3 left-3 w-2 h-2 rounded-full bg-gold-400/60" />
                <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-gold-400/60" />
                <div className="absolute bottom-3 left-3 w-2 h-2 rounded-full bg-gold-400/60" />
                <div className="absolute bottom-3 right-3 w-2 h-2 rounded-full bg-gold-400/60" />

                {/* Membership Ribbon Badge */}
                <div className="relative mb-5 z-10">
                  <div className="px-4 py-1 rounded-full bg-gradient-to-r from-gold-600 via-gold-400 to-gold-600 text-emerald-950 font-bold text-xs tracking-wider uppercase shadow-md flex items-center gap-1.5 border border-gold-200">
                    <Sparkles className="w-3 h-3 text-emerald-950" />
                    <span>
                      {locale === 'bn' ? 'সদস্য নং: ' : 'Member No: '}
                      {toBanglaNum(member.membershipNo || member.id)}
                    </span>
                  </div>
                </div>

                {/* Arch-Top Photo Frame with Gold Glow */}
                <div className="relative mb-5 z-10">
                  <div className="w-28 h-36 rounded-t-full rounded-b-2xl overflow-hidden p-1 bg-gradient-to-b from-gold-400 via-gold-600 to-gold-800 shadow-xl group-hover:shadow-gold-500/20 transition-all">
                    <div className="w-full h-full rounded-t-full rounded-b-xl overflow-hidden bg-emerald-900 flex items-center justify-center">
                      {member.photoPath ? (
                        <img
                          src={member.photoPath}
                          alt={getLocalized(member, 'name')}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gold-300">
                          <User className="w-12 h-12 opacity-80" />
                          <span className="text-[10px] mt-1 font-serif text-gold-200/80">
                            {getLocalized(member, 'name').substring(0, 2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Member Info */}
                <div className="relative z-10 w-full flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-serif font-bold text-xl sm:text-2xl text-ivory tracking-wide leading-snug group-hover:text-gold-200 transition-colors">
                      {getLocalized(member, 'name')}
                    </h3>
                    {member.fatherNameBn && (
                      <p className="text-xs text-gold-200/70 mt-1">
                        {locale === 'bn' ? 'পিতা: ' : 'Father: '}
                        {getLocalized(member, 'fatherName')}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs text-stone-300/80 pt-2 border-t border-gold-500/20">
                    {member.addressBn && (
                      <p className="flex items-center justify-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-gold-400 shrink-0" />
                        <span className="truncate">{getLocalized(member, 'address')}</span>
                      </p>
                    )}
                    {member.memberSince && (
                      <p className="flex items-center justify-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gold-400 shrink-0" />
                        <span>
                          {locale === 'bn' ? 'যোগদান: ' : 'Member Since: '}
                          {toBanglaNum(member.memberSince)}
                        </span>
                      </p>
                    )}
                  </div>

                  {/* Gold-foil Plate: ONLY shown when amountPaid is non-null (controlled strictly by server) */}
                  {member.amountPaid !== null && member.amountPaid !== undefined && (
                    <div className="mt-3 pt-3">
                      <div className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-200 via-amber-100 to-amber-200 text-stone-900 border border-amber-300/80 shadow-md flex items-center justify-center gap-1.5 transform group-hover:scale-[1.02] transition-transform">
                        <Award className="w-4 h-4 text-emerald-800 shrink-0" />
                        <span className="font-serif font-bold text-sm tracking-tight text-emerald-950">
                          {formatBDT(member.amountPaid)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Table View Toggle */
          <div className="bg-white rounded-2xl border border-gold-500/30 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-stone-700">
                <thead className="bg-emerald-950 text-gold-200 text-xs uppercase tracking-wider font-semibold">
                  <tr>
                    <th scope="col" className="px-6 py-4">{locale === 'bn' ? 'সদস্য নং' : 'Member No'}</th>
                    <th scope="col" className="px-6 py-4">{locale === 'bn' ? 'সদস্যের নাম' : 'Member Name'}</th>
                    <th scope="col" className="px-6 py-4">{locale === 'bn' ? 'পিতার নাম' : 'Father’s Name'}</th>
                    <th scope="col" className="px-6 py-4">{locale === 'bn' ? 'ঠিকানা' : 'Address'}</th>
                    <th scope="col" className="px-6 py-4">{locale === 'bn' ? 'যোগদানের সাল' : 'Year'}</th>
                    {globalShowAmount && (
                      <th scope="col" className="px-6 py-4 text-right">{locale === 'bn' ? 'অনুদান' : 'Contribution'}</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {members.map((member) => (
                    <tr
                      key={member.id}
                      onClick={() => setSelectedMember(member)}
                      className="hover:bg-emerald-50/60 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 font-mono font-bold text-emerald-900">
                        {toBanglaNum(member.membershipNo || member.id)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-emerald-900 text-gold-300 flex items-center justify-center shrink-0 border border-gold-500/40">
                            {member.photoPath ? (
                              <img src={member.photoPath} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-4 h-4" />
                            )}
                          </div>
                          <span className="font-serif font-bold text-stone-900">{getLocalized(member, 'name')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-stone-600">{getLocalized(member, 'fatherName') || '—'}</td>
                      <td className="px-6 py-4 text-stone-600 max-w-xs truncate">{getLocalized(member, 'address') || '—'}</td>
                      <td className="px-6 py-4 text-stone-600">{toBanglaNum(member.memberSince) || '—'}</td>
                      {globalShowAmount && (
                        <td className="px-6 py-4 text-right font-serif font-semibold text-emerald-900">
                          {member.amountPaid !== null ? formatBDT(member.amountPaid) : '—'}
                        </td>
                      )}
                    </tr>
                  ))}
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
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden border border-gold-500/40 shadow-2xl relative">
            <button
              onClick={() => setSelectedMember(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="bg-gradient-to-b from-emerald-950 to-emerald-900 p-8 text-center text-ivory relative">
              <div className="w-28 h-36 mx-auto rounded-t-full rounded-b-2xl overflow-hidden p-1 bg-gradient-to-b from-gold-400 via-gold-500 to-gold-700 shadow-xl mb-4">
                <div className="w-full h-full rounded-t-full rounded-b-xl overflow-hidden bg-emerald-950 flex items-center justify-center">
                  {selectedMember.photoPath ? (
                    <img src={selectedMember.photoPath} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-gold-300" />
                  )}
                </div>
              </div>
              <div className="inline-block px-3 py-1 rounded-full bg-gold-400/20 text-gold-300 text-xs font-bold border border-gold-400/40 mb-2">
                {locale === 'bn' ? 'সদস্য নং: ' : 'Member No: '}
                {toBanglaNum(selectedMember.membershipNo || selectedMember.id)}
              </div>
              <h3 className="font-serif text-2xl font-bold">{getLocalized(selectedMember, 'name')}</h3>
            </div>

            <div className="p-6 space-y-3 text-sm text-stone-700">
              {selectedMember.fatherNameBn && (
                <div className="flex justify-between py-2 border-b border-stone-100">
                  <span className="text-stone-500">{locale === 'bn' ? 'পিতার নাম' : 'Father’s Name'}</span>
                  <span className="font-semibold">{getLocalized(selectedMember, 'fatherName')}</span>
                </div>
              )}
              {selectedMember.addressBn && (
                <div className="flex justify-between py-2 border-b border-stone-100">
                  <span className="text-stone-500">{locale === 'bn' ? 'ঠিকানা' : 'Address'}</span>
                  <span className="font-semibold text-right">{getLocalized(selectedMember, 'address')}</span>
                </div>
              )}
              {selectedMember.memberSince && (
                <div className="flex justify-between py-2 border-b border-stone-100">
                  <span className="text-stone-500">{locale === 'bn' ? 'যোগদানের সাল' : 'Member Since'}</span>
                  <span className="font-semibold">{toBanglaNum(selectedMember.memberSince)}</span>
                </div>
              )}
              {selectedMember.amountPaid !== null && selectedMember.amountPaid !== undefined && (
                <div className="flex justify-between py-2 border-b border-stone-100">
                  <span className="text-stone-500">{locale === 'bn' ? 'অনুদানের পরিমাণ' : 'Amount Contributed'}</span>
                  <span className="font-serif font-bold text-emerald-900 text-base">{formatBDT(selectedMember.amountPaid)}</span>
                </div>
              )}
            </div>

            <div className="p-4 bg-stone-50 text-center">
              <button
                onClick={() => setSelectedMember(null)}
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
