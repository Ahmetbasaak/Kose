import { useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { CornerHost } from '../components/corner/CornerHost';
import { Logo } from '../components/Logo';
import { brandName, t } from '../i18n';
import { TEST_MODE } from './entitlements';
import { ProBehaviors } from './ProBehaviors';
import { SessionChrome } from './SessionChrome';
import { track } from './telemetry';
import { SessionRunner } from './SessionRunner';
import { WorkRunner } from './WorkRunner';
import styles from './Layout.module.css';

export function Layout() {
  const { pathname } = useLocation();
  useEffect(() => track('visit'), [pathname]);
  return (
    <div className={styles.shell}>
      <a href="#main" className={styles.skip}>
        {t('app.skipToContent')}
      </a>
      <header className={styles.header} data-noprint>
        <Link viewTransition to="/" className={styles.brand} aria-label={`${brandName} – ${t('app.home')}`}>
          <Logo size={32} />
          {brandName}
        </Link>
        <nav aria-label={t('app.nav')} className={styles.nav}>
          {/* Home and the live counter only show in the phone tab bar; the logo covers home on desktop. */}
          <NavLink viewTransition to="/" end className={styles.mobileOnly}>
            {t('app.home')}
          </NavLink>
          <NavLink viewTransition to="/sayac" className={styles.mobileOnly}>
            {t('app.navLive')}
          </NavLink>
          <NavLink viewTransition to="/gecmis">
            {t('app.navHistory')}
          </NavLink>
          <NavLink viewTransition to="/ayarlar">
            {t('app.navSettings')}
          </NavLink>
        </nav>
      </header>
      {TEST_MODE && (
        <p role="note" className={styles.testNote} data-noprint>
          {t('app.testMode')}
        </p>
      )}
      <SessionRunner />
      <WorkRunner />
      <main id="main" tabIndex={-1} className={styles.main}>
        <Outlet />
      </main>
      <footer className={styles.footer} data-noprint>
        <span>{t('app.privacyNote')}</span>
        <span className={styles.footerLinks}>
          <Link viewTransition to="/basarilar">
            {t('app.navAchievements')}
          </Link>
          <Link viewTransition to="/gizlilik">
            {t('app.navPrivacy')}
          </Link>
          <Link viewTransition to="/fiyat">
            {t('app.navPricing')}
          </Link>
        </span>
      </footer>
      <CornerHost />
      <ProBehaviors />
      <SessionChrome />
    </div>
  );
}
