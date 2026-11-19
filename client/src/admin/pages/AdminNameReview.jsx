import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileSearch, AlertCircle, CheckCircle2, Search, Filter, 
  ExternalLink, RefreshCw, Users, Landmark, Users2, Images, 
  FileText, Bell, Compass, ArrowRight, Settings 
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { SEO } from '../../components/common/SEO.jsx';

export function AdminNameReview() {
  const { toBanglaNum } = useLanguage();
  const [data, setData] = useState({ count: 0, findings: [] });
  const [loading, setLoading] = useState(true);
  const [filterModel, setFilterModel] = useState('ALL');
  const [search, setSearch] = useState('');

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/name-review');
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error('Failed to fetch name review report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const modelIcons = {
    SiteSetting: Settings,
    Member: Users,
    LandDonor: Landmark,
    CommitteeMember: Users2,
    Album: Images,
    Document: FileText,
    LandMap: FileText,
    Notice: Bell,
    Design: Compass,
  };

  const filteredItems = (data.findings || []).filter((item) => {
    if (filterModel !== 'ALL' && item.model !== filterModel) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchTitle = (item.title || '').toLowerCase().includes(q);
      const matchSnippet = (item.snippet || '').toLowerCase().includes(q);
      const matchField = (item.fieldName || '').toLowerCase().includes(q);
      if (!matchTitle && !matchSnippet && !matchField) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <SEO title="নাম পর্যালোচনা ও অডিট রিপোর্ট | মানিকপুর ঈদগাহ" />

      {/* Header */}
      <div className="bg-surface rounded-3xl p-6 sm:p-8 border border-sand shadow-sakinah-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-warning-soft text-warning border border-gold/30 mb-2">
            <FileSearch className="w-4 h-4 text-warning" />
            <span>অফিসিয়াল নাম অডিট রিপোর্ট (Official Name Review)</span>
          </div>
          <h1 className="font-serif text-2xl font-bold text-ink">
            পুরাতন নাম পর্যালোচনা (Name Review)
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted mt-1 max-w-2xl leading-relaxed">
            ওয়েবসাইটের অফিসিয়াল নাম হলো <strong>মানিকপুর ঈদগাহ</strong> (Manikpur Eidgah)। ডেটাবেজের দীর্ঘ টেক্সট কনটেন্ট (ইতিহাস, নোটিশ, জীবনবৃত্তান্ত, বয়ান ইত্যাদি) নিজ দায়িত্বে যাচাই করে সম্পাদনা করার জন্য নিচের তালিকাভুক্ত রেকর্ডসমূহ পর্যালোচনা করুন।
          </p>
        </div>

        <button
          onClick={fetchReport}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-sand text-xs font-bold text-ink hover:bg-canvas-alt transition-colors shadow-sakinah-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>রিফ্রেশ করুন</span>
        </button>
      </div>

      {/* Summary Card */}
      <div className="bg-surface rounded-2xl p-5 border border-sand shadow-sakinah-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {data.count === 0 ? (
            <div className="w-10 h-10 rounded-xl bg-primary-soft flex items-center justify-center text-primary-dark">
              <CheckCircle2 className="w-6 h-6 text-primary" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-warning-soft flex items-center justify-center text-warning">
              <AlertCircle className="w-6 h-6 text-warning" />
            </div>
          )}
          <div>
            <h3 className="font-bold text-ink text-sm">
              {data.count === 0 ? 'সব রেকর্ড সম্পূর্ণ পরিচ্ছন্ন!' : `মোট ${toBanglaNum(data.count)} টি রেকর্ডে পুরাতন নাম চিহ্নিত হয়েছে`}
            </h3>
            <p className="text-xs text-ink-muted">
              {data.count === 0
                ? 'কোনো নোটিশ, জীবনী বা ফ্রি-টেক্সটে পুরাতন নাম পাওয়া যায়নি।'
                : 'রেকর্ডগুলো যাচাই করে প্রয়োজনমতো সরাসরি সম্পাদনা বাটনে ক্লিক করে হালনাগাদ করুন।'}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="খুঁজুন..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-canvas border border-sand text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Findings List */}
      {loading ? (
        <div className="bg-surface rounded-2xl p-12 text-center border border-sand">
          <RefreshCw className="w-8 h-8 text-primary-dark animate-spin mx-auto mb-3" />
          <p className="text-xs text-ink-muted font-medium">রেকর্ড স্ক্যান করা হচ্ছে...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-surface rounded-2xl p-12 text-center border border-sand">
          <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-3" />
          <h3 className="font-serif font-bold text-ink text-base">কোনো পুরাতন নাম পাওয়া যায়নি</h3>
          <p className="text-xs text-ink-muted mt-1">
            সমস্ত কনটেন্ট অফিসিয়াল নাম "মানিকপুর ঈদগাহ" এর সাথে সামঞ্জস্যপূর্ণ।
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item, idx) => {
            const Icon = modelIcons[item.model] || FileText;
            return (
              <div
                key={`${item.model}-${item.id}-${item.fieldName}-${idx}`}
                className="bg-surface rounded-2xl p-4 sm:p-5 border border-sand shadow-sakinah-sm hover:border-gold/50 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-canvas text-ink border border-sand">
                      <Icon className="w-3 h-3 text-ink-muted" />
                      <span>{item.model}</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-warning-soft text-warning font-bold border border-gold/30">
                      Field: {item.fieldName}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-danger-soft text-danger font-bold border border-danger/30">
                      Match: "{item.matchedText}"
                    </span>
                  </div>

                  <h3 className="font-bold text-ink text-sm truncate">
                    {item.title}
                  </h3>

                  <p className="text-xs text-ink-muted bg-canvas p-2.5 rounded-xl border border-sand font-mono leading-relaxed">
                    {item.snippet}
                  </p>
                </div>

                <Link
                  to={item.editUrl}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-colors shadow-sakinah-sm shrink-0"
                >
                  <span>সম্পাদনা করুন</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

