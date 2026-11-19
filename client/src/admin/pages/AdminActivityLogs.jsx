import React, { useState, useEffect } from 'react';
import { History, Download, Database, Archive, ChevronLeft, ChevronRight, ShieldCheck, Filter } from 'lucide-react';
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
  const [exportingMedia, setExportingMedia] = useState(false);

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

  const triggerBackupDownload = async (endpoint, filename, setBusy) => {
    if (user?.role !== 'ADMIN') {
      alert('শুধুমাত্র প্রধান অ্যাডমিন ব্যাকআপ ডাউনলোড করতে পারেন।');
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error('Backup failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('ব্যাকআপ ডাউনলোড করতে সমস্যা হয়েছে।');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-surface p-6 rounded-3xl border border-sand shadow-sakinah-sm">
        <div>
          <h1 className="font-serif text-2xl font-bold text-ink flex items-center gap-2">
            <History className="w-6 h-6 text-primary-dark" />
            <span>কার্যক্রম অডিট লগ ও ডাটাবেজ ব্যাকআপ</span>
          </h1>
          <p className="text-xs text-ink-muted mt-1">
            মোট লগ এন্ট্রি: {toBanglaNum(pagination.total)} টি | সিস্টেমে সম্পাদিত প্রতিটি কার্যক্রমের অপরিবর্তনীয় রেকর্ড
          </p>
        </div>

        {user?.role === 'ADMIN' && (
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => triggerBackupDownload('/api/admin/backup/export', `manikpur-eidgah-backup-${Date.now()}.json`, setExporting)}
              disabled={exporting}
              className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-colors flex items-center gap-2 shadow-sakinah-sm disabled:opacity-50"
            >
              <Database className="w-4 h-4 text-gold" />
              <span>{exporting ? 'ডাটাবেজ তৈরি হচ্ছে...' : 'সম্পূর্ণ ডাটাবেজ ব্যাকআপ (JSON)'}</span>
            </button>

            <button
              onClick={() => triggerBackupDownload('/api/admin/backup/media', `manikpur-eidgah-media-${Date.now()}.zip`, setExportingMedia)}
              disabled={exportingMedia}
              className="px-4 py-2 rounded-xl bg-gold-plate text-ink text-xs font-bold hover:shadow-gold-glow transition-all flex items-center gap-2 shadow-sakinah-sm disabled:opacity-50"
            >
              <Archive className="w-4 h-4" />
              <span>{exportingMedia ? 'জিপ তৈরি হচ্ছে...' : 'সকল ছবি ও দলিল ব্যাকআপ (ZIP)'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Logs Table */}
      <div className="bg-surface rounded-2xl border border-sand overflow-hidden shadow-sakinah-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-ink">
            <thead className="bg-canvas-alt border-b border-sand text-ink-muted uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3.5">অ্যাকশন</th>
                <th className="px-5 py-3.5">কার্যক্রম বিবরণ</th>
                <th className="px-5 py-3.5">ব্যবহারকারী</th>
                <th className="px-5 py-3.5">আইপি ঠিকানা</th>
                <th className="px-5 py-3.5">সময় ও তারিখ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-canvas-alt/60 transition-colors">
                  <td className="px-5 py-3 font-mono font-bold">
                    <span className={`px-2 py-0.5 rounded text-[10px] ${
                      log.action === 'CREATED' ? 'bg-success-soft text-success' :
                      log.action === 'UPDATED' ? 'bg-sky-mist text-primary-dark' :
                      log.action === 'DELETED' ? 'bg-danger-soft text-danger' :
                      log.action === 'RESTORED' ? 'bg-primary-soft text-primary-dark' :
                      log.action === 'LOGIN' ? 'bg-warning-soft text-gold-text' :
                      'bg-canvas border border-sand text-ink-muted'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-ink font-medium">
                    {log.description}
                  </td>
                  <td className="px-5 py-3 font-medium text-ink-muted">
                    {log.user ? `${log.user.name} (${log.user.role})` : 'সিস্টেম / পাবলিক'}
                  </td>
                  <td className="px-5 py-3 font-mono text-ink-muted text-[11px]">
                    {log.ipAddress || '—'}
                  </td>
                  <td className="px-5 py-3 text-ink-muted text-[11px]">
                    {new Date(log.createdAt).toLocaleString('bn-BD')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-sand flex items-center justify-between text-xs text-ink-muted">
            <span>মোট {toBanglaNum(pagination.total)} লগের মধ্যে পৃষ্ঠা {toBanglaNum(page)}</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-sand hover:bg-canvas-alt disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                className="p-1.5 rounded-lg border border-sand hover:bg-canvas-alt disabled:opacity-40"
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

