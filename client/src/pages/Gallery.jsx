import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Images, Camera, Search, Filter, Calendar, Folder, 
  ChevronLeft, ChevronRight, Sparkles, Layers 
} from 'lucide-react';
import { SEO } from '../components/common/SEO.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { EightPointStar, StarDivider } from '../components/common/EightPointStar.jsx';

export function Gallery() {
  const { locale, t, toBanglaNum, getLocalized } = useLanguage();

  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [availableYears, setAvailableYears] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });

  const typeTabs = [
    { value: '', labelBn: 'সকল ফোল্ডার', labelEn: 'All Folders' },
    { value: 'FITR', labelBn: 'ঈদুল ফিতর', labelEn: 'Eid-ul-Fitr' },
    { value: 'ADHA', labelBn: 'ঈদুল আযহা', labelEn: 'Eid-ul-Adha' },
    { value: 'OTHER', labelBn: 'ঐতিহাসিক ও অন্যান্য', labelEn: 'Other & Historical' },
  ];

  useEffect(() => {
    fetchAlbums();
  }, [selectedType, selectedYear, searchQuery, currentPage]);

  const fetchAlbums = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
      });
      if (selectedType) params.append('type', selectedType);
      if (selectedYear) params.append('year', selectedYear);
      if (searchQuery.trim()) params.append('q', searchQuery.trim());

      const res = await fetch(`/api/public/albums?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load albums');
      const data = await res.json();
      if (data.success) {
        setAlbums(data.albums || []);
        setPagination(data.pagination || { page: 1, limit: 12, total: 0, totalPages: 1 });
        if (data.years) setAvailableYears(data.years);
      }
    } catch (err) {
      console.error('Failed to load gallery albums:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTypeBadge = (type, occasion) => {
    if (occasion) return occasion;
    if (type === 'FITR') return locale === 'bn' ? 'ঈদুল ফিতর' : 'Eid-ul-Fitr';
    if (type === 'ADHA') return locale === 'bn' ? 'ঈদুল আযহা' : 'Eid-ul-Adha';
    return locale === 'bn' ? 'বিশেষ জামাত' : 'Special Jamat';
  };

  return (
    <div className="py-10 sm:py-16">
      <SEO 
        title={locale === 'bn' ? 'ঐতিহাসিক ফটো গ্যালারি' : 'Photo Gallery Albums'} 
        description={locale === 'bn' ? 'মানিকপুর কেন্দ্রীয় শাহী ঈদগাহের ঈদুল ফিতর ও ঈদুল আযহার জামাতের ঐতিহাসিক আলোকচিত্র সংগ্রহশালা।' : 'Photographic archive of holy Eid congregations at Manikpur Central Shahi Eidgah.'}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 sm:space-y-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950 text-gold-300 text-xs sm:text-sm font-semibold mb-3 border border-gold-500/40">
            <Images className="w-3.5 h-3.5 text-gold-400" />
            <span>{locale === 'bn' ? 'স্মৃতি ও আলোকচিত্র অ্যালবাম' : 'Photographic Heritage'}</span>
            <EightPointStar className="w-3.5 h-3.5 text-gold-400" />
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-extrabold text-stone-900 tracking-tight mb-4">
            {locale === 'bn' ? 'ঐতিহাসিক ফটো গ্যালারি' : 'Photo Gallery Archive'}
          </h1>
          <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
            {locale === 'bn' 
              ? 'বছরের পর বছর ধরে মানিকপুর কেন্দ্রীয় শাহী ঈদগাহ ময়দানে অনুষ্ঠিত ঈদুল ফিতর ও ঈদুল আযহার পুণ্যময় মুহূর্তসমূহ।' 
              : 'Browse historic photographs and congregation albums from holy Eid prayers across decades.'}
          </p>
          <StarDivider className="my-4" />
        </div>

        {/* Type Filter Tabs */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {typeTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setSelectedType(tab.value);
                setCurrentPage(1);
              }}
              className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                selectedType === tab.value
                  ? 'bg-emerald-900 text-gold-200 shadow-md border border-gold-500/50'
                  : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200'
              }`}
            >
              {locale === 'bn' ? tab.labelBn : tab.labelEn}
            </button>
          ))}
        </div>

        {/* Search & Year Control Bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gold-500/30 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-md">
            <input
              type="text"
              placeholder={locale === 'bn' ? 'অ্যালবাম বা অনুষ্ঠানের নাম দিয়ে খুঁজুন...' : 'Search albums by title or occasion...'}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50 text-sm bg-stone-50/50"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {availableYears.length > 0 && (
              <div className="relative">
                <select
                  value={selectedYear}
                  onChange={(e) => {
                    setSelectedYear(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50 text-xs sm:text-sm bg-stone-50/50 text-stone-700 appearance-none pr-8 font-medium"
                >
                  <option value="">{locale === 'bn' ? 'সব বছর' : 'All Years'}</option>
                  {availableYears.map((yr) => (
                    <option key={yr} value={yr}>
                      {toBanglaNum(yr)} {locale === 'bn' ? 'সাল' : ''}
                    </option>
                  ))}
                </select>
                <Calendar className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 top-3 pointer-events-none" />
              </div>
            )}

            <div className="text-xs sm:text-sm text-stone-500">
              {locale === 'bn' ? 'মোট অ্যালবাম: ' : 'Total Albums: '}
              <span className="font-bold text-emerald-900 font-serif text-base">{toBanglaNum(pagination.total)}</span>
            </div>
          </div>
        </div>

        {/* Albums Grid (Desktop 4 per row, Mobile 2 per row, with stacked-photos look) */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="aspect-[4/5] rounded-3xl bg-stone-100 animate-pulse border border-stone-200" />
            ))}
          </div>
        ) : albums.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-stone-200 space-y-4">
            <Folder className="w-12 h-12 text-stone-300 mx-auto" />
            <h3 className="font-serif text-xl font-bold text-stone-800">
              {locale === 'bn' ? 'কোনো ফটো অ্যালবাম পাওয়া যায়নি' : 'No Photo Albums Found'}
            </h3>
            <p className="text-stone-500 text-sm max-w-md mx-auto">
              {locale === 'bn' ? 'অনুসন্ধানের মান বা ক্যাটাগরি পরিবর্তন করে পুনরায় চেষ্টা করুন।' : 'Try adjusting your search criteria or type filter.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {albums.map((album) => {
              const coverImg = album.coverPhoto?.thumbPath || album.coverPhoto?.path || album.photos?.[0]?.path || '/defaults/eidgah-hero.svg';
              const photoCount = album._count?.photos || 0;
              const occasionBadge = getTypeBadge(album.type, getLocalized(album, 'occasionName'));

              return (
                <Link
                  key={album.id}
                  to={`/gallery/${album.slug}`}
                  className="group relative flex flex-col focus:outline-none"
                >
                  {/* Stacked-Photos Visual Illusion: Two subtle staggered card layers behind the cover */}
                  <div className="relative w-full aspect-[4/5] mb-3">
                    {/* Layer 2: Deepest card layer */}
                    <div className="absolute inset-0 bg-stone-300/60 rounded-3xl transform rotate-2 group-hover:rotate-4 transition-transform duration-300" />
                    {/* Layer 1: Middle card layer */}
                    <div className="absolute inset-0 bg-stone-200 rounded-3xl transform -rotate-1 group-hover:-rotate-2 transition-transform duration-300" />

                    {/* Front Main Card */}
                    <div className="relative w-full h-full rounded-3xl overflow-hidden border-2 border-gold-500/40 shadow-md group-hover:shadow-2xl transition-all duration-300 bg-emerald-950">
                      <img
                        src={coverImg}
                        alt={getLocalized(album, 'title')}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />

                      {/* Top Badges Overlay */}
                      <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between gap-1 pointer-events-none">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-950/85 backdrop-blur-md text-gold-300 text-[10px] sm:text-xs font-bold border border-gold-500/40">
                          {occasionBadge}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white font-mono text-[10px] sm:text-xs font-semibold">
                          {toBanglaNum(album.year)}
                        </span>
                      </div>

                      {/* Bottom Gradient Overlay with Photo Count */}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3 sm:p-4 flex items-end justify-between pointer-events-none">
                        <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-gold-300 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-lg">
                          <Camera className="w-3.5 h-3.5 text-gold-400" />
                          <span>{toBanglaNum(photoCount)} {locale === 'bn' ? 'টি ছবি' : 'photos'}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Album Info */}
                  <div className="px-1 text-center">
                    <h3 className="font-serif font-bold text-sm sm:text-base text-stone-900 group-hover:text-emerald-900 transition-colors line-clamp-1">
                      {getLocalized(album, 'title')}
                    </h3>
                    {album.eventDate && (
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        {new Date(album.eventDate).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', {
                          year: 'numeric',
                          month: 'short',
                        })}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
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
    </div>
  );
}

