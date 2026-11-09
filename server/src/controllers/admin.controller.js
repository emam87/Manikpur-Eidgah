import bcrypt from 'bcrypt';
import { prisma } from '../db/prisma.js';
import { logActivity } from '../services/activityLogger.service.js';
import { SettingsService } from '../services/settings.service.js';
import { processAndUploadImage } from '../services/image.service.js';
import { 
  uploadPublicFile, uploadPrivateFile, getPrivateSignedDownloadUrl, 
  deletePublicFile, deletePrivateFile 
} from '../services/r2.service.js';

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
      trashCount,
      totalDonorsSum,
      totalMembersSum,
      donorsByPurpose,
      membersByYear,
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
      ]).then((counts) => counts.reduce((a, b) => a + b, 0)),
      prisma.donor.aggregate({
        where: { deletedAt: null },
        _sum: { amount: true },
      }),
      prisma.member.aggregate({
        where: { deletedAt: null },
        _sum: { amountPaid: true },
      }),
      // Donations by purpose
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
      // Recent activities
      prisma.activityLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { user: { select: { name: true, email: true, role: true } } },
      }),
    ]);

    const totalFunds = (totalDonorsSum._sum.amount || 0) + (totalMembersSum._sum.amountPaid || 0);

    return res.status(200).json({
      success: true,
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
        trashCount,
        totalDonations: totalDonorsSum._sum.amount || 0,
        totalMemberContributions: totalMembersSum._sum.amountPaid || 0,
        totalFunds,
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

    const member = await prisma.member.create({
      data: {
        membershipNo: body.membershipNo ? body.membershipNo.trim() : null,
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
    const id = parseInt(req.params.id, 10);
    const existing = await prisma.member.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, error: 'সদস্য পাওয়া যায়নি।' });

    // Safe Soft Delete
    await prisma.member.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await logActivity({
      req,
      action: 'DELETED',
      subjectType: 'Member',
      subjectId: id,
      description: `আজীবন সদস্য '${existing.nameBn}' ট্র্যাশে পাঠানো হয়েছে।`,
    });

    return res.status(200).json({ success: true, message: 'সদস্য ট্র্যাশে পাঠানো হয়েছে।' });
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
    const id = parseInt(req.params.id, 10);
    const existing = await prisma.donor.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, error: 'অনুদানকারী পাওয়া যায়নি।' });

    await prisma.donor.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await logActivity({
      req,
      action: 'DELETED',
      subjectType: 'Donor',
      subjectId: id,
      description: `অনুদান রেকর্ড '${existing.donorNameBn}' ট্র্যাশে পাঠানো হয়েছে।`,
    });

    return res.status(200).json({ success: true, message: 'অনুদান রেকর্ড ট্র্যাশে পাঠানো হয়েছে।' });
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
    const id = parseInt(req.params.id, 10);
    const existing = await prisma.committeeMember.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, error: 'সদস্য পাওয়া যায়নি।' });

    await prisma.committeeMember.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await logActivity({
      req,
      action: 'DELETED',
      subjectType: 'CommitteeMember',
      subjectId: id,
      description: `কমিটি সদস্য '${existing.nameBn}' ট্র্যাশে পাঠানো হয়েছে।`,
    });

    return res.status(200).json({ success: true, message: 'কমিটি সদস্য ট্র্যাশে পাঠানো হয়েছে।' });
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
    const id = parseInt(req.params.id, 10);
    const existing = await prisma.album.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, error: 'অ্যালবাম পাওয়া যায়নি।' });

    await prisma.album.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await logActivity({
      req,
      action: 'DELETED',
      subjectType: 'Album',
      subjectId: id,
      description: `অ্যালবাম '${existing.titleBn}' ট্র্যাশে পাঠানো হয়েছে।`,
    });

    return res.status(200).json({ success: true, message: 'অ্যালবাম ট্র্যাশে পাঠানো হয়েছে।' });
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
    const id = parseInt(req.params.photoId, 10);
    await prisma.photo.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return res.status(200).json({ success: true, message: 'ছবি ট্র্যাশে পাঠানো হয়েছে।' });
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
      return res.status(403).json({ success: false, error: 'শুধুমাত্র অ্যাডমিন দলিল ট্র্যাশে পাঠাতে পারেন।' });
    }

    const id = parseInt(req.params.id, 10);
    const existing = await prisma.document.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, error: 'দলিল পাওয়া যায়নি।' });

    await prisma.document.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await logActivity({
      req,
      action: 'DELETED',
      subjectType: 'Document',
      subjectId: id,
      description: `দলিল '${existing.titleBn}' ট্র্যাশে পাঠানো হয়েছে।`,
    });

    return res.status(200).json({ success: true, message: 'দলিল ট্র্যাশে পাঠানো হয়েছে।' });
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
    const id = parseInt(req.params.id, 10);
    const existing = await prisma.landMap.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, error: 'নকশা পাওয়া যায়নি।' });

    await prisma.landMap.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await logActivity({
      req,
      action: 'DELETED',
      subjectType: 'LandMap',
      subjectId: id,
      description: `মৌজা নকশা '${existing.titleBn}' ট্র্যাশে পাঠানো হয়েছে।`,
    });

    return res.status(200).json({ success: true, message: 'নকশা ট্র্যাশে পাঠানো হয়েছে।' });
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
    const id = parseInt(req.params.id, 10);
    const existing = await prisma.notice.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, error: 'নোটিশ পাওয়া যায়নি।' });

    await prisma.notice.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await logActivity({
      req,
      action: 'DELETED',
      subjectType: 'Notice',
      subjectId: id,
      description: `নোটিশ '${existing.titleBn}' ট্র্যাশে পাঠানো হয়েছে।`,
    });

    return res.status(200).json({ success: true, message: 'নোটিশ ট্র্যাশে পাঠানো হয়েছে।' });
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
    const [members, donors, committee, albums, photos, documents, landMaps, notices, designs] =
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
    };

    const model = modelMap[type];
    if (!model) return res.status(400).json({ success: false, error: 'ভুল আইটেম ধরন।' });

    await model.delete({ where: { id: numericId } });

    await logActivity({
      req,
      action: 'PERMANENT_DELETE',
      subjectType: type,
      subjectId: numericId,
      description: `'${type} #${numericId}' স্থায়ীভাবে ডাটাবেজ থেকে মুছে ফেলা হয়েছে।`,
    });

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
      settings,
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
      prisma.siteSetting.findMany(),
      prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true } }),
    ]);

    const backupData = {
      meta: {
        site: 'Manikpur Central Shahi Eidgah',
        exportedAt: new Date().toISOString(),
        exportedBy: req.user.email,
        version: '1.0.0',
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
        settings,
        users,
      },
    };

    await logActivity({
      req,
      action: 'EXPORT',
      description: 'সম্পূর্ণ ডাটাবেজ ব্যাকআপ (JSON) ডাউনলোড করা হয়েছে।',
    });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=manikpur_eidgah_backup_${Date.now()}.json`);
    return res.send(JSON.stringify(backupData, null, 2));
  } catch (err) {
    next(err);
  }
}

