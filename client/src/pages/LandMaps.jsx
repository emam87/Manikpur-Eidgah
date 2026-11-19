import React, { useState, useEffect, useRef } from 'react';
import { 
  LandPlot, ZoomIn, ZoomOut, RotateCcw, Download, Maximize2, 
  Map, Compass, Layers, Info, Calendar, FileText, ChevronRight
} from 'lucide-react';
import { SEO } from '../components/common/SEO.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { EightPointStar, StarDivider } from '../components/common/EightPointStar.jsx';
import { Breadcrumb } from '../components/common/Breadcrumb.jsx';

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
    <div className="py-6 sm:py-12">
      <SEO 
        title={locale === 'bn' ? 'জমির নকশা ও জরিপ' : 'Cadastral Land Maps'} 
        description={locale === 'bn' ? 'মানিকপুর ঈদগাহের সিএস, এসএ, আরএস ও বিএস মৌজা নকশা।' : 'Official CS, SA, RS, and BS cadastral mouza maps of Manikpur Eidgah.'}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-12">
        <Breadcrumb items={[{ label: locale === 'bn' ? 'জমির নকশা ও মৌজা' : 'Cadastral Maps' }]} />

        {/* Single Page Title */}
        <div className="border-b border-sand pb-3">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-primary-dark tracking-tight">
            {locale === 'bn' ? 'জমির নকশা ও মৌজা মানচিত্র' : 'Cadastral Land Maps'}
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted mt-0.5">
            {locale === 'bn'
              ? 'সিএস, এসএ, আরএস ও হাল বিএস জরিপের অফিসিয়াল মৌজা নকশা'
              : 'Interactive viewer for official cadastral surveys across CS, SA, RS, and BS records'}
          </p>
        </div>

        {loading ? (
          <div className="h-96 rounded-3xl bg-canvas-alt animate-pulse border border-sand" />
        ) : maps.length === 0 ? (
          <div className="text-center py-20 bg-surface rounded-3xl border border-sand shadow-sakinah-sm space-y-4">
            <Map className="w-12 h-12 text-ink-muted/50 mx-auto" />
            <h3 className="font-serif text-xl font-bold text-ink">
              {locale === 'bn' ? 'কোনো মৌজা নকশা সংযুক্ত নেই' : 'No Land Maps Available'}
            </h3>
            <p className="text-ink-muted text-sm max-w-md mx-auto">
              {locale === 'bn' ? 'শীঘ্রই নতুন মৌজা নকশা আপলোড করা হবে।' : 'High-resolution survey maps will be uploaded soon.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Map Selection Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {maps.map((mapItem, idx) => {
                const title = getLocalized(mapItem, 'title');
                if (locale === 'en' && !title) return null;

                return (
                  <button
                    key={mapItem.id}
                    onClick={() => {
                      setSelectedMapIndex(idx);
                      handleResetZoom();
                    }}
                    className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2 min-h-[40px] ${
                      selectedMapIndex === idx
                        ? 'bg-primary text-white shadow-sakinah-sm border border-gold/50'
                        : 'bg-surface text-ink hover:bg-canvas-alt border border-sand'
                    }`}
                  >
                    <Layers className={`w-4 h-4 ${selectedMapIndex === idx ? 'text-gold' : 'text-gold-text'}`} />
                    <span>{title}</span>
                    {mapItem.mapType && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                        selectedMapIndex === idx ? 'bg-primary-dark text-white' : 'bg-primary-soft text-primary-dark'
                      }`}>
                        {mapItem.mapType}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Viewer Stage */}
            {currentMap && (
              <div className="bg-surface rounded-3xl border border-sand shadow-sakinah-card overflow-hidden flex flex-col">
                {/* Top Control Bar */}
                <div className="p-4 bg-canvas-alt text-ink flex flex-wrap items-center justify-between gap-4 border-b border-sand">
                  <div>
                    <h2 className="font-serif font-bold text-lg sm:text-xl text-primary-dark">
                      {getLocalized(currentMap, 'title')}
                    </h2>
                    <p className="text-xs text-ink-muted tabular-nums">
                      {currentMap.mouzaName && `${locale === 'bn' ? 'মৌজা: ' : 'Mouza: '}${currentMap.mouzaName}`}
                      {currentMap.sheetNo && ` | ${locale === 'bn' ? 'শীট নং: ' : 'Sheet: '}${locale === 'bn' ? toBanglaNum(currentMap.sheetNo) : currentMap.sheetNo}`}
                      {currentMap.dagNo && ` | ${locale === 'bn' ? 'দাগ: ' : 'Plot: '}${locale === 'bn' ? toBanglaNum(currentMap.dagNo) : currentMap.dagNo}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {/* Zoom In */}
                    <button
                      onClick={handleZoomIn}
                      className="p-2 rounded-xl bg-surface hover:bg-primary-soft text-primary-dark border border-sand transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
                      title="Zoom In"
                      aria-label="Zoom In"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    {/* Zoom Out */}
                    <button
                      onClick={handleZoomOut}
                      className="p-2 rounded-xl bg-surface hover:bg-primary-soft text-primary-dark border border-sand transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
                      title="Zoom Out"
                      aria-label="Zoom Out"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    {/* Reset */}
                    <button
                      onClick={handleResetZoom}
                      className="p-2 rounded-xl bg-surface hover:bg-primary-soft text-primary-dark border border-sand transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
                      title="Reset View"
                      aria-label="Reset View"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    {/* Download */}
                    {currentMap.filePath && (
                      <a
                        href={currentMap.filePath}
                        download
                        className="px-3 py-2 rounded-xl bg-gold-plate text-ink font-bold text-xs hover:shadow-gold-glow transition-all flex items-center gap-1.5 shadow-sakinah-sm min-h-[40px] tap-target"
                        aria-label="Download map"
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
                  className={`w-full h-[550px] sm:h-[650px] bg-canvas relative overflow-hidden flex items-center justify-center select-none ${
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
                  <div className="absolute bottom-4 left-4 bg-scrim/75 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-[11px] pointer-events-none flex items-center gap-2">
                    <Info className="w-3.5 h-3.5 text-gold" />
                    <span>
                      {locale === 'bn' 
                        ? 'মাউস বা আঙুল দিয়ে টেনে যেকোনো দিকে সরান ও জুম করুন' 
                        : 'Drag to pan, use buttons to zoom'}
                    </span>
                  </div>

                  <div className="absolute top-4 right-4 bg-scrim/75 backdrop-blur-md px-3 py-1.5 rounded-lg text-gold font-mono text-xs pointer-events-none tabular-nums">
                    {Math.round(zoomLevel * 100)}%
                  </div>
                </div>

                {/* Details Footer */}
                {currentMap.descriptionBn && (
                  <div className="p-5 bg-canvas-alt border-t border-sand text-ink-muted text-xs sm:text-sm leading-relaxed">
                    <h3 className="font-serif font-bold text-ink mb-1">
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

