import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  BINANCE_LIQUIDATION_URL, BINANCE_SILENCE_TIMEOUT_MS, connectBinanceLiquidations,
  binanceStreamCoverage, parseBinanceForceOrder, collectorStatePayload, readCollectorState,
  liquidationWindow, buildLiquidationTimeline, capOrders, MAX_RETAINED_ORDERS, readCollectorStatePayload,
} from "../../ops/market-collector/market-collector.mjs";

// Binance official example (including the merged-universe fields):
// https://developers.binance.com/docs/derivatives/usds-margined-futures/websocket-market-streams/All-Market-Liquidation-Order-Streams
const payload = {
  e: "forceOrder", E: 1568014460893,
  o: { s: "BTCUSDT", S: "SELL", o: "LIMIT", f: "IOC", q: "0.014",
    p: "9910", ap: "9910", X: "FILLED", l: "0.014", z: "0.014", T: 1568014460893 },
  ps: "BTCUSDT", st: 1,
};
const T = payload.o.T;
class Socket {
  constructor(url) { this.url = url; }
  close() { this.onclose(); }
}
const emit = (stream, data) => stream.ws.onmessage({ data: JSON.stringify(data) });

test("documented forceOrder reaches storage through the actual websocket handler", () => {
  const orders = [];
  const stream = connectBinanceLiquidations(orders, { WebSocketImpl: Socket, now: () => T });
  assert.equal(stream.ws.url, "wss://fstream.binance.com/market/ws/!forceOrder@arr");
  assert.equal(stream.ws.url, BINANCE_LIQUIDATION_URL);
  stream.ws.onopen();
  emit(stream, payload);
  emit(stream, { stream: "!forceOrder@arr", data: { ...payload, o: { ...payload.o, S: "BUY" } } });
  assert.deepEqual(orders.map(row => [row.side, row.usd, row.src]), [["long", 139, "binance"], ["short", 139, "binance"]]);
  const dir = mkdtempSync(path.join(tmpdir(), "binance-liq-"));
  try {
    const file = path.join(dir, "state.json");
    writeFileSync(file, JSON.stringify(collectorStatePayload(orders, [], T)));
    assert.equal(JSON.parse(readFileSync(file)).orders.length, 2);
    assert.deepEqual(readCollectorState(file, T).orders, orders);
    assert.equal(liquidationWindow(3600e3, readCollectorState(file, T).orders, T).totalUsd, 278);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("parser validates units, side, timestamps and numeric zero instead of string truthiness", () => {
  const withOrder = changes => ({ ...payload, o: { ...payload.o, ...changes } });
  assert.equal(parseBinanceForceOrder(withOrder({ ap: "0" }), T).usd, 139);
  assert.equal(parseBinanceForceOrder(withOrder({ z: "0" }), T), null);
  assert.equal(parseBinanceForceOrder(withOrder({ S: "unknown" }), T), null);
  assert.equal(parseBinanceForceOrder(withOrder({ T: T + 1 }), T), null);
  assert.equal(parseBinanceForceOrder(payload, T + 8 * 86400e3), null);
  assert.equal(parseBinanceForceOrder({ ...payload, st: 2 }, T), null);
  assert.equal(parseBinanceForceOrder(withOrder({ s: "BTCUSD_PERP" }), T), null);
  const { z, ...withoutFilled } = payload.o;
  assert.equal(parseBinanceForceOrder({ ...payload, o: withoutFilled }, T).usd, 139);
});

test("watchdog distinguishes connection from data, expires and recovers only on accepted orders", () => {
  let now = T;
  const stream = connectBinanceLiquidations([], { WebSocketImpl: Socket, now: () => now });
  assert.equal(binanceStreamCoverage(stream.state, now).status, "disconnected");
  stream.ws.onopen();
  assert.equal(binanceStreamCoverage(stream.state, now).status, "awaiting-data");
  assert.equal(binanceStreamCoverage(stream.state, now).available, false);
  now += BINANCE_SILENCE_TIMEOUT_MS;
  emit(stream, { result: null, id: 1 });
  assert.equal(binanceStreamCoverage(stream.state, now).status, "silent");
  assert.equal(binanceStreamCoverage(stream.state, now).available, false);
  emit(stream, { ...payload, o: { ...payload.o, T: now } });
  assert.equal(binanceStreamCoverage(stream.state, now).status, "receiving");
  assert.equal(binanceStreamCoverage(stream.state, now).available, true);
  now += BINANCE_SILENCE_TIMEOUT_MS;
  emit(stream, { ...payload, st: 2 });
  assert.equal(binanceStreamCoverage(stream.state, now).status, "silent");
  stream.ws.close();
  assert.equal(binanceStreamCoverage(stream.state, now).status, "disconnected");
});

test("coverage counts only contributing venues separately in each window", () => {
  const orders = [
    { t: T - 25 * 3600e3, s: "BTCUSDT", side: "long", usd: 139, src: "binance" },
    { t: T - 60000, s: "OKX:BTCUSDT", side: "long", usd: 200, src: "okx" },
    { t: T + 1, s: "ETHUSDT", side: "long", usd: 100, src: "binance" },
  ];
  assert.deepEqual(liquidationWindow(86400e3, orders, T).coverage.venues, ["OKX"]);
  const timeline = buildLiquidationTimeline(orders, [], T);
  assert.equal(timeline.h24.coverage.label, "OKX observed liquidations");
  assert.equal(timeline.d7.coverage.label, "Binance + OKX observed liquidations");
  const empty = buildLiquidationTimeline([], [{ t: T, binanceStream: false, okxPoll: false }], T);
  assert.equal(empty.coverage.venueCount, 0);
  assert.equal(empty.h24.observedBuckets, 0);
});

test("socket writes to the current retained array after a collector cycle replaces it", () => {
  let orders = [];
  const oldOrders = orders;
  const stream = connectBinanceLiquidations(orders, { WebSocketImpl: Socket, now: () => T, getOrders: () => orders });
  orders = orders.filter(() => true);
  emit(stream, payload);
  assert.equal(oldOrders.length, 0);
  assert.equal(orders.length, 1);
});

test("socket error does not recurse through close() and reconnect is scheduled once (2026-10-18)", () => {
  let closes = 0;
  let reconnects = 0;
  class RecursiveSocket {
    constructor() { this.readyState = 1; }
    close() {
      closes += 1;
      if (closes > 50) throw new Error("recursed");
      this.readyState = 2;
      this.onerror?.(new Event("error")); // undici re-fires error from close() on a failed socket
      this.readyState = 3;
      this.onclose?.();
    }
  }
  const stream = connectBinanceLiquidations([], { WebSocketImpl: RecursiveSocket, onClose: () => { reconnects += 1; } });
  stream.ws.onerror(new Event("error"));
  stream.ws.onclose();
  assert.equal(closes, 1);
  assert.equal(reconnects, 1);
  assert.equal(stream.state.open, false);
});

test("retained liquidation orders are hard-capped, newest kept", () => {
  const rows = [5, 1, 4, 2, 3].map((t) => ({ t }));
  assert.deepEqual(capOrders(rows, 3).map((x) => x.t), [3, 4, 5]);
  assert.equal(capOrders(rows, 10), rows);
  assert.ok(MAX_RETAINED_ORDERS >= 1000 && MAX_RETAINED_ORDERS <= 300_000);
  const now = Date.now();
  const many = Array.from({ length: MAX_RETAINED_ORDERS + 5 }, (_, i) => ({ t: now - 60_000 + i, s: "BTCUSDT", side: "long", usd: 1 }));
  assert.equal(readCollectorStatePayload({ orders: many }, now + 60_000).orders.length, MAX_RETAINED_ORDERS);
});
