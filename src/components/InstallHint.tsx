import s from '../app/pages/pages.module.css';
import { isIos, isStandalone, useInstallStore } from '../app/install';
import { t } from '../i18n';
import { Button } from './Button';

/** Explains that alerts need the app open, and offers to install it (PWA) where the browser allows. */
export function InstallHint() {
  const prompt = useInstallStore((st) => st.prompt);
  if (isStandalone()) return null;
  return (
    <div className={s.stack} style={{ gap: 8 }}>
      <p className={`${s.muted} ${s.small}`}>{t('install.note')}</p>
      {prompt ? (
        <div>
          <Button
            onClick={() => {
              void prompt.prompt();
              useInstallStore.setState({ prompt: null });
            }}
          >
            {t('install.button')}
          </Button>
        </div>
      ) : (
        isIos() && <p className={`${s.muted} ${s.small}`}>{t('install.ios')}</p>
      )}
    </div>
  );
}
