import jwt from 'jsonwebtoken';
import { prisma } from '../db/prisma.js';
import { ENV } from '../config/env.js';

const INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000; // 60 minutes inactivity auto-logout

/**
 * Authentication Middleware
 * Reads JWT from httpOnly cookie (or Authorization Bearer header fallback)
 */
export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.[ENV.COOKIE_NAME] || req.headers.authorization?.replace(/^Bearer\s+/, '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'অনুগ্রহ করে প্রথমে লগইন করুন। (Authentication required)',
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, ENV.JWT_SECRET);
    } catch (jwtErr) {
      res.clearCookie(ENV.COOKIE_NAME, {
        httpOnly: true,
        secure: ENV.NODE_ENV === 'production',
        sameSite: 'lax',
      });
      return res.status(401).json({
        success: false,
        error: 'আপনার সেশন মেয়াদোত্তীর্ণ হয়েছে। পুনরায় লগইন করুন। (Session expired)',
      });
    }

    // Check inactivity timeout
    const now = Date.now();
    if (decoded.lastActive && now - decoded.lastActive > INACTIVITY_TIMEOUT_MS) {
      res.clearCookie(ENV.COOKIE_NAME, {
        httpOnly: true,
        secure: ENV.NODE_ENV === 'production',
        sameSite: 'lax',
      });
      return res.status(401).json({
        success: false,
        error: '৬০ মিনিট নিষ্ক্রিয় থাকার কারণে সেশন শেষ হয়েছে। অনুগ্রহ করে আবার লগইন করুন। (Session timed out due to inactivity)',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
      },
    });

    if (!user || !user.isActive) {
      res.clearCookie(ENV.COOKIE_NAME, {
        httpOnly: true,
        secure: ENV.NODE_ENV === 'production',
        sameSite: 'lax',
      });
      return res.status(403).json({
        success: false,
        error: 'আপনার অ্যাকাউন্টটি নিষ্ক্রিয় বা মুছে ফেলা হয়েছে। (Account inactive)',
      });
    }

    // If user must change password, allow only password update and logout endpoints
    const isPasswordEndpoint = req.baseUrl.includes('/auth') && (req.path === '/password' || req.path === '/logout');
    if (user.mustChangePassword && !isPasswordEndpoint) {
      return res.status(403).json({
        success: false,
        mustChangePassword: true,
        error: 'প্রথমবার লগইনের পর আপনার পাসওয়ার্ড পরিবর্তন করা বাধ্যতামূলক। (Password change required)',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'অথেনটিকেশন প্রক্রিয়ায় সমস্যা হয়েছে।',
    });
  }
}

/**
 * Role-Based Access Control Middleware
 * @param {...string} allowedRoles - e.g. 'ADMIN', 'EDITOR'
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'অননুমোদিত প্রবেশাধিকার। (Unauthorized)',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'এই কাজটি সম্পন্ন করার অনুমতি শুধুমাত্র অ্যাডমিনের রয়েছে। (Forbidden: Admin role required)',
      });
    }

    next();
  };
}

