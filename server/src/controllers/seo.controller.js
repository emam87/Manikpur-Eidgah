import { prisma } from '../db/prisma.js';
import { ENV } from '../config/env.js';

export const CRAWLER_USER_AGENT_REGEX =
  /facebookexternalhit|facebot|twitterbot|whatsapp|telegrambot|linkedinbot|googlebot|bingbot|slackbot|discordbot|applebot|yandex|duckduckbot/i;

export class SeoController {
  /**
   * Generates dynamic sitemap.xml
   */
  static async getSitemap(req, res) {
    try {
      const baseUrl =
        ENV.CLIENT_URL && !ENV.CLIENT_URL.includes('localhost')
          ? ENV.CLIENT_URL
          : `http://${req.headers?.host || 'localhost:5000'}`;
      const now = new Date().toISOString().split('T')[0];

      // Static public routes
      const staticRoutes = [
        { path: '', priority: '1.0', changefreq: 'weekly' },
        { path: '/about', priority: '0.8', changefreq: 'monthly' },
        { path: '/lifetime-members', priority: '0.8', changefreq: 'weekly' },
        { path: '/donors', priority: '0.8', changefreq: 'weekly' },
        { path: '/gallery', priority: '0.8', changefreq: 'weekly' },
        { path: '/designs', priority: '0.8', changefreq: 'monthly' },
        { path: '/map', priority: '0.7', changefreq: 'monthly' },
        { path: '/documents', priority: '0.7', changefreq: 'monthly' },
        { path: '/land-maps', priority: '0.7', changefreq: 'monthly' },
        { path: '/notices', priority: '0.9', changefreq: 'daily' },
        { path: '/contact', priority: '0.8', changefreq: 'monthly' },
      ];

      let dynamicRoutes = [];

      if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')) {
        try {
          // Fetch published notices
          const notices = await prisma.notice.findMany({
            where: { publishedAt: { not: null }, deletedAt: null },
            select: { slug: true, updatedAt: true },
          });

          notices.forEach((n) => {
            dynamicRoutes.push({
              path: `/notices/${encodeURIComponent(n.slug)}`,
              lastmod: n.updatedAt?.toISOString()?.split('T')[0] || now,
              priority: '0.8',
              changefreq: 'weekly',
            });
          });

          // Fetch published albums
          const albums = await prisma.album.findMany({
            where: { isPublished: true, deletedAt: null },
            select: { slug: true, updatedAt: true },
          });

          albums.forEach((a) => {
            dynamicRoutes.push({
              path: `/gallery/${encodeURIComponent(a.slug)}`,
              lastmod: a.updatedAt?.toISOString()?.split('T')[0] || now,
              priority: '0.7',
              changefreq: 'weekly',
            });
          });
        } catch (dbErr) {
          // Graceful fallback if database query fails
        }
      }

      const allRoutes = [
        ...staticRoutes.map((r) => ({ ...r, lastmod: now })),
        ...dynamicRoutes,
      ];

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allRoutes
  .map(
    (r) => `  <url>
    <loc>${baseUrl}${r.path}</loc>
    <lastmod>${r.lastmod}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
      return res.status(200).send(xml);
    } catch (err) {
      console.error('Sitemap generation error:', err);
      return res.status(500).send('Error generating sitemap');
    }
  }

  /**
   * Generates robots.txt
   */
  static getRobots(req, res) {
    const baseUrl =
      ENV.CLIENT_URL && !ENV.CLIENT_URL.includes('localhost')
        ? ENV.CLIENT_URL
        : `http://${req.headers?.host || 'localhost:5000'}`;
    const adminPath = ENV.ADMIN_PATH || 'eidgah-manage-k29x';

    const robotsTxt = `# Manikpur Central Shahi Eidgah (মানিকপুর কেন্দ্রীয় শাহী ঈদগাহ)
User-agent: *
Allow: /
Disallow: /api/
Disallow: /${adminPath}
Disallow: /${adminPath}/
Disallow: /admin
Disallow: /admin/
Disallow: /login
Disallow: /dashboard
Disallow: /wp-admin
Disallow: /phpmyadmin

Sitemap: ${baseUrl}/sitemap.xml
`;

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    return res.status(200).send(robotsTxt);
  }

  /**
   * Crawler Open Graph Middleware: Pre-renders rich meta tags for social media bots
   */
  static async handleCrawlerMeta(req, res, next) {
    const userAgent = req.headers['user-agent'] || '';

    if (!CRAWLER_USER_AGENT_REGEX.test(userAgent)) {
      return next();
    }

    const baseUrl = ENV.CLIENT_URL || `http://${req.headers.host || 'localhost:5000'}`;
    const defaultImage = `${baseUrl}/designs/front-view.jpg`;

    let title = 'মানিকপুর কেন্দ্রীয় শাহী ঈদগাহ | মানিকপুর, বাঞ্ছারামপুর';
    let description =
      'ঐতিহ্যবাহী দ্বীনি ও সামাজিক মানিকপুর কেন্দ্রীয় শাহী ঈদগাহ ময়দান (স্থাপিত ১৯৬৫ খ্রি.)। ১.৩৫ একর ওয়াকফ ভূমি। বাঞ্ছারামপুর, ব্রাহ্মণবাড়িয়া।';
    let image = defaultImage;
    let url = `${baseUrl}${req.path}`;
    let type = 'website';

    try {
      const noticeMatch = req.path.match(/^\/notices\/([a-zA-Z0-9_-]+)/);
      const galleryMatch = req.path.match(/^\/gallery\/([a-zA-Z0-9_-]+)/);

      if (noticeMatch) {
        const slug = decodeURIComponent(noticeMatch[1]);
        const notice = await prisma.notice.findUnique({
          where: { slug },
          include: { attachments: true },
        });

        if (notice) {
          title = `${notice.titleBn} | মানিকপুর ঈদগাহ নোটিশ`;
          description = notice.bodyBn.slice(0, 200).replace(/\r?\n/g, ' ') + '...';
          type = 'article';
          if (notice.attachments && notice.attachments.length > 0) {
            image = notice.attachments[0].filePath.startsWith('http')
              ? notice.attachments[0].filePath
              : `${baseUrl}${notice.attachments[0].filePath}`;
          }
        }
      } else if (galleryMatch) {
        const slug = decodeURIComponent(galleryMatch[1]);
        const album = await prisma.album.findUnique({
          where: { slug },
          include: { coverPhoto: true },
        });

        if (album) {
          title = `${album.titleBn} | মানিকপুর ঈদগাহ ফটো অ্যালবাম`;
          description =
            album.descriptionBn ||
            `মানিকপুর কেন্দ্রীয় শাহী ঈদগাহের ${album.titleBn} অনুষ্ঠানের বিশেষ আলোকচিত্র।`;
          if (album.coverPhoto) {
            image = album.coverPhoto.path.startsWith('http')
              ? album.coverPhoto.path
              : `${baseUrl}${album.coverPhoto.path}`;
          }
        }
      } else if (req.path === '/lifetime-members') {
        title = 'আজীবন সদস্যবৃন্দ | মানিকপুর কেন্দ্রীয় শাহী ঈদগাহ';
        description =
          'মানিকপুর কেন্দ্রীয় শাহী ঈদগাহের সম্মানিত আজীবন সদস্যগণের তালিকা ও পরিচিতি।';
      } else if (req.path === '/donors') {
        title = 'দানশীল শুভানুধ্যায়ীবৃন্দ | মানিকপুর কেন্দ্রীয় শাহী ঈদগাহ';
        description =
          'মানিকপুর কেন্দ্রীয় শাহী ঈদগাহ ময়দান ও সীমানা প্রাচীর উন্নয়ন তহবিলে অনুদানকারী শুভাকাঙ্ক্ষীদের তালিকা।';
      } else if (req.path === '/designs') {
        title = 'ঈদগাহ প্রস্তাবিত থ্রি-ডি ডিজাইন ও মহাপরিকল্পনা | মানিকপুর ঈদগাহ';
        description =
          'মানিকপুর কেন্দ্রীয় শাহী ঈদগাহ ও সংলগ্ন পুকুর পাড়ের প্রস্তাবিত ত্রিমাত্রিক (3D) নান্দনিক মাস্টারপ্ল্যান ও ডিজাইন।';
        image = `${baseUrl}/designs/layout-plan.jpg`;
      }
    } catch (e) {
      // Fallback to defaults
    }

    const html = `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${escapeHtml(url)}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="${type}">
  <meta property="og:site_name" content="মানিকপুর কেন্দ্রীয় শাহী ঈদগাহ">
  <meta property="og:url" content="${escapeHtml(url)}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${escapeHtml(image)}">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${escapeHtml(url)}">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(image)}">
</head>
<body style="font-family: sans-serif; padding: 2rem; max-width: 700px; margin: auto;">
  <h1>${escapeHtml(title)}</h1>
  <p>${escapeHtml(description)}</p>
  <img src="${escapeHtml(image)}" alt="${escapeHtml(title)}" style="max-width: 100%; border-radius: 8px;" />
  <p><a href="${escapeHtml(url)}">মানিকপুর ঈদগাহ ওয়েবসাইটে সম্পূর্ণ দেখুন &rarr;</a></p>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
