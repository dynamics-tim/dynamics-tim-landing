import { expect, test } from './fixtures';

const pages = ['/', '/services/', '/profile/', '/check/', '/contact/', '/datenschutz/', '/impressum/'];

for (const path of pages) {
  test(`${path} renders without errors and with a single h1`, async ({ page, pageErrors }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);
    expect(pageErrors).toEqual([]);
  });
}

test('CSP allows only the n8n lead origin and no third-party push services', async ({ page }) => {
  await page.goto('/');
  const csp = (await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content')) ?? '';
  expect(csp).toContain('connect-src');
  expect(csp).toContain('https://n8n.dynamics-tim.dev');
  expect(csp).toContain("object-src 'none'");
  expect(csp).not.toContain('pushover');
  expect(await page.content()).not.toMatch(/pushover/i);
});

test('pitch video is muted, inline and has a transcript', async ({ page }) => {
  await page.goto('/');
  const video = page.locator('[data-pitch-video] video');
  await expect(video).toHaveAttribute('muted', '');
  await expect(video).toHaveAttribute('playsinline', '');
  await expect(video).toHaveAttribute('aria-describedby', 'pitch-transcript');
  await page.getByText('Transkript').click();
  await expect(page.locator('#pitch-transcript li').first()).toBeVisible();
});

test('pitch video does not autoplay with reduced motion', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.route('https://n8n.dynamics-tim.dev/**', (route) => route.abort());
  await page.goto('/');
  await page.waitForTimeout(800);
  expect(await page.locator('[data-pitch-video] video').evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
  await expect(page.locator('[data-play-overlay]')).toHaveAttribute('data-hidden', 'false');
  await context.close();
});

test('mobile navigation opens, closes with Escape and keeps focus', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const toggle = page.locator('[data-menu-toggle]');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#mobile-nav')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(toggle).toBeFocused();
});

test('text can be selected (no global user-select lock)', async ({ page }) => {
  await page.goto('/');
  const userSelect = await page.locator('h1').evaluate((el) => getComputedStyle(el).userSelect);
  expect(userSelect).not.toBe('none');
});

test('select option lists stay readable in dark and light forms', async ({ page }) => {
  const optionColors = (selector: string) =>
    page.locator(selector).evaluate((select: HTMLSelectElement) => {
      const option = getComputedStyle(select.options[1]);
      return { scheme: getComputedStyle(select).colorScheme, bg: option.backgroundColor, fg: option.color };
    });

  await page.goto('/contact/');
  expect(await optionColors('#contact-lead-role')).toEqual({
    scheme: 'dark',
    bg: 'rgb(14, 17, 12)', // ink-900
    fg: 'rgb(244, 245, 240)', // paper
  });

  await page.goto('/check/');
  expect(await optionColors('#hc-lead-role')).toEqual({
    scheme: 'light',
    bg: 'rgb(250, 251, 247)', // paper-50
    fg: 'rgb(7, 9, 6)', // ink-950
  });
});
