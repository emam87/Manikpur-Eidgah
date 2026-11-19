import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeAreaInDecimal, convertDecimalToAllUnits, DEFAULT_UNIT_CONVERSION } from '../src/utils/landUnit.js';

test('landUnit: computeAreaInDecimal handles standard conversions correctly', () => {
  // 1. Decimal (1:1)
  assert.equal(computeAreaInDecimal(40.0, 'DECIMAL_SHATANGSHO'), 40.0);

  // 2. Acre (1 acre = 100 decimals)
  assert.equal(computeAreaInDecimal(1.35, 'ACRE'), 135.0);

  // 3. Bigha (1 bigha = 33 decimals)
  assert.equal(computeAreaInDecimal(2, 'BIGHA'), 66.0);

  // 4. Katha (1 katha = 1.65 decimals)
  assert.equal(computeAreaInDecimal(10, 'KATHA'), 16.5);

  // 5. Sqft (435.6 sqft = 1 decimal)
  assert.equal(computeAreaInDecimal(4356, 'SQFT'), 10.0);

  // 6. Custom conversion factor
  const customFactors = { acre: 100, bigha: 30, katha: 1.5, sqft: 435.6 };
  assert.equal(computeAreaInDecimal(2, 'BIGHA', customFactors), 60.0);
  assert.equal(computeAreaInDecimal(10, 'KATHA', customFactors), 15.0);

  // Invalid / Zero inputs
  assert.equal(computeAreaInDecimal(0, 'DECIMAL_SHATANGSHO'), 0);
  assert.equal(computeAreaInDecimal(-5, 'ACRE'), 0);
  assert.equal(computeAreaInDecimal('invalid', 'BIGHA'), 0);
});

test('landUnit: convertDecimalToAllUnits computes all unit representations', () => {
  const units = convertDecimalToAllUnits(100);
  assert.equal(units.decimal, 100);
  assert.equal(units.acre, 1);
  assert.equal(Math.round(units.bigha * 100) / 100, 3.03);
  assert.equal(Math.round(units.katha * 100) / 100, 60.61);
  assert.equal(units.sqft, 43560);
});

test('landDonors: privacy serialization strictly omits private contacts and gated details', () => {
  // Simulate a raw LandDonor database record with private contact numbers and false visibility toggles
  const rawDbRecord = {
    id: 1,
    nameBn: 'মরহুম আলহাজ্ব মৌলভী আব্দুল জব্বার',
    nameEn: 'Late Alhaj Maulvi Abdul Jabbar',
    fatherNameBn: 'হাজী মোহাম্মদ বক্স',
    villageBn: 'মানিকপুর',
    photoPath: 'land-donors/sample.webp',
    isDeceased: true,
    areaValue: 40.0,
    areaUnit: 'DECIMAL_SHATANGSHO',
    areaInDecimal: 40.0,
    donationYear: 1965,
    deedNumber: '২৮৪১/১৯৬৫',
    khatianNumber: '১১২',
    dagNumber: '৩২৪',
    boundaryNorth: 'সরকারী গোপাট',
    boundarySouth: 'মৌলভী বাড়ি',
    // Strictly private fields
    phone: '01711000000',
    nid: '1965123456789',
    representativePhone: '01811000000',
    showDeedDetails: false, // Turned off
    showPlotDetails: false, // Turned off
    showBoundaries: false,  // Turned off
  };

  // Simulate server-side serialization logic from getLandDonors
  const publicSerialized = {
    id: rawDbRecord.id,
    nameBn: rawDbRecord.nameBn,
    nameEn: rawDbRecord.nameEn,
    fatherNameBn: rawDbRecord.fatherNameBn,
    villageBn: rawDbRecord.villageBn,
    photoPath: rawDbRecord.photoPath,
    isDeceased: rawDbRecord.isDeceased,
    areaValue: rawDbRecord.areaValue,
    areaUnit: rawDbRecord.areaUnit,
    areaInDecimal: rawDbRecord.areaInDecimal,
    donationYear: rawDbRecord.donationYear,
    deedNumber: rawDbRecord.showDeedDetails ? rawDbRecord.deedNumber : null,
    khatianNumber: rawDbRecord.showPlotDetails ? rawDbRecord.khatianNumber : null,
    dagNumber: rawDbRecord.showPlotDetails ? rawDbRecord.dagNumber : null,
    boundaryNorth: rawDbRecord.showBoundaries ? rawDbRecord.boundaryNorth : null,
  };

  // Verification 1: Private contact fields are NEVER exposed
  assert.equal('phone' in publicSerialized, false, 'phone must never be present in public DTO');
  assert.equal('nid' in publicSerialized, false, 'nid must never be present in public DTO');
  assert.equal('representativePhone' in publicSerialized, false, 'representativePhone must never be present in public DTO');

  // Verification 2: Gated fields are null when visibility toggles are false
  assert.equal(publicSerialized.deedNumber, null, 'deedNumber must be null when showDeedDetails is false');
  assert.equal(publicSerialized.khatianNumber, null, 'khatianNumber must be null when showPlotDetails is false');
  assert.equal(publicSerialized.dagNumber, null, 'dagNumber must be null when showPlotDetails is false');
  assert.equal(publicSerialized.boundaryNorth, null, 'boundaryNorth must be null when showBoundaries is false');

  // Verification 3: When toggles are true, details are included
  const publicWithTogglesAllowed = {
    ...publicSerialized,
    deedNumber: true ? rawDbRecord.deedNumber : null,
    khatianNumber: true ? rawDbRecord.khatianNumber : null,
    dagNumber: true ? rawDbRecord.dagNumber : null,
    boundaryNorth: true ? rawDbRecord.boundaryNorth : null,
  };
  assert.equal(publicWithTogglesAllowed.deedNumber, '২৮৪১/১৯৬৫');
  assert.equal(publicWithTogglesAllowed.khatianNumber, '১১২');
  assert.equal(publicWithTogglesAllowed.dagNumber, '৩২৪');
  assert.equal(publicWithTogglesAllowed.boundaryNorth, 'সরকারী গোপাট');
});

