import { useEffect } from 'react';
import { usePipStore } from '../components/corner/pip';
import { useNow } from '../components/useNow';
import { usePrefsStore } from '../storage/prefs';
import { useSessionStore } from '../storage/session';
import { config } from './config';
import { applyAppearance } from './appearance';
import { sessionDisplay } from './sessionView';

/** Page-level side effects of a running session and appearance settings. Renders nothing. */
export function SessionChrome() {
  const { appTheme, reduceMotion, titleTimer, keepAwake } = usePrefsStore();
  const active = useSessionStore((s) => s.active);
  const pipWin = usePipStore((s) => s.win);
  const showTitle = titleTimer && active !== null;
  const now = useNow(1000, window, showTitle);

  useEffect(() => {
    applyAppearance(appTheme, reduceMotion, pipWin ? [document, pipWin.document] : [document]);
  }, [appTheme, reduceMotion, pipWin]);

  const title = showTitle ? `${sessionDisplay(active, now).value} · ${config.name}` : config.name;
  useEffect(() => {
    document.title = title;
  }, [title]);

  const awake = keepAwake && active !== null;
  useEffect(() => {
    if (!awake || !('wakeLock' in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    const request = () => {
      // The browser drops the lock when the tab is hidden; take it again on return.
      if (document.visibilityState === 'visible')
        navigator.wakeLock.request('screen').then(
          (l) => (lock = l),
          () => undefined,
        );
    };
    request();
    document.addEventListener('visibilitychange', request);
    return () => {
      document.removeEventListener('visibilitychange', request);
      void lock?.release();
    };
  }, [awake]);

  return null;
}
