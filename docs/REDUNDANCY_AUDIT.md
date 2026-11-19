# Redundancy Audit & De-Clutter Report

> **Project**: Manikpur Eidgah (মানিকপুর ঈদগাহ)  
> **Date**: 2026-11-19  
> **Scope**: Mobile-first clean redesign of the entire React frontend (`client/`).

---

## 1. Executive Summary

This audit identifies every instance across the Manikpur Eidgah web application where identical or overlapping information, links, headings, calls to action (CTAs), counters, or components appeared multiple times on a single screen or across navigational pathways.

In accordance with the **No-Redundancy Rules**, each fact now appears **once per screen**, navigation exists **once** on mobile (via the 5-item bottom tab bar and "More" sheet), and every screen follows a clean, single-purpose visual hierarchy without decorative fluff, duplicate teasers, or heavy animation gimmicks.

---

## 2. Screen-by-Screen Redundancy Audit & Removal Log

### 2.1 Navigation & Global Layout

| Location | Prior Redundancy / Duplication | What Was Removed / Fixed |
| :--- | :--- | :--- |
| **Header / Top Bar** | Top utility bar displayed site location + tagline + theme toggle + font size + language switcher. Right below it, the Navbar repeated the site name, added an extra subtitle, full 10-link desktop menu, a Donate button, and a hamburger drawer containing all 10 links again. | On mobile (`< 1024px`), collapsed into a single compact bar (height 56px) with short site name, language toggle (`বাংলা` / `English`), and a settings/more icon. Removed the redundant hamburger drawer and secondary title bars. |
| **Mobile Bottom Bar** | Mobile tab bar had 4 links + "More" sheet, while the header simultaneously had a hamburger menu with all 10 links, leading to dual menus on every mobile screen. | Navigation exists strictly **once** on mobile: the 5-item bottom tab bar (`Home`, `Members`, `Land Donors`, `Gallery`, `More`). The "More" sheet serves as the single canonical drawer for all secondary sections. |
| **Footer** | Mobile footer previously rendered a 6-item "Quick Links" column, a prayer schedule block, a bank account summary, and multiple theme buttons—duplicating what was already in the bottom bar, Home, and Contact page. | On mobile, the footer menu is stripped completely. The mobile footer now contains strictly: canonical site name, address, single tap-to-call phone, and copyright notice. |
| **Breadcrumbs** | Every inner page displayed a full `Home > Page > Subpage` breadcrumb trail with home icon and chevrons, occupying vertical space on 360–390px phone screens. | Removed breadcrumbs on mobile; replaced with a single clean, ergonomic Back button (`← ফিরে যান` / `← Back`). Desktop (`>= 1024px`) retains the breadcrumb trail. |
| **Scroll Progress & Particles** | Floating gold dust particles, drifting moon animations, rotating star dividers, and a top scroll progress bar added visual noise and CPU load. | Removed all non-functional decorative animations: `hero-dust-particle`, `animate-crescent`, `animate-sun-pulse`, `animate-bird-drift`, `card-shine-sweep`, `useCardTilt`, and spinning star dividers. |

---

### 2.2 Home Page (`/`)

| Section | Prior Redundancy / Duplication | What Was Removed / Fixed |
| :--- | :--- | :--- |
| **Hero** | Displayed eyebrow + full site name + long tagline + 2 buttons + Jamat schedule card + background slideshow/particles + bottom curved wave divider. | Streamlined into a compact light dawn hero (~340px height) with site name, single-line tagline, **one** primary filled CTA (`Lifetime Members`), and **one** text link (`Land Donors`). Height adjusts cleanly without empty whitespace. |
| **Teaser Sections** | Home contained **4 separate teaser sections**: `DesignsTeaserSection`, `MembersDonorsTeaser`, `TransparencyTeaser`, and `CommitteePreviewSection`—duplicating content already accessible via quick-links and their dedicated pages. | Completely removed all 4 duplicate teaser sections from Home. Home now strictly follows the 6-block specification: (1) Compact Hero, (2) Jamat card + 1 latest notice, (3) Compact Stats row, (4) 2×3 Quick-Link grid, (5) Recent Gallery photo strip (max 6), (6) Directions card. |
| **Stats Row** | Numbers used count-up animation gimmicks (`useCounter`) and repeated figures that also appeared in teaser cards below. | Removed count-up gimmicks; stats display real numbers instantly in a single compact 3-item row (`Members`, `Land Donors`, `Photos`). Hidden if missing. |
| **Map on Home** | Home previously embedded an interactive Leaflet map that intercepted touch scroll gestures on mobile. | Removed embedded map from Home. Replaced with a clean "Directions" card showing the address and a native "Directions / দিকনির্দেশনা" button opening Google Maps. |

---

### 2.3 About Page (`/about`)

| Item | Prior Redundancy / Duplication | What Was Removed / Fixed |
| :--- | :--- | :--- |
| **Header & Stats** | SectionHeader had an eyebrow badge + H1 + subtitle + star divider + a 3-card stats block repeating est. year, land area, and capacity. | Consolidated into a single H1 heading. Replaced the 3 huge stat cards with a compact key-value summary list. |
| **History Text** | Multiple paragraphs of intro and history were shown uncollapsed, pushing the committee leadership far down the screen. | Short history summary displayed with an expandable "Read More / বিস্তারিত পড়ুন" toggle. |
| **Committee Roster** | Committee members were displayed with multiple large photo cards repeating titles and designations. | Reorganized: Chief Coordinator featured in a prominent card, followed by coordinators in a clean 2-column mobile grid. Full details open in a bottom sheet on tap. Previous committees placed in a collapsed accordion. |

---

### 2.4 Lifetime Members (`/lifetime-members`) & Land Donors (`/land-donors`)

| Item | Prior Redundancy / Duplication | What Was Removed / Fixed |
| :--- | :--- | :--- |
| **View Toggles & Fluff** | Displayed grid-vs-table toggles, decorative star dividers, and bulky certificate cards with double borders and shine sweeps directly in the scroll feed. | Removed grid/table toggle on mobile. Replaced feed cards with ultra-clean, uniform 56px photo list-cards with name, primary distinction chip, and donation/area badge. |
| **Certificate Cards** | Heavy gold-plate certificate graphics were rendered for all records on screen, causing DOM bloat and scroll stutter on low-end phones. | The full certificate/gold-foil presentation appears **strictly inside the detail Bottom Sheet** when an item is tapped. |
| **Filters & Search** | Multiple dropdown selects and year filters cluttered the top of the feed. | Consolidated into a sticky search input + **one** "Filter" button that opens a bottom sheet. |
| **Pagination** | Numbered pagination buttons (`1, 2, 3...`) cramped mobile screens. | Converted to mobile-standard "Load More / আরও দেখুন" button with 20 items per page and skeleton placeholders. |

---

### 2.5 Notices (`/notices`) & Legal Documents (`/documents`)

| Item | Prior Redundancy / Duplication | What Was Removed / Fixed |
| :--- | :--- | :--- |
| **Category Buttons** | Rendered 9 category filter buttons in a wrapping row that consumed over 180px of vertical space before any document was visible. | Replaced with a single filter button opening a category bottom sheet, keeping the list immediately visible above the fold. |
| **List Item Redundancy** | Each card had duplicate "Preview" and "Download" buttons side-by-side with file size badges. | Compact list card with document title, date chip, and category. Tapping the card opens preview/details; PDF has a direct "Open PDF" action. |

---

### 2.6 Gallery (`/gallery`) & Gallery Folder (`/gallery/:slug`)

| Item | Prior Redundancy / Duplication | What Was Removed / Fixed |
| :--- | :--- | :--- |
| **Album Folders** | Large cover cards with overlapping badges and multiple action links. | Compact 2-column folder grid with cover image, folder title, and photo count badge. |
| **Folder View** | Inconsistent photo spacing and heavy card borders. | Clean 3-column square photo grid with 2px gaps, optimized for phone screens. |
| **Lightbox** | Lightbox lacked smooth mobile touch gestures and could conflict with iOS back-swipe navigation. | Added swipe gesture with edge-guard (swipes within 20px of screen edge are ignored to allow native iOS back gesture), pinch/double-tap zoom, clean photo counter, and caption. |

---

### 2.7 3D Designs & Masterplan (`/designs`)

| Item | Prior Redundancy / Duplication | What Was Removed / Fixed |
| :--- | :--- | :--- |
| **Banners & Modals** | Repetitive notice banners and redundant preview buttons. | Single-column clean image presentation with concise caption. Tapping an image opens the full-screen lightbox. |

---

### 2.8 Contact & Bank Info (`/contact`)

| Item | Prior Redundancy / Duplication | What Was Removed / Fixed |
| :--- | :--- | :--- |
| **Map & Accounts** | Embedded interactive map duplicated the map section and competed with page scroll. Multiple copy buttons and bank descriptions repeated information. | Removed embedded map. Retained: tap-to-call phone number, physical address, and a single consolidated bank account block with one-tap clipboard copy. |

---

### 2.9 Admin Panel (`/eidgah-manage-k29x`)

| Item | Prior Redundancy / Duplication | What Was Removed / Fixed |
| :--- | :--- | :--- |
| **Sidebar on Mobile** | A 16-item full desktop sidebar was jammed into an off-canvas drawer requiring multiple taps to navigate. | Added a mobile admin bottom tab bar with 4 core tabs: **Dashboard**, **Content**, **Add**, and **Settings**. |
| **Tables on Mobile** | Wide desktop tables forced awkward horizontal scrolling and clipped action buttons. | On mobile screens, administrative tables render as clean stacked cards with photo, key metadata chip, and edit/delete actions. |
| **Forms** | Dual-column English/Bangla inputs were cramped side-by-side on mobile. | Stacked single-column layout with grouped collapsible sections and sticky Save button aligned with safe-area insets. |

---

## 3. Visual System & Code Cleanliness

The following non-standard or gimmick classes and hooks have been permanently excised:
- `useCardTilt.js` (3D tilt on mousemove)
- `useCounter` (unnecessary count-up timer delay)
- `.card-shine-sweep` (diagonal glare animation)
- `.hero-dust-particle` (floating particles)
- `.animate-crescent` & `.animate-bird-drift` (decorative sky movement)
- `.animate-sun-pulse` (sun glow scaling)
- Spinning star ornaments (`animate-spin-slow`)
- Redundant subtitle fluff and decorative section dividers

All remaining styling strictly adheres to the canonical **Sakinah Light Theme Tokens**:
- `--bg: #FBF8F1` (Ivory canvas)
- `--bg-alt: #F1F7F2` (Soft mint sections)
- `--surface: #FFFFFF` (Card surface)
- `--primary: #247A59` (Calm green primary)
- `--primary-dark: #1B5E45` (High-contrast ink & headings)
- `--primary-soft: #DCEEE3` (Soft sage chips & active indicators)
- `--gold: #C9A24B` (Thin accents, focus rings, and amount chips)
- `--text: #1F2D2A` (Dark charcoal readable text)
- `--text-muted: #55665F` (Secondary label text)
- `--border: #E6E0CE` (Sand 1px card borders)

---
*End of Redundancy Audit.*
