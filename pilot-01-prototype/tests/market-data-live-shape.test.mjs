// Regression (2026-10-13): canonical /liquidations, /funding-rates and /liquidations/heatmap served the build-time
// prerender (no feed: "temporarily unavailable" / "No observed liquidations") because the routes are in the prerender
// manifest and the worker answered from it before the request-time data SSR ran. Only junk-query URLs (manifest miss)
// reached the live feed. Fixtures are trimmed copies of the live public feeds after the v2 collector (PR #179/#196):
// tests/fixtures/market-data/market-events.live-v2-2026-10-13.json and funding-rates.live-2026-10-13.json.
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { access, mkdtemp, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import worker from "../worker/index.js";
import { compactMarketEvents, readFunding, readHistory, readLiquidations } from "../src/data/market-data-pages.js";
import { FUNDING_SYMBOLS, FUNDING_VENUES, fundingTable } from "../src/data/funding-rates.js";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const fixture = (name) => readFileSync(new URL(`./fixtures/market-data/${name}`, import.meta.url), "utf8");
const liveFeed = JSON.parse(fixture("market-events.live-v2-2026-10-13.json"));
const liveFunding = JSON.parse(fixture("funding-rates.live-2026-10-13.json"));
const STALE = '<main class="nxd"><header class="nxd-hero">No observed liquidations</header><section data-testid="data-unavailable"><h2>Live data is temporarily unavailable</h2></section></main>';

test("live v2 collector feed: liquidation windows, coverage, funding and history all read", () => {
  const liq = readLiquidations(liveFeed);
  assert.ok(liq, "readLiquidations accepts the v2 feed");
  assert.equal(liq.windows.h24.totalUsd, 455972370);
  assert.equal(liq.windows.h24.longUsd + liq.windows.h24.shortUsd, 455972370);
  assert.ok(liq.windows.h1 && liq.windows.h4);
  assert.deepEqual(liq.coverage.venues, ["Binance", "OKX"]);
  assert.equal(liq.sourceLine, "Binance + OKX observed liquidations");
  const funding = readFunding(liveFeed);
  assert.ok(funding && funding.rows.length >= 10, "funding object with rows");
  assert.equal(funding.rows[0].symbol, "BTC");
  assert.equal(typeof funding.rows[0].binanceRate, "number");
  assert.ok(readHistory(liveFeed));
});

test("hydration payload keeps the timeline only for pages that draw it", () => {
  const full = compactMarketEvents(liveFeed);
  assert.ok(full.liquidations.timeline?.h24?.buckets?.length, "liquidations and heatmap keep the timeline");
  const lean = compactMarketEvents(liveFeed, { timeline: false });
  assert.ok(!("timeline" in lean.liquidations));
  assert.equal(lean.liquidations.h24.totalUsd, 455972370);
  assert.ok(readLiquidations(lean) && readFunding(lean), "the lean payload still renders /funding-rates");
  assert.ok(!("headlines" in full) && !("events" in full));
});

function manifestAssets() {
  const shell = '<!doctype html><html lang="en"><head><title>Base</title><meta name="description" content="Base"></head><body><div id="root"></div></body></html>';
  const routes = {};
  for (const [p, slug] of [["/liquidations", "liquidations"], ["/funding-rates", "funding-rates"], ["/liquidations/heatmap", "liquidations/heatmap"]]) {
    for (const locale of ["en", "zh-Hans"]) routes[`${p}|${locale}`] = { pathname: p, locale, asset: `/prerender/${locale}/${slug}.json` };
  }
  return { async fetch(request) {
    const pathname = new URL(request.url).pathname;
    if (pathname === "/index.html") return new Response(shell, { headers: { "content-type": "text/html" } });
    if (pathname === "/prerender-manifest.json") return Response.json({ routes });
    if (pathname.startsWith("/prerender/")) return Response.json({ html: STALE });
    return new Response("missing", { status: 404 });
  } };
}

const stateOf = (html) => JSON.parse(html.match(/<script type="application\/json" id="nexualpha-prerender-state">([\s\S]*?)<\/script>/)[1]);

test("canonical data-page URLs render from the live feed even when the manifest carries a feedless prerender", async () => {
  const calls = [];
  const env = {
    ASSETS: manifestAssets(),
    MARKET_EVENTS_READ: async () => liveFeed,
    NEWS_SSR_RENDER: async (href, options) => { calls.push({ href, options }); return `<main class="nxd"><header class="nxd-hero">live ${options.marketEvents?.liquidations?.h24?.totalUsd}</header></main>`; },
  };
  for (const url of ["https://nexualpha.com/liquidations", "https://nexualpha.com/funding-rates", "https://nexualpha.com/liquidations/heatmap",
    "https://nexualpha.com/zh-hans/liquidations", "https://nexualpha.com/zh-hans/funding-rates", "https://nexualpha.com/zh-hans/liquidations/heatmap"]) {
    const response = await worker.fetch(new Request(url, { headers: { accept: "text/html" } }), env);
    const html = await response.text();
    assert.equal(response.status, 200, url);
    assert.doesNotMatch(html, /temporarily unavailable|No observed liquidations/, url);
    assert.match(html, /live 455972370/, url);
    const state = stateOf(html);
    assert.equal(state.marketEvents.liquidations.h24.totalUsd, 455972370, url);
    assert.equal("timeline" in state.marketEvents.liquidations, !url.endsWith("/funding-rates"), `${url} timeline only where drawn`);
  }
  assert.equal(calls.length, 6);

  // Assets-only host (no renderer): the build-time prerender is still served.
  const shellOnly = await (await worker.fetch(new Request("https://nexualpha.com/liquidations", { headers: { accept: "text/html" } }), { ASSETS: manifestAssets() })).text();
  assert.match(shellOnly, /temporarily unavailable/);
});

test("data page components render real numbers from the live feed (no unavailable state)", async () => {
  const tempDir = await mkdtemp(path.join(projectRoot, "tests/.tmp-live-shape-"));
  try {
    const entryPath = path.join(tempDir, "entry.mjs");
    const bundlePath = path.join(tempDir, "bundle.cjs");
    await writeFile(path.join(tempDir, "feed.json"), JSON.stringify(compactMarketEvents(liveFeed)));
    await writeFile(entryPath, `
      import React from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { LiquidationsPage } from "../../src/components/data/LiquidationsPage.jsx";
      import { FundingRatesPage } from "../../src/components/data/FundingRatesPage.jsx";
      import { LiquidationHeatmapPage } from "../../src/components/data/LiquidationHeatmapPage.jsx";
      import feed from "./feed.json";
      const out = {};
      for (const locale of ["en", "zh-Hans"]) out[locale] = {
        liquidations: renderToStaticMarkup(React.createElement(LiquidationsPage, { locale, initialFeed: feed })),
        funding: renderToStaticMarkup(React.createElement(FundingRatesPage, { locale, initialFeed: feed })),
        heatmap: renderToStaticMarkup(React.createElement(LiquidationHeatmapPage, { locale, initialFeed: feed })),
      };
      console.log(JSON.stringify(out));
    `);
    const esbuildBin = path.join(projectRoot, "node_modules/.bin/esbuild");
    await access(esbuildBin);
    execFileSync(esbuildBin, [entryPath, "--bundle", "--platform=node", "--format=cjs", `--outfile=${bundlePath}`, "--loader:.css=empty", "--log-level=warning"], { cwd: projectRoot, stdio: "pipe" });
    const out = JSON.parse(execFileSync("node", [bundlePath], { cwd: projectRoot, encoding: "utf8" }));
    for (const locale of ["en", "zh-Hans"]) {
      const { liquidations, funding, heatmap } = out[locale];
      assert.match(liquidations, /\$456M/, `${locale} liquidations 24h total`);
      assert.doesNotMatch(liquidations, /data-testid="data-unavailable"|No observed liquidations/, `${locale} liquidations`);
      assert.match(liquidations, /Binance \+ OKX observed liquidations/, locale);
      assert.doesNotMatch(funding, /data-testid="data-unavailable"/, `${locale} funding`);
      assert.match(funding, /\+0\.0034%/, `${locale} BTC Binance funding rate`);
      assert.match(heatmap, /data-testid="liquidation-timeline"/, `${locale} heatmap timeline`);
    }
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("home funding board reads the live six-venue funding feed for every symbol tab", () => {
  assert.deepEqual(Object.keys(liveFunding.venues).sort(), [...FUNDING_VENUES].sort());
  for (const symbol of FUNDING_SYMBOLS) {
    const rows = fundingTable(liveFunding, symbol);
    assert.equal(rows.length, FUNDING_VENUES.length, `${symbol}: one row per venue`);
    for (const row of rows) {
      assert.equal(typeof row.rate, "number", `${symbol} ${row.venue} rate`);
      assert.ok(Number.isFinite(row.apr), `${symbol} ${row.venue} apr`);
    }
  }
});
