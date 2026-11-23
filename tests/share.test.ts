import { describe, expect, it } from 'vitest';
import { trWeekStart } from '../src/engine/calendar';
import { cardContent, unitAvailable, weeklyStats } from '../src/share/content';
import type { SessionSummary } from '../src/storage/session';

const H = 3_600_000;
const work: SessionSummary = {
  modeId: 'work',
  kind: 'work',
  label: 'Mesai ve kazanç',
  elapsedMs: 4 * H,
  earned: 1150.47,
  totalMs: 8 * H,
  startedAt: 0,
  endedAt: 0,
};
const simple: SessionSummary = {
  modeId: 'simple',
  kind: 'stopwatch',
  label: 'Sayaç',
  elapsedMs: H / 2,
  startedAt: 0,
  endedAt: 0,
};

const text = (c: ReturnType<typeof cardContent>) => [c.kicker, c.big, ...c.lines].join(' ');

describe('cardContent privacy', () => {
  it('hidden (default) never contains an amount', () => {
    const c = text(cardContent(work, 'hidden', 90));
    expect(c).not.toMatch(/1\.150|₺|kahve/);
    expect(c).toContain('4 s 0 dk');
  });

  it('percent shows share of the work day, not money', () => {
    const c = cardContent(work, 'percent', null);
    expect(c.big).toBe('%50');
    expect(text(c)).not.toMatch(/₺/);
  });

  it('coffee needs a price; without one it falls back to hidden', () => {
    expect(cardContent(work, 'coffee', 90).big).toBe('12 kahve');
    expect(text(cardContent(work, 'coffee', null))).not.toMatch(/kahve|₺/);
  });

  it('units that do not apply fall back to hidden', () => {
    expect(unitAvailable(simple, 'percent')).toBe(false);
    expect(unitAvailable(simple, 'coffee')).toBe(false);
    expect(cardContent(simple, 'coffee', 90).big).toBe('30 dk 0 sn');
  });
});

describe('weeklyStats', () => {
  it('sums time, ignores calendar countdowns, finds the longest focus', () => {
    const target: SessionSummary = { ...simple, modeId: 'countdowns', kind: 'target', elapsedMs: 50 * H };
    const meeting: SessionSummary = { ...simple, modeId: 'meeting', elapsedMs: 3 * H };
    const pomodoro: SessionSummary = {
      ...simple,
      modeId: 'student',
      kind: 'cycle',
      elapsedMs: 2 * H,
      focusMs: 1.5 * H,
    };
    const s = weeklyStats([work, target, meeting, pomodoro]);
    expect(s.totalMs).toBe(9 * H);
    expect(s.longestFocusMs).toBe(4 * H);
    expect(s.sessions).toBe(3);
  });

  it('is zero for an empty week', () => {
    expect(weeklyStats([])).toEqual({ totalMs: 0, longestFocusMs: 0, sessions: 0 });
  });
});

describe('trWeekStart', () => {
  it('is Monday 00:00 Turkey time, also on Sunday night', () => {
    const monday = Date.UTC(2026, 10, 22, 21); // Mon 23 Nov 00:00 TR
    expect(trWeekStart(Date.UTC(2026, 10, 25, 9))).toBe(monday);
    expect(trWeekStart(monday)).toBe(monday);
    expect(trWeekStart(Date.UTC(2026, 10, 29, 20, 59))).toBe(monday); // Sun 23:59 TR
  });
});

describe('mode-specific cards', () => {
  it('meeting and focus cards get their own tone; Pomodoro shows focus time', () => {
    const meeting: SessionSummary = { ...simple, modeId: 'meeting', cost: 500 };
    expect(cardContent(meeting, 'hidden', null).tone).toBe('meeting');
    const pomodoro: SessionSummary = {
      ...simple,
      modeId: 'student',
      kind: 'cycle',
      elapsedMs: 2 * H,
      focusMs: 1.5 * H,
    };
    const c = cardContent(pomodoro, 'hidden', null);
    expect([c.tone, c.big]).toEqual(['focus', '1 s 30 dk']);
  });
});
