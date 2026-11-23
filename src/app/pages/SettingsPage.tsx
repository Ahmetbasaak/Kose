import { useState, type ReactNode } from 'react';
import { Button } from '../../components/Button';
import { CornerFace } from '../../components/corner/CornerView';
import { Field } from '../../components/Field';
import { InstallHint } from '../../components/InstallHint';
import { parseTrNumber } from '../../engine/work';
import { ProGate } from '../../components/ProGate';
import { t } from '../../i18n';
import { clearLocalStorage, collectLocalStorage, parseBackup } from '../../storage/backup';
import { allRecords, deleteHistory, replaceRecords } from '../../storage/history';
import { usePrefsStore, type AppTheme, type CornerSize, type CornerTheme, type Tone } from '../../storage/prefs';
import { playChime } from '../alerts';
import { brandSlug } from '../config';
import { TEST_MODE, useEntitlements, useProStore } from '../entitlements';
import s from './pages.module.css';

const APP_THEMES: AppTheme[] = ['system', 'light', 'dark', 'retro'];
const THEMES: CornerTheme[] = ['default', 'lcd', 'neon', 'paper', 'minimal'];
const SIZES: CornerSize[] = ['s', 'm', 'l'];
const TONES: Tone[] = ['chime', 'bell', 'beep'];

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section className={s.stack} style={{ gap: 12 }} aria-labelledby={id}>
      <h2 id={id} className={s.modeTitle}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Check({
  checked,
  onChange,
  label,
  note,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  note?: string;
}) {
  return (
    <div>
      <label className={s.radio}>
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        {label}
      </label>
      {note && <p className={`${s.muted} ${s.small}`}>{note}</p>}
    </div>
  );
}

/** ₺ price input; keeps the user's text while typing, stores a number (or null when empty/invalid). */
function PriceField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  const [text, setText] = useState(value ? String(value).replace('.', ',') : '');
  return (
    <Field
      id={id}
      label={`${label} (₺)`}
      inputMode="decimal"
      placeholder={t('equiv.placeholder')}
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        const n = parseTrNumber(e.target.value);
        onChange(n > 0 ? n : null);
      }}
    />
  );
}

function download(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function SettingsPage() {
  const prefs = usePrefsStore();
  const { pro, source, revoke } = useProStore();
  const { can } = useEntitlements();
  const [notif, setNotif] = useState<NotificationPermission | 'unsupported'>(() =>
    'Notification' in window ? Notification.permission : 'unsupported',
  );
  const [dataMsg, setDataMsg] = useState<string | null>(null);

  const backupFile = async () => {
    const backup = {
      app: 'kose',
      version: 1,
      exportedAt: Date.now(),
      localStorage: collectLocalStorage(localStorage),
      history: await allRecords().catch(() => []),
    };
    const day = new Date().toISOString().slice(0, 10);
    return new File([JSON.stringify(backup)], `${brandSlug}-yedek-${day}.json`, { type: 'application/json' });
  };
  const exportData = async () => {
    const file = await backupFile();
    download(file.name, file);
  };
  // Phones: hand the file straight to WhatsApp, AirDrop, Drive… via the share sheet.
  const canShareFile =
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [new File(['{}'], 'x.json', { type: 'application/json' })] });
  const shareData = async () => {
    await navigator.share({ files: [await backupFile()] }).catch(() => undefined);
  };

  const importData = async (file: File | undefined) => {
    if (!file) return;
    const backup = parseBackup(await file.text());
    if (!backup) return setDataMsg(t('settings.importBad'));
    if (!window.confirm(t('settings.importConfirm'))) return;
    clearLocalStorage(localStorage);
    for (const [k, v] of Object.entries(backup.localStorage)) localStorage.setItem(k, v);
    await replaceRecords(backup.history);
    location.reload();
  };

  const wipe = async () => {
    if (!window.confirm(t('settings.wipeConfirm'))) return;
    clearLocalStorage(localStorage);
    await deleteHistory().catch(() => undefined);
    location.reload();
  };

  return (
    <div className={s.stack}>
      <h1 className={s.h1}>{t('settings.title')}</h1>

      <Section id="set-look" title={t('settings.appearance')}>
        <div className={`${s.card} ${s.stack}`} style={{ gap: 12 }}>
          <fieldset className={s.fieldset}>
            <legend className={s.label}>{t('settings.appTheme')}</legend>
            <div className={s.row}>
              {APP_THEMES.map((k) => {
                const locked = k === 'retro' && !can('themes');
                return (
                  <label key={k} className={s.radio}>
                    <input
                      type="radio"
                      name="app-theme"
                      checked={prefs.appTheme === k}
                      disabled={locked}
                      onChange={() => prefs.set({ appTheme: k })}
                    />
                    {t(`settings.appThemes.${k}`)}
                    {k === 'retro' && <span className={s.badge}>{t('home.pro')}</span>}
                  </label>
                );
              })}
            </div>
            <span className={`${s.muted} ${s.small}`}>{t('settings.appThemeNote')}</span>
          </fieldset>
          <Check
            checked={prefs.reduceMotion}
            onChange={(v) => prefs.set({ reduceMotion: v })}
            label={t('settings.reduceMotion')}
          />
          <Check
            checked={prefs.titleTimer}
            onChange={(v) => prefs.set({ titleTimer: v })}
            label={t('settings.titleTimer')}
          />
        </div>
      </Section>

      <Section id="set-sound" title={t('settings.soundTitle')}>
        <div className={`${s.card} ${s.stack}`} style={{ gap: 12 }}>
          <Check checked={prefs.sound} onChange={(v) => prefs.set({ sound: v })} label={t('settings.sound')} />
          <div className={s.row}>
            <div className={s.field}>
              <label htmlFor="set-volume" className={s.label}>
                {t('settings.volume', { n: prefs.volume })}
              </label>
              <input
                id="set-volume"
                type="range"
                min={0}
                max={100}
                step={10}
                value={prefs.volume}
                disabled={!prefs.sound}
                onChange={(e) => prefs.set({ volume: Number(e.target.value) })}
              />
            </div>
            <div className={s.field}>
              <label htmlFor="set-tone" className={s.label}>
                {t('settings.tone')}
              </label>
              <select
                id="set-tone"
                className={s.input}
                value={prefs.tone}
                disabled={!prefs.sound}
                onChange={(e) => prefs.set({ tone: e.target.value as Tone })}
              >
                {TONES.map((k) => (
                  <option key={k} value={k}>
                    {t(`settings.tones.${k}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <Button onClick={() => playChime(3, true)}>{t('settings.testSound')}</Button>
          </div>
          <h3 className={s.label}>{t('settings.notifications')}</h3>
          <p className={`${s.muted} ${s.small}`} role="status">
            {t(`settings.notif.${notif}`)}
          </p>
          <InstallHint />
          {notif === 'default' && (
            <div>
              <Button onClick={() => void Notification.requestPermission().then(setNotif)}>
                {t('settings.askNotif')}
              </Button>
            </div>
          )}
        </div>
      </Section>

      <Section id="set-timer" title={t('settings.timerTitle')}>
        <div className={`${s.card} ${s.stack}`} style={{ gap: 12 }}>
          <Check
            checked={prefs.openCornerOnStart}
            onChange={(v) => prefs.set({ openCornerOnStart: v })}
            label={t('settings.openCorner')}
            note={t('settings.openCornerNote')}
          />
          <Check
            checked={prefs.keepAwake}
            onChange={(v) => prefs.set({ keepAwake: v })}
            label={t('settings.keepAwake')}
            note={'wakeLock' in navigator ? t('settings.keepAwakeNote') : t('settings.keepAwakeUnsupported')}
          />
        </div>
      </Section>

      <Section id="set-corner" title={t('settings.corner')}>
        <ProGate feature="cornerSettings">
          <div className={`${s.card} ${s.split}`}>
            <div className={s.formCol}>
              <div className={s.field}>
                <label htmlFor="set-theme" className={s.label}>
                  {t('settings.theme')}
                </label>
                <select
                  id="set-theme"
                  className={s.input}
                  value={prefs.cornerTheme}
                  onChange={(e) => prefs.set({ cornerTheme: e.target.value as CornerTheme })}
                >
                  {THEMES.map((k) => (
                    <option key={k} value={k}>
                      {t(`settings.themes.${k}`)}
                    </option>
                  ))}
                </select>
              </div>
              <fieldset className={s.fieldset}>
                <legend className={s.label}>{t('settings.size')}</legend>
                <div className={s.row}>
                  {SIZES.map((k) => (
                    <label key={k} className={s.radio}>
                      <input
                        type="radio"
                        name="corner-size"
                        checked={prefs.cornerSize === k}
                        onChange={() => prefs.set({ cornerSize: k })}
                      />
                      {t(`settings.sizes.${k}`)}
                    </label>
                  ))}
                </div>
                <span className={`${s.muted} ${s.small}`}>{t('settings.sizeNote')}</span>
              </fieldset>
              <div className={s.field}>
                <label htmlFor="set-opacity" className={s.label}>
                  {t('settings.opacity', { n: prefs.cornerOpacity })}
                </label>
                <input
                  id="set-opacity"
                  type="range"
                  min={40}
                  max={100}
                  step={5}
                  value={prefs.cornerOpacity}
                  aria-describedby="set-opacity-note"
                  onChange={(e) => prefs.set({ cornerOpacity: Number(e.target.value) })}
                />
                <span id="set-opacity-note" className={`${s.muted} ${s.small}`}>
                  {t('settings.opacityNote')}
                </span>
              </div>
              <div className={s.field}>
                <label htmlFor="set-scale" className={s.label}>
                  {t('settings.fontScale', { n: prefs.cornerScale })}
                </label>
                <input
                  id="set-scale"
                  type="range"
                  min={80}
                  max={140}
                  step={10}
                  value={prefs.cornerScale}
                  onChange={(e) => prefs.set({ cornerScale: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className={s.previewCol} style={{ opacity: prefs.cornerOpacity / 100 }}>
              <span className={`${s.label} ${s.muted}`}>{t('settings.preview')}</span>
              <CornerFace
                variant="preview"
                label={t('modes.work.title')}
                display={{
                  value: '1.150,47 ₺',
                  status: 'running',
                  caption: t('work.estimate'),
                  sub: t('work.untilEnd', { d: t('units.hm', { h: 3, m: 30 }) }),
                  canPause: false,
                }}
              />
            </div>
          </div>
        </ProGate>
      </Section>

      <Section id="set-keys" title={t('settings.shortcuts')}>
        <div className={`${s.card} ${s.stack}`} style={{ gap: 8 }}>
          <Check
            checked={prefs.shortcuts}
            onChange={(v) => prefs.set({ shortcuts: v })}
            label={t('settings.shortcutsOn')}
          />
          <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 16px', margin: 0 }}>
            {(['p', 'b', 'k'] as const).map((k) => (
              <div key={k} style={{ display: 'contents' }}>
                <dt>
                  <kbd className="num">{k.toUpperCase()}</kbd>
                </dt>
                <dd style={{ margin: 0 }}>{t(`settings.keys.${k}`)}</dd>
              </div>
            ))}
          </dl>
          <span className={`${s.muted} ${s.small}`}>{t('settings.shortcutsNote')}</span>
        </div>
      </Section>

      <Section id="set-auto" title={t('settings.autostart')}>
        <ProGate feature="autostart">
          <div className={s.card}>
            <Check
              checked={prefs.autostart}
              onChange={(v) => prefs.set({ autostart: v })}
              label={t('settings.autostartOn')}
              note={t('settings.autostartNote')}
            />
          </div>
        </ProGate>
      </Section>

      <Section id="set-equiv" title={t('equiv.title')}>
        <div className={`${s.card} ${s.stack}`} style={{ gap: 12 }}>
          <p className={`${s.muted} ${s.small}`}>{t('equiv.note')}</p>
          <div className={s.row}>
            <PriceField
              id="price-coffee"
              label={t('equiv.names.coffee')}
              value={prefs.coffeePrice}
              onChange={(v) => prefs.setCoffeePrice(v)}
            />
            {(['simit', 'tea', 'subscription'] as const).map((k) => (
              <PriceField
                key={k}
                id={`price-${k}`}
                label={t(`equiv.names.${k}`)}
                value={prefs.prices[k] ?? null}
                onChange={(v) => prefs.set({ prices: { ...prefs.prices, [k]: v } })}
              />
            ))}
          </div>
        </div>
      </Section>

      <Section id="set-data" title={t('settings.data')}>
        <div className={`${s.card} ${s.stack}`} style={{ gap: 12 }}>
          <p className={`${s.muted} ${s.small}`}>{t('settings.dataNote')}</p>
          <div className={s.row}>
            <Button onClick={() => void exportData()}>{t('settings.exportData')}</Button>
            {canShareFile && <Button onClick={() => void shareData()}>{t('settings.shareData')}</Button>}
            {/* A styled label opens the native file picker; the input stays keyboard-focusable. */}
            <label className={s.fileButton}>
              {t('settings.importData')}
              <input
                type="file"
                accept="application/json,.json"
                className="visually-hidden"
                onChange={(e) => void importData(e.target.files?.[0])}
              />
            </label>
            <Button onClick={() => void wipe()} style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}>
              {t('settings.wipe')}
            </Button>
          </div>
          {dataMsg && (
            <p role="alert" className={s.error}>
              {dataMsg}
            </p>
          )}
        </div>
      </Section>

      <Section id="set-pro" title={t('settings.proStatus')}>
        <div className={`${s.card} ${s.stack}`} style={{ gap: 12 }}>
          <p>
            {TEST_MODE
              ? t('settings.proTest')
              : pro
                ? t('settings.proOn', { source: source ?? '' })
                : t('settings.proOff')}
          </p>
          {pro && !TEST_MODE && (
            <div>
              <Button onClick={revoke}>{t('settings.revoke')}</Button>
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}
