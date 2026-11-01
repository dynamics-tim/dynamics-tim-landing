/**
 * Pure (DOM-free) logic for the first-party visitor analytics. DOM wiring lives in
 * `scripts/analytics.ts`; the receiving side is the n8n workflow
 * "Website-Analytics · dynamics-tim.dev" (node "Prüfen & normalisieren").
 *
 * ── Privacy model ───────────────────────────────────────────────────────────────────
 * - Runs only after consent to the "analytics" category (consent.js), never with
 *   Do-Not-Track / Global Privacy Control.
 * - No cookies, no fingerprinting, no IP or user agent in the payload. The only browser
 *   storage is a random session id in sessionStorage (deleted when the tab closes).
 * - Referrers are reduced to their host, query strings and hashes are never sent.
 *
 * The event names, values and limits below MIRROR the n8n whitelist — change both together.
 */

export const ANALYTICS_VERSION = 1;

export type DeviceClass = 'mobile' | 'tablet' | 'desktop';

/** Interaction events and the values each one may carry ('' = no value). */
export const ANALYTICS_EVENTS = {
  /** First answer in the health-check */
  hc_start: [''],
  /** Health-check result shown — value is the grade id */
  hc_complete: ['kritisch', 'ausbaufaehig', 'solide', 'exzellent'],
  /** First interaction with a lead form — value is the form kind */
  form_start: ['healthcheck', 'contact', 'recruiter'],
  /** Lead accepted by the server — value is the lead kind */
  form_submit: ['healthcheck', 'contact', 'recruiter'],
  /** Click on the Microsoft Bookings link */
  booking_click: [''],
  /** Click on a mailto: link */
  mail_click: [''],
  /** Pitch video started by the visitor (not autoplay) */
  video_play: [''],
} as const satisfies Record<string, readonly string[]>;

export type AnalyticsEventName = keyof typeof ANALYTICS_EVENTS;

export const ANALYTICS_LIMITS = {
  path: 100,
  referrer: 100,
  utm: 40,
  /** Active time per page is capped (tab left open overnight is not "engagement") */
  maxSeconds: 4 * 3600,
} as const;

const ID_RE = /^[a-f0-9]{16}$/;
const PATH_RE = /^\/[a-z0-9\-._~/]*$/;
const HOST_RE = /^[a-z0-9.-]+$/;
const UTM_RE = /^[a-z0-9._-]+$/;

export interface PageviewPayload {
  v: typeof ANALYTICS_VERSION;
  t: 'pageview';
  sid: string;
  pv: string;
  path: string;
  ref: string;
  utm: string;
  dev: DeviceClass;
  new: boolean;
}

export interface EngagementPayload {
  v: typeof ANALYTICS_VERSION;
  t: 'engagement';
  sid: string;
  pv: string;
  path: string;
  sec: number;
  scroll: number;
}

export interface EventPayload {
  v: typeof ANALYTICS_VERSION;
  t: 'event';
  sid: string;
  pv: string;
  path: string;
  name: AnalyticsEventName;
  value: string;
}

export type AnalyticsPayload = PageviewPayload | EngagementPayload | EventPayload;

/** 16 hex characters from a CSPRNG-like source (`fill` is crypto.getRandomValues in the browser). */
export function randomId(fill: (bytes: Uint8Array) => Uint8Array): string {
  return Array.from(fill(new Uint8Array(8)), (b) => b.toString(16).padStart(2, '0')).join('');
}

export function isId(value: unknown): value is string {
  return typeof value === 'string' && ID_RE.test(value);
}

/**
 * Site-relative, lowercase path with a trailing slash and without the deploy base,
 * e.g. ('/repo/Check', '/repo/') → '/check/'. Anything unexpected becomes '/other/'.
 */
export function normalizePath(pathname: string, base = '/'): string {
  let path = pathname.toLowerCase();
  const prefix = base.toLowerCase().replace(/\/$/, '');
  if (prefix && (path === prefix || path.startsWith(`${prefix}/`))) path = path.slice(prefix.length);
  if (!path.startsWith('/')) path = `/${path}`;
  path = path.replace(/\/index\.html$/, '/').replace(/\/{2,}/g, '/');
  if (!path.endsWith('/') && !/\.[a-z0-9]+$/.test(path)) path = `${path}/`;
  return path.length <= ANALYTICS_LIMITS.path && PATH_RE.test(path) ? path : '/other/';
}

/** Host of an external referrer ('' for direct traffic, internal navigation or junk). */
export function referrerHost(referrer: string, ownHost: string): string {
  if (!referrer) return '';
  try {
    const url = new URL(referrer);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return '';
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    if (host === ownHost.toLowerCase().replace(/^www\./, '')) return '';
    return host.length <= ANALYTICS_LIMITS.referrer && HOST_RE.test(host) ? host : '';
  } catch {
    return '';
  }
}

/** `utm_source` (or `ref`) from a query string, lowercased and whitelisted. */
export function utmSource(search: string): string {
  const params = new URLSearchParams(search);
  const raw = (params.get('utm_source') ?? params.get('ref') ?? '').trim().toLowerCase();
  return raw.length <= ANALYTICS_LIMITS.utm && UTM_RE.test(raw) ? raw : '';
}

/** Coarse device class from the viewport width (no user-agent parsing). */
export function deviceClass(viewportWidth: number): DeviceClass {
  if (viewportWidth < 640) return 'mobile';
  if (viewportWidth < 1024) return 'tablet';
  return 'desktop';
}

/** Scroll depth in percent (0–100) from the furthest visible pixel and the document height. */
export function scrollPercent(maxVisibleBottom: number, documentHeight: number): number {
  if (!(documentHeight > 0)) return 0;
  return clamp(Math.round((maxVisibleBottom / documentHeight) * 100), 0, 100);
}

export function isAnalyticsEvent(name: string): name is AnalyticsEventName {
  return Object.prototype.hasOwnProperty.call(ANALYTICS_EVENTS, name);
}

/**
 * Whitelisted value for an event, or null when the value is not allowed for that event —
 * the event is then dropped instead of being recorded with a made-up value.
 */
export function eventValue(name: AnalyticsEventName, value: string | undefined): string | null {
  const allowed: readonly string[] = ANALYTICS_EVENTS[name];
  const candidate = value ?? '';
  return allowed.includes(candidate) ? candidate : null;
}

/** Do-Not-Track or Global Privacy Control set → never track, even with consent. */
export function optedOut(nav: { doNotTrack?: string | null; globalPrivacyControl?: boolean }): boolean {
  return nav.doNotTrack === '1' || nav.doNotTrack === 'yes' || nav.globalPrivacyControl === true;
}

interface Context {
  sid: string;
  pv: string;
  path: string;
}

export function buildPageview(
  ctx: Context & { ref: string; utm: string; dev: DeviceClass; isNew: boolean }
): PageviewPayload {
  return {
    v: ANALYTICS_VERSION,
    t: 'pageview',
    sid: ctx.sid,
    pv: ctx.pv,
    path: ctx.path,
    ref: ctx.ref,
    utm: ctx.utm,
    dev: ctx.dev,
    new: ctx.isNew,
  };
}

export function buildEngagement(ctx: Context & { activeMs: number; scroll: number }): EngagementPayload {
  return {
    v: ANALYTICS_VERSION,
    t: 'engagement',
    sid: ctx.sid,
    pv: ctx.pv,
    path: ctx.path,
    sec: clamp(Math.round(ctx.activeMs / 1000), 0, ANALYTICS_LIMITS.maxSeconds),
    scroll: clamp(Math.round(ctx.scroll), 0, 100),
  };
}

export function buildEvent(
  ctx: Context & { name: AnalyticsEventName; value?: string }
): EventPayload | null {
  const value = eventValue(ctx.name, ctx.value);
  if (value === null) return null;
  return {
    v: ANALYTICS_VERSION,
    t: 'event',
    sid: ctx.sid,
    pv: ctx.pv,
    path: ctx.path,
    name: ctx.name,
    value,
  };
}

/**
 * Accumulates the time a page is actually visible (hidden tabs do not count).
 * `now` is injectable for tests.
 */
export class ActiveTimer {
  private total = 0;
  private since: number | null;

  constructor(
    visible: boolean,
    private readonly now: () => number = () => Date.now()
  ) {
    this.since = visible ? this.now() : null;
  }

  setVisible(visible: boolean): void {
    if (visible && this.since === null) this.since = this.now();
    if (!visible && this.since !== null) {
      this.total += this.now() - this.since;
      this.since = null;
    }
  }

  get ms(): number {
    return this.total + (this.since === null ? 0 : this.now() - this.since);
  }
}

function clamp(value: number, min: number, max: number): number {
  return Number.isFinite(value) ? Math.min(Math.max(value, min), max) : min;
}
