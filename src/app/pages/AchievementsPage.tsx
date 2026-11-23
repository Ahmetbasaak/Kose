import { Suspense, useEffect, useState } from 'react';
import { Button } from '../../components/Button';
import { useNow } from '../../components/useNow';
import { streak } from '../../engine/calendar';
import { trYmd } from '../../engine/calendar';
import { trDay } from '../../engine/work';
import { LOCALE, t } from '../../i18n';
import { badges, longestStreak, yearStats } from '../../share/achievements';
import { LazyCardExport } from '../../share/lazy';
import { allRecords } from '../../storage/history';
import { usePrefsStore } from '../../storage/prefs';
import type { SessionSummary } from '../../storage/session';
import { durationWords } from '../sessionView';
import s from './pages.module.css';

const monthName = (m: number) =>
  new Intl.DateTimeFormat(LOCALE, { month: 'long', timeZone: 'UTC' }).format(Date.UTC(2026, m - 1, 15));

export function AchievementsPage() {
  const activeDays = usePrefsStore((st) => st.activeDays);
  const now = useNow(60_000);
  const [records, setRecords] = useState<SessionSummary[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [year, setYear] = useState(() => trYmd(Date.now()).y);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    allRecords().then(setRecords, () => setFailed(true));
  }, []);

  const list = badges(records ?? [], activeDays);
  const earned = list.filter((b) => b.earned).length;
  const ys = yearStats(records ?? [], year);
  const years = [...new Set((records ?? []).map((r) => trYmd(r.endedAt).y))].sort((a, b) => b - a);
  if (!years.includes(year)) years.unshift(year);

  const card = {
    kicker: t('achievements.yearTitle', { year }),
    big: durationWords(ys.totalMs),
    lines: [t('achievements.yearCardLine', { days: ys.activeDays, sessions: ys.sessions, streak: ys.longestStreak })],
    tone: 'focus' as const,
  };

  return (
    <div className={s.stack}>
      <div className={s.intro}>
        <h1 className={s.h1}>{t('achievements.title')}</h1>
        <p className={s.lead}>{t('achievements.lead')}</p>
      </div>
      {failed && (
        <p role="alert" className={s.error}>
          {t('achievements.loadError')}
        </p>
      )}

      <div className={s.stats}>
        <section className={`${s.card} ${s.stat}`} aria-labelledby="ach-streak">
          <h2 id="ach-streak" className={`${s.muted} ${s.small}`} style={{ fontWeight: 400 }}>
            {t('achievements.streak')}
          </h2>
          <span className={`${s.statValue} num`}>
            {t('achievements.streakValue', { n: streak(activeDays, trDay(now)) })}
          </span>
          <span className={`${s.muted} ${s.small}`}>{t('achievements.longest', { n: longestStreak(activeDays) })}</span>
          <span className={`${s.muted} ${s.small}`}>{t('achievements.streakNote')}</span>
        </section>
      </div>

      <section aria-labelledby="ach-badges" className={s.stack} style={{ gap: 12 }}>
        <h2 id="ach-badges" className={s.modeTitle}>
          {t('achievements.badges')} · {t('achievements.earned', { n: earned, total: list.length })}
        </h2>
        <ul className={s.badgeGrid} role="list">
          {list.map((b) => (
            <li key={b.id} className={s.badgeItem} data-earned={b.earned}>
              <span className={s.badgeMark} aria-hidden="true">
                {b.earned ? '★' : '☆'}
              </span>
              <strong>{t(`achievements.list.${b.id}.t`)}</strong>
              <span className={`${s.muted} ${s.small}`}>{t(`achievements.list.${b.id}.d`)}</span>
              <span className={s.small}>
                {b.earned ? t('achievements.unlocked') : t('achievements.locked', { p: Math.round(b.progress * 100) })}
              </span>
              {!b.earned && (
                <progress
                  max={1}
                  value={b.progress}
                  aria-label={t(`achievements.list.${b.id}.t`)}
                  style={{ width: '100%' }}
                />
              )}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="ach-year" className={`${s.card} ${s.stack}`} style={{ gap: 12 }}>
        <div className={s.spread}>
          <h2 id="ach-year" className={s.modeTitle}>
            {t('achievements.yearTitle', { year })}
          </h2>
          <label className={s.small} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="visually-hidden">{t('achievements.year')}</span>
            <select className={s.input} value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
        </div>
        {ys.sessions === 0 ? (
          <p className={s.muted}>{t('achievements.yearEmpty')}</p>
        ) : (
          <>
            <dl className={s.yearGrid}>
              <dt>{t('achievements.yearRows.total')}</dt>
              <dd className="num">{durationWords(ys.totalMs)}</dd>
              <dt>{t('achievements.yearRows.focus')}</dt>
              <dd className="num">{durationWords(ys.focusMs)}</dd>
              <dt>{t('achievements.yearRows.sessions')}</dt>
              <dd className="num">{ys.sessions}</dd>
              <dt>{t('achievements.yearRows.days')}</dt>
              <dd className="num">{ys.activeDays}</dd>
              <dt>{t('achievements.yearRows.streak')}</dt>
              <dd className="num">{t('achievements.streakValue', { n: ys.longestStreak })}</dd>
              {ys.topMode && (
                <>
                  <dt>{t('achievements.yearRows.mode')}</dt>
                  <dd>{t(`modes.${ys.topMode}.title`)}</dd>
                </>
              )}
              {ys.topMonth && (
                <>
                  <dt>{t('achievements.yearRows.month')}</dt>
                  <dd>{monthName(ys.topMonth)}</dd>
                </>
              )}
            </dl>
            <div>
              <Button variant="primary" aria-expanded={sharing} onClick={() => setSharing(!sharing)}>
                {t('share.title')}
              </Button>
            </div>
            {sharing && (
              <Suspense fallback={null}>
                <LazyCardExport content={card} />
              </Suspense>
            )}
          </>
        )}
      </section>
    </div>
  );
}
