// seo-payload lane (2026-10-11): the browser no longer ships the route SEO tables. The SSR head stays authoritative on
// first load; a client-side route change fetches that one route's head from /api/route-seo. Three contracts:
//  1. /api/route-seo returns exactly what the SSR head for the same URL contains (10 routes x 3 locales);
//  2. the client injector leaves a server-rendered head alone, applies the payload after navigation, caches per path;
//  3. no client chunk carries the seo-injection route tables (dist/client, when a build is present).
import assert from "node:assert/strict";
import { existsSync, statSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { localizedPath } from "../src/data/locale-routing.js";
import worker, { routeSeoPayload, routeSeoTargetUrl } from "../worker/index.js";
import {
  ROUTE_SEO_ENDPOINT,
  applyNotFoundSeo,
  applyRouteSeo,
  fetchRouteSeo,
  notFoundRouteSeo,
  resetRouteSeoClientForTests,
  routeSeoRequestUrl,
  syncRouteSeo,
} from "../src/data/route-seo-client.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const ORIGIN = "https://example.test";
const SHELL = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Shell</title><meta name="description" content="shell" /><link rel="canonical" href="https://nexualpha.com/" /><meta name="robots" content="index,follow" /></head><body><div id="root"></div></body></html>`;

async function assetFile(pathname) {
  for (const dir of ["dist/client", "public"]) {
    const file = path.join(root, dir, pathname.replace(/^\//, ""));
    if (existsSync(file) && statSync(file).isFile()) return readFile(file);
  }
  return null;
}

const env = {
  ASSETS: {
    fetch: async (request) => {
      const url = new URL(request.url);
      if (url.pathname === "/index.html") return new Response(SHELL, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } });
      const body = await assetFile(url.pathname);
      if (body === null) return new Response("missing", { status: 404, headers: { "content-type": "text/plain" } });
      const type = url.pathname.endsWith(".json") ? "application/json" : url.pathname.endsWith(".txt") ? "text/plain" : "application/octet-stream";
      return new Response(body, { status: 200, headers: { "content-type": type } });
    },
  },
};

const PUBLISHED_ARTICLE = "hyperliquid-vs-dydx";
// Representative routes: home, directory, venue, compare, news list, news article, data page, topic, brand page,
// Telegram hub, plus an unknown path (404 head) and a partner entry (noindex,follow).
const ROUTES = [
  "/",
  "/exchanges",
  "/exchanges/okx",
  "/compare/binance-vs-okx",
  "/news",
  `/news/${PUBLISHED_ARTICLE}`,
  "/liquidations",
  "/topics/meme-coins",
  "/methodology",
  "/telegram",
  "/this-route-does-not-exist",
  "/ref/okx",
];
const LOCALES = ["en", "zh-Hans", "ja"];

function decode(text) {
  return text.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

function attribute(tag, name) {
  const match = tag.match(new RegExp(`\\s${name}=["']([^"']*)["']`));
  return match ? decode(match[1]) : null;
}

function headOf(html) {
  const head = html.match(/<head>([\s\S]*?)<\/head>/i)?.[1] ?? html;
  const tags = [...head.matchAll(/<(meta|link)\b[^>]*>/gi)].map((m) => m[0]);
  const metaByName = (name) => tags.filter((tag) => /^<meta/i.test(tag) && attribute(tag, "name") === name).map((tag) => attribute(tag, "content"));
  const metaByProperty = (property) => tags.filter((tag) => /^<meta/i.test(tag) && attribute(tag, "property") === property).map((tag) => attribute(tag, "content"));
  const schemaMatch = head.match(/<script id="nexualpha-route-schema" type="application\/ld\+json">([\s\S]*?)<\/script>/);
  return {
    lang: html.match(/<html\b[^>]*\slang="([^"]*)"/)?.[1] ?? null,
    title: decode(head.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? ""),
    description: metaByName("description"),
    robots: metaByName("robots"),
    canonical: tags.filter((tag) => /^<link/i.test(tag) && attribute(tag, "rel") === "canonical").map((tag) => attribute(tag, "href")),
    alternates: tags.filter((tag) => /^<link/i.test(tag) && attribute(tag, "rel") === "alternate" && attribute(tag, "hreflang")).map((tag) => ({ hreflang: attribute(tag, "hreflang"), href: attribute(tag, "href") })),
    marker: metaByName("nexualpha-route-marker"),
    openGraph: Object.fromEntries(["og:type", "og:site_name", "og:title", "og:description", "og:url", "og:image", "og:image:width", "og:image:height", "og:image:alt"].map((p) => [p, metaByProperty(p)])),
    twitter: Object.fromEntries(["twitter:card", "twitter:site", "twitter:title", "twitter:description", "twitter:image"].map((n) => [n, metaByName(n)])),
    trust: Object.fromEntries(["author", "nexualpha-last-reviewed", "nexualpha-methodology", "nexualpha-llms", "nexualpha-regional-funding-dataset"].map((n) => [n, metaByName(n)])),
    schema: schemaMatch ? JSON.parse(schemaMatch[1]) : null,
  };
}

function pageUrl(route, locale) {
  // Locale lives in the path prefix (what window.location.pathname carries, e.g. /zh-hans/exchanges); ?locale= URLs
  // redirect (308) to it.
  return localizedPath(route, locale);
}

test("/api/route-seo returns the same head the SSR page renders for every representative route and locale", async () => {
  let compared = 0;
  for (const route of ROUTES) {
    for (const locale of LOCALES) {
      const target = pageUrl(route, locale);
      const page = await worker.fetch(new Request(`${ORIGIN}${target}`, { headers: { accept: "text/html" } }), env);
      const html = headOf(await page.text());
      const api = await worker.fetch(new Request(`${ORIGIN}${ROUTE_SEO_ENDPOINT}?path=${encodeURIComponent(target)}`, { headers: { accept: "application/json" } }), env);
      assert.equal(api.status, 200, `${target}: api status`);
      assert.equal(api.headers.get("content-type"), "application/json; charset=utf-8");
      assert.equal(api.headers.get("x-robots-tag"), "noindex", "payload endpoint is never indexed");
      const seo = await api.json();
      const label = `${target} (${locale})`;
      assert.equal(page.status, route === "/this-route-does-not-exist" ? 404 : 200, `${label}: the matrix compares real pages, not 404 shells`);
      assert.equal(seo.status, page.status, `${label}: status`);
      assert.equal(api.headers.get("x-nexualpha-route-seo-status"), String(page.status), `${label}: status header`);
      assert.equal(seo.title, html.title, `${label}: title`);
      assert.deepEqual([seo.description], html.description, `${label}: description`);
      assert.deepEqual([seo.canonical], html.canonical, `${label}: canonical`);
      assert.deepEqual([seo.robots], html.robots, `${label}: robots`);
      assert.deepEqual(seo.alternates, html.alternates, `${label}: hreflang list`);
      assert.deepEqual(seo.marker ? [seo.marker] : [], html.marker, `${label}: route marker`);
      assert.equal(seo.htmlLocale, html.lang, `${label}: <html lang>`);
      assert.deepEqual(Object.fromEntries(seo.openGraph.map(([k, v]) => [k, [v]])), html.openGraph, `${label}: open graph`);
      assert.deepEqual(Object.fromEntries(seo.twitter.map(([k, v]) => [k, [v]])), html.twitter, `${label}: twitter`);
      const trust = Object.fromEntries(seo.trust.map(([k, v]) => [k, [v]]));
      for (const name of Object.keys(html.trust)) assert.deepEqual(trust[name] ?? [], html.trust[name], `${label}: ${name}`);
      assert.deepEqual(seo.schema, html.schema, `${label}: JSON-LD`);
      assert.equal("newsArticles" in seo, false, "feed internals never leave the server");
      assert.equal(api.headers.get("cache-control"), page.status === 200 ? "public, max-age=300, stale-while-revalidate=600" : "no-store", `${label}: cache-control`);
      compared += 1;
    }
  }
  assert.equal(compared, ROUTES.length * LOCALES.length);
});

test("/api/route-seo honours an explicit locale, the 404 head is noindex, and off-site paths are refused", async () => {
  const ja = await (await worker.fetch(new Request(`${ORIGIN}${ROUTE_SEO_ENDPOINT}?path=%2Fexchanges&locale=ja`), env)).json();
  const jaPage = headOf(await (await worker.fetch(new Request(`${ORIGIN}/ja/exchanges`, { headers: { accept: "text/html" } }), env)).text());
  assert.equal(ja.title, jaPage.title, "an explicit locale parameter selects the same head as the localized path");
  assert.equal(ja.htmlLocale, "ja");
  const missing = await (await worker.fetch(new Request(`${ORIGIN}${ROUTE_SEO_ENDPOINT}?path=%2Fthis-route-does-not-exist`), env)).json();
  assert.equal(missing.status, 404);
  assert.equal(missing.robots, "noindex,nofollow");
  assert.deepEqual(missing.alternates, []);
  for (const bad of ["https://evil.example/", "//evil.example/x", "/api/v1/venues", "relative"]) {
    const response = await worker.fetch(new Request(`${ORIGIN}${ROUTE_SEO_ENDPOINT}?path=${encodeURIComponent(bad)}`), env);
    assert.equal(response.status, 400, bad);
  }
  assert.equal(routeSeoTargetUrl(new URL(`${ORIGIN}${ROUTE_SEO_ENDPOINT}`)).pathname, "/", "missing path means the home route");
  const head = await worker.fetch(new Request(`${ORIGIN}${ROUTE_SEO_ENDPOINT}?path=%2F`, { method: "HEAD" }), env);
  assert.equal(head.status, 200);
  assert.equal(await head.text(), "");
  const payload = routeSeoPayload({ status: 200, title: "T", description: "D", canonical: "https://nexualpha.com/", locale: "en", schema: [{ "@context": "https://schema.org", "@type": "WebPage" }] }, new URL(`${ORIGIN}/`));
  assert.deepEqual(payload.schema, { "@context": "https://schema.org", "@graph": [{ "@type": "WebPage" }] }, "array schemas collapse into one @graph like the SSR head");
});

// Minimal DOM: enough of document/head/element for the injector's selectors (attribute, prefix, id, tag).
function fakeDocument({ serverMarker = true } = {}) {
  const parseSelector = (selector) => selector.split(",").map((part) => {
    const text = part.trim();
    const tag = text.match(/^[a-z]+/i)?.[0]?.toLowerCase() ?? null;
    const id = text.match(/#([\w-]+)/)?.[1] ?? null;
    const attrs = [...text.matchAll(/\[([\w-]+)(?:(\^?=)"([^"]*)")?\]/g)].map((m) => ({ name: m[1], op: m[2] ?? null, value: m[3] ?? null }));
    return { tag, id, attrs };
  });
  const matches = (element, simple) => (simple.tag === null || element.tagName === simple.tag)
    && (simple.id === null || element.getAttribute("id") === simple.id)
    && simple.attrs.every(({ name, op, value }) => {
      const actual = element.getAttribute(name);
      if (actual === null) return false;
      if (op === "=") return actual === value;
      if (op === "^=") return actual.startsWith(value);
      return true;
    });
  const doc = { title: "Server title", head: null, createElement: null, querySelector: null, querySelectorAll: null };
  const makeElement = (tagName) => {
    const attributes = new Map();
    const element = {
      tagName: tagName.toLowerCase(),
      textContent: "",
      setAttribute: (name, value) => { attributes.set(name, String(value)); },
      getAttribute: (name) => (attributes.has(name) ? attributes.get(name) : null),
      remove: () => { doc.head.children = doc.head.children.filter((child) => child !== element); },
    };
    return element;
  };
  doc.head = { children: [], appendChild: (element) => { doc.head.children.push(element); return element; } };
  doc.createElement = makeElement;
  doc.querySelectorAll = (selector) => {
    const simples = parseSelector(selector);
    return doc.head.children.filter((element) => simples.some((simple) => matches(element, simple)));
  };
  doc.querySelector = (selector) => doc.querySelectorAll(selector)[0] ?? null;
  const seed = (tag, attrs) => { const element = makeElement(tag); for (const [k, v] of Object.entries(attrs)) element.setAttribute(k, v); doc.head.appendChild(element); return element; };
  seed("meta", { name: "description", content: "Server description", "data-nexualpha-route-seo": "description" });
  seed("link", { rel: "canonical", href: "https://nexualpha.com/", "data-nexualpha-route-seo": "canonical" });
  seed("meta", { name: "robots", content: "index,follow", "data-nexualpha-route-seo": "robots" });
  seed("meta", { property: "og:title", content: "Server title", "data-nexualpha-route-seo": "social" });
  seed("link", { rel: "alternate", hreflang: "en", href: "https://nexualpha.com/", "data-nexualpha-route-seo": "alternate" });
  seed("meta", { name: "viewport", content: "width=device-width" });
  if (serverMarker) seed("meta", { name: "nexualpha-route-marker", content: "NEXUALPHA_HOME_ROUTE_V1", "data-nexualpha-route-seo": "marker" });
  return doc;
}

const readHead = (doc) => ({
  title: doc.title,
  description: doc.querySelector('meta[name="description"]')?.getAttribute("content"),
  robots: doc.querySelector('meta[name="robots"]')?.getAttribute("content"),
  canonical: doc.querySelectorAll('link[rel="canonical"]').map((e) => e.getAttribute("href")),
  alternates: doc.querySelectorAll('link[rel="alternate"][hreflang]').map((e) => [e.getAttribute("hreflang"), e.getAttribute("href")]),
  ogTitle: doc.querySelectorAll('meta[property="og:title"]').map((e) => e.getAttribute("content")),
  schema: doc.querySelectorAll("#nexualpha-route-schema").map((e) => JSON.parse(e.textContent)),
  marker: doc.querySelector('meta[name="nexualpha-route-marker"]')?.getAttribute("content"),
  viewport: doc.querySelector('meta[name="viewport"]')?.getAttribute("content"),
});

const payloadFor = (pathname, locale) => ({
  path: pathname, status: 200, marker: "NEXUALPHA_EXCHANGES_ROUTE_V1", locale, htmlLocale: locale,
  title: `${pathname} title (${locale})`, description: `${pathname} description`, canonical: `https://nexualpha.com${pathname}`, robots: "index,follow",
  alternates: [{ hreflang: "en", href: `https://nexualpha.com${pathname}` }, { hreflang: "x-default", href: `https://nexualpha.com${pathname}` }],
  openGraph: [["og:type", "website"], ["og:title", `${pathname} title (${locale})`]],
  twitter: [["twitter:card", "summary_large_image"]],
  trust: [["author", "NexuAlpha Research Desk"], ["nexualpha-last-reviewed", "2026-10-10"]],
  schema: { "@context": "https://schema.org", "@type": "CollectionPage", url: `https://nexualpha.com${pathname}` },
});

test("client injector keeps the server head on first load and applies the fetched head only after navigation", async () => {
  resetRouteSeoClientForTests();
  const doc = fakeDocument();
  const win = { location: { pathname: "/", search: "" } };
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(url);
    const params = new URL(url, "https://nexualpha.com").searchParams;
    return { ok: true, status: 200, json: async () => payloadFor(params.get("path"), params.get("locale")) };
  };
  const before = readHead(doc);
  assert.equal(await syncRouteSeo({ pathname: "/", search: "", locale: "en", doc, win, fetchImpl }), null);
  assert.deepEqual(calls, [], "first pass with an SSR head fetches nothing");
  assert.deepEqual(readHead(doc), before, "first pass leaves every data-nexualpha-route-seo element untouched");

  // Client-side navigation to another route.
  win.location.pathname = "/exchanges";
  const seo = await syncRouteSeo({ pathname: "/exchanges", search: "", locale: "en", doc, win, fetchImpl });
  assert.deepEqual(calls, [routeSeoRequestUrl("/exchanges", "en")]);
  assert.equal(calls[0], `${ROUTE_SEO_ENDPOINT}?path=%2Fexchanges&locale=en`);
  assert.equal(seo.title, "/exchanges title (en)");
  const after = readHead(doc);
  assert.equal(after.title, "/exchanges title (en)");
  assert.equal(after.description, "/exchanges description");
  assert.deepEqual(after.canonical, ["https://nexualpha.com/exchanges"], "exactly one canonical");
  assert.deepEqual(after.alternates, [["en", "https://nexualpha.com/exchanges"], ["x-default", "https://nexualpha.com/exchanges"]]);
  assert.deepEqual(after.ogTitle, ["/exchanges title (en)"], "server og tags are replaced, not duplicated");
  assert.deepEqual(after.schema, [payloadFor("/exchanges", "en").schema]);
  assert.equal(after.marker, "NEXUALPHA_EXCHANGES_ROUTE_V1");
  assert.equal(after.viewport, "width=device-width", "unrelated head tags survive");
  assert.equal(doc.querySelector('meta[name="nexualpha-last-reviewed"]').getAttribute("content"), "2026-10-10");

  // Same route again: in-memory cache, no second request, head unchanged.
  await syncRouteSeo({ pathname: "/exchanges", search: "", locale: "en", doc, win, fetchImpl });
  assert.equal(calls.length, 1, "per-path cache");
  assert.deepEqual(readHead(doc), after);

  // Locale change on the same path is a different key.
  await syncRouteSeo({ pathname: "/exchanges", search: "", locale: "ja", doc, win, fetchImpl });
  assert.equal(calls.length, 2);
  assert.equal(readHead(doc).title, "/exchanges title (ja)");

  // A stale response (location moved on while fetching) is dropped.
  win.location.pathname = "/news";
  await syncRouteSeo({ pathname: "/compare/binance-vs-okx", search: "", locale: "en", doc, win, fetchImpl });
  assert.equal(readHead(doc).title, "/exchanges title (ja)", "late payload for a route we already left is ignored");

  // A failing endpoint keeps the current head.
  await syncRouteSeo({ pathname: "/news", search: "", locale: "en", doc, win, fetchImpl: async () => ({ ok: false, status: 503 }) });
  assert.equal(readHead(doc).title, "/exchanges title (ja)");
  await assert.rejects(fetchRouteSeo("/news", "en", { fetchImpl: async () => ({ ok: false, status: 503 }) }));
});

test("without a server marker the injector fetches on the first pass; a missing article gets the 404 head locally", async () => {
  resetRouteSeoClientForTests();
  const doc = fakeDocument({ serverMarker: false });
  const win = { location: { pathname: "/exchanges/okx", search: "" } };
  let calls = 0;
  const fetchImpl = async () => { calls += 1; return { ok: true, status: 200, json: async () => payloadFor("/exchanges/okx", "en") }; };
  await syncRouteSeo({ pathname: "/exchanges/okx", search: "", locale: "en", doc, win, fetchImpl });
  assert.equal(calls, 1, "no SSR marker: the client owns the head");
  assert.equal(readHead(doc).title, "/exchanges/okx title (en)");

  win.location.pathname = "/news/gone-article";
  assert.equal(applyNotFoundSeo({ locale: "zh-Hans", doc, win }), true);
  const head = readHead(doc);
  assert.equal(head.title, "页面不存在 — NexuAlpha");
  assert.equal(head.robots, "noindex,nofollow");
  assert.deepEqual(head.canonical, ["https://nexualpha.com/news/gone-article"]);
  assert.deepEqual(head.alternates, [], "a 404 head publishes no hreflang");
  assert.deepEqual(head.schema, []);
  assert.equal(head.marker, "NEXUALPHA_NOT_FOUND_ROUTE_V1");
  assert.equal(notFoundRouteSeo({ locale: "en", pathname: "/x" }).title, "Page Not Found — NexuAlpha");
  assert.equal(applyRouteSeo(null, doc), false);
});

test("the browser graph no longer imports seo-injection.js; the SSR/worker side keeps computeRouteSeo", async () => {
  const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
  const newsDetail = await readFile(new URL("../src/components/v3/news/NewsDetailPage.jsx", import.meta.url), "utf8");
  assert.doesNotMatch(app, /seo-injection\.js/);
  assert.doesNotMatch(newsDetail, /seo-injection\.js/);
  assert.match(app, /import \{ syncRouteSeo \} from "\.\/data\/route-seo-client\.js"/);
  assert.match(newsDetail, /import \{ applyNotFoundSeo, syncRouteSeo \} from "\.\.\/\.\.\/\.\.\/data\/route-seo-client\.js"/);
  const vite = await readFile(new URL("../vite.config.mjs", import.meta.url), "utf8");
  assert.match(vite, /seo-injection\.js reached the client bundle/, "vite fails the client build if the tables come back");
  const { computeRouteSeo } = await import("../src/data/seo-injection.js");
  assert.equal(computeRouteSeo({ pathname: "/telegram", locale: "en" }).title, "Telegram Research Bot & Platform Intelligence Hub", "Node consumers (r100 baselines, SEO contracts) still have computeRouteSeo");
});

// Strings that exist only in the route SEO tables (src/data/seo-injection.js) and the worker, never in a UI module.
// (The 404 strings are not usable here: route-seo-client.js carries them for the component-level 404 head.)
const TABLE_ONLY_STRINGS = [
  "Telegram Research Bot & Platform Intelligence Hub",
  "Platform choices for this partner entry.",
  "Continue platform comparisons, fee research, official-source checks and return paths in Telegram.",
];

test("no client chunk carries the seo-injection route tables", async (t) => {
  const assetsDir = path.join(root, "dist", "client", "assets");
  if (!existsSync(assetsDir)) { t.skip("dist/client/assets missing: run the production build first"); return; }
  const names = (await readdir(assetsDir)).filter((name) => name.endsWith(".js"));
  assert.ok(names.length > 10, "built client chunks present");
  assert.equal(names.some((name) => name.startsWith("data-seo-injection-")), false, "no data-seo-injection chunk");
  const offenders = [];
  for (const name of names) {
    const code = await readFile(path.join(assetsDir, name), "utf8");
    for (const needle of TABLE_ONLY_STRINGS) if (code.includes(needle)) offenders.push(`${name}: ${needle}`);
  }
  assert.deepEqual(offenders, [], "route SEO table strings in client chunks");
  const entry = await readFile(path.join(root, "dist", "client", "index.html"), "utf8");
  assert.match(entry, /\/assets\/index-[\w-]+\.js/);
});
