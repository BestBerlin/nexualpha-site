// Live funding board (2026-10-10): normalizers read each exchange's public payload; nothing missing becomes zero.
import test from "node:test";
import assert from "node:assert/strict";
import { normalizeFunding, fundingTable, fundingApr, FUNDING_VENUES } from "../src/data/funding-rates.js";
import { buildFunding } from "../server/funding-feed.mjs";

test("each exchange payload normalizes to rate, interval and next funding time", () => {
  const bn = normalizeFunding.binance([{ symbol: "BTCUSDT", lastFundingRate: "0.0001", nextFundingTime: 1791619200000 }], [{ symbol: "BTCUSDT", fundingIntervalHours: 4 }]);
  assert.deepEqual(bn[0], { symbol: "BTC", rate: 0.0001, intervalH: 4, nextAt: new Date(1791619200000).toISOString() });
  assert.equal(normalizeFunding.okx("ETH", { data: [{ fundingRate: "0.00002", fundingTime: "1791619200000", nextFundingTime: "1791648000000" }] }).intervalH, 8);
  assert.equal(normalizeFunding.bybit({ result: { list: [{ symbol: "SOLUSDT", fundingRate: "-0.00005", fundingIntervalHour: "8", nextFundingTime: "1791619200000" }] } })[0].rate, -0.00005);
  assert.equal(normalizeFunding.bitget("XRP", { data: [{ fundingRate: "0.0001", fundingRateInterval: "8", nextUpdate: "1791619200000" }] }).intervalH, 8);
  assert.equal(normalizeFunding["gate-io"]("DOGE", { name: "DOGE_USDT", funding_rate: "0.000004", funding_interval: 28800, funding_next_apply: 1791619200 }).intervalH, 8);
  const hl = normalizeFunding.hyperliquid([{ universe: [{ name: "BTC" }] }, [{ funding: "0.0000125" }]], Date.UTC(2026, 9, 10, 6, 20));
  assert.equal(hl[0].intervalH, 1);
  assert.equal(hl[0].nextAt, new Date(Date.UTC(2026, 9, 10, 7)).toISOString());
});

test("missing or absurd values are dropped, never turned into 0", () => {
  assert.equal(normalizeFunding.bitget("BTC", { data: [{ fundingRate: "", fundingRateInterval: "8" }] }), null);
  assert.equal(normalizeFunding.okx("BTC", { data: [] }), null);
  assert.equal(normalizeFunding.bybit({ result: { list: [{ symbol: "BTCUSDT", fundingRate: "0.9", fundingIntervalHour: "8" }] } }).length, 0);
});

test("table compares venues by annualised rate; hourly and 8-hourly are comparable", () => {
  const feed = { venues: { binance: { rows: [{ symbol: "BTC", rate: 0.0001, intervalH: 8 }] }, hyperliquid: { rows: [{ symbol: "BTC", rate: 0.0000125, intervalH: 1 }] } } };
  const t = fundingTable(feed, "BTC");
  assert.deepEqual(t.map((r) => r.venue), ["binance", "hyperliquid"]);
  assert.ok(Math.abs(fundingApr({ rate: 0.0001, intervalH: 8 }) - 0.1095) < 1e-9);
  assert.ok(FUNDING_VENUES.includes("gate-io"), "venue keys must be site slugs so profile links resolve");
});

test("a failing venue keeps its last good rows for at most two hours", async () => {
  const now = Date.UTC(2026, 9, 10, 6);
  const previous = { venues: { okx: { ok: true, readAt: new Date(now - 30 * 60e3).toISOString(), rows: [{ symbol: "BTC", rate: 0.0001, intervalH: 8 }] }, bybit: { ok: true, readAt: new Date(now - 3 * 36e5).toISOString(), rows: [{ symbol: "BTC", rate: 0.0001, intervalH: 8 }] } } };
  const sources = { okx: async () => { throw new Error("down"); }, bybit: async () => { throw new Error("down"); }, binance: async () => [{ symbol: "BTC", rate: 0.0001, intervalH: 8, nextAt: null }] };
  const feed = await buildFunding(previous, { now, sources });
  assert.equal(feed.venues.okx.ok, false);
  assert.equal(feed.venues.bybit.status, "unavailable");
  assert.deepEqual(feed.venues.bybit.rows, []);
  assert.equal(feed.venues.binance.ok, true);
  assert.equal((await buildFunding(null, { now, sources: { okx: async () => { throw new Error("down"); } } })).status, "unavailable");
});
