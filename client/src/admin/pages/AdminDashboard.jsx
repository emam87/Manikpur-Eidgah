import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, HeartHandshake, Images, FileText, Bell, Compass, 
  Trash2, TrendingUp, DollarSign, PlusCircle, ArrowUpRight, 
  Sparkles, ShieldCheck, History, Database, HardDrive, Award 
} from 'lucide-react';
import { 
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, CartesianGrid 
} from 'recharts';
import { useLanguage } from '../../context/LanguageContext.jsx';

export function AdminDashboard() {
  const { toBanglaNum, formatBDT } = useLanguage();

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
        <div className="h-10 w-64 bg-stone-200 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-stone-200 rounded-2xl" />
          ))}
        </div>
        <div className="h-80 bg-stone-200 rounded-2xl" />
      </div>
    );
  }

  const stats = data?.stats || {};
  const charts = data?.charts || {};
  const recentActivity = data?.recentActivity || [];

  return (
    <div className="space-y-8">
      {/* Top Welcome & Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gold-500/30 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-gold-600 font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>সিস্টেম নিয়ন্ত্রণ কেন্দ্র</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-stone-900">
            ড্যাশবোর্ড ওভারভিউ
          </h1>
        </div>

        {/* Quick Action Shortcuts */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="members"
            className="px-3.5 py-2 rounded-xl bg-emerald-950 text-gold-200 text-xs font-semibold hover:bg-emerald-900 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5 text-gold-400" />
            <span>সদস্য যোগ</span>
          </Link>

          <Link
            to="donors"
            className="px-3.5 py-2 rounded-xl bg-emerald-950 text-gold-200 text-xs font-semibold hover:bg-emerald-900 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5 text-gold-400" />
            <span>অনুদান যোগ</span>
          </Link>

          <Link
            to="gallery"
            className="px-3.5 py-2 rounded-xl bg-gold-500 text-stone-950 text-xs font-bold hover:bg-gold-400 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>ছবি আপলোড</span>
          </Link>
        </div>
      </div>

      {/* Main Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Members */}
        <div className="bg-white rounded-3xl p-6 border border-gold-500/30 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-stone-500 font-semibold block mb-1">আজীবন সদস্য</span>
            <span className="font-serif font-extrabold text-3xl text-emerald-950">
              {toBanglaNum(stats.membersCount || 0)}
            </span>
            <span className="text-[11px] text-stone-400 block mt-1">জন নিবন্ধিত সদস্য</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-200">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Donors */}
        <div className="bg-white rounded-3xl p-6 border border-gold-500/30 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-stone-500 font-semibold block mb-1">অনুদানকারী রেকর্ড</span>
            <span className="font-serif font-extrabold text-3xl text-emerald-950">
              {toBanglaNum(stats.donorsCount || 0)}
            </span>
            <span className="text-[11px] text-stone-400 block mt-1">টি প্রাপ্ত অনুদান</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-200">
            <HeartHandshake className="w-6 h-6" />
          </div>
        </div>

        {/* Total Funds Collected */}
        <div className="bg-gradient-to-br from-emerald-950 to-emerald-900 rounded-3xl p-6 border-2 border-gold-500/50 shadow-md text-ivory flex items-center justify-between">
          <div>
            <span className="text-xs text-gold-300 font-semibold block mb-1">মোট সংগৃহীত তহবিল</span>
            <span className="font-serif font-extrabold text-2xl text-gold-100">
              {formatBDT(stats.totalFunds || 0)}
            </span>
            <span className="text-[10px] text-stone-300 block mt-1">আজীবন অনুদান ও দান হিসাব</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gold-500/20 text-gold-300 flex items-center justify-center border border-gold-400/40">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Gallery Photos */}
        <div className="bg-white rounded-3xl p-6 border border-gold-500/30 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-stone-500 font-semibold block mb-1">ফটো গ্যালারি</span>
            <span className="font-serif font-extrabold text-3xl text-emerald-950">
              {toBanglaNum(stats.photosCount || 0)}
            </span>
            <span className="text-[11px] text-stone-400 block mt-1">টি ছবি ({toBanglaNum(stats.albumsCount || 0)} ফোল্ডার)</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-200">
            <Images className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Secondary Quick Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link to="documents" className="bg-white p-4 rounded-2xl border border-stone-200 hover:border-gold-500/40 hover:shadow-sm transition-all flex items-center gap-3">
          <FileText className="w-5 h-5 text-emerald-800" />
          <div>
            <span className="text-xs text-stone-500 block">সংরক্ষিত দলিল</span>
            <span className="font-bold text-stone-900">{toBanglaNum(stats.documentsCount || 0)} টি</span>
          </div>
        </Link>

        <Link to="notices" className="bg-white p-4 rounded-2xl border border-stone-200 hover:border-gold-500/40 hover:shadow-sm transition-all flex items-center gap-3">
          <Bell className="w-5 h-5 text-emerald-800" />
          <div>
            <span className="text-xs text-stone-500 block">প্রকাশিত নোটিশ</span>
            <span className="font-bold text-stone-900">{toBanglaNum(stats.noticesCount || 0)} টি</span>
          </div>
        </Link>

        <Link to="designs" className="bg-white p-4 rounded-2xl border border-stone-200 hover:border-gold-500/40 hover:shadow-sm transition-all flex items-center gap-3">
          <Compass className="w-5 h-5 text-emerald-800" />
          <div>
            <span className="text-xs text-stone-500 block">৩ডি মাস্টার নকশা</span>
            <span className="font-bold text-stone-900">{toBanglaNum(stats.designsCount || 0)} টি</span>
          </div>
        </Link>

        <Link to="trash" className="bg-white p-4 rounded-2xl border border-stone-200 hover:border-red-400 hover:shadow-sm transition-all flex items-center gap-3">
          <Trash2 className="w-5 h-5 text-red-600" />
          <div>
            <span className="text-xs text-stone-500 block">ট্র্যাশ বিন</span>
            <span className="font-bold text-red-700">{toBanglaNum(stats.trashCount || 0)} টি</span>
          </div>
        </Link>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donations by Purpose Chart */}
        <div className="bg-white rounded-3xl p-6 border border-gold-500/30 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h2 className="font-serif font-bold text-base text-stone-900">
                খাতভিত্তিক অনুদান বণ্টন
              </h2>
              <p className="text-xs text-stone-500">বিভিন্ন তহবিলে সংগৃহীত অনুদানের পরিমাণ</p>
            </div>
            <TrendingUp className="w-4 h-4 text-emerald-700" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.donorsByPurpose || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="purpose" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val) => [`${formatBDT(val)}`, 'পরিমাণ']}
                  contentStyle={{ borderRadius: '12px', borderColor: '#B8923F', fontSize: '12px' }}
                />
                <Bar dataKey="totalAmount" fill="#0F5132" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lifetime Members Growth by Year */}
        <div className="bg-white rounded-3xl p-6 border border-gold-500/30 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h2 className="font-serif font-bold text-base text-stone-900">
                বছরভিত্তিক আজীবন সদস্য সংযোজন
              </h2>
              <p className="text-xs text-stone-500">প্রতি বছর ঈদগাহে যোগ দেওয়া সদস্য সংখ্যা</p>
            </div>
            <Users className="w-4 h-4 text-emerald-700" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.membersByYear || []}>
                <defs>
                  <linearGradient id="colorMembers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#B8923F" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#B8923F" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val) => [`${toBanglaNum(val)} জন`, 'নতুন সদস্য']}
                  contentStyle={{ borderRadius: '12px', borderColor: '#B8923F', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="count" stroke="#B8923F" fillOpacity={1} fill="url(#colorMembers)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity Log Feed */}
      <div className="bg-white rounded-3xl p-6 border border-gold-500/30 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-800" />
            <h2 className="font-serif font-bold text-lg text-stone-900">
              সাম্প্রতিক প্রশাসনিক কার্যক্রম (Audit Log)
            </h2>
          </div>
          <Link to="activity-logs" className="text-xs font-semibold text-emerald-900 hover:text-gold-600">
            সকল লগ দেখুন &rarr;
          </Link>
        </div>

        {recentActivity.length === 0 ? (
          <p className="text-xs text-stone-500 py-4 text-center">এখনো কোনো সাম্প্রতিক কার্যক্রম রেকর্ড হয়নি।</p>
        ) : (
          <div className="divide-y divide-stone-100">
            {recentActivity.map((log) => (
              <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2.5">
                  <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                    log.action === 'CREATED' ? 'bg-emerald-100 text-emerald-800' :
                    log.action === 'UPDATED' ? 'bg-blue-100 text-blue-800' :
                    log.action === 'DELETED' ? 'bg-red-100 text-red-800' :
                    log.action === 'RESTORED' ? 'bg-purple-100 text-purple-800' :
                    'bg-stone-100 text-stone-800'
                  }`}>
                    {log.action}
                  </span>
                  <span className="text-stone-800 font-medium">{log.description}</span>
                </div>
                <div className="flex items-center gap-3 text-stone-400 text-[11px]">
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
