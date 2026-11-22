import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_MAP_LOCATION,
  KNOWN_WRONG_COORDS,
  VIEWPORT_FALLBACK_WARNING_EN,
  isExactPlaceholderCoords,
  resolvePlaceholderCoordinateMigration,
  validateCoordinates,
  validateGeoJsonPolygon,
  extractCoordsFromGoogleMapsUrl,
  buildNavigationLinks,
  haversineDistanceKm,
  haversineDistanceMeters,
  computePolygonAreaSqM,
  sqMetersToDecimal,
  encodePlusCode,
} from '../src/utils/mapHelpers.js';
import {
  isAllowedGoogleMapsUrl,
  isPrivateOrReservedIp,
  resolveGoogleMapsUrl,
} from '../src/utils/mapResolver.js';
import { serializePublicLandDonor } from '../src/utils/landDonorSerializer.js';

const REAL_URL_1 =
  'https://www.google.com/maps/place/Manikpur+Eidgah/@23.019842,91.2076296,1695m/data=!3m1!1e3!4m6!3m5!1s0x37549fe00e9dd21b:0x7941acb63efcee4a!8m2!3d23.0199269!4d91.2112393!16s%2Fg%2F11fx7x8l7_';
const REAL_URL_2 =
  'https://www.google.com/maps/place/Manikpur+Eidgah/@23.0200482,91.2079419,1163m/data=!3m1!1e3!4m6!3m5!1s0x37549fe00e9dd21b:0x7941acb63efcee4a!8m2!3d23.0199269!4d91.2112393!16s%2Fg%2F11fx7x8l7_';

test('mapHelpers: rendered Navigate, Street View, and Place links contain exact pin 23.0199269,91.2112393', () => {
  const links = buildNavigationLinks({
    lat: DEFAULT_MAP_LOCATION.lat,
    lng: DEFAULT_MAP_LOCATION.lng,
    name: 'Manikpur Eidgah',
    googlePlaceUrl: DEFAULT_MAP_LOCATION.googlePlaceUrl,
  });

  assert.ok(links.googleDirections.includes('23.0199269,91.2112393'));
  assert.ok(links.appleMaps.includes('23.0199269,91.2112393'));
  assert.ok(links.waze.includes('23.0199269,91.2112393'));
  assert.ok(links.androidGeo.includes('23.0199269,91.2112393'));
  assert.ok(links.streetView.includes('23.0199269,91.2112393'));
  assert.equal(links.googlePlace, 'https://maps.app.goo.gl/g9bU9iHkgNdrsZ9PA');

  // Optional Navigation point overrides direction links while Street View stays on pin
  const withNav = buildNavigationLinks({
    lat: 23.0199269,
    lng: 91.2112393,
    navLat: 23.0195,
    navLng: 91.2115,
    name: 'Manikpur Eidgah',
  });
  assert.ok(withNav.googleDirections.includes('23.0195,91.2115'));
  assert.ok(withNav.appleMaps.includes('23.0195,91.2115'));
  assert.ok(withNav.streetView.includes('23.0199269,91.2112393'));
});

test('mapHelpers: known-wrong coordinate migration updates ONLY exact wrong pairs and preserves custom coords', () => {
  assert.equal(KNOWN_WRONG_COORDS.length, 3);

  for (const wrong of KNOWN_WRONG_COORDS) {
    assert.equal(isExactPlaceholderCoords(wrong.lat, wrong.lng), true);
    const mig = resolvePlaceholderCoordinateMigration(String(wrong.lat), String(wrong.lng));
    assert.equal(mig.shouldUpdate, true);
    assert.equal(mig.lat, '23.0199269');
    assert.equal(mig.lng, '91.2112393');
  }

  // Custom admin-set coordinates must NEVER be modified
  const custom = resolvePlaceholderCoordinateMigration('23.123456', '91.654321');
  assert.equal(custom.shouldUpdate, false);
  assert.equal(custom.lat, '23.123456');

  const alreadyExact = resolvePlaceholderCoordinateMigration('23.0199269', '91.2112393');
  assert.equal(alreadyExact.shouldUpdate, false);
});

test('mapHelpers: Google Maps URL parser strict priority & real URL samples (exact !3d/!4d pin, never @ viewport)', () => {
  const r1 = extractCoordsFromGoogleMapsUrl(REAL_URL_1);
  assert.equal(r1.ok, true);
  assert.equal(r1.lat, 23.0199269);
  assert.equal(r1.lng, 91.2112393);
  assert.equal(r1.isFallbackViewport, false);

  const r2 = extractCoordsFromGoogleMapsUrl(REAL_URL_2);
  assert.equal(r2.ok, true);
  assert.equal(r2.lat, 23.0199269);
  assert.equal(r2.lng, 91.2112393);
  assert.equal(r2.isFallbackViewport, false);

  // Confirm @ viewport differs from pin by ~340m
  const viewportDiffM = haversineDistanceMeters(23.019842, 91.2076296, 23.0199269, 91.2112393);
  assert.ok(viewportDiffM > 300 && viewportDiffM < 420, `Expected ~369m diff, got ${viewportDiffM}`);

  // Query param q= and destination=
  const rQ = extractCoordsFromGoogleMapsUrl('https://maps.google.com/?q=23.0199269,91.2112393');
  assert.equal(rQ.ok, true);
  assert.equal(rQ.lat, 23.0199269);
  assert.equal(rQ.isFallbackViewport, false);

  const rDest = extractCoordsFromGoogleMapsUrl(
    'https://www.google.com/maps/dir/?api=1&destination=23.0199269,91.2112393'
  );
  assert.equal(rDest.ok, true);
  assert.equal(rDest.lng, 91.2112393);

  // Plain text with Bangla digits
  const rBn = extractCoordsFromGoogleMapsUrl('২৩.০১৯৯২৬৯, ৯১.২১১২৩৯৩');
  assert.equal(rBn.ok, true);
  assert.equal(rBn.lat, 23.0199269);
  assert.equal(rBn.lng, 91.2112393);

  // Last-resort @lat,lng fallback shows explicit viewport warning
  const rViewport = extractCoordsFromGoogleMapsUrl(
    'https://www.google.com/maps/@23.019842,91.2076296,17z'
  );
  assert.equal(rViewport.ok, true);
  assert.equal(rViewport.isFallbackViewport, true);
  assert.equal(rViewport.warning, VIEWPORT_FALLBACK_WARNING_EN);

  // Bad input & out-of-range
  assert.equal(extractCoordsFromGoogleMapsUrl('not a link').ok, false);
  assert.equal(extractCoordsFromGoogleMapsUrl('95.0, 200.0').ok, false);
  assert.equal(extractCoordsFromGoogleMapsUrl('https://maps.app.goo.gl/g9bU9iHkgNdrsZ9PA').isShortLink, true);
});

test('mapResolver: SSRF protections block non-allowlisted hosts, HTTP, private IPs, and excessive redirects', async () => {
  // Blocked hosts & protocols
  assert.equal(isAllowedGoogleMapsUrl('https://evil.example.com/maps').allowed, false);
  assert.equal(isAllowedGoogleMapsUrl('http://maps.app.goo.gl/g9bU9iHkgNdrsZ9PA').allowed, false);
  assert.equal(isAllowedGoogleMapsUrl('https://127.0.0.1/maps').allowed, false);
  assert.equal(isAllowedGoogleMapsUrl('https://google.com/search?q=test').allowed, false);
  assert.equal(isAllowedGoogleMapsUrl('https://maps.app.goo.gl/g9bU9iHkgNdrsZ9PA').allowed, true);

  // Private IP detection
  assert.equal(isPrivateOrReservedIp('127.0.0.1'), true);
  assert.equal(isPrivateOrReservedIp('10.0.0.1'), true);
  assert.equal(isPrivateOrReservedIp('172.16.0.1'), true);
  assert.equal(isPrivateOrReservedIp('192.168.1.5'), true);
  assert.equal(isPrivateOrReservedIp('169.254.169.254'), true);
  assert.equal(isPrivateOrReservedIp('::1'), true);
  assert.equal(isPrivateOrReservedIp('142.250.190.78'), false);

  // DNS resolving to private IP is blocked
  const ssrfRes = await resolveGoogleMapsUrl('https://maps.app.goo.gl/g9bU9iHkgNdrsZ9PA', {
    dnsLookup: async () => [{ address: '169.254.169.254', family: 4 }],
    fetchImpl: async () => {
      throw new Error('fetch must not be called for private IP');
    },
  });
  assert.equal(ssrfRes.ok, false);
  assert.equal(ssrfRes.blocked, true);

  // Redirect to disallowed host is blocked
  const badRedirect = await resolveGoogleMapsUrl('https://maps.app.goo.gl/g9bU9iHkgNdrsZ9PA', {
    dnsLookup: async () => [{ address: '142.250.190.78', family: 4 }],
    fetchImpl: async () => ({
      status: 302,
      headers: new Headers({ location: 'https://internal.corp.local/secret' }),
    }),
  });
  assert.equal(badRedirect.ok, false);
  assert.equal(badRedirect.blocked, true);

  // Long redirect chain (> 5 hops) is blocked
  let hops = 0;
  const loopRes = await resolveGoogleMapsUrl('https://maps.app.goo.gl/g9bU9iHkgNdrsZ9PA', {
    dnsLookup: async () => [{ address: '142.250.190.78', family: 4 }],
    fetchImpl: async () => ({
      status: 302,
      headers: new Headers({ location: `https://maps.app.goo.gl/hop${++hops}` }),
    }),
  });
  assert.equal(loopRes.ok, false);
  assert.equal(loopRes.blocked, true);

  // Successful short-link resolution extracts exact !3d/!4d pin
  const okRes = await resolveGoogleMapsUrl('https://maps.app.goo.gl/g9bU9iHkgNdrsZ9PA', {
    dnsLookup: async () => [{ address: '142.250.190.78', family: 4 }],
    fetchImpl: async () => ({
      status: 302,
      headers: new Headers({ location: REAL_URL_1 }),
    }),
  });
  assert.equal(okRes.ok, true);
  assert.equal(okRes.lat, 23.0199269);
  assert.equal(okRes.lng, 91.2112393);
  assert.equal(okRes.isFallbackViewport, false);
});

test('mapHelpers: Plus Code, Haversine distance, geodesic polygon area, and Bangladesh bbox warning', () => {
  const code = encodePlusCode(DEFAULT_MAP_LOCATION.lat, DEFAULT_MAP_LOCATION.lng);
  assert.match(code, /^[23456789CFGHJMPQRVWX]{8}\+[23456789CFGHJMPQRVWX]{2}$/);

  assert.equal(haversineDistanceKm(23.0199269, 91.2112393, 23.0199269, 91.2112393), 0);
  const poly = {
    type: 'Polygon',
    coordinates: [
      [
        [91.211, 23.0195],
        [91.212, 23.0195],
        [91.212, 23.0204],
        [91.211, 23.0204],
        [91.211, 23.0195],
      ],
    ],
  };
  assert.equal(validateGeoJsonPolygon(poly).valid, true);
  const sqM = computePolygonAreaSqM(poly);
  assert.ok(sqM > 9000 && sqM < 11500);
  assert.ok(sqMetersToDecimal(sqM, 435.6) > 220);

  assert.equal(validateCoordinates(23.0199269, 91.2112393).warning, null);
  assert.ok(validateCoordinates(51.5074, -0.1278).warning);
});

test('mapParcels: land donor parcel serialization respects showPlotDetails and omits private fields', () => {
  const samplePolygon = {
    type: 'Polygon',
    coordinates: [[[91.211, 23.0195], [91.212, 23.0195], [91.212, 23.0204], [91.211, 23.0195]]],
  };
  const baseDonor = {
    id: 7,
    nameBn: 'আব্দুর রহমান',
    nameEn: 'Abdur Rahman',
    isDeceased: true,
    areaValue: 20,
    areaUnit: 'DECIMAL_SHATANGSHO',
    areaInDecimal: 20,
    donationYear: 1975,
    donationType: 'WAQF',
    landUse: 'EIDGAH_GROUND',
    geometry: samplePolygon,
    phone: '01700000000',
    nid: '1975123456789',
    representativePhone: '01800000000',
    showDeedDetails: false,
    showPlotDetails: false,
    showBoundaries: false,
  };

  const hidden = serializePublicLandDonor(baseDonor);
  assert.equal('geometry' in hidden, false);
  assert.equal('phone' in hidden, false);
  assert.equal('nid' in hidden, false);
  assert.equal('representativePhone' in hidden, false);

  const visible = serializePublicLandDonor({ ...baseDonor, showPlotDetails: true });
  assert.deepEqual(visible.geometry, samplePolygon);
  assert.equal('phone' in visible, false);
});
