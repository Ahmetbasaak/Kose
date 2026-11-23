import { Link } from 'react-router';
import { sessionDisplay } from '../../app/sessionView';
import { t } from '../../i18n';
import { useSessionStore } from '../../storage/session';
import { useNow } from '../useNow';
import styles from './MiniBar.module.css';

/** Phones: a slim "now playing" bar above the tab bar instead of a floating window over the content. */
export function MiniBar() {
  const active = useSessionStore((s) => s.active);
  const togglePause = useSessionStore((s) => s.togglePause);
  const now = useNow(1000, window, active !== null);
  if (!active) return null;
  const d = sessionDisplay(active, now);
  return (
    <div className={styles.bar} data-level={d.level} data-noprint>
      <Link to="/sayac" className={styles.main} aria-label={`${t('home.openTimer')}: ${active.label}`}>
        <span className={styles.label}>{active.label}</span>
        <span className={`${styles.value} num`}>{d.value}</span>
      </Link>
      {d.canPause && (
        <button type="button" className={styles.btn} onClick={() => togglePause()}>
          {d.status === 'paused' ? t('timer.resume') : t('timer.pause')}
        </button>
      )}
    </div>
  );
}
