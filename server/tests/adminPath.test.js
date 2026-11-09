import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAdminPath, getValidatedAdminPath, FORBIDDEN_ADMIN_PATHS } from '../src/utils/adminPath.js';

test('adminPath: rejects forbidden names', () => {
  for (const forbidden of FORBIDDEN_ADMIN_PATHS) {
    const res = validateAdminPath(forbidden);
    assert.equal(res.valid, false, `Should reject forbidden path: ${forbidden}`);
    assert.match(res.error, /forbidden/i);
  }
});

test('adminPath: rejects paths shorter than 8 characters', () => {
  const shortPaths = ['', 'a', 'admin1', 'manage7'];
  for (const path of shortPaths) {
    const res = validateAdminPath(path);
    assert.equal(res.valid, false, `Should reject short path: ${path}`);
  }
});

test('adminPath: rejects paths longer than 40 characters', () => {
  const longPath = 'a'.repeat(41);
  const res = validateAdminPath(longPath);
  assert.equal(res.valid, false);
  assert.match(res.error, /between 8 and 40/i);
});

test('adminPath: rejects invalid characters like spaces, underscores, symbols', () => {
  const invalidPaths = ['eidgah_manage', 'eidgah manage', 'eidgah@manage', 'eidgah!manage'];
  for (const path of invalidPaths) {
    const res = validateAdminPath(path);
    assert.equal(res.valid, false, `Should reject invalid chars in: ${path}`);
  }
});

test('adminPath: accepts valid alphanumeric and hyphen paths', () => {
  const validPaths = [
    'eidgah-manage-k29x',
    'shahi-eidgah-2026',
    'portal-secure-99a',
    'manikpur-gateway-01',
  ];
  for (const path of validPaths) {
    const res = validateAdminPath(path);
    assert.equal(res.valid, true, `Should accept valid path: ${path}`);
    assert.equal(res.path, path);
    assert.equal(getValidatedAdminPath(path), path);
  }
});

