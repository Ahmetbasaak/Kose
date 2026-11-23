/** Turkey calendar helpers (fixed UTC+3, no DST). Dates are { y, m (1-12), d }. */
import { TR_OFFSET_MS, trDay, trWeekday } from './work';

const DAY = 86_400_000;

export interface Ymd {
  y: number;
  m: number;
  d: number;
}

/** Epoch ms of 00:00 Turkey time on that date (overflowing days roll into the next month, like Date.UTC). */
export const trMidnight = (y: number, m: number, d: number) => Date.UTC(y, m - 1, d) - TR_OFFSET_MS;

export function trYmd(now: number): Ymd {
  const t = new Date(now + TR_OFFSET_MS);
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
}

/** Monday 00:00 (Turkey time) of the week containing `now`. */
export const trWeekStart = (now: number) => (trDay(now) - ((trWeekday(trDay(now)) + 6) % 7)) * DAY - TR_OFFSET_MS;

export const daysInMonth = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();

/** "2027-03-09" → Ymd; null if malformed or not a real date. */
export function parseIsoDate(v: string): Ymd | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!m) return null;
  const ymd = { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) };
  return ymd.m >= 1 && ymd.m <= 12 && ymd.d >= 1 && ymd.d <= daysInMonth(ymd.y, ymd.m) ? ymd : null;
}

export type TargetRule =
  | { type: 'weekend' }
  /** Day of month; months shorter than `day` use their last day. */
  | { type: 'payday'; day: number }
  /** Yearly; 29 Feb falls back to 28 Feb in common years. */
  | { type: 'yearly'; m: number; d: number }
  /** One-off moment (epoch ms). */
  | { type: 'at'; at: number };

export interface TargetState {
  /** Start of the current-or-next occurrence (epoch ms). */
  at: number;
  remainingMs: number;
  /** True while inside the occurrence (that whole day / the weekend) or after a one-off moment. */
  arrived: boolean;
}

function occurrenceDay(rule: TargetRule, now: number): { start: number; length: number } {
  const today = trDay(now);
  const { y, m } = trYmd(now);
  switch (rule.type) {
    case 'weekend': {
      const wd = trWeekday(today);
      // Saturday 00:00 of this week's weekend; Sunday counts as inside it.
      const sat = wd === 6 ? today : wd === 0 ? today - 1 : today + (6 - wd);
      return { start: sat * DAY - TR_OFFSET_MS, length: 2 * DAY };
    }
    case 'payday': {
      const thisMonth = trMidnight(y, m, Math.min(rule.day, daysInMonth(y, m)));
      if (thisMonth + DAY > now) return { start: thisMonth, length: DAY };
      const ny = m === 12 ? y + 1 : y;
      const nm = m === 12 ? 1 : m + 1;
      return { start: trMidnight(ny, nm, Math.min(rule.day, daysInMonth(ny, nm))), length: DAY };
    }
    case 'yearly': {
      const on = (yy: number) => trMidnight(yy, rule.m, Math.min(rule.d, daysInMonth(yy, rule.m)));
      return { start: on(y) + DAY > now ? on(y) : on(y + 1), length: DAY };
    }
    case 'at':
      return { start: rule.at, length: Infinity };
  }
}

export function targetState(rule: TargetRule, now: number): TargetState {
  const { start, length } = occurrenceDay(rule, now);
  return { at: start, remainingMs: Math.max(0, start - now), arrived: now >= start && now < start + length };
}

/**
 * Consecutive study days ending today (or yesterday, so the streak survives until today's session).
 * `days` are Turkey day numbers (see trDay), any order, duplicates allowed.
 */
export function streak(days: readonly number[], today: number): number {
  const set = new Set(days);
  let d = set.has(today) ? today : today - 1;
  let n = 0;
  while (set.has(d)) {
    n++;
    d--;
  }
  return n;
}
