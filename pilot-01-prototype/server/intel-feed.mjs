// Official exchange announcements, kept fresh by the running server (owner asked for automatic refresh, 2026-10-09).
// Sources are the exchanges' own public announcement endpoints; no key, no scraping. A source that fails keeps its
// previous items; if every source fails the last good feed is served unchanged. Nothing is ever invented.
// The feed lives in memory only (code and assets may be mounted read-only); the build ships a seed copy.
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  mergeIntel, normalizeBitgetAnnouncements, normalizeBybitAnnouncements, readIntelFeed,
} from '../src/data/announcement-intel.js';

export const INTEL_PATH = '/intel/official-announcements.json';
const UA = 'NexuAlphaAnnouncementReader/1.0 (+https://nexualpha.com)';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url, fetchImpl) {
  const res = await fetchImpl(url, { headers: { accept: 'application/json', 'user-agent': UA }, signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export const SOURCES = {
  bitget: async (now, fetchImpl) => {
    const out = [];
    for (const annType of ['coin_listings', 'latest_news', 'symbol_delisting']) {
      out.push(...normalizeBitgetAnnouncements(await getJson(`https://api.bitget.com/api/v2/public/annoucements?language=en_US&annType=${annType}&limit=10`, fetchImpl), { now }));
      await wait(300);
    }
    return out;
  },
  bybit: async (now, fetchImpl) => {
    const out = [];
    for (const type of ['new_crypto', 'latest_activities', 'delistings']) {
      out.push(...normalizeBybitAnnouncements(await getJson(`https://api.bybit.com/v5/announcements/index?locale=en-US&type=${type}&limit=10`, fetchImpl), { now }));
      await wait(300);
    }
    return out;
  },
};

// One refresh pass. Returns the new feed, or null when no source answered (caller keeps the previous feed).
export async function buildFeed(previous, { now = Date.now(), fetchImpl = fetch, sources = SOURCES } = {}) {
  const kept = readIntelFeed(previous, { now });
  const status = {};
  const lists = [];
  for (const [venue, load] of Object.entries(sources)) {
    try {
      const items = await load(now, fetchImpl);
      status[venue] = { ok: true, fetched: items.length, at: new Date(now).toISOString(), lastGoodAt: new Date(now).toISOString() };
      lists.push(items);
    } catch (error) {
      status[venue] = { ok: false, error: String(error?.message || error), lastGoodAt: previous?.sources?.[venue]?.lastGoodAt ?? previous?.sources?.[venue]?.at ?? null };
      lists.push(kept.filter((i) => i.venue === venue));
    }
  }
  if (!Object.values(status).some((s) => s.ok)) return null;
  return { generatedAt: new Date(now).toISOString(), status: 'OK', sources: status, items: mergeIntel(lists, { now }) };
}

// Serves the feed and refreshes it in the background every `everyMs` (never blocks a request on the exchanges).
export function createIntelFeed(clientRoot, { everyMs = 15 * 60 * 1000, enabled = true, fetchImpl = fetch, log = () => {} } = {}) {
  let feed = null, body = null, refreshing = null;
  const set = (next) => { feed = next; body = `${JSON.stringify(next)}\n`; };
  const seeded = readFile(path.join(clientRoot, 'intel', 'official-announcements.json'), 'utf8')
    .then((text) => set(JSON.parse(text))).catch(() => {});
  const refresh = () => {
    if (refreshing) return refreshing;
    refreshing = seeded.then(() => buildFeed(feed, { fetchImpl }))
      .then((next) => { if (next) { set(next); log(`intel refreshed: ${next.items.length} items`); } })
      .catch((error) => log(`intel refresh failed: ${error?.message || error}`))
      .finally(() => { refreshing = null; });
    return refreshing;
  };
  let timer = null;
  if (enabled) {
    refresh();
    timer = setInterval(refresh, everyMs);
    timer.unref?.();
  }
  return {
    refresh,
    stop: () => { if (timer) clearInterval(timer); },
    async respond() {
      await seeded;
      if (!body) return new Response('Not Found', { status: 404, headers: { 'cache-control': 'no-store' } });
      return new Response(body, { status: 200, headers: {
        'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=300', 'x-content-type-options': 'nosniff',
      } });
    },
  };
}
