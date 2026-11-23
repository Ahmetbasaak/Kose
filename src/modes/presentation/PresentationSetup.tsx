import { useState, type FormEvent } from 'react';
import { useStartSession } from '../../app/actions';
import s from '../../app/pages/pages.module.css';
import { durationWords } from '../../app/sessionView';
import { Button } from '../../components/Button';
import { CornerFace } from '../../components/corner/CornerView';
import { Field } from '../../components/Field';
import { formatClock } from '../../engine/format';
import { t } from '../../i18n';
import { StartFooter } from '../StartFooter';

interface Row {
  key: number;
  name: string;
  minutes: string;
}

const MIN = 60_000;
const rowOk = (r: Row) =>
  r.name.trim() !== '' && Number.isInteger(Number(r.minutes)) && +r.minutes >= 1 && +r.minutes <= 180;

export function PresentationSetup() {
  const [rows, setRows] = useState<Row[]>([
    { key: 1, name: t('presentation.d1'), minutes: '2' },
    { key: 2, name: t('presentation.d2'), minutes: '10' },
    { key: 3, name: t('presentation.d3'), minutes: '3' },
  ]);
  const [showError, setShowError] = useState(false);
  const startSession = useStartSession();
  const ok = rows.length > 0 && rows.every(rowOk);
  const totalMs = rows.reduce((a, r) => a + (rowOk(r) ? +r.minutes * MIN : 0), 0);

  const update = (key: number, patch: Partial<Row>) =>
    setRows(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!ok) return setShowError(true);
    await startSession({
      modeId: 'presentation',
      kind: 'sections',
      label: t('presentation.title'),
      durationMs: null,
      segments: rows.map((r) => +r.minutes * MIN),
      sectionNames: rows.map((r) => r.name.trim()),
    });
  };

  return (
    <div className={s.split}>
      <form className={`${s.card} ${s.formCol}`} onSubmit={(e) => void onSubmit(e)} noValidate>
        <fieldset className={s.fieldset} style={{ gap: 12 }}>
          <legend className={s.label}>{t('presentation.sections')}</legend>
          {rows.map((r, i) => {
            const err = showError && !rowOk(r) ? 'presentation-error' : null;
            return (
              <div key={r.key} className={s.row} style={{ alignItems: 'flex-end' }}>
                <Field
                  id={`sec-name-${r.key}`}
                  label={t('presentation.sectionName', { n: i + 1 })}
                  value={r.name}
                  maxLength={40}
                  errorId={err}
                  onChange={(e) => update(r.key, { name: e.target.value })}
                />
                <Field
                  id={`sec-min-${r.key}`}
                  label={t('presentation.minutes', { n: i + 1 })}
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={180}
                  value={r.minutes}
                  errorId={err}
                  onChange={(e) => update(r.key, { minutes: e.target.value })}
                />
                <Button
                  aria-label={t('presentation.removeSection', { name: r.name || String(i + 1) })}
                  disabled={rows.length === 1}
                  onClick={() => setRows(rows.filter((x) => x.key !== r.key))}
                >
                  ×
                </Button>
              </div>
            );
          })}
        </fieldset>
        <div>
          <Button
            onClick={() =>
              setRows([...rows, { key: Math.max(0, ...rows.map((r) => r.key)) + 1, name: '', minutes: '5' }])
            }
          >
            {t('presentation.addSection')}
          </Button>
        </div>
        {showError && !ok && (
          <p id="presentation-error" className={s.error} role="alert">
            {t('presentation.error')}
          </p>
        )}
        <p className={`${s.muted} ${s.small}`}>
          {t('presentation.total', { d: durationWords(totalMs) })} · {t('presentation.note')}
        </p>
        <StartFooter />
      </form>
      <div className={s.previewCol}>
        <span className={`${s.label} ${s.muted}`}>{t('setup.preview')}</span>
        <CornerFace
          variant="preview"
          label={t('presentation.title')}
          display={{
            value: formatClock(rowOk(rows[0]!) ? +rows[0]!.minutes * MIN : 0),
            status: 'running',
            caption: rows[0]?.name ?? '',
            sub: rows[1] ? t('presentation.next', { name: rows[1].name }) : t('presentation.last'),
            level: 'green',
            canPause: true,
          }}
        />
      </div>
    </div>
  );
}
