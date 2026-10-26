const fs = require('fs');
const zlib = require('zlib');

function createPng(width, height, drawFn) {
  // RGBA buffer
  const buffer = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      buffer[idx] = r;
      buffer[idx + 1] = g;
      buffer[idx + 2] = b;
      buffer[idx + 3] = a;
    }
  }

  // PNG filter byte per row: 0 (None)
  const rawData = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (width * 4 + 1);
    rawData[rowOffset] = 0; // Filter: None
    buffer.copy(rawData, rowOffset + 1, y * width * 4, (y + 1) * width * 4);
  }

  const deflated = zlib.deflateSync(rawData);

  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8-bit depth
  ihdrData[9] = 6; // Color type: 6 (RGBA)
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // IDAT chunk
  const idatChunk = createChunk('IDAT', deflated);

  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function crc32(buf) {
  let table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ (-1)) >>> 0;
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = crc32(typeAndData);
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

// Draw beautiful agricultural icon: rounded rect with emerald green gradient, golden stalk and leaf
function drawIcon(x, y, w, h) {
  const nx = x / w;
  const ny = y / h;
  const cx = 0.5;
  const cy = 0.5;

  // Rounded rectangle mask (radius = 0.22 * w)
  const r = 0.22;
  let inCard = true;
  const dx = Math.abs(nx - cx);
  const dy = Math.abs(ny - cy);
  const half = 0.46;
  const innerHalf = half - r;

  if (dx > half || dy > half) {
    inCard = false;
  } else if (dx > innerHalf && dy > innerHalf) {
    const cornerDist = Math.hypot(dx - innerHalf, dy - innerHalf);
    if (cornerDist > r) inCard = false;
  }

  if (!inCard) return [0, 0, 0, 0]; // Transparent background outside rounded card

  // Emerald green gradient background
  // Top: #15803d (21, 128, 61), Bottom: #0f3d24 (15, 61, 36)
  const bgR = Math.round(21 * (1 - ny * 0.4));
  const bgG = Math.round(135 * (1 - ny * 0.35));
  const bgB = Math.round(61 * (1 - ny * 0.3));

  // Central plant emblem: stem + leaves + grain heads
  const px = nx - 0.5;
  const py = ny - 0.52; // slightly offset center

  // Stem: vertical curve from py = 0.25 to -0.2
  const stemX = 0.03 * Math.sin(py * 4);
  const distStem = Math.hypot(px - stemX, 0);
  const inStem = (distStem < 0.022) && (py >= -0.22 && py <= 0.28);

  // Left leaf: curved ellipse
  const lx = px + 0.12;
  const ly = py + 0.02;
  const distLeaf1 = Math.hypot(lx * 2.2, (ly - lx * 0.5) * 1.6);
  const inLeaf1 = distLeaf1 < 0.18 && px < 0.02 && py > -0.15 && py < 0.18;

  // Right leaf
  const rx = px - 0.12;
  const ry = py - 0.06;
  const distLeaf2 = Math.hypot(rx * 2.2, (ry + rx * 0.5) * 1.6);
  const inLeaf2 = distLeaf2 < 0.18 && px > -0.02 && py > -0.2 && py < 0.12;

  // Golden wheat grains at the top: clusters around py = -0.25 to -0.05
  let inGrain = false;
  const grains = [
    { gx: -0.05, gy: -0.18, rad: 0.055 },
    { gx: 0.06, gy: -0.22, rad: 0.055 },
    { gx: -0.03, gy: -0.28, rad: 0.05 },
    { gx: 0.04, gy: -0.32, rad: 0.05 },
    { gx: 0.0, gy: -0.36, rad: 0.045 },
  ];
  for (const g of grains) {
    if (Math.hypot(px - g.gx, (py - g.gy) * 1.5) < g.rad) {
      inGrain = true;
      break;
    }
  }

  if (inGrain) {
    // Golden amber grains: #fbbf24 (251, 191, 36)
    return [251, 191, 36, 255];
  }
  if (inStem || inLeaf1 || inLeaf2) {
    // Bright mint / lime agricultural leaf: #86efac (134, 239, 172)
    return [134, 239, 172, 255];
  }

  // Subtle border highlight
  return [bgR, bgG, bgB, 255];
}

const outDir = 'c:/Users/User/Desktop/Climayield/Frontend/public';
fs.writeFileSync(`${outDir}/icon-192.png`, createPng(192, 192, drawIcon));
fs.writeFileSync(`${outDir}/icon-512.png`, createPng(512, 512, drawIcon));
fs.writeFileSync(`${outDir}/apple-touch-icon.png`, createPng(180, 180, drawIcon));
fs.writeFileSync(`${outDir}/favicon.png`, createPng(64, 64, drawIcon));

console.log('✅ Generated icon-192.png, icon-512.png, apple-touch-icon.png, and favicon.png');
