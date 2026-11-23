/**
 * Repeating segments on top of a Timer's elapsed time: Pomodoro [focus, break], break reminder [interval].
 * Pure: everything is derived from total elapsed ms, so pauses and reloads need no extra state.
 */
export interface CycleState {
  /** How many segment ends have passed since start (drives one alert per boundary). */
  boundaries: number;
  /** Index of the current segment. */
  segment: number;
  /** 1-based round (one round = all segments once). */
  round: number;
  /** Time spent in the current segment. */
  segmentElapsedMs: number;
  remainingMs: number;
}

export function cycleState(elapsedMs: number, segments: readonly number[]): CycleState {
  const cycle = segments.reduce((a, b) => a + b, 0);
  const rounds = Math.floor(elapsedMs / cycle);
  let pos = elapsedMs - rounds * cycle;
  let segment = 0;
  while (pos >= segments[segment]!) pos -= segments[segment++]!;
  return {
    boundaries: rounds * segments.length + segment,
    segment,
    round: rounds + 1,
    segmentElapsedMs: pos,
    remainingMs: segments[segment]! - pos,
  };
}

/** Total time spent inside segment `index` (e.g. focus time of a Pomodoro run). */
export function timeInSegment(elapsedMs: number, segments: readonly number[], index: number): number {
  const s = cycleState(elapsedMs, segments);
  const full = (s.round - 1) * segments[index]!;
  if (s.segment > index) return full + segments[index]!;
  if (s.segment === index) return full + s.segmentElapsedMs;
  return full;
}

/** Pomodoro plan: `every` focus blocks with short rests, the last rest long. Even indices are focus. */
export function pomodoroSegments(focusMs: number, restMs: number, longRestMs: number, every: number): number[] {
  return Array.from({ length: every }, (_, i) => [focusMs, i === every - 1 ? longRestMs : restMs]).flat();
}

/** Total focus time (all even segments) in a Pomodoro run. */
export const focusTime = (elapsedMs: number, segments: readonly number[]) =>
  segments.reduce((sum, _, i) => (i % 2 === 0 ? sum + timeInSegment(elapsedMs, segments, i) : sum), 0);

/** Focus blocks finished among boundaries (from, to]: boundary k (1-based) ends a focus block when k is odd. */
export const focusEndsBetween = (from: number, to: number) => Math.ceil(to / 2) - Math.ceil(from / 2);
