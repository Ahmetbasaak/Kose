import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { E2E_PRO_KEY } from '../../playwright.config';

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => delete (window as { documentPictureInPicture?: unknown }).documentPictureInPicture);
});

test('finishing a session earns the first badge, starts a streak, fills the charts', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-24T10:00:00+03:00') });
  await page.clock.resume();
  await page.goto(`/?gelistirici=${E2E_PRO_KEY}`);
  await page.getByRole('button', { name: /Kronometre/ }).click();
  await page.clock.fastForward('45:00');
  await page.getByRole('button', { name: 'Bitir ve özeti gör' }).first().click();
  await page.waitForURL('**/ozet');

  await page.goto('/basarilar');
  await expect(page.locator('main')).toContainText('1 gün');
  const first = page.locator('li', { hasText: 'İlk adım' });
  await expect(first).toContainText('Kazanıldı');
  await expect(page.locator('main')).toContainText('2026 özeti');
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(violations.map((v) => v.id)).toEqual([]);

  await page.goto('/gecmis');
  const day = page.getByRole('listitem', { name: /24\.11: 0,8 saat/ });
  await expect(day).toHaveCount(1);
  await page.locator('figure rect[tabindex="0"]').first().focus();
  await expect(page.getByRole('tooltip')).toHaveText(/24\.11: 0,8 saat/);
  await expect(page.locator('figure').nth(1)).toContainText('Basit sayaç');
});

test('ambient sound can be switched on and off from the live page', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Kronometre/ }).click();
  await page.goto('/sayac');
  await page.getByLabel('Ortam sesi', { exact: true }).selectOption('rain');
  expect(await page.evaluate(() => (document.getElementById('ambient-kind') as HTMLSelectElement).value)).toBe('rain');
  await page.getByLabel('Ortam sesi', { exact: true }).selectOption('off');
});
