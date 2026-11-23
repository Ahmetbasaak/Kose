import { useState, type FormEvent } from 'react';
import { switchSession, useFinishSession, useStartSession } from '../../app/actions';
import { brandSlug } from '../../app/config';
import s from '../../app/pages/pages.module.css';
import { durationWords } from '../../app/sessionView';
import { Button } from '../../components/Button';
import { Field } from '../../components/Field';
import { useNow } from '../../components/useNow';
import { trMidnight, trWeekStart, trYmd } from '../../engine/calendar';
import { formatClock, formatMoney } from '../../engine/format';
import { amountFor, manualEntry, roundUp, totalsBy, weekRows } from '../../engine/freelance';
import { elapsedMs, isRunning } from '../../engine/timer';
import { TR_OFFSET_MS } from '../../engine/work';
import { downloadXlsx, hours } from '../../export/xlsx';
import { parseAmount, LOCALE, t } from '../../i18n';
import { useFreelanceStore, type Project } from '../../storage/freelance';
import { useSessionStore } from '../../storage/session';

const DAY = 86_400_000;
const LONG_RUN_MS = 8 * 3_600_000;
const tz = { timeZone: 'Europe/Istanbul' } as const;
const monthFmt = new Intl.DateTimeFormat(LOCALE, { month: 'long', year: 'numeric', ...tz });
const dayFmt = new Intl.DateTimeFormat(LOCALE, { weekday: 'short', day: 'numeric', month: 'short', ...tz });
const timeFmt = new Intl.DateTimeFormat(LOCALE, { hour: '2-digit', minute: '2-digit', ...tz });
const isoFmt = new Intl.DateTimeFormat('sv-SE', tz); // yyyy-mm-dd
const dayLabel = (day: number) => dayFmt.format(day * DAY - TR_OFFSET_MS + 12 * 3_600_000);
const money = (v: number | null) => (v === null ? '—' : formatMoney(v));

/** Optional ₺ amount: '' → null, otherwise a positive number or NaN (invalid). */
const optionalRate = (v: string) => (v.trim() === '' ? null : parseAmount(v) > 0 ? parseAmount(v) : NaN);

export function FreelanceSetup() {
  const store = useFreelanceStore();
  const { clients, projects, entries } = store;
  const active = useSessionStore((st) => st.active);
  const togglePause = useSessionStore((st) => st.togglePause);
  const startSession = useStartSession();
  const finishSession = useFinishSession();
  const now = useNow(1000);
  // The report covers a week or a month around this anchor.
  const [anchor, setAnchor] = useState(() => trWeekStart(Date.now()));
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [clientFilter, setClientFilter] = useState('');
  const [name, setName] = useState('');
  const [clientName, setClientName] = useState('');
  const [rate, setRate] = useState('');
  const [projectError, setProjectError] = useState<'name' | 'rate' | null>(null);
  const [manual, setManual] = useState(() => ({
    projectId: '',
    date: isoFmt.format(Date.now()),
    start: '09:00',
    end: '10:00',
    note: '',
  }));
  const [manualMsg, setManualMsg] = useState<'error' | 'added' | null>(null);

  const projectById = (id: string) => projects.find((p) => p.id === id);
  const clientOf = (p: Project | undefined) => clients.find((c) => c.id === p?.clientId)?.name ?? '';
  // Non-billable projects still count as time, never as money.
  const rateOf = (pid: string) =>
    projectById(pid)?.billable === false ? null : (projectById(pid)?.hourlyRate ?? null);
  const { y: ay, m: am } = trYmd(anchor);
  const rangeStart = period === 'week' ? trWeekStart(anchor) : trMidnight(ay, am, 1);
  const rangeEnd = period === 'week' ? rangeStart + 7 * DAY : trMidnight(ay, am + 1, 1);
  const shift = (dir: 1 | -1) => setAnchor(period === 'week' ? anchor + dir * 7 * DAY : trMidnight(ay, am + dir, 1));
  const inFilter = (pid: string) => !clientFilter || projectById(pid)?.clientId === clientFilter;
  const billMs = (ms: number) => roundUp(ms, store.rounding);
  const rows = weekRows(
    entries.filter((e) => inFilter(e.projectId)),
    rangeStart,
    rangeEnd,
    (e) => billMs(e.elapsedMs),
  );
  const anyRate = projects.some((p) => p.hourlyRate && p.billable !== false);
  const total = rows.reduce((a, r) => a + r.ms, 0);
  const totalAmount = rows.reduce((a, r) => a + (amountFor(r.ms, rateOf(r.projectId)) ?? 0), 0);
  const clientTime = totalsBy(rows, (pid) => clientOf(projectById(pid)));
  const clientMoney = new Map<string, number>();
  for (const r of rows) {
    const c = clientOf(projectById(r.projectId));
    clientMoney.set(c, (clientMoney.get(c) ?? 0) + (amountFor(r.ms, rateOf(r.projectId)) ?? 0));
  }
  const weekEntries = entries
    .filter((e) => e.startedAt >= rangeStart && e.startedAt < rangeEnd && inFilter(e.projectId))
    .sort((a, b) => a.startedAt - b.startedAt);
  const thisWeekByProject = totalsBy(weekRows(entries, trWeekStart(now)), (pid) => pid);
  const running = active?.modeId === 'freelance' ? active : null;

  const start = async (p: Project) => {
    const input = {
      modeId: 'freelance' as const,
      kind: 'stopwatch' as const,
      label: `${p.name} · ${clientOf(p)}`,
      durationMs: null,
      projectId: p.id,
    };
    // One timer at a time: switching projects saves the previous one's time without asking.
    if (useSessionStore.getState().active?.modeId === 'freelance') switchSession(input);
    else await startSession(input);
  };

  const onAddProject = (e: FormEvent) => {
    e.preventDefault();
    const r = optionalRate(rate);
    if (!name.trim() || !clientName.trim()) return setProjectError('name');
    if (Number.isNaN(r)) return setProjectError('rate');
    store.addProject(name.trim(), clientName.trim(), r);
    setName('');
    setRate('');
    setProjectError(null);
  };

  const onAddEntry = (e: FormEvent) => {
    e.preventDefault();
    const entry = manualEntry(manual.date, manual.start, manual.end);
    const projectId = manual.projectId || projects[0]?.id;
    if (!entry || !projectId) return setManualMsg('error');
    store.addEntry({ ...entry, projectId, note: manual.note.trim() || undefined });
    setManual({ ...manual, note: '' });
    setManualMsg('added');
  };

  const exportExcel = () =>
    downloadXlsx(`${brandSlug}-zaman-${isoFmt.format(rangeStart)}.xlsx`, [
      {
        name: t('freelance.reportTitle'),
        rows: [
          [
            t('freelance.day'),
            t('freelance.project'),
            t('freelance.client'),
            t('export.hours'),
            `${t('freelance.amount')} (₺)`,
          ],
          ...rows.map((r) => [
            isoFmt.format(r.day * DAY - TR_OFFSET_MS + 12 * 3_600_000),
            projectById(r.projectId)?.name ?? '',
            clientOf(projectById(r.projectId)),
            hours(r.ms),
            amountFor(r.ms, rateOf(r.projectId)) ?? '',
          ]),
        ],
      },
      {
        name: t('freelance.byClient'),
        rows: [
          [t('freelance.client'), t('export.hours'), `${t('freelance.amount')} (₺)`],
          ...[...clientTime].map(([c, ms]) => [c, hours(ms), anyRate ? (clientMoney.get(c) ?? 0) : '']),
        ],
      },
      {
        name: t('freelance.entries'),
        rows: [
          [
            t('freelance.date'),
            t('freelance.startTime'),
            t('freelance.endTime'),
            t('freelance.project'),
            t('export.hours'),
            t('freelance.noteHeader'),
          ],
          ...weekEntries.map((en) => [
            isoFmt.format(en.startedAt),
            timeFmt.format(en.startedAt),
            timeFmt.format(en.endedAt),
            projectById(en.projectId)?.name ?? '',
            hours(billMs(en.elapsedMs)),
            en.note ?? '',
          ]),
        ],
      },
    ]);

  return (
    <div className={s.split}>
      <div className={s.formCol} data-noprint>
        <section className={`${s.card} ${s.stack}`} style={{ gap: 8 }} aria-labelledby="fl-how">
          <h2 id="fl-how" className={s.label} style={{ fontSize: 16 }}>
            {t('freelance.howTitle')}
          </h2>
          <ul className={s.small} style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 4 }}>
            <li>{t('freelance.how1')}</li>
            <li>{t('freelance.how2')}</li>
            <li>{t('freelance.how3')}</li>
          </ul>
        </section>

        <section className={s.stack} style={{ gap: 12 }} aria-labelledby="fl-projects">
          <h2 id="fl-projects" className={s.modeTitle}>
            {t('freelance.projects')}
          </h2>
          {projects.length === 0 && <p className={s.muted}>{t('freelance.noProjects')}</p>}
          <ul role="list" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 12 }}>
            {projects.map((p) => {
              const isOn = running?.projectId === p.id;
              const live = isOn ? elapsedMs(running.timer, now) : 0;
              const paused = isOn && !isRunning(running.timer);
              return (
                <li key={p.id} className={`${s.card} ${s.stack}`} style={{ padding: '16px 20px', gap: 10 }}>
                  <div className={s.spread}>
                    <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <strong>{p.name}</strong>
                      <span className={`${s.muted} ${s.small}`}>
                        {clientOf(p)}
                        {p.hourlyRate ? ` · ${t('freelance.rateShort', { rate: formatMoney(p.hourlyRate) })}` : ''}
                      </span>
                    </span>
                    <span className="num" style={{ fontSize: 20, fontWeight: 600 }} role={isOn ? 'timer' : undefined}>
                      {isOn ? formatClock(live) : durationWords(thisWeekByProject.get(p.id) ?? 0)}
                    </span>
                  </div>
                  <label className={`${s.radio} ${s.small}`} style={{ minHeight: 32 }}>
                    <input
                      type="checkbox"
                      checked={p.billable !== false}
                      onChange={(e) => store.setBillable(p.id, e.target.checked)}
                    />
                    {t('freelance.billable')}
                  </label>
                  {paused && <span className={`${s.muted} ${s.small}`}>{t('freelance.paused')}</span>}
                  {isOn && live > LONG_RUN_MS && (
                    <p role="status" className={s.error}>
                      {t('freelance.longRunning', { h: Math.floor(live / 3_600_000) })}
                    </p>
                  )}
                  <div className={s.row}>
                    {isOn ? (
                      <>
                        <Button
                          aria-label={t(paused ? 'freelance.resumeLabel' : 'freelance.pauseLabel', { name: p.name })}
                          onClick={() => togglePause()}
                        >
                          {paused ? t('freelance.resume') : t('freelance.pause')}
                        </Button>
                        <Button
                          variant="primary"
                          aria-label={t('freelance.stopLabel', { name: p.name })}
                          onClick={finishSession}
                        >
                          {t('freelance.stop')}
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="primary"
                        aria-label={t('freelance.startLabel', { name: p.name })}
                        onClick={() => void start(p)}
                      >
                        {t('freelance.start')}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      aria-label={t('freelance.removeProject', { name: p.name })}
                      disabled={isOn}
                      onClick={() =>
                        window.confirm(t('freelance.removeConfirm', { name: p.name })) && store.removeProject(p.id)
                      }
                    >
                      ×
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
          <p className={`${s.muted} ${s.small}`}>{t('freelance.switchNote')}</p>
        </section>

        <form className={`${s.card} ${s.formCol}`} onSubmit={onAddProject} noValidate aria-labelledby="fl-new">
          <h2 id="fl-new" className={s.modeTitle}>
            {t('freelance.newProject')}
          </h2>
          <div className={s.row}>
            <Field
              id="fl-name"
              label={t('freelance.projectName')}
              value={name}
              maxLength={60}
              errorId={projectError === 'name' && !name.trim() ? 'fl-error' : null}
              onChange={(e) => setName(e.target.value)}
            />
            <Field
              id="fl-client"
              label={t('freelance.client')}
              list="fl-clients"
              value={clientName}
              maxLength={60}
              title={t('freelance.clientHint')}
              errorId={projectError === 'name' && !clientName.trim() ? 'fl-error' : null}
              onChange={(e) => setClientName(e.target.value)}
            />
            <datalist id="fl-clients">
              {clients.map((c) => (
                <option key={c.id} value={c.name} />
              ))}
            </datalist>
          </div>
          <div className={s.row}>
            <Field
              id="fl-rate"
              label={t('freelance.rate')}
              inputMode="decimal"
              value={rate}
              errorId={projectError === 'rate' ? 'fl-error' : null}
              onChange={(e) => setRate(e.target.value)}
            />
          </div>
          {projectError && (
            <p id="fl-error" className={s.error} role="alert">
              {projectError === 'rate' ? t('freelance.rateError') : t('freelance.projectError')}
            </p>
          )}
          <div>
            <Button type="submit" variant="primary">
              {t('freelance.addProject')}
            </Button>
          </div>
        </form>

        {projects.length > 0 && (
          <form className={`${s.card} ${s.formCol}`} onSubmit={onAddEntry} noValidate aria-labelledby="fl-manual">
            <h2 id="fl-manual" className={s.modeTitle}>
              {t('freelance.manualTitle')}
            </h2>
            <p className={`${s.muted} ${s.small}`}>{t('freelance.manualNote')}</p>
            <div className={s.field}>
              <label htmlFor="fl-m-project" className={s.label}>
                {t('freelance.project')}
              </label>
              <select
                id="fl-m-project"
                className={s.input}
                value={manual.projectId || projects[0]!.id}
                onChange={(e) => setManual({ ...manual, projectId: e.target.value })}
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {clientOf(p)}
                  </option>
                ))}
              </select>
            </div>
            <div className={s.row}>
              <Field
                id="fl-m-date"
                label={t('freelance.date')}
                type="date"
                value={manual.date}
                errorId={manualMsg === 'error' ? 'fl-m-msg' : null}
                onChange={(e) => setManual({ ...manual, date: e.target.value })}
              />
              <Field
                id="fl-m-start"
                label={t('freelance.startTime')}
                type="time"
                value={manual.start}
                errorId={manualMsg === 'error' ? 'fl-m-msg' : null}
                onChange={(e) => setManual({ ...manual, start: e.target.value })}
              />
              <Field
                id="fl-m-end"
                label={t('freelance.endTime')}
                type="time"
                value={manual.end}
                errorId={manualMsg === 'error' ? 'fl-m-msg' : null}
                onChange={(e) => setManual({ ...manual, end: e.target.value })}
              />
            </div>
            <Field
              id="fl-m-note"
              label={t('freelance.note')}
              placeholder={t('freelance.notePlaceholder')}
              maxLength={200}
              value={manual.note}
              onChange={(e) => setManual({ ...manual, note: e.target.value })}
            />
            {manualMsg && (
              <p
                id="fl-m-msg"
                role={manualMsg === 'error' ? 'alert' : 'status'}
                className={manualMsg === 'error' ? s.error : s.muted}
              >
                {manualMsg === 'error' ? t('freelance.manualError') : t('freelance.added')}
              </p>
            )}
            <div>
              <Button type="submit">{t('freelance.addEntry')}</Button>
            </div>
          </form>
        )}
      </div>

      <section className={s.formCol} style={{ flexGrow: 1.4 }} aria-labelledby="fl-week">
        <div className={s.spread}>
          <h2 id="fl-week" className={s.modeTitle}>
            {period === 'week'
              ? t('freelance.week', { start: dayLabel(rangeStart / DAY + 0.5), end: dayLabel(rangeStart / DAY + 6.5) })
              : monthFmt.format(rangeStart + 12 * 3_600_000)}
          </h2>
          <span className={s.row} data-noprint>
            <Button aria-label={t('freelance.prevWeek')} onClick={() => shift(-1)}>
              ‹
            </Button>
            <Button aria-label={t('freelance.nextWeek')} onClick={() => shift(1)}>
              ›
            </Button>
          </span>
        </div>
        <div className={s.row} data-noprint>
          <fieldset className={s.fieldset} style={{ flexDirection: 'row', gap: 12 }}>
            <legend className="visually-hidden">{t('freelance.period')}</legend>
            {(['week', 'month'] as const).map((k) => (
              <label key={k} className={s.radio}>
                <input
                  type="radio"
                  name="fl-period"
                  checked={period === k}
                  onChange={() => {
                    setPeriod(k);
                    setAnchor(rangeStart);
                  }}
                />
                {t(`freelance.periods.${k}`)}
              </label>
            ))}
          </fieldset>
          <div className={s.field}>
            <label htmlFor="fl-client-filter" className={s.label}>
              {t('freelance.clientFilter')}
            </label>
            <select
              id="fl-client-filter"
              className={s.input}
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
            >
              <option value="">{t('freelance.allClients')}</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className={s.field}>
            <label htmlFor="fl-rounding" className={s.label}>
              {t('freelance.rounding')}
            </label>
            <select
              id="fl-rounding"
              className={s.input}
              value={store.rounding}
              aria-describedby="fl-rounding-note"
              onChange={(e) => store.setRounding(Number(e.target.value))}
            >
              {([0, 5, 15, 30] as const).map((m) => (
                <option key={m} value={m}>
                  {t(`freelance.roundings.r${m}`)}
                </option>
              ))}
            </select>
          </div>
        </div>
        {store.rounding > 0 && (
          <p id="fl-rounding-note" className={`${s.muted} ${s.small}`}>
            {t('freelance.roundNote')}
          </p>
        )}
        {rows.length === 0 ? (
          <p className={s.muted}>{t('freelance.empty')}</p>
        ) : (
          <>
            <div className={s.card} style={{ padding: 8, overflowX: 'auto' }}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th scope="col">{t('freelance.day')}</th>
                    <th scope="col">{t('freelance.project')}</th>
                    <th scope="col">{t('freelance.client')}</th>
                    <th scope="col">{t('freelance.duration')}</th>
                    {anyRate && <th scope="col">{t('freelance.amount')}</th>}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={`${r.day}-${r.projectId}`}>
                      <td>{dayLabel(r.day)}</td>
                      <td>{projectById(r.projectId)?.name}</td>
                      <td>{clientOf(projectById(r.projectId))}</td>
                      <td className="num">{durationWords(r.ms)}</td>
                      {anyRate && <td className="num">{money(amountFor(r.ms, rateOf(r.projectId)))}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="num">
              <strong>{t('freelance.total', { d: durationWords(total) })}</strong>
              {anyRate && <> · {t('freelance.totalAmount', { v: formatMoney(totalAmount) })}</>}
            </p>

            <h3 className={s.label}>{t('freelance.byClient')}</h3>
            <div className={s.card} style={{ padding: 8 }}>
              <table className={s.table}>
                <tbody>
                  {[...clientTime].map(([c, ms]) => (
                    <tr key={c}>
                      <th scope="row">{c}</th>
                      <td className="num">{durationWords(ms)}</td>
                      {anyRate && <td className="num">{formatMoney(clientMoney.get(c) ?? 0)}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 className={s.label}>{t('freelance.entries')}</h3>
            <div className={s.card} style={{ padding: 8, overflowX: 'auto' }}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th scope="col">{t('freelance.day')}</th>
                    <th scope="col">{t('freelance.time')}</th>
                    <th scope="col">{t('freelance.project')}</th>
                    <th scope="col">{t('freelance.duration')}</th>
                    <th scope="col">{t('freelance.noteHeader')}</th>
                    <th scope="col" data-noprint>
                      <span className="visually-hidden">{t('countdowns.remove')}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {weekEntries.map((en) => {
                    const pname = projectById(en.projectId)?.name ?? '';
                    const range = `${timeFmt.format(en.startedAt)}–${timeFmt.format(en.endedAt)}`;
                    return (
                      <tr key={en.id}>
                        <td>{dayFmt.format(en.startedAt)}</td>
                        <td className="num">{range}</td>
                        <td>{pname}</td>
                        <td className="num">{durationWords(en.elapsedMs)}</td>
                        <td>{en.note ?? ''}</td>
                        <td data-noprint>
                          <Button
                            variant="ghost"
                            aria-label={t('freelance.removeEntry', { name: pname, time: range })}
                            onClick={() => store.removeEntry(en.id)}
                          >
                            ×
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className={s.row} data-noprint>
              <Button onClick={() => void exportExcel()}>{t('freelance.excel')}</Button>
              <Button onClick={() => window.print()}>{t('freelance.pdf')}</Button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
