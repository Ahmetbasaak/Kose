import { useState } from 'react';
import s from '../../app/pages/pages.module.css';
import { OverlayView } from '../../app/pages/OverlayPage';
import { Button } from '../../components/Button';
import { Field } from '../../components/Field';
import { useNow } from '../../components/useNow';
import { parseIsoDate, trMidnight } from '../../engine/calendar';
import { parseTime } from '../../engine/work';
import { t } from '../../i18n';
import { overlayUrl, parseOverlay, type OverlayLinkMode } from '../../share/link';

type Kind = OverlayLinkMode['type'];

/** Form → /overlay link for OBS, with a live preview on a dark backdrop. */
export function OverlayBuilder() {
  const [kind, setKind] = useState<Kind>('countdown');
  const [minutes, setMinutes] = useState('10');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('20:00');
  const [label, setLabel] = useState('');
  const [color, setColor] = useState('#ffffff');
  const [size, setSize] = useState(120);
  const [copied, setCopied] = useState(false);
  const [loadedAt] = useState(Date.now);
  const now = useNow(250);

  const ymd = parseIsoDate(date);
  const at = ymd && Number.isFinite(parseTime(time)) ? trMidnight(ymd.y, ymd.m, ymd.d) + parseTime(time) * 60_000 : NaN;
  const n = Number(minutes);
  const mode: OverlayLinkMode | null =
    kind === 'stopwatch'
      ? { type: 'stopwatch' }
      : kind === 'countdown'
        ? n > 0 && n <= 1440
          ? { type: 'countdown', minutes: n }
          : null
        : at > now
          ? { type: 'target', at }
          : null;
  const url = mode ? overlayUrl(location.origin, { label: label.trim() || null, mode, color, sizePx: size }) : null;

  return (
    <div className={s.split}>
      <div className={`${s.card} ${s.formCol}`}>
        <fieldset className={s.fieldset}>
          <legend className={s.label}>{t('overlay.kind')}</legend>
          {(['stopwatch', 'countdown', 'target'] as const).map((k) => (
            <label key={k} className={s.radio}>
              <input type="radio" name="ov-kind" checked={kind === k} onChange={() => setKind(k)} />
              {t(`overlay.kinds.${k}`)}
            </label>
          ))}
        </fieldset>
        {kind === 'countdown' && (
          <div className={s.row}>
            <Field
              id="ov-min"
              label={t('overlay.minutes')}
              type="number"
              inputMode="numeric"
              min={1}
              max={1440}
              value={minutes}
              errorId={mode ? null : 'ov-error'}
              onChange={(e) => setMinutes(e.target.value)}
            />
          </div>
        )}
        {kind === 'target' && (
          <div className={s.row}>
            <Field
              id="ov-date"
              label={t('overlay.date')}
              type="date"
              value={date}
              errorId={mode ? null : 'ov-error'}
              onChange={(e) => setDate(e.target.value)}
            />
            <Field
              id="ov-time"
              label={t('overlay.time')}
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
        )}
        <Field
          id="ov-label"
          label={t('overlay.label')}
          maxLength={60}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <div className={s.row}>
          <div className={s.field}>
            <label htmlFor="ov-color" className={s.label}>
              {t('overlay.color')}
            </label>
            <input
              id="ov-color"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              style={{ height: 48, width: 72 }}
            />
          </div>
          <div className={s.field}>
            <label htmlFor="ov-size" className={s.label}>
              {t('overlay.size', { n: size })}
            </label>
            <input
              id="ov-size"
              type="range"
              min={32}
              max={240}
              step={8}
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
            />
          </div>
        </div>
        {!mode && (
          <p id="ov-error" className={s.error} role="alert">
            {t('overlay.error')}
          </p>
        )}
        {url && (
          <>
            <div className={s.field}>
              <label htmlFor="ov-url" className={s.label}>
                {t('overlay.link')}
              </label>
              <input id="ov-url" className={s.input} readOnly value={url} onFocus={(e) => e.target.select()} />
            </div>
            <div className={s.row}>
              <Button
                variant="primary"
                onClick={() =>
                  void navigator.clipboard?.writeText(url).then(
                    () => setCopied(true),
                    () => setCopied(false),
                  )
                }
              >
                {t('overlay.copy')}
              </Button>
              <a className={s.backLink} href={url} target="_blank" rel="noopener">
                {t('overlay.open')}
              </a>
              {copied && (
                <span role="status" className={`${s.muted} ${s.small}`}>
                  {t('overlay.copied')}
                </span>
              )}
            </div>
          </>
        )}
        <p className={`${s.muted} ${s.small}`}>{t('overlay.howTo')}</p>
      </div>
      <div className={s.previewCol}>
        <span className={`${s.label} ${s.muted}`}>{t('overlay.preview')}</span>
        <div style={{ background: '#20242b', borderRadius: 16, overflow: 'hidden', minHeight: 160 }}>
          {url && <OverlayView cfg={parseOverlay(new URL(url).searchParams, loadedAt)} now={now} />}
        </div>
      </div>
    </div>
  );
}
