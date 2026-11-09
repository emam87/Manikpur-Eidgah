import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bell, Pin, Calendar, Search, ArrowRight, Download, 
  FileText, ChevronLeft, ChevronRight, Share2 
} from 'lucide-react';
import { SEO } from '../components/common/SEO.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { EightPointStar, StarDivider } from '../components/common/EightPointStar.jsx';

export function Notices() {
  const { locale, t, toBanglaNum, getLocalized } = useLanguage();

  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  useEffect(() => {
    fetchNotices();
  }, [searchQuery, currentPage]);

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
      });
      if (searchQuery.trim()) params.append('q', searchQuery.trim());

      const res = await fetch(`/api/public/notices?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load notices');
      const data = await res.json();
      if (data.success) {
        setNotices(data.notices || []);
        setPagination(data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
      }
    } catch (err) {
      console.error('Error fetching notices:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-10 sm:py-16">
      <SEO 
        title={locale === 'bn' ? 'নোটিশ ও সংবাদ' : 'Notices & News'} 
        description={locale === 'bn' ? 'মানিকপুর কেন্দ্রীয় শাহী ঈদগাহের সর্বশেষ নোটিশ, জামাত সময়সূচি ও জরুরি ঘোষণা।' : 'Latest announcements, prayer schedules, and notices from Manikpur Eidgah.'}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 sm:space-y-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950 text-gold-300 text-xs sm:text-sm font-semibold mb-3 border border-gold-500/40">
            <Bell className="w-3.5 h-3.5 text-gold-400" />
            <span>{locale === 'bn' ? 'দাপ্তরিক ও প্রকাশ্য ঘোষণা' : 'Official Announcements'}</span>
            <EightPointStar className="w-3.5 h-3.5 text-gold-400" />
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-extrabold text-stone-900 tracking-tight mb-4">
            {locale === 'bn' ? 'নোটিশ ও সংবাদ' : 'Notices & News'}
          </h1>
          <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
            {locale === 'bn' 
              ? 'ঈদের জামাতের সময়সূচি, সাধারণ সভা, কমিটি পুনর্গঠন ও উন্নয়ন সংক্রান্ত সকল অফিসিয়াল বিজ্ঞপ্তি।' 
              : 'Official circulars, prayer schedules, general meetings, and public notices.'}
          </p>
          <StarDivider className="my-4" />
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gold-500/30 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-md">
            <input
              type="text"
              placeholder={locale === 'bn' ? 'নোটিশের শিরোনাম বা বিষয়বস্তু খুঁজুন...' : 'Search by notice title or keyword...'}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50 text-sm bg-stone-50/50"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
          </div>

          <div className="text-xs sm:text-sm text-stone-500 w-full sm:w-auto text-right">
            {locale === 'bn' ? 'মোট প্রকাশিত নোটিশ: ' : 'Total Notices: '}
            <span className="font-bold text-emerald-900 font-serif text-base">{toBanglaNum(pagination.total)}</span>
            {locale === 'bn' ? ' টি' : ''}
          </div>
        </div>

        {/* Notices List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-stone-100 rounded-2xl animate-pulse border border-stone-200" />
            ))}
          </div>
        ) : notices.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-stone-200 space-y-4">
            <Bell className="w-12 h-12 text-stone-300 mx-auto" />
            <h3 className="font-serif text-xl font-bold text-stone-800">
              {locale === 'bn' ? 'কোনো নোটিশ পাওয়া যায়নি' : 'No Notices Found'}
            </h3>
            <p className="text-stone-500 text-sm max-w-md mx-auto">
              {locale === 'bn' ? 'এই মুহূর্তে অনুসন্ধানের সাথে মিলে এমন কোনো নোটিশ নেই।' : 'No announcements currently match your search.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notices.map((notice) => {
              const pubDate = notice.publishedAt 
                ? new Date(notice.publishedAt).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : '';

              return (
                <Link
                  key={notice.id}
                  to={`/notices/${notice.slug}`}
                  className={`block rounded-2xl p-5 sm:p-6 transition-all duration-200 border group ${
                    notice.isPinned
                      ? 'bg-gradient-to-r from-emerald-50 via-white to-gold-50/30 border-gold-400/80 shadow-md hover:border-gold-500'
                      : 'bg-white border-stone-200 hover:border-gold-500/40 hover:shadow-sm'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {notice.isPinned && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gold-500 text-emerald-950">
                            <Pin className="w-3 h-3 fill-current" />
                            <span>{locale === 'bn' ? 'জরুরি নোটিশ' : 'Pinned Notice'}</span>
                          </span>
                        )}
                        {pubDate && (
                          <span className="text-xs text-stone-500 flex items-center gap-1 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-stone-400" />
                            {pubDate}
                          </span>
                        )}
                        {notice.attachmentPath && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-800 font-semibold px-2 py-0.5 rounded bg-emerald-100">
                            <FileText className="w-3 h-3" />
                            <span>{locale === 'bn' ? 'সংযুক্তি রয়েছে' : 'Attachment'}</span>
                          </span>
                        )}
                      </div>

                      <h2 className="font-serif font-bold text-lg sm:text-xl text-stone-900 group-hover:text-emerald-900 transition-colors">
                        {getLocalized(notice, 'title')}
                      </h2>

                      {notice.bodyBn && (
                        <p className="text-xs sm:text-sm text-stone-600 line-clamp-2 leading-relaxed">
                          {getLocalized(notice, 'body')}
                        </p>
                      )}
                    </div>

                    <div className="sm:self-center shrink-0">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 group-hover:text-gold-600 transition-colors">
                        <span>{locale === 'bn' ? 'বিস্তারিত পড়ুন' : 'Read Notice'}</span>
                        <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
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

