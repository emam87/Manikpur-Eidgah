import {
  Landmark,
  DoorOpen,
  ParkingCircle,
  Droplets,
  Trees,
  Building2,
  Waves,
  MapPin,
  Compass,
  Bus,
  Car,
  Bike,
  Footprints,
  Navigation,
} from 'lucide-react';

export const DEFAULT_MAP_LOCATION = {
  lat: 23.0199269,
  lng: 91.2112393,
  zoom: 17,
  placeNameBn: 'মানিকপুর ঈদগাহ',
  placeNameEn: 'Manikpur Eidgah',
  googlePlaceUrl: 'https://maps.app.goo.gl/g9bU9iHkgNdrsZ9PA',
  googlePlaceId: '0x37549fe00e9dd21b:0x7941acb63efcee4a',
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

export const BANGLADESH_BBOX = {
  minLat: 20.34,
  maxLat: 26.64,
  minLng: 88.01,
  maxLng: 92.68,
};

export const MAP_TILE_CONFIG = {
  osmUrl:
    import.meta.env.VITE_MAP_TILE_URL ||
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  osmAttribution:
    import.meta.env.VITE_MAP_TILE_ATTRIBUTION ||
    '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
  satelliteUrl:
    import.meta.env.VITE_MAP_SATELLITE_URL !== undefined
      ? import.meta.env.VITE_MAP_SATELLITE_URL
      : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  satelliteAttribution:
    import.meta.env.VITE_MAP_SATELLITE_ATTRIBUTION ||
    'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
};

export const MAP_PLACE_CATEGORIES = {
  EIDGAH_GROUND: { bn: 'ঈদগাহ ময়দান', en: 'Eidgah Ground', icon: Landmark },
  ENTRANCE: { bn: 'প্রবেশদ্বার / গেট', en: 'Entrance / Gate', icon: DoorOpen },
  PARKING: { bn: 'পার্কিং', en: 'Parking', icon: ParkingCircle },
  WUDU: { bn: 'ওজুখানা', en: 'Wudu Area', icon: Droplets },
  GRAVEYARD: { bn: 'কবরস্থান', en: 'Graveyard', icon: Trees },
  MOSQUE: { bn: 'মসজিদ', en: 'Mosque', icon: Building2 },
  POND: { bn: 'পুকুর', en: 'Pond', icon: Waves },
  LANDMARK: { bn: 'রাস্তা / পরিচিত স্থান', en: 'Road / Landmark', icon: MapPin },
  OTHER: { bn: 'অন্যান্য', en: 'Other', icon: Compass },
};

export const ROUTE_TRANSPORTS = {
  BUS: { bn: 'বাস', en: 'Bus', icon: Bus },
  CNG: { bn: 'সিএনজি / অটো', en: 'CNG / Auto', icon: Navigation },
  RICKSHAW: { bn: 'রিকশা', en: 'Rickshaw', icon: Bike },
  WALK: { bn: 'পায়ে হেঁটে', en: 'Walk', icon: Footprints },
  CAR: { bn: 'নিজস্ব গাড়ি', en: 'Own Vehicle', icon: Car },
};

export function detectPlatform() {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent || '';
  if (/iPad|iPhone|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
    return 'ios';
  }
  if (/Android/i.test(ua)) return 'android';
  return 'desktop';
}

export function isLowDataOrLiteMode() {
  if (typeof window === 'undefined') return false;
  if (document.documentElement.classList.contains('lite-mode')) return true;
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (conn) {
    if (conn.saveData) return true;
    if (conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g') return true;
  }
  return false;
}

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
  const targetLat =
    navLat !== null && navLat !== '' && Number.isFinite(Number(navLat))
      ? Number(navLat)
      : pinLat;
  const targetLng =
    navLng !== null && navLng !== '' && Number.isFinite(Number(navLng))
      ? Number(navLng)
      : pinLng;

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

export function computePolygonAreaSqM(geojson) {
  if (!geojson) return 0;
  let parsed = geojson;
  if (typeof geojson === 'string') {
    try {
      parsed = JSON.parse(geojson);
    } catch {
      return 0;
    }
  }
  const geometry = parsed?.type === 'Feature' ? parsed.geometry : parsed;
  if (!geometry || geometry.type !== 'Polygon' || !Array.isArray(geometry.coordinates?.[0])) {
    return 0;
  }
  const ring = geometry.coordinates[0];
  if (ring.length < 3) return 0;

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

// Open Location Code (Plus Code) 10-character full code encoder
const OLC_ALPHABET = '23456789CFGHJMPQRVWX';
export function encodePlusCode(latitude, longitude) {
  let lat = Math.min(90, Math.max(-90, Number(latitude)));
  let lng = Number(longitude);
  while (lng < -180) lng += 360;
  while (lng >= 180) lng -= 360;
  if (lat === 90) lat -= 0.000125;

  let latVal = Math.floor((Math.round((lat + 90) * 1e6) * 8000) / 1e6);
  let lngVal = Math.floor((Math.round((lng + 180) * 1e6) * 8000) / 1e6);

  let code = '';
  for (let i = 0; i < 5; i++) {
    code = OLC_ALPHABET[latVal % 20] + OLC_ALPHABET[lngVal % 20] + code;
    latVal = Math.floor(latVal / 20);
    lngVal = Math.floor(lngVal / 20);
  }
  return `${code.slice(0, 8)}+${code.slice(8)}`;
}

export function validateCoordinatesClient(lat, lng) {
  const numLat = Number(normalizeBanglaDigits(String(lat ?? '')).trim());
  const numLng = Number(normalizeBanglaDigits(String(lng ?? '')).trim());
  if (!Number.isFinite(numLat) || numLat < -90 || numLat > 90) {
    return { valid: false, error: 'অবৈধ অক্ষাংশ (-90 থেকে 90 এর মধ্যে হতে হবে) / Invalid latitude.' };
  }
  if (!Number.isFinite(numLng) || numLng < -180 || numLng > 180) {
    return { valid: false, error: 'অবৈধ দ্রাঘিমাংশ (-180 থেকে 180 এর মধ্যে হতে হবে) / Invalid longitude.' };
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
      ? 'সতর্কতা: স্থানাঙ্কটি বাংলাদেশের সাধারণ সীমানার বাইরে মনে হচ্ছে। অনুগ্রহ করে যাচাই করুন।'
      : null,
  };
}

export function extractCoordsFromGoogleMapsUrl(rawInput) {
  if (!rawInput || typeof rawInput !== 'string') {
    return { ok: false, reason: 'empty' };
  }
  const input = normalizeBanglaDigits(rawInput).trim();
  if (!input) return { ok: false, reason: 'empty' };

  if (/^https?:\/\/(maps\.app\.goo\.gl|goo\.gl\/maps|g\.co\/maps)/i.test(input)) {
    return { ok: false, isShortLink: true, reason: 'short_link' };
  }

  // Priority 1: !3dLAT!4dLNG (exact pin)
  const pinMatches = Array.from(
    input.matchAll(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/g)
  );
  if (pinMatches.length > 0) {
    const last = pinMatches[pinMatches.length - 1];
    const check = validateCoordinatesClient(last[1], last[2]);
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

  // Priority 2: query params destination=, query=, q=, ll=, daddr=, viewpoint=
  const queryMatch = input.match(
    /[?&](?:destination|query|q|ll|daddr|viewpoint)=(-?\d+(?:\.\d+)?)(?:,|%2C)\s*(-?\d+(?:\.\d+)?)/i
  );
  if (queryMatch) {
    const check = validateCoordinatesClient(queryMatch[1], queryMatch[2]);
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
  const plainMatch = input.match(/^\s*(-?\d+(?:\.\d+)?)\s*[,;\s]\s*(-?\d+(?:\.\d+)?)\s*$/);
  if (plainMatch) {
    const check = validateCoordinatesClient(plainMatch[1], plainMatch[2]);
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

  // Priority 4 (Last-resort fallback): @lat,lng (viewport centre only)
  const viewportMatch = input.match(/@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/);
  if (viewportMatch) {
    const check = validateCoordinatesClient(viewportMatch[1], viewportMatch[2]);
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
 * Clipboard copy helper with fallback for Facebook/Messenger in-app browsers.
 */
export async function copyTextSafe(text) {
  if (!text) return false;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to execCommand fallback
  }
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}
