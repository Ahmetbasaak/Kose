import { Link } from 'react-router';
import { t } from '../../i18n';
import { modes } from '../../modes/registry';
import { WeeklyCard } from '../WeeklyCard';
import s from './pages.module.css';

export function HomePage() {
  return (
    <div className={s.stack}>
      <div className={s.intro}>
        <h1 className={s.h1}>{t('home.title')}</h1>
        <p className={s.lead}>{t('home.lead')}</p>
      </div>
      <WeeklyCard />
      <ul className={s.grid} role="list" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {modes.map((m) => {
          const body = (
            <>
              <span className={s.spread}>
                <span className={s.modeTitle}>{t(`modes.${m.id}.title`)}</span>
                {m.pro && <span className={s.badge}>{t('home.pro')}</span>}
              </span>
              <span className={s.modeDesc}>{t(`modes.${m.id}.desc`)}</span>
              {m.Setup ? (
                <span className={s.modeHint}>{t(`modes.${m.id}.hint`)}</span>
              ) : (
                <span className={`${s.modeHint} ${s.soon}`}>{t('home.soon')}</span>
              )}
            </>
          );
          return (
            <li key={m.id} style={{ display: 'flex', flexDirection: 'column' }}>
              {m.Setup ? (
                <Link to={`/mod/${m.slug}`} className={s.modeCard} style={{ flex: 1 }}>
                  {body}
                </Link>
              ) : (
                <div className={s.modeCard} style={{ flex: 1 }}>
                  {body}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
