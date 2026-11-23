import { trDay } from './work';

export interface TimeEntry {
  id: string;
  projectId: string;
  startedAt: number;
  endedAt: number;
  /** Paid time; less than endedAt - startedAt when the timer was paused. */
  elapsedMs: number;
}

export interface WeekRow {
  /** Turkey day number (see trDay). */
  day: number;
  projectId: string;
  ms: number;
}

/** Entries of one week grouped by (day, project), day order. An entry belongs to the day it started. */
export function weekRows(entries: readonly TimeEntry[], weekStart: number): WeekRow[] {
  const end = weekStart + 7 * 86_400_000;
  const map = new Map<string, WeekRow>();
  for (const e of entries) {
    if (e.startedAt < weekStart || e.startedAt >= end) continue;
    const day = trDay(e.startedAt);
    const key = `${day}:${e.projectId}`;
    const row = map.get(key) ?? { day, projectId: e.projectId, ms: 0 };
    row.ms += e.elapsedMs;
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
