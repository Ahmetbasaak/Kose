import { useId, useState } from 'react';
import styles from './BarChart.module.css';

export interface Bar {
  key: string;
  /** Axis label; empty to skip (dense charts label every few bars). */
  label: string;
  value: number;
  /** Tooltip / screen-reader text, e.g. "24 Kas: 3,5 saat". */
  tip: string;
}

/**
 * Single-series vertical bars (one hue, so no legend): thin marks, 4px rounded tops on a baseline,
 * 2px gaps, recessive axis. Hover or focus a bar for its tooltip; the page's table is the data view.
 */
export function BarChart({ bars, title, maxLabel }: { bars: Bar[]; title: string; maxLabel: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const id = useId();
  const max = Math.max(...bars.map((b) => b.value), 0) || 1;
  const W = 100;
  const H = 40;
  const step = W / bars.length;
  const bw = Math.max(step - 0.6, 0.4); // ~2px gap at typical widths
  return (
    <figure className={styles.figure} aria-labelledby={id}>
      <figcaption id={id} className={styles.title}>
        {title}
      </figcaption>
      <div className={styles.plot}>
        <span className={styles.max}>{maxLabel}</span>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className={styles.svg} role="list">
          {bars.map((b, i) => {
            const h = (b.value / max) * (H - 1);
            const x = i * step + (step - bw) / 2;
            const r = Math.min(0.8, bw / 2, h);
            return (
              <g key={b.key} role="listitem" aria-label={b.tip}>
                {/* Wide transparent hit target: easier to hover than a thin bar. */}
                <rect
                  x={i * step}
                  y={0}
                  width={step}
                  height={H}
                  fill="transparent"
                  tabIndex={b.value > 0 ? 0 : -1}
                  className={styles.hit}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                />
                {h > 0 && (
                  <path
                    className={styles.bar}
                    data-active={hover === i}
                    d={`M${x},${H} V${H - h + r} Q${x},${H - h} ${x + r},${H - h} H${x + bw - r} Q${x + bw},${H - h} ${x + bw},${H - h + r} V${H} Z`}
                  />
                )}
              </g>
            );
          })}
          <line x1={0} x2={W} y1={H} y2={H} className={styles.axis} />
        </svg>
        {hover !== null && (
          <div className={styles.tip} style={{ left: `${((hover + 0.5) / bars.length) * 100}%` }} role="tooltip">
            {bars[hover]!.tip}
          </div>
        )}
      </div>
      <div className={styles.labels} aria-hidden="true">
        {bars.map((b) => (
          <span key={b.key}>{b.label}</span>
        ))}
      </div>
    </figure>
  );
}

/** Horizontal bars with the value printed at the end (few items, so direct labels, no tooltip needed). */
export function HBarList({
  items,
  title,
}: {
  items: { key: string; label: string; value: number; text: string }[];
  title: string;
}) {
  const max = Math.max(...items.map((i) => i.value), 0) || 1;
  return (
    <figure className={styles.figure}>
      <figcaption className={styles.title}>{title}</figcaption>
      <ul className={styles.hlist} role="list">
        {items.map((i) => (
          <li key={i.key}>
            <span className={styles.hlabel}>{i.label}</span>
            <span className={styles.htrack}>
              <span className={styles.hbar} style={{ width: `${(i.value / max) * 100}%` }} />
            </span>
            <span className={`${styles.hvalue} num`}>{i.text}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
