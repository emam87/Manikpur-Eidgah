# Mobile QA & Device Verification Checklist

> **Application**: Manikpur Eidgah (মানিকপুর ঈদগাহ)  
> **Test Date**: 2026-11-19  
> **Testing Scope**: Mobile-First Clean Sakinah Redesign

---

## 1. Device Viewport Matrix

| Device Profile | Viewport Resolution | Scale / DPR | Tested Status | Key Observations |
| :--- | :--- | :--- | :--- | :--- |
| **Compact Android** (e.g. Galaxy A12/A14) | 360 × 780 | 2.0x | PASS | Zero horizontal overflow; 56px top bar compact; bottom bar safe area clear. |
| **Standard iPhone** (e.g. iPhone SE / 8) | 375 × 667 | 2.0x | PASS | 16px input font size prevents Safari auto-zoom; Back button ergonomic. |
| **Modern iPhone** (e.g. iPhone 13/14/15) | 390 × 844 | 3.0x | PASS | Notch & gesture bar insets respected (`pb-safe`, `pt-safe`); edge swipe guard active. |
| **Large Android** (e.g. Pixel 7 / Galaxy S23) | 412 × 915 | 2.625x | PASS | 2-column quick links align cleanly; 3-column photo grid seamless. |
| **Tablet Portrait** (e.g. iPad Air / Mini) | 768 × 1024 | 2.0x | PASS | Clean transition from bottom bar to full navigation; responsive cards adapt. |
| **Desktop High-Res** | 1440 × 900 | 1.0x / 2.0x | PASS | Desktop top utility bar visible; 4-column footer active; dropdown menus function. |

---

## 2. Screen-by-Screen QA Results

### 2.1 Navigation & Global Shell
- [x] **Compact Mobile Top Bar**: Height is max 56px (`h-14`), site name displays cleanly without overflow.
- [x] **No Duplicate Mobile Drawer**: Hamburger menu drawer removed from header; navigation lives solely in bottom bar + "More" sheet.
- [x] **5-Item Bottom Tab Bar**: Labeled tabs (`Home`, `Members`, `Land Donors`, `Gallery`, `More`) with primary green active indicator.
- [x] **Canonical More Sheet**: Contains all 7 secondary destinations and 4 preference controls (Language, Theme, Font size, Lite mode).
- [x] **Minimal Mobile Footer**: Only site name, address, single tap-to-call phone (`tel:`), and copyright. No duplicate nav links.
- [x] **Mobile Back Button**: Replaces breadcrumbs on mobile screens (`< 1024px`) with a single clean `← ফিরে যান` / `← Back` action.

### 2.2 Home Page (`/`)
- [x] **Block 1 (Compact Hero)**: Light dawn background, large display H1, 1-line tagline, 1 primary filled CTA (`/lifetime-members`), 1 secondary text link (`/land-donors`). No slideshow or particles.
- [x] **Block 2 (Jamat & Notice Card)**: Displays Eid Jamat time and latest single notice card with "All notices" link. Shown only on Home.
- [x] **Block 3 (Compact Stats Row)**: 3-column stats without count-up timer delay; numbers render instantly.
- [x] **Block 4 (2×3 Quick-Link Grid)**: Exactly 6 destinations with line icons and short labels.
- [x] **Block 5 (Recent Photos Strip)**: Horizontal-scroll snap strip of recent photos (max 6).
- [x] **Block 6 (Directions Card)**: Address with native Google Maps Directions button. No embedded interactive map trap.
- [x] **Teaser Purge**: Removed `DesignsTeaserSection`, `MembersDonorsTeaser`, `TransparencyTeaser`, and `CommitteePreviewSection` from Home.

### 2.3 About Page (`/about`)
- [x] **Single H1 Heading**: Clean title without decorative eyebrow fluff.
- [x] **Compact Facts Summary**: Est. year, land area, and capacity in a clean 3-part key-value strip.
- [x] **Short Expandable History**: Initial summary with a "Read More / বিস্তারিত পড়ুন" toggle.
- [x] **Committee Presentation**: Chief Coordinator featured card + 2-column coordinators grid on mobile; tap opens detail bottom sheet with photo, designation, and phone.
- [x] **Archived Committees**: Grouped by term in a collapsed accordion.

### 2.4 Lifetime Members (`/lifetime-members`) & Land Donors (`/land-donors`)
- [x] **Sticky Search & Filter Button**: Single search field at top + filter button opening a bottom sheet.
- [x] **56px Photo List-Cards**: Uniform compact list rows on mobile displaying photo, name, and 1 key fact.
- [x] **Feed vs. Detail Separation**: Full gold-foil certificate card renders only inside bottom sheet upon tap.
- [x] **Load More Pagination**: 20 items per page with "Load More" button and skeleton placeholders; numbered page links removed.

### 2.5 Notices (`/notices`) & Documents (`/documents`)
- [x] **Filter Bottom Sheet**: 9 wrapping category buttons replaced with a single filter button opening a category sheet.
- [x] **Compact List Card**: Document title, date chip, category badge, and tap for detail/preview.
- [x] **Preview Modal**: In-page document viewer for PDFs and scanned images with direct download.

### 2.6 Gallery (`/gallery`) & Gallery Folder (`/gallery/:slug`)
- [x] **Folder Grid**: 2-column folder grid with cover photo, folder title, and count badge.
- [x] **Square Photo Grid**: 3-column square photo grid with 2px gaps (`gap-0.5`).
- [x] **Lightbox Usability**: Touch swipe enabled, edge-swipe guard active (ignoring swipes within 20px of screen edge), double-tap zoom, counter, and caption.

### 2.7 3D Designs (`/designs`) & Contact (`/contact`)
- [x] **Designs View**: Single-column clean image cards on mobile with concise caption; tap opens lightbox.
- [x] **Contact View**: Direct tap-to-call phone, address, and consolidated bank account card with 1-tap copy.

### 2.8 Admin Panel (`/eidgah-manage-k29x`)
- [x] **Admin Mobile Navigation**: 4-tab bottom navigation bar (`Dashboard`, `Content`, `Add`, `Settings`).
- [x] **Quick Add Sheet**: Shortcuts to add members, land donors, albums, notices, and documents.
- [x] **Safe-Area Content**: Main container padded (`pb-24`) so bottom navigation never covers form actions or table rows.
- [x] **Sticky Save Button**: Supports safe-area padding and `visualViewport` keyboard handling.
- [x] **HEIC & Camera Support**: Multi-select camera/gallery upload utility with client-side HEIC handling.

---

## 3. Automated Check Verification Summary

- `check-theme.js`: **0 violations** (All 79 files comply with single-source Sakinah design tokens).
- `check-i18n.js`: **0 missing keys** (100% parity across `bn` and `en`).
- `check-name.js`: **0 old name occurrences** (Official name: "Manikpur Eidgah" / "মানিকপুর ঈদগাহ").
- `check-mobile.js`: **PASS** (Zero horizontal scroll, tap targets >= 44px, zero duplicate navigation paths).
