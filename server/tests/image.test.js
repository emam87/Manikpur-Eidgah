import test from 'node:test';
import assert from 'node:assert/strict';
import { getImageUrl } from '../../client/src/utils/imageUrl.js';

test('imageUrl: converts relative keys into browser-accessible /uploads/ paths', () => {
  assert.equal(getImageUrl('members/abc.webp'), '/uploads/members/abc.webp');
  assert.equal(getImageUrl('albums/eid-2025/photo.webp'), '/uploads/albums/eid-2025/photo.webp');
  assert.equal(getImageUrl('designs/front-view.jpg'), '/uploads/designs/front-view.jpg');
});

test('imageUrl: preserves already absolute /uploads/ paths', () => {
  assert.equal(getImageUrl('/uploads/members/abc.webp'), '/uploads/members/abc.webp');
  assert.equal(getImageUrl('/uploads/albums/photo.webp'), '/uploads/albums/photo.webp');
});

test('imageUrl: fixes uploads/ without leading slash', () => {
  assert.equal(getImageUrl('uploads/members/abc.webp'), '/uploads/members/abc.webp');
});

test('imageUrl: prefixes leading slash folder paths with /uploads', () => {
  assert.equal(getImageUrl('/members/abc.webp'), '/uploads/members/abc.webp');
  assert.equal(getImageUrl('/albums/photo.webp'), '/uploads/albums/photo.webp');
});

test('imageUrl: preserves full HTTP/HTTPS and data URLs', () => {
  const r2Url = 'https://pub-123.r2.dev/members/abc.webp';
  assert.equal(getImageUrl(r2Url), r2Url);
  const dataUri = 'data:image/svg+xml;base64,PHN2Zz4=';
  assert.equal(getImageUrl(dataUri), dataUri);
});

test('imageUrl: returns fallback when input is empty or null', () => {
  assert.equal(getImageUrl(null, '/defaults/hero.svg'), '/defaults/hero.svg');
  assert.equal(getImageUrl(undefined, '/defaults/hero.svg'), '/defaults/hero.svg');
  assert.equal(getImageUrl('', '/defaults/hero.svg'), '/defaults/hero.svg');
  assert.equal(getImageUrl('   ', '/defaults/hero.svg'), '/defaults/hero.svg');
});

