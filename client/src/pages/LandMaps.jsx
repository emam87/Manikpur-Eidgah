import React, { useState, useEffect, useRef } from 'react';
import { 
  LandPlot, ZoomIn, ZoomOut, RotateCcw, Download, Maximize2, 
  Map, Compass, Layers, Info, Calendar, FileText, ChevronRight
} from 'lucide-react';
import { SEO } from '../components/common/SEO.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { EightPointStar, StarDivider } from '../components/common/EightPointStar.jsx';

export function LandMaps() {
  const { locale, t, toBanglaNum, getLocalized } = useLanguage();

  const [maps, setMaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMapIndex, setSelectedMapIndex] = useState(0);

  // Pan & Zoom interactive state
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef(null);

  useEffect(() => {
    fetch('/api/public/land-maps')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success) {
          setMaps(data.landMaps || []);
        }
      })
      .catch((err) => console.error('Failed to load land maps:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleZoomIn = () => setZoomLevel((z) => Math.min(4, +(z + 0.3).toFixed(1)));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(0.6, +(z - 0.3).toFixed(1)));
  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPanPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - panPosition.x,
        y: e.touches[0].clientY - panPosition.y,
      });
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPanPosition({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const currentMap = maps[selectedMapIndex] || null;

  return (
    <div className="py-10 sm:py-16">
      <SEO 
        title={locale === 'bn' ? 'জমির নকশা ও জরিপ' : 'Cadastral Land Maps'} 
        description={locale === 'bn' ? 'মানিকপুর কেন্দ্রীয় শাহী ঈদগাহের সিএস, এসএ, আরএস ও বিএস মৌজা নকশা।' : 'Official CS, SA, RS, and BS cadastral mouza maps of Manikpur Eidgah.'}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 sm:space-y-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950 text-gold-300 text-xs sm:text-sm font-semibold mb-3 border border-gold-500/40">
            <Compass className="w-3.5 h-3.5 text-gold-400" />
            <span>{locale === 'bn' ? 'জরিপ ও ভূ-পরিকল্পনা' : 'Cadastral Surveys'}</span>
            <EightPointStar className="w-3.5 h-3.5 text-gold-400" />
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-extrabold text-stone-900 tracking-tight mb-4">
            {locale === 'bn' ? 'জমির নকশা ও মৌজা মানচিত্র' : 'Cadastral Land Maps'}
          </h1>
          <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
            {locale === 'bn' 
              ? 'সিএস, এসএ, আরএস ও হাল বিএস জরিপের অফিসিয়াল মৌজা নকশা—যাতে রয়েছে জুম ও প্যান করার পূর্ণ সুবিধা।' 
              : 'Interactive viewer for official cadastral surveys across CS, SA, RS, and BS land records with high-res zoom & pan.'}
          </p>
          <StarDivider className="my-4" />
        </div>

        {loading ? (
          <div className="h-96 rounded-3xl bg-stone-100 animate-pulse border border-stone-200" />
        ) : maps.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-stone-200 space-y-4">
            <Map className="w-12 h-12 text-stone-300 mx-auto" />
            <h3 className="font-serif text-xl font-bold text-stone-800">
              {locale === 'bn' ? 'কোনো মৌজা নকশা সংযুক্ত নেই' : 'No Land Maps Available'}
            </h3>
            <p className="text-stone-500 text-sm max-w-md mx-auto">
              {locale === 'bn' ? 'শীঘ্রই নতুন মৌজা নকশা আপলোড করা হবে।' : 'High-resolution survey maps will be uploaded soon.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Map Selection Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {maps.map((mapItem, idx) => (
                <button
                  key={mapItem.id}
                  onClick={() => {
                    setSelectedMapIndex(idx);
                    handleResetZoom();
                  }}
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                    selectedMapIndex === idx
                      ? 'bg-emerald-900 text-gold-200 shadow-md border border-gold-500/50'
                      : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200'
                  }`}
                >
                  <Layers className="w-4 h-4 text-gold-400" />
                  <span>{getLocalized(mapItem, 'title')}</span>
                  {mapItem.mapType && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-gold-300 font-mono">
                      {mapItem.mapType}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Viewer Stage */}
            {currentMap && (
              <div className="bg-white rounded-3xl border border-gold-500/40 shadow-xl overflow-hidden flex flex-col">
                {/* Top Control Bar */}
                <div className="p-4 bg-emerald-950 text-ivory flex flex-wrap items-center justify-between gap-4 border-b border-gold-500/30">
                  <div>
                    <h2 className="font-serif font-bold text-lg sm:text-xl text-gold-200">
                      {getLocalized(currentMap, 'title')}
                    </h2>
                    <p className="text-xs text-stone-300">
                      {currentMap.mouzaName && `${locale === 'bn' ? 'মৌজা: ' : 'Mouza: '}${currentMap.mouzaName}`}
                      {currentMap.sheetNo && ` | ${locale === 'bn' ? 'শীট নং: ' : 'Sheet: '}${toBanglaNum(currentMap.sheetNo)}`}
                      {currentMap.dagNo && ` | ${locale === 'bn' ? 'দাগ: ' : 'Plot: '}${toBanglaNum(currentMap.dagNo)}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Zoom In */}
                    <button
                      onClick={handleZoomIn}
                      className="p-2 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-gold-300 border border-gold-500/30 transition-colors"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    {/* Zoom Out */}
                    <button
                      onClick={handleZoomOut}
                      className="p-2 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-gold-300 border border-gold-500/30 transition-colors"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    {/* Reset */}
                    <button
                      onClick={handleResetZoom}
                      className="p-2 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-gold-300 border border-gold-500/30 transition-colors"
                      title="Reset View"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    {/* Download */}
                    {currentMap.filePath && (
                      <a
                        href={currentMap.filePath}
                        download
                        className="px-3 py-2 rounded-xl bg-gradient-to-r from-gold-600 to-gold-500 text-emerald-950 font-bold text-xs hover:from-gold-500 hover:to-gold-400 transition-all flex items-center gap-1.5 shadow-md"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{locale === 'bn' ? 'মূল নকশা ডাউনলোড' : 'Download'}</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Interactive Drag & Zoom Canvas */}
                <div
                  ref={containerRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleMouseUp}
                  className={`w-full h-[550px] sm:h-[650px] bg-stone-900 relative overflow-hidden flex items-center justify-center select-none ${
                    isDragging ? 'cursor-grabbing' : 'cursor-grab'
                  }`}
                  style={{ touchAction: 'none' }}
                >
                  <div
                    style={{
                      transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomLevel})`,
                      transition: isDragging ? 'none' : 'transform 0.15s ease-out',
                    }}
                    className="max-w-none transition-transform"
                  >
                    <img
                      src={currentMap.filePath}
                      alt={getLocalized(currentMap, 'title')}
                      draggable={false}
                      className="max-h-[550px] sm:max-h-[650px] object-contain pointer-events-none drop-shadow-2xl"
                    />
                  </div>

                  {/* Watermark / Floating Helper */}
                  <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-white/80 text-[11px] pointer-events-none flex items-center gap-2">
                    <Info className="w-3.5 h-3.5 text-gold-400" />
                    <span>
                      {locale === 'bn' 
                        ? 'মাউস বা আঙুল দিয়ে টেনে যেকোনো দিকে সরান ও জুম করুন' 
                        : 'Drag to pan, use buttons to zoom'}
                    </span>
                  </div>

                  <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-gold-300 font-mono text-xs pointer-events-none">
                    {Math.round(zoomLevel * 100)}%
                  </div>
                </div>

                {/* Details Footer */}
                {currentMap.descriptionBn && (
                  <div className="p-5 bg-stone-50 border-t border-stone-200 text-stone-700 text-xs sm:text-sm leading-relaxed">
                    <h3 className="font-serif font-bold text-stone-900 mb-1">
                      {locale === 'bn' ? 'নকশার বিবরণ ও বিশেষ তথ্যাবলি:' : 'Map Notes & Information:'}
                    </h3>
                    <p>{getLocalized(currentMap, 'description')}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

