import { expect, mockLeadApi, test } from './fixtures';

const weakAnswers = [
  'Manueller Solution-Export und -Import',
  'Nur Dev und Prod',
  'Eine Person weiß Bescheid',
  'Manuell durch Fachbereich oder Team',
  'Die Anwender, irgendwann',
  'Meistens, gelegentlich ist Nacharbeit nötig',
  'Viel läuft parallel in Excel und Mails',
  'Eine Person neben dem Tagesgeschäft',
];

async function answerAll(page: import('@playwright/test').Page) {
  const check = page.locator('[data-health-check]');
  for (const [index, label] of weakAnswers.entries()) {
    await expect(page.locator('#hc-step-label')).toHaveText(`Frage ${index + 1} von 8`);
    await check.getByRole('button', { name: label, exact: true }).click();
  }
  await expect(page.locator('#hc-result')).toBeVisible();
}

for (const path of ['/', '/check/']) {
  test(`health-check shows a result on ${path}`, async ({ page, pageErrors }) => {
    await page.goto(path);
    await answerAll(page);
    await expect(page.locator('#hc-step-label')).toHaveText('Ergebnis');
    await expect(page.locator('[data-hc-score]')).toHaveText('37', { timeout: 5000 });
    await expect(page.locator('[data-hc-grade]')).toHaveText('Kritisch');
    await expect(page.locator('[data-hc-levers] li')).toHaveCount(3);
    await expect(page.locator('[data-hc-rec-title]')).toHaveText('Full Package: Audit → Enablement');
    expect(pageErrors).toEqual([]);
  });
}

test('back button and restoring after reload', async ({ page }) => {
  await page.goto('/check/');
  const check = page.locator('[data-health-check]');
  await check.getByRole('button', { name: weakAnswers[0], exact: true }).click();
  await expect(page.locator('#hc-step-label')).toHaveText('Frage 2 von 8');
  await page.getByRole('button', { name: 'Zurück' }).click();
  await expect(page.locator('#hc-step-label')).toHaveText('Frage 1 von 8');
  await expect(check.getByRole('button', { name: weakAnswers[0], exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(page.locator('#hc-step-label')).toHaveText('Frage 2 von 8');
});

test('health-check lead: validates, solves proof-of-work and sends a whitelisted payload', async ({ page, pageErrors }) => {
  const mock = await mockLeadApi(page);
  await page.goto('/check/');
  await answerAll(page);

  const form = page.locator('#hc-lead');
  await form.getByRole('button', { name: 'Persönliche Auswertung anfordern' }).click();
  await expect(form.locator('[name="email"]')).toHaveAttribute('aria-invalid', 'true');
  await expect(form.locator('[data-error-for="consent"]')).toBeVisible();
  expect(mock.submissions).toHaveLength(0);

  await form.getByLabel('Name').fill('Erika Mustermann');
  await form.getByLabel('E-Mail').fill('erika@example.com');
  await form.getByLabel('Firma').fill('Muster GmbH');
  await form.getByRole('checkbox').check();
  await page.waitForTimeout(300);
  await form.getByRole('button', { name: 'Persönliche Auswertung anfordern' }).click();

  await expect(page.getByText('Danke, ist angekommen.')).toBeVisible();
  expect(mock.submissions).toHaveLength(1);
  const { body, contentType } = mock.submissions[0];
  expect(contentType).toContain('text/plain'); // CORS simple request, no preflight
  expect(body.kind).toBe('healthcheck');
  expect(body.website).toBe('');
  expect(body.consent).toBe(true);
  expect((body.pow as { number: number }).number).toBe(37);
  expect(body.healthCheck).toMatchObject({ score: 37, grade: 'kritisch', recommendation: 'fullpackage' });
  expect(Object.keys((body.healthCheck as { answers: object }).answers)).toHaveLength(8);
  expect(pageErrors).toEqual([]);
});

test('endpoint failure falls back to a pre-filled e-mail', async ({ page }) => {
  await mockLeadApi(page, () => ({ status: 500, json: {} }));
  await page.goto('/contact/');
  const form = page.locator('#contact-lead');
  await form.getByLabel('Name').fill('Max Muster');
  await form.getByLabel('E-Mail').fill('max@example.com');
  await form.getByLabel('Worum geht es?').fill('Wir möchten unsere Releases automatisieren.');
  await form.getByRole('checkbox').check();
  await form.getByRole('button', { name: 'Anfrage senden' }).click();

  const fallback = form.locator('[data-fallback-link]');
  await expect(fallback).toBeVisible();
  const href = (await fallback.getAttribute('href')) ?? '';
  expect(href.startsWith('mailto:hello@dynamics-tim.dev?subject=')).toBe(true);
  expect(decodeURIComponent(href)).toContain('Wir möchten unsere Releases automatisieren.');
});

test('expired challenge is retried once with a fresh one', async ({ page }) => {
  let calls = 0;
  const mock = await mockLeadApi(page, () => {
    calls += 1;
    return calls === 1 ? { status: 400, json: { ok: false, error: 'expired' } } : { status: 200, json: { ok: true } };
  });
  await page.goto('/contact/');
  const form = page.locator('#contact-lead');
  await form.getByLabel('Name').fill('Max Muster');
  await form.getByLabel('E-Mail').fill('max@example.com');
  await form.getByLabel('Worum geht es?').fill('Kurze Anfrage zu einem Audit.');
  await form.getByRole('checkbox').check();
  await form.getByRole('button', { name: 'Anfrage senden' }).click();
  await expect(page.getByText('Danke, ist angekommen.')).toBeVisible();
  expect(mock.submissions).toHaveLength(2);
});

test('recruiter switch sends kind "recruiter"', async ({ page }) => {
  const mock = await mockLeadApi(page);
  await page.goto('/');
  await page.locator('#recruiter').getByRole('link', { name: 'Projektanfrage senden' }).click();
  const form = page.locator('#contact-lead');
  await expect(form.locator('[data-kind-radio][value="recruiter"]')).toBeChecked();
  await expect(form.locator('[data-message-label]')).toHaveText('Eckdaten der Rolle');
  await form.getByLabel('Name').fill('Rita Recruiter');
  await form.getByLabel('E-Mail').fill('rita@agentur.example');
  await form.locator('[name="message"]').fill('Senior D365 Developer, 6 Monate, 80 % remote.');
  await form.getByRole('checkbox').check();
  await form.getByRole('button', { name: 'Anfrage senden' }).click();
  await expect(page.locator('#kontakt').getByText('Danke, ist angekommen.')).toBeVisible();
  expect(mock.submissions[0].body).toMatchObject({ kind: 'recruiter', role: 'recruiting' });
});
