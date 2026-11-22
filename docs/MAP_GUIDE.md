# Map & Directions Guide (`/map` — মানচিত্র ও পথ)

> **Official Name**: Manikpur Eidgah (`মানিকপুর ঈদগাহ`)  
> **Verified Default Coordinates**: `23.0199269, 91.2112393` (Zoom `17`)  
> **Google Maps Place URL**: `https://maps.app.goo.gl/3rqcdrGPNoY9caRb7`

---

## 1. Architecture & Single Source of Truth

All location consumers across the application read from the same `SiteSetting` keys:
- `map_lat` (default `23.0199269`)
- `map_lng` (default `91.2112393`)
- `map_zoom` (default `17`)
- `map_place_name` (`bn`: `মানিকপুর ঈদগাহ`, `en`: `Manikpur Eidgah`)
- `map_address` (optional short map-only address; omitted if empty)
- `map_google_place_url` (default `https://maps.app.goo.gl/3rqcdrGPNoY9caRb7`)
- `map_satellite_enabled` (`1` or `0`)
- `map_static_preview` (R2/uploads fallback image for Lite Mode / saveData / OG tags)
- `boundary_geojson` (GeoJSON Polygon for the Eidgah land boundary)

**Consumers**:
1. `/map` (`client/src/pages/MapPage.jsx`) — interactive Leaflet map, Navigate sheet, Street View, Plus Code, QR poster, JSON-LD `PlaceOfWorship`, and Open Graph meta.
2. Home page Directions card (`client/src/components/home/HomeDirectionsCard.jsx`) — coordinate-based Google Maps directions link and `/map` link.
3. Global SEO (`client/src/components/common/SEO.jsx` and `server/src/controllers/seo.controller.js`) — JSON-LD geo coordinates, crawler OG meta, and `/sitemap.xml` entry.

**Safe Placeholder Migration**:
`server/src/scripts/seed.js` inserts missing map settings idempotently. If existing `map_lat`/`map_lng` rows still hold the exact legacy placeholder (`23.8103`, `90.4125`), it updates **only** those exact placeholder values to `23.0199269, 91.2112393` and logs the migration without touching custom coordinates.

**Scope Separation**:
- `/map` contains **only** location, map layers, navigation apps, places of interest, and route guides.
- Phone, email, committee contacts, and bank/bKash details live strictly on `/contact` (never duplicated on `/map`).

---

## 2. Tile Providers & OpenStreetMap Usage Policy

Tile endpoints and attributions are configurable via Vite environment variables in `client/.env`:
```env
VITE_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
VITE_MAP_TILE_ATTRIBUTION=&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors
VITE_MAP_SATELLITE_URL=https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}
VITE_MAP_SATELLITE_ATTRIBUTION=Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics
```
- **Attribution**: Always keep OSM and satellite attributions visible on the map canvas.
- **OSM Usage Policy**: Avoid bulk tile scraping; Leaflet is lazy-loaded only when `/map` scrolls near the viewport, and Lite Mode / `saveData` visitors see the static preview image with an explicit *"Tap to load interactive map"* button.
- **Swapping Providers**: Set `VITE_MAP_TILE_URL` / `VITE_MAP_SATELLITE_URL` (e.g., MapTiler, Protomaps, Stadia) without any code changes. Leave `VITE_MAP_SATELLITE_URL=` empty or disable `map_satellite_enabled` in Admin Settings to hide the Satellite toggle.

---

## 3. Performance, Privacy & Mobile Ergonomics

- **Lazy Leaflet Bundle**: `InteractiveLeafletMap.jsx` and `AdminMapEditor.jsx` are dynamically imported via `React.lazy`, keeping `leaflet` completely out of the initial Home bundle.
- **Anti-Scroll-Trap**: Single-finger touch scrolls the page normally; two fingers pan the map (with a gentle bilingual hint). Desktop requires `Ctrl + scroll` to zoom.
- **In-App Browsers (Facebook / Messenger)**: Feature-detects Web Share API, Geolocation (HTTPS-only), and Clipboard API with `execCommand` fallback.
- **Privacy**:
  - Visitor geolocation is requested only on explicit tap of **My Location** and is **never** stored or sent to the server.
  - Land Donor parcels (`LandDonor.geometry`) are returned by `GET /api/public/map` only when `isPublished: true`, `deletedAt: null`, and `showPlotDetails: true`, serialized via `serializePublicLandDonor()` so `phone`, `nid`, and `representativePhone` are never exposed.

---

## 4. Admin Guide (বাংলা ও English)

### কীভাবে অবস্থান নির্ধারণ করবেন, সীমানা আঁকবেন এবং স্থান যোগ করবেন
1. **অবস্থান ও স্থানাঙ্ক সেট করা (`ওয়েবসাইট সেটিংস > মানচিত্র ও অবস্থান`)**:
   - Google Maps-এর সম্পূর্ণ URL পেস্ট করে **"স্থানাঙ্ক বের করুন"** বাটনে ক্লিক করুন (সংক্ষিপ্ত `maps.app.goo.gl` লিংক হলে আগে ব্রাউজারে খুলে সম্পূর্ণ URL বা `lat, lng` কপি করুন), অথবা সরাসরি মানচিত্রে ক্লিক করে পিন বসান।
   - স্থানের নাম (বাংলা ও ইংরেজি), জুম লেভেল, স্যাটেলাইট চালু/বন্ধ এবং প্রয়োজনে Lite Mode-এর জন্য একটি স্ট্যাটিক প্রিভিউ ছবি আপলোড করুন।
   - নিচে **"সেটিংস সংরক্ষণ করুন"** ক্লিক করুন।
2. **ঈদগাহের সীমানা আঁকা (`Boundary GeoJSON Editor`)**:
   - একই ট্যাবের নিচে সীমানা মানচিত্রে একের পর এক কোণায় ক্লিক করে পলিগন তৈরি করুন। ক্ষেত্রফল স্বয়ংক্রিয়ভাবে বর্গমিটার ও শতাংশে দেখাবে।
   - চাইলে **আনডু**, **মুছুন**, অথবা **GeoJSON ইমপোর্ট/এক্সপোর্ট** ব্যবহার করুন এবং সেটিংস সংরক্ষণ করুন।
3. **গুরুত্বপূর্ণ স্থান (POI) ও পৌঁছানোর পথ যোগ করা (`অ্যাডমিন > মানচিত্র ও পথ`)**:
   - **গুরুত্বপূর্ণ স্থান** ট্যাবে **"নতুন স্থান যোগ করুন"** ক্লিক করে বাংলা ও ইংরেজি নাম, বিভাগ (প্রবেশদ্বার, ওজুখানা, পার্কিং, মসজিদ, পুকুর, পরিচিত স্থান ইত্যাদি), ছবি এবং মানচিত্রে ক্লিক করে স্থানাঙ্ক সেট করুন।
   - **পৌঁছানোর পথ** ট্যাবে শুরুর স্থান (বাংলা ও ইংরেজি), যানবাহনের মাধ্যম (বাস, সিএনজি, রিকশা, পায়ে হেঁটে, নিজস্ব গাড়ি), আনুমানিক সময়, ভাড়া ও নির্দেশনা যোগ করুন। উভয় তালিকায় UTF-8 CSV ইমপোর্ট/এক্সপোর্ট সুবিধা রয়েছে।
4. **জমিদাতার জমির অংশ (Parcel) আঁকা (`অ্যাডমিন > জমিদাতা পরিষদ`)**:
   - যেকোনো জমিদাতা সম্পাদনা করে **"চৌহদ্দি ও ইতিহাস"** ট্যাবের নিচে মানচিত্রে ক্লিক করে তাঁর দানকৃত জমির পলিগন আঁকুন (পাবলিক `/map`-এ প্রদর্শনের জন্য `showPlotDetails` চালু থাকতে হবে)।

### How to Set the Location, Draw the Boundary, and Add Places
1. **Set Location & Coordinates (`Admin > Settings > Map & Location`)**:
   - Paste a full Google Maps URL into the helper and click **Extract** (for short `maps.app.goo.gl` links, open it in a browser first and copy the expanded URL or `lat, lng`), or simply click on the map to place the pin.
   - Update bilingual place name, optional short address, default zoom, satellite toggle, and upload an optional static preview image for Lite Mode. Click **Save Settings**.
2. **Draw the Boundary (`Boundary GeoJSON Editor`)**:
   - Click each corner of the Eidgah ground on the boundary map to draw the polygon (area is computed live in sq m and decimals), or import/export GeoJSON. Click **Save Settings**.
3. **Add Places (POI) & Route Guides (`Admin > Map & Directions`)**:
   - Under **Places**, add bilingual POIs (Entrance, Wudu area, Parking, Mosque, Pond, Landmark, etc.) by clicking the map to set coordinates and optionally uploading a photo.
   - Under **Routes**, add starting points with transport options, approximate duration/fare, and bilingual step notes. Both support UTF-8 BOM CSV import/export and soft-delete Trash recovery.
4. **Draw Land Donor Parcels (`Admin > Land Donors`)**:
   - Edit any Land Donor and open the **Boundaries & Story** tab to draw or import their optional parcel polygon. Parcels appear on `/map` (when the visitor enables the Parcels overlay) only if the record is published and `showPlotDetails` is enabled.
