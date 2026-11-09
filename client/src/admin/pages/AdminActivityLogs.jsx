import React, { useState, useEffect } from 'react';
import { History, Download, Database, ChevronLeft, ChevronRight, ShieldCheck, Filter } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';

export function AdminActivityLogs() {
  const { user } = useAdminAuth();
  const { toBanglaNum } = useLanguage();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/activity-logs?page=${page}&limit=25`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
        setPagination(data.pagination || { page: 1, limit: 25, total: 0, totalPages: 1 });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadBackup = async () => {
    if (user?.role !== 'ADMIN') {
      alert('শুধুমাত্র প্রধান অ্যাডমিন সম্পূর্ণ ডাটাবেজ ব্যাকআপ ডাউনলোড করতে পারেন।');
      return;
    }

    setExporting(true);
    try {
      const res = await fetch('/api/admin/backup/export');
      if (!res.ok) throw new Error('Backup failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `manikpur_eidgah_full_backup_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert('ব্যাকআপ ডাউনলোড করতে সমস্যা হয়েছে।');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gold-500/30 shadow-sm">
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900 flex items-center gap-2">
            <History className="w-6 h-6 text-emerald-800" />
            <span>কার্যক্রম অডিট লগ ও ডাটাবেজ ব্যাকআপ</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            মোট লগ এন্ট্রি: {toBanglaNum(pagination.total)} টি | সিস্টেমে সম্পাদিত প্রতিটি কার্যক্রমের অপরিবর্তনীয় রেকর্ড
          </p>
        </div>

        {user?.role === 'ADMIN' && (
          <button
            onClick={handleDownloadBackup}
            disabled={exporting}
            className="px-4 py-2 rounded-xl bg-emerald-950 text-gold-200 text-xs font-bold hover:bg-emerald-900 transition-colors flex items-center gap-2 shadow-md disabled:opacity-50"
          >
            <Database className="w-4 h-4 text-gold-400" />
            <span>{exporting ? 'ব্যাকআপ তৈরি হচ্ছে...' : 'সম্পূর্ণ ডাটাবেজ ব্যাকআপ (JSON)'}</span>
          </button>
        )}
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-gold-500/30 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-emerald-950 text-gold-200 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3.5">অ্যাকশন</th>
                <th className="px-5 py-3.5">কার্যক্রম বিবরণ</th>
                <th className="px-5 py-3.5">ব্যবহারকারী</th>
                <th className="px-5 py-3.5">আইপি ঠিকানা</th>
                <th className="px-5 py-3.5">সময় ও তারিখ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-emerald-50/40 transition-colors">
                  <td className="px-5 py-3 font-mono font-bold">
                    <span className={`px-2 py-0.5 rounded text-[10px] ${
                      log.action === 'CREATED' ? 'bg-emerald-100 text-emerald-800' :
                      log.action === 'UPDATED' ? 'bg-blue-100 text-blue-800' :
                      log.action === 'DELETED' ? 'bg-red-100 text-red-800' :
                      log.action === 'RESTORED' ? 'bg-purple-100 text-purple-800' :
                      log.action === 'LOGIN' ? 'bg-gold-100 text-gold-900' :
                      'bg-stone-100 text-stone-700'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-stone-900 font-medium">
                    {log.description}
                  </td>
                  <td className="px-5 py-3 font-medium text-stone-700">
                    {log.user ? `${log.user.name} (${log.user.role})` : 'সিস্টেম / পাবলিক'}
                  </td>
                  <td className="px-5 py-3 font-mono text-stone-500 text-[11px]">
                    {log.ipAddress || '—'}
                  </td>
                  <td className="px-5 py-3 text-stone-500 text-[11px]">
                    {new Date(log.createdAt).toLocaleString('bn-BD')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span>মোট {toBanglaNum(pagination.total)} লগের মধ্যে পৃষ্ঠা {toBanglaNum(page)}</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
