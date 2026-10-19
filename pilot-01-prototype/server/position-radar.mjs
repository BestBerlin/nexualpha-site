import { radarSourceStale } from './source-freshness.mjs';
// Server-only long/short and whale-transfer radar reader.
//
// Terms/source notes checked 2026-10-13:
// - mempool.space: https://mempool.space/terms-of-service and https://mempool.space/docs/api/rest.
//   Published terms reviewed via the official repository's terms-of-service component; no redistribution restriction
//   identified. Public API limits are unspecified; HTTP 429 can lead to a ban. BTC remains bounded and cached.
// - PublicNode: https://www.publicnode.com/terms section B grants RPC access but also restricts redistribution and
//   extraction. Commercial display permission remains unresolved. Retained under the brief's explicit fallback.
// - Blockscout was NOT enabled: https://eaas.blockscout.com/terms-and-conditions sections 3/18 grant intended-purpose
//   access, not an explicit commercial redistribution licence. https://docs.blockscout.com/devs/apis/requests-and-limits
//   announces per-instance API deprecation July 1; archived default keyless limit is 300 req/min/IP (not a guarantee).
//   https://mail.blockscout.com/p/news-july-1-is-pro-api-day confirms July 1, 2026 migration to the keyed PRO API.
// - RPC fallback: combined USDT/USDC filters, non-overlapping general/exchange ranges, incremental cursor, and
//   rolling 3-hour retention. See docs/whales-source-review.md for before/after payload counts and promotion options.
// - Hyperliquid: https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint documents the
//   public `POST https://api.hyperliquid.xyz/info` endpoint, including `clearinghouseState` for account positions and
//   `userFillsByTime`/`userFills`. Only explicitly configured tracked addresses are queried; no synthetic leaderboard
//   addresses are invented when the Gemini input files are absent.
// - Label rule: exact addresses from exchanges' own published proof-of-reserves wallet lists (see
//   exchange-address-labels.mjs, one source URL per address). Unknown addresses stay "unknown"; exchange-transfer
//   direction never means sale.
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { EXCHANGE_ADDRESS_LABEL_ROWS } from "./exchange-address-labels.mjs";
import { enrichWhaleSignals } from "./whale-signal-quality.mjs";
import { buildHyperliquidFillSignals, createHyperliquidWhaleSource, foldHyperliquidFills, hyperliquidLiquidationEvents, isLiquidationOf, normalizeHyperliquidState } from "./hyperliquid-whales.mjs";

const UA = "NexuAlphaPositionRadar/1.0 (+https://nexualpha.com)";
const MAX_TTL_MS = 60_000;
const DEFAULT_TIMEOUT_MS = 3_000;
const DEFAULT_LIMIT = 30;

export const POSITION_RADAR_KINDS = Object.freeze(["long-short", "whales"]);

export const POSITION_RADAR_SOURCE_LIMITATIONS = Object.freeze({
  "long-short": [
    "Exchange long/short ratios are venue-published derivatives metrics, not a complete market-wide positioning record.",
    "Open-interest units differ by venue; the row-level headline uses the reference venue only and never averages non-comparable OI units.",
    "Top symbols are selected by Binance USDT-M 24h turnover, falling back to Bybit linear USDT turnover when Binance is unavailable; per-venue ratios remain separate.",
  ],
  whales: [
    "Hyperliquid rows come only from configured tracked wallet addresses; when the address loader has no entries, the feed reports the gap instead of fabricating whale activity.",
    "Hyperliquid closed PnL is emitted only from documented fill.closedPnl rows returned by userFillsByTime; unrealized PnL is never re-labelled as realized PnL.",
    "Hyperliquid liquidation rows are skipped unless a public fill payload carries an explicit liquidation field; REST fill direction text alone is not treated as proof of liquidation.",
    "Accumulation and distribution signals are computed from this process's persisted observations and bounded Hyperliquid fill backfill, so a fresh collector starts with transfer/position facts before multi-day intent signals mature.",
    "BTC rows are output-level samples from bounded transaction-detail lookups; a whole transaction total is not treated as one transfer.",
    "ETH/USDT/USDC rows are sampled from a bounded keyless Ethereum RPC lookback, not a complete chain index.",
    "Only exact addresses from the maintained sourced label list receive labels; all others remain unknown.",
    "A transfer to an exchange is an address-flow fact, not evidence of a sale.",
  ],
});

const labelMap = (chain) => Object.freeze(Object.fromEntries((EXCHANGE_ADDRESS_LABEL_ROWS[chain] || []).map((entry) => [
  chain === "ethereum" ? entry.address.toLowerCase() : entry.address,
  Object.freeze({ label: entry.label, owner: entry.owner, type: "exchange", source: entry.source, reviewedAt: entry.reviewedAt }),
])));

export const EXCHANGE_ADDRESS_LABELS = Object.freeze({
  btc: labelMap("btc"),
  ethereum: labelMap("ethereum"),
});

const WHALE_RETENTION_MS = 3 * 60 * 60 * 1000;
const WHALE_HISTORY_RETENTION_MS = 14 * 24 * 60 * 60 * 1000;
const WHALE_MAX_ROWS = 60;
const WHALE_MAX_HISTORY_ROWS = 5000;
const WHALE_MAX_SIGNALS = 24;
const WHALE_MAX_POSITIONS = 60;
// Cold start: native ETH reads full blocks (heavy), so it keeps a short lookback; all USDT/USDC Transfer logs use a
// medium lookback; logs touching a labelled exchange address are topic-filtered server side, so they are cheap and
// use a long lookback. Later refreshes only scan blocks after the cursor.
const ETH_NATIVE_LOOKBACK = 10;
const ETH_LOG_LOOKBACK = 50;
const ETH_EXCHANGE_LOG_LOOKBACK = 300;
const ETH_MAX_CATCH_UP = 50;
const LOG_CHUNK_BLOCKS = 100;
const EXCHANGE_LOG_CHUNK_BLOCKS = 300;
const EXCHANGE_TOPIC_BATCH = 100;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const finite = (value) => {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};
const pctChange = (latest, first) => (latest == null || first == null || first === 0 ? null : ((latest - first) / Math.abs(first)) * 100);
const upperSymbol = (symbol) => String(symbol || "").replace(/USDT$/i, "").replace(/-USDT-SWAP$/i, "").toUpperCase();
const isoFromTime = (value) => {
  if (value == null || value === "") return null;
  const n = finite(value);
  const date = n == null ? new Date(value) : new Date(n < 10_000_000_000 ? n * 1000 : n);
  return Number.isFinite(date.valueOf()) ? date.toISOString() : null;
};

function unavailableFeed(kind, sources, reason) {
  return {
    kind,
    status: "unavailable",
    updatedAt: null,
    rows: [],
    sources,
    limitations: POSITION_RADAR_SOURCE_LIMITATIONS[kind],
    ...(reason ? { reason } : {}),
  };
}

async function getJson(url, fetchImpl, { timeoutMs = DEFAULT_TIMEOUT_MS, init = {} } = {}) {
  const res = await fetchImpl(url, {
    ...init,
    headers: { accept: "application/json", "user-agent": UA, ...(init.headers || {}) },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function topTurnoverSymbols(payload, { limit = DEFAULT_LIMIT } = {}) {
  const rows = Array.isArray(payload) ? payload : payload?.result?.list || [];
  return rows
    .map((row) => ({
      symbol: upperSymbol(row.symbol || row.instId),
      marketSymbol: String(row.symbol || row.instId || ""),
      turnoverUsd: finite(row.quoteVolume ?? row.turnover24h ?? row.volCcy24h),
    }))
    .filter((row) => row.symbol && row.marketSymbol.endsWith("USDT") && row.turnoverUsd != null)
    .sort((a, b) => b.turnoverUsd - a.turnoverUsd)
    .slice(0, limit);
}

function asList(payload) {
  return Array.isArray(payload) ? payload : payload?.data || payload?.result?.list || payload?.rows || [];
}

function chronological(list, timeAt) {
  return [...list].sort((a, b) => (finite(timeAt(a)) || 0) - (finite(timeAt(b)) || 0));
}

function maybeSeries(value, time) {
  const v = finite(value);
  if (v == null) return null;
  return { value: v, time: finite(time) };
}

function normalizeRatioSeries(payload, venue) {
  const rows = asList(payload);
  if (venue === "okx") {
    return chronological(rows, (row) => row?.[0] ?? row?.ts ?? row?.timestamp)
      .map((row) => maybeSeries(Array.isArray(row) ? row[1] : row?.ratio ?? row?.longShortRatio, Array.isArray(row) ? row[0] : row?.ts ?? row?.timestamp))
      .filter(Boolean);
  }
  if (venue === "bybit") {
    return chronological(rows, (row) => row?.timestamp)
      .map((row) => {
        const direct = finite(row?.longShortRatio ?? row?.longShortAccountRatio ?? row?.ratio);
        if (direct != null) return { value: direct, time: finite(row?.timestamp) };
        const buy = finite(row?.buyRatio);
        const sell = finite(row?.sellRatio);
        return buy != null && sell ? { value: buy / sell, time: finite(row?.timestamp) } : null;
      })
      .filter(Boolean);
  }
  return chronological(rows, (row) => row?.timestamp)
    .map((row) => maybeSeries(row?.longShortRatio ?? row?.longShortAccountRatio ?? row?.ratio ?? row?.value, row?.timestamp))
    .filter(Boolean);
}

function normalizeOiSeries(payload, venue) {
  const rows = asList(payload);
  if (venue === "okx") {
    return chronological(rows, (row) => row?.[0] ?? row?.ts ?? row?.timestamp)
      .slice(-25)
      .map((row) => maybeSeries(Array.isArray(row) ? row[1] : row?.oi ?? row?.openInterest, Array.isArray(row) ? row[0] : row?.ts ?? row?.timestamp))
      .filter(Boolean);
  }
  return chronological(rows, (row) => row?.timestamp)
    .slice(-25)
    .map((row) => maybeSeries(row?.sumOpenInterestValue ?? row?.openInterestValue ?? row?.openInterest ?? row?.oi ?? row?.value, row?.timestamp))
    .filter(Boolean);
}

function dayChange(series) {
  if (series.length < 2) return null;
  const first = series[0];
  const last = series.at(-1);
  if (first.time == null || last.time == null) return null;
  if (last.time - first.time < 24 * 60 * 60 * 1000) return null;
  return pctChange(last.value, first.value);
}

function venueSnapshot(venue, { account, topTrader, oi }) {
  const accountSeries = normalizeRatioSeries(account, venue);
  const topSeries = normalizeRatioSeries(topTrader, venue);
  const oiSeries = normalizeOiSeries(oi, venue);
  const latestOi = oiSeries.at(-1)?.value ?? null;
  return {
    venue,
    accountLongShortRatio: accountSeries.at(-1)?.value ?? null,
    topTraderLongShortRatio: topSeries.at(-1)?.value ?? null,
    openInterest: latestOi,
    openInterestUsd: venue === "binance" || venue === "okx" ? latestOi : null,
    openInterestUnit: venue === "binance" || venue === "okx" ? "USD" : "base-coin",
    openInterestChange24hPct: dayChange(oiSeries),
    sparkline24h: oiSeries.slice(-24).map((row) => row.value),
    status: accountSeries.length || topSeries.length || oiSeries.length ? "ok" : "unavailable",
  };
}

export const POSITION_RADAR_LONG_SHORT_SOURCES = Object.freeze({
  binance: {
    async topSymbols(fetchImpl, { limit }) {
      return topTurnoverSymbols(await getJson("https://fapi.binance.com/fapi/v1/ticker/24hr", fetchImpl), { limit });
    },
    async symbol(fetchImpl, symbol) {
      const contract = `${symbol}USDT`;
      const [account, topTrader, oi] = await Promise.all([
        getJson(`https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=${contract}&period=1h&limit=25`, fetchImpl),
        getJson(`https://fapi.binance.com/futures/data/topLongShortPositionRatio?symbol=${contract}&period=1h&limit=25`, fetchImpl),
        getJson(`https://fapi.binance.com/futures/data/openInterestHist?symbol=${contract}&period=1h&limit=25`, fetchImpl),
      ]);
      return venueSnapshot("binance", { account, topTrader, oi });
    },
  },
  okx: {
    async symbol(fetchImpl, symbol) {
      const [account, oi] = await Promise.all([
        getJson(`https://www.okx.com/api/v5/rubik/stat/contracts/long-short-account-ratio?ccy=${symbol}&period=1H`, fetchImpl),
        getJson(`https://www.okx.com/api/v5/rubik/stat/contracts/open-interest-volume?ccy=${symbol}&period=1H`, fetchImpl),
      ]);
      return venueSnapshot("okx", { account, topTrader: null, oi });
    },
  },
  bybit: {
    async topSymbols(fetchImpl, { limit }) {
      return topTurnoverSymbols(await getJson("https://api.bybit.com/v5/market/tickers?category=linear", fetchImpl), { limit });
    },
    async symbol(fetchImpl, symbol) {
      const contract = `${symbol}USDT`;
      const [account, oi] = await Promise.all([
        getJson(`https://api.bybit.com/v5/market/account-ratio?category=linear&symbol=${contract}&period=60min&limit=24`, fetchImpl),
        getJson(`https://api.bybit.com/v5/market/open-interest?category=linear&symbol=${contract}&intervalTime=1h&limit=25`, fetchImpl),
      ]);
      return { ...venueSnapshot("bybit", { account, topTrader: null, oi }), openInterestUnit: symbol };
    },
  },
});

async function buildLongShort({ fetchImpl, now, limit, sources, interSymbolDelayMs }) {
  const sourceEntries = Object.entries(sources);
  let symbols;
  let selectionVenue;
  const deniedVenues = new Map();
  for (const [venue, source] of sourceEntries) {
    if (typeof source.topSymbols !== "function") continue;
    try {
      const candidates = await source.topSymbols(fetchImpl, { limit });
      if (candidates?.length) { symbols = candidates; selectionVenue = venue; break; }
    } catch (error) {
      if (/HTTP (?:403|418|429|451)/.test(error.message || "")) deniedVenues.set(venue, error);
    }
  }
  if (!symbols?.length) return unavailableFeed("long-short", Object.keys(sources), "top-symbols-unavailable");

  const rows = [];
  const symbolsGrouped = [];
  for (const base of symbols.slice(0, limit)) {
    const venues = [];
    for (const [venue, source] of sourceEntries) {
      if (typeof source.symbol !== "function") continue;
      try {
        if (deniedVenues.has(venue)) throw deniedVenues.get(venue);
        venues.push(await source.symbol(fetchImpl, base.symbol));
      } catch (error) {
        if (/HTTP (?:403|418|429|451)/.test(error.message || "")) deniedVenues.set(venue, error);
        venues.push({
          venue,
          accountLongShortRatio: null,
          topTraderLongShortRatio: null,
          openInterest: null,
          openInterestUnit: null,
          openInterestChange24hPct: null,
          sparkline24h: [],
          status: "unavailable",
          error: String(error?.message || error),
        });
      }
    }
    const reference = venues.find((row) => row.venue === "binance" && row.status === "ok") || venues.find((row) => row.status === "ok") || null;
    const grouped = {
      symbol: base.symbol,
      turnoverUsd: base.turnoverUsd,
      referenceVenue: reference?.venue || null,
      accountLongShortRatio: reference?.accountLongShortRatio ?? null,
      topTraderLongShortRatio: reference?.topTraderLongShortRatio ?? null,
      openInterest: reference?.openInterest ?? null,
      openInterestUsd: reference?.openInterestUsd ?? null,
      openInterestUnit: reference?.openInterestUnit ?? null,
      openInterestChange24hPct: reference?.openInterestChange24hPct ?? null,
      sparkline24h: reference?.sparkline24h || [],
      venues,
    };
    symbolsGrouped.push(grouped);
    for (const venueRow of venues) rows.push({ symbol: base.symbol, turnoverUsd: base.turnoverUsd, ...venueRow });
    if (interSymbolDelayMs) await sleep(interSymbolDelayMs);
  }

  return {
    kind: "long-short",
    status: rows.some(row => row.status === "ok") ? "ok" : "unavailable",
    selectionVenue,
    updatedAt: new Date(now).toISOString(),
    ttlSeconds: Math.floor(MAX_TTL_MS / 1000),
    rows,
    symbols: symbolsGrouped,
    sources: Object.keys(sources),
    limitations: POSITION_RADAR_SOURCE_LIMITATIONS["long-short"],
  };
}

function labelAddress(chain, address) {
  const key = chain === "ethereum" ? String(address || "").toLowerCase() : String(address || "");
  const source = EXCHANGE_ADDRESS_LABELS[chain]?.[key] || null;
  return source ? { address: key, label: source.label, owner: source.owner, type: source.type, source: source.source } : { address: key || null, label: "unknown", owner: "unknown", type: "unknown", source: null };
}

function direction(from, to) {
  const fromExchange = from.type === "exchange";
  const toExchange = to.type === "exchange";
  if (toExchange && !fromExchange) return "to-exchange";
  if (fromExchange && !toExchange) return "from-exchange";
  if (from.type === "wallet" && to.type === "wallet") return "wallet-to-wallet";
  return "unknown";
}

function btcInputAddress(tx) {
  const inputs = Array.isArray(tx.vin) ? tx.vin : [];
  const addresses = [...new Set(inputs.map((input) => input?.prevout?.scriptpubkey_address).filter(Boolean))];
  if (inputs.length && inputs.every(input => input?.prevout?.scriptpubkey_address) && addresses.length === 1) return addresses[0];
  return null;
}

function normalizeBtcMempool(payload, { btcUsd, minBtc }) {
  const rows = Array.isArray(payload) ? payload : payload?.transactions || [];
  return rows.flatMap((tx) => {
    const outputs = Array.isArray(tx.vout) ? tx.vout : [];
    const from = labelAddress("btc", btcInputAddress(tx) || tx.from || null);
    return outputs.map((out, outputIndex) => {
      const sats = finite(out.value);
      const btc = sats == null ? null : sats / 100_000_000;
      const to = labelAddress("btc", out.scriptpubkey_address || tx.to);
      return {
        id: `${tx.txid || tx.hash}:${outputIndex}`,
        category: "transfer",
        type: "transfer",
        explorerUrl: `https://mempool.space/tx/${tx.txid || tx.hash}`,
        chain: "bitcoin",
        asset: "BTC",
        txid: tx.txid || tx.hash || null,
        amount: btc,
        amountUsd: btc != null && btcUsd ? btc * btcUsd : null,
        sizeUsd: btc != null && btcUsd ? btc * btcUsd : null,
        from,
        to,
        time: isoFromTime(tx.status?.block_time ?? tx.firstSeen ?? tx.time),
        direction: direction(from, to),
        ownerRule: "transfer to an exchange is not a sale",
        source: "mempool.space",
      };
    });
  }).filter((row) => row.amount != null && row.amount >= minBtc);
}

function normalizeEthTransfers(payload, { minEth, minUsd, ethUsd = null }) {
  const records = asList(payload);
  return records.map((tx) => {
    const rawAsset = String(tx.asset || tx.token_symbol || tx.tokenSymbol || (tx.contract === "native" ? "ETH" : "")).toUpperCase();
    const asset = rawAsset || (tx.contract_address ? "ERC20" : "ETH");
    const decimals = finite(tx.decimals ?? tx.token_decimals) ?? (asset === "USDT" || asset === "USDC" ? 6 : 18);
    const declaredRaw = finite(tx.rawValue ?? tx.raw_value);
    const amount = declaredRaw != null ? declaredRaw / 10 ** decimals : finite(tx.value ?? tx.amount ?? tx.quantity);
    const declaredUsd = finite(tx.amountUsd ?? tx.valueUsd ?? tx.usd);
    // ETH uses the collector's public ETH/USD mid. Stablecoins keep their face amount only (no USD price is claimed).
    const amountUsd = declaredUsd ?? (amount != null && asset === "ETH" && finite(ethUsd) ? amount * ethUsd : null);
    const from = labelAddress("ethereum", tx.sender || tx.from || tx.from_address);
    const to = labelAddress("ethereum", tx.recipient || tx.to || tx.to_address);
    const txid = tx.transaction_hash || tx.hash || tx.txid || null;
    return {
      id: tx.eventId || txid,
      category: "transfer",
      type: "transfer",
      explorerUrl: `https://etherscan.io/tx/${tx.transaction_hash || tx.hash || tx.txid}`,
      chain: "ethereum",
      asset,
      txid,
      eventId: tx.eventId || null,
      amount,
      amountUsd,
      sizeUsd: amountUsd,
      from,
      to,
      time: isoFromTime(tx.time ?? tx.timestamp ?? tx.block_time),
      direction: direction(from, to),
      ownerRule: "transfer to an exchange is not a sale",
      source: tx.source || "injected",
    };
  }).filter((row) => {
    if (row.amount == null) return false;
    if (row.asset === "ETH") return row.amount >= minEth;
    if (row.asset === "USDT" || row.asset === "USDC") return row.amount >= minUsd;
    return row.amountUsd != null && row.amountUsd >= minUsd;
  });
}

function normalizeTronTransfers(payload, { minUsd }) {
  const records = Array.isArray(payload) ? payload : Array.isArray(payload?.token_transfers) ? payload.token_transfers : [];
  return records.map((tx) => {
    const token = tx.tokenInfo || {};
    const asset = String(token.tokenAbbr || tx.token_abbr || tx.asset || "USDT").toUpperCase();
    const decimals = finite(token.tokenDecimal ?? tx.tokenDecimal) ?? 6;
    const amount = finite(tx.amount ?? tx.value) ?? (tx.quant != null ? Number(BigInt(String(tx.quant))) / 10 ** decimals : null);
    const amountUsd = finite(tx.amountUsd ?? tx.valueUsd ?? tx.usd) ?? ((asset === "USDT" || asset === "USDC") && amount != null ? amount : null);
    const fromTag = tx.from_address_tag?.from_address_tag || tx.from_address_tag?.from_address_tag_name || tx.from_address_tag?.name || null;
    const toTag = tx.to_address_tag?.to_address_tag || tx.to_address_tag?.to_address_tag_name || tx.to_address_tag?.name || null;
    const from = { address: tx.from_address || tx.from || null, label: fromTag || "unknown", owner: fromTag || "unknown", type: fromTag ? "exchange" : "unknown", source: fromTag ? "tronscan-address-tag" : null };
    const to = { address: tx.to_address || tx.to || null, label: toTag || "unknown", owner: toTag || "unknown", type: toTag ? "exchange" : "unknown", source: toTag ? "tronscan-address-tag" : null };
    const txid = tx.transaction_id || tx.hash || tx.txid || null;
    return {
      id: txid,
      category: "transfer",
      type: "transfer",
      explorerUrl: txid ? `https://tronscan.org/#/transaction/${txid}` : null,
      chain: "tron",
      asset,
      txid,
      amount,
      amountUsd,
      sizeUsd: amountUsd,
      from,
      to,
      time: isoFromTime(tx.block_ts ?? tx.timestamp ?? tx.time),
      direction: direction(from, to),
      ownerRule: "transfer to an exchange is not a sale",
      source: tx.source || "tronscan",
    };
  }).filter((row) => row.txid && row.amountUsd != null && row.amountUsd >= minUsd);
}

const isEthAddress = (value) => /^0x[0-9a-fA-F]{40}$/.test(String(value || ""));
const sideFromSize = (value) => {
  const n = finite(value);
  if (n == null || n === 0) return null;
  return n > 0 ? "long" : "short";
};
const posKey = (row) => `${String(row.address || "").toLowerCase()}:${String(row.coin || "").toUpperCase()}:${row.side}`;
const observedAt = (row) => {
  const t = Date.parse(row?.observedAt || row?.time || row?.seenAt || "");
  return Number.isFinite(t) ? t : 0;
};
const compactAddress = (address) => {
  const raw = String(address || "");
  return raw.length > 12 ? `${raw.slice(0, 6)}…${raw.slice(-4)}` : raw;
};

function emptyWhaleState() {
  return {
    ethCursor: null,
    rows: new Map(),
    positions: new Map(),
    positionHistory: [],
    positionFillIds: new Set(),
    observedPositionWallets: new Set(),
    transferHistory: [],
    hl: normalizeHyperliquidState(null),
  };
}

function normalizeWhaleState(state = {}) {
  return {
    ethCursor: Number.isFinite(state.ethCursor) ? state.ethCursor : null,
    rows: state.rows instanceof Map ? state.rows : new Map(Object.entries(state.rows || {})),
    positions: state.positions instanceof Map ? state.positions : new Map(Object.entries(state.positions || {})),
    positionHistory: Array.isArray(state.positionHistory) ? state.positionHistory : [],
    positionFillIds: state.positionFillIds instanceof Set ? state.positionFillIds : new Set(Array.isArray(state.positionFillIds) ? state.positionFillIds : []),
    observedPositionWallets: state.observedPositionWallets instanceof Set ? state.observedPositionWallets : new Set(Array.isArray(state.observedPositionWallets) ? state.observedPositionWallets : []),
    transferHistory: Array.isArray(state.transferHistory) ? state.transferHistory : [],
    hl: normalizeHyperliquidState(state.hl),
  };
}

function serializeWhaleState(state) {
  return {
    ethCursor: Number.isFinite(state?.ethCursor) ? state.ethCursor : null,
    rows: Object.fromEntries(state?.rows instanceof Map ? state.rows : []),
    positions: Object.fromEntries(state?.positions instanceof Map ? state.positions : []),
    positionHistory: (Array.isArray(state?.positionHistory) ? state.positionHistory : []).slice(-WHALE_MAX_HISTORY_ROWS),
    positionFillIds: [...(state?.positionFillIds instanceof Set ? state.positionFillIds : new Set())].slice(-WHALE_MAX_HISTORY_ROWS),
    observedPositionWallets: [...(state?.observedPositionWallets instanceof Set ? state.observedPositionWallets : new Set())].slice(-WHALE_MAX_HISTORY_ROWS),
    transferHistory: (Array.isArray(state?.transferHistory) ? state.transferHistory : []).slice(-WHALE_MAX_HISTORY_ROWS),
    hl: normalizeHyperliquidState(state?.hl),
  };
}

function readWhaleStateFile(file) {
  if (!file) return emptyWhaleState();
  try {
    return normalizeWhaleState(JSON.parse(readFileSync(file, "utf8")));
  } catch {
    return emptyWhaleState();
  }
}

function writeWhaleStateFile(file, state, log) {
  if (!file) return;
  try {
    mkdirSync(path.dirname(file), { recursive: true });
    const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
    writeFileSync(tmp, `${JSON.stringify(serializeWhaleState(state))}\n`);
    renameSync(tmp, file);
  } catch (error) {
    log(`whale history: ${error?.message || error}`);
  }
}

function readWhaleSnapshotFile(file, now = Date.now()) {
  if (!file) return null;
  try {
    const payload = JSON.parse(readFileSync(file, "utf8"));
    if (!payload || typeof payload !== "object" || payload.status === "unavailable") return null;
    const rows = Array.isArray(payload.rows) ? payload.rows : [];
    const signals = Array.isArray(payload.signals) ? payload.signals : rows.filter((row) => row?.category === "signal");
    const positions = Array.isArray(payload.positions) ? payload.positions : rows.filter((row) => row?.category === "position");
    const transfers = Array.isArray(payload.transfers) ? payload.transfers : rows.filter((row) => row?.chain || row?.category === "transfer");
    if (!signals.length && !positions.length && !transfers.length && !rows.length) return null;
    const updatedAt = typeof payload.updatedAt === "string" ? payload.updatedAt : null;
    const dataUpdatedAt = payload.dataUpdatedAt || payload.generatedAt || updatedAt;
    const stale = radarSourceStale({ ...payload, dataUpdatedAt }, now);
    return {
      kind: "whales",
      status: "ok",
      ttlSeconds: Math.floor(MAX_TTL_MS / 1000),
      updatedAt,
      dataUpdatedAt,
      ...(stale ? { stale: true } : {}),
      schemaVersion: Number.isFinite(Number(payload.schemaVersion)) ? Number(payload.schemaVersion) : 2,
      rows: rows.length ? rows.slice(0, WHALE_MAX_ROWS) : [...signals, ...positions, ...transfers].slice(0, WHALE_MAX_ROWS),
      signals: signals.slice(0, WHALE_MAX_SIGNALS),
      positions: positions.slice(0, WHALE_MAX_POSITIONS),
      transfers: transfers.slice(0, WHALE_MAX_ROWS),
      watchlistObservations: Array.isArray(payload.watchlistObservations) ? payload.watchlistObservations : [],
      watchlistSourceStatus: Array.isArray(payload.watchlistSourceStatus) ? payload.watchlistSourceStatus : [],
      labelSources: Array.isArray(payload.labelSources) ? payload.labelSources : [],
      sourceDocs: Array.isArray(payload.sourceDocs) ? payload.sourceDocs : [],
      sources: Array.isArray(payload.sources) ? payload.sources : ["WHALES_FILE"],
      limitations: Array.isArray(payload.limitations) ? payload.limitations : POSITION_RADAR_SOURCE_LIMITATIONS.whales,
      errors: Array.isArray(payload.errors) ? payload.errors : [],
      fileSource: file,
    };
  } catch {
    return null;
  }
}

function normalizeHyperliquidPositionRows(payload, { now, minNotional = 1_000_000, includeBelowThreshold = false }) {
  const wallets = Array.isArray(payload) ? payload : payload?.wallets || payload?.rows || [];
  return wallets.flatMap((wallet) => {
    const address = String(wallet.user || wallet.address || wallet.account || "").toLowerCase();
    if (!isEthAddress(address)) return [];
    const state = wallet.clearinghouseState || wallet.state || (Array.isArray(wallet.positions) ? wallet : null);
    if (!state) return [];
    const positions = Array.isArray(state?.assetPositions) ? state.assetPositions : Array.isArray(wallet.positions) ? wallet.positions : [];
    return positions.map((entry) => {
      const position = entry?.position || entry;
      const coin = String(position.coin || entry?.coin || "").toUpperCase();
      const signedSize = finite(position.szi ?? position.size ?? position.positionSize);
      const side = sideFromSize(signedSize);
      const notionalUsd = Math.abs(finite(position.positionValue ?? position.notionalUsd ?? position.notional) || 0);
      // Builder-deployed perp dexs ("xyz:NVDA") reuse tickers outside the main market; only main perps are shown.
      if (!coin || coin.includes(":") || !side || (!includeBelowThreshold && notionalUsd < minNotional)) return null;
      const leverage = typeof position.leverage === "object" ? finite(position.leverage.value) : finite(position.leverage);
      const observedIso = isoFromTime(wallet.observedAt || wallet.time || now) || new Date(now).toISOString();
      return {
        id: `hl:${address}:${coin}:${side}`,
        category: "position",
        type: "position",
        platform: "hyperliquid",
        source: wallet.source || "hyperliquid-info",
        explorerUrl: `https://app.hyperliquid.xyz/explorer/address/${address}`,
        time: observedIso,
        observedAt: observedIso,
        address,
        label: wallet.label || compactAddress(address),
        coin,
        side,
        size: Math.abs(signedSize),
        notionalUsd,
        sizeUsd: notionalUsd,
        leverage,
        entryPx: finite(position.entryPx ?? position.entryPrice),
        markPx: finite(position.markPx ?? position.oraclePx),
        unrealizedPnlUsd: finite(position.unrealizedPnl ?? position.uPnl ?? position.pnl),
      };
    }).filter(Boolean);
  });
}

function classifyPositionEvent(current, previous, walletPreviouslyObserved = false) {
  if (!previous) return walletPreviouslyObserved ? "open" : "position";
  const prev = Math.abs(finite(previous.size) || 0);
  const next = Math.abs(finite(current.size) || 0);
  if (next > prev * 1.05) return "increase";
  if (next < prev * 0.95) return "decrease";
  return "unchanged";
}

function pruneHistory(state, now) {
  const cutoff = now - WHALE_HISTORY_RETENTION_MS;
  state.positionHistory = (state.positionHistory || []).filter((row) => observedAt(row) >= cutoff).slice(-WHALE_MAX_HISTORY_ROWS);
  state.positionFillIds = new Set((state.positionHistory || []).map((row) => row.fillId).filter(Boolean));
  state.transferHistory = (state.transferHistory || []).filter((row) => observedAt(row) >= cutoff).slice(-WHALE_MAX_HISTORY_ROWS);
}

function appendPositionHistory(state, positions, now, completeAddresses = []) {
  const nowIso = new Date(now).toISOString();
  const events = [];
  const observedWallets = state.observedPositionWallets || (state.observedPositionWallets = new Set());
  for (const current of positions) {
    const key = posKey(current);
    const address = String(current.address || "").toLowerCase();
    const previous = state.positions.get(key) || null;
    const eventType = classifyPositionEvent(current, previous, observedWallets.has(address));
    const row = { ...current, type: eventType, eventType, sizeUsd: current.sizeUsd ?? current.notionalUsd, previousNotionalUsd: previous?.notionalUsd ?? null, observedAt: current.observedAt || nowIso };
    if (eventType === "unchanged") {
      state.positions.set(key, { ...previous, ...current, type: "position", eventType: "position", lastEventType: previous?.eventType || previous?.lastEventType || null, sizeUsd: current.sizeUsd ?? current.notionalUsd, previousNotionalUsd: previous?.previousNotionalUsd ?? null, observedAt: current.observedAt || nowIso });
      continue;
    }
    state.positions.set(key, row);
    state.positionHistory.push(row);
    events.push(row);
  }
  for (const address of completeAddresses || []) {
    const normalized = String(address || "").toLowerCase();
    if (isEthAddress(normalized)) observedWallets.add(normalized);
  }
  pruneHistory(state, now);
  return events;
}

function hyperliquidFillId(address, fill) {
  return ["hlfill", address, fill?.tid ?? "", fill?.hash ?? "", fill?.oid ?? "", fill?.time ?? ""].join(":");
}

function explicitLiquidationField(fill, address) {
  // Hyperliquid fills carry `liquidation: { liquidatedUser, markPx, method }`; only the liquidated wallet's own fill counts.
  return isLiquidationOf(fill, address) || fill?.isLiquidation === true || fill?.liquidated === true || fill?.eventType === "liquidation" || fill?.type === "liquidation";
}

function normalizeHyperliquidFillEvents(payload, { minNotional = 1_000_000 } = {}) {
  const wallets = Array.isArray(payload) ? payload : payload?.wallets || payload?.rows || [];
  const out = [];
  for (const wallet of wallets) {
    const address = String(wallet.user || wallet.address || wallet.account || "").toLowerCase();
    if (!isEthAddress(address)) continue;
    const fills = Array.isArray(wallet.fills) ? wallet.fills : [];
    for (const fill of fills) {
      const rawCoin = String(fill?.coin || "");
      if (!rawCoin || rawCoin.startsWith("@") || rawCoin.includes(":") || rawCoin.includes("/")) continue;
      const dir = String(fill?.dir || "").toLowerCase();
      const coin = rawCoin.toUpperCase();
      const side = dir.includes("short") ? "short" : dir.includes("long") ? "long" : null;
      if (!side) continue;
      const px = finite(fill?.px);
      const fillSize = Math.abs(finite(fill?.sz) || 0);
      const startSize = Math.abs(finite(fill?.startPosition) || 0);
      if (!px || !fillSize) continue;
      const fillNotionalUsd = Math.abs(px * fillSize);
      if (fillNotionalUsd < minNotional) continue;
      const opens = dir.includes("open");
      const closes = dir.includes("close");
      const liquidation = explicitLiquidationField(fill, address);
      if (!opens && !closes && !liquidation) continue;
      const nextSize = opens ? startSize + fillSize : Math.max(0, startSize - fillSize);
      const eventType = liquidation ? "liquidation" : opens ? (startSize > 0 ? "increase" : "open") : (nextSize <= 0 ? "close" : "decrease");
      const closedPnlUsd = (closes || liquidation) ? finite(fill?.closedPnl) : null;
      const time = isoFromTime(fill?.time) || new Date().toISOString();
      const fillId = hyperliquidFillId(address, fill);
      out.push({
        id: fillId,
        fillId,
        category: "position",
        type: eventType,
        eventType,
        platform: "hyperliquid",
        source: "hyperliquid-userFillsByTime",
        explorerUrl: `https://app.hyperliquid.xyz/explorer/address/${address}`,
        time,
        observedAt: time,
        address,
        label: compactAddress(address),
        coin,
        side,
        size: nextSize,
        fillSize,
        notionalUsd: Math.abs(nextSize * px),
        sizeUsd: fillNotionalUsd,
        fillSizeUsd: fillNotionalUsd,
        previousNotionalUsd: Math.abs(startSize * px),
        entryPx: px,
        markPx: px,
        closedPnlUsd,
        realizedPnlUsd: closedPnlUsd,
        liquidation,
        txHash: fill?.hash || null,
        orderId: fill?.oid ?? null,
        tradeId: fill?.tid ?? null,
      });
    }
  }
  return out.sort((a, b) => observedAt(a) - observedAt(b));
}

function appendPositionFillHistory(state, walletPayloads, now, { minNotional = 1_000_000 } = {}) {
  const events = [];
  const seen = state.positionFillIds || (state.positionFillIds = new Set());
  for (const row of normalizeHyperliquidFillEvents(walletPayloads, { minNotional })) {
    if (row.fillId && seen.has(row.fillId)) continue;
    if (row.fillId) seen.add(row.fillId);
    const key = posKey(row);
    state.positionHistory.push(row);
    if (row.eventType === "close" || row.eventType === "liquidation" || Math.abs(finite(row.size) || 0) === 0) {
      state.positions.delete(key);
    } else {
      state.positions.set(key, row);
    }
    events.push(row);
  }
  pruneHistory(state, now);
  return events;
}

function appendClosedPositionEvents(state, currentPositions, completeAddresses, now) {
  const currentKeys = new Set(currentPositions.map(posKey));
  const complete = new Set((completeAddresses || []).map((address) => String(address).toLowerCase()).filter(isEthAddress));
  const nowIso = new Date(now).toISOString();
  const events = [];
  for (const [key, previous] of state.positions) {
    if (!complete.has(String(previous.address || "").toLowerCase()) || currentKeys.has(key)) continue;
    const closed = { ...previous, type: "close", eventType: "close", size: 0, notionalUsd: 0, sizeUsd: previous.sizeUsd ?? previous.notionalUsd, previousNotionalUsd: previous.notionalUsd, observedAt: nowIso, time: nowIso };
    state.positions.delete(key);
    state.positionHistory.push(closed);
    events.push(closed);
  }
  pruneHistory(state, now);
  return events;
}

function appendTransferHistory(state, transfers, now) {
  const nowIso = new Date(now).toISOString();
  const seen = new Set(state.transferHistory.map((row) => row.eventId || row.id || row.txid).filter(Boolean));
  for (const row of transfers) {
    const key = row.eventId || row.id || row.txid;
    if (key && seen.has(key)) continue;
    if (key) seen.add(key);
    state.transferHistory.push({ ...row, observedAt: row.seenAt || row.time || nowIso });
  }
  pruneHistory(state, now);
}

function buildPositionSignals(state, now, { minNotional = 1_000_000 } = {}) {
  const signals = [];
  const byWallet = new Map();
  for (const row of state.positionHistory || []) {
    const key = posKey(row);
    if (!byWallet.has(key)) byWallet.set(key, []);
    byWallet.get(key).push(row);
  }
  for (const [key, rows] of byWallet) {
    const sorted = rows.sort((a, b) => observedAt(a) - observedAt(b));
    const interruptedAt = sorted.findLastIndex((row) => row.eventType === "decrease" || row.eventType === "close");
    const inc = sorted.slice(interruptedAt + 1).filter((row) => row.eventType === "position" || row.eventType === "open" || row.eventType === "increase");
    if (inc.length < 3) continue;
    const first = inc[0], last = inc.at(-1);
    const deltaSize = Math.abs(finite(last.size) || 0) - Math.abs(finite(first.size) || 0);
    const lastUnitUsd = Math.abs(finite(last.size) || 0) > 0 ? (finite(last.notionalUsd) || 0) / Math.abs(finite(last.size) || 0) : (finite(last.entryPx) || 0);
    const deltaUsd = Math.abs(deltaSize * lastUnitUsd);
    if (deltaSize <= 0 || deltaUsd < minNotional) continue;
    const periodHours = Math.max(1, Math.round((observedAt(last) - observedAt(first)) / 3_600_000));
    signals.push({
      id: `signal:${key}:accumulation`,
      category: "signal",
      type: last.side === "long" ? "accumulation" : "increase_short",
      signalType: last.side === "long" ? "accumulation" : "increase_short",
      label: last.side === "long" ? "加仓" : "加仓空单",
      source: "hyperliquid-history",
      platform: "hyperliquid",
      time: last.observedAt || new Date(now).toISOString(),
      coin: last.coin,
      side: last.side,
      walletsCount: 1,
      addresses: [last.address],
      address: last.address,
      totalUsd: deltaUsd,
      sizeUsd: deltaUsd,
      deltaSize,
      observationCount: inc.length,
      periodHours,
      period: `${periodHours}h`,
      avgEntry: finite(last.entryPx),
      pnlUsd: finite(last.unrealizedPnlUsd),
      explorerUrl: `https://app.hyperliquid.xyz/explorer/address/${last.address}`,
      explanation: `${compactAddress(last.address)} ${periodHours}h ${last.side === "long" ? "added" : "increased short"} ${last.coin} by $${Math.round(deltaUsd).toLocaleString("en-US")}.`,
    });
  }
  const recentCutoff = now - 24 * 60 * 60 * 1000;
  const current = (state.positionHistory || [])
    .filter((row) => row.eventType === "increase" && observedAt(row) >= recentCutoff && (finite(row.notionalUsd) || 0) >= minNotional);
  const byCoinSide = new Map();
  for (const row of current) {
    const key = `${row.coin}:${row.side}`;
    if (!byCoinSide.has(key)) byCoinSide.set(key, []);
    byCoinSide.get(key).push(row);
  }
  for (const [key, rows] of byCoinSide) {
    const unique = [...new Map(rows.map((row) => [row.address, row])).values()];
    if (unique.length < 2) continue;
    const totalUsd = unique.reduce((sum, row) => sum + (finite(row.notionalUsd) || 0), 0);
    if (totalUsd < minNotional * 2) continue;
    const [coin, side] = key.split(":");
    signals.push({
      id: `signal:${coin}:${side}:cluster`,
      category: "signal",
      type: side === "long" ? "coordinated-long" : "coordinated-short",
      signalType: side === "long" ? "coordinated-long" : "coordinated-short",
      label: side === "long" ? "同步做多" : "同步做空",
      source: "hyperliquid-history",
      platform: "hyperliquid",
      time: new Date(Math.max(...unique.map(observedAt))).toISOString(),
      coin,
      side,
      walletsCount: unique.length,
      addresses: unique.map((row) => row.address),
      address: unique[0]?.address || null,
      totalUsd,
      sizeUsd: totalUsd,
      periodHours: 24,
      period: "24h",
      avgEntry: null,
      pnlUsd: unique.every((row) => finite(row.unrealizedPnlUsd) != null)
        ? unique.reduce((sum, row) => sum + finite(row.unrealizedPnlUsd), 0) : null,
      explorerUrl: unique[0]?.address ? `https://app.hyperliquid.xyz/explorer/address/${unique[0].address}` : null,
      explanation: `${unique.length} tracked Hyperliquid wallets are ${side} ${coin}, total $${Math.round(totalUsd).toLocaleString("en-US")}.`,
    });
  }
  return signals.sort((a, b) => (finite(b.totalUsd) || 0) - (finite(a.totalUsd) || 0)).slice(0, WHALE_MAX_SIGNALS);
}

function buildTransferSignals(state, { minUsd = 5_000_000 } = {}) {
  const groups = new Map();
  for (const row of state.transferHistory || []) {
    if (row.direction !== "from-exchange" || row.to?.type === "exchange") continue;
    if (!row.to?.address) continue;
    const usd = finite(row.amountUsd);
    if (usd == null || usd < minUsd) continue;
    const toAddress = row.to?.address || "unknown";
    const key = `${row.asset}:${toAddress}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  const out = [];
  for (const [key, rows] of groups) {
    rows.sort((a, b) => observedAt(a) - observedAt(b));
    const distinctTx = new Set(rows.map((row) => row.txid || row.eventId || row.id).filter(Boolean));
    if (distinctTx.size < 2 || observedAt(rows.at(-1)) - observedAt(rows[0]) < 30 * 60 * 1000) continue;
    const totalUsd = rows.reduce((sum, row) => sum + (finite(row.amountUsd) || 0), 0);
    const last = rows.at(-1);
    const periodHours = Math.max(1, Math.round((observedAt(last) - observedAt(rows[0])) / 3_600_000));
    out.push({
      id: `signal:${key}:exchange-withdrawal`,
      category: "signal",
      type: "accumulation",
      signalType: "exchange-withdrawal-accumulation",
      label: "建仓",
      source: "transfer-history",
      platform: last.chain,
      time: last.observedAt || last.time,
      coin: last.asset,
      walletsCount: 1,
      addresses: [last.to?.address].filter(Boolean),
      address: last.to?.address || null,
      totalUsd,
      sizeUsd: totalUsd,
      periodHours,
      period: `${periodHours}h`,
      avgEntry: null,
      transferCount: distinctTx.size,
      explorerUrl: last.explorerUrl || null,
      explanation: `${rows.length} large ${last.asset} withdrawals from exchange labels to the same non-exchange wallet, total $${Math.round(totalUsd).toLocaleString("en-US")}.`,
    });
  }
  return out.sort((a, b) => (finite(b.totalUsd) || 0) - (finite(a.totalUsd) || 0)).slice(0, WHALE_MAX_SIGNALS);
}

const ETH_RPC_URL = "https://ethereum-rpc.publicnode.com";
const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const USDT_CONTRACT = "0xdac17f958d2ee523a2206206994597c13d831ec7";
const USDC_CONTRACT = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
const hex = (n) => `0x${n.toString(16)}`;
const hexNumber = (value) => Number.parseInt(String(value || "0x0"), 16);
const hexBigInt = (value) => BigInt(value || "0x0");
const topicAddress = (topic) => `0x${String(topic || "").slice(-40)}`.toLowerCase();
const tokenAmount = (data, decimals) => Number(hexBigInt(data)) / 10 ** decimals;

async function rpc(fetchImpl, method, params = []) {
  const res = await fetchImpl(ETH_RPC_URL, {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json", "user-agent": UA },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`ethereum rpc HTTP ${res.status}`);
  const body = await res.json();
  if (body.error) throw new Error(body.error.message || "ethereum rpc error");
  return body.result;
}

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      out[index] = await fn(items[index], index);
    }
  });
  await Promise.all(workers);
  return out;
}

// Incremental: `state.ethCursor` remembers the last scanned block so a refresh only reads new blocks.
const addressTopic = (address) => `0x${"0".repeat(24)}${String(address).toLowerCase().replace(/^0x/, "")}`;
const blockRanges = (from, to, size) => {
  const ranges = [];
  for (let start = from; start <= to; start += size) ranges.push([start, Math.min(to, start + size - 1)]);
  return ranges;
};

async function ethereumRpcTransfers(fetchImpl, {
  nativeLookback = ETH_NATIVE_LOOKBACK,
  logLookback = ETH_LOG_LOOKBACK,
  exchangeLogLookback = ETH_EXCHANGE_LOG_LOOKBACK,
  maxCatchUp = ETH_MAX_CATCH_UP,
  minEth = 250,
  minUsd = 1_000_000,
  maxReceipts = 20,
  exchangeAddresses = Object.keys(EXCHANGE_ADDRESS_LABELS.ethereum),
  state = null,
} = {}) {
  const head = hexNumber(await rpc(fetchImpl, "eth_blockNumber"));
  const latest = Math.max(0, head - 2);
  const cursor = state && Number.isFinite(state.ethCursor) ? state.ethCursor : null;
  if (cursor != null && cursor >= latest) return [];
  const startAt = (lookback) => (cursor != null ? Math.max(cursor + 1, latest - maxCatchUp) : Math.max(0, latest - lookback));
  const from = startAt(nativeLookback);
  const logFrom = startAt(logLookback);
  const exchangeFrom = startAt(exchangeLogLookback);
  const blocks = new Map();
  const blockFor = async (n, full = false) => {
    if (!full && blocks.has(n)) return blocks.get(n);
    const block = await rpc(fetchImpl, "eth_getBlockByNumber", [hex(n), full]);
    if (block) blocks.set(n, block);
    return block;
  };
  const out = [];
  let receiptsRead = 0;
  const numbers = Array.from({ length: latest - from + 1 }, (_, i) => from + i);
  const fullBlocks = await mapLimit(numbers, 4, (n) => blockFor(n, true));
  const minWei = BigInt(Math.ceil(minEth * 1e6)) * 10n ** 12n;
  for (const block of fullBlocks) {
    const timestamp = hexNumber(block?.timestamp);
    for (const tx of block?.transactions || []) {
      const wei = hexBigInt(tx.value);
      if (wei >= minWei && receiptsRead < maxReceipts) {
        receiptsRead += 1;
        const receipt = await rpc(fetchImpl, "eth_getTransactionReceipt", [tx.hash]);
        if (receipt?.status === "0x1") out.push({ source: "publicnode-ethereum-rpc", asset: "ETH", hash: tx.hash, from: tx.from, to: tx.to, value: Number(wei) / 1e18, timestamp });
      }
    }
  }
  const minRaw = BigInt(Math.ceil(minUsd)) * 10n ** 6n;
  const exchangeTopics = [...new Set(exchangeAddresses.map((a) => String(a).toLowerCase()).filter((a) => /^0x[0-9a-f]{40}$/.test(a)))].map(addressTopic);
  const seen = new Set();
  const qualifying = [];
  const contracts = [USDT_CONTRACT, USDC_CONTRACT];
  const logs = [];
  for (const [start, end] of blockRanges(logFrom, latest, LOG_CHUNK_BLOCKS)) logs.push(...(await rpc(fetchImpl, "eth_getLogs", [{ fromBlock: hex(start), toBlock: hex(end), address: contracts, topics: [TRANSFER_TOPIC] }]) || []));
  // The general scan already includes every exchange flow in its range. Only request older exchange logs.
  // On warm refreshes these ranges coincide, so no labelled-address request is necessary.
  const exchangeEnd = Math.min(latest, logFrom - 1);
  for (let i = 0; i < exchangeTopics.length && exchangeFrom <= exchangeEnd; i += EXCHANGE_TOPIC_BATCH) {
    const batch = exchangeTopics.slice(i, i + EXCHANGE_TOPIC_BATCH);
    for (const [start, end] of blockRanges(exchangeFrom, exchangeEnd, EXCHANGE_LOG_CHUNK_BLOCKS)) {
      for (const topics of [[TRANSFER_TOPIC, batch], [TRANSFER_TOPIC, null, batch]]) {
        logs.push(...(await rpc(fetchImpl, "eth_getLogs", [{ fromBlock: hex(start), toBlock: hex(end), address: contracts, topics }]) || []));
      }
    }
  }
  for (const entry of logs) {
    const address = String(entry.address || "").toLowerCase();
    if (entry.removed || !contracts.includes(address) || entry.topics?.[0] !== TRANSFER_TOPIC) continue;
    const eventKey = `${entry.transactionHash}:${entry.logIndex || "0x0"}`;
    if (seen.has(eventKey)) continue;
    seen.add(eventKey);
    if (hexBigInt(entry.data) < minRaw) continue;
    qualifying.push({ asset: address === USDT_CONTRACT ? "USDT" : "USDC", decimals: 6, entry, eventKey });
  }
  // Keep only the newest events before reading block headers, so a cold start stays bounded.
  qualifying.sort((a, b) => hexNumber(b.entry.blockNumber) - hexNumber(a.entry.blockNumber));
  qualifying.splice(WHALE_MAX_ROWS);
  const headerNumbers = [...new Set(qualifying.map(({ entry }) => hexNumber(entry.blockNumber)))];
  await mapLimit(headerNumbers, 4, (n) => blockFor(n, false));
  for (const { asset, decimals, entry, eventKey } of qualifying) {
    const block = blocks.get(hexNumber(entry.blockNumber));
    out.push({
      source: "publicnode-ethereum-rpc",
      asset,
      transaction_hash: entry.transactionHash,
      eventId: eventKey,
      from: topicAddress(entry.topics?.[1]),
      to: topicAddress(entry.topics?.[2]),
      value: tokenAmount(entry.data, decimals),
      timestamp: hexNumber(block?.timestamp),
    });
  }
  if (state) state.ethCursor = latest;
  return out;
}

export const POSITION_RADAR_WHALE_SOURCES = Object.freeze({
  hyperliquid: createHyperliquidWhaleSource(),
  btcMempool: async (fetchImpl, { minBtc = 50, maxTxDetails = 10 } = {}) => {
    const recent = await getJson("https://mempool.space/api/mempool/recent", fetchImpl);
    const candidates = (Array.isArray(recent) ? recent : [])
      .filter((tx) => (finite(tx.value) || 0) / 100_000_000 >= minBtc)
      .slice(0, maxTxDetails);
    return Promise.all(candidates.map((tx) => getJson(`https://mempool.space/api/tx/${encodeURIComponent(tx.txid)}`, fetchImpl)));
  },
  ethereumRpc: ethereumRpcTransfers,
  tronTronscan: async (fetchImpl, { minUsd = 5_000_000 } = {}) => {
    const url = new URL("https://apilist.tronscanapi.com/api/token_trc20/transfers");
    url.searchParams.set("contract_address", "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t");
    url.searchParams.set("start", "0");
    url.searchParams.set("limit", "50");
    url.searchParams.set("confirm", "0");
    const rows = await getJson(url.href, fetchImpl);
    return { ...rows, source: "tronscan", minUsd };
  },
});

async function buildWhales({ fetchImpl, now, sources, minBtc, minEth, minUsd, minPositionUsd, btcUsd, ethUsd = null, state, hyperliquidWallets, whaleSnapshotFile, log }) {
  const fileSnapshot = readWhaleSnapshotFile(whaleSnapshotFile, now);
  if (fileSnapshot) return fileSnapshot;
  const transfers = [];
  const positionEvents = [];
  const errors = [];
  await Promise.all([
    (async () => {
      try {
        if (typeof sources.hyperliquid === "function") {
          const rawWallets = await sources.hyperliquid(fetchImpl, { wallets: hyperliquidWallets, minNotional: minPositionUsd, now, state });
          positionEvents.push(...appendPositionFillHistory(state, rawWallets, now, { minNotional: minPositionUsd }));
          foldHyperliquidFills(state.hl || (state.hl = normalizeHyperliquidState(null)), Array.isArray(rawWallets) ? rawWallets : rawWallets?.wallets || rawWallets?.rows || [], now);
          const allPositions = normalizeHyperliquidPositionRows(rawWallets, { now, minNotional: minPositionUsd, includeBelowThreshold: true });
          // Only wallets whose clearinghouseState came back this cycle are complete; fills-only entries never imply a close.
          const completeAddresses = [...new Set((Array.isArray(rawWallets) ? rawWallets : rawWallets?.wallets || rawWallets?.rows || [])
            .filter((wallet) => wallet && (wallet.clearinghouseState || wallet.state || Array.isArray(wallet.positions)))
            .map((wallet) => String(wallet?.user || wallet?.address || wallet?.account || "").toLowerCase()).filter(isEthAddress))];
          positionEvents.push(...appendPositionHistory(state, allPositions, now, completeAddresses));
          positionEvents.push(...appendClosedPositionEvents(state, allPositions, completeAddresses, now));
        }
      } catch (error) {
        errors.push(`hyperliquid: ${error?.message || error}`);
      }
    })(),
    (async () => {
      try {
        if (typeof sources.btcMempool === "function") transfers.push(...normalizeBtcMempool(await sources.btcMempool(fetchImpl, { minBtc }), { btcUsd, minBtc }));
      } catch (error) {
        errors.push(`btc: ${error?.message || error}`);
      }
    })(),
    (async () => {
      try {
        for (const [name, source] of Object.entries(sources)) {
          if (!name.startsWith("ethereum") || typeof source !== "function") continue;
          transfers.push(...normalizeEthTransfers(await source(fetchImpl, { minEth, minUsd, state }), { minEth, minUsd, ethUsd }));
        }
      } catch (error) {
        errors.push(`ethereum: ${error?.message || error}`);
      }
    })(),
    (async () => {
      try {
        for (const [name, source] of Object.entries(sources)) {
          if (!name.startsWith("tron") || typeof source !== "function") continue;
          transfers.push(...normalizeTronTransfers(await source(fetchImpl, { minUsd, state }), { minUsd }));
        }
      } catch (error) {
        errors.push(`tron: ${error?.message || error}`);
      }
    })(),
  ]);
  // An exchange moving coins between its own wallets is housekeeping, not a whale move.
  const internal = (row) => row.from?.type === "exchange" && row.to?.type === "exchange" && row.from?.owner && row.from.owner === row.to?.owner;
  for (let i = transfers.length - 1; i >= 0; i -= 1) if (internal(transfers[i])) transfers.splice(i, 1);
  const sourceNames = Object.keys(sources).map(name => name === "hyperliquid" ? "Hyperliquid info" : name === "btcMempool" ? "mempool.space" : name === "ethereumRpc" ? "PublicNode Ethereum RPC" : name === "tronTronscan" ? "Tronscan" : name);
  if (state) {
    // Rolling window: merge this refresh's rows with earlier ones (dedupe by event id) and drop rows first seen more than 3h ago.
    const history = state.rows || (state.rows = new Map());
    const nowIso = new Date(now).toISOString();
    for (const row of transfers) {
      const key = row.eventId || row.id;
      history.set(key, { ...row, seenAt: history.get(key)?.seenAt || nowIso });
    }
    const cutoff = now - WHALE_RETENTION_MS;
    // Retention uses first-seen time so a lagging chain timestamp never evicts a row we just read.
    const at = (row) => { const t = Date.parse(row.seenAt || row.time || ""); return Number.isFinite(t) ? t : 0; };
    for (const [key, row] of history) if (at(row) < cutoff) history.delete(key);
    if (history.size > WHALE_MAX_ROWS * 3) {
      const keep = [...history.entries()].sort((a, b) => at(b[1]) - at(a[1])).slice(0, WHALE_MAX_ROWS * 3);
      history.clear();
      for (const [key, row] of keep) history.set(key, row);
    }
    transfers.splice(0, transfers.length, ...history.values());
    appendTransferHistory(state, transfers, now);
  }
  const fillSignals = buildHyperliquidFillSignals(state.hl, { now, positions: state.positions || new Map(), minUsd: minPositionUsd });
  const fillKeys = new Set(fillSignals.map((row) => `${row.address}:${row.coin}:${row.side}`));
  // Snapshot-diff signals are only a fallback for wallets whose fills are not available: fills say exactly what was
  // added and when, snapshots only that the position grew.
  const fillsSeen = (address) => Boolean(state.hl?.fillsAt?.[String(address || "").toLowerCase()]);
  const anyFills = Object.keys(state.hl?.fillsAt || {}).length > 0;
  const snapshotSignals = buildPositionSignals(state, now, { minNotional: minPositionUsd })
    .filter((row) => !(row.walletsCount === 1 && (fillKeys.has(`${row.address}:${row.coin}:${row.side}`) || fillsSeen(row.address))))
    .filter((row) => !(row.walletsCount > 1 && (anyFills || fillSignals.some((fill) => fill.walletsCount > 1 && fill.coin === row.coin && fill.side === row.side))));
  const signals = enrichWhaleSignals([...fillSignals, ...snapshotSignals.sort((a, b) => (finite(b.totalUsd) || 0) - (finite(a.totalUsd) || 0)), ...buildTransferSignals(state, { minUsd })])
    .slice(0, WHALE_MAX_SIGNALS);
  positionEvents.push(...hyperliquidLiquidationEvents(state.hl, { now, minUsd: minPositionUsd }));
  const currentPositions = [...(state.positions?.values?.() || [])].filter((row) => (finite(row.notionalUsd) || 0) >= minPositionUsd);
  // Keep the last 24h of position changes across cycles: wallets are polled in rotation, so an event must outlive the
  // cycle that detected it. The latest change per wallet/coin/side wins.
  const recentChanges = (state.positionHistory || []).filter((row) => row.eventType && row.eventType !== "position" && row.eventType !== "unchanged" && now - observedAt(row) <= 24 * 60 * 60 * 1000);
  const qualifyingPositionEvents = [...recentChanges, ...positionEvents]
    .filter((row) => row.eventType !== "liquidation" || !String(row.id || "").startsWith("hl-liq:"))
    .filter((row) => (finite(row.sizeUsd ?? row.notionalUsd) || 0) >= minPositionUsd)
    .sort((a, b) => observedAt(a) - observedAt(b));
  if (!signals.length && !currentPositions.length && !qualifyingPositionEvents.length && !transfers.length) {
    return unavailableFeed("whales", sourceNames, errors.length ? errors.join("; ") : "no-whale-data");
  }
  const sortAt = (row) => { const t = Date.parse(row.time || row.seenAt || ""); return Number.isFinite(t) ? t : 0; };
  transfers.sort((a, b) => sortAt(b) - sortAt(a));
  // The same transfer can arrive twice (overlapping scans); keep one row per tx/asset/amount/route.
  const transferKey = (row) => [row.txid || row.id, row.asset, row.amount, row.from?.address, row.to?.address].join("|");
  const seenTransfers = new Set();
  for (let i = 0; i < transfers.length; i += 1) {
    const key = transferKey(transfers[i]);
    if (seenTransfers.has(key)) { transfers.splice(i, 1); i -= 1; } else seenTransfers.add(key);
  }
  const positionByKey = new Map(currentPositions.map((row) => [posKey(row), row]));
  for (const event of qualifyingPositionEvents) positionByKey.set(posKey(event), event);
  for (const event of positionEvents) if (event.eventType === "liquidation" && (finite(event.sizeUsd) || 0) >= minPositionUsd) positionByKey.set(event.id, event);
  // Recent changes (open / add / reduce / close / liquidation) first, newest first; then the largest held positions.
  const isChange = (row) => row.eventType && row.eventType !== "position" && row.eventType !== "unchanged" && now - sortAt(row) <= 24 * 60 * 60 * 1000;
  const positions = [...positionByKey.values()]
    .sort((a, b) => (isChange(b) - isChange(a)) || (isChange(a) ? sortAt(b) - sortAt(a) : (finite(b.notionalUsd ?? b.sizeUsd) || 0) - (finite(a.notionalUsd ?? a.sizeUsd) || 0)))
    .slice(0, WHALE_MAX_POSITIONS);
  const limitedTransfers = transfers.slice(0, WHALE_MAX_ROWS);
  const rows = [...signals, ...positions, ...limitedTransfers].slice(0, WHALE_MAX_ROWS);
  if (typeof log === "function" && errors.length) log(`whales: ${errors.join("; ")}`);
  return {
    kind: "whales",
    status: "ok",
    updatedAt: new Date(now).toISOString(),
    ttlSeconds: Math.floor(MAX_TTL_MS / 1000),
    schemaVersion: 2,
    rows,
    signals,
    positions,
    transfers: limitedTransfers,
    labelSources: Object.values(EXCHANGE_ADDRESS_LABELS).flatMap((map) => Object.values(map).map((entry) => entry.source)).filter((value, index, arr) => value && arr.indexOf(value) === index),
    sourceDocs: [
      "https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint",
      "https://mempool.space/docs/api/rest",
      "https://docs.tronscan.org/en/api/transactions-and-transfers/token-trc20-transfers",
    ],
    sources: sourceNames,
    limitations: POSITION_RADAR_SOURCE_LIMITATIONS.whales,
    errors,
  };
}

export function createPositionRadar({
  fetchImpl = fetch,
  now = Date.now,
  ttlMs = MAX_TTL_MS,
  limit = DEFAULT_LIMIT,
  longShortSources = POSITION_RADAR_LONG_SHORT_SOURCES,
  whaleSources = POSITION_RADAR_WHALE_SOURCES,
  btcUsd = null,
  minBtc = 50,
  minEth = 250,
  ethUsd = null,
  minUsd = 5_000_000,
  minPositionUsd = 1_000_000,
  hyperliquidWallets = [],
  whaleSnapshotFile = process.env.WHALES_FILE || "/market/whales.json",
  whaleHistoryFile = process.env.WHALE_HISTORY_FILE || null,
  // The web server only reads the collector's file (WHALES_FILE); it never polls whale sources itself.
  whaleFileOnly = Boolean(process.env.WHALES_FILE) && !process.env.WHALE_HISTORY_FILE,
  interSymbolDelayMs = 0,
  log = () => {},
} = {}) {
  const cache = new Map();
  const cappedTtlMs = Math.min(Math.max(0, ttlMs), MAX_TTL_MS);
  const pending = new Map();
  const whaleState = readWhaleStateFile(whaleHistoryFile);
  const builders = {
    "long-short": () => buildLongShort({ fetchImpl, now: now(), limit, sources: longShortSources, interSymbolDelayMs }),
    whales: () => whaleFileOnly
      ? Promise.resolve(readWhaleSnapshotFile(whaleSnapshotFile, now()) || unavailableFeed("whales", ["WHALES_FILE"], "collector-file-missing"))
      : buildWhales({ fetchImpl, now: now(), sources: whaleSources, minBtc, minEth, minUsd, minPositionUsd, btcUsd, ethUsd, state: whaleState, hyperliquidWallets, whaleSnapshotFile, log }),
  };
  const refresh = (kind) => {
    if (!POSITION_RADAR_KINDS.includes(kind)) throw new RangeError(`unknown radar kind: ${kind}`);
    if (pending.has(kind)) return pending.get(kind);
    const run = builders[kind]()
      .then((next) => {
        if (next) {
          if (next.status === "ok") {
            if (!next.updatedAt && !next.fileSource) next.updatedAt = new Date(now()).toISOString();
          } else {
            const hit = cache.get(kind);
            if (hit?.data?.status === "ok") return { ...hit.data, stale: true };
          }
          cache.set(kind, { at: now(), data: next });
          if (kind === "whales") writeWhaleStateFile(whaleHistoryFile, whaleState, log);
        }
        return next;
      })
      .catch((error) => {
        log(`position radar ${kind}: ${error?.message || error}`);
        const hit = cache.get(kind);
        if (hit?.data?.status === "ok") return { ...hit.data, stale: true };
        const fallback = unavailableFeed(kind, kind === "long-short" ? Object.keys(longShortSources) : Object.keys(whaleSources).map(name => name === "btcMempool" ? "mempool.space" : name === "ethereumRpc" ? "PublicNode Ethereum RPC" : name), String(error?.message || error));
        cache.set(kind, { at: now(), data: fallback });
        return fallback;
      })
      .finally(() => pending.delete(kind));
    pending.set(kind, run);
    return run;
  };
  const read = async (kind, { waitMs = 2500 } = {}) => {
    if (!POSITION_RADAR_KINDS.includes(kind)) throw new RangeError(`unknown radar kind: ${kind}`);
    const hit = cache.get(kind);
    // A file read near source expiry must not postpone revalidation for another full TTL.
    if (hit && now() - hit.at <= cappedTtlMs && !(kind === "whales" && hit.data?.status === "ok" && radarSourceStale(hit.data, now()))) return hit.data;
    const run = refresh(kind);
    await Promise.race([run, sleep(waitMs)]);
    const next = cache.get(kind);
    if (next && now() - next.at <= cappedTtlMs) return kind === "whales" && next.data?.status === "ok" && radarSourceStale(next.data, now()) ? { ...next.data, stale: true } : next.data;
    if (next?.data?.status === "ok") return { ...next.data, stale: true };
    return unavailableFeed(kind, kind === "long-short" ? Object.keys(longShortSources) : Object.keys(whaleSources).map(name => name === "btcMempool" ? "mempool.space" : name === "ethereumRpc" ? "PublicNode Ethereum RPC" : name), "refresh-timeout");
  };
  return { read, refresh, cacheSize: () => cache.size };
}
