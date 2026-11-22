import React, { useState, useEffect, useRef, useMemo, lazy, Suspense } from 'react';
import {
  Navigation,
  LocateFixed,
  Share2,
  Copy,
  QrCode,
  Check,
  ChevronDown,
  MapPin,
  Eye,
  ExternalLink,
  Download,
  Printer,
  Clock,
  Banknote,
  Compass,
  Map as MapIcon,
  AlertCircle,
} from 'lucide-react';
import { SEO } from '../components/common/SEO.jsx';
import { Breadcrumb } from '../components/common/Breadcrumb.jsx';
import { BottomSheet } from '../components/common/BottomSheet.jsx';
import { LandDonorDetailSheet } from '../components/land-donors/LandDonorDetailSheet.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { getImageUrl } from '../utils/imageUrl.js';
import {
  DEFAULT_MAP_LOCATION,
  MAP_PLACE_CATEGORIES,
  ROUTE_TRANSPORTS,
  buildNavigationLinks,
  detectPlatform,
  encodePlusCode,
  haversineDistanceKm,
  isLowDataOrLiteMode,
  copyTextSafe,
} from '../utils/mapUtils.js';
import { formatAreaPlate, getHonorificPrefix } from '../utils/landDonorHelpers.js';

// Lazy-load Leaflet so it is NEVER part of the initial bundle
const InteractiveLeafletMap = lazy(() =>
  import('../components/map/InteractiveLeafletMap.jsx')
);

export function MapPage() {
  const { locale, toBanglaNum, formatDate, getLocalized } = useLanguage();
  const { getSetting } = useSettings();
  const { showToast } = useToast();

  // Single-source-of-truth initial fallback from SettingsContext while /api/public/map loads
  const fallbackConfig = useMemo(() => {
    const lat = parseFloat(getSetting('map_lat', 'bn', String(DEFAULT_MAP_LOCATION.lat)));
    const lng = parseFloat(getSetting('map_lng', 'bn', String(DEFAULT_MAP_LOCATION.lng)));
    const zoom = parseInt(getSetting('map_zoom', 'bn', String(DEFAULT_MAP_LOCATION.zoom)), 10);
    return {
      lat: Number.isFinite(lat) ? lat : DEFAULT_MAP_LOCATION.lat,
      lng: Number.isFinite(lng) ? lng : DEFAULT_MAP_LOCATION.lng,
      zoom: Number.isFinite(zoom) ? zoom : DEFAULT_MAP_LOCATION.zoom,
      placeNameBn: getSetting('map_place_name', 'bn', DEFAULT_MAP_LOCATION.placeNameBn),
      placeNameEn: getSetting('map_place_name', 'en', DEFAULT_MAP_LOCATION.placeNameEn),
      addressBn: getSetting('map_address', 'bn', ''),
      addressEn: getSetting('map_address', 'en', ''),
      googlePlaceUrl: getSetting(
        'map_google_place_url',
        'bn',
        DEFAULT_MAP_LOCATION.googlePlaceUrl
      ),
      satelliteEnabled: getSetting('map_satellite_enabled', 'bn', '1') !== '0',
      staticPreview: getSetting('map_static_preview', 'bn', ''),
      boundaryGeoJson: null,
      conversionFactors: { acre: 100, bigha: 33, katha: 1.65, sqft: 435.6 },
    };
  }, [getSetting]);

  const [config, setConfig] = useState(fallbackConfig);
  const [places, setPlaces] = useState([]);
  const [routeGuides, setRouteGuides] = useState([]);
  const [parcels, setParcels] = useState([]);

  // Lazy viewport & Lite-mode map loading
  const mapWrapperRef = useRef(null);
  const [nearViewport, setNearViewport] = useState(false);
  const [forceInteractive, setForceInteractive] = useState(false);
  const [lowDataMode] = useState(() => isLowDataOrLiteMode());
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [focusCoords, setFocusCoords] = useState(null);

  // User geolocation (only on explicit tap; never stored or sent to server)
  const [locating, setLocating] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState('');

  // Sheets & Modals
  const [navSheetOpen, setNavSheetOpen] = useState(false);
  const [copySheetOpen, setCopySheetOpen] = useState(false);
  const [qrSheetOpen, setQrSheetOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [parcelCopied, setParcelCopied] = useState(false);

  // Collapsed-by-default accessible sections
  const [placesListOpen, setPlacesListOpen] = useState(false);
  const [routesOpen, setRoutesOpen] = useState(false);

  // Fetch /api/public/map
  useEffect(() => {
    let active = true;
    fetch('/api/public/map')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data?.success) return;
        if (data.config) setConfig(data.config);
        setPlaces(Array.isArray(data.places) ? data.places : []);
        setRouteGuides(Array.isArray(data.routeGuides) ? data.routeGuides : []);
        setParcels(Array.isArray(data.parcels) ? data.parcels : []);
      })
      .catch(() => {
        // Keep fallbackConfig cleanly
      });
    return () => {
      active = false;
    };
  }, []);

  // Lazy-initialize Leaflet only when map section is near viewport
  useEffect(() => {
    const el = mapWrapperRef.current;
    if (!el) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      setNearViewport(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const placeName = locale === 'bn' ? config.placeNameBn : config.placeNameEn;
  const mapAddress = locale === 'bn' ? config.addressBn : config.addressEn;
  const coordsText = `${Number(config.lat).toFixed(6)}, ${Number(config.lng).toFixed(6)}`;
  const plusCode = useMemo(() => encodePlusCode(config.lat, config.lng), [config.lat, config.lng]);
  const navLinks = useMemo(
    () =>
      buildNavigationLinks({
        lat: config.lat,
        lng: config.lng,
        navLat: config.navLat ?? null,
        navLng: config.navLng ?? null,
        name: placeName,
        googlePlaceUrl: config.googlePlaceUrl,
      }),
    [config.lat, config.lng, config.navLat, config.navLng, placeName, config.googlePlaceUrl]
  );

  const isAdminPreview =
    typeof window !== 'undefined' &&
    (new URLSearchParams(window.location.search).get('adminPreview') === '1' ||
      Boolean(sessionStorage.getItem('eidgah_admin_logged_in')));

  // Platform-ordered navigation items (Apple Maps first on iOS; Android geo: included on Android)
  const platform = useMemo(() => detectPlatform(), []);
  const orderedNavOptions = useMemo(() => {
    const googleDir = {
      id: 'google-dir',
      label: locale === 'bn' ? 'Google Maps দিকনির্দেশনা' : 'Google Maps Directions',
      href: navLinks.googleDirections,
      primary: platform !== 'ios',
    };
    const apple = {
      id: 'apple',
      label: locale === 'bn' ? 'Apple Maps' : 'Apple Maps',
      href: navLinks.appleMaps,
      primary: platform === 'ios',
    };
    const waze = {
      id: 'waze',
      label: 'Waze',
      href: navLinks.waze,
    };
    const androidGeo = {
      id: 'geo',
      label: locale === 'bn' ? 'ফোনের ম্যাপ অ্যাপে খুলুন (geo:)' : 'Open in Default Map App',
      href: navLinks.androidGeo,
    };
    const googlePlace = {
      id: 'google-place',
      label: locale === 'bn' ? 'Google Maps-এ স্থান দেখুন' : 'Open in Google Maps',
      href: navLinks.googlePlace,
    };
    const streetView = {
      id: 'street-view',
      label: locale === 'bn' ? 'স্ট্রিট ভিউ (Street View)' : 'Street View',
      href: navLinks.streetView,
      icon: Eye,
    };

    if (platform === 'ios') {
      return [apple, googleDir, waze, googlePlace, streetView];
    }
    if (platform === 'android') {
      return [googleDir, waze, androidGeo, googlePlace, streetView];
    }
    return [googleDir, apple, waze, googlePlace, streetView];
  }, [navLinks, platform, locale]);

  // Lazy-generate QR code PNG when QR sheet opens
  useEffect(() => {
    if (!qrSheetOpen) return;
    let cancelled = false;
    import('../utils/qrGenerator.js').then(({ renderQrToDataUrl }) => {
      if (cancelled) return;
      const url = renderQrToDataUrl(navLinks.googlePlace, { pixelSize: 280 });
      setQrDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [qrSheetOpen, navLinks.googlePlace]);

  // Distance from user location
  const distanceLabel = useMemo(() => {
    if (!userLocation) return '';
    const km = haversineDistanceKm(userLocation.lat, userLocation.lng, config.lat, config.lng);
    if (km < 1) {
      const meters = Math.round(km * 1000);
      return locale === 'bn'
        ? `প্রায় ${toBanglaNum(meters, true)} মিটার দূরে`
        : `About ${meters} m away`;
    }
    const rounded = (Math.round(km * 10) / 10).toFixed(1);
    return locale === 'bn'
      ? `প্রায় ${toBanglaNum(rounded, true)} কিমি দূরে`
      : `About ${rounded} km away`;
  }, [userLocation, config.lat, config.lng, locale, toBanglaNum]);

  const handleMyLocation = () => {
    setLocationError('');
    if (typeof window !== 'undefined' && !window.isSecureContext && window.location.hostname !== 'localhost') {
      setLocationError(
        locale === 'bn'
          ? 'অবস্থান নির্ণয়ের জন্য নিরাপদ HTTPS সংযোগ প্রয়োজন।'
          : 'Secure HTTPS connection is required to detect your location.'
      );
      return;
    }
    if (!navigator.geolocation) {
      setLocationError(
        locale === 'bn'
          ? 'আপনার ব্রাউজারে লোকেশন সুবিধা সমর্থিত নয়।'
          : 'Geolocation is not supported in this browser.'
      );
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setForceInteractive(true);
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        if (err.code === 1) {
          setLocationError(
            locale === 'bn'
              ? 'অবস্থান দেখার অনুমতি দেওয়া হয়নি। ব্রাউজার সেটিংস থেকে লোকেশন চালু করুন।'
              : 'Location permission denied. Please enable location access in browser settings.'
          );
        } else {
          setLocationError(
            locale === 'bn'
              ? 'এই মুহূর্তে আপনার অবস্থান নির্ণয় করা যায়নি।'
              : 'Unable to determine your location right now.'
          );
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleShareMap = async () => {
    const shareUrl = `${window.location.origin}/map`;
    const shareText =
      locale === 'bn'
        ? `${placeName} — মানচিত্র ও পথনির্দেশনা`
        : `${placeName} — Map & Directions`;

    if (navigator.share) {
      try {
        await navigator.share({ title: placeName, text: shareText, url: shareUrl });
        return;
      } catch {
        // User cancelled or in-app browser blocked share
      }
    }
    const ok = await copyTextSafe(shareUrl);
    showToast?.(
      ok
        ? locale === 'bn'
          ? 'মানচিত্রের লিংক কপি হয়েছে'
          : 'Map link copied'
        : locale === 'bn'
          ? 'লিংক কপি করা যায়নি'
          : 'Could not copy link'
    );
  };

  const handleCopyValue = async (val, labelBn, labelEn) => {
    const ok = await copyTextSafe(val);
    showToast?.(
      ok
        ? locale === 'bn'
          ? `${labelBn} কপি হয়েছে`
          : `${labelEn} copied`
        : locale === 'bn'
          ? 'কপি করা যায়নি'
          : 'Could not copy'
    );
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = 'manikpur-eidgah-map-qr.png';
    link.click();
  };

  const handlePrintQrPoster = () => {
    if (!qrDataUrl) return;
    const win = window.open('', '_blank', 'width=640,height=820');
    if (!win) {
      window.print();
      return;
    }
    win.document.write(`<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8" />
  <title>${placeName} — QR</title>
  <style>
    body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: rgb(251, 248, 241); color: rgb(31, 45, 42); }
    .poster { text-align: center; background: white; border: 2px solid rgb(201, 162, 75); border-radius: 20px; padding: 36px 32px; max-width: 420px; }
    h1 { color: rgb(27, 94, 69); margin: 0 0 6px; font-size: 26px; }
    p { margin: 4px 0 18px; color: rgb(85, 102, 95); font-size: 14px; }
    img { width: 260px; height: 260px; display: block; margin: 0 auto 16px; }
    .code { font-family: monospace; font-size: 13px; color: rgb(27, 94, 69); font-weight: 700; }
  </style>
</head>
<body>
  <div class="poster">
    <h1>${placeName}</h1>
    <p>${locale === 'bn' ? 'Google Maps-এ অবস্থান দেখতে QR কোড স্ক্যান করুন' : 'Scan the QR code to open location in Google Maps'}</p>
    <img src="${qrDataUrl}" alt="${placeName} QR Code" />
    <div class="code">${coordsText} &bull; ${plusCode}</div>
  </div>
  <script>window.onload = function(){ window.print(); };</script>
</body>
</html>`);
    win.document.close();
  };

  // Visible places & landmarks
  const visiblePlaces = useMemo(
    () => places.filter((p) => (locale === 'en' ? Boolean(getLocalized(p, 'name')) : true)),
    [places, locale, getLocalized]
  );

  const availableCategories = useMemo(() => {
    const set = new Set(visiblePlaces.map((p) => p.category));
    return Array.from(set);
  }, [visiblePlaces]);

  const landmarks = useMemo(
    () => visiblePlaces.filter((p) => p.category === 'LANDMARK'),
    [visiblePlaces]
  );

  const visibleRoutes = useMemo(
    () => routeGuides.filter((r) => (locale === 'en' ? Boolean(getLocalized(r, 'fromName')) : true)),
    [routeGuides, locale, getLocalized]
  );

  const showInteractiveMap = nearViewport && (!lowDataMode || forceInteractive);
  const previewImageUrl = config.staticPreview ? getImageUrl(config.staticPreview) : '';

  // JSON-LD PlaceOfWorship with geo coordinates and name only (no contact/bank duplication)
  const mapJsonLd = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'PlaceOfWorship',
      name: placeName,
      alternateName: locale === 'bn' ? config.placeNameEn : config.placeNameBn,
      geo: {
        '@type': 'GeoCoordinates',
        latitude: Number(config.lat),
        longitude: Number(config.lng),
      },
    }),
    [placeName, locale, config.placeNameEn, config.placeNameBn, config.lat, config.lng]
  );

  return (
    <div className="py-4 sm:py-6 page-enter">
      <SEO
        title={locale === 'bn' ? 'মানচিত্র ও পথ' : 'Map & Directions'}
        description={
          locale === 'bn'
            ? 'মানিকপুর ঈদগাহের অবস্থান, সীমানা, আশেপাশের স্থান এবং পৌঁছানোর দিকনির্দেশনা।'
            : 'Interactive map, boundary, nearby places, and directions to Manikpur Eidgah.'
        }
        image={previewImageUrl || undefined}
        url="/map"
        jsonLd={mapJsonLd}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <Breadcrumb items={[{ label: locale === 'bn' ? 'মানচিত্র ও পথ' : 'Map & Directions' }]} />

        {/* Page Title Once */}
        <header className="space-y-0.5">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-primary-dark tracking-tight">
            {locale === 'bn' ? 'মানচিত্র ও পথ' : 'Map & Directions'}
          </h1>
          {mapAddress && (
            <p className="text-xs sm:text-sm text-ink-muted">{mapAddress}</p>
          )}
        </header>

        {/* Admin Preview Warning when location is Not set or Needs review */}
        {isAdminPreview && config.locationStatus && config.locationStatus !== 'set' && (
          <div
            role="status"
            className="rounded-xl bg-warning-soft border border-warning/35 p-3 text-xs font-semibold text-warning flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>
              {config.locationStatus === 'not_set'
                ? locale === 'bn'
                  ? 'অ্যাডমিন বিজ্ঞপ্তি: মানচিত্রের অবস্থান নির্ধারিত নয় (Not set)। সেটিংস > মানচিত্র থেকে পিন বসান।'
                  : 'Admin preview: Map location is Not set. Set the pin in Admin Settings > Map.'
                : locale === 'bn'
                  ? 'অ্যাডমিন বিজ্ঞপ্তি: পিনের অবস্থান এখনও যাচাই করা হয়নি (Needs review)। সেটিংস > মানচিত্র থেকে নিশ্চিত করুন।'
                  : 'Admin preview: Map pin Needs review. Verify the pin on the Eidgah ground in Admin Settings > Map.'}
            </span>
          </div>
        )}

        {/* Accessible text alternative for screen readers */}
        <p className="sr-only">
          {placeName}. {mapAddress ? `${mapAddress}. ` : ''}
          {locale === 'bn' ? 'স্থানাঙ্ক:' : 'Coordinates:'} {coordsText}. Plus Code: {plusCode}.
        </p>

        {/* Full-Width Map Container (55-60vh on mobile, fixed height, no CLS) */}
        <section
          ref={mapWrapperRef}
          aria-label={locale === 'bn' ? 'মানিকপুর ঈদগাহ মানচিত্র' : 'Manikpur Eidgah Map'}
          className="w-full h-[58vh] min-h-[340px] max-h-[560px] rounded-2xl overflow-hidden relative"
        >
          {showInteractiveMap ? (
            <Suspense
              fallback={
                <div className="w-full h-full rounded-2xl border border-sand skeleton-shimmer flex items-center justify-center">
                  <span className="text-xs font-semibold text-primary-dark bg-surface/90 px-3 py-1.5 rounded-full border border-sand">
                    {locale === 'bn' ? 'মানচিত্র লোড হচ্ছে...' : 'Loading map...'}
                  </span>
                </div>
              }
            >
              <InteractiveLeafletMap
                config={config}
                places={visiblePlaces}
                parcels={parcels}
                selectedCategory={selectedCategory}
                userLocation={userLocation}
                focusCoords={focusCoords}
                locale={locale}
                toBanglaNum={toBanglaNum}
                getLocalized={getLocalized}
                onOpenNavigate={() => setNavSheetOpen(true)}
                onSelectParcel={setSelectedParcel}
              />
            </Suspense>
          ) : (
            <div className="w-full h-full rounded-2xl border border-sand bg-canvas-alt relative flex flex-col items-center justify-center p-6 text-center overflow-hidden">
              {previewImageUrl && (
                <img
                  src={previewImageUrl}
                  alt={placeName}
                  className="absolute inset-0 w-full h-full object-cover opacity-85"
                />
              )}
              <div className="relative z-10 bg-surface/95 border border-sand rounded-2xl p-4 shadow-sakinah-card max-w-xs space-y-2.5">
                <MapIcon className="w-7 h-7 text-primary mx-auto" aria-hidden="true" />
                <p className="font-serif font-bold text-base text-primary-dark">{placeName}</p>
                <p className="text-xs text-ink-muted font-mono">{coordsText}</p>
                <button
                  type="button"
                  onClick={() => {
                    setNearViewport(true);
                    setForceInteractive(true);
                  }}
                  className="w-full px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-bold min-h-[44px] tap-feedback"
                >
                  {locale === 'bn'
                    ? 'ইন্টারেক্টিভ মানচিত্র লোড করুন'
                    : 'Tap to load interactive map'}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* POI Category Filter Chips (shown only when POIs exist) */}
        {availableCategories.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
            <button
              type="button"
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border min-h-[36px] whitespace-nowrap transition-colors ${
                selectedCategory === 'ALL'
                  ? 'bg-primary text-white border-primary'
                  : 'bg-surface text-primary-dark border-sand hover:bg-primary-soft/50'
              }`}
            >
              {locale === 'bn' ? 'সব স্থান' : 'All Places'}
            </button>
            {availableCategories.map((cat) => {
              const meta = MAP_PLACE_CATEGORIES[cat] || MAP_PLACE_CATEGORIES.OTHER;
              const Icon = meta.icon;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border min-h-[36px] whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? 'bg-primary text-white border-primary'
                      : 'bg-surface text-primary-dark border-sand hover:bg-primary-soft/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{meta[locale] || meta.en}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Primary Action: Navigate + Secondary Actions Row */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => setNavSheetOpen(true)}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm sm:text-base font-bold shadow-sakinah-sm min-h-[48px] tap-feedback"
          >
            <Navigation className="w-4 h-4" aria-hidden="true" />
            <span>{locale === 'bn' ? 'দিকনির্দেশনা (Navigate)' : 'Navigate'}</span>
          </button>

          {/* Secondary Actions: My Location, Share, Copy, QR */}
          <div className="grid grid-cols-4 gap-2">
            <button
              type="button"
              onClick={handleMyLocation}
              disabled={locating}
              className="flex flex-col items-center justify-center gap-1 py-2.5 px-1.5 rounded-xl bg-surface border border-sand hover:bg-primary-soft/40 text-primary-dark text-[11px] sm:text-xs font-bold min-h-[54px] tap-feedback disabled:opacity-60"
            >
              <LocateFixed className="w-4 h-4 text-primary" aria-hidden="true" />
              <span className="truncate max-w-full">
                {locating
                  ? locale === 'bn'
                    ? 'খুঁজছি...'
                    : 'Locating...'
                  : locale === 'bn'
                    ? 'আমার অবস্থান'
                    : 'My location'}
              </span>
            </button>

            <button
              type="button"
              onClick={handleShareMap}
              className="flex flex-col items-center justify-center gap-1 py-2.5 px-1.5 rounded-xl bg-surface border border-sand hover:bg-primary-soft/40 text-primary-dark text-[11px] sm:text-xs font-bold min-h-[54px] tap-feedback"
            >
              <Share2 className="w-4 h-4 text-primary" aria-hidden="true" />
              <span className="truncate max-w-full">
                {locale === 'bn' ? 'শেয়ার' : 'Share'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setCopySheetOpen(true)}
              className="flex flex-col items-center justify-center gap-1 py-2.5 px-1.5 rounded-xl bg-surface border border-sand hover:bg-primary-soft/40 text-primary-dark text-[11px] sm:text-xs font-bold min-h-[54px] tap-feedback"
            >
              <Copy className="w-4 h-4 text-primary" aria-hidden="true" />
              <span className="truncate max-w-full">
                {locale === 'bn' ? 'কপি' : 'Copy'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setQrSheetOpen(true)}
              className="flex flex-col items-center justify-center gap-1 py-2.5 px-1.5 rounded-xl bg-surface border border-sand hover:bg-primary-soft/40 text-primary-dark text-[11px] sm:text-xs font-bold min-h-[54px] tap-feedback"
            >
              <QrCode className="w-4 h-4 text-primary" aria-hidden="true" />
              <span className="truncate max-w-full">
                {locale === 'bn' ? 'QR কোড' : 'QR'}
              </span>
            </button>
          </div>
        </div>

        {/* Distance Banner (shown after My Location tap) */}
        {distanceLabel && (
          <div
            role="status"
            aria-live="polite"
            className="rounded-xl bg-primary-soft/70 border border-primary/25 p-3.5 flex flex-wrap items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2 text-sm font-bold text-primary-dark">
              <LocateFixed className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
              <span>{distanceLabel}</span>
            </div>
            <button
              type="button"
              onClick={() => setNavSheetOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-primary text-white text-xs font-bold min-h-[40px] tap-feedback"
            >
              {locale === 'bn' ? 'এখান থেকে পথ দেখুন' : 'Get directions from here'}
            </button>
          </div>
        )}

        {/* Geolocation Error Banner */}
        {locationError && (
          <div
            role="alert"
            className="rounded-xl bg-warning-soft border border-warning/30 p-3 text-xs text-ink flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 text-warning shrink-0" aria-hidden="true" />
            <span>{locationError}</span>
          </div>
        )}

        {/* Accessible Places List (collapsed by default, hidden if empty) */}
        {visiblePlaces.length > 0 && (
          <section className="rounded-2xl bg-surface border border-sand overflow-hidden shadow-sakinah-sm">
            <button
              type="button"
              onClick={() => setPlacesListOpen((v) => !v)}
              aria-expanded={placesListOpen}
              className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left min-h-[52px] hover:bg-canvas-alt/60 transition-colors"
            >
              <span className="font-serif font-bold text-base text-primary-dark flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" aria-hidden="true" />
                <span>
                  {locale === 'bn'
                    ? `গুরুত্বপূর্ণ স্থানসমূহ (${toBanglaNum(visiblePlaces.length, true)})`
                    : `Places of Interest (${visiblePlaces.length})`}
                </span>
              </span>
              <ChevronDown
                className={`w-4 h-4 text-ink-muted transition-transform ${
                  placesListOpen ? 'rotate-180' : ''
                }`}
                aria-hidden="true"
              />
            </button>

            {placesListOpen && (
              <div className="divide-y divide-sand border-t border-sand">
                {visiblePlaces.map((p) => {
                  const pName = getLocalized(p, 'name');
                  const pNote = getLocalized(p, 'note');
                  const cat = MAP_PLACE_CATEGORIES[p.category] || MAP_PLACE_CATEGORIES.OTHER;
                  const CatIcon = cat.icon;
                  const pNav = buildNavigationLinks({ lat: p.lat, lng: p.lng, name: pName });
                  return (
                    <div
                      key={p.id}
                      className="px-4 py-3 flex items-center justify-between gap-3"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setForceInteractive(true);
                          setFocusCoords({ lat: p.lat, lng: p.lng, ts: Date.now() });
                          mapWrapperRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                        className="flex items-start gap-2.5 min-w-0 flex-1 text-left"
                      >
                        <span className="w-8 h-8 rounded-lg bg-primary-soft text-primary flex items-center justify-center shrink-0 mt-0.5">
                          <CatIcon className="w-4 h-4" aria-hidden="true" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-bold text-primary-dark truncate">
                            {pName}
                          </span>
                          <span className="block text-[11px] text-gold-text font-semibold">
                            {cat[locale] || cat.en}
                          </span>
                          {pNote && (
                            <span className="block text-xs text-ink-muted mt-0.5 line-clamp-2">
                              {pNote}
                            </span>
                          )}
                        </span>
                      </button>

                      <a
                        href={pNav.googleDirections}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 rounded-xl bg-canvas-alt border border-sand text-xs font-bold text-primary-dark hover:bg-primary-soft min-h-[40px] inline-flex items-center gap-1 shrink-0"
                      >
                        <span>{locale === 'bn' ? 'যান' : 'Go'}</span>
                        <ExternalLink className="w-3 h-3" aria-hidden="true" />
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* "How to reach" (পথ) Accordion (collapsed by default; hidden completely if empty) */}
        {(visibleRoutes.length > 0 || landmarks.length > 0) && (
          <section className="rounded-2xl bg-surface border border-sand overflow-hidden shadow-sakinah-sm">
            <button
              type="button"
              onClick={() => setRoutesOpen((v) => !v)}
              aria-expanded={routesOpen}
              className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left min-h-[52px] hover:bg-canvas-alt/60 transition-colors"
            >
              <span className="font-serif font-bold text-base text-primary-dark flex items-center gap-2">
                <Compass className="w-4 h-4 text-primary" aria-hidden="true" />
                <span>{locale === 'bn' ? 'কীভাবে পৌঁছাবেন (পথ)' : 'How to Reach'}</span>
              </span>
              <ChevronDown
                className={`w-4 h-4 text-ink-muted transition-transform ${
                  routesOpen ? 'rotate-180' : ''
                }`}
                aria-hidden="true"
              />
            </button>

            {routesOpen && (
              <div className="border-t border-sand p-4 space-y-4">
                {visibleRoutes.length > 0 && (
                  <div className="space-y-3">
                    {visibleRoutes.map((r) => {
                      const fromName = getLocalized(r, 'fromName');
                      const notes = getLocalized(r, 'notes');
                      const transports = Array.isArray(r.transports) ? r.transports : [];
                      return (
                        <div
                          key={r.id}
                          className="rounded-xl bg-canvas-alt border border-sand p-3.5 space-y-2"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h3 className="font-serif font-bold text-base text-primary-dark">
                              {fromName}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-ink-muted">
                              {r.approxMinutes && (
                                <span className="inline-flex items-center gap-1 tabular-nums">
                                  <Clock className="w-3.5 h-3.5 text-gold-text" aria-hidden="true" />
                                  <span>
                                    {locale === 'bn'
                                      ? `~${toBanglaNum(r.approxMinutes, true)} মিনিট`
                                      : `~${r.approxMinutes} min`}
                                  </span>
                                </span>
                              )}
                              {r.approxFare && (
                                <span className="inline-flex items-center gap-1">
                                  <Banknote className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                                  <span>{r.approxFare}</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {transports.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {transports.map((tr) => {
                                const meta = ROUTE_TRANSPORTS[tr];
                                if (!meta) return null;
                                const TIcon = meta.icon;
                                return (
                                  <span
                                    key={tr}
                                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary-soft text-primary-dark text-xs font-semibold"
                                  >
                                    <TIcon className="w-3 h-3" aria-hidden="true" />
                                    <span>{meta[locale] || meta.en}</span>
                                  </span>
                                );
                              })}
                            </div>
                          )}

                          {notes && (
                            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed whitespace-pre-line">
                              {notes}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {landmarks.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-sand">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gold-text">
                      {locale === 'bn' ? 'ঈদগাহের নিকটবর্তী পরিচিত স্থান' : 'Landmarks near the Eidgah'}
                    </h3>
                    <ul className="space-y-1.5 text-sm text-ink">
                      {landmarks.map((lm) => (
                        <li key={lm.id} className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden="true" />
                          <span>{getLocalized(lm, 'name')}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </section>
        )}
      </div>

      {/* Navigate Bottom Sheet (Centered Dialog on Desktop) */}
      <BottomSheet
        isOpen={navSheetOpen}
        onClose={() => setNavSheetOpen(false)}
        title={locale === 'bn' ? 'দিকনির্দেশনা বেছে নিন' : 'Choose Navigation App'}
        subtitle={placeName}
      >
        <div className="space-y-2.5 pb-safe">
          {orderedNavOptions.map((opt) => {
            const Icon = opt.icon || Navigation;
            return (
              <a
                key={opt.id}
                href={opt.href}
                target={opt.href.startsWith('geo:') ? undefined : '_blank'}
                rel="noopener noreferrer"
                onClick={() => setNavSheetOpen(false)}
                className={`w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl border text-sm font-bold min-h-[48px] tap-feedback transition-colors ${
                  opt.primary
                    ? 'bg-primary text-white border-primary hover:bg-primary-hover'
                    : 'bg-canvas-alt text-primary-dark border-sand hover:bg-primary-soft/60'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{opt.label}</span>
                </span>
                <ExternalLink className="w-4 h-4 opacity-75 shrink-0" aria-hidden="true" />
              </a>
            );
          })}
        </div>
      </BottomSheet>

      {/* Copy Coordinates & Plus Code Sheet */}
      <BottomSheet
        isOpen={copySheetOpen}
        onClose={() => setCopySheetOpen(false)}
        title={locale === 'bn' ? 'স্থানাঙ্ক ও প্লাস কোড কপি' : 'Copy Coordinates & Plus Code'}
      >
        <div className="space-y-3 pb-safe">
          <div className="rounded-xl bg-canvas-alt border border-sand p-3.5 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="block text-[11px] font-bold text-ink-muted uppercase">
                {locale === 'bn' ? 'স্থানাঙ্ক (Lat, Lng)' : 'Coordinates'}
              </span>
              <span className="block font-mono text-sm font-bold text-primary-dark select-all">
                {coordsText}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleCopyValue(coordsText, 'স্থানাঙ্ক', 'Coordinates')}
              className="px-3.5 py-2 rounded-xl bg-primary text-white text-xs font-bold min-h-[44px] inline-flex items-center gap-1.5 shrink-0 tap-feedback"
            >
              <Copy className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{locale === 'bn' ? 'কপি' : 'Copy'}</span>
            </button>
          </div>

          <div className="rounded-xl bg-canvas-alt border border-sand p-3.5 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="block text-[11px] font-bold text-ink-muted uppercase">
                Plus Code (Open Location Code)
              </span>
              <span className="block font-mono text-sm font-bold text-primary-dark select-all">
                {plusCode}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleCopyValue(plusCode, 'প্লাস কোড', 'Plus Code')}
              className="px-3.5 py-2 rounded-xl bg-primary text-white text-xs font-bold min-h-[44px] inline-flex items-center gap-1.5 shrink-0 tap-feedback"
            >
              <Copy className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{locale === 'bn' ? 'কপি' : 'Copy'}</span>
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* Lazy-Loaded QR Code Sheet with PNG Download & Print Poster */}
      <BottomSheet
        isOpen={qrSheetOpen}
        onClose={() => setQrSheetOpen(false)}
        title={locale === 'bn' ? 'অবস্থানের QR কোড' : 'Location QR Code'}
        subtitle={placeName}
      >
        <div className="flex flex-col items-center text-center space-y-4 pb-safe">
          <div className="p-4 rounded-2xl bg-white border border-gold/60 shadow-sakinah-sm">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`${placeName} QR Code`}
                className="w-56 h-56 object-contain"
              />
            ) : (
              <div className="w-56 h-56 skeleton-shimmer rounded-xl" />
            )}
          </div>
          <p className="text-xs text-ink-muted max-w-xs">
            {locale === 'bn'
              ? 'ফোনের ক্যামেরা দিয়ে স্ক্যান করলে সরাসরি Google Maps-এ মানিকপুর ঈদগাহের অবস্থান খুলবে।'
              : 'Scan with a phone camera to open Manikpur Eidgah directly in Google Maps.'}
          </p>
          <div className="flex flex-wrap gap-2 w-full">
            <button
              type="button"
              onClick={handleDownloadQr}
              disabled={!qrDataUrl}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-white text-xs sm:text-sm font-bold min-h-[44px] tap-feedback disabled:opacity-50"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              <span>{locale === 'bn' ? 'PNG ডাউনলোড' : 'Download PNG'}</span>
            </button>
            <button
              type="button"
              onClick={handlePrintQrPoster}
              disabled={!qrDataUrl}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-canvas-alt border border-sand text-primary-dark text-xs sm:text-sm font-bold min-h-[44px] tap-feedback disabled:opacity-50"
            >
              <Printer className="w-4 h-4" aria-hidden="true" />
              <span>{locale === 'bn' ? 'পোস্টার প্রিন্ট' : 'Print Poster'}</span>
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* Land Donor Detail Sheet when tapping a Parcel polygon */}
      <LandDonorDetailSheet
        donor={selectedParcel}
        isOpen={Boolean(selectedParcel)}
        onClose={() => setSelectedParcel(null)}
        conversionFactors={config.conversionFactors}
        locale={locale}
        toBanglaNum={toBanglaNum}
        formatDate={formatDate}
        getLocalized={getLocalized}
        copied={parcelCopied}
        onShare={async (donor) => {
          const dName = getLocalized(donor, 'name');
          const honorific = getHonorificPrefix(dName, donor.isDeceased, locale);
          const fullName = honorific ? `${honorific} ${dName}` : dName;
          const area = formatAreaPlate(donor.areaValue, donor.areaUnit, locale, toBanglaNum);
          const text =
            locale === 'bn'
              ? `${fullName} — দানকৃত জমি: ${area.full}`
              : `${fullName} — Donated land: ${area.full}`;
          const ok = await copyTextSafe(`${text}\n${window.location.origin}/land-donors`);
          if (ok) {
            setParcelCopied(true);
            setTimeout(() => setParcelCopied(false), 2000);
          }
        }}
      />
    </div>
  );
}
