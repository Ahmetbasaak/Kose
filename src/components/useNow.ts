import { useEffect, useState } from 'react';

/**
 * Re-render clock. Only drives repaints; values are always derived from absolute timestamps.
 * Pass the PiP window so ticks keep flowing when the main tab is hidden and throttled.
 */
export function useNow(intervalMs = 250, win: Window = window, enabled = true): number {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (!enabled) return;
    const id = win.setInterval(() => setNow(Date.now()), intervalMs);
    return () => win.clearInterval(id);
  }, [intervalMs, win, enabled]);
  return now;
}
