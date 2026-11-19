import React, { useState, useEffect } from 'react';
import { 
  Compass, Eye, Play, Sparkles, Layers, Video, 
  X, ZoomIn, ZoomOut, RotateCcw, Download, Info, Check, Share2
} from 'lucide-react';
import { SEO } from '../components/common/SEO.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { EightPointStar, StarDivider } from '../components/common/EightPointStar.jsx';
import { Breadcrumb } from '../components/common/Breadcrumb.jsx';
import { ImageWithBlur } from '../components/common/ImageWithBlur.jsx';
import { getImageUrl } from '../utils/imageUrl.js';

export function Designs() {
  const { locale, t, toBanglaNum, getLocalized } = useLanguage();

  const [designs, setDesigns] = useState([]);
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeLightboxIndex, setActiveLightboxIndex] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchStartY, setTouchStartY] = useState(null);

  // Default fallback design assets (seeded in public/designs)
  const fallbackDesigns = [
    {
      id: 1,
      path: '/designs/layout-plan.jpg',
      captionBn: 'মাস্টার লেআউট প্ল্যান',
      captionEn: 'Master Layout Plan',
      descriptionBn: 'ঈদগাহ ময়দান, মূল মিম্বর, সীমানা প্রাচীর ও অভ্যন্তরীণ বিন্যাসের পূর্ণাঙ্গ ২ডি/৩ডি স্থাপত্য নকশা।',
      descriptionEn: 'Architectural master plan outlining the mihrab, boundary, and perimeter layouts.',
    },
    {
      id: 2,
      path: '/designs/ground-top-view.jpg',
      captionBn: 'ঈদগাহ ময়দান টপ ভিউ',
      captionEn: 'Eidgah Ground Top View',
      descriptionBn: 'আকাশ থেকে ঈদগাহ ময়দানের সার্বিক কাতার বিন্যাস ও বিশাল মুসল্লি ধারণক্ষমতার প্রস্তাবিত ৩ডি রূপরেখা।',
      descriptionEn: 'Aerial 3D rendering highlighting rows alignment and congregation space.',
    },
    {
      id: 3,
      path: '/designs/mihrab-wall-front.jpg',
      captionBn: 'মিম্বর সম্মুখ দৃশ্য',
      captionEn: 'Mihrab Front View',
      descriptionBn: 'ঐতিহ্যবাহী ইসলামিক স্থাপত্যরীতি ও খিলান সমন্বয়ে সুদৃশ্য মিম্বর ও প্রধান দেওয়ালের সম্মুখ রূপ।',
      descriptionEn: 'Grand facade of the proposed Mihrab featuring traditional Islamic arch aesthetics.',
    },
    {
      id: 4,
      path: '/designs/mihrab-wall-closeup.jpg',
      captionBn: 'মিম্বর ক্লোজ-আপ',
      captionEn: 'Mihrab Closeup',
      descriptionBn: 'ইমাম সাহেবের খুতবা পাঠের স্থান, ক্যালিগ্রাফি ও কারুকার্যের নিখুঁত ৩ডি ক্লোজ-আপ প্রেজেন্টেশন।',
      descriptionEn: 'Detailed closeup render of the pulpit, calligraphy panels, and stone craftsmanship.',
    },
    {
      id: 5,
      path: '/designs/pond-aerial-view.jpg',
      captionBn: 'সংলগ্ন পুকুর ও ল্যান্ডস্কেপ',
      captionEn: 'Adjacent Pond Aerial View',
      descriptionBn: 'ঈদগাহের সৌন্দর্যবর্ধক সংলগ্ন পুকুর, সবুজ বৃক্ষরাজি ও উন্মুক্ত পরিবেশের মনোমুগ্ধকর রূপ।',
      descriptionEn: 'Scenic aerial view showcasing the integrated water body and green landscaping.',
    },
    {
      id: 6,
      path: '/designs/pond-side-view.jpg',
      captionBn: 'পুকুর ঘাট ও ওয়াকওয়ে',
      captionEn: 'Pond Ghat & Walkway',
      descriptionBn: 'পুকুরের বাঁধানো ঘাট, প্রশস্ত হাঁটার পথ এবং পরিচ্ছন্ন অযুখানা পরিকল্পনার প্রস্তাবিত দৃশ্য।',
      descriptionEn: 'Paved pond steps, promenade walkway, and ablution facility layout.',
    },
    {
      id: 7,
      path: '/designs/front-view.jpg',
      captionBn: 'মূল ফটক ও প্রবেশদ্বার',
      captionEn: 'Main Gate & Front View',
      descriptionBn: 'মানিকপুর সড়ক হতে ঈদগাহের রাজকীয় প্রধান ফটক ও দৃষ্টিনন্দন প্রবেশদ্বারের ত্রিমাত্রিক নকশা।',
      descriptionEn: 'Three-dimensional architectural perspective of the royal main gateway and boulevard.',
    },
  ];

  useEffect(() => {
    fetch('/api/public/designs')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch designs');
        return res.json();
      })
      .then((data) => {
        if (data && data.success && data.designs && data.designs.length > 0) {
          const normalized = data.designs.map((d) => ({
            ...d,
            path: d.path.startsWith('/') ? d.path : `/${d.path}`,
          }));
          setDesigns(normalized);
          setVideo(data.video || null);
        } else {
          setDesigns(fallbackDesigns);
        }
      })
      .catch(() => {
        setDesigns(fallbackDesigns);
      })
      .finally(() => setLoading(false));
  }, []);

  const openLightbox = (index) => {
    setActiveLightboxIndex(index);
    setZoomLevel(1);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setActiveLightboxIndex(null);
    setZoomLevel(1);
    document.body.style.overflow = '';
  };

  const handleNextDesign = () => {
    if (!designs.length) return;
    setActiveLightboxIndex((prev) => (prev + 1) % designs.length);
    setZoomLevel(1);
  };

  const handlePrevDesign = () => {
    if (!designs.length) return;
    setActiveLightboxIndex((prev) => (prev - 1 + designs.length) % designs.length);
    setZoomLevel(1);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      const startX = e.touches[0].clientX;
      if (startX < 20 || startX > window.innerWidth - 20) {
        setTouchStartX(null);
        setTouchStartY(null);
        return;
      }
      setTouchStartX(startX);
      setTouchStartY(e.touches[0].clientY);
    }
  };

  const handleTouchEnd = (e) => {
    if (touchStartX === null || touchStartY === null) return;
    const diffX = touchStartX - e.changedTouches[0].clientX;
    const diffY = e.changedTouches[0].clientY - touchStartY;

    if (diffY > 90 && Math.abs(diffX) < 60) {
      closeLightbox();
      setTouchStartX(null);
      setTouchStartY(null);
      return;
    }
    if (diffX > 50) {
      handleNextDesign();
    } else if (diffX < -50) {
      handlePrevDesign();
    }
    setTouchStartX(null);
    setTouchStartY(null);
  };

  const activeDesign = activeLightboxIndex !== null ? designs[activeLightboxIndex] : null;

  return (
    <div className="py-6 sm:py-12">
      <SEO 
        title={locale === 'bn' ? 'প্রস্তাবিত ৩ডি ডিজাইন ও মাস্টার প্ল্যান' : 'Proposed 3D Architectural Designs'} 
        description={locale === 'bn' ? 'মানিকপুর ঈদগাহের প্রস্তাবিত ৩ডি স্থাপত্য নকশা, মিম্বর ও উন্নয়ন মহাপরিকল্পনা।' : 'Proposed 3D architectural renders, Mihrab plans, and master development layout for Manikpur Eidgah.'}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-12">
        <Breadcrumb items={[{ label: locale === 'bn' ? 'প্রস্তাবিত ডিজাইন' : 'Proposed Designs' }]} />

        {/* Single Page Title */}
        <div className="border-b border-sand pb-3">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-primary-dark tracking-tight">
            {locale === 'bn' ? 'নকশা ও মহাপরিকল্পনা' : 'Proposed 3D Designs & Plan'}
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted mt-0.5">
            {locale === 'bn'
              ? 'মানিকপুর ঈদগাহের আধুনিকায়ন প্রকল্পের ৩ডি স্থাপত্য নকশা ও রূপরেখা'
              : 'Proposed 3D architectural concepts and master layout for Manikpur Eidgah'}
          </p>
        </div>

        {/* Disclaimer / Notice Banner */}
        <div className="bg-canvas-alt rounded-2xl p-4 border border-gold/40 shadow-sakinah-sm flex items-start gap-3.5 text-ink">
          <div className="w-9 h-9 rounded-xl bg-gold/15 text-gold-text border border-gold/40 flex items-center justify-center shrink-0 mt-0.5">
            <Info className="w-4 h-4 text-gold-text" />
          </div>
          <p className="text-xs text-ink-muted leading-relaxed">
            {locale === 'bn'
              ? 'নিম্নে প্রদর্শিত চিত্রসমূহ মানিকপুর ঈদগাহের আধুনিকায়ন প্রকল্পের প্রস্তাবিত ৩ডি কম্পিউটার রেন্ডার। মূল নির্মাণকালে সিদ্ধান্ত সাপেক্ষে আংশিক পরিমার্জন হতে পারে।'
              : 'The visuals displayed below are proposed 3D architectural computer renders. Execution may vary slightly based on structural assessments.'}
          </p>
        </div>

        {/* 3D Video Section (Displayed only when video exists) */}
        {video && video.isPublished && (
          <div className="bg-surface text-ink rounded-2xl p-4 sm:p-6 border border-sand shadow-sakinah-sm space-y-4">
            <div className="flex items-center gap-2.5 border-b border-sand pb-3">
              <div className="w-9 h-9 rounded-xl bg-primary-soft border border-primary/20 flex items-center justify-center text-primary-dark">
                <Video className="w-4 h-4 text-primary" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-gold-text font-bold block">
                  {locale === 'bn' ? 'ত্রিমাত্রিক ওয়াকথ্রু' : '3D Walkthrough'}
                </span>
                <h2 className="font-serif font-bold text-base sm:text-lg text-primary-dark">
                  {getLocalized(video, 'title')}
                </h2>
              </div>
            </div>

            {/* Video Player */}
            <div className="aspect-video w-full rounded-xl overflow-hidden bg-scrim border border-sand shadow-inner">
              {video.type === 'YOUTUBE' && video.url ? (
                <iframe
                  src={video.url.replace('watch?v=', 'embed/')}
                  title={getLocalized(video, 'title')}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : video.filePath ? (
                <video
                  src={video.filePath}
                  poster={video.posterPath}
                  controls
                  className="w-full h-full object-cover"
                />
              ) : null}
            </div>
          </div>
        )}

        {/* Designs Single-Column List on Mobile, 3-Column on Desktop */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {designs.map((design, index) => {
              const caption = getLocalized(design, 'caption');
              if (locale === 'en' && !caption) return null;
              const description = getLocalized(design, 'description');

              return (
                <div
                  key={design.id}
                  onClick={() => openLightbox(index)}
                  className="group cursor-pointer bg-surface rounded-2xl overflow-hidden border border-sand hover:border-gold/60 shadow-sakinah-sm hover:shadow-sakinah-card transition-all flex flex-col justify-between active:scale-[0.98] tap-feedback"
                >
                  {/* Image Frame */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-canvas-alt">
                    <ImageWithBlur
                      src={design.thumbPath || design.path}
                      alt={caption}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* Zoom overlay badge */}
                    <div className="absolute inset-0 bg-scrim/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <div className="px-3.5 py-1.5 rounded-xl bg-surface/95 text-primary-dark border border-gold text-xs font-bold flex items-center gap-1.5 backdrop-blur-md shadow-sakinah-sm">
                        <Eye className="w-3.5 h-3.5" />
                        <span>{locale === 'bn' ? 'বড় করে দেখুন' : 'Full Preview'}</span>
                      </div>
                    </div>
                    {/* Serial Tag */}
                    <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-lg bg-surface/90 backdrop-blur-md text-primary-dark text-[10px] font-mono font-bold border border-sand tabular-nums shadow-sm">
                      #{locale === 'bn' ? toBanglaNum(index + 1) : index + 1}
                    </div>
                  </div>

                  {/* Caption & Description */}
                  <div className="p-4 space-y-1.5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-serif font-bold text-base text-primary-dark group-hover:text-primary transition-colors">
                        {caption}
                      </h3>
                      {description && (
                        <p className="text-xs text-ink-muted mt-1 leading-relaxed line-clamp-2">
                          {description}
                        </p>
                      )}
                    </div>

                    <div className="pt-2.5 mt-2.5 border-t border-sand flex items-center justify-between text-xs text-primary-dark font-semibold">
                      <span>{locale === 'bn' ? '৩ডি স্থাপত্য নকশা' : '3D Render'}</span>
                      <span>{locale === 'bn' ? 'ট্যাপ করুন →' : 'View →'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* FULL IN-PAGE LIGHTBOX */}
      {activeLightboxIndex !== null && activeDesign && (
        <div 
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="fixed inset-0 z-50 bg-scrim/95 backdrop-blur-md flex flex-col justify-between select-none animate-fade-in"
        >
          {/* Top Bar */}
          <div className="p-4 sm:p-5 flex items-center justify-between text-white z-10 bg-gradient-to-b from-scrim/80 to-transparent">
            <div>
              <span className="font-mono text-xs text-gold-plate-from font-bold px-3 py-1 rounded-full bg-surface/15 backdrop-blur-md mr-2 tabular-nums">
                {locale === 'bn' ? toBanglaNum(activeLightboxIndex + 1) : activeLightboxIndex + 1} / {locale === 'bn' ? toBanglaNum(designs.length) : designs.length}
              </span>
              <span className="font-serif font-bold text-sm sm:text-base text-white">
                {getLocalized(activeDesign, 'caption')}
              </span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={() => setZoomLevel((z) => Math.min(3, +(z + 0.3).toFixed(1)))}
                className="p-2 rounded-xl bg-surface/15 hover:bg-surface/25 text-white transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.7, +(z - 0.3).toFixed(1)))}
                className="p-2 rounded-xl bg-surface/15 hover:bg-surface/25 text-white transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoomLevel(1)}
                className="p-2 rounded-xl bg-surface/15 hover:bg-surface/25 text-white transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
                title="Reset Zoom"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={closeLightbox}
                className="p-2 rounded-xl bg-surface/20 hover:bg-danger/90 text-white transition-colors ml-1 min-w-[44px] min-h-[44px] flex items-center justify-center tap-target"
                title="Close (Esc)"
                aria-label="Close lightbox"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Active Image Stage */}
          <div className="relative flex-1 flex items-center justify-center p-4 overflow-hidden">
            <div
              className="max-w-full max-h-[75vh] flex items-center justify-center transition-transform duration-200 ease-out"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              <img
                src={getImageUrl(activeDesign.path)}
                alt={getLocalized(activeDesign, 'caption')}
                className="max-h-[75vh] max-w-full object-contain rounded-xl shadow-2xl"
              />
            </div>
          </div>

          {/* Bottom Bar: Caption and Mini Strip */}
          <div className="p-4 bg-gradient-to-t from-scrim/90 via-scrim/70 to-transparent z-10 space-y-3">
            <p className="text-center text-xs sm:text-sm text-white/90 max-w-2xl mx-auto font-medium">
              {getLocalized(activeDesign, 'caption')}
              {activeDesign.descriptionBn && ` — ${getLocalized(activeDesign, 'description')}`}
            </p>

            <div className="flex items-center justify-center gap-2 overflow-x-auto py-1 scrollbar-none max-w-2xl mx-auto">
              {designs.map((d, idx) => (
                <button
                  key={d.id}
                  onClick={() => {
                    setActiveLightboxIndex(idx);
                    setZoomLevel(1);
                  }}
                  className={`relative w-12 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition-all min-h-[44px] ${
                    idx === activeLightboxIndex
                      ? 'border-gold scale-105 shadow-lg ring-2 ring-gold/50'
                      : 'border-white/30 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={getImageUrl(d.thumbPath || d.path)} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

