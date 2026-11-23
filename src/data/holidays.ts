import { parseIsoDate, trMidnight } from '../engine/calendar';
import data from './holidays.tr.json';

export interface Holiday {
  id: string;
  name: string;
  /** 00:00 Turkey time of the first day. */
  at: number;
  days: number;
  verified: boolean;
}

const DAY = 86_400_000;

export const holidays: Holiday[] = data.holidays.map((h) => {
  const ymd = parseIsoDate(h.start);
  if (!ymd) throw new Error(`holidays.tr.json: bad date ${h.start}`);
  return { id: h.id, name: h.name, days: h.days, verified: h.verified, at: trMidnight(ymd.y, ymd.m, ymd.d) };
});

/** Holidays not over yet, soonest first. */
export const upcomingHolidays = (now: number) =>
  holidays.filter((h) => h.at + h.days * DAY > now).sort((a, b) => a.at - b.at);
