// Short-lived in-memory cache for server-rendered HTML pages (perf lane, 2026-10-11).
//
// The directory (/exchanges and its locale-prefixed forms) is rendered from the prerender manifest plus route metadata
// on every request. The result only depends on the path and query (the locale is part of both), so a 60-second cache
// keyed by pathname + sorted query removes the render from the hot path while staying fresh for feed-driven content:
// the key also carries a caller-supplied fingerprint (intel feed version, news feed hash), so a feed refresh starts a
// new entry instead of serving stale HTML.
//
// Only successful (200) text/html GET responses are stored. Requests that carry session-specific headers (cookie,
// authorization, the analytics mode header) bypass the cache completely so no personalised response is ever shared.

export const SSR_CACHE_HEADER = "x-nexualpha-ssr-cache";
export const DEFAULT_SSR_CACHE_TTL_MS = 60_000;
const BYPASS_HEADERS = Object.freeze(["cookie", "authorization", "x-nexualpha-analytics-mode"]);
// /exchanges, /zh-Hans/exchanges, /pt-BR/exchanges ... (page URLs never end with a slash; server.mjs redirects those).
const DIRECTORY_PATH = /^\/(?:[a-z]{2}(?:-[A-Za-z]{2,4})?\/)?exchanges$/;

export function isDirectoryPath(pathname) {
  return DIRECTORY_PATH.test(pathname);
}

export function ssrCacheKey(url) {
  const params = [...url.searchParams.entries()].sort(([a], [b]) => a.localeCompare(b));
  return `${url.pathname}?${params.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join("&")}`;
}

export function shouldBypassSsrCache(request) {
  if (request.method !== "GET" && request.method !== "HEAD") return true;
  if (new URL(request.url).searchParams.has("p")) return true;
  return BYPASS_HEADERS.some((name) => request.headers.has(name));
}

export function createSsrPageCache({
  ttlMs = DEFAULT_SSR_CACHE_TTL_MS,
  maxEntries = 256,
  maxBytes = 32 * 1024 * 1024,
  now = Date.now,
  shouldCache = isDirectoryPath,
  fingerprint = () => "",
} = {}) {
  const entries = new Map();
  const pending = new Map();
  let bytes = 0;
  const stats = { hits: 0, misses: 0, bypasses: 0, stores: 0, evictions: 0 };

  const withHeader = (response, state) => {
    const headers = new Headers(response.headers);
    headers.set(SSR_CACHE_HEADER, state);
    return new Response(response.body, { status: response.status, headers });
  };

  const remove = (key) => {
    const entry = entries.get(key);
    if (entry) bytes -= entry.body.byteLength;
    entries.delete(key);
  };
  const prune = () => {
    const limit = now();
    for (const [key, entry] of entries) if (entry.expiresAt <= limit) remove(key);
    while (entries.size > maxEntries || bytes > maxBytes) {
      remove(entries.keys().next().value);
      stats.evictions += 1;
    }
  };
  const fromEntry = (entry, method, state) => withHeader(new Response(method === "HEAD" ? null : entry.body, {
    status: 200, headers: entry.headers,
  }), state);

  /**
   * @param {Request} request
   * @param {(request: Request) => Promise<Response>} render
   * @returns {Promise<Response>}
   */
  async function fetch(request, render) {
    const url = new URL(request.url);
    if (!shouldCache(url.pathname) || shouldBypassSsrCache(request)) {
      stats.bypasses += 1;
      return render(request);
    }
    prune();
    const version = String(await fingerprint());
    const key = `${url.origin}|${ssrCacheKey(url)}`;
    const cached = entries.get(key);
    if (cached && cached.version === version) {
      stats.hits += 1;
      return fromEntry(cached, request.method, "hit");
    }
    if (cached) remove(key);
    // Wait only for a response proven public. Private responses and render failures are never shared.
    const flightKey = `${key}|${version}`;
    const flight = pending.get(flightKey);
    if (flight) {
      const entry = await flight;
      if (entry) { stats.hits += 1; return fromEntry(entry, request.method, "hit"); }
      // The leader's response was private or failed: render independently instead of queueing behind another leader.
      return render(request);
    }
    if (request.method === "HEAD" || pending.size >= maxEntries) return render(request);
    stats.misses += 1;
    let finish;
    pending.set(flightKey, new Promise(resolve => { finish = resolve; }));
    try {
      const response = await render(request);
      const contentType = response.headers.get("content-type") || "";
      const control = response.headers.get("cache-control") || "";
      if (response.status !== 200 || !contentType.includes("text/html")
        || /(?:^|,)\s*(?:private|no-store|no-cache)(?:\s*(?:=|,|$))/i.test(control)
        || response.headers.has("set-cookie") || response.headers.has("vary")) return response;
      const body = new Uint8Array(await response.arrayBuffer());
      const headers = new Headers(response.headers);
      headers.delete("content-length");
      headers.delete(SSR_CACHE_HEADER);
      if (body.byteLength > maxBytes) return new Response(body, { status: 200, headers });
      const entry = { body, headers, version, expiresAt: now() + ttlMs };
      remove(key);
      entries.set(key, entry);
      bytes += body.byteLength;
      stats.stores += 1;
      prune();
      finish(entry);
      return fromEntry(entry, request.method, "miss");
    } finally {
      pending.delete(flightKey);
      finish(null);
    }
  }

  return {
    fetch,
    stats: () => ({ ...stats, size: entries.size, bytes, pending: pending.size }),
    clear: () => { entries.clear(); bytes = 0; },
    has: (url) => { const entry = entries.get(`${new URL(url).origin}|${ssrCacheKey(new URL(url))}`); return Boolean(entry && entry.expiresAt > now()); },
  };
}
