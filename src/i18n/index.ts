import { config } from '../app/config';
import { tr, type Dictionary } from './tr';

type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>;
}[keyof T & string];

export type MessageKey = Leaves<Dictionary>;

// shortcut: single locale, picked at build time; add a locale switch when EN lands.
const dict: Dictionary = tr;

export function t(key: MessageKey, vars: Record<string, string | number> = {}): string {
  const value = key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown>)[part], dict);
  const all: Record<string, string | number> = { brand: config.name, ...vars };
  return (value as string).replace(/\{(\w+)\}/g, (m, name: string) => String(all[name] ?? m));
}
