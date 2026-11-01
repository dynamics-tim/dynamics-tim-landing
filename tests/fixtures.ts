import { createHash } from 'node:crypto';
import { test as base, expect, type Page, type Route } from '@playwright/test';

export const LEAD_API = 'https://n8n.dynamics-tim.dev/webhook/dt-lead';
export const ANALYTICS_COLLECT = 'https://n8n.dynamics-tim.dev/webhook/dt-stats/collect';
/** Must match VERSION in public/assets/js/consent.js, otherwise the banner reappears */
export const CONSENT_LAYER_VERSION = '2026-11-01';

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

/** A solvable challenge (small work factor keeps tests fast). Signature is not verified client-side. */
export function makeChallenge(secretNumber = 37, maxnumber = 200) {
  const expires = Math.floor(Date.now() / 1000) + 600;
  const salt = `${'ab12'.repeat(6)}?expires=${expires}`;
  return {
    algorithm: 'SHA-256',
    challenge: sha256(salt + secretNumber),
    salt,
    signature: 'f'.repeat(64),
    maxnumber,
  };
}

export interface LeadMock {
  submissions: Array<{ body: Record<string, unknown>; contentType: string | undefined }>;
}

/** Mock both n8n endpoints. `respond` decides the submit response. */
export async function mockLeadApi(
  page: Page,
  respond: (body: Record<string, unknown>) => { status: number; json: unknown } = () => ({
    status: 200,
    json: { ok: true },
  })
): Promise<LeadMock> {
  const mock: LeadMock = { submissions: [] };
  await page.route(`${LEAD_API}/challenge`, (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(makeChallenge()),
    })
  );
  await page.route(`${LEAD_API}/submit`, async (route: Route) => {
    const request = route.request();
    const body = JSON.parse(request.postData() ?? '{}') as Record<string, unknown>;
    mock.submissions.push({ body, contentType: request.headers()['content-type'] });
    const { status, json } = respond(body);
    await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(json) });
  });
  return mock;
}

/** Store a consent decision before any page script runs (later calls override earlier ones). */
export async function setConsent(page: Page, { analytics }: { analytics: boolean }) {
  await page.addInitScript(
    ({ version, analytics: granted }) => {
      try {
        window.localStorage.setItem(
          'dynamicsTimConsent',
          JSON.stringify({
            version,
            preferences: { essential: true, analytics: granted, marketing: false, embeds: false },
            timestamp: new Date().toISOString(),
            method: granted ? 'accept' : 'reject',
          })
        );
      } catch {
        // ignore
      }
    },
    { version: CONSENT_LAYER_VERSION, analytics }
  );
}

export interface AnalyticsMock {
  hits: Array<Record<string, unknown>>;
  contentTypes: string[];
}

/** Capture analytics beacons (sendBeacon and the fetch fallback both hit this route). */
export async function mockAnalyticsApi(page: Page): Promise<AnalyticsMock> {
  const mock: AnalyticsMock = { hits: [], contentTypes: [] };
  await page.route(ANALYTICS_COLLECT, async (route: Route) => {
    const request = route.request();
    mock.hits.push(JSON.parse(request.postData() ?? '{}') as Record<string, unknown>);
    mock.contentTypes.push(request.headers()['content-type'] ?? '');
    await route.fulfill({ status: 204, body: '' });
  });
  return mock;
}

/**
 * Every test blocks the real n8n host by default — tests must never reach production.
 * Tests that need the endpoint call `mockLeadApi`, whose routes take precedence.
 */
export const test = base.extend<{ pageErrors: string[] }>({
  page: async ({ page }, use) => {
    await page.route('https://n8n.dynamics-tim.dev/**', (route) => route.abort());
    // Consent already decided, so the banner does not cover the UI under test
    await setConsent(page, { analytics: false });
    await use(page);
  },
  pageErrors: async ({ page }, use) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await use(errors);
  },
});

/** Health-check answers that yield score 37 / "kritisch" */
export const weakAnswers = [
  'Manueller Solution-Export und -Import',
  'Nur Dev und Prod',
  'Eine Person weiß Bescheid',
  'Manuell durch Fachbereich oder Team',
  'Die Anwender, irgendwann',
  'Meistens, gelegentlich ist Nacharbeit nötig',
  'Viel läuft parallel in Excel und Mails',
  'Eine Person neben dem Tagesgeschäft',
];

export async function answerAll(page: Page) {
  const check = page.locator('[data-health-check]');
  for (const [index, label] of weakAnswers.entries()) {
    await expect(page.locator('#hc-step-label')).toHaveText(`Frage ${index + 1} von 8`);
    await check.getByRole('button', { name: label, exact: true }).click();
  }
  await expect(page.locator('#hc-result')).toBeVisible();
}

export { expect };
