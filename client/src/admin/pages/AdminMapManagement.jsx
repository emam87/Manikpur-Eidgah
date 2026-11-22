import React, { useState, useEffect, lazy, Suspense } from 'react';
import Papa from 'papaparse';
import {
  MapPin,
  Compass,
  Plus,
  Edit3,
  Trash2,
  Download,
  Upload,
  FileDown,
  X,
  Save,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { BilingualInput } from '../components/BilingualInput.jsx';
import {
  DEFAULT_MAP_LOCATION,
  MAP_PLACE_CATEGORIES,
  ROUTE_TRANSPORTS,
  validateCoordinatesClient,
} from '../../utils/mapUtils.js';
import { getImageUrl } from '../../utils/imageUrl.js';

const AdminMapEditor = lazy(() => import('../components/AdminMapEditor.jsx'));

const EMPTY_PLACE = {
  id: null,
  nameBn: '',
  nameEn: '',
  category: 'LANDMARK',
  noteBn: '',
  noteEn: '',
  lat: DEFAULT_MAP_LOCATION.lat,
  lng: DEFAULT_MAP_LOCATION.lng,
  photoKey: '',
  isPublished: true,
  sortOrder: 0,
};

const EMPTY_ROUTE = {
  id: null,
  fromNameBn: '',
  fromNameEn: '',
  transports: ['CNG', 'RICKSHAW'],
  approxMinutes: '',
  approxFare: '',
  notesBn: '',
  notesEn: '',
  isPublished: true,
  sortOrder: 0,
};

export function AdminMapManagement({ initialTab = 'places', embedded = false } = {}) {
  const [tab, setTab] = useState(initialTab); // 'places' | 'routes'
  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);
  const [places, setPlaces] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [placeModalOpen, setPlaceModalOpen] = useState(false);
  const [placeForm, setPlaceForm] = useState(EMPTY_PLACE);
  const [placeFile, setPlaceFile] = useState(null);
  const [savingPlace, setSavingPlace] = useState(false);

  const [routeModalOpen, setRouteModalOpen] = useState(false);
  const [routeForm, setRouteForm] = useState(EMPTY_ROUTE);
  const [savingRoute, setSavingRoute] = useState(false);

  const [message, setMessage] = useState('');

  const loadAll = async () => {
    setLoading(true);
    try {
      const [pRes, rRes] = await Promise.all([
        fetch('/api/admin/map-places'),
        fetch('/api/admin/route-guides'),
      ]);
      const pData = await pRes.json();
      const rData = await rRes.json();
      if (pData.success) setPlaces(pData.places || []);
      if (rData.success) setRoutes(rData.routes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const flash = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3500);
  };

  // --- PLACES CRUD ---
  const openNewPlace = () => {
    setPlaceForm(EMPTY_PLACE);
    setPlaceFile(null);
    setPlaceModalOpen(true);
  };

  const openEditPlace = (p) => {
    setPlaceForm({
      id: p.id,
      nameBn: p.nameBn || '',
      nameEn: p.nameEn || '',
      category: p.category || 'LANDMARK',
      noteBn: p.noteBn || '',
      noteEn: p.noteEn || '',
      lat: p.lat,
      lng: p.lng,
      photoKey: p.photoKey || '',
      isPublished: p.isPublished !== false,
      sortOrder: p.sortOrder || 0,
    });
    setPlaceFile(null);
    setPlaceModalOpen(true);
  };

  const handleSavePlace = async (e) => {
    e.preventDefault();
    setSavingPlace(true);
    try {
      const fd = new FormData();
      Object.entries(placeForm).forEach(([k, v]) => {
        if (k === 'id' || v === null || v === undefined) return;
        fd.append(k, String(v));
      });
      if (placeFile) fd.append('photo', placeFile);

      const url = placeForm.id ? `/api/admin/map-places/${placeForm.id}` : '/api/admin/map-places';
      const method = placeForm.id ? 'PUT' : 'POST';
      const res = await fetch(url, { method, body: fd });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || 'সংরক্ষণ ব্যর্থ হয়েছে।');
      } else {
        setPlaceModalOpen(false);
        flash(data.warning ? `সংরক্ষিত হয়েছে (${data.warning})` : 'স্থান সফলভাবে সংরক্ষিত হয়েছে।');
        loadAll();
      }
    } catch {
      alert('সার্ভারে সমস্যা হয়েছে।');
    } finally {
      setSavingPlace(false);
    }
  };

  const handleDeletePlace = async (id) => {
    if (!window.confirm('এই স্থানটি ট্র্যাশে সরাতে চান?')) return;
    const res = await fetch(`/api/admin/map-places/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      flash('স্থানটি ট্র্যাশে সরানো হয়েছে।');
      loadAll();
    }
  };

  const handleImportPlacesCsv = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const res = await fetch('/api/admin/map-places/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rows: results.data }),
        });
        const data = await res.json();
        if (data.success) {
          flash(`${data.imported}টি স্থান CSV থেকে আমদানি হয়েছে।`);
          loadAll();
        } else {
          alert(data.error || 'CSV আমদানি ব্যর্থ হয়েছে।');
        }
      },
    });
    e.target.value = '';
  };

  // --- ROUTE GUIDES CRUD ---
  const openNewRoute = () => {
    setRouteForm(EMPTY_ROUTE);
    setRouteModalOpen(true);
  };

  const openEditRoute = (r) => {
    setRouteForm({
      id: r.id,
      fromNameBn: r.fromNameBn || '',
      fromNameEn: r.fromNameEn || '',
      transports: Array.isArray(r.transports) ? r.transports : [],
      approxMinutes: r.approxMinutes || '',
      approxFare: r.approxFare || '',
      notesBn: r.notesBn || '',
      notesEn: r.notesEn || '',
      isPublished: r.isPublished !== false,
      sortOrder: r.sortOrder || 0,
    });
    setRouteModalOpen(true);
  };

  const toggleTransport = (key) => {
    setRouteForm((prev) => {
      const exists = prev.transports.includes(key);
      return {
        ...prev,
        transports: exists
          ? prev.transports.filter((t) => t !== key)
          : [...prev.transports, key],
      };
    });
  };

  const handleSaveRoute = async (e) => {
    e.preventDefault();
    setSavingRoute(true);
    try {
      const url = routeForm.id ? `/api/admin/route-guides/${routeForm.id}` : '/api/admin/route-guides';
      const method = routeForm.id ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(routeForm),
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || 'সংরক্ষণ ব্যর্থ হয়েছে।');
      } else {
        setRouteModalOpen(false);
        flash('পথ নির্দেশনা সফলভাবে সংরক্ষিত হয়েছে।');
        loadAll();
      }
    } catch {
      alert('সার্ভারে সমস্যা হয়েছে।');
    } finally {
      setSavingRoute(false);
    }
  };

  const handleDeleteRoute = async (id) => {
    if (!window.confirm('এই পথ নির্দেশনাটি ট্র্যাশে সরাতে চান?')) return;
    const res = await fetch(`/api/admin/route-guides/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      flash('পথ নির্দেশনা ট্র্যাশে সরানো হয়েছে।');
      loadAll();
    }
  };

  const handleImportRoutesCsv = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const res = await fetch('/api/admin/route-guides/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rows: results.data }),
        });
        const data = await res.json();
        if (data.success) {
          flash(`${data.imported}টি পথ নির্দেশনা CSV থেকে আমদানি হয়েছে।`);
          loadAll();
        } else {
          alert(data.error || 'CSV আমদানি ব্যর্থ হয়েছে।');
        }
      },
    });
    e.target.value = '';
  };

  const coordCheck = validateCoordinatesClient(placeForm.lat, placeForm.lng);

  return (
    <div className="space-y-6">
      {!embedded && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-2xl font-bold text-primary-dark">
              মানচিত্রের স্থান ও পথ নির্দেশনা
            </h1>
            <p className="text-xs text-ink-muted">
              পাবলিক /map পেজের গুরুত্বপূর্ণ স্থান (POI) এবং পৌঁছানোর পথ পরিচালনা করুন
            </p>
          </div>

          {message && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-success-soft text-success text-xs font-bold border border-success/30">
              <Check className="w-4 h-4" />
              <span>{message}</span>
            </div>
          )}
        </div>
      )}

      {embedded && message && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-success-soft text-success text-xs font-bold border border-success/30">
          <Check className="w-4 h-4" />
          <span>{message}</span>
        </div>
      )}

      {/* Tabs (hidden when embedded in Settings > Map sub-tabs) */}
      {!embedded && (
        <div className="flex items-center gap-2 border-b border-sand pb-3">
          <button
            type="button"
            onClick={() => setTab('places')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold min-h-[42px] ${
              tab === 'places'
                ? 'bg-primary text-white shadow-sakinah-sm'
                : 'bg-surface border border-sand text-primary-dark hover:bg-primary-soft/50'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>গুরুত্বপূর্ণ স্থান ({places.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('routes')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold min-h-[42px] ${
              tab === 'routes'
                ? 'bg-primary text-white shadow-sakinah-sm'
                : 'bg-surface border border-sand text-primary-dark hover:bg-primary-soft/50'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>পৌঁছানোর পথ ({routes.length})</span>
          </button>
        </div>
      )}

      {/* TAB 1: PLACES */}
      {tab === 'places' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <a
                href="/api/admin/map-places/export"
                className="px-3 py-2 rounded-xl bg-surface border border-sand text-xs font-bold text-primary-dark inline-flex items-center gap-1.5 hover:bg-canvas-alt"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV এক্সপোর্ট</span>
              </a>
              <a
                href="/api/admin/map-places/template"
                className="px-3 py-2 rounded-xl bg-surface border border-sand text-xs font-bold text-primary-dark inline-flex items-center gap-1.5 hover:bg-canvas-alt"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>নমুনা CSV</span>
              </a>
              <label className="px-3 py-2 rounded-xl bg-surface border border-sand text-xs font-bold text-primary-dark inline-flex items-center gap-1.5 hover:bg-canvas-alt cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>CSV ইমপোর্ট</span>
                <input type="file" accept=".csv" onChange={handleImportPlacesCsv} className="hidden" />
              </label>
            </div>

            <button
              type="button"
              onClick={openNewPlace}
              className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 shadow-sakinah-sm min-h-[42px]"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন স্থান যোগ করুন</span>
            </button>
          </div>

          {loading ? (
            <div className="h-40 rounded-2xl bg-surface border border-sand skeleton-shimmer" />
          ) : places.length === 0 ? (
            <div className="text-center py-12 bg-surface rounded-2xl border border-sand text-sm text-ink-muted">
              এখনও কোনো স্থান যোগ করা হয়নি।
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {places.map((p) => {
                const cat = MAP_PLACE_CATEGORIES[p.category] || MAP_PLACE_CATEGORIES.OTHER;
                const missingEn = !p.nameEn;
                return (
                  <div
                    key={p.id}
                    className="bg-surface rounded-2xl border border-sand p-4 flex items-start justify-between gap-3 shadow-sakinah-sm"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full bg-primary-soft text-primary-dark text-[11px] font-bold">
                          {cat.bn}
                        </span>
                        {!p.isPublished && (
                          <span className="px-2 py-0.5 rounded-full bg-warning-soft text-warning text-[10px] font-bold">
                            অপ্রকাশিত
                          </span>
                        )}
                        {missingEn && (
                          <span className="px-2 py-0.5 rounded-full bg-warning-soft text-warning text-[10px] font-bold">
                            ইংরেজি বাকি
                          </span>
                        )}
                      </div>
                      <h3 className="font-serif font-bold text-base text-primary-dark truncate">
                        {p.nameBn} {p.nameEn ? `(${p.nameEn})` : ''}
                      </h3>
                      <p className="text-xs font-mono text-ink-muted">
                        {Number(p.lat).toFixed(6)}, {Number(p.lng).toFixed(6)}
                      </p>
                      {p.noteBn && <p className="text-xs text-ink-muted line-clamp-2">{p.noteBn}</p>}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditPlace(p)}
                        className="p-2 rounded-lg bg-canvas-alt border border-sand text-primary-dark hover:bg-primary-soft"
                        aria-label="Edit place"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePlace(p.id)}
                        className="p-2 rounded-lg bg-danger-soft border border-danger/25 text-danger hover:bg-danger hover:text-white"
                        aria-label="Delete place"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ROUTE GUIDES */}
      {tab === 'routes' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <a
                href="/api/admin/route-guides/export"
                className="px-3 py-2 rounded-xl bg-surface border border-sand text-xs font-bold text-primary-dark inline-flex items-center gap-1.5 hover:bg-canvas-alt"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV এক্সপোর্ট</span>
              </a>
              <a
                href="/api/admin/route-guides/template"
                className="px-3 py-2 rounded-xl bg-surface border border-sand text-xs font-bold text-primary-dark inline-flex items-center gap-1.5 hover:bg-canvas-alt"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>নমুনা CSV</span>
              </a>
              <label className="px-3 py-2 rounded-xl bg-surface border border-sand text-xs font-bold text-primary-dark inline-flex items-center gap-1.5 hover:bg-canvas-alt cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>CSV ইমপোর্ট</span>
                <input type="file" accept=".csv" onChange={handleImportRoutesCsv} className="hidden" />
              </label>
            </div>

            <button
              type="button"
              onClick={openNewRoute}
              className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 shadow-sakinah-sm min-h-[42px]"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন পথ যোগ করুন</span>
            </button>
          </div>

          {loading ? (
            <div className="h-40 rounded-2xl bg-surface border border-sand skeleton-shimmer" />
          ) : routes.length === 0 ? (
            <div className="text-center py-12 bg-surface rounded-2xl border border-sand text-sm text-ink-muted">
              এখনও কোনো পথ নির্দেশনা যোগ করা হয়নি।
            </div>
          ) : (
            <div className="space-y-3">
              {routes.map((r) => {
                const missingEn = !r.fromNameEn;
                return (
                  <div
                    key={r.id}
                    className="bg-surface rounded-2xl border border-sand p-4 flex items-start justify-between gap-3 shadow-sakinah-sm"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {!r.isPublished && (
                          <span className="px-2 py-0.5 rounded-full bg-warning-soft text-warning text-[10px] font-bold">
                            অপ্রকাশিত
                          </span>
                        )}
                        {missingEn && (
                          <span className="px-2 py-0.5 rounded-full bg-warning-soft text-warning text-[10px] font-bold">
                            ইংরেজি বাকি
                          </span>
                        )}
                        {(r.transports || []).map((tr) => (
                          <span
                            key={tr}
                            className="px-2 py-0.5 rounded-full bg-primary-soft text-primary-dark text-[11px] font-semibold"
                          >
                            {ROUTE_TRANSPORTS[tr]?.bn || tr}
                          </span>
                        ))}
                      </div>
                      <h3 className="font-serif font-bold text-base text-primary-dark">
                        {r.fromNameBn} {r.fromNameEn ? `(${r.fromNameEn})` : ''}
                      </h3>
                      <p className="text-xs text-ink-muted">
                        {r.approxMinutes ? `সময়: ~${r.approxMinutes} মিনিট` : ''}
                        {r.approxFare ? ` • ভাড়া: ${r.approxFare}` : ''}
                      </p>
                      {r.notesBn && <p className="text-xs text-ink-muted line-clamp-2">{r.notesBn}</p>}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditRoute(r)}
                        className="p-2 rounded-lg bg-canvas-alt border border-sand text-primary-dark hover:bg-primary-soft"
                        aria-label="Edit route"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteRoute(r.id)}
                        className="p-2 rounded-lg bg-danger-soft border border-danger/25 text-danger hover:bg-danger hover:text-white"
                        aria-label="Delete route"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* PLACE MODAL */}
      {placeModalOpen && (
        <div className="fixed inset-0 z-50 bg-scrim/60 flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleSavePlace}
            className="bg-surface rounded-2xl border border-sand shadow-sakinah-lift w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-4 text-xs sm:text-sm"
          >
            <div className="flex items-center justify-between border-b border-sand pb-3">
              <h2 className="font-serif font-bold text-lg text-primary-dark">
                {placeForm.id ? 'স্থান সম্পাদনা' : 'নতুন স্থান যোগ করুন'}
              </h2>
              <button
                type="button"
                onClick={() => setPlaceModalOpen(false)}
                className="p-2 rounded-full hover:bg-canvas-alt text-ink-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <BilingualInput
              label="স্থানের নাম"
              required
              valueBn={placeForm.nameBn}
              valueEn={placeForm.nameEn}
              onChangeBn={(v) => setPlaceForm((p) => ({ ...p, nameBn: v }))}
              onChangeEn={(v) => setPlaceForm((p) => ({ ...p, nameEn: v }))}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-ink mb-1">বিভাগ</label>
                <select
                  value={placeForm.category}
                  onChange={(e) => setPlaceForm((p) => ({ ...p, category: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-sand bg-canvas text-ink"
                >
                  {Object.entries(MAP_PLACE_CATEGORIES).map(([k, m]) => (
                    <option key={k} value={k}>
                      {m.bn} ({m.en})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold text-ink mb-1">অক্ষাংশ (Latitude)</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={placeForm.lat}
                  onChange={(e) => setPlaceForm((p) => ({ ...p, lat: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 rounded-xl border border-sand bg-canvas text-ink font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-ink mb-1">দ্রাঘিমাংশ (Longitude)</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={placeForm.lng}
                  onChange={(e) => setPlaceForm((p) => ({ ...p, lng: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 rounded-xl border border-sand bg-canvas text-ink font-mono"
                />
              </div>
            </div>

            {coordCheck.warning && (
              <p className="text-xs text-warning flex items-center gap-1.5 bg-warning-soft px-3 py-2 rounded-xl">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{coordCheck.warning}</span>
              </p>
            )}

            <Suspense fallback={<div className="h-56 rounded-xl skeleton-shimmer" />}>
              <AdminMapEditor
                mode="pin"
                lat={placeForm.lat}
                lng={placeForm.lng}
                heightClass="h-56"
                onChangePin={(newLat, newLng) =>
                  setPlaceForm((p) => ({ ...p, lat: newLat, lng: newLng }))
                }
              />
            </Suspense>

            <BilingualInput
              label="সংক্ষিপ্ত বিবরণ (ঐচ্ছিক)"
              isTextArea
              rows={2}
              valueBn={placeForm.noteBn}
              valueEn={placeForm.noteEn}
              onChangeBn={(v) => setPlaceForm((p) => ({ ...p, noteBn: v }))}
              onChangeEn={(v) => setPlaceForm((p) => ({ ...p, noteEn: v }))}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
              <div>
                <label className="block font-bold text-ink mb-1">ছবি (ঐচ্ছিক)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPlaceFile(e.target.files?.[0] || null)}
                  className="w-full text-xs"
                />
                {placeForm.photoKey && !placeFile && (
                  <img
                    src={getImageUrl(placeForm.photoKey)}
                    alt=""
                    className="mt-1.5 w-20 h-14 object-cover rounded-lg border border-sand"
                  />
                )}
              </div>
              <div>
                <label className="block font-bold text-ink mb-1">ক্রম (Sort Order)</label>
                <input
                  type="number"
                  value={placeForm.sortOrder}
                  onChange={(e) => setPlaceForm((p) => ({ ...p, sortOrder: parseInt(e.target.value, 10) || 0 }))}
                  className="w-full px-3 py-2 rounded-xl border border-sand bg-canvas text-ink"
                />
              </div>
              <label className="flex items-center gap-2 pt-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={placeForm.isPublished}
                  onChange={(e) => setPlaceForm((p) => ({ ...p, isPublished: e.target.checked }))}
                  className="w-4 h-4 accent-primary"
                />
                <span className="font-bold text-ink">প্রকাশিত</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-sand">
              <button
                type="button"
                onClick={() => setPlaceModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-sand text-ink-muted font-bold"
              >
                বাতিল
              </button>
              <button
                type="submit"
                disabled={savingPlace}
                className="px-5 py-2 rounded-xl bg-primary text-white font-bold inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{savingPlace ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ROUTE MODAL */}
      {routeModalOpen && (
        <div className="fixed inset-0 z-50 bg-scrim/60 flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveRoute}
            className="bg-surface rounded-2xl border border-sand shadow-sakinah-lift w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-4 text-xs sm:text-sm"
          >
            <div className="flex items-center justify-between border-b border-sand pb-3">
              <h2 className="font-serif font-bold text-lg text-primary-dark">
                {routeForm.id ? 'পথ নির্দেশনা সম্পাদনা' : 'নতুন পথ নির্দেশনা'}
              </h2>
              <button
                type="button"
                onClick={() => setRouteModalOpen(false)}
                className="p-2 rounded-full hover:bg-canvas-alt text-ink-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <BilingualInput
              label="কোথা থেকে আসবেন (Starting Place)"
              required
              valueBn={routeForm.fromNameBn}
              valueEn={routeForm.fromNameEn}
              onChangeBn={(v) => setRouteForm((r) => ({ ...r, fromNameBn: v }))}
              onChangeEn={(v) => setRouteForm((r) => ({ ...r, fromNameEn: v }))}
            />

            <div>
              <label className="block font-bold text-ink mb-1.5">যাতায়াতের মাধ্যম</label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(ROUTE_TRANSPORTS).map(([k, m]) => {
                  const checked = routeForm.transports.includes(k);
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => toggleTransport(k)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                        checked
                          ? 'bg-primary text-white border-primary'
                          : 'bg-canvas-alt text-primary-dark border-sand'
                      }`}
                    >
                      {m.bn} ({m.en})
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-ink mb-1">আনুমানিক সময় (মিনিট)</label>
                <input
                  type="number"
                  min="1"
                  value={routeForm.approxMinutes}
                  onChange={(e) => setRouteForm((r) => ({ ...r, approxMinutes: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-sand bg-canvas text-ink"
                />
              </div>
              <div>
                <label className="block font-bold text-ink mb-1">আনুমানিক ভাড়া (ঐচ্ছিক)</label>
                <input
                  type="text"
                  value={routeForm.approxFare}
                  onChange={(e) => setRouteForm((r) => ({ ...r, approxFare: e.target.value }))}
                  placeholder="যেমন: ২০–৩০ টাকা"
                  className="w-full px-3 py-2 rounded-xl border border-sand bg-canvas text-ink"
                />
              </div>
              <div>
                <label className="block font-bold text-ink mb-1">ক্রম (Sort Order)</label>
                <input
                  type="number"
                  value={routeForm.sortOrder}
                  onChange={(e) => setRouteForm((r) => ({ ...r, sortOrder: parseInt(e.target.value, 10) || 0 }))}
                  className="w-full px-3 py-2 rounded-xl border border-sand bg-canvas text-ink"
                />
              </div>
            </div>

            <BilingualInput
              label="বিস্তারিত নির্দেশনা (ঐচ্ছিক)"
              isTextArea
              rows={3}
              valueBn={routeForm.notesBn}
              valueEn={routeForm.notesEn}
              onChangeBn={(v) => setRouteForm((r) => ({ ...r, notesBn: v }))}
              onChangeEn={(v) => setRouteForm((r) => ({ ...r, notesEn: v }))}
            />

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={routeForm.isPublished}
                onChange={(e) => setRouteForm((r) => ({ ...r, isPublished: e.target.checked }))}
                className="w-4 h-4 accent-primary"
              />
              <span className="font-bold text-ink">প্রকাশিত</span>
            </label>

            <div className="flex justify-end gap-2 pt-3 border-t border-sand">
              <button
                type="button"
                onClick={() => setRouteModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-sand text-ink-muted font-bold"
              >
                বাতিল
              </button>
              <button
                type="submit"
                disabled={savingRoute}
                className="px-5 py-2 rounded-xl bg-primary text-white font-bold inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{savingRoute ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
