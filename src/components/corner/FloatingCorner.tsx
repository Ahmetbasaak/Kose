import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { t } from '../../i18n';
import { usePrefsStore, type Corner } from '../../storage/prefs';
import { CornerView } from './CornerView';
import cornerStyles from './CornerView.module.css';
import { isPipSupported, openPip } from './pip';
import styles from './FloatingCorner.module.css';

const INSET = 16;
const NEXT: Record<Corner, Corner> = { tl: 'tr', tr: 'br', br: 'bl', bl: 'tl' };

interface Pos {
  x: number;
  y: number;
}

function cornerPos(corner: Corner, w: number, h: number): Pos {
  return {
    x: corner.endsWith('l') ? INSET : window.innerWidth - w - INSET,
    y: corner.startsWith('t') ? INSET : window.innerHeight - h - INSET,
  };
}

function useViewportSize() {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return size;
}

/** In-page fallback when Document PiP is unavailable or closed: draggable, snaps to the nearest corner. */
export function FloatingCorner() {
  const corner = usePrefsStore((s) => s.corner);
  const setCorner = usePrefsStore((s) => s.setCorner);
  const ref = useRef<HTMLDivElement>(null);
  const grab = useRef<Pos | null>(null);
  const [drag, setDrag] = useState<Pos | null>(null);
  const [box, setBox] = useState({ w: 320, h: 150 });
  useViewportSize(); // re-render on resize so the snapped position follows the viewport

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBox({ w: el.offsetWidth, h: el.offsetHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button') || e.button !== 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    grab.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({ x: rect.left, y: rect.top });
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (grab.current) setDrag({ x: e.clientX - grab.current.x, y: e.clientY - grab.current.y });
  };
  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (!grab.current) return;
    grab.current = null;
    setDrag(null);
    const top = e.clientY < window.innerHeight / 2;
    const left = e.clientX < window.innerWidth / 2;
    setCorner(`${top ? 't' : 'b'}${left ? 'l' : 'r'}`);
  };

  const pos = drag ?? cornerPos(corner, box.w, box.h);

  return (
    <div
      ref={ref}
      className={styles.root}
      data-dragging={drag !== null}
      style={{ left: pos.x, top: pos.y }}
      title={t('timer.dragHint')}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <CornerView
        variant="floating"
        extra={
          <>
            <button
              type="button"
              className={cornerStyles.iconBtn}
              aria-label={t('timer.moveCorner')}
              title={t('timer.moveCorner')}
              onClick={() => setCorner(NEXT[corner])}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M4 9V4h5M20 15v5h-5M15 4h5v5M9 20H4v-5" />
              </svg>
            </button>
            {isPipSupported() && (
              <button
                type="button"
                className={cornerStyles.iconBtn}
                aria-label={t('timer.openCorner')}
                title={t('timer.openCorner')}
                onClick={() => void openPip()}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <rect x="12" y="12" width="7" height="5" rx="1" fill="currentColor" />
                </svg>
              </button>
            )}
          </>
        }
      />
    </div>
  );
}
