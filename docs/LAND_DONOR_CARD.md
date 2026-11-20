# Land Donor (জমিদাতা) Horizontal Card Specification

> **Route**: `/land-donors`  
> **Scope**: Replaces the earlier compact 56px list-card spec for `/land-donors` only.  
> **Design System**: Sakinah Tokens (`#FBF8F1` canvas, `#FFFFFF` surface, `#247A59` / `#1B5E45` primary, `#DCEEE3` sage soft, `#C9A24B` / `#E8CB82` gold, `#E6E0CE` sand border).  
> **Updated**: 2026-11-20

---

## 1. Visual Architecture & Layout Spec

### 1.1 Mobile Card (`< 768px`, 1 card per row, full width minus `16px` screen padding)
- **Container**: Semantic `<button type="button">` horizontal flex row:
  - `min-height: 112px` (Comfortable) / `94px` (Compact)
  - `padding: 12px`, `gap: 12px`, `border-radius: 14px`
  - `background: var(--surface)`, `border: 1px solid var(--border)` (`#E6E0CE`), soft green-tinted shadow (`--shadow-sm`)
  - Optional subtle `3px` vertical left accent bar tinted by `landUse` from Sakinah palette (`bg-primary` Eidgah Ground, `bg-sky-mist` Mosque, `bg-sage-deep` Graveyard, `bg-sage-mid` Road, `bg-gold` Boundary Wall / Other)
  - Whole card is a single tap target (`>= 44px`) with press feedback (`scale(0.98)` + soft radial ripple), visible gold focus ring (`outline: 2px solid var(--gold)`), and trailing muted `ChevronRight`.
- **Left Mihrab Arch Frame**:
  - `64×80px` (`72×90px` at `412px+`; `56×70px` in Compact mode), fixed `aspect-[4/5]` (`rounded-t-full rounded-b-[10px]`)
  - Thin gold ring (`1.5px`, `ring-gold/60`)
  - Lazy-loaded ~160px wide (2×) R2 thumbnail (`_thumb.webp` with automatic full-image fallback) and shimmer blur-up, zero CLS
  - Initials fallback avatar (first letter in active language, skipping honorifics) on a sage gradient (`#DCEEE3` → `#CFE5D8`) with `primary-dark` serif letter
  - Quiet crescent (`Moon`) marker at bottom-right corner when `isDeceased === true` (never black borders or sad styling)
- **Right Column (`flex-1 min-w-0`)**:
  1. **Name Line**: Optional honorific (`মরহুম` / `Late`, never duplicated if already in name) + heading serif `17px` bold `primary-dark`, `line-clamp-2`, `[text-wrap:balance]`.
  2. **Parent Line**: `পিতা: ...` / `Father: ...`, `13px` muted, single line with ellipsis; hidden when empty or in Compact mode.
  3. **Location Line**: `MapPin` (`14px`) + village, `13px` muted, single line with ellipsis; hidden when empty.
  4. **Facts Row** (wraps cleanly on narrow viewports):
     - **Gold-Foil Area Plate**: `rounded-[10px]` gradient `#E8CB82` → `#C9A24B`, dark text `#1F2D2A`, `16px` bold value + `12px` unit, `whitespace-nowrap`, Bangla digits in `bn`, Latin digits in `en`.
     - **At most 2 neutral sage chips** (`#DCEEE3`, `primary-dark`, `12px`, `rounded-full`):
       - Donation Year (`Calendar` `12px`)
       - Land Use (per-use Lucide icon `12px`: `Landmark`, `Trees`, `Building2`, `Route`, `Shield`, `Compass`)

### 1.2 Desktop (`>= 768px`)
- Reuses the exact same `<LandDonorCard />` component in a 2-column grid (`md:grid-cols-2`) and 3-column grid on wide screens (`xl:grid-cols-3`).
- `4px` hover lift applied strictly inside `@media (hover: hover) and (pointer: fine)`.
- Clicking a card opens `<LandDonorDetailSheet />` as a centered dialog (`BottomSheet` desktop mode).

### 1.3 List Page & Filter Sheet (`/land-donors`)
- Minimal page header (Breadcrumb + Title + Subtitle; no redundant stats banner).
- Sticky Search input (`16px` minimum on mobile for iOS Safari zoom prevention) + single Filter button opening the Filter BottomSheet:
  - **Card Density**: Comfortable (default) / Compact (hides father line, shrinks photo to `56×70px`)
  - **Summary Unit Switcher**: Decimal / Katha / Bigha / Acre
  - **Filters**: Donation Year, Land Use, Donation Type, localized Mouza, Living/Deceased, Sort By (`custom`, `name_asc`, `area_desc`, `area_asc`, `year_asc`, `year_desc`)
- One slim summary line above the list:
  - `bn`: `"১২ জন জমিদাতা, মোট ২৪০ শতাংশ জমি"`
  - `en`: `"12 land donors, 240 decimals of land total"`
- 20 records per page with "Load more", matching horizontal skeleton cards, scroll-reveal on first 6 cards only (once), and empty state with "Clear filters".

### 1.4 Detail Bottom Sheet (`LandDonorDetailSheet.jsx`)
- Header with `96×120px` arch photo inside a thin gold double border, honorific + name, father/mother names, village, and single primary **Share** button (Web Share API + clipboard fallback).
- Gold-foil Area Plate showing donated area plus converted শতাংশ (Decimal) and বর্গফুট / Sq Ft equivalents when the donor's unit differs.
- 2-column key facts grid (Land Use, Donation Date/Year, Donation Type, Mouza/Upazila/District when public).
- Background story with "Read more" toggle when longer than 220 characters.
- Family representative (name & relation only; phone never exposed).
- Gated Deed, Khatian/Dag/JL, Boundaries, and Linked Documents/Land Map rows (with arrow) rendered **only** when present in the server-sanitized response.

---

## 2. Privacy, Accessibility & Performance Guarantees

- **Server-Side Privacy (`server/src/utils/landDonorSerializer.js`)**:
  - `phone`, `nid`, and `representativePhone` are never selected or serialized on `/api/public/land-donors`.
  - When `showDeedDetails`, `showPlotDetails`, or `showBoundaries` is `false`, all gated fields (including `relatedDocuments` and `relatedLandMap`) are **omitted from the JSON payload server-side**, not merely hidden in CSS.
- **Strict Bilingual Rules**:
  - In `bn`, only Bangla text and Bangla digits appear; in `en`, only English text and Latin digits appear. Missing active-language fields hide their line cleanly with zero cross-language fallback.
- **Accessibility**:
  - Card is a semantic `<button>` with descriptive `aria-label` (`"Land donor: <name>, <area>, <year>"`).
  - `4.5:1+` contrast, visible gold focus ring, no meaning conveyed by color alone.
- **Curated Motion & Performance**:
  - Motion limited to reveal (first 6), press scale/ripple, sheet slide, and skeleton shimmer; all disabled under `prefers-reduced-motion` and `html.lite-mode`.
  - `content-visibility: auto` + `contain-intrinsic-size: 0 124px` on cards for smooth scrolling with 150+ records.
  - `BottomSheet.jsx` pushes a history entry on open so the **Android Back button** closes the sheet cleanly, and uses fixed-body scroll locking to prevent **iOS Safari** background scroll bleed.

---

## 3. QA Verification Matrix

| Check | Viewports / Conditions | Verification Status |
| :--- | :--- | :--- |
| Responsive Horizontal Layout & No Overflow | 320px, 360px, 390px, 412px, 430px, 768px, 1280px | Verified (single-column `<768px`, 2-col `768px+`, 3-col `1280px+`, `min-w-0` + `truncate` / `line-clamp-2`) |
| Arch Portrait & Fallback Avatar | With photo (`_thumb.webp` + fallback), without photo, deceased & living | Verified (`64×80`, `72×90` @ `412px+`, `56×70` compact, sage initials + quiet crescent) |
| Long & Short Names | 25-char & 60-char Bangla/English names | Verified (`line-clamp-2`, `[text-wrap:balance]`, `break-words`) |
| Missing Optional Fields | Missing father, village, year, story | Verified (lines omitted cleanly without gaps) |
| All 5 Area Units | Decimal, Katha, Bigha, Acre, Sq Ft (`bn` & `en`) | Verified (`formatAreaPlate` + `convertFromDecimal`, `whitespace-nowrap`) |
| Density Toggle | Comfortable vs. Compact | Verified (Compact removes father line, shrinks photo to `56×70px`, persisted) |
| Server-Side Privacy & Visibility Toggles | `showDeedDetails=false`, `showPlotDetails=false`, `showBoundaries=false` | Verified via automated unit tests (`server/tests/landDonors.test.js`) |
| Mobile Ergonomics | Tap targets `>= 44px`, 16px inputs, Android Back `popstate`, iOS scroll lock | Verified (`npm run mobile:check` + `BottomSheet.jsx`) |
| Bilingual Parity | Strict `bn` / `en` zero-mixing | Verified (`npm run i18n:check` + `server/tests/bilingual.test.js`) |

> **Note on Playwright Screenshots**: Capture live screenshots across `320px`, `360px`, `390px`, `412px`, `430px`, and `768px` (in `bn` and `en`) in an environment with Playwright browsers installed and place them under `docs/screenshots/land-donor-card/`.
