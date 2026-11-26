import type { CSSProperties, ReactNode } from 'react';
import { useFinishSession } from '../../app/actions';
import type { SessionDisplay } from '../../app/sessionView';
import { finishLabel, sessionDisplay } from '../../app/sessionView';
import { brandName, t } from '../../i18n';
import { useEntitlements } from '../../app/entitlements';
import { usePrefsStore } from '../../storage/prefs';
import { useSessionStore, type ActiveSession } from '../../storage/session';
import { RollingValue } from '../RollingValue';
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
  const { can } = useEntitlements();
  const theme = usePrefsStore((st) => st.cornerTheme);
  const scale = usePrefsStore((st) => st.cornerScale);
  return (
    <div
      className={styles.root}
      data-variant={variant}
      data-status={display.status}
      data-level={display.level}
      // The presentation traffic light outranks a decorative theme.
      data-theme={can('themes') && !display.level ? theme : undefined}
      style={can('cornerSettings') ? ({ '--corner-scale': scale / 100 } as CSSProperties) : undefined}
    >
      <div className={styles.top}>
        <span className={styles.label}>
          {brandName} · {label}
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
        <RollingValue text={display.value} />
      </div>
      {display.sub && <div className={styles.sub}>{display.sub}</div>}
      {display.extra && <div className={styles.sub}>{display.extra}</div>}
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
          {finishLabel(session.kind)}
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
