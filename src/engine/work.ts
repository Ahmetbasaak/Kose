/**
 * Shift & earnings math. All wall-clock reasoning is in Turkey time: fixed UTC+3, no DST since 2016.
 * Times of day are minutes after midnight; `now` is epoch ms.
 */
export interface WorkConfig {
  monthlySalary: number;
  /** Shift start/end, minutes after midnight. end < start means the shift crosses midnight. */
  startMin: number;
  endMin: number;
  /** Paid days per month, used only to derive the hourly rate. */
  workDays: number;
  lunchMin: number;
  /** When lunch begins, minutes after midnight. */
  lunchStartMin: number;
}

export type WorkPhase = 'before' | 'working' | 'break' | 'after' | 'weekend';

export interface WorkState {
  phase: WorkPhase;
  /** Paid time worked in the current shift so far (lunch excluded). */
  workedMs: number;
  earned: number;
  /** Until the shift ends (phase working/break) or starts (phase before); 0 otherwise. */
  remainingMs: number;
  hourlyRate: number;
}

const MIN = 60_000;
const DAY = 86_400_000;
export const TR_OFFSET_MS = 3 * 3_600_000;

/** Turkey calendar day number (days since 1970-01-01 in TR time). */
export const trDay = (now: number) => Math.floor((now + TR_OFFSET_MS) / DAY);
/** 0 = Sunday … 6 = Saturday. 1970-01-01 was a Thursday. */
export const trWeekday = (day: number) => (((day + 4) % 7) + 7) % 7;
const dayStart = (day: number) => day * DAY - TR_OFFSET_MS;
const spanMin = (from: number, to: number) => (((to - from) % 1440) + 1440) % 1440;

export const shiftMinutes = (c: WorkConfig) => spanMin(c.startMin, c.endMin);
export const netDailyHours = (c: WorkConfig) => (shiftMinutes(c) - c.lunchMin) / 60;
export const hourlyRate = (c: WorkConfig) => c.monthlySalary / (c.workDays * netDailyHours(c));

export type WorkConfigError = 'salary' | 'workDays' | 'shift' | 'lunch';

export function validateWork(c: WorkConfig): WorkConfigError | null {
  if (!(c.monthlySalary > 0) || !Number.isFinite(c.monthlySalary)) return 'salary';
  if (!Number.isInteger(c.workDays) || c.workDays < 1 || c.workDays > 31) return 'workDays';
  if (shiftMinutes(c) === 0) return 'shift';
  if (c.lunchMin < 0 || c.lunchMin >= shiftMinutes(c)) return 'lunch';
  // Lunch must sit fully inside the shift.
  if (spanMin(c.startMin, c.lunchStartMin) + c.lunchMin > shiftMinutes(c)) return 'lunch';
  return null;
}

interface Shift {
  day: number;
  start: number;
  end: number;
  lunchStart: number;
  lunchEnd: number;
}

function shiftOn(c: WorkConfig, day: number): Shift {
  const start = dayStart(day) + c.startMin * MIN;
  const lunchStart = start + spanMin(c.startMin, c.lunchStartMin) * MIN;
  return { day, start, end: start + shiftMinutes(c) * MIN, lunchStart, lunchEnd: lunchStart + c.lunchMin * MIN };
}

const overlap = (a0: number, a1: number, b0: number, b1: number) => Math.max(0, Math.min(a1, b1) - Math.max(a0, b0));

/** Assumes a valid config (see validateWork). Weekends are Saturday and Sunday of the shift's start day. */
export function workState(c: WorkConfig, now: number): WorkState {
  const rate = hourlyRate(c);
  const today = trDay(now);
  const yesterday = shiftOn(c, today - 1);
  // An overnight shift that started yesterday still owns the early hours of today.
  const s = now < yesterday.end ? yesterday : shiftOn(c, today);
  const wd = trWeekday(s.day);
  if (wd === 0 || wd === 6) return { phase: 'weekend', workedMs: 0, earned: 0, remainingMs: 0, hourlyRate: rate };

  const until = Math.min(now, s.end);
  const workedMs = Math.max(0, until - s.start) - overlap(s.start, until, s.lunchStart, s.lunchEnd);
  const phase: WorkPhase =
    now < s.start ? 'before' : now >= s.end ? 'after' : now >= s.lunchStart && now < s.lunchEnd ? 'break' : 'working';
  const remainingMs = phase === 'before' ? s.start - now : phase === 'after' ? 0 : s.end - now;
  return { phase, workedMs, earned: (workedMs / 3_600_000) * rate, remainingMs, hourlyRate: rate };
}

/** "09:30" → 570. Returns NaN for anything else. */
export function parseTime(v: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(v.trim());
  if (!m) return NaN;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h < 24 && min < 60 ? h * 60 + min : NaN;
}

export const formatTime = (min: number) =>
  `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

/** Turkish number input: "45.000" and "45.000,50" (dot = thousands, comma = decimal). NaN if malformed. */
export function parseTrNumber(v: string): number {
  const s = v.trim().replace(/\s|₺/g, '');
  if (!/^\d{1,3}(\.\d{3})*(,\d+)?$|^\d+(,\d+)?$/.test(s)) return NaN;
  return Number(s.replace(/\./g, '').replace(',', '.'));
}

/** Live meeting cost: everyone's paid time so far. */
export const meetingCost = (elapsedMs: number, people: number, hourlyRate: number) =>
  (elapsedMs / 3_600_000) * people * hourlyRate;
