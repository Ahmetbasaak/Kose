/**
 * Anonymous usage events: what may be stored, nothing else. Shared by the Worker (validation)
 * and the app (sending). No IP, user agent, cookie or id ever enters a data point.
 */
export const EVENTS = ['visit', 'start', 'finish', 'share'] as const;
// Kept in sync with src/modes/registry.ts by tests/stats.test.ts (the Worker must not bundle React).
export const MODES = [
  'simple',
  'work',
  'countdowns',
  'meeting',
  'break',
  'student',
  'freelance',
  'presentation',
  'multi',
  'overlay',
] as const;

export interface StatEvent {
  event: (typeof EVENTS)[number];
  mode: string;
  /** Route path only, never the query string (shared links carry titles there). */
  path: string;
  lang: 'tr' | 'en';
  device: 'mobile' | 'desktop';
  display: 'browser' | 'app';
  /** Session length for 'finish', 0 otherwise. */
  seconds: number;
}

const MAX_SECONDS = 7 * 86_400;

/** Untrusted JSON → a clean event, or null. Unknown fields are dropped, odd values rejected. */
export function parseEvent(input: unknown): StatEvent | null {
  if (typeof input !== 'object' || input === null) return null;
  const o = input as Record<string, unknown>;
  const event = EVENTS.find((e) => e === o.event);
  const mode = o.mode === undefined || o.mode === '' ? '' : MODES.find((m) => m === o.mode);
  const path = typeof o.path === 'string' && /^\/[a-z0-9/-]{0,80}$/.test(o.path) ? o.path : null;
  const seconds = o.seconds === undefined ? 0 : Number(o.seconds);
  if (!event || mode === undefined || path === null) return null;
  if (!Number.isFinite(seconds) || seconds < 0 || seconds > MAX_SECONDS) return null;
  if (o.lang !== 'tr' && o.lang !== 'en') return null;
  if (o.device !== 'mobile' && o.device !== 'desktop') return null;
  if (o.display !== 'browser' && o.display !== 'app') return null;
  return { event, mode, path, lang: o.lang, device: o.device, display: o.display, seconds: Math.round(seconds) };
}

/** Analytics Engine SQL for the owner's stats page. `days` is clamped, so it is safe to inline. */
export function statsQueries(dataset: string, daysIn: number) {
  const days = Math.min(90, Math.max(1, Math.floor(daysIn) || 30));
  const since = `timestamp > NOW() - INTERVAL '${days}' DAY`;
  return {
    byEvent: `SELECT blob1 AS event, blob2 AS mode, SUM(_sample_interval) AS count, SUM(_sample_interval * double1) AS seconds FROM ${dataset} WHERE ${since} GROUP BY event, mode ORDER BY count DESC FORMAT JSON`,
    daily: `SELECT toStartOfDay(timestamp) AS day, SUM(_sample_interval) AS visits FROM ${dataset} WHERE blob1 = 'visit' AND ${since} GROUP BY day ORDER BY day FORMAT JSON`,
    paths: `SELECT blob3 AS path, SUM(_sample_interval) AS visits FROM ${dataset} WHERE blob1 = 'visit' AND ${since} GROUP BY path ORDER BY visits DESC LIMIT 20 FORMAT JSON`,
    devices: `SELECT blob5 AS device, blob6 AS display, SUM(_sample_interval) AS visits FROM ${dataset} WHERE blob1 = 'visit' AND ${since} GROUP BY device, display ORDER BY visits DESC FORMAT JSON`,
  };
}
