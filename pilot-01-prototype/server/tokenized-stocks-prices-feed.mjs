import { readFile } from 'node:fs/promises';

export const TS_PRICES_PATH = '/api/tokenized-stocks/prices';
export const TS_PRICES_MAX_AGE_MS = 15 * 60_000;
const finite = (value) => typeof value === 'number' && Number.isFinite(value);
const fresh = (value, now) => {
  const time = typeof value === 'string' ? Date.parse(value) : NaN;
  return Number.isFinite(time) && time <= now + 60_000 && now - time < TS_PRICES_MAX_AGE_MS;
};

// Recheck the data clock on every request, even within the file cache window.
export function tokenizedStocksPricesView(feed, now = Date.now()) {
  const empty = { updatedAt: null, sources: [], rows: [], unavailable: true };
  if (!feed || !fresh(feed.updatedAt, now) || !Array.isArray(feed.sources) || !Array.isArray(feed.rows)) return empty;
  const sources = feed.sources.filter((source) => source && typeof source.id === 'string'
    && typeof source.venueId === 'string' && fresh(source.updatedAt, now)
    && source.status === 'ok' && typeof source.endpoint === 'string' && /^https:\/\//.test(source.endpoint));
  const byId = new Map(sources.map((source) => [source.id, source]));
  const seen = new Set();
  const rows = [];
  for (const row of feed.rows) {
    const source = byId.get(row?.sourceId);
    if (!source || source.venueId !== row.venueId || !fresh(row.updatedAt, now)
      || typeof row.ticker !== 'string' || !/^[A-Z][A-Z0-9.]{0,19}$/.test(row.ticker) || typeof row.instrument !== 'string' || !row.instrument
      || !['spot', 'perpetual'].includes(row.marketType) || typeof row.quoteCurrency !== 'string' || !/^[A-Z]{2,10}$/.test(row.quoteCurrency)
      || !finite(row.lastPrice) || row.lastPrice <= 0) continue;
    const key = `${row.venueId}:${row.marketType}:${row.instrument}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const referenceSource = row.indexSourceId ? byId.get(row.indexSourceId) : null;
    const referenceFresh = !row.indexSourceId || (referenceSource?.venueId === row.venueId && fresh(row.indexUpdatedAt, now));
    const indexPrice = referenceFresh && finite(row.indexPrice) && row.indexPrice > 0 ? row.indexPrice : null;
    const premium = indexPrice == null ? null : (row.lastPrice / indexPrice - 1) * 100;
    rows.push({ ticker: row.ticker, venueId: row.venueId, instrument: row.instrument,
      marketType: row.marketType, quoteCurrency: row.quoteCurrency, lastPrice: row.lastPrice,
      change24hPct: finite(row.change24hPct) && row.change24hPct >= -100 ? row.change24hPct : null,
      quoteVolume24h: finite(row.quoteVolume24h) && row.quoteVolume24h >= 0 ? row.quoteVolume24h : null,
      indexPrice, premiumPct: finite(premium) ? premium : null,
      updatedAt: row.updatedAt, sourceId: row.sourceId,
      ...(row.indexSourceId ? { indexSourceId: row.indexSourceId, indexUpdatedAt: row.indexUpdatedAt } : {}) });
  }
  return { updatedAt: feed.updatedAt, sources, rows, unavailable: rows.length === 0 };
}

export function createTokenizedStocksPricesReader({ file = null, ttlMs = 60_000, now = Date.now,
  readFileImpl = readFile, timeoutMs = 2000, log = () => {} } = {}) {
  let feed = null, readAt = null, pending = null;
  const ttl = Math.min(60_000, Math.max(0, Number(ttlMs) || 0));
  const refresh = () => {
    pending ??= (async () => {
      let timer;
      const controller = new AbortController();
      try {
        const timeout = new Promise((_, reject) => {
          timer = setTimeout(() => { controller.abort(); reject(new Error('prices read timed out')); }, timeoutMs);
        });
        const text = await Promise.race([readFileImpl(file, { encoding: 'utf8', signal: controller.signal }), timeout]);
        feed = JSON.parse(text);
      } catch (error) {
        feed = null;
        log(`tokenized-stocks prices unavailable: ${error?.message || error}`);
      } finally {
        clearTimeout(timer);
        readAt = now();
        pending = null;
      }
    })();
    return pending;
  };
  const read = async () => {
    if (file && (readAt == null || now() - readAt >= ttl)) await refresh();
    return tokenizedStocksPricesView(feed, now());
  };
  return {
    read,
    // ?tickers=NVDA,TSLA (home strip): only those rows, so the home page parses a few KB instead of ~150 KB.
    async respond(method = 'GET', searchParams = null) {
      let data = await read();
      const wanted = new Set(String(searchParams?.get?.('tickers') || '').split(',').map((t) => t.trim().toUpperCase()).filter((t) => /^[A-Z][A-Z0-9.]{0,19}$/.test(t)).slice(0, 40));
      if (wanted.size) {
        const rows = data.rows.filter((row) => wanted.has(row.ticker));
        const used = new Set(rows.flatMap((row) => [row.sourceId, row.indexSourceId].filter(Boolean)));
        data = { ...data, rows, sources: data.sources.filter((source) => used.has(source.id)), unavailable: rows.length === 0 };
      }
      return new Response(method === 'HEAD' ? null : JSON.stringify(data), { headers: {
        'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=30', 'x-content-type-options': 'nosniff',
      } });
    },
  };
}
