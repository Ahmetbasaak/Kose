import { expect, test } from '@playwright/test';

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => delete (window as { documentPictureInPicture?: unknown }).documentPictureInPicture);
});

test('quick start: one tap starts a stopwatch; home shows the running timer', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Kronometre/ }).click();
  await page.goto('/');
  const card = page.locator('section[aria-labelledby=home-active]');
  await expect(card).toContainText('Devam eden sayaç');
  await card.getByRole('button', { name: 'Duraklat' }).click();
  await expect(card).toContainText('Duraklatıldı');
});

test('quick start without saved settings sends to setup first', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /Mesaiyi başlat/ }).click();
  await expect(page).toHaveURL(/\/mod\/mesai$/);
});

test('phone: mini bar above the tabs instead of the floating window', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: /Kronometre/ }).click();
  await page.goto('/mod/mesai');
  await expect(page.getByRole('link', { name: /Sayacı aç/ })).toBeVisible();
  await expect(page.locator('[data-variant=floating]')).toBeHidden();
  await page.getByRole('link', { name: /Sayacı aç/ }).click();
  await expect(page).toHaveURL(/\/sayac$/);
});

test('OBS link builder produces a working overlay link', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/mod/yayin');
  await page.getByRole('spinbutton', { name: 'Dakika' }).fill('5');
  await page.getByLabel('Üst başlık (isteğe bağlı)').fill('Mola');
  await page.getByRole('button', { name: 'Linki kopyala' }).click();
  const url = await page.evaluate(() => navigator.clipboard.readText());
  expect(url).toMatch(/\/overlay\?sure=5&ad=Mola&renk=ffffff&boyut=120$/);
  await page.goto(url);
  await expect(page.getByRole('timer')).toHaveText(/0[45]:\d\d/);
});
