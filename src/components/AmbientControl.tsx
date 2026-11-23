import { playAmbient, setAmbientVolume, useAmbientStore, type AmbientKind } from '../app/ambient';
import s from '../app/pages/pages.module.css';
import { t } from '../i18n';

const KINDS: AmbientKind[] = ['off', 'white', 'brown', 'rain'];

/** Background noise picker for focus sessions. */
export function AmbientControl() {
  const { kind, volume } = useAmbientStore();
  return (
    <div className={s.row} style={{ alignItems: 'flex-end' }}>
      <div className={s.field}>
        <label htmlFor="ambient-kind" className={s.label}>
          {t('ambient.title')}
        </label>
        <select
          id="ambient-kind"
          className={s.input}
          value={kind}
          onChange={(e) => playAmbient(e.target.value as AmbientKind, volume)}
          aria-describedby="ambient-note"
        >
          {KINDS.map((k) => (
            <option key={k} value={k}>
              {t(`ambient.kinds.${k}`)}
            </option>
          ))}
        </select>
      </div>
      <div className={s.field}>
        <label htmlFor="ambient-volume" className={s.label}>
          {t('ambient.volume', { n: volume })}
        </label>
        <input
          id="ambient-volume"
          type="range"
          min={0}
          max={100}
          step={10}
          value={volume}
          onChange={(e) => setAmbientVolume(Number(e.target.value))}
        />
      </div>
      <p id="ambient-note" className={`${s.muted} ${s.small}`} style={{ flexBasis: '100%' }}>
        {t('ambient.note')}
      </p>
    </div>
  );
}
