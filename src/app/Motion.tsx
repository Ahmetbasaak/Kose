import { useEffect, useRef } from 'react';

const still = () =>
  document.documentElement.hasAttribute('data-reduce-motion') || matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Pointer and scroll effects for the whole page, from one pair of listeners:
 * a trailing cursor ring (mouse only), [data-tilt] cards that lean toward the pointer and light up under it,
 * [data-magnetic] buttons that pull toward it, and --skew on <html> from scroll speed (the marquee leans).
 * Decorative only: renders aria-hidden elements, never moves focus or blocks clicks.
 */
export function Motion() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    let x = -100,
      y = -100,
      rx = x,
      ry = y,
      vel = 0,
      lastY = scrollY,
      raf = 0;
    let tilt: HTMLElement | null = null;
    let mag: HTMLElement | null = null;

    const loop = () => {
      rx += (x - rx) * 0.2;
      ry += (y - ry) * 0.2;
      vel += (scrollY - lastY - vel) * 0.15;
      lastY = scrollY;
      if (dot.current) dot.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      if (ring.current) ring.current.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;
      root.style.setProperty('--skew', `${Math.max(-10, Math.min(10, vel * -0.25)).toFixed(2)}deg`);
      // Stop when everything has settled, so an idle page costs nothing.
      raf = Math.abs(x - rx) + Math.abs(y - ry) > 0.2 || Math.abs(vel) > 0.05 ? requestAnimationFrame(loop) : 0;
    };
    const kick = () => {
      if (!raf && !still()) raf = requestAnimationFrame(loop);
    };

    const release = () => {
      tilt?.style.removeProperty('--rx');
      tilt?.style.removeProperty('--ry');
      if (mag) mag.style.translate = '';
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || still()) {
        root.removeAttribute('data-cursor');
        return;
      }
      root.setAttribute('data-cursor', '');
      x = e.clientX;
      y = e.clientY;
      const target = e.target instanceof Element ? e.target : null;

      const nextTilt = target?.closest<HTMLElement>('[data-tilt]') ?? null;
      if (tilt !== nextTilt) release();
      tilt = nextTilt;
      if (tilt) {
        const r = tilt.getBoundingClientRect();
        const px = (x - r.left) / r.width;
        const py = (y - r.top) / r.height;
        tilt.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
        tilt.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
        tilt.style.setProperty('--rx', `${((0.5 - py) * 7).toFixed(2)}deg`);
        tilt.style.setProperty('--ry', `${((px - 0.5) * 9).toFixed(2)}deg`);
      }

      const nextMag = target?.closest<HTMLElement>('[data-magnetic]') ?? null;
      if (mag !== nextMag && mag) mag.style.translate = '';
      mag = nextMag;
      if (mag) {
        const r = mag.getBoundingClientRect();
        mag.style.translate = `${((x - r.left - r.width / 2) * 0.3).toFixed(1)}px ${((y - r.top - r.height / 2) * 0.4).toFixed(1)}px`;
      }

      const r = ring.current;
      if (r) {
        const label = target?.closest<HTMLElement>('[data-cursor-label]')?.dataset.cursorLabel;
        if (label) r.dataset.label = label;
        else delete r.dataset.label;
        r.toggleAttribute('data-hot', !label && !!target?.closest('a, button, input, select, textarea, label'));
      }
      kick();
    };
    const onLeave = () => {
      root.removeAttribute('data-cursor');
      release();
    };

    addEventListener('pointermove', onMove, { passive: true });
    addEventListener('scroll', kick, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    return () => {
      removeEventListener('pointermove', onMove);
      removeEventListener('scroll', kick);
      document.removeEventListener('pointerleave', onLeave);
      cancelAnimationFrame(raf);
      root.removeAttribute('data-cursor');
    };
  }, []);

  return (
    <>
      <div className="scroll-progress" aria-hidden="true" />
      <div ref={dot} className="cursor-dot" aria-hidden="true" />
      <div ref={ring} className="cursor-ring" aria-hidden="true" />
    </>
  );
}
