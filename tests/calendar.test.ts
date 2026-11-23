import { describe, expect, it } from 'vitest';
import { businessDaysUntil, parseIsoDate, streak, targetState, toIcs, trMidnight } from '../src/engine/calendar';
import { MONTHLY_HOURS, meetingCost, trDay } from '../src/engine/work';

const tr = (y: number, mo: number, d: number, h = 0, mi = 0) => Date.UTC(y, mo - 1, d, h - 3, mi);
const H = 3_600_000;

describe('weekend', () => {
  const rule = { type: 'weekend' } as const;
  it('counts down to Saturday 00:00 Turkey time', () => {
    const s = targetState(rule, tr(2026, 11, 27, 18)); // Friday 18:00
    expect(s.at).toBe(tr(2026, 11, 28));
    expect(s.remainingMs).toBe(6 * H);
    expect(s.arrived).toBe(false);
  });
  it('is "arrived" all weekend', () => {
    expect(targetState(rule, tr(2026, 11, 28, 10)).arrived).toBe(true);
    expect(targetState(rule, tr(2026, 11, 29, 23, 59)).arrived).toBe(true);
    expect(targetState(rule, tr(2026, 11, 29, 23, 59)).remainingMs).toBe(0);
  });
  it('Monday counts to next Saturday', () => {
    expect(targetState(rule, tr(2026, 11, 30, 9)).at).toBe(tr(2026, 12, 5));
  });
});

describe('payday', () => {
  it('this month if not passed, the whole payday counts as arrived', () => {
    expect(targetState({ type: 'payday', day: 15 }, tr(2026, 11, 10)).at).toBe(tr(2026, 11, 15));
    const onDay = targetState({ type: 'payday', day: 15 }, tr(2026, 11, 15, 20));
    expect(onDay.arrived).toBe(true);
    expect(onDay.remainingMs).toBe(0);
  });
  it('next month once passed, across the year end', () => {
    expect(targetState({ type: 'payday', day: 15 }, tr(2026, 12, 16)).at).toBe(tr(2027, 1, 15));
  });
  it('day 31 in a 30-day month uses the last day', () => {
    expect(targetState({ type: 'payday', day: 31 }, tr(2026, 11, 2)).at).toBe(tr(2026, 11, 30));
    expect(targetState({ type: 'payday', day: 31 }, tr(2027, 2, 1)).at).toBe(tr(2027, 2, 28));
  });
});

describe('yearly (birthday)', () => {
  it('this year or next', () => {
    expect(targetState({ type: 'yearly', m: 12, d: 1 }, tr(2026, 11, 23)).at).toBe(tr(2026, 12, 1));
    expect(targetState({ type: 'yearly', m: 3, d: 1 }, tr(2026, 11, 23)).at).toBe(tr(2027, 3, 1));
  });
  it('29 February falls back to 28 February in common years', () => {
    expect(targetState({ type: 'yearly', m: 2, d: 29 }, tr(2026, 11, 23)).at).toBe(tr(2027, 2, 28));
    expect(targetState({ type: 'yearly', m: 2, d: 29 }, tr(2027, 3, 1)).at).toBe(tr(2028, 2, 29));
  });
});

describe('one-off moment', () => {
  it('counts down, then stays arrived', () => {
    const at = tr(2027, 6, 10, 9, 30);
    expect(targetState({ type: 'at', at }, at - 90_000).remainingMs).toBe(90_000);
    expect(targetState({ type: 'at', at }, at + 5 * 86_400_000)).toMatchObject({ remainingMs: 0, arrived: true });
  });
});

describe('Turkey time regardless of host time zone', () => {
  it('trMidnight is 21:00 UTC the previous day', () => {
    expect(new Date(trMidnight(2027, 3, 9)).toISOString()).toBe('2027-03-08T21:00:00.000Z');
  });
});

describe('parseIsoDate', () => {
  it('accepts real dates only', () => {
    expect(parseIsoDate('2027-03-09')).toEqual({ y: 2027, m: 3, d: 9 });
    expect(parseIsoDate('2027-02-30')).toBeNull();
    expect(parseIsoDate('')).toBeNull();
  });
});

describe('streak', () => {
  const today = trDay(tr(2026, 11, 23, 12));
  it('counts consecutive days ending today', () => {
    expect(streak([today, today - 1, today - 2, today - 4], today)).toBe(3);
  });
  it('keeps yesterday’s streak alive until today ends', () => {
    expect(streak([today - 1, today - 2], today)).toBe(2);
  });
  it('is zero after a missed day, and ignores duplicates', () => {
    expect(streak([today - 2, today - 3], today)).toBe(0);
    expect(streak([today, today, today - 1], today)).toBe(2);
  });
});

describe('meetingCost', () => {
  it('people × rate × hours', () => {
    expect(meetingCost(30 * 60_000, 6, 400)).toBe(1200);
    expect(meetingCost(0, 6, 400)).toBe(0);
    // 6 people on 45.000 ₺ a month, 30 minutes: 45000 / 176 h × 6 × 0.5
    expect(meetingCost(30 * 60_000, 6, 45_000 / MONTHLY_HOURS)).toBeCloseTo(767.05, 2);
  });
});

describe('businessDaysUntil', () => {
  it('counts weekdays after today up to the target, skipping holidays', () => {
    // Mon 23 Nov → Mon 30 Nov: Tue–Fri + Mon = 5
    expect(businessDaysUntil(tr(2026, 11, 23, 10), tr(2026, 11, 30), [])).toBe(5);
    // with a 1-day holiday on Wed 25 Nov: 4
    expect(businessDaysUntil(tr(2026, 11, 23, 10), tr(2026, 11, 30), [{ at: tr(2026, 11, 25), days: 1 }])).toBe(4);
    expect(businessDaysUntil(tr(2026, 11, 23, 10), tr(2026, 11, 23, 20), [])).toBe(0);
  });
});

describe('toIcs', () => {
  const now = tr(2026, 11, 23, 10);
  it('all-day event for a date, escaped title', () => {
    const ics = toIcs('Sınav; final, 1', { type: 'at', at: tr(2027, 6, 10) }, now, 'u1');
    expect(ics).toContain('DTSTART;VALUE=DATE:20270610');
    expect(ics).toContain(String.raw`SUMMARY:Sınav\; final\, 1`);
    expect(ics.split('\r\n')[0]).toBe('BEGIN:VCALENDAR');
  });
  it('escapes backslashes too', () => {
    expect(toIcs(String.raw`a\b`, { type: 'at', at: tr(2027, 6, 10) }, now, 'u6')).toContain(String.raw`SUMMARY:a\\b`);
  });
  it('timed event for a custom moment (UTC)', () => {
    expect(toIcs('X', { type: 'at', at: tr(2027, 6, 10, 9, 30) }, now, 'u2')).toContain('DTSTART:20270610T063000Z');
  });
  it('repeating rules', () => {
    expect(toIcs('Maaş', { type: 'payday', day: 15 }, now, 'u3')).toContain('RRULE:FREQ=MONTHLY;BYMONTHDAY=15');
    expect(toIcs('HS', { type: 'weekend' }, now, 'u4')).toContain('RRULE:FREQ=WEEKLY;BYDAY=SA');
    expect(toIcs('DG', { type: 'yearly', m: 3, d: 1 }, now, 'u5')).toContain('RRULE:FREQ=YEARLY');
  });
});
