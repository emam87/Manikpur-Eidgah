/**
 * Lightweight, dependency-free QR Code generator (Byte mode, ECC Level L, Versions 1–8)
 * Supports URLs up to ~150 UTF-8 bytes cleanly (ideal for Google Maps links).
 * Lazy-loaded only when the visitor opens the QR modal.
 */

// Galois Field GF(256) with primitive polynomial 0x11D
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) {
    GF_EXP[i] = GF_EXP[i - 255];
  }
})();

function gfMul(a, b) {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function rsGeneratorPoly(degree) {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    const next = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], GF_EXP[i]);
    }
    poly = next;
  }
  return poly;
}

function rsEncode(data, ecCount) {
  const gen = rsGeneratorPoly(ecCount);
  const res = new Uint8Array(data.length + ecCount);
  res.set(data);
  for (let i = 0; i < data.length; i++) {
    const factor = res[i];
    if (factor !== 0) {
      for (let j = 0; j < gen.length; j++) {
        res[i + j] ^= gfMul(gen[j], factor);
      }
    }
  }
  return res.slice(data.length);
}

// Version specs for ECC Level L (single block for v1-v5, 2 blocks for v6-v8)
const VERSION_SPECS = [
  null,
  { size: 21, totalData: 19, ecPerBlock: 7, blocks: 1, align: [] },
  { size: 25, totalData: 34, ecPerBlock: 10, blocks: 1, align: [6, 18] },
  { size: 29, totalData: 55, ecPerBlock: 15, blocks: 1, align: [6, 22] },
  { size: 33, totalData: 80, ecPerBlock: 20, blocks: 1, align: [6, 26] },
  { size: 37, totalData: 108, ecPerBlock: 26, blocks: 1, align: [6, 30] },
  { size: 41, totalData: 136, ecPerBlock: 18, blocks: 2, align: [6, 34] },
  { size: 45, totalData: 156, ecPerBlock: 20, blocks: 2, align: [6, 22, 38] },
  { size: 49, totalData: 194, ecPerBlock: 24, blocks: 2, align: [6, 24, 42] },
];

// Precomputed 15-bit format info for ECC L (01) and masks 0..7
const FORMAT_BITS_L = [
  0x77c4, 0x72f3, 0x7daa, 0x789d, 0x662f, 0x6318, 0x6c41, 0x6976,
];

// Version info bits for v7 and v8
const VERSION_BITS = {
  7: 0x07c94,
  8: 0x085bc,
};

function chooseVersion(byteLen) {
  for (let v = 1; v < VERSION_SPECS.length; v++) {
    // 4-bit mode + 8-bit length + bytes + 4-bit terminator
    if (byteLen + 2 <= VERSION_SPECS[v].totalData) return v;
  }
  return VERSION_SPECS.length - 1;
}

export function generateQrMatrix(text) {
  const bytes = new TextEncoder().encode(String(text || ''));
  const version = chooseVersion(bytes.length);
  const spec = VERSION_SPECS[version];
  const maxBytes = spec.totalData - 2;
  const payload = bytes.slice(0, maxBytes);

  // Build bit buffer
  const bits = [];
  const pushBits = (val, len) => {
    for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1);
  };

  pushBits(0b0100, 4); // Byte mode
  pushBits(payload.length, 8);
  for (const b of payload) pushBits(b, 8);

  const totalBits = spec.totalData * 8;
  const terminator = Math.min(4, totalBits - bits.length);
  pushBits(0, terminator);
  while (bits.length % 8 !== 0) bits.push(0);

  const dataBytes = [];
  for (let i = 0; i < bits.length; i += 8) {
    let val = 0;
    for (let j = 0; j < 8; j++) val = (val << 1) | bits[i + j];
    dataBytes.push(val);
  }
  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (dataBytes.length < spec.totalData) {
    dataBytes.push(padBytes[padIdx++ % 2]);
  }

  // Split into blocks & compute EC
  const blockSize = Math.floor(spec.totalData / spec.blocks);
  const dataBlocks = [];
  const ecBlocks = [];
  let offset = 0;
  for (let b = 0; b < spec.blocks; b++) {
    const slice = new Uint8Array(dataBytes.slice(offset, offset + blockSize));
    offset += blockSize;
    dataBlocks.push(slice);
    ecBlocks.push(rsEncode(slice, spec.ecPerBlock));
  }

  const finalCodewords = [];
  for (let i = 0; i < blockSize; i++) {
    for (let b = 0; b < spec.blocks; b++) finalCodewords.push(dataBlocks[b][i]);
  }
  for (let i = 0; i < spec.ecPerBlock; i++) {
    for (let b = 0; b < spec.blocks; b++) finalCodewords.push(ecBlocks[b][i]);
  }

  const size = spec.size;
  const matrix = Array.from({ length: size }, () => new Int8Array(size).fill(-1));
  const reserved = Array.from({ length: size }, () => new Uint8Array(size));

  const setMod = (r, c, dark, isReserved = true) => {
    if (r < 0 || r >= size || c < 0 || c >= size) return;
    matrix[r][c] = dark ? 1 : 0;
    if (isReserved) reserved[r][c] = 1;
  };

  // Finder patterns + separators
  const drawFinder = (tr, tc) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const rr = tr + r;
        const cc = tc + c;
        if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
        const inOuter = r >= 0 && r <= 6 && c >= 0 && c <= 6;
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        setMod(rr, cc, inOuter && (isBorder || isCenter));
      }
    }
  };
  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    setMod(6, i, i % 2 === 0);
    setMod(i, 6, i % 2 === 0);
  }

  // Alignment patterns
  const align = spec.align;
  for (let i = 0; i < align.length; i++) {
    for (let j = 0; j < align.length; j++) {
      const r = align[i];
      const c = align[j];
      if (reserved[r][c]) continue;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const dark = Math.max(Math.abs(dr), Math.abs(dc)) !== 1;
          setMod(r + dr, c + dc, dark);
        }
      }
    }
  }

  // Reserve format info areas + dark module
  setMod(size - 8, 8, true);
  for (let i = 0; i < 9; i++) {
    if (i !== 6) {
      reserved[8][i] = 1;
      reserved[i][8] = 1;
    }
  }
  for (let i = size - 8; i < size; i++) {
    reserved[8][i] = 1;
    reserved[i][8] = 1;
  }

  // Version info for v7+
  if (VERSION_BITS[version]) {
    const vBits = VERSION_BITS[version];
    for (let i = 0; i < 18; i++) {
      const bit = ((vBits >>> i) & 1) === 1;
      const r = Math.floor(i / 3);
      const c = size - 11 + (i % 3);
      setMod(r, c, bit);
      setMod(c, r, bit);
    }
  }

  // Place data bits in zigzag
  const allBits = [];
  for (const cw of finalCodewords) {
    for (let i = 7; i >= 0; i--) allBits.push((cw >>> i) & 1);
  }

  let bitIdx = 0;
  let upward = true;
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--;
    for (let step = 0; step < size; step++) {
      const r = upward ? size - 1 - step : step;
      for (let dx = 0; dx < 2; dx++) {
        const c = col - dx;
        if (reserved[r][c]) continue;
        const bit = bitIdx < allBits.length ? allBits[bitIdx++] : 0;
        // Use mask 0: (r + c) % 2 === 0
        const masked = (r + c) % 2 === 0 ? bit ^ 1 : bit;
        matrix[r][c] = masked;
      }
    }
    upward = !upward;
  }

  // Write format info for ECC L + mask 0
  const fmt = FORMAT_BITS_L[0];
  const fmtCoords1 = [
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
    [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8],
  ];
  const fmtCoords2 = [
    [size - 1, 8], [size - 2, 8], [size - 3, 8], [size - 4, 8],
    [size - 5, 8], [size - 6, 8], [size - 7, 8], [8, size - 8],
    [8, size - 7], [8, size - 6], [8, size - 5], [8, size - 4],
    [8, size - 3], [8, size - 2], [8, size - 1],
  ];
  for (let i = 0; i < 15; i++) {
    const bit = ((fmt >>> (14 - i)) & 1) === 1 ? 1 : 0;
    const [r1, c1] = fmtCoords1[i];
    const [r2, c2] = fmtCoords2[i];
    matrix[r1][c1] = bit;
    matrix[r2][c2] = bit;
  }

  return matrix;
}

/**
 * Render QR matrix onto a canvas and return PNG data URL.
 */
export function renderQrToDataUrl(text, { pixelSize = 280, margin = 4, darkColor, lightColor = 'white' } = {}) {
  const resolvedDark =
    darkColor ||
    (typeof window !== 'undefined'
      ? getComputedStyle(document.documentElement).getPropertyValue('--primary-dark').trim() || 'rgb(27, 94, 69)'
      : 'rgb(27, 94, 69)');
  const matrix = generateQrMatrix(text);
  const count = matrix.length;
  const totalModules = count + margin * 2;
  const scale = Math.max(4, Math.floor(pixelSize / totalModules));
  const canvasSize = totalModules * scale;

  const canvas = document.createElement('canvas');
  canvas.width = canvasSize;
  canvas.height = canvasSize;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = lightColor;
  ctx.fillRect(0, 0, canvasSize, canvasSize);

  ctx.fillStyle = resolvedDark;
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (matrix[r][c] === 1) {
        ctx.fillRect((c + margin) * scale, (r + margin) * scale, scale, scale);
      }
    }
  }
  return canvas.toDataURL('image/png');
}
