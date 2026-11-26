import { Suspense, useState, type CSSProperties } from 'react';
import { Button, ButtonLink } from '../../components/Button';
import { LazyShareCard } from '../../share/lazy';
import { downloadXlsx, hours } from '../../export/xlsx';
import { brandSlug } from '../config';
import { useEntitlements } from '../entitlements';
import { equivalentsLine, formatTrDate } from '../sessionView';
import { formatClock, formatMoney } from '../../engine/format';
import { MONTHLY_HOURS } from '../../engine/work';
import { LOCALE, t } from '../../i18n';
import { useSessionStore } from '../../storage/session';
import { durationWords } from '../sessionView';
import s from './pages.module.css';

const time = new Intl.DateTimeFormat(LOCALE, { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' });

export function SummaryPage() {
  const summary = useSessionStore((st) => st.lastSummary);
  const [sharing, setSharing] = useState(false);
  const { can } = useEntitlements();
  const canExport = can('export');
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
        <div className={`${s.card} ${s.stat}`} data-reveal style={{ '--i': 0 } as CSSProperties}>
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
          <div className={`${s.card} ${s.stat}`} data-reveal style={{ '--i': 1 } as CSSProperties}>
            <span className={`${s.muted} ${s.small}`}>{t('meeting.cost')}</span>
            <span className={`${s.statValue} num`}>{formatMoney(summary.cost)}</span>
            <span className={`${s.muted} ${s.small} num`}>
              {t('meeting.summarySub', {
                n: summary.meeting.people,
                // Sessions saved before the salary field existed only have the hourly rate.
                salary: formatMoney(summary.meeting.monthlySalary ?? summary.meeting.hourlyRate * MONTHLY_HOURS),
              })}
            </span>
          </div>
        )}
        {summary.focusMs != null && (
          <div className={`${s.card} ${s.stat}`} data-reveal style={{ '--i': 2 } as CSSProperties}>
            <span className={`${s.muted} ${s.small}`}>{t('student.focusTotal')}</span>
            <span className={`${s.statValue} num`}>{durationWords(summary.focusMs)}</span>
          </div>
        )}
        {(summary.earned ?? summary.cost) != null && equivalentsLine((summary.earned ?? summary.cost)!) && (
          <div className={`${s.card} ${s.stat}`} data-reveal style={{ '--i': 3 } as CSSProperties}>
            <span className={`${s.muted} ${s.small}`}>{t('equiv.title')}</span>
            <span className={`${s.statValue} num`} style={{ fontSize: 22 }}>
              {equivalentsLine((summary.earned ?? summary.cost)!)}
            </span>
          </div>
        )}
        {isWork && (
          <div className={`${s.card} ${s.stat}`} data-reveal style={{ '--i': 4 } as CSSProperties}>
            <span className={`${s.muted} ${s.small}`}>{t('summary.earned')}</span>
            <span className={`${s.statValue} num`}>{formatMoney(summary.earned ?? 0)}</span>
            <span className={`${s.muted} ${s.small}`}>{t('work.disclaimer')}</span>
          </div>
        )}
      </div>
      <section className={`${s.card} ${s.stack}`} style={{ gap: 14 }} aria-labelledby="outputs-title" data-noprint>
        <h2 id="outputs-title" className={s.label} style={{ fontSize: 16 }}>
          {t('summary.outputs')}
        </h2>
        <div className={s.row}>
          <Button variant="primary" aria-expanded={sharing} onClick={() => setSharing(!sharing)}>
            {t('summary.shareCard')}
          </Button>
          <Button
            disabled={!canExport}
            onClick={() =>
              void downloadXlsx(`${brandSlug}-ozet.xlsx`, [
                {
                  name: t('summary.title'),
                  rows: [
                    [
                      t('history.label'),
                      t('history.date'),
                      `${t('summary.duration')} ${t('export.hoursUnit')}`,
                      `${t('history.amount')} (₺)`,
                    ],
                    [
                      summary.label,
                      formatTrDate(summary.endedAt),
                      hours(summary.elapsedMs),
                      summary.earned ?? summary.cost ?? '',
                    ],
                  ],
                },
              ])
            }
          >
            {t('summary.excel')} {!canExport && <span className={s.badge}>{t('home.pro')}</span>}
          </Button>
          <Button disabled={!canExport} onClick={() => window.print()}>
            {t('summary.pdf')} {!canExport && <span className={s.badge}>{t('home.pro')}</span>}
          </Button>
        </div>
        <p className={`${s.muted} ${s.small}`}>{t('summary.proNote')}</p>
      </section>
      {sharing && (
        <Suspense fallback={null}>
          <div data-noprint>
            <LazyShareCard summary={summary} />
          </div>
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
