import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import { atomicWriteJson, boundedFetch, createSourceRunner, runCollectorLoop } from "./resilience.mjs";
import { cycle } from "./market-collector.mjs";
import { collectWhales, createBackoffSource } from "./whale-collector.mjs";

test("startup DNS failures retry with backoff for five minutes then use the normal cycle", async () => {
  let now = 0;
  const waits = [];
  let calls = 0;
  let errors = 0;
  await runCollectorLoop(async () => { calls += 1; if (calls < 18) throw new Error("EAI_AGAIN"); }, {
    cycleMs: 60_000, now: () => now, maxCycles: 19,
    wait: async (ms) => { waits.push(ms); now += ms; },
    onError: () => { errors += 1; },
  });
  assert.equal(calls, 19);
  assert.equal(errors, 17);
  assert.deepEqual(waits.slice(0, 6), [1000, 2000, 4000, 8000, 16000, 30000]);
  assert.ok(waits.includes(29_000), "last startup delay fits remaining five-minute budget");
  assert.equal(waits.at(-1), 60_000);
});

test("loop attempts never overlap and a failed first cycle still schedules recovery", async () => {
  let active = 0;
  let calls = 0;
  await runCollectorLoop(async () => {
    assert.equal(active++, 0);
    await Promise.resolve();
    active -= 1;
    calls += 1;
    return calls > 1;
  }, { cycleMs: 60_000, wait: async () => {}, maxCycles: 3 });
  assert.equal(calls, 3);
});

test("source timeout opens its breaker without stopping healthy sources and recovers", async () => {
  let now = 0;
  let calls = 0;
  const runner = createSourceRunner({ now: () => now, timeoutMs: 15, baseMs: 100 });
  const stuck = () => { calls += 1; return new Promise(() => {}); };
  const results = await Promise.allSettled([runner.run("tron", stuck), runner.run("btc", async () => 42)]);
  assert.equal(results[0].status, "rejected");
  assert.equal(results[1].value, 42);
  assert.equal(runner.status().tron.status, "error");
  await assert.rejects(runner.run("tron", stuck), /backed off/);
  assert.equal(calls, 1);
  now = 101;
  assert.equal(await runner.run("tron", async () => "recovered"), "recovered");
  assert.equal(runner.status().tron.failures, 0);
});

test("fetch deadlines cover hung headers and hung bodies and abort the transport", async () => {
  await assert.rejects(boundedFetch(() => new Promise(() => {}), { timeoutMs: 15 })("https://fixture.test"), /timeout/);
  let transportSignal;
  const response = await boundedFetch(async (_, { signal }) => {
    transportSignal = signal;
    return { json: () => new Promise(() => {}) };
  }, { timeoutMs: 15 })("https://fixture.test");
  await assert.rejects(response.json(), /timeout/);
  assert.equal(transportSignal.aborted, true);
});

test("RSS-only recovery keeps the loop alive but heartbeat degraded and cannot write false liquidation history", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "partial-market-resilience-"));
  const options = { outFile: path.join(dir, "market.json"), stateFile: path.join(dir, "state.json"), historyFile: path.join(dir, "history.jsonl"), runner: createSourceRunner() };
  const unavailable = async () => { throw new Error("offline"); };
  try {
    const doc = await cycle({ ...options, collectors: { liquidations: unavailable, markets: unavailable, funding: unavailable, headlines: async () => [{ title: "current headline" }] } });
    assert.equal(doc.stale, false, "partial source recovery permits normal loop cadence");
    assert.equal(doc.degraded, true);
    const heartbeat = JSON.parse(readFileSync(`${options.outFile}.heartbeat.json`));
    assert.equal(heartbeat.status, "degraded");
    assert.equal(heartbeat.sourceStatus.headlines.status, "ok");
    assert.equal(heartbeat.sourceStatus.markets.status, "error");
    assert.equal(existsSync(options.historyFile), false, "no responding liquidation source means no new history point");
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("market total outage keeps last payload and timestamps data separately from heartbeat", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "market-resilience-"));
  const options = { outFile: path.join(dir, "market.json"), stateFile: path.join(dir, "state.json"), historyFile: path.join(dir, "history.jsonl") };
  try {
    const previous = { generatedAt: "2026-10-10T00:00:00Z", market: { majors: [], movers: [], openInterest: [] }, headlines: [{ title: "last good" }], liquidations: { h24: { totalUsd: 1234 } }, events: [] };
    atomicWriteJson(options.outFile, previous);
    const unavailable = async () => { throw new Error("DNS not ready"); };
    const doc = await cycle({ ...options, collectors: { liquidations: unavailable, markets: unavailable, headlines: unavailable, funding: unavailable } });
    assert.equal(doc.stale, true);
    assert.equal(doc.generatedAt, previous.generatedAt);
    assert.equal(doc.headlines[0].title, "last good");
    assert.equal(doc.liquidations.h24.totalUsd, 1234, "outage must not replace the previous liquidation payload with zeros");
    assert.ok(Number.isFinite(Date.parse(doc.updatedAt)));
    assert.equal(doc.sourceStatus.markets.status, "error");
    assert.equal(JSON.parse(readFileSync(`${options.outFile}.heartbeat.json`)).updatedAt, doc.updatedAt);
    assert.equal(readdirSync(dir).some((name) => name.endsWith(".tmp")), false);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("whale source deadline writes degraded heartbeat and breaker persists across cycles", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "whale-resilience-"));
  let calls = 0;
  const sources = { tronTronscan: createBackoffSource("tronTronscan", async () => { calls += 1; return new Promise(() => {}); }, { timeoutMs: 15, logFn: () => {} }) };
  const outFile = path.join(dir, "whales.json");
  const options = { outFile, historyFile: path.join(dir, "history.json"), sources, fetchImpl: async () => { throw new Error("offline"); }, logFn: () => {} };
  try {
    atomicWriteJson(outFile, { status: "ok", generatedAt: "2026-10-10T00:00:00Z", transfers: [{ txid: "last-good" }] });
    const first = await collectWhales(options);
    const second = await collectWhales(options);
    assert.equal(calls, 1);
    assert.equal(first.stale, true);
    assert.equal(second.transfers[0].txid, "last-good");
    assert.equal(second.generatedAt, "2026-10-10T00:00:00Z");
    assert.equal(second.sourceStatus.tronTronscan.status, "open");
    assert.equal(JSON.parse(readFileSync(`${outFile}.heartbeat.json`)).status, "degraded");
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
