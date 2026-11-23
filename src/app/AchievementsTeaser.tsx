import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { streak, trYmd } from '../engine/calendar';
import { trDay } from '../engine/work';
import { t } from '../i18n';
import { badges } from '../share/achievements';
import { useNow } from '../components/useNow';
import { allRecords } from '../storage/history';
import { usePrefsStore } from '../storage/prefs';
import s from './pages/pages.module.css';

/** Home: streak + badge count, and in December a nudge to the year in review. */
export function AchievementsTeaser() {
  const activeDays = usePrefsStore((st) => st.activeDays);
  const now = useNow(60_000);
  const [earned, setEarned] = useState<{ n: number; total: number } | null>(null);
  useEffect(() => {
    allRecords().then(
      (r) => {
        const list = badges(r, activeDays);
        setEarned({ n: list.filter((b) => b.earned).length, total: list.length });
      },
      () => undefined,
    );
  }, [activeDays]);
  if (!earned || (earned.n === 0 && activeDays.length === 0)) return null;
  const { y, m } = trYmd(now);
  return (
    <p className={`${s.card} ${s.spread}`} style={{ padding: '14px 18px' }}>
      <span>
        {m === 12
          ? t('achievements.yearReady', { year: y })
          : t('achievements.homeCard', { n: streak(activeDays, trDay(now)), earned: earned.n, total: earned.total })}
      </span>
      <Link to="/basarilar" className={s.backLink}>
        {t('achievements.homeLink')}
      </Link>
    </p>
  );
}
