import { useEffect, useState } from 'react';
import { Button } from '../../components/Button';
import { ProGate } from '../../components/ProGate';
import { trMidnight, trYmd } from '../../engine/calendar';
import { formatClock, formatMoney } from '../../engine/format';
import { downloadXlsx, hours } from '../../export/xlsx';
import { t } from '../../i18n';
import { modes, type ModeId } from '../../modes/registry';
import { recordsBetween } from '../../storage/history';
import type { SessionSummary } from '../../storage/session';
import { brandSlug } from '../config';
import { durationWords, formatTrDate } from '../sessionView';
import s from './pages.module.css';

const amountOf = (r: SessionSummary) => r.earned ?? r.cost ?? null;

function History() {
  const [month, setMonth] = useState(() => {
    const { y, m } = trYmd(Date.now());
    return `${y}-${String(m).padStart(2, '0')}`;
  });
  const [mode, setMode] = useState<ModeId | ''>('');
  const [records, setRecords] = useState<SessionSummary[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const [y, m] = month.split('-').map(Number);
    if (!y || !m) return;
    recordsBetween(trMidnight(y, m, 1), trMidnight(y, m + 1, 1)).then(
      (r) => {
        setRecords(r);
        setFailed(false);
      },
      () => setFailed(true),
    );
  }, [month]);

  const shown = (records ?? []).filter((r) => !mode || r.modeId === mode).sort((a, b) => b.endedAt - a.endedAt);
  const totalMs = shown.filter((r) => r.kind !== 'target').reduce((a, r) => a + r.elapsedMs, 0);
  const earned = shown.reduce((a, r) => a + (r.earned ?? 0), 0);
  const cost = shown.reduce((a, r) => a + (r.cost ?? 0), 0);
  const modeTitle = (id: ModeId) => t(`modes.${id}.title`);

  const exportExcel = () =>
    downloadXlsx(`${brandSlug}-gecmis-${month}.xlsx`, [
      {
        name: t('history.title'),
        rows: [
          [
            t('history.date'),
            t('history.mode'),
            t('history.label'),
            `${t('summary.duration')} (saat)`,
            `${t('history.amount')} (₺)`,
          ],
          ...shown.map((r) => [
            formatTrDate(r.endedAt),
            modeTitle(r.modeId),
            r.label,
            hours(r.elapsedMs),
            amountOf(r) === null ? '' : Math.round(amountOf(r)! * 100) / 100,
          ]),
        ],
      },
    ]);

  return (
    <div className={s.stack}>
      <div className={s.row} data-noprint>
        <div className={s.field}>
          <label htmlFor="h-month" className={s.label}>
            {t('history.month')}
          </label>
          <input
            id="h-month"
            className={s.input}
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </div>
        <div className={s.field}>
          <label htmlFor="h-mode" className={s.label}>
            {t('history.mode')}
          </label>
          <select id="h-mode" className={s.input} value={mode} onChange={(e) => setMode(e.target.value as ModeId | '')}>
            <option value="">{t('history.allModes')}</option>
            {modes.map((m) => (
              <option key={m.id} value={m.id}>
                {modeTitle(m.id)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {failed && (
        <p role="alert" className={s.error}>
          {t('history.loadError')}
        </p>
      )}

      <section aria-labelledby="h-monthly" className={s.stack} style={{ gap: 12 }}>
        <h2 id="h-monthly" className={s.modeTitle}>
          {t('history.monthly')} · {month}
        </h2>
        <div className={s.stats}>
          <div className={`${s.card} ${s.stat}`}>
            <span className={`${s.muted} ${s.small}`}>{t('history.totalTime')}</span>
            <span className={`${s.statValue} num`}>{durationWords(totalMs)}</span>
            <span className={`${s.muted} ${s.small}`}>{t('history.sessions', { n: shown.length })}</span>
          </div>
          {earned > 0 && (
            <div className={`${s.card} ${s.stat}`}>
              <span className={`${s.muted} ${s.small}`}>{t('history.earned')}</span>
              <span className={`${s.statValue} num`}>{formatMoney(earned)}</span>
            </div>
          )}
          {cost > 0 && (
            <div className={`${s.card} ${s.stat}`}>
              <span className={`${s.muted} ${s.small}`}>{t('history.cost')}</span>
              <span className={`${s.statValue} num`}>{formatMoney(cost)}</span>
            </div>
          )}
        </div>
      </section>

      {records && shown.length === 0 ? (
        <p className={s.muted}>{t('history.empty')}</p>
      ) : (
        <div className={s.card} style={{ padding: 8, overflowX: 'auto' }}>
          <table className={s.table}>
            <thead>
              <tr>
                <th scope="col">{t('history.date')}</th>
                <th scope="col">{t('history.mode')}</th>
                <th scope="col">{t('history.label')}</th>
                <th scope="col">{t('summary.duration')}</th>
                <th scope="col">{t('history.amount')}</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r, i) => (
                <tr key={`${r.endedAt}-${i}`}>
                  <td>{formatTrDate(r.endedAt)}</td>
                  <td>{modeTitle(r.modeId)}</td>
                  <td>{r.label}</td>
                  <td className="num">{formatClock(r.elapsedMs)}</td>
                  <td className="num">{amountOf(r) === null ? '—' : formatMoney(amountOf(r)!)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className={s.row} data-noprint>
        <Button onClick={() => void exportExcel()} disabled={shown.length === 0}>
          {t('history.excel')}
        </Button>
        <Button onClick={() => window.print()} disabled={shown.length === 0}>
          {t('history.pdf')}
        </Button>
      </div>
      <p className={`${s.muted} ${s.small}`}>{t('history.note')}</p>
    </div>
  );
}

export function HistoryPage() {
  return (
    <div className={s.stack}>
      <h1 className={s.h1}>{t('history.title')}</h1>
      <ProGate feature="history">
        <History />
      </ProGate>
    </div>
  );
}
