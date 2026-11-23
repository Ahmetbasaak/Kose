import { Button, ButtonLink } from '../../components/Button';
import { isPipSupported, openPip, usePipStore } from '../../components/corner/pip';
import { useNow } from '../../components/useNow';
import { t } from '../../i18n';
import { useSessionStore } from '../../storage/session';
import { useFinishSession } from '../actions';
import { sessionDisplay } from '../sessionView';
import s from './pages.module.css';

/** Full-page view of the running session; the main view on phones. */
export function LivePage() {
  const active = useSessionStore((st) => st.active);
  const togglePause = useSessionStore((st) => st.togglePause);
  const pipOpen = usePipStore((st) => st.win !== null);
  const finishSession = useFinishSession();
  const now = useNow(250, window, active !== null);

  if (!active)
    return (
      <div className={s.stack}>
        <p className={s.lead}>{t('timer.noActive')}</p>
        <div>
          <ButtonLink to="/" variant="primary">
            {t('timer.newTimer')}
          </ButtonLink>
        </div>
      </div>
    );

  const d = sessionDisplay(active, now);
  return (
    <div className={s.stack}>
      <section className={s.liveCard} aria-label={active.label}>
        <div className={s.spread}>
          <span className={s.liveCaption}>{active.label}</span>
          <span className={s.liveCaption}>{d.caption}</span>
        </div>
        <div className={`${s.liveValue} num`} role="timer">
          {d.value}
        </div>
      </section>
      <div className={s.row}>
        {d.status !== 'done' && (
          <Button onClick={() => togglePause()}>{d.status === 'paused' ? t('timer.resume') : t('timer.pause')}</Button>
        )}
        <Button variant="primary" onClick={finishSession}>
          {t('timer.finish')}
        </Button>
        {isPipSupported() && !pipOpen && <Button onClick={() => void openPip()}>{t('timer.openCorner')}</Button>}
      </div>
      {!isPipSupported() && <p className={`${s.muted} ${s.small}`}>{t('timer.mobileNote')}</p>}
    </div>
  );
}
