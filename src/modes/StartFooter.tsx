import s from '../app/pages/pages.module.css';
import { Button } from '../components/Button';
import { isPipSupported } from '../components/corner/pip';
import { t } from '../i18n';

/** "Köşede başlat" submit button plus the no-PiP note, shared by every setup form. */
export function StartFooter() {
  return (
    <>
      <div>
        <Button type="submit" variant="primary">
          {t('setup.startInCorner')}
        </Button>
      </div>
      {!isPipSupported() && <p className={`${s.muted} ${s.small}`}>{t('setup.pipUnsupported')}</p>}
    </>
  );
}
