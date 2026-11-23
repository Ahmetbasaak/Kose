import { useState, type FormEvent } from 'react';
import { useStartSession } from '../../app/actions';
import s from '../../app/pages/pages.module.css';
import { CornerFace } from '../../components/corner/CornerView';
import { Field } from '../../components/Field';
import { formatMoney } from '../../engine/format';
import { MONTHLY_HOURS, meetingCost, parseTrNumber } from '../../engine/work';
import { t } from '../../i18n';
import { usePrefsStore } from '../../storage/prefs';
import { StartFooter } from '../StartFooter';

export function MeetingSetup() {
  const [people, setPeople] = useState('6');
  const [salary, setSalary] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const startSession = useStartSession();

  const n = Number(people);
  const monthly = parseTrNumber(salary);
  const hourly = monthly / MONTHLY_HOURS;
  const error = !Number.isInteger(n) || n < 1 || n > 1000 ? 'people' : !(monthly > 0) ? 'salary' : null;
  const fieldId = { people: 'meeting-people', salary: 'meeting-salary' } as const;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (error) {
      setShowErrors(true);
      document.getElementById(fieldId[error])?.focus();
      return;
    }
    usePrefsStore.getState().set({ lastMeeting: { people: n, monthlySalary: monthly } });
    await startSession({
      modeId: 'meeting',
      kind: 'stopwatch',
      label: t('modes.meeting.title'),
      durationMs: null,
      meeting: { people: n, hourlyRate: hourly, monthlySalary: monthly },
    });
  };
  const errFor = (k: 'people' | 'salary') => (showErrors && error === k ? 'meeting-error' : null);

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
            id={fieldId.salary}
            label={t('meeting.salary')}
            inputMode="decimal"
            autoComplete="off"
            placeholder={t('meeting.salaryPlaceholder')}
            value={salary}
            errorId={errFor('salary')}
            onChange={(e) => setSalary(e.target.value)}
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
            {t('meeting.derived', { rate: formatMoney(hourly), hours: MONTHLY_HOURS })}
            <br />
            {t('meeting.perMinute', { v: formatMoney(meetingCost(60_000, n, hourly)) })}
          </p>
        )}
      </div>
    </div>
  );
}
