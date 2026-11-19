import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { toBengaliNumerals, formatBDT, getLocalized } from '../src/utils/formatters.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

test('i18n check: bn.json and en.json key parity & non-empty strings', () => {
  const bnPath = path.join(rootDir, 'client/src/locales/bn.json');
  const enPath = path.join(rootDir, 'client/src/locales/en.json');

  assert.ok(fs.existsSync(bnPath), 'bn.json must exist');
  assert.ok(fs.existsSync(enPath), 'en.json must exist');

  const bn = JSON.parse(fs.readFileSync(bnPath, 'utf8'));
  const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

  function getLeafKeys(obj, prefix = '') {
    const keys = [];
    for (const [k, v] of Object.entries(obj)) {
      const full = prefix ? `${prefix}.${k}` : k;
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        keys.push(...getLeafKeys(v, full));
      } else {
        keys.push(full);
      }
    }
    return keys;
  }

  const bnKeys = getLeafKeys(bn).sort();
  const enKeys = getLeafKeys(en).sort();

  const missingInEn = bnKeys.filter((k) => !enKeys.includes(k));
  const missingInBn = enKeys.filter((k) => !bnKeys.includes(k));

  assert.deepEqual(missingInEn, [], `Keys in bn.json missing in en.json: ${missingInEn.join(', ')}`);
  assert.deepEqual(missingInBn, [], `Keys in en.json missing in bn.json: ${missingInBn.join(', ')}`);

  // Verify non-empty values
  function assertNonEmpty(obj, prefix = '') {
    for (const [k, v] of Object.entries(obj)) {
      const full = prefix ? `${prefix}.${k}` : k;
      if (v && typeof v === 'object') {
        assertNonEmpty(v, full);
      } else {
        assert.ok(
          typeof v === 'string' && v.trim().length > 0,
          `Key "${full}" must not be empty`
        );
      }
    }
  }

  assertNonEmpty(bn, 'bn');
  assertNonEmpty(en, 'en');
});

test('i18n character audit: English resource contains zero Bengali characters (except explicit allowlist)', () => {
  const enPath = path.join(rootDir, 'client/src/locales/en.json');
  const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

  const BENGALI_REGEX = /[\u0980-\u09FF]/;
  const ALLOWLIST = new Set([
    'common.lang_bn', // Must display "বাংলা" as the language toggle label
    'common.switch_language', // Toggle button in English mode to switch back to "বাংলা"
  ]);

  const leakedBengali = [];

  function checkStrings(obj, prefix = '') {
    for (const [k, v] of Object.entries(obj)) {
      const full = prefix ? `${prefix}.${k}` : k;
      if (ALLOWLIST.has(full)) continue;

      if (v && typeof v === 'object') {
        checkStrings(v, full);
      } else if (typeof v === 'string') {
        if (BENGALI_REGEX.test(v)) {
          leakedBengali.push({ key: full, val: v });
        }
      }
    }
  }

  checkStrings(en);

  assert.equal(
    leakedBengali.length,
    0,
    `Leaked Bengali in en.json keys: ${leakedBengali.map((x) => `${x.key}: "${x.val}"`).join(', ')}`
  );
});

test('formatters: strict locale representation', () => {
  // Bengali locale
  assert.equal(toBengaliNumerals(1965), '১৯৬৫');
  assert.equal(formatBDT(100000, 'bn'), '৳ ১০০,০০০');

  // English locale
  assert.equal(formatBDT(100000, 'en'), 'BDT 100,000');
  // English format must have zero Bengali characters
  assert.ok(!/[\u0980-\u09FF]/.test(formatBDT(100000, 'en')));
});

test('official name check: strictly "Manikpur Eidgah" and "মানিকপুর ঈদগাহ"', () => {
  const bn = JSON.parse(fs.readFileSync(path.join(rootDir, 'client/src/locales/bn.json'), 'utf8'));
  const en = JSON.parse(fs.readFileSync(path.join(rootDir, 'client/src/locales/en.json'), 'utf8'));

  assert.equal(bn.common.site_name, 'মানিকপুর ঈদগাহ');
  assert.equal(en.common.site_name, 'Manikpur Eidgah');

  const oldNameRegex = /কেন্দ্রীয়|শাহী|Central\s*Shahi|Manikpur\s+Central|Shahi\s*Eidgah/i;
  assert.ok(!oldNameRegex.test(bn.common.site_name), 'bn site_name must not contain old name variants');
  assert.ok(!oldNameRegex.test(en.common.site_name), 'en site_name must not contain old name variants');
});

test('zero-fallback rule: English query never leaks Bengali text', () => {
  const itemWithoutEn = {
    titleBn: 'মানিকপুর ঈদগাহ',
    titleEn: '',
  };

  const resolved = getLocalized(itemWithoutEn, 'title', 'en');
  assert.equal(resolved, '', 'Missing English title must resolve to empty string, never Bengali fallback');
  assert.ok(!/[\u0980-\u09FF]/.test(resolved), 'English resolution must contain zero Bengali characters');
});
