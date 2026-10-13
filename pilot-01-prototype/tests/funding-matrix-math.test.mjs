import test from "node:test";
import assert from "node:assert/strict";
import {
  FUNDING_MATRIX_PATH,
  FUNDING_MATRIX_SYMBOLS,
  buildFundingMatrix,
  calculateFundingArbitrage,
  normalizeFundingQuote,
  normalizeIntervalRate,
} from "../src/data/funding-matrix.js";
import { FUNDING_MATRIX_SOURCES, buildFundingMatrixSnapshot, createFundingMatrixReader } from "../server/funding-matrix.mjs";

test("normalizes 1h, 4h and 8h rates to comparable 8h and annualized values", () => {
  assert.equal(FUNDING_MATRIX_SYMBOLS.length, 60);
  assert.equal(FUNDING_MATRIX_PATH, "/intel/funding-matrix.json");
  for (const normalized of [normalizeIntervalRate(0.00001, 1), normalizeIntervalRate("0.00004", "4"), normalizeIntervalRate(0.00008, 8)]) {
    assert.ok(Math.abs(normalized.rate8h - 0.00008) < 1e-12);
    assert.ok(Math.abs(normalized.annualized - 0.0876) < 1e-12);
  }
  assert.equal(normalizeIntervalRate(0.9, 8), null);
  assert.equal(normalizeFundingQuote({ venue: "htx", symbol: "BTC", rate: "0.0001" }), null, "intervals are required and not invented");
});

test("builds symbol rows and highlights the widest spread without inventing empty venue cells", () => {
  const matrix = buildFundingMatrix([
    { venue: "binance", symbol: "BTC", rate: "0.0001", intervalHours: 8, nextFundingAt: 1791619200000 },
    { venue: "hyperliquid", symbol: "BTC", rate: "0.000005", intervalHours: 1, nextFundingAt: 1791615600000 },
    { venue: "okx", symbol: "ETH", rate: "-0.00004", intervalHours: 4, nextFundingAt: 1791619200000 },
    { venue: "okx", symbol: "NOPE", rate: "0.0001", intervalHours: 8, nextFundingAt: 1791619200000 },
  ], { generatedAt: "2026-10-13T00:00:00.000Z" });
  assert.equal(matrix.rows.length, 2);
  assert.deepEqual(Object.keys(matrix.rows[0].venues), ["binance", "hyperliquid"]);
  assert.equal(matrix.rows[0].maxSpread.longVenue, "hyperliquid");
  assert.equal(matrix.rows[0].maxSpread.shortVenue, "binance");
  assert.ok(Math.abs(matrix.rows[0].maxSpread.spread8h - 0.00006) < 1e-12);
});

test("calculator estimates funding pnl, fees, break-even and annualized return", () => {
  const matrix = buildFundingMatrix([
    { venue: "okx", symbol: "BTC", rate: "0.00002", intervalHours: 8, nextFundingAt: 1791619200000 },
    { venue: "binance", symbol: "BTC", rate: "0.00012", intervalHours: 8, nextFundingAt: 1791619200000 },
  ]);
  const result = calculateFundingArbitrage({ matrix, symbol: "BTC", longVenue: "okx", shortVenue: "binance", notional: 10000, holdingHours: 8 });
  assert.ok(result);
  assert.ok(Math.abs(result.fundingPnl - 1) < 1e-12);
  assert.ok(Math.abs(result.fees - 20) < 1e-12);
  assert.ok(Math.abs(result.netPnl - -19) < 1e-12);
  assert.ok(Math.abs(result.breakEvenHours - 160) < 1e-12);
  assert.ok(Math.abs(result.annualized - 0.1095) < 1e-12);
  assert.match(result.plainLanguage, /Estimate based on current rates/);
  assert.equal(calculateFundingArbitrage({ matrix, symbol: "BTC", longVenue: "okx", shortVenue: "okx", notional: 10000, holdingHours: 8 }), null);
});

test("server snapshot uses supplied sources and never fetches when disabled", async () => {
  const matrix = await buildFundingMatrixSnapshot({
    now: Date.UTC(2026, 9, 13),
    fetchImpl: async () => { throw new Error("fetch should not be called by supplied source"); },
    sources: {
      okx: async () => [{ venue: "okx", symbol: "BTC", rate: "0.00002", intervalHours: 8, nextFundingAt: 1791619200000 }],
      binance: async () => [{ venue: "binance", symbol: "BTC", rate: "0.00012", intervalHours: 8, nextFundingAt: 1791619200000 }],
    },
  });
  assert.equal(matrix.rows[0].symbol, "BTC");

  let fetchCalls = 0;
  const disabled = createFundingMatrixReader({ enabled: false, fetchImpl: async () => { fetchCalls += 1; } });
  assert.equal(await disabled.read(), null);
  assert.equal(fetchCalls, 0);
  const disabledResponse = await disabled.respond();
  assert.equal(disabledResponse.status, 503);
  assert.deepEqual(await disabledResponse.json(), {});
});

test("exchange source normalizers keep documented settlement timestamps and derive intervals", async () => {
  const okxRows = await FUNDING_MATRIX_SOURCES.okx(async (url) => {
    const symbol = new URL(url).searchParams.get("instId").replace("-USDT-SWAP", "");
    return new Response(JSON.stringify({ data: [{ fundingRate: "0.00002", fundingTime: "1791619200000", nextFundingTime: "1791648000000" }] }), { status: symbol === "BTC" ? 200 : 404 });
  }, { readAt: "2026-10-13T00:00:00.000Z" });
  assert.equal(okxRows.length, 1);
  assert.equal(okxRows[0].nextFundingAt, new Date(1791619200000).toISOString(), "OKX current fundingRate settles at fundingTime");
  assert.equal(okxRows[0].intervalHours, 8);

  const htxRows = await FUNDING_MATRIX_SOURCES.htx(async () => new Response(JSON.stringify({ data: [{
    symbol: "BTC",
    funding_rate: "0.00003",
    funding_time: "1791619200000",
    next_funding_time: "1791648000000",
  }] }), { status: 200 }), { readAt: "2026-10-13T00:00:00.000Z" });
  assert.equal(htxRows.length, 1);
  assert.equal(htxRows[0].nextFundingAt, new Date(1791619200000).toISOString());
  assert.equal(htxRows[0].intervalHours, 8);
});

test("reader caches on-demand results for at most sixty seconds", async () => {
  let clock = 1000;
  let loads = 0;
  const reader = createFundingMatrixReader({
    ttlMs: 120000,
    now: () => clock,
    sources: {
      okx: async () => {
        loads += 1;
        return [{ venue: "okx", symbol: "BTC", rate: String(0.00001 * loads), intervalHours: 8, nextFundingAt: 1791619200000 }];
      },
    },
  });
  const first = await reader.read();
  const second = await reader.read();
  assert.equal(loads, 1);
  assert.equal(second.rows[0].venues.okx.rate, first.rows[0].venues.okx.rate);
  clock += 60001;
  const third = await reader.read();
  assert.equal(loads, 2);
  assert.equal(third.rows[0].venues.okx.rate, 0.00002);
  const response = await reader.respond("HEAD");
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.body, null);
});
