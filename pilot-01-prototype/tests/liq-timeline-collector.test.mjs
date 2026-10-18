import test from "node:test";
import assert from "node:assert/strict";
import {
  LIQUIDATION_ORDER_RETENTION_MS,
  LIQUIDATION_TIMELINE_SOURCE_LABEL,
  LIQUIDATION_TIMELINE_WINDOWS,
  buildLiquidationTimeline,
  collectorStatePayload,
  liquidationTimelineSymbol,
  liquidationTimelineVenue,
  readCollectorStatePayload,
} from "../../ops/market-collector/market-collector.mjs";

const T = Date.parse("2026-10-13T12:34:00.000Z");
const order = (minutesAgo, s, side, usd, extra = {}) => ({ t: T - minutesAgo * 60_000, s, side, usd, ...extra });
const observation = (minutesAgo) => ({ t: T - minutesAgo * 60_000, binanceStream: true, okxPoll: true });

test("timeline publishes 24h 5-minute and 7d hourly buckets plus largest orders", () => {
  const orders = [
    order(2, "BTCUSDT", "long", 1100),
    order(2, "BTCUSDT", "short", 900),
    order(7, "ETHUSDT", "short", 2500),
    order(65, "OKX:BTCUSDT", "long", 700, { src: "okx" }),
    order(25 * 60, "SOLUSDT", "long", 3300),
  ];
  const timeline = buildLiquidationTimeline(orders, [observation(2), observation(7), observation(65), observation(25 * 60)], T);

  assert.equal(timeline.coverage.label, LIQUIDATION_TIMELINE_SOURCE_LABEL);
  assert.equal(timeline.coverage.venueCount, 2);
  assert.equal(timeline.coverage.until, "2026-10-13T12:34:00.000Z");
  assert.equal(timeline.coverage.observationModel, "collector-cycle-or-order-inside-bucket");
  assert.deepEqual(timeline.symbols, ["BTC", "ETH", "SOL"]);
  assert.equal(timeline.h24.windowMs, 86_400_000);
  assert.equal(timeline.h24.bucketMs, LIQUIDATION_TIMELINE_WINDOWS.h24.bucketMs);
  assert.equal(timeline.h24.buckets.length, 288);
  assert.equal(timeline.d7.bucketMs, 3_600_000);
  assert.equal(timeline.d7.buckets.length, 168);
  assert.deepEqual(timeline.h24.symbols, ["BTC", "ETH"]);
  assert.deepEqual(timeline.d7.symbols, ["SOL", "BTC", "ETH"]);

  const latest = timeline.h24.buckets.find((b) => b.start === "2026-10-13T12:30:00.000Z");
  assert.equal(latest.t, Date.parse("2026-10-13T12:30:00.000Z"));
  assert.equal(latest.observed, true);
  assert.equal(latest.longUsd, 1100);
  assert.equal(latest.shortUsd, 900);
  assert.equal(latest.totalUsd, 2000);
  assert.equal(latest.orders, 2);
  assert.deepEqual(latest.symbols, { BTC: { longUsd: 1100, shortUsd: 900, totalUsd: 2000, orders: 2 } });

  assert.deepEqual(timeline.h24.largest.slice(0, 2), [
    { t: Date.parse("2026-10-13T12:27:00.000Z"), symbol: "ETH", side: "short", usd: 2500, at: "2026-10-13T12:27:00.000Z", venue: "Binance" },
    { t: Date.parse("2026-10-13T12:32:00.000Z"), symbol: "BTC", side: "long", usd: 1100, at: "2026-10-13T12:32:00.000Z", venue: "Binance" },
  ]);
  assert.equal(timeline.d7.largest[0].symbol, "SOL");
  assert.equal(timeline.h24.largestBySymbol.BTC[0].usd, 1100);
  assert.equal(timeline.h24.largestBySymbol.ETH[0].usd, 2500);
});

test("largestBySymbol keeps each filter's top orders even when the global largest list is full", () => {
  const orders = Array.from({ length: 25 }, (_, i) => order(i + 1, `ALT${i}USDT`, "long", 10_000 - i));
  orders.push(order(3, "BTCUSDT", "short", 100));
  const timeline = buildLiquidationTimeline(orders, [observation(3)], T);

  assert.equal(timeline.h24.largest.length, 20);
  assert.ok(!timeline.h24.largest.some((x) => x.symbol === "BTC"), "BTC is outside the global top-20");
  assert.deepEqual(timeline.h24.largestBySymbol.BTC, [{
    t: Date.parse("2026-10-13T12:31:00.000Z"),
    symbol: "BTC",
    side: "short",
    usd: 100,
    at: "2026-10-13T12:31:00.000Z",
    venue: "Binance",
  }]);
});

test("observed empty buckets are distinct from unobserved gaps", () => {
  const orders = [order(30, "BTCUSDT", "long", 1000)];
  const timeline = buildLiquidationTimeline(orders, [observation(20), observation(30)], T);
  const coveredEmpty = timeline.h24.buckets.find((b) => b.start === "2026-10-13T12:10:00.000Z");
  const gap = timeline.h24.buckets.find((b) => b.start === "2026-10-13T11:45:00.000Z");

  assert.equal(coveredEmpty.observed, true);
  assert.equal(coveredEmpty.totalUsd, 0);
  assert.equal(coveredEmpty.orders, 0);
  assert.equal(gap.observed, false);
  assert.equal(timeline.h24.observedBuckets, 2);
  assert.ok(timeline.h24.unobservedBuckets > 0);
  assert.ok(timeline.h24.gaps.some((g) => g.start <= gap.start && g.end >= gap.end));
});

test("collector state keeps real orders and observations for 7 days and reads the old array state", () => {
  const fresh = order(10, "BTCUSDT", "long", 1000);
  const old = { ...order((7 * 24 * 60) + 1, "ETHUSDT", "short", 2000), t: T - LIQUIDATION_ORDER_RETENTION_MS - 60_000 };
  const legacy = readCollectorStatePayload([fresh, old], T);
  assert.deepEqual(legacy.orders, [fresh]);
  assert.deepEqual(legacy.observations, []);

  const payload = collectorStatePayload([fresh, old], [observation(5), { t: T - LIQUIDATION_ORDER_RETENTION_MS - 1, binanceStream: true }], T);
  assert.equal(payload.version, 2);
  assert.equal(payload.retainedMs, LIQUIDATION_ORDER_RETENTION_MS);
  assert.deepEqual(payload.orders, [fresh]);
  assert.equal(payload.observations.length, 1);
  assert.deepEqual(readCollectorStatePayload(payload, T), { orders: [fresh], observations: payload.observations });
});

test("timeline normalizes venue-specific symbols without losing venue on largest orders", () => {
  assert.equal(liquidationTimelineSymbol({ s: "OKX:BTC-USDT-SWAP" }), "BTC");
  assert.equal(liquidationTimelineSymbol({ s: "ETHUSDT" }), "ETH");
  assert.equal(liquidationTimelineVenue({ s: "OKX:BTCUSDT" }), "OKX");
  assert.equal(liquidationTimelineVenue({ s: "BTCUSDT" }), "Binance");

  const timeline = buildLiquidationTimeline([order(1, "OKX:BTC-USDT-SWAP", "short", 1234, { src: "okx" })], [observation(1)], T);
  assert.equal(timeline.h24.largest[0].symbol, "BTC");
  assert.equal(timeline.h24.largest[0].venue, "OKX");
});


test('failed observations do not turn gaps into covered empty buckets', () => {
 const now=Date.parse('2026-10-13T12:00:00Z');
 const t=buildLiquidationTimeline([], [{t:now-60000,binanceStream:false,okxPoll:false}],now);
 assert.equal(t.coverage.since,null);
 assert.equal(t.coverage.observationCount,0);
 assert.equal(t.h24.observedBuckets,0);
 assert.equal(t.h24.unobservedBuckets,288);
});

test("timeline handles a large 7-day retention without overflowing the stack (2026-10-14 crash loop)", () => {
  const n = 150_000; // above the 100k that overflowed; below MAX_RETAINED_ORDERS (200k), which drops the oldest
  const orders = Array.from({ length: n }, (_, i) => order(1 + (i % (6 * 24 * 60)), "BTCUSDT", i % 2 ? "long" : "short", 10));
  const timeline = buildLiquidationTimeline(orders, [observation(3)], T);
  assert.equal(timeline.coverage.since, new Date(T - 6 * 24 * 60 * 60_000).toISOString());
  assert.equal(timeline.coverage.observationCount, 1);
});
