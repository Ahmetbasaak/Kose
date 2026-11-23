import { describe, expect, it } from 'vitest';
import { amountFor, manualEntry, totalsBy, weekRows, type TimeEntry } from '../src/engine/freelance';
import { sectionState } from '../src/engine/sections';

const MIN = 60_000;

describe('sectionState', () => {
  const secs = [2 * MIN, 10 * MIN, 3 * MIN];
  it('green, then yellow in the last quarter, per section', () => {
    expect(sectionState(0, secs)).toMatchObject({ index: 0, level: 'green', remainingMs: 2 * MIN });
    expect(sectionState(1.5 * MIN, secs)).toMatchObject({ index: 0, level: 'yellow' }); // last minute of a 2-min section
    expect(sectionState(2 * MIN, secs)).toMatchObject({ index: 1, level: 'green', boundaries: 1 });
    expect(sectionState(9 * MIN, secs).level).toBe('green');
    expect(sectionState(9.6 * MIN, secs).level).toBe('yellow'); // 2.4 min left of 10 = last quarter
  });
  it('red overtime after the last section, counting up', () => {
    expect(sectionState(16 * MIN, secs)).toEqual({
      index: 3,
      remainingMs: 0,
      overtimeMs: MIN,
      level: 'red',
      boundaries: 3,
    });
  });
});

describe('freelance week', () => {
  const tr = (d: number, h: number) => Date.UTC(2026, 10, d, h - 3); // Nov 2026, Turkey time
  const weekStart = tr(23, 0); // Monday
  const e = (id: string, projectId: string, d: number, h: number, ms: number): TimeEntry => ({
    id,
    projectId,
    startedAt: tr(d, h),
    endedAt: tr(d, h) + ms,
    elapsedMs: ms,
  });
  const entries = [
    e('1', 'web', 23, 9, 60 * MIN),
    e('2', 'web', 23, 14, 30 * MIN),
    e('3', 'logo', 24, 10, 45 * MIN),
    e('4', 'web', 22, 23, 600 * MIN), // Sunday before: other week
    e('5', 'web', 29, 23, 120 * MIN), // Sunday 23:00 inside, runs past midnight: counts on Sunday
  ];
  it('groups by day and project inside the week only', () => {
    const rows = weekRows(entries, weekStart);
    expect(rows.map((r) => [r.projectId, r.ms / MIN])).toEqual([
      ['web', 90],
      ['logo', 45],
      ['web', 120],
    ]);
  });
  it('totals per client', () => {
    const client = (p: string) => (p === 'web' ? 'A' : 'B');
    expect(Object.fromEntries(totalsBy(weekRows(entries, weekStart), client))).toEqual({ A: 210 * MIN, B: 45 * MIN });
  });
});

describe('manual time entry', () => {
  it('builds an entry from date and Turkey-time start/end', () => {
    const e = manualEntry('2026-11-24', '09:30', '12:00')!;
    expect(new Date(e.startedAt).toISOString()).toBe('2026-11-24T06:30:00.000Z');
    expect(e.elapsedMs).toBe(150 * MIN);
  });
  it('an end before the start runs past midnight', () => {
    expect(manualEntry('2026-11-24', '22:00', '01:30')!.elapsedMs).toBe(210 * MIN);
  });
  it('rejects bad input', () => {
    expect(manualEntry('2026-02-30', '09:00', '10:00')).toBeNull();
    expect(manualEntry('2026-11-24', '9', '10:00')).toBeNull();
    expect(manualEntry('2026-11-24', '10:00', '10:00')).toBeNull();
  });
  it('bills hours × rate, nothing without a rate', () => {
    expect(amountFor(90 * MIN, 600)).toBe(900);
    expect(amountFor(90 * MIN, null)).toBeNull();
  });
});
