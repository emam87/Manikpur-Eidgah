import { prisma } from '../db/prisma.js';

/**
 * Health check endpoint: GET /api/health
 * Executes a trivial DB query `SELECT 1` to verify database connection.
 * Used by Render, uptime monitors, and the GitHub Action ping to keep Supabase awake.
 */
export async function healthCheck(req, res) {
  const startTime = Date.now();

  try {
    // Run trivial database query to ensure connection is live
    await prisma.$queryRaw`SELECT 1`;

    const dbLatencyMs = Date.now() - startTime;

    return res.status(200).json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        latencyMs: dbLatencyMs,
      },
      message: 'Manikpur Eidgah API is healthy and operational.',
    });
  } catch (err) {
    console.error('Health Check DB Query Failed:', err.message);

    return res.status(503).json({
      status: 'degraded',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: {
        connected: false,
        error: err.message,
      },
      message: 'Database query failed or database is currently waking up.',
    });
  }
}

