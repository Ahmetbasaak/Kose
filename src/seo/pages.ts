/**
 * Search-landing pages: "Kurban Bayramı'na kaç gün kaldı?", calculators.
 * One definition feeds both the live React page and the build-time prerender (vite.config.ts),
 * so what Google reads and what visitors see never drift apart.
 */
import { brandName } from '../i18n';
import { holidaysBetween, type Holiday } from '../data/holidays';
import { targetState, type TargetRule } from '../engine/calendar';

const DAY = 86_400_000;
const dateFmt = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  weekday: 'long',
  timeZone: 'Europe/Istanbul',
});

export interface CountdownPage {
  slug: string;
  /** "Kurban Bayramı" */
  name: string;
  /** Dative for "…'na kaç gün kaldı?" */
  question: string;
  /** Holiday id prefix in holidays.ts, or a calendar rule. */
  holiday?: string;
  rule?: TargetRule;
}

export const COUNTDOWN_PAGES: CountdownPage[] = [
  { slug: 'kurban-bayrami', name: 'Kurban Bayramı', question: "Kurban Bayramı'na", holiday: 'kurban' },
  { slug: 'ramazan-bayrami', name: 'Ramazan Bayramı', question: "Ramazan Bayramı'na", holiday: 'ramazan' },
  { slug: 'yilbasi', name: 'Yılbaşı', question: "Yılbaşı'na", holiday: 'yilbasi' },
  { slug: '23-nisan', name: '23 Nisan', question: "23 Nisan'a", holiday: '23-nisan' },
  { slug: '1-mayis', name: '1 Mayıs', question: "1 Mayıs'a", holiday: '1-mayis' },
  { slug: '19-mayis', name: '19 Mayıs', question: "19 Mayıs'a", holiday: '19-mayis' },
  { slug: '15-temmuz', name: '15 Temmuz', question: "15 Temmuz'a", holiday: '15-temmuz' },
  { slug: '30-agustos', name: '30 Ağustos Zafer Bayramı', question: "30 Ağustos'a", holiday: '30-agustos' },
  { slug: '29-ekim', name: '29 Ekim Cumhuriyet Bayramı', question: "29 Ekim'e", holiday: '29-ekim' },
  { slug: 'hafta-sonu', name: 'Hafta sonu', question: 'Hafta sonuna', rule: { type: 'weekend' } },
  { slug: 'maas-gunu', name: 'Maaş günü (ayın 15’i)', question: 'Maaş gününe', rule: { type: 'payday', day: 15 } },
];

export const countdownPage = (slug: string | undefined) => COUNTDOWN_PAGES.find((p) => p.slug === slug);

/** Next (or current) occurrence for a page. */
export function nextOccurrence(p: CountdownPage, now: number): { at: number; days: number; holiday?: Holiday } | null {
  if (p.rule) return { at: targetState(p.rule, now).at, days: p.rule.type === 'weekend' ? 2 : 1 };
  const h = holidaysBetween(now, now + 800 * DAY).find((x) => x.id.startsWith(`${p.holiday}-`));
  return h ? { at: h.at, days: h.days, holiday: h } : null;
}

export const daysLeft = (at: number, now: number) => Math.max(0, Math.ceil((at - now) / DAY));

export interface PageMeta {
  path: string;
  title: string;
  description: string;
  h1: string;
  /** Plain sentences, also the prerendered body text. */
  intro: string;
}

export function countdownMeta(p: CountdownPage, now: number): PageMeta {
  const o = nextOccurrence(p, now);
  const when = o ? dateFmt.format(o.at) : '';
  const year = o ? new Date(o.at + 3 * 3_600_000).getUTCFullYear() : '';
  return {
    path: `/kac-gun-kaldi/${p.slug}`,
    title: `${p.question} kaç gün kaldı? (${year}) – ${brandName}`,
    description: `${p.name} ${when} günü. Kalan gün, saat ve iş günü canlı sayılır; ekranının köşesinde ya da telefonunda takip et.`,
    h1: `${p.question} kaç gün kaldı?`,
    // No day count here: prerendered HTML would go stale between deploys; the live page shows it.
    intro: o
      ? `${p.name} ${when} günü${o.days > 1 ? ` başlıyor (${o.days} gün)` : ''}. Kalan süreyi aşağıda canlı sayıyoruz.`
      : `${p.name} için tarih henüz hesaplanamadı.`,
  };
}

export const CALCULATOR_PAGES: PageMeta[] = [
  {
    path: '/hesapla/toplanti-maliyeti',
    title: `Toplantı maliyeti hesaplama – ${brandName}`,
    description:
      'Kişi sayısı, ortalama maaş ve süreyi gir; toplantının şirkete kaç TL’ye mal olduğunu hemen gör. Ücretsiz, kayıt gerekmez.',
    h1: 'Toplantı maliyeti hesaplama',
    intro:
      'Toplantıdaki kişi sayısını, ortalama aylık net maaşı ve süreyi gir; toplam maliyeti ve dakikasını hesaplayalım.',
  },
  {
    path: '/hesapla/saatlik-ucret',
    title: `Net maaştan saatlik ücret hesaplama – ${brandName}`,
    description:
      'Aylık net maaşını ve çalışma saatlerini gir; saatlik, günlük ve dakikalık kazancını gör. Ücretsiz, verilerin cihazında kalır.',
    h1: 'Net maaştan saatlik ücret hesaplama',
    intro:
      'Aylık net maaşını, ayda kaç gün ve günde kaç saat çalıştığını gir; saatlik, günlük ve dakikalık kazancını hesaplayalım.',
  },
];

/** Everything the prerender writes, in sitemap order. */
export const COUNTDOWN_INDEX: PageMeta = {
  path: '/kac-gun-kaldi',
  title: `Kaç gün kaldı? Bayram, tatil ve maaş günü geri sayımları – ${brandName}`,
  description:
    'Kurban ve Ramazan Bayramı, resmî tatiller, hafta sonu ve maaş günü için canlı geri sayımlar. Ücretsiz, kayıt gerekmez.',
  h1: 'Kaç gün kaldı?',
  intro: 'Bayramlar, resmî tatiller, hafta sonu ve maaş günü için canlı geri sayımlar.',
};

export const allSeoPages = (now: number): PageMeta[] => [
  ...CALCULATOR_PAGES,
  COUNTDOWN_INDEX,
  ...COUNTDOWN_PAGES.map((p) => countdownMeta(p, now)),
];
