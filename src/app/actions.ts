import { useNavigate } from 'react-router';
import { closePip, isPipSupported, openPip } from '../components/corner/pip';
import { t } from '../i18n';
import { useFreelanceStore } from '../storage/freelance';
import { usePrefsStore } from '../storage/prefs';
import { addRecord } from '../storage/history';
import { summarize, useSessionStore, type SessionSummary, type StartInput } from '../storage/session';
import { requestNotificationPermission } from './alerts';

const isNarrow = () => window.matchMedia('(max-width: 639px)').matches;

/**
 * Shows the running session "in the corner": PiP window when supported,
 * the full-page view on phones, otherwise the in-page floating widget (rendered by CornerHost).
 */
export function useLaunchCorner() {
  const navigate = useNavigate();
  return async () => {
    // Setting off: show the big full-page timer instead of the corner window.
    if (!usePrefsStore.getState().openCornerOnStart) return void navigate('/sayac');
    if (isPipSupported()) {
      try {
        await openPip();
        return;
      } catch {
        // Denied or no user activation: fall back below.
      }
    }
    if (isNarrow()) void navigate('/sayac');
  };
}

/** Start a session from a setup form (click handler): confirm replacing a running one, then show it in the corner. */
export function useStartSession() {
  const start = useSessionStore((s) => s.start);
  const launch = useLaunchCorner();
  return async (input: StartInput, opts: { askNotify?: boolean } = {}) => {
    if (useSessionStore.getState().active && !window.confirm(t('setup.replaceConfirm'))) return;
    start(input);
    usePrefsStore.getState().set({ lastStart: input });
    await launch();
    // After the PiP request: both need the click's user activation and PiP must go first.
    if (opts.askNotify) requestNotificationPermission();
  };
}

/** Persist a finished session: history DB, plus a time entry for a freelance project. */
export function recordSummary(s: SessionSummary): void {
  if (s.kind === 'work' && s.shiftDay != null) {
    // The day may already be saved automatically at shift end.
    if (usePrefsStore.getState().workRecordedDay === s.shiftDay) return;
    usePrefsStore.getState().set({ workRecordedDay: s.shiftDay });
  }
  // History is a bonus: private mode or a full disk must not block finishing.
  addRecord(s).catch(() => undefined);
  if (s.modeId === 'freelance' && s.projectId)
    useFreelanceStore
      .getState()
      .addEntry({ projectId: s.projectId, startedAt: s.startedAt, endedAt: s.endedAt, elapsedMs: s.elapsedMs });
}

/** Swap the running session for another without asking or closing the corner, saving the old one's time. */
export function switchSession(input: StartInput): void {
  const current = useSessionStore.getState().active;
  if (current) recordSummary(summarize(current, Date.now()));
  useSessionStore.getState().start(input);
  usePrefsStore.getState().set({ lastStart: input });
}

const afterFinish = (s: SessionSummary | null) =>
  // A calendar countdown has nothing to summarise; a freelance stop returns to the project list.
  s?.kind === 'target' ? '/mod/geri-sayim' : s?.modeId === 'freelance' ? '/mod/serbest' : '/ozet';

export function useFinishSession() {
  const navigate = useNavigate();
  const finish = useSessionStore((s) => s.finish);
  return () => {
    const summary = finish();
    if (summary) recordSummary(summary);
    closePip();
    window.focus();
    void navigate(afterFinish(summary));
  };
}
