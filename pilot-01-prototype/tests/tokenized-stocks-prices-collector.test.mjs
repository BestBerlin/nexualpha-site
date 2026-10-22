import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { SOURCES, MAX_AGE_MS, strictNumber, fresh, parseSource, listedInstrument, buildFeed, collectPrices } from "../../ops/tokenized-stocks-prices/collector.mjs";

const fixture = JSON.parse(await readFile(new URL("./fixtures/tokenized-stocks-prices/documentation-examples.json", import.meta.url), "utf8"));
const definition = (venue, lane = "spot", kind = "ticker") => SOURCES.find(s => s.venueId === venue && s.lane === lane && s.kind === kind);
const now = Date.parse("2026-10-23T06:00:00Z");
const directory = (venue, lane, items) => ({ schema: 1, venues: { [venue]: { [lane]: { items } } } });
const snapshot = directory("bybit", "spot", { NVDA: { sym: "NVDAx" } });
const bybit = () => ({ retCode: 0, time: now, result: { category: "spot", list: [{ symbol: "NVDAXUSDT", lastPrice: "102", price24hPcnt: "0.02", turnover24h: "8000", usdIndexPrice: "90" }] } });
const result = (def, raw, at = now) => ({ def, status: "ok", checkedAt: new Date(at).toISOString(), ...parseSource(def, raw, at) });
const response = body => ({ ok: true, status: 200, json: async () => body });
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);

test("strict numbers reject absent, coerced, partial, nonfinite and whitespace values", () => {
  for (const input of [null, undefined, "", " ", "1abc", "1,000", "0x10", true, [], {}, NaN, Infinity, "Infinity", " 10"]) assert.equal(strictNumber(input), null);
  assert.equal(strictNumber("1.25e2"), 125);
  assert.equal(strictNumber("-0.5"), -0.5);
  assert.equal(strictNumber(0), 0);
});

test("recorded official Bitget example parses price, derived rolling change and quote turnover", () => {
  const rows = parseSource(definition("bitget"), fixture.bitget.response, 1765444397411).rows;
  assert.equal(rows.length, 1); assert.equal(rows[0].lastPrice, 90253.5);
  close(rows[0].change24hPct, (90253.5 / 92590.86 - 1) * 100);
  assert.equal(rows[0].quoteVolume24h, 677732572.225658);
});

test("recorded Bybit ratio becomes percentage points; collateral usdIndexPrice is not an equity index", () => {
  const [row] = parseSource(definition("bybit"), fixture.bybit.response, 1673859087947).rows;
  close(row.change24hPct, 0.68); assert.equal(row.indexPrice, null);
});

test("recorded Binance bulk ticker and index examples preserve their separate exchange clocks", () => {
  const [ticker] = parseSource(definition("binance", "perp"), fixture.binance.response, 1499869899040).rows;
  close(ticker.change24hPct, (4.000002 / 99 - 1) * 100); assert.equal(ticker.quoteVolume24h, 15.3);
  const [reference] = parseSource(definition("binance", "perp", "index"), fixture.binance.indexResponse, 1597370495002).rows;
  assert.equal(reference.indexPrice, 11781.8049597); assert.equal(reference.lastPrice, null);
  assert.equal(reference.updatedAt, new Date(1597370495002).toISOString());
});

test("recorded OKX swap base volume never masquerades as quote turnover", () => {
  const raw = fixture.okx.response;
  const [row] = parseSource(definition("okx", "perp"), raw, 1597026383085).rows;
  assert.equal(row.quoteVolume24h, null); close(row.change24hPct, (9999.99 / 9000 - 1) * 100);
  const spot = structuredClone(raw); spot.data[0].instId = "LTC-USDT";
  assert.equal(parseSource(definition("okx"), spot, 1597026383085).rows[0].quoteVolume24h, 2222);
});

test("recorded Gate example uses quote units and percentage points unchanged", () => {
  const [row] = parseSource(definition("gate-io", "perp"), fixture.gate.response, now).rows;
  assert.equal(row.quoteVolume24h, 184040233284); assert.equal(row.change24hPct, 4.43); assert.equal(row.indexPrice, 6531); assert.equal(row.timestampBasis, "observed");
});

test("recorded MEXC examples distinguish futures ratio, spot open and unavailable turnover", () => {
  const [perp] = parseSource(definition("mexc", "perp"), fixture.mexc.response, 1761883095759).rows;
  close(perp.change24hPct, 1.4); assert.equal(perp.quoteVolume24h, 10374579341.00211);
  const [spot] = parseSource(definition("mexc"), fixture.mexcSpot.response, 1641349582808).rows;
  close(spot.change24hPct, (46263.71 / 46079.37 - 1) * 100); assert.equal(spot.quoteVolume24h, null);
});

test("recorded Kraken spot example leaves rolling change and exact quote turnover unknown", () => {
  const [row] = parseSource(definition("kraken"), fixture.kraken.response, now).rows;
  assert.equal(row.lastPrice, 30303.2); assert.equal(row.change24hPct, null); assert.equal(row.quoteVolume24h, null);
});

test("recorded Kraken derivative uses last-trade time and open24h", () => {
  const [row] = parseSource(definition("kraken", "perp"), fixture.krakenFutures.response, Date.parse(fixture.krakenFutures.response.serverTime)).rows;
  assert.equal(row.lastPrice, 49289); assert.equal(row.quoteVolume24h, 7305.2); assert.equal(row.change24hPct, 0);
  assert.equal(row.updatedAt, "2022-06-17T10:46:35.705Z");
});

test("malformed and failed success envelopes are rejected rather than accepted as empty data", () => {
  const cases = [["bybit", "spot", { retCode: 10006 }], ["bitget", "spot", { code: "40000" }], ["okx", "spot", { code: "0", data: {} }], ["mexc", "perp", { success: false, code: 0, data: [] }], ["kraken", "spot", { error: ["EGeneral:Failure"] }], ["binance", "spot", { code: -1003 }]];
  for (const [venue, lane, raw] of cases) assert.throws(() => parseSource(definition(venue, lane), raw, now));
});

test("stale, future, invalid last prices drop; unknown optional metrics remain null", () => {
  for (const lastPrice of ["", "0", "-1", "1 USD", null, true]) {
    const raw = bybit(); raw.result.list[0].lastPrice = lastPrice;
    assert.deepEqual(parseSource(definition("bybit"), raw, now).rows, []);
  }
  for (const time of [now - MAX_AGE_MS - 1, now + 60_001, "bad", null]) {
    const raw = bybit(); raw.time = time; assert.deepEqual(parseSource(definition("bybit"), raw, now).rows, []);
  }
  const raw = bybit(); raw.result.list[0].turnover24h = "-10"; delete raw.result.list[0].price24hPcnt;
  const [row] = parseSource(definition("bybit"), raw, now).rows;
  assert.equal(row.quoteVolume24h, null); assert.equal(row.change24hPct, null);
  assert.equal(fresh(now - MAX_AGE_MS, now), false);
  assert.equal(fresh(now - MAX_AGE_MS + 1, now), true);
});

test("exact snapshot identities retain display sym, API identity and instrument type", () => {
  const def = definition("bybit");
  const feed = buildFeed(snapshot, [result(def, bybit())], now);
  assert.equal(feed.rows.length, 1);
  assert.equal(feed.rows[0].instrument, "NVDAx"); assert.equal(feed.rows[0].exchangeInstrument, "NVDAXUSDT"); assert.equal(feed.rows[0].marketType, "spot");
  assert.equal(feed.rows[0].premiumPct, null);
  const raw = bybit(); raw.result.list.push({ ...raw.result.list[0], symbol: "NVDAUSDT" }, { ...raw.result.list[0], symbol: "BTCUSDT" });
  assert.equal(buildFeed(snapshot, [result(def, raw)], now).rows.length, 1);
});

test("spot token families, Kraken pair metadata, and perp formatting match only listed identities", () => {
  const cases = [["bitget", "spot", "rNVDA", "RNVDAUSDT"], ["okx", "spot", "xNVDA", "XNVDA-USDT"], ["binance", "spot", "NVDAB", "NVDABUSDT"], ["gate-io", "perp", "NVDAUSDT", "NVDA_USDT"], ["mexc", "perp", "NVDASTOCKUSDT", "NVDASTOCK_USDT"], ["kraken", "perp", "NVDAx PERP", "PF_NVDAXUSD"]];
  for (const [venue, lane, sym, instrument] of cases) {
    const def = definition(venue, lane), snap = directory(venue, lane, { NVDA: { sym } });
    assert.equal(listedInstrument(def, instrument, snap)?.instrument, sym);
    assert.equal(listedInstrument(def, `${instrument}EXTRA`, snap), null);
  }
  const def = definition("kraken"), snap = directory("kraken", "spot", { NVDA: { sym: "NVDAx" } });
  assert.equal(listedInstrument(def, "NVDAXUSD", snap), null);
  const pairs = [{ instrument: "NVDAXUSD", base: "NVDAx", quote: "ZUSD", aclass_base: "tokenized_asset", status: "online" }];
  assert.equal(listedInstrument(def, "NVDAXUSD", snap, pairs).quoteCurrency, "USD");
  pairs[0].aclass_base = "currency"; assert.equal(listedInstrument(def, "NVDAXUSD", snap, pairs), null);
});

test("explicit alternate token family is accepted but unrelated token is not", () => {
  const def = definition("gate-io"), snap = directory("gate-io", "spot", { NVDA: { sym: "NVDAX", alt: "NVDAON" } });
  assert.equal(listedInstrument(def, "NVDAON_USDT", snap).instrument, "NVDAON");
  assert.equal(listedInstrument(def, "NVDA_USDT", snap), null);
});

test("snapshot instruments outside the existing page ticker roster never expand price coverage", () => {
  assert.equal(listedInstrument(definition("bybit"), "NEWXUSDT", directory("bybit", "spot", { NEW: { sym: "NEWX" } })), null);
});

test("overflow and impossible negative percentages remain null", () => {
  for (const rate of ["-1", "-2", "1e308"]) {
    const raw = bybit(); raw.result.list[0].price24hPcnt = rate;
    assert.equal(parseSource(definition("bybit"), raw, now).rows[0].change24hPct, null);
  }
});

test("stale sources, stale rows, failed lanes and stale Kraken metadata produce no rows", () => {
  const def = definition("bybit"), good = result(def, bybit());
  for (const item of [{ ...good, status: "error" }, { ...good, updatedAt: new Date(now - MAX_AGE_MS - 1).toISOString() }, { ...good, rows: [{ ...good.rows[0], updatedAt: new Date(now - MAX_AGE_MS - 1).toISOString() }] }]) assert.equal(buildFeed(snapshot, [item], now).rows.length, 0);
});

test("perpetual premium uses only a fresh matching venue index; stale index is omitted", () => {
  const def = definition("okx", "perp"), index = definition("okx", "perp", "index");
  const snap = directory("okx", "perp", { NVDA: { sym: "NVDA-USDT-SWAP" } });
  const ticker = result(def, { code: "0", data: [{ instId: "NVDA-USDT-SWAP", last: "102", open24h: "100", ts: String(now) }] });
  const reference = result(index, { code: "0", data: [{ instId: "NVDA-USDT", idxPx: "100", ts: String(now) }] });
  const [row] = buildFeed(snap, [ticker, reference], now).rows;
  close(row.premiumPct, 2); assert.equal(row.indexSourceId, index.id);
  assert.equal(buildFeed(snap, [ticker, { ...reference, updatedAt: new Date(now - MAX_AGE_MS - 1).toISOString() }], now).rows[0].premiumPct, null);
});

test("collector uses sequential bulk endpoints, minimum gaps, isolates failures and never networks in tests", async () => {
  const defs = [definition("bybit"), definition("okx")], urls = [], gaps = [];
  const feed = await collectPrices({ snapshot, now: () => now, definitions: defs, wait: async ms => gaps.push(ms), fetchImpl: async url => { urls.push(url); if (url.includes("okx")) throw new Error("test offline"); return response(bybit()); } });
  assert.deepEqual(urls, defs.map(def => def.endpoint)); assert.deepEqual(gaps, [500]);
  assert.equal(feed.rows.length, 1); assert.equal(feed.sources[0].status, "ok"); assert.equal(feed.sources[1].status, "error");
});

test("HTTP 429 respects host backoff without retrying sibling lanes", async () => {
  let calls = 0;
  const feed = await collectPrices({ snapshot, now: () => now, definitions: [definition("bybit"), definition("bybit", "perp")], wait: async () => {}, fetchImpl: async () => { calls++; return { ok: false, status: 429, headers: { get: () => "120" } }; } });
  assert.equal(calls, 1); assert.equal(feed.rows.length, 0); assert.equal(feed.sources[1].error, "venue rate-limit backoff");
});

test("Kraken xStocks ticker source explicitly requests the tokenized asset class", () => {
  assert.equal(new URL(definition("kraken").endpoint).searchParams.get("asset_class"), "tokenized_asset");
});

test("transport and schema failures emit no retained historical rows", async () => {
  const feed = await collectPrices({ snapshot, now: () => now, definitions: [definition("bybit")], wait: async () => {}, fetchImpl: async () => response({ retCode: 0, time: now, result: { category: "spot", list: {} } }) });
  assert.equal(feed.rows.length, 0); assert.equal(feed.sources[0].updatedAt, null); assert.equal(feed.sources[0].status, "error");
});
