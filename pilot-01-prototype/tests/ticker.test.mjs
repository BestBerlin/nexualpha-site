// Live ticker bar (2026-10-13): server-cached BTC/ETH/SOL/BNB/XRP prices + 24h change and the biggest mover, a server
// first frame on the home page and /flash (spliced into the prerendered home HTML, identical to a React render with the
// same snapshot), state "ticker" for hydration, a 30 s client refresh from our own /api/ticker.json loaded after first
// paint, and no marquee under prefers-reduced-motion.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import worker from "../worker/index.js";
import { fmtTickerChange, fmtTickerPrice, isTickerSnapshot, spliceTickerHtml, tickerDir, tickerFromBinance, tickerFromMarketEvents } from "../src/data/ticker.js";
import { createTickerFeed, TICKER_PATH } from "../server/ticker-feed.mjs";
import { localizedHref } from "../src/data/locale-routing.js";
import { tickerChanges } from "../src/components/ticker/ticker-changes.js";
import { createSsrHarness, hydrateInJsdom, hydrationErrors, prerenderState } from "./helpers/ssr-hydration-harness.mjs";

const binanceRow = (symbol, lastPrice, priceChangePercent, quoteVolume) => ({ symbol, lastPrice: String(lastPrice), priceChangePercent: String(priceChangePercent), quoteVolume: String(quoteVolume) });
const BINANCE = [
  binanceRow("BTCUSDT", 82576.4, -1.264, 1e10), binanceRow("ETHUSDT", 2484.45, 0.52, 8e9), binanceRow("SOLUSDT", 151.2, 3.1, 3e9),
  binanceRow("BNBUSDT", 612.3, 0.001, 1e9), binanceRow("XRPUSDT", 2.4108, -0.8, 2e9), binanceRow("GTCUSDT", 1.02, 53.12, 3.9e8),
  binanceRow("USDCUSDT", 1, 90, 5e9), binanceRow("TINYUSDT", 0.0001, 400, 10), binanceRow("RSRUSDT", 0.012, -31.9, 4.9e8),
];

test("formatting: en-US digits, U+2212 minus, fixed decimals by size, flat when it rounds to zero", () => {
  assert.equal(fmtTickerPrice(82576.4), "$82,576");
  assert.equal(fmtTickerPrice(2484.452), "$2,484.45");
  assert.equal(fmtTickerPrice(0.01234), "$0.0123");
  assert.equal(fmtTickerPrice(0.0000123), "$0.000012");
  assert.equal(fmtTickerPrice(null), "—");
  assert.equal(fmtTickerChange(-1.264), "−1.26%");
  assert.equal(fmtTickerChange(3.1), "+3.10%");
  assert.equal(fmtTickerChange(0.001), "0.00%");
  assert.equal(tickerDir(0.001), "flat");
  assert.equal(tickerDir(-0.5), "down");
});

test("snapshot from Binance: the five majors in order, biggest mover among the top-60 by volume (no majors, no stablecoins)", () => {
  const snap = tickerFromBinance(BINANCE, { now: Date.parse("2026-10-13T00:00:00Z") });
  assert.deepEqual(snap.items.map((i) => i.sym), ["BTC", "ETH", "SOL", "BNB", "XRP"]);
  assert.deepEqual(snap.items[0], { sym: "BTC", price: "$82,576", change: "−1.26%", dir: "down" });
  assert.deepEqual(snap.mover, { sym: "GTC", change: "+53.12%", dir: "up" }, "TINY has the biggest move but no volume; USDC is a stablecoin");
  assert.equal(snap.source, "binance-usdm");
  assert.ok(isTickerSnapshot(snap));
  assert.equal(tickerFromBinance([binanceRow("BTCUSDT", 1, 1, 1)]), null, "too few majors");
});

test("fallback snapshot from the market collector feed", () => {
  const snap = tickerFromMarketEvents({ generatedAt: "2026-10-12T22:52:03.058Z", market: {
    majors: [{ symbol: "BTCUSDT", price: 82576.4, change24hPct: -1.26 }, { symbol: "ETHUSDT", price: 2484.45, change24hPct: -1.92 }, { symbol: "SOLUSDT", price: 150, change24hPct: 2 }, { symbol: "DOGEUSDT", price: 0.2, change24hPct: 1 }],
    movers: [{ symbol: "RSRUSDT", change24hPct: 31.89 }, { symbol: "GTCUSDT", change24hPct: 53.12 }] } });
  assert.deepEqual(snap.items.map((i) => i.sym), ["BTC", "ETH", "SOL"]);
  assert.equal(snap.mover.sym, "GTC");
  assert.equal(snap.source, "market-events");
  assert.equal(tickerFromMarketEvents({ market: { majors: [] } }), null);
});

test("server feed: one Binance call per 6 s window, collector fallback, 503 with nothing to show", async () => {
  let clock = 1_000_000, calls = 0;
  const ok = async () => { calls += 1; return Response.json(BINANCE); };
  const feed = createTickerFeed({ fetchImpl: ok, now: () => clock });
  const first = await feed.read();
  assert.equal(first.items[0].price, "$82,576");
  await feed.read(); await feed.read();
  assert.equal(calls, 1, "cached for 6 s");
  clock += 7_000;
  await feed.read();
  await new Promise((r) => setTimeout(r, 5));
  assert.equal(calls, 2, "refreshed in the background after the window");
  const response = await feed.respond();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "public, max-age=4, stale-while-revalidate=8", "nginx honours this: short so the served frame stays fresh");
  assert.equal((await response.json()).items.length, 5);

  const down = createTickerFeed({ fetchImpl: async () => new Response("no", { status: 451 }), readMarketEvents: async () => ({ generatedAt: "2026-10-12T22:52:03Z", market: { majors: [{ symbol: "BTCUSDT", price: 1, change24hPct: 1 }, { symbol: "ETHUSDT", price: 1, change24hPct: 1 }, { symbol: "XRPUSDT", price: 1, change24hPct: 1 }] } }) });
  assert.equal((await down.read()).source, "market-events");
  const none = createTickerFeed({ fetchImpl: async () => { throw new Error("offline"); } });
  const res = await none.respond();
  assert.equal(res.status, 503);
  assert.equal(TICKER_PATH, "/api/ticker.json");
});

// ------------------------------------------------------------------------------------ rendering and the home page
const SNAP = tickerFromBinance(BINANCE, { now: Date.parse("2026-10-13T00:00:00Z") });
const SHELL = "<!doctype html><html lang=\"en\"><head><title>Shell</title></head><body><div id=\"root\"></div></body></html>";
const barOf = (html) => html.match(/<div class="nx-ticker"[\s\S]*?<\/ul><\/div><\/div><\/div>/)?.[0] || "";
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

test("the prerendered home has an empty fixed frame; splicing a snapshot equals rendering with it (hydration-safe)", async () => {
  for (const locale of ["en", "zh-Hans", "ar"]) {
    const empty = barOf(rendered[locale]);
    assert.ok(empty, locale);
    assert.equal((empty.match(/data-tk="BTC-p">—</g) || []).length, 2, "two copies of the list (marquee), placeholders only");
    const withData = barOf(await harness.render(`https://nexualpha.com${localizedHref("/", { locale })}`, { ticker: SNAP }));
    assert.equal(spliceTickerHtml(empty, SNAP), withData, `${locale}: splice == render`);
  }
  assert.equal(spliceTickerHtml("<p>no bar</p>", SNAP), "<p>no bar</p>");
  assert.equal(spliceTickerHtml(rendered.en, { items: [] }), rendered.en, "invalid snapshot leaves the HTML alone");
  const hostile = { ...SNAP, items: SNAP.items.map((i, n) => (n ? i : { ...i, price: "$1$'<b>" })) };
  assert.match(spliceTickerHtml(barOf(rendered.en), hostile), /data-tk="BTC-p">\$1\$'&lt;b&gt;</, "function replacer + escaping");
});

test("worker: home HTML carries the live first frame and state \"ticker\"; it hydrates without mismatch", async () => {
  for (const [path, locale] of [["/", "en"], ["/zh-hans", "zh-Hans"], ["/ar", "ar"]]) {
    const response = await worker.fetch(new Request(`https://nexualpha.com${path}`, { headers: { accept: "text/html", "user-agent": "Mozilla/5.0" } }), { ASSETS: assets, TICKER_READ: async () => SNAP });
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.match(barOf(html), /data-tk="BTC-p">\$82,576</, `${locale}: live first frame`);
    assert.match(barOf(html), /data-sym="mover" data-dir="up"/);
    assert.deepEqual(prerenderState(html).ticker, SNAP);
    const { errors } = await hydrateInJsdom(harness.vite, html, `https://nexualpha.com${path}`);
    assert.deepEqual(hydrationErrors(errors), [], `${path}: ${errors.join("\n")}`);
  }
  // No reader: the collector feed fills in; no feed at all: the empty frame stays and no state is shipped.
  const viaFeed = await (await worker.fetch(new Request("https://nexualpha.com/", { headers: { accept: "text/html" } }), { ASSETS: assets,
    MARKET_EVENTS_READ: async () => ({ generatedAt: "2026-10-12T22:52:03Z", market: { majors: [{ symbol: "BTCUSDT", price: 80000, change24hPct: 1 }, { symbol: "ETHUSDT", price: 2000, change24hPct: 1 }, { symbol: "SOLUSDT", price: 100, change24hPct: 1 }], movers: [] } }) })).text();
  assert.match(barOf(viaFeed), /data-tk="BTC-p">\$80,000</);
  const bare = await (await worker.fetch(new Request("https://nexualpha.com/", { headers: { accept: "text/html" } }), { ASSETS: assets })).text();
  assert.match(barOf(bare), /data-tk="BTC-p">—</);
  assert.equal("ticker" in prerenderState(bare), false);
});

test("bar: localized label, coin links, never an exchange URL, lazy polling of our endpoint, reduced motion stops the marquee", async () => {
  const zh = barOf(rendered["zh-Hans"]);
  assert.match(zh, /aria-label="行情 · 24 小时涨跌"/);
  assert.match(zh, /href="\/zh-hans\/coins\/bitcoin"/);
  assert.match(zh, />最大异动</);
  assert.match(barOf(rendered.en), /<ul class="nx-ticker__list" aria-hidden="true">[\s\S]*tabindex="-1"/, "the marquee copy is hidden from assistive tech and the tab order");
  const bar = await readFile(new URL("../src/components/ticker/TickerBar.jsx", import.meta.url), "utf8");
  const live = await readFile(new URL("../src/components/ticker/ticker-live.js", import.meta.url), "utf8");
  const polling = await readFile(new URL("../src/components/shared/json-polling.js", import.meta.url), "utf8");
  const css = await readFile(new URL("../src/components/ticker/ticker.css", import.meta.url), "utf8");
  assert.match(bar, /import\("\.\/ticker-live\.js"\)/, "polling code is a lazy chunk");
  assert.match(bar, /requestIdleCallback/, "loaded after first paint");
  assert.doesNotMatch(bar + live, /binance\.com|okx\.com|bybit\.com|fapi\./i, "browsers never call an exchange");
  assert.match(live, /"\/api\/ticker\.json"/);
  assert.match(live, /TICKER_REFRESH_MS = 12 \* 1000/, "10-15 s refresh");
  assert.match(live, /export function subscribe/);
  assert.match(live, /startJsonPolling/);
  assert.match(polling, /visibilityState === "hidden"/);
  assert.match(css, /@media \(max-width: 1020px\) and \(prefers-reduced-motion: no-preference\)[\s\S]*animation: nx-ticker-marquee/, "marquee only when motion is allowed");
  assert.match(css, /block-size: 36px/, "fixed height: no layout shift");
});

test("polling module: fetches our endpoint, skips hidden tabs, shares one poller, stops cleanly", async () => {
  const { startTickerPolling, subscribe } = await import(`../src/components/ticker/ticker-live.js?case=${Date.now()}`);
  const seen = [];
  const listeners = new Set();
  const doc = {
    visibilityState: "visible",
    addEventListener: (type, fn) => { if (type === "visibilitychange") listeners.add(fn); },
    removeEventListener: (type, fn) => { if (type === "visibilitychange") listeners.delete(fn); },
    dispatch(state) { doc.visibilityState = state; for (const fn of [...listeners]) fn(); },
  };
  let now = 0, timerId = 0;
  const timers = new Map();
  const setTimer = (fn, delay) => { const id = ++timerId; timers.set(id, { fn, at: now + delay }); return id; };
  const clearTimer = (id) => timers.delete(id);
  const flush = async () => { await Promise.resolve(); await Promise.resolve(); };
  const advance = async (ms) => {
    const end = now + ms;
    for (;;) {
      const due = [...timers].filter(([, timer]) => timer.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
      if (!due) break;
      now = due[1].at;
      timers.delete(due[0]);
      due[1].fn();
      await flush();
    }
    now = end;
    await flush();
  };
  const got = [];
  const stop = startTickerPolling((d) => got.push(d), {
    everyMs: 20,
    fetchImpl: async (url) => { seen.push(url); return { ok: true, json: async () => SNAP }; },
    documentRef: doc,
    setTimer,
    clearTimer,
    now: () => now,
  });
  const gotSecond = [];
  const stopSecond = subscribe((d) => gotSecond.push(d), {
    everyMs: 20,
    fetchImpl: async (url) => { seen.push(`duplicate:${url}`); return { ok: true, json: async () => SNAP }; },
    documentRef: doc,
    setTimer,
    clearTimer,
    now: () => now,
  });
  await advance(60);
  doc.dispatch("hidden");
  const before = seen.length;
  await advance(60);
  assert.equal(seen.length, before, "no requests while hidden");
  stopSecond();
  stop();
  assert.ok(got.length >= 2 && gotSecond.length >= 2 && seen.every((u) => u === "/api/ticker.json"));
  assert.equal(listeners.size, 0);
});

// Regression (owner 2026-10-15, "the top ticker never changes"): after hydration the bar re-fetches /api/ticker.json and
// writes the new numbers into the DOM (both marquee copies), and marks each changed value for its up/down flash.
test("regression: the hydrated bar re-fetches /api/ticker.json and updates the DOM with a direction flash", async () => {
  const NEXT = tickerFromBinance(BINANCE.map((r) => (r.symbol === "BTCUSDT" ? { ...r, lastPrice: "83001.2" } : r.symbol === "ETHUSDT" ? { ...r, lastPrice: "2401.10" } : r)), { now: Date.parse("2026-10-13T00:00:12Z") });
  const response = await worker.fetch(new Request("https://nexualpha.com/", { headers: { accept: "text/html", "user-agent": "Mozilla/5.0" } }), { ASSETS: assets, TICKER_READ: async () => SNAP });
  const html = await response.text();
  const fetched = [];
  const read = (w) => [...w.document.querySelectorAll('[data-tk="BTC-p"]')].map((el) => `${el.textContent}|${el.getAttribute("data-flash") || ""}`);
  const ethFlash = (w) => [...w.document.querySelectorAll('[data-tk="ETH-p"]')].map((el) => el.getAttribute("data-flash"));
  let before = null;
  const { inspected, errors } = await hydrateInJsdom(harness.vite, html, "https://nexualpha.com/", {
    timeoutMs: 6000,
    fetchImpl: async (url) => { const u = String(url); if (u.includes("/api/ticker.json")) { fetched.push(u); return Response.json(NEXT); } return new Response("{}", { status: 404 }); },
    // The flash is set in a passive effect after the commit: wait for it too, not just for the new text.
    until: (w) => { before ??= read(w); return read(w).every((v) => v === "$83,001|up"); },
    inspect: (w) => ({ btc: read(w), eth: ethFlash(w) }),
  });
  assert.deepEqual(hydrationErrors(errors), []);
  assert.deepEqual(before, ["$82,576|", "$82,576|"], "server first frame");
  assert.ok(fetched.length >= 1 && fetched.every((u) => u.endsWith("/api/ticker.json")), "polled our endpoint");
  assert.deepEqual(inspected.btc, ["$83,001|up", "$83,001|up"], "both copies updated and flagged up");
  assert.deepEqual(inspected.eth, ["down", "down"]);
  const css = await readFile(new URL("../src/components/ticker/ticker.css", import.meta.url), "utf8");
  assert.match(css, /animation: nx-ticker-flash-a 1100ms ease-out 1;/, "finite flash");
  assert.doesNotMatch(css.match(/@keyframes nx-ticker-flash-a[^}]*}[^}]*}[^}]*}/)?.[0] || "", /color|width|height|top|left/, "opacity only");
  assert.match(css, /prefers-reduced-motion: reduce\) \{ \.nx-ticker \[data-tk\]::after \{ animation: none/);
});

test("tickerChanges: direction per value, unchanged values ignored, mover symbol change follows the mover direction", () => {
  const next = { ...SNAP, items: SNAP.items.map((i) => (i.sym === "SOL" ? { ...i, price: "$150.00", change: "+2.90%" } : i)), mover: { sym: "RSR", change: "−31.90%", dir: "down" } };
  const changes = tickerChanges(SNAP, next);
  assert.equal(changes.get("SOL-p"), "down");
  assert.equal(changes.get("SOL-c"), "down");
  assert.equal(changes.get("mover-sym"), "down");
  assert.equal(changes.has("BTC-p"), false);
  assert.equal(tickerChanges(SNAP, SNAP).size, 0);
});
