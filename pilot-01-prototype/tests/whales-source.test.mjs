import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createPositionRadar, POSITION_RADAR_WHALE_SOURCES, EXCHANGE_ADDRESS_LABELS } from "../server/position-radar.mjs";
import { rpcFixture, USDC, USDT, TRANSFER, UNKNOWN } from "./fixtures/whales-source/rpc.mjs";
import { whalesBodyHtml } from "../src/data/whales-home.js";

const exchangeAddress = Object.keys(EXCHANGE_ADDRESS_LABELS.ethereum)[0];

test("Hyperliquid margin alone cannot establish a qualifying position notional", async () => {
  const radar = createPositionRadar({ whaleSnapshotFile: null, whaleSources: {
    hyperliquid: async () => [{ address: "0x2222222222222222222222222222222222222222", clearinghouseState: {
      assetPositions: [{ position: { coin: "BTC", szi: "100", marginUsed: "50000000" } }],
    } }],
  } });
  const feed = await radar.refresh("whales");
  assert.equal(feed.status, "unavailable");
  assert.deepEqual(feed.rows, []);
});

test("fixture preserves 20+ rows, sourced labels, receipt status and log identity", async () => {
  const fixture = rpcFixture(exchangeAddress);
  const radar = createPositionRadar({ fetchImpl: fixture.fetchImpl, whaleSources: { ethereumRpc: POSITION_RADAR_WHALE_SOURCES.ethereumRpc }, minUsd: 1_000_000 });
  const feed = await radar.refresh("whales");
  assert.equal(feed.status, "ok");
  assert.equal(feed.rows.length, 26);
  assert.equal(feed.rows.filter(row => row.asset === "USDT").length, 12);
  assert.equal(feed.rows.filter(row => row.asset === "USDC").length, 13);
  assert.ok(!feed.rows.some(row => row.txid === "native-reverted" || row.txid === "token-25"));
  assert.equal(new Set(feed.rows.map(row => row.id)).size, feed.rows.length);
  const older = feed.rows.find(row => row.txid === "token-24");
  assert.equal(older.direction, "to-exchange");
  assert.equal(older.to.source, EXCHANGE_ADDRESS_LABELS.ethereum[exchangeAddress].source);
  assert.match(older.ownerRule, /not a sale/);
});

test("failed log scan leaves cursor unchanged for a later retry", async () => {
  const fixture = rpcFixture(exchangeAddress);
  fixture.failLogs();
  const state = {};
  await assert.rejects(POSITION_RADAR_WHALE_SOURCES.ethereumRpc(fixture.fetchImpl, { state }), /fixture rate limit/);
  assert.equal(state.ethCursor, undefined);
});

test("warm scan requests both contracts once and omits covered exchange ranges", async () => {
  const fixture = rpcFixture(exchangeAddress);
  const state = {};
  await POSITION_RADAR_WHALE_SOURCES.ethereumRpc(fixture.fetchImpl, { state });
  const coldLogs = fixture.calls.filter(call => call.request.method === "eth_getLogs").map(call => call.request.params[0]);
  const general = coldLogs.find(filter => filter.topics.length === 1);
  assert.deepEqual(general.address, [USDT, USDC]);
  for (const filter of coldLogs.filter(filter => filter.topics.length > 1)) {
    assert.ok(Number.parseInt(filter.toBlock, 16) < Number.parseInt(general.fromBlock, 16));
  }
  fixture.calls.length = 0;
  fixture.setHead(1005);
  const rows = await POSITION_RADAR_WHALE_SOURCES.ethereumRpc(fixture.fetchImpl, { state });
  const warmLogs = fixture.calls.filter(call => call.request.method === "eth_getLogs");
  assert.equal(warmLogs.length, 1);
  assert.equal(warmLogs[0].request.params[0].fromBlock, "0x3e7");
  assert.equal(warmLogs[0].request.params[0].toBlock, "0x3eb");
  assert.deepEqual(rows.map(row => row.transaction_hash), ["token-26"]);
  fixture.calls.length = 0;
  assert.deepEqual(await POSITION_RADAR_WHALE_SOURCES.ethereumRpc(fixture.fetchImpl, { state }), []);
  assert.deepEqual(fixture.calls.map(call => call.request.method), ["eth_blockNumber"]);
});

test("combined query never identifies another contract or event as USDT/USDC", async () => {
  const entry = { address: UNKNOWN, transactionHash: "unrelated", blockNumber: "0x3e3", logIndex: "0x1", data: "0xe8d4a51000", topics: [TRANSFER] };
  const fixture = rpcFixture(exchangeAddress);
  const fetchImpl = async (url, init) => {
    if (JSON.parse(init.body).method === "eth_getLogs") return { ok: true, json: async () => ({ result: [entry, { ...entry, address: USDC, topics: ["another-event"] }] }) };
    return fixture.fetchImpl(url, init);
  };
  const rows = await POSITION_RADAR_WHALE_SOURCES.ethereumRpc(fetchImpl);
  assert.ok(rows.every(row => row.asset === "ETH"));
});

test("whale cache stays at 60 seconds and retains previous rows after refresh", async () => {
  const fixture = rpcFixture(exchangeAddress);
  let now = 1791853200000;
  const radar = createPositionRadar({ now: () => now, ttlMs: 300_000, fetchImpl: fixture.fetchImpl,
    whaleSources: { ethereumRpc: POSITION_RADAR_WHALE_SOURCES.ethereumRpc }, minUsd: 1_000_000 });
  const first = await radar.read("whales");
  fixture.calls.length = 0;
  now += 60_000;
  assert.deepEqual(await radar.read("whales"), first);
  assert.equal(fixture.calls.length, 0);
  now += 1;
  fixture.setHead(1005);
  const second = await radar.read("whales");
  assert.equal(second.rows.length, 27);
  assert.ok(fixture.calls.length > 0);
});

test("HTTP 429 returns unavailable and is cached without immediate retry", async () => {
  let calls = 0;
  const radar = createPositionRadar({ fetchImpl: async () => { calls += 1; return { ok: false, status: 429 }; },
    whaleSources: { ethereumRpc: POSITION_RADAR_WHALE_SOURCES.ethereumRpc } });
  const feed = await radar.read("whales");
  assert.equal(feed.status, "unavailable");
  assert.match(feed.reason, /HTTP 429/);
  assert.deepEqual(feed.rows, []);
  await radar.read("whales");
  assert.equal(calls, 1);
});

test("WHALES_FILE snapshot serves the whale API shape without polling third parties", async () => {
  const dir = path.join(tmpdir(), `nxa-whales-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, "whales.json");
  writeFileSync(file, JSON.stringify({
    status: "ok",
    updatedAt: "2026-10-14T01:00:00.000Z",
    schemaVersion: 2,
    rows: [{ id: "signal:SOL:long:cluster", category: "signal", signalType: "synchronized-long", coin: "SOL", totalUsd: 3_000_000 }],
    signals: [{ id: "signal:SOL:long:cluster", category: "signal", signalType: "synchronized-long", coin: "SOL", totalUsd: 3_000_000 }],
    sources: ["collector-fixture"],
    watchlistObservations: [{ coin: "AERO", scope: "sampled recipients", holdersBefore: 2, holdersAfter: 3 }],
    watchlistSourceStatus: [{ source: "base-rpc", status: "ok" }],
  }));
  const radar = createPositionRadar({
    whaleSnapshotFile: file,
    whaleSources: { hyperliquid: async () => { throw new Error("should not poll"); } },
    hyperliquidWallets: ["0x1111111111111111111111111111111111111111"],
  });
  const feed = await radar.read("whales");
  assert.equal(feed.status, "ok");
  assert.equal(feed.schemaVersion, 2);
  assert.equal(feed.rows[0].category, "signal");
  assert.deepEqual(feed.sources, ["collector-fixture"]);
  assert.equal(feed.watchlistObservations[0].scope, "sampled recipients");
  assert.equal(feed.watchlistSourceStatus[0].source, "base-rpc");
});

test("Hyperliquid source selects active directional whales from leaderboardRows by account value before clearinghouseState", async () => {
  const low = "0x3333333333333333333333333333333333333333";
  const high = "0x4444444444444444444444444444444444444444";
  const requested = [];
  const source = POSITION_RADAR_WHALE_SOURCES.hyperliquid;
  const rows = await source(async (url, init) => {
    if (String(url).includes("stats-data.hyperliquid.xyz")) return {
      ok: true,
      json: async () => ({
        leaderboardRows: [
          { user: low, accountValue: "3000000", windowPerformances: [["day", { pnl: "1", vlm: "10" }], ["week", { pnl: "1", vlm: "900000" }], ["month", { pnl: "1", vlm: "3000000" }]] },
          { user: high, accountValue: "9000000", windowPerformances: [["day", { pnl: "2000000", vlm: "5000000" }], ["week", { pnl: "2000000", vlm: "20000000" }], ["month", { pnl: "2000000", vlm: "90000000" }]] },
          { user: "0x5555555555555555555555555555555555555555", accountValue: "50000000", windowPerformances: [["week", { pnl: "1", vlm: "9000000000" }], ["month", { pnl: "1", vlm: "40000000000" }]] },
          { user: "0xdfc24b077bc1425ad1dea75bcb6f8158e10df303", accountValue: "180000000", windowPerformances: [["week", { pnl: "1", vlm: "90000000" }], ["month", { pnl: "1", vlm: "400000000" }]] },
        ],
      }),
    };
    const body = JSON.parse(init.body);
    if (body.type === "clearinghouseState") requested.push(body.user);
    return { ok: true, json: async () => body.type === "userFillsByTime" ? [] : ({ assetPositions: [] }) };
  }, { wallets: [] });
  assert.equal(rows.length, 2, "market-maker turnover and the HLP vault are not tracked as directional whales");
  assert.deepEqual(requested.slice(0, 2), [high, low]);
});

test("Hyperliquid fills backfill emits explicit closed PnL and dedupes fills", async () => {
  const address = "0x9999999999999999999999999999999999999999";
  const now = Date.parse("2026-10-14T05:00:00.000Z");
  let fillsCalls = 0;
  const source = POSITION_RADAR_WHALE_SOURCES.hyperliquid;
  const fetchImpl = async (_url, init) => {
    const body = JSON.parse(init.body);
    if (body.type === "clearinghouseState") return { ok: true, json: async () => ({ assetPositions: [] }) };
    if (body.type === "spotMeta") return { ok: true, json: async () => ({ tokens: [], universe: [] }) };
    assert.ok(body.type === "userFills" || (body.type === "userFillsByTime" && body.startTime <= now - 23 * 60 * 60 * 1000), "first pull is the most recent fills; later pulls cover at least 24h");
    fillsCalls += 1;
    return { ok: true, json: async () => [
      { coin: "HYPE", dir: "Open Long", px: "40", sz: "30000", startPosition: "0", time: now - 60_000, closedPnl: "0", hash: "0xopen", oid: 1, tid: 1 },
      { coin: "HYPE", dir: "Close Long", px: "42", sz: "30000", startPosition: "30000", time: now - 30_000, closedPnl: "60000", hash: "0xclose", oid: 2, tid: 2 },
      { coin: "BTC", dir: "Close Long", px: "80000", sz: "20", startPosition: "20", time: now - 20_000, closedPnl: "-100000", hash: "0xliq", oid: 3, tid: 3, liquidation: true },
    ] };
  };
  const radar = createPositionRadar({
    fetchImpl,
    now: () => now,
    whaleSources: { hyperliquid: source },
    hyperliquidWallets: [address],
    whaleSnapshotFile: null,
  });
  let feed = await radar.refresh("whales");
  const close = feed.positions.find((row) => row.coin === "HYPE" && row.eventType === "close");
  const liq = feed.positions.find((row) => row.coin === "BTC" && row.eventType === "liquidation");
  assert.equal(close.closedPnlUsd, 60_000);
  assert.equal(close.realizedPnlUsd, 60_000);
  assert.equal(liq.closedPnlUsd, -100_000);
  assert.equal(liq.liquidation, true);
  assert.ok(!feed.positions.some((row) => row.realizedPnlUsd === row.unrealizedPnlUsd && row.unrealizedPnlUsd != null));
  feed = await radar.refresh("whales");
  assert.equal(fillsCalls, 1, "fills are cached for at least five minutes per wallet");
  assert.equal(feed.positions.filter((row) => row.fillId === close.fillId).length, 1);
});

test("Hyperliquid clearinghouse baseline is not a synthetic open", async () => {
  const address = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
  const now = Date.parse("2026-10-14T06:00:00.000Z");
  let step = 0;
  const source = async () => [{
    address,
    observedAt: now + step * 60_000,
    clearinghouseState: { assetPositions: step === 0 ? [] : [{ position: { coin: "PURR", szi: "500000", positionValue: "1500000", entryPx: "3" } }] },
  }];
  const radar = createPositionRadar({ now: () => now + step * 60_000, whaleSources: { hyperliquid: source }, hyperliquidWallets: [address], whaleSnapshotFile: null });
  let feed = await radar.refresh("whales");
  assert.equal(feed.status, "unavailable");
  step = 1;
  feed = await radar.refresh("whales");
  assert.equal(feed.positions[0].eventType, "open", "a new position after a complete empty baseline is an open");

  const freshAddress = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
  const freshSource = async () => [{
    address: freshAddress,
    observedAt: now,
    clearinghouseState: { assetPositions: [{ position: { coin: "PURR", szi: "500000", positionValue: "1500000", entryPx: "3" } }] },
  }];
  const freshRadar = createPositionRadar({ now: () => now, whaleSources: { hyperliquid: freshSource }, hyperliquidWallets: [freshAddress], whaleSnapshotFile: null });
  feed = await freshRadar.refresh("whales");
  assert.equal(feed.positions[0].eventType, "position", "first observed clearinghouse position is only a baseline");
});

test("Hyperliquid tracked positions persist history and emit accumulation before transfers", async () => {
  const dir = path.join(tmpdir(), `nxa-whale-history-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const history = path.join(dir, "history.json");
  const address = "0x2222222222222222222222222222222222222222";
  const observations = [
    { now: Date.parse("2026-10-11T00:00:00.000Z"), size: "30000", notional: "1236000" },
    { now: Date.parse("2026-10-12T00:00:00.000Z"), size: "120000", notional: "4944000" },
    { now: Date.parse("2026-10-13T00:00:00.000Z"), size: "230000", notional: "9476000" },
  ];
  let i = 0;
  const source = async () => [{
    address,
    observedAt: observations[Math.min(i, observations.length - 1)].now,
    clearinghouseState: {
      assetPositions: [{
        position: { coin: "HYPE", szi: observations[Math.min(i, observations.length - 1)].size, positionValue: observations[Math.min(i, observations.length - 1)].notional, entryPx: "41.2", leverage: { value: "5" }, unrealizedPnl: "120000" },
      }],
    },
  }];
  const make = () => createPositionRadar({
    now: () => observations[Math.min(i, observations.length - 1)].now,
    whaleSources: { hyperliquid: source },
    hyperliquidWallets: [address],
    whaleHistoryFile: history,
    whaleSnapshotFile: null,
  });
  let radar = make();
  let feed = await radar.refresh("whales");
  assert.equal(feed.positions[0].eventType, "position");
  i += 1;
  feed = await radar.refresh("whales");
  assert.equal(feed.positions[0].eventType, "increase");
  i += 1;
  radar = make();
  feed = await radar.refresh("whales");
  assert.equal(feed.signals[0].signalType, "accumulation");
  assert.equal(feed.signals[0].coin, "HYPE");
  assert.equal(feed.rows[0].category, "signal");
  assert.equal(feed.positions[0].eventType, "increase");
  assert.equal(feed.signals[0].type, "accumulation");
  assert.equal(feed.signals[0].sizeUsd, feed.signals[0].totalUsd);
  assert.ok(feed.signals[0].totalUsd >= 8_000_000);
  assert.equal(typeof feed.signals[0].period, "string");
  assert.doesNotMatch(whalesBodyHtml(feed, "en"), /\[object Object\]/, "collector periods render through the real home formatter");
});

test("unchanged Hyperliquid polls do not evict multi-day addition history", async () => {
  const address = "0xcccccccccccccccccccccccccccccccccccccccc";
  const start = Date.parse("2026-10-10T00:00:00.000Z");
  let step = 0;
  const observations = [
    { offset: 0, size: "30000", notional: "1200000" },
    { offset: 86_400_000, size: "120000", notional: "4800000" },
    { offset: 2 * 86_400_000, size: "230000", notional: "9200000" },
    { offset: 3 * 86_400_000, size: "330000", notional: "13200000" },
  ];
  const current = () => observations[Math.min(step, observations.length - 1)];
  const source = async () => [{
    address,
    observedAt: start + current().offset + step,
    clearinghouseState: { assetPositions: [{ position: { coin: "HYPE", szi: current().size, positionValue: current().notional, entryPx: "40" } }] },
  }];
  const radar = createPositionRadar({ now: () => start + current().offset + step, whaleSources: { hyperliquid: source }, hyperliquidWallets: [address], whaleSnapshotFile: null });
  await radar.refresh("whales");
  step = 1; await radar.refresh("whales");
  step = 2; let feed = await radar.refresh("whales");
  assert.equal(feed.signals.find((row) => row.coin === "HYPE")?.signalType, "accumulation");
  for (let i = 0; i < 5_100; i += 1) await radar.refresh("whales");
  step = 3; feed = await radar.refresh("whales");
  assert.equal(feed.signals.find((row) => row.coin === "HYPE")?.signalType, "accumulation");
  assert.ok(feed.signals.find((row) => row.coin === "HYPE")?.totalUsd >= 10_000_000);
});

test("Hyperliquid coordinated signal uses recent increases, not baseline opens", async () => {
  const addresses = ["0x5555555555555555555555555555555555555555", "0x6666666666666666666666666666666666666666"];
  const now = Date.parse("2026-10-14T00:00:00.000Z");
  let step = 0;
  const source = async () => addresses.map((address, index) => ({
    address,
    observedAt: now + step * 60_000,
    clearinghouseState: { assetPositions: [{ position: { coin: "SOL", szi: String(step ? 60_000 + index * 1000 : 30_000 + index * 1000), positionValue: String(step ? 6_000_000 + index * 100_000 : 3_000_000 + index * 100_000), entryPx: "100" } }] },
  }));
  const radar = createPositionRadar({ now: () => now + step * 60_000, whaleSources: { hyperliquid: source }, hyperliquidWallets: addresses, whaleSnapshotFile: null });
  let feed = await radar.refresh("whales");
  assert.ok(!feed.signals.some((row) => row.type === "coordinated-long"), "first observed positions are baseline, not a 24h coordinated signal");
  step = 1;
  feed = await radar.refresh("whales");
  assert.equal(feed.signals.find((row) => row.coin === "SOL")?.type, "coordinated-long");
  assert.equal(feed.signals.find((row) => row.coin === "SOL")?.pnlUsd, null, "missing wallet PnL is unknown, not zero");
});

test("increasing one whale's short exposure is not spot distribution or a coordinated signal", async () => {
  let step = 0;
  const start = Date.parse("2026-10-10T00:00:00Z");
  const radar = createPositionRadar({ whaleSnapshotFile: null, now: () => start + step * 86_400_000, whaleSources: {
    hyperliquid: async () => [{ address: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", clearinghouseState: {
      assetPositions: [{ position: { coin: "HYPE", szi: String(-30000 * (step + 1)), positionValue: String(1200000 * (step + 1)) } }],
    } }],
  } });
  await radar.refresh("whales");
  step = 1; await radar.refresh("whales");
  step = 2; const feed = await radar.refresh("whales");
  assert.equal(feed.signals[0].type, "increase_short");
  assert.equal(feed.signals[0].walletsCount, 1);
  assert.doesNotMatch(whalesBodyHtml(feed, "zh-Hans"), /出货|同步做空|\[object Object\]/);
});

test("unknown withdrawal destinations cannot be grouped into one accumulating wallet", async () => {
  const dir = path.join(tmpdir(), `nxa-unknown-wallet-${Date.now()}`);
  mkdirSync(dir, { recursive: true });
  const history = path.join(dir, "history.json");
  const now = Date.parse("2026-10-14T02:00:00Z");
  writeFileSync(history, JSON.stringify({ transferHistory: [0, 1].map(i => ({
    id: `tx-${i}`, txid: `tx-${i}`, asset: "USDT", amountUsd: 6000000,
    direction: "from-exchange", to: { type: "unknown" }, observedAt: new Date(now - i * 3_600_000).toISOString(),
  })) }));
  const feed = await createPositionRadar({ whaleSnapshotFile: null, whaleHistoryFile: history, now: () => now, whaleSources: {} }).refresh("whales");
  assert.equal(feed.status, "unavailable");
  assert.deepEqual(feed.rows, []);
});

test("a file snapshot without collector time remains stale with unknown update time", async () => {
  const dir = path.join(tmpdir(), `nxa-unknown-time-${Date.now()}`);
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, "whales.json");
  writeFileSync(file, JSON.stringify({ signals: [{ id: "s", category: "signal", coin: "HYPE", totalUsd: 8200000 }] }));
  const feed = await createPositionRadar({ whaleSnapshotFile: file, whaleSources: {} }).refresh("whales");
  assert.equal(feed.updatedAt, null);
  assert.equal(feed.stale, true);
});

test("position accumulation segment resets after a decrease", async () => {
  const address = "0x7777777777777777777777777777777777777777";
  const observations = [
    { size: "30000", notional: "1200000" },
    { size: "120000", notional: "4800000" },
    { size: "70000", notional: "2800000" },
    { size: "230000", notional: "9200000" },
  ];
  let i = 0;
  const now = Date.parse("2026-10-10T00:00:00.000Z");
  const source = async () => [{
    address,
    observedAt: now + i * 86_400_000,
    clearinghouseState: { assetPositions: [{ position: { coin: "HYPE", szi: observations[i].size, positionValue: observations[i].notional, entryPx: "40" } }] },
  }];
  const radar = createPositionRadar({ now: () => now + i * 86_400_000, whaleSources: { hyperliquid: source }, hyperliquidWallets: [address], whaleSnapshotFile: null });
  await radar.refresh("whales");
  i = 1; await radar.refresh("whales");
  i = 2; await radar.refresh("whales");
  i = 3; const feed = await radar.refresh("whales");
  assert.ok(!feed.signals.some((row) => row.type === "accumulation" && row.coin === "HYPE"), "decrease interrupts the accumulation streak");
});

test("transfer accumulation ignores same-transaction or instant bursts", async () => {
  const to = "0x8888888888888888888888888888888888888888";
  const now = Date.parse("2026-10-14T02:00:00.000Z");
  const source = async () => [
    { source: "fixture", asset: "USDT", eventId: "same:0", hash: "same-tx", transaction_hash: "same-tx", from: exchangeAddress, to, value: 6_000_000, amountUsd: 6_000_000, timestamp: now / 1000 },
    { source: "fixture", asset: "USDT", eventId: "same:1", hash: "same-tx", transaction_hash: "same-tx", from: exchangeAddress, to, value: 7_000_000, amountUsd: 7_000_000, timestamp: now / 1000 },
  ];
  const radar = createPositionRadar({ now: () => now, whaleSources: { ethereumFixture: source }, whaleSnapshotFile: null });
  const feed = await radar.refresh("whales");
  assert.equal(feed.transfers.length, 2);
  assert.ok(!feed.signals.some((row) => row.signalType === "exchange-withdrawal-accumulation"));
});
