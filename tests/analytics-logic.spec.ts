import { expect, test } from '@playwright/test';
import {
  ActiveTimer,
  ANALYTICS_EVENTS,
  buildEngagement,
  buildEvent,
  buildPageview,
  deviceClass,
  eventValue,
  isAnalyticsEvent,
  isId,
  normalizePath,
  optedOut,
  randomId,
  referrerHost,
  scrollPercent,
  utmSource,
} from '../src/lib/analytics';

const ctx = { sid: '0123456789abcdef', pv: 'fedcba9876543210', path: '/check/' };

test.describe('analytics: normalisation', () => {
  const paths: Array<[string, string, string]> = [
    ['/', '/', '/'],
    ['/check/', '/', '/check/'],
    ['/Check', '/', '/check/'],
    ['/datenschutz/index.html', '/', '/datenschutz/'],
    ['//services//', '/', '/services/'],
    ['/repo/profile/', '/repo/', '/profile/'],
    ['/repo/', '/repo/', '/'],
    ['/repository/x/', '/repo/', '/repository/x/'],
    ['/favicon.ico', '/', '/favicon.ico'],
    ['/<script>/', '/', '/other/'],
    ['/äöü/', '/', '/other/'],
    [`/${'a'.repeat(120)}/`, '/', '/other/'],
  ];
  for (const [input, base, expected] of paths) {
    test(`normalizePath(${input.slice(0, 30)}, ${base}) → ${expected}`, () => {
      expect(normalizePath(input, base)).toBe(expected);
    });
  }

  test('referrer is reduced to an external host', () => {
    expect(referrerHost('', 'dynamics-tim.dev')).toBe('');
    expect(referrerHost('https://www.linkedin.com/feed/?trk=abc', 'dynamics-tim.dev')).toBe('linkedin.com');
    expect(referrerHost('https://dynamics-tim.dev/check/', 'dynamics-tim.dev')).toBe('');
    expect(referrerHost('https://www.dynamics-tim.dev/', 'dynamics-tim.dev')).toBe('');
    expect(referrerHost('android-app://com.slack/', 'dynamics-tim.dev')).toBe('');
    expect(referrerHost('not a url', 'dynamics-tim.dev')).toBe('');
    expect(referrerHost(`https://${'a'.repeat(120)}.com/`, 'dynamics-tim.dev')).toBe('');
  });

  test('utm_source is lowercased and whitelisted', () => {
    expect(utmSource('?utm_source=LinkedIn&utm_medium=social')).toBe('linkedin');
    expect(utmSource('?ref=newsletter_2026')).toBe('newsletter_2026');
    expect(utmSource('?utm_source=<b>x</b>')).toBe('');
    expect(utmSource(`?utm_source=${'a'.repeat(41)}`)).toBe('');
    expect(utmSource('')).toBe('');
  });

  test('device class from viewport width', () => {
    expect(deviceClass(390)).toBe('mobile');
    expect(deviceClass(639)).toBe('mobile');
    expect(deviceClass(640)).toBe('tablet');
    expect(deviceClass(1023)).toBe('tablet');
    expect(deviceClass(1440)).toBe('desktop');
  });

  test('scroll percent is clamped', () => {
    expect(scrollPercent(800, 1600)).toBe(50);
    expect(scrollPercent(2000, 1600)).toBe(100);
    expect(scrollPercent(100, 0)).toBe(0);
    expect(scrollPercent(Number.NaN, 1000)).toBe(0);
  });

  test('ids are 16 lowercase hex characters', () => {
    const id = randomId((bytes) => bytes.fill(171));
    expect(id).toBe('abababababababab');
    expect(isId(id)).toBe(true);
    expect(isId('ABABABABABABABAB')).toBe(false);
    expect(isId(null)).toBe(false);
  });

  test('do-not-track and global privacy control opt out', () => {
    expect(optedOut({ doNotTrack: '1' })).toBe(true);
    expect(optedOut({ globalPrivacyControl: true })).toBe(true);
    expect(optedOut({ doNotTrack: 'unspecified', globalPrivacyControl: false })).toBe(false);
    expect(optedOut({})).toBe(false);
  });
});

test.describe('analytics: payloads (mirror of the n8n whitelist)', () => {
  test('event names and values', () => {
    // Changing this table means changing the n8n node "Prüfen & normalisieren" as well
    expect(ANALYTICS_EVENTS).toEqual({
      hc_start: [''],
      hc_complete: ['kritisch', 'ausbaufaehig', 'solide', 'exzellent'],
      form_start: ['healthcheck', 'contact', 'recruiter'],
      form_submit: ['healthcheck', 'contact', 'recruiter'],
      booking_click: [''],
      mail_click: [''],
      video_play: [''],
    });
    expect(isAnalyticsEvent('hc_start')).toBe(true);
    expect(isAnalyticsEvent('toString')).toBe(false);
    expect(eventValue('hc_complete', 'solide')).toBe('solide');
    expect(eventValue('hc_complete', 'hacked')).toBeNull();
    expect(eventValue('hc_complete', undefined)).toBeNull();
    expect(eventValue('mail_click', undefined)).toBe('');
    expect(eventValue('mail_click', 'x')).toBeNull();
  });

  test('pageview has exactly the whitelisted keys', () => {
    const payload = buildPageview({ ...ctx, ref: 'linkedin.com', utm: '', dev: 'mobile', isNew: true });
    expect(payload).toEqual({
      v: 1,
      t: 'pageview',
      sid: ctx.sid,
      pv: ctx.pv,
      path: '/check/',
      ref: 'linkedin.com',
      utm: '',
      dev: 'mobile',
      new: true,
    });
  });

  test('engagement is rounded and capped', () => {
    expect(buildEngagement({ ...ctx, activeMs: 12_499, scroll: 73.6 })).toMatchObject({ t: 'engagement', sec: 12, scroll: 74 });
    expect(buildEngagement({ ...ctx, activeMs: 10 * 3600 * 1000, scroll: 140 })).toMatchObject({ sec: 14_400, scroll: 100 });
    expect(buildEngagement({ ...ctx, activeMs: -5, scroll: -1 })).toMatchObject({ sec: 0, scroll: 0 });
  });

  test('event payload whitelists the value (unknown values drop the event)', () => {
    expect(buildEvent({ ...ctx, name: 'form_submit', value: 'recruiter' })).toEqual({
      v: 1,
      t: 'event',
      sid: ctx.sid,
      pv: ctx.pv,
      path: '/check/',
      name: 'form_submit',
      value: 'recruiter',
    });
    expect(buildEvent({ ...ctx, name: 'hc_start' })?.value).toBe('');
    expect(buildEvent({ ...ctx, name: 'hc_start', value: 'x' })).toBeNull();
    expect(buildEvent({ ...ctx, name: 'form_start', value: 'unknown-kind' })).toBeNull();
  });
});

test('active timer only counts visible time', () => {
  let now = 1000;
  const timer = new ActiveTimer(true, () => now);
  now = 4000;
  expect(timer.ms).toBe(3000);
  timer.setVisible(false);
  now = 60_000;
  expect(timer.ms).toBe(3000);
  timer.setVisible(true);
  timer.setVisible(true); // idempotent
  now = 62_000;
  expect(timer.ms).toBe(5000);

  const hidden = new ActiveTimer(false, () => now);
  now = 90_000;
  expect(hidden.ms).toBe(0);
});
