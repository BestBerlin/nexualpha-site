// Runtime snapshots of /etf-flows and /calendar (2026-10-13). The BaoTa job (ops/intel-tools/run.sh) rewrites
// etf-flows.json and calendar.json on the host (/data/private/nexualpha/intel = /intel-state in the web container);
// the server reads ETF_FLOWS_FILE / CALENDAR_FILE at most once per ttl and serves /intel/<name>.json from them. A
// missing, unreadable or unusable file keeps the last good snapshot; with none, the release's static copy (public/intel/)
// answers and the pages render from it.
import { readFile, stat } from "node:fs/promises";

export function createJsonSnapshotReader({ file = null, fallbackFile = null, validate = () => true, ttlMs = 5 * 60 * 1000, now = Date.now, log = () => {}, label = "snapshot" } = {}) {
  let snapshot = null, body = null, source = null, mtimeMs = 0, readAt = 0, pending = null, failed = false;
  const load = async (path) => {
    const info = await stat(path);
    if (source === path && info.mtimeMs === mtimeMs && snapshot) return true;
    const text = await readFile(path, "utf8");
    const next = JSON.parse(text);
    if (!validate(next)) throw new Error(`${label}: unusable file ${path}`);
    if (snapshot && source === file && path === file && Date.parse(next.generatedAt) < Date.parse(snapshot.generatedAt)) throw new Error(`${label}: older than the snapshot in memory`);
    snapshot = next; body = text; source = path; mtimeMs = info.mtimeMs;
    return true;
  };
  const refresh = () => {
    pending ??= (async () => {
      failed = false;
      for (const path of [file, fallbackFile].filter(Boolean)) {
        try { if (await load(path)) return; } catch (error) { failed = true; if (error?.code !== "ENOENT") log(`${label} read failed: ${error?.message || error}`); }
        // keep the runtime snapshot already in memory rather than falling back to the older release copy
        if (path === file && snapshot && source === file) return;
      }
    })().finally(() => { readAt = now(); pending = null; });
    return pending;
  };
  const read = async () => {
    if (!readAt || now() - readAt >= ttlMs) await refresh();
    return snapshot && (failed || (file && source !== file) ? { ...snapshot, stale: true } : snapshot);
  };
  return {
    enabled: Boolean(file || fallbackFile),
    read,
    /** GET/HEAD response from the snapshot, or null to let the static file answer. */
    async respond(method = "GET") {
      const current = await read();
      if (!body || source !== file) return null;
      const modified = Date.parse(snapshot?.generatedAt);
      return new Response(method === "HEAD" ? null : current?.stale ? JSON.stringify(current) : body, { status: 200, headers: {
        "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=300", "access-control-allow-origin": "*",
        ...(Number.isFinite(modified) ? { "last-modified": new Date(modified).toUTCString() } : {}), "x-content-type-options": "nosniff",
      } });
    },
  };
}
