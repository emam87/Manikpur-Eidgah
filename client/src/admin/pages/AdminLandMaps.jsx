import React, { useState, useEffect } from 'react';
import { Map, Plus, Trash2, Eye, X, Compass, Layers, Check } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { BilingualInput } from '../components/BilingualInput.jsx';

export function AdminLandMaps() {
  const { toBanglaNum } = useLanguage();

  const [maps, setMaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    titleBn: '',
    titleEn: '',
    surveyType: 'CS',
    dagKhatianInfo: '',
    descriptionBn: '',
    descriptionEn: '',
    sortOrder: 1,
  });
  const [mapFile, setMapFile] = useState(null);
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
    fetchMaps();
  }, []);

  const fetchMaps = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/land-maps');
      const data = await res.json();
      if (data.success) {
        setMaps(data.landMaps || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.titleBn.trim() || !formData.titleEn.trim() || !mapFile) {
      alert('নকশার শিরোনাম বাংলা এবং ইংরেজি উভয় ভাষাতেই আবশ্যক এবং ফাইল নির্বাচন করুন।');
      return;
    }

    setSaving(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach((k) => data.append(k, formData[k]));
      data.append('file', mapFile);

      const res = await fetch('/api/admin/land-maps', {
        method: 'POST',
        body: data,
      });
      const resData = await res.json();

      if (resData.success) {
        setModalOpen(false);
        fetchMaps();
      } else {
        alert(resData.error || 'আপলোড ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      alert('সার্ভারে সমস্যা হয়েছে।');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`আপনি কি নিশ্চিত যে '${title}' নকশা ডাটাবেজ থেকে স্থায়ীভাবে মুছে ফেলতে চান?`)) return;

    try {
      const res = await fetch(`/api/admin/land-maps/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchMaps();
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
            <Compass className="w-6 h-6 text-primary-dark" />
            <span>মৌজা নকশা ও জরিপ মানচিত্র ব্যবস্থাপনা</span>
          </h1>
          <p className="text-xs text-ink-muted mt-1">
            সিএস, এসএ, আরএস ও বিএস অফিসিয়াল মৌজা জরিপ নকশা
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              titleBn: '',
              surveyType: 'CS',
              dagKhatianInfo: '',
              descriptionBn: '',
              sortOrder: maps.length + 1,
            });
            setMapFile(null);
            setModalOpen(true);
          }}
          className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-colors flex items-center gap-1.5 shadow-sakinah-sm"
        >
          <Plus className="w-4 h-4 text-gold" />
          <span>নতুন মৌজা নকশা আপলোড</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {maps.map((m) => (
          <div key={m.id} className="bg-surface rounded-3xl overflow-hidden border border-sand shadow-sakinah-sm flex flex-col justify-between">
            <div className="relative aspect-[16/10] bg-canvas-alt overflow-hidden">
              <img src={m.filePath} alt="" className="w-full h-full object-cover" />
              <div className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-gold-plate text-ink font-bold text-xs font-mono shadow-sakinah-sm">
                {m.surveyType}
              </div>
            </div>

            <div className="p-5 space-y-2">
              <h3 className="font-serif font-bold text-base text-ink line-clamp-1">
                {m.titleBn}
              </h3>
              {m.dagKhatianInfo && (
                <p className="text-xs text-ink-muted font-mono">
                  দাগ/খতিয়ান: {m.dagKhatianInfo}
                </p>
              )}

              <div className="pt-3 border-t border-sand flex items-center justify-between">
                <a
                  href={m.filePath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-primary-soft text-primary-dark text-xs font-semibold hover:bg-primary hover:text-white transition-colors flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>দেখুন</span>
                </a>

                <button
                  onClick={() => handleDelete(m.id, m.titleBn)}
                  className="p-1.5 rounded-lg text-danger hover:bg-danger-soft"
                  title="মুছে ফেলুন"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-sand shadow-sakinah-lift space-y-4">
            <div className="flex items-center justify-between border-b border-sand pb-3">
              <h2 className="font-serif font-bold text-xl text-ink">মৌজা নকশা আপলোড</h2>
              <button onClick={() => setModalOpen(false)} className="p-2 rounded-full hover:bg-canvas-alt text-ink-muted">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <BilingualInput
                label="নকশার শিরোনাম"
                required={true}
                valueBn={formData.titleBn}
                valueEn={formData.titleEn}
                onChangeBn={(val) => setFormData({ ...formData, titleBn: val })}
                onChangeEn={(val) => setFormData({ ...formData, titleEn: val })}
                placeholderBn="যেমন: আরএস জরিপের মানিকপুর মৌজা নকশা"
                placeholderEn="e.g. Manikpur Mouza Map of RS Survey"
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-ink mb-1">জরিপের ধরন</label>
                  <select
                    value={formData.surveyType}
                    onChange={(e) => setFormData({ ...formData, surveyType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-canvas border border-sand text-ink font-bold focus:outline-none focus:border-primary"
                  >
                    <option value="CS">সিএস (CS)</option>
                    <option value="SA">এসএ (SA)</option>
                    <option value="RS">আরএস (RS)</option>
                    <option value="BS">বিএস / সিটি (BS)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-ink mb-1">দাগ ও খতিয়ান নম্বর</label>
                  <input
                    type="text"
                    value={formData.dagKhatianInfo}
                    onChange={(e) => setFormData({ ...formData, dagKhatianInfo: e.target.value })}
                    placeholder="দাগ নং: ১২৪, খতিয়ান নং: ৪৫"
                    className="w-full px-3 py-2 rounded-xl bg-canvas border border-sand text-ink placeholder:text-ink-muted focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <BilingualInput
                label="নকশার বিবরণ (ঐচ্ছিক)"
                isTextArea={true}
                rows={2}
                valueBn={formData.descriptionBn}
                valueEn={formData.descriptionEn}
                onChangeBn={(val) => setFormData({ ...formData, descriptionBn: val })}
                onChangeEn={(val) => setFormData({ ...formData, descriptionEn: val })}
                placeholderBn="নকশার অতিরিক্ত বিবরণ বা নোট..."
                placeholderEn="Additional description or notes for this map..."
              />

              <div>
                <label className="block font-bold text-ink mb-1">নকশার ফাইল (ছবি বা স্ক্যান কপি) *</label>
                <input
                  type="file"
                  required
                  accept="image/*,.pdf"
                  onChange={(e) => setMapFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-ink-muted file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-hover"
                />
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

