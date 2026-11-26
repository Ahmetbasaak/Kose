import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { Button } from '../components/Button';
import { CornerFace } from '../components/corner/CornerView';
import { Field } from '../components/Field';
import { useNow } from '../components/useNow';
import { trMidnight } from '../engine/calendar';
import { formatTime, type WorkConfig } from '../engine/work';
import { parseAmount, t } from '../i18n';
import { usePrefsStore } from '../storage/prefs';
import { useStartSession } from './actions';
import s from './pages/pages.module.css';
import { workDisplay } from './sessionView';

const DEFAULT_SHIFT: Omit<WorkConfig, 'monthlySalary'> = {
  startMin: 9 * 60,
  endMin: 18 * 60,
  workDays: 22,
  lunchMin: 60,
  lunchStartMin: 12 * 60 + 30,
};
const DEMO: WorkConfig = { ...DEFAULT_SHIFT, monthlySalary: 45_000 };
// A fixed Monday 14:30 that keeps ticking from page load, so the demo always shows live earnings.
const DEMO_BASE = trMidnight(2026, 11, 23) + 14.5 * 3_600_000;

/** First screen: the one promise ("what is your time worth?"), one field, one button, a live example. */
export function Hero() {
  const lastWork = usePrefsStore((st) => st.lastWork);
  const startSession = useStartSession();
  const [salary, setSalary] = useState('');
  const [error, setError] = useState(false);
  const [playing, setPlaying] = useState(() => !matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [loadedAt] = useState(Date.now);
  const now = useNow(250, window, playing);

  const start = async (e: FormEvent) => {
    e.preventDefault();
    const config =
      lastWork ?? (parseAmount(salary) > 0 ? { ...DEFAULT_SHIFT, monthlySalary: parseAmount(salary) } : null);
    if (!config) return setError(true);
    setError(false);
    usePrefsStore.getState().setLastWork(config);
    await startSession({ modeId: 'work', kind: 'work', label: t('modes.work.title'), durationMs: null, work: config });
  };

  return (
    <section className={s.hero} aria-labelledby="hero-title">
      <div className={s.heroText}>
        <p className={s.eyebrow}>{t('home.hero.eyebrow')}</p>
        <h1 id="hero-title" className={s.heroTitle}>
          {t('home.hero.title')}
        </h1>
        <p className={s.lead}>{t('home.hero.lead')}</p>
        <form className={s.heroForm} onSubmit={(e) => void start(e)} noValidate>
          {lastWork ? (
            <p className={`${s.muted} ${s.small}`}>
              {t('home.hero.saved', { start: formatTime(lastWork.startMin), end: formatTime(lastWork.endMin) })}
            </p>
          ) : (
            <Field
              id="hero-salary"
              label={t('home.hero.salary')}
              inputMode="decimal"
              autoComplete="off"
              placeholder={t('work.salaryPlaceholder')}
              value={salary}
              errorId={error ? 'hero-error' : null}
              onChange={(e) => setSalary(e.target.value)}
            />
          )}
          <div>
            <Button type="submit" variant="primary">
              {lastWork ? t('home.hero.ctaSaved') : t('home.hero.cta')}
            </Button>
          </div>
          {error && (
            <p id="hero-error" className={s.error} role="alert">
              {t('home.hero.error')}
            </p>
          )}
          {!lastWork && <p className={`${s.muted} ${s.small}`}>{t('home.hero.defaults')}</p>}
        </form>
        <p className={s.row}>
          <Link to="/hesapla/toplanti-maliyeti" className={s.backLink}>
            {t('home.hero.meetingLink')} →
          </Link>
          <Link to="/kac-gun-kaldi" className={s.backLink}>
            {t('home.hero.countdownLink')} →
          </Link>
        </p>
      </div>
      <figure className={s.heroDemo}>
        <CornerFace
          variant="preview"
          label={t('modes.work.title')}
          display={workDisplay(DEMO, DEMO_BASE + (now - loadedAt))}
        />
        <figcaption className={`${s.spread} ${s.small} ${s.muted}`}>
          <span>{t('home.hero.demoLabel')}</span>
          <button type="button" className={s.textButton} onClick={() => setPlaying(!playing)}>
            {playing ? t('home.hero.pause') : t('home.hero.play')}
          </button>
        </figcaption>
      </figure>
    </section>
  );
}
