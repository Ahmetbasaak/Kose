import { Suspense, useState } from 'react';
import { Button, ButtonLink } from '../../components/Button';
import { LazyShareCard } from '../../share/lazy';
import { formatClock, formatMoney } from '../../engine/format';
import { t } from '../../i18n';
import { useSessionStore } from '../../storage/session';
import { durationWords } from '../sessionView';
import s from './pages.module.css';

const time = new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' });

export function SummaryPage() {
  const summary = useSessionStore((st) => st.lastSummary);
  const [sharing, setSharing] = useState(false);
  if (!summary)
    return (
      <div className={s.stack}>
        <h1 className={s.h1}>{t('summary.title')}</h1>
        <p className={s.lead}>{t('summary.empty')}</p>
        <div>
          <ButtonLink to="/" variant="primary">
            {t('summary.newTimer')}
          </ButtonLink>
        </div>
      </div>
    );

  const isWork = summary.earned != null;
  return (
    <div className={s.stack}>
      <div className={s.intro}>
        <h1 className={s.h1}>{t('summary.title')}</h1>
        <p className={s.lead}>{summary.label}</p>
      </div>
      <div className={s.stats}>
        <div className={`${s.card} ${s.stat}`}>
          <span className={`${s.muted} ${s.small}`}>{isWork ? t('summary.worked') : t('summary.duration')}</span>
          <span className={`${s.statValue} num`}>{durationWords(summary.elapsedMs)}</span>
          {/* Work time comes from the shift, so the open/close range would contradict it. */}
          {!isWork && (
            <span className={`${s.muted} ${s.small} num`}>
              {formatClock(summary.elapsedMs)} ·{' '}
              {t('summary.range', { start: time.format(summary.startedAt), end: time.format(summary.endedAt) })}
            </span>
          )}
        </div>
        {summary.cost != null && summary.meeting && (
          <div className={`${s.card} ${s.stat}`}>
            <span className={`${s.muted} ${s.small}`}>{t('meeting.cost')}</span>
            <span className={`${s.statValue} num`}>{formatMoney(summary.cost)}</span>
            <span className={`${s.muted} ${s.small} num`}>
              {t('meeting.summarySub', { n: summary.meeting.people, rate: formatMoney(summary.meeting.hourlyRate) })}
            </span>
          </div>
        )}
        {summary.focusMs != null && (
          <div className={`${s.card} ${s.stat}`}>
            <span className={`${s.muted} ${s.small}`}>{t('student.focusTotal')}</span>
            <span className={`${s.statValue} num`}>{durationWords(summary.focusMs)}</span>
          </div>
        )}
        {isWork && (
          <div className={`${s.card} ${s.stat}`}>
            <span className={`${s.muted} ${s.small}`}>{t('summary.earned')}</span>
            <span className={`${s.statValue} num`}>{formatMoney(summary.earned ?? 0)}</span>
            <span className={`${s.muted} ${s.small}`}>{t('work.disclaimer')}</span>
          </div>
        )}
      </div>
      <section className={`${s.card} ${s.stack}`} style={{ gap: 14 }} aria-labelledby="outputs-title">
        <h2 id="outputs-title" className={s.label} style={{ fontSize: 16 }}>
          {t('summary.outputs')}
        </h2>
        <div className={s.row}>
          <Button variant="primary" aria-expanded={sharing} onClick={() => setSharing(!sharing)}>
            {t('summary.shareCard')}
          </Button>
          <Button disabled>
            {t('summary.excel')} <span className={s.badge}>{t('home.pro')}</span>
          </Button>
          <Button disabled>
            {t('summary.pdf')} <span className={s.badge}>{t('home.pro')}</span>
          </Button>
        </div>
        <p className={`${s.muted} ${s.small}`}>{t('summary.proNote')}</p>
      </section>
      {sharing && (
        <Suspense fallback={null}>
          <LazyShareCard summary={summary} />
        </Suspense>
      )}
      <div>
        <ButtonLink to="/" variant="primary">
          {t('summary.newTimer')}
        </ButtonLink>
      </div>
    </div>
  );
}
