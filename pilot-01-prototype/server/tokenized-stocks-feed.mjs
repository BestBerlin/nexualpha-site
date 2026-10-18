// Runtime tokenized-stocks listing snapshot (2026-10-18). The host refresh job (ops/tokenized-stocks-refresh) rewrites
// tokenized-stocks.json every few hours from the exchanges' public market data; the web server reads it from TS_LIVE_FILE
// (production: /intel-state/tokenized-stocks.json = host /data/private/nexualpha/intel/tokenized-stocks.json), so the
// ticker and exchange pages and /intel/tokenized-stocks.json pick up new listings and delistings without a redeploy.
// Read at most once per ttl; a missing, unreadable or implausible file keeps the last good snapshot, and with none the
// pages render the table baked into the release.
import { readFile, stat } from "node:fs/promises";
import { compactLive, isUsableLiveSnapshot } from "../src/data/tokenized-stocks-live-sources.js";

export const TS_LIVE_JSON_PATH = "/intel/tokenized-stocks.json";

export function createTokenizedStocksReader({ file = null, ttlMs = 5 * 60 * 1000, now = Date.now, log = () => {} } = {}) {
  let snapshot = null, compact = null, body = null, mtimeMs = 0, readAt = 0, pending = null;
  const refresh = () => {
    if (!file) return Promise.resolve();
    pending ??= (async () => {
      const info = await stat(file);
      if (info.mtimeMs === mtimeMs && snapshot) return;
      const text = await readFile(file, "utf8");
      const next = JSON.parse(text);
      if (!isUsableLiveSnapshot(next)) throw new Error("implausible tokenized-stocks snapshot");
      if (snapshot && Date.parse(next.generatedAt) < Date.parse(snapshot.generatedAt)) throw new Error("older than the snapshot in memory");
      snapshot = next; compact = compactLive(next); body = text; mtimeMs = info.mtimeMs;
    })()
      .catch((error) => { if (error?.code !== "ENOENT") log(`tokenized-stocks snapshot read failed: ${error?.message || error}`); })
      .finally(() => { readAt = now(); pending = null; });
    return pending;
  };
  const ensure = async () => { if (file && (!readAt || now() - readAt >= ttlMs)) await refresh(); };
  return {
    enabled: Boolean(file),
    /** Compact table for the pages ({ generatedAt, counts, checked, rows }) or null. */
    async read() { await ensure(); return compact; },
    /** GET/HEAD /intel/tokenized-stocks.json from the runtime file, or null to let the release's static copy answer. */
    async respond(method = "GET") {
      if (!file) return null;
      await ensure();
      if (!body) return null;
      return new Response(method === "HEAD" ? null : body, { status: 200, headers: {
        "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=300",
        "last-modified": new Date(Date.parse(snapshot.generatedAt)).toUTCString(), "x-content-type-options": "nosniff",
      } });
    },
  };
}
