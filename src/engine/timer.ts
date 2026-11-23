/**
 * Pause-able timer stored as absolute timestamps, never as accumulated ticks.
 * `startedAt` is the wall-clock ms when the current running segment began (null = paused);
 * `accumulatedMs` holds the total of all finished segments.
 */
export interface Timer {
  startedAt: number | null;
  accumulatedMs: number;
}

export const startTimer = (now: number): Timer => ({ startedAt: now, accumulatedMs: 0 });

export const isRunning = (t: Timer): boolean => t.startedAt !== null;

/** Clock going backwards (manual change, NTP) never yields negative time. */
export const elapsedMs = (t: Timer, now: number): number =>
  t.accumulatedMs + (t.startedAt === null ? 0 : Math.max(0, now - t.startedAt));

export const pauseTimer = (t: Timer, now: number): Timer =>
  t.startedAt === null ? t : { startedAt: null, accumulatedMs: elapsedMs(t, now) };

export const resumeTimer = (t: Timer, now: number): Timer => (t.startedAt === null ? { ...t, startedAt: now } : t);

export const remainingMs = (t: Timer, durationMs: number, now: number): number =>
  Math.max(0, durationMs - elapsedMs(t, now));

/** Wall-clock moment a countdown reaches zero; null while paused (it will not finish on its own). */
export const finishAt = (t: Timer, durationMs: number): number | null =>
  t.startedAt === null ? null : t.startedAt + Math.max(0, durationMs - t.accumulatedMs);
