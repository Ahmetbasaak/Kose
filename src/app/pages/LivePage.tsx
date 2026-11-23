import { Suspense, useRef, useState } from 'react';
import { Button, ButtonLink } from '../../components/Button';
import { InstallHint } from '../../components/InstallHint';
import { LazyShareCard } from '../../share/lazy';
import { isPipSupported, openPip, usePipStore } from '../../components/corner/pip';
import { MoneyValue } from '../../components/MoneyValue';
import { useNow } from '../../components/useNow';
import { t } from '../../i18n';
import { summarize, useSessionStore, type SessionSummary } from '../../storage/session';
import { useFinishSession } from '../actions';
import { equivalentsLine, finishLabel, sessionDisplay } from '../sessionView';
import { trWeekStart, trMidnight, trYmd } from '../../engine/calendar';
import { formatMoney } from '../../engine/format';
import { earnedSince, trDay, workState, type WorkConfig } from '../../engine/work';
import s from './pages.module.css';

/** Work mode: this week's and month's estimate plus today's fun comparison. */
function WorkPeriods({ config, now }: { config: WorkConfig; now: number }) {
  const { y, m } = trYmd(now);
  const today = workState(config, now).earned;
  const eq = equivalentsLine(today);
  return (
    <div className={s.stack} style={{ gap: 4 }}>
      {eq && <p className={`${s.lead} num`}>{eq}</p>}
      <p className="num">
        {t('work.week', { v: formatMoney(earnedSince(config, trDay(trWeekStart(now)), now)) })} ·{' '}
        {t('work.month', { v: formatMoney(earnedSince(config, trDay(trMidnight(y, m, 1)), now)) })}
      </p>
      <p className={`${s.muted} ${s.small}`}>{t('work.periodNote')}</p>
    </div>
  );
}

/** Full-page view of the running session; the main view on phones. */
export function LivePage() {
  const active = useSessionStore((st) => st.active);
  const togglePause = useSessionStore((st) => st.togglePause);
  const pipOpen = usePipStore((st) => st.win !== null);
  const finishSession = useFinishSession();
  const [snapshot, setSnapshot] = useState<SessionSummary | null>(null);
  const card = useRef<HTMLElement>(null);
  const now = useNow(250, window, active !== null);

  if (!active)
    return (
      <div className={s.stack}>
        <h1 className={s.h1}>{t('app.navLive')}</h1>
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
      <section ref={card} className={s.liveCard} aria-labelledby="live-title" data-level={d.level}>
        <div className={s.spread}>
          <h1 id="live-title" className={s.liveCaption}>
            {active.label}
          </h1>
          <span className={s.liveCaption}>{d.caption}</span>
        </div>
        <div className={`${s.liveValue} num`} data-long={d.value.length > 8} role="timer">
          {d.money === undefined ? d.value : <MoneyValue amount={d.money} />}
        </div>
        {d.sub && <span className={s.liveCaption}>{d.sub}</span>}
      </section>
      <div className={s.row}>
        {d.canPause && (
          <Button onClick={() => togglePause()}>{d.status === 'paused' ? t('timer.resume') : t('timer.pause')}</Button>
        )}
        <Button variant="primary" onClick={finishSession}>
          {finishLabel(active.kind)}
        </Button>
        {document.fullscreenEnabled && (
          <Button onClick={() => void card.current?.requestFullscreen().catch(() => undefined)}>
            {t('timer.fullscreen')}
          </Button>
        )}
        <Button
          aria-expanded={snapshot !== null}
          onClick={() => setSnapshot(snapshot ? null : summarize(active, Date.now()))}
        >
          {t('share.title')}
        </Button>
        {isPipSupported() && !pipOpen && <Button onClick={() => void openPip()}>{t('timer.openCorner')}</Button>}
      </div>
      {snapshot && (
        <Suspense fallback={null}>
          <LazyShareCard summary={snapshot} />
        </Suspense>
      )}
      {active.kind === 'work' && active.work && <WorkPeriods config={active.work} now={now} />}
      {active.meeting && d.money !== undefined && equivalentsLine(d.money) && (
        <p className={`${s.lead} num`}>{equivalentsLine(d.money)}</p>
      )}
      {d.extra && <p className={`${s.muted} num`}>{d.extra}</p>}
      {active.kind === 'work' && <p className={`${s.muted} ${s.small}`}>{t('work.disclaimer')}</p>}
      {!isPipSupported() && <p className={`${s.muted} ${s.small}`}>{t('timer.mobileNote')}</p>}
      {active.kind !== 'stopwatch' && active.kind !== 'work' && <InstallHint />}
    </div>
  );
}
