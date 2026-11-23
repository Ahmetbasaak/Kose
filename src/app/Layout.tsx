import { Link, NavLink, Outlet } from 'react-router';
import { CornerHost } from '../components/corner/CornerHost';
import { Logo } from '../components/Logo';
import { t } from '../i18n';
import { config } from './config';
import { TEST_MODE } from './entitlements';
import { ProBehaviors } from './ProBehaviors';
import { SessionChrome } from './SessionChrome';
import { SessionRunner } from './SessionRunner';
import styles from './Layout.module.css';

export function Layout() {
  return (
    <div className={styles.shell}>
      <a href="#main" className={styles.skip}>
        {t('app.skipToContent')}
      </a>
      <header className={styles.header} data-noprint>
        <Link to="/" className={styles.brand} aria-label={`${config.name} – ${t('app.home')}`}>
          <Logo size={32} />
          {config.name}
        </Link>
        <nav aria-label={t('app.nav')} className={styles.nav}>
          {/* Home and the live counter only show in the phone tab bar; the logo covers home on desktop. */}
          <NavLink to="/" end className={styles.mobileOnly}>
            {t('app.home')}
          </NavLink>
          <NavLink to="/sayac" className={styles.mobileOnly}>
            {t('app.navLive')}
          </NavLink>
          <NavLink to="/gecmis">{t('app.navHistory')}</NavLink>
          <NavLink to="/ayarlar">{t('app.navSettings')}</NavLink>
        </nav>
      </header>
      {TEST_MODE && (
        <p role="note" className={styles.testNote} data-noprint>
          {t('app.testMode')}
        </p>
      )}
      <SessionRunner />
      <main id="main" tabIndex={-1} className={styles.main}>
        <Outlet />
      </main>
      <footer className={styles.footer} data-noprint>
        <span>{t('app.privacyNote')}</span>
        <span className={styles.footerLinks}>
          <Link to="/gizlilik">{t('app.navPrivacy')}</Link>
          <Link to="/fiyat">{t('app.navPricing')}</Link>
        </span>
      </footer>
      <CornerHost />
      <ProBehaviors />
      <SessionChrome />
    </div>
  );
}
