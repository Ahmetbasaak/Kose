/**
 * Turkish public holidays for any year, computed offline (no API, no yearly data entry):
 * - fixed-date holidays from Law 2429 by rule;
 * - Ramazan and Kurban Bayramı from the Islamic (Umm al-Qura) calendar built into Intl,
 *   which matched every Diyanet date for 2023–2027. Diyanet may still differ by a day in some
 *   year; such a date goes into holidays.tr.json `overrides`.
 */
import { parseIsoDate, trMidnight, trYmd } from '../engine/calendar';
import { TR_OFFSET_MS, trDay } from '../engine/work';
import { t, type MessageKey } from '../i18n';
import data from './holidays.tr.json';

export type HolidaySource = 'law' | 'calculated' | 'official';

export interface Holiday {
  id: string;
  name: string;
  /** 00:00 Turkey time of the first day. */
  at: number;
  days: number;
  /** 'calculated' dates may differ from Diyanet's announcement by a day. */
  source: HolidaySource;
}

export interface Override {
  id: string;
  start: string;
}

const DAY = 86_400_000;

const FIXED: [slug: string, m: number, d: number][] = [
  ['yilbasi', 1, 1],
  ['23-nisan', 4, 23],
  ['1-mayis', 5, 1],
  ['19-mayis', 5, 19],
  ['15-temmuz', 7, 15],
  ['30-agustos', 8, 30],
  ['29-ekim', 10, 29],
];

/** [slug, Islamic month, day, length in days] */
const RELIGIOUS: [string, number, number, number][] = [
  ['ramazan', 10, 1, 3],
  ['kurban', 12, 10, 4],
];

const nameOf = (slug: string) => t(`holidays.${slug}` as MessageKey);

const islamic = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
  day: 'numeric',
  month: 'numeric',
  timeZone: 'UTC',
});
// Browsers without this calendar silently fall back to Gregorian; then only overrides cover bayrams.
const hasIslamic = islamic.resolvedOptions().calendar === 'islamic-umalqura';

function islamicMonthDay(utcMidnight: number): [number, number] {
  const p = islamic.formatToParts(utcMidnight);
  return [Number(p.find((x) => x.type === 'month')?.value), Number(p.find((x) => x.type === 'day')?.value)];
}

/** Holidays that overlap [from, to), soonest first. */
export function holidaysBetween(from: number, to: number, overrides: readonly Override[] = []): Holiday[] {
  const out: Holiday[] = [];
  const firstYear = trYmd(from).y - 1;
  const lastYear = trYmd(to).y;
  for (let y = firstYear; y <= lastYear; y++)
    for (const [slug, m, d] of FIXED)
      out.push({ id: `${slug}-${y}`, name: nameOf(slug), at: trMidnight(y, m, d), days: 1, source: 'law' });

  if (hasIslamic)
    // Day by day: a Gregorian year can hold the same bayram twice (e.g. Ramazan Bayramı in 2033).
    for (let day = trDay(from) - 5; day <= trDay(to); day++) {
      const [im, id] = islamicMonthDay(day * DAY);
      for (const [slug, hm, hd, days] of RELIGIOUS)
        if (im === hm && id === hd) {
          const at = day * DAY - TR_OFFSET_MS;
          out.push({ id: `${slug}-${trYmd(at).y}`, name: nameOf(slug), at, days, source: 'calculated' });
        }
    }

  for (const o of overrides) {
    const ymd = parseIsoDate(o.start);
    const i = out.findIndex((h) => h.id === o.id);
    if (!ymd || i < 0) continue;
    out[i] = { ...out[i]!, at: trMidnight(ymd.y, ymd.m, ymd.d), source: 'official' };
  }
  return out.filter((h) => h.at + h.days * DAY > from && h.at < to).sort((a, b) => a.at - b.at);
}

let cache: { day: number; list: Holiday[] } | null = null;

/** Holidays not over yet, for the next two years. Cached per day: the list only changes at midnight. */
export function upcomingHolidays(now: number): Holiday[] {
  const day = trDay(now);
  if (cache?.day !== day) cache = { day, list: holidaysBetween(now, now + 730 * DAY, data.overrides) };
  return cache.list;
}
