import type { ReactNode } from 'react';
import { Link } from 'react-router';
import s from '../app/pages/pages.module.css';
import { useEntitlements, type ProFeature } from '../app/entitlements';
import { t } from '../i18n';

/** Renders children for Pro users, an upgrade note for everyone else. */
export function ProGate({ feature, children }: { feature: ProFeature; children: ReactNode }) {
  const { can } = useEntitlements();
  if (can(feature)) return children;
  return (
    <div className={`${s.card} ${s.stack}`} style={{ gap: 8 }}>
      <span className={s.badge} style={{ alignSelf: 'flex-start' }}>
        {t('home.pro')}
      </span>
      <h2 className={s.modeTitle}>{t('pro.gateTitle')}</h2>
      <p className={s.muted}>{t('pro.gateBody')}</p>
      <Link to="/fiyat" className={s.backLink}>
        {t('pro.gateLink')}
      </Link>
    </div>
  );
}
