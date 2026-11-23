import { describe, expect, it } from 'vitest';
import {
  earnedSince,
  equivalents,
  hourlyRate,
  workMilestones,
  netDailyHours,
  parseTime,
  parseEnNumber,
  parseTrNumber,
  trWeekday,
  trDay,
  validateWork,
  workState,
  type WorkConfig,
} from '../src/engine/work';

/** Epoch ms for a Turkey wall-clock time (UTC+3, no DST). */
const tr = (y: number, mo: number, d: number, h: number, mi = 0, s = 0) => Date.UTC(y, mo - 1, d, h - 3, mi, s);

// 2026-11-23 is a Monday.
const MON = (h: number, mi = 0, s = 0) => tr(2026, 11, 23, h, mi, s);

const base: WorkConfig = {
  monthlySalary: 45_000,
  startMin: 9 * 60,
  endMin: 18 * 60,
  workDays: 22,
  lunchMin: 60,
  lunchStartMin: 12 * 60,
};

describe('work rates', () => {
  it('derives net daily hours and hourly rate from the spec formula', () => {
    expect(netDailyHours(base)).toBe(8);
    expect(hourlyRate(base)).toBeCloseTo(45_000 / (22 * 8), 10); // ≈ 255.68
  });
});

describe('workState', () => {
  const rate = 45_000 / 176;

  it('before the shift: nothing earned, counts down to start', () => {
    const s = workState(base, MON(8, 30));
    expect(s.phase).toBe('before');
    expect(s.earned).toBe(0);
    expect(s.remainingMs).toBe(30 * 60_000);
  });

  it('earns per second while working', () => {
    const s = workState(base, MON(10, 0, 1));
    expect(s.phase).toBe('working');
    expect(s.workedMs).toBe(3_601_000);
    expect(s.earned).toBeCloseTo(rate * (3601 / 3600), 8);
    expect(s.remainingMs).toBe(8 * 3_600_000 - 1000); // until 18:00
  });

  it('lunch: phase is break and earnings freeze', () => {
    const atLunchStart = workState(base, MON(12, 0));
    const midLunch = workState(base, MON(12, 40));
    expect(midLunch.phase).toBe('break');
    expect(midLunch.earned).toBe(atLunchStart.earned);
    expect(midLunch.workedMs).toBe(3 * 3_600_000);
  });

  it('after lunch earnings resume without counting the break', () => {
    expect(workState(base, MON(14, 0)).workedMs).toBe(4 * 3_600_000);
  });

  it('after the shift: full net day is earned and stays put', () => {
    const s = workState(base, MON(18, 0));
    expect(s.phase).toBe('after');
    expect(s.workedMs).toBe(8 * 3_600_000);
    expect(s.earned).toBeCloseTo(8 * rate, 8);
    expect(workState(base, MON(23, 59)).earned).toBe(s.earned);
  });

  it('a full month of days adds up to the monthly salary', () => {
    expect(workState(base, MON(20)).earned * 22).toBeCloseTo(45_000, 6);
  });

  it('weekend: no earnings', () => {
    const sat = workState(base, tr(2026, 11, 28, 11));
    const sun = workState(base, tr(2026, 11, 29, 11));
    expect(sat.phase).toBe('weekend');
    expect(sun.phase).toBe('weekend');
    expect(sat.earned).toBe(0);
  });

  it('uses Turkey time, not the machine time zone: 23:30 UTC Sunday is Monday 02:30 in Turkey', () => {
    const now = Date.UTC(2026, 10, 22, 23, 30);
    expect(trWeekday(trDay(now))).toBe(1);
    expect(workState(base, now).phase).toBe('before');
  });

  it('is a pure function of now: recomputing after a reload gives the same value', () => {
    const now = MON(15, 12, 7);
    expect(workState(JSON.parse(JSON.stringify(base)) as WorkConfig, now)).toEqual(workState(base, now));
  });

  describe('overnight shift 22:00–06:00 with lunch at 02:00', () => {
    const night: WorkConfig = { ...base, startMin: 22 * 60, endMin: 6 * 60, lunchStartMin: 2 * 60, lunchMin: 30 };

    it('validates and has 7.5 net hours', () => {
      expect(validateWork(night)).toBeNull();
      expect(netDailyHours(night)).toBe(7.5);
    });

    it('keeps counting across midnight', () => {
      const s = workState(night, tr(2026, 11, 24, 1, 0)); // Tue 01:00, shift began Mon 22:00
      expect(s.phase).toBe('working');
      expect(s.workedMs).toBe(3 * 3_600_000);
      expect(s.remainingMs).toBe(5 * 3_600_000);
    });

    it('lunch after midnight is a break', () => {
      expect(workState(night, tr(2026, 11, 24, 2, 15)).phase).toBe('break');
    });

    it('next morning the shift that began yesterday is done; the day counts towards the next one', () => {
      expect(workState(night, tr(2026, 11, 24, 5, 59)).phase).toBe('working');
      const s = workState(night, tr(2026, 11, 24, 6, 0));
      expect(s.phase).toBe('before');
      expect(s.earned).toBe(0);
    });

    it('Friday night shift running into Saturday still pays; Sunday night shift is weekend', () => {
      expect(workState(night, tr(2026, 11, 28, 1, 0)).phase).toBe('working'); // Sat 01:00, Fri shift
      expect(workState(night, tr(2026, 11, 29, 23, 0)).phase).toBe('weekend'); // Sun 23:00
    });
  });
});

describe('validateWork', () => {
  it('rejects bad inputs', () => {
    expect(validateWork(base)).toBeNull();
    expect(validateWork({ ...base, monthlySalary: 0 })).toBe('salary');
    expect(validateWork({ ...base, monthlySalary: NaN })).toBe('salary');
    expect(validateWork({ ...base, workDays: 0 })).toBe('workDays');
    expect(validateWork({ ...base, endMin: base.startMin })).toBe('shift');
    expect(validateWork({ ...base, lunchMin: 9 * 60 })).toBe('lunch');
    expect(validateWork({ ...base, lunchStartMin: 17 * 60 + 30 })).toBe('lunch'); // runs past 18:00
  });
});

describe('parsers', () => {
  it('parses HH:MM', () => {
    expect(parseTime('09:30')).toBe(570);
    expect(parseTime('9:05')).toBe(545);
    expect(parseTime('24:00')).toBeNaN();
    expect(parseTime('abc')).toBeNaN();
  });

  it('parses Turkish-formatted amounts', () => {
    expect(parseTrNumber('45.000')).toBe(45_000);
    expect(parseTrNumber('45000')).toBe(45_000);
    expect(parseTrNumber('45.000,50')).toBe(45_000.5);
    expect(parseTrNumber('1.250.000 ₺')).toBe(1_250_000);
    expect(parseTrNumber('45.5')).toBeNaN();
    expect(parseTrNumber('')).toBeNaN();
  });
});

describe('earnedSince (weekly / monthly estimate)', () => {
  const rate = 45_000 / 176;
  it('Monday 14:30 since Monday = 4.5 h', () => {
    expect(earnedSince(base, trDay(MON(0)), MON(14, 30))).toBeCloseTo(4.5 * rate, 6);
  });
  it('Wednesday 10:00 since Monday = 2 full days + 1 h, weekends add nothing', () => {
    expect(earnedSince(base, trDay(MON(0)), tr(2026, 11, 25, 10))).toBeCloseTo(17 * rate, 4);
    expect(earnedSince(base, trDay(MON(0)) - 2, MON(9))).toBeCloseTo(0, 6); // Sat + Sun + Monday at 9:00
  });
});

describe('workMilestones', () => {
  it('reports wins in order and needs a coffee price for the coffee one', () => {
    const w = workState(base, MON(14)); // 4 h worked (lunch 12–13)
    expect(workMilestones(base, w, null)).toEqual(['quarter', 'half']);
    expect(workMilestones(base, w, 90)).toEqual(['coffee', 'quarter', 'half']);
    expect(workMilestones(base, workState(base, MON(12, 15)), null)).toContain('lunch');
    expect(workMilestones(base, workState(base, MON(18)), null)).toContain('done');
    expect(workMilestones(base, workState(base, tr(2026, 11, 28, 12)), 90)).toEqual([]);
  });
});

describe('equivalents', () => {
  it('only counts items with a price and at least one whole item', () => {
    expect(equivalents(1150, { coffee: 90, simit: 20, tea: null, subscription: 2000 })).toEqual([
      { key: 'coffee', n: 12 },
      { key: 'simit', n: 57 },
    ]);
  });
});

describe('parseEnNumber', () => {
  it('parses English-formatted amounts', () => {
    expect(parseEnNumber('45,000')).toBe(45_000);
    expect(parseEnNumber('45000.5')).toBe(45_000.5);
    expect(parseEnNumber('1,250,000.25 ₺')).toBe(1_250_000.25);
    expect(parseEnNumber('45.000,50')).toBeNaN();
  });
});
