import React, { useState, useEffect } from 'react';
import { 
  Images, Plus, Edit, Trash2, Camera, Star, ArrowLeft, 
  Upload, X, Check, Calendar, Folder, Eye, Layers, Sparkles 
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { BilingualInput } from '../components/BilingualInput.jsx';
import { getImageUrl } from '../../utils/imageUrl.js';

export function AdminGallery() {
  const { toBanglaNum } = useLanguage();

  const [albums, setAlbums] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal State for Album Create/Edit
  const [albumModalOpen, setAlbumModalOpen] = useState(false);
  const [editAlbum, setEditAlbum] = useState(null);
  const [albumForm, setAlbumForm] = useState({
    titleBn: '',
    titleEn: '',
    occasionNameBn: '',
    occasionNameEn: '',
    type: 'FITR',
    year: new Date().getFullYear(),
    descriptionBn: '',
    descriptionEn: '',
  });

  // Photo Upload State
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  // Lock body scroll when album modal is open
  useEffect(() => {
    if (albumModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [albumModalOpen]);

  useEffect(() => {
    fetchAlbums();
  }, []);

  const fetchAlbums = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/albums');
      const data = await res.json();
      if (data.success) {
        setAlbums(data.albums || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openAlbumDetails = async (albumId) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/albums/${albumId}`);
      const data = await res.json();
      if (data.success) {
        setSelectedAlbum(data.album);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAlbum = async (e) => {
    e.preventDefault();
    if (!albumForm.titleBn.trim() || !albumForm.titleEn.trim()) {
      alert('অ্যালবাম শিরোনাম বাংলা এবং ইংরেজি উভয় ভাষাতেই পূরণ আবশ্যক।');
      return;
    }

    try {
      const url = editAlbum ? `/api/admin/albums/${editAlbum.id}` : '/api/admin/albums';
      const method = editAlbum ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(albumForm),
      });
      const data = await res.json();

      if (data.success) {
        setAlbumModalOpen(false);
        fetchAlbums();
        if (selectedAlbum && editAlbum?.id === selectedAlbum.id) {
          openAlbumDetails(selectedAlbum.id);
        }
      } else {
        alert(data.error || 'অ্যালবাম সংরক্ষণ ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      alert('সার্ভারে সমস্যা হয়েছে।');
    }
  };

  const handleDeleteAlbum = async (id, title) => {
    if (!window.confirm(`আপনি কি নিশ্চিত যে অ্যালবাম '${title}' ও এর ছবিগুলো ডাটাবেজ থেকে স্থায়ীভাবে মুছে ফেলতে চান?`)) return;

    try {
      const res = await fetch(`/api/admin/albums/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setSelectedAlbum(null);
        fetchAlbums();
      } else {
        alert(data.error || 'মুছে ফেলতে সমস্যা হয়েছে।');
      }
    } catch (err) {
      alert('সার্ভারে সমস্যা হয়েছে।');
    }
  };

  const handleBulkPhotoUpload = async (e) => {
    e.preventDefault();
    if (!selectedFiles.length || !selectedAlbum) return;

    setUploadingPhotos(true);
    try {
      const formData = new FormData();
      for (const file of selectedFiles) {
        formData.append('photos', file);
      }

      const res = await fetch(`/api/admin/albums/${selectedAlbum.id}/photos`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        setSelectedFiles([]);
        openAlbumDetails(selectedAlbum.id);
        fetchAlbums();
      } else {
        alert(data.error || 'ছবি আপলোড ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      alert('আপলোড প্রক্রিয়া ব্যর্থ হয়েছে।');
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handleSetCoverPhoto = async (photoId) => {
    if (!selectedAlbum) return;
    try {
      const res = await fetch(`/api/admin/albums/${selectedAlbum.id}/cover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId }),
      });
      const data = await res.json();
      if (data.success) {
        openAlbumDetails(selectedAlbum.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePhoto = async (photoId) => {
    if (!window.confirm('আপনি কি এই ছবিটি ডাটাবেজ থেকে স্থায়ীভাবে মুছে ফেলতে চান?')) return;
    try {
      const res = await fetch(`/api/admin/photos/${photoId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success && selectedAlbum) {
        openAlbumDetails(selectedAlbum.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* If inside an album photo view */}
      {selectedAlbum ? (
        <div className="space-y-6">
          {/* Album Title Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-surface p-6 rounded-3xl border border-sand shadow-sakinah-sm">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedAlbum(null)}
                className="p-2.5 rounded-xl border border-sand hover:bg-canvas-alt text-ink transition-colors"
                title="সকল অ্যালবামে ফিরে যান"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary-soft text-primary-dark font-bold mb-1 inline-block">
                  {selectedAlbum.type === 'FITR' ? 'ঈদুল ফিতর' : selectedAlbum.type === 'ADHA' ? 'ঈদুল আযহা' : 'বিশেষ জামাত'} ({toBanglaNum(selectedAlbum.year)})
                </span>
                <h1 className="font-serif text-2xl font-bold text-ink">
                  {selectedAlbum.titleBn}
                </h1>
                <p className="text-xs text-ink-muted mt-0.5">
                  মোট ছবি: {toBanglaNum(selectedAlbum.photos?.length || 0)} টি
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setEditAlbum(selectedAlbum);
                  setAlbumForm({
                    titleBn: selectedAlbum.titleBn,
                    titleEn: selectedAlbum.titleEn || '',
                    occasionNameBn: selectedAlbum.occasionNameBn || '',
                    type: selectedAlbum.type || 'FITR',
                    year: selectedAlbum.year || new Date().getFullYear(),
                    descriptionBn: selectedAlbum.descriptionBn || '',
                  });
                  setAlbumModalOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-canvas hover:bg-canvas-alt text-ink text-xs font-semibold flex items-center gap-1.5 transition-colors border border-sand"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>তথ্য সম্পাদনা</span>
              </button>
            </div>
          </div>

          {/* Bulk Photo Upload Box */}
          <div className="bg-surface rounded-3xl p-6 border-2 border-dashed border-gold/40 shadow-sakinah-sm space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-primary-soft text-primary-dark flex items-center justify-center mx-auto border border-primary/25">
              <Upload className="w-6 h-6 text-primary-dark" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-ink">
                একসাথে একাধিক ছবি আপলোড করুন
              </h3>
              <p className="text-xs text-ink-muted">
                স্বয়ংক্রিয়ভাবে ওয়েবপি (WebP) ফরম্যাট ও থাম্বনেইল তৈরি এবং মেটাডাটা অপ্টিমাইজ হবে।
              </p>
            </div>

            <form onSubmit={handleBulkPhotoUpload} className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))}
                className="text-xs text-ink-muted file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-hover"
              />
              <button
                type="submit"
                disabled={uploadingPhotos || !selectedFiles.length}
                className="px-5 py-2 rounded-xl bg-gold-plate text-ink text-xs font-bold hover:shadow-gold-glow transition-all shadow-sakinah-sm disabled:opacity-40"
              >
                {uploadingPhotos ? 'আপলোড হচ্ছে...' : `আপলোড নিশ্চিত করুন (${selectedFiles.length} টি)`}
              </button>
            </form>
          </div>

          {/* Photos Grid */}
          <div className="bg-surface rounded-3xl p-6 border border-sand shadow-sakinah-sm space-y-4">
            <h2 className="font-serif font-bold text-lg text-ink">
              অ্যালবামের ছবিসমূহ
            </h2>

            {selectedAlbum.photos?.length === 0 ? (
              <p className="text-center text-xs text-ink-muted py-12">
                এই অ্যালবামে এখনো কোনো ছবি নেই। উপরে ফাইল নির্বাচন করে আপলোড করুন।
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {selectedAlbum.photos.map((photo) => {
                  const isCover = selectedAlbum.coverPhotoId === photo.id;
                  return (
                    <div
                      key={photo.id}
                      className="group relative rounded-2xl overflow-hidden aspect-square bg-canvas-alt border border-sand shadow-sakinah-sm"
                    >
                      <img
                        src={getImageUrl(photo.thumbPath || photo.path)}
                        alt=""
                        className="w-full h-full object-cover"
                      />

                      {/* Cover Badge */}
                      {isCover && (
                        <div className="absolute top-2 left-2 bg-gold-plate text-ink px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 shadow-sakinah-sm">
                          <Star className="w-3 h-3 fill-current" />
                          <span>কভার ছবি</span>
                        </div>
                      )}

                      {/* Hover Actions Overlay */}
                      <div className="absolute inset-0 bg-scrim/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                        <div className="flex justify-end">
                          <button
                            onClick={() => handleDeletePhoto(photo.id)}
                            className="p-1.5 rounded-lg bg-danger/90 text-white hover:bg-danger"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {!isCover && (
                          <button
                            onClick={() => handleSetCoverPhoto(photo.id)}
                            className="w-full py-1 rounded-lg bg-primary/95 hover:bg-primary text-white text-[10px] font-bold transition-colors"
                          >
                            কভার ছবি করুন
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Albums List View */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-surface p-6 rounded-3xl border border-sand shadow-sakinah-sm">
            <div>
              <h1 className="font-serif text-2xl font-bold text-ink flex items-center gap-2">
                <Images className="w-6 h-6 text-primary-dark" />
                <span>ফটো গ্যালারি ও অ্যালবাম ব্যবস্থাপনা</span>
              </h1>
              <p className="text-xs text-ink-muted mt-1">
                মোট অ্যালবাম: {toBanglaNum(albums.length)} টি | ফোল্ডার নির্বাচন করে ছবি যোগ ও সম্পাদনা করুন
              </p>
            </div>

            <button
              onClick={() => {
                setEditAlbum(null);
                setAlbumForm({
                  titleBn: '',
                  titleEn: '',
                  occasionNameBn: '',
                  occasionNameEn: '',
                  type: 'FITR',
                  year: new Date().getFullYear(),
                  descriptionBn: '',
                  descriptionEn: '',
                });
                setAlbumModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-colors flex items-center gap-1.5 shadow-sakinah-sm"
            >
              <Plus className="w-4 h-4 text-gold" />
              <span>নতুন অ্যালবাম তৈরি</span>
            </button>
          </div>

          {/* Albums Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {albums.map((a) => {
              const coverImg = getImageUrl(
                a.coverPhoto?.thumbPath || a.coverPhoto?.path,
                '/defaults/eidgah-hero.webp'
              );
              const photoCount = a._count?.photos || 0;

              return (
                <div
                  key={a.id}
                  className="bg-surface rounded-3xl overflow-hidden border border-sand shadow-sakinah-sm hover:shadow-sakinah-lift transition-all flex flex-col justify-between group"
                >
                  <div className="relative aspect-[4/3] bg-canvas-alt overflow-hidden">
                    <img src={coverImg} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-scrim/75 backdrop-blur-sm text-gold font-mono text-[10px] font-bold">
                      {toBanglaNum(a.year)}
                    </div>
                    <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-scrim/75 backdrop-blur-sm text-white text-[11px] font-medium flex items-center gap-1">
                      <Camera className="w-3.5 h-3.5 text-gold" />
                      <span>{toBanglaNum(photoCount)} টি ছবি</span>
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <div>
                      <h3 className="font-serif font-bold text-base text-ink group-hover:text-primary-dark transition-colors line-clamp-1">
                        {a.titleBn}
                      </h3>
                      <p className="text-xs text-ink-muted mt-0.5">
                        {a.type === 'FITR' ? 'ঈদুল ফিতর' : a.type === 'ADHA' ? 'ঈদুল আযহা' : 'বিশেষ জামাত'}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-sand flex items-center justify-between">
                      <button
                        onClick={() => openAlbumDetails(a.id)}
                        className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-colors"
                      >
                        ছবি পরিচালনা &rarr;
                      </button>

                      <button
                        onClick={() => handleDeleteAlbum(a.id, a.titleBn)}
                        className="p-1.5 rounded-lg text-danger hover:bg-danger-soft transition-colors"
                        title="অ্যালবাম মুছুন"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Album Modal */}
      {albumModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-sand shadow-sakinah-lift space-y-4">
            <div className="flex items-center justify-between border-b border-sand pb-3">
              <h2 className="font-serif font-bold text-xl text-ink">
                {editAlbum ? 'অ্যালবাম সম্পাদনা' : 'নতুন ফটো অ্যালবাম'}
              </h2>
              <button onClick={() => setAlbumModalOpen(false)} className="p-2 rounded-full hover:bg-canvas-alt text-ink-muted">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAlbum} className="space-y-4 text-xs">
              <BilingualInput
                label="অ্যালবাম শিরোনাম"
                required={true}
                valueBn={albumForm.titleBn}
                valueEn={albumForm.titleEn}
                onChangeBn={(val) => setAlbumForm({ ...albumForm, titleBn: val })}
                onChangeEn={(val) => setAlbumForm({ ...albumForm, titleEn: val })}
                placeholderBn="যেমন: পবিত্র ঈদুল ফিতর জামাত ২০২৪"
                placeholderEn="e.g. Holy Eid-ul-Fitr Jamaat 2024"
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-ink mb-1">জামাতের ধরন</label>
                  <select
                    value={albumForm.type}
                    onChange={(e) => setAlbumForm({ ...albumForm, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-canvas border border-sand font-medium text-ink focus:outline-none focus:border-primary"
                  >
                    <option value="FITR">ঈদুল ফিতর</option>
                    <option value="ADHA">ঈদুল আযহা</option>
                    <option value="OTHER">বিশেষ / ঐতিহাসিক জামাত</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-ink mb-1">বছর (Year) *</label>
                  <input
                    type="number"
                    required
                    value={albumForm.year}
                    onChange={(e) => setAlbumForm({ ...albumForm, year: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 rounded-xl bg-canvas border border-sand font-mono text-ink focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <BilingualInput
                label="বিবরণ (ঐচ্ছিক)"
                isTextArea={true}
                rows={3}
                valueBn={albumForm.descriptionBn}
                valueEn={albumForm.descriptionEn}
                onChangeBn={(val) => setAlbumForm({ ...albumForm, descriptionBn: val })}
                onChangeEn={(val) => setAlbumForm({ ...albumForm, descriptionEn: val })}
                placeholderBn="ঐতিহাসিক জামাত ও আবহাওয়া সম্পর্কিত সংক্ষিপ্ত বিবরণ..."
                placeholderEn="Short description regarding the historic gathering, weather, etc..."
              />

              <div className="pt-3 border-t border-sand flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAlbumModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-sand text-ink-muted hover:bg-canvas-alt font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold shadow-sakinah-sm"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

