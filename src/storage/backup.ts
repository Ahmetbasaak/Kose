import type { SessionSummary } from './session';

/** Everything the app keeps lives under this localStorage prefix (plus the IndexedDB history). */
const PREFIX = 'kose.';
// Entitlement is not user data: a shared backup file must never carry Pro to another device.
const EXCLUDED = new Set(['kose.pro']);

export interface Backup {
  app: 'kose';
  version: 1;
  exportedAt: number;
  localStorage: Record<string, string>;
  history: SessionSummary[];
}

export function collectLocalStorage(storage: Storage): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < storage.length; i++) {
    const k = storage.key(i)!;
    if (k.startsWith(PREFIX) && !EXCLUDED.has(k)) out[k] = storage.getItem(k)!;
  }
  return out;
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Untrusted file → Backup, or null. Checks shape, keys and that every stored value is valid JSON. */
export function parseBackup(text: string): Backup | null {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  if (!isRecord(data) || data.app !== 'kose' || data.version !== 1) return null;
  const ls = data.localStorage;
  const history = data.history;
  if (!isRecord(ls) || !Array.isArray(history)) return null;
  for (const [k, v] of Object.entries(ls)) {
    if (!k.startsWith(PREFIX) || EXCLUDED.has(k) || typeof v !== 'string') return null;
    try {
      JSON.parse(v);
    } catch {
      return null;
    }
  }
  const ok = history.every(
    (r) =>
      isRecord(r) &&
      typeof r.modeId === 'string' &&
      typeof r.label === 'string' &&
      typeof r.elapsedMs === 'number' &&
      typeof r.startedAt === 'number' &&
      typeof r.endedAt === 'number',
  );
  if (!ok) return null;
  return {
    app: 'kose',
    version: 1,
    exportedAt: typeof data.exportedAt === 'number' ? data.exportedAt : 0,
    localStorage: ls as Record<string, string>,
    history: history as SessionSummary[],
  };
}

/** Removes every app key except the entitlement (deleting data must not revoke a paid licence). */
export function clearLocalStorage(storage: Storage): void {
  for (const k of Object.keys(collectLocalStorage(storage))) storage.removeItem(k);
}
