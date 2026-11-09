import React, { useState, useEffect } from 'react';
import { 
  FileText, Search, Download, Eye, X, ExternalLink, Calendar, 
  FileCheck, ShieldCheck, ChevronLeft, ChevronRight, FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { SEO } from '../components/common/SEO.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { EightPointStar, StarDivider } from '../components/common/EightPointStar.jsx';

export function Documents() {
  const { locale, t, toBanglaNum, getLocalized } = useLanguage();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [previewDoc, setPreviewDoc] = useState(null);

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
    fetchDocuments();
  }, [searchQuery, selectedCategory, currentPage]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
      });
      if (searchQuery.trim()) params.append('q', searchQuery.trim());
      if (selectedCategory) params.append('category', selectedCategory);

      const res = await fetch(`/api/public/documents?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch documents');
      const data = await res.json();
      if (data.success) {
        setDocuments(data.documents || []);
        setPagination(data.pagination || { page: 1, limit: 12, total: 0, totalPages: 1 });
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="py-10 sm:py-16">
      <SEO 
        title={locale === 'bn' ? 'দলিল ও কাগজপত্র' : 'Legal Documents Archive'} 
        description={locale === 'bn' ? 'মানিকপুর কেন্দ্রীয় শাহী ঈদগাহের ওয়াকফ দলিল, খতিয়ান, পর্চা ও আইনি কাগজপত্রের উন্মুক্ত সংরক্ষণাগার।' : 'Public legal archive of registered waqf deeds, khatians, and official records of Manikpur Eidgah.'}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 sm:space-y-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950 text-gold-300 text-xs sm:text-sm font-semibold mb-3 border border-gold-500/40">
            <ShieldCheck className="w-3.5 h-3.5 text-gold-400" />
            <span>{locale === 'bn' ? 'স্বচ্ছতা ও আইনি নিশ্চয়তা' : 'Legal Transparency'}</span>
            <EightPointStar className="w-3.5 h-3.5 text-gold-400" />
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-extrabold text-stone-900 tracking-tight mb-4">
            {locale === 'bn' ? 'দলিল ও স্বচ্ছতা সংরক্ষণাগার' : 'Legal Documents Archive'}
          </h1>
          <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
            {locale === 'bn' 
              ? 'মানিকপুর কেন্দ্রীয় শাহী ঈদগাহের ১.৩৫ একর ওয়াকফ ভূমির সকল বৈধ দলিল, খতিয়ান ও আইনি কাগজপত্রের উন্মুক্ত সংগ্রহশালা।' 
              : 'Official open archive of registered waqf deeds, surveys, mutation, and legal records ensuring total community transparency.'}
          </p>
          <StarDivider className="my-4" />
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => {
                setSelectedCategory(cat.value);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.value
                  ? 'bg-emerald-900 text-gold-200 shadow-md border border-gold-500/50'
                  : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200'
              }`}
            >
              {locale === 'bn' ? cat.labelBn : cat.labelEn}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gold-500/30 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-md">
            <input
              type="text"
              placeholder={locale === 'bn' ? 'দলিলের শিরোনাম বা নম্বর দিয়ে অনুসন্ধান করুন...' : 'Search by title or document number...'}
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
            {locale === 'bn' ? 'মোট সংরক্ষিত নথি: ' : 'Total Documents: '}
            <span className="font-bold text-emerald-900 font-serif text-base">{toBanglaNum(pagination.total)}</span>
            {locale === 'bn' ? ' টি' : ''}
          </div>
        </div>

        {/* Documents Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 rounded-2xl bg-stone-100 animate-pulse border border-stone-200" />
            ))}
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-stone-200 space-y-4">
            <FileText className="w-12 h-12 text-stone-300 mx-auto" />
            <h3 className="font-serif text-xl font-bold text-stone-800">
              {locale === 'bn' ? 'কোনো উন্মুক্ত দলিল পাওয়া যায়নি' : 'No Public Documents Found'}
            </h3>
            <p className="text-stone-500 text-sm max-w-md mx-auto">
              {locale === 'bn' ? 'এই ক্যাটাগরিতে কোনো নথি অন্তর্ভুক্ত নেই অথবা অনুসন্ধানে পাওয়া যায়নি।' : 'No documents available under this category.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc) => {
              const isPdf = (doc.fileMime && doc.fileMime.includes('pdf')) || (doc.filePath && doc.filePath.endsWith('.pdf'));

              return (
                <div
                  key={doc.id}
                  className="bg-white rounded-2xl border border-gold-500/30 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {getCategoryLabel(doc.category)}
                      </span>
                      {doc.documentDate && (
                        <span className="text-xs text-stone-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(doc.documentDate).getFullYear()}
                        </span>
                      )}
                    </div>

                    <h3 className="font-serif font-bold text-lg text-stone-900 group-hover:text-emerald-800 transition-colors">
                      {getLocalized(doc, 'title')}
                    </h3>

                    {doc.documentNo && (
                      <p className="text-xs text-stone-500 font-mono">
                        {locale === 'bn' ? 'নম্বর: ' : 'Doc No: '}
                        <span className="font-semibold text-stone-700">{toBanglaNum(doc.documentNo)}</span>
                      </p>
                    )}

                    {doc.descriptionBn && (
                      <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                        {getLocalized(doc, 'description')}
                      </p>
                    )}
                  </div>

                  <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-stone-400">
                      {isPdf ? 'PDF নথি' : 'চিত্র / স্ক্যান'} {doc.fileSize ? `(${formatFileSize(doc.fileSize)})` : ''}
                    </span>

                    <div className="flex items-center gap-2">
                      {doc.filePath && (
                        <>
                          <button
                            onClick={() => setPreviewDoc(doc)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold hover:bg-emerald-100 transition-colors flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{locale === 'bn' ? 'দেখুন' : 'Preview'}</span>
                          </button>

                          <a
                            href={doc.filePath}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="px-3 py-1.5 rounded-lg bg-gold-50 text-gold-800 text-xs font-semibold hover:bg-gold-100 transition-colors flex items-center gap-1 border border-gold-300/40"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>{locale === 'bn' ? 'ডাউনলোড' : 'Download'}</span>
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

      {/* Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-4xl w-full h-[85vh] flex flex-col overflow-hidden border border-gold-500/40 shadow-2xl relative">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-emerald-950 text-ivory flex items-center justify-between border-b border-gold-500/30">
              <div className="truncate pr-4">
                <span className="text-xs text-gold-300 font-semibold block uppercase">
                  {getCategoryLabel(previewDoc.category)}
                </span>
                <h3 className="font-serif font-bold text-base sm:text-lg truncate">
                  {getLocalized(previewDoc, 'title')}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewDoc.filePath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-emerald-900 hover:bg-emerald-800 text-gold-300 transition-colors"
                  title="নতুন ট্যাবে খুলুন"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-2 rounded-lg bg-emerald-900 hover:bg-emerald-800 text-gold-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Viewer */}
            <div className="flex-1 bg-stone-100 overflow-auto flex items-center justify-center p-2 sm:p-4">
              {(previewDoc.fileMime && previewDoc.fileMime.includes('pdf')) || previewDoc.filePath.endsWith('.pdf') ? (
                <div className="w-full h-full flex flex-col items-center">
                  <iframe
                    src={`${previewDoc.filePath}#toolbar=0`}
                    title={getLocalized(previewDoc, 'title')}
                    className="w-full h-full rounded-xl border border-stone-200 hidden sm:block"
                  />
                  {/* Mobile PDF Fallback */}
                  <div className="sm:hidden text-center p-8 bg-white rounded-2xl border border-stone-200 space-y-4 my-auto">
                    <FileText className="w-12 h-12 text-emerald-800 mx-auto" />
                    <p className="text-sm text-stone-700">
                      {locale === 'bn' 
                        ? 'মোবাইলে সরাসরি পিডিএফ প্রদর্শনে সীমাবদ্ধতা থাকলে ডাউনলোড করে দেখুন।' 
                        : 'Tap below to download or view this PDF directly on your device.'}
                    </p>
                    <a
                      href={previewDoc.filePath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-900 text-gold-200 font-semibold text-sm shadow-md"
                    >
                      <Download className="w-4 h-4" />
                      <span>{locale === 'bn' ? 'পিডিএফ খুলুন / ডাউনলোড' : 'Open / Download PDF'}</span>
                    </a>
                  </div>
                </div>
              ) : (
                <img
                  src={previewDoc.filePath}
                  alt={getLocalized(previewDoc, 'title')}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-md"
                />
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
              <span className="text-xs text-stone-500">
                {previewDoc.documentNo && `${locale === 'bn' ? 'দলিল নং: ' : 'Doc No: '}${toBanglaNum(previewDoc.documentNo)}`}
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={previewDoc.filePath}
                  download
                  className="px-4 py-2 rounded-xl bg-emerald-900 text-gold-200 text-xs sm:text-sm font-semibold hover:bg-emerald-800 transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>{locale === 'bn' ? 'ডাউনলোড করুন' : 'Download'}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

