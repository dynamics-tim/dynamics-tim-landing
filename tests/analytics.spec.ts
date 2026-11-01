import type { Page } from '@playwright/test';
import { answerAll, expect, mockAnalyticsApi, setConsent, test, weakAnswers, type AnalyticsMock } from './fixtures';

const byType = (mock: AnalyticsMock, t: string) => mock.hits.filter((hit) => hit.t === t);

async function hidePage(page: Page) {
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
}

test('without analytics consent nothing is sent and nothing is stored', async ({ page }) => {
  const mock = await mockAnalyticsApi(page);
  await page.goto('/check/');
  await answerAll(page);
  await hidePage(page);
  await page.goto('/');
  await page.waitForTimeout(300);
  expect(mock.hits).toEqual([]);
  expect(await page.evaluate(() => sessionStorage.getItem('dtAnalyticsSid'))).toBeNull();
});

test('with consent: pageviews share a visit id, engagement is sent when the page is hidden', async ({ page, pageErrors }) => {
  await setConsent(page, { analytics: true });
  const mock = await mockAnalyticsApi(page);

  await page.goto('/check/?utm_source=LinkedIn&secret=1#x');
  await expect.poll(() => byType(mock, 'pageview').length).toBe(1);
  const [first] = byType(mock, 'pageview');
  expect(first).toEqual({
    v: 1,
    t: 'pageview',
    sid: expect.stringMatching(/^[a-f0-9]{16}$/),
    pv: expect.stringMatching(/^[a-f0-9]{16}$/),
    path: '/check/',
    ref: '',
    utm: 'linkedin',
    dev: 'desktop',
    new: true,
  });
  expect(mock.contentTypes[0]).toContain('text/plain');

  await page.mouse.wheel(0, 1200);
  await hidePage(page);
  await expect.poll(() => byType(mock, 'engagement').length).toBe(1);
  const [engagement] = byType(mock, 'engagement');
  expect(engagement).toMatchObject({ t: 'engagement', sid: first.sid, pv: first.pv, path: '/check/' });
  expect(engagement.sec).toEqual(expect.any(Number));
  expect(engagement.scroll as number).toBeGreaterThan(0);

  await page.goto('/services/');
  await expect.poll(() => byType(mock, 'pageview').length).toBe(2);
  const second = byType(mock, 'pageview')[1];
  expect(second).toMatchObject({ path: '/services/', sid: first.sid, new: false });
  expect(second.pv).not.toBe(first.pv);
  // Nothing in the payload identifies the visitor beyond the random tab-session id
  expect(JSON.stringify(mock.hits)).not.toMatch(/secret|Mozilla|127\.0\.0\.1/);
  expect(pageErrors).toEqual([]);
});

test('with consent: health-check and booking interactions are tracked', async ({ page }) => {
  await setConsent(page, { analytics: true });
  const mock = await mockAnalyticsApi(page);
  await page.goto('/check/');
  await answerAll(page);
  await expect.poll(() => byType(mock, 'event').map((e) => `${e.name}:${e.value}`)).toEqual([
    'hc_start:',
    'hc_complete:kritisch',
  ]);

  // A restored result (reload) is not counted as a second completion
  await page.reload();
  await expect(page.locator('#hc-result')).toBeVisible();
  await page.locator('[data-lead-root] input[name="name"]').first().focus();
  await expect.poll(() => byType(mock, 'event').map((e) => `${e.name}:${e.value}`)).toEqual([
    'hc_start:',
    'hc_complete:kritisch',
    'form_start:healthcheck',
  ]);

  await page.evaluate(() => {
    const link = document.querySelector<HTMLAnchorElement>('a[href*="outlook.office.com"]');
    link?.addEventListener('click', (event) => event.preventDefault());
    link?.click();
  });
  await expect.poll(() => byType(mock, 'event').some((e) => e.name === 'booking_click')).toBe(true);
});

test('revoking consent stops tracking and deletes the visit id', async ({ page }) => {
  await setConsent(page, { analytics: true });
  const mock = await mockAnalyticsApi(page);
  await page.goto('/');
  await expect.poll(() => byType(mock, 'pageview').length).toBe(1);
  expect(await page.evaluate(() => sessionStorage.getItem('dtAnalyticsSid'))).toMatch(/^[a-f0-9]{16}$/);

  await page.locator('[data-consent-manage]').click();
  await page.locator('[data-action="modal-reject-all"]').click();
  expect(await page.evaluate(() => sessionStorage.getItem('dtAnalyticsSid'))).toBeNull();

  // No engagement beacon after revocation (init scripts re-grant on navigation, so stay on the page)
  const before = mock.hits.length;
  await page.mouse.wheel(0, 800);
  await hidePage(page);
  await page.waitForTimeout(300);
  expect(mock.hits.length).toBe(before);
});

test('granting consent in the banner starts tracking on the current page', async ({ page }) => {
  const mock = await mockAnalyticsApi(page);
  await page.addInitScript(() => window.localStorage.removeItem('dynamicsTimConsent'));
  await page.goto('/services/');
  await page.waitForTimeout(200);
  expect(mock.hits).toEqual([]);
  await page.locator('[data-action="accept-all"]').click();
  await expect.poll(() => byType(mock, 'pageview').map((p) => p.path)).toEqual(['/services/']);
});

test('global privacy control disables tracking even with consent', async ({ page }) => {
  await setConsent(page, { analytics: true });
  await page.addInitScript(() =>
    Object.defineProperty(Navigator.prototype, 'globalPrivacyControl', { get: () => true })
  );
  const mock = await mockAnalyticsApi(page);
  await page.goto('/');
  await page.waitForTimeout(300);
  expect(mock.hits).toEqual([]);
});

test('revoking and re-granting on the same page does not count a second visit', async ({ page }) => {
  await setConsent(page, { analytics: true });
  const mock = await mockAnalyticsApi(page);
  await page.goto('/');
  await expect.poll(() => byType(mock, 'pageview').length).toBe(1);
  await page.locator('[data-consent-manage]').click();
  await page.locator('[data-action="modal-reject-all"]').click();
  await page.locator('[data-consent-manage]').click();
  await page.locator('[data-action="modal-accept-all"]').click();
  await page.waitForTimeout(300);
  expect(byType(mock, 'pageview').length).toBe(1);
});

test('consent given mid-quiz still records the start once', async ({ page }) => {
  const mock = await mockAnalyticsApi(page);
  await page.addInitScript(() => window.localStorage.removeItem('dynamicsTimConsent'));
  await page.goto('/check/');
  const check = page.locator('[data-health-check]');
  await check.getByRole('button', { name: weakAnswers[0], exact: true }).click();
  await page.locator('[data-action="accept-all"]').click();
  for (const label of weakAnswers.slice(1)) {
    await check.getByRole('button', { name: label, exact: true }).click();
  }
  await expect(page.locator('#hc-result')).toBeVisible();
  await expect.poll(() => byType(mock, 'event').map((e) => `${e.name}:${e.value}`)).toEqual([
    'hc_start:',
    'hc_complete:kritisch',
  ]);
});
