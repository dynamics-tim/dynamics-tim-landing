/**
 * URL helpers for GitHub Pages compatible links.
 *
 * The site can be deployed under a sub-path (see `PUBLIC_BASE_URL` in
 * `astro.config.mjs`), so internal links must never be hard-coded as `/page`.
 */

/** The configured base path, always ending with a slash (e.g. `/` or `/repo/`). */
export const base: string = import.meta.env.BASE_URL ?? '/';

/**
 * Build an internal page link that respects the base path and Astro's
 * `trailingSlash: 'always'` setting.
 *
 * @example
 * to('services')          // => '/services/'
 * to('/profile')          // => '/profile/'
 * to('#health-check')     // => '/#health-check'
 * to('contact#form')      // => '/contact/#form'
 */
export function to(path: string): string {
  const trimmed = path.replace(/^\//, '');
  const [pathname, hash] = trimmed.split('#');
  const normalized = pathname ? `${pathname.replace(/\/$/, '')}/` : '';
  const suffix = hash ? `#${hash}` : '';
  return `${base}${normalized}${suffix}`;
}

/** Build a link to a static file in `/public` (e.g. `asset('images/tim-portrait.jpg')`). */
export function asset(path: string): string {
  return `${base}${path.replace(/^\//, '')}`;
}
