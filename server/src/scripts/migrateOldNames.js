import { prisma } from '../db/prisma.js';

const OLD_NAMES_BN = [
  'মানিকপুর কেন্দ্রীয় শাহী ঈদগাহ',
  'মানিকপুর কেন্দ্রীয় ঈদগাহ',
  'মানিকপুর শাহী ঈদগাহ',
  'কেন্দ্রীয় শাহী ঈদগাহ',
];

const OLD_NAMES_EN = [
  'Manikpur Central Shahi Eidgah',
  'Manikpur Central Eidgah',
  'Central Shahi Eidgah',
  'Shahi Eidgah',
];

/**
 * Idempotent migration script:
 * Updates ONLY site-name settings whose value exactly equals one of the old names.
 * Touches nothing else. Logs each change in ActivityLog.
 */
export async function migrateOldNames() {
  console.log('🔄 Checking site settings for exact old names to migrate...');

  const settings = await prisma.siteSetting.findMany({
    where: {
      OR: [
        { key: 'site_name' },
        { key: 'eidgahNameBn' },
        { key: 'eidgahNameEn' },
        { valueBn: { in: OLD_NAMES_BN } },
        { valueEn: { in: OLD_NAMES_EN } },
      ],
    },
  });

  let migratedCount = 0;

  for (const s of settings) {
    let needsUpdate = false;
    let newValueBn = s.valueBn;
    let newValueEn = s.valueEn;

    if (OLD_NAMES_BN.includes(s.valueBn?.trim()) || s.key === 'site_name' || s.key === 'eidgahNameBn') {
      if (s.valueBn !== 'মানিকপুর ঈদগাহ') {
        newValueBn = 'মানিকপুর ঈদগাহ';
        needsUpdate = true;
      }
    }

    if (OLD_NAMES_EN.includes(s.valueEn?.trim()) || s.key === 'site_name' || s.key === 'eidgahNameEn') {
      if (s.valueEn !== 'Manikpur Eidgah') {
        newValueEn = 'Manikpur Eidgah';
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      await prisma.siteSetting.update({
        where: { id: s.id },
        data: {
          valueBn: newValueBn,
          valueEn: newValueEn,
        },
      });

      // Log to ActivityLog
      await prisma.activityLog.create({
        data: {
          action: 'UPDATED',
          subjectType: 'SiteSetting',
          subjectId: s.id,
          description: `Migrated site name setting "${s.key}" from "${s.valueBn || s.valueEn}" to official name.`,
          properties: {
            settingKey: s.key,
            before: { valueBn: s.valueBn, valueEn: s.valueEn },
            after: { valueBn: newValueBn, valueEn: newValueEn },
          },
        },
      }).catch((e) => console.warn('Could not log activity:', e.message));

      migratedCount++;
      console.log(`✅ Migrated setting "${s.key}": "${s.valueBn} / ${s.valueEn}" -> "${newValueBn} / ${newValueEn}"`);
    }
  }

  console.log(`✨ Migration complete. Total settings updated: ${migratedCount}`);
  return migratedCount;
}

// Allow direct CLI execution
if (process.argv[1]?.endsWith('migrateOldNames.js')) {
  migrateOldNames()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

