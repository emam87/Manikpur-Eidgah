# Manikpur Eidgah — UI/UX Design System Guide ("Ivory Heritage")

## 1. Design Philosophy & Visual Identity

The Manikpur Eidgah (established 1965) visual identity reflects sacred Bengali Islamic architectural heritage:
- **Palette**:
  - **Ivory (`#FAF7F0`)**: Base canvas representing serenity and historical manuscript parchment.
  - **Deep Emerald (`#0F5132`)**: Rich Islamic green evoking sanctuary, tranquility, and spirituality.
  - **Antique Gold (`#B8923F`)**: Traditional ornamental gold accentuating trims, stars, borders, and calligraphic details.
  - **Dark Emerald Theme**: Deep emerald background (`#071f14`) with translucent glass layers (`emerald-900/40`), maintaining strict AA contrast standards.
- **Typography**:
  - Headings: **Noto Serif Bengali** (weights 400, 600, 700, 800) for traditional solemnity and calligraphic grace.
  - Body: **Hind Siliguri** (weights 300, 400, 500, 600, 700) for clean legibility on small smartphone screens.
  - Numbers: Tabular numerals (`tabular-nums`) for currency (BDT / ৳), membership numbers, and dates.
  - Strict Rule: **No emoji icons**; all visual symbols utilize **Lucide Icons** and bespoke Islamic geometric ornaments (8-point and 12-point stars, Islamic arches).

---

## 2. Design Tokens & Motion System

### Tailwind Color Tokens
- `ivory`: `50: #FFFDF9`, `100: #FAF7F0` (canonical canvas), `200: #F3EEDF`, `300: #E6DCBF`, `400: #D4C399`
- `emerald`: `50: #ECFDF5`, `800: #14532D`, `900: #0F5132` (canonical primary), `950: #072B1B` (night mode canvas)
- `gold`: `300: #E2CA82`, `400: #D4AF37`, `500: #B8923F` (canonical accent), `600: #9B782E`, `700: #7A5B1D`

### Motion Tokens & Physics
- Duration: `fast` (150ms), `base` (250ms), `slow` (450ms)
- Easing Curve: `cubic-bezier(0.22, 1, 0.36, 1)` (smooth natural decel)
- Keyframes defined in `tailwind.config.js`:
  - `crescentFloat`: 6s gentle floating vertical drift for the Islamic crescent.
  - `starTwinkle`: 3s subtle opacity and scale pulse for twinkling stars.
  - `dustDrift`: 14s upward drift for pure-CSS golden particles.
  - `card-shine-sweep`: Diagonal light sweep across cards on hover.
  - `pulseGlow`: Breathing luminous glow around primary call-to-actions.

---

## 3. Reusable UI Components

### 1. `Button` (`components/common/Button.jsx`)
- Variants: `primary` (emerald solid / glow), `secondary` (gold gradient with dark text), `outline` (gold border with hover fill), `ghost` (subtle hover state).
- Sizes: `sm` (min-h 38px), `md` (min-h 44px), `lg` (min-h 50px).
- States: Active press scale (`active:scale-[0.98]`), magnetic desktop hover, built-in loading spinner, gold focus ring.

### 2. `SectionHeader` (`components/common/SectionHeader.jsx`)
- Eyebrow text in antique gold with 8-point stars.
- Serif title in deep emerald (ivory in dark mode).
- Subtle animated center divider.
- Optional descriptive subtitle.

### 3. `BottomSheet` (`components/common/BottomSheet.jsx`)
- Mobile-first drawer for details (e.g. member certificates, committee profiles, donation ledgers).
- Pull handle at the top with touch swipe-down to dismiss.
- Backdrop blur with smooth slide-up from bottom (`safe-area-inset-bottom` aware).

### 4. `MobileTabBar` (`components/layout/MobileTabBar.jsx`)
- Sticky bottom thumb navigation bar on mobile devices (`md:hidden`).
- Quick access to Home, Members, Donors, Gallery, and Contact with active indicators and safe-area padding.

### 5. `ImageWithBlur` (`components/common/ImageWithBlur.jsx`)
- Progressive image loading: shows tiny blurred thumbnail / shimmer skeleton before the full image finishes loading, eliminating layout jumps.

### 6. `Breadcrumb` (`components/common/Breadcrumb.jsx`)
- Clear navigational trail on all subpages with chevron separators and home icon.

### 7. Utility Components
- `ScrollProgressBar`: Thin gold indicator line at the top showing reading progress.
- `BackToTopButton`: Luminous floating button appearing after 400px of scrolling.
- `A2HSHint`: Mobile banner guiding Android & iOS users to add the portal to their home screen.
- `SkipToContent`: Accessible keyboard navigation jump link.

---

## 4. Performance & Lite Mode

- **Automatic Lite Mode**: Automatically detects `navigator.hardwareConcurrency <= 4`, `navigator.deviceMemory <= 4GB`, `save-data`, or `effectiveType === '2g' / '3g'`.
- **Manual Toggle**: Users can toggle Lite Mode anytime from the footer.
- **Lite Mode Effects**:
  - Turns off Ken Burns hero animations and CSS particle dust.
  - Disables 3D card tilt and backdrop blur filters.
  - Prioritizes fast data rendering and minimal battery consumption.
- **Stale-While-Revalidate Cache**: `CacheContext` provides in-memory TTL caching for public endpoints (`settings`, `home`, `members`, `donors`, `notices`, `gallery`), eliminating repeated roundtrips.

---

## 5. Mobile & Touch Conventions

- Minimum touch target: **44px × 44px** (`tap-target` utility class).
- Safe area support: `pb-[calc(1rem+env(safe-area-inset-bottom))]` across mobile drawers and bottom navigation bar.
- Tabular numbers on currency and counters to prevent layout shifts.
- Touch-trap prevention on interactive maps (`MapPage.jsx` requires tap-to-activate on mobile).

