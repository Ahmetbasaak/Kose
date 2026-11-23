import { describe, expect, it } from 'vitest';
import { holidaysBetween, upcomingHolidays } from '../src/data/holidays';
import { trMidnight } from '../src/engine/calendar';

const iso = (ms: number) => new Date(ms + 3 * 3_600_000).toISOString().slice(0, 10);
const year = (y: number) => holidaysBetween(trMidnight(y, 1, 1), trMidnight(y + 1, 1, 1));

describe('computed Turkish holidays', () => {
  it('bayrams match the dates Diyanet announced for 2023–2027', () => {
    const announced: Record<number, [string, string]> = {
      2023: ['2023-04-21', '2023-06-28'],
      2024: ['2024-04-10', '2024-06-16'],
      2025: ['2025-03-30', '2025-06-06'],
      2026: ['2026-03-20', '2026-05-27'],
      2027: ['2027-03-09', '2027-05-16'],
    };
    for (const [y, [ramazan, kurban]] of Object.entries(announced)) {
      const list = year(Number(y));
      expect(iso(list.find((h) => h.id === `ramazan-${y}`)!.at)).toBe(ramazan);
      expect(iso(list.find((h) => h.id === `kurban-${y}`)!.at)).toBe(kurban);
    }
  });

  it('covers every fixed holiday in any future year', () => {
    const ids = year(2041)
      .filter((h) => h.source === 'law')
      .map((h) => h.id);
    expect(ids).toEqual([
      'yilbasi-2041',
      '23-nisan-2041',
      '1-mayis-2041',
      '19-mayis-2041',
      '15-temmuz-2041',
      '30-agustos-2041',
      '29-ekim-2041',
    ]);
  });

  it('finds both Ramazan Bayramı of 2033 (it falls twice that year)', () => {
    expect(year(2033).filter((h) => h.name === 'Ramazan Bayramı')).toHaveLength(2);
  });

  it('bayram lengths: Ramazan 3 days, Kurban 4 days', () => {
    const l = year(2030);
    expect(l.find((h) => h.name === 'Ramazan Bayramı')!.days).toBe(3);
    expect(l.find((h) => h.name === 'Kurban Bayramı')!.days).toBe(4);
  });

  it('an official override replaces the calculated date', () => {
    const l = holidaysBetween(trMidnight(2031, 1, 1), trMidnight(2032, 1, 1), [
      { id: 'kurban-2031', start: '2031-03-29' },
    ]);
    const k = l.find((h) => h.id === 'kurban-2031')!;
    expect([iso(k.at), k.source]).toEqual(['2031-03-29', 'official']);
  });

  it('keeps an ongoing bayram in the upcoming list until it ends', () => {
    const midRamazan = trMidnight(2027, 3, 10) + 12 * 3_600_000;
    expect(upcomingHolidays(midRamazan)[0]!.id).toBe('ramazan-2027');
  });
});
