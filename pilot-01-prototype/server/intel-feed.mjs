// Official exchange announcements, kept fresh by the running server (owner asked for automatic refresh, 2026-10-09).
// Sources are the exchanges' own public announcement endpoints; no key, no scraping. A source that fails keeps its
// previous items; if every source fails the last good feed is served explicitly stale. Nothing is ever invented.
// The feed lives in memory only (code and assets may be mounted read-only); the build ships a seed copy.
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { isClusterWorker, primaryCall } from './cluster-rpc.mjs';
import { setTimeout as deadlineTimer, clearTimeout as clearDeadline } from 'node:timers';
import { ARCHIVE_PATH, mergeArchive, unionArchives } from '../src/data/announcement-archive.js';
import {
  mergeIntel, normalizeBitgetAnnouncements, normalizeBybitAnnouncements, readIntelFeed,
  normalizeOkxAnnouncements, normalizeBinanceAnnouncements, normalizeKucoinAnnouncements, normalizeRssAnnouncements,
} from '../src/data/announcement-intel.js';

export const INTEL_PATH = '/intel/official-announcements.json';
export const INTEL_ARCHIVE_PATH = ARCHIVE_PATH;
const UA = 'NexuAlphaAnnouncementReader/1.0 (+https://nexualpha.com)';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function getText(url, fetchImpl) {
  const res = await fetchImpl(url, { headers: { accept: 'application/rss+xml, application/xml, text/xml', 'user-agent': UA }, signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

async function getJson(url, fetchImpl) {
  const res = await fetchImpl(url, { headers: { accept: 'application/json', 'user-agent': UA }, signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// Gate, MEXC and Coinbase answer automated requests with an access-denied or challenge page; they are not
// fetched (no bot-detection workarounds). Hyperliquid's announcement blog has not been updated since 2024.
export const SOURCES = {
  okx: async (now, fetchImpl) => {
    const out = [];
    for (const q of ['page=1', 'page=1&annType=announcements-new-listings', 'page=1&annType=latest-events', 'page=2&annType=latest-events', 'page=1&annType=announcements-delistings']) {
      out.push(...normalizeOkxAnnouncements(await getJson(`https://www.okx.com/api/v5/support/announcements?${q}`, fetchImpl), { now }));
      await wait(300);
    }
    return out;
  },
  binance: async (now, fetchImpl) => {
    const out = [];
    for (const catalogId of [48, 49, 93, 161]) {
      out.push(...normalizeBinanceAnnouncements(await getJson(`https://www.binance.com/bapi/composite/v1/public/cms/article/list/query?type=1&pageNo=1&pageSize=20&catalogId=${catalogId}`, fetchImpl), catalogId, { now }));
      await wait(300);
    }
    return out;
  },
  kucoin: async (now, fetchImpl) => {
    const out = [];
    for (const annType of ['new-listings', 'activities', 'delistings', 'latest-announcements']) {
      out.push(...normalizeKucoinAnnouncements(await getJson(`https://api.kucoin.com/api/v3/announcements?pageSize=20&annType=${annType}&lang=en_US`, fetchImpl), annType, { now }));
      await wait(300);
    }
    return out;
  },
  kraken: async (now, fetchImpl) => normalizeRssAnnouncements(await getText('https://blog.kraken.com/feed', fetchImpl), 'kraken', { now }),
  bitget: async (now, fetchImpl) => {
    const out = [];
    // limit: Bitget answers 40017 "Parameter verification failed" above 10 (every refresh failed from 2026-10-10).
    for (const annType of ['coin_listings', 'trading_competitions_promotions', 'latest_news', 'symbol_delisting']) {
      out.push(...normalizeBitgetAnnouncements(await getJson(`https://api.bitget.com/api/v2/public/annoucements?language=en_US&annType=${annType}&limit=10`, fetchImpl), { now }));
      await wait(300);
    }
    return out;
  },
  bybit: async (now, fetchImpl) => {
    const out = [];
    for (const type of ['new_crypto', 'latest_activities', 'delistings']) {
      out.push(...normalizeBybitAnnouncements(await getJson(`https://api.bybit.com/v5/announcements/index?locale=en-US&type=${type}&limit=20`, fetchImpl), { now }));
      await wait(300);
    }
    return out;
  },
};

// Bound the whole venue as well as each fetch: multi-page sources run concurrently,
// so a stalled venue cannot serialize delays across all the healthy exchanges.
async function loadSource(load, now, fetchImpl, timeoutMs) {
  const controller = new AbortController();
  let timer;
  const boundedFetch = (url, options = {}) => fetchImpl(url, {
    ...options,
    signal: options.signal ? AbortSignal.any([controller.signal, options.signal]) : controller.signal,
  });
  try {
    return await Promise.race([
      Promise.resolve().then(() => load(now, boundedFetch)),
      new Promise((_, reject) => { timer = deadlineTimer(() => { controller.abort(); reject(new Error('Source deadline exceeded')); }, timeoutMs); }),
    ]);
  } finally { clearDeadline(timer); controller.abort(); }
}

// A cold total failure remains unavailable. Once seeded, preserve validated data
// and the last-good generation clock while reporting the failed refresh separately.
export async function buildFeed(previous, { now = Date.now(), fetchImpl = fetch, sources = SOURCES, sourceTimeoutMs = 30000 } = {}) {
  const kept = readIntelFeed(previous, { now });
  const status = {};
  const lists = await Promise.all(Object.entries(sources).map(async ([venue, load]) => {
    try {
      const items = await loadSource(load, now, fetchImpl, sourceTimeoutMs);
      if (!Array.isArray(items)) throw new Error('Invalid source response');
      status[venue] = { ok: true, fetched: items.length, at: new Date(now).toISOString(), lastGoodAt: new Date(now).toISOString() };
      return items;
    } catch (error) {
      status[venue] = { ok: false, error: String(error?.message || error), at: new Date(now).toISOString(), lastGoodAt: previous?.sources?.[venue]?.lastGoodAt ?? previous?.sources?.[venue]?.at ?? null };
      return kept.filter((i) => i.venue === venue);
    }
  }));
  const anySuccess = Object.values(status).some((s) => s.ok);
  if (!anySuccess) return previous ? {
    ...previous, updatedAt: new Date(now).toISOString(), status: 'STALE', stale: true,
    sources: { ...previous.sources, ...status }, items: kept,
  } : null;
  const stale = Object.values(status).some((s) => !s.ok);
  return { generatedAt: new Date(now).toISOString(), updatedAt: new Date(now).toISOString(), status: stale ? 'PARTIAL' : 'OK', stale, sources: status, items: mergeIntel(lists, { now, limit: 240 }) };
}

const jsonResponse = (body, maxAge) => new Response(body, { status: 200, headers: {
  'content-type': 'application/json; charset=utf-8', 'cache-control': `public, max-age=${maxAge}`, 'x-content-type-options': 'nosniff',
} });

async function readJson(file) {
  try { return JSON.parse(await readFile(file, 'utf8')); } catch { return null; }
}

const archiveWriters = new Map();
export function persistIntelArchive(file, archive, now = Date.now()) {
  file = path.resolve(file);
  const operation = (archiveWriters.get(file) || Promise.resolve()).then(async () => {
    const merged = unionArchives(await readJson(file), archive, { now });
    await mkdir(path.dirname(file), { recursive: true });
    const tmp = `${file}.tmp-${process.pid}-${randomUUID()}`;
    try {
      await writeFile(tmp, `${JSON.stringify(merged)}\n`);
      await rename(tmp, file);
    } finally { await rm(tmp, { force: true }).catch(() => {}); }
    return merged;
  });
  const settled = operation.catch(() => {});
  archiveWriters.set(file, settled);
  settled.then(() => { if (archiveWriters.get(file) === settled) archiveWriters.delete(file); });
  return operation;
}

// Serves the feed and refreshes it in the background every `everyMs` (never blocks a request on the exchanges).
// Every feed it serves is also merged into the append-only archive (`archiveFile`, outside the read-only app tree), so an
// update page stays resolvable after its item leaves the live feed. The build ships a seed archive next to the seed feed.
export function createIntelFeed(clientRoot, { everyMs = 5 * 60 * 1000, enabled = true, fetchImpl = fetch, log = () => {}, archiveFile = null, now = () => Date.now(), sources = SOURCES, sourceTimeoutMs = 30000 } = {}) {
  let feed = null, body = null, refreshing = null;
  const current = () => {
    if (!feed) return null;
    const generated = Date.parse(feed.generatedAt);
    const stale = feed.stale === true || !Number.isFinite(generated) || now() - generated >= everyMs;
    return { ...feed, stale, ...(stale ? { status: 'STALE' } : {}) };
  };
  let archive = null, archiveBody = null, writing = Promise.resolve();
  const persist = () => {
    if (!archiveFile) return writing;
    // Serialize the entire read/merge/write in the primary, not just the rename in each worker.
    // Separate release containers still need an external writer/lock for a simultaneous cutover write.
    writing = writing.then(async () => {
      const merged = isClusterWorker()
        ? await primaryCall('intel-save', { file: archiveFile, archive, now: now() })
        : await persistIntelArchive(archiveFile, archive, now());
      // A refresh may have added rows while IPC was pending; retain those until the next queued write.
      archive = unionArchives(merged, archive, { now: now() });
      archiveBody = `${JSON.stringify(archive)}\n`;
    }).catch((error) => log(`intel archive write failed: ${error?.message || error}`));
    return writing;
  };
  const remember = (next) => {
    const { archive: merged, changed } = mergeArchive(archive, next?.items, { now: now() });
    archive = merged; archiveBody = `${JSON.stringify(merged)}\n`;
    return changed ? persist() : writing;
  };
  const set = (next) => { feed = next; body = `${JSON.stringify(next)}\n`; return remember(next); };
  const archiveSeeded = Promise.all([
    archiveFile ? readJson(archiveFile) : null,
    readJson(path.join(clientRoot, 'intel', 'official-announcements-archive.json')),
  ]).then(([stored, shipped]) => {
    archive = unionArchives(shipped, stored, { now: now() });
    archiveBody = `${JSON.stringify(archive)}\n`;
  });
  const seeded = archiveSeeded.then(() => readFile(path.join(clientRoot, 'intel', 'official-announcements.json'), 'utf8'))
    .then((text) => set(JSON.parse(text))).catch(() => {});
  const refresh = () => {
    if (refreshing) return refreshing;
    refreshing = seeded.then(() => buildFeed(feed, { fetchImpl, now: now(), sources, sourceTimeoutMs }))
      .then((next) => { if (next) { const saved = set(next); log(`intel refreshed: ${next.items.length} items, archive ${archive?.items.length ?? 0}`); return saved; } })
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
    // Shutdown drains discovered rows, without waiting for a new upstream poll's 30 s deadline.
    async flush() { await seeded; await writing; },
    // Changes whenever a refresh replaced the feed; the SSR page cache keys on it so cached HTML never outlives a feed.
    version: () => feed ? `${feed.generatedAt}|${feed.updatedAt || ""}|${current().stale}` : "",
    // The current feed object (seed or last good refresh) for request-time SSR of /activities; null until seeded.
    async read() { await seeded; return current(); },
    // Every item the feed ever carried (see src/data/announcement-archive.js); null when nothing is archived.
    async readArchive() { await seeded; return archive?.items?.length ? archive : null; },
    async respond() {
      await seeded;
      if (!body) return new Response('Not Found', { status: 404, headers: { 'cache-control': 'no-store' } });
      const snapshot = current();
      return jsonResponse(`${JSON.stringify(snapshot)}\n`, snapshot.stale ? 60 : 300);
    },
    async respondArchive() {
      await seeded;
      if (!archiveBody || !archive?.items?.length) return new Response('Not Found', { status: 404, headers: { 'cache-control': 'no-store' } });
      return jsonResponse(archiveBody, 300);
    },
  };
}
