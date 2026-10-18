// Linkable data assets + /press (SEO W43, 2026-10-18): builders, CSV/SVG routes, head (Dataset JSON-LD, hreflang,
// robots), sitemap entries, SSR + hydration, and the links from /about and the footer.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import worker from "../worker/index.js";
import {
  DATA_ASSET_LICENSE_URL, FEE_INDEX_VENUES, dataAssetCitation, dataAssetEmbedSnippets, feeIndexCsv, feeIndexRows, feeIndexStats, feeIndexSvg,
  readWhaleReport, tickerCoverage, tokenizedTrackerCsv, tokenizedTrackerRows, tokenizedTrackerSvg, whaleReportCsv, whaleReportSvg,
} from "../src/data/data-assets.js";
import { DATA_ASSET_INDEX_LOCALES, DATA_ASSET_ROUTE_PATHS, isDataAssetRoute, parseDataAssetFilePath, pressNavLabel } from "../src/data/data-assets-routes.js";
import { dataAssetRouteSeo, dataAssetView, dataAssetsSitemapEntries, datasetSchema } from "../src/data/data-assets-seo.js";
import { PRESS_BOILERPLATE, dataAssetsCopy } from "../src/data/data-assets-copy.js";
import { feeFact } from "../src/data/exchange-facts.js";
import { TS_EXCHANGES } from "../src/data/tokenized-stocks-facts.js";
import { ORGANIZATION_ID } from "../src/data/brand-entity.js";
import { localizedPath } from "../src/data/locale-routing.js";
import { createSsrHarness, SHELL_HTML, hydrateInJsdom, hydrationErrors, prerenderState, h1Texts } from "./helpers/ssr-hydration-harness.mjs";

const NOW = Date.parse("2026-10-18T14:00:00Z");
const whaleFixture = () => ({
  kind: "whales", status: "ok", dataUpdatedAt: new Date(NOW).toISOString(),
  signals: [
    { id: "a", signalType: "accumulation", coin: "ETH", side: "long", market: "perp", totalUsd: 5_000_000, walletsCount: 1, address: "0x1111111111111111111111111111111111111111", explorerUrl: "https://app.hyperliquid.xyz/explorer/address/0x1111111111111111111111111111111111111111", time: new Date(NOW - 2 * 864e5).toISOString(), fills: 10, days: 2, period: "2d" },
    { id: "b", signalType: "distribution", coin: "BTC", side: "long", market: "perp", totalUsd: 3_000_000, walletsCount: 1, time: new Date(NOW - 864e5).toISOString() },
    { id: "c", signalType: "increase_short", coin: "BTC", side: "short", market: "perp", totalUsd: 2_000_000, time: new Date(NOW - 3600e3).toISOString() },
    { id: "d", signalType: "reduce_short", coin: "ETH", side: "short", market: "perp", totalUsd: 1_000_000, time: new Date(NOW - 3600e3).toISOString() },
    { id: "e", signalType: "coordinated-short", coin: "ETH", side: "short", totalUsd: 9_000_000, walletsCount: 3, time: new Date(NOW - 3600e3).toISOString() },
    { id: "f", signalType: "accumulation", coin: "SOL", side: "spot", market: "spot", totalUsd: 7_000_000, time: new Date(NOW - 9 * 864e5).toISOString() },
    { id: "a", signalType: "accumulation", coin: "ETH", side: "long", market: "perp", totalUsd: 5_000_000, time: new Date(NOW - 2 * 864e5).toISOString() },
  ],
});

// ------------------------------------------------------------------ builders
test("fee index: owner order, official figures only, one source + review date per checked row", () => {
  const rows = feeIndexRows();
  assert.deepEqual(rows.slice(0, 3).map((r) => r.slug), ["bitget", "okx", "binance"]);
  assert.equal(rows.length, FEE_INDEX_VENUES.length);
  for (const r of rows) {
    for (const product of ["spot", "perp"]) {
      const fact = feeFact(r.slug, product);
      if (fact.state === "checked") { assert.equal(r[product].maker, fact.maker); assert.equal(r[product].taker, fact.taker); }
      else { assert.equal(r[product].maker, null, `${r.slug} ${product} unchecked stays empty`); }
    }
    if (r.reviewedOn) assert.match(r.sourceUrl, /^https:\/\//);
  }
  assert.ok(!feeIndexRows({ locale: "tr" }).some((r) => r.slug === "bitget"), "Türkiye: no Bitget");
  const s = feeIndexStats(rows);
  assert.equal(s.medianSpotTaker, 0.1);
  assert.equal(s.medianPerpTaker, 0.05);
  const csv = feeIndexCsv(rows).trim().split("\r\n");
  assert.equal(csv.length, rows.length + 1);
  assert.match(csv[0], /^edition,exchange,slug,venue_type,spot_maker_pct,spot_taker_pct/);
  assert.ok(csv.slice(1).every((line) => line.includes("CC BY 4.0") && line.includes("https://nexualpha.com/data/exchange-fee-index")));
  assert.match(csv.find((l) => l.includes(",coinbase,")), /not-checked/);
});

test("tokenized tracker: rows mirror the sourced facts; regional claim in the FAQ holds", () => {
  const rows = tokenizedTrackerRows();
  assert.equal(rows[0].slug, "bitget");
  assert.ok(rows.every((r) => r.sourceUrl?.startsWith("https://") && /^\d{4}-\d{2}-\d{2}$/.test(r.sourceDate)), "every row has a dated official source");
  assert.ok(!tokenizedTrackerRows({ locale: "tr" }).some((r) => r.slug === "bitget"));
  for (const ex of TS_EXCHANGES) if (ex.excluded) assert.ok(ex.excluded.v.includes("US"), `${ex.slug}: FAQ says every stated restriction excludes the US`);
  const coverage = tickerCoverage(rows);
  assert.ok(coverage[0].count >= coverage[1].count);
  const csv = tokenizedTrackerCsv(rows).trim().split("\r\n");
  assert.equal(csv.length, rows.length + 1);
  assert.match(csv[0], /token_family,tickers_named_in_source/);
});

test("whale report: 7-day window, de-duplicated, cluster rows counted not summed", () => {
  const r = readWhaleReport(whaleFixture());
  assert.equal(r.signals.length, 4, "SOL is older than 7 days; duplicate id and the cluster are dropped");
  assert.equal(r.clusters, 1);
  assert.equal(r.totals.accumulation.usd, 5_000_000);
  assert.equal(r.totals.distribution.usd, 3_000_000);
  assert.equal(r.totals.shortAdd.usd, 2_000_000);
  assert.equal(r.totals.shortCover.usd, 1_000_000);
  assert.equal(r.topAccumulation.coin, "ETH");
  assert.equal(readWhaleReport(null), null);
  assert.equal(readWhaleReport({ signals: [], dataUpdatedAt: new Date(NOW).toISOString() }), null);
  assert.match(whaleReportCsv(r), /^window_start_utc,window_end_utc,coin,category/);
  assert.equal(whaleReportCsv(null).trim(), "status\r\nunavailable");
});

test("SVG charts are self-contained and credit NexuAlpha with the asset URL", () => {
  for (const svg of [feeIndexSvg(), tokenizedTrackerSvg(), whaleReportSvg(readWhaleReport(whaleFixture())), whaleReportSvg(null), feeIndexSvg({ theme: "dark" })]) {
    assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
    assert.match(svg, /Source: <tspan[^>]*>NexuAlpha<\/tspan>/);
    assert.match(svg, /nexualpha\.com\/data\//);
    assert.doesNotMatch(svg, /<script|href=|NaN|undefined/);
  }
});

test("embed snippets and citation carry a followed credit link to the dataset page", () => {
  const s = dataAssetEmbedSnippets("exchange-fee-index", "Fee index");
  for (const code of [s.image, s.iframe]) {
    assert.match(code, /<a href="https:\/\/nexualpha\.com\/data\/exchange-fee-index">NexuAlpha<\/a>/);
    assert.doesNotMatch(code, /nofollow|sponsored/);
  }
  assert.match(s.image, /<img src="https:\/\/nexualpha\.com\/embed\/exchange-fee-index\.svg"/);
  assert.match(s.iframe, /<iframe src="https:\/\/nexualpha\.com\/embed\/exchange-fee-index\.svg"/);
  const cite = dataAssetCitation("tokenized-stock-tracker", "Tracker", { year: "2026" });
  assert.match(cite.apa, /^NexuAlpha Research\. \(2026\)\. Tracker \[Data set\]\. NexuAlpha\. https:\/\/nexualpha\.com\/data\/tokenized-stock-tracker$/);
  assert.doesNotMatch(JSON.stringify(PRESS_BOILERPLATE), /BestBerlin|berlin/i, "owner stays anonymous");
});

// ------------------------------------------------------------------ routes, head, sitemap
test("routes are localized global routes; en + zh-Hans indexable, others noindex", () => {
  assert.equal(localizedPath("/press", "zh-Hans"), "/zh-hans/press");
  assert.equal(localizedPath("/data/exchange-fee-index", "zh-Hans"), "/zh-hans/data/exchange-fee-index");
  assert.ok(isDataAssetRoute("/data/whale-accumulation-report/"));
  assert.deepEqual(parseDataAssetFilePath("/research/exchange-fee-index.csv"), { kind: "csv", key: "exchange-fee-index" });
  assert.deepEqual(parseDataAssetFilePath("/embed/whale-accumulation-report.svg"), { kind: "svg", key: "whale-accumulation-report" });
  assert.equal(parseDataAssetFilePath("/research/other.csv"), null);
  const urlFor = (p) => `https://nexualpha.com${p}`;
  for (const path of DATA_ASSET_ROUTE_PATHS) {
    assert.equal(dataAssetRouteSeo(path, "en", { urlFor }).indexable, true);
    assert.equal(dataAssetRouteSeo(path, "zh-Hans", { urlFor }).indexable, true);
    assert.equal(dataAssetRouteSeo(path, "de", { urlFor }).indexable, false);
    for (const locale of ["en", "zh-Hans"]) {
      const seo = dataAssetRouteSeo(path, locale, { urlFor });
      assert.ok(seo.title.length <= (locale === "en" ? 60 : 32), `${path} ${locale} title fits: ${seo.title}`);
      assert.ok(seo.description.length <= (locale === "en" ? 160 : 80), `${path} ${locale} description`);
    }
  }
  const entries = dataAssetsSitemapEntries({ urlFor: (p, l) => `https://nexualpha.com${localizedPath(p, l)}` });
  assert.equal(entries.length, DATA_ASSET_ROUTE_PATHS.length * DATA_ASSET_INDEX_LOCALES.length);
  assert.deepEqual(entries[0].alternates.map((a) => a.hreflang), ["en", "zh-Hans", "x-default"]);
  assert.equal(pressNavLabel("zh-Hans"), "媒体与数据");
});

test("Dataset JSON-LD: CC BY 4.0, Organization creator, temporal coverage, CSV distribution", () => {
  const report = readWhaleReport(whaleFixture());
  for (const key of ["exchange-fee-index", "tokenized-stock-tracker", "whale-accumulation-report"]) {
    const d = datasetSchema(key, "en", { report });
    assert.equal(d["@type"], "Dataset");
    assert.equal(d.license, DATA_ASSET_LICENSE_URL);
    assert.equal(d.creator["@id"], ORGANIZATION_ID);
    assert.match(d.temporalCoverage, /^\d{4}-\d{2}-\d{2}.*\/.+/);
    assert.equal(d.distribution[0].encodingFormat, "text/csv");
    assert.match(d.distribution[0].contentUrl, new RegExp(`/research/${key}\\.csv$`));
  }
  const view = dataAssetView("exchange-fee-index", "en");
  assert.match(view.keyFinding, /median base-tier taker fee is 0\.10% on spot and 0\.05% on USDT perpetuals/);
  assert.equal(dataAssetView("whale-accumulation-report", "en", { report: null }).faq.length, 0);
  assert.equal(dataAssetsCopy("de"), dataAssetsCopy("en"), "unwritten locales fall back to English");
});

// ------------------------------------------------------------------ Worker: files, head, SSR body, hydration
const assets = { fetch: async (request) => {
  const pathname = new URL(request.url).pathname;
  if (pathname === "/prerender-manifest.json") return Response.json({ version: "nexualpha-prerender-v1", routes: {} });
  if (pathname === "/index.html") return new Response(SHELL_HTML, { headers: { "content-type": "text/html; charset=utf-8" } });
  return new Response("missing", { status: 404 });
} };
let harness;
test.before(async () => { harness = await createSsrHarness(); });
test.after(async () => { await harness?.close(); });
const envWith = (extra = {}) => ({ ASSETS: assets, NEWS_SSR_RENDER: (href, options) => harness.render(href, options), RADAR_READ: async () => whaleFixture(), ...extra });
const page = async (url, env = envWith()) => (await worker.fetch(new Request(url, { headers: { accept: "text/html" } }), env)).text();

test("worker serves CSV downloads and SVG embeds", async () => {
  const csv = await worker.fetch(new Request("https://nexualpha.com/research/exchange-fee-index.csv"), envWith());
  assert.equal(csv.status, 200);
  assert.match(csv.headers.get("content-type"), /^text\/csv/);
  assert.match(csv.headers.get("content-disposition"), /nexualpha-exchange-fee-index\.csv/);
  assert.match(await csv.text(), /^edition,exchange/);
  const svg = await worker.fetch(new Request("https://nexualpha.com/embed/tokenized-stock-tracker.svg"), envWith());
  assert.match(svg.headers.get("content-type"), /^image\/svg\+xml/);
  assert.equal(svg.headers.get("access-control-allow-origin"), "*");
  const whale = await (await worker.fetch(new Request("https://nexualpha.com/research/whale-accumulation-report.csv"), envWith())).text();
  assert.match(whale, /,ETH,accumulation,accumulation,perp,long,5000000,/);
  const none = await (await worker.fetch(new Request("https://nexualpha.com/research/whale-accumulation-report.csv"), envWith({ RADAR_READ: async () => null }))).text();
  assert.match(none, /unavailable/);
});

test("worker renders the fee index with Dataset head and the browser hydrates it", async () => {
  const html = await page("https://nexualpha.com/data/exchange-fee-index");
  assert.deepEqual(h1Texts(html), ["Crypto Exchange Fee Index — October 2026"]);
  assert.match(html, /"@type":"Dataset"/);
  assert.match(html, /creativecommons\.org\/licenses\/by\/4\.0/);
  assert.match(html, /<meta name="robots" content="index,follow/);
  assert.match(html, /hreflang="zh-Hans" href="https:\/\/nexualpha\.com\/zh-hans\/data\/exchange-fee-index"/);
  assert.match(html, /href="\/research\/exchange-fee-index\.csv"/);
  assert.match(html, /data-testid="data-asset-cite-exchange-fee-index"/);
  const { errors } = await hydrateInJsdom(harness.vite, html, "https://nexualpha.com/data/exchange-fee-index");
  assert.deepEqual(hydrationErrors(errors), [], errors.join("\n"));
  const de = await page("https://nexualpha.com/de/data/exchange-fee-index");
  assert.match(de, /<meta name="robots" content="noindex,follow/);
});

test("worker renders the whale report from the feed (zh-Hans) and its unavailable state", async () => {
  const html = await page("https://nexualpha.com/zh-hans/data/whale-accumulation-report");
  assert.deepEqual(h1Texts(html), ["巨鲸吸筹周报 — 最近 7 天"]);
  assert.match(html, /新加坡时间/);
  assert.equal(prerenderState(html).intelTool.kind, "whale-report");
  assert.match(html, /"temporalCoverage":"2026-10-11T14:00:00\.000Z\/2026-10-18T14:00:00\.000Z"/);
  const { errors } = await hydrateInJsdom(harness.vite, html, "https://nexualpha.com/zh-hans/data/whale-accumulation-report");
  assert.deepEqual(hydrationErrors(errors), [], errors.join("\n"));
  const empty = await page("https://nexualpha.com/data/whale-accumulation-report", envWith({ RADAR_READ: async () => null }));
  assert.match(empty, /data-testid="whale-report-unavailable"/);
  assert.doesNotMatch(empty, /\$\d/, "no figures without a feed");
});

test("tracker and /press render; /press lists boilerplate, datasets, logos, accounts and the public contact", async () => {
  const ts = await page("https://nexualpha.com/data/tokenized-stock-tracker");
  assert.match(ts, /data-testid="data-asset-tokenized-stock-tracker"/);
  assert.match(ts, /xStocks/);
  assert.match(ts, /data-testid="ts-hub-link"[^>]*>|href="\/tokenized-stocks"/, "the tracker links into the tokenized-stocks hub");
  const tr = await page("https://nexualpha.com/tr/data/tokenized-stock-tracker");
  assert.doesNotMatch(tr.replace(/<script[\s\S]*?<\/script>/g, ""), /Bitget/, "Türkiye: no Bitget");
  const press = await page("https://nexualpha.com/press");
  assert.deepEqual(h1Texts(press), ["Press kit & open data"]);
  for (const needle of [PRESS_BOILERPLATE.en.slice(0, 40), PRESS_BOILERPLATE["zh-Hans"].slice(0, 20), "/brand/nexualpha/nexualpha-round.svg", "https://x.com/NexuAlpha", "https://www.youtube.com/@NexuAlphaCN", "mailto:contact@nexualpha.com", "data-testid=\"press-asset-whale-accumulation-report\""]) {
    assert.ok(press.includes(needle), needle);
  }
  const { errors } = await hydrateInJsdom(harness.vite, press, "https://nexualpha.com/press");
  assert.deepEqual(hydrationErrors(errors), [], errors.join("\n"));
});

test("/about and the footer link to /press", async () => {
  const about = await readFile(new URL("../src/components/v3/brand-pages/AboutPage.jsx", import.meta.url), "utf8");
  assert.match(about, /href=\{href\(PRESS_PATH\)\}/);
  const footer = await readFile(new URL("../src/components/v3/CleanFooter.jsx", import.meta.url), "utf8");
  assert.match(footer, /href: href\(PRESS_PATH\), label: pressNavLabel\(locale\)/);
});
