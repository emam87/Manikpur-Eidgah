import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Eye,
  Pentagon,
  Compass,
  Grid,
  Copy,
  Check,
  Link2,
  LocateFixed,
  Keyboard,
  Move,
  AlertTriangle,
  RotateCcw,
  Save,
  Upload,
  Navigation,
  ExternalLink,
} from 'lucide-react';
import { BilingualInput } from './BilingualInput.jsx';
import { useAdminAuth } from '../context/AdminAuthContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { getImageUrl } from '../../utils/imageUrl.js';
import {
  DEFAULT_MAP_LOCATION,
  extractCoordsFromGoogleMapsUrl,
  validateCoordinatesClient,
  haversineDistanceKm,
  copyTextSafe,
} from '../../utils/mapUtils.js';
import { AdminMapManagement } from '../pages/AdminMapManagement.jsx';

const AdminMapEditor = lazy(() => import('./AdminMapEditor.jsx'));

const MAP_SETTING_KEYS = [
  'map_lat',
  'map_lng',
  'map_zoom',
  'map_place_name',
  'map_place_name_en',
  'map_address',
  'map_address_en',
  'map_google_place_url',
  'map_satellite_enabled',
  'map_static_preview',
  'map_nav_lat',
  'map_nav_lng',
  'map_pin_source',
  'map_pin_updated_at',
  'map_pin_updated_by',
  'map_pin_verified_at',
  'map_pin_verified_by',
  'boundary_geojson',
];

function StatusBadge({ status }) {
  if (status === 'set') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-success-soft text-success text-[11px] font-bold">
        <Check className="w-3 h-3" />
        <span>নির্ধারিত (Set)</span>
      </span>
    );
  }
  if (status === 'needs_review') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-warning-soft text-warning text-[11px] font-bold">
        <AlertTriangle className="w-3 h-3" />
        <span>যাচাই প্রয়োজন (Needs review)</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-canvas-alt text-ink-muted border border-sand text-[11px] font-bold">
      <span>নির্ধারিত নয় (Not set)</span>
    </span>
  );
}

/**
 * Unambiguous 6-tab Admin Map Settings panel:
 * 1. LOCATION (pin + optional navigation point)
 * 2. VIEW (zoom slider + satellite + static preview)
 * 3. BOUNDARY (land outline polygon)
 * 4. PLACES (POIs)
 * 5. ROUTE GUIDES
 * 6. PARCELS (linked to Land Donors)
 */
export function AdminMapSettingsPanel({
  settings,
  onSettingsUpdated,
}) {
  const { user } = useAdminAuth();
  const { refreshSettings } = useSettings();
  const ADMIN_PATH = import.meta.env.VITE_ADMIN_PATH || 'eidgah-manage-k29x';

  const [subTab, setSubTab] = useState('location');
  const [draft, setDraft] = useState(() => ({ ...settings }));
  const [savedSnapshot, setSavedSnapshot] = useState(() => ({ ...settings }));

  // Four explicit ways to set location
  const [inputMode, setInputMode] = useState('drag'); // 'drag' | 'link' | 'type' | 'gps'
  const [linkValue, setLinkValue] = useState('');
  const [resolvingLink, setResolvingLink] = useState(false);
  const [linkFeedback, setLinkFeedback] = useState({ type: '', text: '' });
  const [typedLat, setTypedLat] = useState('');
  const [typedLng, setTypedLng] = useState('');
  const [typedError, setTypedError] = useState('');
  const [gpsError, setGpsError] = useState('');

  // Optional Navigation Point toggle
  const [navPointEnabled, setNavPointEnabled] = useState(
    Boolean(settings.map_nav_lat && settings.map_nav_lng)
  );

  // Move > 50m guard & Post-save verification prompt
  const [confirmLargeMove, setConfirmLargeMove] = useState(false);
  const [showVerifyPrompt, setShowVerifyPrompt] = useState(false);

  // Save / upload / copy states
  const [saving, setSaving] = useState(false);
  const [uploadingPreview, setUploadingPreview] = useState(false);
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Parcels tab data
  const [parcelDonors, setParcelDonors] = useState([]);
  const [loadingParcels, setLoadingParcels] = useState(false);

  // Sync when parent settings first load
  useEffect(() => {
    setDraft((prev) => ({ ...settings, ...prev }));
    setSavedSnapshot({ ...settings });
    setNavPointEnabled(Boolean(settings.map_nav_lat && settings.map_nav_lng));
  }, [settings.map_lat, settings.map_lng, settings.boundary_geojson]);

  // Fetch donors when Parcels tab opens
  useEffect(() => {
    if (subTab !== 'parcels') return;
    setLoadingParcels(true);
    fetch('/api/admin/land-donors?limit=50')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setParcelDonors(d.donors || []);
      })
      .catch(() => {})
      .finally(() => setLoadingParcels(false));
  }, [subTab]);

  const setField = (key, val) => {
    setDraft((prev) => ({ ...prev, [key]: val }));
  };

  const savedLat = parseFloat(savedSnapshot.map_lat);
  const savedLng = parseFloat(savedSnapshot.map_lng);
  const curLat = parseFloat(draft.map_lat) || DEFAULT_MAP_LOCATION.lat;
  const curLng = parseFloat(draft.map_lng) || DEFAULT_MAP_LOCATION.lng;
  const curZoom = parseInt(draft.map_zoom, 10) || DEFAULT_MAP_LOCATION.zoom;

  const movedMeters = useMemo(() => {
    if (!Number.isFinite(savedLat) || !Number.isFinite(savedLng)) return 0;
    return Math.round(haversineDistanceKm(savedLat, savedLng, curLat, curLng) * 1000);
  }, [savedLat, savedLng, curLat, curLng]);

  const isDirty = useMemo(() => {
    return MAP_SETTING_KEYS.some((k) => String(draft[k] ?? '') !== String(savedSnapshot[k] ?? ''));
  }, [draft, savedSnapshot]);

  // Warn before leaving page with unsaved changes
  useEffect(() => {
    if (!isDirty) return undefined;
    const onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);

  const coordCheck = validateCoordinatesClient(curLat, curLng);

  const locationStatus = !Number.isFinite(savedLat) || !Number.isFinite(savedLng)
    ? 'not_set'
    : savedSnapshot.map_pin_verified_at
      ? 'set'
      : 'needs_review';
  const boundaryStatus = draft.boundary_geojson ? 'set' : 'not_set';
  const viewStatus = draft.map_zoom ? 'set' : 'not_set';

  const applyNewPin = (newLat, newLng, sourceLabel) => {
    const fixedLat = Number(newLat).toFixed(7);
    const fixedLng = Number(newLng).toFixed(7);
    setDraft((prev) => ({
      ...prev,
      map_lat: fixedLat,
      map_lng: fixedLng,
      map_pin_source: sourceLabel,
      // Reset verification whenever pin moves significantly
      map_pin_verified_at: '',
      map_pin_verified_by: '',
    }));
    setConfirmLargeMove(false);
  };

  // Method 2: Paste Google Maps link (uses POST /api/admin/maps/resolve for short links!)
  const handleResolveGoogleLink = async () => {
    setLinkFeedback({ type: '', text: '' });
    if (!linkValue.trim()) {
      setLinkFeedback({ type: 'error', text: 'অনুগ্রহ করে একটি Google Maps লিংক পেস্ট করুন।' });
      return;
    }

    const local = extractCoordsFromGoogleMapsUrl(linkValue);
    if (local.ok) {
      applyNewPin(local.lat, local.lng, 'Google link');
      if (local.isFallbackViewport) {
        setLinkFeedback({
          type: 'warning',
          text: `${local.warningBn} (${local.warning})`,
        });
      } else {
        setLinkFeedback({
          type: 'success',
          text: `সঠিক পিন স্থানাঙ্ক পাওয়া গেছে: ${local.lat.toFixed(6)}, ${local.lng.toFixed(6)}`,
        });
      }
      return;
    }

    if (local.isShortLink) {
      setResolvingLink(true);
      try {
        const res = await fetch('/api/admin/maps/resolve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: linkValue.trim() }),
        });
        const data = await res.json();
        if (data.success && Number.isFinite(Number(data.lat))) {
          applyNewPin(data.lat, data.lng, 'Google link');
          setField('map_google_place_url', linkValue.trim());
          setLinkFeedback({
            type: data.isFallbackViewport ? 'warning' : 'success',
            text: data.isFallbackViewport
              ? `${data.warningBn || data.warning}`
              : `সংক্ষিপ্ত লিংক থেকে সঠিক পিন পাওয়া গেছে: ${Number(data.lat).toFixed(6)}, ${Number(data.lng).toFixed(6)}`,
          });
        } else {
          setLinkFeedback({
            type: 'error',
            text:
              data.error ||
              'সংক্ষিপ্ত লিংকটি রিজলভ করা যায়নি। অনুগ্রহ করে ব্রাউজারে খুলে সম্পূর্ণ URL অথবা স্থানাঙ্ক (lat, lng) পেস্ট করুন।',
          });
        }
      } catch {
        setLinkFeedback({
          type: 'error',
          text: 'লিংক রিজলভ করতে সার্ভারে সমস্যা হয়েছে। সম্পূর্ণ URL বা স্থানাঙ্ক পেস্ট করুন।',
        });
      } finally {
        setResolvingLink(false);
      }
      return;
    }

    setLinkFeedback({
      type: 'error',
      text: local.error || 'এই লিংকে বৈধ স্থানাঙ্ক পাওয়া যায়নি। সম্পূর্ণ Google Maps লিংক বা "23.0199269, 91.2112393" দিন।',
    });
  };

  // Method 3: Type coordinates (supports Bangla & Latin digits)
  const handleApplyTypedCoords = () => {
    setTypedError('');
    const check = validateCoordinatesClient(typedLat, typedLng);
    if (!check.valid) {
      setTypedError(check.error);
      return;
    }
    applyNewPin(check.lat, check.lng, 'Typed');
  };

  // Method 4: Use my current GPS location
  const handleUseCurrentGps = () => {
    setGpsError('');
    if (!navigator.geolocation) {
      setGpsError('আপনার ব্রাউজারে লোকেশন সুবিধা সমর্থিত নয়।');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        applyNewPin(pos.coords.latitude, pos.coords.longitude, 'GPS');
      },
      () => {
        setGpsError('লোকেশন অনুমতি পাওয়া যায়নি বা অবস্থান নির্ণয় ব্যর্থ হয়েছে।');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleResetToSaved = () => {
    setDraft({ ...savedSnapshot });
    setNavPointEnabled(Boolean(savedSnapshot.map_nav_lat && savedSnapshot.map_nav_lng));
    setConfirmLargeMove(false);
    setLinkFeedback({ type: '', text: '' });
  };

  const persistMapSettings = async (overrideFields = {}) => {
    const merged = { ...draft, ...overrideFields };
    if (!navPointEnabled) {
      merged.map_nav_lat = '';
      merged.map_nav_lng = '';
    }

    // Require explicit confirmation when pin moved > 50m
    if (movedMeters > 50 && !confirmLargeMove && !overrideFields.map_pin_verified_at) {
      setConfirmLargeMove(true);
      return;
    }

    setSaving(true);
    try {
      const nowIso = new Date().toISOString();
      const actor = user?.name || user?.email || 'Admin';
      merged.map_pin_updated_at = nowIso;
      merged.map_pin_updated_by = actor;

      const payload = {
        map_lat: { valueBn: String(merged.map_lat || ''), valueEn: String(merged.map_lat || '') },
        map_lng: { valueBn: String(merged.map_lng || ''), valueEn: String(merged.map_lng || '') },
        map_zoom: { valueBn: String(merged.map_zoom || '17'), valueEn: String(merged.map_zoom || '17') },
        map_place_name: {
          valueBn: merged.map_place_name || DEFAULT_MAP_LOCATION.placeNameBn,
          valueEn: merged.map_place_name_en || DEFAULT_MAP_LOCATION.placeNameEn,
        },
        map_address: {
          valueBn: merged.map_address || '',
          valueEn: merged.map_address_en || '',
        },
        map_google_place_url: {
          valueBn: merged.map_google_place_url || DEFAULT_MAP_LOCATION.googlePlaceUrl,
          valueEn: merged.map_google_place_url || DEFAULT_MAP_LOCATION.googlePlaceUrl,
        },
        map_satellite_enabled: {
          valueBn: merged.map_satellite_enabled === '0' ? '0' : '1',
          valueEn: merged.map_satellite_enabled === '0' ? '0' : '1',
        },
        map_nav_lat: { valueBn: String(merged.map_nav_lat || ''), valueEn: String(merged.map_nav_lat || '') },
        map_nav_lng: { valueBn: String(merged.map_nav_lng || ''), valueEn: String(merged.map_nav_lng || '') },
        map_pin_source: { valueBn: merged.map_pin_source || 'Dragged', valueEn: merged.map_pin_source || 'Dragged' },
        map_pin_updated_at: { valueBn: nowIso, valueEn: nowIso },
        map_pin_updated_by: { valueBn: actor, valueEn: actor },
        map_pin_verified_at: {
          valueBn: merged.map_pin_verified_at || '',
          valueEn: merged.map_pin_verified_at || '',
        },
        map_pin_verified_by: {
          valueBn: merged.map_pin_verified_by || '',
          valueEn: merged.map_pin_verified_by || '',
        },
        boundary_geojson: {
          valueBn: merged.boundary_geojson || '',
          valueEn: merged.boundary_geojson || '',
        },
      };

      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: payload }),
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || 'মানচিত্র সেটিংস সংরক্ষণ ব্যর্থ হয়েছে।');
        return;
      }

      setDraft(merged);
      setSavedSnapshot(merged);
      setConfirmLargeMove(false);
      onSettingsUpdated?.(merged);
      await refreshSettings();

      const coordsSaved = `${Number(merged.map_lat).toFixed(6)}, ${Number(merged.map_lng).toFixed(6)}`;
      setToastMsg(`সংরক্ষিত হয়েছে: ${coordsSaved}`);
      setTimeout(() => setToastMsg(''), 4000);

      if (subTab === 'location' && !merged.map_pin_verified_at) {
        setShowVerifyPrompt(true);
      }
    } catch {
      alert('সার্ভারে সমস্যা হয়েছে।');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmPinOnGround = async () => {
    const nowIso = new Date().toISOString();
    const actor = user?.name || user?.email || 'Admin';
    setShowVerifyPrompt(false);
    await persistMapSettings({
      map_pin_verified_at: nowIso,
      map_pin_verified_by: actor,
    });
  };

  const handleUploadStaticPreview = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPreview(true);
    try {
      const fd = new FormData();
      fd.append('photo', file);
      const res = await fetch('/api/admin/settings/map-preview', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success && data.path) {
        setField('map_static_preview', data.path);
        setSavedSnapshot((prev) => ({ ...prev, map_static_preview: data.path }));
        await refreshSettings();
        setToastMsg('স্ট্যাটিক ম্যাপ প্রিভিউ আপলোড হয়েছে।');
        setTimeout(() => setToastMsg(''), 3000);
      } else {
        alert(data.error || 'আপলোড ব্যর্থ হয়েছে।');
      }
    } finally {
      setUploadingPreview(false);
      e.target.value = '';
    }
  };

  const zoomLabel =
    curZoom <= 14
      ? 'গ্রাম / বড় এলাকা (Village)'
      : curZoom <= 16
        ? 'এলাকা / মহল্লা (Neighbourhood)'
        : 'কাছাকাছি / ঈদগাহ মাঠ (Close)';

  const subTabs = [
    { id: 'location', label: '১. অবস্থান (Pin)', icon: MapPin },
    { id: 'view', label: '২. ভিউ ও জুম', icon: Eye },
    { id: 'boundary', label: '৩. সীমানা', icon: Pentagon },
    { id: 'places', label: '৪. স্থানসমূহ', icon: Compass },
    { id: 'routes', label: '৫. পথ নির্দেশনা', icon: Navigation },
    { id: 'parcels', label: '৬. জমির অংশ', icon: Grid },
  ];

  const isSettingsSubTab = subTab === 'location' || subTab === 'view' || subTab === 'boundary';

  return (
    <div className="space-y-5">
      {/* Sub-tab Strip (Mobile-friendly horizontal scroll) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-sand">
        {subTabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setSubTab(t.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap min-h-[40px] transition-colors ${
                subTab === t.id
                  ? 'bg-primary text-white shadow-sakinah-sm'
                  : 'bg-canvas-alt text-primary-dark border border-sand hover:bg-primary-soft/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Toast & Unsaved Changes Indicator */}
      {toastMsg && (
        <div
          role="status"
          className="rounded-xl bg-success-soft border border-success/30 px-4 py-2.5 text-xs font-bold text-success flex items-center gap-2"
        >
          <Check className="w-4 h-4 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {isDirty && isSettingsSubTab && (
        <div className="rounded-xl bg-warning-soft border border-warning/35 px-3.5 py-2 text-xs font-semibold text-warning flex flex-wrap items-center justify-between gap-2">
          <span>অসংরক্ষিত পরিবর্তন রয়েছে (Unsaved changes)</span>
          <button
            type="button"
            onClick={handleResetToSaved}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface border border-sand text-ink font-bold hover:bg-canvas-alt"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>পূর্বের অবস্থায় ফিরুন (Reset)</span>
          </button>
        </div>
      )}

      {/* ====================================================================
          TAB 1: LOCATION (THE PIN)
         ==================================================================== */}
      {subTab === 'location' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="font-serif font-bold text-lg text-primary-dark">
                ঈদগাহের মূল পিন (Location Pin)
              </h2>
              <p className="text-xs text-ink-muted">
                মানচিত্রে ঈদগাহ ময়দানের সঠিক বিন্দু নির্ধারণ করুন।
                <span className="block text-[11px] text-primary-dark font-semibold mt-0.5">
                  ব্যবহৃত হয়: মানচিত্র পেজ (/map), হোম পেজ দিকনির্দেশনা কার্ড, শেয়ার লিংক ও SEO
                </span>
              </p>
            </div>
            <StatusBadge status={locationStatus} />
          </div>

          {/* Read-only Coordinate Display + Copy + Metadata */}
          <div className="rounded-2xl bg-canvas-alt border border-sand p-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="block text-[11px] font-bold text-ink-muted uppercase">
                বর্তমান পিন স্থানাঙ্ক (Pin Coordinates)
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm sm:text-base font-bold text-primary-dark">
                  {curLat.toFixed(6)}, {curLng.toFixed(6)}
                </span>
                {draft.map_pin_source && (
                  <span className="px-2 py-0.5 rounded-full bg-primary-soft text-primary-dark text-[11px] font-bold">
                    উৎস: {draft.map_pin_source}
                  </span>
                )}
                {movedMeters > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-warning-soft text-warning text-[11px] font-bold">
                    সরেছে: {movedMeters >= 1000 ? `${(movedMeters / 1000).toFixed(2)} কিমি` : `${movedMeters} মি.`}
                  </span>
                )}
              </div>
              {savedSnapshot.map_pin_updated_at && (
                <p className="text-[11px] text-ink-muted">
                  সর্বশেষ আপডেট: {new Date(savedSnapshot.map_pin_updated_at).toLocaleString()}
                  {savedSnapshot.map_pin_updated_by ? ` — ${savedSnapshot.map_pin_updated_by}` : ''}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={async () => {
                const ok = await copyTextSafe(`${curLat.toFixed(6)}, ${curLng.toFixed(6)}`);
                if (ok) {
                  setCopiedCoords(true);
                  setTimeout(() => setCopiedCoords(false), 2000);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface border border-sand text-xs font-bold text-primary-dark hover:bg-primary-soft min-h-[40px]"
            >
              {copiedCoords ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCoords ? 'কপি হয়েছে' : 'কপি করুন'}</span>
            </button>
          </div>

          {/* Exactly 4 clearly labeled buttons to set the pin */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'drag', label: 'পিন টেনে বসান', sub: 'Drag on map', icon: Move },
              { id: 'link', label: 'Google লিংক পেস্ট', sub: 'Paste Google link', icon: Link2 },
              { id: 'type', label: 'স্থানাঙ্ক লিখুন', sub: 'Type lat, lng', icon: Keyboard },
              { id: 'gps', label: 'বর্তমান অবস্থান', sub: 'Use my location', icon: LocateFixed },
            ].map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setInputMode(m.id);
                    if (m.id === 'type') {
                      setTypedLat(curLat.toFixed(7));
                      setTypedLng(curLng.toFixed(7));
                    }
                    if (m.id === 'gps') handleUseCurrentGps();
                  }}
                  className={`p-3 rounded-xl border text-left transition-colors min-h-[56px] ${
                    inputMode === m.id
                      ? 'bg-primary-soft border-primary text-primary-dark'
                      : 'bg-surface border-sand text-ink hover:bg-canvas-alt'
                  }`}
                >
                  <Icon className="w-4 h-4 text-primary mb-1" />
                  <span className="block text-xs font-bold leading-tight">{m.label}</span>
                  <span className="block text-[10px] text-ink-muted">{m.sub}</span>
                </button>
              );
            })}
          </div>

          {/* Method 2 Panel: Paste Google Maps Link */}
          {inputMode === 'link' && (
            <div className="p-4 rounded-2xl bg-canvas-alt border border-sand space-y-2">
              <label className="block text-xs font-bold text-primary-dark">
                Google Maps লিংক (সংক্ষিপ্ত maps.app.goo.gl অথবা সম্পূর্ণ URL)
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={linkValue}
                  onChange={(e) => setLinkValue(e.target.value)}
                  placeholder="https://maps.app.goo.gl/g9bU9iHkgNdrsZ9PA"
                  className="flex-1 px-3 py-2 rounded-xl border border-sand bg-surface text-ink text-xs sm:text-sm"
                />
                <button
                  type="button"
                  onClick={handleResolveGoogleLink}
                  disabled={resolvingLink}
                  className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold min-h-[42px] disabled:opacity-50"
                >
                  {resolvingLink ? 'খোঁজা হচ্ছে...' : 'স্থানাঙ্ক নিন'}
                </button>
              </div>
              {linkFeedback.text && (
                <p
                  className={`text-xs font-semibold ${
                    linkFeedback.type === 'error'
                      ? 'text-danger'
                      : linkFeedback.type === 'warning'
                        ? 'text-warning'
                        : 'text-success'
                  }`}
                >
                  {linkFeedback.text}
                </p>
              )}
            </div>
          )}

          {/* Method 3 Panel: Type Coordinates */}
          {inputMode === 'type' && (
            <div className="p-4 rounded-2xl bg-canvas-alt border border-sand space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-ink-muted mb-1">
                    অক্ষাংশ (Latitude) — উদা: 23.0199269
                  </label>
                  <input
                    type="text"
                    value={typedLat}
                    onChange={(e) => setTypedLat(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-sand bg-surface text-ink font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-ink-muted mb-1">
                    দ্রাঘিমাংশ (Longitude) — উদা: 91.2112393
                  </label>
                  <input
                    type="text"
                    value={typedLng}
                    onChange={(e) => setTypedLng(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-sand bg-surface text-ink font-mono text-sm"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleApplyTypedCoords}
                    className="w-full px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold min-h-[42px]"
                  >
                    মানচিত্রে বসান
                  </button>
                </div>
              </div>
              {typedError && <p className="text-xs text-danger font-semibold">{typedError}</p>}
            </div>
          )}

          {gpsError && (
            <p className="text-xs text-danger font-semibold bg-danger-soft px-3 py-2 rounded-xl">
              {gpsError}
            </p>
          )}

          {coordCheck.warning && (
            <div className="p-3 rounded-xl bg-warning-soft border border-warning/30 text-xs text-warning flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{coordCheck.warning}</span>
            </div>
          )}

          {/* Sole Large Draggable-Pin Map Surface (with Satellite Toggle) */}
          <Suspense fallback={<div className="h-80 rounded-xl skeleton-shimmer" />}>
            <AdminMapEditor
              mode="pin"
              lat={curLat}
              lng={curLng}
              zoom={curZoom}
              heightClass="h-80"
              showSatelliteToggle={true}
              onChangePin={(newLat, newLng) => applyNewPin(newLat, newLng, 'Dragged')}
            />
          </Suspense>

          {/* > 50m Move Confirmation Guard */}
          {confirmLargeMove && movedMeters > 50 && (
            <div className="p-4 rounded-2xl bg-warning-soft border-2 border-warning/60 space-y-2.5 text-xs">
              <p className="font-bold text-warning text-sm flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  আপনি কি নিশ্চিতভাবে ঈদগাহের অবস্থান {movedMeters} মিটার সরাতে চান? (Move location by {movedMeters} m?)
                </span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono">
                <div className="p-2 rounded-lg bg-surface border border-sand">
                  <span className="block text-[10px] text-ink-muted">পূর্বের পিন (Before):</span>
                  <strong>{savedLat.toFixed(6)}, {savedLng.toFixed(6)}</strong>
                </div>
                <div className="p-2 rounded-lg bg-surface border border-sand">
                  <span className="block text-[10px] text-ink-muted">নতুন পিন (After):</span>
                  <strong className="text-primary-dark">{curLat.toFixed(6)}, {curLng.toFixed(6)}</strong>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmLargeMove(false)}
                  className="px-3.5 py-2 rounded-xl bg-surface border border-sand font-bold text-ink"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={() => persistMapSettings()}
                  className="px-4 py-2 rounded-xl bg-primary text-white font-bold"
                >
                  হ্যাঁ, নতুন অবস্থান সংরক্ষণ করুন
                </button>
              </div>
            </div>
          )}

          {/* Post-Save Verification Prompt */}
          {showVerifyPrompt && (
            <div className="p-4 rounded-2xl bg-primary-soft border border-primary/30 space-y-2 text-xs">
              <p className="font-bold text-primary-dark text-sm">
                পিনটি কি ঈদগাহ ময়দানেই সঠিকভাবে বসেছে? (Is the pin on the Eidgah ground?)
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleConfirmPinOnGround}
                  className="px-4 py-2 rounded-xl bg-primary text-white font-bold min-h-[40px]"
                >
                  হ্যাঁ, সঠিক আছে (Yes, verified)
                </button>
                <button
                  type="button"
                  onClick={() => setShowVerifyPrompt(false)}
                  className="px-4 py-2 rounded-xl bg-surface border border-sand text-primary-dark font-bold min-h-[40px]"
                >
                  না, আবার ঠিক করব (No, adjust again)
                </button>
              </div>
            </div>
          )}

          {/* Bilingual Place Name, Short Address & Place URL */}
          <BilingualInput
            label="মানচিত্রের স্থানের নাম (Place Name)"
            valueBn={draft.map_place_name ?? DEFAULT_MAP_LOCATION.placeNameBn}
            valueEn={draft.map_place_name_en ?? DEFAULT_MAP_LOCATION.placeNameEn}
            onChangeBn={(v) => setField('map_place_name', v)}
            onChangeEn={(v) => setField('map_place_name_en', v)}
          />

          <BilingualInput
            label="মানচিত্রের সংক্ষিপ্ত ঠিকানা (ঐচ্ছিক — খালি রাখলে দেখানো হবে না)"
            valueBn={draft.map_address || ''}
            valueEn={draft.map_address_en || ''}
            onChangeBn={(v) => setField('map_address', v)}
            onChangeEn={(v) => setField('map_address_en', v)}
          />

          <div>
            <label className="block font-bold text-ink text-xs mb-1">
              Google Maps Place লিংক (Open in Google Maps বাটনের জন্য)
            </label>
            <input
              type="url"
              value={draft.map_google_place_url ?? DEFAULT_MAP_LOCATION.googlePlaceUrl}
              onChange={(e) => setField('map_google_place_url', e.target.value)}
              placeholder="https://maps.app.goo.gl/g9bU9iHkgNdrsZ9PA"
              className="w-full px-3 py-2 rounded-xl border border-sand bg-canvas text-ink font-mono text-xs"
            />
          </div>

          {/* Optional Separate Navigation Point */}
          <div className="p-4 rounded-2xl bg-canvas-alt border border-sand space-y-3">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={navPointEnabled}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setNavPointEnabled(checked);
                  if (checked && !draft.map_nav_lat) {
                    setField('map_nav_lat', curLat.toFixed(7));
                    setField('map_nav_lng', curLng.toFixed(7));
                  } else if (!checked) {
                    setField('map_nav_lat', '');
                    setField('map_nav_lng', '');
                  }
                }}
                className="w-4 h-4 mt-0.5 accent-primary"
              />
              <div>
                <span className="font-bold text-primary-dark text-xs sm:text-sm block">
                  আলাদা দিকনির্দেশনা বিন্দু (Optional Navigation Point)
                </span>
                <span className="text-[11px] text-ink-muted block">
                  দিকনির্দেশনা কোথায় নিয়ে যাবে? ডিফল্ট: মূল পিনই; যেমন প্রধান গেট বা পার্কিং বেছে নিতে পারেন।
                </span>
              </div>
            </label>

            {navPointEnabled && (
              <div className="space-y-2">
                <p className="text-xs font-mono text-primary-dark">
                  Navigation Point: {Number(draft.map_nav_lat || curLat).toFixed(6)},{' '}
                  {Number(draft.map_nav_lng || curLng).toFixed(6)}
                </p>
                <Suspense fallback={<div className="h-52 rounded-xl skeleton-shimmer" />}>
                  <AdminMapEditor
                    mode="pin"
                    isNavPoint={true}
                    lat={parseFloat(draft.map_nav_lat) || curLat}
                    lng={parseFloat(draft.map_nav_lng) || curLng}
                    zoom={curZoom}
                    heightClass="h-52"
                    onChangePin={(nLat, nLng) => {
                      setField('map_nav_lat', Number(nLat).toFixed(7));
                      setField('map_nav_lng', Number(nLng).toFixed(7));
                    }}
                  />
                </Suspense>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 2: VIEW (ZOOM & SATELLITE ONLY)
         ==================================================================== */}
      {subTab === 'view' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="font-serif font-bold text-lg text-primary-dark">
                মানচিত্র ভিউ ও জুম (Map View)
              </h2>
              <p className="text-xs text-ink-muted">
                মানচিত্রটি সর্বদা মূল পিনে কেন্দ্রিত থাকবে; এখানে শুধু জুম ও স্যাটেলাইট প্রদর্শন নির্ধারণ করুন।
              </p>
            </div>
            <StatusBadge status={viewStatus} />
          </div>

          <div className="p-4 rounded-2xl bg-canvas-alt border border-sand space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-primary-dark">
              <label htmlFor="admin-zoom-slider">ডিফল্ট জুম লেভেল: {curZoom}</label>
              <span className="px-2.5 py-0.5 rounded-full bg-primary-soft">{zoomLabel}</span>
            </div>
            <input
              id="admin-zoom-slider"
              type="range"
              min="13"
              max="19"
              step="1"
              value={curZoom}
              onChange={(e) => setField('map_zoom', e.target.value)}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-[11px] text-ink-muted">
              <span>গ্রাম (13–14)</span>
              <span>এলাকা (15–16)</span>
              <span>কাছাকাছি (17–19)</span>
            </div>
          </div>

          <label className="flex items-center gap-3 p-3.5 rounded-xl border border-sand hover:bg-canvas-alt cursor-pointer">
            <input
              type="checkbox"
              checked={draft.map_satellite_enabled !== '0' && draft.map_satellite_enabled !== 'false'}
              onChange={(e) => setField('map_satellite_enabled', e.target.checked ? '1' : '0')}
              className="w-4 h-4 accent-primary"
            />
            <div>
              <span className="font-bold text-ink text-xs sm:text-sm block">
                পাবলিক মানচিত্রে স্যাটেলাইট ভিউ চালু রাখুন
              </span>
              <span className="text-[11px] text-ink-muted">
                বন্ধ রাখলে ভিজিটররা শুধুমাত্র সাধারণ মানচিত্র দেখবে।
              </span>
            </div>
          </label>

          {/* Live View Preview */}
          <Suspense fallback={<div className="h-64 rounded-xl skeleton-shimmer" />}>
            <AdminMapEditor
              mode="view"
              lat={curLat}
              lng={curLng}
              zoom={curZoom}
              heightClass="h-64"
              showSatelliteToggle={draft.map_satellite_enabled !== '0'}
            />
          </Suspense>

          {/* Static Preview Fallback Image */}
          <div className="p-4 rounded-2xl bg-canvas-alt border border-sand flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-bold text-primary-dark text-xs sm:text-sm block">
                স্ট্যাটিক প্রিভিউ ছবি (Lite Mode / ধীর ইন্টারনেট)
              </span>
              {draft.map_static_preview && (
                <img
                  src={getImageUrl(draft.map_static_preview)}
                  alt="Static Map Preview"
                  className="mt-2 h-24 rounded-xl border border-sand object-cover"
                />
              )}
            </div>
            <label className="px-4 py-2.5 rounded-xl bg-surface border border-sand hover:bg-primary-soft text-primary-dark text-xs font-bold inline-flex items-center gap-2 cursor-pointer shrink-0 min-h-[42px]">
              <Upload className="w-4 h-4" />
              <span>{uploadingPreview ? 'আপলোড হচ্ছে...' : 'প্রিভিউ ছবি আপলোড'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleUploadStaticPreview}
                disabled={uploadingPreview}
                className="hidden"
              />
            </label>
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 3: BOUNDARY (LAND OUTLINE)
         ==================================================================== */}
      {subTab === 'boundary' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="font-serif font-bold text-lg text-primary-dark">
                ঈদগাহের সীমানা (Land Boundary Outline)
              </h2>
              <p className="text-xs text-ink-muted">
                ঐচ্ছিক: এটি মূল পিন থেকে আলাদা—ঈদগাহ ময়দানের চারপাশের জমির সীমারেখা আঁকুন।
              </p>
            </div>
            <StatusBadge status={boundaryStatus} />
          </div>

          <Suspense fallback={<div className="h-80 rounded-xl skeleton-shimmer" />}>
            <AdminMapEditor
              mode="polygon"
              lat={curLat}
              lng={curLng}
              zoom={curZoom}
              heightClass="h-80"
              geojson={draft.boundary_geojson || null}
              sqftPerDecimal={parseFloat(settings.unit_conv_sqft) || 435.6}
              onChangeGeoJson={(nextGeo) =>
                setField('boundary_geojson', nextGeo ? JSON.stringify(nextGeo) : '')
              }
            />
          </Suspense>
        </div>
      )}

      {/* ====================================================================
          TAB 4 & 5: PLACES & ROUTE GUIDES (Reuses AdminMapManagement cleanly)
         ==================================================================== */}
      {subTab === 'places' && <AdminMapManagement initialTab="places" embedded={true} />}
      {subTab === 'routes' && <AdminMapManagement initialTab="routes" embedded={true} />}

      {/* ====================================================================
          TAB 6: PARCELS (LINKED TO LAND DONORS)
         ==================================================================== */}
      {subTab === 'parcels' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="font-serif font-bold text-lg text-primary-dark">
                জমিদাতাদের জমির অংশ (Land Donor Parcels — ঐচ্ছিক)
              </h2>
              <p className="text-xs text-ink-muted">
                পাবলিক মানচিত্রে Parcels লেয়ার চালু করলে কোন জমিদাতা কোন অংশ দান করেছেন তা দেখাবে। শুধুমাত্র প্রকাশিত ও showPlotDetails চালু থাকা রেকর্ডই দেখাবে।
              </p>
            </div>
            <Link
              to={`/${ADMIN_PATH}/land-donors`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-white text-xs font-bold min-h-[40px]"
            >
              <span>জমিদাতা তালিকায় যান</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loadingParcels ? (
            <div className="h-32 rounded-2xl skeleton-shimmer" />
          ) : parcelDonors.length === 0 ? (
            <div className="p-8 rounded-2xl bg-canvas-alt border border-sand text-center text-xs text-ink-muted">
              এখনও কোনো জমিদাতা যোগ করা হয়নি।
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {parcelDonors.map((d) => (
                <div
                  key={d.id}
                  className="p-3.5 rounded-xl bg-surface border border-sand flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-serif font-bold text-sm text-primary-dark truncate">
                      {d.nameBn} {d.nameEn ? `(${d.nameEn})` : ''}
                    </p>
                    <p className="text-[11px] text-ink-muted">
                      {d.areaValue} {d.areaUnit} •{' '}
                      {d.geometry ? (
                        <span className="text-success font-bold">পলিগন আঁকা আছে</span>
                      ) : (
                        <span>পলিগন আঁকা হয়নি</span>
                      )}
                    </p>
                  </div>
                  <Link
                    to={`/${ADMIN_PATH}/land-donors`}
                    className="px-3 py-1.5 rounded-lg bg-canvas-alt border border-sand text-xs font-bold text-primary-dark hover:bg-primary-soft shrink-0"
                  >
                    সম্পাদনা
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Save & Reset Footer for Settings Sub-tabs (Disabled until something changed) */}
      {isSettingsSubTab && (
        <div className="pt-4 border-t border-sand flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetToSaved}
            disabled={!isDirty || saving}
            className="px-4 py-2.5 rounded-xl border border-sand text-xs font-bold text-ink-muted hover:bg-canvas-alt disabled:opacity-40 inline-flex items-center gap-1.5 min-h-[44px]"
          >
            <RotateCcw className="w-4 h-4" />
            <span>পূর্বের অবস্থায় ফিরুন (Reset)</span>
          </button>

          <button
            type="button"
            onClick={() => persistMapSettings()}
            disabled={!isDirty || saving || !coordCheck.valid}
            className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-bold shadow-sakinah-sm inline-flex items-center gap-2 disabled:opacity-40 min-h-[44px]"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'সংরক্ষণ হচ্ছে...' : 'মানচিত্র সেটিংস সংরক্ষণ করুন'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
