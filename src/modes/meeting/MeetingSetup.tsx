import { useState, type FormEvent } from 'react';
import { useStartSession } from '../../app/actions';
import s from '../../app/pages/pages.module.css';
import { CornerFace } from '../../components/corner/CornerView';
import { Field } from '../../components/Field';
import { formatMoney } from '../../engine/format';
import { meetingCost, parseTrNumber } from '../../engine/work';
import { t } from '../../i18n';
import { StartFooter } from '../StartFooter';

export function MeetingSetup() {
  const [people, setPeople] = useState('6');
  const [rate, setRate] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const startSession = useStartSession();

  const n = Number(people);
  const hourly = parseTrNumber(rate);
  const error = !Number.isInteger(n) || n < 1 || n > 1000 ? 'people' : !(hourly > 0) ? 'rate' : null;
  const fieldId = { people: 'meeting-people', rate: 'meeting-rate' } as const;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (error) {
      setShowErrors(true);
      document.getElementById(fieldId[error])?.focus();
      return;
    }
    await startSession({
      modeId: 'meeting',
      kind: 'stopwatch',
      label: t('modes.meeting.title'),
      durationMs: null,
      meeting: { people: n, hourlyRate: hourly },
    });
  };
  const errFor = (k: 'people' | 'rate') => (showErrors && error === k ? 'meeting-error' : null);

  return (
    <div className={s.split}>
      <form className={`${s.card} ${s.formCol}`} onSubmit={(e) => void onSubmit(e)} noValidate>
        <div className={s.row}>
          <Field
            id={fieldId.people}
            label={t('meeting.people')}
            type="number"
            inputMode="numeric"
            min={1}
            value={people}
            errorId={errFor('people')}
            onChange={(e) => setPeople(e.target.value)}
          />
          <Field
            id={fieldId.rate}
            label={t('meeting.rate')}
            inputMode="decimal"
            autoComplete="off"
            placeholder={t('meeting.ratePlaceholder')}
            value={rate}
            errorId={errFor('rate')}
            onChange={(e) => setRate(e.target.value)}
          />
        </div>
        {showErrors && error && (
          <p id="meeting-error" className={s.error} role="alert">
            {t(`meeting.errors.${error}`)}
          </p>
        )}
        <p className={`${s.muted} ${s.small}`}>{t('meeting.note')}</p>
        <StartFooter />
      </form>
      <div className={s.previewCol}>
        <span className={`${s.label} ${s.muted}`}>{t('setup.preview')}</span>
        <CornerFace
          variant="preview"
          label={t('modes.meeting.title')}
          display={{
            value: formatMoney(0),
            status: 'running',
            caption: t('meeting.cost'),
            sub: t('meeting.sub', { n: error === 'people' ? '—' : n, clock: '00:00' }),
            canPause: true,
          }}
        />
        {!error && (
          <p className={`${s.muted} ${s.small} num`}>
            {t('meeting.perMinute', { v: formatMoney(meetingCost(60_000, n, hourly)) })}
          </p>
        )}
      </div>
    </div>
  );
}
