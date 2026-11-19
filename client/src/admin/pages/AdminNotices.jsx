import React, { useState, useEffect } from 'react';
import { Bell, Plus, Edit, Trash2, Pin, Calendar, FileText, X, Check } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { BilingualInput } from '../components/BilingualInput.jsx';

export function AdminNotices() {
  const { toBanglaNum } = useLanguage();

  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({
    titleBn: '',
    titleEn: '',
    slug: '',
    bodyBn: '',
    bodyEn: '',
    publishedAt: new Date().toISOString().split('T')[0],
    isPinned: false,
    isPublished: true,
  });
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [saving, setSaving] = useState(false);

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

  useEffect(() => {
    fetchNotices();
  }, [search, page]);

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '15' });
      if (search) params.append('q', search);

      const res = await fetch(`/api/admin/notices?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setNotices(data.notices || []);
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
      titleBn: '',
      titleEn: '',
      slug: `notice-${Date.now()}`,
      bodyBn: '',
      bodyEn: '',
      publishedAt: new Date().toISOString().split('T')[0],
      isPinned: false,
      isPublished: true,
    });
    setAttachmentFile(null);
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditItem(item);
    setFormData({
      titleBn: item.titleBn || '',
      titleEn: item.titleEn || '',
      slug: item.slug || '',
      bodyBn: item.bodyBn || '',
      bodyEn: item.bodyEn || '',
      publishedAt: item.publishedAt ? item.publishedAt.split('T')[0] : '',
      isPinned: Boolean(item.isPinned),
      isPublished: Boolean(item.isPublished),
    });
    setAttachmentFile(null);
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.titleBn.trim() || !formData.titleEn.trim() || !formData.bodyBn.trim() || !formData.bodyEn.trim()) {
      alert('নোটিশের শিরোনাম ও বিস্তারিত বক্তব্য বাংলা এবং ইংরেজি উভয় ভাষাতেই পূরণ আবশ্যক।');
      return;
    }

    setSaving(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach((k) => data.append(k, formData[k]));
      if (attachmentFile) {
        data.append('file', attachmentFile);
      }

      const url = editItem ? `/api/admin/notices/${editItem.id}` : '/api/admin/notices';
      const method = editItem ? 'PUT' : 'POST';

      const res = await fetch(url, { method, body: data });
      const resData = await res.json();

      if (resData.success) {
        setModalOpen(false);
        fetchNotices();
      } else {
        alert(resData.error || 'সংরক্ষণ ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      alert('সার্ভারে সমস্যা হয়েছে।');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`আপনি কি নিশ্চিত যে নোটিশ '${title}' ডাটাবেজ থেকে স্থায়ীভাবে মুছে ফেলতে চান?`)) return;

    try {
      const res = await fetch(`/api/admin/notices/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchNotices();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-surface p-6 rounded-3xl border border-sand shadow-sakinah-sm">
        <div>
          <h1 className="font-serif text-2xl font-bold text-ink flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary-dark" />
            <span>নোটিশ বোর্ড ও সংবাদ ব্যবস্থাপনা</span>
          </h1>
          <p className="text-xs text-ink-muted mt-1">
            মোট নোটিশ: {toBanglaNum(pagination.total)} টি
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-colors flex items-center gap-1.5 shadow-sakinah-sm"
        >
          <Plus className="w-4 h-4 text-gold" />
          <span>নতুন নোটিশ প্রকাশ</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-surface rounded-2xl border border-sand overflow-hidden shadow-sakinah-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-ink">
            <thead className="bg-canvas-alt border-b border-sand text-ink-muted uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3.5">শিরোনাম</th>
                <th className="px-5 py-3.5">তারিখ</th>
                <th className="px-5 py-3.5">পিন স্থিতি</th>
                <th className="px-5 py-3.5">সংযুক্তি</th>
                <th className="px-5 py-3.5 text-center">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand">
              {notices.map((n) => (
                <tr key={n.id} className="hover:bg-canvas-alt/60 transition-colors">
                  <td className="px-5 py-3 font-serif font-bold text-ink text-sm">
                    {n.titleBn}
                  </td>
                  <td className="px-5 py-3 text-ink-muted">
                    {new Date(n.publishedAt).toLocaleDateString('bn-BD')}
                  </td>
                  <td className="px-5 py-3">
                    {n.isPinned ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gold-plate text-ink">
                        <Pin className="w-3 h-3 fill-current" />
                        <span>জরুরি পিন</span>
                      </span>
                    ) : (
                      <span className="text-ink-muted">সাধারণ</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-ink-muted">
                    {n.attachmentPath ? (
                      <a href={n.attachmentPath} target="_blank" rel="noopener noreferrer" className="text-primary-dark font-bold hover:underline flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" />
                        <span>ফাইল</span>
                      </a>
                    ) : '—'}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button onClick={() => openEditModal(n)} className="p-1.5 rounded-lg text-primary-dark hover:bg-primary-soft">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(n.id, n.titleBn)} className="p-1.5 rounded-lg text-danger hover:bg-danger-soft">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface rounded-3xl max-w-xl w-full p-6 sm:p-8 border border-sand shadow-sakinah-lift space-y-4">
            <div className="flex items-center justify-between border-b border-sand pb-3">
              <h2 className="font-serif font-bold text-xl text-ink">
                {editItem ? 'নোটিশ সম্পাদনা' : 'নতুন নোটিশ তৈরি'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="p-2 rounded-full hover:bg-canvas-alt text-ink-muted">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <BilingualInput
                label="নোটিশের শিরোনাম"
                required={true}
                valueBn={formData.titleBn}
                valueEn={formData.titleEn}
                onChangeBn={(val) => setFormData({ ...formData, titleBn: val })}
                onChangeEn={(val) => setFormData({ ...formData, titleEn: val })}
                placeholderBn="যেমন: পবিত্র ঈদুল ফিতরের জামাত সময়সূচি ঘোষণা"
                placeholderEn="e.g. Announcement of Eid-ul-Fitr Jamaat Schedule"
              />

              <div>
                <label className="block font-bold text-ink mb-1">প্রকাশের তারিখ</label>
                <input
                  type="date"
                  value={formData.publishedAt}
                  onChange={(e) => setFormData({ ...formData, publishedAt: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-canvas border border-sand text-ink focus:outline-none focus:border-primary"
                />
              </div>

              <BilingualInput
                label="বিস্তারিত নোটিশ বক্তব্য"
                required={true}
                isTextArea={true}
                rows={5}
                valueBn={formData.bodyBn}
                valueEn={formData.bodyEn}
                onChangeBn={(val) => setFormData({ ...formData, bodyBn: val })}
                onChangeEn={(val) => setFormData({ ...formData, bodyEn: val })}
                placeholderBn="নোটিশের পূর্ণাঙ্গ বিবরণ..."
                placeholderEn="Full details and body of the notice..."
              />

              <div>
                <label className="block font-bold text-ink mb-1">সংযুক্তি ফাইল (PDF বা ছবি)</label>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-ink-muted file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-hover"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-ink">
                  <input
                    type="checkbox"
                    checked={formData.isPinned}
                    onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                    className="rounded accent-primary"
                  />
                  <span>জরুরি নোটিশ হিসেবে পিন করুন</span>
                </label>
              </div>

              <div className="pt-3 border-t border-sand flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-sand text-ink-muted hover:bg-canvas-alt font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold shadow-sakinah-sm disabled:opacity-50"
                >
                  {saving ? 'সংরক্ষণ হচ্ছে...' : 'প্রকাশ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

