import { useState, type FormEvent } from 'react';
import { useLaunchCorner } from '../../app/actions';
import { requestNotificationPermission } from '../../app/alerts';
import s from '../../app/pages/pages.module.css';
import { Button } from '../../components/Button';
import { CornerFace } from '../../components/corner/CornerView';
import { isPipSupported } from '../../components/corner/pip';
import { formatClock } from '../../engine/format';
import { t } from '../../i18n';
import { useSessionStore, type TimerKind } from '../../storage/session';

const toInt = (v: string) => Math.max(0, Math.floor(Number(v) || 0));

export function SimpleSetup() {
  const [kind, setKind] = useState<TimerKind>('countdown');
  const [label, setLabel] = useState('');
  const [minutes, setMinutes] = useState('25');
  const [seconds, setSeconds] = useState('0');
  const [error, setError] = useState(false);
  const start = useSessionStore((st) => st.start);
  const launch = useLaunchCorner();

  const durationMs = (toInt(minutes) * 60 + toInt(seconds)) * 1000;
  const name = label.trim() || t('simple.defaultLabel');

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (kind === 'countdown' && durationMs < 1000) return setError(true);
    if (useSessionStore.getState().active && !window.confirm(t('setup.replaceConfirm'))) return;
    setError(false);
    start({ modeId: 'simple', kind, label: name, durationMs: kind === 'countdown' ? durationMs : null });
    await launch();
    if (kind === 'countdown') requestNotificationPermission();
  };

  return (
    <div className={s.split}>
      <form className={`${s.card} ${s.formCol}`} onSubmit={(e) => void onSubmit(e)} noValidate>
        <fieldset className={s.fieldset}>
          <legend className={s.label}>{t('simple.kindLegend')}</legend>
          {(['countdown', 'stopwatch'] as const).map((k) => (
            <label key={k} className={s.radio}>
              <input type="radio" name="kind" value={k} checked={kind === k} onChange={() => setKind(k)} />
              {t(`simple.${k}`)}
            </label>
          ))}
        </fieldset>

        <div className={s.field}>
          <label htmlFor="simple-label" className={s.label}>
            {t('simple.label')}
          </label>
          <input
            id="simple-label"
            className={s.input}
            value={label}
            maxLength={40}
            placeholder={t('simple.labelPlaceholder')}
            onChange={(e) => setLabel(e.target.value)}
          />
        </div>

        {kind === 'countdown' && (
          <div className={s.row} style={{ alignItems: 'flex-end' }}>
            <div className={s.field}>
              <label htmlFor="simple-min" className={s.label}>
                {t('simple.minutes')}
              </label>
              <input
                id="simple-min"
                className={s.input}
                type="number"
                inputMode="numeric"
                min={0}
                max={1440}
                value={minutes}
                aria-invalid={error}
                aria-describedby={error ? 'simple-error' : undefined}
                onChange={(e) => setMinutes(e.target.value)}
              />
            </div>
            <div className={s.field}>
              <label htmlFor="simple-sec" className={s.label}>
                {t('simple.seconds')}
              </label>
              <input
                id="simple-sec"
                className={s.input}
                type="number"
                inputMode="numeric"
                min={0}
                max={59}
                value={seconds}
                aria-invalid={error}
                aria-describedby={error ? 'simple-error' : undefined}
                onChange={(e) => setSeconds(e.target.value)}
              />
            </div>
          </div>
        )}
        {error && (
          <p id="simple-error" className={s.error} role="alert">
            {t('simple.durationError')}
          </p>
        )}

        <div>
          <Button type="submit" variant="primary">
            {t('setup.startInCorner')}
          </Button>
        </div>
        {!isPipSupported() && <p className={`${s.muted} ${s.small}`}>{t('setup.pipUnsupported')}</p>}
      </form>

      <div className={s.previewCol}>
        <span className={`${s.label} ${s.muted}`}>{t('setup.preview')}</span>
        <CornerFace
          variant="preview"
          label={name}
          display={{
            value: formatClock(kind === 'countdown' ? durationMs : 0),
            status: 'running',
            caption: kind === 'countdown' ? t('timer.remaining') : t('timer.elapsed'),
            canPause: true,
          }}
        />
      </div>
    </div>
  );
}
