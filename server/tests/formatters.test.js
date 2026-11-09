import test from 'node:test';
import assert from 'node:assert/strict';
import { toBengaliNumerals, formatBDT, getLocalized } from '../src/utils/formatters.js';

test('toBengaliNumerals: converts English digits to Bengali numerals', () => {
  assert.equal(toBengaliNumerals('1965'), '১৯৬৫');
  assert.equal(toBengaliNumerals(2026), '২০২৬');
  assert.equal(toBengaliNumerals('0123456789'), '০১২৩৪৫৬৭৮৯');
  assert.equal(toBengaliNumerals(null), '');
  assert.equal(toBengaliNumerals(undefined), '');
});

test('formatBDT: formats currency amounts with commas and ৳ symbol', () => {
  assert.equal(formatBDT(25000, 'bn'), '৳ ২৫,০০০');
  assert.equal(formatBDT(500, 'bn'), '৳ ৫০০');
  assert.equal(formatBDT(1000000, 'bn'), '৳ ১,০০০,০০০');
  assert.equal(formatBDT(25000, 'en'), 'BDT 25,000');
  assert.equal(formatBDT('', 'bn'), '');
  assert.equal(formatBDT(null, 'bn'), '');
});

test('getLocalized: handles bilingual resolution with automatic fallback', () => {
  const item = {
    titleBn: 'মানিকপুর ঈদগাহ',
    titleEn: 'Manikpur Eidgah',
    descBn: 'বিবরণ বাংলায়',
    descEn: '',
  };

  assert.equal(getLocalized(item, 'title', 'bn'), 'মানিকপুর ঈদগাহ');
  assert.equal(getLocalized(item, 'title', 'en'), 'Manikpur Eidgah');

  // Fallback to Bengali when English is empty string
  assert.equal(getLocalized(item, 'desc', 'en'), 'বিবরণ বাংলায়');

  // Snake_case support
  const snakeItem = {
    name_bn: 'সৈয়দ হারুন',
    name_en: 'Syed Harun',
  };
  assert.equal(getLocalized(snakeItem, 'name', 'bn'), 'সৈয়দ হারুন');
  assert.equal(getLocalized(snakeItem, 'name', 'en'), 'Syed Harun');
});

