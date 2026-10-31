/**
 * Content-Security-Policy for the <meta http-equiv> tag in BaseLayout.
 *
 * Add new external origins here (and only here) when integrating a service.
 */
export interface CspOptions {
  /** Origin of the GoatCounter endpoint, if analytics is configured */
  goatcounterOrigin?: string | null;
  /** Origin of the n8n lead endpoint (site.leadApi), if the forms are enabled */
  leadOrigin?: string | null;
}

export function buildCsp({ goatcounterOrigin = null, leadOrigin = null }: CspOptions = {}): string {
  const scriptSources = ["'self'", "'unsafe-inline'"];
  const imgSources = ["'self'", 'data:'];
  const connectSources = ["'self'"];

  if (leadOrigin) {
    connectSources.push(leadOrigin);
  }

  if (goatcounterOrigin) {
    scriptSources.push('https://gc.zgo.at');
    connectSources.push(goatcounterOrigin);
    imgSources.push(goatcounterOrigin);
  }

  return [
    "default-src 'self'",
    `script-src ${scriptSources.join(' ')}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src ${imgSources.join(' ')}`,
    "font-src 'self'",
    `connect-src ${connectSources.join(' ')}`,
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
