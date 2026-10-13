import test from "node:test";
import assert from "node:assert/strict";
import { createPositionRadar, POSITION_RADAR_WHALE_SOURCES, EXCHANGE_ADDRESS_LABELS } from "../server/position-radar.mjs";
import { rpcFixture, USDC, USDT, TRANSFER, UNKNOWN } from "./fixtures/whales-source/rpc.mjs";

const exchangeAddress = Object.keys(EXCHANGE_ADDRESS_LABELS.ethereum)[0];

test("fixture preserves 20+ rows, sourced labels, receipt status and log identity", async () => {
  const fixture = rpcFixture(exchangeAddress);
  const radar = createPositionRadar({ fetchImpl: fixture.fetchImpl, whaleSources: { ethereumRpc: POSITION_RADAR_WHALE_SOURCES.ethereumRpc } });
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
    whaleSources: { ethereumRpc: POSITION_RADAR_WHALE_SOURCES.ethereumRpc } });
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
