/* eslint-env node */
/**
 * Generates the logo, favicon and app-icon set from the vector sources in scripts/assets/brand/.
 * Run via: node scripts/generate-brand.mjs (also part of the postinstall hook).
 *
 * Sources (64×64 grid, hand-authored — edit these, never the generated files):
 *   mark.svg           lime tile + ink "tf." monogram (primary mark, favicon)
 *   mark-dark.svg      inverted tile for light-on-dark placements
 *   glyph.svg          monogram without tile
 *   mark-square.svg    full-bleed square (iOS applies its own corner mask)
 *   mark-maskable.svg  full-bleed, monogram inside the 80 % safe zone (Android maskable)
 *   lockup-on-*.svg    mark + outlined wordmark "Tim Friedrich / Dynamics 365"
 *
 * Output: favicons + app icons in public/, brand kit (SVG + PNG) in public/brand/.
 */
import sharp from 'sharp';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(root, 'scripts', 'assets', 'brand');
const publicDir = join(root, 'public');
const brandDir = join(publicDir, 'brand');
mkdirSync(brandDir, { recursive: true });

const source = (name) => readFileSync(join(srcDir, name));

/** Renders an SVG source to a PNG of the given width (height follows the aspect ratio). */
const render = (name, width) =>
  sharp(source(name), { density: Math.max(72, Math.ceil((width / 64) * 72)) })
    .resize({ width })
    .png({ compressionLevel: 9 })
    .toBuffer();

const write = (dir, file, buffer, label) => {
  writeFileSync(join(dir, file), buffer);
  console.log(`  ✓ ${dir === brandDir ? 'brand/' : ''}${file}${label ? ` (${label})` : ''}`);
};

console.log('Generating logo, favicons and app icons…');

// 1) Vector files
copyFileSync(join(srcDir, 'mark.svg'), join(publicDir, 'favicon.svg'));
console.log('  ✓ favicon.svg');
for (const file of ['mark.svg', 'mark-dark.svg', 'glyph.svg', 'lockup-on-dark.svg', 'lockup-on-light.svg']) {
  copyFileSync(join(srcDir, file), join(brandDir, `logo-${file}`));
  console.log(`  ✓ brand/logo-${file}`);
}

// 2) Favicons + app icons (paths referenced by BaseLayout.astro and manifest.webmanifest)
const icons = [
  { src: 'mark.svg', size: 16, file: 'favicon-16x16.png' },
  { src: 'mark.svg', size: 32, file: 'favicon-32x32.png' },
  { src: 'mark.svg', size: 48, file: 'favicon-48x48.png' },
  { src: 'mark-square.svg', size: 180, file: 'apple-touch-icon.png' },
  { src: 'mark.svg', size: 192, file: 'android-chrome-192x192.png' },
  { src: 'mark.svg', size: 512, file: 'android-chrome-512x512.png' },
  { src: 'mark-maskable.svg', size: 192, file: 'maskable-192x192.png' },
  { src: 'mark-maskable.svg', size: 512, file: 'maskable-512x512.png' },
];

const pngBySize = {};
for (const { src, size, file } of icons) {
  const png = await render(src, size);
  if (src === 'mark.svg') pngBySize[size] = png;
  write(publicDir, file, png, `${size}×${size}`);
}

// 3) Multi-resolution favicon.ico (16/32/48, PNG-encoded entries) without external deps
const icoSizes = [16, 32, 48];
const images = icoSizes.map((s) => pngBySize[s]);
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(images.length, 4);
let offset = 6 + images.length * 16;
const entries = images.map((buf, i) => {
  const entry = Buffer.alloc(16);
  entry.writeUInt8(icoSizes[i], 0); // width
  entry.writeUInt8(icoSizes[i], 1); // height
  entry.writeUInt16LE(1, 4); // colour planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(buf.length, 8);
  entry.writeUInt32LE(offset, 12);
  offset += buf.length;
  return entry;
});
write(publicDir, 'favicon.ico', Buffer.concat([header, ...entries, ...images]), '16/32/48');

// 4) Brand kit PNGs (social avatars, documents, e-mail signature)
const brandPngs = [
  ...[256, 512, 1024].map((w) => ({ src: 'mark.svg', w, file: `logo-mark-${w}.png` })),
  { src: 'mark-dark.svg', w: 1024, file: 'logo-mark-dark-1024.png' },
  { src: 'lockup-on-dark.svg', w: 600, file: 'logo-lockup-on-dark-600.png' },
  { src: 'lockup-on-dark.svg', w: 1200, file: 'logo-lockup-on-dark-1200.png' },
  { src: 'lockup-on-light.svg', w: 600, file: 'logo-lockup-on-light-600.png' },
  { src: 'lockup-on-light.svg', w: 1200, file: 'logo-lockup-on-light-1200.png' },
];
for (const { src, w, file } of brandPngs) {
  write(brandDir, file, await render(src, w), `${w}px`);
}

console.log('Done.');
