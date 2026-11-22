import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { Parser } from 'json2csv';
import archiver from 'archiver';
import { prisma } from '../db/prisma.js';
import { ENV } from '../config/env.js';
import { logActivity } from '../services/activityLogger.service.js';
import { SettingsService } from '../services/settings.service.js';
import { processAndUploadImage, deleteImageAssets } from '../services/image.service.js';
import { computeAreaInDecimal, DEFAULT_UNIT_CONVERSION } from '../utils/landUnit.js';
import { validateGeoJsonPolygon } from '../utils/mapHelpers.js';
import { 
  uploadPublicFile, uploadPrivateFile, getPrivateSignedDownloadUrl, 
  deletePublicFile, deletePrivateFile, getStorageUsage, archiveAllMediaFiles 
} from '../services/r2.service.js';

function isBundledAsset(filePath) {
  if (!filePath || typeof filePath !== 'string') return true;
  return (
    filePath.startsWith('/designs/') ||
    filePath.startsWith('defaults/') ||
    filePath.startsWith('/defaults/') ||
    filePath.startsWith('http://') ||
    filePath.startsWith('https://')
  );
}

function deriveThumbPath(filePath) {
  if (!filePath || typeof filePath !== 'string') return null;
  if (filePath.endsWith('.webp') && !filePath.endsWith('_thumb.webp')) {
    return filePath.replace(/\.webp$/, '_thumb.webp');
  }
  return null;
}

async function cleanupPublicMedia(filePath, explicitThumbPath = null) {
  const mainPath = isBundledAsset(filePath) ? null : filePath;
  const thumbPath =
    explicitThumbPath && !isBundledAsset(explicitThumbPath)
      ? explicitThumbPath
      : mainPath
      ? deriveThumbPath(mainPath)
      : null;
  await deleteImageAssets(mainPath, thumbPath);
}

const ENTITY_DELETE_CONFIG = {
  Member: {
    prismaKey: 'member',
    subjectType: 'Member',
    notFound: 'সদস্য পাওয়া যায়নি।',
    afterFiles: (record) => cleanupPublicMedia(record.photoPath),
  },
  Donor: {
    prismaKey: 'donor',
    subjectType: 'Donor',
    notFound: 'অনুদানকারী পাওয়া যায়নি।',
  },
  LandDonor: {
    prismaKey: 'landDonor',
    subjectType: 'LandDonor',
    notFound: 'জমিদাতা রেকর্ড পাওয়া যায়নি।',
    afterFiles: (record) => cleanupPublicMedia(record.photoPath),
  },
  CommitteeMember: {
    prismaKey: 'committeeMember',
    subjectType: 'CommitteeMember',
    notFound: 'সদস্য পাওয়া যায়নি।',
    beforeTx: (tx, id) =>
      tx.committeeMember.updateMany({ where: { parentId: id }, data: { parentId: null } }),
    afterFiles: (record) => cleanupPublicMedia(record.photoPath),
  },
  Album: {
    prismaKey: 'album',
    subjectType: 'Album',
    notFound: 'অ্যালবাম পাওয়া যায়নি।',
    include: { photos: { select: { path: true, thumbPath: true } } },
    beforeTx: (tx, id) =>
      tx.album.update({ where: { id }, data: { coverPhotoId: null } }),
    afterFiles: (record) =>
      Promise.all((record.photos || []).map((p) => cleanupPublicMedia(p.path, p.thumbPath))),
  },
  Photo: {
    prismaKey: 'photo',
    subjectType: 'Photo',
    notFound: 'ছবি পাওয়া যায়নি।',
    beforeTx: (tx, id) =>
      tx.album.updateMany({ where: { coverPhotoId: id }, data: { coverPhotoId: null } }),
    afterFiles: (record) => cleanupPublicMedia(record.path, record.thumbPath),
  },
  Document: {
    prismaKey: 'document',
    subjectType: 'Document',
    notFound: 'দলিল পাওয়া যায়নি।',
    afterFiles: (record) =>
      record.filePath ? deletePrivateFile(record.filePath) : Promise.resolve(),
  },
  LandMap: {
    prismaKey: 'landMap',
    subjectType: 'LandMap',
    notFound: 'নকশা পাওয়া যায়নি।',
    beforeTx: (tx, id) =>
      tx.landDonor.updateMany({ where: { relatedLandMapId: id }, data: { relatedLandMapId: null } }),
    afterFiles: (record) => cleanupPublicMedia(record.filePath, record.thumbPath),
  },
  Notice: {
    prismaKey: 'notice',
    subjectType: 'Notice',
    notFound: 'নোটিশ পাওয়া যায়নি।',
    afterFiles: (record) =>
      record.attachmentPath && !isBundledAsset(record.attachmentPath)
        ? deletePublicFile(record.attachmentPath)
        : Promise.resolve(),
  },
  Design: {
    prismaKey: 'design',
    subjectType: 'Design',
    notFound: 'নকশা পাওয়া যায়নি।',
    afterFiles: (record) => cleanupPublicMedia(record.path, record.thumbPath),
  },
  MapPlace: {
    prismaKey: 'mapPlace',
    subjectType: 'MapPlace',
    notFound: 'মানচিত্রের স্থান পাওয়া যায়নি।',
    afterFiles: (record) => cleanupPublicMedia(record.photoKey),
  },
  RouteGuide: {
    prismaKey: 'routeGuide',
    subjectType: 'RouteGuide',
    notFound: 'পথ নির্দেশনা পাওয়া যায়নি।',
  },
};

/**
 * Permanently deletes an entity from PostgreSQL, clears dependent FK links,
 * removes uploaded storage assets, and writes an activity log entry.
 */
async function permanentlyDeleteEntity({ type, id, req, getDescription, action = 'DELETED' }) {
  const cfg = ENTITY_DELETE_CONFIG[type];
  if (!cfg) return { invalidType: true };

  const numericId = parseInt(id, 10);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return { notFound: true, notFoundMessage: cfg.notFound };
  }

  const existing = await prisma[cfg.prismaKey].findUnique({
    where: { id: numericId },
    ...(cfg.include ? { include: cfg.include } : {}),
  });
  if (!existing) {
    return { notFound: true, notFoundMessage: cfg.notFound };
  }

  await prisma.$transaction(async (tx) => {
    if (cfg.beforeTx) {
      await cfg.beforeTx(tx, numericId);
    }
    await tx[cfg.prismaKey].delete({ where: { id: numericId } });
  });

  if (cfg.afterFiles) {
    await cfg.afterFiles(existing);
  }

  await logActivity({
    req,
    action,
    subjectType: cfg.subjectType,
    subjectId: numericId,
    description: getDescription ? getDescription(existing, numericId) : `'${cfg.subjectType} #${numericId}' ডাটাবেজ থেকে স্থায়ীভাবে মুছে ফেলা হয়েছে।`,
  });

  return { deleted: existing };
}

// ==============================================================================
// 1. DASHBOARD & ANALYTICS
// ==============================================================================
export async function getDashboardStats(req, res, next) {
  try {
    const [
      membersCount,
      donorsCount,
      committeeCount,
      albumsCount,
      photosCount,
      documentsCount,
      noticesCount,
      landMapsCount,
      designsCount,
      landDonorsCount,
      trashCount,
      totalDonorsSum,
      totalMembersSum,
      totalLandSum,
      donorsByPurpose,
      membersByYear,
      landByYear,
      landByUsage,
      recentActivity,
    ] = await Promise.all([
      prisma.member.count({ where: { deletedAt: null } }),
      prisma.donor.count({ where: { deletedAt: null } }),
      prisma.committeeMember.count({ where: { deletedAt: null, isCurrent: true } }),
      prisma.album.count({ where: { deletedAt: null } }),
      prisma.photo.count({ where: { deletedAt: null } }),
      prisma.document.count({ where: { deletedAt: null } }),
      prisma.notice.count({ where: { deletedAt: null } }),
      prisma.landMap.count({ where: { deletedAt: null } }),
      prisma.design.count({ where: { deletedAt: null } }),
      prisma.landDonor.count({ where: { deletedAt: null } }),
      // Count total trash items
      Promise.all([
        prisma.member.count({ where: { deletedAt: { not: null } } }),
        prisma.donor.count({ where: { deletedAt: { not: null } } }),
        prisma.committeeMember.count({ where: { deletedAt: { not: null } } }),
        prisma.album.count({ where: { deletedAt: { not: null } } }),
        prisma.photo.count({ where: { deletedAt: { not: null } } }),
        prisma.document.count({ where: { deletedAt: { not: null } } }),
        prisma.notice.count({ where: { deletedAt: { not: null } } }),
        prisma.landMap.count({ where: { deletedAt: { not: null } } }),
        prisma.design.count({ where: { deletedAt: { not: null } } }),
        prisma.landDonor.count({ where: { deletedAt: { not: null } } }),
      ]).then((counts) => counts.reduce((a, b) => a + b, 0)),
      prisma.donor.aggregate({
        where: { deletedAt: null },
        _sum: { amount: true },
      }),
      prisma.member.aggregate({
        where: { deletedAt: null },
        _sum: { amountPaid: true },
      }),
      prisma.landDonor.aggregate({
        where: { deletedAt: null },
        _sum: { areaInDecimal: true },
      }),
      // Monetary donations by purpose (archived)
      prisma.donor.groupBy({
        by: ['purpose'],
        where: { deletedAt: null },
        _sum: { amount: true },
        _count: true,
      }),
      // Members joined by year
      prisma.member.groupBy({
        by: ['memberSince'],
        where: { deletedAt: null, memberSince: { not: null } },
        _count: true,
        orderBy: { memberSince: 'asc' },
      }),
      // Land donated by year
      prisma.landDonor.groupBy({
        by: ['donationYear'],
        where: { deletedAt: null },
        _sum: { areaInDecimal: true },
        _count: true,
        orderBy: { donationYear: 'asc' },
      }),
      // Land donated by usage
      prisma.landDonor.groupBy({
        by: ['landUse'],
        where: { deletedAt: null },
        _sum: { areaInDecimal: true },
        _count: true,
      }),
      // Recent activities
      prisma.activityLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { user: { select: { name: true, email: true, role: true } } },
      }),
    ]);

    const totalFunds = (totalDonorsSum._sum.amount || 0) + (totalMembersSum._sum.amountPaid || 0);

    const missingTranslationsCount = await Promise.all([
      prisma.member.count({ where: { deletedAt: null, OR: [{ nameEn: null }, { nameEn: '' }, { nameBn: '' }] } }).catch(() => 0),
      prisma.landDonor.count({ where: { deletedAt: null, OR: [{ nameEn: null }, { nameEn: '' }, { nameBn: '' }] } }).catch(() => 0),
      prisma.committeeMember.count({ where: { deletedAt: null, isCurrent: true, OR: [{ nameEn: null }, { nameEn: '' }, { designationEn: null }, { designationEn: '' }] } }).catch(() => 0),
      prisma.album.count({ where: { deletedAt: null, OR: [{ titleEn: null }, { titleEn: '' }] } }).catch(() => 0),
      prisma.notice.count({ where: { deletedAt: null, OR: [{ titleEn: null }, { titleEn: '' }] } }).catch(() => 0),
    ]).then(counts => counts.reduce((a, b) => a + b, 0)).catch(() => 0);

    const storageStats = await getStorageUsage().catch(() => ({ totalBytes: 0, totalFiles: 0, isR2: false }));

    return res.status(200).json({
      success: true,
      storage: {
        ...storageStats,
        isProduction: ENV.NODE_ENV === 'production',
      },
      stats: {
        membersCount,
        donorsCount,
        committeeCount,
        albumsCount,
        photosCount,
        documentsCount,
        noticesCount,
        landMapsCount,
        designsCount,
        landDonorsCount,
        trashCount,
        missingTranslationsCount,
        totalDonations: totalDonorsSum._sum.amount || 0,
        totalMemberContributions: totalMembersSum._sum.amountPaid || 0,
        totalFunds,
        totalLandInDecimal: totalLandSum._sum.areaInDecimal || 0,
      },
      charts: {
        donorsByPurpose: donorsByPurpose.map((d) => ({
          purpose: d.purpose,
          totalAmount: d._sum.amount || 0,
          count: d._count,
        })),
        membersByYear: membersByYear.map((m) => ({
          year: m.memberSince,
          count: m._count,
        })),
        landByYear: landByYear.map((l) => ({
          year: l.donationYear,
          totalArea: l._sum.areaInDecimal || 0,
          count: l._count,
        })),
        landByUsage: landByUsage.map((u) => ({
          landUse: u.landUse,
          totalArea: u._sum.areaInDecimal || 0,
          count: u._count,
        })),
      },
      recentActivity,
    });
  } catch (err) {
    next(err);
  }
}

// ==============================================================================
// 2. LIFETIME MEMBERS MANAGEMENT
// ==============================================================================
export async function getMembers(req, res, next) {
  try {
    const q = (req.query.q || '').trim();
    const year = req.query.year ? parseInt(req.query.year, 10) : null;
    const sort = req.query.sort || 'membershipNo';
    const order = req.query.order === 'desc' ? 'desc' : 'asc';
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '15', 10)));
    const skip = (page - 1) * limit;

    const where = { deletedAt: null };

    if (year && !isNaN(year)) where.memberSince = year;
    if (q) {
      where.OR = [
        { membershipNo: { contains: q, mode: 'insensitive' } },
        { nameBn: { contains: q, mode: 'insensitive' } },
        { nameEn: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
        { nidNo: { contains: q, mode: 'insensitive' } },
        { addressBn: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, members] = await Promise.all([
      prisma.member.count({ where }),
      prisma.member.findMany({
        where,
        orderBy: { [sort]: order },
        skip,
        take: limit,
      }),
    ]);

    return res.status(200).json({
      success: true,
      members,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function createMember(req, res, next) {
  try {
    const body = req.body;

    if (!body.nameBn || !body.nameBn.trim()) {
      return res.status(400).json({ success: false, code: 'REQUIRED_FIELD_BN', error: 'সদস্যের বাংলা নাম আবশ্যক' });
    }
    if (!body.nameEn || !body.nameEn.trim()) {
      return res.status(400).json({ success: false, code: 'REQUIRED_FIELD_EN', error: 'Member English name is required' });
    }

    let photoPath = body.photoPath || null;

    if (req.file) {
      const processed = await processAndUploadImage({
        buffer: req.file.buffer,
        directory: 'members',
        maxWidth: 800,
        maxHeight: 1000,
      });
      photoPath = processed.path;
    }

    const trimmedMembershipNo = body.membershipNo ? body.membershipNo.trim() : '';
    const membershipNo = trimmedMembershipNo || `LM-${Date.now().toString().slice(-6)}`;

    const member = await prisma.member.create({
      data: {
        membershipNo,
        nameBn: body.nameBn.trim(),
        nameEn: body.nameEn ? body.nameEn.trim() : null,
        fatherNameBn: body.fatherNameBn ? body.fatherNameBn.trim() : null,
        fatherNameEn: body.fatherNameEn ? body.fatherNameEn.trim() : null,
        phone: body.phone ? body.phone.trim() : null,
        nidNo: body.nidNo ? body.nidNo.trim() : null,
        addressBn: body.addressBn ? body.addressBn.trim() : null,
        addressEn: body.addressEn ? body.addressEn.trim() : null,
        photoPath,
        memberSince: body.memberSince ? parseInt(body.memberSince, 10) : null,
        amountPaid: body.amountPaid ? parseFloat(body.amountPaid) : null,
        showAmount: body.showAmount === true || body.showAmount === 'true' || body.showAmount === '1',
        sortOrder: body.sortOrder ? parseInt(body.sortOrder, 10) : 0,
        isActive: body.isActive !== false && body.isActive !== 'false',
      },
    });

    await logActivity({
      req,
      action: 'CREATED',
      subjectType: 'Member',
      subjectId: member.id,
      description: `নতুন আজীবন সদস্য '${member.nameBn}' (সদস্য নং: ${member.membershipNo || 'নেই'}) তৈরি করা হয়েছে।`,
    });

    return res.status(201).json({ success: true, member });
  } catch (err) {
    next(err);
  }
}

export async function updateMember(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const body = req.body;

    const existing = await prisma.member.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, error: 'সদস্য পাওয়া যায়নি।' });

    let photoPath = existing.photoPath;
    if (req.file) {
      const processed = await processAndUploadImage({
        buffer: req.file.buffer,
        directory: 'members',
        maxWidth: 800,
        maxHeight: 1000,
      });
      photoPath = processed.path;
    } else if (body.removePhoto === 'true' || body.removePhoto === true) {
      photoPath = null;
    }

    const updated = await prisma.member.update({
      where: { id },
      data: {
        membershipNo: body.membershipNo !== undefined ? (body.membershipNo ? body.membershipNo.trim() : null) : undefined,
        nameBn: body.nameBn ? body.nameBn.trim() : undefined,
        nameEn: body.nameEn !== undefined ? (body.nameEn ? body.nameEn.trim() : null) : undefined,
        fatherNameBn: body.fatherNameBn !== undefined ? (body.fatherNameBn ? body.fatherNameBn.trim() : null) : undefined,
        fatherNameEn: body.fatherNameEn !== undefined ? (body.fatherNameEn ? body.fatherNameEn.trim() : null) : undefined,
        phone: body.phone !== undefined ? (body.phone ? body.phone.trim() : null) : undefined,
        nidNo: body.nidNo !== undefined ? (body.nidNo ? body.nidNo.trim() : null) : undefined,
        addressBn: body.addressBn !== undefined ? (body.addressBn ? body.addressBn.trim() : null) : undefined,
        addressEn: body.addressEn !== undefined ? (body.addressEn ? body.addressEn.trim() : null) : undefined,
        photoPath,
        memberSince: body.memberSince !== undefined ? (body.memberSince ? parseInt(body.memberSince, 10) : null) : undefined,
        amountPaid: body.amountPaid !== undefined ? (body.amountPaid ? parseFloat(body.amountPaid) : null) : undefined,
        showAmount: body.showAmount !== undefined ? (body.showAmount === true || body.showAmount === 'true' || body.showAmount === '1') : undefined,
        sortOrder: body.sortOrder !== undefined ? parseInt(body.sortOrder, 10) : undefined,
        isActive: body.isActive !== undefined ? (body.isActive !== false && body.isActive !== 'false') : undefined,
      },
    });

    await logActivity({
      req,
      action: 'UPDATED',
      subjectType: 'Member',
      subjectId: id,
      description: `আজীবন সদস্য '${updated.nameBn}' আপডেট করা হয়েছে।`,
    });

    return res.status(200).json({ success: true, member: updated });
  } catch (err) {
    next(err);
  }
}

export async function deleteMember(req, res, next) {
  try {
    const result = await permanentlyDeleteEntity({
      type: 'Member',
      id: req.params.id,
      req,
      getDescription: (existing) => `আজীবন সদস্য '${existing.nameBn}' ডাটাবেজ থেকে স্থায়ীভাবে মুছে ফেলা হয়েছে।`,
    });
    if (result.notFound) {
      return res.status(404).json({ success: false, error: result.notFoundMessage });
    }

    return res.status(200).json({ success: true, message: 'সদস্য ডাটাবেজ থেকে স্থায়ীভাবে মুছে ফেলা হয়েছে।' });
  } catch (err) {
    next(err);
  }
}

export async function importMembers(req, res, next) {
  try {
    const { members } = req.body;
    if (!Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ success: false, error: 'সদস্যদের বৈধ তালিকা প্রদান করুন।' });
    }

    let inserted = 0;
    for (const m of members) {
      if (!m.nameBn) continue;
      await prisma.member.create({
        data: {
          membershipNo: m.membershipNo ? String(m.membershipNo).trim() : null,
          nameBn: String(m.nameBn).trim(),
          nameEn: m.nameEn ? String(m.nameEn).trim() : null,
          fatherNameBn: m.fatherNameBn ? String(m.fatherNameBn).trim() : null,
          phone: m.phone ? String(m.phone).trim() : null,
          nidNo: m.nidNo ? String(m.nidNo).trim() : null,
          addressBn: m.addressBn ? String(m.addressBn).trim() : null,
          memberSince: m.memberSince ? parseInt(m.memberSince, 10) : null,
          amountPaid: m.amountPaid ? parseFloat(m.amountPaid) : null,
          showAmount: m.showAmount === true || m.showAmount === 'true' || m.showAmount === '1',
          isActive: true,
        },
      });
      inserted++;
    }

    await logActivity({
      req,
      action: 'IMPORTED',
      subjectType: 'Member',
      description: `CSV ইম্পোর্টের মাধ্যমে ${inserted} জন আজীবন সদস্য যোগ করা হয়েছে।`,
    });

    return res.status(200).json({ success: true, count: inserted });
  } catch (err) {
    next(err);
  }
}

// ==============================================================================
// 3. DONORS LEDGER MANAGEMENT
// ==============================================================================
export async function getDonors(req, res, next) {
  try {
    const q = (req.query.q || '').trim();
    const purpose = (req.query.purpose || '').trim();
    const year = req.query.year ? parseInt(req.query.year, 10) : null;
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '15', 10)));
    const skip = (page - 1) * limit;

    const where = { deletedAt: null };
    if (purpose) where.purpose = purpose;
    if (year && !isNaN(year)) {
      where.donationDate = {
        gte: new Date(`${year}-01-01T00:00:00.000Z`),
        lte: new Date(`${year}-12-31T23:59:59.999Z`),
      };
    }
    if (q) {
      where.OR = [
        { donorNameBn: { contains: q, mode: 'insensitive' } },
        { donorNameEn: { contains: q, mode: 'insensitive' } },
        { receiptNo: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
        { addressBn: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, donors, sumAggregate] = await Promise.all([
      prisma.donor.count({ where }),
      prisma.donor.findMany({
        where,
        orderBy: [{ donationDate: 'desc' }, { id: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.donor.aggregate({
        where,
        _sum: { amount: true },
      }),
    ]);

    return res.status(200).json({
      success: true,
      donors,
      totalAmount: sumAggregate._sum.amount || 0,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function createDonor(req, res, next) {
  try {
    const body = req.body;
    const donor = await prisma.donor.create({
      data: {
        donorNameBn: body.donorNameBn.trim(),
        donorNameEn: body.donorNameEn ? body.donorNameEn.trim() : null,
        phone: body.phone ? body.phone.trim() : null,
        addressBn: body.addressBn ? body.addressBn.trim() : null,
        addressEn: body.addressEn ? body.addressEn.trim() : null,
        amount: parseFloat(body.amount),
        donationDate: body.donationDate ? new Date(body.donationDate) : new Date(),
        purpose: body.purpose || 'GENERAL',
        receiptNo: body.receiptNo ? body.receiptNo.trim() : null,
        showAmount: body.showAmount === true || body.showAmount === 'true' || body.showAmount === '1',
        noteBn: body.noteBn ? body.noteBn.trim() : null,
        noteEn: body.noteEn ? body.noteEn.trim() : null,
      },
    });

    await logActivity({
      req,
      action: 'CREATED',
      subjectType: 'Donor',
      subjectId: donor.id,
      description: `নতুন অনুদান যোগ করা হয়েছে: '${donor.donorNameBn}' (${donor.amount} ৳)।`,
    });

    return res.status(201).json({ success: true, donor });
  } catch (err) {
    next(err);
  }
}

export async function updateDonor(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const body = req.body;

    const updated = await prisma.donor.update({
      where: { id },
      data: {
        donorNameBn: body.donorNameBn ? body.donorNameBn.trim() : undefined,
        donorNameEn: body.donorNameEn !== undefined ? (body.donorNameEn ? body.donorNameEn.trim() : null) : undefined,
        phone: body.phone !== undefined ? (body.phone ? body.phone.trim() : null) : undefined,
        addressBn: body.addressBn !== undefined ? (body.addressBn ? body.addressBn.trim() : null) : undefined,
        addressEn: body.addressEn !== undefined ? (body.addressEn ? body.addressEn.trim() : null) : undefined,
        amount: body.amount ? parseFloat(body.amount) : undefined,
        donationDate: body.donationDate ? new Date(body.donationDate) : undefined,
        purpose: body.purpose || undefined,
        receiptNo: body.receiptNo !== undefined ? (body.receiptNo ? body.receiptNo.trim() : null) : undefined,
        showAmount: body.showAmount !== undefined ? (body.showAmount === true || body.showAmount === 'true' || body.showAmount === '1') : undefined,
        noteBn: body.noteBn !== undefined ? (body.noteBn ? body.noteBn.trim() : null) : undefined,
        noteEn: body.noteEn !== undefined ? (body.noteEn ? body.noteEn.trim() : null) : undefined,
      },
    });

    await logActivity({
      req,
      action: 'UPDATED',
      subjectType: 'Donor',
      subjectId: id,
      description: `অনুদান রেকর্ড আপডেট করা হয়েছে: '${updated.donorNameBn}'।`,
    });

    return res.status(200).json({ success: true, donor: updated });
  } catch (err) {
    next(err);
  }
}

export async function deleteDonor(req, res, next) {
  try {
    const result = await permanentlyDeleteEntity({
      type: 'Donor',
      id: req.params.id,
      req,
      getDescription: (existing) => `অনুদান রেকর্ড '${existing.donorNameBn}' ডাটাবেজ থেকে স্থায়ীভাবে মুছে ফেলা হয়েছে।`,
    });
    if (result.notFound) {
      return res.status(404).json({ success: false, error: result.notFoundMessage });
    }

    return res.status(200).json({ success: true, message: 'অনুদান রেকর্ড ডাটাবেজ থেকে স্থায়ীভাবে মুছে ফেলা হয়েছে।' });
  } catch (err) {
    next(err);
  }
}

export async function importDonors(req, res, next) {
  try {
    const { donors } = req.body;
    if (!Array.isArray(donors) || donors.length === 0) {
      return res.status(400).json({ success: false, error: 'অনুদানকারীদের বৈধ তালিকা প্রদান করুন।' });
    }

    let inserted = 0;
    for (const d of donors) {
      if (!d.donorNameBn || !d.amount) continue;
      await prisma.donor.create({
        data: {
          donorNameBn: String(d.donorNameBn).trim(),
          donorNameEn: d.donorNameEn ? String(d.donorNameEn).trim() : null,
          phone: d.phone ? String(d.phone).trim() : null,
          addressBn: d.addressBn ? String(d.addressBn).trim() : null,
          amount: parseFloat(d.amount),
          donationDate: d.donationDate ? new Date(d.donationDate) : new Date(),
          purpose: d.purpose || 'GENERAL',
          receiptNo: d.receiptNo ? String(d.receiptNo).trim() : null,
          showAmount: d.showAmount === true || d.showAmount === 'true' || d.showAmount === '1',
          noteBn: d.noteBn ? String(d.noteBn).trim() : null,
        },
      });
      inserted++;
    }

    await logActivity({
      req,
      action: 'IMPORTED',
      subjectType: 'Donor',
      description: `CSV ইম্পোর্টের মাধ্যমে ${inserted} টি অনুদান রেকর্ড যোগ করা হয়েছে।`,
    });

    return res.status(200).json({ success: true, count: inserted });
  } catch (err) {
    next(err);
  }
}

// ==============================================================================
// 3.1 LAND DONORS MANAGEMENT (জমিদাতা পরিষদ)
// ==============================================================================

const landDonorValidationSchema = z.object({
  nameBn: z.string().min(2, 'দাতার বাংলা নাম আবশ্যক (কমপক্ষে ২ অক্ষর)'),
  nameEn: z.string().min(2, 'English name is required (at least 2 characters)'),
  areaValue: z.union([z.number(), z.string()]).refine((val) => {
    const n = parseFloat(val);
    return !isNaN(n) && n > 0;
  }, 'জমির পরিমাণ শূন্যের বেশি একটি বৈধ সংখ্যা হতে হবে'),
  areaUnit: z.enum(['DECIMAL_SHATANGSHO', 'KATHA', 'BIGHA', 'ACRE', 'SQFT']).default('DECIMAL_SHATANGSHO'),
  donationYear: z.union([z.number(), z.string()]).refine((val) => {
    const y = parseInt(val, 10);
    return !isNaN(y) && y >= 1900 && y <= 2100;
  }, 'দানের সাল ১৯০০ থেকে ২১০০ এর মধ্যে হতে হবে'),
  donationType: z.enum(['DANPATRA', 'WAQF', 'HEBA', 'REGISTERED_DEED', 'OTHER']).default('DANPATRA'),
  landUse: z.enum(['EIDGAH_GROUND', 'GRAVEYARD', 'MOSQUE', 'ROAD', 'BOUNDARY_WALL', 'OTHER']).default('EIDGAH_GROUND'),
});

export async function getAdminLandDonors(req, res, next) {
  try {
    const q = (req.query.q || '').trim();
    const year = req.query.year ? parseInt(req.query.year, 10) : null;
    const landUse = (req.query.landUse || '').trim();
    const donationType = (req.query.donationType || '').trim();
    const isPublished = req.query.isPublished;
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '15', 10)));
    const skip = (page - 1) * limit;

    const where = { deletedAt: null };

    if (year && !isNaN(year)) where.donationYear = year;
    if (landUse) where.landUse = landUse;
    if (donationType) where.donationType = donationType;
    if (isPublished === 'true') where.isPublished = true;
    if (isPublished === 'false') where.isPublished = false;

    if (q) {
      where.OR = [
        { nameBn: { contains: q, mode: 'insensitive' } },
        { nameEn: { contains: q, mode: 'insensitive' } },
        { fatherNameBn: { contains: q, mode: 'insensitive' } },
        { villageBn: { contains: q, mode: 'insensitive' } },
        { mouzaBn: { contains: q, mode: 'insensitive' } },
        { deedNumber: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, donors, totalLandSum] = await Promise.all([
      prisma.landDonor.count({ where }),
      prisma.landDonor.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { donationYear: 'asc' }, { id: 'asc' }],
        skip,
        take: limit,
        include: {
          relatedLandMap: {
            select: { id: true, titleBn: true, surveyType: true },
          },
        },
      }),
      prisma.landDonor.aggregate({
        where,
        _sum: { areaInDecimal: true },
      }),
    ]);

    return res.status(200).json({
      success: true,
      donors,
      totalLandInDecimal: totalLandSum._sum.areaInDecimal || 0,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function createLandDonor(req, res, next) {
  try {
    const body = req.body;
    
    // Zod validation
    const parsed = landDonorValidationSchema.safeParse(body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: parsed.error.issues[0]?.message || 'প্রদত্ত তথ্যে ত্রুটি রয়েছে।',
      });
    }

    let photoPath = body.photoPath || null;
    if (req.file) {
      const processed = await processAndUploadImage({
        buffer: req.file.buffer,
        directory: 'land-donors',
        maxWidth: 800,
        maxHeight: 1000,
        thumbWidth: 160,
        thumbHeight: 200,
      });
      photoPath = processed.path;
    }

    // Compute standardized area in Decimal (শতাংশ) using settings or defaults
    const [convAcre, convBigha, convKatha, convSqft] = await Promise.all([
      SettingsService.getValue('unit_conv_acre', '100'),
      SettingsService.getValue('unit_conv_bigha', '33'),
      SettingsService.getValue('unit_conv_katha', '1.65'),
      SettingsService.getValue('unit_conv_sqft', '435.6'),
    ]);

    const factors = {
      acre: parseFloat(convAcre) || 100,
      bigha: parseFloat(convBigha) || 33,
      katha: parseFloat(convKatha) || 1.65,
      sqft: parseFloat(convSqft) || 435.6,
    };

    const areaValue = parseFloat(body.areaValue);
    const areaUnit = body.areaUnit || 'DECIMAL_SHATANGSHO';
    const areaInDecimal = computeAreaInDecimal(areaValue, areaUnit, factors);

    // Parse relatedDocumentIds
    let relatedDocumentIds = null;
    if (body.relatedDocumentIds) {
      try {
        relatedDocumentIds = typeof body.relatedDocumentIds === 'string'
          ? JSON.parse(body.relatedDocumentIds)
          : body.relatedDocumentIds;
      } catch (e) {
        relatedDocumentIds = null;
      }
    }

    const donor = await prisma.landDonor.create({
      data: {
        nameBn: body.nameBn.trim(),
        nameEn: body.nameEn ? body.nameEn.trim() : null,
        fatherNameBn: body.fatherNameBn ? body.fatherNameBn.trim() : null,
        fatherNameEn: body.fatherNameEn ? body.fatherNameEn.trim() : null,
        motherNameBn: body.motherNameBn ? body.motherNameBn.trim() : null,
        motherNameEn: body.motherNameEn ? body.motherNameEn.trim() : null,
        villageBn: body.villageBn ? body.villageBn.trim() : null,
        villageEn: body.villageEn ? body.villageEn.trim() : null,
        photoPath,
        isDeceased: body.isDeceased !== false && body.isDeceased !== 'false' && body.isDeceased !== '0',
        areaValue,
        areaUnit,
        areaInDecimal,
        donationYear: parseInt(body.donationYear, 10),
        donationDate: body.donationDate ? new Date(body.donationDate) : null,
        donationType: body.donationType || 'DANPATRA',
        deedNumber: body.deedNumber ? body.deedNumber.trim() : null,
        deedDate: body.deedDate ? new Date(body.deedDate) : null,
        khatianType: body.khatianType || null,
        khatianNumber: body.khatianNumber ? body.khatianNumber.trim() : null,
        dagNumber: body.dagNumber ? body.dagNumber.trim() : null,
        mouzaBn: body.mouzaBn ? body.mouzaBn.trim() : null,
        mouzaEn: body.mouzaEn ? body.mouzaEn.trim() : null,
        jlNumber: body.jlNumber ? body.jlNumber.trim() : null,
        upazilaBn: body.upazilaBn ? body.upazilaBn.trim() : 'বাঞ্ছারামপুর',
        upazilaEn: body.upazilaEn ? body.upazilaEn.trim() : 'Bancharampur',
        districtBn: body.districtBn ? body.districtBn.trim() : 'ব্রাহ্মণবাড়িয়া',
        districtEn: body.districtEn ? body.districtEn.trim() : 'Brahmanbaria',
        boundaryNorth: body.boundaryNorth ? body.boundaryNorth.trim() : null,
        boundarySouth: body.boundarySouth ? body.boundarySouth.trim() : null,
        boundaryEast: body.boundaryEast ? body.boundaryEast.trim() : null,
        boundaryWest: body.boundaryWest ? body.boundaryWest.trim() : null,
        landUse: body.landUse || 'EIDGAH_GROUND',
        landUseOther: body.landUseOther ? body.landUseOther.trim() : null,
        storyBn: body.storyBn ? body.storyBn.trim() : null,
        storyEn: body.storyEn ? body.storyEn.trim() : null,
        relatedDocumentIds,
        relatedLandMapId: body.relatedLandMapId ? parseInt(body.relatedLandMapId, 10) : null,
        geometry: (() => {
          if (!body.geometry) return null;
          const check = validateGeoJsonPolygon(body.geometry);
          return check.valid ? check.normalized : null;
        })(),
        representativeName: body.representativeName ? body.representativeName.trim() : null,
        representativeRelation: body.representativeRelation ? body.representativeRelation.trim() : null,
        phone: body.phone ? body.phone.trim() : null,
        nid: body.nid ? body.nid.trim() : null,
        representativePhone: body.representativePhone ? body.representativePhone.trim() : null,
        isPublished: body.isPublished !== false && body.isPublished !== 'false' && body.isPublished !== '0',
        sortOrder: body.sortOrder ? parseInt(body.sortOrder, 10) : 0,
        showDeedDetails: body.showDeedDetails === true || body.showDeedDetails === 'true' || body.showDeedDetails === '1',
        showPlotDetails: body.showPlotDetails === true || body.showPlotDetails === 'true' || body.showPlotDetails === '1',
        showBoundaries: body.showBoundaries === true || body.showBoundaries === 'true' || body.showBoundaries === '1',
      },
    });

    await logActivity({
      req,
      action: 'CREATED',
      subjectType: 'LandDonor',
      subjectId: donor.id,
      description: `নতুন জমিদাতা '${donor.nameBn}' যোগ করা হয়েছে (${donor.areaValue} ${donor.areaUnit})।`,
    });

    return res.status(201).json({ success: true, donor });
  } catch (err) {
    next(err);
  }
}

export async function updateLandDonor(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const body = req.body;

    const existing = await prisma.landDonor.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, error: 'জমিদাতা রেকর্ড পাওয়া যায়নি।' });

    let photoPath = existing.photoPath;
    if (req.file) {
      const processed = await processAndUploadImage({
        buffer: req.file.buffer,
        directory: 'land-donors',
        maxWidth: 800,
        maxHeight: 1000,
        thumbWidth: 160,
        thumbHeight: 200,
      });
      photoPath = processed.path;
    } else if (body.photoPath === '' || body.photoPath === null) {
      photoPath = null;
    }

    const areaValue = body.areaValue !== undefined ? parseFloat(body.areaValue) : Number(existing.areaValue);
    const areaUnit = body.areaUnit || existing.areaUnit;

    const [convAcre, convBigha, convKatha, convSqft] = await Promise.all([
      SettingsService.getValue('unit_conv_acre', '100'),
      SettingsService.getValue('unit_conv_bigha', '33'),
      SettingsService.getValue('unit_conv_katha', '1.65'),
      SettingsService.getValue('unit_conv_sqft', '435.6'),
    ]);

    const factors = {
      acre: parseFloat(convAcre) || 100,
      bigha: parseFloat(convBigha) || 33,
      katha: parseFloat(convKatha) || 1.65,
      sqft: parseFloat(convSqft) || 435.6,
    };
    const areaInDecimal = computeAreaInDecimal(areaValue, areaUnit, factors);

    let relatedDocumentIds = existing.relatedDocumentIds;
    if (body.relatedDocumentIds !== undefined) {
      try {
        relatedDocumentIds = typeof body.relatedDocumentIds === 'string'
          ? JSON.parse(body.relatedDocumentIds)
          : body.relatedDocumentIds;
      } catch (e) {
        relatedDocumentIds = null;
      }
    }

    const updated = await prisma.landDonor.update({
      where: { id },
      data: {
        nameBn: body.nameBn ? body.nameBn.trim() : undefined,
        nameEn: body.nameEn !== undefined ? (body.nameEn ? body.nameEn.trim() : null) : undefined,
        fatherNameBn: body.fatherNameBn !== undefined ? (body.fatherNameBn ? body.fatherNameBn.trim() : null) : undefined,
        fatherNameEn: body.fatherNameEn !== undefined ? (body.fatherNameEn ? body.fatherNameEn.trim() : null) : undefined,
        motherNameBn: body.motherNameBn !== undefined ? (body.motherNameBn ? body.motherNameBn.trim() : null) : undefined,
        motherNameEn: body.motherNameEn !== undefined ? (body.motherNameEn ? body.motherNameEn.trim() : null) : undefined,
        villageBn: body.villageBn !== undefined ? (body.villageBn ? body.villageBn.trim() : null) : undefined,
        villageEn: body.villageEn !== undefined ? (body.villageEn ? body.villageEn.trim() : null) : undefined,
        photoPath,
        isDeceased: body.isDeceased !== undefined ? (body.isDeceased !== false && body.isDeceased !== 'false' && body.isDeceased !== '0') : undefined,
        areaValue,
        areaUnit,
        areaInDecimal,
        donationYear: body.donationYear ? parseInt(body.donationYear, 10) : undefined,
        donationDate: body.donationDate !== undefined ? (body.donationDate ? new Date(body.donationDate) : null) : undefined,
        donationType: body.donationType || undefined,
        deedNumber: body.deedNumber !== undefined ? (body.deedNumber ? body.deedNumber.trim() : null) : undefined,
        deedDate: body.deedDate !== undefined ? (body.deedDate ? new Date(body.deedDate) : null) : undefined,
        khatianType: body.khatianType !== undefined ? (body.khatianType || null) : undefined,
        khatianNumber: body.khatianNumber !== undefined ? (body.khatianNumber ? body.khatianNumber.trim() : null) : undefined,
        dagNumber: body.dagNumber !== undefined ? (body.dagNumber ? body.dagNumber.trim() : null) : undefined,
        mouzaBn: body.mouzaBn !== undefined ? (body.mouzaBn ? body.mouzaBn.trim() : null) : undefined,
        mouzaEn: body.mouzaEn !== undefined ? (body.mouzaEn ? body.mouzaEn.trim() : null) : undefined,
        jlNumber: body.jlNumber !== undefined ? (body.jlNumber ? body.jlNumber.trim() : null) : undefined,
        upazilaBn: body.upazilaBn !== undefined ? (body.upazilaBn ? body.upazilaBn.trim() : null) : undefined,
        upazilaEn: body.upazilaEn !== undefined ? (body.upazilaEn ? body.upazilaEn.trim() : null) : undefined,
        districtBn: body.districtBn !== undefined ? (body.districtBn ? body.districtBn.trim() : null) : undefined,
        districtEn: body.districtEn !== undefined ? (body.districtEn ? body.districtEn.trim() : null) : undefined,
        boundaryNorth: body.boundaryNorth !== undefined ? (body.boundaryNorth ? body.boundaryNorth.trim() : null) : undefined,
        boundarySouth: body.boundarySouth !== undefined ? (body.boundarySouth ? body.boundarySouth.trim() : null) : undefined,
        boundaryEast: body.boundaryEast !== undefined ? (body.boundaryEast ? body.boundaryEast.trim() : null) : undefined,
        boundaryWest: body.boundaryWest !== undefined ? (body.boundaryWest ? body.boundaryWest.trim() : null) : undefined,
        landUse: body.landUse || undefined,
        landUseOther: body.landUseOther !== undefined ? (body.landUseOther ? body.landUseOther.trim() : null) : undefined,
        storyBn: body.storyBn !== undefined ? (body.storyBn ? body.storyBn.trim() : null) : undefined,
        storyEn: body.storyEn !== undefined ? (body.storyEn ? body.storyEn.trim() : null) : undefined,
        relatedDocumentIds,
        relatedLandMapId: body.relatedLandMapId !== undefined ? (body.relatedLandMapId ? parseInt(body.relatedLandMapId, 10) : null) : undefined,
        geometry: (() => {
          if (body.geometry === undefined) return undefined;
          if (body.geometry === '' || body.geometry === null) return null;
          const check = validateGeoJsonPolygon(body.geometry);
          return check.valid ? check.normalized : existing.geometry;
        })(),
        representativeName: body.representativeName !== undefined ? (body.representativeName ? body.representativeName.trim() : null) : undefined,
        representativeRelation: body.representativeRelation !== undefined ? (body.representativeRelation ? body.representativeRelation.trim() : null) : undefined,
        phone: body.phone !== undefined ? (body.phone ? body.phone.trim() : null) : undefined,
        nid: body.nid !== undefined ? (body.nid ? body.nid.trim() : null) : undefined,
        representativePhone: body.representativePhone !== undefined ? (body.representativePhone ? body.representativePhone.trim() : null) : undefined,
        isPublished: body.isPublished !== undefined ? (body.isPublished !== false && body.isPublished !== 'false' && body.isPublished !== '0') : undefined,
        sortOrder: body.sortOrder !== undefined ? parseInt(body.sortOrder, 10) : undefined,
        showDeedDetails: body.showDeedDetails !== undefined ? (body.showDeedDetails === true || body.showDeedDetails === 'true' || body.showDeedDetails === '1') : undefined,
        showPlotDetails: body.showPlotDetails !== undefined ? (body.showPlotDetails === true || body.showPlotDetails === 'true' || body.showPlotDetails === '1') : undefined,
        showBoundaries: body.showBoundaries !== undefined ? (body.showBoundaries === true || body.showBoundaries === 'true' || body.showBoundaries === '1') : undefined,
      },
    });

    await logActivity({
      req,
      action: 'UPDATED',
      subjectType: 'LandDonor',
      subjectId: id,
      description: `জমিদাতা রেকর্ড আপডেট করা হয়েছে: '${updated.nameBn}'।`,
    });

    return res.status(200).json({ success: true, donor: updated });
  } catch (err) {
    next(err);
  }
}

export async function deleteLandDonor(req, res, next) {
  try {
    const result = await permanentlyDeleteEntity({
      type: 'LandDonor',
      id: req.params.id,
      req,
      getDescription: (existing) => `জমিদাতা রেকর্ড '${existing.nameBn}' ডাটাবেজ থেকে স্থায়ীভাবে মুছে ফেলা হয়েছে।`,
    });
    if (result.notFound) {
      return res.status(404).json({ success: false, error: result.notFoundMessage });
    }

    return res.status(200).json({ success: true, message: 'জমিদাতা রেকর্ড ডাটাবেজ থেকে স্থায়ীভাবে মুছে ফেলা হয়েছে।' });
  } catch (err) {
    next(err);
  }
}

export async function exportLandDonorsCsv(req, res, next) {
  try {
    const donors = await prisma.landDonor.findMany({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { donationYear: 'asc' }, { id: 'asc' }],
    });

    const fields = [
      'id', 'nameBn', 'nameEn', 'fatherNameBn', 'fatherNameEn', 'motherNameBn', 'motherNameEn',
      'villageBn', 'villageEn', 'isDeceased', 'areaValue', 'areaUnit', 'areaInDecimal',
      'donationYear', 'donationDate', 'donationType', 'deedNumber', 'deedDate',
      'khatianType', 'khatianNumber', 'dagNumber', 'mouzaBn', 'mouzaEn', 'jlNumber',
      'upazilaBn', 'districtBn', 'boundaryNorth', 'boundarySouth', 'boundaryEast', 'boundaryWest',
      'landUse', 'landUseOther', 'storyBn', 'representativeName', 'representativeRelation',
      'phone', 'nid', 'representativePhone', 'isPublished', 'sortOrder',
      'showDeedDetails', 'showPlotDetails', 'showBoundaries'
    ];

    const json2csv = new Parser({ fields, withBOM: true });
    const csv = json2csv.parse(donors);

    await logActivity({
      req,
      action: 'EXPORT',
      subjectType: 'LandDonor',
      description: `${donors.length} জন জমিদাতার CSV ফাইল এক্সপোর্ট করা হয়েছে।`,
    });

    res.header('Content-Type', 'text/csv; charset=utf-8');
    res.attachment(`manikpur-eidgah-land-donors-${Date.now()}.csv`);
    return res.send(csv);
  } catch (err) {
    next(err);
  }
}

export async function importLandDonorsCsv(req, res, next) {
  try {
    const { donors } = req.body;
    if (!Array.isArray(donors) || donors.length === 0) {
      return res.status(400).json({ success: false, error: 'জমিদাতাদের বৈধ তালিকা প্রদান করুন।' });
    }

    const [convAcre, convBigha, convKatha, convSqft] = await Promise.all([
      SettingsService.getValue('unit_conv_acre', '100'),
      SettingsService.getValue('unit_conv_bigha', '33'),
      SettingsService.getValue('unit_conv_katha', '1.65'),
      SettingsService.getValue('unit_conv_sqft', '435.6'),
    ]);

    const factors = {
      acre: parseFloat(convAcre) || 100,
      bigha: parseFloat(convBigha) || 33,
      katha: parseFloat(convKatha) || 1.65,
      sqft: parseFloat(convSqft) || 435.6,
    };

    let inserted = 0;
    const errors = [];

    for (let i = 0; i < donors.length; i++) {
      const d = donors[i];
      if (!d.nameBn || !d.areaValue || !d.donationYear) {
        errors.push({ row: i + 1, error: 'বাংলা নাম, জমির পরিমাণ এবং সাল আবশ্যক।' });
        continue;
      }

      const areaValue = parseFloat(d.areaValue);
      if (isNaN(areaValue) || areaValue <= 0) {
        errors.push({ row: i + 1, error: 'জমির পরিমাণ শূন্যের বেশি হতে হবে।' });
        continue;
      }

      const areaUnit = d.areaUnit || 'DECIMAL_SHATANGSHO';
      const areaInDecimal = computeAreaInDecimal(areaValue, areaUnit, factors);

      await prisma.landDonor.create({
        data: {
          nameBn: String(d.nameBn).trim(),
          nameEn: d.nameEn ? String(d.nameEn).trim() : null,
          fatherNameBn: d.fatherNameBn ? String(d.fatherNameBn).trim() : null,
          fatherNameEn: d.fatherNameEn ? String(d.fatherNameEn).trim() : null,
          motherNameBn: d.motherNameBn ? String(d.motherNameBn).trim() : null,
          motherNameEn: d.motherNameEn ? String(d.motherNameEn).trim() : null,
          villageBn: d.villageBn ? String(d.villageBn).trim() : null,
          villageEn: d.villageEn ? String(d.villageEn).trim() : null,
          isDeceased: d.isDeceased !== false && d.isDeceased !== 'false' && d.isDeceased !== '0',
          areaValue,
          areaUnit,
          areaInDecimal,
          donationYear: parseInt(d.donationYear, 10) || new Date().getFullYear(),
          donationDate: d.donationDate ? new Date(d.donationDate) : null,
          donationType: d.donationType || 'DANPATRA',
          deedNumber: d.deedNumber ? String(d.deedNumber).trim() : null,
          deedDate: d.deedDate ? new Date(d.deedDate) : null,
          khatianType: d.khatianType || null,
          khatianNumber: d.khatianNumber ? String(d.khatianNumber).trim() : null,
          dagNumber: d.dagNumber ? String(d.dagNumber).trim() : null,
          mouzaBn: d.mouzaBn ? String(d.mouzaBn).trim() : null,
          mouzaEn: d.mouzaEn ? String(d.mouzaEn).trim() : null,
          jlNumber: d.jlNumber ? String(d.jlNumber).trim() : null,
          upazilaBn: d.upazilaBn ? String(d.upazilaBn).trim() : 'বাঞ্ছারামপুর',
          upazilaEn: d.upazilaEn ? String(d.upazilaEn).trim() : 'Bancharampur',
          districtBn: d.districtBn ? String(d.districtBn).trim() : 'ব্রাহ্মণবাড়িয়া',
          districtEn: d.districtEn ? String(d.districtEn).trim() : 'Brahmanbaria',
          boundaryNorth: d.boundaryNorth ? String(d.boundaryNorth).trim() : null,
          boundarySouth: d.boundarySouth ? String(d.boundarySouth).trim() : null,
          boundaryEast: d.boundaryEast ? String(d.boundaryEast).trim() : null,
          boundaryWest: d.boundaryWest ? String(d.boundaryWest).trim() : null,
          landUse: d.landUse || 'EIDGAH_GROUND',
          landUseOther: d.landUseOther ? String(d.landUseOther).trim() : null,
          storyBn: d.storyBn ? String(d.storyBn).trim() : null,
          storyEn: d.storyEn ? String(d.storyEn).trim() : null,
          representativeName: d.representativeName ? String(d.representativeName).trim() : null,
          representativeRelation: d.representativeRelation ? String(d.representativeRelation).trim() : null,
          phone: d.phone ? String(d.phone).trim() : null,
          nid: d.nid ? String(d.nid).trim() : null,
          representativePhone: d.representativePhone ? String(d.representativePhone).trim() : null,
          isPublished: d.isPublished !== false && d.isPublished !== 'false' && d.isPublished !== '0',
          sortOrder: d.sortOrder ? parseInt(d.sortOrder, 10) : 0,
          showDeedDetails: d.showDeedDetails === true || d.showDeedDetails === 'true' || d.showDeedDetails === '1',
          showPlotDetails: d.showPlotDetails === true || d.showPlotDetails === 'true' || d.showPlotDetails === '1',
          showBoundaries: d.showBoundaries === true || d.showBoundaries === 'true' || d.showBoundaries === '1',
        },
      });
      inserted++;
    }

    await logActivity({
      req,
      action: 'IMPORTED',
      subjectType: 'LandDonor',
      description: `CSV ইম্পোর্টের মাধ্যমে ${inserted} জন জমিদাতা যোগ করা হয়েছে।`,
    });

    return res.status(200).json({ success: true, count: inserted, errors });
  } catch (err) {
    next(err);
  }
}

export async function getLandDonorsTemplate(req, res, next) {
  try {
    const fields = [
      'nameBn', 'nameEn', 'fatherNameBn', 'fatherNameEn', 'motherNameBn', 'motherNameEn',
      'villageBn', 'villageEn', 'isDeceased', 'areaValue', 'areaUnit',
      'donationYear', 'donationDate', 'donationType', 'deedNumber', 'deedDate',
      'khatianType', 'khatianNumber', 'dagNumber', 'mouzaBn', 'mouzaEn', 'jlNumber',
      'upazilaBn', 'districtBn', 'boundaryNorth', 'boundarySouth', 'boundaryEast', 'boundaryWest',
      'landUse', 'storyBn', 'representativeName', 'representativeRelation',
      'phone', 'nid', 'representativePhone', 'isPublished', 'sortOrder',
      'showDeedDetails', 'showPlotDetails', 'showBoundaries'
    ];

    const sampleData = [
      {
        nameBn: 'আলহাজ্ব মৌলভী আব্দুল জব্বার',
        nameEn: 'Alhaj Maulvi Abdul Jabbar',
        fatherNameBn: 'হাজী মোহাম্মদ বক্স',
        fatherNameEn: 'Haji Mohammad Baksh',
        motherNameBn: 'মরহুমা রাবেয়া খাতুন',
        motherNameEn: 'Late Rabeya Khatun',
        villageBn: 'মানিকপুর',
        villageEn: 'Manikpur',
        isDeceased: true,
        areaValue: 40.0,
        areaUnit: 'DECIMAL_SHATANGSHO',
        donationYear: 1965,
        donationDate: '1965-03-12',
        donationType: 'WAQF',
        deedNumber: '২৮৪১/১৯৬৫',
        deedDate: '1965-03-12',
        khatianType: 'SA',
        khatianNumber: '১১২',
        dagNumber: '৩২৪',
        mouzaBn: 'মানিকপুর',
        mouzaEn: 'Manikpur',
        jlNumber: '৪৫',
        upazilaBn: 'বাঞ্ছারামপুর',
        districtBn: 'ব্রাহ্মণবাড়িয়া',
        boundaryNorth: 'সরকারী গোপাট',
        boundarySouth: 'মৌলভী বাড়ির সীমানা',
        boundaryEast: 'নূরুল ইসলাম সাহেবের জমি',
        boundaryWest: 'হাজী বাড়ির সীমানা',
        landUse: 'EIDGAH_GROUND',
        storyBn: 'মানিকপুর ঈদগাহ প্রতিষ্ঠার মূল জমি দান।',
        representativeName: 'সৈয়দ হারুন',
        representativeRelation: 'দৌহিত্র',
        phone: '01711000000',
        nid: '1965123456789',
        representativePhone: '01811000000',
        isPublished: true,
        sortOrder: 1,
        showDeedDetails: true,
        showPlotDetails: true,
        showBoundaries: true,
      },
      {
        nameBn: 'হাজী মোঃ আলী মিয়া',
        nameEn: 'Haji Md. Ali Mia',
        fatherNameBn: 'আব্দুল করিম',
        fatherNameEn: 'Abdul Karim',
        motherNameBn: '',
        motherNameEn: '',
        villageBn: 'মানিকপুর',
        villageEn: 'Manikpur',
        isDeceased: true,
        areaValue: 25.0,
        areaUnit: 'DECIMAL_SHATANGSHO',
        donationYear: 1965,
        donationDate: '1965-04-18',
        donationType: 'DANPATRA',
        deedNumber: '২৯০৫/১৯৬৫',
        deedDate: '1965-04-18',
        khatianType: 'SA',
        khatianNumber: '১১৮',
        dagNumber: '৩২৫',
        mouzaBn: 'মানিকপুর',
        mouzaEn: 'Manikpur',
        jlNumber: '৪৫',
        upazilaBn: 'বাঞ্ছারামপুর',
        districtBn: 'ব্রাহ্মণবাড়িয়া',
        boundaryNorth: '',
        boundarySouth: '',
        boundaryEast: '',
        boundaryWest: '',
        landUse: 'EIDGAH_GROUND',
        storyBn: 'মাঠের উত্তর-পূর্ব অংশের জমি দান।',
        representativeName: '',
        representativeRelation: '',
        phone: '',
        nid: '',
        representativePhone: '',
        isPublished: true,
        sortOrder: 2,
        showDeedDetails: true,
        showPlotDetails: false,
        showBoundaries: false,
      },
    ];

    const json2csv = new Parser({ fields, withBOM: true });
    const csv = json2csv.parse(sampleData);

    res.header('Content-Type', 'text/csv; charset=utf-8');
    res.attachment('manikpur-eidgah-land-donors-sample-template.csv');
    return res.send(csv);
  } catch (err) {
    next(err);
  }
}

// ==============================================================================
// 4. COMMITTEE MANAGEMENT
// ==============================================================================
export async function getCommitteeMembers(req, res, next) {
  try {
    const members = await prisma.committeeMember.findMany({
      where: { deletedAt: null },
      orderBy: [{ isCurrent: 'desc' }, { level: 'asc' }, { sortOrder: 'asc' }, { id: 'asc' }],
    });
    return res.status(200).json({ success: true, committee: members });
  } catch (err) {
    next(err);
  }
}

export async function createCommitteeMember(req, res, next) {
  try {
    const body = req.body;

    if (!body.nameBn || !body.nameBn.trim()) {
      return res.status(400).json({ success: false, code: 'REQUIRED_FIELD_BN', error: 'কমিটি সদস্যের বাংলা নাম আবশ্যক' });
    }
    if (!body.nameEn || !body.nameEn.trim()) {
      return res.status(400).json({ success: false, code: 'REQUIRED_FIELD_EN', error: 'Committee member English name is required' });
    }
    if (!body.designationBn || !body.designationBn.trim()) {
      return res.status(400).json({ success: false, code: 'REQUIRED_FIELD_BN', error: 'বাংলা পদবী আবশ্যক' });
    }
    if (!body.designationEn || !body.designationEn.trim()) {
      return res.status(400).json({ success: false, code: 'REQUIRED_FIELD_EN', error: 'English designation is required' });
    }

    let photoPath = body.photoPath || null;

    if (req.file) {
      const processed = await processAndUploadImage({
        buffer: req.file.buffer,
        directory: 'committee',
        maxWidth: 800,
        maxHeight: 1000,
      });
      photoPath = processed.path;
    }

    const member = await prisma.committeeMember.create({
      data: {
        nameBn: body.nameBn.trim(),
        nameEn: body.nameEn ? body.nameEn.trim() : null,
        designationBn: body.designationBn.trim(),
        designationEn: body.designationEn ? body.designationEn.trim() : null,
        roleBn: body.roleBn ? body.roleBn.trim() : null,
        roleEn: body.roleEn ? body.roleEn.trim() : null,
        designationType: body.designationType || 'MEMBER',
        level: body.level ? parseInt(body.level, 10) : 2,
        parentId: body.parentId ? parseInt(body.parentId, 10) : null,
        term: body.term ? body.term.trim() : 'বর্তমান',
        termPeriod: body.termPeriod ? body.termPeriod.trim() : null,
        isCurrent: body.isCurrent !== false && body.isCurrent !== 'false',
        isActive: body.isActive !== false && body.isActive !== 'false',
        sortOrder: body.sortOrder ? parseInt(body.sortOrder, 10) : 0,
        phone: body.phone ? body.phone.trim() : null,
        showPhone: body.showPhone === true || body.showPhone === 'true' || body.showPhone === '1',
        photoPath,
        bioBn: body.bioBn ? body.bioBn.trim() : null,
        bioEn: body.bioEn ? body.bioEn.trim() : null,
      },
    });

    await logActivity({
      req,
      action: 'CREATED',
      subjectType: 'CommitteeMember',
      subjectId: member.id,
      description: `কমিটি সদস্য '${member.nameBn}' (${member.designationBn}) যোগ করা হয়েছে।`,
    });

    return res.status(201).json({ success: true, member });
  } catch (err) {
    next(err);
  }
}

export async function updateCommitteeMember(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const body = req.body;
    const existing = await prisma.committeeMember.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, error: 'সদস্য পাওয়া যায়নি।' });

    let photoPath = existing.photoPath;
    if (req.file) {
      const processed = await processAndUploadImage({
        buffer: req.file.buffer,
        directory: 'committee',
        maxWidth: 800,
        maxHeight: 1000,
      });
      photoPath = processed.path;
    } else if (body.removePhoto === 'true' || body.removePhoto === true) {
      photoPath = null;
    }

    const updated = await prisma.committeeMember.update({
      where: { id },
      data: {
        nameBn: body.nameBn ? body.nameBn.trim() : undefined,
        nameEn: body.nameEn !== undefined ? (body.nameEn ? body.nameEn.trim() : null) : undefined,
        designationBn: body.designationBn ? body.designationBn.trim() : undefined,
        designationEn: body.designationEn !== undefined ? (body.designationEn ? body.designationEn.trim() : null) : undefined,
        roleBn: body.roleBn !== undefined ? (body.roleBn ? body.roleBn.trim() : null) : undefined,
        roleEn: body.roleEn !== undefined ? (body.roleEn ? body.roleEn.trim() : null) : undefined,
        level: body.level !== undefined ? parseInt(body.level, 10) : undefined,
        term: body.term !== undefined ? body.term.trim() : undefined,
        termPeriod: body.termPeriod !== undefined ? (body.termPeriod ? body.termPeriod.trim() : null) : undefined,
        isCurrent: body.isCurrent !== undefined ? (body.isCurrent !== false && body.isCurrent !== 'false') : undefined,
        isActive: body.isActive !== undefined ? (body.isActive !== false && body.isActive !== 'false') : undefined,
        sortOrder: body.sortOrder !== undefined ? parseInt(body.sortOrder, 10) : undefined,
        phone: body.phone !== undefined ? (body.phone ? body.phone.trim() : null) : undefined,
        showPhone: body.showPhone !== undefined ? (body.showPhone === true || body.showPhone === 'true' || body.showPhone === '1') : undefined,
        photoPath,
        bioBn: body.bioBn !== undefined ? (body.bioBn ? body.bioBn.trim() : null) : undefined,
      },
    });

    await logActivity({
      req,
      action: 'UPDATED',
      subjectType: 'CommitteeMember',
      subjectId: id,
      description: `কমিটি সদস্য '${updated.nameBn}' আপডেট করা হয়েছে।`,
    });

    return res.status(200).json({ success: true, member: updated });
  } catch (err) {
    next(err);
  }
}

export async function deleteCommitteeMember(req, res, next) {
  try {
    const result = await permanentlyDeleteEntity({
      type: 'CommitteeMember',
      id: req.params.id,
      req,
      getDescription: (existing) => `কমিটি সদস্য '${existing.nameBn}' ডাটাবেজ থেকে স্থায়ীভাবে মুছে ফেলা হয়েছে।`,
    });
    if (result.notFound) {
      return res.status(404).json({ success: false, error: result.notFoundMessage });
    }

    return res.status(200).json({ success: true, message: 'কমিটি সদস্য ডাটাবেজ থেকে স্থায়ীভাবে মুছে ফেলা হয়েছে।' });
  } catch (err) {
    next(err);
  }
}

export async function archiveCommitteeTerm(req, res, next) {
  try {
    const { termName } = req.body;
    if (!termName) return res.status(400).json({ success: false, error: 'মেয়াদ বা আর্কাইভের নাম প্রদান করুন।' });

    const result = await prisma.committeeMember.updateMany({
      where: { isCurrent: true, deletedAt: null },
      data: {
        isCurrent: false,
        term: termName,
        termPeriod: termName,
      },
    });

    await logActivity({
      req,
      action: 'ARCHIVED',
      subjectType: 'CommitteeMember',
      description: `বর্তমান কমিটিকে সফলভাবে '${termName}' নামে আর্কাইভে রূপান্তর করা হয়েছে (${result.count} জন)।`,
    });

    return res.status(200).json({ success: true, count: result.count });
  } catch (err) {
    next(err);
  }
}

// ==============================================================================
// 5. ALBUMS & PHOTO GALLERY MANAGEMENT
// ==============================================================================
export async function getAlbums(req, res, next) {
  try {
    const albums = await prisma.album.findMany({
      where: { deletedAt: null },
      orderBy: [{ year: 'desc' }, { sortOrder: 'asc' }, { id: 'desc' }],
      include: {
        coverPhoto: true,
        _count: { select: { photos: { where: { deletedAt: null } } } },
      },
    });
    return res.status(200).json({ success: true, albums });
  } catch (err) {
    next(err);
  }
}

export async function getAlbumById(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const album = await prisma.album.findUnique({
      where: { id },
      include: {
        coverPhoto: true,
        photos: {
          where: { deletedAt: null },
          orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        },
      },
    });
    if (!album) return res.status(404).json({ success: false, error: 'অ্যালবাম পাওয়া যায়নি।' });
    return res.status(200).json({ success: true, album });
  } catch (err) {
    next(err);
  }
}

export async function createAlbum(req, res, next) {
  try {
    const body = req.body;

    if (!body.titleBn || !body.titleBn.trim()) {
      return res.status(400).json({ success: false, code: 'REQUIRED_FIELD_BN', error: 'অ্যালবামের বাংলা শিরোনাম আবশ্যক' });
    }
    if (!body.titleEn || !body.titleEn.trim()) {
      return res.status(400).json({ success: false, code: 'REQUIRED_FIELD_EN', error: 'Album English title is required' });
    }

    const slug = body.slug ? body.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') : `album-${Date.now()}`;

    const album = await prisma.album.create({
      data: {
        titleBn: body.titleBn.trim(),
        titleEn: body.titleEn ? body.titleEn.trim() : null,
        slug,
        occasionNameBn: body.occasionNameBn ? body.occasionNameBn.trim() : null,
        occasionNameEn: body.occasionNameEn ? body.occasionNameEn.trim() : null,
        descriptionBn: body.descriptionBn ? body.descriptionBn.trim() : null,
        descriptionEn: body.descriptionEn ? body.descriptionEn.trim() : null,
        type: body.type || 'FITR',
        year: parseInt(body.year, 10) || new Date().getFullYear(),
        eventDate: body.eventDate ? new Date(body.eventDate) : null,
        isPublished: body.isPublished !== false && body.isPublished !== 'false',
        sortOrder: body.sortOrder ? parseInt(body.sortOrder, 10) : 0,
      },
    });

    await logActivity({
      req,
      action: 'CREATED',
      subjectType: 'Album',
      subjectId: album.id,
      description: `নতুন ফটো অ্যালবাম '${album.titleBn}' তৈরি করা হয়েছে।`,
    });

    return res.status(201).json({ success: true, album });
  } catch (err) {
    next(err);
  }
}

export async function updateAlbum(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const body = req.body;

    const updated = await prisma.album.update({
      where: { id },
      data: {
        titleBn: body.titleBn ? body.titleBn.trim() : undefined,
        titleEn: body.titleEn !== undefined ? (body.titleEn ? body.titleEn.trim() : null) : undefined,
        slug: body.slug ? body.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') : undefined,
        occasionNameBn: body.occasionNameBn !== undefined ? (body.occasionNameBn ? body.occasionNameBn.trim() : null) : undefined,
        descriptionBn: body.descriptionBn !== undefined ? (body.descriptionBn ? body.descriptionBn.trim() : null) : undefined,
        type: body.type || undefined,
        year: body.year ? parseInt(body.year, 10) : undefined,
        eventDate: body.eventDate ? new Date(body.eventDate) : undefined,
        isPublished: body.isPublished !== undefined ? (body.isPublished !== false && body.isPublished !== 'false') : undefined,
        coverPhotoId: body.coverPhotoId !== undefined ? (body.coverPhotoId ? parseInt(body.coverPhotoId, 10) : null) : undefined,
      },
    });

    await logActivity({
      req,
      action: 'UPDATED',
      subjectType: 'Album',
      subjectId: id,
      description: `অ্যালবাম '${updated.titleBn}' আপডেট করা হয়েছে।`,
    });

    return res.status(200).json({ success: true, album: updated });
  } catch (err) {
    next(err);
  }
}

export async function deleteAlbum(req, res, next) {
  try {
    const result = await permanentlyDeleteEntity({
      type: 'Album',
      id: req.params.id,
      req,
      getDescription: (existing) => `অ্যালবাম '${existing.titleBn}' ও এর ছবিগুলো ডাটাবেজ থেকে স্থায়ীভাবে মুছে ফেলা হয়েছে।`,
    });
    if (result.notFound) {
      return res.status(404).json({ success: false, error: result.notFoundMessage });
    }

    return res.status(200).json({ success: true, message: 'অ্যালবাম ডাটাবেজ থেকে স্থায়ীভাবে মুছে ফেলা হয়েছে।' });
  } catch (err) {
    next(err);
  }
}

export async function uploadAlbumPhotos(req, res, next) {
  try {
    const albumId = parseInt(req.params.id, 10);
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, error: 'কমপক্ষে একটি ছবি আপলোড করুন।' });
    }

    const album = await prisma.album.findUnique({ where: { id: albumId } });
    if (!album) return res.status(404).json({ success: false, error: 'অ্যালবাম পাওয়া যায়নি।' });

    const createdPhotos = [];
    for (const f of files) {
      const processed = await processAndUploadImage({
        buffer: f.buffer,
        directory: `albums/${album.slug}`,
        maxWidth: 2000,
        maxHeight: 1600,
      });

      const photo = await prisma.photo.create({
        data: {
          albumId,
          path: processed.path,
          thumbPath: processed.thumbPath,
          originalName: f.originalname,
          width: processed.width,
          height: processed.height,
          fileSize: processed.fileSize,
          isPublished: true,
        },
      });
      createdPhotos.push(photo);
    }

    // Set first photo as cover if album has no cover photo
    if (!album.coverPhotoId && createdPhotos.length > 0) {
      await prisma.album.update({
        where: { id: albumId },
        data: { coverPhotoId: createdPhotos[0].id },
      });
    }

    await logActivity({
      req,
      action: 'CREATED',
      subjectType: 'Photo',
      description: `অ্যালবাম '${album.titleBn}'-এ ${createdPhotos.length} টি ছবি আপলোড করা হয়েছে।`,
    });

    return res.status(201).json({ success: true, count: createdPhotos.length, photos: createdPhotos });
  } catch (err) {
    next(err);
  }
}

export async function updatePhoto(req, res, next) {
  try {
    const id = parseInt(req.params.photoId, 10);
    const { captionBn, captionEn, sortOrder, isPublished } = req.body;

    const photo = await prisma.photo.update({
      where: { id },
      data: {
        captionBn: captionBn !== undefined ? (captionBn ? captionBn.trim() : null) : undefined,
        captionEn: captionEn !== undefined ? (captionEn ? captionEn.trim() : null) : undefined,
        sortOrder: sortOrder !== undefined ? parseInt(sortOrder, 10) : undefined,
        isPublished: isPublished !== undefined ? Boolean(isPublished) : undefined,
      },
    });

    return res.status(200).json({ success: true, photo });
  } catch (err) {
    next(err);
  }
}

export async function deletePhoto(req, res, next) {
  try {
    const result = await permanentlyDeleteEntity({
      type: 'Photo',
      id: req.params.photoId,
      req,
      getDescription: (existing, id) => `ছবি '${existing.captionBn || existing.originalName || `#${id}`}' ডাটাবেজ থেকে স্থায়ীভাবে মুছে ফেলা হয়েছে।`,
    });
    if (result.notFound) {
      return res.status(404).json({ success: false, error: result.notFoundMessage });
    }

    return res.status(200).json({ success: true, message: 'ছবি ডাটাবেজ থেকে স্থায়ীভাবে মুছে ফেলা হয়েছে।' });
  } catch (err) {
    next(err);
  }
}

export async function setCoverPhoto(req, res, next) {
  try {
    const albumId = parseInt(req.params.id, 10);
    const { photoId } = req.body;

    await prisma.album.update({
      where: { id: albumId },
      data: { coverPhotoId: parseInt(photoId, 10) },
    });

    return res.status(200).json({ success: true, message: 'কভার ছবি নির্ধারিত হয়েছে।' });
  } catch (err) {
    next(err);
  }
}

// ==============================================================================
// 6. DOCUMENTS MANAGEMENT
// ==============================================================================
export async function getDocuments(req, res, next) {
  try {
    const category = (req.query.category || '').trim();
    const visibility = (req.query.visibility || '').trim();
    const q = (req.query.q || '').trim();
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '15', 10)));
    const skip = (page - 1) * limit;

    const where = { deletedAt: null };
    if (category) where.category = category;
    if (visibility) where.visibility = visibility;
    if (q) {
      where.OR = [
        { titleBn: { contains: q, mode: 'insensitive' } },
        { titleEn: { contains: q, mode: 'insensitive' } },
        { documentNo: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, documents] = await Promise.all([
      prisma.document.count({ where }),
      prisma.document.findMany({
        where,
        orderBy: [{ documentDate: 'desc' }, { id: 'desc' }],
        skip,
        take: limit,
      }),
    ]);

    return res.status(200).json({
      success: true,
      documents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function createDocument(req, res, next) {
  try {
    const body = req.body;
    if (!body.titleBn || !body.titleBn.trim()) {
      return res.status(400).json({ success: false, code: 'REQUIRED_FIELD_BN', error: 'দলিলের বাংলা শিরোনাম আবশ্যক' });
    }
    if (!body.titleEn || !body.titleEn.trim()) {
      return res.status(400).json({ success: false, code: 'REQUIRED_FIELD_EN', error: 'Document English title is required' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'দলিলের ফাইল আপলোড করা আবশ্যক।' });
    }

    const visibility = body.visibility === 'ADMIN_ONLY' ? 'ADMIN_ONLY' : 'PUBLIC';
    let uploaded;

    if (visibility === 'ADMIN_ONLY') {
      uploaded = await uploadPrivateFile({
        buffer: req.file.buffer,
        directory: 'documents/private',
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
      });
    } else {
      uploaded = await uploadPublicFile({
        buffer: req.file.buffer,
        directory: 'documents/public',
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
      });
    }

    const doc = await prisma.document.create({
      data: {
        titleBn: body.titleBn.trim(),
        titleEn: body.titleEn ? body.titleEn.trim() : null,
        category: body.category || 'DEED',
        documentNo: body.documentNo ? body.documentNo.trim() : null,
        documentDate: body.documentDate ? new Date(body.documentDate) : null,
        descriptionBn: body.descriptionBn ? body.descriptionBn.trim() : null,
        descriptionEn: body.descriptionEn ? body.descriptionEn.trim() : null,
        filePath: uploaded.path,
        fileMime: req.file.mimetype,
        fileSize: req.file.size,
        visibility,
        uploadedById: req.user?.id || null,
      },
    });

    await logActivity({
      req,
      action: 'CREATED',
      subjectType: 'Document',
      subjectId: doc.id,
      description: `নতুন দলিল নথি '${doc.titleBn}' (${doc.visibility}) সংরক্ষণ করা হয়েছে।`,
    });

    return res.status(201).json({ success: true, document: doc });
  } catch (err) {
    next(err);
  }
}

export async function updateDocument(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const body = req.body;

    const updated = await prisma.document.update({
      where: { id },
      data: {
        titleBn: body.titleBn ? body.titleBn.trim() : undefined,
        titleEn: body.titleEn !== undefined ? (body.titleEn ? body.titleEn.trim() : null) : undefined,
        category: body.category || undefined,
        documentNo: body.documentNo !== undefined ? (body.documentNo ? body.documentNo.trim() : null) : undefined,
        documentDate: body.documentDate ? new Date(body.documentDate) : undefined,
        descriptionBn: body.descriptionBn !== undefined ? (body.descriptionBn ? body.descriptionBn.trim() : null) : undefined,
        visibility: body.visibility || undefined,
      },
    });

    await logActivity({
      req,
      action: 'UPDATED',
      subjectType: 'Document',
      subjectId: id,
      description: `দলিল নথি '${updated.titleBn}' আপডেট করা হয়েছে।`,
    });

    return res.status(200).json({ success: true, document: updated });
  } catch (err) {
    next(err);
  }
}

export async function deleteDocument(req, res, next) {
  try {
    // EDITOR cannot delete documents — only ADMIN can
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'শুধুমাত্র অ্যাডমিন দলিল মুছে ফেলতে পারেন।' });
    }

    const result = await permanentlyDeleteEntity({
      type: 'Document',
      id: req.params.id,
      req,
      getDescription: (existing) => `দলিল '${existing.titleBn}' ডাটাবেজ থেকে স্থায়ীভাবে মুছে ফেলা হয়েছে।`,
    });
    if (result.notFound) {
      return res.status(404).json({ success: false, error: result.notFoundMessage });
    }

    return res.status(200).json({ success: true, message: 'দলিল ডাটাবেজ থেকে স্থায়ীভাবে মুছে ফেলা হয়েছে।' });
  } catch (err) {
    next(err);
  }
}

export async function getDocumentSignedUrl(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const doc = await prisma.document.findUnique({ where: { id } });
    if (!doc) return res.status(404).json({ success: false, error: 'দলিল পাওয়া যায়নি।' });

    if (doc.visibility === 'PUBLIC') {
      return res.status(200).json({ success: true, downloadUrl: doc.filePath });
    }

    // Generate signed download URL for private document (valid 15 minutes)
    const downloadUrl = await getPrivateSignedDownloadUrl(doc.filePath, 900);
    return res.status(200).json({ success: true, downloadUrl });
  } catch (err) {
    next(err);
  }
}

// ==============================================================================
// 7. LAND MAPS MANAGEMENT
// ==============================================================================
export async function getLandMaps(req, res, next) {
  try {
    const landMaps = await prisma.landMap.findMany({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { id: 'desc' }],
    });
    return res.status(200).json({ success: true, landMaps });
  } catch (err) {
    next(err);
  }
}

export async function createLandMap(req, res, next) {
  try {
    const body = req.body;
    if (!body.titleBn || !body.titleBn.trim()) {
      return res.status(400).json({ success: false, code: 'REQUIRED_FIELD_BN', error: 'মৌজা নকশার বাংলা নাম আবশ্যক' });
    }
    if (!body.titleEn || !body.titleEn.trim()) {
      return res.status(400).json({ success: false, code: 'REQUIRED_FIELD_EN', error: 'Land map English title is required' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'মৌজা নকশার ফাইল প্রদান আবশ্যক।' });
    }

    const uploaded = await uploadPublicFile({
      buffer: req.file.buffer,
      directory: 'land-maps',
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
    });

    const map = await prisma.landMap.create({
      data: {
        titleBn: body.titleBn.trim(),
        titleEn: body.titleEn ? body.titleEn.trim() : null,
        descriptionBn: body.descriptionBn ? body.descriptionBn.trim() : null,
        descriptionEn: body.descriptionEn ? body.descriptionEn.trim() : null,
        surveyType: body.surveyType || 'CS',
        dagKhatianInfo: body.dagKhatianInfo ? body.dagKhatianInfo.trim() : null,
        mapDate: body.mapDate ? new Date(body.mapDate) : null,
        filePath: uploaded.path,
        fileType: req.file.mimetype.includes('pdf') ? 'PDF' : 'IMAGE',
        fileSize: req.file.size,
        sortOrder: body.sortOrder ? parseInt(body.sortOrder, 10) : 0,
        isPublished: body.isPublished !== false && body.isPublished !== 'false',
      },
    });

    await logActivity({
      req,
      action: 'CREATED',
      subjectType: 'LandMap',
      subjectId: map.id,
      description: `নতুন মৌজা নকশা '${map.titleBn}' যোগ করা হয়েছে।`,
    });

    return res.status(201).json({ success: true, landMap: map });
  } catch (err) {
    next(err);
  }
}

export async function updateLandMap(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const body = req.body;

    const updated = await prisma.landMap.update({
      where: { id },
      data: {
        titleBn: body.titleBn ? body.titleBn.trim() : undefined,
        titleEn: body.titleEn !== undefined ? (body.titleEn ? body.titleEn.trim() : null) : undefined,
        descriptionBn: body.descriptionBn !== undefined ? (body.descriptionBn ? body.descriptionBn.trim() : null) : undefined,
        surveyType: body.surveyType || undefined,
        dagKhatianInfo: body.dagKhatianInfo !== undefined ? body.dagKhatianInfo.trim() : undefined,
        mapDate: body.mapDate ? new Date(body.mapDate) : undefined,
        sortOrder: body.sortOrder !== undefined ? parseInt(body.sortOrder, 10) : undefined,
        isPublished: body.isPublished !== undefined ? (body.isPublished !== false && body.isPublished !== 'false') : undefined,
      },
    });

    await logActivity({
      req,
      action: 'UPDATED',
      subjectType: 'LandMap',
      subjectId: id,
      description: `মৌজা নকশা '${updated.titleBn}' আপডেট করা হয়েছে।`,
    });

    return res.status(200).json({ success: true, landMap: updated });
  } catch (err) {
    next(err);
  }
}

export async function deleteLandMap(req, res, next) {
  try {
    const result = await permanentlyDeleteEntity({
      type: 'LandMap',
      id: req.params.id,
      req,
      getDescription: (existing) => `মৌজা নকশা '${existing.titleBn}' ডাটাবেজ থেকে স্থায়ীভাবে মুছে ফেলা হয়েছে।`,
    });
    if (result.notFound) {
      return res.status(404).json({ success: false, error: result.notFoundMessage });
    }

    return res.status(200).json({ success: true, message: 'নকশা ডাটাবেজ থেকে স্থায়ীভাবে মুছে ফেলা হয়েছে।' });
  } catch (err) {
    next(err);
  }
}

// ==============================================================================
// 8. NOTICES MANAGEMENT
// ==============================================================================
export async function getNotices(req, res, next) {
  try {
    const q = (req.query.q || '').trim();
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '15', 10)));
    const skip = (page - 1) * limit;

    const where = { deletedAt: null };
    if (q) {
      where.OR = [
        { titleBn: { contains: q, mode: 'insensitive' } },
        { titleEn: { contains: q, mode: 'insensitive' } },
        { bodyBn: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, notices] = await Promise.all([
      prisma.notice.count({ where }),
      prisma.notice.findMany({
        where,
        orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }, { id: 'desc' }],
        skip,
        take: limit,
      }),
    ]);

    return res.status(200).json({
      success: true,
      notices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function createNotice(req, res, next) {
  try {
    const body = req.body;

    if (!body.titleBn || !body.titleBn.trim()) {
      return res.status(400).json({ success: false, code: 'REQUIRED_FIELD_BN', error: 'নোটিশের বাংলা শিরোনাম আবশ্যক' });
    }
    if (!body.titleEn || !body.titleEn.trim()) {
      return res.status(400).json({ success: false, code: 'REQUIRED_FIELD_EN', error: 'Notice English title is required' });
    }
    if (!body.bodyBn || !body.bodyBn.trim()) {
      return res.status(400).json({ success: false, code: 'REQUIRED_FIELD_BN', error: 'নোটিশের মূল বিবরণ আবশ্যক' });
    }

    let attachmentPath = null;

    if (req.file) {
      const uploaded = await uploadPublicFile({
        buffer: req.file.buffer,
        directory: 'notices',
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
      });
      attachmentPath = uploaded.path;
    }

    const slug = body.slug ? body.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') : `notice-${Date.now()}`;

    const notice = await prisma.notice.create({
      data: {
        titleBn: body.titleBn.trim(),
        titleEn: body.titleEn ? body.titleEn.trim() : null,
        slug,
        bodyBn: body.bodyBn.trim(),
        bodyEn: body.bodyEn ? body.bodyEn.trim() : null,
        publishedAt: body.publishedAt ? new Date(body.publishedAt) : new Date(),
        isPinned: body.isPinned === true || body.isPinned === 'true' || body.isPinned === '1',
        isPublished: body.isPublished !== false && body.isPublished !== 'false',
        attachmentPath,
        createdById: req.user?.id || null,
      },
    });

    await logActivity({
      req,
      action: 'CREATED',
      subjectType: 'Notice',
      subjectId: notice.id,
      description: `নতুন নোটিশ '${notice.titleBn}' প্রকাশ করা হয়েছে।`,
    });

    return res.status(201).json({ success: true, notice });
  } catch (err) {
    next(err);
  }
}

export async function updateNotice(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const body = req.body;
    const existing = await prisma.notice.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, error: 'নোটিশ পাওয়া যায়নি।' });

    let attachmentPath = existing.attachmentPath;
    if (req.file) {
      const uploaded = await uploadPublicFile({
        buffer: req.file.buffer,
        directory: 'notices',
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
      });
      attachmentPath = uploaded.path;
    } else if (body.removeAttachment === 'true' || body.removeAttachment === true) {
      attachmentPath = null;
    }

    const updated = await prisma.notice.update({
      where: { id },
      data: {
        titleBn: body.titleBn ? body.titleBn.trim() : undefined,
        titleEn: body.titleEn !== undefined ? (body.titleEn ? body.titleEn.trim() : null) : undefined,
        bodyBn: body.bodyBn ? body.bodyBn.trim() : undefined,
        bodyEn: body.bodyEn !== undefined ? (body.bodyEn ? body.bodyEn.trim() : null) : undefined,
        publishedAt: body.publishedAt ? new Date(body.publishedAt) : undefined,
        isPinned: body.isPinned !== undefined ? (body.isPinned === true || body.isPinned === 'true' || body.isPinned === '1') : undefined,
        isPublished: body.isPublished !== undefined ? (body.isPublished !== false && body.isPublished !== 'false') : undefined,
        attachmentPath,
      },
    });

    await logActivity({
      req,
      action: 'UPDATED',
      subjectType: 'Notice',
      subjectId: id,
      description: `নোটিশ '${updated.titleBn}' আপডেট করা হয়েছে।`,
    });

    return res.status(200).json({ success: true, notice: updated });
  } catch (err) {
    next(err);
  }
}

export async function deleteNotice(req, res, next) {
  try {
    const result = await permanentlyDeleteEntity({
      type: 'Notice',
      id: req.params.id,
      req,
      getDescription: (existing) => `নোটিশ '${existing.titleBn}' ডাটাবেজ থেকে স্থায়ীভাবে মুছে ফেলা হয়েছে।`,
    });
    if (result.notFound) {
      return res.status(404).json({ success: false, error: result.notFoundMessage });
    }

    return res.status(200).json({ success: true, message: 'নোটিশ ডাটাবেজ থেকে স্থায়ীভাবে মুছে ফেলা হয়েছে।' });
  } catch (err) {
    next(err);
  }
}

// ==============================================================================
// 9. DESIGNS & 3D VIDEO MANAGEMENT
// ==============================================================================
export async function getDesigns(req, res, next) {
  try {
    const [designs, video] = await Promise.all([
      prisma.design.findMany({
        where: { deletedAt: null },
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      }),
      prisma.designVideo.findFirst({
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      }),
    ]);
    return res.status(200).json({ success: true, designs, video });
  } catch (err) {
    next(err);
  }
}

export async function updateDesign(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const body = req.body;
    let path;
    let thumbPath;

    if (req.file) {
      const processed = await processAndUploadImage({
        buffer: req.file.buffer,
        directory: 'designs',
        maxWidth: 2400,
        maxHeight: 1800,
      });
      path = processed.path;
      thumbPath = processed.thumbPath;
    }

    const updated = await prisma.design.update({
      where: { id },
      data: {
        captionBn: body.captionBn ? body.captionBn.trim() : undefined,
        captionEn: body.captionEn !== undefined ? (body.captionEn ? body.captionEn.trim() : null) : undefined,
        sortOrder: body.sortOrder !== undefined ? parseInt(body.sortOrder, 10) : undefined,
        isPublished: body.isPublished !== undefined ? (body.isPublished !== false && body.isPublished !== 'false') : undefined,
        path: path || undefined,
        thumbPath: thumbPath || undefined,
      },
    });

    await logActivity({
      req,
      action: 'UPDATED',
      subjectType: 'Design',
      subjectId: id,
      description: `৩ডি নকশা '${updated.captionBn}' আপডেট করা হয়েছে।`,
    });

    return res.status(200).json({ success: true, design: updated });
  } catch (err) {
    next(err);
  }
}

export async function updateDesignVideo(req, res, next) {
  try {
    const { titleBn, titleEn, type, url, isPublished } = req.body;

    const existing = await prisma.designVideo.findFirst();
    let video;

    if (existing) {
      video = await prisma.designVideo.update({
        where: { id: existing.id },
        data: {
          titleBn: titleBn ? titleBn.trim() : existing.titleBn,
          titleEn: titleEn !== undefined ? (titleEn ? titleEn.trim() : null) : existing.titleEn,
          type: type || existing.type,
          url: url !== undefined ? (url ? url.trim() : null) : existing.url,
          isPublished: isPublished !== undefined ? (isPublished !== false && isPublished !== 'false') : existing.isPublished,
        },
      });
    } else {
      video = await prisma.designVideo.create({
        data: {
          titleBn: titleBn ? titleBn.trim() : 'প্রস্তাবিত ৩ডি স্থাপত্য ভিডিও',
          titleEn: titleEn ? titleEn.trim() : null,
          type: type || 'YOUTUBE',
          url: url ? url.trim() : null,
          isPublished: isPublished !== false && isPublished !== 'false',
        },
      });
    }

    await logActivity({
      req,
      action: 'UPDATED',
      subjectType: 'DesignVideo',
      subjectId: video.id,
      description: `৩ডি ভিডিও তথ্য আপডেট করা হয়েছে।`,
    });

    return res.status(200).json({ success: true, video });
  } catch (err) {
    next(err);
  }
}

// ==============================================================================
// 10. SITE SETTINGS MANAGEMENT
// ==============================================================================
export async function getSettings(req, res, next) {
  try {
    const settings = await prisma.siteSetting.findMany({
      orderBy: [{ group: 'asc' }, { id: 'asc' }],
    });
    return res.status(200).json({ success: true, settings });
  } catch (err) {
    next(err);
  }
}

export async function updateSettings(req, res, next) {
  try {
    const { settings } = req.body;
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ success: false, error: 'সেটিংসের অবজেক্ট প্রদান করুন।' });
    }

    for (const [key, val] of Object.entries(settings)) {
      const valueBn = typeof val === 'object' && val !== null ? val.valueBn : String(val);
      const valueEn = typeof val === 'object' && val !== null ? val.valueEn : null;

      await prisma.siteSetting.upsert({
        where: { key },
        update: {
          valueBn: valueBn !== undefined ? valueBn : null,
          valueEn: valueEn !== undefined ? valueEn : null,
        },
        create: {
          key,
          valueBn: valueBn !== undefined ? valueBn : null,
          valueEn: valueEn !== undefined ? valueEn : null,
        },
      });
    }

    SettingsService.clearCache();

    await logActivity({
      req,
      action: 'UPDATED',
      subjectType: 'SiteSetting',
      description: `ওয়েবসাইট সেটিংস পরিবর্তন ও সংরক্ষণ করা হয়েছে।`,
    });

    return res.status(200).json({ success: true, message: 'সেটিংস সফলভাবে আপডেট হয়েছে।' });
  } catch (err) {
    next(err);
  }
}

export async function uploadHeroImageSetting(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'অনুগ্রহ করে একটি হিরো ছবি নির্বাচন করুন।' });
    }

    const existing = await prisma.siteSetting.findUnique({ where: { key: 'hero_image' } });
    const processed = await processAndUploadImage({
      buffer: req.file.buffer,
      directory: 'settings',
      maxWidth: 1600,
      maxHeight: 1000,
      quality: 84,
      createThumb: false,
    });

    const newPath = processed.path;
    await prisma.siteSetting.upsert({
      where: { key: 'hero_image' },
      update: { valueBn: newPath, valueEn: newPath, type: 'image', group: 'general' },
      create: { key: 'hero_image', valueBn: newPath, valueEn: newPath, type: 'image', group: 'general' },
    });

    if (existing?.valueBn && existing.valueBn !== newPath) {
      await cleanupPublicMedia(existing.valueBn).catch(() => {});
    }

    SettingsService.clearCache();

    await logActivity({
      req,
      action: 'UPDATED',
      subjectType: 'SiteSetting',
      description: `হিরো ব্যাকগ্রাউন্ড ছবি আপলোড ও পরিবর্তন করা হয়েছে (${newPath})।`,
    });

    return res.status(200).json({
      success: true,
      path: newPath,
      fullUrl: processed.fullUrl,
      message: 'হিরো ছবি সফলভাবে আপলোড হয়েছে।',
    });
  } catch (err) {
    next(err);
  }
}

// ==============================================================================
// 11. USERS MANAGEMENT (ADMIN ONLY)
// ==============================================================================
export async function getUsers(req, res, next) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { id: 'asc' },
    });
    return res.status(200).json({ success: true, users });
  } catch (err) {
    next(err);
  }
}

export async function createUser(req, res, next) {
  try {
    const { email, password, name, role } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ success: false, error: 'নাম, ইমেইল ও পাসওয়ার্ড পূরণ আবশ্যক।' });
    }

    if (password.length < 10) {
      return res.status(400).json({ success: false, error: 'পাসওয়ার্ড কমপক্ষে ১০ অক্ষরের হতে হবে।' });
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existing) {
      return res.status(400).json({ success: false, error: 'এই ইমেইলটি ইতিমধ্যে ব্যবহৃত হচ্ছে।' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        name: name.trim(),
        role: role === 'ADMIN' ? 'ADMIN' : 'EDITOR',
        mustChangePassword: true,
        isActive: true,
      },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });

    await logActivity({
      req,
      action: 'CREATED',
      subjectType: 'User',
      subjectId: user.id,
      description: `নতুন ব্যবহারকারী '${user.name}' (${user.role}) যোগ করা হয়েছে।`,
    });

    return res.status(201).json({ success: true, user });
  } catch (err) {
    next(err);
  }
}

export async function updateUser(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, role, isActive } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        name: name ? name.trim() : undefined,
        role: role || undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });

    await logActivity({
      req,
      action: 'UPDATED',
      subjectType: 'User',
      subjectId: id,
      description: `ব্যবহারকারী '${user.name}' এর তথ্য আপডেট করা হয়েছে।`,
    });

    return res.status(200).json({ success: true, user });
  } catch (err) {
    next(err);
  }
}

export async function resetUserPassword(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 10) {
      return res.status(400).json({ success: false, error: 'নতুন পাসওয়ার্ড কমপক্ষে ১০ অক্ষরের হতে হবে।' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
        mustChangePassword: true,
      },
    });

    await logActivity({
      req,
      action: 'UPDATED',
      subjectType: 'User',
      subjectId: id,
      description: `ব্যবহারকারীর পাসওয়ার্ড অ্যাডমিন দ্বারা রিসেট করা হয়েছে।`,
    });

    return res.status(200).json({ success: true, message: 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে।' });
  } catch (err) {
    next(err);
  }
}

export async function deleteUser(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (id === req.user?.id) {
      return res.status(400).json({ success: false, error: 'নিজের অ্যাকাউন্ট মুছে ফেলা সম্ভব নয়।' });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ success: false, error: 'ব্যবহারকারী পাওয়া যায়নি।' });

    await prisma.user.delete({ where: { id } });

    await logActivity({
      req,
      action: 'DELETED',
      subjectType: 'User',
      subjectId: id,
      description: `ব্যবহারকারী অ্যাকাউন্ট '${user.email}' স্থায়ীভাবে মুছে ফেলা হয়েছে।`,
    });

    return res.status(200).json({ success: true, message: 'ব্যবহারকারী মুছে ফেলা হয়েছে।' });
  } catch (err) {
    next(err);
  }
}

// ==============================================================================
// 12. TRASH SYSTEM (RESTORE & PERMANENT DELETE)
// ==============================================================================
export async function getTrashItems(req, res, next) {
  try {
    const [members, donors, committee, albums, photos, documents, landMaps, notices, designs, landDonors, mapPlaces, routeGuides] =
      await Promise.all([
        prisma.member.findMany({ where: { deletedAt: { not: null } }, take: 50 }),
        prisma.donor.findMany({ where: { deletedAt: { not: null } }, take: 50 }),
        prisma.committeeMember.findMany({ where: { deletedAt: { not: null } }, take: 50 }),
        prisma.album.findMany({ where: { deletedAt: { not: null } }, take: 50 }),
        prisma.photo.findMany({ where: { deletedAt: { not: null } }, take: 50 }),
        prisma.document.findMany({ where: { deletedAt: { not: null } }, take: 50 }),
        prisma.landMap.findMany({ where: { deletedAt: { not: null } }, take: 50 }),
        prisma.notice.findMany({ where: { deletedAt: { not: null } }, take: 50 }),
        prisma.design.findMany({ where: { deletedAt: { not: null } }, take: 50 }),
        prisma.landDonor.findMany({ where: { deletedAt: { not: null } }, take: 50 }),
        prisma.mapPlace.findMany({ where: { deletedAt: { not: null } }, take: 50 }).catch(() => []),
        prisma.routeGuide.findMany({ where: { deletedAt: { not: null } }, take: 50 }).catch(() => []),
      ]);

    const formatted = [
      ...members.map((m) => ({ type: 'Member', id: m.id, title: m.nameBn, deletedAt: m.deletedAt })),
      ...donors.map((d) => ({ type: 'Donor', id: d.id, title: `${d.donorNameBn} (${d.amount} ৳)`, deletedAt: d.deletedAt })),
      ...committee.map((c) => ({ type: 'CommitteeMember', id: c.id, title: `${c.nameBn} (${c.designationBn})`, deletedAt: c.deletedAt })),
      ...albums.map((a) => ({ type: 'Album', id: a.id, title: a.titleBn, deletedAt: a.deletedAt })),
      ...photos.map((p) => ({ type: 'Photo', id: p.id, title: p.captionBn || p.originalName || 'ছবি', deletedAt: p.deletedAt })),
      ...documents.map((d) => ({ type: 'Document', id: d.id, title: d.titleBn, deletedAt: d.deletedAt })),
      ...landMaps.map((l) => ({ type: 'LandMap', id: l.id, title: l.titleBn, deletedAt: l.deletedAt })),
      ...notices.map((n) => ({ type: 'Notice', id: n.id, title: n.titleBn, deletedAt: n.deletedAt })),
      ...designs.map((ds) => ({ type: 'Design', id: ds.id, title: ds.captionBn || '৩ডি নকশা', deletedAt: ds.deletedAt })),
      ...landDonors.map((ld) => ({ type: 'LandDonor', id: ld.id, title: `${ld.nameBn} (${ld.areaValue} ${ld.areaUnit})`, deletedAt: ld.deletedAt })),
      ...mapPlaces.map((mp) => ({ type: 'MapPlace', id: mp.id, title: mp.nameBn, deletedAt: mp.deletedAt })),
      ...routeGuides.map((rg) => ({ type: 'RouteGuide', id: rg.id, title: rg.fromNameBn, deletedAt: rg.deletedAt })),
    ].sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt));

    return res.status(200).json({ success: true, items: formatted });
  } catch (err) {
    next(err);
  }
}

export async function restoreTrashItem(req, res, next) {
  try {
    const { type, id } = req.body;
    const numericId = parseInt(id, 10);

    const modelMap = {
      Member: prisma.member,
      Donor: prisma.donor,
      CommitteeMember: prisma.committeeMember,
      Album: prisma.album,
      Photo: prisma.photo,
      Document: prisma.document,
      LandMap: prisma.landMap,
      Notice: prisma.notice,
      Design: prisma.design,
      LandDonor: prisma.landDonor,
    };

    const model = modelMap[type];
    if (!model) return res.status(400).json({ success: false, error: 'ভুল আইটেম ধরন।' });

    await model.update({
      where: { id: numericId },
      data: { deletedAt: null },
    });

    await logActivity({
      req,
      action: 'RESTORED',
      subjectType: type,
      subjectId: numericId,
      description: `ট্র্যাশ থেকে '${type} #${numericId}' সফলভাবে পুনরুদ্ধার করা হয়েছে।`,
    });

    return res.status(200).json({ success: true, message: 'আইটেম সফলভাবে পুনরুদ্ধার হয়েছে।' });
  } catch (err) {
    next(err);
  }
}

export async function permanentDeleteTrashItem(req, res, next) {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'শুধুমাত্র অ্যাডমিন স্থায়ীভাবে মুছে ফেলতে পারেন।' });
    }

    const { type, id, confirmation } = req.body;
    if (confirmation !== 'DELETE') {
      return res.status(400).json({ success: false, error: 'নিশ্চিতকরণের জন্য DELETE শব্দটি লিখুন।' });
    }

    const result = await permanentlyDeleteEntity({
      type,
      id,
      req,
      action: 'PERMANENT_DELETE',
      getDescription: (_existing, numericId) => `'${type} #${numericId}' স্থায়ীভাবে ডাটাবেজ থেকে মুছে ফেলা হয়েছে।`,
    });
    if (result.invalidType) {
      return res.status(400).json({ success: false, error: 'ভুল আইটেম ধরন।' });
    }
    if (result.notFound) {
      return res.status(404).json({ success: false, error: result.notFoundMessage || 'আইটেম পাওয়া যায়নি।' });
    }

    return res.status(200).json({ success: true, message: 'আইটেম স্থায়ীভাবে মুছে ফেলা হয়েছে।' });
  } catch (err) {
    next(err);
  }
}

// ==============================================================================
// 13. ACTIVITY LOGS & BACKUP
// ==============================================================================
export async function getActivityLogs(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '20', 10)));
    const skip = (page - 1) * limit;

    const [total, logs] = await Promise.all([
      prisma.activityLog.count(),
      prisma.activityLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: { select: { name: true, email: true, role: true } },
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getDatabaseBackup(req, res, next) {
  try {
    // ADMIN ONLY check
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'শুধুমাত্র অ্যাডমিন ব্যাকআপ ডাউনলোড করতে পারেন।' });
    }

    const [
      members,
      donors,
      committee,
      albums,
      photos,
      documents,
      landMaps,
      notices,
      designs,
      designVideos,
      landDonors,
      mapPlaces,
      routeGuides,
      settings,
      activityLogs,
      users,
    ] = await Promise.all([
      prisma.member.findMany(),
      prisma.donor.findMany(),
      prisma.committeeMember.findMany(),
      prisma.album.findMany(),
      prisma.photo.findMany(),
      prisma.document.findMany(),
      prisma.landMap.findMany(),
      prisma.notice.findMany(),
      prisma.design.findMany(),
      prisma.designVideo.findMany(),
      prisma.landDonor.findMany(),
      prisma.mapPlace.findMany().catch(() => []),
      prisma.routeGuide.findMany().catch(() => []),
      prisma.siteSetting.findMany(),
      prisma.activityLog.findMany({ orderBy: { createdAt: 'desc' }, take: 1000 }),
      prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true } }),
    ]);

    const backupData = {
      meta: {
        site: 'Manikpur Eidgah',
        exportedAt: new Date().toISOString(),
        exportedBy: req.user.email,
        version: '1.2.0',
      },
      data: {
        members,
        donors,
        committee,
        albums,
        photos,
        documents,
        landMaps,
        notices,
        designs,
        designVideos,
        landDonors,
        mapPlaces,
        routeGuides,
        settings,
        activityLogs,
        users,
      },
    };

    await logActivity({
      req,
      action: 'EXPORT',
      description: 'সম্পূর্ণ ডাটাবেজ ব্যাকআপ (JSON) ডাউনলোড করা হয়েছে।',
    });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=manikpur-eidgah-backup-${Date.now()}.json`);
    return res.send(JSON.stringify(backupData, null, 2));
  } catch (err) {
    next(err);
  }
}

export async function getMediaBackup(req, res, next) {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'শুধুমাত্র অ্যাডমিন মিডিয়া ব্যাকআপ ডাউনলোড করতে পারেন।' });
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=manikpur-eidgah-media-${Date.now()}.zip`);

    const archive = archiver('zip', { zlib: { level: 6 } });
    archive.on('error', (err) => {
      console.error('Media archive error:', err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: 'মিডিয়া জিপ তৈরি করতে সমস্যা হয়েছে।' });
      }
    });

    archive.pipe(res);
    await archiveAllMediaFiles(archive);
    await archive.finalize();

    await logActivity({
      req,
      action: 'EXPORT',
      description: 'সকল আপলোড করা ছবি ও দলিলের পূর্ণাঙ্গ ব্যাকআপ (ZIP) ডাউনলোড করা হয়েছে।',
    });
  } catch (err) {
    next(err);
  }
}

// ==============================================================================
// 12. MISSING TRANSLATIONS AUDIT REPORT
// ==============================================================================
export async function getMissingTranslationsReport(req, res, next) {
  try {
    const adminPath = process.env.VITE_ADMIN_PATH || 'eidgah-manage-k29x';
    const items = [];
    const breakdown = {
      members: 0,
      landDonors: 0,
      donors: 0,
      committee: 0,
      albums: 0,
      photos: 0,
      documents: 0,
      landMaps: 0,
      notices: 0,
      designs: 0,
    };

    const [
      members,
      landDonors,
      donors,
      committee,
      albums,
      photos,
      documents,
      landMaps,
      notices,
      designs,
    ] = await Promise.all([
      prisma.member.findMany({
        where: { deletedAt: null },
        select: { id: true, nameBn: true, nameEn: true, fatherNameBn: true, fatherNameEn: true, addressBn: true, addressEn: true },
      }),
      prisma.landDonor.findMany({
        where: { deletedAt: null },
        select: { id: true, nameBn: true, nameEn: true, fatherNameBn: true, fatherNameEn: true, villageBn: true, villageEn: true },
      }),
      prisma.donor.findMany({
        where: { deletedAt: null },
        select: { id: true, donorNameBn: true, donorNameEn: true, addressBn: true, addressEn: true },
      }),
      prisma.committeeMember.findMany({
        where: { deletedAt: null },
        select: { id: true, nameBn: true, nameEn: true, designationBn: true, designationEn: true },
      }),
      prisma.album.findMany({
        where: { deletedAt: null },
        select: { id: true, titleBn: true, titleEn: true, descriptionBn: true, descriptionEn: true },
      }),
      prisma.photo.findMany({
        where: { deletedAt: null },
        select: { id: true, captionBn: true, captionEn: true, albumId: true },
      }),
      prisma.document.findMany({
        where: { deletedAt: null },
        select: { id: true, titleBn: true, titleEn: true },
      }),
      prisma.landMap.findMany({
        where: { deletedAt: null },
        select: { id: true, titleBn: true, titleEn: true },
      }),
      prisma.notice.findMany({
        where: { deletedAt: null },
        select: { id: true, titleBn: true, titleEn: true, bodyBn: true, bodyEn: true },
      }),
      prisma.design.findMany({
        where: { deletedAt: null },
        select: { id: true, captionBn: true, captionEn: true },
      }),
    ]);

    // Check members
    for (const m of members) {
      const missing = [];
      if (!m.nameBn || !m.nameBn.trim()) missing.push('nameBn');
      if (!m.nameEn || !m.nameEn.trim()) missing.push('nameEn');
      if (m.fatherNameBn && (!m.fatherNameEn || !m.fatherNameEn.trim())) missing.push('fatherNameEn');
      if (m.addressBn && (!m.addressEn || !m.addressEn.trim())) missing.push('addressEn');
      if (missing.length > 0) {
        breakdown.members++;
        items.push({
          model: 'Member',
          modelLabelBn: 'আজীবন সদস্য',
          modelLabelEn: 'Lifetime Member',
          id: m.id,
          title: m.nameBn || m.nameEn || `সদস্য #${m.id}`,
          missingFields: missing,
          editUrl: `/${adminPath}/members`,
        });
      }
    }

    // Check landDonors
    for (const d of landDonors) {
      const missing = [];
      if (!d.nameBn || !d.nameBn.trim()) missing.push('nameBn');
      if (!d.nameEn || !d.nameEn.trim()) missing.push('nameEn');
      if (d.villageBn && (!d.villageEn || !d.villageEn.trim())) missing.push('villageEn');
      if (missing.length > 0) {
        breakdown.landDonors++;
        items.push({
          model: 'LandDonor',
          modelLabelBn: 'জমিদাতা',
          modelLabelEn: 'Land Donor',
          id: d.id,
          title: d.nameBn || d.nameEn || `জমিদাতা #${d.id}`,
          missingFields: missing,
          editUrl: `/${adminPath}/land-donors`,
        });
      }
    }

    // Check legacy donors
    for (const dn of donors) {
      const missing = [];
      if (!dn.donorNameBn || !dn.donorNameBn.trim()) missing.push('donorNameBn');
      if (!dn.donorNameEn || !dn.donorNameEn.trim()) missing.push('donorNameEn');
      if (missing.length > 0) {
        breakdown.donors++;
        items.push({
          model: 'Donor',
          modelLabelBn: 'অনুদানকারী (পুরনো)',
          modelLabelEn: 'Legacy Donor',
          id: dn.id,
          title: dn.donorNameBn || dn.donorNameEn || `অনুদান #${dn.id}`,
          missingFields: missing,
          editUrl: `/${adminPath}/donors`,
        });
      }
    }

    // Check committee
    for (const c of committee) {
      const missing = [];
      if (!c.nameBn || !c.nameBn.trim()) missing.push('nameBn');
      if (!c.nameEn || !c.nameEn.trim()) missing.push('nameEn');
      if (!c.designationBn || !c.designationBn.trim()) missing.push('designationBn');
      if (!c.designationEn || !c.designationEn.trim()) missing.push('designationEn');
      if (missing.length > 0) {
        breakdown.committee++;
        items.push({
          model: 'CommitteeMember',
          modelLabelBn: 'কমিটি সদস্য',
          modelLabelEn: 'Committee Member',
          id: c.id,
          title: c.nameBn || c.nameEn || `কমিটি #${c.id}`,
          missingFields: missing,
          editUrl: `/${adminPath}/committee`,
        });
      }
    }

    // Check albums
    for (const a of albums) {
      const missing = [];
      if (!a.titleBn || !a.titleBn.trim()) missing.push('titleBn');
      if (!a.titleEn || !a.titleEn.trim()) missing.push('titleEn');
      if (missing.length > 0) {
        breakdown.albums++;
        items.push({
          model: 'Album',
          modelLabelBn: 'ফটো অ্যালবাম',
          modelLabelEn: 'Photo Album',
          id: a.id,
          title: a.titleBn || a.titleEn || `অ্যালবাম #${a.id}`,
          missingFields: missing,
          editUrl: `/${adminPath}/gallery`,
        });
      }
    }

    // Check notices
    for (const n of notices) {
      const missing = [];
      if (!n.titleBn || !n.titleBn.trim()) missing.push('titleBn');
      if (!n.titleEn || !n.titleEn.trim()) missing.push('titleEn');
      if (n.bodyBn && (!n.bodyEn || !n.bodyEn.trim())) missing.push('bodyEn');
      if (missing.length > 0) {
        breakdown.notices++;
        items.push({
          model: 'Notice',
          modelLabelBn: 'নোটিশ',
          modelLabelEn: 'Notice',
          id: n.id,
          title: n.titleBn || n.titleEn || `নোটিশ #${n.id}`,
          missingFields: missing,
          editUrl: `/${adminPath}/notices`,
        });
      }
    }

    // Check documents
    for (const doc of documents) {
      const missing = [];
      if (!doc.titleBn || !doc.titleBn.trim()) missing.push('titleBn');
      if (!doc.titleEn || !doc.titleEn.trim()) missing.push('titleEn');
      if (missing.length > 0) {
        breakdown.documents++;
        items.push({
          model: 'Document',
          modelLabelBn: 'দলিল',
          modelLabelEn: 'Document',
          id: doc.id,
          title: doc.titleBn || doc.titleEn || `দলিল #${doc.id}`,
          missingFields: missing,
          editUrl: `/${adminPath}/documents`,
        });
      }
    }

    // Check landMaps
    for (const lm of landMaps) {
      const missing = [];
      if (!lm.titleBn || !lm.titleBn.trim()) missing.push('titleBn');
      if (!lm.titleEn || !lm.titleEn.trim()) missing.push('titleEn');
      if (missing.length > 0) {
        breakdown.landMaps++;
        items.push({
          model: 'LandMap',
          modelLabelBn: 'মৌজা নকশা',
          modelLabelEn: 'Land Map',
          id: lm.id,
          title: lm.titleBn || lm.titleEn || `নকশা #${lm.id}`,
          missingFields: missing,
          editUrl: `/${adminPath}/land-maps`,
        });
      }
    }

    // Check designs
    for (const d of designs) {
      const missing = [];
      if (!d.captionBn || !d.captionBn.trim()) missing.push('captionBn');
      if (!d.captionEn || !d.captionEn.trim()) missing.push('captionEn');
      if (missing.length > 0) {
        breakdown.designs++;
        items.push({
          model: 'Design',
          modelLabelBn: '৩ডি ডিজাইন',
          modelLabelEn: '3D Design',
          id: d.id,
          title: d.captionBn || d.captionEn || `ডিজাইন #${d.id}`,
          missingFields: missing,
          editUrl: `/${adminPath}/designs`,
        });
      }
    }

    return res.status(200).json({
      success: true,
      totalMissing: items.length,
      breakdown,
      items,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/name-review
 * Scans free-text content across all models to detect old organization names
 * for manual administrator review without auto-editing.
 */
export async function getNameReviewReport(req, res, next) {
  try {
    const adminPath = process.env.VITE_ADMIN_PATH || 'eidgah-manage-k29x';
    const OLD_PATTERNS = [
      /মানিকপুর\s*কেন্দ্রীয়\s*শাহী\s*ঈদগাহ/gi,
      /মানিকপুর\s*কেন্দ্রীয়\s*ঈদগাহ/gi,
      /কেন্দ্রীয়\s*শাহী\s*ঈদগাহ/gi,
      /কেন্দ্রীয়\s*শাহী/gi,
      /শাহী\s*ঈদগাহ/gi,
      /কেন্দ্রীয়\s*ঈদগাহ/gi,
      /Manikpur\s+Central\s+Shahi\s+Eidgah/gi,
      /Manikpur\s+Central\s+Eidgah/gi,
      /Central\s+Shahi\s+Eidgah/gi,
      /Central\s+Shahi/gi,
      /Shahi\s+Eidgah/gi,
    ];

    const findings = [];

    function checkText(text, model, id, title, fieldName, editUrl) {
      if (!text || typeof text !== 'string') return;
      for (const pattern of OLD_PATTERNS) {
        pattern.lastIndex = 0;
        const match = pattern.exec(text);
        if (match) {
          const start = Math.max(0, match.index - 40);
          const end = Math.min(text.length, match.index + match[0].length + 40);
          const snippet = (start > 0 ? '...' : '') + text.slice(start, end) + (end < text.length ? '...' : '');

          findings.push({
            model,
            id,
            title,
            fieldName,
            matchedText: match[0],
            snippet,
            editUrl,
          });
          break;
        }
      }
    }

    const [settings, notices, landDonors, committee, albums, documents, landMaps] = await Promise.all([
      prisma.siteSetting.findMany({ select: { id: true, key: true, valueBn: true, valueEn: true } }),
      prisma.notice.findMany({ where: { deletedAt: null }, select: { id: true, titleBn: true, titleEn: true, bodyBn: true, bodyEn: true } }),
      prisma.landDonor.findMany({ where: { deletedAt: null }, select: { id: true, nameBn: true, nameEn: true, storyBn: true, storyEn: true } }),
      prisma.committeeMember.findMany({ where: { deletedAt: null }, select: { id: true, nameBn: true, nameEn: true, bioBn: true, bioEn: true } }),
      prisma.album.findMany({ where: { deletedAt: null }, select: { id: true, titleBn: true, titleEn: true, descriptionBn: true, descriptionEn: true } }),
      prisma.document.findMany({ where: { deletedAt: null }, select: { id: true, titleBn: true, titleEn: true, descriptionBn: true, descriptionEn: true } }),
      prisma.landMap.findMany({ where: { deletedAt: null }, select: { id: true, titleBn: true, titleEn: true, descriptionBn: true, descriptionEn: true } }),
    ]);

    // Check Site Settings (excluding exact site_name which is migrated)
    for (const s of settings) {
      if (s.key === 'site_name' || s.key === 'eidgahNameBn' || s.key === 'eidgahNameEn') continue;
      checkText(s.valueBn, 'SiteSetting', s.id, `সেটিংস: ${s.key}`, 'valueBn', `/${adminPath}/settings`);
      checkText(s.valueEn, 'SiteSetting', s.id, `Setting: ${s.key}`, 'valueEn', `/${adminPath}/settings`);
    }

    // Check Notices
    for (const n of notices) {
      const t = n.titleBn || n.titleEn || `নোটিশ #${n.id}`;
      checkText(n.titleBn, 'Notice', n.id, t, 'titleBn', `/${adminPath}/notices`);
      checkText(n.titleEn, 'Notice', n.id, t, 'titleEn', `/${adminPath}/notices`);
      checkText(n.bodyBn, 'Notice', n.id, t, 'bodyBn', `/${adminPath}/notices`);
      checkText(n.bodyEn, 'Notice', n.id, t, 'bodyEn', `/${adminPath}/notices`);
    }

    // Check Land Donors
    for (const ld of landDonors) {
      const t = ld.nameBn || ld.nameEn || `জমিদাতা #${ld.id}`;
      checkText(ld.storyBn, 'LandDonor', ld.id, t, 'storyBn', `/${adminPath}/land-donors`);
      checkText(ld.storyEn, 'LandDonor', ld.id, t, 'storyEn', `/${adminPath}/land-donors`);
    }

    // Check Committee
    for (const c of committee) {
      const t = c.nameBn || c.nameEn || `কমিটি সদস্য #${c.id}`;
      checkText(c.bioBn, 'CommitteeMember', c.id, t, 'bioBn', `/${adminPath}/committee`);
      checkText(c.bioEn, 'CommitteeMember', c.id, t, 'bioEn', `/${adminPath}/committee`);
    }

    // Check Albums
    for (const a of albums) {
      const t = a.titleBn || a.titleEn || `অ্যালবাম #${a.id}`;
      checkText(a.descriptionBn, 'Album', a.id, t, 'descriptionBn', `/${adminPath}/albums`);
      checkText(a.descriptionEn, 'Album', a.id, t, 'descriptionEn', `/${adminPath}/albums`);
    }

    // Check Documents
    for (const d of documents) {
      const t = d.titleBn || d.titleEn || `দলিল #${d.id}`;
      checkText(d.descriptionBn, 'Document', d.id, t, 'descriptionBn', `/${adminPath}/documents`);
      checkText(d.descriptionEn, 'Document', d.id, t, 'descriptionEn', `/${adminPath}/documents`);
    }

    // Check Land Maps
    for (const lm of landMaps) {
      const t = lm.titleBn || lm.titleEn || `নকশা #${lm.id}`;
      checkText(lm.descriptionBn, 'LandMap', lm.id, t, 'descriptionBn', `/${adminPath}/land-maps`);
      checkText(lm.descriptionEn, 'LandMap', lm.id, t, 'descriptionEn', `/${adminPath}/land-maps`);
    }

    return res.status(200).json({
      success: true,
      count: findings.length,
      findings,
    });
  } catch (err) {
    next(err);
  }
}


