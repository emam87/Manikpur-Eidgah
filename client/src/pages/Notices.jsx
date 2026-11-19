import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  Pin,
  Calendar,
  Search,
  ChevronRight,
  Filter,
  X,
} from 'lucide-react';
import { SEO } from '../components/common/SEO.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { Breadcrumb } from '../components/common/Breadcrumb.jsx';
import { BottomSheet } from '../components/common/BottomSheet.jsx';

export function Notices() {
  const { locale, t, toBanglaNum, getLocalized } = useLanguage();

  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPinned, setFilterPinned] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
    loadNotices(1, false);
  }, [searchQuery, filterPinned]);

  const loadNotices = async (page = 1, append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (searchQuery.trim()) params.append('q', searchQuery.trim());
      if (filterPinned) params.append('pinned', 'true');

      const res = await fetch(`/api/public/notices?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load notices');
      const data = await res.json();
      if (data.success) {
        if (append) {
          setNotices((prev) => [...prev, ...(data.notices || [])]);
        } else {
          setNotices(data.notices || []);
        }
        setPagination(data.pagination || { page, limit: 20, total: 0, totalPages: 1 });
      }
    } catch (err) {
      console.error('Error fetching notices:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    loadNotices(nextPage, true);
  };

  const hasMore = notices.length < pagination.total;

  return (
    <div className="py-4 sm:py-8 page-enter">
      <SEO
        title={locale === 'bn' ? 'নোটিশ ও ঘোষণা' : 'Notices & Circulars'}
        description={
          locale === 'bn'
            ? 'মানিকপুর ঈদগাহের সর্বশেষ নোটিশ, জামাত সময়সূচি ও জরুরি ঘোষণা।'
            : 'Latest announcements, prayer schedules, and notices from Manikpur Eidgah.'
        }
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <Breadcrumb items={[{ label: locale === 'bn' ? 'নোটিশ ও ঘোষণা' : 'Notices & News' }]} />

        {/* Page Title & Count Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-sand pb-3">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-primary-dark tracking-tight">
              {locale === 'bn' ? 'নোটিশ ও ঘোষণা' : 'Notices & Circulars'}
            </h1>
            <p className="text-xs sm:text-sm text-ink-muted mt-0.5">
              {locale === 'bn'
                ? 'ঈদ জামাত সময়সূচি, সাধারণ সভা ও জরুরি বিজ্ঞপ্তি'
                : 'Official announcements and circulars of Manikpur Eidgah'}
            </p>
          </div>
          <div className="text-xs font-semibold text-primary-dark bg-primary-soft px-3 py-1 rounded-full border border-primary/20 w-fit">
            <span>{locale === 'bn' ? 'মোট নোটিশ: ' : 'Total: '}</span>
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
                placeholder={locale === 'bn' ? 'নোটিশের শিরোনাম দিয়ে খুঁজুন...' : 'Search by notice title...'}
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
                filterPinned
                  ? 'bg-primary text-white border-primary'
                  : 'bg-surface text-primary-dark border-sand hover:bg-primary-soft/50'
              }`}
              aria-label="Filter notices"
            >
              <Filter className="w-4 h-4" />
              <span>{locale === 'bn' ? 'ফিল্টার' : 'Filter'}</span>
              {filterPinned && <span className="w-2 h-2 rounded-full bg-gold" />}
            </button>
          </div>
        </div>

        {/* Notices Feed */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-surface border border-sand animate-pulse" />
            ))}
          </div>
        ) : notices.length === 0 ? (
          <div className="text-center py-16 bg-surface rounded-2xl border border-sand shadow-sakinah-sm space-y-3">
            <Bell className="w-10 h-10 text-ink-muted/50 mx-auto" />
            <h3 className="font-serif text-lg font-bold text-primary-dark">
              {locale === 'bn' ? 'কোনো নোটিশ পাওয়া যায়নি' : 'No Notices Found'}
            </h3>
            <p className="text-xs text-ink-muted">
              {locale === 'bn' ? 'অনুসন্ধান পরিমার্জন করুন।' : 'Try adjusting your search.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notices.map((notice) => {
              const title = getLocalized(notice, 'title');
              if (locale === 'en' && !title) return null;
              const dateStr = notice.publishedAt
                ? new Date(notice.publishedAt).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-GB', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })
                : '';

              return (
                <Link
                  key={notice.id}
                  to={`/notices/${notice.slug}`}
                  className="block bg-surface rounded-2xl p-4 sm:p-5 border border-sand hover:border-gold/60 shadow-sakinah-sm hover:shadow-sakinah-card transition-all active:scale-[0.98] tap-feedback"
                >
                  <div className="flex items-center justify-between text-xs text-ink-muted mb-2">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-gold-text" />
                      <span>{dateStr}</span>
                    </span>
                    {notice.isPinned && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary-soft text-primary-dark text-[10px] font-bold border border-primary/20">
                        <Pin className="w-3 h-3 text-primary" />
                        <span>{t('notices.pinned') || (locale === 'bn' ? 'জরুরি' : 'Pinned')}</span>
                      </span>
                    )}
                  </div>

                  <h3 className="font-serif font-bold text-base sm:text-lg text-primary-dark group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                    {title}
                  </h3>

                  <div className="pt-3 mt-3 border-t border-sand flex items-center justify-between text-xs text-primary-dark font-semibold">
                    <span>{t('notices.read_more') || (locale === 'bn' ? 'বিস্তারিত পড়ুন' : 'Read details')}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-gold-text" />
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
        title={locale === 'bn' ? 'নোটিশ ফিল্টার' : 'Filter Notices'}
      >
        <div className="space-y-4 py-2 text-ink">
          <div className="space-y-2">
            <label className="text-xs font-bold text-primary-dark uppercase tracking-wider block">
              {locale === 'bn' ? 'ধরন' : 'Notice Type'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFilterPinned(false)}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all min-h-[44px] ${
                  !filterPinned
                    ? 'bg-primary text-white border-primary shadow-sakinah-sm'
                    : 'bg-surface text-ink-muted border-sand'
                }`}
              >
                {locale === 'bn' ? 'সকল নোটিশ' : 'All Notices'}
              </button>
              <button
                type="button"
                onClick={() => setFilterPinned(true)}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all min-h-[44px] ${
                  filterPinned
                    ? 'bg-primary text-white border-primary shadow-sakinah-sm'
                    : 'bg-surface text-ink-muted border-sand'
                }`}
              >
                {locale === 'bn' ? 'শুধুমাত্র জরুরি (পিন্ড)' : 'Pinned Only'}
              </button>
            </div>
          </div>

          <div className="pt-3">
            <button
              type="button"
              onClick={() => setFilterSheetOpen(false)}
              className="w-full py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-sakinah-sm min-h-[44px]"
            >
              {locale === 'bn' ? 'প্রয়োগ করুন' : 'Apply'}
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
