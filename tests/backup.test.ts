import { describe, expect, it } from 'vitest';
import { clearLocalStorage, collectLocalStorage, parseBackup } from '../src/storage/backup';

class MemStorage implements Storage {
  private m = new Map<string, string>();
  get length() {
    return this.m.size;
  }
  key = (i: number) => [...this.m.keys()][i] ?? null;
  getItem = (k: string) => this.m.get(k) ?? null;
  setItem = (k: string, v: string) => void this.m.set(k, v);
  removeItem = (k: string) => void this.m.delete(k);
  clear = () => this.m.clear();
}

const valid = {
  app: 'kose',
  version: 1,
  exportedAt: 1,
  localStorage: { 'kose.prefs': '{"state":{}}' },
  history: [{ modeId: 'simple', kind: 'stopwatch', label: 'X', elapsedMs: 1000, startedAt: 0, endedAt: 1000 }],
};

describe('backup', () => {
  it('collects only app keys and never the Pro entitlement', () => {
    const s = new MemStorage();
    s.setItem('kose.prefs', '{}');
    s.setItem('kose.pro', '{"state":{"pro":true}}');
    s.setItem('other-site', 'x');
    expect(Object.keys(collectLocalStorage(s))).toEqual(['kose.prefs']);
  });

  it('accepts a well-formed backup', () => {
    expect(parseBackup(JSON.stringify(valid))?.history).toHaveLength(1);
  });

  it('rejects files that are not ours or are tampered with', () => {
    const bad = (patch: object) => parseBackup(JSON.stringify({ ...valid, ...patch }));
    expect(parseBackup('not json')).toBeNull();
    expect(bad({ app: 'other' })).toBeNull();
    expect(bad({ version: 2 })).toBeNull();
    expect(bad({ localStorage: { 'kose.pro': '{"state":{"pro":true}}' } })).toBeNull(); // can't smuggle Pro in
    expect(bad({ localStorage: { 'evil-key': '{}' } })).toBeNull();
    expect(bad({ localStorage: { 'kose.prefs': 'not json' } })).toBeNull();
    expect(bad({ history: [{ label: 'x' }] })).toBeNull();
  });

  it('wiping keeps the entitlement and other sites’ data', () => {
    const s = new MemStorage();
    s.setItem('kose.prefs', '{}');
    s.setItem('kose.pro', '{}');
    s.setItem('other-site', 'x');
    clearLocalStorage(s);
    expect([s.getItem('kose.prefs'), s.getItem('kose.pro'), s.getItem('other-site')]).toEqual([null, '{}', 'x']);
  });
});
