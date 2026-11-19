import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Images,
  Camera,
  Search,
  Filter,
  X,
  Layers,
} from 'lucide-react';
import { SEO } from '../components/common/SEO.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { Breadcrumb } from '../components/common/Breadcrumb.jsx';
import { BottomSheet } from '../components/common/BottomSheet.jsx';
import { ImageWithBlur } from '../components/common/ImageWithBlur.jsx';
import { getImageUrl } from '../utils/imageUrl.js';

export function Gallery() {
  const { locale, t, toBanglaNum, getLocalized } = useLanguage();

  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [availableYears, setAvailableYears] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const typeOptions = [
    { value: '', labelBn: 'সকল ফোল্ডার', labelEn: 'All Folders' },
    { value: 'FITR', labelBn: 'ঈদুল ফিতর', labelEn: 'Eid-ul-Fitr' },
    { value: 'ADHA', labelBn: 'ঈদুল আযহা', labelEn: 'Eid-ul-Adha' },
    { value: 'OTHER', labelBn: 'ঐতিহাসিক ও অন্যান্য', labelEn: 'Other & Historical' },
  ];

  useEffect(() => {
    setCurrentPage(1);
    loadAlbums(1, false);
  }, [selectedType, selectedYear, searchQuery]);

  const loadAlbums = async (page = 1, append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (selectedType) params.append('type', selectedType);
      if (selectedYear) params.append('year', selectedYear);
      if (searchQuery.trim()) params.append('q', searchQuery.trim());

      const res = await fetch(`/api/public/albums?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load albums');
      const data = await res.json();
      if (data.success) {
        if (append) {
          setAlbums((prev) => [...prev, ...(data.albums || [])]);
        } else {
          setAlbums(data.albums || []);
        }
        setPagination(data.pagination || { page, limit: 20, total: 0, totalPages: 1 });
        if (data.years) setAvailableYears(data.years);
      }
    } catch (err) {
      console.error('Failed to load gallery albums:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    loadAlbums(nextPage, true);
  };

  const getTypeBadge = (type, occasion) => {
    if (occasion) return occasion;
    if (type === 'FITR') return locale === 'bn' ? 'ঈদুল ফিতর' : 'Eid-ul-Fitr';
    if (type === 'ADHA') return locale === 'bn' ? 'ঈদুল আযহা' : 'Eid-ul-Adha';
    return locale === 'bn' ? 'বিশেষ জামাত' : 'Special';
  };

  const hasMore = albums.length < pagination.total;

  return (
    <div className="py-4 sm:py-8 page-enter">
      <SEO
        title={locale === 'bn' ? 'ঐতিহাসিক ফটো গ্যালারি' : 'Photo Gallery Albums'}
        description={
          locale === 'bn'
            ? 'মানিকপুর ঈদগাহের ঈদুল ফিতর ও ঈদুল আযহার জামাতের ঐতিহাসিক আলোকচিত্র সংগ্রহশালা।'
            : 'Photographic archive of holy Eid congregations at Manikpur Eidgah.'
        }
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <Breadcrumb items={[{ label: locale === 'bn' ? 'ফটো গ্যালারি' : 'Photo Gallery' }]} />

        {/* Page Title & Count Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-sand pb-3">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-primary-dark tracking-tight">
              {locale === 'bn' ? 'ঐতিহাসিক ফটো গ্যালারি' : 'Photo Gallery Albums'}
            </h1>
            <p className="text-xs sm:text-sm text-ink-muted mt-0.5">
              {locale === 'bn'
                ? 'ঈদের পুণ্যময় মুহূর্ত ও ঐতিহাসিক স্মৃতিচিত্র সংগ্রহশালা'
                : 'Browse historic congregation albums from holy Eid prayers across decades'}
            </p>
          </div>
          <div className="text-xs font-semibold text-primary-dark bg-primary-soft px-3 py-1 rounded-full border border-primary/20 w-fit">
            <span>{locale === 'bn' ? 'মোট অ্যালবাম: ' : 'Total: '}</span>
            <span className="font-bold tabular-nums">
              {locale === 'bn' ? toBanglaNum(pagination.total) : pagination.total}
            </span>
            <span>{locale === 'bn' ? ' টি' : ''}</span>
          </div>
        </div>

        {/* Sticky Search Field + Filter Button */}
        <div className="sticky top-14 sm:top-16 z-20 bg-canvas/95 backdrop-blur-md py-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder={locale === 'bn' ? 'অ্যালবাম বা উপলক্ষ খুঁজুন...' : 'Search albums by keyword...'}
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

            <button
              type="button"
              onClick={() => setFilterSheetOpen(true)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-bold shadow-sakinah-sm transition-all min-h-[42px] tap-feedback ${
                selectedType || selectedYear
                  ? 'bg-primary text-white border-primary'
                  : 'bg-surface text-primary-dark border-sand hover:bg-primary-soft/50'
              }`}
              aria-label="Filter albums"
            >
              <Filter className="w-4 h-4" />
              <span>{locale === 'bn' ? 'ফিল্টার' : 'Filter'}</span>
              {(selectedType || selectedYear) && <span className="w-2 h-2 rounded-full bg-gold" />}
            </button>
          </div>
        </div>

        {/* 2-Column Grid on Mobile, 4-Column on Desktop */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-[4/5] rounded-2xl bg-surface border border-sand animate-pulse" />
            ))}
          </div>
        ) : albums.length === 0 ? (
          <div className="text-center py-16 bg-surface rounded-2xl border border-sand shadow-sakinah-sm space-y-3">
            <Images className="w-10 h-10 text-ink-muted/50 mx-auto" />
            <h3 className="font-serif text-lg font-bold text-primary-dark">
              {locale === 'bn' ? 'কোনো ফটো অ্যালবাম পাওয়া যায়নি' : 'No Photo Albums Found'}
            </h3>
            <p className="text-xs text-ink-muted">
              {locale === 'bn' ? 'অনুসন্ধান বা ফিল্টার পরিবর্তন করুন।' : 'Try adjusting your search criteria.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {albums.map((album) => {
              const title = getLocalized(album, 'title');
              if (locale === 'en' && !title) return null;
              const coverImg = getImageUrl(
                album.coverPhoto?.thumbPath || album.coverPhoto?.path || album.photos?.[0]?.path,
                '/defaults/eidgah-hero.webp'
              );
              const photoCount = album._count?.photos || 0;
              const occasionBadge = getTypeBadge(album.type, getLocalized(album, 'occasionName'));

              return (
                <Link
                  key={album.id}
                  to={`/gallery/${album.slug}`}
                  className="group relative flex flex-col rounded-2xl bg-surface border border-sand hover:border-gold/60 shadow-sakinah-sm hover:shadow-sakinah-card transition-all overflow-hidden active:scale-[0.98] tap-feedback"
                >
                  <div className="relative w-full aspect-[4/3] bg-canvas-alt overflow-hidden">
                    <ImageWithBlur
                      src={coverImg}
                      alt={title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-scrim/80 via-transparent to-transparent opacity-85 pointer-events-none" />

                    <div className="absolute top-2 left-2 z-10">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-surface/95 backdrop-blur-sm border border-sand text-[9px] sm:text-[10px] font-bold text-primary-dark shadow-sakinah-sm">
                        {occasionBadge}
                      </span>
                    </div>

                    <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between text-xs text-white z-10">
                      <span className="font-serif font-bold text-xs sm:text-sm text-white drop-shadow">
                        {locale === 'bn' ? toBanglaNum(album.year) : album.year}
                      </span>
                      <span className="inline-flex items-center gap-1 bg-scrim/65 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] text-white border border-white/20">
                        <Layers className="w-3 h-3 text-gold-plate-from" />
                        <span>{locale === 'bn' ? `${toBanglaNum(photoCount)} ছবি` : `${photoCount} photos`}</span>
                      </span>
                    </div>
                  </div>

                  <div className="p-3">
                    <h3 className="font-serif font-bold text-xs sm:text-sm text-ink group-hover:text-primary-dark transition-colors line-clamp-1 leading-snug">
                      {title}
                    </h3>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Load More Button */}
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
                <span>{locale === 'bn' ? 'আরও দেখুন (২০টি)' : 'Load More (20)'}</span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Filter Bottom Sheet */}
      <BottomSheet
        isOpen={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        title={locale === 'bn' ? 'অ্যালবাম ফিল্টার' : 'Filter Albums'}
      >
        <div className="space-y-4 py-2 text-ink">
          {/* Type Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-primary-dark uppercase tracking-wider">
              {locale === 'bn' ? 'উপলক্ষ / ধরন' : 'Occasion'}
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-sand bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 min-h-[44px]"
            >
              {typeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {locale === 'bn' ? opt.labelBn : opt.labelEn}
                </option>
              ))}
            </select>
          </div>

          {/* Year Filter */}
          {availableYears.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-primary-dark uppercase tracking-wider">
                {locale === 'bn' ? 'বছর' : 'Year'}
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-sand bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 min-h-[44px]"
              >
                <option value="">{locale === 'bn' ? 'সকল বছর' : 'All Years'}</option>
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    {locale === 'bn' ? `${toBanglaNum(y)} সাল` : y}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-2 pt-3">
            <button
              type="button"
              onClick={() => {
                setSelectedType('');
                setSelectedYear('');
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
    </div>
  );
}
