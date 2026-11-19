import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Globe, AlertTriangle, CheckCircle2, Search, Filter, 
  ExternalLink, RefreshCw, Users, Landmark, Users2, Images, 
  FileText, Bell, Compass, ArrowRight, ShieldCheck 
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { SEO } from '../../components/common/SEO.jsx';

export function AdminMissingTranslations() {
  const { toBanglaNum, t, locale } = useLanguage();
  const [data, setData] = useState({ totalMissing: 0, breakdown: {}, items: [] });
  const [loading, setLoading] = useState(true);
  const [filterModel, setFilterModel] = useState('ALL');
  const [search, setSearch] = useState('');

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/missing-translations');
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error('Failed to fetch missing translations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const modelIcons = {
    Member: Users,
    LandDonor: Landmark,
    Donor: Landmark,
    CommitteeMember: Users2,
    Album: Images,
    Photo: Images,
    Document: FileText,
    LandMap: FileText,
    Notice: Bell,
    Design: Compass,
  };

  const filteredItems = data.items.filter((item) => {
    if (filterModel !== 'ALL' && item.model !== filterModel) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchModel = item.model.toLowerCase().includes(q);
      const matchFields = item.missingFields.some((f) => f.toLowerCase().includes(q));
      if (!matchTitle && !matchModel && !matchFields) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <SEO title="অনুবাদ নিরীক্ষা ও অনুপস্থিত রিপোর্ট - অ্যাডমিন" noIndex={true} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-6 rounded-3xl border border-sand shadow-sakinah-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-warning-soft text-warning flex items-center justify-center border border-gold/30 shadow-inner">
            <Globe className="w-6 h-6 text-warning" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-serif text-ink">
              অনুবাদ নিরীক্ষা রিপোর্ট (Missing Translations)
            </h1>
            <p className="text-xs text-ink-muted">
              ওয়েবসাইটের সকল টেবিলে বাংলা বা ইংরেজি অনুবাদের পূর্ণাঙ্গ পর্যবেক্ষণ ও তালিকা
            </p>
          </div>
        </div>

        <button
          onClick={fetchReport}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-canvas hover:bg-canvas-alt text-ink text-xs font-semibold transition-colors border border-sand self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>রিফ্রেশ করুন</span>
        </button>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface p-5 rounded-3xl border border-sand shadow-sakinah-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-ink-muted block mb-1">মোট অনুবাদ অনুপস্থিত</span>
            <span className="text-3xl font-extrabold font-serif text-warning">
              {toBanglaNum(data.totalMissing)}
            </span>
            <span className="text-[11px] text-ink-muted block mt-1">টি রেকর্ডে তথ্য পূরণ প্রয়োজন</span>
          </div>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
            data.totalMissing > 0 
              ? 'bg-warning-soft text-warning border-gold/30' 
              : 'bg-primary-soft text-primary-dark border-primary/25'
          }`}>
            {data.totalMissing > 0 ? <AlertTriangle className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
          </div>
        </div>

        <div className="bg-surface p-5 rounded-3xl border border-sand shadow-sakinah-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-ink-muted block mb-1">আজীবন সদস্য</span>
            <span className="text-2xl font-bold font-serif text-ink">
              {toBanglaNum(data.breakdown?.members || 0)}
            </span>
            <span className="text-[11px] text-ink-muted block mt-1">জন সদস্যের ইংরেজি বাকি</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-canvas text-ink-muted flex items-center justify-center border border-sand">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-surface p-5 rounded-3xl border border-sand shadow-sakinah-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-ink-muted block mb-1">জমিদাতা পরিষদ</span>
            <span className="text-2xl font-bold font-serif text-ink">
              {toBanglaNum(data.breakdown?.landDonors || 0)}
            </span>
            <span className="text-[11px] text-ink-muted block mt-1">জন দাতার অনুবাদ প্রয়োজন</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-canvas text-ink-muted flex items-center justify-center border border-sand">
            <Landmark className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-surface p-5 rounded-3xl border border-sand shadow-sakinah-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-ink-muted block mb-1">কমিটি ও অন্যান্য</span>
            <span className="text-2xl font-bold font-serif text-ink">
              {toBanglaNum(
                (data.breakdown?.committee || 0) + 
                (data.breakdown?.albums || 0) + 
                (data.breakdown?.notices || 0) +
                (data.breakdown?.documents || 0)
              )}
            </span>
            <span className="text-[11px] text-ink-muted block mt-1">টি কন্টেন্টে অনুবাদ প্রয়োজন</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-canvas text-ink-muted flex items-center justify-center border border-sand">
            <Users2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface p-4 rounded-2xl border border-sand shadow-sakinah-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="রেকর্ডের শিরোনাম, নাম বা অনুপস্থিত ফিল্ড দিয়ে খুঁজুন..."
            className="w-full pl-10 pr-4 py-2 bg-canvas border border-sand rounded-xl text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-primary focus:bg-surface transition-all"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={filterModel}
            onChange={(e) => setFilterModel(e.target.value)}
            className="px-3 py-2 bg-canvas border border-sand rounded-xl text-xs font-semibold text-ink focus:outline-none focus:border-primary focus:bg-surface"
          >
            <option value="ALL">সকল বিভাগ (All Categories)</option>
            <option value="Member">আজীবন সদস্য (Members)</option>
            <option value="LandDonor">জমিদাতা (Land Donors)</option>
            <option value="Donor">অনুদানকারী (Legacy Donors)</option>
            <option value="CommitteeMember">কমিটি পরিষদ (Committee)</option>
            <option value="Album">ফটো অ্যালবাম (Albums)</option>
            <option value="Notice">নোটিশ বোর্ড (Notices)</option>
            <option value="Document">দলিল সংরক্ষণাগার (Documents)</option>
            <option value="LandMap">মৌজা নকশা (Land Maps)</option>
            <option value="Design">৩ডি ডিজাইন (Designs)</option>
          </select>

          {(search || filterModel !== 'ALL') && (
            <button
              onClick={() => { setSearch(''); setFilterModel('ALL'); }}
              className="px-3 py-2 text-xs font-semibold text-danger hover:bg-danger-soft rounded-xl transition-colors"
            >
              রিসেট
            </button>
          )}
        </div>
      </div>

      {/* Table or Empty State */}
      <div className="bg-surface rounded-3xl border border-sand shadow-sakinah-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-ink-muted text-sm font-medium">
            নিরীক্ষা ডাটা লোড হচ্ছে...
          </div>
        ) : data.totalMissing === 0 ? (
          <div className="p-12 text-center space-y-3">
            <CheckCircle2 className="w-14 h-14 text-primary mx-auto" />
            <h2 className="text-lg font-bold font-serif text-primary-dark">
              আলহামদুলিল্লাহ! সকল তথ্য ১০০% দ্বৈত ভাষায় অনুবাদ সম্পন্ন!
            </h2>
            <p className="text-xs text-ink-muted max-w-md mx-auto">
              ওয়েবসাইটের কোনো টেবিলে বাংলা বা ইংরেজি তথ্যের ঘাটতি নেই। বাংলা ও ইংরেজি উভয় ব্যবহারকারীই সম্পূর্ণ তথ্য দেখতে পাবেন।
            </p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center text-ink-muted text-sm">
            এই ফিল্টারে কোনো অনুপস্থিত অনুবাদের রেকর্ড মেলেনি।
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-ink border-collapse">
              <thead className="bg-canvas-alt border-b border-sand text-ink-muted font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">বিভাগ / মডেল</th>
                  <th className="py-3 px-4">রেকর্ডের নাম / শিরোনাম</th>
                  <th className="py-3 px-4">অনুপস্থিত ফিল্ডসমূহ</th>
                  <th className="py-3 px-4 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand">
                {filteredItems.map((item, idx) => {
                  const Icon = modelIcons[item.model] || Globe;
                  return (
                    <tr key={`${item.model}-${item.id}-${idx}`} className="hover:bg-canvas-alt/60 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-canvas text-ink-muted border border-sand flex items-center justify-center">
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="font-bold text-ink block">{item.modelLabelBn}</span>
                            <span className="text-[10px] text-ink-muted">{item.modelLabelEn}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-semibold text-ink">
                        {item.title}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {item.missingFields.map((f) => (
                            <span
                              key={f}
                              className="px-2 py-0.5 rounded-md bg-warning-soft text-warning border border-gold/30 font-mono text-[10px] font-bold"
                            >
                              {f.endsWith('En') ? `English: ${f}` : `Bangla: ${f}`}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <Link
                          to={item.editUrl}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold text-xs transition-colors shadow-xs"
                        >
                          <span>সম্পাদনা করুন</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

