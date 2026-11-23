import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router';
import { useSessionStore } from '../../storage/session';
import { CornerView } from './CornerView';
import { FloatingCorner } from './FloatingCorner';
import { closePip, usePipStore } from './pip';
import { TargetWindowContext } from './targetWindow';

/** Decides where the running session lives: PiP window, floating widget, or nowhere (full-page view open). */
export function CornerHost() {
  const win = usePipStore((s) => s.win);
  const hasSession = useSessionStore((s) => s.active !== null);
  const { pathname } = useLocation();

  useEffect(() => {
    if (!hasSession) closePip();
  }, [hasSession]);

  if (!hasSession) return null;
  if (win)
    return createPortal(
      <TargetWindowContext.Provider value={win}>
        <CornerView variant="window" />
      </TargetWindowContext.Provider>,
      win.document.body,
    );
  if (pathname === '/sayac') return null;
  return <FloatingCorner />;
}
