import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { acquireLock, atomicWriteJson, btcUsdPrice, collectWhales, createBackoffSource } from "../../ops/market-collector/whale-collector.mjs";

const tmp = (name) => path.join(tmpdir(), `nxa-${name}-${Date.now()}-${Math.random().toString(16).slice(2)}`);

test("whale collector lock is single-owner and only reclaims stale dead-PID locks", () => {
  const dir = tmp("whale-lock");
  mkdirSync(dir, { recursive: true });
  const lock = path.join(dir, "collector.lock");
  const release = acquireLock(lock, { now: 1_000, staleMs: 60_000 });
  assert.throws(() => acquireLock(lock, { now: 2_000, staleMs: 60_000 }), /collector lock held/);
  release();
  assert.equal(existsSync(lock), false);

  const liveStale = path.join(dir, "live-stale.lock");
  writeFileSync(liveStale, JSON.stringify({ pid: 111, token: "live" }));
  const old = Date.now() - 120_000;
  utimesSync(liveStale, old / 1000, old / 1000);
  assert.throws(() => acquireLock(liveStale, { now: Date.now(), staleMs: 1, isPidAlive: () => true }), /collector lock held/);
  assert.equal(JSON.parse(readFileSync(liveStale, "utf8")).token, "live");

  const deadStale = path.join(dir, "dead-stale.lock");
  writeFileSync(deadStale, JSON.stringify({ pid: 222, token: "dead" }));
  utimesSync(deadStale, old / 1000, old / 1000);
  const releaseDead = acquireLock(deadStale, { now: Date.now(), staleMs: 1, isPidAlive: () => false });
  releaseDead();
  assert.equal(existsSync(deadStale), false);
});

test("whale collector lock release does not delete another owner", () => {
  const dir = tmp("whale-lock-owner");
  mkdirSync(dir, { recursive: true });
  const lock = path.join(dir, "collector.lock");
  const release = acquireLock(lock, { now: 1_000, staleMs: 60_000 });
  writeFileSync(lock, JSON.stringify({ pid: process.pid, token: "other-owner" }));
  release();
  assert.equal(JSON.parse(readFileSync(lock, "utf8")).token, "other-owner");
  rmSync(dir, { recursive: true, force: true });
});

test("backoff source skips retries until the negative cache expires", async () => {
  let clock = 1_000;
  let calls = 0;
  const wrapped = createBackoffSource("fixture", async () => { calls += 1; throw new Error("offline"); }, { now: () => clock, baseMs: 1_000, maxMs: 10_000, logFn: () => {} });
  await assert.rejects(wrapped(), /offline/);
  await assert.rejects(wrapped(), /backed off/);
  assert.equal(calls, 1);
  clock += 1_001;
  await assert.rejects(wrapped(), /offline/);
  assert.equal(calls, 2);
});

test("BTC USD price reads mempool first and Binance only as fallback", async () => {
  let calls = [];
  const mempool = await btcUsdPrice(async (url) => {
    calls.push(url);
    return { ok: true, json: async () => ({ USD: 83_379 }) };
  });
  assert.equal(mempool.price, 83_379);
  assert.match(mempool.source, /mempool/);
  calls = [];
  const fallback = await btcUsdPrice(async (url) => {
    calls.push(url);
    if (String(url).includes("mempool.space")) throw new Error("mempool down");
    return { ok: true, json: async () => ({ price: "83400.5" }) };
  });
  assert.equal(fallback.price, 83400.5);
  assert.ok(calls.some((url) => String(url).includes("fapi.binance.com")));
});

test("collector writes whales.json atomically and includes TRON transfer rows", async () => {
  const dir = tmp("whale-collector");
  const outFile = path.join(dir, "whales.json");
  const historyFile = path.join(dir, "history.json");
  const now = Date.parse("2026-10-14T04:00:00.000Z");
  const tronTx = {
    transaction_id: "tron-large",
    block_ts: now,
    from_address: "TFrom",
    to_address: "TTo",
    contract_address: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
    quant: "6000000000000",
    event_type: "Transfer",
    confirmed: true,
    contractRet: "SUCCESS",
    finalResult: "SUCCESS",
    tokenInfo: { tokenAbbr: "USDT", tokenDecimal: 6 },
    to_address_tag: { to_address_tag: "Binance" },
  };
  const snapshot = await collectWhales({
    now: () => now,
    outFile,
    historyFile,
    minUsd: 5_000_000,
    fetchImpl: async (url) => {
      if (String(url).includes("mempool.space/api/v1/prices")) return { ok: true, json: async () => ({ USD: 83_379 }) };
      throw new Error(`unexpected fetch ${url}`);
    },
    sources: {
      tronTronscan: async () => ({ token_transfers: [tronTx] }),
    },
    logFn: () => {},
  });
  assert.equal(snapshot.status, "ok");
  assert.equal(snapshot.transfers[0].chain, "tron");
  assert.equal(snapshot.transfers[0].amountUsd, 6_000_000);
  assert.equal(snapshot.transfers[0].direction, "to-exchange");
  assert.equal(JSON.parse(readFileSync(outFile, "utf8")).transfers[0].txid, "tron-large");
  assert.equal(existsSync(`${outFile}.tmp`), false);
  rmSync(dir, { recursive: true, force: true });
});

test("collector runtime config clamps lower env values", () => {
  const result = spawnSync(process.execPath, ["--input-type=module", "-e", "import { collectorRuntimeConfig } from './ops/market-collector/whale-collector.mjs'; console.log(JSON.stringify(collectorRuntimeConfig()));"], {
    cwd: path.resolve(import.meta.dirname, "../.."),
    env: { ...process.env, WHALE_CYCLE_MS: "1", WHALE_MIN_USD: "1", WHALE_MIN_POSITION_USD: "1" },
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  const config = JSON.parse(result.stdout);
  assert.equal(config.cycleMs, 60_000);
  assert.equal(config.minUsd, 5_000_000);
  assert.equal(config.minPositionUsd, 1_000_000);
});

test("collector clamps minimum cycle and whale thresholds", async () => {
  const dir = tmp("whale-clamps");
  const outFile = path.join(dir, "whales.json");
  const historyFile = path.join(dir, "history.json");
  const now = Date.parse("2026-10-14T04:05:00.000Z");
  const snapshot = await collectWhales({
    now: () => now,
    outFile,
    historyFile,
    minUsd: 1,
    minPositionUsd: 1,
    fetchImpl: async (url) => {
      if (String(url).includes("mempool.space/api/v1/prices")) return { ok: true, json: async () => ({ USD: 83_379 }) };
      throw new Error(`unexpected fetch ${url}`);
    },
    sources: {},
    logFn: () => {},
  });
  assert.equal(snapshot.collector.cycleMs, 60_000);
  assert.equal(snapshot.collector.minUsd, 5_000_000);
  assert.equal(snapshot.collector.minPositionUsd, 1_000_000);
  assert.equal(JSON.parse(readFileSync(outFile, "utf8")).collector.minUsd, 5_000_000);
  rmSync(dir, { recursive: true, force: true });
});

test("atomicWriteJson leaves complete JSON at the target", () => {
  const dir = tmp("atomic-json");
  const file = path.join(dir, "x.json");
  atomicWriteJson(file, { ok: true });
  assert.deepEqual(JSON.parse(readFileSync(file, "utf8")), { ok: true });
});


test("Base-only transfer facts remain available when legacy sources are empty", async () => {
  const dir = tmp("whale-base-only");
  const now = Date.parse("2026-10-15T04:00:00Z");
  const snapshot = await collectWhales({
    now: () => now,
    outFile: path.join(dir, "whales.json"),
    historyFile: path.join(dir, "history.json"),
    sources: {},
    fetchImpl: async () => { throw new Error("offline"); },
    watchlistSource: async () => ({ observations: [], transfers: [{ id: "base-fact", category: "transfer", coin: "WELL", source: "base-public-rpc", amountUsd: 200000 }], sourceStatus: [{ source: "base-public-rpc", coin: "WELL", status: "ok" }, {source: "base-public-rpc", coin: "AERO", status: "unavailable", error: "429"}] }),
    logFn: () => {},
  });
  assert.equal(snapshot.status, "ok");
  assert.equal(snapshot.updatedAt, new Date(now).toISOString());
  assert.equal(snapshot.transfers[0].id, "base-fact");
  assert.ok(snapshot.errors.some(error => error.includes("AERO: 429")));
  assert.ok(snapshot.sources.includes("https://base-rpc.publicnode.com"));
  rmSync(dir, { recursive: true, force: true });
});
