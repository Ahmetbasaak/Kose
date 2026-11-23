import { beforeEach, describe, expect, it } from 'vitest';
import { tryDevUnlock, useProStore } from '../src/app/entitlements';

describe('dev unlock', () => {
  beforeEach(() => useProStore.getState().revoke());

  it('does nothing without a build-time key', () => {
    tryDevUnlock('?gelistirici=', undefined);
    tryDevUnlock('?gelistirici=undefined', undefined);
    expect(useProStore.getState().pro).toBe(false);
  });

  it('needs the exact key', () => {
    tryDevUnlock('?gelistirici=nope', 's3cret');
    expect(useProStore.getState().pro).toBe(false);
    tryDevUnlock('?gelistirici=s3cret', 's3cret');
    expect(useProStore.getState()).toMatchObject({ pro: true, source: 'dev' });
  });
});
