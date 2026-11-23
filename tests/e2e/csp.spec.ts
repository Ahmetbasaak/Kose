import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

// The policy we deploy (public/_headers); vercel.json must carry the same value.
const csp = /Content-Security-Policy: (.+)/.exec(readFileSync('public/_headers', 'utf8'))![1]!;

test('vercel.json and _headers ship the same CSP', () => {
  const vercel = JSON.parse(readFileSync('vercel.json', 'utf8')) as {
    headers: { headers: { key: string; value: string }[] }[];
  };
  const values = vercel.headers.flatMap((h) => h.headers).filter((h) => h.key === 'Content-Security-Policy');
  expect(values.map((h) => h.value)).toEqual([csp]);
});

test('the app runs under the deployed CSP (PiP, share card, overlay)', async ({ page, context }) => {
  const violations: string[] = [];
  page.on('console', (m) => /Content Security Policy|Refused to/i.test(m.text()) && violations.push(m.text()));
  context.on('page', (p) => p.on('console', (m) => /Refused to/i.test(m.text()) && violations.push(m.text())));
  await context.route('**/*', async (route) => {
    const res = await route.fetch();
    const html = (res.headers()['content-type'] ?? '').includes('text/html');
    await route.fulfill({
      response: res,
      headers: html ? { ...res.headers(), 'content-security-policy': csp } : res.headers(),
    });
  });
  await page.goto('/mod/sayac');
  await page.getByLabel('İleri say (kronometre)').check();
  const [pip] = await Promise.all([
    context.waitForEvent('page'),
    page.getByRole('button', { name: 'Köşede başlat' }).click(),
  ]);
  // Copied stylesheets must apply inside the PiP window too.
  await expect(pip.locator('[data-variant=window]')).toHaveCSS('background-color', 'rgb(27, 27, 26)');
  await pip.getByRole('button', { name: 'Bitir ve özeti gör' }).click();
  await page.getByRole('button', { name: 'Paylaşılabilir kart' }).click();
  await page.getByRole('img', { name: /Kart önizlemesi/ }).waitFor();
  await page.goto('/fiyat');
  await page.goto('/overlay?sure=5');
  await expect(page.getByRole('timer')).toBeVisible();
  expect(violations).toEqual([]);
});
