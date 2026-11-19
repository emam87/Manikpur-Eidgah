import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..');
const bnPath = path.join(rootDir, 'client', 'src', 'locales', 'bn.json');
const enPath = path.join(rootDir, 'client', 'src', 'locales', 'en.json');

function getAllKeys(obj, prefix = '') {
  let keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys = keys.concat(getAllKeys(value, fullKey));
    } else {
      keys.push({ key: fullKey, value });
    }
  }
  return keys;
}

function checkI18n() {
  console.log('🌐 Checking i18n key parity and completeness...');

  if (!fs.existsSync(bnPath)) {
    console.error(`❌ Missing bn.json at ${bnPath}`);
    process.exit(1);
  }
  if (!fs.existsSync(enPath)) {
    console.error(`❌ Missing en.json at ${enPath}`);
    process.exit(1);
  }

  const bnData = JSON.parse(fs.readFileSync(bnPath, 'utf8'));
  const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

  const bnEntries = getAllKeys(bnData);
  const enEntries = getAllKeys(enData);

  const bnKeys = new Set(bnEntries.map(e => e.key));
  const enKeys = new Set(enEntries.map(e => e.key));

  const missingInEn = [...bnKeys].filter(k => !enKeys.has(k));
  const missingInBn = [...enKeys].filter(k => !bnKeys.has(k));

  let hasError = false;

  if (missingInEn.length > 0) {
    console.error(`❌ Missing in en.json (${missingInEn.length} keys):`);
    missingInEn.forEach(k => console.error(`  - ${k}`));
    hasError = true;
  }

  if (missingInBn.length > 0) {
    console.error(`❌ Missing in bn.json (${missingInBn.length} keys):`);
    missingInBn.forEach(k => console.error(`  - ${k}`));
    hasError = true;
  }

  // Check for empty values
  for (const item of bnEntries) {
    if (typeof item.value !== 'string' || item.value.trim() === '') {
      console.error(`❌ Empty value in bn.json for key: ${item.key}`);
      hasError = true;
    }
  }
  for (const item of enEntries) {
    if (typeof item.value !== 'string' || item.value.trim() === '') {
      console.error(`❌ Empty value in en.json for key: ${item.key}`);
      hasError = true;
    }
  }

  if (hasError) {
    console.error('\n❌ i18n check failed!');
    process.exit(1);
  } else {
    console.log(`\n✅ i18n check passed! Total keys: ${bnKeys.size} (both bn.json and en.json match 100%)`);
  }
}

checkI18n();

