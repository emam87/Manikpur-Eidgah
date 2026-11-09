import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getLoginThrottleKey } from '../src/middleware/rateLimit.middleware.js';

test('auth: password hashing and verification with bcrypt', async () => {
  const plainPassword = 'SuperSecurePassword2026!';
  const hash = await bcrypt.hash(plainPassword, 10);

  assert.notEqual(hash, plainPassword);
  assert.equal(await bcrypt.compare(plainPassword, hash), true);
  assert.equal(await bcrypt.compare('WrongPassword', hash), false);
});

test('auth: jwt token creation, verification and payload integrity', () => {
  const secret = 'test-secret-key-for-unit-testing-only-12345';
  const payload = {
    userId: 42,
    email: 'admin@manikpureidgah.org',
    role: 'ADMIN',
    lastActive: Date.now(),
  };

  const token = jwt.sign(payload, secret, { expiresIn: '1h' });
  const decoded = jwt.verify(token, secret);

  assert.equal(decoded.userId, 42);
  assert.equal(decoded.email, 'admin@manikpureidgah.org');
  assert.equal(decoded.role, 'ADMIN');
  assert.ok(decoded.lastActive);
});

test('auth: login throttle key normalization', () => {
  const key1 = getLoginThrottleKey('Admin@ManikpurEidgah.org', '192.168.1.1');
  const key2 = getLoginThrottleKey('admin@manikpureidgah.org ', '192.168.1.1');
  const key3 = getLoginThrottleKey('other@manikpureidgah.org', '192.168.1.1');

  assert.equal(key1, key2, 'Throttle key must be case and whitespace insensitive for email');
  assert.notEqual(key1, key3, 'Different emails must produce distinct throttle keys');
});

