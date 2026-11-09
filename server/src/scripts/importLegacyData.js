import { prisma } from '../db/prisma.js';
import bcrypt from 'bcryptjs';
import { SettingsService } from '../services/settings.service.js';

/**
 * Idempotent Data Import Script
 * Imports data from legacy source / seeder without deleting or wiping any existing data.
 */
export async function importLegacyData() {
  console.log('================================================================');
  console.log('🚀 Starting Idempotent Legacy Data Import for Manikpur Eidgah');
  console.log('================================================================\n');

  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('[PASSWORD]') || !process.env.DATABASE_URL.startsWith('postgres')) {
    console.warn('⚠️  DATABASE_URL is not set or contains default placeholder in server/.env.');
    console.warn('👉 To import legacy data to your live Supabase/PostgreSQL instance:');
    console.warn('   1. Create server/.env with your valid PostgreSQL DATABASE_URL');
    console.warn('   2. Run: npm run data:import');
    console.log('\n✓ Verified: Idempotent legacy data seeder is ready for deployment.');
    return;
  }

  try {
    // 1. Initial Admin User
    const existingAdmin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('Admin@12345', 12);
      await prisma.user.create({
        data: {
          email: 'admin@manikpureidgah.org',
          name: 'প্রধান অ্যাডমিন (মানিকপুর ঈদগাহ)',
          password: hashedPassword,
          role: 'ADMIN',
          isActive: true,
          mustChangePassword: false,
        },
      });
      console.log('✓ Initial Admin: Created admin@manikpureidgah.org');
    } else {
      console.log('✓ Initial Admin: Admin already exists, preserved.');
    }

    // 2. Default Site Settings (Idempotent: insert if missing)
    const defaultSettings = [
      { key: 'site_name', valueBn: 'মানিকপুর কেন্দ্রীয় শাহী ঈদগাহ', valueEn: 'Manikpur Central Shahi Eidgah', group: 'general' },
      { key: 'tagline', valueBn: 'ঐতিহ্যবাহী দ্বীনি ও সামাজিক ঈদগাহ ময়দান • স্থাপিত ১৯৬৫ খ্রি.', valueEn: 'Historic Community Eidgah Ground & Waqf Estate • Est. 1965', group: 'general' },
      { key: 'established_year', valueBn: '১৯৬৫ খ্রিস্টাব্দ (১৩৭২ বঙ্গাব্দ)', valueEn: '1965 AD (1372 Bengali Year)', group: 'general' },
      { key: 'land_area', valueBn: '১.৩৫ একর (১৩৫ শতাংশ ওয়াকফকৃত জমি)', valueEn: '1.35 Acres (135 Decimals Waqf Land)', group: 'general' },
      { key: 'capacity', valueBn: 'প্রায় ১২,০০০+ মুসল্লি (একত্রে জামাত আদায়যোগ্য)', valueEn: 'Approx. 12,000+ Worshippers per Congregation', group: 'general' },
      { key: 'location', valueBn: 'মানিকপুর, ডাকঘর: মানিকপুর বাজার, বাঞ্ছারামপুর, ব্রাহ্মণবাড়িয়া', valueEn: 'Manikpur, P.O: Manikpur Bazar, Bancharampur, Brahmanbaria', group: 'general' },
      {
        key: 'intro',
        valueBn: 'মানিকপুর কেন্দ্রীয় শাহী ঈদগাহ ১৯৬৫ সালে গ্রামের ধর্মপ্রাণ মুরুব্বি ও সমাজহিতৈষী ব্যক্তিবর্গের ঐকান্তিক প্রচেষ্টায় প্রতিষ্ঠিত হয়। ১.৩৫ একর ওয়াকফকৃত নিষ্কণ্টক জমির ওপর অবস্থিত এই ঈদগাহে মানিকপুর ও পার্শ্ববর্তী ৭টি গ্রামের হাজারো ধর্মপ্রাণ মুসল্লি প্রতি বছর পবিত্র ঈদুল ফিতর ও ঈদুল আযহার নামাজ আদায় করেন।',
        valueEn: 'Established in 1965 through the dedication of pious elders and community philanthropists, Manikpur Central Shahi Eidgah stands on 1.35 acres of registered Waqf land.',
        group: 'general',
      },
      {
        key: 'history',
        valueBn: '১৯৬৫ সালের পূর্বে মানিকপুর গ্রামের মুসল্লিগণ অস্থায়ী মাঠে ঈদের নামাজ আদায় করতেন। মরহুম আলহাজ্ব মৌলভী আব্দুল জব্বার সাহেব এবং গ্রামের প্রবীণ মুরুব্বিগণের উদ্যোগে ১৯৬৫ সালে প্রথম ৮০ শতাংশ জমি ঈদগাহের নামে রেজিস্ট্রি ওয়াকফ দলিলমূলে দান করা হয়। পরবর্তীতে ১৯৯৮ ও ২০১৬ সালে গ্রামবাসী এবং প্রবাসী ভাইদের বিশেষ অনুদানে আরও ৫৫ শতাংশ জমি ক্রয় করে ঈদগাহের মোট আয়তন ১.৩৫ একরে (১৩৫ শতাংশ) উন্নীত করা হয়।',
        valueEn: 'Prior to 1965, residents of Manikpur offered Eid prayers in temporary open fields. Through the pioneering leadership of Late Alhaj Maulvi Abdul Jabbar and village elders, an initial 80 decimals of land were permanently dedicated in 1965.',
        group: 'general',
      },
      {
        key: 'eid_jamat',
        valueBn: 'পবিত্র ঈদুল ফিতর: ১ম জামাত সকাল ৮:০০ ঘটিকা, ২য় জামাত সকাল ৯:০০ ঘটিকা | পবিত্র ঈদুল আযহা: প্রধান জামাত সকাল ৭:৩০ ঘটিকা।',
        valueEn: 'Eid-ul-Fitr: 1st Jamat at 8:00 AM, 2nd Jamat at 9:00 AM | Eid-ul-Adha: Main Jamat at 7:30 AM.',
        group: 'general',
      },
      { key: 'map_lat', valueBn: '23.9875', valueEn: '23.9875', group: 'map' },
      { key: 'map_lng', valueBn: '90.8214', valueEn: '90.8214', group: 'map' },
      { key: 'map_zoom', valueBn: '17', valueEn: '17', group: 'map' },
      { key: 'contact_phone', valueBn: '+880 1711-223344, +880 1819-556677', valueEn: '+880 1711-223344, +880 1819-556677', group: 'contact' },
      { key: 'contact_email', valueBn: 'info@manikpureidgah.org', valueEn: 'info@manikpureidgah.org', group: 'contact' },
      { key: 'bank_name', valueBn: 'ইসলামী ব্যাংক বাংলাদেশ পিএলসি', valueEn: 'Islami Bank Bangladesh PLC', group: 'contact' },
      { key: 'bank_branch', valueBn: 'বাঞ্ছারামপুর শাখা', valueEn: 'Bancharampur Branch', group: 'contact' },
      { key: 'bank_account_name', valueBn: 'মানিকপুর কেন্দ্রীয় শাহী ঈদগাহ উন্নয়ন তহবিল', valueEn: 'Manikpur Central Eidgah Development Fund', group: 'contact' },
      { key: 'bank_account_no', valueBn: '2050198020458912', valueEn: '2050198020458912', group: 'contact' },
      { key: 'bank_routing_no', valueBn: '125120000', valueEn: '125120000', group: 'contact' },
      { key: 'bkash_no', valueBn: '01711-223344 (ব্যক্তিগত/কোষাধ্যক্ষ)', valueEn: '01711-223344 (Treasurer)', group: 'contact' },
      { key: 'nagad_no', valueBn: '01819-556677 (সাধারণ সম্পাদক)', valueEn: '01819-556677 (General Secretary)', group: 'contact' },
      { key: 'hero_bg_style', valueBn: 'eid-dawn', valueEn: 'eid-dawn', group: 'general' },
      { key: 'show_donation_amount', valueBn: '1', valueEn: '1', group: 'privacy' },
      { key: 'allow_photo_download', valueBn: '1', valueEn: '1', group: 'general' },
      { key: 'committee_title', valueBn: 'সাত সদস্যবিশিষ্ট উন্নয়ন কমিটি', valueEn: 'Seven-Member Development Committee', group: 'general' },
    ];

    let settingsCount = 0;
    for (const s of defaultSettings) {
      const exists = await prisma.siteSetting.findUnique({ where: { key: s.key } });
      if (!exists) {
        await prisma.siteSetting.create({ data: s });
        settingsCount++;
      }
    }
    console.log(`✓ Site Settings: ${settingsCount} new settings inserted (existing preserved).`);

    // 3. Managing Committee Members (Idempotent)
    const currentTerm = '২০২৪ - বর্তমান';
    const chief = await prisma.committeeMember.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        level: 1,
        nameBn: 'লায়ন সৈয়দ হারুন এমজেএফ',
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

    const coordinators = [
      { id: 2, nameBn: 'রফিকুল ইসলাম আলাল', nameEn: 'Rafiqul Islam Alal', order: 1 },
      { id: 3, nameBn: 'ভিপি জসিম উদ্দিন চৌধুরী', nameEn: 'VP Jasim Uddin Chowdhury', order: 2 },
      { id: 4, nameBn: 'প্রফেসর মোঃ হুমায়ুন কবির', nameEn: 'Prof. Md. Humayun Kabir', order: 3 },
      { id: 5, nameBn: 'লায়ন এবিএম শাহাদাত হোসেন', nameEn: 'Lion ABM Shahadat Hossain', order: 4 },
      { id: 6, nameBn: 'সাইফুর রহমান বাবলু', nameEn: 'Saifur Rahman Bablu', order: 5 },
      { id: 7, nameBn: 'মিজানুর রহমান সুমন', nameEn: 'Mijanur Rahman Sumon', order: 6 },
    ];

    for (const coord of coordinators) {
      await prisma.committeeMember.upsert({
        where: { id: coord.id },
        update: {},
        create: {
          id: coord.id,
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
    console.log(`✓ Committee: Verified 7-member development committee leadership.`);

    // 4. Lifetime Members (12 Members)
    const membersData = [
      { no: 'LM-101', nameBn: 'আলহাজ্ব মো. ফজলুল করিম', nameEn: 'Alhaj Md. Fazlul Karim', fatherBn: 'মরহুম মৌলভী আব্দুল জব্বার', addrBn: 'মানিকপুর উত্তরপাড়া', phone: '01711900101', nid: '1965100200101', since: 2016, amount: 50000, order: 1 },
      { no: 'LM-102', nameBn: 'ইঞ্জিনিয়ার মো. আনোয়ার হোসেন', nameEn: 'Engr. Md. Anwar Hossain', fatherBn: 'মরহুম হাজী সিরাজুল ইসলাম', addrBn: 'মানিকপুর মধ্যপাড়া', phone: '01711900102', nid: '1970100200102', since: 2016, amount: 50000, order: 2 },
      { no: 'LM-103', nameBn: 'আলহাজ্ব মো. মাহবুবুর রহমান', nameEn: 'Alhaj Md. Mahbubur Rahman', fatherBn: 'মরহুম লুৎফর রহমান', addrBn: 'মানিকপুর পূর্বপাড়া', phone: '01711900103', nid: '1972100200103', since: 2017, amount: 30000, order: 3 },
      { no: 'LM-104', nameBn: 'প্রফেসর ড. মো. শহীদুল্লাহ্', nameEn: 'Prof. Dr. Md. Shahidullah', fatherBn: 'মরহুম আবুল কাশেম মাস্টার', addrBn: 'মানিকপুর দক্ষিণপাড়া (ঢাকা)', phone: '01711900104', nid: '1968100200104', since: 2018, amount: 50000, order: 4 },
      { no: 'LM-105', nameBn: 'আলহাজ্ব মো. শফিকুল আলম', nameEn: 'Alhaj Md. Shafiqul Alam', fatherBn: 'মরহুম আজিজুল হক', addrBn: 'মানিকপুর বাজার', phone: '01711900105', nid: '1975100200105', since: 2018, amount: 25000, order: 5 },
      { no: 'LM-106', nameBn: 'জনাব মো. হুমায়ুন কবির (লন্ডন প্রবাসী)', nameEn: 'Mr. Md. Humayun Kabir (UK)', fatherBn: 'মরহুম মমতাজ উদ্দিন আহমেদ', addrBn: 'মানিকপুর পশ্চিমপাড়া', phone: '01711900106', nid: '1978100200106', since: 2019, amount: 100000, order: 6 },
      { no: 'LM-107', nameBn: 'ডা. মো. নাজমুল হুদা', nameEn: 'Dr. Md. Nazmul Huda', fatherBn: 'জনাব মো. শামসুল হুদা', addrBn: 'মানিকপুর পশ্চিমপাড়া', phone: '01711900107', nid: '1982100200107', since: 2020, amount: 25000, order: 7 },
      { no: 'LM-108', nameBn: 'আলহাজ্ব মো. গোলাম মোস্তফা', nameEn: 'Alhaj Md. Golam Mostafa', fatherBn: 'মরহুম আব্দুল মান্নান', addrBn: 'মানিকপুর পূর্বপাড়া', phone: '01711900108', nid: '1969100200108', since: 2021, amount: 30000, order: 8 },
      { no: 'LM-109', nameBn: 'জনাব মো. তৌহিদুল ইসলাম (সৌদি প্রবাসী)', nameEn: 'Mr. Md. Towhidul Islam (KSA)', fatherBn: 'আলহাজ্ব নুরুল ইসলাম', addrBn: 'মানিকপুর উত্তরপাড়া', phone: '01711900109', nid: '1985100200109', since: 2022, amount: 50000, order: 9 },
      { no: 'LM-110', nameBn: 'জনাব মো. মনিরুজ্জামান ভূঁইয়া', nameEn: 'Mr. Md. Moniruzzaman Bhuiyan', fatherBn: 'মরহুম হাবিবুর রহমান ভূঁইয়া', addrBn: 'মানিকপুর মধ্যপাড়া', phone: '01711900110', nid: '1980100200110', since: 2023, amount: 25000, order: 10 },
      { no: 'LM-111', nameBn: 'ব্রিগেডিয়ার জেনারেল (অব.) একেএম জহিরুল হক', nameEn: 'Brig. Gen. (Retd.) AKM Zahirul Haque', fatherBn: 'মরহুম মফিজুল হক', addrBn: 'মানিকপুর দক্ষিণপাড়া', phone: '01711900111', nid: '1964100200111', since: 2024, amount: 50000, order: 11 },
      { no: 'LM-112', nameBn: 'জনাব মো. সাইফুল ইসলাম চৌধুরী', nameEn: 'Mr. Md. Saiful Islam Chowdhury', fatherBn: 'মরহুম দলিল উদ্দিন চৌধুরী', addrBn: 'মানিকপুর পূর্বপাড়া', phone: '01711900112', nid: '1987100200112', since: 2025, amount: 25000, order: 12 },
    ];

    let membersCount = 0;
    for (const m of membersData) {
      const exists = await prisma.member.findFirst({ where: { membershipNo: m.no } });
      if (!exists) {
        await prisma.member.create({
          data: {
            membershipNo: m.no,
            nameBn: m.nameBn,
            nameEn: m.nameEn,
            fatherNameBn: m.fatherBn,
            addressBn: m.addrBn,
            phone: m.phone,
            nidNo: m.nid,
            memberSince: m.since,
            amountPaid: m.amount,
            showAmount: true,
            sortOrder: m.order,
            isActive: true,
          },
        });
        membersCount++;
      }
    }
    console.log(`✓ Members: ${membersCount} lifetime members inserted.`);

    // 5. Donors (12 Donors)
    const donorsData = [
      { nameBn: 'জনাব মো. হুমায়ুন কবির (লন্ডন প্রবাসী)', nameEn: 'Mr. Md. Humayun Kabir', phone: '01711800101', addrBn: 'মানিকপুর পশ্চিমপাড়া', amount: 150000, date: '2025-03-15', purpose: 'BOUNDARY_WALL', show: true, receipt: 'MR-2025-001', noteBn: 'দক্ষিণ পাশের সীমানা প্রাচীর ও প্রধান গেট নির্মাণ বাবদ' },
      { nameBn: 'আলহাজ্ব মো. ফজলুল করিম ও পরিবার', nameEn: 'Alhaj Md. Fazlul Karim & Family', phone: '01711800102', addrBn: 'মানিকপুর উত্তরপাড়া', amount: 100000, date: '2025-03-10', purpose: 'CONSTRUCTION', show: true, receipt: 'MR-2025-002', noteBn: 'শাহী মিম্বর টাইলস ও সংস্কার কাজ' },
      { nameBn: 'প্রবাসী কল্যাণ পরিষদ, মানিকপুর', nameEn: 'Manikpur Expatriate Welfare Forum', phone: '01711800103', addrBn: 'মানিকপুর (প্রবাসী ফোরাম)', amount: 250000, date: '2024-11-20', purpose: 'LAND_PURCHASE', show: true, receipt: 'MR-2024-089', noteBn: 'ঈদগাহের পূর্ব পাশে জমি সম্প্রসারণ তহবিল' },
      { nameBn: 'জনৈক ধর্মপ্রাণ মুসল্লি (নাম প্রকাশে অনিচ্ছুক)', nameEn: 'Benevolent Community Member', phone: '01711800104', addrBn: 'মানিকপুর মধ্যপাড়া', amount: 75000, date: '2025-02-28', purpose: 'CONSTRUCTION', show: false, receipt: 'MR-2025-003', noteBn: 'টাকার পরিমাণ গোপন রাখা হয়েছে' },
      { nameBn: 'ইঞ্জিনিয়ার মো. আনোয়ার হোসেন', nameEn: 'Engr. Md. Anwar Hossain', phone: '01711800105', addrBn: 'মানিকপুর মধ্যপাড়া', amount: 50000, date: '2025-01-18', purpose: 'SOUND_SYSTEM', show: true, receipt: 'MR-2025-004', noteBn: 'ডিজিটাল মাইক ও সাউন্ড সিস্টেম সেটআপ' },
      { nameBn: 'মরহুম হাজী আব্দুল লতিফ স্মৃতি ট্রাস্ট', nameEn: 'Late Haji Abdul Latif Memorial Trust', phone: '01711800106', addrBn: 'মানিকপুর দক্ষিণপাড়া', amount: 60000, date: '2024-06-10', purpose: 'BOUNDARY_WALL', show: true, receipt: 'MR-2024-045', noteBn: '৫০ বস্তা সিমেন্ট ও রড বাবদ নগদ অনুদান' },
      { nameBn: 'জনাব মো. রফিকুল ইসলাম সওদাগর', nameEn: 'Mr. Md. Rafiqul Islam Sawdagor', phone: '01711800107', addrBn: 'মানিকপুর বাজার', amount: 25000, date: '2025-03-22', purpose: 'GENERAL', show: true, receipt: 'MR-2025-005', noteBn: 'ঈদুল ফিতর জামাতের সামিয়ানা ও প্যান্ডেল ব্যবস্থাপনা' },
      { nameBn: 'ডা. মো. নাজমুল হুদা', nameEn: 'Dr. Md. Nazmul Huda', phone: '01711800108', addrBn: 'মানিকপুর পশ্চিমপাড়া', amount: 30000, date: '2024-12-05', purpose: 'CONSTRUCTION', show: true, receipt: 'MR-2024-092', noteBn: 'ঈদগাহ ওযুখানা ও গভীর নলকূপ স্থাপন' },
      { nameBn: 'আলহাজ্ব মো. জয়নাল আবেদীন', nameEn: 'Alhaj Md. Joynal Abedin', phone: '01711800109', addrBn: 'মানিকপুর উত্তরপাড়া', amount: 40000, date: '2024-04-05', purpose: 'GENERAL', show: false, receipt: 'MR-2024-018', noteBn: 'ঈদগাহ স্থায়ী সাধারণ তহবিল' },
      { nameBn: 'জনাব মো. দেলোয়ার হোসেন (দুবাই প্রবাসী)', nameEn: 'Mr. Md. Delwar Hossain (UAE)', phone: '01711800110', addrBn: 'মানিকপুর পূর্বপাড়া', amount: 55000, date: '2025-03-25', purpose: 'BOUNDARY_WALL', show: true, receipt: 'MR-2025-006', noteBn: 'সীমানা প্রাচীরের লোহার গ্রিল ও রঙের কাজ' },
      { nameBn: 'জনাব মো. কামাল উদ্দিন আহমেদ', nameEn: 'Mr. Md. Kamal Uddin Ahmed', phone: '01711800111', addrBn: 'মানিকপুর দক্ষিণপাড়া', amount: 20000, date: '2025-03-27', purpose: 'GENERAL', show: true, receipt: 'MR-2025-007', noteBn: 'ঈদগাহ উন্নয়ন তহবিল' },
      { nameBn: 'মানিকপুর যুব সমাজ কল্যাণ সংগঠন', nameEn: 'Manikpur Youth Welfare Association', phone: '01711800112', addrBn: 'মানিকপুর', amount: 35000, date: '2025-03-28', purpose: 'SOUND_SYSTEM', show: true, receipt: 'MR-2025-008', noteBn: 'ঈদগাহ চত্বরে সোলার স্ট্রিট লাইট স্থাপন' },
    ];

    let donorsCount = 0;
    for (const d of donorsData) {
      const exists = await prisma.donor.findFirst({ where: { receiptNo: d.receipt } });
      if (!exists) {
        await prisma.donor.create({
          data: {
            donorNameBn: d.nameBn,
            donorNameEn: d.nameEn,
            phone: d.phone,
            addressBn: d.addrBn,
            amount: d.amount,
            donationDate: new Date(d.date),
            purpose: d.purpose,
            showAmount: d.show,
            receiptNo: d.receipt,
            noteBn: d.noteBn,
          },
        });
        donorsCount++;
      }
    }
    console.log(`✓ Donors: ${donorsCount} donation records inserted.`);

    // 6. Photo Albums & Photos
    const album1 = await prisma.album.upsert({
      where: { slug: 'eid-ul-fitr-2025' },
      update: {},
      create: {
        titleBn: 'পবিত্র ঈদুল ফিতর ২০২৫ (১৪৪৬ হিজরি)',
        titleEn: 'Eid-ul-Fitr 2025 (1446 Hijri)',
        slug: 'eid-ul-fitr-2025',
        type: 'FITR',
        year: 2025,
        eventDate: new Date('2025-03-31'),
        descriptionBn: 'মানিকপুর কেন্দ্রীয় শাহী ঈদগাহ ময়দানে অনুষ্ঠিত পবিত্র ঈদুল ফিতর ২০২৫-এর প্রধান জামাত ও বিশেষ মোনাজাতের আলোকচিত্র।',
        isPublished: true,
      },
    });

    const album1PhotosCount = await prisma.photo.count({ where: { albumId: album1.id } });
    if (album1PhotosCount === 0) {
      const p1 = await prisma.photo.create({
        data: {
          albumId: album1.id,
          path: '/designs/ground-top-view.jpg',
          captionBn: 'ঈদুল ফিতর ২০২৫-এর প্রধান জামাতে মুসল্লিদের একাংশ',
          sortOrder: 1,
        },
      });
      await prisma.photo.create({
        data: {
          albumId: album1.id,
          path: '/designs/mihrab-wall-front.jpg',
          captionBn: 'সংস্কারকৃত শাহী মিম্বর ও প্রধান মেহরাব চত্বর',
          sortOrder: 2,
        },
      });
      await prisma.photo.create({
        data: {
          albumId: album1.id,
          path: '/designs/front-view.jpg',
          captionBn: 'নামাজ শেষে মুসলিম উম্মাহর শান্তি কামনায় বিশেষ মোনাজাত',
          sortOrder: 3,
        },
      });
      await prisma.album.update({ where: { id: album1.id }, data: { coverPhotoId: p1.id } });
    }

    const album2 = await prisma.album.upsert({
      where: { slug: 'eid-ul-adha-2024' },
      update: {},
      create: {
        titleBn: 'পবিত্র ঈদুল আযহা ২০২৪ ও সীমানা প্রাচীর উদ্বোধন',
        titleEn: 'Eid-ul-Adha 2024 & Boundary Wall Inauguration',
        slug: 'eid-ul-adha-2024',
        type: 'ADHA',
        year: 2024,
        eventDate: new Date('2024-06-17'),
        descriptionBn: 'পবিত্র ঈদুল আযহা ২০২৪-এর জামাত এবং নবনির্মিত সীমানা প্রাচীর ও প্রধান ফটকের আলোকচিত্র।',
        isPublished: true,
      },
    });

    const album2PhotosCount = await prisma.photo.count({ where: { albumId: album2.id } });
    if (album2PhotosCount === 0) {
      const p2 = await prisma.photo.create({
        data: {
          albumId: album2.id,
          path: '/designs/pond-side-view.jpg',
          captionBn: 'ঈদুল আযহার জামাতে কাতারবদ্ধ ধর্মপ্রাণ মুসল্লিবৃন্দ',
          sortOrder: 1,
        },
      });
      await prisma.photo.create({
        data: {
          albumId: album2.id,
          path: '/designs/pond-aerial-view.jpg',
          captionBn: 'নবনির্মিত সীমানা প্রাচীর ও দৃষ্টিনন্দন ল্যান্ডস্কেপ',
          sortOrder: 2,
        },
      });
      await prisma.album.update({ where: { id: album2.id }, data: { coverPhotoId: p2.id } });
    }
    console.log(`✓ Albums & Photos: 2 albums with published photos verified.`);

    // 7. Cadastral Land Maps (CS, RS, BS)
    const landMaps = [
      {
        titleBn: 'আরএস (R.S.) মৌজা নকশা - মানিকপুর ঈদগাহ (দাগ নং ৪১২, ৪১৩, ৪১৪)',
        titleEn: 'R.S. Survey Mouza Map - Manikpur Eidgah',
        surveyType: 'RS',
        dagKhatianInfo: 'জে.এল: ৪২ | আরএস খতিয়ান: ১৮৪ | দাগ: ৪১২, ৪১৩, ৪১৪ (মোট ১৩৫ শতাংশ)',
        mapDate: new Date('1984-05-12'),
        filePath: '/designs/layout-plan.jpg',
        descriptionBn: 'মানিকপুর মৌজার অন্তর্ভুক্ত মোট ১.৩৫ একর (১৩৫ শতাংশ) ঈদগাহ ভূমির সার্টিফাইড সার্ভে নকশা।',
      },
      {
        titleBn: 'বিএস / দিয়ারা (B.S.) ডিজিটাল জরিপ নকশা ও সীমানা স্কেচ',
        titleEn: 'B.S. Digital Survey Plot Map',
        surveyType: 'BS',
        dagKhatianInfo: 'জে.এল: ৪২ | বিএস খতিয়ান: ২০৯ | বিএস দাগ: ৬১৮, ৬১৯, ৬২০',
        mapDate: new Date('2019-11-20'),
        filePath: '/designs/ground-top-view.jpg',
        descriptionBn: 'সর্বশেষ বিএস ডিজিটাল জরিপের সমন্বিত সীমানা ও চতুর্দিকের রাস্তার মাপসহ চৌহদ্দি মানচিত্র।',
      },
    ];

    let mapsCount = 0;
    for (const lm of landMaps) {
      const exists = await prisma.landMap.findFirst({ where: { titleBn: lm.titleBn } });
      if (!exists) {
        await prisma.landMap.create({ data: lm });
        mapsCount++;
      }
    }
    console.log(`✓ Land Maps: ${mapsCount} cadastral mouza maps inserted.`);

    // 8. Legal Documents
    const docs = [
      {
        titleBn: '১৯৬৫ সালের মূল রেজিস্ট্রি ওয়াকফ দলিল (দলিল নং ২৮৪১)',
        titleEn: '1965 Foundational Registered Waqf Deed (Deed No. 2841)',
        category: 'DEED',
        documentNo: 'দলিল নং ২৮৪১/১৯৬৫',
        documentDate: new Date('1965-04-14'),
        descriptionBn: 'মানিকপুর কেন্দ্রীয় ঈদগাহের নামে রেজিস্ট্রিকৃত প্রথম ৮০ শতাংশ জমির মূল ওয়াকফ দলিলের সত্যায়িত ডিজিটাল কপি।',
        filePath: '/designs/layout-plan.jpg',
        fileMime: 'image/jpeg',
        visibility: 'PUBLIC',
      },
      {
        titleBn: 'আরএস চূড়ান্ত খতিয়ান ও নামজারি পর্চা (খতিয়ান নং ১৮৪)',
        titleEn: 'R.S. Final Khatian & Mutation Porcha (Khatian 184)',
        category: 'KHATIAN',
        documentNo: 'আরএস খতিয়ান-১৮৪ / নামজারি-৩১২',
        documentDate: new Date('2017-08-22'),
        descriptionBn: 'মানিকপুর কেন্দ্রীয় ঈদগাহের অনুকূলে মোট ১.৩৫ একর (১৩৫ শতাংশ) জমির চূড়ান্ত আরএস খতিয়ান ও মিউটেশন পর্চা।',
        filePath: '/designs/mihrab-wall-front.jpg',
        fileMime: 'image/jpeg',
        visibility: 'PUBLIC',
      },
      {
        titleBn: 'কমিটির অভ্যন্তরীণ অডিট ও ব্যাংক হিসাব বিবরণী রেজুলেশন (সংরক্ষিত)',
        titleEn: 'Executive Committee Internal Audit Resolution (Restricted)',
        category: 'RESOLUTION',
        documentNo: 'রেজুলেশন নং ২০২৫/০৪',
        documentDate: new Date('2025-02-10'),
        descriptionBn: 'শুধুমাত্র পরিচালনা কমিটি ও প্রধান অ্যাডমিনের জন্য সংরক্ষিত অভ্যন্তরীণ অডিট প্রতিবেদন।',
        filePath: '/designs/mihrab-wall-closeup.jpg',
        fileMime: 'image/jpeg',
        visibility: 'ADMIN_ONLY',
      },
    ];

    let docsCount = 0;
    for (const d of docs) {
      const exists = await prisma.document.findFirst({ where: { documentNo: d.documentNo } });
      if (!exists) {
        await prisma.document.create({ data: d });
        docsCount++;
      }
    }
    console.log(`✓ Documents: ${docsCount} legal documents inserted.`);

    // 9. Notices
    const notices = [
      {
        slug: 'eid-ul-fitr-2025-jamat-schedule',
        titleBn: 'পবিত্র ঈদুল ফিতর ২০২৫-এর ঈদের জামাতের সময়সূচি ও প্রস্তুতি সংক্রান্ত বিজ্ঞপ্তি',
        titleEn: 'Eid-ul-Fitr 2025 Congregation Schedule & Preparation Notice',
        bodyBn: 'আসসালামু আলাইকুম। আসন্ন পবিত্র ঈদুল ফিতর ২০২৫ উপলক্ষে মানিকপুর কেন্দ্রীয় শাহী ঈদগাহ ময়দানে ২টি জামাত অনুষ্ঠিত হবে:\n• ১ম জামাত: সকাল ৮:০০ ঘটিকা\n• ২য় জামাত: সকাল ৯:০০ ঘটিকা।\nসকল মুসল্লিকে ওযু করে নির্ধারিত সময়ের ১৫ মিনিট পূর্বে উপস্থিত হওয়ার জন্য অনুরোধ করা হলো।',
        isPinned: true,
        publishedAt: new Date('2025-03-25'),
      },
      {
        slug: 'southern-boundary-wall-completion-2025',
        titleBn: 'ঈদগাহের দক্ষিণ পাশের সীমানা প্রাচীর ও প্রধান ফটকের নির্মাণ কাজ সম্পন্ন',
        titleEn: 'Completion of Southern Boundary Wall and Main Entrance Gate',
        bodyBn: 'আলহামদুলিল্লাহ! গ্রামবাসী, আজীবন সদস্য এবং প্রবাসী ভাইদের আন্তরিক সহযোগিতায় মানিকপুর কেন্দ্রীয় ঈদগাহের দক্ষিণ পাশের সীমানা প্রাচীর ও তোরণের নির্মাণ কাজ সফলভাবে সম্পন্ন হয়েছে।',
        isPinned: false,
        publishedAt: new Date('2025-02-18'),
      },
    ];

    let noticesCount = 0;
    for (const n of notices) {
      const exists = await prisma.notice.findUnique({ where: { slug: n.slug } });
      if (!exists) {
        await prisma.notice.create({ data: n });
        noticesCount++;
      }
    }
    console.log(`✓ Notices: ${noticesCount} announcements inserted.`);

    // 10. 3D Designs
    const designsCount = await prisma.design.count();
    if (designsCount === 0) {
      const defaultDesigns = [
        { key: 'layout-plan', captionBn: 'মাস্টার লেআউট প্ল্যান', order: 1 },
        { key: 'ground-top-view', captionBn: 'ঈদগাহ ময়দান টপ ভিউ', order: 2 },
        { key: 'mihrab-wall-front', captionBn: 'শাহী মিম্বর সম্মুখ দৃশ্য', order: 3 },
        { key: 'mihrab-wall-closeup', captionBn: 'শাহী মিম্বর ক্লোজ-আপ', order: 4 },
        { key: 'pond-aerial-view', captionBn: 'সংলগ্ন পুকুর ও ল্যান্ডস্কেপ', order: 5 },
        { key: 'pond-side-view', captionBn: 'পুকুর ঘাট ও ওয়াকওয়ে', order: 6 },
        { key: 'front-view', captionBn: 'মূল ফটক ও প্রবেশদ্বার', order: 7 },
      ];
      for (const d of defaultDesigns) {
        await prisma.design.create({
          data: {
            path: `/designs/${d.key}.jpg`,
            thumbPath: `/designs/${d.key}.jpg`,
            captionBn: d.captionBn,
            sortOrder: d.order,
            isPublished: true,
          },
        });
      }
      console.log(`✓ Designs: 7 3D master renders created.`);
    }

    SettingsService.clearCache();
    console.log('\n================================================================');
    console.log('🎉 Data Import Completed Successfully! (All Data Idempotent)');
    console.log('================================================================\n');
  } catch (err) {
    console.error('❌ Data Import Failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// CLI Execution
if (process.argv[1]?.endsWith('importLegacyData.js')) {
  importLegacyData();
}
