import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Button, ButtonLink } from '../../components/Button';
import { useNow } from '../../components/useNow';
import { t } from '../../i18n';
import { parseSharedCountdown } from '../../share/link';
import { useCountdownsStore } from '../../storage/countdowns';
import { daysClock, formatTrDate } from '../sessionView';
import s from './pages.module.css';

/** /sayim?ad=…&t=… — a countdown someone shared; no backend, everything is in the URL. */
export function SharedCountdownPage() {
  const [params] = useSearchParams();
  const shared = parseSharedCountdown(params);
  const now = useNow(250, window, shared !== null);
  const add = useCountdownsStore((st) => st.add);
  const [added, setAdded] = useState(false);

  if (!shared)
    return (
      <div className={s.stack}>
        <div className={s.intro}>
          <h1 className={s.h1}>{t('shared.invalidTitle')}</h1>
          <p className={s.lead}>{t('shared.invalidBody')}</p>
        </div>
        <div>
          <ButtonLink to="/" variant="primary">
            {t('shared.makeOwn')}
          </ButtonLink>
        </div>
      </div>
    );

  const left = shared.at - now;
  return (
    <div className={s.stack}>
      <section className={s.liveCard} aria-labelledby="shared-title">
        <h1 id="shared-title" className={s.liveCaption} style={{ fontSize: 20 }}>
          {shared.title}
        </h1>
        <div className={`${s.liveValue} num`} data-long={left > 86_400_000} role="timer">
          {left > 0 ? daysClock(left) : t('countdowns.arrived')}
        </div>
        <span className={s.liveCaption}>{formatTrDate(shared.at)}</span>
      </section>
      <div className={s.row}>
        {added ? (
          <p role="status">
            {t('shared.added')} <Link to="/mod/geri-sayim">{t('shared.openList')}</Link>
          </p>
        ) : (
          <Button
            variant="primary"
            onClick={() => {
              add({ title: shared.title, template: 'custom', rule: { type: 'at', at: shared.at } });
              setAdded(true);
            }}
          >
            {t('shared.addToList')}
          </Button>
        )}
        <ButtonLink to="/">{t('shared.makeOwn')}</ButtonLink>
      </div>
    </div>
  );
}
