import React, { useState, useEffect } from 'react';
import { 
  FileText, Plus, Trash2, Download, Eye, ExternalLink, 
  X, Check, Lock, Globe, Calendar, ShieldAlert 
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';

export function AdminDocuments() {
  const { user } = useAdminAuth();
  const { toBanglaNum } = useLanguage();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [visibility, setVisibility] = useState('');
  const [search, setSearch] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    titleBn: '',
    titleEn: '',
    category: 'DEED',
    documentNo: '',
    documentDate: '',
    visibility: 'PUBLIC',
    descriptionBn: '',
  });
  const [docFile, setDocFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const categories = [
    { value: 'DEED', label: 'ওয়াকফ ও মূল দলিল' },
    { value: 'KHATIAN', label: 'খতিয়ান' },
    { value: 'PORCHA', label: 'পর্চা' },
    { value: 'MUTATION', label: 'নামজারি' },
    { value: 'DCR', label: 'ডি.সি.আর ও খাজনা রশিদ' },
    { value: 'COURT', label: 'আদালতের আদেশ' },
    { value: 'RESOLUTION', label: 'কমিটি রেজুলেশন' },
    { value: 'OTHER', label: 'অন্যান্য নথি' },
  ];

  useEffect(() => {
    fetchDocuments();
  }, [category, visibility, search]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (visibility) params.append('visibility', visibility);
      if (search) params.append('q', search);

      const res = await fetch(`/api/admin/documents?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setDocuments(data.documents || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.titleBn.trim() || !docFile) {
      setErrorMsg('দলিলের শিরোনাম ও ফাইল নির্বাচন করা আবশ্যক।');
      return;
    }

    setSaving(true);
    setErrorMsg('');

    try {
      const data = new FormData();
      Object.keys(formData).forEach((k) => {
        data.append(k, formData[k]);
      });
      data.append('file', docFile);

      const res = await fetch('/api/admin/documents', {
        method: 'POST',
        body: data,
      });
      const resData = await res.json();

      if (!res.ok || !resData.success) {
        throw new Error(resData.error || 'দলিল আপলোড ব্যর্থ হয়েছে।');
      }

      setModalOpen(false);
      fetchDocuments();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (user?.role !== 'ADMIN') {
      alert('শুধুমাত্র অ্যাডমিন দলিল মুছে ফেলতে পারেন।');
      return;
    }

    if (!window.confirm(`আপনি কি নিশ্চিত যে দলিল '${title}' ট্র্যাশে পাঠাতে চান?`)) return;

    try {
      const res = await fetch(`/api/admin/documents/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchDocuments();
      } else {
        alert(data.error || 'মুছে ফেলতে সমস্যা হয়েছে।');
      }
    } catch (err) {
      alert('সার্ভারে সমস্যা হয়েছে।');
    }
  };

  const handleDownload = async (doc) => {
    try {
      if (doc.visibility === 'PUBLIC') {
        window.open(doc.filePath, '_blank');
        return;
      }

      // If ADMIN_ONLY, request short-lived signed URL from server
      const res = await fetch(`/api/admin/documents/${doc.id}/signed-url`);
      const data = await res.json();
      if (data.success && data.downloadUrl) {
        window.open(data.downloadUrl, '_blank');
      } else {
        alert('স্বাক্ষরিত ডাউনলোড লিঙ্ক তৈরি করা যায়নি।');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gold-500/30 shadow-sm">
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-800" />
            <span>আইনি দলিল ও স্বচ্ছতা সংরক্ষণাগার</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            মোট দলিল: {toBanglaNum(documents.length)} টি | ওয়াকফ ভূমি সংক্রান্ত সকল বৈধ নথিপত্র
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              titleBn: '',
              titleEn: '',
              category: 'DEED',
              documentNo: '',
              documentDate: '',
              visibility: 'PUBLIC',
              descriptionBn: '',
            });
            setDocFile(null);
            setErrorMsg('');
            setModalOpen(true);
          }}
          className="px-4 py-2 rounded-xl bg-emerald-950 text-gold-200 text-xs font-bold hover:bg-emerald-900 transition-colors flex items-center gap-1.5 shadow-md"
        >
          <Plus className="w-4 h-4 text-gold-400" />
          <span>নতুন দলিল আপলোড</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2 rounded-xl border border-stone-300 text-xs bg-stone-50"
          >
            <option value="">সকল ক্যাটাগরি</option>
            {categories.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>

          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            className="px-3 py-2 rounded-xl border border-stone-300 text-xs bg-stone-50"
          >
            <option value="">সকল দৃশ্যমানতা</option>
            <option value="PUBLIC">উন্মুক্ত (Public)</option>
            <option value="ADMIN_ONLY">গোপনীয় (Admin Only)</option>
          </select>
        </div>

        <div className="w-full sm:max-w-xs">
          <input
            type="text"
            placeholder="দলিলের নাম বা নম্বর..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-stone-50"
          />
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-2xl border border-gold-500/30 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-emerald-950 text-gold-200 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3.5">দলিলের শিরোনাম</th>
                <th className="px-5 py-3.5">ক্যাটাগরি</th>
                <th className="px-5 py-3.5">দলিল নং</th>
                <th className="px-5 py-3.5">তারিখ</th>
                <th className="px-5 py-3.5">দৃশ্যমানতা</th>
                <th className="px-5 py-3.5 text-center">ডাউনলোড / ফাইল</th>
                <th className="px-5 py-3.5 text-center">মুছে ফেলুন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {documents.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-10 text-center text-stone-400">
                    কোনো দলিল সংরক্ষিত নেই।
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-emerald-50/40 transition-colors">
                    <td className="px-5 py-3 font-serif font-bold text-stone-900 text-sm">
                      {doc.titleBn}
                    </td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                        {categories.find((c) => c.value === doc.category)?.label || doc.category}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono font-medium text-stone-800">
                      {doc.documentNo ? toBanglaNum(doc.documentNo) : '—'}
                    </td>
                    <td className="px-5 py-3 text-stone-600">
                      {doc.documentDate ? new Date(doc.documentDate).toLocaleDateString('bn-BD') : '—'}
                    </td>
                    <td className="px-5 py-3">
                      {doc.visibility === 'ADMIN_ONLY' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          <Lock className="w-3 h-3 text-amber-700" />
                          <span>Admin Only</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                          <Globe className="w-3 h-3 text-emerald-700" />
                          <span>Public</span>
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={() => handleDownload(doc)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-950 text-gold-200 text-xs font-semibold hover:bg-emerald-900 transition-colors inline-flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>দেখুন / ডাউনলোড</span>
                      </button>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={() => handleDelete(doc.id, doc.titleBn)}
                        disabled={user?.role !== 'ADMIN'}
                        className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed"
                        title={user?.role !== 'ADMIN' ? 'শুধুমাত্র অ্যাডমিন মুছতে পারেন' : 'মুছে ফেলুন'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-gold-500/40 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h2 className="font-serif font-bold text-xl text-stone-900">
                নতুন দলিল বা আইনি নথি আপলোড
              </h2>
              <button onClick={() => setModalOpen(false)} className="p-2 rounded-full hover:bg-stone-100 text-stone-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">দলিলের শিরোনাম (বাংলা) *</label>
                <input
                  type="text"
                  required
                  value={formData.titleBn}
                  onChange={(e) => setFormData({ ...formData, titleBn: e.target.value })}
                  placeholder="যেমন: ওয়াকফ রেজিস্ট্রেশন দলিল নং ৩৪৮২"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">ক্যাটাগরি</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-medium"
                  >
                    {categories.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">দলিল / রেকর্ড নং</label>
                  <input
                    type="text"
                    value={formData.documentNo}
                    onChange={(e) => setFormData({ ...formData, documentNo: e.target.value })}
                    placeholder="যেমন: ৪৭৫/১৯৬৫"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">নথির তারিখ</label>
                  <input
                    type="date"
                    value={formData.documentDate}
                    onChange={(e) => setFormData({ ...formData, documentDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">দৃশ্যমানতা স্তর</label>
                  <select
                    value={formData.visibility}
                    onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-semibold"
                  >
                    <option value="PUBLIC">উন্মুক্ত (Public - সবার জন্য)</option>
                    <option value="ADMIN_ONLY">গোপনীয় (Admin Only - সংরক্ষিত)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">ফাইল নির্বাচন (PDF বা ছবি) *</label>
                <input
                  type="file"
                  required
                  accept=".pdf,image/*"
                  onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-950 file:text-gold-200"
                />
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-stone-700 font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 rounded-xl bg-emerald-950 text-gold-200 font-bold shadow-md disabled:opacity-50"
                >
                  {saving ? 'আপলোড হচ্ছে...' : 'আপলোড নিশ্চিত করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
