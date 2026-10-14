// Bounded, short-lived public HTML cache. Cookies only affect the home hero;
// assignments carrying Set-Cookie are never shared.
import { isHomeHeroRoute, readHomeHeroCookie, isHomeHeroBot } from "../src/data/home-hero-experiment.js";

export const SSR_CACHE_HEADER = "x-nexualpha-ssr-cache";
export const DEFAULT_SSR_CACHE_TTL_MS = 60_000;
const BYPASS_HEADERS = Object.freeze(["authorization", "x-nexualpha-analytics-mode"]);
// /exchanges, /zh-Hans/exchanges, /pt-BR/exchanges ... (page URLs never end with a slash; server.mjs redirects those).
const DIRECTORY_PATH = /^\/(?:[a-z]{2}(?:-[A-Za-z]{2,4})?\/)?exchanges$/;

export function isDirectoryPath(pathname) {
  return DIRECTORY_PATH.test(pathname);
}

export function isPublicHtmlPath(pathname) {
  return !/^\/(?:api|assets|content|intel|media|brands?|fonts|motion|go|og|embed|health|partners?)(?:\/|$)/i.test(pathname)
    && !/^\/(?:__|healthz$|readiness$)/.test(pathname)
    && !/\.[a-z0-9]{1,8}$/i.test(pathname);
}

export function ssrCacheKey(url, request) {
  const params = [...url.searchParams.entries()].sort(([a, va], [b, vb]) => (a === b ? va.localeCompare(vb) : a.localeCompare(b)));
  const variant = isHomeHeroRoute(url.pathname) ? `|hero=${isHomeHeroBot(request?.headers.get("user-agent") || "") ? "crawler" : readHomeHeroCookie(request?.headers.get("cookie")) || "new"}` : "";
  return `${url.pathname}?${params.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join("&")}${variant}`;
}

export function shouldBypassSsrCache(request) {
  if (request.method !== "GET" && request.method !== "HEAD") return true;
  return BYPASS_HEADERS.some((name) => request.headers.has(name));
}

export function createSsrPageCache({
  ttlMs = DEFAULT_SSR_CACHE_TTL_MS,
  maxEntries = 128,
  maxBytes = 32 * 1024 * 1024,
  now = Date.now,
  shouldCache = isPublicHtmlPath,
  fingerprint = () => "",
} = {}) {
  const entries = new Map();
  let bytes = 0;
  const remove = (key) => { const entry = entries.get(key); if (entry) bytes -= entry.body.byteLength; entries.delete(key); };
  const stats = { hits: 0, misses: 0, bypasses: 0, stores: 0, evictions: 0 };

  const withHeader = (response, state) => {
    const headers = new Headers(response.headers);
    headers.set(SSR_CACHE_HEADER, state);
    return new Response(response.body, { status: response.status, headers });
  };

  const prune = () => {
    const limit = now();
    for (const [key, entry] of entries) if (entry.expiresAt <= limit) remove(key);
    while (entries.size > maxEntries || bytes > maxBytes) {
      // Map iteration is insertion-ordered: the oldest entry goes first.
      remove(entries.keys().next().value);
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
    const key = ssrCacheKey(url, request);
    const cached = entries.get(key);
    const current = now();
    if (cached && cached.expiresAt > current && cached.version === version) {
      stats.hits += 1;
      return withHeader(new Response(request.method === "HEAD" ? null : cached.body, { status: 200, headers: cached.headers }), "hit");
    }
    if (cached) remove(key);
    stats.misses += 1;
    const response = await render(request);
    const contentType = response.headers.get("content-type") || "";
    // HEAD answers have no body to keep; GET pages are stored only when they are successful HTML documents.
    if (request.method !== "GET" || response.status !== 200 || response.headers.has("set-cookie") || /(?:^|,)\s*no-store\b/i.test(response.headers.get("cache-control") || "") || !contentType.includes("text/html")) return response;
    const body = new Uint8Array(await response.arrayBuffer());
    if (body.byteLength > maxBytes) return new Response(body, { status: response.status, headers: response.headers });
    const headers = new Headers(response.headers);
    headers.delete("content-length");
    headers.delete(SSR_CACHE_HEADER);
    remove(key);
    bytes += body.byteLength;
    entries.set(key, { body, headers, version, expiresAt: current + ttlMs });
    stats.stores += 1;
    prune();
    return withHeader(new Response(body, { status: 200, headers }), "miss");
  }

  return {
    fetch,
    stats: () => { prune(); return { ...stats, size: entries.size, bytes, maxBytes }; },
    clear: () => { entries.clear(); bytes = 0; },
    has: (url, request) => { const entry = entries.get(ssrCacheKey(new URL(url), request)); return Boolean(entry && entry.expiresAt > now()); },
  };
}
