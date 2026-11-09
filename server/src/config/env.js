import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server directory or root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:5000/api',

  // Database
  DATABASE_URL: process.env.DATABASE_URL || '',
  DIRECT_URL: process.env.DIRECT_URL || process.env.DATABASE_URL || '',

  // Auth & Cookies
  JWT_SECRET: process.env.JWT_SECRET || 'dev-fallback-secret-at-least-32-chars-long!',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  COOKIE_SECRET: process.env.COOKIE_SECRET || 'dev-cookie-secret-key-32-chars!',
  COOKIE_NAME: 'eidgah_auth_token',

  // Admin Security
  ADMIN_PATH: process.env.ADMIN_PATH || process.env.VITE_ADMIN_PATH || 'eidgah-manage-k29x',
  ADMIN_BOOTSTRAP_EMAIL: process.env.ADMIN_BOOTSTRAP_EMAIL || 'admin@manikpureidgah.org',
  ADMIN_BOOTSTRAP_PASSWORD: process.env.ADMIN_BOOTSTRAP_PASSWORD || '',
  ADMIN_BOOTSTRAP_NAME: process.env.ADMIN_BOOTSTRAP_NAME || 'Manikpur Eidgah Admin',

  // Cloudflare R2 Storage (S3 API compatible)
  R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID || '',
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID || '',
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY || '',
  R2_PUBLIC_BUCKET_NAME: process.env.R2_PUBLIC_BUCKET_NAME || 'manikpur-eidgah-public',
  R2_PRIVATE_BUCKET_NAME: process.env.R2_PRIVATE_BUCKET_NAME || 'manikpur-eidgah-private',
  R2_PUBLIC_URL: (process.env.R2_PUBLIC_URL || '').replace(/\/$/, ''),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 mins
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '300', 10),
};

