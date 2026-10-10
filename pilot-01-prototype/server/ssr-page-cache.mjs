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
  const params = [...url.searchParams.entries()].sort(([a, va], [b, vb]) => (a === b ? va.localeCompare(vb) : a.localeCompare(b)));
  return `${url.pathname}?${params.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join("&")}`;
}

export function shouldBypassSsrCache(request) {
  if (request.method !== "GET" && request.method !== "HEAD") return true;
  return BYPASS_HEADERS.some((name) => request.headers.has(name));
}

export function createSsrPageCache({
  ttlMs = DEFAULT_SSR_CACHE_TTL_MS,
  maxEntries = 256,
  now = Date.now,
  shouldCache = isDirectoryPath,
  fingerprint = () => "",
} = {}) {
  const entries = new Map();
  const stats = { hits: 0, misses: 0, bypasses: 0, stores: 0, evictions: 0 };

  const withHeader = (response, state) => {
    const headers = new Headers(response.headers);
    headers.set(SSR_CACHE_HEADER, state);
    return new Response(response.body, { status: response.status, headers });
  };

  const prune = () => {
    const limit = now();
    for (const [key, entry] of entries) if (entry.expiresAt <= limit) entries.delete(key);
    while (entries.size > maxEntries) {
      // Map iteration is insertion-ordered: the oldest entry goes first.
      entries.delete(entries.keys().next().value);
      stats.evictions += 1;
    }
  };

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
    const version = String(await fingerprint());
    const key = ssrCacheKey(url);
    const cached = entries.get(key);
    const current = now();
    if (cached && cached.expiresAt > current && cached.version === version) {
      stats.hits += 1;
      return withHeader(new Response(request.method === "HEAD" ? null : cached.body, { status: 200, headers: cached.headers }), "hit");
    }
    if (cached) entries.delete(key);
    stats.misses += 1;
    const response = await render(request);
    const contentType = response.headers.get("content-type") || "";
    // HEAD answers have no body to keep; GET pages are stored only when they are successful HTML documents.
    if (request.method !== "GET" || response.status !== 200 || !contentType.includes("text/html")) return response;
    const body = new Uint8Array(await response.arrayBuffer());
    const headers = new Headers(response.headers);
    headers.delete("content-length");
    headers.delete(SSR_CACHE_HEADER);
    entries.set(key, { body, headers, version, expiresAt: current + ttlMs });
    stats.stores += 1;
    prune();
    return withHeader(new Response(body, { status: 200, headers }), "miss");
  }

  return {
    fetch,
    stats: () => ({ ...stats, size: entries.size }),
    clear: () => entries.clear(),
    has: (url) => { const entry = entries.get(ssrCacheKey(new URL(url))); return Boolean(entry && entry.expiresAt > now()); },
  };
}
