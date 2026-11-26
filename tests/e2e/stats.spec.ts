import { expect, test, type Page } from '@playwright/test';

const ALLOWED = ['device', 'display', 'event', 'lang', 'mode', 'path', 'seconds'];

async function capture(page: Page) {
  const sent: Record<string, unknown>[] = [];
  await page.route('**/api/e', async (route) => {
    sent.push(JSON.parse(route.request().postData() ?? '{}') as Record<string, unknown>);
    await route.fulfill({ status: 204 });
  });
  return sent;
}

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => delete (window as { documentPictureInPicture?: unknown }).documentPictureInPicture);
});

test('counts visits, starts and finishes with nothing personal in them', async ({ page }) => {
  const sent = await capture(page);
  await page.goto('/sayim?ad=Annemin%20do%C4%9Fum%20g%C3%BCn%C3%BC&t=1812574800');
  await expect.poll(() => sent.some((e) => e.path === '/sayim')).toBe(true);
  await page.goto('/');
  await page.getByLabel('Aylık net maaşın (₺)').fill('87.654');
  await page.getByRole('button', { name: 'Bugünkü kazancımı göster' }).click();
  await page.getByRole('button', { name: 'Bitir ve özeti gör' }).first().click();
  await page.waitForURL('**/ozet');
  await expect.poll(() => sent.map((e) => e.event)).toEqual(expect.arrayContaining(['visit', 'start', 'finish']));

  for (const e of sent) expect(Object.keys(e).sort()).toEqual(ALLOWED);
  const all = JSON.stringify(sent);
  expect(all).not.toMatch(/87[.,]?654/); // salary never leaves
  expect(all).not.toMatch(/Annem|do%C4%9F|doğum/); // shared link title (query string) never leaves
  expect(sent.find((e) => e.event === 'start')).toMatchObject({ mode: 'work' });
});

test('switching it off in Settings stops all counting', async ({ page }) => {
  const sent = await capture(page);
  await page.goto('/ayarlar');
  await page.getByLabel('Anonim kullanım istatistiği gönder').uncheck();
  const before = sent.length;
  await page.goto('/');
  await page.getByRole('button', { name: /Kronometre/ }).click();
  await page.waitForTimeout(300);
  expect(sent.length).toBe(before);
});

test('Global Privacy Control means nothing is sent', async ({ page, context }) => {
  await context.addInitScript(() => Object.defineProperty(navigator, 'globalPrivacyControl', { value: true }));
  const sent = await capture(page);
  await page.goto('/');
  await page.getByRole('button', { name: /Kronometre/ }).click();
  await page.waitForTimeout(300);
  expect(sent).toEqual([]);
});

test('owner stats page shows the report with the right key', async ({ page }) => {
  await page.route('**/api/stats?**', (route) =>
    route.request().headers().authorization === `Bearer ${encodeURIComponent('sırrım')}`
      ? route.fulfill({
          json: {
            byEvent: [
              { event: 'visit', mode: '', count: '120', seconds: '0' },
              { event: 'start', mode: 'work', count: '30', seconds: '0' },
              { event: 'finish', mode: 'work', count: '10', seconds: '36000' },
            ],
            daily: [
              { day: '2026-11-25 00:00:00', visits: '50' },
              { day: '2026-11-26 00:00:00', visits: '70' },
            ],
            paths: [{ path: '/', visits: '80' }],
            devices: [{ device: 'mobile', display: 'browser', visits: '60' }],
          },
        })
      : route.fulfill({ status: 401, json: { error: 'unauthorized' } }),
  );
  await page.goto('/istatistik');
  await page.getByLabel('Erişim anahtarı').fill('yanlış');
  await page.getByRole('button', { name: 'Göster' }).click();
  await expect(page.getByRole('alert')).toHaveText('Anahtar yanlış.');
  await page.getByLabel('Erişim anahtarı').fill('sırrım');
  await page.getByRole('button', { name: 'Göster' }).click();
  await expect(page.locator('main')).toContainText('120');
  await expect(page.locator('main')).toContainText('1 s 0 dk'); // 36000 s / 10 finishes
});
