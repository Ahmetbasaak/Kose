import { useEffect } from 'react';
import { isPipSupported, openPip, usePipStore } from '../components/corner/pip';
import { usePrefsStore } from '../storage/prefs';
import { useSessionStore } from '../storage/session';
import { useFinishSession } from './actions';
import { useEntitlements } from './entitlements';

const typing = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));

/** Keyboard shortcuts (p / b / k, free) and Pro autostart. Renders nothing. */
export function ProBehaviors() {
  const { can } = useEntitlements();
  const shortcutsOn = usePrefsStore((s) => s.shortcuts);
  const pipWin = usePipStore((s) => s.win);
  const finishSession = useFinishSession();

  useEffect(() => {
    if (!shortcutsOn) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat || typing(e.target)) return;
      const { active, togglePause } = useSessionStore.getState();
      if (!active) return;
      const key = e.key.toLocaleLowerCase('tr');
      if (key === 'p') togglePause();
      else if (key === 'b') finishSession();
      // A key press is a user gesture, so the PiP request is allowed.
      else if (key === 'k' && isPipSupported()) void openPip().catch(() => undefined);
      else return;
      e.preventDefault();
    };
    // Also listen in the PiP window, where focus usually is while presenting.
    const targets = [window, ...(pipWin ? [pipWin] : [])];
    targets.forEach((w) => w.addEventListener('keydown', onKey));
    return () => targets.forEach((w) => w.removeEventListener('keydown', onKey));
  }, [shortcutsOn, pipWin, finishSession]);

  const autostart = usePrefsStore((s) => s.autostart) && can('autostart');
  useEffect(() => {
    if (!autostart) return;
    const { active, start } = useSessionStore.getState();
    const last = usePrefsStore.getState().lastStart;
    // Without a click the browser won't open PiP, so this starts in the page corner.
    if (!active && last) start(last);
    // Only on app open, not whenever the setting is toggled on later.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
