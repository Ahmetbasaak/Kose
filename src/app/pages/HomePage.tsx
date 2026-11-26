import type { CSSProperties } from 'react';
import { Link } from 'react-router';
import { Button, ButtonLink } from '../../components/Button';
import { useNow } from '../../components/useNow';
import { pomodoroSegments } from '../../engine/cycles';
import { formatTime } from '../../engine/work';
import { t } from '../../i18n';
import { modes, type ModeGroup } from '../../modes/registry';
import { usePrefsStore } from '../../storage/prefs';
import { useSessionStore } from '../../storage/session';
import { useFinishSession, useStartSession } from '../actions';
import { MONTHLY_HOURS } from '../../engine/work';
import { sessionDisplay } from '../sessionView';
import { AchievementsTeaser } from '../AchievementsTeaser';
import { WeeklyCard } from '../WeeklyCard';
import { Hero } from '../Hero';
import { ModeIcon } from '../../components/ModeIcon';
import { RollingValue } from '../../components/RollingValue';
import s from './pages.module.css';

const GROUPS: ModeGroup[] = ['work', 'focus', 'life', 'stream'];

/** Shown while something runs, so the home screen never hides the live timer. */
function ActiveCard() {
  const active = useSessionStore((st) => st.active);
  const togglePause = useSessionStore((st) => st.togglePause);
  const finish = useFinishSession();
  const now = useNow(1000, window, active !== null);
  if (!active) return null;
  const d = sessionDisplay(active, now);
  return (
    <section className={s.liveCard} style={{ gap: 12, padding: 24 }} aria-labelledby="home-active" data-level={d.level}>
      <div className={s.spread}>
        <h2 id="home-active" className={s.liveCaption}>
          {t('home.activeTitle')} · {active.label}
        </h2>
        <span className={s.liveCaption}>{d.caption}</span>
      </div>
      <span className={`${s.statValue} num`} style={{ fontSize: 44 }} role="timer">
        <RollingValue text={d.value} />
      </span>
      <div className={s.row}>
        <ButtonLink to="/sayac" variant="primary">
          {t('home.openTimer')}
        </ButtonLink>
        {d.canPause && (
          <Button className={s.onDark} onClick={() => togglePause()}>
            {d.status === 'paused' ? t('timer.resume') : t('timer.pause')}
          </Button>
        )}
        <Button className={s.onDark} onClick={finish}>
          {t('timer.finish')}
        </Button>
      </div>
    </section>
  );
}

/** One-tap starts: the research rule is "more than two clicks and people put it off". */
function QuickStart() {
  const startSession = useStartSession();
  const lastWork = usePrefsStore((st) => st.lastWork);
  const lastMeeting = usePrefsStore((st) => st.lastMeeting);
  const items = [
    {
      key: 'stopwatch',
      title: t('home.quick.stopwatch'),
      hint: t('home.quick.stopwatchHint'),
      run: () =>
        startSession({ modeId: 'simple', kind: 'stopwatch', label: t('simple.defaultLabel'), durationMs: null }),
    },
    {
      key: 'focus',
      title: t('home.quick.focus'),
      hint: t('home.quick.focusHint'),
      run: () =>
        startSession(
          {
            modeId: 'student',
            kind: 'cycle',
            label: t('student.pomodoroTitle'),
            durationMs: null,
            segments: pomodoroSegments(25 * 60_000, 5 * 60_000, 15 * 60_000, 4),
          },
          { askNotify: true },
        ),
    },
    {
      key: 'work',
      title: t('home.quick.work'),
      hint: lastWork
        ? t('home.quick.workHint', { start: formatTime(lastWork.startMin), end: formatTime(lastWork.endMin) })
        : t('home.quick.setupFirst'),
      to: lastWork ? null : '/mod/mesai',
      run: () =>
        lastWork &&
        startSession({ modeId: 'work', kind: 'work', label: t('modes.work.title'), durationMs: null, work: lastWork }),
    },
    {
      key: 'meeting',
      title: t('home.quick.meeting'),
      hint: lastMeeting ? t('home.quick.meetingHint', { n: lastMeeting.people }) : t('home.quick.setupFirst'),
      to: lastMeeting ? null : '/mod/toplanti',
      run: () =>
        lastMeeting &&
        startSession({
          modeId: 'meeting',
          kind: 'stopwatch',
          label: t('modes.meeting.title'),
          durationMs: null,
          meeting: { ...lastMeeting, hourlyRate: lastMeeting.monthlySalary / MONTHLY_HOURS },
        }),
    },
  ];
  return (
    <section
      aria-labelledby="quick-title"
      className={s.stack}
      style={{ gap: 12, '--i': 3 } as CSSProperties}
      data-reveal
    >
      <h2 id="quick-title" className={s.label} style={{ fontSize: 16 }}>
        {t('home.quickTitle')}
      </h2>
      <div className={s.quickGrid}>
        {items.map((it) =>
          it.to ? (
            <Link key={it.key} to={it.to} viewTransition className={s.quickItem}>
              <strong>{it.title}</strong>
              <span className={`${s.muted} ${s.small}`}>{it.hint}</span>
            </Link>
          ) : (
            <button key={it.key} type="button" className={s.quickItem} onClick={() => void it.run()}>
              <strong>{it.title}</strong>
              <span className={`${s.muted} ${s.small}`}>{it.hint}</span>
            </button>
          ),
        )}
      </div>
    </section>
  );
}

export function HomePage() {
  return (
    <div className={s.stack}>
      <ActiveCard />
      <Hero />
      <QuickStart />
      <WeeklyCard />
      <AchievementsTeaser />
      <div className={s.intro} data-reveal="scroll">
        <h2 className={s.sectionTitle}>{t('home.title')}</h2>
        <p className={s.lead}>{t('home.lead')}</p>
      </div>
      {GROUPS.map((g) => (
        <section key={g} aria-labelledby={`grp-${g}`} className={s.stack} style={{ gap: 12 }}>
          <h3 id={`grp-${g}`} className={s.groupTitle} data-reveal="scroll">
            {t(`home.groups.${g}`)}
          </h3>
          <ul className={s.grid} role="list" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {modes
              .filter((m) => m.group === g)
              .map((m, i) => (
                <li
                  key={m.id}
                  data-reveal="scroll"
                  style={{ display: 'flex', flexDirection: 'column', '--i': i } as CSSProperties}
                >
                  <Link to={`/mod/${m.slug}`} viewTransition className={s.modeCard} style={{ flex: 1 }}>
                    <span className={s.spread}>
                      <span className={s.modeIcon}>
                        <ModeIcon id={m.id} />
                      </span>
                      {m.pro && <span className={s.badge}>{t('home.pro')}</span>}
                    </span>
                    <span className={s.spread}>
                      <span className={s.modeTitle}>{t(`modes.${m.id}.title`)}</span>
                      <span className={s.modeArrow} aria-hidden="true">
                        →
                      </span>
                    </span>
                    <span className={s.modeDesc}>{t(`modes.${m.id}.desc`)}</span>
                    <span className={s.modeHint}>{t(`modes.${m.id}.hint`)}</span>
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
