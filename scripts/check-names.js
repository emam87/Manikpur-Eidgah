import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const DISALLOWED_PATTERNS = [
  { name: 'Manikpur Central Shahi Eidgah', regex: /Manikpur\s+Central\s+Shahi\s+Eidgah/i },
  { name: 'Central Shahi', regex: /Central\s+Shahi/i },
  { name: 'Shahi Eidgah', regex: /Shahi\s+Eidgah/i },
  { name: 'Manikpur Central Eidgah', regex: /Manikpur\s+Central\s+Eidgah/i },
  { name: 'মানিকপুর কেন্দ্রীয় শাহী ঈদগাহ', regex: /মানিকপুর\s*কেন্দ্রীয়\s*শাহী\s*ঈদগাহ/ },
  { name: 'কেন্দ্রীয় শাহী ঈদগাহ', regex: /কেন্দ্রীয়\s*শাহী\s*ঈদগাহ/ },
  { name: 'মানিকপুর কেন্দ্রীয় ঈদগাহ', regex: /মানিকপুর\s*কেন্দ্রীয়\s*ঈদগাহ/ },
  { name: 'কেন্দ্রীয় ঈদগাহ', regex: /কেন্দ্রীয়\s*ঈদগাহ/ },
  { name: 'শাহী ঈদগাহ', regex: /শাহী\s*ঈদগাহ/ },
  { name: 'Eidgaah', regex: /\bEidgaah\b/i },
  { name: 'Eid Gah (split)', regex: /\bEid\s+Gah\b/i },
  { name: 'Idgah (without E)', regex: /\b(?<![eE])Idgah\b/ },
];

// Target scan locations
const TARGET_PATHS = [
  'client/src',
  'client/public',
  'client/index.html',
  'server/src',
  'docs',
  'README.md',
  'DEPLOYMENT.md',
  'package.json',
];

// Explicit exclusions
const EXCLUDED_PATHS = [
  'legacy-laravel',
  'migration-source',
  'node_modules',
  'dist',
  '.git',
  '.gemini',
  'scripts/check-names.js',
  'FEATURE_CHECKLIST.md', // Changelog and audit history
  'server/src/scripts/migrateOldNames.js', // migration script definitions
  'server/tests/bilingual.test.js', // test assertions check old pattern removal
];

function shouldExclude(relPath) {
  const normalized = relPath.replace(/\\/g, '/');
  return EXCLUDED_PATHS.some((ex) => normalized === ex || normalized.startsWith(ex + '/'));
}

function scanFile(filePath, violations) {
  const relPath = path.relative(rootDir, filePath).replace(/\\/g, '/');
  if (shouldExclude(relPath)) return;

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    // Skip code comments in check-names script or regex definitions
    for (const rule of DISALLOWED_PATTERNS) {
      if (rule.regex.test(line)) {
        violations.push({
          file: relPath,
          line: idx + 1,
          rule: rule.name,
          text: line.trim(),
        });
        break;
      }
    }
  });
}

function scanDirectory(dirPath, violations) {
  const relPath = path.relative(rootDir, dirPath).replace(/\\/g, '/');
  if (shouldExclude(relPath)) return;

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      scanDirectory(full, violations);
    } else if (/\.(jsx?|tsx?|json|html|md|prisma|ya?ml)$/i.test(entry.name)) {
      scanFile(full, violations);
    }
  }
}

console.log('🔍 Auditing codebase for official name consistency ("Manikpur Eidgah" / "মানিকপুর ঈদগাহ")...');

const violations = [];

for (const target of TARGET_PATHS) {
  const fullTarget = path.join(rootDir, target);
  if (!fs.existsSync(fullTarget)) continue;

  const stat = fs.statSync(fullTarget);
  if (stat.isDirectory()) {
    scanDirectory(fullTarget, violations);
  } else {
    scanFile(fullTarget, violations);
  }
}

if (violations.length > 0) {
  console.error(`\n❌ Name audit failed! Found ${violations.length} occurrence(s) of disallowed names:`);
  violations.forEach((v) => {
    console.error(`  - ${v.file}:${v.line} [Rule: "${v.rule}"]: ${v.text}`);
  });
  process.exit(1);
} else {
  console.log('\n✅ Name audit passed! All files strictly adhere to official name "Manikpur Eidgah" / "মানিকপুর ঈদগাহ".');
  process.exit(0);
}
