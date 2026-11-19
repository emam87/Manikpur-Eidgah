# Manikpur Eidgah Mobile-First Design Guide

> **Official Name**: Manikpur Eidgah (মানিকপুর ঈদগাহ)  
> **Design Theme**: Sakinah (সাকীনা — Light, Calm, Spiritual Theme)  
> **Target Devices**: Mobile (Android & iOS Phones: 360px–430px), Tablets (768px), Desktops (1024px+)

---

## 1. Core Design Philosophy

The Manikpur Eidgah digital portal is designed primarily for mobile phone users across Bangladesh and the diaspora. The interface embodies **Sakinah** (peace, serenity, and dignity), prioritizing:

1. **Extreme Clarity & Speed**: Instant loading, minimal visual noise, no distracting animations or gimmick counters.
2. **Zero Redundancy**: Every fact, count, link, and call to action appears exactly **once per screen**.
3. **Ergonomic Touch Usability**: All primary tap targets are at least **44×44px**, safe-area aware for mobile notches and gesture navigation home bars.
4. **Bilingual Strictness**: 100% parity between Bangla (`bn`) and English (`en`) across every label, header, and metadata tag.

---

## 2. Information Architecture (IA)

### 2.1 Mobile Navigation (Single Canonical Pathway)
Mobile navigation exists strictly in **two unified layers**:
- **Compact Header (`< 1024px`, Max 56px)**:
  - Left: Mosque logo mark + short site name (`মানিকপুর ঈদগাহ` / `Manikpur Eidgah`).
  - Right: Quick language toggle (`বাং` / `EN`) + Settings/More icon (`SlidersHorizontal`).
  - *No hamburger drawer*: Mobile navigation is never duplicated in a header drawer.
- **Bottom Tab Bar (5 Safe-Area Items)**:
  1. `হোম` / `Home` (`/`)
  2. `সদস্যবৃন্দ` / `Members` (`/lifetime-members`)
  3. `জমিদাতা` / `Land Donors` (`/land-donors`)
  4. `গ্যালারি` / `Gallery` (`/gallery`)
  5. `আরও` / `More` (Triggers canonical bottom sheet)
- **Canonical "More" Bottom Sheet**:
  - Secondary Destinations:
    1. `পরিচিতি ও কমিটি` / `About & Committee` (`/about`)
    2. `নকশা ও পরিকল্পনা` / `Design & Plan` (`/designs`)
    3. `মানচিত্র ও পথ` / `Map & Directions` (`/contact#map`)
    4. `জমির নকশা` / `Land Map` (`/land-maps`)
    5. `দলিল ও কাগজপত্র` / `Documents` (`/documents`)
    6. `নোটিশ ও ঘোষণা` / `Notices` (`/notices`)
    7. `যোগাযোগ ও অনুদান` / `Contact & Donate` (`/contact`)
  - Preference Controls:
    - Language switcher (`বাং` / `EN`)
    - Theme switcher (`Sakinah Light` / `Night Noor`)
    - Text size adjuster (`A-` / `A` / `A+`)
    - Lite Mode toggle (`ON` / `OFF`)

### 2.2 Desktop Navigation (`>= 1024px`)
- **Utility Top Bar**: Location with map pin, tagline with crescent icon, Theme toggle, Text size controls, Language switcher.
- **Main Navbar**: Full brand logo, site name, subtitle, dropdown navigation groups (`Info`, `Community`, `Media`, `Archive`, `Contact`), and gold-plate Donate pill.

---

## 3. Sakinah Mobile Tokens

All styling strictly derives from single-source-of-truth CSS variables mapped into Tailwind CSS:

| Token | Light Value | Semantic Role |
| :--- | :--- | :--- |
| `--bg` | `#FBF8F1` | Warm Ivory page background canvas |
| `--bg-alt` | `#F1F7F2` | Pale Mint alternate section backgrounds |
| `--surface` | `#FFFFFF` | Clean White card surfaces |
| `--primary` | `#247A59` | Balanced Sakinah Islamic Green |
| `--primary-dark` | `#1B5E45` | High-contrast Deep Forest Green for headings & primary accents |
| `--primary-soft` | `#DCEEE3` | Sage Green tint for badges and icon backgrounds |
| `--gold` | `#C9A24B` | Warm Sand Gold for borders and delicate accents |
| `--gold-text` | `#8A6A1F` | High-contrast accessible Gold for text labels |
| `--gold-plate-from` / `--to` | `#E8CB82` / `#C9A24B` | Subtle gold gradient plate for donation amounts and honors |
| `--text` | `#1F2D2A` | Deep Charcoal-Green text (WCAG AAA contrast on ivory) |
| `--text-muted` | `#55665F` | Secondary body text and labels |
| `--border` | `#E6E0CE` | Warm 1px sand border |
| `--footer` | `#226B50` | Mid-Green footer background |

---

## 4. Mobile Component Standards

### 4.1 Typography Scales
- Root font size: `16px` base (`14.5px` for `A-`, `18px` for `A+`).
- Mobile inputs: strictly `16px` minimum font-size to prevent unwanted automatic iOS Safari page zooming on focus.
- Headings: `text-xl` to `text-2xl` on mobile; `text-3xl` to `text-4xl` on desktop.

### 4.2 Tap Targets & Ergonomics
- Minimum touch area: `44×44px` for all interactive buttons, icon controls, and links.
- Tap feedback: `tap-feedback` utility provides subtle, instant touch feedback via `active:scale-[0.98]` without lag.
- Edge-swipe protection: Lightbox and gesture carousels ignore swipes initiated within `20px` of screen edges, ensuring native iOS/Android back navigation gestures continue functioning smoothly.

### 4.3 Lists & Feeds (Feed vs. Detail Separation)
- In feed mode, list items render as compact, uniform **56px photo list-cards** displaying photo, name, and ONE key fact.
- Heavy certificate decorations, detailed deeds, and full biographies are rendered **only inside bottom sheets** upon user tap.
- Feed loading uses a mobile-standard "Load More" button with 20 items per page; numbered pagination links are prohibited on mobile.

---

## 5. Prohibited Elements & Anti-Patterns

The following decorative gimmicks and performance drains are strictly disallowed:
- Floating canvas particles, gold dust particles, and starburst generators.
- Parallax scrolling, 3D card tilts (`useCardTilt`), and cursor followers.
- Animated count-up number gimmicks (`useCounter` or ticking delays).
- Infinite slideshows and auto-rotating banners.
- Multiple competing navigation menus on a single screen.
- Embedded interactive touch maps on scrolling pages (use clean "Directions" cards linking out to Google Maps).
