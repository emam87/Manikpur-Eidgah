import { prisma } from '../db/prisma.js';
import { SettingsService } from '../services/settings.service.js';

export async function seedDatabase() {
  console.log(`\n======================================================`);
  console.log(`🌱 Running Idempotent Seed for Manikpur Eidgah`);
  console.log(`======================================================`);

  try {
    // 1. Default Site Settings (Idempotent: insert-if-missing only)
    const boundaryGeoJson = JSON.stringify({
      type: 'Feature',
      properties: {
        name: 'Manikpur Central Eidgah Boundary (1.35 Acres)',
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
      ['site_name', 'মানিকপুর কেন্দ্রীয় শাহী ঈদগাহ', 'Manikpur Central Shahi Eidgah', 'text', 'general'],
      ['tagline', 'ঐতিহ্যবাহী দ্বীনি ও সামাজিক ঈদগাহ ময়দান • স্থাপিত ১৯৬৫ খ্রি.', 'Historic Community Eidgah Ground & Waqf Estate • Est. 1965', 'text', 'general'],
      ['established_year', '১৯৬৫ খ্রিস্টাব্দ (১৩৭২ বঙ্গাব্দ)', '1965 AD (1372 Bengali Year)', 'text', 'general'],
      ['land_area', '১.৩৫ একর (১৩৫ শতাংশ ওয়াকফকৃত জমি)', '1.35 Acres (135 Decimals Waqf Land)', 'text', 'general'],
      ['capacity', 'প্রায় ১২,০০০+ মুসল্লি (একত্রে জামাত আদায়যোগ্য)', 'Approx. 12,000+ Worshippers per Congregation', 'text', 'general'],
      ['location', 'মানিকপুর, ডাকঘর: মানিকপুর বাজার, বাংলাদেশ', 'Manikpur, P.O: Manikpur Bazar, Bangladesh', 'text', 'general'],
      [
        'intro',
        'মানিকপুর কেন্দ্রীয় শাহী ঈদগাহ ১৯৬৫ সালে গ্রামের ধর্মপ্রাণ মুরুব্বি ও সমাজহিতৈষী ব্যক্তিবর্গের ঐকান্তিক প্রচেষ্টায় প্রতিষ্ঠিত হয়। ১.৩৫ একর ওয়াকফকৃত নিষ্কণ্টক জমির ওপর অবস্থিত এই ঈদগাহে মানিকপুর ও পার্শ্ববর্তী ৭টি গ্রামের হাজারো ধর্মপ্রাণ মুসল্লি প্রতি বছর পবিত্র ঈদুল ফিতর ও ঈদুল আযহার নামাজ আদায় করেন।',
        'Established in 1965 through the dedication of pious elders and community philanthropists, Manikpur Central Shahi Eidgah stands on 1.35 acres of registered Waqf land. Every year, thousands of worshippers from Manikpur and seven neighboring villages gather here in unity for Eid-ul-Fitr and Eid-ul-Adha congregations.',
        'text',
        'general',
      ],
      [
        'history',
        "১৯৬৫ সালের পূর্বে মানিকপুর গ্রামের মুসল্লিগণ অস্থায়ী মাঠে ঈদের নামাজ আদায় করতেন। মরহুম আলহাজ্ব মৌলভী আব্দুল জব্বার সাহেব এবং গ্রামের প্রবীণ মুরুব্বিগণের উদ্যোগে ১৯৬৫ সালে প্রথম ৮০ শতাংশ জমি ঈদগাহের নামে রেজিস্ট্রি ওয়াকফ দলিলমূলে দান করা হয়।\n\nপরবর্তীতে ১৯৯৮ ও ২০১৬ সালে গ্রামবাসী এবং প্রবাসী ভাইদের বিশেষ অনুদানে আরও ৫৫ শতাংশ জমি ক্রয় করে ঈদগাহের মোট আয়তন ১.৩৫ একরে (১৩৫ শতাংশ) উন্নীত করা হয়। ২০২২-২০২৫ মেয়াদে আধুনিক শাহী মিম্বর, দৃষ্টিনন্দন প্রধান তোরণ, দক্ষিণ ও পূর্ব পাশের আরসিসি সীমানা প্রাচীর এবং ওযুখানার কাজ সম্পন্ন হয়েছে।",
        "Prior to 1965, residents of Manikpur offered Eid prayers in temporary open fields. Through the pioneering leadership of Late Alhaj Maulvi Abdul Jabbar and respected village elders, an initial 80 decimals of land were permanently dedicated via Registered Waqf Deed No. 2841 in 1965.\n\nSubsequently, in 1998 and 2016, generous contributions from local residents and diaspora members enabled the acquisition of an additional 55 decimals, expanding the Eidgah to 1.35 acres (135 decimals). Between 2022 and 2025, a grand Shahi Minbar, main archway gate, RCC boundary wall, and ablution (Wudu) facilities were constructed.",
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
        "হিসাবের নাম: মানিকপুর কেন্দ্রীয় ঈদগাহ উন্নয়ন তহবিল\nইসলামী ব্যাংক বাংলাদেশ পিএলসি, মানিকপুর শাখা\nচলতি হিসাব নং: ২০৫০-১৯৮-০২০৪৫৮৯১২\nবিকাশ / নগদ: ০১৭১১-২২৩৩৪৪ (সাধারণ সম্পাদক/কোষাধ্যক্ষের সাথে যোগাযোগ করে রশিদ সংগ্রহ করুন)",
        "Account Name: Manikpur Central Eidgah Development Fund\nIslami Bank Bangladesh PLC, Manikpur Branch\nA/C No: 2050-198-020458912\nbKash / Nagad: +880 1711-223344",
        'text',
        'contact',
      ],
      ['map_lat', '23.9875', '23.9875', 'text', 'map'],
      ['map_lng', '90.8214', '90.8214', 'text', 'map'],
      ['map_zoom', '17', '17', 'number', 'map'],
      ['boundary_geojson', boundaryGeoJson, boundaryGeoJson, 'json', 'map'],
      ['contact_phone', '+880 1711-223344, +880 1819-556677', '+880 1711-223344, +880 1819-556677', 'text', 'contact'],
      ['contact_email', 'info@manikpureidgah.org', 'info@manikpureidgah.org', 'text', 'contact'],
      ['facebook_url', 'https://facebook.com/manikpureidgah', 'https://facebook.com/manikpureidgah', 'text', 'social'],
      ['youtube_url', 'https://youtube.com/@manikpureidgah', 'https://youtube.com/@manikpureidgah', 'text', 'social'],
      ['hero_bg_style', 'eid-dawn', 'eid-dawn', 'text', 'general'],
      ['hero_image', 'defaults/eidgah-hero.svg', 'defaults/eidgah-hero.svg', 'image', 'general'],
      ['show_bismillah', '1', '1', 'boolean', 'general'],
      ['show_donation_amount', '1', '1', 'boolean', 'privacy'],
      ['show_member_amount', '1', '1', 'boolean', 'privacy'],
      ['allow_photo_download', '1', '1', 'boolean', 'general'],
      ['committee_title', 'সাত সদস্যবিশিষ্ট উন্নয়ন কমিটি', 'Seven-Member Development Committee', 'text', 'general'],
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
        { nameBn: 'সাইফুর রহমান বাবলু', nameEn: 'Saifur Rahman Bablu', order: 5 },
        { nameBn: 'মিজানুর রহমান সুমন', nameEn: 'Mijanur Rahman Sumon', order: 6 },
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
      console.log(`✓ Committee: Development committee already exists (skipped).`);
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

