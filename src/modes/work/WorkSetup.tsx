import { useState, type FormEvent } from 'react';
import { useStartSession } from '../../app/actions';
import s from '../../app/pages/pages.module.css';
import { workDisplay } from '../../app/sessionView';
import { Button } from '../../components/Button';
import { CornerFace } from '../../components/corner/CornerView';
import { isPipSupported } from '../../components/corner/pip';
import { useNow } from '../../components/useNow';
import { formatMoney } from '../../engine/format';
import {
  formatTime,
  parseTime,
  validateWork,
  workState,
  type WorkConfig,
  type WorkConfigError,
} from '../../engine/work';
import { parseAmount, LOCALE, t } from '../../i18n';
import { usePrefsStore } from '../../storage/prefs';

const DEFAULTS: WorkConfig = {
  monthlySalary: NaN,
  startMin: 9 * 60,
  endMin: 18 * 60,
  workDays: 22,
  lunchMin: 60,
  lunchStartMin: 12 * 60 + 30,
};

const fmtSalary = (n: number) => (Number.isFinite(n) ? new Intl.NumberFormat(LOCALE).format(n) : '');

export function WorkSetup() {
  const saved = usePrefsStore((st) => st.lastWork) ?? DEFAULTS;
  const setLastWork = usePrefsStore((st) => st.setLastWork);
  const workBackground = usePrefsStore((st) => st.workBackground);
  const [f, setF] = useState({
    salary: fmtSalary(saved.monthlySalary),
    start: formatTime(saved.startMin),
    end: formatTime(saved.endMin),
    workDays: String(saved.workDays),
    lunchStart: formatTime(saved.lunchStartMin),
    lunchMin: String(saved.lunchMin),
  });
  const [showErrors, setShowErrors] = useState(false);
  const startSession = useStartSession();
  const now = useNow(250);

  const config: WorkConfig = {
    monthlySalary: parseAmount(f.salary),
    startMin: parseTime(f.start),
    endMin: parseTime(f.end),
    workDays: Number(f.workDays),
    lunchMin: f.lunchMin.trim() === '' ? NaN : Number(f.lunchMin),
    lunchStartMin: parseTime(f.lunchStart),
  };
  const errorField: Record<WorkConfigError, string> = {
    salary: 'work-salary',
    workDays: 'work-days',
    shift: 'work-end',
    lunch: 'work-lunch-min',
  };
  // Unparseable fields first, each pointing at itself; then the config rules.
  const blank = (
    [
      ['work-start', config.startMin, 'time'],
      ['work-end', config.endMin, 'time'],
      ['work-lunch-start', config.lunchStartMin, 'time'],
      ['work-lunch-min', config.lunchMin, 'lunchMin'],
    ] as const
  ).find(([, v]) => !Number.isFinite(v));
  const configError = blank ? null : validateWork(config);
  const error: WorkConfigError | 'time' | 'lunchMin' | null = blank ? blank[2] : configError;
  const errorId = blank ? blank[0] : configError && errorField[configError];

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (error) {
      setShowErrors(true);
      document.getElementById(errorId!)?.focus();
      return;
    }
    setLastWork(config);
    await startSession({ modeId: 'work', kind: 'work', label: t('modes.work.title'), durationMs: null, work: config });
  };

  const field = (id: string, key: keyof typeof f, label: string, props: Record<string, unknown> = {}) => {
    const invalid = showErrors && errorId === id;
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
          <label className={s.radio}>
            <input
              type="checkbox"
              checked={workBackground}
              onChange={(e) => usePrefsStore.getState().set({ workBackground: e.target.checked })}
            />
            {t('work.background')}
          </label>
          <p className={`${s.muted} ${s.small}`}>{t('work.backgroundNote')}</p>
        </div>
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
            <CornerFace variant="preview" label={t('modes.work.title')} display={workDisplay(config, now)} />
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
