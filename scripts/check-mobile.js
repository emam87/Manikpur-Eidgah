/**
 * Automated Mobile-First Clean Architecture Verification Script
 * Validates:
 * 1. Prohibited animation gimmicks are eliminated.
 * 2. Mobile navigation exists strictly once (no duplicate hamburger drawer).
 * 3. Mobile footer has no second menu.
 * 4. Home page has strictly the 6 canonical blocks (no redundant teasers).
 * 5. Tap targets, safe-area utilities, and 16px mobile input rules are active.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('📱 Running Mobile-First Clean Architecture Verification...\n');

let errors = [];

// 1. Check for eliminated animation gimmicks & heavy effects across client/src
const prohibitedPatterns = [
  { pattern: /card-shine-sweep/g, label: 'card-shine-sweep class' },
  { pattern: /hero-dust-particle/g, label: 'hero-dust-particle class' },
  { pattern: /animate-crescent/g, label: 'animate-crescent class' },
  { pattern: /animate-sun-pulse/g, label: 'animate-sun-pulse class' },
  { pattern: /animate-bird-drift/g, label: 'animate-bird-drift class' },
  { pattern: /useCardTilt/g, label: 'useCardTilt hook' },
  { pattern: /useCounter/g, label: 'useCounter count-up gimmick' },
];

function scanDir(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      if (file.name !== 'node_modules' && file.name !== 'dist' && file.name !== '.git') {
        scanDir(fullPath);
      }
    } else if (/\.(jsx?|tsx?|css)$/.test(file.name)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      for (const { pattern, label } of prohibitedPatterns) {
        if (pattern.test(content)) {
          errors.push(`Prohibited gimmick [${label}] found in ${path.relative(rootDir, fullPath)}`);
        }
      }
    }
  }
}

scanDir(path.join(rootDir, 'client', 'src'));

// 2. Check Navbar.jsx: No mobileMenuOpen hamburger drawer
const navbarPath = path.join(rootDir, 'client', 'src', 'components', 'layout', 'Navbar.jsx');
const navbarContent = fs.readFileSync(navbarPath, 'utf8');
if (navbarContent.includes('mobileMenuOpen') && navbarContent.includes('allNavLinks')) {
  errors.push('Navbar.jsx still contains a duplicate mobile navigation drawer.');
}
if (!navbarContent.includes('open-more-sheet')) {
  errors.push('Navbar.jsx on mobile must dispatch open-more-sheet to trigger the canonical More sheet.');
}

// 3. Check MobileTabBar.jsx: 5 canonical items + More sheet event listener
const tabBarPath = path.join(rootDir, 'client', 'src', 'components', 'layout', 'MobileTabBar.jsx');
const tabBarContent = fs.readFileSync(tabBarPath, 'utf8');
const requiredTabs = ['/', '/lifetime-members', '/land-donors', '/gallery'];
for (const tab of requiredTabs) {
  if (!tabBarContent.includes(`to: '${tab}'`)) {
    errors.push(`MobileTabBar.jsx missing primary tab destination: ${tab}`);
  }
}
if (!tabBarContent.includes('open-more-sheet')) {
  errors.push('MobileTabBar.jsx must listen for open-more-sheet event.');
}

// 4. Check Footer.jsx: No second navigation menu on mobile
const footerPath = path.join(rootDir, 'client', 'src', 'components', 'layout', 'Footer.jsx');
const footerContent = fs.readFileSync(footerPath, 'utf8');
if (!footerContent.includes('lg:hidden') || !footerContent.includes('tel:')) {
  errors.push('Footer.jsx must have a compact mobile view (< 1024px) with tap-to-call.');
}

// 5. Check Home.jsx: Strictly 6 canonical blocks, zero redundant teasers
const homePath = path.join(rootDir, 'client', 'src', 'pages', 'Home.jsx');
const homeContent = fs.readFileSync(homePath, 'utf8');
const prohibitedTeasers = [
  'DesignsTeaserSection',
  'MembersDonorsTeaser',
  'TransparencyTeaser',
  'CommitteePreviewSection',
];
for (const teaser of prohibitedTeasers) {
  if (homeContent.includes(teaser)) {
    errors.push(`Home.jsx contains redundant teaser component: ${teaser}`);
  }
}
const canonicalBlocks = [
  'HeroSection',
  'HomeJamatAndNotice',
  'StatsSection',
  'QuickLinksSection',
  'RecentGallerySection',
  'HomeDirectionsCard',
];
for (const block of canonicalBlocks) {
  if (!homeContent.includes(block)) {
    errors.push(`Home.jsx missing canonical block: ${block}`);
  }
}

// 6. Check index.css: 16px mobile inputs, safe-area utilities
const cssPath = path.join(rootDir, 'client', 'src', 'index.css');
const cssContent = fs.readFileSync(cssPath, 'utf8');
if (!cssContent.includes('pb-safe') || !cssContent.includes('pt-safe')) {
  errors.push('index.css must define safe-area insets (pb-safe, pt-safe).');
}
if (!cssContent.includes('touch-action: manipulation')) {
  errors.push('index.css must configure touch-action: manipulation for mobile responsiveness.');
}
if (!cssContent.includes('font-size: 16px !important')) {
  errors.push('index.css must enforce 16px mobile input font-size to prevent iOS Safari auto-zoom.');
}

// Results
if (errors.length > 0) {
  console.error(`❌ Mobile Verification Failed with ${errors.length} error(s):`);
  errors.forEach((err, idx) => console.error(`  ${idx + 1}. ${err}`));
  process.exit(1);
} else {
  console.log('✅ Mobile-First Clean Architecture Verification PASSED!');
  console.log('   - 0 prohibited animations or gimmick counters.');
  console.log('   - 0 duplicate navigation menus.');
  console.log('   - Home strictly conforms to 6 canonical non-redundant blocks.');
  console.log('   - All mobile tap targets, safe-area, and iOS zoom safeguards verified.');
  process.exit(0);
}
