import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  FUNDING_SYMBOL_COUNT, buildFundingRows, normalizeBinancePremium, normalizeOkxFunding, okxInstId, topFundingSymbols,
} from "../../ops/market-collector/market-collector.mjs";

const fixture = (name) => JSON.parse(readFileSync(new URL(`./fixtures/market-data/${name}`, import.meta.url), "utf8"));

test("collector picks the top USDT perpetuals by Binance quote volume and skips stablecoin pairs", () => {
  const symbols = topFundingSymbols(fixture("binance-ticker-24hr.json"));
  assert.equal(symbols.length, FUNDING_SYMBOL_COUNT);
  assert.equal(symbols[0], "BTC");
  assert.ok(symbols.includes("ETH") && symbols.includes("SOL"));
  assert.ok(!symbols.some((s) => /USDC$|USDC/.test(s)), "USDC-quoted pairs are not USDT perpetuals");
  assert.ok(!symbols.includes("USDC"), "stablecoin pairs are not funding symbols");
  assert.deepEqual(topFundingSymbols([{ symbol: "BTCUSDT", quoteVolume: "1" }, { symbol: "USDCUSDT", quoteVolume: "9" }]), ["BTC"]);
});

test("Binance premiumIndex rows normalize to one rate per base symbol with ISO next funding time", () => {
  const by = normalizeBinancePremium(fixture("binance-premium-index.json"));
  assert.equal(by.get("ETH").rate, 0.00003167);
  assert.equal(by.get("ETH").nextAt, new Date(1791648000000).toISOString());
  assert.ok(by.has("1000PEPE"));
  assert.equal(normalizeBinancePremium([{ symbol: "BTCUSDT", lastFundingRate: "abc" }]).size, 0, "non-numeric rates are dropped");
  assert.equal(normalizeBinancePremium([{ symbol: "BTCUSDT", lastFundingRate: "0.5", nextFundingTime: 1 }]).size, 0, "out-of-range rates are dropped");
  assert.equal(normalizeBinancePremium(null).size, 0);
});

test("OKX funding-rate response normalizes to the current-period rate and settlement time", () => {
  const r = normalizeOkxFunding(fixture("okx-funding-rate-btc.json"));
  assert.ok(Math.abs(r.rate - 0.0000183440742622) < 1e-12);
  assert.equal(r.nextAt, new Date(1791648000000).toISOString());
  assert.equal(normalizeOkxFunding({ code: "51001", data: [], msg: "Instrument ID does not exist" }), null);
  assert.equal(normalizeOkxFunding(undefined), null);
});

test("OKX instrument ids drop Binance's 1000x multiplier prefix", () => {
  assert.equal(okxInstId("BTC"), "BTC-USDT-SWAP");
  assert.equal(okxInstId("1000PEPE"), "PEPE-USDT-SWAP");
  assert.equal(okxInstId("1000000MOG"), "MOG-USDT-SWAP");
});

test("funding rows keep a symbol when at least one venue answered and never invent the other venue", () => {
  const binance = new Map([["BTC", { rate: 0.0001, nextAt: "2026-10-10T16:00:00.000Z" }], ["ETH", { rate: 0.00005, nextAt: "2026-10-10T16:00:00.000Z" }]]);
  const okx = new Map([["BTC", { rate: 0.00002, nextAt: "2026-10-10T16:00:00.000Z" }], ["SOL", { rate: -0.0001, nextAt: "2026-10-10T16:00:00.000Z" }]]);
  const rows = buildFundingRows(["BTC", "ETH", "SOL", "XRP"], binance, okx);
  assert.deepEqual(rows.map((r) => r.symbol), ["BTC", "ETH", "SOL"], "XRP answered nowhere and is absent");
  assert.deepEqual(rows[1], { symbol: "ETH", binanceRate: 0.00005, binanceNextAt: "2026-10-10T16:00:00.000Z", okxRate: null, okxNextAt: null });
  assert.equal(rows[2].binanceRate, null);
  assert.equal(rows[2].okxRate, -0.0001);
});

test("importing the collector does not start the stream or the 5-minute loop", () => {
  const src = readFileSync(new URL("../../ops/market-collector/market-collector.mjs", import.meta.url), "utf8");
  assert.match(src, /if \(process\.argv\[1\] && import\.meta\.url === pathToFileURL\(process\.argv\[1\]\)\.href\) \{\s*connectLiquidations\(\);/);
  assert.match(src, /\.\.\.\(lastFunding \? \{ funding: lastFunding \} : \{\}\)/, "funding block is written into the same feed document");
  assert.match(src, /fapi\/v1\/premiumIndex/);
  assert.match(src, /api\/v5\/public\/funding-rate\?instId=/);
});
