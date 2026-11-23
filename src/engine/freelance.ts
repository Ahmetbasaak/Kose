import { parseIsoDate, trMidnight } from './calendar';
import { parseTime, trDay } from './work';

export interface TimeEntry {
  id: string;
  projectId: string;
  startedAt: number;
  endedAt: number;
  /** Paid time; less than endedAt - startedAt when the timer was paused. */
  elapsedMs: number;
  /** What was done, for the invoice. */
  note?: string;
}

/**
 * A manually added entry ("forgot to start the timer"): date + start/end in Turkey time.
 * An end before the start means it ran past midnight. Null when the input is invalid.
 */
export function manualEntry(date: string, start: string, end: string): Omit<TimeEntry, 'id' | 'projectId'> | null {
  const ymd = parseIsoDate(date);
  const s = parseTime(start);
  const e = parseTime(end);
  if (!ymd || !Number.isFinite(s) || !Number.isFinite(e) || s === e) return null;
  const startedAt = trMidnight(ymd.y, ymd.m, ymd.d) + s * 60_000;
  const elapsedMs = ((((e - s) % 1440) + 1440) % 1440) * 60_000;
  return { startedAt, endedAt: startedAt + elapsedMs, elapsedMs };
}

/** Billable amount; null when the project has no hourly rate. */
export const amountFor = (ms: number, hourlyRate: number | null | undefined) =>
  hourlyRate ? (ms / 3_600_000) * hourlyRate : null;

export interface WeekRow {
  /** Turkey day number (see trDay). */
  day: number;
  projectId: string;
  ms: number;
}

/**
 * Entries in [start, end) (default: one week) grouped by (day, project), day order.
 * An entry belongs to the day it started. `msOf` lets billing round each entry first.
 */
export function weekRows(
  entries: readonly TimeEntry[],
  weekStart: number,
  end = weekStart + 7 * 86_400_000,
  msOf: (e: TimeEntry) => number = (e) => e.elapsedMs,
): WeekRow[] {
  const map = new Map<string, WeekRow>();
  for (const e of entries) {
    if (e.startedAt < weekStart || e.startedAt >= end) continue;
    const day = trDay(e.startedAt);
    const key = `${day}:${e.projectId}`;
    const row = map.get(key) ?? { day, projectId: e.projectId, ms: 0 };
    row.ms += msOf(e);
    map.set(key, row);
  }
  return [...map.values()].sort((a, b) => a.day - b.day || a.projectId.localeCompare(b.projectId));
}

/** Sum per key (e.g. client id) using a lookup from project id. */
export function totalsBy(rows: readonly WeekRow[], keyOf: (projectId: string) => string): Map<string, number> {
  const totals = new Map<string, number>();
  for (const r of rows) totals.set(keyOf(r.projectId), (totals.get(keyOf(r.projectId)) ?? 0) + r.ms);
  return totals;
}

/** Billing rounding: each entry rounded up to the next `minutes` (0 = exact). */
export const roundUp = (ms: number, minutes: number) =>
  minutes > 0 ? Math.ceil(ms / (minutes * 60_000)) * minutes * 60_000 : ms;
