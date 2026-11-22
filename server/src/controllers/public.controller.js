import { prisma } from '../db/prisma.js';
import { SettingsService } from '../services/settings.service.js';
import { serializePublicLandDonor } from '../utils/landDonorSerializer.js';

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
      landDonorsCount,
      landTotalAgg,
      featuredLandDonors,
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
      prisma.landDonor.count({ where: { isPublished: true, deletedAt: null } }).catch(() => 0),
      prisma.landDonor.aggregate({
        where: { isPublished: true, deletedAt: null },
        _sum: { areaInDecimal: true },
      }).catch(() => ({ _sum: { areaInDecimal: 0 } })),
      prisma.landDonor.findMany({
        where: { isPublished: true, deletedAt: null },
        orderBy: [{ sortOrder: 'asc' }, { donationYear: 'asc' }, { id: 'asc' }],
        take: 4,
        select: {
          id: true,
          nameBn: true,
          nameEn: true,
          fatherNameBn: true,
          fatherNameEn: true,
          villageBn: true,
          villageEn: true,
          photoPath: true,
          isDeceased: true,
          areaValue: true,
          areaUnit: true,
          areaInDecimal: true,
          donationYear: true,
          donationType: true,
          landUse: true,
        },
      }).catch(() => []),
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
        landDonors: landDonorsCount,
        totalLandDecimal: landTotalAgg._sum.areaInDecimal || 0,
        photos: photosCount,
        albums: albumsCount,
      },
      featuredLandDonors,
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
    const allSettings = await SettingsService.getAll();
    const settings = {};
    for (const [key, val] of Object.entries(allSettings || {})) {
      if (key.startsWith('map_') || key === 'boundary_geojson') continue;
      settings[key] = val;
    }
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
      SettingsService.getValue(
        'committee_title',
        req.query.lang === 'en' ? 'Seven-member Development Committee' : 'সাত সদস্যবিশিষ্ট উন্নয়ন কমিটি',
        req.query.lang === 'en' ? 'en' : 'bn'
      ),
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
      orderBy = req.query.lang === 'en' 
        ? [{ nameEn: 'asc' }, { membershipNo: 'asc' }]
        : [{ nameBn: 'asc' }, { membershipNo: 'asc' }];
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
 * GET /api/public/land-donors
 * Searchable, filterable land donors registry with strict privacy and visibility toggles
 */
export async function getLandDonors(req, res, next) {
  try {
    const q = (req.query.q || '').trim();
    const year = req.query.year ? parseInt(req.query.year, 10) : null;
    const landUse = (req.query.landUse || '').trim();
    const donationType = (req.query.donationType || '').trim();
    const mouza = (req.query.mouza || '').trim();
    const deceasedParam = req.query.isDeceased;
    const sort = req.query.sort || 'custom';
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '20', 10)));
    const skip = (page - 1) * limit;
    const isEn = req.query.lang === 'en';

    const andConditions = [];
    const where = {
      isPublished: true,
      deletedAt: null,
    };

    if (isEn) {
      andConditions.push({ nameEn: { not: null } }, { NOT: { nameEn: '' } });
    }

    if (year && !isNaN(year)) {
      where.donationYear = year;
    }
    if (landUse) {
      where.landUse = landUse;
    }
    if (donationType) {
      where.donationType = donationType;
    }
    if (mouza) {
      andConditions.push({
        showPlotDetails: true,
        OR: [
          { mouzaBn: { equals: mouza, mode: 'insensitive' } },
          { mouzaEn: { equals: mouza, mode: 'insensitive' } },
        ],
      });
    }
    if (deceasedParam === 'true') {
      where.isDeceased = true;
    } else if (deceasedParam === 'false') {
      where.isDeceased = false;
    }

    if (q) {
      andConditions.push({
        OR: [
          { nameBn: { contains: q, mode: 'insensitive' } },
          { nameEn: { contains: q, mode: 'insensitive' } },
          { fatherNameBn: { contains: q, mode: 'insensitive' } },
          { fatherNameEn: { contains: q, mode: 'insensitive' } },
          { motherNameBn: { contains: q, mode: 'insensitive' } },
          { motherNameEn: { contains: q, mode: 'insensitive' } },
          { villageBn: { contains: q, mode: 'insensitive' } },
          { villageEn: { contains: q, mode: 'insensitive' } },
          { AND: [{ showPlotDetails: true }, { mouzaBn: { contains: q, mode: 'insensitive' } }] },
          { AND: [{ showPlotDetails: true }, { mouzaEn: { contains: q, mode: 'insensitive' } }] },
        ],
      });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    let orderBy = [{ sortOrder: 'asc' }, { donationYear: 'asc' }, { id: 'asc' }];
    if (sort === 'name_asc') {
      orderBy = [{ [isEn ? 'nameEn' : 'nameBn']: 'asc' }];
    } else if (sort === 'name_desc') {
      orderBy = [{ [isEn ? 'nameEn' : 'nameBn']: 'desc' }];
    } else if (sort === 'area_desc') {
      orderBy = [{ areaInDecimal: 'desc' }];
    } else if (sort === 'area_asc') {
      orderBy = [{ areaInDecimal: 'asc' }];
    } else if (sort === 'year_desc') {
      orderBy = [{ donationYear: 'desc' }, { id: 'desc' }];
    } else if (sort === 'year_asc') {
      orderBy = [{ donationYear: 'asc' }, { id: 'asc' }];
    }

    const [
      totalRecords,
      filteredAggregate,
      donors,
      totalSumAggregate,
      yearsAggregate,
      usageStats,
      mouzasList,
      tributeBn,
      tributeEn,
      convAcre,
      convBigha,
      convKatha,
      convSqft,
    ] = await Promise.all([
      prisma.landDonor.count({ where }),
      prisma.landDonor.aggregate({
        where,
        _sum: { areaInDecimal: true },
      }),
      // Strict Privacy by Serialization:
      // NEVER select phone, nid, representativePhone
      prisma.landDonor.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          nameBn: true,
          nameEn: true,
          fatherNameBn: true,
          fatherNameEn: true,
          motherNameBn: true,
          motherNameEn: true,
          villageBn: true,
          villageEn: true,
          photoPath: true,
          isDeceased: true,
          areaValue: true,
          areaUnit: true,
          areaInDecimal: true,
          donationYear: true,
          donationDate: true,
          donationType: true,
          deedNumber: true,
          deedDate: true,
          khatianType: true,
          khatianNumber: true,
          dagNumber: true,
          mouzaBn: true,
          mouzaEn: true,
          jlNumber: true,
          upazilaBn: true,
          upazilaEn: true,
          districtBn: true,
          districtEn: true,
          boundaryNorth: true,
          boundarySouth: true,
          boundaryEast: true,
          boundaryWest: true,
          landUse: true,
          landUseOther: true,
          storyBn: true,
          storyEn: true,
          relatedDocumentIds: true,
          relatedLandMapId: true,
          representativeName: true,
          representativeRelation: true,
          sortOrder: true,
          showDeedDetails: true,
          showPlotDetails: true,
          showBoundaries: true,
          relatedLandMap: {
            select: {
              id: true,
              titleBn: true,
              titleEn: true,
              surveyType: true,
              filePath: true,
              thumbPath: true,
              isPublished: true,
              deletedAt: true,
            },
          },
        },
      }),
      prisma.landDonor.aggregate({
        where: { isPublished: true, deletedAt: null },
        _count: { id: true },
        _sum: { areaInDecimal: true },
        _min: { donationYear: true },
        _max: { donationYear: true },
      }),
      prisma.landDonor.findMany({
        where: { isPublished: true, deletedAt: null },
        select: { donationYear: true },
        distinct: ['donationYear'],
        orderBy: { donationYear: 'asc' },
      }),
      prisma.landDonor.groupBy({
        by: ['landUse'],
        where: { isPublished: true, deletedAt: null },
        _count: { id: true },
        _sum: { areaInDecimal: true },
      }),
      prisma.landDonor.findMany({
        where: {
          isPublished: true,
          deletedAt: null,
          showPlotDetails: true,
          OR: [{ mouzaBn: { not: null } }, { mouzaEn: { not: null } }],
        },
        select: { mouzaBn: true, mouzaEn: true },
        distinct: ['mouzaBn', 'mouzaEn'],
      }),
      SettingsService.getValue('land_tribute_bn', 'ঐতিহ্যবাহী মানিকপুর ঈদগাহ ময়দানের জন্য নিঃস্বার্থভাবে জমি দানকারী সম্মানিত ব্যক্তিবর্গের তালিকা ও চিরকৃতজ্ঞতা প্রকাশ।'),
      SettingsService.getValue('land_tribute_en', 'Eternal gratitude and official register of distinguished patrons who dedicated their valuable land for the sacred grounds of Manikpur Eidgah.'),
      SettingsService.getValue('unit_conv_acre', '100'),
      SettingsService.getValue('unit_conv_bigha', '33'),
      SettingsService.getValue('unit_conv_katha', '1.65'),
      SettingsService.getValue('unit_conv_sqft', '435.6'),
    ]);

    // Fetch related public documents only for donors with showDeedDetails enabled
    const allDocIds = new Set();
    donors.forEach((d) => {
      if (d.showDeedDetails && Array.isArray(d.relatedDocumentIds)) {
        d.relatedDocumentIds.forEach((id) => allDocIds.add(id));
      }
    });

    let docsMap = {};
    if (allDocIds.size > 0) {
      const publicDocs = await prisma.document.findMany({
        where: {
          id: { in: Array.from(allDocIds) },
          visibility: 'PUBLIC',
          deletedAt: null,
        },
        select: {
          id: true,
          titleBn: true,
          titleEn: true,
          category: true,
          documentNo: true,
          filePath: true,
        },
      });
      publicDocs.forEach((doc) => {
        docsMap[doc.id] = doc;
      });
    }

    // Apply strict server-side visibility filters (omits hidden fields completely)
    const sanitizedDonors = donors.map((d) => serializePublicLandDonor(d, docsMap));

    // Deduplicated bilingual mouza options
    const mouzaSeen = new Set();
    const mouzaOptions = [];
    mouzasList.forEach((m) => {
      const bn = m.mouzaBn ? m.mouzaBn.trim() : '';
      const en = m.mouzaEn ? m.mouzaEn.trim() : '';
      const key = `${bn}|${en}`;
      if ((bn || en) && !mouzaSeen.has(key)) {
        mouzaSeen.add(key);
        mouzaOptions.push({ bn, en });
      }
    });

    return res.status(200).json({
      success: true,
      donors: sanitizedDonors,
      pagination: {
        page,
        limit,
        total: totalRecords,
        totalPages: Math.ceil(totalRecords / limit),
      },
      summary: {
        totalDonors: totalSumAggregate._count.id || totalRecords,
        filteredDonors: totalRecords,
        totalLandInDecimal: Number(totalSumAggregate._sum.areaInDecimal || 0),
        filteredLandInDecimal: Number(filteredAggregate._sum.areaInDecimal || 0),
        earliestYear: totalSumAggregate._min.donationYear || null,
        latestYear: totalSumAggregate._max.donationYear || null,
        landByUsage: usageStats.map((u) => ({
          landUse: u.landUse,
          count: u._count.id,
          areaInDecimal: Number(u._sum.areaInDecimal || 0),
        })),
        years: yearsAggregate.map((y) => y.donationYear),
        mouzas: mouzaOptions.map((m) => m.bn).filter(Boolean),
        mouzaOptions,
        conversionFactors: {
          acre: parseFloat(convAcre) || 100,
          bigha: parseFloat(convBigha) || 33,
          katha: parseFloat(convKatha) || 1.65,
          sqft: parseFloat(convSqft) || 435.6,
        },
        tribute: {
          bn: tributeBn,
          en: tributeEn,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/public/donors
 * Searchable, filterable monetary donors ledger (available only when enable_money_donors is true)
 */
export async function getDonors(req, res, next) {
  try {
    const enableMoneyDonors = await SettingsService.getValue('enable_money_donors', 'false');
    const isEnabled = enableMoneyDonors === '1' || enableMoneyDonors === 'true' || enableMoneyDonors === true;
    if (!isEnabled) {
      return res.status(200).json({
        success: true,
        enabled: false,
        message: 'Monetary donations page is archived. Please view Land Donors at /land-donors.',
        donors: [],
        pagination: { page: 1, limit: 15, total: 0, totalPages: 0 },
      });
    }

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
