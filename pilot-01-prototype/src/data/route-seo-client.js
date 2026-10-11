// Route-scoped client SEO (seo-payload lane, 2026-10-11).
//
// The server renders the complete <head> for every route (worker/index.js routeMetadata → injectRouteMetadata), so on
// first load the browser does nothing: the SSR head is authoritative. Only after a client-side route or locale change
// does the browser ask the worker for that one route's head (`/api/route-seo?path=<pathname>&locale=<locale>`), which
// returns exactly what routeMetadata() computed (title, description, canonical, robots, hreflang list, og/twitter,
// trust meta, JSON-LD). Results are cached per path|locale in memory.
//
// This module replaces the browser copy of src/data/seo-injection.js (route tables for every route in 15 locales,
// ~600 KB of chunks after idle on every page). seo-injection.js stays a Node/SSR module: the worker, the r100 frozen
// baselines and the SEO contract tests still exercise computeRouteSeo there; nothing in the browser graph imports it.

export const ROUTE_SEO_ENDPOINT = "/api/route-seo";
export const SERVER_SEO_MARKER_SELECTOR = '[data-nexualpha-route-seo="marker"]';
// Everything the SSR head owns and a route change must replace.
const MANAGED_HEAD_SELECTOR = [
  "[data-nexualpha-seo]",
  "[data-nexualpha-route-seo]",
  "#nexualpha-route-schema",
  'link[rel="canonical"]',
  'link[rel="alternate"][hreflang]',
  'meta[property^="og:"]',
  'meta[name^="twitter:"]',
].join(", ");

const cache = new Map();
let preservedServerKey = null;

export function routeSeoKey(pathname, locale) {
  return `${pathname}|${locale || ""}`;
}

export function routeSeoRequestUrl(pathname, locale, search = "") {
  const params = new URLSearchParams();
  params.set("path", `${pathname}${search || ""}`);
  if (locale) params.set("locale", locale);
  return `${ROUTE_SEO_ENDPOINT}?${params.toString()}`;
}

export function fetchRouteSeo(pathname, locale, { search = "", fetchImpl = globalThis.fetch } = {}) {
  const key = routeSeoKey(`${pathname}${search || ""}`, locale);
  if (cache.has(key)) return cache.get(key);
  if (typeof fetchImpl !== "function") return Promise.reject(new Error("fetch is not available"));
  const pending = Promise.resolve(fetchImpl(routeSeoRequestUrl(pathname, locale, search), { headers: { accept: "application/json" } }))
    .then((response) => {
      if (!response || !response.ok) throw new Error(`route-seo ${response ? response.status : "no response"}`);
      return response.json();
    })
    .then((payload) => {
      if (!payload || typeof payload.title !== "string") throw new Error("route-seo payload incomplete");
      return payload;
    })
    .catch((error) => {
      cache.delete(key);
      throw error;
    });
  cache.set(key, pending);
  return pending;
}

export function hasServerRouteSeo(doc = globalThis.document) {
  return Boolean(doc && typeof doc.querySelector === "function" && doc.querySelector(SERVER_SEO_MARKER_SELECTOR));
}

// Rewrite the document head from a /api/route-seo payload (or a local payload of the same shape).
export function applyRouteSeo(seo, doc = globalThis.document) {
  if (!seo || !doc || !doc.head) return false;
  doc.title = seo.title;
  doc.querySelectorAll(MANAGED_HEAD_SELECTOR).forEach((element) => element.remove());
  const append = (tag, attrs) => {
    const element = doc.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) element.setAttribute(key, value);
    element.setAttribute("data-nexualpha-seo", "route");
    doc.head.appendChild(element);
    return element;
  };
  const named = (name, content) => {
    let element = doc.querySelector(`meta[name="${name}"]`);
    if (!element) element = append("meta", { name });
    element.setAttribute("content", content);
  };
  append("link", { rel: "canonical", href: seo.canonical });
  for (const alternate of seo.alternates || []) append("link", { rel: "alternate", hreflang: alternate.hreflang, href: alternate.href });
  named("description", seo.description);
  named("robots", seo.robots || "index,follow");
  for (const [property, content] of seo.openGraph || []) append("meta", { property, content });
  for (const [name, content] of seo.twitter || []) append("meta", { name, content });
  for (const [name, content] of seo.trust || []) named(name, content);
  if (seo.marker) append("meta", { name: "nexualpha-route-marker", content: seo.marker });
  if (seo.schema) {
    const script = append("script", { type: "application/ld+json", id: "nexualpha-route-schema" });
    script.textContent = JSON.stringify(seo.schema);
  }
  return true;
}

// Component-level 404 (an article the feed no longer has): same head computeRouteSeo gave a notFound route, without
// a round trip. Strings match the historical client injector; no locale beyond en/zh-Hans had its own copy there.
export function notFoundRouteSeo({ locale = "en", pathname = "/", origin = "https://nexualpha.com" } = {}) {
  const isZh = locale === "zh-Hans";
  return {
    path: pathname,
    status: 404,
    marker: "NEXUALPHA_NOT_FOUND_ROUTE_V1",
    locale,
    title: isZh ? "页面不存在 — NexuAlpha" : "Page Not Found — NexuAlpha",
    description: isZh ? "请求的页面不存在或未发布。" : "The requested page does not exist or is not published.",
    canonical: `${origin}${pathname}`,
    robots: "noindex,nofollow",
    alternates: [],
    openGraph: [],
    twitter: [],
    trust: [],
    schema: null,
  };
}

export function applyNotFoundSeo({ locale, doc = globalThis.document, win = globalThis.window } = {}) {
  if (!doc || !win) return false;
  const pathname = win.location?.pathname || "/";
  preservedServerKey = routeSeoKey(pathname, locale);
  return applyRouteSeo(notFoundRouteSeo({ locale, pathname }), doc);
}

// Called by the app route effect. First pass with a server-rendered head: remember the key and leave the head alone.
// Later passes with a different pathname|locale (client-side navigation) fetch that route's payload and apply it,
// unless the location moved on again meanwhile.
export function syncRouteSeo({ pathname, locale, search = "", force = false, doc = globalThis.document, win = globalThis.window, fetchImpl = globalThis.fetch } = {}) {
  if (!doc || !win) return Promise.resolve(null);
  const currentPath = pathname ?? win.location?.pathname ?? "/";
  const currentSearch = search ?? "";
  const key = routeSeoKey(currentPath, locale);
  if (!force && hasServerRouteSeo(doc) && (preservedServerKey === null || preservedServerKey === key)) {
    preservedServerKey = key;
    return Promise.resolve(null);
  }
  return fetchRouteSeo(currentPath, locale, { search: currentSearch, fetchImpl })
    .then((seo) => {
      const stillCurrent = !win.location || win.location.pathname === currentPath;
      if (!stillCurrent) return null;
      preservedServerKey = key;
      applyRouteSeo(seo, doc);
      return seo;
    })
    .catch(() => null); // The current head stays when the payload cannot load.
}

export function resetRouteSeoClientForTests() {
  cache.clear();
  preservedServerKey = null;
}
