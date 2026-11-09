import React, { useState, useEffect } from 'react';
import { 
  Users2, Plus, Edit, Trash2, Archive, User, X, Check, 
  Phone, Calendar, AlertCircle, ArrowUpDown 
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.jsx';

export function AdminCommittee() {
  const { toBanglaNum } = useLanguage();

  const [committee, setCommittee] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [archiveTermName, setArchiveTermName] = useState('');
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({
    nameBn: '',
    nameEn: '',
    designationBn: 'সমন্বয়ক',
    designationEn: 'Coordinator',
    roleBn: '',
    level: 2,
    term: 'বর্তমান',
    sortOrder: 1,
    isCurrent: true,
    phone: '',
    showPhone: false,
    bioBn: '',
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchCommittee();
  }, []);

  const fetchCommittee = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/committee');
      const data = await res.json();
      if (data.success) {
        setCommittee(data.committee || []);
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
      nameBn: '',
      nameEn: '',
      designationBn: 'সমন্বয়ক',
      designationEn: 'Coordinator',
      roleBn: '',
      level: 2,
      term: 'বর্তমান',
      sortOrder: committee.length + 1,
      isCurrent: true,
      phone: '',
      showPhone: false,
      bioBn: '',
    });
    setPhotoFile(null);
    setErrorMsg('');
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditItem(item);
    setFormData({
      nameBn: item.nameBn || '',
      nameEn: item.nameEn || '',
      designationBn: item.designationBn || '',
      designationEn: item.designationEn || '',
      roleBn: item.roleBn || '',
      level: item.level || 2,
      term: item.term || 'বর্তমান',
      sortOrder: item.sortOrder || 1,
      isCurrent: item.isCurrent !== false,
      phone: item.phone || '',
      showPhone: item.showPhone === true,
      bioBn: item.bioBn || '',
    });
    setPhotoFile(null);
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.nameBn.trim() || !formData.designationBn.trim()) {
      setErrorMsg('সদস্যের নাম ও পদবী আবশ্যক।');
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

      const url = editItem ? `/api/admin/committee/${editItem.id}` : '/api/admin/committee';
      const method = editItem ? 'PUT' : 'POST';

      const res = await fetch(url, { method, body: data });
      const resData = await res.json();

      if (!res.ok || !resData.success) {
        throw new Error(resData.error || 'সংরক্ষণ ব্যর্থ হয়েছে।');
      }

      setModalOpen(false);
      fetchCommittee();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`আপনি কি নিশ্চিত যে '${name}' কে কমিটি থেকে ট্র্যাশে পাঠাতে চান?`)) return;

    try {
      const res = await fetch(`/api/admin/committee/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchCommittee();
      } else {
        alert(data.error || 'মুছে ফেলতে সমস্যা হয়েছে।');
      }
    } catch (err) {
      alert('সার্ভারে সমস্যা হয়েছে।');
    }
  };

  const handleArchiveTerm = async (e) => {
    e.preventDefault();
    if (!archiveTermName.trim()) return;

    setSaving(true);
    try {
      const res = await fetch('/api/admin/committee/archive-term', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ termName: archiveTermName.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`সফলভাবে ${data.count} জন সদস্যকে '${archiveTermName}' মেয়াদে আর্কাইভে স্থানান্তর করা হয়েছে!`);
        setArchiveModalOpen(false);
        setArchiveTermName('');
        fetchCommittee();
      } else {
        alert(data.error || 'আর্কাইভ ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      alert('সার্ভারে সমস্যা হয়েছে।');
    } finally {
      setSaving(false);
    }
  };

  const currentMembers = committee.filter((c) => c.isCurrent);
  const archivedMembers = committee.filter((c) => !c.isCurrent);

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gold-500/30 shadow-sm">
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900 flex items-center gap-2">
            <Users2 className="w-6 h-6 text-emerald-800" />
            <span>পরিচালনা পরিষদ ও কমিটি ব্যবস্থাপনা</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            বর্তমান সক্রিয় সদস্য: {toBanglaNum(currentMembers.length)} জন | আর্কাইভ সদস্য: {toBanglaNum(archivedMembers.length)} জন
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Archive Term Action */}
          <button
            onClick={() => setArchiveModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-stone-200"
          >
            <Archive className="w-3.5 h-3.5 text-stone-600" />
            <span>বর্তমান মেয়াদ আর্কাইভ করুন</span>
          </button>

          {/* Add Committee Member */}
          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-xl bg-emerald-950 text-gold-200 text-xs font-bold hover:bg-emerald-900 transition-colors flex items-center gap-1.5 shadow-md"
          >
            <Plus className="w-4 h-4 text-gold-400" />
            <span>নতুন সদস্য যোগ</span>
          </button>
        </div>
      </div>

      {/* Current Committee List */}
      <div className="bg-white rounded-3xl p-6 border border-gold-500/30 shadow-sm space-y-4">
        <h2 className="font-serif font-bold text-lg text-emerald-950 flex items-center gap-2 border-b border-stone-100 pb-3">
          <span>বর্তমান কার্যনির্বাহী পরিষদ</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-sans font-semibold">
            সক্রিয়
          </span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-emerald-950 text-gold-200 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3.5">ক্রম</th>
                <th className="px-5 py-3.5">নাম ও ছবি</th>
                <th className="px-5 py-3.5">পদবী</th>
                <th className="px-5 py-3.5">স্তর (Level)</th>
                <th className="px-5 py-3.5">মোবাইল</th>
                <th className="px-5 py-3.5 text-center">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {currentMembers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-8 text-center text-stone-400">
                    কোনো বর্তমান কমিটি সদস্য নেই।
                  </td>
                </tr>
              ) : (
                currentMembers.map((m) => (
                  <tr key={m.id} className="hover:bg-emerald-50/40 transition-colors">
                    <td className="px-5 py-3 font-mono font-bold text-emerald-900">
                      {toBanglaNum(m.sortOrder)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-emerald-900 text-gold-300 flex items-center justify-center shrink-0 border border-gold-500/40">
                          {m.photoPath ? (
                            <img src={m.photoPath} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-5 h-5" />
                          )}
                        </div>
                        <span className="font-serif font-bold text-stone-900 text-sm">{m.nameBn}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-semibold text-emerald-900">{m.designationBn}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        m.level === 1 ? 'bg-gold-100 text-gold-900' : 'bg-stone-100 text-stone-700'
                      }`}>
                        {m.level === 1 ? 'লেভেল ১ (প্রধান)' : 'লেভেল ২ (সমন্বয়ক)'}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono text-stone-600">
                      {m.phone ? `${m.phone} ${m.showPhone ? '(উন্মুক্ত)' : '(গোপন)'}` : '—'}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openEditModal(m)}
                          className="p-1.5 rounded-lg text-emerald-800 hover:bg-emerald-50"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(m.id, m.nameBn)}
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"
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
      </div>

      {/* Archived Committees List */}
      {archivedMembers.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-4">
          <h2 className="font-serif font-bold text-lg text-stone-800 flex items-center gap-2 border-b border-stone-100 pb-3">
            <Archive className="w-4 h-4 text-stone-500" />
            <span>পূর্ববর্তী মেয়াদের আর্কাইভ কমিটি</span>
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-700">
              <thead className="bg-stone-100 text-stone-700 uppercase font-semibold">
                <tr>
                  <th className="px-5 py-3">মেয়াদ</th>
                  <th className="px-5 py-3">নাম</th>
                  <th className="px-5 py-3">পদবী</th>
                  <th className="px-5 py-3 text-center">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {archivedMembers.map((m) => (
                  <tr key={m.id} className="hover:bg-stone-50">
                    <td className="px-5 py-3 font-mono font-medium text-stone-800">{m.term}</td>
                    <td className="px-5 py-3 font-bold text-stone-900">{m.nameBn}</td>
                    <td className="px-5 py-3 text-stone-600">{m.designationBn}</td>
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={() => openEditModal(m)}
                        className="p-1.5 text-emerald-800 hover:bg-emerald-50 rounded-lg"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-gold-500/40 shadow-2xl relative p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h2 className="font-serif font-bold text-xl text-stone-900">
                {editItem ? 'কমিটি সদস্য সম্পাদনা' : 'নতুন কমিটি সদস্য যোগ'}
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
                  <label className="block font-bold text-stone-700 mb-1">পদবী (বাংলা) *</label>
                  <input
                    type="text"
                    required
                    value={formData.designationBn}
                    onChange={(e) => setFormData({ ...formData, designationBn: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">পদবী (ইংরেজি)</label>
                  <input
                    type="text"
                    value={formData.designationEn}
                    onChange={(e) => setFormData({ ...formData, designationEn: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">কমিটি স্তর (Hierarchy Level)</label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300"
                  >
                    <option value={1}>লেভেল ১: প্রধান সমন্বয়ক (Hero Card)</option>
                    <option value={2}>লেভেল ২: সমন্বয়কবৃন্দ (৩ কলাম গ্রিড)</option>
                    <option value={3}>লেভেল ৩: সাধারণ কার্যনির্বাহী সদস্য</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">ক্রম নম্বর (Sort Order)</label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">মেয়াদ (Term)</label>
                  <input
                    type="text"
                    value={formData.term}
                    onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                    placeholder="বর্তমান অথবা ২০২১-২০২৩"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">মোবাইল নম্বর</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">সংক্ষিপ্ত পরিচিতি / বায়ো</label>
                <textarea
                  rows={2}
                  value={formData.bioBn}
                  onChange={(e) => setFormData({ ...formData, bioBn: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">ছবি আপলোড</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-800"
                />
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isCurrent}
                    onChange={(e) => setFormData({ ...formData, isCurrent: e.target.checked })}
                    className="rounded text-emerald-800"
                  />
                  <span>বর্তমান পরিচালনা পরিষদ সদস্য</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.showPhone}
                    onChange={(e) => setFormData({ ...formData, showPhone: e.target.checked })}
                    className="rounded text-emerald-800"
                  />
                  <span>ওয়েবসাইটে মোবাইল নম্বর উন্মুক্ত রাখুন</span>
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

      {/* Archive Term Modal */}
      {archiveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-gold-500/40 shadow-2xl space-y-4">
            <h3 className="font-serif font-bold text-lg text-stone-900">
              বর্তমান পরিষদ মেয়াদ আর্কাইভ
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              বর্তমান পরিষদকে একটি নির্দিষ্ট মেয়াদ নামে সংরক্ষণে রূপান্তর করবে (কোনো ডাটা মুছবে না)। পরবর্তীতে নতুন কার্যনির্বাহী পরিষদ গঠন করতে পারবেন।
            </p>

            <form onSubmit={handleArchiveTerm} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  মেয়াদ নাম (যেমন: ২০২১ - ২০২৪)
                </label>
                <input
                  type="text"
                  required
                  value={archiveTermName}
                  onChange={(e) => setArchiveTermName(e.target.value)}
                  placeholder="২০২১ - ২০২৪ মেয়াদ"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setArchiveModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-stone-700 text-xs font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-emerald-950 text-gold-200 text-xs font-bold shadow-md"
                >
                  {saving ? 'আর্কাইভ হচ্ছে...' : 'আর্কাইভ নিশ্চিত করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
