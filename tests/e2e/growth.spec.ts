import { expect, test } from '@playwright/test';

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => delete (window as { documentPictureInPicture?: unknown }).documentPictureInPicture);
});

test('hero: one salary field starts live earnings', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-23T14:30:00+03:00') }); // Monday
  await page.clock.resume();
  await page.goto('/');
  await expect(page.locator('h1')).toHaveText('Zamanın kaç para ediyor?');
  await page.getByRole('button', { name: 'Bugünkü kazancımı göster' }).click();
  await expect(page.getByRole('alert')).toContainText('Geçerli bir maaş');
  await page.getByLabel('Aylık net maaşın (₺)').fill('45.000');
  await page.getByRole('button', { name: 'Bugünkü kazancımı göster' }).click();
  // 09:00–14:30 minus a 60 min lunch from 12:30 = 4.5 h × 45000/176
  await expect(page.locator('[data-variant=floating]')).toContainText(/1\.150,\d\d ₺/);
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Mesaiyi başlat' }).first()).toBeVisible();
});

test('search pages ship real HTML before any JavaScript runs', async ({ request }) => {
  const html = await (await request.get('/kac-gun-kaldi/kurban-bayrami')).text();
  expect(html).toMatch(/<title>Kurban Bayramı&#39;na kaç gün kaldı\? \(\d{4}\) – Timekeepera<\/title>/);
  expect(html).toContain('<h1>Kurban Bayramı&#39;na kaç gün kaldı?</h1>');
  expect(html).toMatch(/<meta name="description" content="Kurban Bayramı .*günü\./);
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toContain('User-agent: *');
});

test('countdown landing page counts live and adds to the list', async ({ page }) => {
  await page.goto('/kac-gun-kaldi/kurban-bayrami');
  await expect(page.getByRole('timer')).toHaveText(/\d+ g \d\d:\d\d:\d\d/);
  await page.getByRole('button', { name: 'Listeme ekle' }).click();
  await page.getByRole('link', { name: 'Geri sayımlarım' }).click();
  await expect(page.locator('#cd-list-title + ul')).toContainText('Kurban Bayramı');
});

test('calculators answer instantly', async ({ page }) => {
  await page.goto('/hesapla/toplanti-maliyeti');
  await page.getByLabel('Ortalama aylık net maaş (₺)').fill('45.000');
  // 6 people × 60 min × 45000/176
  await expect(page.locator('main')).toContainText('1.534,09 ₺');
  await page.goto('/hesapla/saatlik-ucret');
  await page.getByLabel('Aylık net maaş (₺)').fill('45.000');
  await expect(page.locator('main')).toContainText('255,68 ₺');
});
