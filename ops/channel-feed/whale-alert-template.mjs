const ALERT_THRESHOLD_USD = 20_000_000;
const SITE = "https://nexualpha.com";
const SAFE_EXPLORER_HOSTS = new Set([
  "app.hyperliquid.xyz",
  "hyperliquid.xyz",
  "hypurrscan.io",
  "mempool.space",
  "etherscan.io",
  "www.etherscan.io",
  "tronscan.org",
  "www.tronscan.org",
  "solscan.io",
  "www.solscan.io",
]);

const escapeHtml = (value) => String(value ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;");

const compact = (parts) => parts.filter(Boolean).join(" · ");

export { ALERT_THRESHOLD_USD };

export function whaleEventUsd(event) {
  const value = event?.totalUsd ?? event?.notionalUsd ?? event?.sizeUsd ?? event?.amountUsd ?? event?.usd;
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

export function formatUsd(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return "";
  if (n >= 1e9) return `$${(n / 1e9).toFixed(n >= 10e9 ? 0 : 1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(n >= 100e6 ? 0 : 1)}M`;
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

function formatSignedUsd(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  if (n === 0) return "$0";
  return `${n > 0 ? "+" : "-"}${formatUsd(Math.abs(n))}`;
}

export function isWhaleChannelAlertEligible(event) {
  return whaleEventUsd(event) >= ALERT_THRESHOLD_USD;
}

export function safeExplorerUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(String(value));
    if (url.protocol !== "https:") return null;
    return SAFE_EXPLORER_HOSTS.has(url.hostname.toLowerCase()) ? url.href : null;
  } catch {
    return null;
  }
}

function eventKind(event) {
  const type = String(event?.signalType || event?.eventType || event?.type || event?.category || "").toLowerCase();
  if (/accumulat|build|add|建仓|加仓|同步做多/.test(type)) return "accumulation";
  if (/distribut|reduce|减仓|出货|同步做空/.test(type)) return "distribution";
  if (/transfer|exchange|withdraw|deposit/.test(type)) return "transfer";
  if (/liquidat/.test(type)) return "liquidation";
  return "position";
}

function eventAction(event) {
  const eventType = String(event?.eventType || event?.type || event?.signalType || "").toLowerCase();
  const text = `${eventType} ${event?.side || ""} ${event?.category || ""}`.toLowerCase();
  if (/increase_short|add_short/.test(eventType) || (/increase|add/.test(eventType) && /short/.test(text))) return "increase_short";
  if (/close|closed/.test(eventType)) return "close";
  if (/decrease|reduce/.test(eventType)) return "decrease";
  if (/increase|add/.test(eventType)) return "increase";
  if (/open|new/.test(eventType)) return "open";
  return eventKind(event);
}

function zhAction(action) {
  return {
    accumulation: "建仓/加仓",
    distribution: "减仓/出货",
    open: "开仓",
    increase: "加仓",
    decrease: "减仓",
    close: "平仓",
    increase_short: "加空",
    transfer: "大额转账",
    liquidation: "大额爆仓",
    position: "大额持仓",
  }[action] || "巨鲸事件";
}

function explicitPnlLine(event, action) {
  const value = event?.closedPnlUsd ?? (action === "close" ? event?.pnlUsd : event?.pnlUsd);
  return value != null && Number.isFinite(Number(value)) ? `PnL ${formatSignedUsd(value)}` : null;
}

function buildSmartMoneySection(event, usd) {
  const kind = eventKind(event);
  const action = eventAction(event);
  const coin = event?.coin || event?.asset || "UNKNOWN";
  const wallets = Number(event?.walletsCount ?? event?.walletCount ?? event?.addressesCount);
  const period = event?.period || event?.window || event?.lookback || (Number.isFinite(Number(event?.periodHours)) ? `${Number(event.periodHours)}h` : "");
  const avgEntry = event?.avgEntry ? `均价 ${event.avgEntry}` : event?.entryPx ? `入场 ${event.entryPx}` : null;
  const pnl = explicitPnlLine(event, action);
  const plain = event?.plain || event?.summary || event?.sentence;
  const walletLine = Number.isFinite(wallets) && wallets > 1
    ? `${wallets} 个钱包${period ? `在 ${period} 内` : ""}围绕 ${coin} 同向动作`
    : `${coin}${period ? ` ${period}` : ""} ${zhAction(action)}`;
  const signalLine = compact([
    walletLine,
    formatUsd(usd),
    event?.side,
    avgEntry,
    pnl,
  ]);
  const note = kind === "accumulation" || kind === "distribution" ? plain : plain;
  return [
    "<b>Smart-money accumulation</b>",
    escapeHtml(signalLine),
    escapeHtml(note),
  ].filter(Boolean).join("\n");
}

function buildLead(event, usd) {
  const action = eventAction(event);
  const coin = event?.coin || event?.asset || "UNKNOWN";
  const venue = event?.venue || event?.platform || event?.chain || event?.source || "Whale feed";
  const direction = event?.side ? ` ${event.side}` : "";
  return `${zhAction(action)}：${coin}${direction} ${formatUsd(usd)} on ${venue}`;
}

function buildDetailLines(event) {
  const time = event?.time || event?.timestamp || event?.generatedAt;
  const address = event?.address || event?.wallet || event?.from || event?.to;
  const route = event?.fromLabel || event?.toLabel ? `${event.fromLabel || "unknown"} → ${event.toLabel || "unknown"}` : null;
  const explorer = safeExplorerUrl(event?.explorerUrl);
  return [
    event?.period ? `Window: ${event.period}` : null,
    event?.leverage ? `Leverage: ${event.leverage}` : null,
    event?.entry ? `Entry: ${event.entry}` : event?.entryPx ? `Entry: ${event.entryPx}` : null,
    event?.closedPnlUsd != null && Number.isFinite(Number(event.closedPnlUsd)) ? `Closed PnL: ${formatSignedUsd(event.closedPnlUsd)}` : null,
    route ? `Route: ${route}` : null,
    address ? `Wallet: ${String(address).slice(0, 6)}…${String(address).slice(-4)}` : null,
    explorer ? `Explorer: ${explorer}` : null,
    time ? `Time: ${time}` : null,
  ].filter(Boolean).map(escapeHtml);
}

export function buildWhaleChannelAlert(event, options = {}) {
  const usd = whaleEventUsd(event);
  if (usd < ALERT_THRESHOLD_USD) return null;
  const localePath = options.locale === "zh-Hant" ? "/zh-hant" : options.locale && options.locale !== "zh-Hans" && options.locale !== "zh" ? `/${options.locale}` : "/zh-hans";
  const href = `${SITE}${localePath}/whales?src=tg-whale-alert`;
  const lines = [
    `<b>${escapeHtml(buildLead(event, usd))}</b>`,
    ...buildDetailLines(event),
    "",
    buildSmartMoneySection(event, usd),
    "",
    `<a href="${href}">查看完整巨鲸动向</a>`,
  ];
  return {
    parse_mode: "HTML",
    disable_web_page_preview: true,
    text: lines.filter((line) => line !== null && line !== undefined).join("\n").replace(/\n{3,}/g, "\n\n").trim(),
    metadata: {
      thresholdUsd: ALERT_THRESHOLD_USD,
      eventId: event?.id || null,
      kind: eventKind(event),
      action: eventAction(event),
      amountUsd: usd,
      sendPolicy: "template-only; caller must explicitly post, this module does not call Telegram APIs",
    },
  };
}
