/**
 * Shared Map & Geographic Helpers (Server-side + Unit Tests)
 * - Single source of truth defaults for Manikpur Eidgah
 * - Exact known-wrong coordinate migration guard
 * - Strict 4-step Google Maps URL coordinate extractor (with Bangla digit support)
 * - Open Location Code (Plus Code) encoder
 * - Haversine distance & WGS84 geodesic polygon area
 * - GeoJSON Polygon & Bangladesh bounding-box validation
 */

export const DEFAULT_MAP_LOCATION = {
  lat: 23.0199269,
  lng: 91.2112393,
  zoom: 17,
  placeNameBn: 'মানিকপুর ঈদগাহ',
  placeNameEn: 'Manikpur Eidgah',
  googlePlaceUrl: 'https://maps.app.goo.gl/g9bU9iHkgNdrsZ9PA',
  googlePlaceId: '0x37549fe00e9dd21b:0x7941acb63efcee4a',
};

export const LEGACY_PLACEHOLDER_COORDS = {
  lat: 23.8103,
  lng: 90.4125,
};

/**
 * Known wrong coordinate pairs that should be migrated one-time to the exact pin:
 * 1. (23.8103, 90.4125) — old Dhaka placeholder
 * 2. (23.019842, 91.2076296) — old viewport-centre value #1
 * 3. (23.0200482, 91.2079419) — old viewport-centre value #2
 */
export const KNOWN_WRONG_COORDS = [
  { lat: 23.8103, lng: 90.4125, label: 'old Dhaka placeholder' },
  { lat: 23.019842, lng: 91.2076296, label: 'old Google viewport centre #1' },
  { lat: 23.0200482, lng: 91.2079419, label: 'old Google viewport centre #2' },
];

export const BANGLADESH_BBOX = {
  minLat: 20.34,
  maxLat: 26.64,
  minLng: 88.01,
  maxLng: 92.68,
};

export const VIEWPORT_FALLBACK_WARNING_EN =
  'This link only contains the map view centre, not an exact pin. Please check the pin position on the map before saving.';
export const VIEWPORT_FALLBACK_WARNING_BN =
  'এই লিংকে শুধুমাত্র মানচিত্রের কেন্দ্রের স্থানাঙ্ক আছে, সঠিক পিন নয়। সংরক্ষণের আগে মানচিত্রে পিনের অবস্থান যাচাই করুন।';

const BN_DIGIT_MAP = {
  '০': '0',
  '১': '1',
  '২': '2',
  '৩': '3',
  '৪': '4',
  '৫': '5',
  '৬': '6',
  '৭': '7',
  '৮': '8',
  '৯': '9',
};

export function normalizeBanglaDigits(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[০-৯]/g, (d) => BN_DIGIT_MAP[d] ?? d);
}

/**
 * Checks whether stored lat/lng match one of the exact known-wrong coordinate pairs.
 */
export function matchKnownWrongCoords(lat, lng) {
  const numLat = Number(lat);
  const numLng = Number(lng);
  if (!Number.isFinite(numLat) || !Number.isFinite(numLng)) return null;
  for (const item of KNOWN_WRONG_COORDS) {
    if (Math.abs(numLat - item.lat) < 1e-6 && Math.abs(numLng - item.lng) < 1e-6) {
      return item;
    }
  }
  return null;
}

export function isExactPlaceholderCoords(lat, lng) {
  return Boolean(matchKnownWrongCoords(lat, lng));
}

/**
 * Computes whether a migration should update existing rows.
 * Touches ONLY exact matches in KNOWN_WRONG_COORDS.
 */
export function resolvePlaceholderCoordinateMigration(currentLat, currentLng) {
  const matched = matchKnownWrongCoords(currentLat, currentLng);
  if (matched) {
    return {
      shouldUpdate: true,
      matchedLabel: matched.label,
      previousLat: String(currentLat),
      previousLng: String(currentLng),
      lat: String(DEFAULT_MAP_LOCATION.lat),
      lng: String(DEFAULT_MAP_LOCATION.lng),
    };
  }
  return {
    shouldUpdate: false,
    matchedLabel: null,
    lat: String(currentLat ?? DEFAULT_MAP_LOCATION.lat),
    lng: String(currentLng ?? DEFAULT_MAP_LOCATION.lng),
  };
}

/**
 * Validate numeric coordinates and return optional Bangladesh bounding-box warning.
 */
export function validateCoordinates(lat, lng) {
  const numLat = Number(normalizeBanglaDigits(String(lat ?? '')).trim());
  const numLng = Number(normalizeBanglaDigits(String(lng ?? '')).trim());
  if (!Number.isFinite(numLat) || numLat < -90 || numLat > 90) {
    return { valid: false, error: 'Latitude must be between -90 and 90.' };
  }
  if (!Number.isFinite(numLng) || numLng < -180 || numLng > 180) {
    return { valid: false, error: 'Longitude must be between -180 and 180.' };
  }
  const outsideBangladesh =
    numLat < BANGLADESH_BBOX.minLat ||
    numLat > BANGLADESH_BBOX.maxLat ||
    numLng < BANGLADESH_BBOX.minLng ||
    numLng > BANGLADESH_BBOX.maxLng;

  return {
    valid: true,
    lat: numLat,
    lng: numLng,
    warning: outsideBangladesh
      ? 'Coordinates appear outside Bangladesh bounding box. Please double-check.'
      : null,
  };
}

/**
 * Validate GeoJSON Polygon or Feature<Polygon>.
 */
export function validateGeoJsonPolygon(input) {
  if (input === null || input === undefined || input === '') {
    return { valid: true, normalized: null };
  }

  let parsed = input;
  if (typeof input === 'string') {
    try {
      parsed = JSON.parse(input);
    } catch {
      return { valid: false, error: 'Invalid JSON format for GeoJSON polygon.' };
    }
  }

  if (!parsed || typeof parsed !== 'object') {
    return { valid: false, error: 'GeoJSON must be an object.' };
  }

  const geometry = parsed.type === 'Feature' ? parsed.geometry : parsed;
  if (!geometry || geometry.type !== 'Polygon' || !Array.isArray(geometry.coordinates)) {
    return { valid: false, error: 'GeoJSON must be a Polygon or Feature with Polygon geometry.' };
  }

  const outerRing = geometry.coordinates[0];
  if (!Array.isArray(outerRing) || outerRing.length < 4) {
    return { valid: false, error: 'Polygon outer ring must contain at least 4 coordinate pairs.' };
  }

  for (const pt of outerRing) {
    if (
      !Array.isArray(pt) ||
      pt.length < 2 ||
      !Number.isFinite(Number(pt[0])) ||
      !Number.isFinite(Number(pt[1])) ||
      Number(pt[0]) < -180 ||
      Number(pt[0]) > 180 ||
      Number(pt[1]) < -90 ||
      Number(pt[1]) > 90
    ) {
      return { valid: false, error: 'Invalid coordinate pair in Polygon ring.' };
    }
  }

  return { valid: true, normalized: parsed };
}

/**
 * Extract coordinates from Google Maps URLs or plain "lat, lng" (including Bangla digits).
 * Strict priority:
 * 1. !3d<lat>!4d<lng> (exact pin, including /place/.../data=...!8m2!3d..!4d..)
 * 2. Query params: destination=, query=, q=, ll=, daddr=, viewpoint=
 * 3. Plain "lat, lng" text (supports Bangla digits)
 * 4. Last-resort fallback: @lat,lng (viewport centre) with explicit warning!
 */
export function extractCoordsFromGoogleMapsUrl(rawInput) {
  if (!rawInput || typeof rawInput !== 'string') {
    return { ok: false, reason: 'empty' };
  }
  const normalized = normalizeBanglaDigits(rawInput).trim();
  if (!normalized) return { ok: false, reason: 'empty' };

  if (/^https?:\/\/(maps\.app\.goo\.gl|goo\.gl\/maps|g\.co\/maps)/i.test(normalized)) {
    return { ok: false, isShortLink: true, reason: 'short_link' };
  }

  // Priority 1 & 3: !3dLAT!4dLNG (exact pin; use last match if multiple !3d!4d exist in data=)
  const pinMatches = Array.from(
    normalized.matchAll(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/g)
  );
  if (pinMatches.length > 0) {
    const last = pinMatches[pinMatches.length - 1];
    const check = validateCoordinates(last[1], last[2]);
    if (check.valid) {
      return {
        ok: true,
        lat: check.lat,
        lng: check.lng,
        sourceType: 'pin',
        isFallbackViewport: false,
        warning: check.warning,
      };
    }
    return { ok: false, reason: 'out_of_range', error: check.error };
  }

  // Priority 2: Query parameters (destination=, query=, q=, ll=, daddr=, viewpoint=)
  const queryMatch = normalized.match(
    /[?&](?:destination|query|q|ll|daddr|viewpoint)=(-?\d+(?:\.\d+)?)(?:,|%2C)\s*(-?\d+(?:\.\d+)?)/i
  );
  if (queryMatch) {
    const check = validateCoordinates(queryMatch[1], queryMatch[2]);
    if (check.valid) {
      return {
        ok: true,
        lat: check.lat,
        lng: check.lng,
        sourceType: 'query',
        isFallbackViewport: false,
        warning: check.warning,
      };
    }
    return { ok: false, reason: 'out_of_range', error: check.error };
  }

  // Plain "lat, lng" (Bangla or Latin digits)
  const plainMatch = normalized.match(/^\s*(-?\d+(?:\.\d+)?)\s*[,;\s]\s*(-?\d+(?:\.\d+)?)\s*$/);
  if (plainMatch) {
    const check = validateCoordinates(plainMatch[1], plainMatch[2]);
    if (check.valid) {
      return {
        ok: true,
        lat: check.lat,
        lng: check.lng,
        sourceType: 'plain',
        isFallbackViewport: false,
        warning: check.warning,
      };
    }
    return { ok: false, reason: 'out_of_range', error: check.error };
  }

  // Priority 4 (Last-resort fallback): @lat,lng (map viewport centre only — NOT the pin)
  const viewportMatch = normalized.match(/@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/);
  if (viewportMatch) {
    const check = validateCoordinates(viewportMatch[1], viewportMatch[2]);
    if (check.valid) {
      return {
        ok: true,
        lat: check.lat,
        lng: check.lng,
        sourceType: 'viewport_fallback',
        isFallbackViewport: true,
        warning: VIEWPORT_FALLBACK_WARNING_EN,
        warningBn: VIEWPORT_FALLBACK_WARNING_BN,
      };
    }
    return { ok: false, reason: 'out_of_range', error: check.error };
  }

  return { ok: false, reason: 'not_found' };
}

/**
 * Build platform-safe navigation, place, and Street View URLs from single-source coordinates.
 * When optional navLat/navLng are provided (e.g. main gate / parking), direction links lead there
 * while Street View / search fallback remain anchored on the main pin.
 */
export function buildNavigationLinks({
  lat,
  lng,
  navLat = null,
  navLng = null,
  name = 'Manikpur Eidgah',
  googlePlaceUrl = '',
}) {
  const pinLat = Number(lat);
  const pinLng = Number(lng);
  const targetLat = navLat !== null && navLat !== '' && Number.isFinite(Number(navLat)) ? Number(navLat) : pinLat;
  const targetLng = navLng !== null && navLng !== '' && Number.isFinite(Number(navLng)) ? Number(navLng) : pinLng;

  const pinStr = `${pinLat},${pinLng}`;
  const targetStr = `${targetLat},${targetLng}`;
  const encodedName = encodeURIComponent(name || 'Manikpur Eidgah');

  return {
    googleDirections: `https://www.google.com/maps/dir/?api=1&destination=${targetStr}`,
    appleMaps: `https://maps.apple.com/?daddr=${targetStr}&dirflg=d`,
    waze: `https://waze.com/ul?ll=${targetStr}&navigate=yes`,
    androidGeo: `geo:${targetStr}?q=${targetStr}(${encodedName})`,
    googlePlace:
      googlePlaceUrl && /^https?:\/\//i.test(googlePlaceUrl.trim())
        ? googlePlaceUrl.trim()
        : `https://www.google.com/maps/search/?api=1&query=${pinStr}`,
    streetView: `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${pinStr}`,
  };
}

/**
 * Haversine straight-line distance in kilometers.
 */
export function haversineDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function haversineDistanceMeters(lat1, lng1, lat2, lng2) {
  return haversineDistanceKm(lat1, lng1, lat2, lng2) * 1000;
}

/**
 * Spherical excess geodesic area (sq meters) for a GeoJSON Polygon or Feature<Polygon>.
 */
export function computePolygonAreaSqM(geojson) {
  const check = validateGeoJsonPolygon(geojson);
  if (!check.valid || !check.normalized) return 0;

  const geometry = check.normalized.type === 'Feature' ? check.normalized.geometry : check.normalized;
  const ring = geometry.coordinates[0];
  if (!Array.isArray(ring) || ring.length < 3) return 0;

  const R = 6378137;
  const toRad = (deg) => (deg * Math.PI) / 180;
  let total = 0;

  for (let i = 0; i < ring.length - 1; i++) {
    const [lng1, lat1] = ring[i];
    const [lng2, lat2] = ring[i + 1];
    total += toRad(lng2 - lng1) * (2 + Math.sin(toRad(lat1)) + Math.sin(toRad(lat2)));
  }

  return Math.abs((total * R * R) / 2);
}

export function sqMetersToDecimal(sqM, sqftPerDecimal = 435.6) {
  const area = Number(sqM);
  if (!Number.isFinite(area) || area <= 0) return 0;
  return (area * 10.7639104167) / (Number(sqftPerDecimal) || 435.6);
}

const OLC_ALPHABET = '23456789CFGHJMPQRVWX';
const OLC_ENCODING_BASE = 20;
const OLC_PAIR_CODE_LENGTH = 10;
const OLC_SEPARATOR = '+';
const OLC_SEPARATOR_POSITION = 8;

export function encodePlusCode(latitude, longitude, codeLength = OLC_PAIR_CODE_LENGTH) {
  let lat = Math.min(90, Math.max(-90, Number(latitude)));
  let lng = Number(longitude);
  while (lng < -180) lng += 360;
  while (lng >= 180) lng -= 360;

  if (lat === 90) {
    lat -= Math.pow(20, Math.floor(codeLength / -2 + 2)) / 2;
  }

  const length = Math.min(OLC_PAIR_CODE_LENGTH, Math.max(2, codeLength - (codeLength % 2)));

  let latVal = Math.floor((Math.round((lat + 90) * 1e6) * 8000) / 1e6);
  let lngVal = Math.floor((Math.round((lng + 180) * 1e6) * 8000) / 1e6);

  let code = '';
  for (let i = 0; i < 5; i++) {
    const lngDigit = lngVal % OLC_ENCODING_BASE;
    const latDigit = latVal % OLC_ENCODING_BASE;
    code = OLC_ALPHABET[latDigit] + OLC_ALPHABET[lngDigit] + code;
    latVal = Math.floor(latVal / OLC_ENCODING_BASE);
    lngVal = Math.floor(lngVal / OLC_ENCODING_BASE);
  }

  code = code.slice(0, OLC_SEPARATOR_POSITION) + OLC_SEPARATOR + code.slice(OLC_SEPARATOR_POSITION);
  if (length < OLC_SEPARATOR_POSITION) {
    return code.slice(0, length) + '0'.repeat(OLC_SEPARATOR_POSITION - length) + OLC_SEPARATOR;
  }
  return code.slice(0, length + 1);
}
