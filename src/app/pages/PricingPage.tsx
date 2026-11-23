import { useState, type FormEvent } from 'react';
import { Button } from '../../components/Button';
import { Field } from '../../components/Field';
import { t } from '../../i18n';
import { config } from '../config';
import { useEntitlements } from '../entitlements';
import { activateLicense, licenseAdapter, type LicenseResult } from '../license';
import s from './pages.module.css';

const ROWS = [
  ['corner', true],
  ['basics', true],
  ['work', true],
  ['share', true],
  ['overlay', true],
  ['freelance', false],
  ['presentation', false],
  ['multi', false],
  ['history', false],
  ['export', false],
  ['themes', false],
  ['shortcuts', false],
] as const;

function Mark({ on }: { on: boolean }) {
  return (
    <>
      <span aria-hidden="true">{on ? '✓' : '—'}</span>
      <span className="visually-hidden">{on ? t('pricing.yes') : t('pricing.no')}</span>
    </>
  );
}

export function PricingPage() {
  const { pro } = useEntitlements();
  const [key, setKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<LicenseResult | null>(null);
  const { proMonthly, proLifetime } = config.pricing;

  const onActivate = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setResult(await activateLicense(key));
    setBusy(false);
  };

  return (
    <div className={s.stack}>
      <div className={s.intro}>
        <h1 className={s.h1}>{t('pricing.title')}</h1>
        <p className={s.lead}>{t('pricing.lead')}</p>
      </div>

      <div className={s.card} style={{ padding: 8, overflowX: 'auto' }}>
        <table className={s.table}>
          <thead>
            <tr>
              <th scope="col">{t('pricing.feature')}</th>
              <th scope="col">{t('pricing.free')}</th>
              <th scope="col">{t('pricing.pro')}</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map(([k, free]) => (
              <tr key={k}>
                <th scope="row">{t(`pricing.rows.${k}`)}</th>
                <td>
                  <Mark on={free} />
                </td>
                <td>
                  <Mark on />
                </td>
              </tr>
            ))}
            <tr>
              <th scope="row">{t('pricing.price')}</th>
              <td className="num">{t('pricing.freePrice')}</td>
              <td className="num">
                {t('pricing.monthly', { price: proMonthly })}
                <br />
                <span className={`${s.muted} ${s.small}`}>{t('pricing.lifetime', { price: proLifetime })}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {licenseAdapter.checkoutUrl ? (
        <div>
          <a className={s.backLink} href={licenseAdapter.checkoutUrl} rel="noopener">
            {t('pricing.buy')}
          </a>
        </div>
      ) : (
        <p className={s.muted}>{t('pricing.notOnSale')}</p>
      )}

      {!pro && (
        <form
          className={`${s.card} ${s.formCol}`}
          style={{ maxWidth: 640 }}
          onSubmit={(e) => void onActivate(e)}
          aria-labelledby="license-title"
        >
          <h2 id="license-title" className={s.modeTitle}>
            {t('pricing.licenseTitle')}
          </h2>
          <Field
            id="license-key"
            label={t('pricing.licenseKey')}
            value={key}
            autoComplete="off"
            spellCheck={false}
            errorId={result && !result.ok ? 'license-result' : null}
            onChange={(e) => setKey(e.target.value)}
          />
          <div>
            <Button type="submit" variant="primary" disabled={busy || !key.trim()}>
              {busy ? t('pricing.activating') : t('pricing.activate')}
            </Button>
          </div>
          {result && (
            <p id="license-result" role={result.ok ? 'status' : 'alert'} className={result.ok ? undefined : s.error}>
              {t(`pricing.result.${result.ok ? 'ok' : result.reason}`)}
            </p>
          )}
          <p className={`${s.muted} ${s.small}`}>{t('pricing.privacy')}</p>
        </form>
      )}
    </div>
  );
}
