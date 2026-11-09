import React, { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import { 
  Users, Search, Plus, Edit, Trash2, Download, Upload, 
  X, Check, AlertCircle, Phone, CreditCard, ChevronLeft, ChevronRight, User
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.jsx';

export function AdminMembers() {
  const { toBanglaNum, formatBDT } = useLanguage();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [year, setYear] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({
    membershipNo: '',
    nameBn: '',
    nameEn: '',
    fatherNameBn: '',
    phone: '',
    nidNo: '',
    addressBn: '',
    memberSince: '',
    amountPaid: '',
    showAmount: true,
    isActive: true,
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchMembers();
  }, [search, year, page]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '15' });
      if (search) params.append('q', search);
      if (year) params.append('year', year);

      const res = await fetch(`/api/admin/members?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setMembers(data.members || []);
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
      membershipNo: '',
      nameBn: '',
      nameEn: '',
      fatherNameBn: '',
      phone: '',
      nidNo: '',
      addressBn: '',
      memberSince: new Date().getFullYear().toString(),
      amountPaid: '',
      showAmount: true,
      isActive: true,
    });
    setPhotoFile(null);
    setErrorMsg('');
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditItem(item);
    setFormData({
      membershipNo: item.membershipNo || '',
      nameBn: item.nameBn || '',
      nameEn: item.nameEn || '',
      fatherNameBn: item.fatherNameBn || '',
      phone: item.phone || '',
      nidNo: item.nidNo || '',
      addressBn: item.addressBn || '',
      memberSince: item.memberSince ? item.memberSince.toString() : '',
      amountPaid: item.amountPaid ? item.amountPaid.toString() : '',
      showAmount: item.showAmount !== false,
      isActive: item.isActive !== false,
    });
    setPhotoFile(null);
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.nameBn.trim()) {
      setErrorMsg('সদস্যের নাম (বাংলা) আবশ্যক।');
      return;
    }

    setSaving(true);
    setErrorMsg('');

    try {
      const data = new FormData();
      Object.keys(formData).forEach((k) => {
        data.append(k, formData[k]);
      });
      if (photoFile) {
        data.append('photo', photoFile);
      }

      const url = editItem ? `/api/admin/members/${editItem.id}` : '/api/admin/members';
      const method = editItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        body: data,
      });
      const resData = await res.json();

      if (!res.ok || !resData.success) {
        throw new Error(resData.error || 'সংরক্ষণ ব্যর্থ হয়েছে।');
      }

      setModalOpen(false);
      fetchMembers();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`আপনি কি নিশ্চিত যে আজীবন সদস্য '${name}' ট্র্যাশে পাঠাতে চান?`)) return;

    try {
      const res = await fetch(`/api/admin/members/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchMembers();
      } else {
        alert(data.error || 'মুছে ফেলতে সমস্যা হয়েছে।');
      }
    } catch (err) {
      alert('সার্ভারে সমস্যা হয়েছে।');
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    const csvData = members.map((m) => ({
      'সদস্য নং': m.membershipNo || '',
      'নাম (বাংলা)': m.nameBn,
      'নাম (ইংরেজি)': m.nameEn || '',
      'পিতার নাম': m.fatherNameBn || '',
      'মোবাইল নং': m.phone || '',
      'জাতীয় পরিচয়পত্র (NID)': m.nidNo || '',
      'ঠিকানা': m.addressBn || '',
      'যোগদানের সাল': m.memberSince || '',
      'অনুদানের পরিমাণ': m.amountPaid || '',
      'পরিমাণ প্রদর্শন': m.showAmount ? 'হ্যাঁ' : 'না',
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `members_export_${Date.now()}.csv`);
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
          const parsedMembers = results.data.map((row) => ({
            membershipNo: row['সদস্য নং'] || row['membershipNo'] || '',
            nameBn: row['নাম (বাংলা)'] || row['nameBn'] || row['Name'] || '',
            nameEn: row['নাম (ইংরেজি)'] || row['nameEn'] || '',
            fatherNameBn: row['পিতার নাম'] || row['fatherNameBn'] || '',
            phone: row['মোবাইল নং'] || row['phone'] || '',
            nidNo: row['জাতীয় পরিচয়পত্র (NID)'] || row['nidNo'] || '',
            addressBn: row['ঠিকানা'] || row['addressBn'] || '',
            memberSince: row['যোগদানের সাল'] || row['memberSince'] || '',
            amountPaid: row['অনুদানের পরিমাণ'] || row['amountPaid'] || '',
            showAmount: true,
          }));

          const res = await fetch('/api/admin/members/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ members: parsedMembers }),
          });
          const resData = await res.json();
          if (resData.success) {
            alert(`সফলভাবে ${resData.count} জন সদস্য ইম্পোর্ট করা হয়েছে!`);
            fetchMembers();
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
            <Users className="w-6 h-6 text-emerald-800" />
            <span>আজীবন সদস্য ব্যবস্থাপনা</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            মোট সদস্য: {toBanglaNum(pagination.total)} জন | গোপনীয় তথ্য (ফোন ও এনআইডি) সংরক্ষিত
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-stone-200"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV এক্সপোর্ট</span>
          </button>

          {/* Import CSV */}
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

          {/* Add Member */}
          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-xl bg-emerald-950 text-gold-200 text-xs font-bold hover:bg-emerald-900 transition-colors flex items-center gap-1.5 shadow-md"
          >
            <Plus className="w-4 h-4 text-gold-400" />
            <span>নতুন সদস্য যোগ</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <input
            type="text"
            placeholder="নাম, ফোন, NID বা সদস্য নং দিয়ে খুঁজুন..."
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
          <input
            type="number"
            placeholder="সাল (যেমন: 2024)"
            value={year}
            onChange={(e) => {
              setYear(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl border border-stone-300 text-xs bg-stone-50 w-32"
          />
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-2xl border border-gold-500/30 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-emerald-950 text-gold-200 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3.5">সদস্য নং</th>
                <th className="px-5 py-3.5">নাম ও ছবি</th>
                <th className="px-5 py-3.5">পিতার নাম</th>
                <th className="px-5 py-3.5">মোবাইল নং</th>
                <th className="px-5 py-3.5">ঠিকানা</th>
                <th className="px-5 py-3.5">যোগদান</th>
                <th className="px-5 py-3.5 text-right">অনুদান</th>
                <th className="px-5 py-3.5 text-center">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {members.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-5 py-10 text-center text-stone-400">
                    কোনো সদস্য পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                members.map((m) => (
                  <tr key={m.id} className="hover:bg-emerald-50/40 transition-colors">
                    <td className="px-5 py-3 font-mono font-bold text-emerald-900">
                      {toBanglaNum(m.membershipNo || m.id)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-emerald-900 text-gold-300 flex items-center justify-center shrink-0 border border-gold-500/40">
                          {m.photoPath ? (
                            <img src={m.photoPath} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-4 h-4" />
                          )}
                        </div>
                        <span className="font-serif font-bold text-stone-900">{m.nameBn}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-stone-600">{m.fatherNameBn || '—'}</td>
                    <td className="px-5 py-3 font-mono text-stone-800">{m.phone || '—'}</td>
                    <td className="px-5 py-3 text-stone-600 max-w-xs truncate">{m.addressBn || '—'}</td>
                    <td className="px-5 py-3 text-stone-600">{toBanglaNum(m.memberSince) || '—'}</td>
                    <td className="px-5 py-3 text-right font-serif font-bold text-emerald-950">
                      {m.amountPaid ? formatBDT(m.amountPaid) : '—'}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openEditModal(m)}
                          className="p-1.5 rounded-lg text-emerald-800 hover:bg-emerald-50 transition-colors"
                          title="সম্পাদনা"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(m.id, m.nameBn)}
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                          title="মুছে ফেলুন (ট্র্যাশ)"
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

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span>মোট {toBanglaNum(pagination.total)} জনের মধ্যে পৃষ্ঠা {toBanglaNum(page)}</span>
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

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gold-500/40 shadow-2xl relative p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h2 className="font-serif font-bold text-xl text-stone-900">
                {editItem ? 'সদস্য তথ্য সম্পাদনা' : 'নতুন আজীবন সদস্য যোগ'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-full hover:bg-stone-100 text-stone-500"
              >
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
                  <label className="block font-bold text-stone-700 mb-1">সদস্য নং</label>
                  <input
                    type="text"
                    value={formData.membershipNo}
                    onChange={(e) => setFormData({ ...formData, membershipNo: e.target.value })}
                    placeholder="যেমন: LM-101"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">যোগদানের সাল</label>
                  <input
                    type="number"
                    value={formData.memberSince}
                    onChange={(e) => setFormData({ ...formData, memberSince: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">সদস্যের নাম (বাংলা) *</label>
                  <input
                    type="text"
                    required
                    value={formData.nameBn}
                    onChange={(e) => setFormData({ ...formData, nameBn: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">সদস্যের নাম (ইংরেজি)</label>
                  <input
                    type="text"
                    value={formData.nameEn}
                    onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">পিতার নাম (বাংলা)</label>
                  <input
                    type="text"
                    value={formData.fatherNameBn}
                    onChange={(e) => setFormData({ ...formData, fatherNameBn: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">মোবাইল নম্বর (গোপনীয়)</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="০১৭১১-XXXXXX"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">জাতীয় পরিচয়পত্র নং (গোপনীয়)</label>
                  <input
                    type="text"
                    value={formData.nidNo}
                    onChange={(e) => setFormData({ ...formData, nidNo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">অনুদানের পরিমাণ (৳)</label>
                  <input
                    type="number"
                    value={formData.amountPaid}
                    onChange={(e) => setFormData({ ...formData, amountPaid: e.target.value })}
                    placeholder="যেমন: 50000"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">ঠিকানা (বাংলা)</label>
                <input
                  type="text"
                  value={formData.addressBn}
                  onChange={(e) => setFormData({ ...formData, addressBn: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">ছবি আপলোড</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-800 hover:file:bg-emerald-100"
                />
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.showAmount}
                    onChange={(e) => setFormData({ ...formData, showAmount: e.target.checked })}
                    className="rounded text-emerald-800"
                  />
                  <span>ওয়েবসাইটে অনুদানের পরিমাণ প্রদর্শন করুন</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded text-emerald-800"
                  />
                  <span>সক্রিয় সদস্য</span>
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

