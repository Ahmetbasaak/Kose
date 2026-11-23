import { describe, expect, it } from 'vitest';
import { durationParts, formatClock, formatMoney } from '../src/engine/format';

describe('format', () => {
  it('formats short durations as mm:ss', () => {
    expect(formatClock(0)).toBe('00:00');
    expect(formatClock(65_900)).toBe('01:05');
  });

  it('adds hours when needed', () => {
    expect(formatClock(3_725_000)).toBe('1:02:05');
    expect(formatClock(36_000_000)).toBe('10:00:00');
  });

  it('rounds up for countdowns so zero only shows at the real end', () => {
    expect(formatClock(400, 'ceil')).toBe('00:01');
    expect(formatClock(0, 'ceil')).toBe('00:00');
    expect(formatClock(400)).toBe('00:00');
  });

  it('treats negative input as zero', () => {
    expect(durationParts(-5000)).toEqual({ hours: 0, minutes: 0, seconds: 0 });
  });

  it('formats Turkish lira with kuruş', () => {
    expect(formatMoney(1150.47)).toBe('1.150,47 ₺');
    expect(formatMoney(0)).toBe('0,00 ₺');
    expect(formatMoney(1234567.891)).toBe('1.234.567,89 ₺');
  });
});
