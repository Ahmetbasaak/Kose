import { useEffect } from 'react';
import { create } from 'zustand';
import { Link } from 'react-router';
import { useNow } from '../components/useNow';
import { netDailyHours, workMilestones, workState, type Milestone } from '../engine/work';
import { t } from '../i18n';
import { usePrefsStore } from '../storage/prefs';
import { useSessionStore } from '../storage/session';
import { recordSummary } from './actions';
import styles from './Layout.module.css';

const SHOW_MS = 6000;

const useToast = create<{ toast: { text: string; summary: boolean } | null }>(() => ({ toast: null }));
const setToast = (toast: { text: string; summary: boolean } | null) => useToast.setState({ toast });

/**
 * Work mode's day rhythm, whether the work timer is in front or counted in the background:
 * small cheers at milestones and an automatic day summary in history when the shift ends.
 */
export function WorkRunner() {
  const active = useSessionStore((s) => s.active);
  const { workBackground, lastWork, coffeePrice } = usePrefsStore();
  const config = active?.kind === 'work' ? active.work : workBackground ? lastWork : null;
  const now = useNow(1000, window, !!config);
  const toast = useToast((s) => s.toast);

  useEffect(() => {
    if (!config) return;
    const w = workState(config, now);
    const prefs = usePrefsStore.getState();
    const done = prefs.milestones.day === w.shiftDay ? prefs.milestones.done : [];
    const fresh = workMilestones(config, w, coffeePrice).filter((m) => !done.includes(m));
    if (fresh.length) {
      prefs.set({ milestones: { day: w.shiftDay, done: [...done, ...fresh] } });
      // Several at once (app opened late): cheer only the latest, quietly mark the rest.
      const latest: Milestone = fresh[fresh.length - 1]!;
      if (latest !== 'done') setToast({ text: t(`work.milestones.${latest}`), summary: false });
    }
    if (w.phase === 'after' && prefs.workRecordedDay !== w.shiftDay) {
      const summary = {
        modeId: 'work' as const,
        kind: 'work' as const,
        label: t('modes.work.title'),
        elapsedMs: w.workedMs,
        earned: w.earned,
        totalMs: netDailyHours(config) * 3_600_000,
        shiftDay: w.shiftDay,
        startedAt: now - w.workedMs,
        endedAt: now,
      };
      recordSummary(summary);
      useSessionStore.setState({ lastSummary: summary });
      setToast({ text: t('work.dayDone'), summary: true });
    }
  }, [config, now, coffeePrice]);

  useEffect(() => {
    if (!toast || toast.summary) return;
    const id = setTimeout(() => setToast(null), SHOW_MS);
    return () => clearTimeout(id);
  }, [toast]);

  if (!toast) return null;
  return (
    <div role="status" className={`${styles.alert} ${styles.cheer}`}>
      <p>
        {toast.text} {toast.summary && <Link to="/ozet">{t('work.seeSummary')}</Link>}
      </p>
      <button type="button" className={styles.alertBtn} onClick={() => setToast(null)}>
        {t('alert.dismiss')}
      </button>
    </div>
  );
}
