/**
 * First-party visitor analytics (DOM wiring). Pure logic: `lib/analytics.ts`.
 *
 * Starts only once the visitor has consented to the "analytics" category
 * (`consent:change` from public/assets/js/consent.js) and stops immediately on revocation.
 * Sends, via `navigator.sendBeacon` (text/plain → no CORS preflight, survives page unload):
 *   - one `pageview` per page (incl. back/forward cache restores)
 *   - `engagement` (visible time + scroll depth) whenever the page is hidden or left
 *   - interaction events from `track()` / `trackOnce()` (health-check, lead forms,
 *     booking/mail clicks, video)
 */
import {
  ActiveTimer,
  buildEngagement,
  buildEvent,
  buildPageview,
  deviceClass,
  isId,
  normalizePath,
  optedOut,
  randomId,
  referrerHost,
  scrollPercent,
  utmSource,
  type AnalyticsEventName,
  type AnalyticsPayload,
} from '../lib/analytics';
import { site } from '../data/site';
import { base } from '../utils/url';

const SESSION_KEY = 'dtAnalyticsSid';
/** Same key/shape as public/assets/js/consent.js */
const CONSENT_KEY = 'dynamicsTimConsent';
const BOOKING_URL = new URL(site.contact.bookingUrl);

interface PageContext {
  sid: string;
  pv: string;
  path: string;
}

const endpoint = document.body.dataset.analyticsEndpoint;
const collectUrl = endpoint ? `${endpoint}/collect` : null;

let ctx: PageContext | null = null;
let timer: ActiveTimer | null = null;
let maxVisibleBottom = 0;
let lastSent = '';
/** Keys already sent with trackOnce() during the current pageview */
let sentOnce = new Set<string>();
/** Consent was revoked on this page load — a re-grant only takes effect on the next page */
let revokedThisLoad = false;

const fillRandom = (bytes: Uint8Array) => window.crypto.getRandomValues(bytes);

function readSessionId(): string | null {
  try {
    return window.sessionStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

function writeSessionId(value: string | null) {
  try {
    if (value) window.sessionStorage.setItem(SESSION_KEY, value);
    else window.sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // Storage blocked: every page counts as a new visit — acceptable
  }
}

/** Current stored decision (used after a back/forward-cache restore, when in-memory state is stale). */
function storedAnalyticsConsent(): boolean {
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    const parsed = raw ? (JSON.parse(raw) as { version?: string; preferences?: { analytics?: unknown } }) : null;
    return (
      parsed?.version === document.documentElement.dataset.consentVersion &&
      parsed?.preferences?.analytics === true
    );
  } catch {
    return false;
  }
}

function send(payload: AnalyticsPayload) {
  if (!collectUrl) return;
  const body = JSON.stringify(payload);
  try {
    if (navigator.sendBeacon?.(collectUrl, body)) return;
  } catch {
    // fall through to fetch
  }
  fetch(collectUrl, {
    method: 'POST',
    body,
    keepalive: true,
    mode: 'no-cors',
    credentials: 'omit',
    referrerPolicy: 'strict-origin',
    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
  }).catch(() => undefined);
}

function documentHeight() {
  return Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
}

function measureScroll() {
  maxVisibleBottom = Math.max(maxVisibleBottom, window.scrollY + window.innerHeight);
}

function beginPageview() {
  if (!collectUrl || optedOut(navigator as Navigator & { globalPrivacyControl?: boolean })) return;
  const existing = readSessionId();
  const sid = isId(existing) ? existing : randomId(fillRandom);
  if (sid !== existing) writeSessionId(sid);

  ctx = { sid, pv: randomId(fillRandom), path: normalizePath(window.location.pathname, base) };
  timer = new ActiveTimer(document.visibilityState === 'visible');
  maxVisibleBottom = 0;
  lastSent = '';
  sentOnce = new Set();
  measureScroll();

  send(
    buildPageview({
      ...ctx,
      ref: referrerHost(document.referrer, window.location.hostname),
      utm: utmSource(window.location.search),
      dev: deviceClass(window.innerWidth),
      isNew: sid !== existing,
    })
  );
}

function flushEngagement() {
  if (!ctx || !timer) return;
  const payload = buildEngagement({
    ...ctx,
    activeMs: timer.ms,
    scroll: scrollPercent(maxVisibleBottom, documentHeight()),
  });
  const key = `${payload.sec}|${payload.scroll}`;
  if (key === lastSent) return;
  lastSent = key;
  send(payload);
}

function stop() {
  ctx = null;
  timer = null;
  writeSessionId(null);
}

/** Record an interaction. No-op without consent; values outside the whitelist are dropped. */
export function track(name: AnalyticsEventName, value?: string) {
  if (!ctx) return;
  const payload = buildEvent({ ...ctx, name, value });
  if (payload) send(payload);
}

/**
 * Record an interaction at most once per pageview and `key` (funnel steps such as "started the
 * quiz"). Without consent nothing is marked, so the step still counts once consent is given.
 */
export function trackOnce(name: AnalyticsEventName, value?: string, key: string = name) {
  if (!ctx || sentOnce.has(key)) return;
  sentOnce.add(key);
  track(name, value);
}

function onConsentChange(granted: boolean) {
  if (granted && !ctx && !revokedThisLoad) beginPageview();
  else if (!granted && ctx) {
    revokedThisLoad = true;
    stop();
  }
}

window.addEventListener('consent:change', (event) => {
  const detail = (event as CustomEvent<Record<string, boolean>>).detail;
  onConsentChange(detail?.analytics === true);
});
// consent.js may have initialised before this module ran
onConsentChange(document.documentElement.dataset.consentAnalytics === 'granted');

let scrollQueued = false;
window.addEventListener(
  'scroll',
  () => {
    if (!ctx || scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(() => {
      scrollQueued = false;
      measureScroll();
    });
  },
  { passive: true }
);

document.addEventListener('visibilitychange', () => {
  const visible = document.visibilityState === 'visible';
  timer?.setVisible(visible);
  if (!visible) flushEngagement();
});
window.addEventListener('pagehide', flushEngagement);
window.addEventListener('pageshow', (event) => {
  if (!event.persisted) return;
  // Restored from the back/forward cache: the module does not re-run and the consent decision
  // may have changed on another page in the meantime — re-read it before counting anything.
  revokedThisLoad = false;
  if (storedAnalyticsConsent()) beginPageview();
  else if (ctx) stop();
});

document.addEventListener(
  'click',
  (event) => {
    const link = (event.target as Element | null)?.closest?.<HTMLAnchorElement>('a[href]');
    if (!link) return;
    if (link.protocol === 'mailto:') track('mail_click');
    else if (link.hostname === BOOKING_URL.hostname && link.pathname === BOOKING_URL.pathname) {
      track('booking_click');
    }
  },
  { capture: true }
);
