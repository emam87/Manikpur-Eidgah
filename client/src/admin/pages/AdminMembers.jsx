import React, { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import { 
  Users, Search, Plus, Edit, Trash2, Download, Upload, 
  X, Check, AlertCircle, Phone, CreditCard, ChevronLeft, ChevronRight, User
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { BilingualInput } from '../components/BilingualInput.jsx';
import { getImageUrl } from '../../utils/imageUrl.js';

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
    fatherNameEn: '',
    phone: '',
    nidNo: '',
    addressBn: '',
    addressEn: '',
    memberSince: '',
    amountPaid: '',
    showAmount: true,
    isActive: true,
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef(null);

  // Lock body scroll when admin modal is open
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
      fatherNameEn: '',
      phone: '',
      nidNo: '',
      addressBn: '',
      addressEn: '',
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
      fatherNameEn: item.fatherNameEn || '',
      phone: item.phone || '',
      nidNo: item.nidNo || '',
      addressBn: item.addressBn || '',
      addressEn: item.addressEn || '',
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
    if (!formData.nameEn.trim()) {
      setErrorMsg('সদস্যের নাম (ইংরেজি) আবশ্যক (English name is required)।');
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
    if (!window.confirm(`আপনি কি নিশ্চিত যে আজীবন সদস্য '${name}' ডাটাবেজ থেকে স্থায়ীভাবে মুছে ফেলতে চান?`)) return;

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
    link.setAttribute('download', `manikpur-eidgah-members-${Date.now()}.csv`);
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-surface p-6 rounded-3xl border border-sand shadow-sakinah-card">
        <div>
          <h1 className="font-serif text-2xl font-bold text-primary-dark flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            <span>আজীবন সদস্য ব্যবস্থাপনা</span>
          </h1>
          <p className="text-xs text-ink-muted mt-1">
            মোট সদস্য: {toBanglaNum(pagination.total)} জন | গোপনীয় তথ্য (ফোন ও এনআইডি) সংরক্ষিত
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-xl bg-canvas-alt hover:bg-primary-soft text-ink text-xs font-semibold flex items-center gap-1.5 transition-colors border border-sand"
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
            className="px-3 py-2 rounded-xl bg-canvas-alt hover:bg-primary-soft text-ink text-xs font-semibold flex items-center gap-1.5 transition-colors border border-sand"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>CSV ইম্পোর্ট</span>
          </button>

          {/* Add Member */}
          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-colors flex items-center gap-1.5 shadow-sakinah-sm"
          >
            <Plus className="w-4 h-4 text-gold-plate-from" />
            <span>নতুন সদস্য যোগ</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-surface p-4 rounded-2xl border border-sand shadow-sakinah-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <input
            type="text"
            placeholder="নাম, ফোন, NID বা সদস্য নং দিয়ে খুঁজুন..."
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
          <input
            type="number"
            placeholder="সাল (যেমন: 2024)"
            value={year}
            onChange={(e) => {
              setYear(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl border border-sand text-xs bg-canvas text-ink w-32"
          />
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-surface rounded-2xl border border-sand overflow-hidden shadow-sakinah-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-ink">
            <thead className="bg-primary-soft text-primary-dark uppercase tracking-wider font-semibold border-b border-sand">
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
            <tbody className="divide-y divide-sand">
              {members.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-5 py-10 text-center text-ink-muted">
                    কোনো সদস্য পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                members.map((m) => (
                  <tr key={m.id} className="hover:bg-canvas-alt transition-colors">
                    <td className="px-5 py-3 font-mono font-bold text-primary-dark">
                      {toBanglaNum(m.membershipNo || m.id)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-primary-soft text-primary-dark flex items-center justify-center shrink-0 border border-gold/40">
                          {m.photoPath ? (
                            <img src={getImageUrl(m.photoPath)} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-4 h-4" />
                          )}
                        </div>
                        <span className="font-serif font-bold text-ink">{m.nameBn}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-ink-muted">{m.fatherNameBn || '—'}</td>
                    <td className="px-5 py-3 font-mono text-ink">{m.phone || '—'}</td>
                    <td className="px-5 py-3 text-ink-muted max-w-xs truncate">{m.addressBn || '—'}</td>
                    <td className="px-5 py-3 text-ink-muted">{toBanglaNum(m.memberSince) || '—'}</td>
                    <td className="px-5 py-3 text-right font-serif font-bold text-primary-dark">
                      {m.amountPaid ? formatBDT(m.amountPaid) : '—'}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openEditModal(m)}
                          className="p-1.5 rounded-lg text-primary hover:bg-primary-soft transition-colors"
                          title="সম্পাদনা"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(m.id, m.nameBn)}
                          className="p-1.5 rounded-lg text-danger hover:bg-danger-soft transition-colors"
                          title="ডাটাবেজ থেকে স্থায়ীভাবে মুছে ফেলুন"
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
          <div className="p-4 border-t border-sand flex items-center justify-between text-xs text-ink-muted">
            <span>মোট {toBanglaNum(pagination.total)} জনের মধ্যে পৃষ্ঠা {toBanglaNum(page)}</span>
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

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gold/40 shadow-sakinah-lift relative p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-sand pb-3">
              <h2 className="font-serif font-bold text-xl text-primary-dark">
                {editItem ? 'সদস্য তথ্য সম্পাদনা' : 'নতুন আজীবন সদস্য যোগ'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-full hover:bg-canvas-alt text-ink-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-danger-soft border border-danger/30 text-danger text-xs rounded-xl">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-ink mb-1">সদস্য নং</label>
                  <input
                    type="text"
                    value={formData.membershipNo}
                    onChange={(e) => setFormData({ ...formData, membershipNo: e.target.value })}
                    placeholder="যেমন: LM-101"
                    className="w-full px-3 py-2 rounded-xl border border-sand bg-canvas text-ink font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-ink mb-1">যোগদানের সাল</label>
                  <input
                    type="number"
                    value={formData.memberSince}
                    onChange={(e) => setFormData({ ...formData, memberSince: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-sand bg-canvas text-ink font-mono"
                  />
                </div>
              </div>

              {/* Bilingual Name */}
              <BilingualInput
                label="সদস্যের পুরো নাম"
                required={true}
                valueBn={formData.nameBn}
                valueEn={formData.nameEn}
                onChangeBn={(val) => setFormData({ ...formData, nameBn: val })}
                onChangeEn={(val) => setFormData({ ...formData, nameEn: val })}
                placeholderBn="উদা: আলহাজ্ব মোঃ কামাল হোসেন"
                placeholderEn="e.g. Alhaj Md. Kamal Hossain"
              />

              {/* Bilingual Father Name */}
              <BilingualInput
                label="পিতার নাম"
                valueBn={formData.fatherNameBn}
                valueEn={formData.fatherNameEn}
                onChangeBn={(val) => setFormData({ ...formData, fatherNameBn: val })}
                onChangeEn={(val) => setFormData({ ...formData, fatherNameEn: val })}
                placeholderBn="উদা: হাজী মোঃ ইদ্রিস মিয়া"
                placeholderEn="e.g. Haji Md. Idris Mia"
              />

              {/* Bilingual Address */}
              <BilingualInput
                label="গ্রাম / ঠিকানা"
                valueBn={formData.addressBn}
                valueEn={formData.addressEn}
                onChangeBn={(val) => setFormData({ ...formData, addressBn: val })}
                onChangeEn={(val) => setFormData({ ...formData, addressEn: val })}
                placeholderBn="উদা: মানিকপুর, বাঞ্ছারামপুর"
                placeholderEn="e.g. Manikpur, Bancharampur"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-ink mb-1">মোবাইল নম্বর (গোপনীয়)</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="০১৭১১-XXXXXX"
                    className="w-full px-3 py-2 rounded-xl border border-sand bg-canvas text-ink font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-ink mb-1">জাতীয় পরিচয়পত্র নং (গোপনীয়)</label>
                  <input
                    type="text"
                    value={formData.nidNo}
                    onChange={(e) => setFormData({ ...formData, nidNo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-sand bg-canvas text-ink font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-ink mb-1">অনুদানের পরিমাণ (৳)</label>
                  <input
                    type="number"
                    value={formData.amountPaid}
                    onChange={(e) => setFormData({ ...formData, amountPaid: e.target.value })}
                    placeholder="যেমন: 50000"
                    className="w-full px-3 py-2 rounded-xl border border-sand bg-canvas text-ink font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-ink mb-1">ছবি আপলোড</label>
                <div className="flex items-center gap-4">
                  {(photoFile || editItem?.photoPath) && (
                    <div className="w-14 h-14 rounded-xl overflow-hidden border border-gold/40 bg-canvas-alt shrink-0 shadow-sakinah-sm">
                      <img
                        src={photoFile ? URL.createObjectURL(photoFile) : getImageUrl(editItem.photoPath)}
                        alt="Member Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-ink-muted file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary-soft file:text-primary-dark hover:file:bg-primary/20"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-ink">
                  <input
                    type="checkbox"
                    checked={formData.showAmount}
                    onChange={(e) => setFormData({ ...formData, showAmount: e.target.checked })}
                    className="rounded accent-primary"
                  />
                  <span>ওয়েবসাইটে অনুদানের পরিমাণ প্রদর্শন করুন</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-ink">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded accent-primary"
                  />
                  <span>সক্রিয় সদস্য</span>
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

