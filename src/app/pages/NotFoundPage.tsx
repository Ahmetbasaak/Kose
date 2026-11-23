import { ButtonLink } from '../../components/Button';
import { t } from '../../i18n';
import s from './pages.module.css';

export function NotFoundPage() {
  return (
    <div className={s.stack}>
      <div className={s.intro}>
        <h1 className={s.h1}>{t('app.notFoundTitle')}</h1>
        <p className={s.lead}>{t('app.notFoundBody')}</p>
      </div>
      <div>
        <ButtonLink to="/" variant="primary">
          {t('app.backHome')}
        </ButtonLink>
      </div>
    </div>
  );
}
