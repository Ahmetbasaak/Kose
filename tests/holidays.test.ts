import { describe, expect, it } from 'vitest';
import { holidays, upcomingHolidays } from '../src/data/holidays';

describe('holidays data', () => {
  it('parses every entry and has unique ids', () => {
    expect(holidays.length).toBeGreaterThan(0);
    expect(new Set(holidays.map((h) => h.id)).size).toBe(holidays.length);
    for (const h of holidays) expect(h.days).toBeGreaterThan(0);
  });

  it('keeps an ongoing holiday in the upcoming list until it ends', () => {
    const ramazan = holidays.find((h) => h.id === 'ramazan-2027')!;
    const midHoliday = ramazan.at + 36 * 3_600_000;
    expect(upcomingHolidays(midHoliday)[0]!.id).toBe('ramazan-2027');
  });
});
