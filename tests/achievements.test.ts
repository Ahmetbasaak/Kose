import { describe, expect, it } from 'vitest';
import { badges, longestStreak, yearStats } from '../src/share/achievements';
import type { SessionSummary } from '../src/storage/session';

const H = 3_600_000;
const tr = (y: number, m: number, d: number, h: number) => Date.UTC(y, m - 1, d, h - 3);
const rec = (p: Partial<SessionSummary>): SessionSummary => ({
  modeId: 'simple',
  kind: 'stopwatch',
  label: 'x',
  elapsedMs: H,
  startedAt: tr(2026, 11, 24, 10),
  endedAt: tr(2026, 11, 24, 11),
  ...p,
});

describe('longestStreak', () => {
  it('finds the longest consecutive run, ignoring order and duplicates', () => {
    expect(longestStreak([5, 1, 2, 3, 3, 7, 8])).toBe(3);
    expect(longestStreak([])).toBe(0);
  });
});

describe('badges', () => {
  it('nothing earned on an empty history', () => {
    expect(badges([], []).filter((b) => b.earned)).toEqual([]);
  });
  it('earns and reports progress', () => {
    const list = badges(
      [
        rec({ elapsedMs: 4 * H }),
        rec({ modeId: 'meeting' }),
        rec({ startedAt: tr(2026, 11, 24, 6), endedAt: tr(2026, 11, 24, 7) }), // before 07:00
        rec({ startedAt: tr(2026, 11, 28, 10) }), // Saturday
      ],
      [10, 11, 12],
    );
    const get = (id: string) => list.find((b) => b.id === id)!;
    expect(['first', 'meeting', 'earlyBird', 'weekend', 'streak3'].every((id) => get(id).earned)).toBe(true);
    expect(get('nightOwl').earned).toBe(false);
    expect(get('focus10').progress).toBeCloseTo(0.6, 5); // 4 + 1 + 1 h of focus modes (meeting excluded)
    expect(get('streak7').progress).toBeCloseTo(3 / 7, 5);
  });
});

describe('yearStats', () => {
  it('summarises one Turkey-time year', () => {
    const s = yearStats(
      [
        rec({ modeId: 'work', elapsedMs: 8 * H, endedAt: tr(2026, 3, 2, 18) }),
        rec({ modeId: 'student', elapsedMs: 2 * H, focusMs: 1.5 * H, endedAt: tr(2026, 3, 3, 12) }),
        rec({ endedAt: tr(2025, 12, 31, 23) }), // other year
        rec({ endedAt: Date.UTC(2026, 11, 31, 22) }), // 01:00 on 1 Jan 2027 in Turkey: next year
      ],
      2026,
    );
    expect(s).toMatchObject({
      sessions: 2,
      totalMs: 10 * H,
      focusMs: 9.5 * H,
      topMode: 'work',
      topMonth: 3,
      longestStreak: 2,
    });
  });
});
