import React, { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import { 
  HeartHandshake, Search, Plus, Edit, Trash2, Download, Upload, 
  X, Check, AlertCircle, Calendar, Receipt, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.jsx';

export function AdminDonors() {
  const { toBanglaNum, formatBDT } = useLanguage();

  const [donors, setDonors] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [purpose, setPurpose] = useState('');
  const [year, setYear] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({
    donorNameBn: '',
    donorNameEn: '',
    phone: '',
    addressBn: '',
    amount: '',
    donationDate: new Date().toISOString().split('T')[0],
    purpose: 'GENERAL',
    receiptNo: '',
    showAmount: true,
    noteBn: '',
  });
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef(null);

  const purposes = [
    { value: 'GENERAL', label: 'সাধারণ তহবিল' },
    { value: 'CONSTRUCTION', label: 'নির্মাণ তহবিল' },
    { value: 'BOUNDARY_WALL', label: 'সীমানা প্রাচীর' },
    { value: 'LAND_PURCHASE', label: 'জমি ক্রয় / ওয়াকফ' },
    { value: 'SOUND_SYSTEM', label: 'সাউন্ড সিস্টেম' },
    { value: 'OTHER', label: 'অন্যান্য' },
  ];

  useEffect(() => {
    fetchDonors();
  }, [search, purpose, year, page]);

  const fetchDonors = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '15' });
      if (search) params.append('q', search);
      if (purpose) params.append('purpose', purpose);
      if (year) params.append('year', year);

      const res = await fetch(`/api/admin/donors?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setDonors(data.donors || []);
        setTotalAmount(data.totalAmount || 0);
        setPagination(data.pagination || { page: 1, limit: 15, total: 0, totalPages: 1 });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditItem(null);
    setFormData({
      donorNameBn: '',
      donorNameEn: '',
      phone: '',
      addressBn: '',
      amount: '',
      donationDate: new Date().toISOString().split('T')[0],
      purpose: 'GENERAL',
      receiptNo: '',
      showAmount: true,
      noteBn: '',
    });
    setErrorMsg('');
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditItem(item);
    setFormData({
      donorNameBn: item.donorNameBn || '',
      donorNameEn: item.donorNameEn || '',
      phone: item.phone || '',
      addressBn: item.addressBn || '',
      amount: item.amount ? item.amount.toString() : '',
      donationDate: item.donationDate ? item.donationDate.split('T')[0] : '',
      purpose: item.purpose || 'GENERAL',
      receiptNo: item.receiptNo || '',
      showAmount: item.showAmount !== false,
      noteBn: item.noteBn || '',
    });
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.donorNameBn.trim() || !formData.amount) {
      setErrorMsg('দাতার নাম ও অনুদানের পরিমাণ আবশ্যক।');
      return;
    }

    setSaving(true);
    setErrorMsg('');

    try {
      const url = editItem ? `/api/admin/donors/${editItem.id}` : '/api/admin/donors';
      const method = editItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const resData = await res.json();

      if (!res.ok || !resData.success) {
        throw new Error(resData.error || 'সংরক্ষণ ব্যর্থ হয়েছে।');
      }

      setModalOpen(false);
      fetchDonors();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`আপনি কি নিশ্চিত যে '${name}' এর অনুদান রেকর্ড ট্র্যাশে পাঠাতে চান?`)) return;

    try {
      const res = await fetch(`/api/admin/donors/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchDonors();
      } else {
        alert(data.error || 'মুছে ফেলতে সমস্যা হয়েছে।');
      }
    } catch (err) {
      alert('সার্ভারে সমস্যা হয়েছে।');
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    const csvData = donors.map((d) => ({
      'রশিদ নং': d.receiptNo || '',
      'দাতার নাম': d.donorNameBn,
      'মোবাইল নং': d.phone || '',
      'ঠিকানা': d.addressBn || '',
      'অনুদানের পরিমাণ': d.amount,
      'তারিখ': d.donationDate ? d.donationDate.split('T')[0] : '',
      'খাত / উদ্দেশ্য': d.purpose,
      'মন্তব্য': d.noteBn || '',
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `donors_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Import
  const handleImportCSV = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const parsed = results.data.map((row) => ({
            donorNameBn: row['দাতার নাম'] || row['donorNameBn'] || '',
            donorNameEn: row['নাম (ইংরেজি)'] || row['donorNameEn'] || '',
            phone: row['মোবাইল নং'] || row['phone'] || '',
            addressBn: row['ঠিকানা'] || row['addressBn'] || '',
            amount: row['অনুদানের পরিমাণ'] || row['amount'] || 0,
            donationDate: row['তারিখ'] || row['donationDate'] || new Date().toISOString(),
            purpose: row['খাত / উদ্দেশ্য'] || row['purpose'] || 'GENERAL',
            receiptNo: row['রশিদ নং'] || row['receiptNo'] || '',
            noteBn: row['মন্তব্য'] || row['noteBn'] || '',
          }));

          const res = await fetch('/api/admin/donors/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ donors: parsed }),
          });
          const resData = await res.json();
          if (resData.success) {
            alert(`সফলভাবে ${resData.count} টি অনুদান রেকর্ড ইম্পোর্ট হয়েছে!`);
            fetchDonors();
          } else {
            alert(resData.error || 'ইম্পোর্ট ব্যর্থ হয়েছে।');
          }
        } catch (err) {
          alert('CSV প্রসেস করতে ব্যর্থ হয়েছে।');
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gold-500/30 shadow-sm">
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900 flex items-center gap-2">
            <HeartHandshake className="w-6 h-6 text-emerald-800" />
            <span>দান ও ফান্ড লেজার ব্যবস্থাপনা</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            মোট রেকর্ড: {toBanglaNum(pagination.total)} টি | মোট সংগৃহীত: {formatBDT(totalAmount)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-stone-200"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV এক্সপোর্ট</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportCSV}
            accept=".csv"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-stone-200"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>CSV ইম্পোর্ট</span>
          </button>

          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-xl bg-emerald-950 text-gold-200 text-xs font-bold hover:bg-emerald-900 transition-colors flex items-center gap-1.5 shadow-md"
          >
            <Plus className="w-4 h-4 text-gold-400" />
            <span>নতুন অনুদান যোগ</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <input
            type="text"
            placeholder="দাতার নাম, রশিদ নং বা ঠিকানা দিয়ে খুঁজুন..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-300 text-xs bg-stone-50"
          />
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
        </div>

        <div className="w-full sm:w-auto flex items-center gap-3">
          <select
            value={purpose}
            onChange={(e) => {
              setPurpose(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl border border-stone-300 text-xs bg-stone-50"
          >
            <option value="">সকল খাত</option>
            {purposes.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>

          <input
            type="number"
            placeholder="সাল"
            value={year}
            onChange={(e) => {
              setYear(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl border border-stone-300 text-xs bg-stone-50 w-24"
          />
        </div>
      </div>

      {/* Donors Table */}
      <div className="bg-white rounded-2xl border border-gold-500/30 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-emerald-950 text-gold-200 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3.5">রশিদ নং</th>
                <th className="px-5 py-3.5">দাতার নাম</th>
                <th className="px-5 py-3.5">মোবাইল নং</th>
                <th className="px-5 py-3.5">ঠিকানা</th>
                <th className="px-5 py-3.5">খাত</th>
                <th className="px-5 py-3.5">তারিখ</th>
                <th className="px-5 py-3.5 text-right">পরিমাণ</th>
                <th className="px-5 py-3.5 text-center">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {donors.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-5 py-10 text-center text-stone-400">
                    কোনো অনুদান রেকর্ড পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                donors.map((d) => (
                  <tr key={d.id} className="hover:bg-emerald-50/40 transition-colors">
                    <td className="px-5 py-3 font-mono font-medium text-emerald-900">
                      {d.receiptNo || '—'}
                    </td>
                    <td className="px-5 py-3 font-serif font-bold text-stone-900">
                      {d.donorNameBn}
                    </td>
                    <td className="px-5 py-3 font-mono text-stone-800">{d.phone || '—'}</td>
                    <td className="px-5 py-3 text-stone-600 max-w-xs truncate">{d.addressBn || '—'}</td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                        {d.purpose}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-stone-600">
                      {d.donationDate ? new Date(d.donationDate).toLocaleDateString('bn-BD') : '—'}
                    </td>
                    <td className="px-5 py-3 text-right font-serif font-bold text-emerald-950 text-sm">
                      {formatBDT(d.amount)}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openEditModal(d)}
                          className="p-1.5 rounded-lg text-emerald-800 hover:bg-emerald-50 transition-colors"
                          title="সম্পাদনা"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(d.id, d.donorNameBn)}
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span>মোট {toBanglaNum(pagination.total)} রেকর্ডের মধ্যে পৃষ্ঠা {toBanglaNum(page)}</span>
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

      {/* Modal Form */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-gold-500/40 shadow-2xl relative p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h2 className="font-serif font-bold text-xl text-stone-900">
                {editItem ? 'অনুদান তথ্য সম্পাদনা' : 'নতুন অনুদান যোগ'}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">দাতার নাম (বাংলা) *</label>
                  <input
                    type="text"
                    required
                    value={formData.donorNameBn}
                    onChange={(e) => setFormData({ ...formData, donorNameBn: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">দাতার নাম (ইংরেজি)</label>
                  <input
                    type="text"
                    value={formData.donorNameEn}
                    onChange={(e) => setFormData({ ...formData, donorNameEn: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">অনুদানের পরিমাণ (৳) *</label>
                  <input
                    type="number"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">খাত / উদ্দেশ্য *</label>
                  <select
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-medium"
                  >
                    {purposes.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">রশিদ নং</label>
                  <input
                    type="text"
                    value={formData.receiptNo}
                    onChange={(e) => setFormData({ ...formData, receiptNo: e.target.value })}
                    placeholder="যেমন: REC-2024-05"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">অনুদানের তারিখ</label>
                  <input
                    type="date"
                    value={formData.donationDate}
                    onChange={(e) => setFormData({ ...formData, donationDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">মোবাইল নং (গোপনীয়)</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="০১৭১১-XXXXXX"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">ঠিকানা</label>
                  <input
                    type="text"
                    value={formData.addressBn}
                    onChange={(e) => setFormData({ ...formData, addressBn: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">মন্তব্য / নোট</label>
                <textarea
                  rows={2}
                  value={formData.noteBn}
                  onChange={(e) => setFormData({ ...formData, noteBn: e.target.value })}
                  placeholder="যেমন: শাহী মিম্বর নির্মাণে বিশেষ অনুদান"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.showAmount}
                    onChange={(e) => setFormData({ ...formData, showAmount: e.target.checked })}
                    className="rounded text-emerald-800"
                  />
                  <span>ওয়েবসাইটে অনুদানের পরিমাণ প্রদর্শন করুন</span>
                </label>
              </div>

              <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-stone-700 text-xs font-semibold hover:bg-stone-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 rounded-xl bg-emerald-950 text-gold-200 text-xs font-bold hover:bg-emerald-900 transition-colors shadow-md disabled:opacity-50"
                >
                  {saving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
