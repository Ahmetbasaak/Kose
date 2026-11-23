import { openDB, type IDBPDatabase } from 'idb';
import type { SessionSummary } from './session';

/** Finished sessions, newest last. IndexedDB because this list only grows (history view lands in phase 5). */
let dbPromise: Promise<IDBPDatabase> | null = null;
const db = () =>
  (dbPromise ??= openDB('kose', 1, {
    upgrade(d) {
      d.createObjectStore('sessions', { keyPath: 'id', autoIncrement: true }).createIndex('endedAt', 'endedAt');
    },
  }));

export async function addRecord(s: SessionSummary): Promise<void> {
  await (await db()).add('sessions', s);
}

/** Sessions that ended in [from, to). */
export async function recordsBetween(from: number, to: number): Promise<SessionSummary[]> {
  return (await db()).getAllFromIndex('sessions', 'endedAt', IDBKeyRange.bound(from, to, false, true));
}
