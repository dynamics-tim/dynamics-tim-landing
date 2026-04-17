/* eslint-env node */
/**
 * Generates all favicon PNG files and favicon.ico from favicon.svg.
 * Run via: node scripts/generate-favicons.mjs
 * Or automatically as part of the postinstall hook.
 */
import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');
const svgPath = join(publicDir, 'favicon.svg');

const svgBuffer = readFileSync(svgPath);

const sizes = [
  { size: 16,  file: 'favicon-16x16.png' },
  { size: 32,  file: 'favicon-32x32.png' },
  { size: 180, file: 'apple-touch-icon.png' },
  { size: 192, file: 'android-chrome-192x192.png' },
  { size: 512, file: 'android-chrome-512x512.png' },
];

console.log('Generating favicons from favicon.svg…');

const pngBuffers = {};

for (const { size, file } of sizes) {
  const outPath = join(publicDir, file);
  const png = await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toBuffer();
  writeFileSync(outPath, png);
  pngBuffers[size] = png;
  console.log(`  ✓ ${file} (${size}×${size})`);
}

// Build a minimal multi-resolution ICO (16x16 + 32x32) without external deps.
// ICO format: ICONDIR + ICONDIRECTRYs + PNG image data.
const icoSizes = [16, 32];
const icoImages = icoSizes.map((s) => pngBuffers[s]);

const numImages = icoImages.length;
const headerSize = 6; // ICONDIR
const dirEntrySize = 16; // ICONDIRENTRY per image
const dirSize = headerSize + numImages * dirEntrySize;

let offset = dirSize;
const entries = icoImages.map((buf, i) => {
  const s = icoSizes[i];
  const entry = Buffer.alloc(16);
  entry.writeUInt8(s === 256 ? 0 : s, 0);  // width  (0 = 256)
  entry.writeUInt8(s === 256 ? 0 : s, 1);  // height (0 = 256)
  entry.writeUInt8(0, 2);                  // color count
  entry.writeUInt8(0, 3);                  // reserved
  entry.writeUInt16LE(1, 4);               // planes
  entry.writeUInt16LE(32, 6);              // bit count
  entry.writeUInt32LE(buf.length, 8);      // size of image data
  entry.writeUInt32LE(offset, 12);         // offset to image data
  offset += buf.length;
  return entry;
});

const iconDir = Buffer.alloc(6);
iconDir.writeUInt16LE(0, 0);          // reserved
iconDir.writeUInt16LE(1, 2);          // type: 1 = icon
iconDir.writeUInt16LE(numImages, 4);  // image count

const icoBuffer = Buffer.concat([iconDir, ...entries, ...icoImages]);
writeFileSync(join(publicDir, 'favicon.ico'), icoBuffer);
console.log('  ✓ favicon.ico (16×16 + 32×32)');

console.log('Done.');
