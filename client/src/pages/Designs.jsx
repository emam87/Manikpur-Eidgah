import React, { useState, useEffect } from 'react';
import { 
  Compass, Eye, Play, Sparkles, Layers, Video, 
  X, ZoomIn, ZoomOut, RotateCcw, Download, Info, Check, Share2
} from 'lucide-react';
import { SEO } from '../components/common/SEO.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { EightPointStar, StarDivider } from '../components/common/EightPointStar.jsx';

export function Designs() {
  const { locale, t, toBanglaNum, getLocalized } = useLanguage();

  const [designs, setDesigns] = useState([]);
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeLightboxIndex, setActiveLightboxIndex] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);

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
      captionBn: 'শাহী মিম্বর সম্মুখ দৃশ্য',
      captionEn: 'Shahi Mihrab Front View',
      descriptionBn: 'ঐতিহ্যবাহী ইসলামিক স্থাপত্যরীতি ও খিলান সমন্বয়ে সুদৃশ্য শাহী মিম্বর ও প্রধান দেওয়ালের সম্মুখ রূপ।',
      descriptionEn: 'Grand facade of the proposed Shahi Mihrab featuring traditional Islamic arch aesthetics.',
    },
    {
      id: 4,
      path: '/designs/mihrab-wall-closeup.jpg',
      captionBn: 'শাহী মিম্বর ক্লোজ-আপ',
      captionEn: 'Shahi Mihrab Closeup',
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
          // Normalize paths if starting with designs/
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

  const activeDesign = activeLightboxIndex !== null ? designs[activeLightboxIndex] : null;

  return (
    <div className="py-10 sm:py-16">
      <SEO 
        title={locale === 'bn' ? 'প্রস্তাবিত ৩ডি ডিজাইন ও মাস্টার প্ল্যান' : 'Proposed 3D Architectural Designs'} 
        description={locale === 'bn' ? 'মানিকপুর কেন্দ্রীয় শাহী ঈদগাহের প্রস্তাবিত ৩ডি স্থাপত্য নকশা, শাহী মিম্বর ও উন্নয়ন মহাপরিকল্পনা।' : 'Proposed 3D architectural renders, Shahi Mihrab plans, and master development layout for Manikpur Eidgah.'}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950 text-gold-300 text-xs sm:text-sm font-semibold mb-3 border border-gold-500/40">
            <Compass className="w-3.5 h-3.5 text-gold-400" />
            <span>{locale === 'bn' ? 'স্থাপত্য রূপরেখা ও মাস্টার প্ল্যান' : 'Architectural Master Plan'}</span>
            <EightPointStar className="w-3.5 h-3.5 text-gold-400" />
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-extrabold text-stone-900 tracking-tight mb-4">
            {locale === 'bn' ? 'ডিজাইন ও উন্নয়ন পরিকল্পনা' : 'Proposed 3D Designs & Plan'}
          </h1>
          <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
            {locale === 'bn' 
              ? 'ঐতিহ্যবাহী মানিকপুর কেন্দ্রীয় শাহী ঈদগাহকে একটি পূর্ণাঙ্গ আধুনিক ও নান্দনিক রূপ দিতে বিশেষজ্ঞ প্রকৌশলীদের দ্বারা প্রণীত প্রস্তাবিত ৩ডি নকশা।' 
              : 'Proposed 3D architectural concepts and master layout envisioned to elevate Manikpur Central Shahi Eidgah into a timeless Islamic landmark.'}
          </p>
          <StarDivider className="my-4" />
        </div>

        {/* Disclaimer / Notice Banner */}
        <div className="bg-gradient-to-r from-amber-50 via-emerald-50/40 to-amber-50 rounded-2xl p-4 sm:p-6 border border-gold-400/60 shadow-sm flex items-start gap-4 text-stone-800">
          <div className="w-10 h-10 rounded-xl bg-gold-500/20 text-emerald-900 border border-gold-500/40 flex items-center justify-center shrink-0 mt-0.5">
            <Info className="w-5 h-5 text-emerald-800" />
          </div>
          <div className="space-y-1 text-xs sm:text-sm leading-relaxed">
            <h2 className="font-serif font-bold text-emerald-950 text-sm sm:text-base">
              {locale === 'bn' ? 'দৃষ্টি আকর্ষণ: প্রস্তাবিত ৩ডি স্থাপত্য নকশা' : 'Notice: Proposed 3D Architectural Renders'}
            </h2>
            <p className="text-stone-700">
              {locale === 'bn' 
                ? 'নিম্নে প্রদর্শিত চিত্রসমূহ মানিকপুর কেন্দ্রীয় শাহী ঈদগাহের আধুনিকায়ন প্রকল্পের প্রস্তাবিত ৩ডি কম্পিউটার রেন্ডার। মূল নির্মাণ কার্যক্রম বাস্তবায়নকালে পরিচালনা কমিটির সিদ্ধান্ত ও বাস্তব পরিবেশের সাথে সামঞ্জস্য রেখে নকশায় আংশিক পরিবর্তন বা পরিমার্জন হতে পারে।' 
                : 'The visuals displayed below are proposed 3D architectural computer renders. Actual execution may vary slightly based on structural assessments and managing committee resolutions.'}
            </p>
          </div>
        </div>

        {/* 3D Video Section (Displayed only when video exists) */}
        {video && video.isPublished && (
          <div className="bg-emerald-950 text-ivory rounded-3xl p-6 sm:p-10 border-2 border-gold-500/40 shadow-2xl space-y-6">
            <div className="flex items-center gap-3 border-b border-gold-500/30 pb-4">
              <div className="w-10 h-10 rounded-xl bg-gold-500/20 border border-gold-400/40 flex items-center justify-center text-gold-300">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-gold-300 font-bold block">
                  {locale === 'bn' ? 'ত্রিমাত্রিক স্থাপত্য ওয়াকথ্রু' : '3D Architectural Walkthrough'}
                </span>
                <h2 className="font-serif font-bold text-xl sm:text-2xl text-gold-100">
                  {getLocalized(video, 'title')}
                </h2>
              </div>
            </div>

            {/* Video Player */}
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black border border-gold-500/30 shadow-inner">
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

        {/* 7 Designs Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-gold-500/20 pb-3">
            <h2 className="font-serif font-bold text-xl sm:text-2xl text-emerald-950 flex items-center gap-2">
              <EightPointStar className="w-5 h-5 text-gold-500" />
              <span>{locale === 'bn' ? 'প্রস্তাবিত ৩ডি রেন্ডার গ্যালারি' : '3D Architectural Renders'}</span>
            </h2>
            <span className="text-xs text-stone-500 font-mono">
              {toBanglaNum(designs.length)} {locale === 'bn' ? 'টি মূল নকশা' : 'design items'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {designs.map((design, index) => (
              <div
                key={design.id}
                onClick={() => openLightbox(index)}
                className="group cursor-pointer bg-white rounded-3xl overflow-hidden border border-gold-500/30 shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col justify-between transform hover:-translate-y-1.5"
              >
                {/* Image Frame */}
                <div className="relative aspect-[16/10] overflow-hidden bg-stone-900">
                  <img
                    src={design.thumbPath || design.path}
                    alt={getLocalized(design, 'caption')}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  {/* Zoom overlay badge */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="px-4 py-2 rounded-xl bg-emerald-950/90 text-gold-200 border border-gold-400 text-xs font-bold flex items-center gap-2 backdrop-blur-md">
                      <Eye className="w-4 h-4" />
                      <span>{locale === 'bn' ? 'বড় করে দেখুন' : 'Full Preview'}</span>
                    </div>
                  </div>
                  {/* Serial Number Tag */}
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-emerald-950/80 backdrop-blur-md text-gold-300 text-[11px] font-mono font-bold border border-gold-500/30">
                    #{toBanglaNum(index + 1)}
                  </div>
                </div>

                {/* Caption & Description */}
                <div className="p-5 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif font-bold text-lg text-stone-900 group-hover:text-emerald-900 transition-colors">
                      {getLocalized(design, 'caption')}
                    </h3>
                    {design.descriptionBn && (
                      <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                        {getLocalized(design, 'description')}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400 font-medium">
                    <span>{locale === 'bn' ? '৩ডি স্থাপত্য নকশা' : '3D Architectural Model'}</span>
                    <span className="text-emerald-800 font-bold group-hover:text-gold-600 flex items-center gap-1 transition-colors">
                      {locale === 'bn' ? 'ক্লিক করুন' : 'View'} &rarr;
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FULL IN-PAGE LIGHTBOX */}
      {activeLightboxIndex !== null && activeDesign && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between select-none animate-fade-in">
          {/* Top Bar */}
          <div className="p-4 sm:p-5 flex items-center justify-between text-white z-10 bg-gradient-to-b from-black/80 to-transparent">
            <div>
              <span className="font-mono text-xs text-gold-300 font-bold px-3 py-1 rounded-full bg-white/10 backdrop-blur-md mr-2">
                {toBanglaNum(activeLightboxIndex + 1)} / {toBanglaNum(designs.length)}
              </span>
              <span className="font-serif font-bold text-sm sm:text-base text-white">
                {getLocalized(activeDesign, 'caption')}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoomLevel((z) => Math.min(3, +(z + 0.3).toFixed(1)))}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.7, +(z - 0.3).toFixed(1)))}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoomLevel(1)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Reset Zoom"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={closeLightbox}
                className="p-2 rounded-xl bg-white/10 hover:bg-red-600/80 text-white transition-colors ml-2"
                title="Close (Esc)"
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
                src={activeDesign.path}
                alt={getLocalized(activeDesign, 'caption')}
                className="max-h-[75vh] max-w-full object-contain rounded-xl shadow-2xl"
              />
            </div>
          </div>

          {/* Bottom Bar: Caption and Mini Strip */}
          <div className="p-4 bg-gradient-to-t from-black/90 via-black/70 to-transparent z-10 space-y-3">
            <p className="text-center text-xs sm:text-sm text-stone-200 max-w-2xl mx-auto font-medium">
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
                  className={`relative w-12 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                    idx === activeLightboxIndex
                      ? 'border-gold-400 scale-105 shadow-lg ring-2 ring-gold-400/50'
                      : 'border-white/30 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={d.thumbPath || d.path} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

