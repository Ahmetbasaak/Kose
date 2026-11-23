/**
 * Payment-provider boundary. v1 ships with no provider; pick one (Lemon Squeezy, Paddle, Gumroad…)
 * by writing one adapter object and assigning it to `licenseAdapter`. Nothing else changes.
 *
 * Without a backend the adapter runs in the browser, so only providers with a public
 * license-key activation/validation endpoint fit (e.g. Lemon Squeezy License API, Gumroad
 * license verify). Remember to allow that host in the CSP `connect-src` (public/_headers, vercel.json).
 */
import { useProStore } from './entitlements';

export type LicenseFailure = 'not-configured' | 'invalid' | 'expired' | 'network';

export type LicenseResult = { ok: true; expiresAt: number | null } | { ok: false; reason: LicenseFailure };

export interface LicenseAdapter {
  /** Shown in settings, e.g. "Lemon Squeezy". */
  name: string;
  /** Where the "Pro'yu satın al" button goes; null hides it. */
  checkoutUrl: string | null;
  /** Activate a key the user pasted (one call to the provider). */
  activate(key: string): Promise<LicenseResult>;
}

/** Default until a provider is chosen: every activation fails with 'not-configured'. */
export const noProvider: LicenseAdapter = {
  name: '',
  checkoutUrl: null,
  activate: async () => ({ ok: false, reason: 'not-configured' }),
};

// The single switch for the payment provider.
export const licenseAdapter: LicenseAdapter = noProvider;

const KEY_SHAPE = /^[A-Za-z0-9-]{8,128}$/;

/** Validates the key's shape, asks the adapter, and grants Pro only on success. */
export async function activateLicense(
  rawKey: string,
  adapter: LicenseAdapter = licenseAdapter,
): Promise<LicenseResult> {
  const key = rawKey.trim();
  if (!KEY_SHAPE.test(key)) return { ok: false, reason: 'invalid' };
  let result: LicenseResult;
  try {
    result = await adapter.activate(key);
  } catch {
    result = { ok: false, reason: 'network' };
  }
  if (result.ok) useProStore.getState().grant('license');
  return result;
}
