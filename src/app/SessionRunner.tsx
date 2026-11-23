import { useEffect } from 'react';
import { usePipStore } from '../components/corner/pip';
import { useNow } from '../components/useNow';
import { finishAt } from '../engine/timer';
import { t } from '../i18n';
import { useSessionStore } from '../storage/session';
import { notify, playChime } from './alerts';
import styles from './Layout.module.css';

/** Alerts slower than this after the real end were missed (page closed): show in-page only, no sound. */
const MISSED_AFTER_MS = 5000;

export function SessionRunner() {
  const active = useSessionStore((s) => s.active);
  const markAlerted = useSessionStore((s) => s.markAlerted);
  const dismissAlert = useSessionStore((s) => s.dismissAlert);
  const pipWin = usePipStore((s) => s.win);
  const watching = active?.kind === 'countdown' && active.alertedAt === null;
  const now = useNow(250, pipWin ?? window, watching);

  useEffect(() => {
    if (!watching || active.durationMs === null) return;
    const end = finishAt(active.timer, active.durationMs);
    if (end === null || now < end) return;
    markAlerted(now);
    if (now - end > MISSED_AFTER_MS) return;
    playChime();
    notify(t('alert.doneTitle'), t('alert.doneBody', { label: active.label }));
  }, [watching, active, now, markAlerted]);

  if (!active?.alertedAt || active.alertDismissed) return null;
  return (
    <div role="alert" className={styles.alert}>
      <p>
        <strong>{t('alert.doneTitle')}.</strong> {t('alert.doneBody', { label: active.label })}
      </p>
      <button type="button" className={styles.alertBtn} onClick={dismissAlert}>
        {t('alert.dismiss')}
      </button>
    </div>
  );
}
