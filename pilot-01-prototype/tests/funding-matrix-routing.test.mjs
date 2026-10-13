import assert from "node:assert/strict";
import React from "react";
import test from "node:test";
import { createRequire } from "node:module";
import { JSDOM } from "jsdom";

import worker, { renderLocaleSitemap, routeMetadata } from "../worker/index.js";
import { buildHydrationBootstrap } from "../src/data/hydration-bootstrap.js";
import { buildFundingMatrix, normalizeFundingQuote } from "../src/data/funding-matrix.js";
import { localizedPath, parsePublicRoute } from "../src/data/locale-routing.js";
import { ROUTE_MODULE_PATHS, modulePathsForRoute } from "../src/data/route-module-cache.js";
import { SHELL_HTML, createSsrHarness, hydrationErrors, prerenderState, rootInnerHtml } from "./helpers/ssr-hydration-harness.mjs";

const require = createRequire(import.meta.url);
const PAGE_PATH = "/funding-rates/matrix";
const PAGE_URL = `https://nexualpha.com${PAGE_PATH}`;
const ZH_PATH = "/zh-hans/funding-rates/matrix";
const ZH_URL = `https://nexualpha.com${ZH_PATH}`;
function sampleFeed() {
  const now = Date.now();
  const generatedAt = new Date(now).toISOString();
  const next8h = new Date(now + 8 * 3_600_000).toISOString();
  const next1h = new Date(now + 3_600_000).toISOString();
  const quotes = [
    { symbol: "BTC", venue: "binance", rate: 0.0001, intervalHours: 8, nextFundingAt: next8h, readAt: generatedAt },
    { symbol: "BTC", venue: "okx", rate: -0.00002, intervalHours: 8, nextFundingAt: next8h, readAt: generatedAt },
    { symbol: "BTC", venue: "hyperliquid", rate: 0.0000125, intervalHours: 1, nextFundingAt: next1h, readAt: generatedAt },
    { symbol: "ETH", venue: "binance", rate: 0.00003, intervalHours: 8, nextFundingAt: next8h, readAt: generatedAt },
    { symbol: "ETH", venue: "okx", rate: 0.00001, intervalHours: 8, nextFundingAt: next8h, readAt: generatedAt },
  ].map(normalizeFundingQuote);
  return buildFundingMatrix(quotes, { generatedAt });
}

const assets = { fetch: async (request) => {
  const pathname = new URL(request.url).pathname;
  if (pathname === "/index.html") return new Response(SHELL_HTML, { headers: { "content-type": "text/html; charset=utf-8" } });
  if (pathname === "/prerender-manifest.json") return Response.json({ version: "nexualpha-prerender-v1", routes: {
    [`${PAGE_PATH}|en`]: { pathname: PAGE_PATH, locale: "en", html: "<main><h1>Prerendered fallback matrix</h1></main>" },
    [`${PAGE_PATH}|zh-Hans`]: { pathname: PAGE_PATH, locale: "zh-Hans", html: "<main><h1>预渲染备用矩阵</h1></main>" },
  } });
  return new Response("missing", { status: 404 });
} };

function graph(value) {
  return Array.isArray(value) ? value : value ? [value] : [];
}

function findSchema(schemas, type) {
  return graph(schemas).find((schema) => schema?.["@type"] === type);
}

async function hydrateFundingMatrix(vite, html, pageUrl) {
  const state = prerenderState(html);
  const bootstrap = buildHydrationBootstrap({ browserUrl: pageUrl, prerenderState: state, hasServerHtml: true, clientRender: false });
  const dom = new JSDOM(html, { url: bootstrap.initialUrl, pretendToBeVisual: true });
  const { window } = dom;
  const stubs = {
    matchMedia: () => ({ matches: false, media: "", onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false }),
    IntersectionObserver: class { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } },
    ResizeObserver: class { observe() {} unobserve() {} disconnect() {} },
    scrollTo() {},
    fetch: async (input) => {
      const url = new URL(typeof input === "string" ? input : input?.url || "/", pageUrl);
      return Response.json(url.pathname === "/intel/funding-matrix.json" ? state?.fundingMatrix || {} : {});
    },
  };
  for (const [key, value] of Object.entries(stubs)) if (!window[key]) window[key] = value;
  const globals = ["window", "document", "navigator", "location", "history", "localStorage", "sessionStorage", "HTMLElement", "Element", "Node", "Text", "Event", "CustomEvent", "MutationObserver", "getComputedStyle", "requestAnimationFrame", "cancelAnimationFrame", "matchMedia", "IntersectionObserver", "ResizeObserver", "scrollTo", "fetch", "CSS"];
  const saved = new Map();
  for (const key of globals) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { value: window[key] ?? stubs[key], configurable: true, writable: true });
  }
  const originalError = console.error;
  const errors = [];
  console.error = (...args) => { errors.push(args.map((arg) => (arg instanceof Error ? arg.message : String(arg))).join(" ")); };
  try {
    const { hydrateRoot } = require("react-dom/client");
    const { App } = await vite.ssrLoadModule("/src/App.jsx");
    const root = window.document.getElementById("root");
    const reactRoot = hydrateRoot(root, React.createElement(React.StrictMode, null, React.createElement(App, {
      initialUrl: bootstrap.initialUrl,
      initialLocale: undefined,
      initialCompareSelection: ["binance", "okx"],
      initialFundingMatrix: state?.fundingMatrix,
    })), { onRecoverableError: (error) => errors.push(`recoverable: ${error?.message || error}`) });
    await new Promise((resolve) => setTimeout(resolve, 200));
    const text = root.textContent;
    reactRoot.unmount();
    await new Promise((resolve) => setTimeout(resolve, 20));
    return { errors, text, state };
  } finally {
    console.error = originalError;
    for (const [key, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
    window.close();
  }
}

test("funding matrix route is locale-routable, indexable, schematized and listed in the locale sitemap", async () => {
  assert.equal(localizedPath(PAGE_PATH, "en"), PAGE_PATH);
  assert.equal(localizedPath(PAGE_PATH, "zh-Hans"), ZH_PATH);
  assert.deepEqual(parsePublicRoute(ZH_PATH, new URLSearchParams()), {
    publicPathname: ZH_PATH,
    contentPathname: PAGE_PATH,
    locale: "zh-Hans",
    localeSource: "path",
    isCountryRoute: false,
    canonicalPathname: ZH_PATH,
  });

  for (const [url, locale] of [[PAGE_URL, "en"], [ZH_URL, "zh-Hans"]]) {
    const metadata = await routeMetadata(new URL(url), {});
    assert.equal(metadata.status, 200, url);
    assert.equal(metadata.locale, locale, url);
    assert.equal(metadata.robots, "index,follow", url);
    assert.equal(metadata.canonical, url, url);
    assert.ok(metadata.alternates.some((item) => item.hreflang === "x-default" && item.href === PAGE_URL), url);
    assert.ok(metadata.alternates.some((item) => item.hreflang === locale && item.href === url), url);
    const dataset = findSchema(metadata.schema, "Dataset");
    const app = findSchema(metadata.schema, "WebApplication");
    assert.ok(dataset, `${url}: Dataset schema`);
    assert.ok(app, `${url}: WebApplication schema`);
    assert.equal(dataset.url, url);
    assert.equal(app.url, url);
    assert.match(JSON.stringify(dataset), /funding-matrix|funding rates|funding/i, `${url}: Dataset names the funding matrix`);
  }

  const sitemap = await renderLocaleSitemap({});
  assert.match(sitemap, new RegExp(`<loc>${PAGE_URL}</loc>`));
  assert.match(sitemap, new RegExp(`<loc>${ZH_URL}</loc>`));
});

test("worker request-time SSR forwards FUNDING_MATRIX_READ output into HTML state and hydration", async () => {
  const harness = await createSsrHarness();
  const calls = [];
  const feed = sampleFeed();
  try {
    const env = {
      ASSETS: assets,
      FUNDING_MATRIX_READ: async () => feed,
      NEWS_SSR_RENDER: async (href, options) => {
        calls.push({ href, options });
        return harness.render(href, options);
      },
    };
    const response = await worker.fetch(new Request(ZH_URL, { headers: { accept: "text/html" } }), env);
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.equal(calls.length, 1, "matrix route renders once at request time");
    assert.equal(calls[0].href, ZH_URL);
    assert.deepEqual(calls[0].options.fundingMatrix, feed);
    assert.doesNotMatch(html, /预渲染备用矩阵|Prerendered fallback matrix/);
    assert.match(html, /data-testid="funding-matrix-page"/);
    assert.match(html, /BTC/);
    assert.match(html, /Binance|OKX|Hyperliquid/);

    const state = prerenderState(html);
    assert.equal(state.pathname, PAGE_PATH);
    assert.equal(state.locale, "zh-Hans");
    assert.deepEqual(state.fundingMatrix, feed);
    assert.equal(await harness.render(ZH_URL, { fundingMatrix: state.fundingMatrix }), rootInnerHtml(html));

    const hydrated = await hydrateFundingMatrix(harness.vite, html, ZH_URL);
    assert.deepEqual(hydrationErrors(hydrated.errors), [], `hydration errors: ${hydrated.errors.join("\n")}`);
    assert.match(hydrated.text, /BTC/);
  } finally {
    await harness.close();
  }
});

test("/intel/funding-matrix.json fails closed when the runtime feed is unavailable", async () => {
  const response = await worker.fetch(new Request("https://nexualpha.com/intel/funding-matrix.json"), {
    FUNDING_MATRIX_READ: async () => { throw new Error("collector unavailable"); },
  });
  const body = await response.text();
  assert.equal(response.status, 503);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(JSON.parse(body), {});
  assert.doesNotMatch(body, /BTC|ETH|0\.000|rate|annualized/i, "failure response must not invent market data");
});

test("funding matrix remains a narrow lazy route module", () => {
  assert.equal(ROUTE_MODULE_PATHS.fundingMatrix, "./components/data/FundingMatrixPage.jsx");
  assert.deepEqual(modulePathsForRoute({ name: "fundingMatrix" }, PAGE_URL), [ROUTE_MODULE_PATHS.fundingMatrix]);
  assert.notEqual(ROUTE_MODULE_PATHS.fundingMatrix, ROUTE_MODULE_PATHS.fundingRates);
});
