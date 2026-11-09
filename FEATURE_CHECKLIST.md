# Manikpur Eidgah (মানিকপুর ঈদগাহ) — Feature Parity Audit & Implementation Checklist

> **Audit Date**: 2026-11-09  
> **Source Project**: `legacy-laravel` (Laravel 11, Blade, MySQL)  
> **Target Stack**:
> - **Frontend**: React.js + Vite, Tailwind CSS, Lucide React, React Router DOM, Context API (i18n), Leaflet + OpenStreetMap, Recharts, PapaParse, React Helmet Async.
> - **Backend**: Node.js + Express.js REST API, Prisma ORM, PostgreSQL (Supabase), JWT + bcrypt auth, Zod validation, Multer (memory storage) + Sharp, json2csv.
> - **Storage**: Cloudflare R2 (S3-compatible SDK) — Public bucket (photos/assets) & Private bucket (ADMIN_ONLY documents with signed URLs).

---

## 1. Public Routes, Pages & UI Features

| Legacy Route & Page | Legacy Controller & View | Target Frontend Route & Component | Target Backend API Route | Description & Parity Requirements | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET /` | `Public\HomeController@index` -> `public.home` | `/` -> `Home.jsx` | `GET /api/public/home` | Hero banner (supports 3 background styles: `eid-dawn`, `arcade`, `photo`), Bismillah toggle, Est. 1965 badge, 2 equal CTAs, Eid Jamat schedule block, overlapping animated counter stats card (members, donors, photos, land area, est. year with Bangla digits), latest notices, recent photo folders (stacked look), 3D design & plan teaser, featured members/donors, location map preview, transparency legal docs teaser, committee leaders preview, footer. Hides empty sections cleanly. | [x] Completed Phase 3 |
| `GET /about` | `Public\AboutController@index` -> `public.about` | `/about` -> `About.jsx` | `GET /api/public/about` | History, land area, capacity, Managing Committee display (Level 1: 1 large centered card for Chief Coordinator; Level 2: "সমন্বয়কবৃন্দ" 3 per row desktop, 2 per row mobile; no connector lines; modal profile popup). "Previous Committees" archive grouped by term. Editable title (`committee_title`). | [ ] Pending Phase 4 |
| `GET /lifetime-members` | `Public\MemberController@index` -> `public.members` | `/lifetime-members` -> `Members.jsx` | `GET /api/public/members` | Certificate card vs table view toggle, search (name, father's name, address, member no), filter by year, sort (no, name, year, amount), pagination. Card design: "Membership Certificate Card" (emerald, double gold border, corner ornaments, arch photo/avatar, ribbon member no, shimmer amount plate ONLY when `show_amount` & global setting allow). Private phone & NID NEVER exposed. | [ ] Pending Phase 4 |
| `GET /donors` | `Public\DonorController@index` -> `public.donors` | `/donors` -> `Donors.jsx` | `GET /api/public/donors` | Searchable & filterable ledger, filter by purpose (`CONSTRUCTION`, `BOUNDARY_WALL`, `LAND_PURCHASE`, `SOUND_SYSTEM`, `GENERAL`, `OTHER`) and year, total donation summary. Amount displayed only when BOTH record `show_amount` and global `show_donation_amount` allow. Private phone never sent. | [ ] Pending Phase 4 |
| `GET /gallery` | `Public\GalleryController@index` -> `public.gallery.index` | `/gallery` -> `Gallery.jsx` | `GET /api/public/gallery` | Folders layout (cards with cover, type badge, year, photo count, stacked preview; desktop 4/row, mobile 2/row), tabs (`ALL`, `FITR`, `ADHA`, `OTHER`), year filter, search. | [ ] Pending Phase 5 |
| `GET /gallery/:slug` | `Public\GalleryController@show` -> `public.gallery.show` | `/gallery/:slug` -> `GalleryFolder.jsx` | `GET /api/public/gallery/:slug` | Breadcrumb, "← সব ফোল্ডার" back link, folder details, masonry photo grid, pagination, full lightbox (keyboard nav, touch swipe, pinch zoom, captions bn/en, counter, thumbnail strip, optional download button gated by setting), prev/next folder nav. | [ ] Pending Phase 5 |
| `GET /designs` | `Public\DesignController@index` -> `public.designs.index` | `/designs` -> `Designs.jsx` | `GET /api/public/designs` | Grid of 7 proposed architectural 3D render images with captions bn/en, in-page lightbox (no detail page), 3D Video section (uploaded MP4/WebM or YouTube nocookie embed) shown only when published videos exist. Disclaimer that they are proposed 3D renders. | [ ] Pending Phase 5 |
| `GET /map` | `Public\MapController@index` -> `public.map` | `/map` -> `MapPage.jsx` | `GET /api/public/map` | Leaflet + OpenStreetMap interactive viewer, custom marker at lat/lng, GeoJSON boundary polygon overlay, one-click Google Maps directions button, touch scroll prevention (no mobile scroll trap). | [ ] Pending Phase 4 |
| `GET /land-maps` | `Public\LandMapController@index` -> `public.land-maps` | `/land-maps` -> `LandMaps.jsx` | `GET /api/public/land-maps` | Mouza/cadastral map viewer (CS, SA, RS, BS), title, survey type, dag/khatian info, date, pan & zoom controls (zoom in/out/reset, mouse drag, touch drag), direct file download. | [ ] Pending Phase 4 |
| `GET /documents` | `Public\DocumentController@index` -> `public.documents` | `/documents` -> `Documents.jsx` | `GET /api/public/documents` | Legal documents repository (Deed, Khatian, Porcha, Mutation, DCR, Court papers, Resolutions, Others). Search, category filter, modal preview, direct download. Only `PUBLIC` documents shown; PDF fallback button for mobile devices. | [ ] Pending Phase 4 |
| `GET /documents/:id/file` | `Public\DocumentController@file` | Dynamic signed URL or proxy | `GET /api/public/documents/:id/file` | Serves public files directly from R2, or validates admin auth for `ADMIN_ONLY` documents and generates a short-lived signed R2 download/preview URL. | [ ] Pending Phase 4 |
| `GET /notices` | `Public\NoticeController@index` -> `public.notices.index` | `/notices` -> `Notices.jsx` | `GET /api/public/notices` | Notices list with pinned notices first, search, pagination. | [ ] Pending Phase 4 |
| `GET /notices/:slug` | `Public\NoticeController@show` -> `public.notices.show` | `/notices/:slug` -> `NoticeDetail.jsx` | `GET /api/public/notices/:slug` | Full announcement text, date, attachment download, Web Share API with copy-link fallback, recent notices sidebar. | [ ] Pending Phase 4 |
| `GET /contact` | `Public\ContactController@index` -> `public.contact` | `/contact` -> `Contact.jsx` | `GET /api/public/contact` | Committee contact persons, bank accounts & mobile banking donation channels (bKash, Nagad), address, interactive map preview, tap-to-call `tel:` links. | [ ] Pending Phase 4 |
| `GET /sitemap.xml` | `Public\SitemapController@index` -> `public.sitemap` | Handled by backend | `GET /sitemap.xml` | XML sitemap containing all static routes, published notice slugs, and published gallery folder slugs. | [ ] Pending Phase 7 |
| `GET /robots.txt` | Static in public | Handled by backend | `GET /robots.txt` | Robots.txt allowing public paths and explicitly disallowing the secret admin path and API private routes. | [ ] Pending Phase 7 |
| Global Layout & Shell | `layouts.public` + `components/` | `PublicLayout.jsx` | `GET /api/public/settings` | Ivory Heritage theme (#FAF7F0, #0F5132 emerald, #B8923F gold), Noto Serif Bengali headings + Hind Siliguri body, hairline gold card borders, 8-point-star dividers, arch-top frames. Language switcher (BN default / EN), text size control (A- / A / A+ persisted in localStorage), sticky shrinking header, mobile hamburger drawer, desktop nav, rich footer, toast notifications, skeleton loaders, custom 404 & 500 error boundaries, web app manifest. | [ ] Pending Phase 3 |

---

## 2. Admin Panel Routes, Features & Access Controls

All admin routes live under a secret, configurable path `VITE_ADMIN_PATH` (e.g. `/eidgah-manage-k29x`).  
Decoy paths (`/admin`, `/login`, `/dashboard`, `/wp-admin`, `/phpmyadmin`, etc.) render the normal public 404.

| Legacy Admin Route | Legacy Controller | Target Admin SPA Route | Target Backend API Route | Roles & Permissions | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET /login` | `Admin\AuthController@showLogin` | `/:adminPath/login` | `POST /api/admin/auth/login` | Public under secret path. Rate limited: 5 failed attempts/15 min lockout per IP+email. Generic error message. Captures IP & User-Agent in activity log. | [ ] Pending Phase 2 |
| `POST /logout` | `Admin\AuthController@logout` | (Button action) | `POST /api/admin/auth/logout` | Clears JWT httpOnly cookie, logs logout event. | [ ] Pending Phase 2 |
| `GET /password` & `PUT /password` | `Admin\AuthController@showChangePassword`, `changePassword` | `/:adminPath/password` | `PUT /api/admin/auth/password` | Authenticated (ADMIN, EDITOR). Min 10 chars. Forced change if `must_change_password` is true. | [ ] Pending Phase 2 |
| `GET /` | `Admin\DashboardController@index` | `/:adminPath` | `GET /api/admin/dashboard` | Counts of members, donors, committee, albums, photos, designs, land maps, documents, notices, users. Recharts: donations by purpose, donations by year, members by year. Storage usage stats (R2 + DB), recent activity feed, backup status with warning if > 30 days. | [ ] Pending Phase 6 |
| Lifetime Members CRUD | `Admin\MemberController` | `/:adminPath/members` | `/api/admin/members` | ADMIN & EDITOR: list, search, sort, filter, create, edit, soft-delete. Includes photo upload (Sharp resize + WebP), private phone, private NID, `show_amount` toggle, `is_active` toggle. | [ ] Pending Phase 6 |
| Members CSV Import/Export | `Admin\MemberController@exportCsv`, `templateCsv`, `importCsv` | `/:adminPath/members` | `/api/admin/members/export-csv`, `/template-csv`, `/import-csv` | UTF-8 BOM Excel-compatible CSV export, downloadable sample template, preview before import with error rows, PapaParse on client + server validation. | [ ] Pending Phase 6 |
| Donors CRUD | `Admin\DonorController` | `/:adminPath/donors` | `/api/admin/donors` | ADMIN & EDITOR: list, search, filter by purpose/year, create, edit, soft-delete. `show_amount` toggle, receipt no, notes bn/en. | [ ] Pending Phase 6 |
| Donors CSV Import/Export | `Admin\DonorController@exportCsv`, `templateCsv`, `importCsv` | `/:adminPath/donors` | `/api/admin/donors/export-csv`, `/template-csv`, `/import-csv` | UTF-8 BOM CSV export, sample template download, preview-before-import. | [ ] Pending Phase 6 |
| Committee Members CRUD | `Admin\CommitteeMemberController` | `/:adminPath/committee` | `/api/admin/committee` | ADMIN & EDITOR: list, filter by term/current, create, edit, soft-delete. Drag-and-drop reordering, interactive live org chart preview, photo upload, bio bn/en, private phone + `show_phone` toggle. | [ ] Pending Phase 6 |
| Committee New Term Action | `Admin\CommitteeMemberController@newTerm` | `/:adminPath/committee` | `POST /api/admin/committee/new-term` | Archives all current committee members (sets `is_current = false`), creates/sets new term label and optional new committee title. Never deletes previous members. | [ ] Pending Phase 6 |
| Committee CSV Import/Export | `Admin\CommitteeMemberController@exportCsv`, `templateCsv`, `importCsv` | `/:adminPath/committee` | `/api/admin/committee/export-csv`, `/template-csv`, `/import-csv` | UTF-8 BOM CSV export, template download, CSV import. | [ ] Pending Phase 6 |
| Photo Albums / Folders CRUD | `Admin\AlbumController` | `/:adminPath/albums` | `/api/admin/albums` | List folders, year/type filters, create, edit, toggle publish, soft delete folder. Auto-slug generation. | [ ] Pending Phase 6 |
| Album Photos Management | `Admin\AlbumController@show`, `uploadPhotos`, `setCover`, `reorderPhotos`, `bulkActionPhotos`, `updatePhoto`, `destroyPhoto` | `/:adminPath/albums/:id` | `/api/admin/albums/:id/photos` | Multi-image upload with client compression, Sharp processing (WebP + thumbnail), duplicate file warning, drag-and-drop reorder, set cover photo, move photos between folders, bulk publish/unpublish/delete, edit captions bn/en. | [ ] Pending Phase 6 |
| Design & Plan Management | `Admin\DesignController` | `/:adminPath/designs` | `/api/admin/designs` | Upload design images, captions bn/en, drag-and-drop reorder, toggle publish, soft delete. Manage 3D video (upload MP4/WebM or YouTube embed URL). | [ ] Pending Phase 6 |
| Land Maps CRUD | `Admin\LandMapController` | `/:adminPath/land-maps` | `/api/admin/land-maps` | List, upload map image/PDF, survey type (CS/SA/RS/BS), dag/khatian info, map date, sort order, toggle publish, soft delete. | [ ] Pending Phase 6 |
| Legal Documents CRUD | `Admin\DocumentController` | `/:adminPath/documents` | `/api/admin/documents` | List, filter by category/visibility, upload document (PDF/image) to PRIVATE R2 bucket, category, document no, date, description bn/en, visibility (`PUBLIC` vs `ADMIN_ONLY`). Delete is restricted to ADMIN role only. | [ ] Pending Phase 6 |
| Notices CRUD | `Admin\NoticeController` | `/:adminPath/notices` | `/api/admin/notices` | List, create, edit, pin announcement toggle, publish toggle, file attachment upload, soft delete. | [ ] Pending Phase 6 |
| Site Settings & Config | `Admin\SiteSettingController@edit`, `update` | `/:adminPath/settings` | `GET/PUT /api/admin/settings` | Manage all site settings: name bn/en, tagline, est. year, land area, capacity, location, intro bn/en, history bn/en, Eid Jamat schedule, bank info bn/en, map coordinates, boundary GeoJSON, contacts, socials, hero image, hero bg style (`eid-dawn`, `arcade`, `photo`), Bismillah toggle, `show_donation_amount` toggle, `show_member_amount` toggle, allow photo download toggle. | [ ] Pending Phase 6 |
| Database & File Backup | `Admin\SiteSettingController@downloadBackup` | `/:adminPath/backup` | `GET /api/admin/backup` | Download full JSON export of all database tables + list of file keys; download ZIP package. Shows last backup date with alert if > 30 days. | [ ] Pending Phase 6 |
| Restore / Migration Import | New Admin Feature + CLI | `/:adminPath/backup/restore` | `POST /api/admin/backup/restore` | Upload and restore from legacy Laravel export ZIP (JSON tables + uploaded files). Supports dry-run, upload files to R2, insert-missing-only (no overwrite unless checkbox checked), detailed progress report. | [ ] Pending Phase 6 |
| Trash Management | `Admin\AlbumController@trash`, `CommitteeMemberController@trash`, etc. | `/:adminPath/trash` | `/api/admin/trash` | Central Trash page listing soft-deleted items across all models (Members, Donors, Committee, Albums, Photos, Documents, Land Maps, Notices, Designs). Restore action (ADMIN & EDITOR). Permanent Delete action (ADMIN only, with typed confirmation name). | [ ] Pending Phase 6 |
| Activity Logs | `Admin\ActivityLogController` | `/:adminPath/activity-logs` | `/api/admin/activity-logs` | Paginated log of all actions (`LOGIN`, `LOGOUT`, `CREATED`, `UPDATED`, `DELETED`, `RESTORED`, `ARCHIVED`, `EXPORT`, `IMPORTED`) with user, IP, User-Agent, before/after JSON properties. | [ ] Pending Phase 6 |
| User Management | `Admin\UserController` | `/:adminPath/users` | `/api/admin/users` | ADMIN role only. List users, create user, edit role (`ADMIN`/`EDITOR`), active/inactive toggle, reset password. Self-lockout prevention. | [ ] Pending Phase 6 |

---

## 3. Data Models & Prisma Schema

| Model Name | Table Name | Fields & Types | Relations & Indexes | Soft Delete | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `User` | `users` | `id` (CUID/Int), `name`, `email` (unique), `password`, `role` (enum: `ADMIN`, `EDITOR`), `isActive` (bool, default true), `mustChangePassword` (bool, default false), `lastLoginAt` (datetime?), `createdAt`, `updatedAt` | Relations: uploaded documents, created notices, activity logs | No | [ ] Pending Phase 2 |
| `Member` | `members` | `id`, `membershipNo` (unique), `nameBn`, `nameEn`?, `fatherNameBn`?, `fatherNameEn`?, `addressBn`?, `addressEn`?, `phone`? (private), `nidNo`? (private), `photoPath`?, `memberSince`? (int), `amountPaid`? (decimal), `showAmount` (bool, default false), `isActive` (bool, default true), `sortOrder` (int, default 0), `deletedAt`?, `createdAt`, `updatedAt` | Indexes: `membershipNo`, `memberSince`, `isActive`, `deletedAt` | Yes (`deletedAt`) | [ ] Pending Phase 2 |
| `Donor` | `donors` | `id`, `donorNameBn`, `donorNameEn`?, `phone`? (private), `addressBn`?, `addressEn`?, `amount` (decimal), `donationDate` (date), `purpose` (enum: `DonationPurpose`), `showAmount` (bool, default true), `receiptNo`?, `noteBn`?, `noteEn`?, `deletedAt`?, `createdAt`, `updatedAt` | Indexes: `donationDate`, `purpose`, `deletedAt` | Yes (`deletedAt`) | [ ] Pending Phase 2 |
| `CommitteeMember` | `committee_members` | `id`, `level` (int, 1=Chief Coordinator, 2=Coordinator, etc.), `parentId`? (self-relation), `nameBn`, `nameEn`?, `designationBn`, `designationEn`?, `roleBn`?, `roleEn`?, `designationType` (string, default 'MEMBER'), `addressBn`?, `addressEn`?, `photoPath`?, `term` (string, e.g. '২০২৪ - বর্তমান'), `isCurrent` (bool, default true), `isActive` (bool, default true), `sortOrder` (int, default 0), `phone`? (private), `showPhone` (bool, default false), `bioBn`?, `bioEn`?, `deletedAt`?, `createdAt`, `updatedAt` | Relations: `parent`, `children`. Indexes: `isCurrent`, `isActive`, `level`, `sortOrder`, `deletedAt` | Yes (`deletedAt`) | [ ] Pending Phase 2 |
| `Album` | `albums` | `id`, `titleBn`, `titleEn`?, `slug` (unique), `occasionNameBn`?, `occasionNameEn`?, `descriptionBn`?, `descriptionEn`?, `type` (enum: `AlbumType`), `year` (int), `eventDate`? (date), `coverPhotoId`? (int), `isPublished` (bool, default true), `sortOrder` (int, default 0), `deletedAt`?, `createdAt`, `updatedAt` | Relations: `photos`, `coverPhoto`. Indexes: `slug`, `type`, `year`, `isPublished`, `deletedAt` | Yes (`deletedAt`) | [ ] Pending Phase 2 |
| `Photo` | `photos` | `id`, `albumId` (FK), `path` (R2 key), `thumbPath`? (R2 key), `originalName`?, `captionBn`?, `captionEn`?, `width`? (int), `height`? (int), `fileSize`? (int), `sortOrder` (int, default 0), `isPublished` (bool, default true), `deletedAt`?, `createdAt`, `updatedAt` | Relations: `album`. Indexes: `albumId`, `isPublished`, `sortOrder`, `deletedAt` | Yes (`deletedAt`) | [ ] Pending Phase 2 |
| `LandMap` | `land_maps` | `id`, `titleBn`, `titleEn`?, `descriptionBn`?, `descriptionEn`?, `surveyType`? (enum/string: CS, SA, RS, BS), `dagKhatianInfo`?, `mapDate`? (date), `filePath` (R2 key), `thumbPath`? (R2 key), `fileType` (string, default 'IMAGE'), `fileSize`? (int), `isPublished` (bool, default true), `sortOrder` (int, default 0), `deletedAt`?, `createdAt`, `updatedAt` | Indexes: `isPublished`, `sortOrder`, `deletedAt` | Yes (`deletedAt`) | [ ] Pending Phase 2 |
| `Document` | `documents` | `id`, `titleBn`, `titleEn`?, `category` (enum: `DocumentCategory`), `documentNo`?, `documentDate`? (date), `descriptionBn`?, `descriptionEn`?, `filePath` (R2 key in private bucket), `fileMime`?, `fileSize`? (int), `visibility` (enum: `DocumentVisibility`), `uploadedById`? (FK to User), `deletedAt`?, `createdAt`, `updatedAt` | Relations: `uploader`. Indexes: `category`, `visibility`, `documentDate`, `deletedAt` | Yes (`deletedAt`) | [ ] Pending Phase 2 |
| `Notice` | `notices` | `id`, `titleBn`, `titleEn`?, `slug` (unique), `bodyBn` (text), `bodyEn`? (text), `publishedAt` (date), `isPinned` (bool, default false), `isPublished` (bool, default true), `attachmentPath`? (R2 key), `createdById`? (FK to User), `deletedAt`?, `createdAt`, `updatedAt` | Relations: `creator`. Indexes: `slug`, `isPinned`, `isPublished`, `publishedAt`, `deletedAt` | Yes (`deletedAt`) | [ ] Pending Phase 2 |
| `Design` | `designs` (legacy `design_images`) | `id`, `imageKey` (R2 key), `thumbKey`? (R2 key), `captionBn`?, `captionEn`?, `sortOrder` (int, default 0), `isPublished` (bool, default true), `deletedAt`?, `createdAt`, `updatedAt` | Indexes: `sortOrder`, `isPublished`, `deletedAt` | Yes (`deletedAt`) | [ ] Pending Phase 2 |
| `DesignVideo` | `design_videos` | `id`, `titleBn`, `titleEn`?, `type` (enum: `DesignVideoType`), `filePath`? (R2 key), `url`? (YouTube URL), `posterPath`? (R2 key), `sortOrder` (int, default 0), `isPublished` (bool, default true), `createdAt`, `updatedAt` | Indexes: `sortOrder`, `isPublished` | No | [ ] Pending Phase 2 |
| `SiteSetting` | `site_settings` | `id`, `key` (unique, varchar 100), `valueBn`? (text), `valueEn`? (text), `type` (varchar 30, e.g. 'text', 'boolean', 'json', 'image', 'number'), `group` (varchar 50, default 'general'), `createdAt`, `updatedAt` | Indexes: `key`, `group` | No | [ ] Pending Phase 2 |
| `ActivityLog` | `activity_logs` | `id`, `userId`? (FK to User), `action` (varchar 50, e.g. 'LOGIN', 'CREATED', 'UPDATED', 'DELETED', 'RESTORED', 'ARCHIVED', 'EXPORT', 'IMPORTED'), `subjectType`? (varchar 100), `subjectId`? (int), `description` (varchar 255), `properties`? (JSON: before/after diff), `ipAddress`? (varchar 45), `userAgent`? (varchar 255), `createdAt` | Indexes: `userId`, `action`, `subjectType`, `createdAt` | No | [ ] Pending Phase 2 |
| `LoginAttempt` | `login_attempts` | `id`, `key` (varchar 191, IP + email hash), `attempts` (int, default 1), `lockedUntil`? (datetime), `createdAt`, `updatedAt` | Indexes: `key`, `lockedUntil` | No | [ ] Pending Phase 2 |

---

## 4. Enums & Localized Values

| Enum Name | Values | Bangla Label (`bn`) | English Label (`en`) |
| :--- | :--- | :--- | :--- |
| `UserRole` | `ADMIN`, `EDITOR` | প্রধান অ্যাডমিন / সম্পাদক | Admin / Editor |
| `AlbumType` | `FITR`, `ADHA`, `OTHER` | ঈদুল ফিতর / ঈদুল আযহা / অন্যান্য উপলক্ষ | Eid-ul-Fitr / Eid-ul-Adha / Other Occasion |
| `DonationPurpose` | `CONSTRUCTION`, `BOUNDARY_WALL`, `LAND_PURCHASE`, `SOUND_SYSTEM`, `GENERAL`, `OTHER` | নির্মাণ কাজ / সীমানা প্রাচীর / জমি ক্রয় / সাউন্ড সিস্টেম / সাধারণ তহবিল / অন্যান্য | Construction / Boundary Wall / Land Purchase / Sound System / General Fund / Other |
| `DocumentCategory`| `DEED`, `KHATIAN`, `PORCHA`, `MUTATION`, `DCR`, `COURT`, `RESOLUTION`, `OTHER` | ওয়াকফ ও রেজিস্ট্রি দলিল / খতিয়ান / পর্চা / নামজারি / ডিসিআর ও খাজনা রশিদ / আদালতের আদেশ / রেজুলেশন ও কার্যবিবরণী / অন্যান্য কাগজপত্র | Waqf & Registered Deeds / Khatian / Porcha / Mutation / DCR & Land Tax Receipts / Court Orders / Committee Resolutions / Other Documents |
| `DocumentVisibility`| `PUBLIC`, `ADMIN_ONLY` | সর্বসাধারণের জন্য উন্মুক্ত / শুধু অ্যাডমিনদের জন্য সংরক্ষিত | Publicly Visible / Admin Only (Restricted) |
| `LandMapType` | `CS`, `SA`, `RS`, `BS` | সিএস জরিপ / এসএ জরিপ / আরএস জরিপ / বিএস জরিপ | CS Survey / SA Survey / RS Survey / BS Survey |
| `DesignVideoType` | `UPLOAD`, `YOUTUBE` | সার্ভারে সংরক্ষিত ভিডিও / ইউটিউব ভিডিও লিঙ্ক | Uploaded Video / YouTube Video |

---

## 5. Site Settings Keys & Defaults

| Key | Default Value (Bangla) | Default Value (English) | Type | Group |
| :--- | :--- | :--- | :--- | :--- |
| `site_name` | মানিকপুর কেন্দ্রীয় শাহী ঈদগাহ | Manikpur Central Shahi Eidgah | `text` | `general` |
| `tagline` | ঐতিহ্যবাহী দ্বীনি ও সামাজিক ঈদগাহ ময়দান • স্থাপিত ১৯৬৫ খ্রি. | Historic Community Eidgah Ground & Waqf Estate • Est. 1965 | `text` | `general` |
| `established_year`| ১৯৬৫ খ্রিস্টাব্দ (১৩৭২ বঙ্গাব্দ) | 1965 AD (1372 Bengali Year) | `text` | `general` |
| `land_area` | ১.৩৫ একর (১৩৫ শতাংশ ওয়াকফকৃত জমি) | 1.35 Acres (135 Decimals Waqf Land) | `text` | `general` |
| `capacity` | প্রায় ১২,০০০+ মুসল্লি (একত্রে জামাত আদায়যোগ্য) | Approx. 12,000+ Worshippers per Congregation | `text` | `general` |
| `location` | মানিকপুর, ডাকঘর: মানিকপুর বাজার, বাংলাদেশ | Manikpur, P.O: Manikpur Bazar, Bangladesh | `text` | `general` |
| `intro` | মানিকপুর কেন্দ্রীয় শাহী ঈদগাহ ১৯৬৫ সালে গ্রামের ধর্মপ্রাণ মুরুব্বি ও সমাজহিতৈষী ব্যক্তিবর্গের ঐকান্তিক প্রচেষ্টায় প্রতিষ্ঠিত হয়... | Established in 1965 through the dedication of pious elders and community philanthropists... | `text` | `general` |
| `history` | ১৯৬৫ সালের পূর্বে মানিকপুর গ্রামের মুসল্লিগণ অস্থায়ী মাঠে ঈদের নামাজ আদায় করতেন... | Prior to 1965, residents of Manikpur offered Eid prayers in temporary open fields... | `text` | `general` |
| `eid_jamat` | পবিত্র ঈদুল ফিতর: ১ম জামাত সকাল ৮:০০ ঘটিকা, ২য় জামাত সকাল ৯:০০ ঘটিকা... | Eid-ul-Fitr: 1st Jamat at 8:00 AM, 2nd Jamat at 9:00 AM... | `text` | `general` |
| `bank_info` | হিসাবের নাম: মানিকপুর কেন্দ্রীয় ঈদগাহ উন্নয়ন তহবিল... বিকাশ / নগদ: ০১৭১১-২২৩৩৪৪ | Account Name: Manikpur Central Eidgah Development Fund... bKash / Nagad: +880 1711-223344 | `text` | `contact` |
| `map_lat` | `23.9875` | `23.9875` | `text` | `map` |
| `map_lng` | `90.8214` | `90.8214` | `text` | `map` |
| `map_zoom` | `17` | `17` | `number` | `map` |
| `boundary_geojson`| GeoJSON Polygon for Manikpur Central Eidgah Boundary (1.35 Acres) | GeoJSON Polygon | `json` | `map` |
| `contact_phone` | `+880 1711-223344, +880 1819-556677` | `+880 1711-223344, +880 1819-556677` | `text` | `contact` |
| `contact_email` | `info@manikpureidgah.org` | `info@manikpureidgah.org` | `text` | `contact` |
| `facebook_url` | `https://facebook.com/manikpureidgah` | `https://facebook.com/manikpureidgah` | `text` | `social` |
| `youtube_url` | `https://youtube.com/@manikpureidgah` | `https://youtube.com/@manikpureidgah` | `text` | `social` |
| `hero_bg_style` | `eid-dawn` | `eid-dawn` | `text` | `general` |
| `hero_image` | `defaults/eidgah-hero.svg` | `defaults/eidgah-hero.svg` | `image` | `general` |
| `show_bismillah` | `1` | `1` | `boolean` | `general` |
| `show_donation_amount`| `1` | `1` | `boolean` | `privacy` |
| `show_member_amount`| `1` | `1` | `boolean` | `privacy` |
| `allow_photo_download`| `1` | `1` | `boolean` | `general` |
| `committee_title` | সাত সদস্যবিশিষ্ট উন্নয়ন কমিটি | Seven-Member Development Committee | `text` | `general` |

---

## 6. Helper Functions & Localization Mapping

| Legacy PHP Helper | Purpose & Logic | New Implementation (JS / Node / React) | Location in New App |
| :--- | :--- | :--- | :--- |
| `bn_num($val)` | Converts English digits `0-9` to Bengali numerals `০-৯` when active locale is `bn`. | `toBengaliNumerals(val, forceBangla = false)` | `client/src/utils/formatters.js` & `server/src/utils/formatters.js` |
| `format_bdt($amount)` | Formats number with commas and prefixes with `৳` and Bengali numerals. | `formatBDT(amount, locale = 'bn')` | `client/src/utils/formatters.js` |
| `localized($model, $field)`| Returns `$field_bn` or `$field_en` based on locale with fallback. | `getLocalized(obj, field, locale)` | `client/src/utils/formatters.js` |
| `setting($key, $default)`| Reads setting key from in-memory cache/context. | `useSettings()` hook on client, `settingsService.get(key)` on server. | `client/src/context/SettingsContext.jsx`, `server/src/services/settings.service.js` |
| `AdminPath::validate()` | Validates admin path (8-40 chars, alphanumeric + hyphens, rejects forbidden words). | `validateAdminPath(path)` in Zod and script. | `server/src/utils/adminPath.js` & `client/src/utils/adminPath.js` |
| Text size persistence | A- / A / A+ text enlargement persisted. | `useFontSize()` hook updating `html` font-size class and `localStorage`. | `client/src/context/ThemeContext.jsx` |
| Instant i18n Switch | Toggles between BN and EN without page reload. | React Context API `LanguageContext.jsx` using `translations.json`. | `client/src/context/LanguageContext.jsx` |

---

## 7. Security, Privacy & Validation Rules

1. **Privacy by Serialization**:
   - `Member`: Public API endpoints explicitly select safe fields (`id`, `membershipNo`, `nameBn`, `nameEn`, `fatherNameBn`, `fatherNameEn`, `addressBn`, `addressEn`, `photoPath`, `memberSince`, `sortOrder`, and `amountPaid`/`showAmount` gated by both global and record flags). `phone` and `nidNo` are NEVER queried or returned on public endpoints.
   - `Donor`: Public API selects safe fields. `phone` is never returned. `amount` is returned only when BOTH `show_donation_amount` and record `showAmount` are true; otherwise `amount: null`.
   - `CommitteeMember`: `phone` is returned ONLY when `showPhone` is true; otherwise `phone: null`.
   - `Document`: `visibility: ADMIN_ONLY` files are blocked on public endpoints. Admin users get short-lived signed download URLs via authenticated endpoints.
2. **Auth & Rate Limiting**:
   - JWT stored in `httpOnly`, `Secure`, `SameSite=Lax` cookies.
   - 5 failed login attempts per 15 minutes per IP+email triggers lockout in `login_attempts` table.
   - Password minimum 10 characters with bcrypt hashing (work factor 12).
   - Session timeout: 60 minutes inactivity.
   - Forced password change on first login if `mustChangePassword` is true.
   - Initial admin created via interactive CLI `npm run admin:create` or bootstrap environment variables. No default passwords committed.
3. **Admin Path Obscurity**:
   - Secret path defined in `VITE_ADMIN_PATH` and validated (8-40 chars, alphanumeric + hyphens, no reserved words).
   - `npm run admin:path` outputs the configured secret path.
   - Common decoys (`/admin`, `/login`, `/dashboard`, `/wp-admin`, `/phpmyadmin`) return standard public 404.
   - Robots meta `noindex, nofollow` on all admin views.
4. **Data Safety & Soft Deletes**:
   - Soft deletes (`deletedAt`) for all primary content models using Prisma client extensions.
   - Admin Trash page allows restoring items or permanent deletion (ADMIN only with typed confirmation).
   - Bulk actions default to soft delete only.
   - Idempotent seeders: check `firstOrCreate` / `count() === 0` before inserting. No wipe/truncate scripts.

---

## 8. Uploads & Storage Architecture

1. **Cloudflare R2**:
   - **Public Bucket**: Stores compressed WebP/JPEG photos (`photos/`, `members/`, `committee/`, `designs/`, `site/`).
   - **Private Bucket**: Stores `ADMIN_ONLY` legal documents (`documents/`). Access gated via AWS S3 SDK Presigned URLs (valid 15 minutes).
2. **Sharp Image Pipeline**:
   - Client pre-resizes images (~2000px max, quality ~0.82) before upload to save bandwidth.
   - Server validates MIME type using `file-type` buffer inspection, strips EXIF/GPS metadata, generates clean WebP/JPEG + thumbnails, and uploads directly to R2.
   - Memory storage Multer with 12 MB cap.

---

## 9. Operations & Deployment Architecture

1. **Vercel Frontend**:
   - Vite React SPA with `vercel.json` rewrites for `/api/(.*)` to backend service.
   - Edge function / serverless route for dynamic Open Graph tags for crawlers.
2. **Render / VPS Backend**:
   - Express REST API with Helmet, strict CORS allow-list, rate limiting.
   - `GET /api/health` queries PostgreSQL with `SELECT 1` to confirm database connectivity.
   - Frontend displays friendly "সার্ভার চালু হচ্ছে... অনুগ্রহ করে কয়েক সেকেন্ড অপেক্ষা করুন" (Server waking up) alert if cold start delay occurs.
   - GitHub Actions workflow running every 3 days pinging `/api/health` to prevent Supabase free tier pause.
3. **Data Import / Migration**:
   - Script `npm run data:import` reads the Laravel JSON/ZIP export, uploads files to R2, inserts missing rows idempotently, and logs counts.
   - Admin Restore page provides a UI with dry-run mode.

---

## 10. Phase Execution Roadmap & Status

- [x] **Phase 1: Feature Parity Audit & Checklist** (Review & Approval)
- [x] **Phase 2: Monorepo & Backend Foundation** (Express, Prisma schema & migrations, Auth, JWT cookie, R2 service, Health route, GitHub Action)
- [x] **Phase 3: Frontend Foundation & Home Page** (Vite, Tailwind, i18n Context, Decoy 404, Home page with 3 hero styles & stats)
- [ ] **Phase 4: Public Core Pages** (Lifetime Members, Donors, About/Committee, Contact, Notices, Documents, Land Maps, Leaflet Map)
- [ ] **Phase 5: Gallery Folders & Design Showcase** (Folder system, masonry, lightboxes, 3D video)
- [ ] **Phase 6: Admin Panel Complete** (Dashboard charts, CRUD for all models, Trash, Activity Log, CSV tools, Settings, Backup)
- [ ] **Phase 7: Data Import, SEO/OG, Responsive QA & Automated Tests** (Import script, test suite, Lighthouse mobile 85+, 360-1920px testing)
- [ ] **Phase 8: Documentation & Parity Verification** (README, DEPLOYMENT.md, environment variables summary, 100% parity sign-off)

