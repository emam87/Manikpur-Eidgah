import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeAreaInDecimal, convertDecimalToAllUnits, DEFAULT_UNIT_CONVERSION } from '../src/utils/landUnit.js';
import { serializePublicLandDonor } from '../src/utils/landDonorSerializer.js';

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
  const rawDbRecord = {
    id: 1,
    nameBn: 'আলহাজ্ব মৌলভী আব্দুল জব্বার',
    nameEn: 'Alhaj Maulvi Abdul Jabbar',
    fatherNameBn: 'হাজী মোহাম্মদ বক্স',
    fatherNameEn: 'Haji Mohammad Box',
    villageBn: 'মানিকপুর',
    villageEn: 'Manikpur',
    photoPath: 'land-donors/sample.webp',
    isDeceased: true,
    areaValue: 40.0,
    areaUnit: 'DECIMAL_SHATANGSHO',
    areaInDecimal: 40.0,
    donationYear: 1965,
    donationType: 'WAQF',
    landUse: 'EIDGAH_GROUND',
    deedNumber: '২৮৪১/১৯৬৫',
    deedDate: new Date('1965-03-15'),
    khatianType: 'RS',
    khatianNumber: '১১২',
    dagNumber: '৩২৪',
    mouzaBn: 'মানিকপুর',
    mouzaEn: 'Manikpur',
    jlNumber: '৪৫',
    boundaryNorth: 'সরকারী গোপাট',
    boundarySouth: 'মৌলভী বাড়ি',
    boundaryEast: 'পুকুর',
    boundaryWest: 'রাস্তা',
    relatedDocumentIds: [10],
    relatedLandMap: {
      id: 3,
      titleBn: 'আরএস নকশা',
      titleEn: 'RS Map',
      surveyType: 'RS',
      filePath: 'land-maps/rs.webp',
      thumbPath: 'land-maps/rs_thumb.webp',
      isPublished: true,
      deletedAt: null,
    },
    // Strictly private fields
    phone: '01711000000',
    nid: '1965123456789',
    representativePhone: '01811000000',
    showDeedDetails: false,
    showPlotDetails: false,
    showBoundaries: false,
  };

  const docsMap = {
    10: { id: 10, titleBn: 'ওয়াকফ দলিল', titleEn: 'Waqf Deed', category: 'DEED', filePath: 'docs/deed.pdf' },
  };

  const hiddenDto = serializePublicLandDonor(rawDbRecord, docsMap);

  // Verification 1: Private contact fields are NEVER exposed
  assert.equal('phone' in hiddenDto, false, 'phone must never be present in public DTO');
  assert.equal('nid' in hiddenDto, false, 'nid must never be present in public DTO');
  assert.equal('representativePhone' in hiddenDto, false, 'representativePhone must never be present in public DTO');

  // Verification 2: Gated fields are OMITTED server-side when visibility toggles are false
  assert.equal('deedNumber' in hiddenDto, false, 'deedNumber must be omitted when showDeedDetails is false');
  assert.equal('deedDate' in hiddenDto, false, 'deedDate must be omitted when showDeedDetails is false');
  assert.equal('relatedDocuments' in hiddenDto, false, 'relatedDocuments must be omitted when showDeedDetails is false');
  assert.equal('khatianType' in hiddenDto, false, 'khatianType must be omitted when showPlotDetails is false');
  assert.equal('khatianNumber' in hiddenDto, false, 'khatianNumber must be omitted when showPlotDetails is false');
  assert.equal('dagNumber' in hiddenDto, false, 'dagNumber must be omitted when showPlotDetails is false');
  assert.equal('jlNumber' in hiddenDto, false, 'jlNumber must be omitted when showPlotDetails is false');
  assert.equal('mouzaBn' in hiddenDto, false, 'mouzaBn must be omitted when showPlotDetails is false');
  assert.equal('relatedLandMap' in hiddenDto, false, 'relatedLandMap must be omitted when showPlotDetails is false');
  assert.equal('boundaryNorth' in hiddenDto, false, 'boundaryNorth must be omitted when showBoundaries is false');
  assert.equal('boundarySouth' in hiddenDto, false, 'boundarySouth must be omitted when showBoundaries is false');

  // Verification 3: When toggles are true, details are included while private contacts remain omitted
  const allowedDto = serializePublicLandDonor(
    {
      ...rawDbRecord,
      showDeedDetails: true,
      showPlotDetails: true,
      showBoundaries: true,
    },
    docsMap
  );
  assert.equal('phone' in allowedDto, false);
  assert.equal('nid' in allowedDto, false);
  assert.equal('representativePhone' in allowedDto, false);
  assert.equal(allowedDto.deedNumber, '২৮৪১/১৯৬৫');
  assert.equal(allowedDto.khatianNumber, '১১২');
  assert.equal(allowedDto.dagNumber, '৩২৪');
  assert.equal(allowedDto.jlNumber, '৪৫');
  assert.equal(allowedDto.boundaryNorth, 'সরকারী গোপাট');
  assert.equal(allowedDto.relatedDocuments?.length, 1);
  assert.equal(allowedDto.relatedLandMap?.id, 3);
});

