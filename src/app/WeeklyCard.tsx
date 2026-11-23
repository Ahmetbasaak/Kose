import { Suspense, useEffect, useState } from 'react';
import { Button } from '../components/Button';
import { streak, trWeekStart } from '../engine/calendar';
import { trDay } from '../engine/work';
import { t } from '../i18n';
import { weeklyContent, weeklyStats } from '../share/content';
import { LazyCardExport } from '../share/lazy';
import { recordsBetween } from '../storage/history';
import { usePrefsStore } from '../storage/prefs';
import s from './pages/pages.module.css';

const WEEK = 7 * 86_400_000;

/** Once a week, on the first visit, last week's numbers. Dismissing hides it until next week. */
export function WeeklyCard() {
  const seen = usePrefsStore((st) => st.weeklySeenWeek);
  const setSeen = usePrefsStore((st) => st.setWeeklySeenWeek);
  const activeDays = usePrefsStore((st) => st.activeDays);
  const [data, setData] = useState<{ week: number; content: ReturnType<typeof weeklyContent> } | null>(null);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    const now = Date.now();
    const week = trWeekStart(now);
    if (seen === week) return;
    recordsBetween(week - WEEK, week)
      .then((records) => {
        const stats = weeklyStats(records);
        // Nothing happened last week: nothing to show, don't ask again this week.
        if (stats.sessions === 0) setSeen(week);
        else setData({ week, content: weeklyContent(stats, streak(activeDays, trDay(now))) });
      })
      .catch(() => undefined);
  }, [seen, setSeen, activeDays]);

  if (!data || seen === data.week) return null;
  return (
    <section className={`${s.card} ${s.stack}`} style={{ gap: 12 }} aria-labelledby="weekly-title">
      <h2 id="weekly-title" className={s.modeTitle}>
        {data.content.kicker}
      </h2>
      <p className={s.muted}>{t('weekly.lead')}</p>
      <span className={`${s.statValue} num`}>{data.content.big}</span>
      {data.content.lines.map((l) => (
        <span key={l} className={s.muted}>
          {l}
        </span>
      ))}
      <div className={s.row}>
        <Button variant="primary" aria-expanded={sharing} onClick={() => setSharing(!sharing)}>
          {t('share.title')}
        </Button>
        <Button onClick={() => setSeen(data.week)}>{t('weekly.close')}</Button>
      </div>
      {sharing && (
        <Suspense fallback={null}>
          <LazyCardExport content={data.content} />
        </Suspense>
      )}
    </section>
  );
}
