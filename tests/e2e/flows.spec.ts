import { expect, test } from '@playwright/test';

test.beforeEach(async ({ context }) => {
  // Exercise the in-page fallback; headless PiP windows are covered by manual checks.
  await context.addInitScript(() => delete (window as { documentPictureInPicture?: unknown }).documentPictureInPicture);
});

test('countdown survives a reload, alerts once, and summarises', async ({ page }) => {
  await page.goto('/mod/sayac');
  await page.getByLabel('Dakika').fill('0');
  await page.getByLabel('Saniye').fill('2');
  await page.getByLabel('Ad (isteğe bağlı)').fill('Çay');
  await page.getByRole('button', { name: 'Köşede başlat' }).click();
  await expect(page.getByRole('timer')).toHaveText(/00:0[12]/);
  await page.reload();
  await expect(page.getByRole('alert')).toContainText('Çay tamamlandı', { timeout: 5000 });
  await expect(page.getByRole('timer')).toHaveText('00:00');
  await page.getByRole('button', { name: 'Bitir ve özeti gör' }).click();
  await expect(page).toHaveURL(/\/ozet$/);
  await expect(page.locator('main')).toContainText('0 dk 2 sn');
});

test('work mode earns in Turkey time, whatever the device time zone', async ({ browser }) => {
  const context = await browser.newContext({ timezoneId: 'America/New_York' });
  const page = await context.newPage();
  await page.clock.setFixedTime(new Date('2026-11-23T14:30:00+03:00')); // Monday
  await page.goto('/mod/mesai');
  await page.getByLabel('Aylık net maaş (₺)').fill('45.000');
  // 4.5 h × 45000 / (22 × 8)
  await expect(page.locator('[data-variant=preview]')).toContainText('1.150,57 ₺');
  await context.close();
});

test('keyboard only: reach and start a mode', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  // First stop is the skip link.
  expect(await page.evaluate(() => document.activeElement?.textContent)).toBe('İçeriğe geç');
  await page.getByRole('link', { name: /Basit sayaç/ }).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/mod\/sayac$/);
  await page.getByRole('button', { name: 'Köşede başlat' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('timer')).toBeVisible();
});

test('works offline after the first visit', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload(); // let the service worker control the page
  await context.setOffline(true);
  await page.goto('/mod/mesai');
  await expect(page.locator('h1')).toHaveText('Mesai ve kazanç');
  await context.setOffline(false);
});
