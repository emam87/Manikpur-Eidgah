import React, { useState, useEffect } from 'react';
import { Trash2, RotateCcw, AlertTriangle, X, ShieldAlert, Check } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';

export function AdminTrash() {
  const { user } = useAdminAuth();
  const { toBanglaNum } = useLanguage();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Permanent Delete Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchTrash();
  }, []);

  const fetchTrash = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/trash');
      const data = await res.json();
      if (data.success) {
        setItems(data.items || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (type, id) => {
    try {
      const res = await fetch('/api/admin/trash/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id }),
      });
      const data = await res.json();
      if (data.success) {
        fetchTrash();
      } else {
        alert(data.error || 'পুনরুদ্ধার ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      alert('সার্ভারে সমস্যা হয়েছে।');
    }
  };

  const handlePermanentDelete = async (e) => {
    e.preventDefault();
    if (confirmText !== 'DELETE') {
      alert('নিশ্চিতকরণের জন্য DELETE শব্দটি সঠিকভাবে লিখুন।');
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch('/api/admin/trash/permanent-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedItem.type,
          id: selectedItem.id,
          confirmation: 'DELETE',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDeleteModalOpen(false);
        setSelectedItem(null);
        setConfirmText('');
        fetchTrash();
      } else {
        alert(data.error || 'স্থায়ীভাবে মোছা ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      alert('সার্ভারে সমস্যা হয়েছে।');
    } finally {
      setDeleting(false);
    }
  };

  const getTypeLabel = (type) => {
    const map = {
      Member: 'আজীবন সদস্য',
      Donor: 'অনুদানকারী (আর্কাইভ)',
      LandDonor: 'জমিদাতা',
      CommitteeMember: 'কমিটি সদস্য',
      Album: 'ফটো অ্যালবাম',
      Photo: 'ছবি',
      Document: 'দলিল / নথি',
      LandMap: 'মৌজা নকশা',
      Notice: 'নোটিশ',
      Design: '৩ডি ডিজাইন',
    };
    return map[type] || type;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-surface p-6 rounded-3xl border border-sand shadow-sakinah-sm">
        <div>
          <h1 className="font-serif text-2xl font-bold text-ink flex items-center gap-2">
            <Trash2 className="w-6 h-6 text-danger" />
            <span>ট্র্যাশ বিন ও রিসাইকেল ব্যবস্থাপনা</span>
          </h1>
          <p className="text-xs text-ink-muted mt-1">
            মোট মোছা আইটেম: {toBanglaNum(items.length)} টি | ভুলবশত মুছে ফেলা যে কোনো তথ্য তাৎক্ষণিক পুনরুদ্ধারযোগ্য
          </p>
        </div>
      </div>

      {/* Trash Table */}
      <div className="bg-surface rounded-2xl border border-sand overflow-hidden shadow-sakinah-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-ink">
            <thead className="bg-canvas-alt border-b border-sand text-ink-muted uppercase font-semibold">
              <tr>
                <th className="px-5 py-3.5">ধরন</th>
                <th className="px-5 py-3.5">আইটেমের শিরোনাম / বিবরণ</th>
                <th className="px-5 py-3.5">মুছে ফেলার তারিখ</th>
                <th className="px-5 py-3.5 text-center">পুনরুদ্ধার (Restore)</th>
                <th className="px-5 py-3.5 text-center">স্থায়ীভাবে মুছুন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand">
              {items.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-5 py-12 text-center text-ink-muted">
                    ট্র্যাশ সম্পূর্ণ খালি। কোনো মোছা আইটেম নেই।
                  </td>
                </tr>
              ) : (
                items.map((it, idx) => (
                  <tr key={`${it.type}-${it.id}-${idx}`} className="hover:bg-canvas-alt/60">
                    <td className="px-5 py-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-canvas border border-sand text-ink">
                        {getTypeLabel(it.type)}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-serif font-bold text-ink text-sm">
                      {it.title}
                    </td>
                    <td className="px-5 py-3 text-ink-muted">
                      {new Date(it.deletedAt).toLocaleString('bn-BD')}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={() => handleRestore(it.type, it.id)}
                        className="px-3 py-1.5 rounded-lg bg-primary-soft text-primary-dark font-semibold hover:bg-primary hover:text-white transition-colors inline-flex items-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>পুনরুদ্ধার</span>
                      </button>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={() => {
                          setSelectedItem(it);
                          setConfirmText('');
                          setDeleteModalOpen(true);
                        }}
                        disabled={user?.role !== 'ADMIN'}
                        className="px-3 py-1.5 rounded-lg bg-danger-soft text-danger font-semibold hover:bg-danger hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed inline-flex items-center gap-1"
                        title={user?.role !== 'ADMIN' ? 'শুধুমাত্র অ্যাডমিন স্থায়ীভাবে মুছতে পারেন' : 'স্থায়ীভাবে মুছুন'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>চিরতরে মুছুন</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Permanent Delete Confirmation Modal */}
      {deleteModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface rounded-3xl max-w-md w-full p-6 sm:p-8 border-2 border-danger/40 shadow-sakinah-lift space-y-4">
            <div className="flex items-center gap-3 text-danger">
              <AlertTriangle className="w-8 h-8" />
              <h2 className="font-serif font-bold text-xl text-ink">
                স্থায়ীভাবে মুছে ফেলার সতর্কতা
              </h2>
            </div>

            <p className="text-xs text-ink-muted leading-relaxed">
              আপনি <strong className="text-ink">'{selectedItem.title}'</strong> রেকর্ডটি ডাটাবেজ থেকে চিরতরে মুছে ফেলতে যাচ্ছেন। এই পদক্ষেপটি কখনো ফিরিয়ে আনা সম্ভব নয়।
            </p>

            <form onSubmit={handlePermanentDelete} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-ink mb-1">
                  নিশ্চিত করতে নিচে <span className="font-mono text-danger font-extrabold">DELETE</span> শব্দটি লিখুন:
                </label>
                <input
                  type="text"
                  required
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-3 py-2 rounded-xl border border-danger/40 font-mono font-bold text-danger bg-danger-soft/50 focus:outline-none focus:border-danger"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-sand text-ink-muted hover:bg-canvas-alt font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={confirmText !== 'DELETE' || deleting}
                  className="px-5 py-2 rounded-xl bg-danger text-white font-bold hover:opacity-90 shadow-sakinah-sm disabled:opacity-40"
                >
                  {deleting ? 'মুছে ফেলা হচ্ছে...' : 'চিরতরে মুছে ফেলুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

