import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Download,
  Eye,
  X,
  Calendar,
  Filter,
} from 'lucide-react';
import { SEO } from '../components/common/SEO.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { Breadcrumb } from '../components/common/Breadcrumb.jsx';
import { BottomSheet } from '../components/common/BottomSheet.jsx';

export function Documents() {
  const { locale, t, toBanglaNum, getLocalized } = useLanguage();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [previewDoc, setPreviewDoc] = useState(null);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  // Lock body scroll when document preview modal is open
  useEffect(() => {
    if (previewDoc) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [previewDoc]);

  const categories = [
    { value: '', labelBn: 'সকল দলিল ও রেকর্ড', labelEn: 'All Documents' },
    { value: 'DEED', labelBn: 'ওয়াকফ ও মূল দলিল', labelEn: 'Waqf & Registered Deeds' },
    { value: 'KHATIAN', labelBn: 'খতিয়ান', labelEn: 'Khatian Records' },
    { value: 'PORCHA', labelBn: 'পর্চা', labelEn: 'Porcha' },
    { value: 'MUTATION', labelBn: 'নামজারি / জমাভাগ', labelEn: 'Mutation' },
    { value: 'DCR', labelBn: 'ডি.সি.আর ও খাজনা রশিদ', labelEn: 'DCR & Tax Receipts' },
    { value: 'COURT_ORDER', labelBn: 'আদালতের আদেশ / রায়', labelEn: 'Court Orders' },
    { value: 'RESOLUTION', labelBn: 'কমিটির রেজুলেশন', labelEn: 'Committee Resolutions' },
    { value: 'OTHER', labelBn: 'অন্যান্য নথি', labelEn: 'Other Legal Papers' },
  ];

  useEffect(() => {
    setCurrentPage(1);
    loadDocuments(1, false);
  }, [searchQuery, selectedCategory]);

  const loadDocuments = async (page = 1, append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (searchQuery.trim()) params.append('q', searchQuery.trim());
      if (selectedCategory) params.append('category', selectedCategory);

      const res = await fetch(`/api/public/documents?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch documents');
      const data = await res.json();
      if (data.success) {
        if (append) {
          setDocuments((prev) => [...prev, ...(data.documents || [])]);
        } else {
          setDocuments(data.documents || []);
        }
        setPagination(data.pagination || { page, limit: 20, total: 0, totalPages: 1 });
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    loadDocuments(nextPage, true);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const getCategoryLabel = (val) => {
    const found = categories.find((c) => c.value === val);
    if (!found) return val;
    return locale === 'bn' ? found.labelBn : found.labelEn;
  };

  const hasMore = documents.length < pagination.total;

  return (
    <div className="py-4 sm:py-8 page-enter">
      <SEO
        title={locale === 'bn' ? 'দলিল ও কাগজপত্র' : 'Legal Documents Archive'}
        description={
          locale === 'bn'
            ? 'মানিকপুর ঈদগাহের ওয়াকফ দলিল, খতিয়ান, পর্চা ও আইনি কাগজপত্রের উন্মুক্ত সংরক্ষণাগার।'
            : 'Public legal archive of registered waqf deeds, khatians, and official records of Manikpur Eidgah.'
        }
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <Breadcrumb items={[{ label: locale === 'bn' ? 'দলিল ও স্বচ্ছতা' : 'Legal Documents' }]} />

        {/* Page Title & Total Count Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-sand pb-3">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-primary-dark tracking-tight">
              {locale === 'bn' ? 'দলিল ও কাগজপত্র সংরক্ষণাগার' : 'Legal Documents Archive'}
            </h1>
            <p className="text-xs sm:text-sm text-ink-muted mt-0.5">
              {locale === 'bn'
                ? 'ওয়াকফ দলিল, খতিয়ান, পর্চা ও আইনি কাগজপত্রের উন্মুক্ত ডিজিটাল কপি'
                : 'Registered waqf deeds, khatians, and official records of Manikpur Eidgah'}
            </p>
          </div>
          <div className="text-xs font-semibold text-primary-dark bg-primary-soft px-3 py-1 rounded-full border border-primary/20 w-fit">
            <span>{locale === 'bn' ? 'মোট নথি: ' : 'Total: '}</span>
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
                placeholder={locale === 'bn' ? 'দলিলের নাম বা নম্বর খুঁজুন...' : 'Search by document name or number...'}
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

            {/* Filter Button (Opens Category Bottom Sheet) */}
            <button
              type="button"
              onClick={() => setFilterSheetOpen(true)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-bold shadow-sakinah-sm transition-all min-h-[42px] tap-feedback ${
                selectedCategory
                  ? 'bg-primary text-white border-primary'
                  : 'bg-surface text-primary-dark border-sand hover:bg-primary-soft/50'
              }`}
              aria-label="Filter documents by category"
            >
              <Filter className="w-4 h-4" />
              <span>{locale === 'bn' ? 'ক্যাটাগরি' : 'Category'}</span>
              {selectedCategory && <span className="w-2 h-2 rounded-full bg-gold" />}
            </button>
          </div>
        </div>

        {/* Documents Grid / Feed */}
        {loading ? (
          <div className="space-y-3 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:space-y-0 sm:gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-32 sm:h-52 rounded-2xl bg-surface border border-sand animate-pulse" />
            ))}
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-16 bg-surface rounded-2xl border border-sand shadow-sakinah-sm space-y-3">
            <FileText className="w-10 h-10 text-ink-muted/50 mx-auto" />
            <h3 className="font-serif text-lg font-bold text-primary-dark">
              {locale === 'bn' ? 'কোনো নথি পাওয়া যায়নি' : 'No Documents Found'}
            </h3>
            <p className="text-xs text-ink-muted">
              {locale === 'bn' ? 'অনুসন্ধান বা ক্যাটাগরি পরিবর্তন করে আবার চেষ্টা করুন।' : 'Try adjusting your search criteria.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:space-y-0 sm:gap-4">
            {documents.map((doc) => {
              const title = getLocalized(doc, 'title');
              if (locale === 'en' && !title) return null;
              const isPdf = (doc.fileMime && doc.fileMime.includes('pdf')) || (doc.filePath && doc.filePath.endsWith('.pdf'));

              return (
                <div
                  key={doc.id}
                  className="bg-surface rounded-2xl border border-sand p-4 sm:p-5 shadow-sakinah-sm hover:border-gold/60 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-primary-soft text-primary-dark text-[10px] font-bold border border-primary/20">
                        {getCategoryLabel(doc.category)}
                      </span>
                      {doc.documentDate && (
                        <span className="text-[11px] text-ink-muted flex items-center gap-1 tabular-nums">
                          <Calendar className="w-3 h-3 text-gold-text" />
                          {new Date(doc.documentDate).getFullYear()}
                        </span>
                      )}
                    </div>

                    <h3 className="font-serif font-bold text-sm sm:text-base text-primary-dark line-clamp-2 leading-snug">
                      {title}
                    </h3>

                    {doc.documentNo && (
                      <p className="text-xs text-ink-muted font-mono tabular-nums">
                        {locale === 'bn' ? 'নম্বর: ' : 'Doc No: '}
                        <span className="font-semibold text-ink">
                          {locale === 'bn' ? toBanglaNum(doc.documentNo) : doc.documentNo}
                        </span>
                      </p>
                    )}

                    {getLocalized(doc, 'description') && (
                      <p className="text-xs text-ink-muted line-clamp-2 leading-relaxed">
                        {getLocalized(doc, 'description')}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 mt-3 border-t border-sand flex items-center justify-between gap-2">
                    <span className="text-[11px] text-ink-muted">
                      {isPdf ? (locale === 'bn' ? 'PDF নথি' : 'PDF') : (locale === 'bn' ? 'চিত্র' : 'Image')}{' '}
                      {doc.fileSize ? `(${formatFileSize(doc.fileSize)})` : ''}
                    </span>

                    <div className="flex items-center gap-2">
                      {doc.filePath && (
                        <>
                          <button
                            type="button"
                            onClick={() => setPreviewDoc(doc)}
                            className="px-3 py-1.5 rounded-xl bg-primary-soft text-primary-dark text-xs font-bold hover:bg-primary hover:text-white transition-colors flex items-center gap-1 min-h-[36px] tap-feedback"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{locale === 'bn' ? 'দেখুন' : 'Preview'}</span>
                          </button>

                          <a
                            href={doc.filePath}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="p-1.5 rounded-xl bg-canvas-alt text-ink hover:text-primary border border-sand transition-colors flex items-center justify-center min-w-[36px] min-h-[36px] tap-feedback"
                            aria-label={locale === 'bn' ? 'ডাউনলোড' : 'Download'}
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </>
                      )}
                    </div>
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
                <span>{locale === 'bn' ? 'আরও দেখুন (২০টি)' : 'Load More (20)'}</span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Category Filter Bottom Sheet */}
      <BottomSheet
        isOpen={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        title={locale === 'bn' ? 'দলিলের ক্যাটাগরি' : 'Document Category'}
      >
        <div className="space-y-1.5 py-2">
          {categories.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => {
                setSelectedCategory(cat.value);
                setFilterSheetOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all tap-feedback min-h-[46px] ${
                selectedCategory === cat.value
                  ? 'bg-primary text-white font-bold shadow-sakinah-sm'
                  : 'bg-canvas-alt text-ink hover:bg-primary-soft/50'
              }`}
            >
              <span>{locale === 'bn' ? cat.labelBn : cat.labelEn}</span>
              {selectedCategory === cat.value && <span className="text-xs">✓</span>}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* Document Fullscreen Preview Modal */}
      {previewDoc && (
        <div
          className="fixed inset-0 z-50 bg-scrim/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in"
          onClick={() => setPreviewDoc(null)}
        >
          <div
            className="bg-surface rounded-2xl max-w-4xl w-full max-h-[92dvh] flex flex-col shadow-sakinah-lift overflow-hidden border border-sand"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-sand bg-canvas-alt">
              <div className="min-w-0 pr-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gold-text block">
                  {getCategoryLabel(previewDoc.category)}
                </span>
                <h3 className="font-serif font-bold text-sm sm:text-base text-primary-dark truncate">
                  {getLocalized(previewDoc, 'title')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="p-1.5 rounded-full bg-surface text-ink-muted hover:text-ink border border-sand min-w-[36px] min-h-[36px] flex items-center justify-center"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 bg-canvas flex items-center justify-center">
              {((previewDoc.fileMime && previewDoc.fileMime.includes('pdf')) || (previewDoc.filePath && previewDoc.filePath.endsWith('.pdf'))) ? (
                <iframe
                  src={previewDoc.filePath}
                  title={getLocalized(previewDoc, 'title')}
                  className="w-full h-[65dvh] border-0 rounded-xl bg-surface"
                />
              ) : (
                <img
                  src={previewDoc.filePath}
                  alt={getLocalized(previewDoc, 'title')}
                  className="max-w-full max-h-[65dvh] object-contain rounded-xl shadow-sakinah-sm"
                />
              )}
            </div>

            <div className="p-3 border-t border-sand bg-canvas-alt flex items-center justify-end gap-2">
              <a
                href={previewDoc.filePath}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-sakinah-sm flex items-center gap-1.5 min-h-[40px] tap-feedback"
              >
                <Download className="w-4 h-4" />
                <span>{locale === 'bn' ? 'নথিটি ডাউনলোড করুন' : 'Download File'}</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
