import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.use({ locale: 'en-US', reducedMotion: 'reduce' }); // axe checks the settled page, not mid-entrance cards

test('English browser gets the English UI; language can be switched', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-23T14:30:00+03:00')); // Monday
  await page.goto('/');
  await expect(page.locator('h1')).toHaveText('What is your time worth?');
  await expect(page.getByRole('link', { name: /Timekeepera – Home/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.lang)).toBe('en');
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(violations.map((v) => v.id)).toEqual([]);

  await page.goto('/mod/mesai');
  await page.getByLabel('Monthly net salary (₺)').fill('45,000');
  await expect(page.locator('[data-variant=preview]')).toContainText('1,150.57 ₺');

  await page.goto('/ayarlar');
  await page.getByRole('combobox', { name: 'Language / Dil' }).selectOption('tr');
  await expect(page.locator('h1')).toHaveText('Ayarlar');
  await page.goto('/');
  await expect(page.locator('h1')).toHaveText('Zamanın kaç para ediyor?');
});
