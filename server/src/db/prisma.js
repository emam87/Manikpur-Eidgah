import { PrismaClient } from '@prisma/client';
import { ENV } from '../config/env.js';

const globalForPrisma = globalThis;

/**
 * Initialize PrismaClient with Soft-Delete Extension
 * Soft-deleted models: Member, Donor, CommitteeMember, Album, Photo, LandMap, Document, Notice, Design
 */
export const prisma = globalForPrisma.prisma || new PrismaClient({
  datasources: {
    db: {
      url: ENV.DATABASE_URL || 'file:./dev.db',
    },
  },
  log: ENV.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

if (ENV.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export const SOFT_DELETED_MODELS = [
  'member',
  'donor',
  'committeeMember',
  'album',
  'photo',
  'landMap',
  'document',
  'notice',
  'design',
];

/**
 * Helper to perform soft delete on a model record
 * @param {string} modelName
 * @param {number} id
 * @returns {Promise<object>}
 */
export async function softDelete(modelName, id) {
  if (!prisma[modelName]) {
    throw new Error(`Model ${modelName} does not exist on Prisma Client.`);
  }

  return prisma[modelName].update({
    where: { id: parseInt(id, 10) },
    data: { deletedAt: new Date() },
  });
}

/**
 * Helper to restore a soft-deleted record
 * @param {string} modelName
 * @param {number} id
 * @returns {Promise<object>}
 */
export async function restoreRecord(modelName, id) {
  if (!prisma[modelName]) {
    throw new Error(`Model ${modelName} does not exist on Prisma Client.`);
  }

  return prisma[modelName].update({
    where: { id: parseInt(id, 10) },
    data: { deletedAt: null },
  });
}

/**
 * Helper to permanently delete a record (ADMIN only)
 * @param {string} modelName
 * @param {number} id
 * @returns {Promise<object>}
 */
export async function forceDeleteRecord(modelName, id) {
  if (!prisma[modelName]) {
    throw new Error(`Model ${modelName} does not exist on Prisma Client.`);
  }

  return prisma[modelName].delete({
    where: { id: parseInt(id, 10) },
  });
}

