import { useEffect, useState, type FormEvent } from 'react';
import { playChime } from '../../app/alerts';
import s from '../../app/pages/pages.module.css';
import { Button } from '../../components/Button';
import { Field } from '../../components/Field';
import { useNow } from '../../components/useNow';
import { formatClock } from '../../engine/format';
import { elapsedMs, isRunning, remainingMs } from '../../engine/timer';
import { t } from '../../i18n';
import { useMultiStore } from '../../storage/multi';

export function MultiSetup() {
  const { items, add, toggle, reset, remove, markAlerted } = useMultiStore();
  const now = useNow(250, window, items.length > 0);
  const [label, setLabel] = useState('');
  const [minutes, setMinutes] = useState('');
  const [error, setError] = useState(false);

  // One chime per finished countdown; `alerted` is persisted so a reload stays quiet.
  useEffect(() => {
    for (const m of items)
      if (m.durationMs !== null && !m.alerted && remainingMs(m.timer, m.durationMs, now) === 0) {
        markAlerted(m.id);
        playChime(2);
      }
  }, [items, now, markAlerted]);

  const onAdd = (e: FormEvent) => {
    e.preventDefault();
    const n = minutes.trim() === '' ? null : Number(minutes);
    if (n !== null && !(Number.isFinite(n) && n > 0 && n <= 1440)) return setError(true);
    setError(false);
    add(label.trim() || t('multi.defaultLabel', { n: items.length + 1 }), n === null ? null : n * 60_000);
    setLabel('');
    setMinutes('');
  };

  return (
    <div className={s.stack}>
      {items.length === 0 ? (
        <p className={s.muted}>{t('multi.empty')}</p>
      ) : (
        <ul className={s.grid} role="list" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {items.map((m) => {
            const left = m.durationMs === null ? null : remainingMs(m.timer, m.durationMs, now);
            const done = left === 0;
            return (
              <li
                key={m.id}
                className={s.liveCard}
                data-level={done ? 'red' : undefined}
                style={{ gap: 12, padding: 24 }}
              >
                <span className={s.liveCaption}>{m.label}</span>
                <span className={`${s.statValue} num`} role="timer" style={{ fontSize: 44 }}>
                  {left === null ? formatClock(elapsedMs(m.timer, now)) : formatClock(left, 'ceil')}
                </span>
                <span className={s.row}>
                  {!done && (
                    <Button
                      className={s.onDark}
                      aria-label={t(isRunning(m.timer) ? 'multi.pauseLabel' : 'multi.resumeLabel', { label: m.label })}
                      onClick={() => toggle(m.id)}
                    >
                      {isRunning(m.timer) ? t('timer.pause') : t('timer.resume')}
                    </Button>
                  )}
                  <Button
                    className={s.onDark}
                    aria-label={t('multi.resetLabel', { label: m.label })}
                    onClick={() => reset(m.id)}
                  >
                    {t('multi.reset')}
                  </Button>
                  <Button
                    className={s.onDark}
                    aria-label={t('multi.removeLabel', { label: m.label })}
                    onClick={() => remove(m.id)}
                  >
                    ×
                  </Button>
                </span>
              </li>
            );
          })}
        </ul>
      )}
      <form className={`${s.card} ${s.formCol}`} style={{ maxWidth: 640 }} onSubmit={onAdd} noValidate>
        <div className={s.row}>
          <Field
            id="multi-label"
            label={t('multi.label')}
            value={label}
            maxLength={40}
            onChange={(e) => setLabel(e.target.value)}
          />
          <Field
            id="multi-min"
            label={t('multi.minutes')}
            type="number"
            inputMode="numeric"
            min={1}
            value={minutes}
            errorId={error ? 'multi-error' : null}
            onChange={(e) => setMinutes(e.target.value)}
          />
        </div>
        {error && (
          <p id="multi-error" className={s.error} role="alert">
            {t('multi.error')}
          </p>
        )}
        <div>
          <Button type="submit" variant="primary">
            {t('multi.add')}
          </Button>
        </div>
        <p className={`${s.muted} ${s.small}`}>{t('multi.note')}</p>
      </form>
    </div>
  );
}
