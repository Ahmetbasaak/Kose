import { beforeEach, describe, expect, it } from 'vitest';
import { useProStore } from '../src/app/entitlements';
import { activateLicense, noProvider, type LicenseAdapter } from '../src/app/license';

const fake = (activate: LicenseAdapter['activate']): LicenseAdapter => ({ name: 'Test', checkoutUrl: null, activate });

describe('activateLicense', () => {
  beforeEach(() => useProStore.getState().revoke());

  it('without a provider nothing unlocks', async () => {
    expect(await activateLicense('ABCD-1234-EFGH', noProvider)).toEqual({ ok: false, reason: 'not-configured' });
    expect(useProStore.getState().pro).toBe(false);
  });

  it('rejects malformed keys before calling the provider', async () => {
    let called = false;
    const a = fake(async () => ((called = true), { ok: true, expiresAt: null }));
    expect(await activateLicense('  <script>  ', a)).toEqual({ ok: false, reason: 'invalid' });
    expect(called).toBe(false);
  });

  it('grants Pro on success, with source "license"', async () => {
    await activateLicense(
      ' ABCD-1234-EFGH ',
      fake(async () => ({ ok: true, expiresAt: null })),
    );
    expect(useProStore.getState()).toMatchObject({ pro: true, source: 'license' });
  });

  it('a throwing adapter is a network failure, not a crash or an unlock', async () => {
    const r = await activateLicense(
      'ABCD-1234-EFGH',
      fake(async () => {
        throw new Error('offline');
      }),
    );
    expect(r).toEqual({ ok: false, reason: 'network' });
    expect(useProStore.getState().pro).toBe(false);
  });
});
