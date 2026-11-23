import { useState, type FormEvent } from 'react';
import { useStartSession } from '../../app/actions';
import s from '../../app/pages/pages.module.css';
import { CornerFace } from '../../components/corner/CornerView';
import { Field } from '../../components/Field';
import { formatClock } from '../../engine/format';
import { t } from '../../i18n';
import { StartFooter } from '../StartFooter';

export function BreakSetup() {
  const [minutes, setMinutes] = useState('20');
  const [showError, setShowError] = useState(false);
  const startSession = useStartSession();
  const n = Number(minutes);
  const valid = Number.isInteger(n) && n >= 1 && n <= 240;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!valid) return setShowError(true);
    await startSession(
      { modeId: 'break', kind: 'cycle', label: t('modes.break.title'), durationMs: null, segments: [n * 60_000] },
      { askNotify: true },
    );
  };

  return (
    <div className={s.split}>
      <form className={`${s.card} ${s.formCol}`} onSubmit={(e) => void onSubmit(e)} noValidate>
        <div className={s.row}>
          <Field
            id="break-interval"
            label={t('break.interval')}
            type="number"
            inputMode="numeric"
            min={1}
            max={240}
            value={minutes}
            errorId={showError && !valid ? 'break-error' : null}
            onChange={(e) => setMinutes(e.target.value)}
          />
        </div>
        {showError && !valid && (
          <p id="break-error" className={s.error} role="alert">
            {t('break.error')}
          </p>
        )}
        <p className={`${s.muted} ${s.small}`}>{t('break.note')}</p>
        <StartFooter />
      </form>
      <div className={s.previewCol}>
        <span className={`${s.label} ${s.muted}`}>{t('setup.preview')}</span>
        <CornerFace
          variant="preview"
          label={t('modes.break.title')}
          display={{
            value: formatClock(valid ? n * 60_000 : 0),
            status: 'running',
            caption: t('break.until'),
            canPause: true,
          }}
        />
      </div>
    </div>
  );
}
