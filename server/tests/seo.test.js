import test from 'node:test';
import assert from 'node:assert/strict';
import { SeoController, CRAWLER_USER_AGENT_REGEX } from '../src/controllers/seo.controller.js';

test('seo: crawler user agent detection regex', () => {
  const bots = [
    'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
    'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'Twitterbot/1.0',
    'WhatsApp/2.21.12.21 i',
    'TelegramBot (like TwitterBot)',
    'LinkedInBot/1.0 (compatible; Mozilla/5.0; Apache-HttpClient +http://www.linkedin.com)',
    'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
    'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)',
    'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)',
  ];

  for (const bot of bots) {
    assert.equal(CRAWLER_USER_AGENT_REGEX.test(bot), true, `Must detect bot: ${bot}`);
  }

  const regularBrowsers = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Safari/605.1.15',
  ];

  for (const ua of regularBrowsers) {
    assert.equal(CRAWLER_USER_AGENT_REGEX.test(ua), false, `Must NOT flag browser as bot: ${ua}`);
  }
});

test('seo: robots.txt output format and security boundaries', async () => {
  let capturedHeaders = {};
  let capturedBody = '';
  let capturedStatus = 0;

  const mockReq = {
    headers: { host: 'manikpureidgah.org' },
  };

  const mockRes = {
    setHeader(key, value) {
      capturedHeaders[key] = value;
    },
    status(code) {
      capturedStatus = code;
      return this;
    },
    send(body) {
      capturedBody = body;
      return this;
    },
  };

  SeoController.getRobots(mockReq, mockRes);

  assert.equal(capturedStatus, 200);
  assert.equal(capturedHeaders['Content-Type'], 'text/plain; charset=utf-8');
  assert.ok(capturedBody.includes('User-agent: *'));
  assert.ok(capturedBody.includes('Allow: /'));
  assert.ok(capturedBody.includes('Disallow: /api/'));
  assert.ok(capturedBody.includes('Disallow: /admin'));
  assert.ok(capturedBody.includes('Sitemap: http://manikpureidgah.org/sitemap.xml'));
});

test('seo: sitemap.xml output structure and static routes', async () => {
  let capturedHeaders = {};
  let capturedBody = '';
  let capturedStatus = 0;

  const mockReq = {
    headers: { host: 'manikpureidgah.org' },
  };

  const mockRes = {
    setHeader(key, value) {
      capturedHeaders[key] = value;
    },
    status(code) {
      capturedStatus = code;
      return this;
    },
    send(body) {
      capturedBody = body;
      return this;
    },
  };

  await SeoController.getSitemap(mockReq, mockRes);

  assert.equal(capturedStatus, 200);
  assert.equal(capturedHeaders['Content-Type'], 'application/xml; charset=utf-8');
  assert.ok(capturedBody.includes('<?xml version="1.0" encoding="UTF-8"?>'));
  assert.ok(capturedBody.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'));
  assert.ok(capturedBody.includes('<loc>http://manikpureidgah.org</loc>'));
  assert.ok(capturedBody.includes('<loc>http://manikpureidgah.org/about</loc>'));
  assert.ok(capturedBody.includes('<loc>http://manikpureidgah.org/lifetime-members</loc>'));
  assert.ok(capturedBody.includes('<loc>http://manikpureidgah.org/donors</loc>'));
  assert.ok(capturedBody.includes('<loc>http://manikpureidgah.org/gallery</loc>'));
  assert.ok(capturedBody.includes('<loc>http://manikpureidgah.org/designs</loc>'));
  assert.ok(capturedBody.includes('<loc>http://manikpureidgah.org/notices</loc>'));
  assert.ok(capturedBody.includes('</urlset>'));
});

