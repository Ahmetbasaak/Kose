import { deleteDB, openDB, type IDBPDatabase } from 'idb';
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

export async function allRecords(): Promise<SessionSummary[]> {
  return (await db()).getAll('sessions');
}

/** Swap the whole history (restore from backup) in one transaction. */
export async function replaceRecords(records: SessionSummary[]): Promise<void> {
  const tx = (await db()).transaction('sessions', 'readwrite');
  await tx.store.clear();
  for (const r of records) await tx.store.add(r);
  await tx.done;
}

export async function deleteHistory(): Promise<void> {
  (await dbPromise)?.close();
  dbPromise = null;
  await deleteDB('kose');
}
