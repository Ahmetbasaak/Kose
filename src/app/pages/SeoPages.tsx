import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { Button, ButtonLink } from '../../components/Button';
import { Field } from '../../components/Field';
import { useNow } from '../../components/useNow';
import { upcomingHolidays } from '../../data/holidays';
import { businessDaysUntil } from '../../engine/calendar';
import { formatMoney } from '../../engine/format';
import { MONTHLY_HOURS, meetingCost } from '../../engine/work';
import { brandName, parseAmount } from '../../i18n';
import {
  CALCULATOR_PAGES,
  COUNTDOWN_INDEX,
  COUNTDOWN_PAGES,
  countdownMeta,
  countdownPage,
  nextOccurrence,
  type PageMeta,
} from '../../seo/pages';
import { useCountdownsStore } from '../../storage/countdowns';
import { useStartSession } from '../actions';
import { daysClock, formatTrDate } from '../sessionView';
import { NotFoundPage } from './NotFoundPage';
import s from './pages.module.css';
import { RollingValue } from '../../components/RollingValue';

/** Keeps the tab title in step with the prerendered <title> Google indexed. */
function useDocumentTitle(title: string) {
  useEffect(() => {
    if (!title) return;
    document.title = title;
    return () => {
      document.title = brandName; // leaving the page must not leave its title on the tab
    };
  }, [title]);
}

function OtherCountdowns({ except }: { except?: string }) {
  return (
    <nav aria-labelledby="other-cd" className={s.stack} style={{ gap: 8 }}>
      <h2 id="other-cd" className={s.label} style={{ fontSize: 16 }}>
        Diğer geri sayımlar
      </h2>
      <ul className={s.chipList} role="list">
        {COUNTDOWN_PAGES.filter((p) => p.slug !== except).map((p) => (
          <li key={p.slug}>
            <Link to={`/kac-gun-kaldi/${p.slug}`}>{p.question} kaç gün kaldı?</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** /kac-gun-kaldi/:slug — live countdown for a holiday, the weekend or payday. */
export function HolidayCountdownPage() {
  const page = countdownPage(useParams().slug);
  const now = useNow(1000);
  const startSession = useStartSession();
  const add = useCountdownsStore((st) => st.add);
  const [added, setAdded] = useState(false);
  const meta = page ? countdownMeta(page, now) : null;
  useDocumentTitle(meta?.title ?? '');
  if (!page || !meta) return <NotFoundPage />;
  const o = nextOccurrence(page, now);
  const rule = page.rule ?? (o ? { type: 'at' as const, at: o.at } : null);

  return (
    <div className={s.stack}>
      <div className={s.intro}>
        <h1 className={s.h1}>{meta.h1}</h1>
        <p className={s.lead}>{meta.intro}</p>
      </div>
      {o && (
        <section className={s.liveCard} aria-label={page.name}>
          <span className={s.liveCaption}>{page.name}</span>
          <div className={`${s.liveValue} num`} data-long role="timer">
            <RollingValue text={o.at > now ? daysClock(o.at - now) : 'Bugün!'} />
          </div>
          <span className={s.liveCaption}>
            {formatTrDate(o.at)}
            {o.at - now > 86_400_000 && ` · ${businessDaysUntil(now, o.at, upcomingHolidays(now))} iş günü`}
          </span>
        </section>
      )}
      {o?.holiday?.source === 'calculated' && (
        <p className={`${s.muted} ${s.small}`}>
          Tarih hicri takvimden hesaplandı; Diyanet’in ilanıyla nadiren bir gün fark olabilir.
        </p>
      )}
      {rule && (
        <div className={s.row}>
          <Button
            variant="primary"
            onClick={() =>
              void startSession(
                { modeId: 'countdowns', kind: 'target', label: page.name, durationMs: null, target: rule },
                { askNotify: true },
              )
            }
          >
            Ekranın köşesinde göster
          </Button>
          {added ? (
            <p role="status">
              Eklendi. <Link to="/mod/geri-sayim">Geri sayımlarım</Link>
            </p>
          ) : (
            <Button
              onClick={() => {
                add({ title: page.name, template: page.rule ? 'custom' : 'holiday', rule });
                setAdded(true);
              }}
            >
              Listeme ekle
            </Button>
          )}
        </div>
      )}
      <OtherCountdowns except={page.slug} />
    </div>
  );
}

/** /kac-gun-kaldi — index of all countdown landing pages. */
export function CountdownIndexPage() {
  return (
    <div className={s.stack}>
      <CalcHeader meta={COUNTDOWN_INDEX} />
      <OtherCountdowns />
    </div>
  );
}

function CalcHeader({ meta }: { meta: PageMeta }) {
  useDocumentTitle(meta.title);
  return (
    <div className={s.intro}>
      <h1 className={s.h1}>{meta.h1}</h1>
      <p className={s.lead}>{meta.intro}</p>
    </div>
  );
}

/** /hesapla/toplanti-maliyeti */
export function MeetingCalculatorPage() {
  const [people, setPeople] = useState('6');
  const [salary, setSalary] = useState('');
  const [minutes, setMinutes] = useState('60');
  const startSession = useStartSession();
  const n = Number(people);
  const monthly = parseAmount(salary);
  const mins = Number(minutes);
  const ok = Number.isInteger(n) && n >= 1 && monthly > 0 && mins > 0;
  const hourly = monthly / MONTHLY_HOURS;
  return (
    <div className={s.stack}>
      <CalcHeader meta={CALCULATOR_PAGES[0]!} />
      <div className={s.split}>
        <form className={`${s.card} ${s.formCol}`} onSubmit={(e) => e.preventDefault()}>
          <div className={s.row}>
            <Field
              id="c-people"
              label="Kişi sayısı"
              type="number"
              inputMode="numeric"
              min={1}
              value={people}
              onChange={(e) => setPeople(e.target.value)}
            />
            <Field
              id="c-minutes"
              label="Süre (dakika)"
              type="number"
              inputMode="numeric"
              min={1}
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
            />
          </div>
          <Field
            id="c-salary"
            label="Ortalama aylık net maaş (₺)"
            inputMode="decimal"
            placeholder="Örn. 45.000"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
          />
          <p className={`${s.muted} ${s.small}`}>
            Saatlik ücret ayda {MONTHLY_HOURS} çalışma saatiyle hesaplanır. Tahminidir.
          </p>
        </form>
        <section className={s.liveCard} aria-live="polite" aria-label="Sonuç">
          <span className={s.liveCaption}>Bu toplantının maliyeti</span>
          <div className={`${s.liveValue} num`} data-long>
            <RollingValue text={ok ? formatMoney(meetingCost(mins * 60_000, n, hourly)) : '—'} />
          </div>
          {ok && <span className={s.liveCaption}>Dakikası ≈ {formatMoney(meetingCost(60_000, n, hourly))}</span>}
          <div>
            <Button
              variant="primary"
              disabled={!ok}
              onClick={() =>
                void startSession({
                  modeId: 'meeting',
                  kind: 'stopwatch',
                  label: 'Toplantı maliyeti',
                  durationMs: null,
                  meeting: { people: n, hourlyRate: hourly, monthlySalary: monthly },
                })
              }
            >
              Toplantı başlarken canlı say
            </Button>
          </div>
        </section>
      </div>
      <p>
        <Link to="/hesapla/saatlik-ucret">Net maaştan saatlik ücretini de hesapla →</Link>
      </p>
    </div>
  );
}

/** /hesapla/saatlik-ucret */
export function HourlyCalculatorPage() {
  const [salary, setSalary] = useState('');
  const [days, setDays] = useState('22');
  const [hours, setHours] = useState('8');
  const monthly = parseAmount(salary);
  const d = Number(days);
  const h = Number(hours);
  const ok = monthly > 0 && d >= 1 && d <= 31 && h > 0 && h <= 24;
  const hourly = ok ? monthly / (d * h) : 0;
  return (
    <div className={s.stack}>
      <CalcHeader meta={CALCULATOR_PAGES[1]!} />
      <div className={s.split}>
        <form className={`${s.card} ${s.formCol}`} onSubmit={(e) => e.preventDefault()}>
          <Field
            id="h-salary"
            label="Aylık net maaş (₺)"
            inputMode="decimal"
            placeholder="Örn. 45.000"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
          />
          <div className={s.row}>
            <Field
              id="h-days"
              label="Ayda kaç gün?"
              type="number"
              inputMode="numeric"
              min={1}
              max={31}
              value={days}
              onChange={(e) => setDays(e.target.value)}
            />
            <Field
              id="h-hours"
              label="Günde kaç saat?"
              type="number"
              inputMode="decimal"
              min={1}
              max={24}
              value={hours}
              onChange={(e) => setHours(e.target.value)}
            />
          </div>
          <p className={`${s.muted} ${s.small}`}>Tahminidir: brüt/net farkı ve fazla mesai hesaba katılmaz.</p>
        </form>
        <section className={s.liveCard} aria-live="polite" aria-label="Sonuç">
          <span className={s.liveCaption}>Saatlik kazancın</span>
          <div className={`${s.liveValue} num`} data-long>
            <RollingValue text={ok ? formatMoney(hourly) : '—'} />
          </div>
          {ok && (
            <span className={s.liveCaption}>
              Günlük ≈ {formatMoney(hourly * h)} · Dakikalık ≈ {formatMoney(hourly / 60)}
            </span>
          )}
          <div>
            <ButtonLink to="/mod/mesai" variant="primary">
              Bugün ne kazandığını canlı izle
            </ButtonLink>
          </div>
        </section>
      </div>
      <p>
        <Link to="/hesapla/toplanti-maliyeti">Bir toplantının maliyetini hesapla →</Link>
      </p>
    </div>
  );
}
