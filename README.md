# মানিকপুর কেন্দ্রীয় শাহী ঈদগাহ (Manikpur Central Shahi Eidgah)

> **Historic Community Eidgah Ground & Waqf Estate • Established 1965**  
> Manikpur, Bancharampur, Brahmanbaria, Bangladesh.  
> Official bilingual web portal & management platform rebuilt with modern, resilient full-stack architecture.

---

## 🏛️ Project Overview

This repository houses the complete, modern full-stack implementation of the **Manikpur Central Shahi Eidgah** platform. Rebuilt to achieve **100% feature parity** with zero feature loss from the legacy system while elevating the design to the bespoke **"Ivory Heritage"** aesthetic (`#FAF7F0` ivory, `#0F5132` deep emerald, `#B8923F` antique gold).

### Key Architectural Highlights:
- **Clean Monorepo Structure**: Partitioned cleanly into [`client/`](./client) (React.js SPA) and [`server/`](./server) (Express.js REST API).
- **Privacy by Serialization**: Sensitive personal data (`phone`, `nidNo`) is strictly excluded from public JSON serialization at the database query level.
- **Dual-Gated Transparency**: Financial donations and member amounts are displayed publicly **only** when both the global site setting and individual record privacy flags allow it.
- **Obscure Admin URL + Hardened Security**: Admin panel is lazy-loaded under a configurable secret path (`VITE_ADMIN_PATH`). Standard decoy routes (`/admin`, `/login`, `/dashboard`, `/wp-admin`) immediately return 404. Authentication uses `httpOnly`, `Secure`, `SameSite=Lax` JWT cookies with IP+email rate limiting.
- **Cloudflare R2 Dual-Bucket Storage**: Public bucket for optimized WebP photos and thumbnails; strictly private bucket for `ADMIN_ONLY` legal documents with short-lived presigned URLs.
- **Free-Tier Survival Engineering**: Built-in cold-start loading indicators for Render and an automated GitHub Actions keep-alive workflow pinging `/api/health` every 3 days to keep Supabase PostgreSQL from pausing.

---

## 💻 Tech Stack

### Frontend (`/client`)
- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS ("Ivory Heritage" design system)
- **Typography**: Self-hosted Google Fonts (*Noto Serif Bengali* for headings, *Hind Siliguri* for body)
- **Icons**: Lucide React (clean line icons, zero emojis)
- **Routing**: React Router DOM v6
- **State & i18n**: Context API (Instant Bangla/English toggle, persisted A-/A/A+ text sizing)
- **Maps**: Leaflet + OpenStreetMap with custom heritage marker and 1.35-acre GeoJSON boundary polygon
- **Analytics & Charts**: Recharts (Donations by purpose, growth trends)
- **CSV Handling**: PapaParse (client-side preview and export)
- **SEO**: Dynamic Open Graph meta generation & React Helmet Async

### Backend (`/server`)
- **Runtime**: Node.js (ES Modules) + Express.js
- **ORM & Database**: Prisma ORM with PostgreSQL (Supabase / Neon / self-hosted)
- **Authentication**: JWT in `httpOnly` cookie + bcrypt (work factor 12)
- **Validation**: Zod schema validation
- **Image Processing**: Multer (12MB buffer limit) + Sharp (EXIF stripping, WebP compression, thumbnail generation)
- **Storage SDK**: AWS SDK v3 for Cloudflare R2 (S3-compatible) with automatic local disk fallback
- **Security**: Helmet, CORS allow-list, rate-limiting (`express-rate-limit`), soft deletes across all models
- **Testing**: Node.js built-in test runner (`node:test`, `node:assert/strict`)

---

## 📁 Repository Structure

```
ManikpurEidgah/
├── client/                     # Frontend React SPA
│   ├── public/                 # Static assets, favicon, 3D design renders
│   ├── src/
│   │   ├── admin/              # Lazy-loaded Admin Panel (isolated bundle chunk)
│   │   │   ├── components/     # Admin Layout, Sidebar, Modal, Tables
│   │   │   ├── context/        # AdminAuthContext (inactivity timeout, roles)
│   │   │   └── pages/          # Dashboard, Members, Donors, Committee, etc.
│   │   ├── components/         # Public layout, Header, Footer, Hero, Modals
│   │   ├── context/            # LanguageContext, ThemeContext, SettingsContext
│   │   ├── pages/              # Home, About, Members, Donors, Gallery, etc.
│   │   └── utils/              # Bengali numerals, currency formatters, admin path
│   ├── index.html              # HTML shell with Ivory Heritage theme
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/                     # Backend REST API
│   ├── prisma/
│   │   └── schema.prisma       # 14 models, 7 enums, soft deletes
│   ├── src/
│   │   ├── config/             # Environment configuration (env.js)
│   │   ├── controllers/        # Public, Admin, Auth, Health, SEO controllers
│   │   ├── db/                 # Prisma client instance
│   │   ├── middleware/         # Auth, RBAC, Rate-limit, Sharp uploads, Error
│   │   ├── routes/             # Public, Admin, Auth, Health, SEO routes
│   │   ├── scripts/            # Seed, Admin CLI, Path printer, Data import
│   │   ├── services/           # R2 storage, Settings cache service
│   │   └── utils/              # Formatters, audit logger, admin path validator
│   ├── tests/                  # Automated unit test suite (21 passing tests)
│   ├── package.json
│   └── uploads/                # Local storage fallback directory
│
├── .github/
│   └── workflows/
│       └── keepalive.yml       # Pings /api/health every 3 days (Supabase keep-alive)
│
├── FEATURE_CHECKLIST.md        # 100% Feature parity audit and completion checklist
├── DEPLOYMENT.md               # Production deployment guide (Vercel, Render, R2)
├── vercel.json                 # Vercel rewrites (/api, /sitemap.xml, /robots.txt)
├── package.json                # Root monorepo npm scripts
└── .gitignore                  # Strict security exclusions (no .env, no secrets)
```

---

## 🚀 Quickstart & Local Development

### 1. Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### 2. Installation
Clone the repository and install dependencies for both client and server:
```bash
git clone https://github.com/manikpureidgah/manikpureidgah.git
cd manikpureidgah
npm install
```

### 3. Environment Configuration
Copy the `.env.example` templates to `.env` in both folders:

**Server Configuration (`server/.env`):**
```bash
cp server/.env.example server/.env
```
Fill in your database URL, JWT secret, and secret admin path:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
DATABASE_URL=postgresql://user:password@localhost:5432/manikpur_eidgah?sslmode=disable
JWT_SECRET=super-secret-random-jwt-key-min-32-chars
COOKIE_SECRET=super-secret-cookie-key-min-32-chars
ADMIN_PATH=eidgah-manage-k29x
```
*(If Cloudflare R2 credentials are omitted, the server automatically saves uploads to `server/uploads/` on local disk).*

**Client Configuration (`client/.env`):**
```bash
cp client/.env.example client/.env
```
```env
VITE_API_URL=/api
VITE_ADMIN_PATH=eidgah-manage-k29x
VITE_SITE_URL=http://localhost:5173
```

### 4. Database Setup & Seeding
```bash
# Generate Prisma Client
npm run db:generate

# Run migrations (or push schema in development)
npm run db:migrate

# Seed default site settings & 7 development committee leaders
npm run db:seed

# Optional: Run idempotent legacy data import
npm run data:import
```

### 5. Admin Account Creation & Secret Path
```bash
# Create the first administrator interactively
npm run admin:create

# Display the configured secret admin URL
npm run admin:path
```

### 6. Start Development Servers
```bash
# Run both backend and frontend concurrently
npm run dev

# Or run individually:
npm run dev:server    # Backend API on http://localhost:5000
npm run dev:client    # Frontend SPA on http://localhost:5173
```

---

## 📜 NPM Scripts Reference

| Script | Command | Purpose |
| :--- | :--- | :--- |
| `npm run dev` | `dev:server & dev:client` | Runs backend (port 5000) and Vite client (port 5173) |
| `npm run build` | `build:client && build:server` | Builds production client and generates Prisma artifacts |
| `npm run build:client` | `vite build` | Builds optimized React production bundle into `client/dist/` |
| `npm run db:generate` | `prisma generate` | Generates the typed Prisma client |
| `npm run db:migrate` | `prisma migrate deploy` | Applies pending PostgreSQL migrations |
| `npm run db:seed` | `node src/scripts/seed.js` | Idempotently seeds settings and 7 committee coordinators |
| `npm run admin:create` | `node src/scripts/createAdmin.js` | CLI to securely create the first admin user (TTY-safe) |
| `npm run admin:path` | `node src/scripts/printAdminPath.js`| Validates and displays the current secret admin panel URL |
| `npm run data:import` | `node src/scripts/importLegacyData.js`| Idempotently imports all 14 models from legacy datasets |
| `npm test` | `node --test tests/*.test.js` | Runs automated test suite (Auth, RBAC, Privacy, Formatters, SEO) |

---

## 🔒 Security Model & Privacy Guarantees

1. **Strict Public Data Minimization**:
   - `phone` and `nidNo` are never selected or serialized by public REST endpoints.
   - `amountPaid` and donation `amount` are masked to `null` on public endpoints unless **both** the record-level flag (`showAmount`) and global system setting (`show_donation_amount`) are explicitly enabled.
2. **Obscure Admin Path + Standard Decoy 404**:
   - The entire administration SPA lives under `VITE_ADMIN_PATH` (8-40 characters, alphanumeric + hyphen, no dictionary words).
   - Visiting `/admin`, `/login`, `/dashboard`, `/wp-admin`, or `/phpmyadmin` immediately returns standard public 404 responses.
   - The admin bundle chunk (`AdminApp-*.js`) is dynamically imported on demand and never loaded by public site visitors.
3. **Authentication & Session Defense**:
   - Passwords hashed with bcrypt (cost factor 12). Minimum 10 characters enforced.
   - JWT stored strictly in `httpOnly`, `Secure`, `SameSite=Lax` cookies with 60-minute inactivity auto-logout.
   - 5 failed attempts within 15 minutes triggers an IP+email lockout in the database.
   - Mandatory password change on first login.
4. **Data Integrity & Auditability**:
   - All primary tables feature soft deletes (`deletedAt`). Deleting an item moves it to the admin Trash bin.
   - Permanent deletion requires `ADMIN` role privileges and typing `DELETE` as confirmation.
   - Every administrative action (`LOGIN`, `CREATE`, `UPDATE`, `DELETE`, `RESTORE`, `EXPORT`) is recorded in `activity_logs` with before/after JSON snapshots, IP, and user-agent.

---

## 🌐 SEO & Social Media Crawlers

- **Dynamic Sitemap**: Automatically generated at `/sitemap.xml`, mapping all static public pages plus live published notices and photo album slugs.
- **Robots Policy**: Automatically generated at `/robots.txt`, instructing search bots to index public content while disallowing `/api/`, the secret admin path, and decoy administrative endpoints.
- **Social Crawler Pre-rendering**: Middleware intercepts requests from crawlers (`facebookexternalhit`, `Facebot`, `Twitterbot`, `WhatsApp`, `TelegramBot`, `LinkedInBot`, `Googlebot`, `bingbot`) and serves pre-rendered HTML with `<meta property="og:...">` tags, customized page titles, descriptions, and feature images for seamless social sharing previews.

---

## 📄 License & Attribution

Developed with reverence for the **Manikpur Central Shahi Eidgah (মানিকপুর কেন্দ্রীয় শাহী ঈদগাহ)** community and Waqf Estate.  
© 1965 – 2026 মানিকপুর কেন্দ্রীয় শাহী ঈদগাহ পরিচালনা কমিটি। সর্বস্বত্ব সংরক্ষিত।

