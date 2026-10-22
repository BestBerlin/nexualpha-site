import { decisionContextSearchFromUrl } from '../src/data/decision-passport.js';
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import worker from "../worker/index.js";
import { legacyLocaleRedirect, localizedHref, parsePublicRoute } from "../src/data/locale-routing.js";

const htmlAssets = {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/index.html") {
      return new Response("<!doctype html><html><head><title>NexuAlpha</title></head><body><div id=\"root\"></div></body></html>", {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
    return new Response("missing", { status: 404, headers: { "content-type": "text/plain" } });
  },
};

async function workerHtml(path) {
  return worker.fetch(new Request(`https://nexualpha.com${path}`, { headers: { accept: "text/html" } }), { ASSETS: htmlAssets });
}

test("English selector navigation from Spanish/MX compare returns the clean English canonical URL", () => {
  const href = localizedHref("/es/compare/binance-vs-okx?market=MX&product=spot", { locale: "en" });
  const url = new URL(href, "https://nexualpha.com");

  assert.equal(url.pathname, "/compare/binance-vs-okx");
  assert.equal(new URLSearchParams(decisionContextSearchFromUrl(url)).get("market"), "MX");
  assert.equal(new URLSearchParams(decisionContextSearchFromUrl(url)).get("product"), "spot");
  assert.equal(url.searchParams.get("locale"), null);
  assert.equal(parsePublicRoute(url.pathname, url.searchParams).locale, "en");
  assert.equal(parsePublicRoute(url.pathname, url.searchParams).localeSource, "default");
});

test("App readLocale prioritizes clean English generic routes before market fallback", async () => {
  const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
  const defaultRule = app.indexOf('publicRoute.localeSource === "default" && isGenericEnglishDefaultRoute(publicRoute.contentPathname)');
  const marketPolicy = app.indexOf("const policyLocale = resolveMarketLocale");

  assert.notEqual(defaultRule, -1, "generic English default rule is present");
  assert.notEqual(marketPolicy, -1, "market policy fallback is still present");
  assert.ok(defaultRule < marketPolicy, "generic root routes remain English before market fallback");
  assert.match(app, /GENERIC_ENGLISH_DEFAULT_PREFIXES = \[[^\]]*"\/exchanges", "\/compare", "\/topics", "\/factbook", "\/activities", "\/news", "\/markets"[^\]]*\]/);
});

test("country-owned routes still use regional locale authority", () => {
  const mx = parsePublicRoute("/mx", new URLSearchParams("market=MX&product=spot"));
  const br = parsePublicRoute("/br", new URLSearchParams("market=BR&product=spot"));
  assert.equal(mx.locale, "es");
  assert.equal(mx.localeSource, "market");
  assert.equal(br.locale, "pt-BR");
  assert.equal(br.localeSource, "market");
});

test("explicit query and path locale still override generic English defaults", () => {
  const explicit = parsePublicRoute("/compare/binance-vs-okx", new URLSearchParams("locale=ja&market=MX&product=spot"));
  const prefixed = parsePublicRoute("/es/compare/binance-vs-okx", new URLSearchParams("market=MX&product=spot"));
  assert.equal(explicit.locale, "ja");
  assert.equal(explicit.localeSource, "query");
  assert.equal(prefixed.locale, "es");
  assert.equal(prefixed.localeSource, "path");
});

test("legacy locale redirects clean explicit English query once and then stop", () => {
  const first = legacyLocaleRedirect("https://nexualpha.com/compare/binance-vs-okx?locale=en&market=MX&product=spot");
  assert.equal(first, "/compare/binance-vs-okx?market=MX&product=spot");
  assert.equal(legacyLocaleRedirect(`https://nexualpha.com${first}`), null);
});

test("prefixed locale paths keep path authority and do not multi-hop", () => {
  const first = legacyLocaleRedirect("https://nexualpha.com/es/compare/binance-vs-okx?locale=en&market=MX&product=spot");
  assert.equal(first, "/es/compare/binance-vs-okx?market=MX&product=spot");
  assert.equal(legacyLocaleRedirect(`https://nexualpha.com${first}`), null);
  const firstRoute = parsePublicRoute(new URL(first, "https://nexualpha.com").pathname, new URL(first, "https://nexualpha.com").searchParams);
  assert.equal(firstRoute.locale, "es");
});

test("worker cleans explicit English query once and serves the clean generic English route", async () => {
  const first = await workerHtml("/compare/binance-vs-okx?locale=en&market=MX&product=spot");
  assert.equal(first.status, 308);
  assert.equal(first.headers.get("location"), "https://nexualpha.com/compare/binance-vs-okx?market=MX&product=spot");

  const second = await workerHtml("/compare/binance-vs-okx?market=MX&product=spot");
  assert.equal(second.status, 200);
  assert.equal(second.headers.get("location"), null);
});

test("worker path-locale cleanup remains a single redirect and then serves the prefixed page", async () => {
  const first = await workerHtml("/es/compare/binance-vs-okx?locale=en&market=MX&product=spot");
  assert.equal(first.status, 308);
  assert.equal(first.headers.get("location"), "https://nexualpha.com/es/compare/binance-vs-okx?market=MX&product=spot");

  const second = await workerHtml("/es/compare/binance-vs-okx?market=MX&product=spot");
  assert.equal(second.status, 200);
  assert.equal(second.headers.get("location"), null);
});
