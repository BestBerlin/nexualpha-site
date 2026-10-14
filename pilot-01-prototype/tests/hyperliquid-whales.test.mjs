import test from "node:test";
import assert from "node:assert/strict";
import {
  buildHyperliquidFillSignals,
  createHyperliquidWhaleSource,
  emptyHyperliquidState,
  foldHyperliquidFills,
  hyperliquidCoin,
  hyperliquidLiquidationEvents,
  isLiquidationOf,
  selectTrackedWhales,
  sgtDay,
  spotNamesFromMeta,
  HL_CYCLE_WEIGHT,
} from "../server/hyperliquid-whales.mjs";
import { HYPERLIQUID_CURATED_WHALES } from "../server/hyperliquid-whale-list.mjs";
import { whaleSentence } from "../src/data/whales-home.js";

const DAY = 86_400_000;
const NOW = Date.parse("2026-10-14T10:00:00.000Z");
const A = "0x7a00000000000000000000000000000000000a3f";
const B = "0x7b00000000000000000000000000000000000b3f";
const C = "0x7c00000000000000000000000000000000000c3f";
let tid = 1;
const fill = (over) => ({ coin: "HYPE", px: "41", sz: "10000", side: "B", dir: "Open Long", startPosition: "1", closedPnl: "0", hash: `0x${tid}`, oid: tid, tid: tid++, ...over });

test("curated whale list is well-formed and sourced to the official explorer", () => {
  assert.ok(HYPERLIQUID_CURATED_WHALES.length >= 100);
  const seen = new Set();
  for (const row of HYPERLIQUID_CURATED_WHALES) {
    assert.match(row.address, /^0x[0-9a-f]{40}$/);
    assert.ok(["mm", "trader"].includes(row.role));
    assert.ok(!seen.has(row.address), `duplicate ${row.address}`);
    seen.add(row.address);
  }
  assert.ok(HYPERLIQUID_CURATED_WHALES.some((row) => row.address === "0xdfc24b077bc1425ad1dea75bcb6f8158e10df303" && row.role === "mm"), "HLP vault is marked as market maker");
});

test("whale selection keeps large active directional accounts and drops vaults, market makers and dormant wallets", () => {
  const w = (address, accountValue, week, month) => ({ ethAddress: address, accountValue: String(accountValue), windowPerformances: [["week", { vlm: String(week) }], ["month", { vlm: String(month) }]] });
  const picked = selectTrackedWhales([
    w(A, 50_000_000, 10_000_000, 80_000_000),
    w(B, 9_000_000, 2_000_000, 20_000_000),
    w(C, 120_000_000, 0, 0), // dormant
    w("0x7d00000000000000000000000000000000000d3f", 40_000_000, 8e9, 40e9), // market-maker turnover
    w("0x7e00000000000000000000000000000000000e3f", 900_000, 1_000_000, 3_000_000), // too small
    w("0xdfc24b077bc1425ad1dea75bcb6f8158e10df303", 180_000_000, 9e7, 4e8), // HLP vault
  ]);
  assert.deepEqual(picked, [A, B]);
});

test("spot pairs map to token names; builder-dex and stable coins are ignored", () => {
  const names = spotNamesFromMeta({ tokens: [{ index: 0, name: "USDC" }, { index: 150, name: "HYPE" }], universe: [{ index: 107, name: "@107", tokens: [150, 0] }] });
  assert.equal(hyperliquidCoin("@107", names), "HYPE");
  assert.equal(hyperliquidCoin("@999", names), null);
  assert.equal(hyperliquidCoin("xyz:NVDA", names), null);
  assert.equal(hyperliquidCoin("btc", names), "BTC");
});

test("liquidation fills count only for the liquidated wallet", () => {
  assert.equal(isLiquidationOf({ liquidation: { liquidatedUser: A, markPx: "1", method: "market" } }, A), true);
  assert.equal(isLiquidationOf({ liquidation: { liquidatedUser: B, markPx: "1", method: "market" } }, A), false, "the liquidator side is not liquidated");
  assert.equal(isLiquidationOf({}, A), false);
});

test("fills fold into SGT day buckets once, across overlapping pages and backfill", () => {
  const hl = emptyHyperliquidState();
  const f1 = fill({ time: NOW - 2 * 3_600_000 });
  const f2 = fill({ time: NOW - 3_600_000 });
  foldHyperliquidFills(hl, [{ address: A, fills: [f1, f2] }], NOW);
  foldHyperliquidFills(hl, [{ address: A, fills: [f2] }], NOW);
  foldHyperliquidFills(hl, [{ address: A, fills: [], backfill: [fill({ time: NOW - 2 * DAY })] }], NOW);
  const buckets = Object.values(hl.buckets);
  const today = buckets.find((b) => b.d === sgtDay(NOW));
  assert.equal(today.n, 2, "the repeated fill is not counted twice");
  assert.equal(Math.round(today.oU), 820_000);
  assert.equal(buckets.length, 2, "backfill lands in its own day");
});

function accumulate(hl, address, { days = 3, coin = "HYPE", px = 41, sz = 70_000, dir = "Open Long" } = {}) {
  const fills = [];
  for (let d = days - 1; d >= 0; d -= 1) fills.push(fill({ coin, px: String(px), sz: String(sz), dir, time: NOW - d * DAY - 3_600_000 }));
  foldHyperliquidFills(hl, [{ address, fills }], NOW);
}

test("a wallet adding to the same coin on several days is a 连续加仓 signal with total, average entry and live PnL", () => {
  const hl = emptyHyperliquidState();
  accumulate(hl, A, { days: 3, coin: "SOL", px: 41 });
  hl.stateAt[A] = NOW;
  const positions = new Map([[`${A}:SOL:long`, { notionalUsd: 9_000_000, leverage: 5, unrealizedPnlUsd: 120_000 }]]);
  const [signal] = buildHyperliquidFillSignals(hl, { now: NOW, positions });
  assert.equal(signal.signalType, "accumulation");
  assert.equal(signal.days, 3);
  assert.equal(Math.round(signal.totalUsd), 3 * 41 * 70_000);
  assert.equal(Number(signal.avgEntry.toFixed(1)), 41);
  assert.equal(signal.pnlUsd, 120_000);
  assert.equal(whaleSentence(signal, "zh-Hans"), "巨鲸 0x7a00…0a3f 连续 3 天加仓 SOL 多单，累计 $8.61M，均价 $41");
  assert.equal(whaleSentence(signal, "en"), "Whale 0x7a00…0a3f added to a SOL long 3 days in a row, total $8.61M, avg $41");
});

test("a closed position or a single quiet buy is not an accumulation signal", () => {
  const closed = emptyHyperliquidState();
  accumulate(closed, A, { days: 3 });
  closed.stateAt[A] = NOW;
  assert.equal(buildHyperliquidFillSignals(closed, { now: NOW, positions: new Map() }).length, 0, "wallet already exited");
  const single = emptyHyperliquidState();
  foldHyperliquidFills(single, [{ address: A, fills: [fill({ sz: "100000", time: NOW - 3_600_000 })] }], NOW);
  assert.equal(buildHyperliquidFillSignals(single, { now: NOW }).length, 0, "one fill in one hour is not a pattern");
});

test("a sell-off after the buys breaks the streak; repeated spot selling is 出货", () => {
  const hl = emptyHyperliquidState();
  hl.spot.names = { "@107": "HYPE" };
  accumulate(hl, A, { days: 3, coin: "@107", dir: "Sell" });
  const [signal] = buildHyperliquidFillSignals(hl, { now: NOW });
  assert.equal(signal.signalType, "distribution");
  assert.equal(signal.side, "spot");
  assert.equal(signal.stealth, "sell", "repeated selling of a non-major coin is 秘密出货");
  assert.match(whaleSentence(signal, "zh-Hans"), /连续 3 天悄悄卖出 HYPE，累计 \$8\.61M/);
  const broken = emptyHyperliquidState();
  accumulate(broken, A, { days: 3 });
  foldHyperliquidFills(broken, [{ address: A, fills: [fill({ dir: "Close Long", sz: "200000", time: NOW - 60_000 })] }], NOW);
  broken.stateAt[A] = NOW;
  const positions = new Map([[`${A}:HYPE:long`, { notionalUsd: 1_000_000 }]]);
  assert.ok(!buildHyperliquidFillSignals(broken, { now: NOW, positions }).some((s) => s.signalType === "accumulation"));
});

test("three whales adding the same coin within 24h is one 同步做多 signal", () => {
  const hl = emptyHyperliquidState();
  for (const address of [A, B, C]) foldHyperliquidFills(hl, [{ address, fills: [fill({ coin: "SOL", px: "180", sz: "5000", time: NOW - 3_600_000 })] }], NOW);
  const cluster = buildHyperliquidFillSignals(hl, { now: NOW }).find((s) => s.mode === "cluster");
  assert.equal(cluster.walletsCount, 3);
  assert.equal(cluster.signalType, "coordinated-long");
  assert.equal(whaleSentence(cluster, "zh-Hans"), "3 个巨鲸 24 小时内同步做多 SOL，合计 $2.70M，均价 $180");
});

test("a fresh large position opened from zero is a 新开 signal; forced closes become liquidation rows", () => {
  const hl = emptyHyperliquidState();
  foldHyperliquidFills(hl, [{ address: A, fills: [fill({ coin: "ZEC", px: "1146", sz: "1300", startPosition: "0", time: NOW - 5 * 3_600_000 })] }], NOW);
  hl.stateAt[A] = NOW;
  const positions = new Map([[`${A}:ZEC:long`, { notionalUsd: 1_500_000, leverage: 10, entryPx: 1146 }]]);
  const fresh = buildHyperliquidFillSignals(hl, { now: NOW, positions }).find((s) => s.mode === "new");
  assert.equal(fresh.coin, "ZEC");
  assert.equal(whaleSentence(fresh, "zh-Hans"), "巨鲸 0x7a00…0a3f 新开 ZEC 多单，仓位 $1.50M，10 倍，均价 $1,146");
  foldHyperliquidFills(hl, [{ address: B, fills: [fill({ coin: "BTC", px: "80000", sz: "30", dir: "Close Long", liquidation: { liquidatedUser: B, markPx: "80000", method: "market" }, time: NOW - 60_000 })] }], NOW);
  const [liq] = hyperliquidLiquidationEvents(hl, { now: NOW });
  assert.equal(liq.address, B);
  assert.equal(liq.sizeUsd, 2_400_000);
  assert.match(whaleSentence(liq, "zh-Hans"), /BTC 多单被强平 \$2\.40M/);
});

test("the polling source stays inside its weight budget, rotates wallets and pauses after repeated failures", async () => {
  const wallets = Array.from({ length: 40 }, (_, i) => `0x${String(i + 1).padStart(40, "0")}`);
  const calls = [];
  const fetchImpl = async (_url, init) => {
    const body = JSON.parse(init.body);
    calls.push(body.type);
    if (body.type === "spotMeta") return { ok: true, json: async () => ({ tokens: [], universe: [] }) };
    if (body.type === "clearinghouseState") return { ok: true, json: async () => ({ assetPositions: [] }) };
    return { ok: true, json: async () => Array.from({ length: 2000 }, (_, i) => fill({ time: NOW - DAY + i })) };
  };
  const state = {};
  const source = createHyperliquidWhaleSource({ pauseMs: 0 });
  await source(fetchImpl, { wallets, now: NOW, state });
  const weight = calls.reduce((sum, type) => sum + (type === "clearinghouseState" ? 2 : type === "spotMeta" ? 20 : 20 + 100), 0);
  assert.ok(weight <= HL_CYCLE_WEIGHT + 120, `one cycle spends about ${HL_CYCLE_WEIGHT} weight, got ${weight}`);
  assert.ok(calls.filter((type) => type === "clearinghouseState").length >= 30, "cheap position reads cover most wallets first");
  assert.ok(state.hl.rotation > 0, "the next cycle continues with the next wallets");

  const failing = [];
  const down = async (_url, init) => { failing.push(JSON.parse(init.body).type); throw new Error("timeout"); };
  await createHyperliquidWhaleSource({ pauseMs: 0 })(down, { wallets, now: NOW, state: {} });
  assert.ok(failing.length <= 4, `stops after three failures in a row (made ${failing.length} calls)`);
});

test("秘密建仓: repeated buying of a non-major coin is highlighted, majors and one-off buys are not", async () => {
  const { whaleStealthLabel, whalesBodyHtml } = await import("../src/data/whales-home.js");
  const hl = emptyHyperliquidState();
  hl.spot.names = { "@200": "XYZ" };
  const buys = [];
  for (let d = 3; d >= 0; d -= 1) for (let k = 2; k >= 0; k -= 1) buys.push(fill({ coin: "@200", dir: "Buy", px: "0.084", sz: "2100000", time: NOW - d * DAY - (k + 1) * 3_600_000 }));
  foldHyperliquidFills(hl, [{ address: A, fills: buys }], NOW);
  foldHyperliquidFills(hl, [{ address: B, fills: [3, 2, 1, 0].map((d) => fill({ coin: "BTC", px: "80000", sz: "5", time: NOW - d * DAY - 3_600_000 })) }], NOW);
  const signals = buildHyperliquidFillSignals(hl, { now: NOW, positions: new Map([[`${B}:BTC:long`, { notionalUsd: 2_000_000 }]]) });
  hl.stateAt[B] = NOW;
  const xyz = signals.find((s) => s.coin === "XYZ");
  assert.equal(xyz.stealth, "buy");
  assert.equal(xyz.days, 4);
  assert.equal(xyz.fills, 12);
  assert.equal(signals[0].coin, "XYZ", "highlighted rows lead");
  assert.ok(!signals.some((s) => s.coin === "BTC" && s.stealth), "majors never get the badge");
  assert.equal(whaleSentence(xyz, "zh-Hans"), "巨鲸 0x7a00…0a3f 连续 4 天悄悄买入 XYZ，累计 $2.12M，均价 $0.084");
  assert.deepEqual(whaleStealthLabel(xyz, "zh-Hans"), { kind: "buy", badge: "🔺 秘密建仓", meta: "4 天 · 12 笔" });
  const html = whalesBodyHtml({ status: "ok", updatedAt: new Date(NOW).toISOString(), signals }, "zh-Hans");
  assert.match(html, /^<ol class="h7-wh-list"><li data-kind="signal" data-stealth="buy"><a href="https:\/\/app\.hyperliquid\.xyz\/explorer\/address\//, "first row is highlighted and links to the explorer");
  assert.doesNotMatch(html, /animation/);
  const single = emptyHyperliquidState();
  foldHyperliquidFills(single, [{ address: A, fills: [fill({ coin: "XYZ", px: "1", sz: "900000", time: NOW - 3_600_000 })] }], NOW);
  assert.ok(!buildHyperliquidFillSignals(single, { now: NOW }).some((s) => s.stealth), "one fill is not a quiet build-up");
});
