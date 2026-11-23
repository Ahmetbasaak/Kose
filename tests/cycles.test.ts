import { describe, expect, it } from 'vitest';
import { cycleState, focusEndsBetween, focusTime, pomodoroSegments, timeInSegment } from '../src/engine/cycles';

const MIN = 60_000;
const pomodoro = [25 * MIN, 5 * MIN];

describe('cycleState', () => {
  it('starts in the first segment', () => {
    expect(cycleState(0, pomodoro)).toEqual({
      boundaries: 0,
      segment: 0,
      round: 1,
      segmentElapsedMs: 0,
      remainingMs: 25 * MIN,
    });
  });

  it('moves to the break exactly at the boundary', () => {
    expect(cycleState(25 * MIN - 1, pomodoro).segment).toBe(0);
    const s = cycleState(25 * MIN, pomodoro);
    expect(s).toMatchObject({ segment: 1, boundaries: 1, remainingMs: 5 * MIN });
  });

  it('wraps into the next round', () => {
    expect(cycleState(31 * MIN, pomodoro)).toMatchObject({
      segment: 0,
      round: 2,
      boundaries: 2,
      remainingMs: 24 * MIN,
    });
  });

  it('counts every boundary missed while the page was closed', () => {
    expect(cycleState(3 * 30 * MIN + 26 * MIN, pomodoro).boundaries).toBe(7);
  });

  it('works with a single repeating segment (break reminder)', () => {
    expect(cycleState(45 * MIN, [20 * MIN])).toMatchObject({ boundaries: 2, round: 3, remainingMs: 15 * MIN });
  });
});

describe('timeInSegment', () => {
  it('sums focus time across rounds', () => {
    expect(timeInSegment(10 * MIN, pomodoro, 0)).toBe(10 * MIN);
    expect(timeInSegment(28 * MIN, pomodoro, 0)).toBe(25 * MIN);
    expect(timeInSegment(28 * MIN, pomodoro, 1)).toBe(3 * MIN);
    expect(timeInSegment(70 * MIN, pomodoro, 0)).toBe(60 * MIN);
  });
});

describe('pomodoro with a long break', () => {
  const plan = pomodoroSegments(25 * MIN, 5 * MIN, 15 * MIN, 4);
  it('builds focus/rest pairs with the last rest long', () => {
    expect(plan.map((m) => m / MIN)).toEqual([25, 5, 25, 5, 25, 5, 25, 15]);
  });
  it('counts focus time across all focus blocks only', () => {
    expect(focusTime(60 * MIN, plan)).toBe(50 * MIN); // 25 + 5 rest + 25 + 5 rest
    expect(focusTime(120 * MIN, plan)).toBe(100 * MIN); // 4 blocks + long break started
    expect(focusTime(140 * MIN, plan)).toBe(110 * MIN); // round 2 began at 130: +10 min
  });
  it('counts finished focus blocks between alert counts', () => {
    expect(focusEndsBetween(0, 1)).toBe(1);
    expect(focusEndsBetween(1, 2)).toBe(0); // rest ended
    expect(focusEndsBetween(0, 7)).toBe(4);
    expect(focusEndsBetween(2, 5)).toBe(2);
  });
});
