import { prisma } from '../db/prisma.js';
import { SettingsService } from '../services/settings.service.js';
import {
  DEFAULT_MAP_LOCATION,
  resolvePlaceholderCoordinateMigration,
} from '../utils/mapHelpers.js';

export async function seedDatabase() {
  console.log(`\n======================================================`);
  console.log(`🌱 Running Idempotent Seed for Manikpur Eidgah`);
  console.log(`======================================================`);

  try {
    // 1. Default Site Settings (Idempotent: insert-if-missing only)
    const boundaryGeoJson = JSON.stringify({
      type: 'Feature',
      properties: {
        name: 'Manikpur Eidgah Boundary (1.35 Acres)',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [90.82065, 23.98810],
          [90.82215, 23.98810],
          [90.82215, 23.98695],
          [90.82065, 23.98695],
          [90.82065, 23.98810],
        ]],
      },
    });

    const defaultSettings = [
      ['site_name', 'মানিকপুর ঈদগাহ', 'Manikpur Eidgah', 'text', 'general'],
      ['eidgahNameBn', 'মানিকপুর ঈদগাহ', 'মানিকপুর ঈদগাহ', 'text', 'general'],
      ['eidgahNameEn', 'Manikpur Eidgah', 'Manikpur Eidgah', 'text', 'general'],
      ['tagline', 'ঐতিহ্যবাহী দ্বীনি ও সামাজিক ঈদগাহ ময়দান • স্থাপিত ১৯৬৫ খ্রি.', 'Historic Community Eidgah Ground & Waqf Estate • Est. 1965', 'text', 'general'],
      ['established_year', '১৯৬৫ খ্রিস্টাব্দ (১৩৭২ বঙ্গাব্দ)', '1965 AD (1372 Bengali Year)', 'text', 'general'],
      ['land_area', '১.৩৫ একর (১৩৫ শতাংশ ওয়াকফকৃত জমি)', '1.35 Acres (135 Decimals Waqf Land)', 'text', 'general'],
      ['capacity', 'প্রায় ১২,০০০+ মুসল্লি (একত্রে জামাত আদায়যোগ্য)', 'Approx. 12,000+ Worshippers per Congregation', 'text', 'general'],
      ['location', 'মানিকপুর, ডাকঘর: মানিকপুর বাজার, বাংলাদেশ', 'Manikpur, P.O: Manikpur Bazar, Bangladesh', 'text', 'general'],
      [
        'intro',
        'মানিকপুর ঈদগাহ ১৯৬৫ সালে গ্রামের ধর্মপ্রাণ মুরুব্বি ও সমাজহিতৈষী ব্যক্তিবর্গের ঐকান্তিক প্রচেষ্টায় প্রতিষ্ঠিত হয়। ১.৩৫ একর ওয়াকফকৃত নিষ্কণ্টক জমির ওপর অবস্থিত এই ঈদগাহে মানিকপুর ও পার্শ্ববর্তী ৭টি গ্রামের হাজারো ধর্মপ্রাণ মুসল্লি প্রতি বছর পবিত্র ঈদুল ফিতর ও ঈদুল আযহার নামাজ আদায় করেন।',
        'Established in 1965 through the dedication of pious elders and community philanthropists, Manikpur Eidgah stands on 1.35 acres of registered Waqf land. Every year, thousands of worshippers from Manikpur and seven neighboring villages gather here in unity for Eid-ul-Fitr and Eid-ul-Adha congregations.',
        'text',
        'general',
      ],
      [
        'history',
        "১৯৬৫ সালের পূর্বে মানিকপুর গ্রামের মুসল্লিগণ অস্থায়ী মাঠে ঈদের নামাজ আদায় করতেন। মরহুম আলহাজ্ব মৌলভী আব্দুল জব্বার সাহেব এবং গ্রামের প্রবীণ মুরুব্বিগণের উদ্যোগে ১৯৬৫ সালে প্রথম ৮০ শতাংশ জমি ঈদগাহের নামে রেজিস্ট্রি ওয়াকফ দলিলমূলে দান করা হয়।\n\nপরবর্তীতে ১৯৯৮ ও ২০১৬ সালে গ্রামবাসী এবং প্রবাসী ভাইদের বিশেষ অনুদানে আরও ৫৫ শতাংশ জমি ক্রয় করে ঈদগাহের মোট আয়তন ১.৩৫ একরে (১৩৫ শতাংশ) উন্নীত করা হয়। ২০২২-২০২৫ মেয়াদে আধুনিক মিম্বর, দৃষ্টিনন্দন প্রধান তোরণ, দক্ষিণ ও পূর্ব পাশের আরসিসি সীমানা প্রাচীর এবং ওযুখানার কাজ সম্পন্ন হয়েছে।",
        "Prior to 1965, residents of Manikpur offered Eid prayers in temporary open fields. Through the pioneering leadership of Late Alhaj Maulvi Abdul Jabbar and respected village elders, an initial 80 decimals of land were permanently dedicated via Registered Waqf Deed No. 2841 in 1965.\n\nSubsequently, in 1998 and 2016, generous contributions from local residents and diaspora members enabled the acquisition of an additional 55 decimals, expanding the Eidgah to 1.35 acres (135 decimals). Between 2022 and 2025, a grand Minbar, main archway gate, RCC boundary wall, and ablution (Wudu) facilities were constructed.",
        'text',
        'general',
      ],
      [
        'eid_jamat',
        'পবিত্র ঈদুল ফিতর: ১ম জামাত সকাল ৮:০০ ঘটিকা, ২য় জামাত সকাল ৯:০০ ঘটিকা | পবিত্র ঈদুল আযহা: প্রধান জামাত সকাল ৭:৩০ ঘটিকা।',
        'Eid-ul-Fitr: 1st Jamat at 8:00 AM, 2nd Jamat at 9:00 AM | Eid-ul-Adha: Main Jamat at 7:30 AM.',
        'text',
        'general',
      ],
      [
        'bank_info',
        "হিসাবের নাম: মানিকপুর ঈদগাহ উন্নয়ন তহবিল\nইসলামী ব্যাংক বাংলাদেশ পিএলসি, মানিকপুর শাখা\nচলতি হিসাব নং: ২০৫০-১৯৮-০২০৪৫৮৯১২\nবিকাশ / নগদ: ০১৭১১-২২৩৩৪৪ (সাধারণ সম্পাদক/কোষাধ্যক্ষের সাথে যোগাযোগ করে রশিদ সংগ্রহ করুন)",
        "Account Name: Manikpur Eidgah Development Fund\nIslami Bank Bangladesh PLC, Manikpur Branch\nA/C No: 2050-198-020458912\nbKash / Nagad: +880 1711-223344",
        'text',
        'contact',
      ],
      ['map_lat', String(DEFAULT_MAP_LOCATION.lat), String(DEFAULT_MAP_LOCATION.lat), 'text', 'map'],
      ['map_lng', String(DEFAULT_MAP_LOCATION.lng), String(DEFAULT_MAP_LOCATION.lng), 'text', 'map'],
      ['map_zoom', String(DEFAULT_MAP_LOCATION.zoom), String(DEFAULT_MAP_LOCATION.zoom), 'number', 'map'],
      ['map_place_name', DEFAULT_MAP_LOCATION.placeNameBn, DEFAULT_MAP_LOCATION.placeNameEn, 'text', 'map'],
      ['map_address', '', '', 'text', 'map'],
      ['map_google_place_url', DEFAULT_MAP_LOCATION.googlePlaceUrl, DEFAULT_MAP_LOCATION.googlePlaceUrl, 'text', 'map'],
      ['map_google_place_id', DEFAULT_MAP_LOCATION.googlePlaceId, DEFAULT_MAP_LOCATION.googlePlaceId, 'text', 'map'],
      ['map_satellite_enabled', '1', '1', 'boolean', 'map'],
      ['map_static_preview', '', '', 'image', 'map'],
      ['map_nav_lat', '', '', 'text', 'map'],
      ['map_nav_lng', '', '', 'text', 'map'],
      ['map_pin_source', 'Google link', 'Google link', 'text', 'map'],
      ['map_pin_verified_at', '', '', 'text', 'map'],
      ['map_pin_verified_by', '', '', 'text', 'map'],
      ['boundary_geojson', boundaryGeoJson, boundaryGeoJson, 'json', 'map'],
      ['contact_phone', '+880 1711-223344, +880 1819-556677', '+880 1711-223344, +880 1819-556677', 'text', 'contact'],
      ['contact_email', 'info@manikpureidgah.org', 'info@manikpureidgah.org', 'text', 'contact'],
      ['facebook_url', 'https://facebook.com/manikpureidgah', 'https://facebook.com/manikpureidgah', 'text', 'social'],
      ['youtube_url', 'https://youtube.com/@manikpureidgah', 'https://youtube.com/@manikpureidgah', 'text', 'social'],
      ['theme_preset', 'sakinah', 'sakinah', 'text', 'general'],
      ['hero_bg_style', 'dawn-photo-wave', 'dawn-photo-wave', 'text', 'general'],
      ['hero_image', '/defaults/eidgah-hero.webp', '/defaults/eidgah-hero.webp', 'image', 'general'],
      ['show_bismillah', '1', '1', 'boolean', 'general'],
      ['show_donation_amount', '1', '1', 'boolean', 'privacy'],
      ['show_member_amount', '1', '1', 'boolean', 'privacy'],
      ['allow_photo_download', '1', '1', 'boolean', 'general'],
      ['committee_title', 'সাত সদস্যবিশিষ্ট উন্নয়ন কমিটি', 'Seven-Member Development Committee', 'text', 'general'],
      ['enable_money_donors', 'false', 'false', 'boolean', 'general'],
      ['land_tribute_bn', 'ঐতিহ্যবাহী মানিকপুর ঈদগাহ ময়দানের জন্য নিঃস্বার্থভাবে জমি দানকারী সম্মানিত ব্যক্তিবর্গের তালিকা ও চিরকৃতজ্ঞতা প্রকাশ।', 'Eternal gratitude and register of distinguished patrons who dedicated their valuable land for Manikpur Eidgah.', 'text', 'general'],
      ['land_tribute_en', 'Eternal gratitude and register of distinguished patrons who dedicated their valuable land for Manikpur Eidgah.', 'Eternal gratitude and register of distinguished patrons who dedicated their valuable land for Manikpur Eidgah.', 'text', 'general'],
      ['unit_conv_acre', '100', '100', 'number', 'general'],
      ['unit_conv_bigha', '33', '33', 'number', 'general'],
      ['unit_conv_katha', '1.65', '1.65', 'number', 'general'],
      ['unit_conv_sqft', '435.6', '435.6', 'number', 'general'],
      ['land_default_unit', 'DECIMAL_SHATANGSHO', 'DECIMAL_SHATANGSHO', 'text', 'general'],
    ];

    let settingsInserted = 0;
    for (const [key, valBn, valEn, type, group] of defaultSettings) {
      const existing = await prisma.siteSetting.findUnique({ where: { key } });
      if (!existing) {
        await prisma.siteSetting.create({
          data: { key, valueBn: valBn, valueEn: valEn, type, group },
        });
        settingsInserted++;
      }
    }
    console.log(`✓ Site Settings: ${settingsInserted} inserted (existing preserved).`);

    // 1b. Safe exact-match migration for known-wrong coordinates:
    // ONLY (23.8103, 90.4125), (23.019842, 91.2076296), or (23.0200482, 91.2079419)
    // Never touches custom coordinates set by an admin. Logs backup of old values in activity_logs.
    const [existingLat, existingLng] = await Promise.all([
      prisma.siteSetting.findUnique({ where: { key: 'map_lat' } }),
      prisma.siteSetting.findUnique({ where: { key: 'map_lng' } }),
    ]);
    if (existingLat && existingLng) {
      const migration = resolvePlaceholderCoordinateMigration(existingLat.valueBn, existingLng.valueBn);
      if (migration.shouldUpdate) {
        await Promise.all([
          prisma.siteSetting.update({
            where: { key: 'map_lat' },
            data: { valueBn: migration.lat, valueEn: migration.lat },
          }),
          prisma.siteSetting.update({
            where: { key: 'map_lng' },
            data: { valueBn: migration.lng, valueEn: migration.lng },
          }),
        ]);
        await prisma.activityLog
          .create({
            data: {
              action: 'UPDATED',
              subjectType: 'SiteSetting',
              description: `Migrated known-wrong map coordinates (${migration.matchedLabel}) to exact Manikpur Eidgah pin.`,
              properties: {
                before: { map_lat: migration.previousLat, map_lng: migration.previousLng },
                after: { map_lat: migration.lat, map_lng: migration.lng },
                reason: migration.matchedLabel,
              },
            },
          })
          .catch(() => {});
        console.log(
          `✓ Migrated known-wrong coordinates (${migration.previousLat}, ${migration.previousLng} — ${migration.matchedLabel}) -> (${migration.lat}, ${migration.lng}).`
        );
      }
    }

    // 2. Initial Committee Members (Insert only if none exists)
    const currentTerm = '২০২৪ - বর্তমান';
    const chiefName = 'লায়ন সৈয়দ হারুন এমজেএফ';

    const existingChief = await prisma.committeeMember.findFirst({
      where: { nameBn: chiefName, isCurrent: true },
    });

    if (!existingChief) {
      // Create Level 1 Chief Coordinator
      const chief = await prisma.committeeMember.create({
        data: {
          level: 1,
          nameBn: chiefName,
          nameEn: 'Lion Syed Harun MJF',
          designationBn: 'প্রধান সমন্বয়ক',
          designationEn: 'Chief Coordinator',
          roleBn: 'প্রধান সমন্বয়ক',
          roleEn: 'Chief Coordinator',
          designationType: 'LEADER',
          term: currentTerm,
          termPeriod: currentTerm,
          sortOrder: 1,
          isCurrent: true,
          isActive: true,
          showPhone: false,
        },
      });

      // Create Level 2 Coordinators
      const coordinators = [
        { nameBn: 'রফিকুল ইসলাম আলাল', nameEn: 'Rafiqul Islam Alal', order: 1 },
        { nameBn: 'ভিপি জসিম উদ্দিন চৌধুরী', nameEn: 'VP Jasim Uddin Chowdhury', order: 2 },
        { nameBn: 'প্রফেসর মোঃ হুমায়ুন কবির', nameEn: 'Prof. Md. Humayun Kabir', order: 3 },
        { nameBn: 'লায়ন এবিএম শাহাদাত হোসেন', nameEn: 'Lion ABM Shahadat Hossain', order: 4 },
        { nameBn: 'সাইফুর রহমান বাবুল', nameEn: 'Saifur Rahman Babul', order: 5 },
        { nameBn: 'মিজানুর রহমান সুমন', nameEn: 'Mizanur Rahman Suman', order: 6 },
      ];

      for (const coord of coordinators) {
        await prisma.committeeMember.create({
          data: {
            level: 2,
            parentId: chief.id,
            nameBn: coord.nameBn,
            nameEn: coord.nameEn,
            designationBn: 'সমন্বয়ক',
            designationEn: 'Coordinator',
            roleBn: 'সমন্বয়ক',
            roleEn: 'Coordinator',
            designationType: 'MEMBER',
            term: currentTerm,
            termPeriod: currentTerm,
            sortOrder: coord.order,
            isCurrent: true,
            isActive: true,
            showPhone: false,
          },
        });
      }
      console.log(`✓ Committee: Seeded 7-member development committee.`);
    } else {
      // Ensure English names and designations are up to date
      await prisma.committeeMember.update({
        where: { id: existingChief.id },
        data: { nameEn: 'Lion Syed Harun MJF', designationEn: 'Chief Coordinator', roleEn: 'Chief Coordinator' },
      });
      const updateList = [
        { nameBnPattern: 'আলাল', nameEn: 'Rafiqul Islam Alal' },
        { nameBnPattern: 'জসিম', nameEn: 'VP Jasim Uddin Chowdhury' },
        { nameBnPattern: 'হুমায়ুন', nameEn: 'Prof. Md. Humayun Kabir' },
        { nameBnPattern: 'শাহাদাত', nameEn: 'Lion ABM Shahadat Hossain' },
        { nameBnPattern: 'বাবুল', nameEn: 'Saifur Rahman Babul' },
        { nameBnPattern: 'সুমন', nameEn: 'Mizanur Rahman Suman' },
      ];
      for (const u of updateList) {
        const found = await prisma.committeeMember.findFirst({
          where: { nameBn: { contains: u.nameBnPattern }, isCurrent: true },
        });
        if (found) {
          await prisma.committeeMember.update({
            where: { id: found.id },
            data: { nameEn: u.nameEn, designationEn: 'Coordinator', roleEn: 'Coordinator' },
          });
        }
      }
      console.log(`✓ Committee: Development committee updated with exact English designations.`);
    }

    // 3. Initial 7 Design Showcase Images (Seed if Design table is completely empty)
    const designCount = await prisma.design.count();
    if (designCount === 0) {
      const defaultDesigns = [
        { key: 'layout-plan', captionBn: 'পূর্ণাঙ্গ নকশা', captionEn: 'Full Eidgah Layout Plan', order: 1 },
        { key: 'ground-top-view', captionBn: 'মাঠের উপরের দৃশ্য', captionEn: 'Ground Top View', order: 2 },
        { key: 'mihrab-wall-front', captionBn: 'মূল দেওয়াল', captionEn: 'Main Wall (Front View)', order: 3 },
        { key: 'mihrab-wall-closeup', captionBn: 'মূল দেওয়ালের কাছ থেকে দৃশ্য', captionEn: 'Main Wall Close-up', order: 4 },
        { key: 'pond-aerial-view', captionBn: 'পুকুর পাশের আকাশ থেকে দৃশ্য', captionEn: 'Pond Side Aerial View', order: 5 },
        { key: 'pond-side-view', captionBn: 'পুকুরের ওপার থেকে দৃশ্য', captionEn: 'View from Across the Pond', order: 6 },
        { key: 'front-view', captionBn: 'সামনের দৃশ্য', captionEn: 'Front View', order: 7 },
      ];

      for (const d of defaultDesigns) {
        await prisma.design.create({
          data: {
            path: `designs/${d.key}.webp`,
            thumbPath: `designs/${d.key}_thumb.webp`,
            captionBn: d.captionBn,
            captionEn: d.captionEn,
            sortOrder: d.order,
            isPublished: true,
          },
        });
      }
      console.log(`✓ Designs: Seeded ${defaultDesigns.length} architectural design images.`);
    } else {
      console.log(`✓ Designs: Design images already exist (skipped).`);
    }

    // 4. Initial Land Donors (Historical 135 Decimals matching the 1.35-acre total)
    const landDonorCount = await prisma.landDonor.count();
    if (landDonorCount === 0) {
      const initialLandDonors = [
        {
          nameBn: 'আলহাজ্ব মৌলভী আব্দুল জব্বার',
          nameEn: 'Alhaj Maulvi Abdul Jabbar',
          fatherNameBn: 'হাজী মোহাম্মদ বক্স',
          fatherNameEn: 'Haji Mohammad Baksh',
          villageBn: 'মানিকপুর',
          villageEn: 'Manikpur',
          isDeceased: true,
          areaValue: 40.00,
          areaUnit: 'DECIMAL_SHATANGSHO',
          areaInDecimal: 40.00,
          donationYear: 1965,
          donationDate: new Date('1965-03-12'),
          donationType: 'WAQF',
          deedNumber: '২৮৪১/১৯৬৫',
          deedDate: new Date('1965-03-12'),
          khatianType: 'SA',
          khatianNumber: '১১২',
          dagNumber: '৩২৪',
          mouzaBn: 'মানিকপুর',
          mouzaEn: 'Manikpur',
          jlNumber: '৪৫',
          boundaryNorth: 'সরকারী গোপাট',
          boundarySouth: 'মৌলভী বাড়ির সীমানা',
          boundaryEast: 'নূরুল ইসলাম সাহেবের জমি',
          boundaryWest: 'হাজী বাড়ির সীমানা',
          landUse: 'EIDGAH_GROUND',
          storyBn: 'মানিকপুর ঈদগাহ প্রতিষ্ঠার সূচনালগ্নে মাঠের মূল অংশের জন্য সর্বপ্রথম এই জমি ওয়াকফ দলিলমূলে দান করেন।',
          storyEn: 'Dedicated the initial core foundation parcel via Registered Waqf Deed at the founding of Manikpur Eidgah in 1965.',
          representativeName: 'সৈয়দ হারুন',
          representativeRelation: 'দৌহিত্র',
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
          villageBn: 'মানিকপুর',
          villageEn: 'Manikpur',
          isDeceased: true,
          areaValue: 25.00,
          areaUnit: 'DECIMAL_SHATANGSHO',
          areaInDecimal: 25.00,
          donationYear: 1965,
          donationDate: new Date('1965-04-18'),
          donationType: 'DANPATRA',
          deedNumber: '২৯০৫/১৯৬৫',
          deedDate: new Date('1965-04-18'),
          khatianType: 'SA',
          khatianNumber: '১১৮',
          dagNumber: '৩২৫',
          mouzaBn: 'মানিকপুর',
          mouzaEn: 'Manikpur',
          jlNumber: '৪৫',
          landUse: 'EIDGAH_GROUND',
          storyBn: 'প্রতিষ্ঠাকালীন সময়ে ঈদগাহ মাঠের উত্তর-পূর্ব অংশের জমি দান করেন।',
          storyEn: 'Donated the north-eastern parcel of the main prayer ground during establishment.',
          isPublished: true,
          sortOrder: 2,
          showDeedDetails: true,
          showPlotDetails: true,
          showBoundaries: false,
        },
        {
          nameBn: 'আব্দুল গফুর সরকার',
          nameEn: 'Abdul Gafur Sarker',
          fatherNameBn: 'রমিজ উদ্দিন সরকার',
          fatherNameEn: 'Ramiz Uddin Sarker',
          villageBn: 'মানিকপুর',
          villageEn: 'Manikpur',
          isDeceased: true,
          areaValue: 15.00,
          areaUnit: 'DECIMAL_SHATANGSHO',
          areaInDecimal: 15.00,
          donationYear: 1965,
          donationDate: new Date('1965-05-02'),
          donationType: 'REGISTERED_DEED',
          deedNumber: '২৯৮৮/১৯৬৫',
          deedDate: new Date('1965-05-02'),
          khatianType: 'SA',
          khatianNumber: '১৩০',
          dagNumber: '৩২৬',
          mouzaBn: 'মানিকপুর',
          mouzaEn: 'Manikpur',
          jlNumber: '৪৫',
          landUse: 'EIDGAH_GROUND',
          storyBn: 'ঈদগাহ মাঠের সম্প্রসারণ ও মুসল্লিদের যাতায়াতের সুবিধার জন্য এই জমি দান করেন।',
          storyEn: 'Donated land for ground expansion and pedestrian approach pathways in 1965.',
          isPublished: true,
          sortOrder: 3,
          showDeedDetails: true,
          showPlotDetails: false,
          showBoundaries: false,
        },
        {
          nameBn: 'হাজী আব্দুল জলিল',
          nameEn: 'Haji Abdul Jalil',
          fatherNameBn: 'ইব্রাহিম মোল্লা',
          fatherNameEn: 'Ibrahim Molla',
          villageBn: 'মানিকপুর',
          villageEn: 'Manikpur',
          isDeceased: true,
          areaValue: 20.00,
          areaUnit: 'DECIMAL_SHATANGSHO',
          areaInDecimal: 20.00,
          donationYear: 1998,
          donationDate: new Date('1998-11-20'),
          donationType: 'DANPATRA',
          deedNumber: '৪৮২০/১৯৯৮',
          deedDate: new Date('1998-11-20'),
          khatianType: 'RS',
          khatianNumber: '২৫৪',
          dagNumber: '৪৮০',
          mouzaBn: 'মানিকপুর',
          mouzaEn: 'Manikpur',
          jlNumber: '৪৫',
          landUse: 'BOUNDARY_WALL',
          storyBn: 'মাঠের দক্ষিণ অংশের স্থায়ী আরসিসি সীমানা প্রাচীর নির্মাণের জন্য জমি হস্তান্তর করেন।',
          storyEn: 'Donated southern boundary land for permanent wall and protection construction.',
          isPublished: true,
          sortOrder: 4,
          showDeedDetails: true,
          showPlotDetails: true,
          showBoundaries: true,
        },
        {
          nameBn: 'আলহাজ্ব মোঃ ফজলুর রহমান',
          nameEn: 'Alhaj Md. Fazlur Rahman',
          fatherNameBn: 'হাজী মোন্তাজ মিয়া',
          fatherNameEn: 'Haji Montaj Mia',
          villageBn: 'মানিকপুর',
          villageEn: 'Manikpur',
          isDeceased: false,
          areaValue: 15.00,
          areaUnit: 'DECIMAL_SHATANGSHO',
          areaInDecimal: 15.00,
          donationYear: 2016,
          donationDate: new Date('2016-08-14'),
          donationType: 'HEBA',
          deedNumber: '৫২১৪/২০১৬',
          deedDate: new Date('2016-08-14'),
          khatianType: 'BS',
          khatianNumber: '৩২০',
          dagNumber: '৫১০',
          mouzaBn: 'মানিকপুর',
          mouzaEn: 'Manikpur',
          jlNumber: '৪৫',
          landUse: 'GRAVEYARD',
          storyBn: 'ঈদগাহ সংলগ্ন কবরস্থান ও মুক্ত জায়গার জন্য হেবামূলে জমি দান করেন।',
          storyEn: 'Dedicated land adjacent to the Eidgah for graveyard and open grounds.',
          isPublished: true,
          sortOrder: 5,
          showDeedDetails: true,
          showPlotDetails: true,
          showBoundaries: false,
        },
        {
          nameBn: 'আলহাজ্ব আফতাব উদ্দিন',
          nameEn: 'Alhaj Aftab Uddin',
          fatherNameBn: 'কফিল উদ্দিন',
          fatherNameEn: 'Kafil Uddin',
          villageBn: 'মানিকপুর',
          villageEn: 'Manikpur',
          isDeceased: true,
          areaValue: 20.00,
          areaUnit: 'DECIMAL_SHATANGSHO',
          areaInDecimal: 20.00,
          donationYear: 2016,
          donationDate: new Date('2016-09-05'),
          donationType: 'REGISTERED_DEED',
          deedNumber: '৫২৮০/২০১৬',
          deedDate: new Date('2016-09-05'),
          khatianType: 'BS',
          khatianNumber: '৩২৫',
          dagNumber: '৫১৫',
          mouzaBn: 'মানিকপুর',
          mouzaEn: 'Manikpur',
          jlNumber: '৪৫',
          landUse: 'ROAD',
          storyBn: 'ঈদগাহ ওজুখানা কমপ্লেক্স ও প্রধান তোরণ অভিমুখী সংযোগ সড়কের জন্য জমি দান করেন।',
          storyEn: 'Donated land for access road leading to main archway and wudu khana complex.',
          isPublished: true,
          sortOrder: 6,
          showDeedDetails: true,
          showPlotDetails: true,
          showBoundaries: true,
        },
      ];

      for (const donor of initialLandDonors) {
        await prisma.landDonor.create({ data: donor });
      }
      console.log(`✓ Land Donors: Seeded ${initialLandDonors.length} historical land donors (Total: 135 Decimals / 1.35 Acres).`);
    } else {
      console.log(`✓ Land Donors: Land donor records already exist (skipped).`);
    }

    SettingsService.clearCache();
    console.log(`\n🎉 Seed completed successfully!\n`);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute if run directly from CLI
if (process.argv[1]?.endsWith('seed.js')) {
  seedDatabase();
}

