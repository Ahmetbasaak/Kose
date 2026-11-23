import { Button } from '../../components/Button';
import { CornerFace } from '../../components/corner/CornerView';
import { ProGate } from '../../components/ProGate';
import { t } from '../../i18n';
import { usePrefsStore, type CornerSize, type CornerTheme } from '../../storage/prefs';
import { useProStore } from '../entitlements';
import s from './pages.module.css';

const THEMES: CornerTheme[] = ['default', 'lcd', 'neon', 'paper', 'minimal'];
const SIZES: CornerSize[] = ['s', 'm', 'l'];

export function SettingsPage() {
  const prefs = usePrefsStore();
  const { pro, source, revoke } = useProStore();

  return (
    <div className={s.stack}>
      <h1 className={s.h1}>{t('settings.title')}</h1>

      <section className={`${s.card} ${s.stack}`} style={{ gap: 12 }} aria-labelledby="set-pro">
        <h2 id="set-pro" className={s.modeTitle}>
          {t('settings.proStatus')}
        </h2>
        <p>{pro ? t('settings.proOn', { source: source ?? '' }) : t('settings.proOff')}</p>
        {pro && (
          <div>
            <Button onClick={revoke}>{t('settings.revoke')}</Button>
          </div>
        )}
      </section>

      <section className={s.stack} style={{ gap: 12 }} aria-labelledby="set-corner">
        <h2 id="set-corner" className={s.modeTitle}>
          {t('settings.corner')}
        </h2>
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
      </section>

      <section className={s.stack} style={{ gap: 12 }} aria-labelledby="set-keys">
        <h2 id="set-keys" className={s.modeTitle}>
          {t('settings.shortcuts')}
        </h2>
        <ProGate feature="shortcuts">
          <div className={`${s.card} ${s.stack}`} style={{ gap: 8 }}>
            <label className={s.radio}>
              <input
                type="checkbox"
                checked={prefs.shortcuts}
                onChange={(e) => prefs.set({ shortcuts: e.target.checked })}
              />
              {t('settings.shortcutsOn')}
            </label>
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
        </ProGate>
      </section>

      <section className={s.stack} style={{ gap: 12 }} aria-labelledby="set-auto">
        <h2 id="set-auto" className={s.modeTitle}>
          {t('settings.autostart')}
        </h2>
        <ProGate feature="autostart">
          <div className={`${s.card} ${s.stack}`} style={{ gap: 8 }}>
            <label className={s.radio}>
              <input
                type="checkbox"
                checked={prefs.autostart}
                onChange={(e) => prefs.set({ autostart: e.target.checked })}
              />
              {t('settings.autostartOn')}
            </label>
            <span className={`${s.muted} ${s.small}`}>{t('settings.autostartNote')}</span>
          </div>
        </ProGate>
      </section>
    </div>
  );
}
