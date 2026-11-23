import { durationWords } from '../app/sessionView';
import { t } from '../i18n';
import type { SessionSummary } from '../storage/session';

/** How a card may hint at money. 'hidden' (the default) never shows an amount. */
export type CardUnit = 'hidden' | 'percent' | 'coffee';

/** Card colour family, so a meeting card doesn't look like a focus card. */
export type CardTone = 'work' | 'meeting' | 'focus' | 'life';

export interface CardContent {
  kicker: string;
  big: string;
  lines: string[];
  tone?: CardTone;
}

const TONE: Partial<Record<SessionSummary['modeId'], CardTone>> = {
  work: 'work',
  freelance: 'work',
  meeting: 'meeting',
  simple: 'focus',
  student: 'focus',
  break: 'focus',
  multi: 'focus',
  presentation: 'focus',
  countdowns: 'life',
};

const moneyOf = (s: SessionSummary) => s.earned ?? s.cost ?? null;

export const unitAvailable = (s: SessionSummary, unit: CardUnit): boolean =>
  unit === 'hidden' || (unit === 'percent' ? !!s.totalMs : moneyOf(s) !== null);

const lineKey = (s: SessionSummary) =>
  s.modeId === 'work' || s.modeId === 'meeting' || s.modeId === 'presentation'
    ? s.modeId
    : s.modeId === 'student' || s.modeId === 'simple'
      ? 'focus'
      : 'other';

/**
 * Text for a shareable card. Falls back to 'hidden' when the unit does not apply
 * (or no coffee price is set), so an amount can never leak by accident.
 */
export function cardContent(s: SessionSummary, unit: CardUnit, coffeePrice: number | null): CardContent {
  const kicker = s.label;
  const tone = TONE[s.modeId] ?? 'work';
  const money = moneyOf(s);
  if (unit === 'percent' && s.totalMs) {
    const pct = Math.min(100, Math.round((s.elapsedMs / s.totalMs) * 100));
    return { kicker, tone, big: t('share.percent', { n: pct }), lines: [t(`share.lines.percent.${lineKey(s)}`)] };
  }
  if (unit === 'coffee' && money !== null && coffeePrice && coffeePrice > 0) {
    const cups = Math.floor(money / coffeePrice);
    return { kicker, tone, big: t('share.coffee', { n: cups }), lines: [t(`share.lines.coffee.${lineKey(s)}`)] };
  }
  // A Pomodoro card brags about focus time, not the breaks in between.
  const shown = s.focusMs ?? s.elapsedMs;
  return { kicker, tone, big: durationWords(shown), lines: [t(`share.lines.hidden.${lineKey(s)}`)] };
}

export interface WeeklyStats {
  totalMs: number;
  longestFocusMs: number;
  sessions: number;
}

const FOCUS_MODES = new Set(['simple', 'work', 'student', 'freelance']);

/** Calendar countdowns only measure how long they sat in the corner, so they don't count as time. */
export function weeklyStats(records: readonly SessionSummary[]): WeeklyStats {
  const timed = records.filter((r) => r.kind !== 'target');
  return {
    totalMs: timed.reduce((a, r) => a + r.elapsedMs, 0),
    longestFocusMs: Math.max(0, ...timed.filter((r) => FOCUS_MODES.has(r.modeId)).map((r) => r.focusMs ?? r.elapsedMs)),
    sessions: timed.length,
  };
}

export function weeklyContent(stats: WeeklyStats, streakDays: number): CardContent {
  return {
    kicker: t('weekly.title'),
    big: durationWords(stats.totalMs),
    lines: [t('weekly.longest', { d: durationWords(stats.longestFocusMs) }), t('weekly.streak', { n: streakDays })],
  };
}
