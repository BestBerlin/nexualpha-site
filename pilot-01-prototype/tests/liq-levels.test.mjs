import test from "node:test";
import assert from "node:assert/strict";
import { combineVenueObservations, estimateLiquidationLevels } from "../src/data/liquidation-levels.js";
import { buildLiquidationLevels, createLiquidationLevelsFeed, normalizeLiquidationLevelSources } from "../server/liquidation-levels-feed.mjs";

const NOW = Date.parse("2026-10-13T08:00:00Z");

test("model builds balanced estimated levels below and above spot", () => {
  const result = estimateLiquidationLevels({ symbol: "BTC", price: 100_000, openInterestUsd: 80_000_000 });
  assert.equal(result.symbol, "BTC");
  assert.equal(result.price, 100_000);
  assert.equal(result.openInterestUsd, 80_000_000);
  assert.equal(result.levels.length, 8);
  assert.equal(result.levels.filter((level) => level.side === "long").length, 4);
  assert.equal(result.levels.filter((level) => level.side === "short").length, 4);
  assert.equal(result.levels.reduce((sum, level) => sum + level.usd, 0), 80_000_000);
  assert.ok(result.levels.some((level) => level.side === "long" && level.price < result.price && level.leverage === 25));
  assert.ok(result.levels.some((level) => level.side === "short" && level.price > result.price && level.leverage === 50));
  assert.equal(result.levels.find((level) => level.side === "long" && level.leverage === 50).price, 98492.5);
  assert.equal(result.levels.find((level) => level.side === "short" && level.leverage === 50).price, 101492.5);
  assert.equal(result.levels.find((level) => level.side === "long" && level.leverage === 100).price, 99497.5);
  assert.equal(result.levels.find((level) => level.side === "short" && level.leverage === 100).price, 100497.5);
});

test("model fails closed for unsupported symbols or missing market units", () => {
  assert.equal(estimateLiquidationLevels({ symbol: "DOGE", price: 1, openInterestUsd: 1_000_000 }), null);
  assert.equal(estimateLiquidationLevels({ symbol: "BTC", price: 0, openInterestUsd: 1_000_000 }), null);
  assert.equal(estimateLiquidationLevels({ symbol: "BTC", price: 100_000, openInterestUsd: NaN }), null);
  assert.equal(combineVenueObservations("BTC", [{ venue: "binance", symbol: "BTC", price: 100_000, openInterestUsd: 0 }]), null);
});

test("exchange normalizers validate public API units", () => {
  assert.deepEqual(normalizeLiquidationLevelSources.binance("BTC", [{ openInterest: "100" }, { price: "100000" }]), {
    venue: "binance",
    symbol: "BTC",
    price: 100_000,
    openInterestUsd: 10_000_000,
  });
  assert.deepEqual(normalizeLiquidationLevelSources.okx("ETH", [{ data: [{ oiCcy: "200" }] }, { data: [{ last: "5000" }] }]), {
    venue: "okx",
    symbol: "ETH",
    price: 5000,
    openInterestUsd: 1_000_000,
  });
  assert.deepEqual(normalizeLiquidationLevelSources.bybit("SOL", { result: { list: [{ symbol: "SOLUSDT", lastPrice: "200", openInterestValue: "123456" }] } }), {
    venue: "bybit",
    symbol: "SOL",
    price: 200,
    openInterestUsd: 123_456,
  });
  assert.equal(normalizeLiquidationLevelSources.binance("BTC", [{ openInterest: "" }, { price: "100000" }]), null);
  assert.equal(normalizeLiquidationLevelSources.okx("BTC", [{ data: [{}] }, { data: [{ last: "100000" }] }]), null);
});

test("build combines partial venue coverage and reports failures without fabricated rows", async () => {
  const feed = await buildLiquidationLevels({
    now: () => NOW,
    sources: {
      binance: async () => [
        { venue: "binance", symbol: "BTC", price: 100_000, openInterestUsd: 10_000_000 },
        { venue: "binance", symbol: "ETH", price: 5000, openInterestUsd: 5_000_000 },
      ],
      okx: async () => { throw new Error("okx down"); },
      bybit: async () => [{ venue: "bybit", symbol: "BTC", price: 101_000, openInterestUsd: 30_000_000 }],
    },
  });
  assert.equal(feed.generatedAt, "2026-10-13T08:00:00.000Z");
  assert.equal(feed.cacheTtlMs, 60_000);
  assert.equal(feed.coverage.binance.ok, true);
  assert.equal(feed.coverage.okx.ok, false);
  assert.match(feed.coverage.okx.error, /okx down/);
  assert.deepEqual(feed.symbols.map((row) => row.symbol), ["BTC", "ETH"]);
  const btc = feed.symbols.find((row) => row.symbol === "BTC");
  assert.equal(btc.openInterestUsd, 40_000_000);
  assert.equal(btc.price, 100_750);
  assert.deepEqual(btc.exchanges.map((row) => row.venue), ["binance", "bybit"]);
});

test("fetch-backed build hits Binance, OKX and Bybit public endpoints through injected fetch", async () => {
  const seen = [];
  const fetchImpl = async (url) => {
    seen.push(String(url));
    if (url.includes("binance.com/fapi/v1/openInterest")) return Response.json({ openInterest: "10" });
    if (url.includes("binance.com/fapi/v1/ticker/price")) return Response.json({ price: url.includes("BTC") ? "100000" : url.includes("ETH") ? "5000" : "200" });
    if (url.includes("okx.com/api/v5/public/open-interest")) return Response.json({ data: [{ oiCcy: "8" }] });
    if (url.includes("okx.com/api/v5/market/ticker")) return Response.json({ data: [{ last: url.includes("BTC") ? "100000" : url.includes("ETH") ? "5000" : "200" }] });
    if (url.includes("bybit.com/v5/market/tickers")) return Response.json({ result: { list: [
      { symbol: "BTCUSDT", lastPrice: "100000", openInterest: "9" },
      { symbol: "ETHUSDT", lastPrice: "5000", openInterest: "9" },
      { symbol: "SOLUSDT", lastPrice: "200", openInterest: "9" },
    ] } });
    throw new Error(`unexpected ${url}`);
  };
  const feed = await buildLiquidationLevels({ now: () => NOW, fetchImpl });
  assert.deepEqual(feed.symbols.map((row) => row.symbol), ["BTC", "ETH", "SOL"]);
  assert.ok(seen.some((url) => url.includes("/fapi/v1/openInterest?symbol=BTCUSDT")));
  assert.ok(seen.some((url) => url.includes("/api/v5/public/open-interest?instType=SWAP&instId=ETH-USDT-SWAP")));
  assert.ok(seen.some((url) => url.includes("/v5/market/tickers?category=linear")));
});

test("server feed caches a successful snapshot for less than 60 seconds and fails closed after expiry", async () => {
  let currentNow = NOW;
  let calls = 0;
  let fail = false;
  const cached = createLiquidationLevelsFeed({
    now: () => currentNow,
    sources: {
      binance: async () => {
        calls += 1;
        if (fail) throw new Error("source down");
        return [{ venue: "binance", symbol: "BTC", price: 100_000, openInterestUsd: 10_000_000 }];
      },
    },
    log: () => {},
  });
  let res = await cached.respond();
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("cache-control"), "no-store");
  let body = await res.json();
  assert.equal(body.symbols[0].symbol, "BTC");
  assert.equal(calls, 1);

  currentNow += 59_000;
  res = await cached.respond();
  assert.equal(res.status, 200);
  body = await res.json();
  assert.equal(body.generatedAt, "2026-10-13T08:00:00.000Z");
  assert.equal(calls, 1, "cache remains fresh for less than 60 seconds");

  currentNow += 2_000;
  res = await cached.respond();
  assert.equal(res.status, 200);
  body = await res.json();
  assert.equal(body.generatedAt, "2026-10-13T08:01:01.000Z");
  assert.equal(calls, 2, "cache refreshes once the 60-second TTL expires");

  fail = true;
  currentNow += 60_000;
  res = await cached.respond();
  assert.equal(res.status, 503, "expired snapshots are not served when refresh cannot produce a new feed");
  const callsAfterFailure = calls;
  assert.equal((await cached.respond()).status,503);
  assert.equal(calls,callsAfterFailure,"failed reads are cached to avoid retry storms");
});
