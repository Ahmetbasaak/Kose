import { useNavigate } from 'react-router';
import { closePip, isPipSupported, openPip } from '../components/corner/pip';
import { t } from '../i18n';
import { addRecord } from '../storage/history';
import { useSessionStore, type StartInput } from '../storage/session';
import { requestNotificationPermission } from './alerts';

const isNarrow = () => window.matchMedia('(max-width: 639px)').matches;

/**
 * Shows the running session "in the corner": PiP window when supported,
 * the full-page view on phones, otherwise the in-page floating widget (rendered by CornerHost).
 */
export function useLaunchCorner() {
  const navigate = useNavigate();
  return async () => {
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
    await launch();
    // After the PiP request: both need the click's user activation and PiP must go first.
    if (opts.askNotify) requestNotificationPermission();
  };
}

export function useFinishSession() {
  const navigate = useNavigate();
  const finish = useSessionStore((s) => s.finish);
  return () => {
    const summary = finish();
    // History is a bonus: private mode or a full disk must not block finishing.
    if (summary) addRecord(summary).catch(() => undefined);
    closePip();
    window.focus();
    // A calendar countdown has nothing to summarise; go back to the list.
    void navigate(summary?.kind === 'target' ? '/mod/geri-sayim' : '/ozet');
  };
}
