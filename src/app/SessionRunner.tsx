import { useEffect } from 'react';
import { usePipStore } from '../components/corner/pip';
import { useNow } from '../components/useNow';
import { focusEndsBetween } from '../engine/cycles';
import { trDay } from '../engine/work';
import { t } from '../i18n';
import { usePrefsStore } from '../storage/prefs';
import { useSessionStore } from '../storage/session';
import { notify, playChime } from './alerts';
import { sessionEvents } from './sessionView';
import styles from './Layout.module.css';

/** Alerts slower than this after the real moment were missed (page closed): show in-page only, no sound. */
const MISSED_AFTER_MS = 5000;

export function SessionRunner() {
  const active = useSessionStore((s) => s.active);
  const markAlerted = useSessionStore((s) => s.markAlerted);
  const dismissAlert = useSessionStore((s) => s.dismissAlert);
  const addStudyDay = usePrefsStore((s) => s.addStudyDay);
  const addPomodoros = usePrefsStore((s) => s.addPomodoros);
  const pipWin = usePipStore((s) => s.win);
  const watching = active !== null && ['countdown', 'cycle', 'target', 'sections'].includes(active.kind);
  const now = useNow(250, pipWin ?? window, watching);
  const ev = active && watching ? sessionEvents(active, now) : null;

  useEffect(() => {
    if (!active || !ev || ev.count <= active.alerts) return;
    // Finished focus blocks feed the study streak and today's Pomodoro count.
    const finishedFocus = active.modeId === 'student' ? focusEndsBetween(active.alerts, ev.count) : 0;
    if (finishedFocus > 0) {
      addStudyDay(trDay(now));
      addPomodoros(trDay(now), finishedFocus);
    }
    markAlerted(ev.count);
    if (now - ev.lastAt > MISSED_AFTER_MS) return;
    playChime(ev.gentle ? 1 : 3);
    notify(ev.gentle ? ev.message : t('alert.doneTitle'), ev.gentle ? '' : ev.message);
  }, [active, ev, now, markAlerted, addStudyDay, addPomodoros]);

  if (!active || !ev || active.alerts === 0 || active.alertDismissed) return null;
  return (
    // Gentle reminders must not interrupt a screen reader; "time is up" may.
    <div role={ev.gentle ? 'status' : 'alert'} className={styles.alert}>
      <p>
        {!ev.gentle && <strong>{t('alert.doneTitle')}. </strong>}
        {ev.message}
      </p>
      <button type="button" className={styles.alertBtn} onClick={dismissAlert}>
        {t('alert.dismiss')}
      </button>
    </div>
  );
}
