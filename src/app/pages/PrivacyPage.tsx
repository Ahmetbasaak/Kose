import { t } from '../../i18n';
import s from './pages.module.css';

const SECTIONS = [
  'device',
  'account',
  'tracking',
  'notifications',
  'sharing',
  'hosting',
  'payments',
  'delete',
] as const;

export function PrivacyPage() {
  return (
    <div className={s.stack} style={{ maxWidth: 720 }}>
      <h1 className={s.h1}>{t('privacy.title')}</h1>
      <p className={`${s.card} ${s.small}`} role="note">
        <strong>{t('privacy.draft')}</strong>
      </p>
      {SECTIONS.map((k) => (
        <section key={k} aria-labelledby={`pv-${k}`} className={s.stack} style={{ gap: 8 }}>
          <h2 id={`pv-${k}`} className={s.modeTitle}>
            {t(`privacy.sections.${k}.h`)}
          </h2>
          <p>{t(`privacy.sections.${k}.p`)}</p>
        </section>
      ))}
    </div>
  );
}
