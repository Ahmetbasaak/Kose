import { useState, type FormEvent } from 'react';
import { BarChart, HBarList } from '../../components/BarChart';
import { Button } from '../../components/Button';
import { Field } from '../../components/Field';
import { LOCALE, t } from '../../i18n';
import { durationWords } from '../sessionView';
import s from './pages.module.css';

type Row = Record<string, string | number>;
interface Report {
  byEvent: Row[];
  daily: Row[];
  paths: Row[];
  devices: Row[];
}

const KEY = 'kose.statsKey';
const num = (v: unknown) => Number(v) || 0;
const nf = new Intl.NumberFormat(LOCALE);

/** /istatistik — the owner's view of anonymous counts (not linked anywhere; needs the Worker's STATS_KEY). */
export function StatsPage() {
  // sessionStorage: the key is forgotten with the tab and never lands in backups.
  const [key, setKey] = useState(() => sessionStorage.getItem(KEY) ?? '');
  const [days, setDays] = useState(30);
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async (e?: FormEvent) => {
    e?.preventDefault();
    setError(null);
    const res = await fetch(`/api/stats?days=${days}`, {
      // Header values must be ASCII; the Worker decodes, so keys like "sırrım" work.
      headers: { Authorization: `Bearer ${encodeURIComponent(key)}` },
    }).catch(() => null);
    if (!res || !res.ok) {
      const code = res ? ((await res.json().catch(() => ({}))) as { error?: string }).error : null;
      return setError(
        code === 'unauthorized'
          ? t('stats.unauthorized')
          : code === 'not-configured'
            ? t('stats.notConfigured')
            : t('stats.failed'),
      );
    }
    sessionStorage.setItem(KEY, key);
    setReport((await res.json()) as Report);
  };

  const sumOf = (event: string, field = 'count') =>
    (report?.byEvent ?? []).filter((r) => r.event === event).reduce((a, r) => a + num(r[field]), 0);
  const modes = [...new Set((report?.byEvent ?? []).filter((r) => r.mode).map((r) => String(r.mode)))];
  const modeRow = (m: string, event: string, field = 'count') =>
    num(report?.byEvent.find((r) => r.mode === m && r.event === event)?.[field]);

  return (
    <div className={s.stack}>
      <div className={s.intro}>
        <h1 className={s.h1}>{t('stats.title')}</h1>
        <p className={s.lead}>{t('stats.lead')}</p>
      </div>
      <form className={`${s.card} ${s.row}`} style={{ alignItems: 'flex-end' }} onSubmit={(e) => void load(e)}>
        <Field
          id="stats-key"
          label={t('stats.key')}
          type="password"
          autoComplete="off"
          value={key}
          onChange={(e) => setKey(e.target.value)}
        />
        <div className={s.field}>
          <label htmlFor="stats-days" className={s.label}>
            {t('stats.days', { n: days })}
          </label>
          <select id="stats-days" className={s.input} value={days} onChange={(e) => setDays(Number(e.target.value))}>
            {[7, 30, 90].map((d) => (
              <option key={d} value={d}>
                {t('stats.days', { n: d })}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" variant="primary" disabled={!key}>
          {t('stats.load')}
        </Button>
      </form>
      {error && (
        <p role="alert" className={s.error}>
          {error}
        </p>
      )}
      {report && (
        <>
          <div className={s.stats}>
            {(
              [
                ['visits', nf.format(sumOf('visit'))],
                ['starts', nf.format(sumOf('start'))],
                ['finishes', nf.format(sumOf('finish'))],
                ['shares', nf.format(sumOf('share'))],
                ['totalTime', durationWords(sumOf('finish', 'seconds') * 1000)],
              ] as const
            ).map(([k, v]) => (
              <div key={k} className={`${s.card} ${s.stat}`}>
                <span className={`${s.muted} ${s.small}`}>{t(`stats.${k}`)}</span>
                <span className={`${s.statValue} num`}>{v}</span>
              </div>
            ))}
          </div>
          <div className={s.card}>
            <BarChart
              title={t('stats.dailyVisits')}
              maxLabel={nf.format(Math.max(0, ...report.daily.map((d) => num(d.visits))))}
              bars={report.daily.map((d) => {
                const day = String(d.day).slice(5, 10);
                return {
                  key: String(d.day),
                  label: day,
                  value: num(d.visits),
                  tip: `${day}: ${nf.format(num(d.visits))}`,
                };
              })}
            />
          </div>
          <section className={s.card} aria-labelledby="st-modes">
            <h2 id="st-modes" className={s.modeTitle}>
              {t('stats.byMode')}
            </h2>
            <table className={s.table}>
              <thead>
                <tr>
                  <th scope="col">{t('stats.mode')}</th>
                  <th scope="col">{t('stats.starts')}</th>
                  <th scope="col">{t('stats.finishes')}</th>
                  <th scope="col">{t('stats.avg')}</th>
                </tr>
              </thead>
              <tbody>
                {modes.map((m) => {
                  const fin = modeRow(m, 'finish');
                  return (
                    <tr key={m}>
                      <th scope="row">{m}</th>
                      <td className="num">{nf.format(modeRow(m, 'start'))}</td>
                      <td className="num">{nf.format(fin)}</td>
                      <td className="num">
                        {fin ? durationWords((modeRow(m, 'finish', 'seconds') / fin) * 1000) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
          <div className={`${s.card} ${s.stack}`} style={{ gap: 24 }}>
            <HBarList
              title={t('stats.topPages')}
              items={report.paths.map((p) => ({
                key: String(p.path),
                label: String(p.path),
                value: num(p.visits),
                text: nf.format(num(p.visits)),
              }))}
            />
            <HBarList
              title={t('stats.devices')}
              items={report.devices.map((d) => ({
                key: `${d.device}-${d.display}`,
                label: `${d.device} · ${d.display}`,
                value: num(d.visits),
                text: nf.format(num(d.visits)),
              }))}
            />
          </div>
        </>
      )}
    </div>
  );
}
