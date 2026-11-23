import { useNavigate } from 'react-router';
import { closePip, isPipSupported, openPip } from '../components/corner/pip';
import { useSessionStore } from '../storage/session';

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

export function useFinishSession() {
  const navigate = useNavigate();
  const finish = useSessionStore((s) => s.finish);
  return () => {
    finish();
    closePip();
    window.focus();
    void navigate('/ozet');
  };
}
