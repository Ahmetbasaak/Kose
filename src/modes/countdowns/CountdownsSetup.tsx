import { useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router';
import { useStartSession } from '../../app/actions';
import s from '../../app/pages/pages.module.css';
import { daysClock, formatTrDate } from '../../app/sessionView';
import { Button } from '../../components/Button';
import { Field } from '../../components/Field';
import { useNow } from '../../components/useNow';
import {
  businessDaysUntil,
  parseIsoDate,
  targetState,
  toIcs,
  trMidnight,
  type TargetRule,
} from '../../engine/calendar';
import { brandSlug } from '../../app/config';

const DAY = 86_400_000;
import { parseTime } from '../../engine/work';
import { upcomingHolidays } from '../../data/holidays';
import { shareCountdownUrl } from '../../share/link';
import { t } from '../../i18n';
import { useCountdownsStore, type CountdownTemplate, type SavedCountdown } from '../../storage/countdowns';

const TEMPLATES: CountdownTemplate[] = ['weekend', 'payday', 'holiday', 'vacation', 'birthday', 'exam', 'custom'];
type FormError = 'title' | 'payday' | 'holiday' | 'date' | 'past';

function CountdownItem({ item, now }: { item: SavedCountdown; now: number }) {
  const remove = useCountdownsStore((st) => st.remove);
  const startSession = useStartSession();
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const ts = targetState(item.rule, now);
  const arrived = ts.arrived || ts.remainingMs === 0;
  return (
    <li className={`${s.card}`} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <h3 className={s.modeTitle}>{item.title}</h3>
      <span className={`${s.statValue} num`} role="timer">
        {arrived
          ? item.rule.type === 'weekend'
            ? t('countdowns.weekendArrived')
            : t('countdowns.arrived')
          : daysClock(ts.remainingMs)}
      </span>
      <span className={`${s.muted} ${s.small}`}>
        {formatTrDate(ts.at)}
        {!arrived &&
          ts.remainingMs >= DAY &&
          ` · ${t('countdowns.businessDays', { n: businessDaysUntil(now, ts.at, upcomingHolidays(now)) })}`}
      </span>
      {item.unverified && <span className={`${s.muted} ${s.small}`}>{t('countdowns.unverified')}</span>}
      {shareMsg && (
        <span role="status" className={`${s.muted} ${s.small}`} style={{ overflowWrap: 'anywhere' }}>
          {shareMsg} {t('shared.linkNote')}
        </span>
      )}
      <div className={s.row} style={{ marginTop: 'auto' }}>
        <Button
          variant="primary"
          onClick={() =>
            void startSession(
              { modeId: 'countdowns', kind: 'target', label: item.title, durationMs: null, target: item.rule },
              { askNotify: true },
            )
          }
        >
          {t('countdowns.showInCorner')}
        </Button>
        <Button
          onClick={async () => {
            // Recurring rules share their next occurrence as a fixed moment.
            const url = shareCountdownUrl(location.origin, item.title, ts.at);
            if (navigator.share) {
              await navigator.share({ title: item.title, url }).catch(() => undefined);
              return;
            }
            const copied = await navigator.clipboard?.writeText(url).then(
              () => true,
              () => false,
            );
            setShareMsg(copied ? t('shared.copied') : t('shared.copyFailed', { url }));
          }}
        >
          {t('shared.shareLink')}
        </Button>
        <Button
          onClick={() => {
            const blob = new Blob([toIcs(item.title, item.rule, Date.now(), `${item.id}@kose`)], {
              type: 'text/calendar',
            });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `${brandSlug}-${item.id.slice(0, 8)}.ics`;
            document.body.append(a);
            a.click();
            a.remove();
          }}
        >
          {t('countdowns.addToCalendar')}
        </Button>
        <Button aria-label={t('countdowns.removeLabel', { title: item.title })} onClick={() => remove(item.id)}>
          {t('countdowns.remove')}
        </Button>
      </div>
    </li>
  );
}

export function CountdownsSetup() {
  const items = useCountdownsStore((st) => st.items);
  const add = useCountdownsStore((st) => st.add);
  const now = useNow(1000);
  const holidays = upcomingHolidays(now);
  const [params] = useSearchParams();
  const [template, setTemplate] = useState<CountdownTemplate>(params.get('sablon') === 'sinav' ? 'exam' : 'weekend');
  const [title, setTitle] = useState('');
  const [payday, setPayday] = useState('15');
  const [holidayId, setHolidayId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [error, setError] = useState<FormError | null>(null);

  const needsDate = template === 'vacation' || template === 'birthday' || template === 'exam' || template === 'custom';
  const holiday = holidays.find((h) => h.id === (holidayId || holidays[0]?.id));

  function build(): { rule: TargetRule; title: string; unverified?: boolean } | FormError {
    const name = title.trim() || (template === 'holiday' ? holiday?.name : t(`countdowns.defaultTitles.${template}`));
    if (!name) return 'title';
    if (template === 'weekend') return { rule: { type: 'weekend' }, title: name };
    if (template === 'payday') {
      const d = Number(payday);
      return Number.isInteger(d) && d >= 1 && d <= 31 ? { rule: { type: 'payday', day: d }, title: name } : 'payday';
    }
    if (template === 'holiday')
      return holiday
        ? { rule: { type: 'at', at: holiday.at }, title: name, unverified: holiday.source === 'calculated' }
        : 'holiday';
    const ymd = parseIsoDate(date);
    if (!ymd) return 'date';
    if (template === 'birthday') return { rule: { type: 'yearly', m: ymd.m, d: ymd.d }, title: name };
    const minutes = template === 'custom' && time ? parseTime(time) : 0;
    if (!Number.isFinite(minutes)) return 'date';
    const at = trMidnight(ymd.y, ymd.m, ymd.d) + minutes * 60_000;
    return at <= now ? 'past' : { rule: { type: 'at', at }, title: name };
  }

  const fieldFor: Record<FormError, string> = {
    title: 'cd-title',
    payday: 'cd-payday',
    holiday: 'cd-holiday',
    date: 'cd-date',
    past: 'cd-date',
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const result = build();
    if (typeof result === 'string') {
      setError(result);
      document.getElementById(fieldFor[result])?.focus();
      return;
    }
    add({ template, ...result });
    setError(null);
    setTitle('');
    setDate('');
    setTime('');
  };
  const errId = (field: string) => (error && fieldFor[error] === field ? 'cd-error' : null);

  return (
    <div className={s.stack}>
      <section aria-labelledby="cd-list-title" className={s.stack} style={{ gap: 16 }}>
        <h2 id="cd-list-title" className={s.modeTitle}>
          {t('countdowns.listTitle')}
        </h2>
        {items.length === 0 ? (
          <p className={s.muted}>{t('countdowns.empty')}</p>
        ) : (
          <ul className={s.grid} role="list" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {items.map((item) => (
              <CountdownItem key={item.id} item={item} now={now} />
            ))}
          </ul>
        )}
      </section>

      <form
        className={`${s.card} ${s.formCol}`}
        style={{ maxWidth: 640 }}
        onSubmit={onSubmit}
        noValidate
        aria-labelledby="cd-add-title"
      >
        <h2 id="cd-add-title" className={s.modeTitle}>
          {t('countdowns.addTitle')}
        </h2>
        <div className={s.field}>
          <label htmlFor="cd-template" className={s.label}>
            {t('countdowns.template')}
          </label>
          <select
            id="cd-template"
            className={s.input}
            value={template}
            onChange={(e) => {
              setTemplate(e.target.value as CountdownTemplate);
              setError(null);
            }}
          >
            {TEMPLATES.map((k) => (
              <option key={k} value={k}>
                {t(`countdowns.templates.${k}`)}
              </option>
            ))}
          </select>
        </div>

        {template === 'payday' && (
          <div className={s.row}>
            <Field
              id="cd-payday"
              label={t('countdowns.payday')}
              type="number"
              inputMode="numeric"
              min={1}
              max={31}
              value={payday}
              errorId={errId('cd-payday')}
              onChange={(e) => setPayday(e.target.value)}
            />
          </div>
        )}

        {template === 'holiday' &&
          (holidays.length === 0 ? (
            <p className={s.muted}>{t('countdowns.noHolidays')}</p>
          ) : (
            <div className={s.field}>
              <label htmlFor="cd-holiday" className={s.label}>
                {t('countdowns.holiday')}
              </label>
              <select
                id="cd-holiday"
                className={s.input}
                value={holiday?.id ?? ''}
                aria-describedby={holiday?.source === 'calculated' ? 'cd-holiday-note' : undefined}
                onChange={(e) => setHolidayId(e.target.value)}
              >
                {holidays.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} · {formatTrDate(h.at)}
                    {h.source === 'calculated' ? ' *' : ''}
                  </option>
                ))}
              </select>
              {holiday?.source === 'calculated' && (
                <span id="cd-holiday-note" className={`${s.muted} ${s.small}`}>
                  * {t('countdowns.unverified')}
                </span>
              )}
            </div>
          ))}

        {needsDate && (
          <div className={s.row}>
            <Field
              id="cd-date"
              label={t('countdowns.date')}
              type="date"
              value={date}
              errorId={errId('cd-date')}
              onChange={(e) => setDate(e.target.value)}
            />
            {template === 'custom' && (
              <Field
                id="cd-time"
                label={t('countdowns.time')}
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            )}
          </div>
        )}

        <Field
          id="cd-title"
          label={t('countdowns.title')}
          value={title}
          maxLength={40}
          placeholder={template === 'holiday' ? (holiday?.name ?? '') : t(`countdowns.defaultTitles.${template}`)}
          errorId={errId('cd-title')}
          onChange={(e) => setTitle(e.target.value)}
        />

        {error && (
          <p id="cd-error" className={s.error} role="alert">
            {t(`countdowns.errors.${error}`)}
          </p>
        )}
        <div>
          <Button type="submit" variant="primary">
            {t('countdowns.add')}
          </Button>
        </div>
      </form>
    </div>
  );
}
