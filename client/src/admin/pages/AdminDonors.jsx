import React, { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import { 
  HeartHandshake, Search, Plus, Edit, Trash2, Download, Upload, 
  X, Check, AlertCircle, Calendar, Receipt, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { BilingualInput } from '../components/BilingualInput.jsx';

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
    addressEn: '',
    amount: '',
    donationDate: new Date().toISOString().split('T')[0],
    purpose: 'GENERAL',
    receiptNo: '',
    showAmount: true,
    noteBn: '',
    noteEn: '',
  });
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (modalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [modalOpen]);

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
      addressEn: '',
      amount: '',
      donationDate: new Date().toISOString().split('T')[0],
      purpose: 'GENERAL',
      receiptNo: '',
      showAmount: true,
      noteBn: '',
      noteEn: '',
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
      addressEn: item.addressEn || '',
      amount: item.amount ? item.amount.toString() : '',
      donationDate: item.donationDate ? item.donationDate.split('T')[0] : '',
      purpose: item.purpose || 'GENERAL',
      receiptNo: item.receiptNo || '',
      showAmount: item.showAmount !== false,
      noteBn: item.noteBn || '',
      noteEn: item.noteEn || '',
    });
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.donorNameBn.trim() || !formData.donorNameEn.trim() || !formData.amount) {
      setErrorMsg('দাতার নাম বাংলা এবং ইংরেজি উভয় ভাষাতেই এবং অনুদানের পরিমাণ আবশ্যক।');
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
    if (!window.confirm(`আপনি কি নিশ্চিত যে '${name}' এর অনুদান রেকর্ড ডাটাবেজ থেকে স্থায়ীভাবে মুছে ফেলতে চান?`)) return;

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
    link.setAttribute('download', `manikpur-eidgah-donors-${Date.now()}.csv`);
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-surface p-6 rounded-3xl border border-sand shadow-sakinah-card">
        <div>
          <h1 className="font-serif text-2xl font-bold text-primary-dark flex items-center gap-2">
            <HeartHandshake className="w-6 h-6 text-primary" />
            <span>দান ও ফান্ড লেজার ব্যবস্থাপনা</span>
          </h1>
          <p className="text-xs text-ink-muted mt-1">
            মোট রেকর্ড: {toBanglaNum(pagination.total)} টি | মোট সংগৃহীত: {formatBDT(totalAmount)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-xl bg-canvas-alt hover:bg-primary-soft text-ink text-xs font-semibold flex items-center gap-1.5 transition-colors border border-sand"
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
            className="px-3 py-2 rounded-xl bg-canvas-alt hover:bg-primary-soft text-ink text-xs font-semibold flex items-center gap-1.5 transition-colors border border-sand"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>CSV ইম্পোর্ট</span>
          </button>

          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-colors flex items-center gap-1.5 shadow-sakinah-sm"
          >
            <Plus className="w-4 h-4 text-gold-plate-from" />
            <span>নতুন অনুদান যোগ</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-surface p-4 rounded-2xl border border-sand shadow-sakinah-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <input
            type="text"
            placeholder="দাতার নাম, রশিদ নং বা ঠিকানা দিয়ে খুঁজুন..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-sand text-xs bg-canvas text-ink"
          />
          <Search className="w-4 h-4 text-ink-muted absolute left-3 top-2.5" />
        </div>

        <div className="w-full sm:w-auto flex items-center gap-3">
          <select
            value={purpose}
            onChange={(e) => {
              setPurpose(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl border border-sand text-xs bg-canvas text-ink"
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
            className="px-3 py-2 rounded-xl border border-sand text-xs bg-canvas text-ink w-24"
          />
        </div>
      </div>

      {/* Donors Table */}
      <div className="bg-surface rounded-2xl border border-sand overflow-hidden shadow-sakinah-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-ink">
            <thead className="bg-primary-soft text-primary-dark uppercase tracking-wider font-semibold border-b border-sand">
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
            <tbody className="divide-y divide-sand">
              {donors.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-5 py-10 text-center text-ink-muted">
                    কোনো অনুদান রেকর্ড পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                donors.map((d) => (
                  <tr key={d.id} className="hover:bg-canvas-alt transition-colors">
                    <td className="px-5 py-3 font-mono font-medium text-primary-dark">
                      {d.receiptNo || '—'}
                    </td>
                    <td className="px-5 py-3 font-serif font-bold text-ink">
                      {d.donorNameBn}
                    </td>
                    <td className="px-5 py-3 font-mono text-ink">{d.phone || '—'}</td>
                    <td className="px-5 py-3 text-ink-muted max-w-xs truncate">{d.addressBn || '—'}</td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary-soft text-primary-dark">
                        {d.purpose}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-ink-muted">
                      {d.donationDate ? new Date(d.donationDate).toLocaleDateString('bn-BD') : '—'}
                    </td>
                    <td className="px-5 py-3 text-right font-serif font-bold text-primary-dark text-sm">
                      {formatBDT(d.amount)}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openEditModal(d)}
                          className="p-1.5 rounded-lg text-primary hover:bg-primary-soft transition-colors"
                          title="সম্পাদনা"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(d.id, d.donorNameBn)}
                          className="p-1.5 rounded-lg text-danger hover:bg-danger-soft transition-colors"
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
          <div className="p-4 border-t border-sand flex items-center justify-between text-xs text-ink-muted">
            <span>মোট {toBanglaNum(pagination.total)} রেকর্ডের মধ্যে পৃষ্ঠা {toBanglaNum(page)}</span>
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

      {/* Modal Form */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-gold/40 shadow-sakinah-lift relative p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-sand pb-3">
              <h2 className="font-serif font-bold text-xl text-primary-dark">
                {editItem ? 'অনুদান তথ্য সম্পাদনা' : 'নতুন অনুদান যোগ'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="p-2 rounded-full hover:bg-canvas-alt text-ink-muted">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-danger-soft border border-danger/30 text-danger text-xs rounded-xl">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <BilingualInput
                label="দাতার নাম"
                required={true}
                valueBn={formData.donorNameBn}
                valueEn={formData.donorNameEn}
                onChangeBn={(val) => setFormData({ ...formData, donorNameBn: val })}
                onChangeEn={(val) => setFormData({ ...formData, donorNameEn: val })}
                placeholderBn="যেমন: হাজী মোঃ দেলোয়ার হোসেন"
                placeholderEn="e.g. Haji Md. Delwar Hossain"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-ink mb-1">অনুদানের পরিমাণ (৳) *</label>
                  <input
                    type="number"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-sand bg-canvas text-ink font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-ink mb-1">খাত / উদ্দেশ্য *</label>
                  <select
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-sand bg-canvas text-ink font-medium"
                  >
                    {purposes.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-ink mb-1">রশিদ নং</label>
                  <input
                    type="text"
                    value={formData.receiptNo}
                    onChange={(e) => setFormData({ ...formData, receiptNo: e.target.value })}
                    placeholder="যেমন: REC-2024-05"
                    className="w-full px-3 py-2 rounded-xl border border-sand bg-canvas text-ink font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-ink mb-1">অনুদানের তারিখ</label>
                  <input
                    type="date"
                    value={formData.donationDate}
                    onChange={(e) => setFormData({ ...formData, donationDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-sand bg-canvas text-ink"
                  />
                </div>

                <div>
                  <label className="block font-bold text-ink mb-1">মোবাইল নং (গোপনীয়)</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="০১৭১১-XXXXXX"
                    className="w-full px-3 py-2 rounded-xl border border-sand bg-canvas text-ink font-mono"
                  />
                </div>
              </div>

              <BilingualInput
                label="ঠিকানা (ঐচ্ছিক)"
                valueBn={formData.addressBn}
                valueEn={formData.addressEn}
                onChangeBn={(val) => setFormData({ ...formData, addressBn: val })}
                onChangeEn={(val) => setFormData({ ...formData, addressEn: val })}
                placeholderBn="যেমন: গ্রাম: মানিকপুর, ডাকঘর: হরিপুর"
                placeholderEn="e.g. Vill: Manikpur, P.O: Haripur"
              />

              <BilingualInput
                label="মন্তব্য / নোট"
                isTextArea={true}
                rows={2}
                valueBn={formData.noteBn}
                valueEn={formData.noteEn}
                onChangeBn={(val) => setFormData({ ...formData, noteBn: val })}
                onChangeEn={(val) => setFormData({ ...formData, noteEn: val })}
                placeholderBn="যেমন: মিম্বর নির্মাণে বিশেষ অনুদান"
                placeholderEn="e.g. Special donation for Mimbar construction"
              />

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-ink">
                  <input
                    type="checkbox"
                    checked={formData.showAmount}
                    onChange={(e) => setFormData({ ...formData, showAmount: e.target.checked })}
                    className="rounded accent-primary"
                  />
                  <span>ওয়েবসাইটে অনুদানের পরিমাণ প্রদর্শন করুন</span>
                </label>
              </div>

              <div className="pt-4 border-t border-sand flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-sand text-ink-muted text-xs font-semibold hover:bg-canvas-alt"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-colors shadow-sakinah-sm disabled:opacity-50"
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

