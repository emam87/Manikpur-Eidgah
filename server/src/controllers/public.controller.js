import { prisma } from '../db/prisma.js';
import { SettingsService } from '../services/settings.service.js';

/**
 * GET /api/public/home
 * Aggregated live data for public Home page
 */
export async function getHomeData(req, res, next) {
  try {
    const [
      membersCount,
      donorsCount,
      photosCount,
      albumsCount,
      latestNotices,
      featuredDesignImages,
      recentAlbums,
      committeeLeaders,
      featuredMembers,
    ] = await Promise.all([
      prisma.member.count({ where: { isActive: true, deletedAt: null } }).catch(() => 0),
      prisma.donor.count({ where: { deletedAt: null } }).catch(() => 0),
      prisma.photo.count({ where: { isPublished: true, deletedAt: null } }).catch(() => 0),
      prisma.album.count({ where: { isPublished: true, deletedAt: null } }).catch(() => 0),
      prisma.notice.findMany({
        where: { isPublished: true, deletedAt: null },
        orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }, { id: 'desc' }],
        take: 4,
        select: {
          id: true,
          titleBn: true,
          titleEn: true,
          slug: true,
          publishedAt: true,
          isPinned: true,
        },
      }).catch(() => []),
      prisma.design.findMany({
        where: { isPublished: true, deletedAt: null },
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        take: 3,
      }).catch(() => []),
      prisma.album.findMany({
        where: { isPublished: true, deletedAt: null },
        include: {
          coverPhoto: true,
          photos: {
            where: { isPublished: true, deletedAt: null },
            take: 1,
          },
          _count: {
            select: { photos: { where: { isPublished: true, deletedAt: null } } },
          },
        },
        orderBy: [{ year: 'desc' }, { sortOrder: 'asc' }, { id: 'desc' }],
        take: 4,
      }).catch(() => []),
      prisma.committeeMember.findMany({
        where: { isCurrent: true, isActive: true, deletedAt: null },
        orderBy: [{ level: 'asc' }, { sortOrder: 'asc' }, { id: 'asc' }],
        take: 4,
        select: {
          id: true,
          nameBn: true,
          nameEn: true,
          designationBn: true,
          designationEn: true,
          roleBn: true,
          roleEn: true,
          photoPath: true,
          level: true,
        },
      }).catch(() => []),
      // Strict Privacy Serialization for Members: Phone and NID are NEVER selected
      prisma.member.findMany({
        where: { isActive: true, deletedAt: null },
        orderBy: [{ sortOrder: 'asc' }, { membershipNo: 'asc' }],
        take: 3,
        select: {
          id: true,
          membershipNo: true,
          nameBn: true,
          nameEn: true,
          fatherNameBn: true,
          fatherNameEn: true,
          addressBn: true,
          addressEn: true,
          photoPath: true,
          memberSince: true,
          amountPaid: true,
          showAmount: true,
        },
      }).catch(() => []),
    ]);

    const globalShowAmount = await SettingsService.getValue('show_donation_amount', '1');
    const isAmountAllowed = globalShowAmount === '1' || globalShowAmount === 'true' || globalShowAmount === true;

    // Filter amount visibility strictly according to privacy rules
    const sanitizedMembers = featuredMembers.map((m) => ({
      ...m,
      amountPaid: isAmountAllowed && m.showAmount ? m.amountPaid : null,
    }));

    return res.status(200).json({
      success: true,
      stats: {
        members: membersCount,
        donors: donorsCount,
        photos: photosCount,
        albums: albumsCount,
      },
      latestNotices,
      featuredDesignImages,
      recentAlbums,
      committeeLeaders,
      featuredMembers: sanitizedMembers,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/public/settings
 * Public configuration and site settings map
 */
export async function getPublicSettings(req, res, next) {
  try {
    const settings = await SettingsService.getAll();
    return res.status(200).json({
      success: true,
      settings,
    });
  } catch (err) {
    next(err);
  }
}
