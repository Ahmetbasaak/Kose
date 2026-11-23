/**
 * URL formats that carry state without a backend. Everything here is untrusted input:
 * parse strictly and return null rather than guess.
 */

const MIN_EPOCH_S = Date.UTC(2000, 0, 1) / 1000;
const MAX_EPOCH_S = Date.UTC(2200, 0, 1) / 1000;
export const MAX_TITLE = 60;

function parseEpochSeconds(v: string | null): number | null {
  if (!v || !/^\d{9,11}$/.test(v)) return null;
  const n = Number(v);
  return n >= MIN_EPOCH_S && n < MAX_EPOCH_S ? n * 1000 : null;
}

function parseTitle(v: string | null): string | null {
  // Strip control characters; React escapes the rest when rendering.
  const s = (v ?? '').replace(/\p{C}/gu, '').trim();
  return s.length > 0 && s.length <= MAX_TITLE ? s : null;
}

/** Shared countdown: only a title and a moment, nothing else about the user. */
export function shareCountdownUrl(origin: string, title: string, at: number): string {
  const q = new URLSearchParams({ ad: title.slice(0, MAX_TITLE), t: String(Math.floor(at / 1000)) });
  return `${origin}/sayim?${q}`;
}

export function parseSharedCountdown(params: URLSearchParams): { title: string; at: number } | null {
  const title = parseTitle(params.get('ad'));
  const at = parseEpochSeconds(params.get('t'));
  return title && at !== null ? { title, at } : null;
}

export type OverlayMode =
  { type: 'target'; at: number } | { type: 'countdown'; endAt: number } | { type: 'stopwatch'; startAt: number };

export interface OverlayConfig {
  label: string | null;
  mode: OverlayMode;
  /** CSS color, "#rrggbb" or "#rgb". */
  color: string;
  sizePx: number;
}

/**
 * OBS overlay: ?t=<epoch s> counts to a moment, ?sure=<minutes> counts down from page load,
 * neither counts up from page load. ?ad=label, ?renk=hex (no #), ?boyut=px.
 */
export function parseOverlay(params: URLSearchParams, loadedAt: number): OverlayConfig {
  const at = parseEpochSeconds(params.get('t'));
  const minutes = Number(params.get('sure'));
  const mode: OverlayMode =
    at !== null
      ? { type: 'target', at }
      : params.has('sure') && Number.isFinite(minutes) && minutes > 0 && minutes <= 24 * 60
        ? { type: 'countdown', endAt: loadedAt + minutes * 60_000 }
        : { type: 'stopwatch', startAt: loadedAt };
  const hex = params.get('renk') ?? '';
  const size = Number(params.get('boyut'));
  return {
    label: parseTitle(params.get('ad')),
    mode,
    color: /^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex) ? `#${hex}` : '#ffffff',
    sizePx: Number.isFinite(size) && size >= 16 && size <= 400 ? size : 96,
  };
}
