// Runtime tokenized-stocks listing snapshot (2026-10-18). The host refresh job (ops/tokenized-stocks-refresh) rewrites
// tokenized-stocks.json every few hours from the exchanges' public market data; the web server reads it from TS_LIVE_FILE
// (production: /intel-state/tokenized-stocks.json = host /data/private/nexualpha/intel/tokenized-stocks.json), so the
// ticker and exchange pages and /intel/tokenized-stocks.json pick up new listings and delistings without a redeploy.
// Read at most once per TTL. Failed reads preserve explicitly degraded data until hard expiry;
// an enabled reader never falls back to an unmarked baked snapshot.
import { readFile, stat } from "node:fs/promises";
import { compactLive, isUsableLiveSnapshot } from "../src/data/tokenized-stocks-live-sources.js";

export const TS_LIVE_JSON_PATH = "/intel/tokenized-stocks.json";

export function createTokenizedStocksReader({ file = null, ttlMs = 5 * 60 * 1000, maxAgeMs = 12 * 3600e3, hardMaxAgeMs = 24 * 3600e3, now = Date.now, log = () => {} } = {}) {
  let snapshot = null, mtimeMs = 0, readAt = null, pending = null, error = null, lastSuccessAt = null;
  // Project freshness at every read, including cache hits; file TTL is not data validity.
  const view = (full = false) => {
    const ageMs = snapshot ? Math.max(0, now() - Date.parse(snapshot.generatedAt)) : null;
    const unavailable = !snapshot || ageMs >= hardMaxAgeMs;
    const stale = unavailable || Boolean(error) || ageMs >= maxAgeMs;
    const status = unavailable ? "UNAVAILABLE" : error ? "DEGRADED" : stale ? "STALE" : "OK";
    const data = snapshot ? (full ? snapshot : compactLive(snapshot)) : { generatedAt: null };
    return { ...data, ...(unavailable ? (full ? { venues: {}, events: [], campaigns: [] } : { rows: {}, counts: {}, checked: {}, events: [], campaigns: [] }) : {}),
      status, stale, degraded: Boolean(error), unavailable, ageMs, maxAgeMs, hardMaxAgeMs,
      lastSuccessAt, lastAttemptAt: readAt == null ? null : new Date(readAt).toISOString(), error };
  };
  const refresh = () => {
    if (!file) return Promise.resolve();
    pending ??= (async () => {
      const info = await stat(file);
      if (info.mtimeMs === mtimeMs && snapshot && !error) return;
      const text = await readFile(file, "utf8");
      const next = JSON.parse(text);
      if (Date.parse(next.generatedAt) > now() + 60_000) throw new Error("future tokenized-stocks snapshot");
      if (!isUsableLiveSnapshot(next)) throw new Error("implausible tokenized-stocks snapshot");
      if (snapshot && Date.parse(next.generatedAt) < Date.parse(snapshot.generatedAt)) throw new Error("older than the snapshot in memory");
      snapshot = next; mtimeMs = info.mtimeMs; error = null; lastSuccessAt = new Date(now()).toISOString();
    })()
      .catch((cause) => { error = String(cause?.message || cause); log(`tokenized-stocks snapshot read failed: ${error}`); })
      .finally(() => { readAt = now(); pending = null; });
    return pending;
  };
  const ensure = async () => { if (file && (readAt == null || now() - readAt >= ttlMs)) await refresh(); };
  return {
    enabled: Boolean(file),
    /** Compact table for the pages ({ generatedAt, counts, checked, rows }) or null. */
    async read() { if (!file) return null; await ensure(); return view(); },
    /** GET/HEAD /intel/tokenized-stocks.json from the runtime file, or null to let the release's static copy answer. */
    async respond(method = "GET") {
      if (!file) return null;
      await ensure();
      const data = view(true);
      return new Response(method === "HEAD" ? null : JSON.stringify(data), { status: 200, headers: {
        "content-type": "application/json; charset=utf-8", "cache-control": "no-store",
        ...(snapshot ? { "last-modified": new Date(Date.parse(snapshot.generatedAt)).toUTCString() } : {}), "x-content-type-options": "nosniff",
      } });
    },
  };
}
