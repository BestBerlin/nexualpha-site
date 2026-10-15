#!/usr/bin/env node
// NexuAlpha whale collector (2026-10-14). Public/free sources only:
// - Hyperliquid public info API for tracked/leaderboard wallet clearinghouseState.
// - mempool.space recent tx + tx details, plus /api/v1/prices for BTC USD.
// - PublicNode Ethereum RPC through the existing server adapter when enabled there.
// - Tronscan TRC20 transfer list for recent USDT-TRC20 transfers.
// Writes whales.json atomically every cycle and keeps persistent whale-history.json for accumulation signals.
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { atomicWriteJson, boundedFetch, createSourceRunner, readJson, runCollectorLoop, sourcesDegraded } from "./resilience.mjs";
export { atomicWriteJson } from "./resilience.mjs";
import { createPositionRadar, POSITION_RADAR_WHALE_SOURCES } from "../../pilot-01-prototype/server/position-radar.mjs";

import { collectWatchlist } from "./whale-watchlist.mjs";
import { enrichWhaleSignals } from "../../pilot-01-prototype/server/whale-signal-quality.mjs";

const UA = "NexuAlphaWhaleCollector/1.0 (+https://nexualpha.com)";
const MINUTE = 60_000;
const parseClampedNumber = (value, fallback, minimum) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(minimum, n);
};
const CYCLE_MS = parseClampedNumber(process.env.WHALE_CYCLE_MS, MINUTE, MINUTE);
const MIN_USD = parseClampedNumber(process.env.WHALE_MIN_USD, 5_000_000, 5_000_000);
const MIN_POSITION_USD = parseClampedNumber(process.env.WHALE_MIN_POSITION_USD, 1_000_000, 1_000_000);
const ONCE = process.argv.includes("--once");
const localRoot = path.resolve(process.cwd(), ".private", "whale-watch");
const defaultRoot = ONCE ? localRoot : "/var/lib/nexualpha-market";
const OUT_FILE = process.env.WHALES_OUT_FILE || process.env.OUT_FILE || path.join(defaultRoot, "whales.json");
const HISTORY_FILE = process.env.WHALE_HISTORY_FILE || path.join(path.dirname(OUT_FILE), "whale-history.json");
const LOCK_FILE = process.env.WHALE_LOCK_FILE || `${OUT_FILE}.lock`;
const LOCK_STALE_MS = Number(process.env.WHALE_LOCK_STALE_MS || 10 * MINUTE);
const LOG_PREFIX = "[whales]";

const log = (message) => console.log(`${LOG_PREFIX} ${new Date().toISOString()} ${message}`);

export function collectorRuntimeConfig() {
  return { cycleMs: CYCLE_MS, minUsd: MIN_USD, minPositionUsd: MIN_POSITION_USD, lockStaleMs: LOCK_STALE_MS };
}


function processIsAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (error?.code === "EPERM") return true;
    if (error?.code === "ESRCH") return false;
    return true;
  }
}

function readLockFile(file) {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

const OWN_LOCK_TOKENS = new Set();
export function acquireLock(file = LOCK_FILE, { now = Date.now(), staleMs = LOCK_STALE_MS, isPidAlive = processIsAlive } = {}) {
  mkdirSync(path.dirname(file), { recursive: true });
  const token = `${process.pid}:${now}:${Math.random().toString(36).slice(2)}`;
  OWN_LOCK_TOKENS.add(token);
  try {
    const fd = openSync(file, "wx");
    writeFileSync(fd, JSON.stringify({ pid: process.pid, token, acquiredAt: new Date(now).toISOString() }));
    closeSync(fd);
    return () => {
      const current = readLockFile(file);
      if (current?.pid === process.pid && current?.token === token) {
        try { rmSync(file); } catch { /* already gone */ }
      }
    };
  } catch (error) {
    if (error?.code !== "EEXIST") throw error;
    let stat;
    try {
      stat = statSync(file);
    } catch (statError) {
      if (statError?.code === "ENOENT") return acquireLock(file, { now, staleMs, isPidAlive });
      throw statError;
    }
    const current = readLockFile(file);
    const stale = now - stat.mtimeMs > staleMs;
    const lockPid = Number(current?.pid);
    // A lock carrying our own PID was left by a previous run of this same process slot (containers always start the
    // collector as PID 1), so it cannot be held by a live peer.
    if ((lockPid === process.pid && !OWN_LOCK_TOKENS.has(current?.token)) || (stale && Number.isInteger(lockPid) && lockPid > 0 && !isPidAlive(lockPid))) {
      rmSync(file, { force: true });
      return acquireLock(file, { now, staleMs, isPidAlive });
    }
    throw new Error(`collector lock held: ${file}`);
  }
}

export function readWalletsFile(file = process.env.HYPERLIQUID_WALLETS_FILE) {
  if (!file || !existsSync(file)) return [];
  const payload = JSON.parse(readFileSync(file, "utf8"));
  const rows = Array.isArray(payload) ? payload : Array.isArray(payload.wallets) ? payload.wallets : Array.isArray(payload.addresses) ? payload.addresses : [];
  return rows.map((row) => typeof row === "string" ? row : row?.address).filter(Boolean);
}

export function createBackoffSource(name, source, { now = Date.now, baseMs = 1_000, maxMs = 300_000, timeoutMs = 45_000, logFn = log } = {}) {
  const runner = createSourceRunner({ now, baseMs, maxMs, timeoutMs, log: logFn });
  const wrapped = (...args) => runner.run(name, (signal) => {
    if (typeof args[0] === "function") args[0] = boundedFetch(args[0], { signal });
    return source(...args);
  });
  wrapped.sourceStatus = () => runner.status()[name] || { status: "pending" };
  return wrapped;
}

async function getJson(url, fetchImpl = fetch) {
  const res = await fetchImpl(url, { headers: { accept: "application/json", "user-agent": UA }, signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`${url} HTTP ${res.status}`);
  return res.json();
}

export async function btcUsdPrice(fetchImpl = fetch) {
  try {
    const prices = await getJson("https://mempool.space/api/v1/prices", fetchImpl);
    const usd = Number(prices?.USD);
    if (Number.isFinite(usd) && usd > 0) return { price: usd, source: "mempool.space /api/v1/prices" };
  } catch { /* binance fallback below */ }
  const row = await getJson("https://fapi.binance.com/fapi/v1/ticker/price?symbol=BTCUSDT", fetchImpl);
  const usd = Number(row?.price);
  if (Number.isFinite(usd) && usd > 0) return { price: usd, source: "Binance public ticker" };
  throw new Error("BTC USD price unavailable");
}

export async function ethUsdPrice(fetchImpl = fetch) {
  try {
    const res = await fetchImpl("https://api.hyperliquid.xyz/info", { method: "POST", headers: { accept: "application/json", "content-type": "application/json", "user-agent": UA }, body: JSON.stringify({ type: "allMids" }), signal: AbortSignal.timeout(10_000) });
    if (res.ok) {
      const usd = Number((await res.json())?.ETH);
      if (Number.isFinite(usd) && usd > 0) return { price: usd, source: "Hyperliquid allMids" };
    }
  } catch { /* binance fallback below */ }
  const row = await getJson("https://fapi.binance.com/fapi/v1/ticker/price?symbol=ETHUSDT", fetchImpl);
  const usd = Number(row?.price);
  if (Number.isFinite(usd) && usd > 0) return { price: usd, source: "Binance public ticker" };
  throw new Error("ETH USD price unavailable");
}

const wrappedSourceSets = new WeakMap();
function whaleSourcesWithBackoff(sources, options) {
  if (!wrappedSourceSets.has(sources)) wrappedSourceSets.set(sources, Object.fromEntries(Object.entries(sources).map(([name, source]) => [
    name, source.sourceStatus ? source : createBackoffSource(name, source, options),
  ])));
  return wrappedSourceSets.get(sources);
}

export async function collectWhales({
  fetchImpl = fetch,
  now = Date.now,
  outFile = OUT_FILE,
  historyFile = HISTORY_FILE,
  wallets = readWalletsFile(),
  sources = POSITION_RADAR_WHALE_SOURCES,
  sourceTimeoutMs = 45_000,
  minUsd = MIN_USD,
  minPositionUsd = MIN_POSITION_USD,
  logFn = log,
  watchlistSource = collectWatchlist,
} = {}) {
  minUsd = parseClampedNumber(minUsd, MIN_USD, 5_000_000);
  minPositionUsd = parseClampedNumber(minPositionUsd, MIN_POSITION_USD, 1_000_000);
  fetchImpl = boundedFetch(fetchImpl);
  sources = whaleSourcesWithBackoff(sources, { now, logFn, timeoutMs: sourceTimeoutMs });
  const prices = await Promise.allSettled([btcUsdPrice(fetchImpl), ethUsdPrice(fetchImpl)]);
  const btc = prices[0].status === "fulfilled" ? prices[0].value : null;
  const eth = prices[1].status === "fulfilled" ? prices[1].value : null;
  const radar = createPositionRadar({
    fetchImpl,
    now,
    whaleSources: sources,
    hyperliquidWallets: wallets,
    whaleHistoryFile: historyFile,
    whaleSnapshotFile: null,
    btcUsd: btc?.price ?? null,
    minBtc: btc?.price ? minUsd / btc.price : 50,
    ethUsd: eth?.price ?? null,
    minEth: eth?.price ? minUsd / eth.price : 2_500,
    minUsd,
    minPositionUsd,
    log: logFn,
  });
  const snapshot = await radar.refresh("whales");
  // Watchlist (Base token observations) is optional: its failure must never block the Hyperliquid/transfer snapshot.
  const watchlist = await Promise.resolve().then(() => watchlistSource({ fetchImpl, now }))
    .catch((error) => ({ transfers: [], observations: [], sourceStatus: [{ source: "watchlist", status: "unavailable", error: error?.message || String(error) }] }));
  const signals = enrichWhaleSignals(snapshot.signals || []);
  const transfers = [...(snapshot.transfers || []), ...watchlist.transfers];
  const merged = {
    ...snapshot,
    status: signals.length || (snapshot.positions || []).length || transfers.length ? "ok" : snapshot.status,
    sources: [...new Set([...(snapshot.sources || []), ...(watchlist.observations.length || watchlist.transfers.length ? ["https://base-rpc.publicnode.com", "https://api.dexscreener.com/token-pairs/v1/base/"] : [])])],
    errors: [...(snapshot.errors || []), ...watchlist.sourceStatus.filter(row => row.status === "unavailable").map(row => `${row.source}${row.coin ? ` ${row.coin}` : ""}: ${row.error}`)],
    signals,
    transfers,
    rows: [...signals, ...(snapshot.positions || []), ...transfers].slice(0, 200),
    watchlistObservations: watchlist.observations,
    watchlistSourceStatus: watchlist.sourceStatus,
  };
  const updatedAt = new Date(now()).toISOString();
  const previous = readJson(outFile);
  const failed = merged.status !== "ok";
  const sourceStatus = {
    ...Object.fromEntries(Object.entries(sources).map(([name, source]) => [name, source.sourceStatus()])),
    btcPrice: { status: btc ? "ok" : "error", error: prices[0].reason?.message || null },
    ethPrice: { status: eth ? "ok" : "error", error: prices[1].reason?.message || null },
  };
  const degraded = failed || sourcesDegraded(sourceStatus);
  const output = {
    ...(failed && previous?.status === "ok" ? previous : merged),
    generatedAt: failed ? previous?.generatedAt || null : updatedAt,
    dataUpdatedAt: failed ? previous?.dataUpdatedAt || previous?.updatedAt || null : snapshot.updatedAt || updatedAt,
    updatedAt, stale: failed, degraded, sourceStatus,
    collector: {
      cycleMs: CYCLE_MS,
      minUsd,
      minPositionUsd,
      historyFile,
      btcUsd: btc,
      ethUsd: eth,
      sourceBoundary: "Free public endpoints only; key-gated sources are skipped unless already configured outside chat.",
    },
  };
  atomicWriteJson(outFile, output);
  atomicWriteJson(`${outFile}.heartbeat.json`, { updatedAt, status: degraded ? "degraded" : "ok", sourceStatus });
  return output;
}

async function loop() {
  const release = acquireLock();
  for (const signal of ["SIGTERM", "SIGINT"]) process.once(signal, () => { release(); process.exit(0); });
  try {
    await runCollectorLoop(async () => {
      const snapshot = await collectWhales();
      log(`status=${snapshot.status} signals=${snapshot.signals?.length || 0} positions=${snapshot.positions?.length || 0} transfers=${snapshot.transfers?.length || 0}`);
      return !snapshot.stale;
    }, {
      cycleMs: CYCLE_MS, once: ONCE,
      onError: (error) => {
        log(`cycle failed: ${error?.message || error}`);
        const updatedAt = new Date().toISOString();
        const previous = readJson(OUT_FILE);
        if (previous) atomicWriteJson(OUT_FILE, { ...previous, updatedAt, stale: true, degraded: true, sourceStatus: { collector: { status: "error", error: error.message } } });
        atomicWriteJson(`${OUT_FILE}.heartbeat.json`, { updatedAt, status: "error", sourceStatus: { collector: { status: "error", error: error.message } } });
      },
    });
  } finally { release(); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  loop();
}
