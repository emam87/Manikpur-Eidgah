import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { ENV } from './config/env.js';
import { generalLimiter } from './middleware/rateLimit.middleware.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';

import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import publicRoutes from './routes/public.routes.js';
import adminRoutes from './routes/admin.routes.js';
import seoRoutes from './routes/seo.routes.js';
import { SeoController } from './controllers/seo.controller.js';

export const app = express();

// 1. Trust proxy for accurate IP determination behind Render/Vercel/Cloudflare
app.set('trust proxy', 1);

// 2. Security Headers via Helmet
app.use(
  helmet({
    contentSecurityPolicy: false, // Managed via frontend Vite headers or proxy
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// 3. Strict CORS Allow-List
const allowedOrigins = [
  ENV.CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
  'http://localhost:5000',
  'http://127.0.0.1:5000',
  'http://localhost:5001',
  'http://127.0.0.1:5001',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin) || ENV.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(new Error('CORS access blocked by policy.'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  })
);

// 4. Request Parsers
app.use(cookieParser(ENV.COOKIE_SECRET));
app.use(express.json({ limit: '12mb' }));
app.use(express.urlencoded({ extended: true, limit: '12mb' }));

// 5. Global Rate Limiting
app.use('/api', generalLimiter);

// 6. Static local files for development/testing when R2 is not used
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

// 7. SEO: Sitemap & Robots.txt
app.use(seoRoutes);

// 8. Social Crawler Open Graph Pre-renderer
app.use(SeoController.handleCrawlerMeta);

// 9. Decoy Scanner Routes -> Immediate 404 (Never redirect or give unique error)
const DECOY_REGEX = /^\/(admin|login|dashboard|panel|wp-admin|wp-login\.php|administrator|phpmyadmin|cpanel)($|\/)/i;
app.use((req, res, next) => {
  if (DECOY_REGEX.test(req.path)) {
    return res.status(404).json({
      success: false,
      error: 'Not Found',
    });
  }
  next();
});

// 10. API Routes
app.use('/api', healthRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/admin/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// 11. 404 and Centralized Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

