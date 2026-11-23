import { describe, expect, it } from 'vitest';
import { parseOverlay, parseSharedCountdown, shareCountdownUrl } from '../src/share/link';

const AT = Date.UTC(2027, 5, 10, 6, 30);

describe('shared countdown link', () => {
  it('round-trips title and moment (to the second)', () => {
    const url = new URL(shareCountdownUrl('https://example.com', 'Sınav günü & sonrası', AT + 400));
    expect(url.pathname).toBe('/sayim');
    expect(parseSharedCountdown(url.searchParams)).toEqual({ title: 'Sınav günü & sonrası', at: AT });
  });

  it('carries nothing but the title and time', () => {
    const url = new URL(shareCountdownUrl('https://example.com', 'X', AT));
    expect([...url.searchParams.keys()].sort()).toEqual(['ad', 't']);
  });

  it('rejects junk', () => {
    const p = (q: string) => parseSharedCountdown(new URLSearchParams(q));
    expect(p('')).toBeNull();
    expect(p('ad=X&t=abc')).toBeNull();
    expect(p('ad=X&t=-5')).toBeNull();
    expect(p('ad=X&t=99999999999')).toBeNull(); // year 5138
    expect(p('ad=&t=1800000000')).toBeNull();
    expect(p(`ad=${'a'.repeat(61)}&t=1800000000`)).toBeNull();
    expect(p('ad=%00%01&t=1800000000')).toBeNull();
  });
});

describe('overlay params', () => {
  const loaded = 1_800_000_000_000;
  const o = (q: string) => parseOverlay(new URLSearchParams(q), loaded);

  it('defaults to a white stopwatch from page load', () => {
    expect(o('')).toEqual({ label: null, mode: { type: 'stopwatch', startAt: loaded }, color: '#ffffff', sizePx: 96 });
  });

  it('countdown in minutes, target moment wins over it', () => {
    expect(o('sure=10').mode).toEqual({ type: 'countdown', endAt: loaded + 600_000 });
    expect(o('sure=10&t=1800000600').mode).toEqual({ type: 'target', at: 1_800_000_600_000 });
  });

  it('only accepts hex colors and sane sizes (no CSS injection)', () => {
    expect(o('renk=ff0').color).toBe('#ff0');
    expect(o('renk=red;background:url(x)').color).toBe('#ffffff');
    expect(o('boyut=9999').sizePx).toBe(96);
    expect(o('boyut=140&ad=Yayın').sizePx).toBe(140);
    expect(o('ad=Yayın').label).toBe('Yayın');
  });
});
