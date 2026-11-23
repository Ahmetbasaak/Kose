import { trDay, trWeekday } from '../engine/work';
import type { SessionSummary } from '../storage/session';

const H = 3_600_000;
const FOCUS = new Set(['simple', 'student', 'freelance', 'work', 'presentation']);
const TR_HOUR = (ms: number) => new Date(ms + 3 * H).getUTCHours();

/** Longest run of consecutive Turkey days ever. */
export function longestStreak(days: readonly number[]): number {
  const sorted = [...new Set(days)].sort((a, b) => a - b);
  let best = 0;
  let run = 0;
  for (let i = 0; i < sorted.length; i++) {
    run = i > 0 && sorted[i]! === sorted[i - 1]! + 1 ? run + 1 : 1;
    best = Math.max(best, run);
  }
  return best;
}

export type BadgeId =
  | 'first'
  | 'streak3'
  | 'streak7'
  | 'streak30'
  | 'focus10'
  | 'focus100'
  | 'pomodoro25'
  | 'meeting'
  | 'earlyBird'
  | 'nightOwl'
  | 'weekend'
  | 'freelance10';

export interface Badge {
  id: BadgeId;
  earned: boolean;
  /** 0–1 towards the badge (1 when earned). */
  progress: number;
}

const focusMsOf = (r: SessionSummary) => (FOCUS.has(r.modeId) && r.kind !== 'target' ? (r.focusMs ?? r.elapsedMs) : 0);

/** Every badge with progress, computed from history and active days (nothing extra is stored). */
export function badges(records: readonly SessionSummary[], activeDays: readonly number[]): Badge[] {
  const focus = records.reduce((a, r) => a + focusMsOf(r), 0);
  const pomodoroFocus = records.filter((r) => r.modeId === 'student').reduce((a, r) => a + (r.focusMs ?? 0), 0);
  const freelance = records.filter((r) => r.modeId === 'freelance').reduce((a, r) => a + r.elapsedMs, 0);
  const longest = longestStreak(activeDays);
  const has = (f: (r: SessionSummary) => boolean) => (records.some(f) ? 1 : 0);
  const p: Record<BadgeId, number> = {
    first: records.length > 0 ? 1 : 0,
    streak3: longest / 3,
    streak7: longest / 7,
    streak30: longest / 30,
    focus10: focus / (10 * H),
    focus100: focus / (100 * H),
    pomodoro25: pomodoroFocus / (25 * 25 * 60_000),
    meeting: has((r) => r.modeId === 'meeting'),
    earlyBird: has((r) => r.kind !== 'target' && TR_HOUR(r.startedAt) < 7),
    nightOwl: has((r) => r.kind !== 'target' && TR_HOUR(r.endedAt) >= 23),
    weekend: has((r) => r.kind !== 'target' && [0, 6].includes(trWeekday(trDay(r.startedAt)))),
    freelance10: freelance / (10 * H),
  };
  return (Object.keys(p) as BadgeId[]).map((id) => ({ id, earned: p[id] >= 1, progress: Math.min(1, p[id]) }));
}

export interface YearStats {
  year: number;
  totalMs: number;
  focusMs: number;
  sessions: number;
  activeDays: number;
  longestStreak: number;
  topMode: SessionSummary['modeId'] | null;
  /** 1–12, the month with the most time. */
  topMonth: number | null;
}

/** "Yılın özeti": everything for one calendar year (Turkey time). */
export function yearStats(records: readonly SessionSummary[], year: number): YearStats {
  const inYear = records.filter((r) => r.kind !== 'target' && new Date(r.endedAt + 3 * H).getUTCFullYear() === year);
  const byMode = new Map<SessionSummary['modeId'], number>();
  const byMonth = new Map<number, number>();
  for (const r of inYear) {
    byMode.set(r.modeId, (byMode.get(r.modeId) ?? 0) + r.elapsedMs);
    const m = new Date(r.endedAt + 3 * H).getUTCMonth() + 1;
    byMonth.set(m, (byMonth.get(m) ?? 0) + r.elapsedMs);
  }
  const top = <K>(m: Map<K, number>) => [...m].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const days = inYear.map((r) => trDay(r.endedAt));
  return {
    year,
    totalMs: inYear.reduce((a, r) => a + r.elapsedMs, 0),
    focusMs: inYear.reduce((a, r) => a + focusMsOf(r), 0),
    sessions: inYear.length,
    activeDays: new Set(days).size,
    longestStreak: longestStreak(days),
    topMode: top(byMode),
    topMonth: top(byMonth),
  };
}
