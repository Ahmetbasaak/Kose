import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { E2E_PRO_KEY } from '../../playwright.config';

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => delete (window as { documentPictureInPicture?: unknown }).documentPictureInPicture);
});

test('countdown shows working days and exports a calendar file', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-23T10:00:00+03:00') }); // Monday
  await page.clock.resume();
  await page.goto('/mod/geri-sayim');
  await page.getByLabel('Ne için?').selectOption('payday');
  await page.getByLabel('Ayın kaçında?').fill('30');
  await page.getByRole('button', { name: 'Ekle' }).click();
  await expect(page.locator('li', { hasText: 'Maaş günü' })).toContainText('5 iş günü'); // Tue–Fri + Mon 30th
  const [dl] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Takvime ekle' }).click(),
  ]);
  const ics = readFileSync((await dl.path())!, 'utf8');
  expect(ics).toContain('RRULE:FREQ=MONTHLY;BYMONTHDAY=30');
  expect(ics).toContain('SUMMARY:Maaş günü');
});

test('freelance report: rounding, non-billable project, month view, client filter', async ({ page }) => {
  await page.goto(`/?gelistirici=${E2E_PRO_KEY}`);
  await page.goto('/mod/serbest');
  const add = async (name: string, client: string, rate: string) => {
    await page.getByLabel('Proje adı').fill(name);
    await page.getByLabel('Müşteri', { exact: true }).fill(client);
    await page.getByLabel('Saat ücreti (₺, isteğe bağlı)').fill(rate);
    await page.getByRole('button', { name: 'Proje ekle' }).click();
  };
  await add('Web', 'A', '600');
  await add('İç iş', 'B', '600');
  const entry = async (project: string, start: string, end: string) => {
    await page.getByLabel('Proje', { exact: true }).selectOption({ label: project });
    await page.getByLabel('Tarih').fill(new Date().toISOString().slice(0, 10));
    await page.getByLabel('Başlangıç').fill(start);
    await page.getByLabel('Bitiş').fill(end);
    await page.getByRole('button', { name: 'Kaydı ekle' }).click();
  };
  await entry('Web · A', '09:00', '10:07'); // 67 min
  await entry('İç iş · B', '11:00', '12:00');
  await page.locator('li', { hasText: 'İç iş' }).getByLabel('Faturalanır').uncheck();

  const report = page.locator('section[aria-labelledby=fl-week]');
  await page.getByLabel('Yuvarlama').selectOption('15');
  await expect(report).toContainText('Toplam: 2 s 15 dk'); // 75 + 60
  await expect(report).toContainText('Toplam tutar: 750,00 ₺'); // only Web: 1.25 h × 600

  await page.getByLabel('Ay', { exact: true }).check();
  await expect(report.locator('h2')).toContainText(/2026|2027/);
  await page.getByLabel('Rapordaki müşteri').selectOption({ label: 'B' });
  await expect(report).toContainText('Toplam: 1 s 0 dk');
});
