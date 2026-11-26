import { describe, expect, it } from 'vitest';
import { modes } from '../src/modes/registry';
import { MODES, parseEvent, statsQueries } from '../worker/events';

const ok = {
  event: 'finish',
  mode: 'work',
  path: '/mod/mesai',
  lang: 'tr',
  device: 'desktop',
  display: 'app',
  seconds: 3600.4,
};

describe('usage events', () => {
  it('worker mode list matches the app registry', () => {
    expect([...MODES].sort()).toEqual(modes.map((m) => m.id).sort());
  });

  it('keeps only the allowed fields', () => {
    expect(parseEvent({ ...ok, ip: '1.2.3.4', email: 'a@b.c', userAgent: 'x' })).toEqual({ ...ok, seconds: 3600 });
  });

  it('rejects anything odd', () => {
    expect(parseEvent(null)).toBeNull();
    expect(parseEvent({ ...ok, event: 'login' })).toBeNull();
    expect(parseEvent({ ...ok, mode: 'evil' })).toBeNull();
    expect(parseEvent({ ...ok, path: '/sayim?ad=Doğum günüm' })).toBeNull(); // query strings never accepted
    expect(parseEvent({ ...ok, path: 'https://x.dev/' })).toBeNull();
    expect(parseEvent({ ...ok, seconds: -1 })).toBeNull();
    expect(parseEvent({ ...ok, seconds: 1e12 })).toBeNull();
    expect(parseEvent({ ...ok, lang: 'de' })).toBeNull();
  });

  it('visit without a mode is fine', () => {
    expect(parseEvent({ event: 'visit', path: '/', lang: 'en', device: 'mobile', display: 'browser' })).toMatchObject({
      event: 'visit',
      mode: '',
      seconds: 0,
    });
  });

  it('stats queries clamp the day range (no SQL injection through ?days=)', () => {
    expect(statsQueries('ds', 9999).daily).toContain("INTERVAL '90' DAY");
    expect(statsQueries('ds', Number('1; DROP')).daily).toContain("INTERVAL '30' DAY");
  });
});
