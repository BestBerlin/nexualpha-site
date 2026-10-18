import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildWhaleChannelAlert, isWhaleChannelAlertEligible, safeExplorerUrl, ALERT_THRESHOLD_USD, distinctWhaleCount, dryRunWhaleChannelAlerts } from "./whale-alert-template.mjs";

test("whale channel alert renders only events at or above the 20M USD threshold", () => {
  assert.equal(ALERT_THRESHOLD_USD, 20_000_000);
  assert.equal(isWhaleChannelAlertEligible({ totalUsd: 19_999_999 }), false);
  assert.equal(buildWhaleChannelAlert({ id: "small", coin: "SOL", totalUsd: 19_999_999 }), null);
  const alert = buildWhaleChannelAlert({
    id: "acc-sol-1",
    type: "accumulation",
    coin: "SOL",
    side: "同步做多",
    totalUsd: 28_400_000,
    walletsCount: 4,
    period: "24h",
    avgEntry: "$154.20",
    pnlUsd: -2_100_000,
    explanation: "4 个巨鲸在 24 小时内同步做多 SOL，且仓位继续增加。",
    venue: "Hyperliquid",
    explorerUrl: "https://app.hyperliquid.xyz/explorer/address/0x1234567890abcdef",
    time: "2026-10-14T08:42:00Z",
  });
  assert.ok(alert);
  assert.equal(alert.parse_mode, "HTML");
  assert.equal(alert.disable_web_page_preview, true);
  assert.match(alert.text, /建仓\/加仓：SOL 同步做多 \$28\.4M on Hyperliquid/);
  assert.match(alert.text, /<b>Smart-money accumulation<\/b>/);
  assert.match(alert.text, /4 个钱包在 24h 内围绕 SOL 同向动作 · \$28\.4M · 同步做多 · 均价 \$154\.20 · PnL -\$2\.1M/);
  assert.match(alert.text, /Explorer: https:\/\/app\.hyperliquid\.xyz\/explorer\/address\/0x1234567890abcdef/);
  assert.match(alert.text, /https:\/\/nexualpha\.com\/zh-hans\/whales\?src=tg-whale-alert/);
});

test("transfer alerts still include the smart-money accumulation section without inventing a signal", () => {
  const alert = buildWhaleChannelAlert({
    id: "btc-transfer",
    type: "transfer",
    asset: "BTC",
    usd: 167_000_000,
    chain: "BTC",
    fromLabel: "unknown wallet",
    toLabel: "Binance",
    time: "2026-10-14T08:42:00Z",
  });
  assert.match(alert.text, /大额转账：BTC \$167M on BTC/);
  assert.match(alert.text, /<b>Smart-money accumulation<\/b>/);
  assert.match(alert.text, /BTC 大额转账 · \$167M/);
  assert.doesNotMatch(alert.text, /24h/);
  assert.doesNotMatch(alert.text, /binance\.com\/join|accounts\.binance\.com|bitget\.com\/expressly|okx\.com\/join/i);
});

test("explorer links are fixed-host only", () => {
  assert.equal(safeExplorerUrl("https://etherscan.io/tx/0xabc"), "https://etherscan.io/tx/0xabc");
  assert.equal(safeExplorerUrl("http://etherscan.io/tx/0xabc"), null);
  assert.equal(safeExplorerUrl("https://evil.example/tx/0xabc"), null);
  const alert = buildWhaleChannelAlert({ type: "position", coin: "BTC", sizeUsd: 21_000_000, explorerUrl: "https://evil.example/tx" });
  assert.doesNotMatch(alert.text, /evil\.example/);
});

test("template accepts collector schema fields without requiring a fallback window", () => {
  const event = {
    id: "collector-position-1",
    category: "position",
    eventType: "increase",
    address: "0xabcdef1234567890",
    coin: "BTC",
    side: "long",
    notionalUsd: 22_000_000,
    leverage: "20x",
    entryPx: "$67,100",
    time: "2026-10-14T08:42:00Z",
    platform: "Hyperliquid",
    pnlUsd: 0,
  };
  const alert = buildWhaleChannelAlert(event);
  assert.match(alert.text, /加仓：BTC long \$22\.0M on Hyperliquid/);
  assert.match(alert.text, /PnL \$0/);
  assert.doesNotMatch(alert.text, /24h/);
});

test("template distinguishes position open, increase short, decrease, and close actions", () => {
  const open = buildWhaleChannelAlert({ category: "position", eventType: "open", coin: "BTC", side: "long", notionalUsd: 22_000_000, platform: "Hyperliquid" });
  assert.match(open.text, /开仓：BTC long \$22\.0M on Hyperliquid/);
  assert.equal(open.metadata.action, "open");

  const increaseShort = buildWhaleChannelAlert({ category: "position", eventType: "increase_short", coin: "ETH", side: "short", notionalUsd: 23_000_000, platform: "Hyperliquid" });
  assert.match(increaseShort.text, /加空：ETH short \$23\.0M on Hyperliquid/);
  assert.equal(increaseShort.metadata.action, "increase_short");

  const decrease = buildWhaleChannelAlert({ category: "position", eventType: "decrease", coin: "SOL", notionalUsd: 24_000_000, platform: "Hyperliquid" });
  assert.match(decrease.text, /减仓：SOL \$24\.0M on Hyperliquid/);
  assert.equal(decrease.metadata.action, "decrease");

  const close = buildWhaleChannelAlert({ category: "position", eventType: "close", coin: "HYPE", notionalUsd: 25_000_000, platform: "Hyperliquid", closedPnlUsd: -1_500_000 });
  assert.match(close.text, /平仓：HYPE \$25\.0M on Hyperliquid/);
  assert.match(close.text, /Closed PnL: -\$1\.5M/);
  assert.doesNotMatch(close.text, /大额持仓：HYPE/);
  assert.equal(close.metadata.action, "close");
});

test("template omits unknown PnL and does not let explanation override generated copy", () => {
  const alert = buildWhaleChannelAlert({
    category: "position",
    eventType: "close",
    coin: "BTC",
    notionalUsd: 26_000_000,
    platform: "Hyperliquid",
    explanation: "English source sentence should not override generated copy",
  });
  assert.match(alert.text, /平仓：BTC \$26\.0M on Hyperliquid/);
  assert.doesNotMatch(alert.text, /English source sentence/);
  assert.doesNotMatch(alert.text, /PnL/);
});

test("template accepts collector accumulation and transfer row fields", () => {
  const accumulation = buildWhaleChannelAlert({
    id: "row-signal-1",
    category: "signal",
    signalType: "accumulation",
    platform: "Hyperliquid",
    coin: "HYPE",
    totalUsd: 33_000_000,
    walletsCount: 3,
    periodHours: 72,
    avgEntry: "$41.2",
    pnlUsd: 1_200_000,
  });
  assert.match(accumulation.text, /3 个钱包在 72h 内围绕 HYPE 同向动作 · \$33\.0M/);
  assert.match(accumulation.text, /PnL \+\$1\.2M/);

  const transfer = buildWhaleChannelAlert({
    id: "row-transfer-1",
    category: "transfer",
    asset: "USDT",
    amountUsd: 45_000_000,
    chain: "ETH",
    fromLabel: "unknown wallet",
    toLabel: "Binance",
  });
  assert.match(transfer.text, /大额转账：USDT \$45\.0M on ETH/);
});

test("whale alert template is template-only and never posts to Telegram", () => {
  const src = readFileSync(new URL("./whale-alert-template.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(src, /api\.telegram\.org|sendMessage|fetch\s*\(/);
  assert.match(src, /template-only/);
});

test("秘密建仓 alerts lead with the badge, the site sentence and the explorer link (template only)", async () => {
  const { buildWhaleChannelAlert } = await import("./whale-alert-template.mjs");
  const event = { id: "s", category: "signal", signalType: "accumulation", mode: "add", stealth: "buy", side: "spot", days: 4, fills: 12, coin: "XYZ", address: "0x7a00000000000000000000000000000000000a3f", totalUsd: 21_000_000, avgEntry: 0.084, explorerUrl: "https://app.hyperliquid.xyz/explorer/address/0x7a00000000000000000000000000000000000a3f" };
  const alert = buildWhaleChannelAlert(event);
  assert.match(alert.text, /^<b>🔺 秘密建仓<\/b> · 4 天 · 12 笔\n巨鲸 0x7a00…0a3f 连续 4 天悄悄买入 XYZ，累计 \$21\.0M，均价 \$0\.084/);
  assert.match(alert.text, /app\.hyperliquid\.xyz\/explorer\/address/);
  assert.equal(alert.metadata.kind, "stealth-buy");
  assert.equal(buildWhaleChannelAlert({ ...event, totalUsd: 400_000 }), null);
});

const whaleAddresses = [1, 2, 3].map((n) => `0x${String(n).padStart(40, "0")}`);

test("sub-20M confluence requires three distinct observed whales and a directional window", () => {
  const event = { id: "confluence", coin: "XYZ", signalType: "accumulation", totalUsd: 700_000, periodHours: 24, addresses: whaleAddresses };
  assert.equal(isWhaleChannelAlertEligible(event), true);
  const alert = buildWhaleChannelAlert(event);
  assert.equal(alert.metadata.eligibility, "confluence");
  assert.equal(alert.metadata.distinctWhales, 3);
  assert.match(alert.text, /3 个钱包/);
  assert.equal(buildWhaleChannelAlert({ ...event, addresses: whaleAddresses.slice(0, 2), walletsCount: 99 }), null);
  assert.equal(buildWhaleChannelAlert({ ...event, addresses: undefined, walletsCount: 3 }), null);
  assert.equal(buildWhaleChannelAlert({ ...event, periodHours: undefined }), null);
  assert.equal(buildWhaleChannelAlert({ ...event, periodHours: Infinity, period: " " }), null);
  assert.equal(buildWhaleChannelAlert({ ...event, signalType: "transfer" }), null);
  assert.equal(buildWhaleChannelAlert({ ...event, signalType: "address_update" }), null);
  assert.equal(buildWhaleChannelAlert({ ...event, coin: undefined }), null);
});

test("distinct identity counting rejects placeholders and deduplicates EVM case variants", () => {
  const address = `0x${"a".repeat(40)}`;
  assert.equal(distinctWhaleCount({ addresses: [address, address.toUpperCase(), "unknown", null, {}, ""] }), 1);
  assert.equal(distinctWhaleCount({ whaleAddresses }), 3);
});

test("dry run previews eligible events once and reports zero sends", () => {
  const event = { id: "large", coin: "ETH", amountUsd: 20_000_000 };
  const events = [event, { ...event }, { id: "small", amountUsd: 19_000_000 }];
  const snapshot = JSON.stringify(events);
  const preview = dryRunWhaleChannelAlerts(events);
  assert.equal(preview.dryRun, true);
  assert.equal(preview.sent, 0);
  assert.equal(preview.inputCount, 3);
  assert.equal(preview.alerts.length, 1);
  assert.equal(preview.alerts[0].metadata.eligibility, "size");
  assert.equal(JSON.stringify(events), snapshot);
  assert.throws(() => dryRunWhaleChannelAlerts(null), TypeError);
});

test("amount gating rejects malformed values and accepts nullable collector fallbacks", () => {
  for (const totalUsd of [null, NaN, Infinity, -20_000_000, [20_000_000], {}, "invalid"]) {
    assert.equal(isWhaleChannelAlertEligible({ totalUsd }), false);
  }
  assert.equal(isWhaleChannelAlertEligible({ totalUsd: null, amountUsd: "20000000" }), true);
});
