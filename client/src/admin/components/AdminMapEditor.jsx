import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Undo2, Trash2, Upload, Download, Check, AlertTriangle, Layers } from 'lucide-react';
import {
  DEFAULT_MAP_LOCATION,
  MAP_TILE_CONFIG,
  computePolygonAreaSqM,
  sqMetersToDecimal,
} from '../../utils/mapUtils.js';

function getToken(name, fallback) {
  if (typeof window === 'undefined') return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

function createDraggablePinIcon(isNavPoint = false) {
  const bg = isNavPoint ? 'var(--gold-text)' : 'var(--primary)';
  const border = isNavPoint ? 'white' : 'var(--gold)';
  return L.divIcon({
    className: 'admin-draggable-pin',
    iconSize: [34, 42],
    iconAnchor: [17, 40],
    html: `<div style="width:34px;height:34px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${bg};border:2.5px solid ${border};box-shadow:0 4px 12px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;cursor:grab;">
      <span style="width:10px;height:10px;border-radius:9999px;background:white;transform:rotate(45deg);"></span>
    </div>`,
  });
}

function extractVerticesFromGeoJson(geojson) {
  if (!geojson) return [];
  let parsed = geojson;
  if (typeof geojson === 'string') {
    try {
      parsed = JSON.parse(geojson);
    } catch {
      return [];
    }
  }
  const geom = parsed?.type === 'Feature' ? parsed.geometry : parsed;
  if (!geom || geom.type !== 'Polygon' || !Array.isArray(geom.coordinates?.[0])) return [];
  const ring = geom.coordinates[0];
  if (ring.length < 3) return [];
  const pts = ring.map(([lng, lat]) => [Number(lat), Number(lng)]);
  if (
    pts.length > 1 &&
    pts[0][0] === pts[pts.length - 1][0] &&
    pts[0][1] === pts[pts.length - 1][1]
  ) {
    pts.pop();
  }
  return pts;
}

function verticesToGeoJson(vertices, name = 'Polygon') {
  if (!Array.isArray(vertices) || vertices.length < 3) return null;
  const ring = vertices.map(([lat, lng]) => [
    Number(lng.toFixed(7)),
    Number(lat.toFixed(7)),
  ]);
  ring.push([...ring[0]]);
  return {
    type: 'Feature',
    properties: { name },
    geometry: {
      type: 'Polygon',
      coordinates: [ring],
    },
  };
}

/**
 * Reusable Admin Leaflet Editor supporting:
 * - mode="pin": draggable pin + click-to-place pin + optional satellite toggle
 * - mode="view": read-only live preview synced to zoom + satellite toggle
 * - mode="polygon": click map to add polygon vertices, undo/clear, import/export GeoJSON, live area
 */
export function AdminMapEditor({
  mode = 'pin',
  lat = DEFAULT_MAP_LOCATION.lat,
  lng = DEFAULT_MAP_LOCATION.lng,
  zoom = 17,
  geojson = null,
  sqftPerDecimal = 435.6,
  isNavPoint = false,
  showSatelliteToggle = true,
  initialSatellite = false,
  onChangePin,
  onChangeGeoJson,
  heightClass = 'h-72',
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const tileLayerRef = useRef(null);
  const pinMarkerRef = useRef(null);
  const polyLayerRef = useRef(null);

  const [useSatellite, setUseSatellite] = useState(Boolean(initialSatellite));
  const [vertices, setVertices] = useState(() => extractVerticesFromGeoJson(geojson));
  const [importText, setImportText] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [importError, setImportError] = useState('');

  useEffect(() => {
    setUseSatellite(Boolean(initialSatellite));
  }, [initialSatellite]);

  useEffect(() => {
    if (mode === 'polygon') {
      setVertices(extractVerticesFromGeoJson(geojson));
    }
  }, [geojson, mode]);

  // Initialize Leaflet map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return undefined;

    const safeLat = Number.isFinite(Number(lat)) ? Number(lat) : DEFAULT_MAP_LOCATION.lat;
    const safeLng = Number.isFinite(Number(lng)) ? Number(lng) : DEFAULT_MAP_LOCATION.lng;

    const map = L.map(containerRef.current, {
      center: [safeLat, safeLng],
      zoom: Number(zoom) || 17,
    });

    map.on('click', (e) => {
      const clickLat = Number(e.latlng.lat.toFixed(7));
      const clickLng = Number(e.latlng.lng.toFixed(7));
      if (mode === 'pin') {
        onChangePin?.(clickLat, clickLng);
      } else if (mode === 'polygon') {
        setVertices((prev) => {
          const next = [...prev, [clickLat, clickLng]];
          onChangeGeoJson?.(next.length >= 3 ? verticesToGeoJson(next) : null);
          return next;
        });
      }
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      pinMarkerRef.current = null;
      tileLayerRef.current = null;
      polyLayerRef.current = null;
    };
  }, [mode]);

  // Sync base tile layer (Map / Satellite)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }

    const canSat = Boolean(useSatellite && MAP_TILE_CONFIG.satelliteUrl);
    tileLayerRef.current = L.tileLayer(
      canSat ? MAP_TILE_CONFIG.satelliteUrl : MAP_TILE_CONFIG.osmUrl,
      {
        attribution: canSat
          ? MAP_TILE_CONFIG.satelliteAttribution
          : MAP_TILE_CONFIG.osmAttribution,
        maxZoom: 19,
      }
    ).addTo(map);
  }, [useSatellite]);

  // Sync zoom for View preview mode
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const z = Number(zoom);
    if (Number.isFinite(z) && z >= 10 && z <= 19) {
      map.setZoom(z);
    }
  }, [zoom]);

  // Update draggable pin marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || (mode !== 'pin' && mode !== 'view')) return;

    const safeLat = Number(lat);
    const safeLng = Number(lng);
    if (!Number.isFinite(safeLat) || !Number.isFinite(safeLng)) return;

    if (!pinMarkerRef.current) {
      const marker = L.marker([safeLat, safeLng], {
        icon: createDraggablePinIcon(isNavPoint),
        draggable: mode === 'pin',
      }).addTo(map);

      if (mode === 'pin') {
        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          onChangePin?.(Number(pos.lat.toFixed(7)), Number(pos.lng.toFixed(7)));
        });
      }
      pinMarkerRef.current = marker;
    } else {
      pinMarkerRef.current.setLatLng([safeLat, safeLng]);
    }
    map.setView([safeLat, safeLng], map.getZoom(), { animate: true });
  }, [lat, lng, mode, isNavPoint]);

  // Update polygon layer
  useEffect(() => {
    const map = mapRef.current;
    if (!map || mode !== 'polygon') return;

    if (polyLayerRef.current) {
      map.removeLayer(polyLayerRef.current);
      polyLayerRef.current = null;
    }

    const group = L.layerGroup();
    vertices.forEach((pt, idx) => {
      L.circleMarker(pt, {
        radius: 6,
        color: 'white',
        weight: 2,
        fillColor: getToken('--primary-dark', 'rgb(27, 94, 69)'),
        fillOpacity: 1,
      })
        .bindTooltip(`#${idx + 1}`)
        .addTo(group);
    });

    if (vertices.length >= 3) {
      L.polygon(vertices, {
        color: getToken('--gold', 'rgb(201, 162, 75)'),
        weight: 2,
        fillColor: getToken('--primary', 'rgb(36, 122, 89)'),
        fillOpacity: 0.22,
      }).addTo(group);
    } else if (vertices.length === 2) {
      L.polyline(vertices, {
        color: getToken('--gold', 'rgb(201, 162, 75)'),
        weight: 2,
        dashArray: '4, 4',
      }).addTo(group);
    }

    group.addTo(map);
    polyLayerRef.current = group;
  }, [vertices, mode]);

  const currentGeoJson =
    mode === 'polygon' && vertices.length >= 3 ? verticesToGeoJson(vertices) : null;
  const areaSqM = currentGeoJson ? computePolygonAreaSqM(currentGeoJson) : 0;
  const areaDecimal = sqMetersToDecimal(areaSqM, sqftPerDecimal);

  const handleUndoVertex = () => {
    setVertices((prev) => {
      const next = prev.slice(0, -1);
      onChangeGeoJson?.(next.length >= 3 ? verticesToGeoJson(next) : null);
      return next;
    });
  };

  const handleClearPolygon = () => {
    setVertices([]);
    onChangeGeoJson?.(null);
  };

  const handleExportGeoJson = () => {
    if (!currentGeoJson) return;
    const blob = new Blob([JSON.stringify(currentGeoJson, null, 2)], {
      type: 'application/geo+json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'manikpur-eidgah-polygon.geojson';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportGeoJson = () => {
    setImportError('');
    try {
      const parsed = JSON.parse(importText);
      const pts = extractVerticesFromGeoJson(parsed);
      if (pts.length < 3) {
        setImportError('বৈধ GeoJSON Polygon নয় (কমপক্ষে ৩টি বিন্দু প্রয়োজন)।');
        return;
      }
      setVertices(pts);
      onChangeGeoJson?.(verticesToGeoJson(pts));
      setShowImport(false);
      setImportText('');
      if (mapRef.current && pts.length > 0) {
        mapRef.current.fitBounds(L.latLngBounds(pts), { padding: [30, 30] });
      }
    } catch {
      setImportError('JSON ফরম্যাট সঠিক নয়।');
    }
  };

  return (
    <div className="space-y-2.5">
      <div className="relative">
        <div
          ref={containerRef}
          className={`w-full ${heightClass} rounded-xl overflow-hidden border border-sand bg-canvas-alt z-0`}
        />

        {showSatelliteToggle && MAP_TILE_CONFIG.satelliteUrl && (
          <button
            type="button"
            onClick={() => setUseSatellite((s) => !s)}
            className="absolute top-2.5 right-2.5 z-[400] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface/95 border border-sand shadow-sakinah-sm text-xs font-bold text-primary-dark hover:bg-primary-soft min-h-[36px]"
          >
            <Layers className="w-3.5 h-3.5 text-primary" />
            <span>{useSatellite ? 'মানচিত্র (Map)' : 'স্যাটেলাইট (Satellite)'}</span>
          </button>
        )}
      </div>

      {mode === 'polygon' && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-ink-muted">
              মানচিত্রে ক্লিক করে সীমানার কোণা যোগ করুন (বিন্দু: <strong>{vertices.length}</strong>)
              {areaSqM > 0 && (
                <span className="ml-2 font-bold text-primary-dark">
                  • ক্ষেত্রফল: {Math.round(areaSqM).toLocaleString()} বর্গমি. (
                  {(Math.round(areaDecimal * 100) / 100).toFixed(2)} শতাংশ)
                </span>
              )}
            </span>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={handleUndoVertex}
                disabled={vertices.length === 0}
                className="px-2.5 py-1.5 rounded-lg bg-canvas-alt border border-sand text-ink font-semibold inline-flex items-center gap-1 disabled:opacity-40"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>আনডু</span>
              </button>
              <button
                type="button"
                onClick={handleClearPolygon}
                disabled={vertices.length === 0}
                className="px-2.5 py-1.5 rounded-lg bg-danger-soft text-danger border border-danger/25 font-semibold inline-flex items-center gap-1 disabled:opacity-40"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>মুছুন</span>
              </button>
              <button
                type="button"
                onClick={() => setShowImport((v) => !v)}
                className="px-2.5 py-1.5 rounded-lg bg-canvas-alt border border-sand text-primary-dark font-semibold inline-flex items-center gap-1"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>GeoJSON ইমপোর্ট</span>
              </button>
              <button
                type="button"
                onClick={handleExportGeoJson}
                disabled={!currentGeoJson}
                className="px-2.5 py-1.5 rounded-lg bg-canvas-alt border border-sand text-primary-dark font-semibold inline-flex items-center gap-1 disabled:opacity-40"
              >
                <Download className="w-3.5 h-3.5" />
                <span>এক্সপোর্ট</span>
              </button>
            </div>
          </div>

          {showImport && (
            <div className="p-3 rounded-xl bg-canvas-alt border border-sand space-y-2">
              <textarea
                rows={4}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder='{"type":"Polygon","coordinates":[[[91.21,23.02],...]]}'
                className="w-full px-3 py-2 rounded-lg border border-sand bg-surface text-xs font-mono text-ink"
              />
              {importError && (
                <p className="text-xs text-danger flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{importError}</span>
                </p>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowImport(false)}
                  className="px-3 py-1.5 rounded-lg border border-sand text-xs font-semibold text-ink-muted"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleImportGeoJson}
                  className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold inline-flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>প্রয়োগ করুন</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminMapEditor;
