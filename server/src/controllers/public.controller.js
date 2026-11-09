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
      // Strict Privacy: phone and NID are NEVER selected
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

/**
 * GET /api/public/about
 * About & History, capacity, land area, and Managing Committee (Level 1 + Level 2 + Archives)
 */
export async function getAboutData(req, res, next) {
  try {
    const [currentMembers, archivedMembers, committeeTitleSetting] = await Promise.all([
      prisma.committeeMember.findMany({
        where: { isCurrent: true, isActive: true, deletedAt: null },
        orderBy: [{ level: 'asc' }, { sortOrder: 'asc' }, { id: 'asc' }],
        select: {
          id: true,
          level: true,
          nameBn: true,
          nameEn: true,
          designationBn: true,
          designationEn: true,
          roleBn: true,
          roleEn: true,
          addressBn: true,
          addressEn: true,
          photoPath: true,
          term: true,
          phone: true,
          showPhone: true,
          bioBn: true,
          bioEn: true,
        },
      }),
      prisma.committeeMember.findMany({
        where: { isCurrent: false, deletedAt: null },
        orderBy: [{ term: 'desc' }, { level: 'asc' }, { sortOrder: 'asc' }, { id: 'asc' }],
        select: {
          id: true,
          level: true,
          nameBn: true,
          nameEn: true,
          designationBn: true,
          designationEn: true,
          photoPath: true,
          term: true,
          termPeriod: true,
        },
      }),
      SettingsService.getValue('committee_title', 'সাত সদস্যবিশিষ্ট উন্নয়ন কমিটি'),
    ]);

    // Sanitize phone numbers: only expose phone if showPhone is true
    const sanitizedCurrent = currentMembers.map((m) => ({
      ...m,
      phone: m.showPhone ? m.phone : null,
    }));

    // Group archived members by term
    const archivedGroups = {};
    for (const m of archivedMembers) {
      const termKey = m.term || m.termPeriod || 'পূর্ববর্তী মেয়াদ';
      if (!archivedGroups[termKey]) {
        archivedGroups[termKey] = [];
      }
      archivedGroups[termKey].push(m);
    }

    return res.status(200).json({
      success: true,
      committeeTitle: committeeTitleSetting,
      level1: sanitizedCurrent.filter((m) => m.level === 1),
      level2: sanitizedCurrent.filter((m) => m.level === 2),
      otherLevels: sanitizedCurrent.filter((m) => m.level > 2),
      archivedCommittees: archivedGroups,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/public/members
 * Searchable, filterable lifetime members list
 */
export async function getMembers(req, res, next) {
  try {
    const q = (req.query.q || '').trim();
    const year = req.query.year ? parseInt(req.query.year, 10) : null;
    const sort = req.query.sort || 'membership_no';
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '12', 10)));
    const skip = (page - 1) * limit;

    const globalShowAmount = await SettingsService.getValue('show_donation_amount', '1');
    const isAmountAllowed = globalShowAmount === '1' || globalShowAmount === 'true' || globalShowAmount === true;

    const where = {
      isActive: true,
      deletedAt: null,
    };

    if (year && !isNaN(year)) {
      where.memberSince = year;
    }

    if (q) {
      where.OR = [
        { membershipNo: { contains: q, mode: 'insensitive' } },
        { nameBn: { contains: q, mode: 'insensitive' } },
        { nameEn: { contains: q, mode: 'insensitive' } },
        { fatherNameBn: { contains: q, mode: 'insensitive' } },
        { fatherNameEn: { contains: q, mode: 'insensitive' } },
        { addressBn: { contains: q, mode: 'insensitive' } },
        { addressEn: { contains: q, mode: 'insensitive' } },
      ];
    }

    let orderBy = [{ sortOrder: 'asc' }, { membershipNo: 'asc' }];
    if (sort === 'name') {
      orderBy = [{ nameBn: 'asc' }, { membershipNo: 'asc' }];
    } else if (sort === 'member_since') {
      orderBy = [{ memberSince: 'desc' }, { membershipNo: 'asc' }];
    } else if (sort === 'amount' && isAmountAllowed) {
      orderBy = [{ amountPaid: 'desc' }, { membershipNo: 'asc' }];
    }

    const [totalMembers, members, yearsData, totalPublicSum] = await Promise.all([
      prisma.member.count({ where }),
      // Privacy by Serialization: phone & nidNo are strictly excluded
      prisma.member.findMany({
        where,
        orderBy,
        skip,
        take: limit,
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
          sortOrder: true,
        },
      }),
      prisma.member.findMany({
        where: { isActive: true, deletedAt: null, memberSince: { not: null } },
        select: { memberSince: true },
        distinct: ['memberSince'],
        orderBy: { memberSince: 'desc' },
      }),
      isAmountAllowed
        ? prisma.member.aggregate({
            where: { isActive: true, deletedAt: null, showAmount: true },
            _sum: { amountPaid: true },
          })
        : Promise.resolve({ _sum: { amountPaid: 0 } }),
    ]);

    const sanitizedMembers = members.map((m) => ({
      ...m,
      amountPaid: isAmountAllowed && m.showAmount ? m.amountPaid : null,
    }));

    return res.status(200).json({
      success: true,
      members: sanitizedMembers,
      pagination: {
        page,
        limit,
        total: totalMembers,
        totalPages: Math.ceil(totalMembers / limit),
      },
      years: yearsData.map((y) => y.memberSince).filter(Boolean),
      globalShowAmount: isAmountAllowed,
      totalPublicAmount: isAmountAllowed ? totalPublicSum._sum.amountPaid || 0 : null,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/public/donors
 * Searchable, filterable donors ledger
 */
export async function getDonors(req, res, next) {
  try {
    const q = (req.query.q || '').trim();
    const purpose = (req.query.purpose || '').trim();
    const year = req.query.year ? parseInt(req.query.year, 10) : null;
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '15', 10)));
    const skip = (page - 1) * limit;

    const globalShowAmount = await SettingsService.getValue('show_donation_amount', '1');
    const isAmountAllowed = globalShowAmount === '1' || globalShowAmount === 'true' || globalShowAmount === true;

    const where = {
      deletedAt: null,
    };

    if (purpose) {
      where.purpose = purpose;
    }

    if (year && !isNaN(year)) {
      const start = new Date(`${year}-01-01T00:00:00.000Z`);
      const end = new Date(`${year}-12-31T23:59:59.999Z`);
      where.donationDate = { gte: start, lte: end };
    }

    if (q) {
      where.OR = [
        { donorNameBn: { contains: q, mode: 'insensitive' } },
        { donorNameEn: { contains: q, mode: 'insensitive' } },
        { addressBn: { contains: q, mode: 'insensitive' } },
        { addressEn: { contains: q, mode: 'insensitive' } },
        { receiptNo: { contains: q, mode: 'insensitive' } },
        { noteBn: { contains: q, mode: 'insensitive' } },
        { noteEn: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [totalRecords, donors, totalSumAggregate] = await Promise.all([
      prisma.donor.count({ where }),
      // Privacy by Serialization: phone is strictly excluded
      prisma.donor.findMany({
        where,
        orderBy: [{ donationDate: 'desc' }, { id: 'desc' }],
        skip,
        take: limit,
        select: {
          id: true,
          donorNameBn: true,
          donorNameEn: true,
          addressBn: true,
          addressEn: true,
          amount: true,
          donationDate: true,
          purpose: true,
          showAmount: true,
          receiptNo: true,
          noteBn: true,
          noteEn: true,
        },
      }),
      isAmountAllowed
        ? prisma.donor.aggregate({
            where: { ...where, showAmount: true },
            _sum: { amount: true },
          })
        : Promise.resolve({ _sum: { amount: 0 } }),
    ]);

    const sanitizedDonors = donors.map((d) => ({
      ...d,
      amount: isAmountAllowed && d.showAmount ? d.amount : null,
    }));

    return res.status(200).json({
      success: true,
      donors: sanitizedDonors,
      pagination: {
        page,
        limit,
        total: totalRecords,
        totalPages: Math.ceil(totalRecords / limit),
      },
      globalShowAmount: isAmountAllowed,
      totalVisibleAmount: isAmountAllowed ? totalSumAggregate._sum.amount || 0 : null,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/public/documents
 * Categorized archive of legal documents (PUBLIC visibility only)
 */
export async function getDocuments(req, res, next) {
  try {
    const category = (req.query.category || '').trim();
    const q = (req.query.q || '').trim();
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '12', 10)));
    const skip = (page - 1) * limit;

    // Strict: Only PUBLIC documents are served to public API
    const where = {
      visibility: 'PUBLIC',
      deletedAt: null,
    };

    if (category) {
      where.category = category;
    }

    if (q) {
      where.OR = [
        { titleBn: { contains: q, mode: 'insensitive' } },
        { titleEn: { contains: q, mode: 'insensitive' } },
        { documentNo: { contains: q, mode: 'insensitive' } },
        { descriptionBn: { contains: q, mode: 'insensitive' } },
        { descriptionEn: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, documents] = await Promise.all([
      prisma.document.count({ where }),
      prisma.document.findMany({
        where,
        orderBy: [{ documentDate: 'desc' }, { id: 'desc' }],
        skip,
        take: limit,
        select: {
          id: true,
          titleBn: true,
          titleEn: true,
          category: true,
          documentNo: true,
          documentDate: true,
          descriptionBn: true,
          descriptionEn: true,
          filePath: true,
          fileMime: true,
          fileSize: true,
          visibility: true,
        },
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

/**
 * GET /api/public/land-maps
 * Cadastral / Mouza land maps (CS, SA, RS, BS)
 */
export async function getLandMaps(req, res, next) {
  try {
    const landMaps = await prisma.landMap.findMany({
      where: { isPublished: true, deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { mapDate: 'desc' }, { id: 'desc' }],
    });

    return res.status(200).json({
      success: true,
      landMaps,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/public/notices
 * Published announcements and news
 */
export async function getNotices(req, res, next) {
  try {
    const q = (req.query.q || '').trim();
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '10', 10)));
    const skip = (page - 1) * limit;

    const where = {
      isPublished: true,
      deletedAt: null,
    };

    if (q) {
      where.OR = [
        { titleBn: { contains: q, mode: 'insensitive' } },
        { titleEn: { contains: q, mode: 'insensitive' } },
        { bodyBn: { contains: q, mode: 'insensitive' } },
        { bodyEn: { contains: q, mode: 'insensitive' } },
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

/**
 * GET /api/public/notices/:slug
 * Notice detail and recent notices sidebar
 */
export async function getNoticeBySlug(req, res, next) {
  try {
    const { slug } = req.params;

    const notice = await prisma.notice.findFirst({
      where: { slug, isPublished: true, deletedAt: null },
    });

    if (!notice) {
      return res.status(404).json({ success: false, error: 'নোটিশটি পাওয়া যায়নি।' });
    }

    const recentNotices = await prisma.notice.findMany({
      where: {
        id: { not: notice.id },
        isPublished: true,
        deletedAt: null,
      },
      orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }],
      take: 4,
      select: {
        id: true,
        titleBn: true,
        titleEn: true,
        slug: true,
        publishedAt: true,
      },
    });

    return res.status(200).json({
      success: true,
      notice,
      recentNotices,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/public/albums
 * Photo gallery folders with search, type tabs, year filter, photo count
 */
export async function getAlbums(req, res, next) {
  try {
    const q = (req.query.q || '').trim();
    const type = (req.query.type || '').trim();
    const year = req.query.year ? parseInt(req.query.year, 10) : null;
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '12', 10)));
    const skip = (page - 1) * limit;

    const where = {
      isPublished: true,
      deletedAt: null,
    };

    if (type && ['FITR', 'ADHA', 'OTHER'].includes(type)) {
      where.type = type;
    }

    if (year && !isNaN(year)) {
      where.year = year;
    }

    if (q) {
      where.OR = [
        { titleBn: { contains: q, mode: 'insensitive' } },
        { titleEn: { contains: q, mode: 'insensitive' } },
        { occasionNameBn: { contains: q, mode: 'insensitive' } },
        { occasionNameEn: { contains: q, mode: 'insensitive' } },
        { descriptionBn: { contains: q, mode: 'insensitive' } },
        { descriptionEn: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [totalAlbums, albums, yearsData] = await Promise.all([
      prisma.album.count({ where }),
      prisma.album.findMany({
        where,
        orderBy: [{ year: 'desc' }, { sortOrder: 'asc' }, { id: 'desc' }],
        skip,
        take: limit,
        include: {
          coverPhoto: true,
          photos: {
            where: { isPublished: true, deletedAt: null },
            take: 1,
            select: { path: true, thumbPath: true },
          },
          _count: {
            select: {
              photos: { where: { isPublished: true, deletedAt: null } },
            },
          },
        },
      }),
      prisma.album.findMany({
        where: { isPublished: true, deletedAt: null },
        select: { year: true },
        distinct: ['year'],
        orderBy: { year: 'desc' },
      }),
    ]);

    return res.status(200).json({
      success: true,
      albums,
      years: yearsData.map((y) => y.year),
      pagination: {
        page,
        limit,
        total: totalAlbums,
        totalPages: Math.ceil(totalAlbums / limit),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/public/albums/:slug
 * Folder details with all published photos and next/prev folders
 */
export async function getAlbumBySlug(req, res, next) {
  try {
    const { slug } = req.params;

    const album = await prisma.album.findFirst({
      where: { slug, isPublished: true, deletedAt: null },
      include: {
        coverPhoto: true,
        photos: {
          where: { isPublished: true, deletedAt: null },
          orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
          select: {
            id: true,
            path: true,
            thumbPath: true,
            captionBn: true,
            captionEn: true,
            width: true,
            height: true,
            fileSize: true,
          },
        },
      },
    });

    if (!album) {
      return res.status(404).json({ success: false, error: 'ফোল্ডারটি পাওয়া যায়নি।' });
    }

    // Previous and Next album navigation
    const [prevAlbum, nextAlbum] = await Promise.all([
      prisma.album.findFirst({
        where: {
          isPublished: true,
          deletedAt: null,
          OR: [
            { year: { lt: album.year } },
            { year: album.year, id: { lt: album.id } },
          ],
        },
        orderBy: [{ year: 'desc' }, { id: 'desc' }],
        select: { id: true, slug: true, titleBn: true, titleEn: true, year: true },
      }),
      prisma.album.findFirst({
        where: {
          isPublished: true,
          deletedAt: null,
          OR: [
            { year: { gt: album.year } },
            { year: album.year, id: { gt: album.id } },
          ],
        },
        orderBy: [{ year: 'asc' }, { id: 'asc' }],
        select: { id: true, slug: true, titleBn: true, titleEn: true, year: true },
      }),
    ]);

    return res.status(200).json({
      success: true,
      album,
      navigation: {
        prev: prevAlbum,
        next: nextAlbum,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/public/designs
 * Design & Plan 3D renders with captions and optional published video
 */
export async function getDesigns(req, res, next) {
  try {
    const [designs, video] = await Promise.all([
      prisma.design.findMany({
        where: { isPublished: true, deletedAt: null },
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      }),
      prisma.designVideo.findFirst({
        where: { isPublished: true },
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      }),
    ]);

    return res.status(200).json({
      success: true,
      designs,
      video,
    });
  } catch (err) {
    next(err);
  }
}
