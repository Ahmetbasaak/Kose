import { useState, type FormEvent } from 'react';
import { switchSession, useFinishSession, useStartSession } from '../../app/actions';
import { brandSlug } from '../../app/config';
import s from '../../app/pages/pages.module.css';
import { durationWords } from '../../app/sessionView';
import { Button } from '../../components/Button';
import { Field } from '../../components/Field';
import { useNow } from '../../components/useNow';
import { trWeekStart } from '../../engine/calendar';
import { formatClock } from '../../engine/format';
import { totalsBy, weekRows } from '../../engine/freelance';
import { elapsedMs } from '../../engine/timer';
import { TR_OFFSET_MS } from '../../engine/work';
import { downloadXlsx, hours } from '../../export/xlsx';
import { t } from '../../i18n';
import { useFreelanceStore, type Project } from '../../storage/freelance';
import { useSessionStore } from '../../storage/session';

const DAY = 86_400_000;
const dayFmt = new Intl.DateTimeFormat('tr-TR', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  timeZone: 'Europe/Istanbul',
});
const isoFmt = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Istanbul' }); // yyyy-mm-dd
const dayLabel = (day: number) => dayFmt.format(day * DAY - TR_OFFSET_MS + 12 * 3_600_000);

export function FreelanceSetup() {
  const { clients, projects, entries, addProject } = useFreelanceStore();
  const active = useSessionStore((st) => st.active);
  const startSession = useStartSession();
  const finishSession = useFinishSession();
  const now = useNow(1000);
  const [weekStart, setWeekStart] = useState(() => trWeekStart(Date.now()));
  const [name, setName] = useState('');
  const [clientName, setClientName] = useState('');
  const [error, setError] = useState(false);

  const clientOf = (p: Project | undefined) => clients.find((c) => c.id === p?.clientId)?.name ?? '';
  const projectById = (id: string) => projects.find((p) => p.id === id);
  const rows = weekRows(entries, weekStart);
  const total = rows.reduce((a, r) => a + r.ms, 0);
  const byClient = totalsBy(rows, (pid) => clientOf(projectById(pid)));
  const thisWeekByProject = totalsBy(weekRows(entries, trWeekStart(now)), (pid) => pid);
  const runningId = active?.modeId === 'freelance' ? active.projectId : null;

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

  const onAdd = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !clientName.trim()) return setError(true);
    addProject(name.trim(), clientName.trim());
    setName('');
    setError(false);
  };

  const exportExcel = () =>
    downloadXlsx(`${brandSlug}-zaman-${isoFmt.format(weekStart)}.xlsx`, [
      {
        name: t('freelance.reportTitle'),
        rows: [
          [t('freelance.day'), t('freelance.project'), t('freelance.client'), `${t('freelance.duration')} (saat)`],
          ...rows.map((r) => [
            isoFmt.format(r.day * DAY - TR_OFFSET_MS + 12 * 3_600_000),
            projectById(r.projectId)?.name ?? '',
            clientOf(projectById(r.projectId)),
            hours(r.ms),
          ]),
        ],
      },
      {
        name: t('freelance.byClient'),
        rows: [
          [t('freelance.client'), `${t('freelance.duration')} (saat)`],
          ...[...byClient].map(([c, ms]) => [c, hours(ms)]),
        ],
      },
    ]);

  return (
    <div className={s.split}>
      <div className={s.formCol} data-noprint>
        <section className={s.stack} style={{ gap: 12 }} aria-labelledby="fl-projects">
          <h2 id="fl-projects" className={s.modeTitle}>
            {t('freelance.projects')}
          </h2>
          {projects.length === 0 && <p className={s.muted}>{t('freelance.noProjects')}</p>}
          <ul role="list" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 12 }}>
            {projects.map((p) => {
              const running = runningId === p.id;
              const live = running && active ? elapsedMs(active.timer, now) : 0;
              return (
                <li key={p.id} className={`${s.card} ${s.spread}`} style={{ padding: '16px 20px' }}>
                  <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <strong>{p.name}</strong>
                    <span className={`${s.muted} ${s.small}`}>{clientOf(p)}</span>
                  </span>
                  <span className={s.row}>
                    <span className="num" style={{ fontSize: 18, fontWeight: 600 }}>
                      {running ? formatClock(live) : durationWords(thisWeekByProject.get(p.id) ?? 0)}
                    </span>
                    {running ? (
                      <Button aria-label={t('freelance.stopLabel', { name: p.name })} onClick={finishSession}>
                        {t('freelance.stop')}
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        aria-label={t('freelance.startLabel', { name: p.name })}
                        onClick={() => void start(p)}
                      >
                        {t('freelance.start')}
                      </Button>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className={`${s.muted} ${s.small}`}>{t('freelance.switchNote')}</p>
        </section>

        <form className={`${s.card} ${s.formCol}`} onSubmit={onAdd} noValidate aria-labelledby="fl-new">
          <h2 id="fl-new" className={s.modeTitle}>
            {t('freelance.newProject')}
          </h2>
          <div className={s.row}>
            <Field
              id="fl-name"
              label={t('freelance.projectName')}
              value={name}
              maxLength={60}
              errorId={error && !name.trim() ? 'fl-error' : null}
              onChange={(e) => setName(e.target.value)}
            />
            <Field
              id="fl-client"
              label={t('freelance.client')}
              list="fl-clients"
              value={clientName}
              maxLength={60}
              title={t('freelance.clientHint')}
              errorId={error && !clientName.trim() ? 'fl-error' : null}
              onChange={(e) => setClientName(e.target.value)}
            />
            <datalist id="fl-clients">
              {clients.map((c) => (
                <option key={c.id} value={c.name} />
              ))}
            </datalist>
          </div>
          {error && (
            <p id="fl-error" className={s.error} role="alert">
              {t('freelance.projectError')}
            </p>
          )}
          <div>
            <Button type="submit" variant="primary">
              {t('freelance.addProject')}
            </Button>
          </div>
        </form>
      </div>

      <section className={s.formCol} style={{ flexGrow: 1.4 }} aria-labelledby="fl-week">
        <div className={s.spread}>
          <h2 id="fl-week" className={s.modeTitle}>
            {t('freelance.week', { start: dayLabel(weekStart / DAY + 0.5), end: dayLabel(weekStart / DAY + 6.5) })}
          </h2>
          <span className={s.row} data-noprint>
            <Button aria-label={t('freelance.prevWeek')} onClick={() => setWeekStart(weekStart - 7 * DAY)}>
              ‹
            </Button>
            <Button aria-label={t('freelance.nextWeek')} onClick={() => setWeekStart(weekStart + 7 * DAY)}>
              ›
            </Button>
          </span>
        </div>
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
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={`${r.day}-${r.projectId}`}>
                      <td>{dayLabel(r.day)}</td>
                      <td>{projectById(r.projectId)?.name}</td>
                      <td>{clientOf(projectById(r.projectId))}</td>
                      <td className="num">{durationWords(r.ms)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="num">
              <strong>{t('freelance.total', { d: durationWords(total) })}</strong>
            </p>
            <h3 className={s.label}>{t('freelance.byClient')}</h3>
            <div className={s.card} style={{ padding: 8 }}>
              <table className={s.table}>
                <tbody>
                  {[...byClient].map(([c, ms]) => (
                    <tr key={c}>
                      <th scope="row">{c}</th>
                      <td className="num">{durationWords(ms)}</td>
                    </tr>
                  ))}
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
