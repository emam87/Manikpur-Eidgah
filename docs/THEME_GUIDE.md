# Sakinah Theme & Design System Guide

> Single source of truth for **Manikpur Eidgah (মানিকপুর ঈদগাহ)** styling across public pages, admin dashboard, light mode, dark mode ("Night Noor"), and reversible presets.

---

## 1. Architecture Overview

All visual colors, surfaces, shadows, and chart palettes originate in **`client/src/index.css`** as CSS custom properties (`:root`), and are exposed to Tailwind utilities in **`client/tailwind.config.js`** via alpha-aware `rgb(var(--*-rgb) / <alpha-value>)` mappings.

- **Zero hardcoded hexes in components**: `.js` / `.jsx` files must reference semantic Tailwind tokens (`bg-canvas`, `bg-surface`, `text-ink`, `text-primary`, `border-sand`, etc.) or CSS variables (`var(--primary)`, `var(--chart-series-1)`, etc.) — never raw `#RRGGBB` literals or legacy `emerald-*` / `ivory-*` / `stone-*` classes.

---

## 2. Modes & Presets

### A. Default Light Theme: **Sakinah**
Defined on `:root, [data-theme-preset='sakinah']` in `client/src/index.css`:
- `--bg`: `#FBF8F1` (Warm Ivory page background — `bg-canvas`)
- `--bg-alt`: `#F1F7F2` (Soft Mint alternating sections — `bg-canvas-alt`)
- `--surface`: `#FFFFFF` (Card & modal surface — `bg-surface`)
- `--primary`: `#247A59` (Peaceful Sage Green — `bg-primary`, `text-primary`)
- `--primary-hover`: `#1F6A4D` (`hover:bg-primary-hover`)
- `--primary-dark`: `#1B5E45` (Headings & high-contrast ink — `text-primary-dark`)
- `--primary-soft`: `#DCEEE3` (Chips, badges, wave layers — `bg-primary-soft`)
- `--sky`: `#DCEEF0` (`bg-sky-mist`) & `--dawn-cream`: `#FFFDF7` (`bg-dawn-cream`, adapted to `#10201B` in Night Noor dark mode)
- `--gold`: `#C9A24B` (Borders, dividers, ornaments — `border-gold`, `text-gold`)
- `--gold-text`: `#8A6A1F` (WCAG AA compliant small text/icons on light backgrounds — `text-gold-text`)
- `--gold-plate-from` / `--gold-plate-to`: `#E8CB82` -> `#C9A24B` (`.bg-gold-plate` foil with `#1F2D2A` dark ink)
- `--text`: `#1F2D2A` (`text-ink`) & `--text-muted`: `#55665F` (`text-ink-muted`)
- `--border`: `#E6E0CE` (Warm sand 1px border — `border-sand`)
- `--footer`: `#226B50` (`bg-footer` with `--footer-text` `#FBF8F1`)
- `--sidebar`: `#EAF4EE` (Light sage admin sidebar — `bg-sidebar` with `--sidebar-text` `#1B5E45`)

### B. Optional Dark Mode: **Night Noor** (`html.dark`)
- Deep green-charcoal surfaces (`--bg: #10201B`, `--bg-alt: #142721`, `--surface: #172E26`) paired with the same sage/gold accents (`#EDF4F0` text, `#AFC5BC` muted text).
- Controlled via **`client/src/context/ThemeContext.jsx`** (navbar/mobile switch + automatic `prefers-color-scheme` listener when no manual preference is saved in `localStorage`).

### C. Reversible Admin Preset: **`theme_preset`**
- Managed live in **Admin Settings (`site_settings.theme_preset`)** via **`client/src/context/SettingsContext.jsx`**, which synchronizes `<html data-theme-preset="sakinah | classic-emerald">`.
- `"sakinah"` is the seeded default; switching to `"classic-emerald"` applies `[data-theme-preset='classic-emerald']` tokens instantly without any code deployment.

---

## 3. WCAG AA Contrast & Accessibility Guidelines

1. **Never use `#C9A24B` (`--gold`) for small body text on light backgrounds**: use `text-gold-text` (`--gold-text`: `#8A6A1F` on light, `#E8CB82` in dark mode) for small labels, subtitles, and icons.
2. **Gold Foil Plates (`.bg-gold-plate`)**: Always pair `.bg-gold-plate` with dark ink (`text-ink` / `--text: #1F2D2A` in light mode) so donation figures and pill badges stay crisp.
3. **Focus Rings**: `client/src/index.css` enforces a global `:focus-visible` outline (`2px solid var(--gold)`, `2px` offset). Avoid `outline-none` without a clear focus ring alternative.
4. **Patterns Away From Text**: Use `.bg-star-pattern-light` and `.bg-footer-pattern` behind section backdrops or margins so body copy stays clean and legible.

---

## 4. Light Dawn Hero, Wave Divider, Stats Strip & Quick-Link Cards

- **Top Utility Bar & Ivory Navbar (`Navbar.jsx`)**: Slim top bar displays location (left), tagline with crescent (center, hidden on small screens), Night Noor theme toggle, `A-` / `A+` scale buttons, and Bangla/English segmented toggle; main ivory blurred navbar pairs a mosque mark + gold subtitle with dropdown chevron groups, filled `--primary` active pills, a gold-gradient Donate pill (`bg-gold-plate`), and a thin gold bottom hairline.
- **`hero_bg_style`** supports `"dawn-photo-wave"` (default two-column light dawn hero `#FFFDF7` -> `#DCEEF0` -> sun glow, geometric corner ornaments at 8–12% opacity, left text column with eyebrow + serif display H1 + italic tagline + CTAs, right 55% overlapping mosque photo faded via CSS `.hero-photo-fade` `mask-image`), alongside `"photo"`, `"eid-dawn"`, and `"arcade"`.
- **Admin Upload & Fallback (`hero_image`)**: Uploaded via `POST /api/admin/settings/hero-image` (WebP optimized) in **Admin Settings** with `/defaults/eidgah-hero.webp` (plus responsive `640w` `eidgah-hero-640.webp`) default; if cleared (`""`) or broken, `HeroSection.jsx` gracefully falls back to a 3-layer sage SVG mosque skyline over the dawn gradient.
- **Hero Bottom Wave (`HeroWaveDivider`)**: Full-width SVG (`preserveAspectRatio="none"`, `60px` mobile / `108px` desktop) combining a curved `--primary-dark` -> `--primary` band narrowing rightwards, an upper `--gold` hairline curve, and a `--bg` ivory fill.
- **Overlapping Stats Strip (`StatsSection.jsx`) & 5 Quick-Link Cards (`QuickLinksSection.jsx`)**: A rounded mint (`bg-primary-soft/65`) 4-column (`2×2` mobile) bar overlaps the wave by ~40px and hides missing stats dynamically; directly beneath it, 5 white quick-link cards (`Members`, `Notices`, `Gallery`, `Designs`, `Land Donors`) use gold-tinted borders, circular mint+gold badges, corner geometric ornaments, and a 4px lift + gold glow hover.

---

## 5. Charts & Data Visualization

- **Recharts** (`AdminDashboard.jsx`) resolves series colors dynamically from `--chart-series-1` .. `--chart-series-5`, `--border`, `--text-muted`, `--surface`, and `--text` using `getComputedStyle(document.documentElement)`, ensuring dark/preset switching and clear contrast across all series.

---

## 6. Verification Check (`npm run theme:check`)

Run before committing any styling or UI changes:

```bash
npm run theme:check
```

`scripts/check-theme.js` enforces that:
- `client/src/index.css` defines all required Sakinah tokens and presets (`sakinah`, `html.dark`, `classic-emerald`).
- Every `.js` / `.jsx` file under `client/src` contains **zero** hardcoded hex color literals and **zero** legacy Tailwind palette tokens (`emerald-*`, `ivory-*`, `gold-[0-9]`, `dark-surface`/`dark-card`/`dark-bg`/`dark-border`, `stone-*`, etc.).

