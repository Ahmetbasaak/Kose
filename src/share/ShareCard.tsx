import { useEffect, useId, useRef, useState } from 'react';
import { brandSlug } from '../app/config';
import s from '../app/pages/pages.module.css';
import { Button } from '../components/Button';
import { Field } from '../components/Field';
import { parseAmount, brandName, t } from '../i18n';
import { usePrefsStore } from '../storage/prefs';
import type { SessionSummary } from '../storage/session';
import { cardBlob, drawCard, type CardSize } from './card';
import { cardContent, unitAvailable, type CardContent, type CardUnit } from './content';

const fileName = () => `${brandSlug}-kart.png`;

/** Size picker, live canvas preview, download/share buttons for any card content. */
export function CardExport({ content }: { content: CardContent }) {
  const [size, setSize] = useState<CardSize>('square');
  const name = useId();
  const canvas = useRef<HTMLCanvasElement>(null);
  const text = [content.kicker, content.big, ...content.lines].join(' · ');

  useEffect(() => {
    if (canvas.current) void drawCard(canvas.current, content, size, brandName);
  }, [content, size]);

  const download = async () => {
    const url = URL.createObjectURL(await cardBlob(canvas.current!));
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName();
    // Detached anchors lose the file name in Chromium.
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const file = async () => new File([await cardBlob(canvas.current!)], fileName(), { type: 'image/png' });
  const canShareFiles =
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [new File([], fileName(), { type: 'image/png' })] });
  const share = async () => {
    try {
      await navigator.share({ files: [await file()] });
    } catch {
      // User cancelled the share sheet; nothing to do.
    }
  };

  return (
    <div className={s.stack} style={{ gap: 16 }}>
      <fieldset className={s.fieldset}>
        <legend className={s.label}>{t('share.sizeLegend')}</legend>
        <div className={s.row}>
          {(['square', 'story'] as const).map((k) => (
            <label key={k} className={s.radio}>
              <input type="radio" name={name} checked={size === k} onChange={() => setSize(k)} />
              {t(`share.sizes.${k}`)}
            </label>
          ))}
        </div>
      </fieldset>
      <canvas
        ref={canvas}
        role="img"
        aria-label={`${t('share.preview')}: ${text}`}
        style={{ width: '100%', maxWidth: size === 'square' ? 360 : 240, borderRadius: 16, height: 'auto' }}
      />
      <div className={s.row}>
        <Button variant="primary" onClick={() => void download()}>
          {t('share.download')}
        </Button>
        {canShareFiles && <Button onClick={() => void share()}>{t('share.share')}</Button>}
      </div>
    </div>
  );
}

/** Card builder for a finished (or snapshotted) session, with the privacy-first unit picker. */
export function ShareCard({ summary }: { summary: SessionSummary }) {
  const [unit, setUnit] = useState<CardUnit>('hidden');
  const coffeePrice = usePrefsStore((st) => st.coffeePrice);
  const setCoffeePrice = usePrefsStore((st) => st.setCoffeePrice);
  const [priceText, setPriceText] = useState(coffeePrice ? String(coffeePrice).replace('.', ',') : '');
  const content = cardContent(summary, unit, coffeePrice);

  return (
    <section className={`${s.card} ${s.split}`} aria-labelledby="share-title">
      <div className={s.formCol} style={{ gap: 16 }}>
        <h2 id="share-title" className={s.modeTitle}>
          {t('share.title')}
        </h2>
        <fieldset className={s.fieldset}>
          <legend className={s.label}>{t('share.unitLegend')}</legend>
          {(['hidden', 'percent', 'coffee'] as const).map((k) => {
            const ok = unitAvailable(summary, k);
            return (
              <label
                key={k}
                className={s.radio}
                style={ok ? undefined : { cursor: 'not-allowed', color: 'var(--muted)' }}
              >
                <input type="radio" name="card-unit" checked={unit === k} disabled={!ok} onChange={() => setUnit(k)} />
                {t(`share.units.${k}`)}
                {!ok && k !== 'hidden' && <span className={s.small}>({t(`share.unitHints.${k}`)})</span>}
              </label>
            );
          })}
        </fieldset>
        {unit === 'coffee' && (
          <>
            <Field
              id="coffee-price"
              label={t('share.coffeePrice')}
              inputMode="decimal"
              placeholder={t('share.coffeePlaceholder')}
              value={priceText}
              onChange={(e) => {
                setPriceText(e.target.value);
                const p = parseAmount(e.target.value);
                setCoffeePrice(p > 0 ? p : null);
              }}
            />
            {!coffeePrice && <p className={`${s.muted} ${s.small}`}>{t('share.coffeeNeedPrice')}</p>}
          </>
        )}
        <p className={`${s.muted} ${s.small}`}>{t('share.privacy')}</p>
      </div>
      <div className={s.previewCol}>
        <CardExport content={content} />
      </div>
    </section>
  );
}
