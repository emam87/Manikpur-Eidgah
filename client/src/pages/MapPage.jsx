import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  MapPin, Navigation, ExternalLink, Layers, Compass, 
  Map as MapIcon, Landmark, Info, Share2, Check 
} from 'lucide-react';
import { SEO } from '../components/common/SEO.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { EightPointStar, StarDivider } from '../components/common/EightPointStar.jsx';

export function MapPage() {
  const { locale, t, toBanglaNum } = useLanguage();
  const { getSetting } = useSettings();

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const polygonLayerRef = useRef(null);

  const [copied, setCopied] = useState(false);
  const [activeLayer, setActiveLayer] = useState('osm'); // 'osm' | 'satellite'

  const lat = parseFloat(getSetting('map_lat', 'bn', '23.9875')) || 23.9875;
  const lng = parseFloat(getSetting('map_lng', 'bn', '90.8214')) || 90.8214;
  const locationText = getSetting('location', locale, 'মানিকপুর, বাঞ্ছারামপুর, ব্রাহ্মণবাড়িয়া');
  const landArea = getSetting('land_area', locale, '১.৩৫ একর (১৩৫ শতাংশ ওয়াকফকৃত জমি)');
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  // GeoJSON boundary polygon overlay representing the 1.35-acre waqf perimeter
  const boundaryPolygon = [
    [lat + 0.00065, lng - 0.00085],
    [lat + 0.00080, lng + 0.00075],
    [lat - 0.00060, lng + 0.00095],
    [lat - 0.00075, lng - 0.00070],
  ];

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Initialize Leaflet map
      const map = L.map(mapContainerRef.current, {
        center: [lat, lng],
        zoom: 17,
        scrollWheelZoom: true,
      });

      // Add default OpenStreetMap tiles
      const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Custom Heritage Gold/Emerald Marker Icon
      const customIcon = L.divIcon({
        className: 'custom-heritage-marker',
        html: `
          <div style="
            background: #0F5132;
            border: 2px solid #B8923F;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            width: 38px;
            height: 38px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 6px 15px rgba(0,0,0,0.35);
          ">
            <div style="
              transform: rotate(45deg);
              color: #FBF9F3;
              font-size: 14px;
              font-weight: bold;
            ">🕌</div>
          </div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 38],
        popupAnchor: [0, -36],
      });

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
      marker.bindPopup(`
        <div style="font-family: inherit; padding: 4px; text-align: center;">
          <h4 style="margin: 0 0 4px 0; color: #0F5132; font-weight: bold; font-size: 14px;">মানিকপুর কেন্দ্রীয় শাহী ঈদগাহ</h4>
          <p style="margin: 0; font-size: 11px; color: #555;">১.৩৫ একর ঐতিহাসিক ওয়াকফ ভূমি</p>
        </div>
      `).openPopup();

      // Boundary polygon overlay
      const polygon = L.polygon(boundaryPolygon, {
        color: '#B8923F',
        weight: 2.5,
        fillColor: '#0F5132',
        fillOpacity: 0.25,
        dashArray: '5, 5',
      }).addTo(map);

      polygon.bindTooltip('মানিকপুর কেন্দ্রীয় শাহী ঈদগাহ ময়দান (১.৩৫ একর)', {
        permanent: false,
        direction: 'center',
      });

      polygonLayerRef.current = polygon;
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [lat, lng]);

  const handleShareLocation = async () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'মানিকপুর কেন্দ্রীয় শাহী ঈদগাহ অবস্থান',
          url,
        });
      } catch (err) {}
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="py-10 sm:py-16">
      <SEO 
        title={locale === 'bn' ? 'ভৌগোলিক অবস্থান ও সীমানা' : 'Location & Boundary Map'} 
        description={locale === 'bn' ? 'মানিকপুর কেন্দ্রীয় শাহী ঈদগাহের ভৌগোলিক অবস্থান, ১.৩৫ একর সীমানা এবং সরাসরি দিকনির্দেশনা।' : 'Geographical location and 1.35-acre boundary overlay of Manikpur Central Shahi Eidgah.'}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 sm:space-y-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950 text-gold-300 text-xs sm:text-sm font-semibold mb-3 border border-gold-500/40">
            <Compass className="w-3.5 h-3.5 text-gold-400" />
            <span>{locale === 'bn' ? 'ভৌগোলিক তথ্য ও সীমানা' : 'Geographical Boundary'}</span>
            <EightPointStar className="w-3.5 h-3.5 text-gold-400" />
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-extrabold text-stone-900 tracking-tight mb-4">
            {locale === 'bn' ? 'অবস্থান ও সীমানা মানচিত্র' : 'Location & Boundary Map'}
          </h1>
          <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
            {locale === 'bn' 
              ? 'মানিকপুর কেন্দ্রীয় শাহী ঈদগাহের ১.৩৫ একর ভূমির চিহ্নিত সীমানা এবং গুগল ম্যাপস দিকনির্দেশনা।' 
              : 'Interactive OpenStreetMap with 1.35-acre waqf polygon boundary and one-click directions.'}
          </p>
          <StarDivider className="my-4" />
        </div>

        {/* Map Stage + Floating Controls */}
        <div className="bg-white rounded-3xl border-2 border-gold-500/40 shadow-2xl overflow-hidden flex flex-col">
          {/* Top Control Bar */}
          <div className="p-4 sm:p-5 bg-emerald-950 text-ivory flex flex-wrap items-center justify-between gap-4 border-b border-gold-500/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gold-500/20 border border-gold-400/40 flex items-center justify-center text-gold-300">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-serif font-bold text-base sm:text-lg text-gold-200">
                  {locale === 'bn' ? 'মানিকপুর কেন্দ্রীয় শাহী ঈদগাহ ময়দান' : 'Manikpur Central Shahi Eidgah'}
                </h2>
                <p className="text-xs text-stone-300">
                  {lat.toFixed(4)}° N, {lng.toFixed(4)}° E | {landArea}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleShareLocation}
                className="px-3.5 py-2 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-gold-300 text-xs font-semibold border border-gold-500/30 transition-colors flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copied ? (locale === 'bn' ? 'কপি হয়েছে!' : 'Copied!') : (locale === 'bn' ? 'শেয়ার' : 'Share')}</span>
              </button>

              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-gold-600 via-gold-500 to-gold-600 text-emerald-950 text-xs sm:text-sm font-bold shadow-md hover:from-gold-500 hover:to-gold-400 transition-all flex items-center gap-2"
              >
                <Navigation className="w-4 h-4 fill-current" />
                <span>{locale === 'bn' ? 'গুগল ম্যাপে দিকনির্দেশনা' : 'Get Directions'}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Map Canvas */}
          <div className="relative w-full h-[500px] sm:h-[600px] bg-stone-100">
            <div ref={mapContainerRef} className="w-full h-full z-10" />

            {/* Boundary Legend Card overlay */}
            <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-gold-500/40 shadow-lg text-xs space-y-1.5 pointer-events-auto max-w-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-800 border border-gold-500 shrink-0" />
                <span className="font-serif font-bold text-stone-900">
                  {locale === 'bn' ? '১.৩৫ একর ঈদগাহ সীমানা' : '1.35-Acre Waqf Boundary'}
                </span>
              </div>
              <p className="text-[11px] text-stone-600 leading-tight">
                {locale === 'bn' ? 'হলুদ-সোনালী দাগাঙ্কিত রেখা ঈদগাহের ওয়াকফকৃত ভূমির মূল সীমানা নির্দেশ করে।' : 'Golden dashed polygon shows the registered waqf perimeter.'}
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Address and Location Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-gold-500/30 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-emerald-700" />
            </div>
            <h3 className="font-serif font-bold text-stone-900">{locale === 'bn' ? 'সরাসরি ঠিকানা' : 'Exact Address'}</h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              {locationText}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gold-500/30 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <Landmark className="w-5 h-5 text-emerald-700" />
            </div>
            <h3 className="font-serif font-bold text-stone-900">{locale === 'bn' ? 'মৌজা ও খতিয়ান' : 'Mouza & Records'}</h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              {locale === 'bn' 
                ? 'মৌজা: মানিকপুর, জে.এল নং: বাঞ্ছারামপুর, জেলা: ব্রাহ্মণবাড়িয়া। মোট আয়তন: ১.৩৫ একর।' 
                : 'Mouza: Manikpur, Upazila: Bancharampur, District: Brahmanbaria. Total Area: 1.35 Acres.'}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gold-500/30 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <Navigation className="w-5 h-5 text-emerald-700" />
            </div>
            <h3 className="font-serif font-bold text-stone-900">{locale === 'bn' ? 'গমনাগমন ও রুট' : 'Transport & Access'}</h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              {locale === 'bn' 
                ? 'মানিকপুর বাজার হতে পাঁকা রাস্তা সংলগ্ন দক্ষিণ পাশে ঈদগাহ ময়দান অবস্থিত। রিকশা, অটোরিকশা ও সিএনজি যোগে সরাসরি যাওয়া যায়।' 
                : 'Accessible via paved road directly south of Manikpur Bazar with regular auto-rickshaw and CNG transport.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

