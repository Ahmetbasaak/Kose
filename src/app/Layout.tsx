import { Link, Outlet } from 'react-router';
import { CornerHost } from '../components/corner/CornerHost';
import { t } from '../i18n';
import { config } from './config';
import { SessionRunner } from './SessionRunner';
import styles from './Layout.module.css';

export function Layout() {
  return (
    <div className={styles.shell}>
      <a href="#main" className={styles.skip}>
        {t('app.skipToContent')}
      </a>
      <header className={styles.header}>
        <Link to="/" className={styles.brand} aria-label={`${config.name} – ${t('app.home')}`}>
          <span className={styles.logo} aria-hidden="true" />
          {config.name}
        </Link>
      </header>
      <SessionRunner />
      <main id="main" tabIndex={-1} className={styles.main}>
        <Outlet />
      </main>
      <footer className={styles.footer}>{t('app.privacyNote')}</footer>
      <CornerHost />
    </div>
  );
}
