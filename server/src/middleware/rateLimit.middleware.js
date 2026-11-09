import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import { prisma } from '../db/prisma.js';
import { ENV } from '../config/env.js';

/**
 * Standard Global API Rate Limiter
 */
export const generalLimiter = rateLimit({
  windowMs: ENV.RATE_LIMIT_WINDOW_MS, // 15 minutes
  max: ENV.RATE_LIMIT_MAX_REQUESTS, // 300 requests per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'অতিরিক্ত রিকোয়েস্ট পাঠানো হয়েছে। অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করুন। (Too many requests, please try again later.)',
  },
});

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
const LOCKOUT_MS = LOCKOUT_MINUTES * 60 * 1000;

/**
 * Generate a unique SHA-256 key for email + IP pair
 */
export function getLoginThrottleKey(email, ip) {
  const normalizedEmail = (email || '').trim().toLowerCase();
  const normalizedIp = (ip || '').trim();
  return crypto.createHash('sha256').update(`${normalizedEmail}|${normalizedIp}`).digest('hex');
}

/**
 * Check if the given login key is currently locked out
 * @param {string} key
 * @returns {Promise<{ isLocked: boolean, remainingMinutes?: number }>}
 */
export async function checkLoginLockout(key) {
  try {
    const record = await prisma.loginAttempt.findUnique({ where: { key } });
    if (!record) {
      return { isLocked: false };
    }

    if (record.lockedUntil && record.lockedUntil > new Date()) {
      const remainingMs = record.lockedUntil.getTime() - Date.now();
      const remainingMinutes = Math.max(1, Math.ceil(remainingMs / (60 * 1000)));
      return { isLocked: true, remainingMinutes };
    }

    return { isLocked: false };
  } catch (err) {
    console.warn('Error checking login lockout:', err.message);
    return { isLocked: false };
  }
}

/**
 * Record a failed login attempt and trigger 15-minute lockout if attempts >= 5
 * @param {string} key
 */
export async function recordFailedLogin(key) {
  try {
    const now = new Date();
    const existing = await prisma.loginAttempt.findUnique({ where: { key } });

    if (!existing) {
      await prisma.loginAttempt.create({
        data: {
          key,
          attempts: 1,
        },
      });
      return;
    }

    // If previous lockout expired, reset attempts count
    if (existing.lockedUntil && existing.lockedUntil < now) {
      await prisma.loginAttempt.update({
        where: { key },
        data: {
          attempts: 1,
          lockedUntil: null,
        },
      });
      return;
    }

    const newAttempts = existing.attempts + 1;
    const shouldLock = newAttempts >= MAX_LOGIN_ATTEMPTS;
    const lockedUntil = shouldLock ? new Date(Date.now() + LOCKOUT_MS) : existing.lockedUntil;

    await prisma.loginAttempt.update({
      where: { key },
      data: {
        attempts: newAttempts,
        lockedUntil,
      },
    });
  } catch (err) {
    console.warn('Error recording failed login:', err.message);
  }
}

/**
 * Clear login attempts upon successful authentication
 * @param {string} key
 */
export async function clearLoginAttempts(key) {
  try {
    await prisma.loginAttempt.deleteMany({ where: { key } });
  } catch (err) {
    console.warn('Error clearing login attempts:', err.message);
  }
}

