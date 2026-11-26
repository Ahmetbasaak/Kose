/**
 * Timekeepera Worker: serves the static app, plus two small endpoints.
 * POST /api/e      anonymous usage event → Workers Analytics Engine (no IP / UA / id stored)
 * GET  /api/stats  owner-only aggregate report (Bearer STATS_KEY), read via the Analytics Engine SQL API
 */
import { parseEvent, statsQueries } from './events';

interface AnalyticsEngineDataset {
  writeDataPoint(p: { indexes?: string[]; blobs?: string[]; doubles?: number[] }): void;
}

interface Env {
  ASSETS: { fetch: (r: Request) => Promise<Response> };
  STATS?: AnalyticsEngineDataset;
  /** Secret the owner types on /istatistik. */
  STATS_KEY?: string;
  /** For reading: Cloudflare account id + an API token with "Account Analytics: Read". */
  CF_ACCOUNT_ID?: string;
  CF_API_TOKEN?: string;
}

const DATASET = 'timekeepera';
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });

/** Constant-time compare, so the key can't be guessed byte by byte from response timing. */
function sameKey(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function sql(env: Env, query: string): Promise<unknown[]> {
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/analytics_engine/sql`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.CF_API_TOKEN}` },
    body: query,
  });
  if (!res.ok) throw new Error(`sql ${res.status}`);
  return ((await res.json()) as { data: unknown[] }).data;
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    if (url.pathname === '/api/e') {
      if (req.method !== 'POST') return new Response(null, { status: 405 });
      const text = await req.text();
      if (text.length > 1024) return new Response(null, { status: 413 });
      let ev;
      try {
        ev = parseEvent(JSON.parse(text));
      } catch {
        ev = null;
      }
      if (!ev) return new Response(null, { status: 400 });
      env.STATS?.writeDataPoint({
        indexes: [ev.event],
        blobs: [ev.event, ev.mode, ev.path, ev.lang, ev.device, ev.display],
        doubles: [ev.seconds],
      });
      return new Response(null, { status: 204 });
    }

    if (url.pathname === '/api/stats') {
      let key = '';
      try {
        key = decodeURIComponent(req.headers.get('authorization')?.replace(/^Bearer /, '') ?? '');
      } catch {
        // Malformed encoding: treated as a wrong key.
      }
      if (!env.STATS_KEY || !sameKey(key, env.STATS_KEY)) return json({ error: 'unauthorized' }, 401);
      if (!env.CF_ACCOUNT_ID || !env.CF_API_TOKEN) return json({ error: 'not-configured' }, 503);
      const q = statsQueries(DATASET, Number(url.searchParams.get('days') ?? 30));
      try {
        const [byEvent, daily, paths, devices] = await Promise.all([
          sql(env, q.byEvent),
          sql(env, q.daily),
          sql(env, q.paths),
          sql(env, q.devices),
        ]);
        return json({ byEvent, daily, paths, devices });
      } catch {
        return json({ error: 'query-failed' }, 502);
      }
    }

    if (url.pathname.startsWith('/api/')) return new Response(null, { status: 404 });
    return env.ASSETS.fetch(req);
  },
};
