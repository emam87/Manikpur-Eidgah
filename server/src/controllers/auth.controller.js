import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import { ENV } from '../config/env.js';
import { logActivity } from '../services/activityLogger.service.js';
import {
  getLoginThrottleKey,
  checkLoginLockout,
  recordFailedLogin,
  clearLoginAttempts,
} from '../middleware/rateLimit.middleware.js';

const LoginSchema = z.object({
  email: z.string().email('সঠিক ইমেইল ঠিকানা প্রদান করুন।'),
  password: z.string().min(1, 'পাসওয়ার্ড প্রদান করা আবশ্যক।'),
});

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'বর্তমান পাসওয়ার্ড প্রদান করুন।'),
  newPassword: z.string().min(10, 'নতুন পাসওয়ার্ড কমপক্ষে ১০ অক্ষরের হতে হবে।'),
  confirmPassword: z.string().min(10, 'পাসওয়ার্ড নিশ্চিতকরণ আবশ্যক।'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'নতুন পাসওয়ার্ড এবং নিশ্চিতকরণ পাসওয়ার্ড একই হতে হবে।',
  path: ['confirmPassword'],
});

/**
 * Handle Admin Login
 */
export async function login(req, res, next) {
  try {
    const validated = LoginSchema.parse(req.body);
    const ip = req.ip || req.socket?.remoteAddress || '127.0.0.1';
    const throttleKey = getLoginThrottleKey(validated.email, ip);

    // 1. Check Rate Limit / Lockout
    const lockout = await checkLoginLockout(throttleKey);
    if (lockout.isLocked) {
      return res.status(429).json({
        success: false,
        error: `অতিরিক্ত ব্যর্থ লগইন প্রচেষ্টার কারণে অ্যাকাউন্টটি সাময়িকভাবে লক করা হয়েছে। অনুগ্রহ করে ${lockout.remainingMinutes} মিনিট পর আবার চেষ্টা করুন।`,
      });
    }

    // 2. Find User
    const user = await prisma.user.findUnique({
      where: { email: validated.email.trim().toLowerCase() },
    });

    // 3. Verify Password & Active status
    const isPasswordValid = user ? await bcrypt.compare(validated.password, user.password) : false;

    if (!user || !isPasswordValid) {
      await recordFailedLogin(throttleKey);
      await logActivity({
        req,
        action: 'FAILED_LOGIN',
        description: `Failed login attempt for email: ${validated.email}`,
      });

      return res.status(401).json({
        success: false,
        error: 'প্রদত্ত ইমেইল বা পাসওয়ার্ড সঠিক নয়। (Invalid credentials)',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: 'আপনার অ্যাকাউন্টটি নিষ্ক্রিয় অবস্থায় রয়েছে। প্রশাসকের সাথে যোগাযোগ করুন।',
      });
    }

    // 4. Clear failed attempts on success
    await clearLoginAttempts(throttleKey);

    // 5. Generate JWT Token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        lastActive: Date.now(),
      },
      ENV.JWT_SECRET,
      { expiresIn: ENV.JWT_EXPIRES_IN }
    );

    // 6. Set Secure httpOnly Cookie
    res.cookie(ENV.COOKIE_NAME, token, {
      httpOnly: true,
      secure: ENV.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // 7. Update Last Login & Record Activity
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await logActivity({
      req,
      userId: user.id,
      action: 'LOGIN',
      description: `User ${user.name} (${user.email}) logged in successfully.`,
      subjectType: 'User',
      subjectId: user.id,
    });

    return res.status(200).json({
      success: true,
      message: 'সফলভাবে লগইন হয়েছে।',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Handle Admin Logout
 */
export async function logout(req, res, next) {
  try {
    if (req.user) {
      await logActivity({
        req,
        userId: req.user.id,
        action: 'LOGOUT',
        description: `User ${req.user.name} logged out.`,
        subjectType: 'User',
        subjectId: req.user.id,
      });
    }

    res.clearCookie(ENV.COOKIE_NAME, {
      httpOnly: true,
      secure: ENV.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return res.status(200).json({
      success: true,
      message: 'সফলভাবে লগআউট হয়েছে।',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get Current Authenticated User Profile
 */
export async function getMe(req, res) {
  return res.status(200).json({
    success: true,
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      mustChangePassword: req.user.mustChangePassword,
    },
  });
}

/**
 * Change Password (Self)
 */
export async function changePassword(req, res, next) {
  try {
    const validated = ChangePasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'ব্যবহারকারী পাওয়া যায়নি।' });
    }

    const isCurrentValid = await bcrypt.compare(validated.currentPassword, user.password);
    if (!isCurrentValid) {
      return res.status(400).json({
        success: false,
        error: 'বর্তমান পাসওয়ার্ড সঠিক নয়।',
      });
    }

    const hashedPassword = await bcrypt.hash(validated.newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        mustChangePassword: false,
      },
    });

    await logActivity({
      req,
      userId: user.id,
      action: 'UPDATED',
      description: `User ${user.name} changed their account password.`,
      subjectType: 'User',
      subjectId: user.id,
    });

    return res.status(200).json({
      success: true,
      message: 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে।',
    });
  } catch (err) {
    next(err);
  }
}

