/** Presentation timer: consecutive sections, then overtime. */
export type SectionLevel = 'green' | 'yellow' | 'red';

export interface SectionState {
  /** Current section; equals segments.length once all are used up. */
  index: number;
  remainingMs: number;
  overtimeMs: number;
  level: SectionLevel;
  /** Section ends passed (one alert each). */
  boundaries: number;
}

/** Yellow in the last quarter of a section (at least the last minute), red in overtime. */
export function sectionState(elapsedMs: number, segments: readonly number[]): SectionState {
  let start = 0;
  for (let i = 0; i < segments.length; i++) {
    const len = segments[i]!;
    if (elapsedMs < start + len) {
      const remainingMs = start + len - elapsedMs;
      const warnAt = Math.max(len / 4, Math.min(60_000, len));
      return { index: i, remainingMs, overtimeMs: 0, level: remainingMs <= warnAt ? 'yellow' : 'green', boundaries: i };
    }
    start += len;
  }
  return {
    index: segments.length,
    remainingMs: 0,
    overtimeMs: elapsedMs - start,
    level: 'red',
    boundaries: segments.length,
  };
}
