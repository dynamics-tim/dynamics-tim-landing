/* eslint-env node */
/**
 * Copies the social share image (1200×630) to public/og-image.png (run on npm install).
 *
 * Source: scripts/assets/og-image.png, rendered from scripts/assets/og-template.html.
 * To change it, edit the template and re-render, e.g. with Playwright:
 *   page.setViewportSize({ width: 1200, height: 630 }); page.goto('file://…/og-template.html');
 *   page.screenshot({ path: 'scripts/assets/og-image.png' });
 */
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const source = fileURLToPath(new URL('./assets/og-image.png', import.meta.url));
const target = fileURLToPath(new URL('../public/og-image.png', import.meta.url));

mkdirSync(dirname(target), { recursive: true });
copyFileSync(source, target);
console.log(`Copied OG image to ${target}`);
