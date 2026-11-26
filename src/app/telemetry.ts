import type { StatEvent } from '../../worker/events';
import { lang } from '../i18n';
import type { ModeId } from '../modes/registry';
import { usePrefsStore } from '../storage/prefs';
import { isStandalone } from './install';

/** Browser-level opt-out: Global Privacy Control or Do Not Track. */
const browserOptOut = () =>
  (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true ||
  navigator.doNotTrack === '1';

/**
 * Fire-and-forget anonymous count. Only the fields in StatEvent leave the device:
 * no amounts, labels, notes or ids. Production builds only.
 */
export function track(event: StatEvent['event'], extra: { mode?: ModeId; seconds?: number } = {}): void {
  if (!import.meta.env.PROD || !usePrefsStore.getState().stats || browserOptOut()) return;
  const body: StatEvent = {
    event,
    mode: extra.mode ?? '',
    // Path only: query strings can hold a shared countdown's title.
    path:
      location.pathname
        .toLowerCase()
        .replace(/[^a-z0-9/-]/g, '')
        .slice(0, 80) || '/',
    lang,
    device: matchMedia('(max-width: 639px)').matches ? 'mobile' : 'desktop',
    display: isStandalone() ? 'app' : 'browser',
    seconds: Math.round(extra.seconds ?? 0),
  };
  try {
    navigator.sendBeacon?.('/api/e', new Blob([JSON.stringify(body)], { type: 'application/json' }));
  } catch {
    // Counting is never worth an error.
  }
}
