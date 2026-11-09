# Manikpur Eidgah (মানিকপুর কেন্দ্রীয় শাহী ঈদগাহ) — Production Deployment Guide

This guide walks you through deploying the complete Manikpur Eidgah platform to production across **Vercel** (Frontend SPA), **Render / VPS** (Node.js REST API), **Supabase** (PostgreSQL), and **Cloudflare R2** (S3-compatible Object Storage).

---

## 🏗️ Architecture Overview

```
                                  +------------------------------+
                                  |   Cloudflare R2 Storage      |
                                  |   - Public Bucket (Photos)   |
                                  |   - Private Bucket (Docs)    |
                                  +---------------+--------------+
                                                  ^
                                                  | (S3 Presigned URLs / Uploads)
                                                  |
[ User Browser ] ----------> [ Vercel Edge CDN ] -+
       |                     (React.js SPA)       |
       |                            |             |
       | (Same-origin /api rewrite) |             |
       +--------------------------->|             |
                                    v             v
                           [ Render / VPS API Server ]
                           (Node.js + Express REST API)
                                    |
                                    v
                           [ Supabase PostgreSQL ]
                           (Prisma ORM with Pooling)
```

---

## 1. Database Setup: Supabase PostgreSQL

1. Log in to [Supabase](https://supabase.com) and create a new project:
   - **Name**: `manikpur-eidgah-db`
   - **Database Password**: Generate a secure 32-character password.
   - **Region**: Singapore (`ap-southeast-1`) or nearest to Bangladesh.
2. In the Supabase Dashboard, go to **Project Settings -> Database**:
   - Copy the **Connection Pooling URL** (port `6543`, transaction mode):
     ```env
     DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require"
     ```
   - Copy the **Direct Database URL** (port `5432`, session mode):
     ```env
     DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?sslmode=require"
     ```
3. Test connectivity locally:
   ```bash
   DATABASE_URL="<your-url>" npx prisma db push --schema=server/prisma/schema.prisma
   ```

---

## 2. Storage Setup: Cloudflare R2

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com) and navigate to **R2**.
2. **Create Public Bucket**:
   - Bucket Name: `manikpur-eidgah-public`
   - Under **Settings -> Public Access**, enable **R2.dev subdomain** or connect a custom domain (e.g., `cdn.manikpureidgah.org`).
   - Add CORS policy allowing your frontend domains:
     ```json
     [
       {
         "AllowedOrigins": ["https://manikpureidgah.org", "https://*.vercel.app"],
         "AllowedMethods": ["GET", "HEAD"],
         "AllowedHeaders": ["*"],
         "MaxAgeSeconds": 86400
       }
     ]
     ```
3. **Create Private Bucket**:
   - Bucket Name: `manikpur-eidgah-private`
   - Ensure **Public Access is DISABLED**.
   - This bucket stores confidential legal documents accessible only via short-lived signed URLs.
4. **Create API Token**:
   - Go to **R2 -> Manage R2 API Tokens**.
   - Permission: **Admin Read & Write**.
   - Note down:
     - `Account ID`
     - `Access Key ID`
     - `Secret Access Key`

---

## 3. Backend Deployment: Render.com or Linux VPS

### Option A: Render.com Web Service
1. Create a new **Web Service** on Render and connect your Git repository.
2. Configure settings:
   - **Name**: `manikpur-eidgah-api`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**:
     ```bash
     npm install && npx prisma generate
     ```
   - **Start Command**:
     ```bash
     npm start
     ```
3. Add Environment Variables in the Render dashboard:
   ```env
   NODE_ENV=production
   PORT=10000
   CLIENT_URL=https://manikpureidgah.org
   API_BASE_URL=https://manikpur-eidgah-api.onrender.com/api

   DATABASE_URL=postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require
   DIRECT_URL=postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?sslmode=require

   JWT_SECRET=generate-a-strong-random-64-character-secret
   COOKIE_SECRET=generate-another-strong-random-64-character-secret

   ADMIN_PATH=eidgah-manage-k29x
   ADMIN_BOOTSTRAP_EMAIL=admin@manikpureidgah.org
   ADMIN_BOOTSTRAP_PASSWORD=InitialStrongPassword2026!
   ADMIN_BOOTSTRAP_NAME=প্রধান অ্যাডমিন

   R2_ACCOUNT_ID=your-cloudflare-account-id
   R2_ACCESS_KEY_ID=your-r2-access-key-id
   R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
   R2_PUBLIC_BUCKET_NAME=manikpur-eidgah-public
   R2_PRIVATE_BUCKET_NAME=manikpur-eidgah-private
   R2_PUBLIC_URL=https://cdn.manikpureidgah.org
   ```

### Option B: Self-Hosted Linux VPS (Ubuntu / Debian)
1. Install Node.js 20, Nginx, and PM2:
   ```bash
   sudo apt update && sudo apt install -y curl git nginx
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs
   sudo npm install -g pm2
   ```
2. Clone repository & build:
   ```bash
   cd /var/www
   git clone <repo-url> manikpur-eidgah
   cd manikpur-eidgah
   npm install
   npm run build:client
   cd server && npx prisma generate && npx prisma migrate deploy
   ```
3. Start API with PM2:
   ```bash
   pm2 start src/server.js --name manikpur-api
   pm2 save
   pm2 startup
   ```

---

## 4. Frontend Deployment: Vercel

1. Import the Git repository in [Vercel](https://vercel.com).
2. Configure project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Leave blank or set to `./`
   - **Build Command**: `npm run build:client`
   - **Output Directory**: `client/dist`
3. Add Environment Variables in the Vercel dashboard:
   ```env
   VITE_API_URL=/api
   VITE_ADMIN_PATH=eidgah-manage-k29x
   VITE_SITE_URL=https://manikpureidgah.org
   VITE_R2_PUBLIC_URL=https://cdn.manikpureidgah.org
   ```
4. Verify `vercel.json` rewrites:
   The included [`vercel.json`](./vercel.json) automatically proxies `/api/(.*)`, `/sitemap.xml`, and `/robots.txt` to your backend API domain:
   ```json
   {
     "rewrites": [
       {
         "source": "/sitemap.xml",
         "destination": "https://manikpur-eidgah-api.onrender.com/sitemap.xml"
       },
       {
         "source": "/robots.txt",
         "destination": "https://manikpur-eidgah-api.onrender.com/robots.txt"
       },
       {
         "source": "/api/(.*)",
         "destination": "https://manikpur-eidgah-api.onrender.com/api/$1"
       },
       {
         "source": "/(.*)",
         "destination": "/index.html"
       }
     ]
   }
   ```
   *(Update the destination domain in `vercel.json` to match your deployed backend URL).*

---

## 5. Free-Tier Survival: GitHub Actions Keep-Alive

To prevent the free-tier Supabase database from pausing after 7 days of inactivity:
1. Verify the workflow at [`.github/workflows/keepalive.yml`](./.github/workflows/keepalive.yml).
2. It runs automatically every 3 days via cron schedule (`0 0 */3 * *`) and triggers:
   ```bash
   curl -f -s https://manikpur-eidgah-api.onrender.com/api/health
   ```
3. The `/api/health` endpoint executes a lightweight query (`SELECT 1`) on PostgreSQL and returns database latency, keeping the connection alive.
4. Add your production backend URL to GitHub Repository Secrets as `HEALTH_CHECK_URL` (or update directly in the YAML).

---

## 6. First-Time Production Seeding & Data Import

Once backend and database are online, run the initial seed and migration import:

```bash
# In your server environment (or locally connected to production DATABASE_URL):
cd server

# 1. Apply database migrations
npx prisma migrate deploy

# 2. Seed initial site settings and 7 committee coordinators
node src/scripts/seed.js

# 3. Import authentic legacy data (members, donors, documents, land maps, albums)
node src/scripts/importLegacyData.js

# 4. Verify admin panel secret path
node src/scripts/printAdminPath.js
```

---

## 7. Post-Deployment Verification Checklist

- [ ] **Health Endpoint**: `GET https://<api-domain>/api/health` returns `{"status":"ok","database":{"status":"connected"}}`.
- [ ] **Decoy 404s**: Visiting `/admin`, `/login`, `/dashboard`, `/wp-admin` on your frontend returns the 404 page.
- [ ] **Secret Admin Route**: Visiting `https://<site-domain>/<VITE_ADMIN_PATH>` loads the administrator login screen.
- [ ] **Public Privacy**: Confirming `GET /api/public/members` returns members without `phone` or `nidNo`.
- [ ] **Sitemap & Robots**:
  - `GET https://<site-domain>/sitemap.xml` returns valid XML schema.
  - `GET https://<site-domain>/robots.txt` disallows `/api/` and the secret admin path.
- [ ] **Social Media OG Preview**: Testing a notice or album URL on [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) shows proper title, description, and preview image.
