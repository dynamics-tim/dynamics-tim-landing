/**
 * Content-Security-Policy for the <meta http-equiv> tag in BaseLayout.
 *
 * Add new external origins here (and only here) when integrating a service.
 */
export interface CspOptions {
  /** Origin of the n8n lead endpoint (site.leadApi), if the forms are enabled */
  leadOrigin?: string | null;
  /** Origin of the n8n analytics endpoint (site.analyticsApi), if tracking is enabled */
  analyticsOrigin?: string | null;
}

export function buildCsp({ leadOrigin = null, analyticsOrigin = null }: CspOptions = {}): string {
  const scriptSources = ["'self'", "'unsafe-inline'"];
  const imgSources = ["'self'", 'data:'];
  const connectSources = new Set(["'self'"]);

  for (const origin of [leadOrigin, analyticsOrigin]) {
    if (origin) connectSources.add(origin);
  }

  return [
    "default-src 'self'",
    `script-src ${scriptSources.join(' ')}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src ${imgSources.join(' ')}`,
    "font-src 'self'",
    `connect-src ${[...connectSources].join(' ')}`,
    "media-src 'self'",
    "frame-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' mailto:",
  ].join('; ');
}

/** Origin of a URL, or null when missing/invalid. */
export function originOf(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}
