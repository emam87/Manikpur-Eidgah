import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const CSS_FILE = path.join(rootDir, 'client/src/index.css');
const SRC_DIR = path.join(rootDir, 'client/src');

const REQUIRED_CSS_MARKERS = [
  "[data-theme-preset='sakinah']",
  'html.dark',
  "[data-theme-preset='classic-emerald']",
  '--bg:',
  '--bg-alt:',
  '--surface:',
  '--primary:',
  '--primary-hover:',
  '--primary-dark:',
  '--primary-soft:',
  '--sky:',
  '--gold:',
  '--gold-text:',
  '--gold-plate-from:',
  '--gold-plate-to:',
  '--text:',
  '--text-muted:',
  '--border:',
  '--footer:',
  '--sidebar:',
  '--chart-series-1:',
];

const BANNED_TOKEN_RULES = [
  { name: 'Legacy emerald-* utility', regex: /\b(?:bg|text|border|ring|from|to|via|divide|fill|stroke)-emerald-\d+/ },
  { name: 'Legacy ivory-* utility', regex: /\b(?:bg|text|border|ring|from|to|via|divide)-ivory(?:-\d+)?\b/ },
  { name: 'Numeric gold-[0-9] utility', regex: /\b(?:bg|text|border|ring|from|to|via|divide)-gold-\d+/ },
  { name: 'Legacy dark-* surface token', regex: /\bdark-(?:surface|card|bg|border)\b/ },
  { name: 'Legacy stone-* utility', regex: /\b(?:bg|text|border|ring|from|to|via|divide)-stone-\d+/ },
  { name: 'Ad-hoc palette utility (amber/red/blue/pink/orange/purple)', regex: /\b(?:bg|text|border|ring|from|to|via|divide)-(?:amber|red|blue|pink|orange|purple)-\d+/ },
];

const HEX_COLOR_REGEX = /(^|[^&A-Za-z0-9_-])#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})(?![A-Za-z0-9_-])/g;

function walkSourceFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkSourceFiles(full, files);
    } else if (/\.(jsx?|tsx?)$/i.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

console.log('🎨 Checking Sakinah single-source-of-truth theme compliance...');

const violations = [];

if (!fs.existsSync(CSS_FILE)) {
  console.error('❌ Missing client/src/index.css');
  process.exit(1);
}

const cssContent = fs.readFileSync(CSS_FILE, 'utf8');
for (const marker of REQUIRED_CSS_MARKERS) {
  if (!cssContent.includes(marker)) {
    violations.push({
      file: 'client/src/index.css',
      line: 1,
      rule: 'Missing required CSS token/preset marker',
      text: marker,
    });
  }
}

const sourceFiles = walkSourceFiles(SRC_DIR);

for (const filePath of sourceFiles) {
  const relPath = path.relative(rootDir, filePath).replace(/\\/g, '/');
  const lines = fs.readFileSync(filePath, 'utf8').split('\n');

  lines.forEach((line, idx) => {
    for (const rule of BANNED_TOKEN_RULES) {
      if (rule.regex.test(line)) {
        violations.push({
          file: relPath,
          line: idx + 1,
          rule: rule.name,
          text: line.trim(),
        });
      }
    }

    // Check hex literals, excluding SVG url(#...) references
    const sanitized = line.replace(/url\(#[^)]+\)/g, '').replace(/#(?:[0-9a-fA-F]+)\)/g, '');
    HEX_COLOR_REGEX.lastIndex = 0;
    const match = HEX_COLOR_REGEX.exec(sanitized);
    if (match) {
      violations.push({
        file: relPath,
        line: idx + 1,
        rule: 'Hardcoded hex color outside client/src/index.css',
        text: line.trim(),
      });
    }
  });
}

if (violations.length > 0) {
  console.error(`\n❌ Theme check failed with ${violations.length} violation(s):\n`);
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line} [${v.rule}]`);
    console.error(`    ${v.text}`);
  }
  process.exit(1);
}

console.log(`✅ Passed! Scanned ${sourceFiles.length} source files + client/src/index.css — 0 hardcoded hex colors and 0 legacy theme tokens.`);

