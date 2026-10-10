// Reader for the market collector's feed (ops/market-collector) used to SSR /liquidations and /funding-rates.
// The collector runs in its own container and nginx serves its file at /intel/market-events.json, so the web server
// reads it either from a mounted file (MARKET_EVENTS_FILE) or over HTTP (MARKET_EVENTS_URL, default: the public URL).
// One read per 60 s is cached for every request; a failed read serves the last good feed for up to `staleMs`, after
// that null — the pages then render their "temporarily unavailable" state instead of stale numbers.
import { readFile } from "node:fs/promises";
import { MARKET_EVENTS_PATH } from "../src/data/market-data-pages.js";

const UA = "NexuAlphaMarketDataReader/1.0 (+https://nexualpha.com)";

export function createMarketEventsReader({
  url = `https://nexualpha.com${MARKET_EVENTS_PATH}`, file = null, ttlMs = 60 * 1000, staleMs = 30 * 60 * 1000,
  fetchImpl = fetch, now = Date.now, log = () => {},
} = {}) {
  let feed = null, readAt = 0, goodAt = 0, pending = null;
  const load = async () => {
    if (file) return JSON.parse(await readFile(file, "utf8"));
    const res = await fetchImpl(url, { headers: { accept: "application/json", "user-agent": UA }, cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  };
  const refresh = () => {
    if (pending) return pending;
    pending = load()
      .then((next) => { if (next && typeof next === "object" && next.generatedAt) { feed = next; goodAt = now(); } })
      .catch((error) => log(`market events read failed: ${error?.message || error}`))
      .finally(() => { readAt = now(); pending = null; });
    return pending;
  };
  return {
    // Resolves to the cached feed (refreshing it first when the 60 s window has passed) or null.
    async read() {
      if (!readAt || now() - readAt >= ttlMs) await refresh();
      return feed && now() - goodAt <= staleMs ? feed : null;
    },
    refresh,
  };
}

export function marketEventsReaderFromEnv(env = process.env, options = {}) {
  return createMarketEventsReader({
    ...(env.MARKET_EVENTS_FILE ? { file: env.MARKET_EVENTS_FILE } : {}),
    ...(env.MARKET_EVENTS_URL ? { url: env.MARKET_EVENTS_URL } : {}),
    ...options,
  });
}
