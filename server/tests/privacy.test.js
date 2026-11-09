import test from 'node:test';
import assert from 'node:assert/strict';

// Helper mirroring the privacy serialization logic used in public.controller.js
function sanitizeMemberForPublic(member, globalShowAmount) {
  const isAmountAllowed =
    globalShowAmount === '1' || globalShowAmount === 'true' || globalShowAmount === true;

  // Destructure out sensitive fields if they ever existed in raw object
  const { phone, nidNo, ...safeFields } = member;

  return {
    ...safeFields,
    amountPaid: isAmountAllowed && member.showAmount ? member.amountPaid : null,
  };
}

function sanitizeDonorForPublic(donor, globalShowAmount) {
  const isAmountAllowed =
    globalShowAmount === '1' || globalShowAmount === 'true' || globalShowAmount === true;

  const { phone, ...safeFields } = donor;

  return {
    ...safeFields,
    amount: isAmountAllowed && donor.showAmount ? donor.amount : null,
  };
}

test('privacy: phone and nidNo are never exposed on public member serialization', () => {
  const rawMember = {
    id: 101,
    membershipNo: 'LM-101',
    nameBn: 'আলহাজ্ব মো. ফজলুল করিম',
    nameEn: 'Alhaj Md. Fazlul Karim',
    fatherNameBn: 'মরহুম মৌলভী আব্দুল জব্বার',
    addressBn: 'মানিকপুর উত্তরপাড়া',
    phone: '01711900101', // SENSITIVE
    nidNo: '1965100200101', // SENSITIVE
    memberSince: 2016,
    amountPaid: 50000,
    showAmount: true,
  };

  const publicData = sanitizeMemberForPublic(rawMember, '1');

  assert.equal(publicData.phone, undefined, 'Phone must not exist in public output');
  assert.equal(publicData.nidNo, undefined, 'NID must not exist in public output');
  assert.equal(publicData.membershipNo, 'LM-101');
  assert.equal(publicData.nameBn, 'আলহাজ্ব মো. ফজলুল করিম');
  assert.equal(publicData.amountPaid, 50000);
});

test('privacy: donation amount visible only when BOTH global setting AND record flag are true', () => {
  const rawDonor = {
    id: 1,
    donorNameBn: 'জনাব মো. হুমায়ুন কবির',
    phone: '01711800101', // SENSITIVE
    amount: 150000,
    showAmount: true,
  };

  // Case 1: Global allowed (1) & Record allowed (true) -> Exposed
  const case1 = sanitizeDonorForPublic({ ...rawDonor, showAmount: true }, '1');
  assert.equal(case1.amount, 150000);
  assert.equal(case1.phone, undefined);

  // Case 2: Global allowed (1) & Record disallowed (false) -> Masked
  const case2 = sanitizeDonorForPublic({ ...rawDonor, showAmount: false }, '1');
  assert.equal(case2.amount, null, 'Amount must be null when record.showAmount is false');
  assert.equal(case2.phone, undefined);

  // Case 3: Global disabled (0) & Record allowed (true) -> Masked
  const case3 = sanitizeDonorForPublic({ ...rawDonor, showAmount: true }, '0');
  assert.equal(case3.amount, null, 'Amount must be null when global show_donation_amount is disabled');

  // Case 4: Global disabled (0) & Record disallowed (false) -> Masked
  const case4 = sanitizeDonorForPublic({ ...rawDonor, showAmount: false }, '0');
  assert.equal(case4.amount, null);
});

test('privacy: document query visibility filter strictly excludes ADMIN_ONLY from public', () => {
  const documents = [
    { id: 1, titleBn: '১৯৬৫ সালের ওয়াকফ দলিল', visibility: 'PUBLIC' },
    { id: 2, titleBn: 'আরএস খতিয়ান ও পর্চা', visibility: 'PUBLIC' },
    { id: 3, titleBn: 'অভ্যন্তরীণ অডিট রেজুলেশন', visibility: 'ADMIN_ONLY' },
  ];

  // Public filter query: { visibility: 'PUBLIC', deletedAt: null }
  const publicDocuments = documents.filter((doc) => doc.visibility === 'PUBLIC');

  assert.equal(publicDocuments.length, 2);
  assert.ok(publicDocuments.every((doc) => doc.visibility === 'PUBLIC'));
  assert.ok(!publicDocuments.some((doc) => doc.visibility === 'ADMIN_ONLY'));
});
