import { Link, useParams } from 'react-router';
import { t } from '../../i18n';
import { modeBySlug } from '../../modes/registry';
import { NotFoundPage } from './NotFoundPage';
import s from './pages.module.css';

export function ModeSetupPage() {
  const mode = modeBySlug(useParams().slug);
  if (!mode) return <NotFoundPage />;
  const title = t(`modes.${mode.id}.title`);
  return (
    <div className={s.stack}>
      <div className={s.spread}>
        <Link to="/" className={s.backLink}>
          {t('setup.back')}
        </Link>
        <span className={`${s.muted} ${s.small}`}>{t('setup.modeLabel', { mode: title })}</span>
      </div>
      <h1 className={s.h1}>{title}</h1>
      {mode.Setup ? (
        <mode.Setup />
      ) : (
        <div className={s.card}>
          <h2>{t('setup.soonTitle')}</h2>
          <p className={s.muted}>{t('setup.soonBody')}</p>
        </div>
      )}
    </div>
  );
}
