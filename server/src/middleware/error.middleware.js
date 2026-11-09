import { ZodError } from 'zod';
import { ENV } from '../config/env.js';

/**
 * Handle 404 for undefined routes
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: 'অনুরোধকৃত রিসোর্সটি পাওয়া যায়নি। (404 Not Found)',
  });
}

/**
 * Centralized Global Error Handler
 */
export function errorHandler(err, req, res, next) {
  // If headers already sent, delegate to default express handler
  if (res.headersSent) {
    return next(err);
  }

  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    const formattedErrors = {};
    for (const issue of err.issues) {
      const field = issue.path.join('.');
      formattedErrors[field] = issue.message;
    }

    return res.status(422).json({
      success: false,
      error: 'প্রদত্ত তথ্যে ভুল রয়েছে। অনুগ্রহ করে সংশোধন করুন।',
      errors: formattedErrors,
    });
  }

  // Handle Multer Errors (e.g. file size exceeded)
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        error: 'ফাইলের আকার ১২ মেগাবাইটের বেশি হতে পারবে না। (File too large: max 12MB)',
      });
    }
    return res.status(400).json({
      success: false,
      error: `ফাইল আপলোডে ত্রুটি: ${err.message}`,
    });
  }

  // General server error
  console.error('Unhandled Application Error:', err);

  const statusCode = err.status || err.statusCode || 500;
  const message = statusCode === 500 && ENV.NODE_ENV === 'production'
    ? 'সার্ভারে অভ্যন্তরীণ ত্রুটি ঘটেছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।'
    : err.message || 'Server error occurred.';

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(ENV.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}

