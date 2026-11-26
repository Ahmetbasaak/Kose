import { readFileSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { E2E_PRO_KEY } from '../../playwright.config';

test.beforeEach(async ({ page, context }) => {
  await context.addInitScript(() => delete (window as { documentPictureInPicture?: unknown }).documentPictureInPicture);
  await page.goto(`/?gelistirici=${E2E_PRO_KEY}`);
});

const axe = async (page: import('@playwright/test').Page) =>
  (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations.map(
    (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`,
  );

for (const theme of ['Açık', 'Koyu', 'Retro'])
  test(`app theme "${theme}" applies everywhere and stays accessible`, async ({ page }) => {
    await page.goto('/ayarlar');
    await page.getByRole('radio', { name: theme }).check();
    const attr = await page.evaluate(() => document.documentElement.dataset.theme);
    expect(attr).toBe({ Açık: 'light', Koyu: 'dark', Retro: 'retro' }[theme]);
    expect(await axe(page)).toEqual([]);
    await page.goto('/mod/mesai');
    expect(await axe(page)).toEqual([]);
    await page.reload(); // persisted
    expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe(attr);
  });

test('freelance: start, pause, stop, manual entry, amounts, delete', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-24T10:00:00+03:00') });
  await page.clock.resume();
  await page.goto('/mod/serbest');
  await page.getByLabel('Proje adı').fill('Web sitesi');
  await page.getByLabel('Müşteri', { exact: true }).fill('Müşteri A');
  await page.getByLabel('Saat ücreti (₺, isteğe bağlı)').fill('600');
  await page.getByRole('button', { name: 'Proje ekle' }).click();

  await page.getByRole('button', { name: 'Başlat: Web sitesi' }).click();
  await page.clock.fastForward('30:00');
  await page.getByRole('button', { name: 'Duraklat: Web sitesi' }).click();
  await page.clock.fastForward('20:00'); // paused time must not count
  await page.getByRole('button', { name: 'Devam et: Web sitesi' }).click();
  await page.clock.fastForward('30:00');
  await page.getByRole('button', { name: 'Durdur: Web sitesi' }).click();

  await page.getByLabel('Tarih').fill('2026-11-24');
  await page.getByLabel('Başlangıç').fill('14:00');
  await page.getByLabel('Bitiş').fill('15:30');
  await page.getByLabel('Not (isteğe bağlı)').fill('Logo revizyonu');
  await page.getByRole('button', { name: 'Kaydı ekle' }).click();

  const report = page.locator('section[aria-labelledby=fl-week]');
  await expect(report).toContainText('Toplam: 2 s 30 dk'); // 60 min live + 90 min manual
  // 2.5 h × 600 ₺; real clicks add a few seconds of live time.
  await expect(report).toContainText(/Toplam tutar: 1\.500,0\d ₺/);
  await expect(report).toContainText('Logo revizyonu');
  expect(await axe(page)).toEqual([]);

  await page.getByRole('button', { name: /Kaydı sil: Web sitesi 14:00/ }).click();
  await expect(report).toContainText('Toplam: 1 s 0 dk');
});

test('backup: download, then restore it; a foreign file is rejected', async ({ page }) => {
  await page.goto('/mod/geri-sayim');
  await page.getByRole('button', { name: 'Ekle' }).click(); // weekend countdown
  await page.goto('/ayarlar');
  const [dl] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Yedeği indir' }).click(),
  ]);
  const path = await dl.path();
  const backup = JSON.parse(readFileSync(path, 'utf8')) as { localStorage: Record<string, string> };
  expect(Object.keys(backup.localStorage)).toContain('kose.countdowns');
  expect(Object.keys(backup.localStorage)).not.toContain('kose.pro');

  await page.evaluate(() => localStorage.removeItem('kose.countdowns'));
  page.once('dialog', (d) => void d.accept());
  await page.getByLabel('Yedekten geri yükle').setInputFiles(path);
  // Restore reloads the page; poll so the read never races the reload.
  await expect.poll(() => page.evaluate(() => localStorage.getItem('kose.countdowns'))).toContain('Hafta sonu');

  await page.getByLabel('Yedekten geri yükle').setInputFiles({
    name: 'x.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"app":"other"}'),
  });
  await expect(page.getByRole('alert')).toContainText('geçerli bir Timekeepera yedeği değil');
});
