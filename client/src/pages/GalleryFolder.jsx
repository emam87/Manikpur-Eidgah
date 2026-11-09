import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, ArrowRight, Download, Eye, X, ChevronLeft, 
  ChevronRight, ZoomIn, ZoomOut, RotateCcw, Calendar, 
  Folder, Camera, Sparkles, Layers 
} from 'lucide-react';
import { SEO } from '../components/common/SEO.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { EightPointStar, StarDivider } from '../components/common/EightPointStar.jsx';

export function GalleryFolder() {
  const { slug } = useParams();
  const { locale, t, toBanglaNum, getLocalized } = useLanguage();
  const { getSetting } = useSettings();

  const [album, setAlbum] = useState(null);
  const [navigation, setNavigation] = useState({ prev: null, next: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Lightbox state
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [touchStart, setTouchStart] = useState(null);

  const allowDownload = getSetting('allow_photo_download', 'bn', '1') === '1';

  useEffect(() => {
    fetchAlbum();
    window.scrollTo(0, 0);
  }, [slug]);

  const fetchAlbum = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/public/albums/${slug}`);
      if (!res.ok) throw new Error('Album not found');
      const data = await res.json();
      if (data.success) {
        setAlbum(data.album);
        setNavigation(data.navigation || { prev: null, next: null });
      } else {
        throw new Error(data.error || 'Failed to load album');
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (lightboxIndex === null || !album?.photos) return;
      if (e.key === 'ArrowRight') {
        handleNextPhoto();
      } else if (e.key === 'ArrowLeft') {
        handlePrevPhoto();
      } else if (e.key === 'Escape') {
        closeLightbox();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, album]);

  const openLightbox = (index) => {
    setLightboxIndex(index);
    setZoomLevel(1);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
    setZoomLevel(1);
    document.body.style.overflow = '';
  };

  const handleNextPhoto = () => {
    if (!album?.photos || lightboxIndex === null) return;
    setLightboxIndex((idx) => (idx + 1) % album.photos.length);
    setZoomLevel(1);
  };

  const handlePrevPhoto = () => {
    if (!album?.photos || lightboxIndex === null) return;
    setLightboxIndex((idx) => (idx - 1 + album.photos.length) % album.photos.length);
    setZoomLevel(1);
  };

  // Mobile swipe handlers for lightbox
  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    // Minimum swipe threshold 50px
    if (diff > 50) {
      handleNextPhoto();
    } else if (diff < -50) {
      handlePrevPhoto();
    }
    setTouchStart(null);
  };

  if (loading) {
    return (
      <div className="py-16 max-w-7xl mx-auto px-4 space-y-8">
        <div className="h-6 w-32 bg-stone-200 rounded animate-pulse" />
        <div className="h-10 w-96 bg-stone-200 rounded animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="aspect-square bg-stone-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !album) {
    return (
      <div className="py-20 max-w-2xl mx-auto px-4 text-center space-y-4">
        <SEO title="ফোল্ডার পাওয়া যায়নি" />
        <Folder className="w-12 h-12 text-gold-500 mx-auto" />
        <h1 className="font-serif text-2xl font-bold text-stone-900">
          {locale === 'bn' ? 'ফটো ফোল্ডারটি খুঁজে পাওয়া যায়নি' : 'Album Not Found'}
        </h1>
        <p className="text-stone-600 text-sm">
          {locale === 'bn' ? 'অনুরোধকৃত অ্যালবামটি সরানো হয়েছে অথবা বিদ্যমান নেই।' : 'The requested photo album may have been removed or does not exist.'}
        </p>
        <Link
          to="/gallery"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-900 text-gold-200 text-sm font-semibold hover:bg-emerald-800 transition-colors mt-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{locale === 'bn' ? 'সকল ফোল্ডারে ফিরে যান' : 'Back to All Albums'}</span>
        </Link>
      </div>
    );
  }

  const photos = album.photos || [];
  const activePhoto = lightboxIndex !== null ? photos[lightboxIndex] : null;

  return (
    <div className="py-10 sm:py-16">
      <SEO 
        title={`${getLocalized(album, 'title')} (${toBanglaNum(album.year)})`}
        description={getLocalized(album, 'description') || `${album.titleBn} - মানিকপুর কেন্দ্রীয় শাহী ঈদগাহ আলোকচিত্র প্রদর্শনী`}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
        {/* Breadcrumb & Back Navigation */}
        <div className="flex items-center justify-between gap-4">
          <Link
            to="/gallery"
            className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-900 hover:text-gold-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{locale === 'bn' ? 'সব ফোল্ডার' : 'All Albums'}</span>
          </Link>

          <span className="text-xs text-stone-400 font-mono">
            {photos.length} {locale === 'bn' ? 'টি ছবি সংরক্ষিত' : 'photos recorded'}
          </span>
        </div>

        {/* Folder Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gold-500/30 shadow-md space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-950 text-gold-300 font-bold text-xs border border-gold-500/40">
              {album.type === 'FITR' ? (locale === 'bn' ? 'ঈদুল ফিতর' : 'Eid-ul-Fitr') : album.type === 'ADHA' ? (locale === 'bn' ? 'ঈদুল আযহা' : 'Eid-ul-Adha') : (locale === 'bn' ? 'বিশেষ জামাত' : 'Special Jamat')}
            </span>
            <span className="px-3 py-1 rounded-full bg-gold-500/20 text-gold-800 font-mono text-xs font-bold border border-gold-500/40">
              {toBanglaNum(album.year)} {locale === 'bn' ? 'সাল' : ''}
            </span>
            {album.eventDate && (
              <span className="text-xs text-stone-500 flex items-center gap-1 font-medium ml-1">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                {new Date(album.eventDate).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            )}
          </div>

          <h1 className="font-serif text-2xl sm:text-4xl font-extrabold text-stone-900 tracking-tight leading-snug">
            {getLocalized(album, 'title')}
          </h1>

          {album.descriptionBn && (
            <p className="text-stone-600 text-sm sm:text-base leading-relaxed max-w-4xl whitespace-pre-line">
              {getLocalized(album, 'description')}
            </p>
          )}
        </div>

        {/* Photos Masonry / Grid */}
        {photos.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-stone-200 space-y-4">
            <Camera className="w-12 h-12 text-stone-300 mx-auto" />
            <h3 className="font-serif text-xl font-bold text-stone-800">
              {locale === 'bn' ? 'এই ফোল্ডারে এখনো কোনো ছবি নেই' : 'No Photos in this Album Yet'}
            </h3>
            <p className="text-stone-500 text-sm max-w-md mx-auto">
              {locale === 'bn' ? 'শীঘ্রই নতুন আলোকচিত্র যোগ করা হবে।' : 'High-resolution photographs will be uploaded shortly.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                onClick={() => openLightbox(index)}
                className="group relative cursor-pointer aspect-square rounded-2xl overflow-hidden bg-stone-900 border border-gold-500/30 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <img
                  src={photo.thumbPath || photo.path}
                  alt={getLocalized(photo, 'caption') || `${album.titleBn} photo ${index + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />

                {/* Hover overlay with zoom icon */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3">
                  <div className="self-end p-2 rounded-full bg-black/60 text-gold-300 backdrop-blur-md">
                    <Eye className="w-4 h-4" />
                  </div>
                  {photo.captionBn && (
                    <p className="text-xs text-white font-medium line-clamp-2 leading-tight">
                      {getLocalized(photo, 'caption')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Next / Previous Folder Navigation */}
        <div className="pt-8 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          {navigation.prev ? (
            <Link
              to={`/gallery/${navigation.prev.slug}`}
              className="w-full sm:w-auto p-4 rounded-2xl bg-white border border-stone-200 hover:border-gold-500/40 hover:shadow-md transition-all flex items-center gap-3 group text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 group-hover:bg-emerald-900 group-hover:text-gold-300 transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-stone-400 block font-medium uppercase">
                  {locale === 'bn' ? 'পূর্ববর্তী ফোল্ডার' : 'Previous Album'}
                </span>
                <span className="font-serif font-bold text-sm text-stone-900 group-hover:text-emerald-900 transition-colors">
                  {getLocalized(navigation.prev, 'title')} ({toBanglaNum(navigation.prev.year)})
                </span>
              </div>
            </Link>
          ) : <div className="hidden sm:block" />}

          {navigation.next && (
            <Link
              to={`/gallery/${navigation.next.slug}`}
              className="w-full sm:w-auto p-4 rounded-2xl bg-white border border-stone-200 hover:border-gold-500/40 hover:shadow-md transition-all flex items-center gap-3 group text-right justify-end"
            >
              <div>
                <span className="text-[11px] text-stone-400 block font-medium uppercase">
                  {locale === 'bn' ? 'পরবর্তী ফোল্ডার' : 'Next Album'}
                </span>
                <span className="font-serif font-bold text-sm text-stone-900 group-hover:text-emerald-900 transition-colors">
                  {getLocalized(navigation.next, 'title')} ({toBanglaNum(navigation.next.year)})
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 group-hover:bg-emerald-900 group-hover:text-gold-300 transition-colors">
                <ChevronRight className="w-5 h-5" />
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* FULL INTERACTIVE LIGHTBOX */}
      {lightboxIndex !== null && activePhoto && (
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between select-none animate-fade-in"
        >
          {/* Top Bar: Counter, Controls, Close */}
          <div className="p-4 sm:p-5 flex items-center justify-between text-white z-10 bg-gradient-to-b from-black/80 to-transparent">
            {/* Counter */}
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs sm:text-sm text-gold-300 font-bold px-3 py-1 rounded-full bg-white/10 backdrop-blur-md">
                {toBanglaNum(lightboxIndex + 1)} / {toBanglaNum(photos.length)}
              </span>
              <span className="font-serif text-xs sm:text-sm text-white/80 hidden sm:inline truncate max-w-md">
                {getLocalized(album, 'title')}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={() => setZoomLevel((z) => Math.min(3, +(z + 0.3).toFixed(1)))}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.7, +(z - 0.3).toFixed(1)))}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoomLevel(1)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
                title="Reset Zoom"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {allowDownload && activePhoto.path && (
                <a
                  href={activePhoto.path}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-gold-500 text-stone-950 font-bold hover:bg-gold-400 transition-colors flex items-center gap-1.5 min-h-[40px]"
                  title="ডাউনলোড"
                >
                  <Download className="w-4 h-4" />
                  <span className="text-xs hidden sm:inline">{locale === 'bn' ? 'ডাউনলোড' : 'Download'}</span>
                </a>
              )}

              <button
                onClick={closeLightbox}
                className="p-2 rounded-xl bg-white/20 hover:bg-red-600/80 text-white transition-colors ml-1 min-w-[44px] min-h-[44px] flex items-center justify-center tap-target"
                title="বন্ধ করুন (Esc)"
                aria-label="Close lightbox"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Center Stage: Photo + Prev/Next Arrow Buttons */}
          <div className="relative flex-1 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
            {/* Prev Arrow Button (Desktop + Mobile touch target) */}
            <button
              onClick={handlePrevPhoto}
              className="absolute left-2 sm:left-4 z-20 p-2.5 sm:p-3 rounded-full bg-black/60 hover:bg-gold-500 hover:text-stone-950 text-white backdrop-blur-md transition-all flex items-center justify-center min-w-[44px] min-h-[44px]"
              title="পূর্ববর্তী (বাম তীর)"
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {/* Active Photo with Zoom Transform */}
            <div
              className="max-w-full max-h-[75vh] flex items-center justify-center transition-transform duration-200 ease-out"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              <img
                src={activePhoto.path}
                alt={getLocalized(activePhoto, 'caption') || ''}
                className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-2xl pointer-events-auto"
              />
            </div>

            {/* Next Arrow Button (Desktop + Mobile touch target) */}
            <button
              onClick={handleNextPhoto}
              className="absolute right-2 sm:right-4 z-20 p-2.5 sm:p-3 rounded-full bg-black/60 hover:bg-gold-500 hover:text-stone-950 text-white backdrop-blur-md transition-all flex items-center justify-center min-w-[44px] min-h-[44px]"
              title="পরবর্তী (ডান তীর)"
              aria-label="Next photo"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Bottom Bar: Caption & Thumbnail Strip */}
          <div className="p-4 bg-gradient-to-t from-black/90 via-black/70 to-transparent z-10 space-y-3">
            {/* Photo Caption */}
            {activePhoto.captionBn && (
              <p className="text-center text-xs sm:text-sm text-stone-200 max-w-2xl mx-auto font-medium">
                {getLocalized(activePhoto, 'caption')}
              </p>
            )}

            {/* Thumbnail Strip */}
            <div className="flex items-center justify-center gap-2 overflow-x-auto py-1 scrollbar-none max-w-4xl mx-auto">
              {photos.map((p, idx) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setLightboxIndex(idx);
                    setZoomLevel(1);
                  }}
                  className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                    idx === lightboxIndex
                      ? 'border-gold-400 scale-105 shadow-lg ring-2 ring-gold-400/50'
                      : 'border-white/30 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={p.thumbPath || p.path}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

