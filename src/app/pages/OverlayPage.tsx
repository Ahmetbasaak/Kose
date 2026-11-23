import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useNow } from '../../components/useNow';
import { formatClock } from '../../engine/format';
import { parseOverlay, type OverlayConfig } from '../../share/link';
import { daysClock } from '../sessionView';

/** The bare counter, shared by /overlay and the link builder's preview. */
export function OverlayView({ cfg, now }: { cfg: OverlayConfig; now: number }) {
  const m = cfg.mode;
  const value =
    m.type === 'stopwatch'
      ? formatClock(now - m.startAt)
      : m.type === 'countdown'
        ? formatClock(Math.max(0, m.endAt - now), 'ceil')
        : daysClock(Math.max(0, m.at - now));
  return (
    <div
      style={{
        color: cfg.color,
        padding: 16,
        fontWeight: 700,
        lineHeight: 1,
        // Readable on any stream background without a box.
        textShadow: '0 2px 12px rgb(0 0 0 / 0.45)',
      }}
    >
      {cfg.label && <div style={{ fontSize: Math.max(16, cfg.sizePx * 0.28), marginBottom: 8 }}>{cfg.label}</div>}
      <div className="num" role="timer" style={{ fontSize: cfg.sizePx, letterSpacing: '-0.02em' }}>
        {value}
      </div>
    </div>
  );
}

/** /overlay — bare, transparent counter for an OBS "Browser Source". Configured only by URL. */
export function OverlayPage() {
  const [params] = useSearchParams();
  const [loadedAt] = useState(Date.now);
  const now = useNow(250);

  useEffect(() => {
    const els = [document.documentElement, document.body];
    els.forEach((el) => el.style.setProperty('background', 'transparent'));
    return () => els.forEach((el) => el.style.removeProperty('background'));
  }, []);

  return (
    <main>
      <OverlayView cfg={parseOverlay(params, loadedAt)} now={now} />
    </main>
  );
}
