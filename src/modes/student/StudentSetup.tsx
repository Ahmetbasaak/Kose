import { useState, type FormEvent } from 'react';
import { useStartSession } from '../../app/actions';
import s from '../../app/pages/pages.module.css';
import { ButtonLink } from '../../components/Button';
import { CornerFace } from '../../components/corner/CornerView';
import { Field } from '../../components/Field';
import { useNow } from '../../components/useNow';
import { streak } from '../../engine/calendar';
import { formatClock } from '../../engine/format';
import { trDay } from '../../engine/work';
import { t } from '../../i18n';
import { usePrefsStore } from '../../storage/prefs';
import { StartFooter } from '../StartFooter';

const valid = (n: number) => Number.isInteger(n) && n >= 1 && n <= 180;

export function StudentSetup() {
  const [focus, setFocus] = useState('25');
  const [rest, setRest] = useState('5');
  const [showError, setShowError] = useState(false);
  const studyDays = usePrefsStore((st) => st.studyDays);
  const now = useNow(60_000);
  const startSession = useStartSession();
  const f = Number(focus);
  const r = Number(rest);
  const ok = valid(f) && valid(r);
  const errId = showError && !ok ? 'student-error' : null;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!ok) return setShowError(true);
    await startSession(
      {
        modeId: 'student',
        kind: 'cycle',
        label: t('student.pomodoroTitle'),
        durationMs: null,
        segments: [f * 60_000, r * 60_000],
      },
      { askNotify: true },
    );
  };

  return (
    <div className={s.stack}>
      <div className={s.split}>
        <form
          className={`${s.card} ${s.formCol}`}
          onSubmit={(e) => void onSubmit(e)}
          noValidate
          aria-labelledby="pomodoro-title"
        >
          <h2 id="pomodoro-title" className={s.label} style={{ fontSize: 18 }}>
            {t('student.pomodoroTitle')}
          </h2>
          <div className={s.row}>
            <Field
              id="student-focus"
              label={t('student.focusMin')}
              type="number"
              inputMode="numeric"
              min={1}
              max={180}
              value={focus}
              errorId={errId && !valid(f) ? errId : null}
              onChange={(e) => setFocus(e.target.value)}
            />
            <Field
              id="student-rest"
              label={t('student.breakMin')}
              type="number"
              inputMode="numeric"
              min={1}
              max={180}
              value={rest}
              errorId={errId && !valid(r) ? errId : null}
              onChange={(e) => setRest(e.target.value)}
            />
          </div>
          {errId && (
            <p id={errId} className={s.error} role="alert">
              {t('student.error')}
            </p>
          )}
          <StartFooter />
        </form>
        <div className={s.previewCol}>
          <span className={`${s.label} ${s.muted}`}>{t('setup.preview')}</span>
          <CornerFace
            variant="preview"
            label={t('student.pomodoroTitle')}
            display={{
              value: formatClock(valid(f) ? f * 60_000 : 0),
              status: 'running',
              caption: t('student.focus'),
              sub: t('student.round', { n: 1 }),
              canPause: true,
            }}
          />
        </div>
      </div>
      <div className={s.stats}>
        <section className={`${s.card} ${s.stat}`} aria-labelledby="streak-title">
          <h2 id="streak-title" className={`${s.muted} ${s.small}`} style={{ fontWeight: 400 }}>
            {t('student.streakTitle')}
          </h2>
          <span className={`${s.statValue} num`}>{t('student.streak', { n: streak(studyDays, trDay(now)) })}</span>
          <span className={`${s.muted} ${s.small}`}>{t('student.streakNote')}</span>
        </section>
        <section className={`${s.card} ${s.stat}`} aria-labelledby="exam-title">
          <h2 id="exam-title" className={s.label} style={{ fontSize: 16 }}>
            {t('student.examTitle')}
          </h2>
          <span className={`${s.muted} ${s.small}`}>{t('student.examBody')}</span>
          <div style={{ marginTop: 8 }}>
            <ButtonLink to="/mod/geri-sayim?sablon=sinav">{t('student.examLink')}</ButtonLink>
          </div>
        </section>
      </div>
    </div>
  );
}
