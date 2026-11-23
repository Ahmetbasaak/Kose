import { useState, type FormEvent } from 'react';
import { useLaunchCorner } from '../../app/actions';
import s from '../../app/pages/pages.module.css';
import { durationWords, type SessionDisplay } from '../../app/sessionView';
import { Button } from '../../components/Button';
import { CornerFace } from '../../components/corner/CornerView';
import { isPipSupported } from '../../components/corner/pip';
import { useNow } from '../../components/useNow';
import { formatMoney } from '../../engine/format';
import {
  formatTime,
  parseTime,
  parseTrNumber,
  validateWork,
  workState,
  type WorkConfig,
  type WorkConfigError,
} from '../../engine/work';
import { t } from '../../i18n';
import { usePrefsStore } from '../../storage/prefs';
import { useSessionStore } from '../../storage/session';

const DEFAULTS: WorkConfig = {
  monthlySalary: NaN,
  startMin: 9 * 60,
  endMin: 18 * 60,
  workDays: 22,
  lunchMin: 60,
  lunchStartMin: 12 * 60 + 30,
};

const fmtSalary = (n: number) => (Number.isFinite(n) ? new Intl.NumberFormat('tr-TR').format(n) : '');

function previewDisplay(c: WorkConfig, now: number): SessionDisplay {
  const w = workState(c, now);
  const caption = w.phase === 'working' ? t('work.estimate') : t(`work.phase.${w.phase}`);
  const sub =
    w.phase === 'working' || w.phase === 'break'
      ? t('work.untilEnd', { d: durationWords(w.remainingMs, 'ceil') })
      : w.phase === 'before'
        ? t('work.untilStart', { d: durationWords(w.remainingMs, 'ceil') })
        : undefined;
  return {
    value: formatMoney(w.earned),
    money: w.earned,
    status: w.phase === 'working' ? 'running' : 'paused',
    caption,
    sub,
    canPause: false,
  };
}

export function WorkSetup() {
  const saved = usePrefsStore((st) => st.lastWork) ?? DEFAULTS;
  const setLastWork = usePrefsStore((st) => st.setLastWork);
  const [f, setF] = useState({
    salary: fmtSalary(saved.monthlySalary),
    start: formatTime(saved.startMin),
    end: formatTime(saved.endMin),
    workDays: String(saved.workDays),
    lunchStart: formatTime(saved.lunchStartMin),
    lunchMin: String(saved.lunchMin),
  });
  const [showErrors, setShowErrors] = useState(false);
  const start = useSessionStore((st) => st.start);
  const launch = useLaunchCorner();
  const now = useNow(250);

  const config: WorkConfig = {
    monthlySalary: parseTrNumber(f.salary),
    startMin: parseTime(f.start),
    endMin: parseTime(f.end),
    workDays: Number(f.workDays),
    lunchMin: f.lunchMin.trim() === '' ? NaN : Number(f.lunchMin),
    lunchStartMin: parseTime(f.lunchStart),
  };
  const timeBad = [config.startMin, config.endMin, config.lunchStartMin, config.lunchMin].some(
    (n) => !Number.isFinite(n),
  );
  const error: WorkConfigError | 'time' | null = timeBad ? 'time' : validateWork(config);
  const errorField: Record<WorkConfigError | 'time', string> = {
    salary: 'work-salary',
    workDays: 'work-days',
    shift: 'work-end',
    lunch: 'work-lunch-min',
    time: 'work-start',
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (error) {
      setShowErrors(true);
      document.getElementById(errorField[error])?.focus();
      return;
    }
    if (useSessionStore.getState().active && !window.confirm(t('setup.replaceConfirm'))) return;
    setLastWork(config);
    start({ modeId: 'work', kind: 'work', label: t('modes.work.title'), durationMs: null, work: config });
    await launch();
  };

  const field = (id: string, key: keyof typeof f, label: string, props: Record<string, unknown> = {}) => {
    const invalid = showErrors && error !== null && errorField[error] === id;
    return (
      <div className={s.field}>
        <label htmlFor={id} className={s.label}>
          {label}
        </label>
        <input
          id={id}
          className={s.input}
          value={f[key]}
          aria-invalid={invalid}
          aria-describedby={invalid ? 'work-error' : undefined}
          onChange={(e) => setF({ ...f, [key]: e.target.value })}
          {...props}
        />
      </div>
    );
  };

  return (
    <div className={s.split}>
      <form className={`${s.card} ${s.formCol}`} onSubmit={(e) => void onSubmit(e)} noValidate>
        {field('work-salary', 'salary', t('work.salary'), {
          inputMode: 'decimal',
          autoComplete: 'off',
          placeholder: t('work.salaryPlaceholder'),
        })}
        <div className={s.row}>
          {field('work-start', 'start', t('work.start'), { type: 'time' })}
          {field('work-end', 'end', t('work.end'), { type: 'time' })}
        </div>
        <div className={s.row}>
          {field('work-lunch-start', 'lunchStart', t('work.lunchStart'), { type: 'time' })}
          {field('work-lunch-min', 'lunchMin', t('work.lunchMin'), { type: 'number', inputMode: 'numeric', min: 0 })}
        </div>
        <div className={s.row}>
          {field('work-days', 'workDays', t('work.workDays'), {
            type: 'number',
            inputMode: 'numeric',
            min: 1,
            max: 31,
          })}
        </div>
        {showErrors && error && (
          <p id="work-error" className={s.error} role="alert">
            {t(`work.errors.${error}`)}
          </p>
        )}
        <p className={`${s.muted} ${s.small}`}>{t('work.formNote')}</p>
        <div>
          <Button type="submit" variant="primary">
            {t('setup.startInCorner')}
          </Button>
        </div>
        {!isPipSupported() && <p className={`${s.muted} ${s.small}`}>{t('setup.pipUnsupported')}</p>}
      </form>

      <div className={s.previewCol}>
        <span className={`${s.label} ${s.muted}`}>{t('setup.preview')}</span>
        {error ? (
          <CornerFace
            variant="preview"
            label={t('modes.work.title')}
            display={{
              value: '—',
              status: 'paused',
              caption: t('work.estimate'),
              sub: t('work.previewEmpty'),
              canPause: false,
            }}
          />
        ) : (
          <>
            <CornerFace variant="preview" label={t('modes.work.title')} display={previewDisplay(config, now)} />
            <p className={`${s.muted} ${s.small} num`}>
              {t('work.hourly', { rate: formatMoney(workState(config, now).hourlyRate) })}
            </p>
          </>
        )}
        <p className={`${s.muted} ${s.small}`}>{t('work.disclaimer')}</p>
      </div>
    </div>
  );
}
