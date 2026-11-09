import { prisma } from '../db/prisma.js';

/**
 * Record an entry into the activity_logs table.
 *
 * @param {object} options
 * @param {object} [options.req] - Express request object (to extract IP & user-agent)
 * @param {number|null} [options.userId] - User ID who executed the action
 * @param {string} options.action - 'LOGIN' | 'LOGOUT' | 'CREATED' | 'UPDATED' | 'DELETED' | 'RESTORED' | 'ARCHIVED' | 'EXPORT' | 'IMPORTED'
 * @param {string} options.description - Human-readable summary
 * @param {string} [options.subjectType] - Model name (e.g. 'Member', 'Donor')
 * @param {number} [options.subjectId] - Record ID
 * @param {object} [options.properties] - Additional before/after diff or metadata
 */
export async function logActivity({
  req = null,
  userId = null,
  action,
  description,
  subjectType = null,
  subjectId = null,
  properties = null,
}) {
  try {
    const finalUserId = userId || req?.user?.id || null;
    const ip = req?.ip || req?.headers?.['x-forwarded-for'] || req?.socket?.remoteAddress || null;
    const userAgent = req?.headers?.['user-agent'] ? req.headers['user-agent'].substring(0, 250) : null;

    return await prisma.activityLog.create({
      data: {
        userId: finalUserId,
        action: action.toUpperCase(),
        description,
        subjectType,
        subjectId: subjectId ? parseInt(subjectId, 10) : null,
        properties: properties ? JSON.parse(JSON.stringify(properties)) : undefined,
        ipAddress: typeof ip === 'string' ? ip.split(',')[0].trim().substring(0, 45) : null,
        userAgent,
      },
    });
  } catch (err) {
    // Activity logging should never throw or break the primary request
    console.warn('Failed to record activity log:', err.message);
    return null;
  }
}

