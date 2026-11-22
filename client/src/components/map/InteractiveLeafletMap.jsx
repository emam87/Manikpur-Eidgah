import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Maximize2,
  Minimize2,
  Layers,
  MapPin,
  Pentagon,
  Grid,
  Plus,
  Minus,
  Crosshair,
} from 'lucide-react';
import {
  MAP_TILE_CONFIG,
  MAP_PLACE_CATEGORIES,
  computePolygonAreaSqM,
  sqMetersToDecimal,
  buildNavigationLinks,
} from '../../utils/mapUtils.js';
import { getImageUrl } from '../../utils/imageUrl.js';
import { formatAreaPlate, getHonorificPrefix } from '../../utils/landDonorHelpers.js';

const STORAGE_LAYER_KEY = 'eidgah_map_base_layer';
const STORAGE_OVERLAY_KEY = 'eidgah_map_overlays';

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getCssToken(varName, fallbackRgb) {
  if (typeof window === 'undefined') return fallbackRgb;
  const val = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return val || fallbackRgb;
}

function createEidgahMarkerIcon() {
  return L.divIcon({
    className: 'eidgah-custom-pin',
    iconSize: [38, 46],
    iconAnchor: [19, 44],
    popupAnchor: [0, -40],
    html: `<div style="width:38px;height:38px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:var(--primary);border:2.5px solid var(--gold);box-shadow:0 4px 12px rgba(27,94,69,0.35);display:flex;align-items:center;justify-content:center;">
      <svg style="transform:rotate(45deg);width:18px;height:18px;color:white;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 3C8.5 6 6.5 9 6.5 13v7h11v-7c0-4-2-7-5.5-10Z"/>
        <path d="M4 20h16"/>
      </svg>
    </div>`,
  });
}

function createPoiIcon(category) {
  const colorMap = {
    EIDGAH_GROUND: 'var(--primary)',
    ENTRANCE: 'var(--gold-text)',
    PARKING: 'var(--chart-series-5)',
    WUDU: 'var(--chart-series-5)',
    GRAVEYARD: 'var(--sage-deep)',
    MOSQUE: 'var(--primary-dark)',
    POND: 'var(--chart-series-5)',
    LANDMARK: 'var(--terracotta)',
    OTHER: 'var(--primary)',
  };
  const bg = colorMap[category] || 'var(--primary)';
  return L.divIcon({
    className: 'eidgah-poi-pin',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
    html: `<div style="width:28px;height:28px;border-radius:9999px;background:${bg};border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.28);display:flex;align-items:center;justify-content:center;">
      <span style="width:8px;height:8px;border-radius:9999px;background:white;"></span>
    </div>`,
  });
}

function createClusterIcon(count, locale, toBanglaNum) {
  const label = locale === 'bn' ? toBanglaNum(count, true) : String(count);
  return L.divIcon({
    className: 'eidgah-cluster-pin',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    html: `<div style="width:34px;height:34px;border-radius:9999px;background:var(--primary-dark);color:white;border:2px solid var(--gold);box-shadow:0 3px 10px rgba(0,0,0,0.28);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;">${escapeHtml(label)}</div>`,
  });
}

export function InteractiveLeafletMap({
  config,
  places = [],
  parcels = [],
  selectedCategory = 'ALL',
  userLocation = null,
  focusCoords = null,
  locale = 'bn',
  toBanglaNum = (v) => String(v),
  getLocalized,
  onOpenNavigate,
  onSelectParcel,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const baseLayerRef = useRef(null);
  const boundaryLayerRef = useRef(null);
  const poiLayerRef = useRef(null);
  const parcelLayerRef = useRef(null);
  const userLayerRef = useRef(null);
  const gestureHintTimerRef = useRef(null);

  const satelliteAvailable = Boolean(config?.satelliteEnabled && MAP_TILE_CONFIG.satelliteUrl);

  const [baseLayerType, setBaseLayerType] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_LAYER_KEY);
      if (saved === 'satellite' && satelliteAvailable) return 'satellite';
    } catch {
      // ignore
    }
    return 'map';
  });

  const [overlays, setOverlays] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_OVERLAY_KEY) || '{}');
      return {
        boundary: saved.boundary !== undefined ? Boolean(saved.boundary) : true,
        places: saved.places !== undefined ? Boolean(saved.places) : true,
        parcels: saved.parcels !== undefined ? Boolean(saved.parcels) : false,
      };
    } catch {
      return { boundary: true, places: true, parcels: false };
    }
  });

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [gestureHint, setGestureHint] = useState('');
  const [zoomLevel, setZoomLevel] = useState(config?.zoom || 17);

  // Persist visitor layer/overlay preferences
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_LAYER_KEY, baseLayerType);
    } catch {
      // ignore
    }
  }, [baseLayerType]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_OVERLAY_KEY, JSON.stringify(overlays));
    } catch {
      // ignore
    }
  }, [overlays]);

  // Close fullscreen on Escape or Android Back button
  useEffect(() => {
    if (!isFullscreen) return undefined;
    let pushed = true;
    try {
      window.history.pushState({ mapFullscreen: true }, '');
    } catch {
      pushed = false;
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    const onPop = () => {
      if (pushed) {
        pushed = false;
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('popstate', onPop);
      if (pushed && window.history.state?.mapFullscreen) {
        try {
          window.history.back();
        } catch {
          // ignore
        }
      }
    };
  }, [isFullscreen]);

  // Invalidate map size when fullscreen toggles
  useEffect(() => {
    if (mapRef.current) {
      const t = setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 120);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [isFullscreen]);

  const showHint = (msg) => {
    setGestureHint(msg);
    if (gestureHintTimerRef.current) clearTimeout(gestureHintTimerRef.current);
    gestureHintTimerRef.current = setTimeout(() => setGestureHint(''), 2000);
  };

  // Initialize Leaflet map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return undefined;

    const isTouch =
      typeof window !== 'undefined' &&
      ('ontouchstart' in window || navigator.maxTouchPoints > 0);

    const map = L.map(containerRef.current, {
      center: [config.lat, config.lng],
      zoom: config.zoom || 17,
      zoomControl: false,
      scrollWheelZoom: false,
      dragging: !isTouch,
      tap: false,
    });

    // Scale bar
    L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);

    // Track zoom for lightweight clustering
    map.on('zoomend', () => {
      setZoomLevel(map.getZoom());
    });

    // Main Eidgah Marker
    const placeName = locale === 'bn' ? config.placeNameBn : config.placeNameEn;
    const marker = L.marker([config.lat, config.lng], {
      icon: createEidgahMarkerIcon(),
      title: placeName,
    }).addTo(map);

    const popupContainer = document.createElement('div');
    popupContainer.style.minWidth = '170px';
    popupContainer.style.textAlign = 'center';
    popupContainer.innerHTML = `
      <div style="font-weight:700;font-size:14px;margin-bottom:8px;">${escapeHtml(placeName)}</div>
      <button type="button" data-eidgah-nav="1" style="background:var(--primary);color:white;border:none;border-radius:10px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;min-height:36px;width:100%;">
        ${escapeHtml(locale === 'bn' ? 'দিকনির্দেশনা' : 'Navigate')}
      </button>
    `;
    popupContainer.querySelector('[data-eidgah-nav="1"]')?.addEventListener('click', () => {
      onOpenNavigate?.();
    });
    marker.bindPopup(popupContainer);

    // Anti-scroll-trap handlers: 2-finger pan on touch, Ctrl+scroll on desktop
    const el = containerRef.current;
    const onTouchStart = (e) => {
      if (e.touches.length >= 2) {
        map.dragging.enable();
      } else {
        map.dragging.disable();
      }
    };
    const onTouchMove = (e) => {
      if (e.touches.length === 1) {
        showHint(
          locale === 'bn'
            ? 'মানচিত্র সরাতে দুই আঙুল ব্যবহার করুন'
            : 'Use two fingers to move the map'
        );
      }
    };
    const onTouchEnd = () => {
      if (isTouch) map.dragging.disable();
    };
    const onWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        if (e.deltaY < 0) map.zoomIn();
        else map.zoomOut();
      } else {
        showHint(
          locale === 'bn'
            ? 'জুম করতে Ctrl + স্ক্রল ব্যবহার করুন'
            : 'Use Ctrl + scroll to zoom the map'
        );
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('wheel', onWheel, { passive: false });

    mapRef.current = map;

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('wheel', onWheel);
      if (gestureHintTimerRef.current) clearTimeout(gestureHintTimerRef.current);
      map.remove();
      mapRef.current = null;
    };
  }, [config.lat, config.lng, config.zoom, config.placeNameBn, config.placeNameEn, locale]);

  // Base tile layer switcher (Map / Satellite)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (baseLayerRef.current) {
      map.removeLayer(baseLayerRef.current);
      baseLayerRef.current = null;
    }

    const useSat = baseLayerType === 'satellite' && satelliteAvailable;
    const url = useSat ? MAP_TILE_CONFIG.satelliteUrl : MAP_TILE_CONFIG.osmUrl;
    const attribution = useSat
      ? MAP_TILE_CONFIG.satelliteAttribution
      : MAP_TILE_CONFIG.osmAttribution;

    baseLayerRef.current = L.tileLayer(url, {
      attribution,
      maxZoom: 19,
    }).addTo(map);
  }, [baseLayerType, satelliteAvailable]);

  // Boundary GeoJSON overlay
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (boundaryLayerRef.current) {
      map.removeLayer(boundaryLayerRef.current);
      boundaryLayerRef.current = null;
    }

    if (!overlays.boundary || !config?.boundaryGeoJson) return;

    try {
      const sqM = computePolygonAreaSqM(config.boundaryGeoJson);
      const decimals = sqMetersToDecimal(sqM, config.conversionFactors?.sqft || 435.6);
      const sqMStr =
        locale === 'bn'
          ? toBanglaNum(Math.round(sqM).toLocaleString('en-US'), true)
          : Math.round(sqM).toLocaleString('en-US');
      const decStr =
        locale === 'bn'
          ? toBanglaNum((Math.round(decimals * 10) / 10).toString(), true)
          : String(Math.round(decimals * 10) / 10);

      const areaLabel =
        locale === 'bn'
          ? `ঈদগাহ সীমানা • ${sqMStr} বর্গমি. (${decStr} শতাংশ)`
          : `Eidgah Boundary • ${sqMStr} sq m (${decStr} decimal)`;

      const layer = L.geoJSON(config.boundaryGeoJson, {
        style: {
          color: getCssToken('--gold', 'rgb(201, 162, 75)'),
          weight: 2,
          fillColor: getCssToken('--primary', 'rgb(36, 122, 89)'),
          fillOpacity: 0.18,
        },
      }).addTo(map);

      if (sqM > 0) {
        layer.bindTooltip(areaLabel, {
          direction: 'center',
          sticky: false,
          opacity: 0.92,
        });
      }

      boundaryLayerRef.current = layer;
    } catch {
      // Ignore malformed boundary GeoJSON
    }
  }, [overlays.boundary, config?.boundaryGeoJson, config?.conversionFactors, locale, toBanglaNum]);

  // Filtered POIs
  const filteredPlaces = useMemo(() => {
    return (places || []).filter((p) => {
      if (locale === 'en' && !getLocalized(p, 'name')) return false;
      if (selectedCategory && selectedCategory !== 'ALL' && p.category !== selectedCategory) {
        return false;
      }
      return Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lng));
    });
  }, [places, selectedCategory, locale, getLocalized]);

  // Places (POI) overlay with lightweight grid clustering when many markers at low zoom
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (poiLayerRef.current) {
      map.removeLayer(poiLayerRef.current);
      poiLayerRef.current = null;
    }

    if (!overlays.places || filteredPlaces.length === 0) return;

    const group = L.layerGroup();
    const shouldCluster = filteredPlaces.length > 10 && zoomLevel < 17;

    if (shouldCluster) {
      const cellDeg = zoomLevel < 15 ? 0.004 : 0.0015;
      const buckets = new Map();
      filteredPlaces.forEach((p) => {
        const key = `${Math.floor(p.lat / cellDeg)}:${Math.floor(p.lng / cellDeg)}`;
        if (!buckets.has(key)) buckets.set(key, []);
        buckets.get(key).push(p);
      });

      buckets.forEach((items) => {
        if (items.length === 1) {
          addSinglePoiMarker(items[0], group);
        } else {
          const avgLat = items.reduce((s, p) => s + p.lat, 0) / items.length;
          const avgLng = items.reduce((s, p) => s + p.lng, 0) / items.length;
          const cm = L.marker([avgLat, avgLng], {
            icon: createClusterIcon(items.length, locale, toBanglaNum),
          });
          cm.on('click', () => {
            map.setView([avgLat, avgLng], Math.min(18, map.getZoom() + 2));
          });
          cm.addTo(group);
        }
      });
    } else {
      filteredPlaces.forEach((p) => addSinglePoiMarker(p, group));
    }

    function addSinglePoiMarker(p, targetGroup) {
      const pName = getLocalized(p, 'name');
      const pNote = getLocalized(p, 'note');
      const catMeta = MAP_PLACE_CATEGORIES[p.category] || MAP_PLACE_CATEGORIES.OTHER;
      const catLabel = catMeta[locale] || catMeta.en;
      const nav = buildNavigationLinks({ lat: p.lat, lng: p.lng, name: pName });
      const photoUrl = p.photoKey ? getImageUrl(p.photoKey) : '';

      const m = L.marker([p.lat, p.lng], {
        icon: createPoiIcon(p.category),
        title: pName,
      });

      const html = `
        <div style="min-width:180px;max-width:240px;">
          ${
            photoUrl
              ? `<img src="${escapeHtml(photoUrl)}" alt="${escapeHtml(pName)}" style="width:100%;height:96px;object-fit:cover;border-radius:8px;margin-bottom:6px;" loading="lazy" />`
              : ''
          }
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--gold-text);margin-bottom:2px;">${escapeHtml(catLabel)}</div>
          <div style="font-weight:700;font-size:14px;margin-bottom:4px;">${escapeHtml(pName)}</div>
          ${pNote ? `<p style="font-size:12px;opacity:0.85;margin:0 0 8px 0;line-height:1.4;">${escapeHtml(pNote)}</p>` : ''}
          <a href="${escapeHtml(nav.googleDirections)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:var(--primary);color:white;text-decoration:none;border-radius:8px;padding:6px 10px;font-size:12px;font-weight:700;">
            ${escapeHtml(locale === 'bn' ? 'এখানে যান' : 'Navigate here')} &rarr;
          </a>
        </div>
      `;
      m.bindPopup(html);
      m.addTo(targetGroup);
    }

    group.addTo(map);
    poiLayerRef.current = group;
  }, [overlays.places, filteredPlaces, zoomLevel, locale, toBanglaNum, getLocalized]);

  // Optional Land Donor Parcels overlay (off by default)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (parcelLayerRef.current) {
      map.removeLayer(parcelLayerRef.current);
      parcelLayerRef.current = null;
    }

    if (!overlays.parcels || !Array.isArray(parcels) || parcels.length === 0) return;

    const group = L.layerGroup();
    parcels.forEach((donor) => {
      if (!donor.geometry) return;
      const dName = getLocalized(donor, 'name');
      if (locale === 'en' && !dName) return;
      const honorific = getHonorificPrefix(dName, donor.isDeceased, locale);
      const fullName = honorific ? `${honorific} ${dName}` : dName;
      const area = formatAreaPlate(donor.areaValue, donor.areaUnit, locale, toBanglaNum);

      try {
        const poly = L.geoJSON(donor.geometry, {
          style: {
            color: getCssToken('--gold-text', 'rgb(138, 106, 31)'),
            weight: 1.5,
            fillColor: getCssToken('--gold-plate-from', 'rgb(232, 203, 130)'),
            fillOpacity: 0.35,
          },
        });
        poly.bindTooltip(`${fullName} (${area.full})`, { sticky: true });
        poly.on('click', () => {
          onSelectParcel?.(donor);
        });
        poly.addTo(group);
      } catch {
        // Ignore invalid parcel geometry
      }
    });

    group.addTo(map);
    parcelLayerRef.current = group;
  }, [overlays.parcels, parcels, locale, toBanglaNum, getLocalized, onSelectParcel]);

  // User location dot + line to Eidgah + fitBounds
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (userLayerRef.current) {
      map.removeLayer(userLayerRef.current);
      userLayerRef.current = null;
    }

    if (!userLocation) return;

    const group = L.layerGroup();
    L.circleMarker([userLocation.lat, userLocation.lng], {
      radius: 8,
      color: 'white',
      weight: 3,
      fillColor: getCssToken('--chart-series-5', 'rgb(74, 143, 163)'),
      fillOpacity: 1,
    })
      .bindTooltip(locale === 'bn' ? 'আপনার অবস্থান' : 'Your location')
      .addTo(group);

    L.polyline(
      [
        [userLocation.lat, userLocation.lng],
        [config.lat, config.lng],
      ],
      {
        color: getCssToken('--primary', 'rgb(36, 122, 89)'),
        weight: 2,
        dashArray: '6, 6',
        opacity: 0.75,
      }
    ).addTo(group);

    group.addTo(map);
    userLayerRef.current = group;

    const bounds = L.latLngBounds([
      [userLocation.lat, userLocation.lng],
      [config.lat, config.lng],
    ]);
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 17 });
  }, [userLocation, config.lat, config.lng, locale]);

  // Focus specific coordinates when a place from the list is tapped
  useEffect(() => {
    if (focusCoords && mapRef.current) {
      mapRef.current.setView([focusCoords.lat, focusCoords.lng], 18, { animate: true });
    }
  }, [focusCoords]);

  const handleRecenter = () => {
    mapRef.current?.setView([config.lat, config.lng], config.zoom || 17, { animate: true });
  };

  return (
    <div
      className={
        isFullscreen
          ? 'fixed inset-0 z-50 bg-canvas flex flex-col'
          : 'relative w-full h-full rounded-2xl overflow-hidden border border-sand bg-canvas-alt'
      }
    >
      {/* Map Canvas */}
      <div
        ref={containerRef}
        className="w-full h-full flex-1 z-0"
        role="application"
        aria-label={
          locale === 'bn'
            ? `${config.placeNameBn} ইন্টারেক্টিভ মানচিত্র`
            : `${config.placeNameEn} interactive map`
        }
      />

      {/* Top-Left: Base Layer + Overlay Toggles */}
      <div className="absolute top-3 left-3 z-[400] flex flex-wrap items-center gap-1.5 max-w-[calc(100%-70px)]">
        {satelliteAvailable && (
          <div className="inline-flex rounded-xl bg-surface/95 border border-sand shadow-sakinah-sm p-0.5">
            <button
              type="button"
              onClick={() => setBaseLayerType('map')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold min-h-[36px] transition-colors ${
                baseLayerType === 'map'
                  ? 'bg-primary text-white'
                  : 'text-primary-dark hover:bg-primary-soft/60'
              }`}
            >
              {locale === 'bn' ? 'মানচিত্র' : 'Map'}
            </button>
            <button
              type="button"
              onClick={() => setBaseLayerType('satellite')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold min-h-[36px] transition-colors ${
                baseLayerType === 'satellite'
                  ? 'bg-primary text-white'
                  : 'text-primary-dark hover:bg-primary-soft/60'
              }`}
            >
              {locale === 'bn' ? 'স্যাটেলাইট' : 'Satellite'}
            </button>
          </div>
        )}

        {config?.boundaryGeoJson && (
          <button
            type="button"
            onClick={() => setOverlays((o) => ({ ...o, boundary: !o.boundary }))}
            aria-pressed={overlays.boundary}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold shadow-sakinah-sm min-h-[38px] transition-colors ${
              overlays.boundary
                ? 'bg-primary text-white border-primary'
                : 'bg-surface/95 text-primary-dark border-sand'
            }`}
          >
            <Pentagon className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{locale === 'bn' ? 'সীমানা' : 'Boundary'}</span>
          </button>
        )}

        {places.length > 0 && (
          <button
            type="button"
            onClick={() => setOverlays((o) => ({ ...o, places: !o.places }))}
            aria-pressed={overlays.places}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold shadow-sakinah-sm min-h-[38px] transition-colors ${
              overlays.places
                ? 'bg-primary text-white border-primary'
                : 'bg-surface/95 text-primary-dark border-sand'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{locale === 'bn' ? 'স্থানসমূহ' : 'Places'}</span>
          </button>
        )}

        {parcels.length > 0 && (
          <button
            type="button"
            onClick={() => setOverlays((o) => ({ ...o, parcels: !o.parcels }))}
            aria-pressed={overlays.parcels}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold shadow-sakinah-sm min-h-[38px] transition-colors ${
              overlays.parcels
                ? 'bg-primary text-white border-primary'
                : 'bg-surface/95 text-primary-dark border-sand'
            }`}
          >
            <Grid className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{locale === 'bn' ? 'জমির অংশ' : 'Parcels'}</span>
          </button>
        )}
      </div>

      {/* Top-Right: Touch-Sized Zoom, Recenter & Fullscreen Controls (44px+ targets) */}
      <div className="absolute top-3 right-3 z-[400] flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => setIsFullscreen((f) => !f)}
          className="w-11 h-11 rounded-xl bg-surface/95 border border-sand shadow-sakinah-sm text-primary-dark hover:bg-primary-soft flex items-center justify-center tap-feedback"
          aria-label={
            isFullscreen
              ? locale === 'bn'
                ? 'পূর্ণ স্ক্রিন বন্ধ করুন'
                : 'Exit fullscreen'
              : locale === 'bn'
                ? 'পূর্ণ স্ক্রিন মানচিত্র'
                : 'Fullscreen map'
          }
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        <button
          type="button"
          onClick={() => mapRef.current?.zoomIn()}
          className="w-11 h-11 rounded-xl bg-surface/95 border border-sand shadow-sakinah-sm text-primary-dark hover:bg-primary-soft flex items-center justify-center tap-feedback"
          aria-label={locale === 'bn' ? 'জুম ইন' : 'Zoom in'}
        >
          <Plus className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => mapRef.current?.zoomOut()}
          className="w-11 h-11 rounded-xl bg-surface/95 border border-sand shadow-sakinah-sm text-primary-dark hover:bg-primary-soft flex items-center justify-center tap-feedback"
          aria-label={locale === 'bn' ? 'জুম আউট' : 'Zoom out'}
        >
          <Minus className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleRecenter}
          className="w-11 h-11 rounded-xl bg-surface/95 border border-sand shadow-sakinah-sm text-primary-dark hover:bg-primary-soft flex items-center justify-center tap-feedback"
          aria-label={locale === 'bn' ? 'ঈদগাহে কেন্দ্র করুন' : 'Center on Eidgah'}
        >
          <Crosshair className="w-4 h-4" />
        </button>
      </div>

      {/* Gentle Gesture Hint Overlay */}
      {gestureHint && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none absolute inset-x-4 bottom-12 z-[450] flex justify-center"
        >
          <span className="px-3.5 py-2 rounded-full bg-scrim/80 text-white text-xs font-semibold shadow-sakinah-card">
            {gestureHint}
          </span>
        </div>
      )}
    </div>
  );
}

export default InteractiveLeafletMap;
