import { config } from '../app/config';
import { setNumberLocale } from '../engine/format';
import { parseEnNumber, parseTrNumber } from '../engine/work';
import { en } from './en';
import { tr, type Dictionary } from './tr';

type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>;
}[keyof T & string];

export type MessageKey = Leaves<Dictionary>;
export type Lang = 'tr' | 'en';

const KEY = 'kose.lang';

/** Saved choice, else the browser language (Turkish browsers get Turkish, everyone else English). */
function detect(): Lang {
  if (typeof window === 'undefined') return 'tr'; // tests and tooling
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null') as unknown;
    if (saved === 'tr' || saved === 'en') return saved;
  } catch {
    // Storage blocked: fall back to the browser language.
  }
  return navigator.language.toLowerCase().startsWith('tr') ? 'tr' : 'en';
}

// shortcut: language is fixed per page load (switching reloads); make it reactive if live switching is ever needed.
export const lang: Lang = detect();
/** For Intl date/number formatting. Times stay in Turkey time either way. */
export const LOCALE = lang === 'tr' ? 'tr-TR' : 'en-GB';
export const brandName = lang === 'tr' ? config.name : config.nameEn;
setNumberLocale(LOCALE);

const dict: Dictionary = lang === 'en' ? en : tr;

export function setLang(l: Lang): void {
  localStorage.setItem(KEY, JSON.stringify(l)); // JSON, like every other kose.* key (backups expect it)
  location.reload();
}

/** Money/number input in the user's language: "45.000,50" in Turkish, "45,000.50" in English. */
export const parseAmount = (v: string) => (lang === 'en' ? parseEnNumber(v) : parseTrNumber(v));

export function t(key: MessageKey, vars: Record<string, string | number> = {}): string {
  const value = key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown>)[part], dict);
  const all: Record<string, string | number> = { brand: brandName, ...vars };
  return (value as string).replace(/\{(\w+)\}/g, (m, name: string) => String(all[name] ?? m));
}
