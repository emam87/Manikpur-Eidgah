import React, { useState, useEffect } from 'react';
import { 
  Images, Plus, Edit, Trash2, Camera, Star, ArrowLeft, 
  Upload, X, Check, Calendar, Folder, Eye, Layers, Sparkles 
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.jsx';

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
    type: 'FITR',
    year: new Date().getFullYear(),
    descriptionBn: '',
  });

  // Photo Upload State
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

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
    if (!albumForm.titleBn.trim()) return;

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
    if (!window.confirm(`আপনি কি নিশ্চিত যে অ্যালবাম '${title}' ট্র্যাশে পাঠাতে চান?`)) return;

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
    if (!window.confirm('আপনি কি এই ছবিটি ট্র্যাশে পাঠাতে চান?')) return;
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gold-500/30 shadow-sm">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedAlbum(null)}
                className="p-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 transition-colors"
                title="সকল অ্যালবামে ফিরে যান"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold mb-1 inline-block">
                  {selectedAlbum.type === 'FITR' ? 'ঈদুল ফিতর' : selectedAlbum.type === 'ADHA' ? 'ঈদুল আযহা' : 'বিশেষ জামাত'} ({toBanglaNum(selectedAlbum.year)})
                </span>
                <h1 className="font-serif text-2xl font-bold text-stone-900">
                  {selectedAlbum.titleBn}
                </h1>
                <p className="text-xs text-stone-500 mt-0.5">
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
                className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-stone-200"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>তথ্য সম্পাদনা</span>
              </button>
            </div>
          </div>

          {/* Bulk Photo Upload Box */}
          <div className="bg-white rounded-3xl p-6 border-2 border-dashed border-gold-500/40 shadow-sm space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto border border-emerald-200">
              <Upload className="w-6 h-6 text-emerald-800" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-stone-900">
                একসাথে একাধিক ছবি আপলোড করুন
              </h3>
              <p className="text-xs text-stone-500">
                স্বয়ংক্রিয়ভাবে ওয়েবপি (WebP) ফরম্যাট ও থাম্বনেইল তৈরি এবং মেটাডাটা অপ্টিমাইজ হবে।
              </p>
            </div>

            <form onSubmit={handleBulkPhotoUpload} className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))}
                className="text-xs text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-950 file:text-gold-200"
              />
              <button
                type="submit"
                disabled={uploadingPhotos || !selectedFiles.length}
                className="px-5 py-2 rounded-xl bg-gold-500 text-stone-950 text-xs font-bold hover:bg-gold-400 transition-colors shadow-md disabled:opacity-40"
              >
                {uploadingPhotos ? 'আপলোড হচ্ছে...' : `আপলোড নিশ্চিত করুন (${selectedFiles.length} টি)`}
              </button>
            </form>
          </div>

          {/* Photos Grid */}
          <div className="bg-white rounded-3xl p-6 border border-gold-500/30 shadow-sm space-y-4">
            <h2 className="font-serif font-bold text-lg text-stone-900">
              অ্যালবামের ছবিসমূহ
            </h2>

            {selectedAlbum.photos?.length === 0 ? (
              <p className="text-center text-xs text-stone-400 py-12">
                এই অ্যালবামে এখনো কোনো ছবি নেই। উপরে ফাইল নির্বাচন করে আপলোড করুন।
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {selectedAlbum.photos.map((photo) => {
                  const isCover = selectedAlbum.coverPhotoId === photo.id;
                  return (
                    <div
                      key={photo.id}
                      className="group relative rounded-2xl overflow-hidden aspect-square bg-stone-900 border border-stone-200 shadow-sm"
                    >
                      <img
                        src={photo.thumbPath || photo.path}
                        alt=""
                        className="w-full h-full object-cover"
                      />

                      {/* Cover Badge */}
                      {isCover && (
                        <div className="absolute top-2 left-2 bg-gold-500 text-stone-950 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 shadow-md">
                          <Star className="w-3 h-3 fill-current" />
                          <span>কভার ছবি</span>
                        </div>
                      )}

                      {/* Hover Actions Overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                        <div className="flex justify-end">
                          <button
                            onClick={() => handleDeletePhoto(photo.id)}
                            className="p-1.5 rounded-lg bg-red-600/90 text-white hover:bg-red-700"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {!isCover && (
                          <button
                            onClick={() => handleSetCoverPhoto(photo.id)}
                            className="w-full py-1 rounded-lg bg-emerald-900/90 hover:bg-emerald-800 text-gold-200 text-[10px] font-bold transition-colors"
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gold-500/30 shadow-sm">
            <div>
              <h1 className="font-serif text-2xl font-bold text-stone-900 flex items-center gap-2">
                <Images className="w-6 h-6 text-emerald-800" />
                <span>ফটো গ্যালারি ও অ্যালবাম ব্যবস্থাপনা</span>
              </h1>
              <p className="text-xs text-stone-500 mt-1">
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
                  type: 'FITR',
                  year: new Date().getFullYear(),
                  descriptionBn: '',
                });
                setAlbumModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-emerald-950 text-gold-200 text-xs font-bold hover:bg-emerald-900 transition-colors flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-4 h-4 text-gold-400" />
              <span>নতুন অ্যালবাম তৈরি</span>
            </button>
          </div>

          {/* Albums Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {albums.map((a) => {
              const coverImg = a.coverPhoto?.thumbPath || a.coverPhoto?.path || '/defaults/eidgah-hero.svg';
              const photoCount = a._count?.photos || 0;

              return (
                <div
                  key={a.id}
                  className="bg-white rounded-3xl overflow-hidden border border-gold-500/30 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group"
                >
                  <div className="relative aspect-[4/3] bg-stone-900 overflow-hidden">
                    <img src={coverImg} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-sm text-gold-300 font-mono text-[10px] font-bold">
                      {toBanglaNum(a.year)}
                    </div>
                    <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-sm text-white text-[11px] font-medium flex items-center gap-1">
                      <Camera className="w-3.5 h-3.5 text-gold-400" />
                      <span>{toBanglaNum(photoCount)} টি ছবি</span>
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <div>
                      <h3 className="font-serif font-bold text-base text-stone-900 group-hover:text-emerald-900 transition-colors line-clamp-1">
                        {a.titleBn}
                      </h3>
                      <p className="text-xs text-stone-500 mt-0.5">
                        {a.type === 'FITR' ? 'ঈদুল ফিতর' : a.type === 'ADHA' ? 'ঈদুল আযহা' : 'বিশেষ জামাত'}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                      <button
                        onClick={() => openAlbumDetails(a.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-950 text-gold-200 text-xs font-semibold hover:bg-emerald-900 transition-colors"
                      >
                        ছবি পরিচালনা &rarr;
                      </button>

                      <button
                        onClick={() => handleDeleteAlbum(a.id, a.titleBn)}
                        className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-gold-500/40 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h2 className="font-serif font-bold text-xl text-stone-900">
                {editAlbum ? 'অ্যালবাম সম্পাদনা' : 'নতুন ফটো অ্যালবাম'}
              </h2>
              <button onClick={() => setAlbumModalOpen(false)} className="p-2 rounded-full hover:bg-stone-100 text-stone-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAlbum} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">অ্যালবাম শিরোনাম (বাংলা) *</label>
                <input
                  type="text"
                  required
                  value={albumForm.titleBn}
                  onChange={(e) => setAlbumForm({ ...albumForm, titleBn: e.target.value })}
                  placeholder="যেমন: পবিত্র ঈদুল ফিতর জামাত ২০২৪"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">জামাতের ধরন</label>
                  <select
                    value={albumForm.type}
                    onChange={(e) => setAlbumForm({ ...albumForm, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-medium"
                  >
                    <option value="FITR">ঈদুল ফিতর</option>
                    <option value="ADHA">ঈদুল আযহা</option>
                    <option value="OTHER">বিশেষ / ঐতিহাসিক জামাত</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">বছর (Year) *</label>
                  <input
                    type="number"
                    required
                    value={albumForm.year}
                    onChange={(e) => setAlbumForm({ ...albumForm, year: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">বিবরণ (ঐচ্ছিক)</label>
                <textarea
                  rows={3}
                  value={albumForm.descriptionBn}
                  onChange={(e) => setAlbumForm({ ...albumForm, descriptionBn: e.target.value })}
                  placeholder="ঐতিহাসিক জামাত ও আবহাওয়া সম্পর্কিত সংক্ষিপ্ত বিবরণ..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-300"
                />
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAlbumModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-stone-700 font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-emerald-950 text-gold-200 font-bold shadow-md"
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
