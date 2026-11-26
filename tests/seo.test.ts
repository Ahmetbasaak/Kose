import { describe, expect, it } from 'vitest';
import { allSeoPages, countdownMeta, countdownPage, daysLeft, nextOccurrence } from '../src/seo/pages';

const NOW = Date.UTC(2026, 10, 26, 9); // 26 Nov 2026, 12:00 Turkey time

describe('SEO pages', () => {
  it('Kurban Bayramı page points at the next calculated date', () => {
    const p = countdownPage('kurban-bayrami')!;
    const o = nextOccurrence(p, NOW)!;
    expect(new Date(o.at + 3 * 3_600_000).toISOString().slice(0, 10)).toBe('2027-05-16');
    const m = countdownMeta(p, NOW);
    expect(m.title).toContain("Kurban Bayramı'na kaç gün kaldı? (2027)");
    expect(m.intro).toContain('16 Mayıs 2027 Pazar');
    expect(m.intro).not.toMatch(/\d+ gün var/); // no count that would go stale in static HTML
    expect(daysLeft(o.at, NOW)).toBe(171);
  });

  it('every page has a unique path, a title and a description', () => {
    const pages = allSeoPages(NOW);
    expect(new Set(pages.map((p) => p.path)).size).toBe(pages.length);
    for (const p of pages) {
      expect(p.title.length).toBeGreaterThan(10);
      expect(p.description.length).toBeGreaterThan(50);
      expect(p.path).toMatch(/^\/[a-z0-9/-]+$/);
    }
  });
});
