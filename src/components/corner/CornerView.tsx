import type { ReactNode } from 'react';
import { useFinishSession } from '../../app/actions';
import { config } from '../../app/config';
import type { SessionDisplay } from '../../app/sessionView';
import { sessionDisplay } from '../../app/sessionView';
import { t } from '../../i18n';
import { useSessionStore, type ActiveSession } from '../../storage/session';
import { MoneyValue } from '../MoneyValue';
import { useNow } from '../useNow';
import { useTargetWindow } from './targetWindow';
import styles from './CornerView.module.css';

type Variant = 'window' | 'floating';

interface FaceProps {
  label: string;
  display: SessionDisplay;
  variant: Variant | 'preview';
  children?: ReactNode;
}

/** Pure visual of the corner window; also used as the static preview on setup screens. */
export function CornerFace({ label, display, variant, children }: FaceProps) {
  return (
    <div className={styles.root} data-variant={variant} data-status={display.status}>
      <div className={styles.top}>
        <span className={styles.label}>
          {config.name} · {label}
        </span>
        <span className={styles.status}>
          <span className={styles.dot} aria-hidden="true" />
          {display.caption}
        </span>
      </div>
      <div
        className={`${styles.value} num`}
        data-long={display.value.length > 8}
        role={variant === 'preview' ? undefined : 'timer'}
      >
        {display.money === undefined ? display.value : <MoneyValue amount={display.money} />}
      </div>
      {display.sub && <div className={styles.sub}>{display.sub}</div>}
      {children}
    </div>
  );
}

function LiveCorner({ session, variant, extra }: { session: ActiveSession; variant: Variant; extra?: ReactNode }) {
  const win = useTargetWindow();
  const now = useNow(250, win);
  const togglePause = useSessionStore((s) => s.togglePause);
  const finishSession = useFinishSession();
  const display = sessionDisplay(session, now);
  return (
    <CornerFace label={session.label} display={display} variant={variant}>
      <div className={styles.actions}>
        {display.canPause && (
          <button type="button" className={styles.action} onClick={() => togglePause()}>
            {display.status === 'paused' ? t('timer.resume') : t('timer.pause')}
          </button>
        )}
        <button type="button" className={`${styles.action} ${styles.finish}`} onClick={finishSession}>
          {t('timer.finish')}
        </button>
        {extra}
      </div>
    </CornerFace>
  );
}

export function CornerView({ variant, extra }: { variant: Variant; extra?: ReactNode }) {
  const session = useSessionStore((s) => s.active);
  return session ? <LiveCorner session={session} variant={variant} extra={extra} /> : null;
}
