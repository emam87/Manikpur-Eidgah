import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, HeartHandshake, Landmark, Images, FileText, Bell, Compass, 
  Trash2, TrendingUp, DollarSign, PlusCircle, ArrowUpRight, 
  Sparkles, ShieldCheck, History, Database, HardDrive, Award, Layers, Globe 
} from 'lucide-react';
import { 
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, CartesianGrid, Cell, Legend 
} from 'recharts';
import { useLanguage } from '../../context/LanguageContext.jsx';

export function AdminDashboard() {
  const { toBanglaNum, formatBDT } = useLanguage();
  const ADMIN_PATH = import.meta.env.VITE_ADMIN_PATH || 'eidgah-manage-k29x';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success) {
          setData(resData);
        }
      })
      .catch((err) => console.error('Dashboard stats fetch failed:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-64 bg-canvas-alt rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-canvas-alt rounded-2xl border border-sand" />
          ))}
        </div>
        <div className="h-80 bg-canvas-alt rounded-2xl border border-sand" />
      </div>
    );
  }

  const stats = data?.stats || {};
  const storage = data?.storage || { totalBytes: 0, totalFiles: 0, isR2: false, isProduction: false };
  const storageMB = (Number(storage.totalBytes || 0) / (1024 * 1024)).toFixed(2);
  const charts = data?.charts || {};
  const recentActivity = data?.recentActivity || [];
  const chartColors = [
    'var(--chart-series-1)',
    'var(--chart-series-2)',
    'var(--chart-series-3)',
    'var(--chart-series-4)',
    'var(--chart-series-5)',
  ];

  return (
    <div className="space-y-8">
      {/* Top Welcome & Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-surface p-6 rounded-3xl border border-sand shadow-sakinah-card">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-gold-text font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>সিস্টেম নিয়ন্ত্রণ কেন্দ্র</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-primary-dark">
            ড্যাশবোর্ড ওভারভিউ
          </h1>
        </div>

        {/* Quick Action Shortcuts */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/${ADMIN_PATH}/land-donors`}
            className="px-3.5 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-colors flex items-center gap-1.5 shadow-sakinah-sm"
          >
            <PlusCircle className="w-3.5 h-3.5 text-gold-plate-from" />
            <span>জমিদাতা যোগ</span>
          </Link>

          <Link
            to={`/${ADMIN_PATH}/members`}
            className="px-3.5 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-colors flex items-center gap-1.5 shadow-sakinah-sm"
          >
            <PlusCircle className="w-3.5 h-3.5 text-gold-plate-from" />
            <span>সদস্য যোগ</span>
          </Link>

          <Link
            to={`/${ADMIN_PATH}/gallery`}
            className="px-3.5 py-2 rounded-xl bg-gold-plate text-ink text-xs font-bold hover:brightness-105 transition-all flex items-center gap-1.5 shadow-sakinah-sm"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>ছবি আপলোড</span>
          </Link>
        </div>
      </div>

      {/* Main Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Land Donors */}
        <Link to={`/${ADMIN_PATH}/land-donors`} className="bg-surface rounded-3xl p-6 border border-sand shadow-sakinah-card flex items-center justify-between hover:border-gold/60 hover:shadow-sakinah-lift transition-all">
          <div>
            <span className="text-xs text-ink-muted font-semibold block mb-1">জমিদাতা পরিষদ</span>
            <span className="font-serif font-extrabold text-3xl text-primary-dark">
              {toBanglaNum(stats.landDonorsCount || 0)}
            </span>
            <span className="text-[11px] text-ink-muted block mt-1">
              মোট জমি: {toBanglaNum(Number(stats.totalLandInDecimal || 0).toFixed(1))} শতক
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-primary-soft text-primary-dark flex items-center justify-center border border-primary/20">
            <Landmark className="w-6 h-6" />
          </div>
        </Link>

        {/* Members */}
        <Link to={`/${ADMIN_PATH}/members`} className="bg-surface rounded-3xl p-6 border border-sand shadow-sakinah-card flex items-center justify-between hover:border-gold/60 hover:shadow-sakinah-lift transition-all">
          <div>
            <span className="text-xs text-ink-muted font-semibold block mb-1">আজীবন সদস্য</span>
            <span className="font-serif font-extrabold text-3xl text-primary-dark">
              {toBanglaNum(stats.membersCount || 0)}
            </span>
            <span className="text-[11px] text-ink-muted block mt-1">জন নিবন্ধিত সদস্য</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-primary-soft text-primary-dark flex items-center justify-center border border-primary/20">
            <Users className="w-6 h-6" />
          </div>
        </Link>

        {/* Total Funds Collected */}
        <div className="bg-surface rounded-3xl p-6 border-gold-double shadow-sakinah-card text-ink flex items-center justify-between">
          <div>
            <span className="text-xs text-gold-text font-semibold block mb-1">মোট সংগৃহীত তহবিল</span>
            <span className="font-serif font-extrabold text-2xl text-primary-dark">
              {formatBDT(stats.totalFunds || 0)}
            </span>
            <span className="text-[10px] text-ink-muted block mt-1">আজীবন অনুদান ও দান হিসাব</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gold/15 text-gold-text flex items-center justify-center border border-gold/40">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Gallery Photos */}
        <Link to={`/${ADMIN_PATH}/gallery`} className="bg-surface rounded-3xl p-6 border border-sand shadow-sakinah-card flex items-center justify-between hover:border-gold/60 hover:shadow-sakinah-lift transition-all">
          <div>
            <span className="text-xs text-ink-muted font-semibold block mb-1">ফটো গ্যালারি</span>
            <span className="font-serif font-extrabold text-3xl text-primary-dark">
              {toBanglaNum(stats.photosCount || 0)}
            </span>
            <span className="text-[11px] text-ink-muted block mt-1">টি ছবি ({toBanglaNum(stats.albumsCount || 0)} ফোল্ডার)</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-primary-soft text-primary-dark flex items-center justify-center border border-primary/20">
            <Images className="w-6 h-6" />
          </div>
        </Link>
      </div>

      {/* Secondary Quick Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link to={`/${ADMIN_PATH}/documents`} className="bg-surface p-4 rounded-2xl border border-sand hover:border-gold/50 hover:shadow-sakinah-sm transition-all flex items-center gap-3">
          <FileText className="w-5 h-5 text-primary" />
          <div>
            <span className="text-xs text-ink-muted block">সংরক্ষিত দলিল</span>
            <span className="font-bold text-ink">{toBanglaNum(stats.documentsCount || 0)} টি</span>
          </div>
        </Link>

        <Link to={`/${ADMIN_PATH}/notices`} className="bg-surface p-4 rounded-2xl border border-sand hover:border-gold/50 hover:shadow-sakinah-sm transition-all flex items-center gap-3">
          <Bell className="w-5 h-5 text-primary" />
          <div>
            <span className="text-xs text-ink-muted block">প্রকাশিত নোটিশ</span>
            <span className="font-bold text-ink">{toBanglaNum(stats.noticesCount || 0)} টি</span>
          </div>
        </Link>

        <Link to={`/${ADMIN_PATH}/designs`} className="bg-surface p-4 rounded-2xl border border-sand hover:border-gold/50 hover:shadow-sakinah-sm transition-all flex items-center gap-3">
          <Compass className="w-5 h-5 text-primary" />
          <div>
            <span className="text-xs text-ink-muted block">৩ডি মাস্টার নকশা</span>
            <span className="font-bold text-ink">{toBanglaNum(stats.designsCount || 0)} টি</span>
          </div>
        </Link>

        <Link to={`/${ADMIN_PATH}/trash`} className="bg-surface p-4 rounded-2xl border border-sand hover:border-danger/50 hover:shadow-sakinah-sm transition-all flex items-center gap-3">
          <Trash2 className="w-5 h-5 text-danger" />
          <div>
            <span className="text-xs text-ink-muted block">ট্র্যাশ বিন</span>
            <span className="font-bold text-danger">{toBanglaNum(stats.trashCount || 0)} টি</span>
          </div>
        </Link>
      </div>

      {/* Missing Translations Status Card */}
      <Link
        to={`/${ADMIN_PATH}/missing-translations`}
        className={`p-4 rounded-3xl border flex items-center justify-between transition-all shadow-sakinah-sm ${
          stats.missingTranslationsCount > 0
            ? 'bg-warning-soft border-warning/40 hover:border-warning'
            : 'bg-success-soft border-success/40 hover:border-success'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
            stats.missingTranslationsCount > 0
              ? 'bg-warning/15 text-warning'
              : 'bg-success/15 text-success'
          }`}>
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-ink font-serif">
                অনুবাদ পর্যবেক্ষণ ও নিরীক্ষা (Bilingual Audit)
              </span>
              {stats.missingTranslationsCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-warning/20 text-warning">
                  {toBanglaNum(stats.missingTranslationsCount)} টি তথ্যে অনুবাদ বাকি
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-success/20 text-success">
                  ১০০% অনুবাদ সম্পূর্ণ
                </span>
              )}
            </div>
            <p className="text-xs text-ink-muted mt-0.5">
              {stats.missingTranslationsCount > 0
                ? 'বাংলা বা ইংরেজি অনুবাদের ঘাটতিযুক্ত রেকর্ডগুলো দেখতে এখানে ক্লিক করুন'
                : 'সকল সদস্য, জমিদাতা, কমিটি ও দলিলের বাংলা ও ইংরেজি তথ্য সম্পূর্ণ রয়েছে'}
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1 text-xs font-semibold text-primary-dark">
          <span>রিপোর্ট দেখুন</span>
          <ArrowUpRight className="w-4 h-4" />
        </div>
      </Link>

      {/* Database & Media Storage Safety Card */}
      <div
        className={`rounded-2xl border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sakinah-sm ${
          storage.isProduction && !storage.isR2
            ? 'bg-warning-soft border-warning/40'
            : 'bg-surface border-sand'
        }`}
      >
        <div className="flex items-start gap-3.5">
          <div
            className={`p-2.5 rounded-xl shrink-0 ${
              storage.isProduction && !storage.isR2
                ? 'bg-warning/15 text-warning'
                : 'bg-primary-soft text-primary-dark'
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-ink">
                ডাটাবেজ ও মিডিয়া স্টোরেজ সুরক্ষা
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-success-soft text-success">
                <Database className="w-3 h-3" />
                PostgreSQL সরাসরি সংরক্ষণ ও ডিলিট সক্রিয়
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                  storage.isR2
                    ? 'bg-primary-soft text-primary-dark'
                    : 'bg-canvas-alt text-ink-muted border border-sand'
                }`}
              >
                <HardDrive className="w-3 h-3" />
                {storage.isR2 ? 'Cloudflare R2 সক্রিয়' : 'লোকাল ডিস্ক (server/uploads)'}
              </span>
            </div>
            <p className="text-xs text-ink-muted">
              মোট সংরক্ষিত মিডিয়া ও দলিল:{' '}
              <span className="font-semibold text-ink">
                {toBanglaNum(storage.totalFiles)} টি ফাইল ({toBanglaNum(storageMB)} MB)
              </span>
              । সম্পূর্ণ ডাটাবেজ (JSON) ও সকল ছবি/দলিল (ZIP) ব্যাকআপ নিতে অ্যাক্টিভিটি লগ পেজে যান।
            </p>
            {storage.isProduction && !storage.isR2 && (
              <p className="text-xs font-semibold text-warning">
                সতর্কতা: প্রোডাকশনে Cloudflare R2 এনভায়রনমেন্ট ভ্যারিয়েবল সেট না থাকলে সার্ভার রিস্টার্টে লোকাল আপলোড ফাইল হারিয়ে যেতে পারে।
              </p>
            )}
          </div>
        </div>

        <Link
          to={`/${ADMIN_PATH}/activity-logs`}
          className="inline-flex items-center gap-1.5 self-start sm:self-center shrink-0 px-3.5 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-colors"
        >
          <span>ব্যাকআপ নিন</span>
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donations by Purpose Chart */}
        <div className="bg-surface rounded-3xl p-6 border border-sand shadow-sakinah-card space-y-4">
          <div className="flex items-center justify-between border-b border-sand pb-3">
            <div>
              <h2 className="font-serif font-bold text-base text-primary-dark">
                খাতভিত্তিক অনুদান বণ্টন
              </h2>
              <p className="text-xs text-ink-muted">বিভিন্ন তহবিলে সংগৃহীত অনুদানের পরিমাণ</p>
            </div>
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.donorsByPurpose || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="purpose" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <Tooltip
                  formatter={(val) => [`${formatBDT(val)}`, 'পরিমাণ']}
                  contentStyle={{ borderRadius: '12px', borderColor: 'var(--gold)', backgroundColor: 'var(--surface)', color: 'var(--text)', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="totalAmount" name="মোট অনুদান (৳)" fill="var(--chart-series-1)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lifetime Members Growth by Year */}
        <div className="bg-surface rounded-3xl p-6 border border-sand shadow-sakinah-card space-y-4">
          <div className="flex items-center justify-between border-b border-sand pb-3">
            <div>
              <h2 className="font-serif font-bold text-base text-primary-dark">
                বছরভিত্তিক আজীবন সদস্য সংযোজন
              </h2>
              <p className="text-xs text-ink-muted">প্রতি বছর ঈদগাহে যোগ দেওয়া সদস্য সংখ্যা</p>
            </div>
            <Users className="w-4 h-4 text-primary" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.membersByYear || []}>
                <defs>
                  <linearGradient id="colorMembers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-series-2)" stopOpacity={0.75} />
                    <stop offset="95%" stopColor="var(--chart-series-2)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <Tooltip
                  formatter={(val) => [`${toBanglaNum(val)} জন`, 'নতুন সদস্য']}
                  contentStyle={{ borderRadius: '12px', borderColor: 'var(--gold)', backgroundColor: 'var(--surface)', color: 'var(--text)', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Area type="monotone" dataKey="count" name="নতুন সদস্য" stroke="var(--chart-series-2)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorMembers)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Land Donation Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Land Donated by Year */}
        <div className="bg-surface rounded-3xl p-6 border border-sand shadow-sakinah-card space-y-4">
          <div className="flex items-center justify-between border-b border-sand pb-3">
            <div>
              <h2 className="font-serif font-bold text-base text-primary-dark">
                সালভিত্তিক ভূমিদান (শতাংশ)
              </h2>
              <p className="text-xs text-ink-muted">প্রতি বছর ঈদগাহে ওয়াকফ ও দানকৃত জমির পরিমাণ</p>
            </div>
            <Landmark className="w-4 h-4 text-primary" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.landByYear || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <Tooltip
                  formatter={(val, name, item) => [
                    `${toBanglaNum(val)} শতাংশ (${toBanglaNum(item.payload.count)} জন দাতা)`,
                    'দানকৃত জমি'
                  ]}
                  contentStyle={{ borderRadius: '12px', borderColor: 'var(--gold)', backgroundColor: 'var(--surface)', color: 'var(--text)', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="totalDecimal" name="দানকৃত জমি (শতাংশ)" fill="var(--chart-series-3)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Land Donated by Usage */}
        <div className="bg-surface rounded-3xl p-6 border border-sand shadow-sakinah-card space-y-4">
          <div className="flex items-center justify-between border-b border-sand pb-3">
            <div>
              <h2 className="font-serif font-bold text-base text-primary-dark">
                ব্যবহারভিত্তিক জমির বণ্টন
              </h2>
              <p className="text-xs text-ink-muted">ঈদগাহ মাঠ, কবরস্থান, রাস্তা ইত্যাদিতে জমির বণ্টন</p>
            </div>
            <Layers className="w-4 h-4 text-primary" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.landByUsage || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <Tooltip
                  formatter={(val, name, item) => [
                    `${toBanglaNum(val)} শতাংশ (${toBanglaNum(item.payload.count)} টি প্লট)`,
                    'জমির পরিমাণ'
                  ]}
                  contentStyle={{ borderRadius: '12px', borderColor: 'var(--primary)', backgroundColor: 'var(--surface)', color: 'var(--text)', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="totalDecimal" name="জমির পরিমাণ (শতাংশ)" radius={[6, 6, 0, 0]}>
                  {(charts.landByUsage || []).map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={chartColors[idx % chartColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity Log Feed */}
      <div className="bg-surface rounded-3xl p-6 border border-sand shadow-sakinah-card space-y-4">
        <div className="flex items-center justify-between border-b border-sand pb-3">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            <h2 className="font-serif font-bold text-lg text-primary-dark">
              সাম্প্রতিক প্রশাসনিক কার্যক্রম (Audit Log)
            </h2>
          </div>
          <Link to={`/${ADMIN_PATH}/activity-logs`} className="text-xs font-semibold text-primary hover:text-gold-text">
            সকল লগ দেখুন &rarr;
          </Link>
        </div>

        {recentActivity.length === 0 ? (
          <p className="text-xs text-ink-muted py-4 text-center">এখনো কোনো সাম্প্রতিক কার্যক্রম রেকর্ড হয়নি।</p>
        ) : (
          <div className="divide-y divide-sand">
            {recentActivity.map((log) => (
              <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2.5">
                  <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                    log.action === 'CREATED' ? 'bg-success-soft text-success' :
                    log.action === 'UPDATED' ? 'bg-primary-soft text-primary-dark' :
                    log.action === 'DELETED' ? 'bg-danger-soft text-danger' :
                    log.action === 'RESTORED' ? 'bg-gold/20 text-gold-text' :
                    'bg-canvas-alt text-ink-muted'
                  }`}>
                    {log.action}
                  </span>
                  <span className="text-ink font-medium">{log.description}</span>
                </div>
                <div className="flex items-center gap-3 text-ink-muted text-[11px]">
                  <span>{log.user?.name || 'সিস্টেম'}</span>
                  <span>•</span>
                  <span>{new Date(log.createdAt).toLocaleString('bn-BD', { dateStyle: 'short', timeStyle: 'short' })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

