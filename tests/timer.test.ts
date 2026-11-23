import { describe, expect, it } from 'vitest';
import { elapsedMs, finishAt, isRunning, pauseTimer, remainingMs, resumeTimer, startTimer } from '../src/engine/timer';

const T0 = Date.UTC(2026, 10, 23, 9, 0, 0);

describe('timer', () => {
  it('measures elapsed time from the start timestamp', () => {
    const t = startTimer(T0);
    expect(isRunning(t)).toBe(true);
    expect(elapsedMs(t, T0)).toBe(0);
    expect(elapsedMs(t, T0 + 90_500)).toBe(90_500);
  });

  it('freezes while paused and continues after resume', () => {
    let t = startTimer(T0);
    t = pauseTimer(t, T0 + 10_000);
    expect(isRunning(t)).toBe(false);
    expect(elapsedMs(t, T0 + 999_999)).toBe(10_000);
    t = resumeTimer(t, T0 + 60_000);
    expect(elapsedMs(t, T0 + 65_000)).toBe(15_000);
  });

  it('pause and resume are idempotent', () => {
    const running = startTimer(T0);
    expect(resumeTimer(running, T0 + 5)).toBe(running);
    const paused = pauseTimer(running, T0 + 1000);
    expect(pauseTimer(paused, T0 + 5000)).toBe(paused);
  });

  it('survives a reload: a JSON round-trip of the stored state gives the same value', () => {
    let t = startTimer(T0);
    t = pauseTimer(t, T0 + 30_000);
    t = resumeTimer(t, T0 + 40_000);
    const restored = JSON.parse(JSON.stringify(t)) as typeof t;
    // Page was closed for an hour; nothing ticked, value is still exact.
    expect(elapsedMs(restored, T0 + 40_000 + 3_600_000)).toBe(30_000 + 3_600_000);
  });

  it('does not depend on how often it is sampled (no drift from throttled ticks)', () => {
    const t = startTimer(T0);
    let last = 0;
    for (let now = T0; now <= T0 + 60_000; now += 997) last = elapsedMs(t, now);
    expect(last).toBe(elapsedMs(t, T0 + Math.floor(60_000 / 997) * 997));
    expect(elapsedMs(t, T0 + 60_000)).toBe(60_000);
  });

  it('never goes negative if the clock moves backwards', () => {
    const t = startTimer(T0);
    expect(elapsedMs(t, T0 - 5000)).toBe(0);
  });

  it('computes countdown remaining time and clamps at zero', () => {
    const t = startTimer(T0);
    expect(remainingMs(t, 60_000, T0 + 20_000)).toBe(40_000);
    expect(remainingMs(t, 60_000, T0 + 61_000)).toBe(0);
  });

  it('knows the finish moment, accounting for pauses', () => {
    let t = startTimer(T0);
    expect(finishAt(t, 60_000)).toBe(T0 + 60_000);
    t = pauseTimer(t, T0 + 20_000);
    expect(finishAt(t, 60_000)).toBeNull();
    t = resumeTimer(t, T0 + 100_000);
    expect(finishAt(t, 60_000)).toBe(T0 + 140_000);
  });
});
