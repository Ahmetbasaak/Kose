import { expect, test } from '@playwright/test';
import { E2E_PRO_KEY } from '../../playwright.config';

test('work day: background earnings, milestone cheer, automatic day summary, coffee comparison', async ({
  page,
  context,
}) => {
  await context.addInitScript(() => delete (window as { documentPictureInPicture?: unknown }).documentPictureInPicture);
  await page.clock.install({ time: new Date('2026-11-23T10:59:00+03:00') }); // Monday
  await page.clock.resume();
  await page.goto(`/?gelistirici=${E2E_PRO_KEY}`); // history is Pro
  await page.goto('/ayarlar');
  await page.getByLabel('Kahve (₺)').fill('90');
  await page.goto('/mod/mesai');
  await page.getByLabel('Aylık net maaş (₺)').fill('45.000');
  await page.getByLabel('Mesai kazancını arka planda da say').check();
  await page.getByRole('button', { name: 'Köşede başlat' }).click();

  await page.clock.fastForward('02:00'); // 11:01 → 2 h of 8 worked
  await expect(page.getByRole('status').filter({ hasText: 'Günün çeyreği tamam.' })).toBeVisible();

  await page.goto('/sayac');
  await expect(page.locator('main')).toContainText(/≈ \d+ kahve/);
  await expect(page.locator('main')).toContainText('Bu hafta ≈');

  // Another timer in front: today's earnings stay visible in the corner.
  page.once('dialog', (d) => void d.accept());
  await page.goto('/');
  await page.getByRole('button', { name: /Kronometre/ }).click();
  await expect(page.locator('[data-variant=floating]')).toContainText(/Bugün ≈ [\d.]+,\d\d ₺/);

  await page.clock.fastForward('07:00:00'); // 18:01: shift over
  await expect(page.getByRole('status').filter({ hasText: 'Bugünün özeti geçmişe kaydedildi' })).toBeVisible();
  await page.goto('/gecmis');
  await expect(page.locator('table')).toContainText('Mesai ve kazanç');
  await expect(page.locator('table')).toContainText('2.045,45 ₺');
});
