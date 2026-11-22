import { z } from 'zod';
import { Parser } from 'json2csv';
import { prisma } from '../db/prisma.js';
import { logActivity } from '../services/activityLogger.service.js';
import { SettingsService } from '../services/settings.service.js';
import { processAndUploadImage, deleteImageAssets } from '../services/image.service.js';
import { validateCoordinates } from '../utils/mapHelpers.js';
import { resolveGoogleMapsUrl } from '../utils/mapResolver.js';

const MAP_PLACE_CATEGORIES = [
  'EIDGAH_GROUND',
  'ENTRANCE',
  'PARKING',
  'WUDU',
  'GRAVEYARD',
  'MOSQUE',
  'POND',
  'LANDMARK',
  'OTHER',
];

const ROUTE_TRANSPORT_TYPES = ['BUS', 'CNG', 'RICKSHAW', 'WALK', 'CAR'];

const mapPlaceSchema = z.object({
  nameBn: z.string().trim().min(1, 'বাংলা নাম আবশ্যক'),
  nameEn: z.string().trim().min(1, 'English name is required').optional().or(z.literal('')),
  category: z.enum(MAP_PLACE_CATEGORIES).default('LANDMARK'),
  noteBn: z.string().trim().optional().nullable(),
  noteEn: z.string().trim().optional().nullable(),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  isPublished: z.union([z.boolean(), z.string()]).optional(),
  sortOrder: z.coerce.number().int().default(0),
});

const routeGuideSchema = z.object({
  fromNameBn: z.string().trim().min(1, 'শুরুর স্থানের বাংলা নাম আবশ্যক'),
  fromNameEn: z.string().trim().min(1, 'Starting place (English) is required').optional().or(z.literal('')),
  transports: z.union([z.array(z.enum(ROUTE_TRANSPORT_TYPES)), z.string()]).optional(),
  approxMinutes: z.union([z.coerce.number().int().positive(), z.literal(''), z.null()]).optional(),
  approxFare: z.string().trim().max(120).optional().nullable(),
  notesBn: z.string().trim().optional().nullable(),
  notesEn: z.string().trim().optional().nullable(),
  isPublished: z.union([z.boolean(), z.string()]).optional(),
  sortOrder: z.coerce.number().int().default(0),
});

function parseBool(val, defaultVal = true) {
  if (val === undefined || val === null || val === '') return defaultVal;
  return val !== false && val !== 'false' && val !== '0';
}

function normalizeTransports(raw) {
  if (!raw) return [];
  const arr = Array.isArray(raw)
    ? raw
    : String(raw)
        .split(/[,;|]/)
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean);
  return Array.from(new Set(arr.filter((t) => ROUTE_TRANSPORT_TYPES.includes(t))));
}

// ==============================================================================
// 1. MAP PLACES (POI) CRUD & CSV
// ==============================================================================
export async function getAdminMapPlaces(req, res, next) {
  try {
    const places = await prisma.mapPlace.findMany({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
    return res.status(200).json({ success: true, places });
  } catch (err) {
    next(err);
  }
}

export async function createMapPlace(req, res, next) {
  try {
    const parsed = mapPlaceSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: parsed.error.issues[0]?.message || 'অবৈধ তথ্য প্রদান করা হয়েছে।',
      });
    }

    const d = parsed.data;
    const coordCheck = validateCoordinates(d.lat, d.lng);
    if (!coordCheck.valid) {
      return res.status(400).json({ success: false, error: coordCheck.error });
    }

    let photoKey = req.body.photoKey || null;
    if (req.file) {
      const processed = await processAndUploadImage({
        buffer: req.file.buffer,
        directory: 'map-places',
        maxWidth: 1200,
        maxHeight: 900,
        thumbWidth: 320,
        thumbHeight: 240,
      });
      photoKey = processed.path;
    }

    const place = await prisma.mapPlace.create({
      data: {
        nameBn: d.nameBn,
        nameEn: d.nameEn || null,
        category: d.category,
        noteBn: d.noteBn || null,
        noteEn: d.noteEn || null,
        photoKey,
        lat: coordCheck.lat,
        lng: coordCheck.lng,
        isPublished: parseBool(d.isPublished, true),
        sortOrder: d.sortOrder || 0,
      },
    });

    await logActivity({
      req,
      action: 'CREATED',
      subjectType: 'MapPlace',
      subjectId: place.id,
      description: `মানচিত্রে নতুন স্থান '${place.nameBn}' যোগ করা হয়েছে।`,
      properties: { after: place },
    });

    return res.status(201).json({ success: true, place, warning: coordCheck.warning });
  } catch (err) {
    next(err);
  }
}

export async function updateMapPlace(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = await prisma.mapPlace.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      return res.status(404).json({ success: false, error: 'স্থানটি পাওয়া যায়নি।' });
    }

    const parsed = mapPlaceSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: parsed.error.issues[0]?.message || 'অবৈধ তথ্য প্রদান করা হয়েছে।',
      });
    }

    const d = parsed.data;
    const coordCheck = validateCoordinates(d.lat, d.lng);
    if (!coordCheck.valid) {
      return res.status(400).json({ success: false, error: coordCheck.error });
    }

    let photoKey = existing.photoKey;
    if (req.file) {
      const processed = await processAndUploadImage({
        buffer: req.file.buffer,
        directory: 'map-places',
        maxWidth: 1200,
        maxHeight: 900,
        thumbWidth: 320,
        thumbHeight: 240,
      });
      photoKey = processed.path;
    } else if (req.body.photoKey === '' || req.body.photoKey === null) {
      photoKey = null;
    }

    const updated = await prisma.mapPlace.update({
      where: { id },
      data: {
        nameBn: d.nameBn,
        nameEn: d.nameEn || null,
        category: d.category,
        noteBn: d.noteBn || null,
        noteEn: d.noteEn || null,
        photoKey,
        lat: coordCheck.lat,
        lng: coordCheck.lng,
        isPublished: parseBool(d.isPublished, existing.isPublished),
        sortOrder: d.sortOrder ?? existing.sortOrder,
      },
    });

    await logActivity({
      req,
      action: 'UPDATED',
      subjectType: 'MapPlace',
      subjectId: id,
      description: `মানচিত্রের স্থান '${updated.nameBn}' আপডেট করা হয়েছে।`,
      properties: { before: existing, after: updated },
    });

    return res.status(200).json({ success: true, place: updated, warning: coordCheck.warning });
  } catch (err) {
    next(err);
  }
}

export async function deleteMapPlace(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = await prisma.mapPlace.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'স্থানটি পাওয়া যায়নি।' });
    }

    await prisma.mapPlace.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await logActivity({
      req,
      action: 'DELETED',
      subjectType: 'MapPlace',
      subjectId: id,
      description: `মানচিত্রের স্থান '${existing.nameBn}' ট্র্যাশে সরানো হয়েছে।`,
      properties: { before: existing },
    });

    return res.status(200).json({ success: true, message: 'স্থানটি ট্র্যাশে সরানো হয়েছে।' });
  } catch (err) {
    next(err);
  }
}

export async function exportMapPlacesCsv(req, res, next) {
  try {
    const places = await prisma.mapPlace.findMany({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });

    const fields = ['nameBn', 'nameEn', 'category', 'lat', 'lng', 'noteBn', 'noteEn', 'isPublished', 'sortOrder'];
    const parser = new Parser({ fields });
    const csv = '\uFEFF' + (places.length > 0 ? parser.parse(places) : fields.join(','));

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="manikpur-eidgah-map-places.csv"');
    return res.status(200).send(csv);
  } catch (err) {
    next(err);
  }
}

export function getMapPlacesTemplate(req, res) {
  const sample = [
    {
      nameBn: 'প্রধান প্রবেশদ্বার',
      nameEn: 'Main Entrance Gate',
      category: 'ENTRANCE',
      lat: 23.0199269,
      lng: 91.2112393,
      noteBn: 'ঈদগাহের দক্ষিণ পাশের প্রধান গেট',
      noteEn: 'South-side main entrance gate of the Eidgah',
      isPublished: true,
      sortOrder: 1,
    },
  ];
  const parser = new Parser({
    fields: ['nameBn', 'nameEn', 'category', 'lat', 'lng', 'noteBn', 'noteEn', 'isPublished', 'sortOrder'],
  });
  const csv = '\uFEFF' + parser.parse(sample);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="map-places-template.csv"');
  return res.status(200).send(csv);
}

export async function importMapPlacesCsv(req, res, next) {
  try {
    const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
    if (rows.length === 0) {
      return res.status(400).json({ success: false, error: 'আমদানি করার জন্য কোনো সারি পাওয়া যায়নি।' });
    }

    let imported = 0;
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const parsed = mapPlaceSchema.safeParse({
        nameBn: row.nameBn,
        nameEn: row.nameEn || '',
        category: MAP_PLACE_CATEGORIES.includes(String(row.category || '').toUpperCase())
          ? String(row.category).toUpperCase()
          : 'LANDMARK',
        noteBn: row.noteBn || null,
        noteEn: row.noteEn || null,
        lat: row.lat,
        lng: row.lng,
        isPublished: parseBool(row.isPublished, true),
        sortOrder: parseInt(row.sortOrder, 10) || 0,
      });

      if (!parsed.success) {
        errors.push({ row: i + 1, error: parsed.error.issues[0]?.message || 'Invalid row' });
        continue;
      }

      const d = parsed.data;
      await prisma.mapPlace.create({
        data: {
          nameBn: d.nameBn,
          nameEn: d.nameEn || null,
          category: d.category,
          noteBn: d.noteBn || null,
          noteEn: d.noteEn || null,
          lat: d.lat,
          lng: d.lng,
          isPublished: parseBool(d.isPublished, true),
          sortOrder: d.sortOrder || 0,
        },
      });
      imported++;
    }

    await logActivity({
      req,
      action: 'IMPORTED',
      subjectType: 'MapPlace',
      description: `CSV থেকে ${imported}টি মানচিত্রের স্থান আমদানি করা হয়েছে।`,
    });

    return res.status(200).json({ success: true, imported, errors });
  } catch (err) {
    next(err);
  }
}

// ==============================================================================
// 2. ROUTE GUIDES (পথ নির্দেশনা) CRUD & CSV
// ==============================================================================
export async function getAdminRouteGuides(req, res, next) {
  try {
    const routes = await prisma.routeGuide.findMany({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
    return res.status(200).json({ success: true, routes });
  } catch (err) {
    next(err);
  }
}

export async function createRouteGuide(req, res, next) {
  try {
    const parsed = routeGuideSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: parsed.error.issues[0]?.message || 'অবৈধ তথ্য প্রদান করা হয়েছে।',
      });
    }
    const d = parsed.data;
    const transports = normalizeTransports(d.transports);

    const route = await prisma.routeGuide.create({
      data: {
        fromNameBn: d.fromNameBn,
        fromNameEn: d.fromNameEn || null,
        transports,
        approxMinutes: d.approxMinutes ? Number(d.approxMinutes) : null,
        approxFare: d.approxFare || null,
        notesBn: d.notesBn || null,
        notesEn: d.notesEn || null,
        isPublished: parseBool(d.isPublished, true),
        sortOrder: d.sortOrder || 0,
      },
    });

    await logActivity({
      req,
      action: 'CREATED',
      subjectType: 'RouteGuide',
      subjectId: route.id,
      description: `নতুন পথ নির্দেশনা '${route.fromNameBn}' যোগ করা হয়েছে।`,
      properties: { after: route },
    });

    return res.status(201).json({ success: true, route });
  } catch (err) {
    next(err);
  }
}

export async function updateRouteGuide(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = await prisma.routeGuide.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      return res.status(404).json({ success: false, error: 'পথ নির্দেশনা পাওয়া যায়নি।' });
    }

    const parsed = routeGuideSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: parsed.error.issues[0]?.message || 'অবৈধ তথ্য প্রদান করা হয়েছে।',
      });
    }
    const d = parsed.data;
    const transports = normalizeTransports(d.transports);

    const updated = await prisma.routeGuide.update({
      where: { id },
      data: {
        fromNameBn: d.fromNameBn,
        fromNameEn: d.fromNameEn || null,
        transports,
        approxMinutes: d.approxMinutes ? Number(d.approxMinutes) : null,
        approxFare: d.approxFare || null,
        notesBn: d.notesBn || null,
        notesEn: d.notesEn || null,
        isPublished: parseBool(d.isPublished, existing.isPublished),
        sortOrder: d.sortOrder ?? existing.sortOrder,
      },
    });

    await logActivity({
      req,
      action: 'UPDATED',
      subjectType: 'RouteGuide',
      subjectId: id,
      description: `পথ নির্দেশনা '${updated.fromNameBn}' আপডেট করা হয়েছে।`,
      properties: { before: existing, after: updated },
    });

    return res.status(200).json({ success: true, route: updated });
  } catch (err) {
    next(err);
  }
}

export async function deleteRouteGuide(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = await prisma.routeGuide.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'পথ নির্দেশনা পাওয়া যায়নি।' });
    }

    await prisma.routeGuide.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await logActivity({
      req,
      action: 'DELETED',
      subjectType: 'RouteGuide',
      subjectId: id,
      description: `পথ নির্দেশনা '${existing.fromNameBn}' ট্র্যাশে সরানো হয়েছে।`,
      properties: { before: existing },
    });

    return res.status(200).json({ success: true, message: 'পথ নির্দেশনা ট্র্যাশে সরানো হয়েছে।' });
  } catch (err) {
    next(err);
  }
}

export async function exportRouteGuidesCsv(req, res, next) {
  try {
    const routes = await prisma.routeGuide.findMany({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });

    const formatted = routes.map((r) => ({
      fromNameBn: r.fromNameBn,
      fromNameEn: r.fromNameEn || '',
      transports: (r.transports || []).join('|'),
      approxMinutes: r.approxMinutes || '',
      approxFare: r.approxFare || '',
      notesBn: r.notesBn || '',
      notesEn: r.notesEn || '',
      isPublished: r.isPublished,
      sortOrder: r.sortOrder,
    }));

    const fields = ['fromNameBn', 'fromNameEn', 'transports', 'approxMinutes', 'approxFare', 'notesBn', 'notesEn', 'isPublished', 'sortOrder'];
    const parser = new Parser({ fields });
    const csv = '\uFEFF' + (formatted.length > 0 ? parser.parse(formatted) : fields.join(','));

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="manikpur-eidgah-route-guides.csv"');
    return res.status(200).send(csv);
  } catch (err) {
    next(err);
  }
}

export function getRouteGuidesTemplate(req, res) {
  const sample = [
    {
      fromNameBn: 'মানিকপুর বাজার',
      fromNameEn: 'Manikpur Bazar',
      transports: 'RICKSHAW|WALK|CNG',
      approxMinutes: 5,
      approxFare: '২০–৩০ টাকা',
      notesBn: 'বাজার থেকে উত্তর দিকে প্রধান সড়ক ধরে সোজা ঈদগাহ গেট।',
      notesEn: 'Head north along the main road straight to the Eidgah gate.',
      isPublished: true,
      sortOrder: 1,
    },
  ];
  const fields = ['fromNameBn', 'fromNameEn', 'transports', 'approxMinutes', 'approxFare', 'notesBn', 'notesEn', 'isPublished', 'sortOrder'];
  const parser = new Parser({ fields });
  const csv = '\uFEFF' + parser.parse(sample);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="route-guides-template.csv"');
  return res.status(200).send(csv);
}

export async function importRouteGuidesCsv(req, res, next) {
  try {
    const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
    if (rows.length === 0) {
      return res.status(400).json({ success: false, error: 'আমদানি করার জন্য কোনো সারি পাওয়া যায়নি।' });
    }

    let imported = 0;
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const parsed = routeGuideSchema.safeParse({
        fromNameBn: row.fromNameBn,
        fromNameEn: row.fromNameEn || '',
        transports: normalizeTransports(row.transports),
        approxMinutes: row.approxMinutes ? parseInt(row.approxMinutes, 10) : null,
        approxFare: row.approxFare || null,
        notesBn: row.notesBn || null,
        notesEn: row.notesEn || null,
        isPublished: parseBool(row.isPublished, true),
        sortOrder: parseInt(row.sortOrder, 10) || 0,
      });

      if (!parsed.success) {
        errors.push({ row: i + 1, error: parsed.error.issues[0]?.message || 'Invalid row' });
        continue;
      }

      const d = parsed.data;
      await prisma.routeGuide.create({
        data: {
          fromNameBn: d.fromNameBn,
          fromNameEn: d.fromNameEn || null,
          transports: normalizeTransports(d.transports),
          approxMinutes: d.approxMinutes ? Number(d.approxMinutes) : null,
          approxFare: d.approxFare || null,
          notesBn: d.notesBn || null,
          notesEn: d.notesEn || null,
          isPublished: parseBool(d.isPublished, true),
          sortOrder: d.sortOrder || 0,
        },
      });
      imported++;
    }

    await logActivity({
      req,
      action: 'IMPORTED',
      subjectType: 'RouteGuide',
      description: `CSV থেকে ${imported}টি পথ নির্দেশনা আমদানি করা হয়েছে।`,
    });

    return res.status(200).json({ success: true, imported, errors });
  } catch (err) {
    next(err);
  }
}

// ==============================================================================
// 3. STATIC MAP PREVIEW IMAGE UPLOAD (FOR LITE MODE / OFFLINE FALLBACK)
// ==============================================================================
export async function uploadMapPreviewSetting(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'অনুগ্রহ করে একটি ম্যাপ প্রিভিউ ছবি নির্বাচন করুন।' });
    }

    const existing = await prisma.siteSetting.findUnique({ where: { key: 'map_static_preview' } });
    const processed = await processAndUploadImage({
      buffer: req.file.buffer,
      directory: 'settings',
      maxWidth: 1200,
      maxHeight: 800,
      quality: 82,
      createThumb: false,
    });

    const newPath = processed.path;
    await prisma.siteSetting.upsert({
      where: { key: 'map_static_preview' },
      update: { valueBn: newPath, valueEn: newPath, type: 'image', group: 'map' },
      create: { key: 'map_static_preview', valueBn: newPath, valueEn: newPath, type: 'image', group: 'map' },
    });

    if (existing?.valueBn && existing.valueBn !== newPath && !existing.valueBn.startsWith('/defaults/')) {
      await deleteImageAssets(existing.valueBn, null).catch(() => {});
    }

    SettingsService.clearCache();

    await logActivity({
      req,
      action: 'UPDATED',
      subjectType: 'SiteSetting',
      description: `মানচিত্রের স্ট্যাটিক প্রিভিউ ছবি আপলোড করা হয়েছে (${newPath})।`,
    });

    return res.status(200).json({
      success: true,
      path: newPath,
      message: 'ম্যাপ প্রিভিউ ছবি সফলভাবে সংরক্ষিত হয়েছে।',
    });
  } catch (err) {
    next(err);
  }
}

// ==============================================================================
// 4. SSRF-PROTECTED GOOGLE MAPS SHORT-LINK RESOLVER (ADMIN & EDITOR)
// ==============================================================================
const resolveLinkSchema = z.object({
  url: z.string().trim().min(1, 'Google Maps লিংক প্রদান করুন।').max(2048),
});

export async function resolveAdminMapLink(req, res, next) {
  try {
    const parsed = resolveLinkSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: parsed.error.issues[0]?.message || 'বৈধ লিংক প্রদান করুন।',
      });
    }

    const result = await resolveGoogleMapsUrl(parsed.data.url);
    if (!result.ok) {
      return res.status(result.blocked ? 403 : 422).json({
        success: false,
        error: result.error || 'লিংক থেকে স্থানাঙ্ক বের করা যায়নি।',
      });
    }

    return res.status(200).json({
      success: true,
      finalUrl: result.finalUrl,
      lat: result.lat,
      lng: result.lng,
      sourceType: result.sourceType,
      isFallbackViewport: Boolean(result.isFallbackViewport),
      warning: result.warning || null,
      warningBn: result.warningBn || null,
    });
  } catch (err) {
    next(err);
  }
}
