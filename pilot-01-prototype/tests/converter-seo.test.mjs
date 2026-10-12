import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import worker from "../worker/index.js";
import { converterCoin, converterPath } from "../src/data/converter.js";
import { converterRouteSeo, converterSitemapEntries } from "../src/data/converter-seo.js";
import { computeRouteSeo } from "../src/data/seo-injection.js";
import { localizedPath } from "../src/data/locale-routing.js";
import { buildConvertSitemap, buildSplitSitemaps } from "../scripts/generate-prerender-manifest.mjs";
import { createSsrHarness, SHELL_HTML, hydrateInJsdom, hydrationErrors, prerenderState } from "./helpers/ssr-hydration-harness.mjs";

const assets = { fetch: async (request) => {
  const pathname = new URL(request.url).pathname;
  if (pathname === "/prerender-manifest.json") return Response.json({ version: "nexualpha-prerender-v1", routes: {} });
  if (pathname === "/index.html") return new Response(SHELL_HTML, { headers: { "content-type": "text/html; charset=utf-8" } });
  if (pathname === "/sitemap-convert.xml") return new Response(buildConvertSitemap().xml, { headers: { "content-type": "application/xml" } });
  return new Response("missing", { status: 404 });
} };

const fx = Object.freeze({
  generatedAt: "2026-10-12T00:00:00.000Z",
  base: "USD",
  rates: { USD: 1, EUR: 0.92, BRL: 5.4, TRY: 42, IDR: 16600, VND: 26300, MXN: 18.4, JPY: 152, KRW: 1430, CNY: 7.1, GBP: 0.78, INR: 88 },
});

let harness;
test.before(async () => { harness = await createSsrHarness(); });
test.after(async () => { await harness?.close(); });
const env = () => ({ ASSETS: assets, NEWS_SSR_RENDER: (href, options) => harness.render(href, options), FX_SNAPSHOT_READ: async () => fx });
const fetchPage = (path, e = env()) => worker.fetch(new Request(`https://nexualpha.com${path}`, { headers: { accept: "text/html" } }), e);
const robots = (html) => html.match(/<meta name="robots" content="([^"]+)"/)?.[1];
const ldJson = (html) => [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].flatMap((m) => {
  const value = JSON.parse(m[1]);
  return Array.isArray(value) ? value : (value["@graph"] || [value]);
});

test("converter SEO helper gates indexable markets and emits FAQ/HowTo/WebPage schemas", () => {
  const btc = converterCoin("btc");
  const seo = converterRouteSeo("/convert/btc-to-usd", "en", { urlFor: (path) => `https://nexualpha.com${path}`, fx });
  assert.equal(seo.status, 200);
  assert.equal(seo.indexable, true);
  assert.ok(seo.title.length <= 60);
  assert.deepEqual(seo.alternatesLocales, ["en", "es", "fr", "de"]);
  assert.ok(seo.schemas.some((schema) => schema["@type"] === "FAQPage"));
  assert.ok(seo.schemas.some((schema) => schema["@type"] === "WebPage" && schema.mainEntity?.["@type"] === "ExchangeRateSpecification"));
  assert.equal(converterRouteSeo(converterPath(btc, "TRY"), "en", { urlFor: (path) => path }).indexable, false);
  assert.equal(converterRouteSeo(converterPath(btc, "INR"), "en", { urlFor: (path) => path }).indexable, false);
  assert.equal(converterRouteSeo("/convert/notreal-to-usd", "en", { urlFor: (path) => path }).status, 404);
  const brl = converterRouteSeo("/convert/btc-to-brl", "pt-BR", { urlFor: (path) => path, fx });
  assert.ok(brl.schemas.some((schema) => schema["@type"] === "HowTo"), "BRL has a reviewed funding-guide HowTo");
});

test("worker head, /api/route-seo and runtime SSR agree for converter routes", async () => {
  const html = await (await fetchPage("/pt-br/convert/btc-to-brl")).text();
  assert.equal(robots(html), "index,follow");
  assert.match(html, /<main class="nxconvert"/);
  assert.equal(prerenderState(html).fx.generatedAt, fx.generatedAt);
  assert.match(html, /1 BTC = /);
  const graph = ldJson(html);
  assert.ok(graph.some((schema) => schema["@type"] === "FAQPage"));
  assert.ok(graph.some((schema) => schema["@type"] === "HowTo"));
  const api = await (await worker.fetch(new Request("https://nexualpha.com/api/route-seo?path=%2Fpt-br%2Fconvert%2Fbtc-to-brl"), env())).json();
  assert.equal(api.status, 200);
  assert.equal(api.robots, "index,follow");
  assert.equal(api.marker, "NEXUALPHA_CONVERTER_ROUTE_V1");
  assert.equal(api.canonical, "https://nexualpha.com/pt-br/convert/btc-to-brl");
  const client = computeRouteSeo({ url: "/pt-br/convert/btc-to-brl" });
  assert.equal(client.robots, "index,follow");
  const noindex = await (await fetchPage("/convert/btc-to-try")).text();
  assert.equal(robots(noindex), "noindex,follow");
});

test("converter hydration keeps the server-rendered FX and coin snapshot state", async () => {
  const html = await (await fetchPage("/convert/btc-to-usd")).text();
  const { errors, state } = await hydrateInJsdom(harness.vite, html, "https://nexualpha.com/convert/btc-to-usd");
  assert.deepEqual(hydrationErrors(errors), [], errors.join("\n"));
  assert.equal(state.fx.generatedAt, fx.generatedAt);
  assert.ok(Array.isArray(state.coins.rows));
});

test("sitemap-convert.xml lists only indexable converter editions and is advertised", async () => {
  const entries = converterSitemapEntries({ urlFor: (pathname, locale) => `https://nexualpha.com${localizedPath(pathname, locale)}` });
  assert.ok(entries.length > 0);
  assert.ok(entries.some((entry) => entry.loc === "https://nexualpha.com/convert/btc-to-usd"));
  assert.ok(entries.some((entry) => entry.loc === "https://nexualpha.com/pt-br/convert/btc-to-brl"));
  assert.ok(entries.every((entry) => !entry.loc.includes("/convert/btc-to-inr")));
  const sitemap = buildConvertSitemap();
  assert.equal(sitemap.count, entries.length);
  assert.match(sitemap.xml, /<loc>https:\/\/nexualpha\.com\/convert\/btc-to-usd<\/loc>/);
  assert.match(buildSplitSitemaps([], []).index, /<loc>https:\/\/nexualpha\.com\/sitemap-convert\.xml<\/loc>/);
  assert.match(await readFile(new URL("../public/robots.txt", import.meta.url), "utf8"), /Sitemap: https:\/\/nexualpha\.com\/sitemap-convert\.xml/);
  const response = await worker.fetch(new Request("https://nexualpha.com/sitemap-convert.xml"), env());
  assert.equal(response.status, 200);
});
