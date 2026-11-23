import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { E2E_PRO_KEY } from '../../playwright.config';

const PAGES = [
  '/',
  '/mod/sayac',
  '/mod/mesai',
  '/mod/geri-sayim',
  '/mod/toplanti',
  '/mod/mola',
  '/mod/ogrenci',
  '/mod/serbest',
  '/mod/sunum',
  '/mod/coklu',
  '/sayac',
  '/ozet',
  '/gecmis',
  '/ayarlar',
  '/sayim?ad=S%C4%B1nav&t=1812574800',
  '/mod/yayin',
  '/basarilar',
  '/fiyat',
  '/gizlilik',
  '/bilinmeyen-sayfa',
];

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`axe (${scheme})`, () => {
    test.use({ colorScheme: scheme });
    test.beforeEach(async ({ page }) => {
      await page.goto(`/?gelistirici=${E2E_PRO_KEY}`);
    });
    for (const path of PAGES)
      test(path, async ({ page }) => {
        await page.goto(path);
        await page.locator('h1').first().waitFor();
        const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
        expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
      });
  });
}

test.describe('axe with live UI', () => {
  test.use({ viewport: { width: 1280, height: 900 } });
  for (const scheme of ['light', 'dark'] as const)
    test(`corner widget, alert, share card (${scheme})`, async ({ page, context }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await context.addInitScript(
        () => delete (window as { documentPictureInPicture?: unknown }).documentPictureInPicture,
      );
      await page.goto('/mod/sayac');
      await page.getByLabel('Dakika').fill('0');
      await page.getByLabel('Saniye').fill('1');
      await page.getByRole('button', { name: 'Köşede başlat' }).click();
      await expect(page.getByRole('alert')).toBeVisible({ timeout: 5000 });
      const scan = async () =>
        (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations.map(
          (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`,
        );
      expect(await scan()).toEqual([]);
      await page.getByRole('button', { name: 'Bitir ve özeti gör' }).click();
      await page.getByRole('button', { name: 'Paylaşılabilir kart' }).click();
      await page.getByRole('img', { name: /Kart önizlemesi/ }).waitFor();
      expect(await scan()).toEqual([]);
    });

  test('corner themes keep contrast', async ({ page }) => {
    await page.goto(`/?gelistirici=${E2E_PRO_KEY}`);
    await page.goto('/ayarlar');
    for (const theme of ['lcd', 'neon', 'paper', 'minimal']) {
      await page.getByLabel('Tema').selectOption(theme);
      const { violations } = await new AxeBuilder({ page })
        .include('[data-variant=preview]')
        .withTags(['wcag2aa'])
        .analyze();
      expect(violations.map((v) => `${theme} ${v.id}`)).toEqual([]);
    }
  });

  test('phone tab bar', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const tabs = page.getByRole('navigation', { name: 'Ana menü' });
    await expect(tabs.getByRole('link')).toHaveText(['Ana sayfa', 'Sayaç', 'Geçmiş', 'Ayarlar']);
    for (const box of await tabs
      .getByRole('link')
      .evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height)))
      expect(box).toBeGreaterThanOrEqual(44);
    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(violations).toEqual([]);
  });
});

test('pricing without Pro: license form, failed activation, accessible', async ({ page }) => {
  await page.goto('/fiyat');
  await page.getByRole('textbox', { name: 'Lisans anahtarı' }).fill('ABCD-1234-EFGH');
  await page.getByRole('button', { name: 'Etkinleştir' }).click();
  await expect(page.getByRole('alert')).toHaveText('Lisans etkinleştirme henüz açık değil.');
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(violations.map((v) => v.id)).toEqual([]);
  await page.screenshot({ path: 'test-results/pricing.png', fullPage: true });
});
