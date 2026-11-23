import { useState, type FormEvent } from 'react';
import { useStartSession } from '../../app/actions';
import s from '../../app/pages/pages.module.css';
import { ButtonLink } from '../../components/Button';
import { CornerFace } from '../../components/corner/CornerView';
import { Field } from '../../components/Field';
import { useNow } from '../../components/useNow';
import { streak } from '../../engine/calendar';
import { pomodoroSegments } from '../../engine/cycles';
import { formatClock } from '../../engine/format';
import { trDay } from '../../engine/work';
import { t } from '../../i18n';
import { usePrefsStore } from '../../storage/prefs';
import { AmbientControl } from '../../components/AmbientControl';
import { StartFooter } from '../StartFooter';

const valid = (n: number) => Number.isInteger(n) && n >= 1 && n <= 180;

export function StudentSetup() {
  const [focus, setFocus] = useState('25');
  const [rest, setRest] = useState('5');
  const [longRest, setLongRest] = useState('15');
  const [every, setEvery] = useState('4');
  const [task, setTask] = useState('');
  const [showError, setShowError] = useState(false);
  const studyDays = usePrefsStore((st) => st.studyDays);
  const pomodoroDay = usePrefsStore((st) => st.pomodoroDay);
  const goal = usePrefsStore((st) => st.pomodoroGoal);
  const setPrefs = usePrefsStore((st) => st.set);
  const now = useNow(60_000);
  const startSession = useStartSession();
  const f = Number(focus);
  const r = Number(rest);
  const lr = Number(longRest);
  const ev = Number(every);
  const ok = valid(f) && valid(r) && valid(lr) && Number.isInteger(ev) && ev >= 1 && ev <= 12;
  const todayCount = pomodoroDay.day === trDay(now) ? pomodoroDay.count : 0;
  const errId = showError && !ok ? 'student-error' : null;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!ok) return setShowError(true);
    await startSession(
      {
        modeId: 'student',
        kind: 'cycle',
        label: task.trim() || t('student.pomodoroTitle'),
        durationMs: null,
        segments: pomodoroSegments(f * 60_000, r * 60_000, lr * 60_000, ev),
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
          <div className={s.row}>
            <Field
              id="student-long"
              label={t('student.longRestMin')}
              type="number"
              inputMode="numeric"
              min={1}
              max={180}
              value={longRest}
              errorId={errId && !valid(lr) ? errId : null}
              onChange={(e) => setLongRest(e.target.value)}
            />
            <Field
              id="student-every"
              label={t('student.every')}
              type="number"
              inputMode="numeric"
              min={1}
              max={12}
              value={every}
              errorId={errId ? errId : null}
              onChange={(e) => setEvery(e.target.value)}
            />
          </div>
          <Field
            id="student-task"
            label={t('student.task')}
            placeholder={t('student.taskPlaceholder')}
            maxLength={40}
            value={task}
            onChange={(e) => setTask(e.target.value)}
          />
          {errId && (
            <p id={errId} className={s.error} role="alert">
              {t('student.error')}
            </p>
          )}
          <AmbientControl />
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
        <section className={`${s.card} ${s.stat}`} aria-labelledby="goal-title">
          <h2 id="goal-title" className={`${s.muted} ${s.small}`} style={{ fontWeight: 400 }}>
            {t('student.goal')}
          </h2>
          <span className={`${s.statValue} num`}>{t('student.today', { n: todayCount, goal })}</span>
          <progress
            max={goal}
            value={Math.min(todayCount, goal)}
            aria-labelledby="goal-title"
            style={{ width: '100%' }}
          />
          {todayCount >= goal && <span className={s.small}>{t('student.goalDone')}</span>}
          <label className={`${s.small} ${s.muted}`} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {t('student.goal')}
            <input
              type="number"
              min={1}
              max={24}
              value={goal}
              className={s.input}
              style={{ width: 80, height: 44 }}
              onChange={(e) => {
                const g = Number(e.target.value);
                if (Number.isInteger(g) && g >= 1 && g <= 24) setPrefs({ pomodoroGoal: g });
              }}
            />
          </label>
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
