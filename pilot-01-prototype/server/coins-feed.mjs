// Runtime coin snapshot (2026-10-12). The BaoTa job (ops/coins-refresh) rewrites coins.json on the host daily (exchange
// listings) and weekly (universe and prices); the web server reads it from COINS_FILE (production:
// /intel-state/coins.json = host /data/private/nexualpha/intel/coins.json), so /coins pages and /intel/coins.json stay
// fresh without a redeploy. Read at most once per ttl; a missing, unreadable or implausible file keeps the last good
// snapshot, and with none the pages render the table baked into the release.
import { readFile, stat } from "node:fs/promises";
import { isUsableCoinSnapshot } from "../src/data/coins-snapshot.js";

export const COINS_JSON_PATH = "/intel/coins.json";

export function createCoinsSnapshotReader({ file = null, ttlMs = 5 * 60 * 1000, now = Date.now, log = () => {} } = {}) {
  let snapshot = null, body = null, mtimeMs = 0, readAt = 0, pending = null, failed = false;
  const refresh = () => {
    if (!file) return Promise.resolve();
    pending ??= (async () => {
      const info = await stat(file);
      failed = false;
      if (info.mtimeMs === mtimeMs && snapshot) return;
      const text = await readFile(file, "utf8");
      const next = JSON.parse(text);
      if (!isUsableCoinSnapshot(next)) throw new Error(`implausible snapshot (${next?.coins?.length ?? 0} coins)`);
      if (snapshot && Date.parse(next.generatedAt) < Date.parse(snapshot.generatedAt)) throw new Error("older than the snapshot in memory");
      snapshot = next; body = text; mtimeMs = info.mtimeMs;
    })()
      .catch((error) => { failed = true; if (error?.code !== "ENOENT") log(`coins snapshot read failed: ${error?.message || error}`); })
      .finally(() => { readAt = now(); pending = null; });
    return pending;
  };
  const read = async () => {
    if (file && (!readAt || now() - readAt >= ttlMs)) await refresh();
    return snapshot && (failed ? { ...snapshot, stale: true } : snapshot);
  };
  return {
    enabled: Boolean(file),
    read,
    /** GET/HEAD /intel/coins.json from the runtime file, or null to let the release's static copy answer. */
    async respond(method = "GET") {
      if (!file) return null;
      const current = await read();
      if (!body) return null;
      return new Response(method === "HEAD" ? null : current?.stale ? JSON.stringify(current) : body, { status: 200, headers: {
        "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=300",
        "last-modified": new Date(Date.parse(snapshot.generatedAt)).toUTCString(), "x-content-type-options": "nosniff",
      } });
    },
  };
}
