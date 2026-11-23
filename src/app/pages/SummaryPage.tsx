import { ButtonLink } from '../../components/Button';
import { durationParts, formatClock } from '../../engine/format';
import { t } from '../../i18n';
import { useSessionStore } from '../../storage/session';
import s from './pages.module.css';

const time = new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit' });

function durationWords(ms: number): string {
  const { hours, minutes, seconds } = durationParts(ms);
  return hours > 0 ? t('units.hm', { h: hours, m: minutes }) : t('units.ms', { m: minutes, s: seconds });
}

export function SummaryPage() {
  const summary = useSessionStore((st) => st.lastSummary);
  return (
    <div className={s.stack}>
      <h1 className={s.h1}>{t('summary.title')}</h1>
      {summary ? (
        <>
          <p className={s.lead}>{summary.label}</p>
          <div className={s.stats}>
            <div className={`${s.card} ${s.stat}`}>
              <span className={`${s.muted} ${s.small}`}>{t('summary.duration')}</span>
              <span className={`${s.statValue} num`}>{durationWords(summary.elapsedMs)}</span>
              <span className={`${s.muted} ${s.small} num`}>
                {formatClock(summary.elapsedMs)} ·{' '}
                {t('summary.range', { start: time.format(summary.startedAt), end: time.format(summary.endedAt) })}
              </span>
            </div>
          </div>
        </>
      ) : (
        <p className={s.lead}>{t('summary.empty')}</p>
      )}
      <div>
        <ButtonLink to="/" variant="primary">
          {t('summary.newTimer')}
        </ButtonLink>
      </div>
    </div>
  );
}
