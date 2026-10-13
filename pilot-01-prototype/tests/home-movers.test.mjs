// Home "Today's movers" (2026-10-13, replaces the static "Popular coins" chips): top 5 gainers / losers of the last 24h
// among the ~100 largest coins (Binance USDT-M rows the ticker already caches, collector fallback), a headline line
// from the collector (liquidations, else BTC funding), rows linking to /coins/<slug>, a server frame spliced into the
// prerendered home (identical to a React render with the same snapshot), state "movers" for hydration, no CTA.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import worker from "../worker/index.js";
import { buildMoversSnapshot, fmtUsdCompact, isMoversSnapshot, moversFromBinance, moversHeadline, moversUniverse } from "../src/data/movers.js";
import { MOVERS_COPY_LOCALES, moversBodyHtml, spliceMoversHtml } from "../src/data/movers-html.js";
import { createMoversFeed, MOVERS_PATH } from "../server/movers-feed.mjs";
import { localizedHref } from "../src/data/locale-routing.js";
import { NEUTRAL_CTA_LOCALES } from "../src/data/locale-policy.js";
import { createSsrHarness, hydrateInJsdom, hydrationErrors, prerenderState } from "./helpers/ssr-hydration-harness.mjs";

const coin = (rank, symbol, slug, category = "layer1", price = null) => ({ rank, symbol, slug, name: slug, category, price });
const COINS = { coins: [
  coin(1, "BTC", "bitcoin"), coin(2, "ETH", "ethereum"), coin(3, "USDT", "tether", "stablecoin"), coin(4, "SOL", "solana"), coin(5, "XRP", "xrp"),
  coin(6, "DOGE", "dogecoin", "meme"), coin(7, "ADA", "cardano"), coin(8, "LINK", "chainlink"), coin(9, "PEPE", "pepe", "meme"), coin(10, "SUI", "sui"),
  coin(11, "AVAX", "avalanche"), coin(12, "XAUT", "tether-gold", "gold"), coin(13, "TAO", "bittensor"), coin(14, "NEAR", "near-protocol", "layer1", 2.5), coin(150, "TINY", "tiny"),
] };
const row = (symbol, lastPrice, priceChangePercent, quoteVolume = 5e8) => ({ symbol, lastPrice: String(lastPrice), priceChangePercent: String(priceChangePercent), quoteVolume: String(quoteVolume) });
const BINANCE = [
  row("BTCUSDT", 83999.9, 1.2), row("ETHUSDT", 2531.29, -1.14), row("SOLUSDT", 108.6, -3.35), row("XRPUSDT", 1.3801, 2.12), row("DOGEUSDT", 0.08509, 6.4),
  row("ADAUSDT", 0.41, -7.9), row("LINKUSDT", 11.2, 4.4), row("1000PEPEUSDT", 0.0101, 12.5), row("SUIUSDT", 1.9, -2.2), row("AVAXUSDT", 14.1, 0.8),
  row("TAOUSDT", 300, -9.1), row("TINYUSDT", 0.001, 400), row("USDTUSDT", 1, 50), row("XAUTUSDT", 4000, 0.1), row("CIENUSDT", 397.3, -12.0), row("LINKUSDT", 11, 99, 10), row("NEARUSDT", 40, 80),
];
const FEED = { generatedAt: "2026-10-13T08:00:00Z", liquidations: { h24: { totalUsd: 133392206, largest: { symbol: "OKX:BTCUSDT", side: "short", usd: 2375474 } } },
  funding: { rows: [{ symbol: "BTC", binanceRate: 8.542e-05, okxRate: 3.885e-05 }] },
  market: { majors: [{ symbol: "BTCUSDT", price: 83999.9, change24hPct: 0.22 }, { symbol: "ETHUSDT", price: 2531.29, change24hPct: -1.14 }], movers: [{ symbol: "SOLUSDT", change24hPct: -3.35 }, { symbol: "GTCUSDT", change24hPct: 41 }] } };
const NOW = Date.parse("2026-10-13T08:08:00Z");
const SNAP = buildMoversSnapshot({ binanceRows: BINANCE, coins: COINS, marketEvents: FEED, now: NOW });

test("universe: top coins by market cap only, no stablecoins or gold; gainers and losers ranked by 24h change", () => {
  const universe = moversUniverse(COINS);
  assert.ok(universe.has("BTC") && universe.has("PEPE"));
  for (const sym of ["USDT", "XAUT", "TINY"]) assert.ok(!universe.has(sym), sym);
  const board = moversFromBinance(BINANCE, universe);
  assert.deepEqual(board.up.map((r) => r.sym), ["PEPE", "DOGE", "LINK", "XRP", "BTC"], "TINY (rank 150), USDT, CIEN (not a listed coin) and NEAR priced 16x its coin (another token) never rank");
  assert.deepEqual(board.down.map((r) => r.sym), ["TAO", "ADA", "SOL", "SUI", "ETH"]);
  const pepe = board.up[0];
  assert.equal(pepe.slug, "pepe");
  assert.equal(pepe.price, "$0.000010", "1000PEPE contract price is per 1000 coins");
  assert.equal(pepe.change, "+12.50%");
  assert.equal(board.down[0].change, "−9.10%");
  assert.equal(board.up.find((r) => r.sym === "LINK").change, "+4.40%", "a thin duplicate contract is ignored");
  assert.equal(moversFromBinance(BINANCE.slice(0, 3), universe), null, "too few rows: no board");
});

test("headline: 24h liquidations with the largest order, else BTC funding; compact USD", () => {
  assert.deepEqual(moversHeadline(FEED), { kind: "liquidations", total: "$133.4M", largest: { base: "BTC", side: "short", usd: "$2.38M", venue: "OKX" } });
  assert.deepEqual(moversHeadline({ funding: FEED.funding }), { kind: "funding", base: "BTC", binance: "+0.0085%", okx: "+0.0039%" });
  assert.equal(moversHeadline({}), null);
  assert.equal(fmtUsdCompact(1.21e9), "$1.21B");
  assert.equal(fmtUsdCompact(0), "—");
});

test("snapshot: Binance first, collector fallback, null without data", () => {
  assert.ok(isMoversSnapshot(SNAP));
  assert.equal(SNAP.source, "binance-usdm");
  assert.equal(SNAP.generatedAt, new Date(NOW).toISOString());
  const fallback = buildMoversSnapshot({ binanceRows: null, coins: COINS, marketEvents: FEED, now: NOW });
  assert.equal(fallback.source, "market-events");
  assert.deepEqual(fallback.up.map((r) => r.sym), ["BTC"]);
  assert.deepEqual(fallback.down.map((r) => r.sym), ["SOL", "ETH"]);
  assert.equal(fallback.generatedAt, "2026-10-13T08:00:00.000Z");
  assert.equal(buildMoversSnapshot({ binanceRows: null, coins: COINS, marketEvents: null }), null);
  assert.equal(isMoversSnapshot({ up: [], down: [], generatedAt: "x" }), false);
});

test("body markup: every row links to its coin page, SGT time, five fixed rows per list, escaped, no CTA in any locale", () => {
  for (const locale of MOVERS_COPY_LOCALES) {
    const html = moversBodyHtml(SNAP, locale);
    assert.match(html, new RegExp(`href="${localizedHref("/coins/pepe", { locale }).replace(/[/]/g, "\\/")}"`), locale);
    assert.match(html, new RegExp(`href="${localizedHref("/liquidations", { locale })}"`), `${locale}: headline links the data page`);
    assert.match(html, /<time datetime="[^"]+">[^<]*\S\S[:.]\S\S SGT/, `${locale}: time in SGT`);
    assert.equal((html.match(/<li/g) || []).length, 10, `${locale}: 5 + 5 rows`);
    assert.doesNotMatch(html, /\/go\/|data-cta|referral|invite|注册|sign ?up/i, `${locale}: no CTA`);
  }
  const empty = moversBodyHtml(null, "en");
  assert.equal((empty.match(/class="h7-mv-sk"/g) || []).length, 10, "skeleton rows hold the height before data");
  const thin = moversBodyHtml({ ...SNAP, up: SNAP.up.slice(0, 2) }, "en");
  assert.equal((thin.match(/class="h7-mv-pad"/g) || []).length, 3, "short list padded to five rows");
  const hostile = moversBodyHtml({ ...SNAP, up: [{ ...SNAP.up[0], sym: "<img>", price: "$1$'\"" }] }, "en");
  assert.doesNotMatch(hostile, /<img>/);
  assert.match(hostile, /\$1\$&#39;&quot;/);
  for (const locale of NEUTRAL_CTA_LOCALES) assert.ok(moversBodyHtml(SNAP, locale).includes("h7-mv-cols"), `${locale}: same board in neutral locales`);
});

test("feed: /api/movers.json serves the cached snapshot, 503 without data", async () => {
  assert.equal(MOVERS_PATH, "/api/movers.json");
  let calls = 0, clock = NOW;
  const feed = createMoversFeed({ readBinanceRows: async () => { calls += 1; return BINANCE; }, readCoins: async () => COINS, readMarketEvents: async () => FEED, now: () => clock });
  const res = await feed.respond();
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), SNAP);
  await feed.read(); assert.equal(calls, 1, "cached");
  clock += 31 * 1000; await feed.read(); assert.equal(calls, 2, "rebuilt after 30 s");
  const none = createMoversFeed({ readBinanceRows: async () => { throw new Error("offline"); } });
  assert.equal((await none.respond()).status, 503);
});

// ------------------------------------------------------------------------------------ rendering and the home page
const SHELL = "<!doctype html><html lang=\"en\"><head><title>Shell</title></head><body><div id=\"root\"></div></body></html>";
const boardOf = (html) => html.match(/<section class="h7-in h7-mv"[\s\S]*?<!--mv-end--><\/div><\/section>/)?.[0] || "";
let harness;
let assets;
const rendered = {};
test.before(async () => {
  harness = await createSsrHarness();
  const files = new Map();
  const routes = {};
  for (const locale of ["en", "zh-Hans", "ar"]) {
    rendered[locale] = await harness.render(`https://nexualpha.com${localizedHref("/", { locale })}`, {});
    files.set(`/prerender/${locale}/home.json`, JSON.stringify({ html: rendered[locale] }));
    routes[`/|${locale}`] = { pathname: "/", locale, asset: `/prerender/${locale}/home.json`, searchPublished: true };
  }
  files.set("/prerender-manifest.json", JSON.stringify({ version: "nexualpha-prerender-v1", routes }));
  assets = { fetch: async (request) => {
    const pathname = new URL(request.url).pathname;
    if (pathname === "/" || pathname === "/index.html") return new Response(SHELL, { headers: { "content-type": "text/html; charset=utf-8" } });
    if (files.has(pathname)) return new Response(files.get(pathname), { headers: { "content-type": "application/json" } });
    return new Response("missing", { status: 404 });
  } };
});
test.after(async () => { await harness?.close(); });

test("the old 'Popular coins' block is gone; the prerendered home has the empty movers frame; splice == render", async () => {
  for (const locale of ["en", "zh-Hans", "ar"]) {
    assert.doesNotMatch(rendered[locale], /h7-coins-list"><li><a href="[^"]*\/coins\/bitcoin"|热门币种|Popular coins/, `${locale}: no chip wall`);
    const empty = boardOf(rendered[locale]);
    assert.ok(empty, locale);
    assert.match(empty, new RegExp(`class="h7-mv-all" href="${localizedHref("/coins", { locale })}"`), "all coins link");
    assert.equal((empty.match(/class="h7-mv-sk"/g) || []).length, 10, "placeholders only");
    const withData = boardOf(await harness.render(`https://nexualpha.com${localizedHref("/", { locale })}`, { movers: SNAP }));
    assert.equal(spliceMoversHtml(empty, SNAP, locale), withData, `${locale}: splice == render`);
  }
  assert.equal(spliceMoversHtml("<p>no board</p>", SNAP), "<p>no board</p>");
  assert.equal(spliceMoversHtml(rendered.en, { up: [], down: [] }), rendered.en, "invalid snapshot leaves the HTML alone");
});

test("worker: home HTML carries the movers frame and state \"movers\"; it hydrates without mismatch", async () => {
  for (const [path, locale] of [["/", "en"], ["/zh-hans", "zh-Hans"], ["/ar", "ar"]]) {
    const response = await worker.fetch(new Request(`https://nexualpha.com${path}`, { headers: { accept: "text/html", "user-agent": "Mozilla/5.0" } }), { ASSETS: assets, MOVERS_READ: async () => SNAP });
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.match(boardOf(html), new RegExp(`href="${localizedHref("/coins/pepe", { locale })}"`), `${locale}: live rows`);
    assert.deepEqual(prerenderState(html).movers, SNAP);
    const { errors } = await hydrateInJsdom(harness.vite, html, `https://nexualpha.com${path}`);
    assert.deepEqual(hydrationErrors(errors), [], `${path}: ${errors.join("\n")}`);
  }
  const bare = await (await worker.fetch(new Request("https://nexualpha.com/", { headers: { accept: "text/html", "user-agent": "Mozilla/5.0" } }), { ASSETS: assets })).text();
  assert.equal((boardOf(bare).match(/class="h7-mv-sk"/g) || []).length, 10, "no reader: the empty frame stays");
  assert.equal(prerenderState(bare).movers, undefined);
});

test("server and client wiring: /api/movers.json route, refresh at most every 60 s while visible, lazy chunk only", async () => {
  const server = await readFile(new URL("../server.mjs", import.meta.url), "utf8");
  assert.match(server, /requestPath === MOVERS_PATH/);
  assert.match(server, /MOVERS_READ: movers\.read/);
  const board = await readFile(new URL("../src/components/v7/home7-movers.jsx", import.meta.url), "utf8");
  assert.match(board, /MOVERS_REFRESH_MS = 60 \* 1000/);
  assert.match(board, /IntersectionObserver/);
  const below = await readFile(new URL("../src/components/v7/home7-below.jsx", import.meta.url), "utf8");
  assert.match(below, /<MoversBoard locale=\{locale\} initial=\{movers\} \/>/);
  assert.doesNotMatch(below, /POPULAR_COINS|PopularCoins/);
  const home = await readFile(new URL("../src/components/v7/HomeV7.jsx", import.meta.url), "utf8");
  assert.doesNotMatch(home, /home7-movers|movers-html/, "only the lazy below-the-fold chunk imports the board");
});
