import React, { useState, useEffect } from 'react';
import { Compass, Video, Edit, Upload, Check, Eye, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { BilingualInput } from '../components/BilingualInput.jsx';
import { getImageUrl } from '../../utils/imageUrl.js';

export function AdminDesigns() {
  const { toBanglaNum } = useLanguage();

  const [designs, setDesigns] = useState([]);
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit Design Modal
  const [editDesign, setEditDesign] = useState(null);
  const [designCaptionBn, setDesignCaptionBn] = useState('');
  const [designCaptionEn, setDesignCaptionEn] = useState('');
  const [designFile, setDesignFile] = useState(null);
  const [savingDesign, setSavingDesign] = useState(false);

  // Video Form
  const [videoForm, setVideoForm] = useState({
    titleBn: '',
    titleEn: '',
    type: 'YOUTUBE',
    url: '',
    isPublished: true,
  });
  const [savingVideo, setSavingVideo] = useState(false);

  useEffect(() => {
    fetchDesigns();
  }, []);

  const fetchDesigns = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/designs');
      const data = await res.json();
      if (data.success) {
        setDesigns(data.designs || []);
        if (data.video) {
          setVideo(data.video);
          setVideoForm({
            titleBn: data.video.titleBn || '',
            titleEn: data.video.titleEn || '',
            type: data.video.type || 'YOUTUBE',
            url: data.video.url || '',
            isPublished: data.video.isPublished !== false,
          });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDesign = async (e) => {
    e.preventDefault();
    if (!editDesign) return;
    if (!designCaptionBn.trim() || !designCaptionEn.trim()) {
      alert('নকশার ক্যাপশন বাংলা এবং ইংরেজি উভয় ভাষাতেই পূরণ আবশ্যক।');
      return;
    }

    setSavingDesign(true);
    try {
      const data = new FormData();
      data.append('captionBn', designCaptionBn);
      data.append('captionEn', designCaptionEn);
      if (designFile) {
        data.append('photo', designFile);
      }

      const res = await fetch(`/api/admin/designs/${editDesign.id}`, {
        method: 'PUT',
        body: data,
      });
      const resData = await res.json();

      if (resData.success) {
        setEditDesign(null);
        fetchDesigns();
      } else {
        alert(resData.error || 'সংরক্ষণ ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      alert('সার্ভারে সমস্যা হয়েছে।');
    } finally {
      setSavingDesign(false);
    }
  };

  const handleSaveVideo = async (e) => {
    e.preventDefault();
    setSavingVideo(true);
    try {
      const res = await fetch('/api/admin/designs/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(videoForm),
      });
      const data = await res.json();
      if (data.success) {
        alert('৩ডি ভিডিও তথ্য সফলভাবে সংরক্ষিত হয়েছে!');
        fetchDesigns();
      } else {
        alert(data.error || 'ভিডিও সংরক্ষণ ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      alert('সার্ভারে সমস্যা হয়েছে।');
    } finally {
      setSavingVideo(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-surface p-6 rounded-3xl border border-sand shadow-sakinah-sm">
        <h1 className="font-serif text-2xl font-bold text-ink flex items-center gap-2">
          <Compass className="w-6 h-6 text-primary-dark" />
          <span>৩ডি স্থাপত্য নকশা ও মাস্টার প্ল্যান ব্যবস্থাপনা</span>
        </h1>
        <p className="text-xs text-ink-muted mt-1">
          প্রস্তাবিত ৩ডি স্থাপত্য রূপরেখার ৭টি মাস্টার ইমেজ এবং ভিডিও ওয়াকথ্রু
        </p>
      </div>

      {/* 3D Video Configuration Section */}
      <div className="bg-surface rounded-3xl p-6 sm:p-8 border border-sand shadow-sakinah-sm space-y-4">
        <div className="flex items-center gap-2.5 border-b border-sand pb-3">
          <Video className="w-5 h-5 text-primary-dark" />
          <h2 className="font-serif font-bold text-lg text-ink">
            ৩ডি ভিডিও ওয়াকথ্রু সেটিংস
          </h2>
        </div>

        <form onSubmit={handleSaveVideo} className="space-y-4 text-xs max-w-2xl">
          <BilingualInput
            label="ভিডিওর শিরোনাম"
            valueBn={videoForm.titleBn}
            valueEn={videoForm.titleEn}
            onChangeBn={(val) => setVideoForm({ ...videoForm, titleBn: val })}
            onChangeEn={(val) => setVideoForm({ ...videoForm, titleEn: val })}
            placeholderBn="যেমন: প্রস্তাবিত মানিকপুর ঈদগাহ ৩ডি ভার্চুয়াল ভ্রমণ"
            placeholderEn="e.g. Proposed Manikpur Eidgah 3D Virtual Tour"
          />

          <div>
            <label className="block font-bold text-ink mb-1">ভিডিও লিংক (YouTube / MP4)</label>
            <input
              type="url"
              value={videoForm.url}
              onChange={(e) => setVideoForm({ ...videoForm, url: e.target.value })}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-3 py-2 rounded-xl bg-canvas border border-sand font-mono text-ink placeholder:text-ink-muted focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-ink">
              <input
                type="checkbox"
                checked={videoForm.isPublished}
                onChange={(e) => setVideoForm({ ...videoForm, isPublished: e.target.checked })}
                className="rounded accent-primary"
              />
              <span>ওয়েবসাইটে ৩ডি ভিডিও সেকশনটি প্রদর্শন করুন</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={savingVideo}
            className="px-6 py-2 rounded-xl bg-primary text-white font-bold hover:bg-primary-hover transition-colors shadow-sakinah-sm disabled:opacity-50"
          >
            {savingVideo ? 'সংরক্ষণ হচ্ছে...' : 'ভিডিও তথ্য সংরক্ষণ করুন'}
          </button>
        </form>
      </div>

      {/* 7 Designs Cards */}
      <div className="space-y-4">
        <h2 className="font-serif font-bold text-lg text-ink">
          ৭টি প্রস্তাবিত স্থাপত্য নকশা (Master 3D Renders)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {designs.map((d, index) => (
            <div key={d.id} className="bg-surface rounded-3xl overflow-hidden border border-sand shadow-sakinah-sm flex flex-col justify-between">
              <div className="relative aspect-[16/10] bg-canvas-alt">
                <img src={getImageUrl(d.thumbPath || d.path)} alt="" className="w-full h-full object-cover" />
                <div className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-gold-plate text-ink font-mono font-bold text-xs shadow-sakinah-sm">
                  #{toBanglaNum(index + 1)}
                </div>
              </div>

              <div className="p-5 space-y-3">
                <h3 className="font-serif font-bold text-base text-ink">
                  {d.captionBn}
                </h3>

                <div className="pt-2 border-t border-sand flex items-center justify-between">
                  <button
                    onClick={() => {
                      setEditDesign(d);
                      setDesignCaptionBn(d.captionBn || '');
                      setDesignCaptionEn(d.captionEn || '');
                      setDesignFile(null);
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-colors flex items-center gap-1.5"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>ক্যাপশন / ছবি পরিবর্তন</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Design Modal */}
      {editDesign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface rounded-3xl max-w-md w-full p-6 border border-sand shadow-sakinah-lift space-y-4">
            <div className="flex items-center justify-between border-b border-sand pb-3">
              <h2 className="font-serif font-bold text-lg text-ink">নকশা সম্পাদনা</h2>
              <button onClick={() => setEditDesign(null)} className="p-2 rounded-full hover:bg-canvas-alt text-ink-muted">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDesign} className="space-y-4 text-xs">
              <BilingualInput
                label="ক্যাপশন"
                required={true}
                valueBn={designCaptionBn}
                valueEn={designCaptionEn}
                onChangeBn={(val) => setDesignCaptionBn(val)}
                onChangeEn={(val) => setDesignCaptionEn(val)}
                placeholderBn="যেমন: প্রস্তাবিত প্রধান মেহরাব ও গম্বুজ"
                placeholderEn="e.g. Proposed Main Mehrab & Dome"
              />

              <div>
                <label className="block font-bold text-ink mb-1">নতুন ছবি আপলোড (ঐচ্ছিক)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setDesignFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-ink-muted file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-hover"
                />
              </div>

              <div className="pt-3 border-t border-sand flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditDesign(null)}
                  className="px-4 py-2 rounded-xl border border-sand text-ink-muted hover:bg-canvas-alt font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={savingDesign}
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold shadow-sakinah-sm disabled:opacity-50"
                >
                  {savingDesign ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

