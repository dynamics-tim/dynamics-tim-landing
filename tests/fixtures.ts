import { createHash } from 'node:crypto';
import { test as base, expect, type Page, type Route } from '@playwright/test';

export const LEAD_API = 'https://n8n.dynamics-tim.dev/webhook/dt-lead';

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

/**
 * Every test blocks the real n8n host by default — tests must never reach production.
 * Tests that need the endpoint call `mockLeadApi`, whose routes take precedence.
 */
export const test = base.extend<{ pageErrors: string[] }>({
  page: async ({ page }, use) => {
    await page.route('https://n8n.dynamics-tim.dev/**', (route) => route.abort());
    // Consent already decided, so the banner does not cover the UI under test
    await page.addInitScript(() => {
      try {
        window.localStorage.setItem(
          'dynamicsTimConsent',
          JSON.stringify({
            version: '2024-09-22',
            preferences: { necessary: true },
            timestamp: new Date().toISOString(),
            method: 'reject',
          })
        );
      } catch {
        // ignore
      }
    });
    await use(page);
  },
  pageErrors: async ({ page }, use) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await use(errors);
  },
});

export { expect };
