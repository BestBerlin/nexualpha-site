// Server-only long/short and whale-transfer radar reader.
//
// Terms/source notes checked 2026-10-13:
// - mempool.space exposes keyless public REST endpoints, but rate limits are not a product contract. This module only
//   reads it through the server cache and returns an explicit unavailable snapshot on HTTP/rate-limit failure.
// - PublicNode advertises free public Ethereum RPC endpoints. This module uses read-only eth_getBlockByNumber and
//   eth_getLogs. A cold start reads a 40-block lookback; later refreshes only scan blocks added since the last cursor
//   (capped catch-up), and qualifying rows are kept in a rolling 3-hour window. Failures produce an unavailable snapshot.
// - Label rule: exact addresses from exchanges' own published proof-of-reserves wallet lists (see
//   exchange-address-labels.mjs, one source URL per address). Unknown addresses stay "unknown"; exchange-transfer
//   direction never means sale.
import { EXCHANGE_ADDRESS_LABEL_ROWS } from "./exchange-address-labels.mjs";

const UA = "NexuAlphaPositionRadar/1.0 (+https://nexualpha.com)";
const MAX_TTL_MS = 60_000;
const DEFAULT_TIMEOUT_MS = 8_000;
const DEFAULT_LIMIT = 30;

export const POSITION_RADAR_KINDS = Object.freeze(["long-short", "whales"]);

export const POSITION_RADAR_SOURCE_LIMITATIONS = Object.freeze({
  "long-short": [
    "Exchange long/short ratios are venue-published derivatives metrics, not a complete market-wide positioning record.",
    "Open-interest units differ by venue; the row-level headline uses the reference venue only and never averages non-comparable OI units.",
    "Top symbols are selected by Binance USDT-M 24h turnover, falling back to Bybit linear USDT turnover when Binance is unavailable; per-venue ratios remain separate.",
  ],
  whales: [
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
const WHALE_MAX_ROWS = 60;
// Cold start: native ETH reads full blocks (heavy), so it keeps a short lookback; all USDT/USDC Transfer logs use a
// medium lookback; logs touching a labelled exchange address are topic-filtered server side, so they are cheap and
// use a long lookback. Later refreshes only scan blocks after the cursor.
const ETH_NATIVE_LOOKBACK = 10;
const ETH_LOG_LOOKBACK = 50;
const ETH_EXCHANGE_LOG_LOOKBACK = 300;
const ETH_MAX_CATCH_UP = 50;
const LOG_CHUNK_BLOCKS = 50;
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
        explorerUrl: `https://mempool.space/tx/${tx.txid || tx.hash}`,
        chain: "bitcoin",
        asset: "BTC",
        txid: tx.txid || tx.hash || null,
        amount: btc,
        amountUsd: btc != null && btcUsd ? btc * btcUsd : null,
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

function normalizeEthTransfers(payload, { minEth, minUsd }) {
  const records = asList(payload);
  return records.map((tx) => {
    const rawAsset = String(tx.asset || tx.token_symbol || tx.tokenSymbol || (tx.contract === "native" ? "ETH" : "")).toUpperCase();
    const asset = rawAsset || (tx.contract_address ? "ERC20" : "ETH");
    const decimals = finite(tx.decimals ?? tx.token_decimals) ?? (asset === "USDT" || asset === "USDC" ? 6 : 18);
    const declaredRaw = finite(tx.rawValue ?? tx.raw_value);
    const amount = declaredRaw != null ? declaredRaw / 10 ** decimals : finite(tx.value ?? tx.amount ?? tx.quantity);
    const amountUsd = finite(tx.amountUsd ?? tx.valueUsd ?? tx.usd);
    const from = labelAddress("ethereum", tx.sender || tx.from || tx.from_address);
    const to = labelAddress("ethereum", tx.recipient || tx.to || tx.to_address);
    const txid = tx.transaction_hash || tx.hash || tx.txid || null;
    return {
      id: tx.eventId || txid,
      explorerUrl: `https://etherscan.io/tx/${tx.transaction_hash || tx.hash || tx.txid}`,
      chain: "ethereum",
      asset,
      txid,
      eventId: tx.eventId || null,
      amount,
      amountUsd,
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
  for (const [asset, address, decimals] of [["USDT", USDT_CONTRACT, 6], ["USDC", USDC_CONTRACT, 6]]) {
    const logs = [];
    for (const [start, end] of blockRanges(logFrom, latest, LOG_CHUNK_BLOCKS)) logs.push(...(await rpc(fetchImpl, "eth_getLogs", [{ fromBlock: hex(start), toBlock: hex(end), address, topics: [TRANSFER_TOPIC] }]) || []));
    // Exchange flows: Transfer logs whose sender or recipient topic is a labelled exchange address.
    for (let i = 0; i < exchangeTopics.length; i += EXCHANGE_TOPIC_BATCH) {
      const batch = exchangeTopics.slice(i, i + EXCHANGE_TOPIC_BATCH);
      for (const [start, end] of blockRanges(exchangeFrom, latest, EXCHANGE_LOG_CHUNK_BLOCKS)) {
        for (const topics of [[TRANSFER_TOPIC, batch], [TRANSFER_TOPIC, null, batch]]) {
          logs.push(...(await rpc(fetchImpl, "eth_getLogs", [{ fromBlock: hex(start), toBlock: hex(end), address, topics }]) || []));
        }
      }
    }
    for (const entry of logs) {
      if (entry.removed) continue;
      const eventKey = `${entry.transactionHash}:${entry.logIndex || "0x0"}`;
      if (seen.has(eventKey)) continue;
      seen.add(eventKey);
      if (hexBigInt(entry.data) < minRaw) continue;
      qualifying.push({ asset, decimals, entry, eventKey });
    }
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
  btcMempool: async (fetchImpl, { minBtc = 50, maxTxDetails = 10 } = {}) => {
    const recent = await getJson("https://mempool.space/api/mempool/recent", fetchImpl);
    const candidates = (Array.isArray(recent) ? recent : [])
      .filter((tx) => (finite(tx.value) || 0) / 100_000_000 >= minBtc)
      .slice(0, maxTxDetails);
    return Promise.all(candidates.map((tx) => getJson(`https://mempool.space/api/tx/${encodeURIComponent(tx.txid)}`, fetchImpl)));
  },
  ethereumRpc: ethereumRpcTransfers,
});

async function buildWhales({ fetchImpl, now, sources, minBtc, minEth, minUsd, btcUsd, state }) {
  const rows = [];
  const errors = [];
  try {
    if (typeof sources.btcMempool === "function") rows.push(...normalizeBtcMempool(await sources.btcMempool(fetchImpl, { minBtc }), { btcUsd, minBtc }));
  } catch (error) {
    errors.push(`btc: ${error?.message || error}`);
  }
  try {
    for (const [name, source] of Object.entries(sources)) {
      if (!name.startsWith("ethereum") || typeof source !== "function") continue;
      rows.push(...normalizeEthTransfers(await source(fetchImpl, { minEth, minUsd, state }), { minEth, minUsd }));
    }
  } catch (error) {
    errors.push(`ethereum: ${error?.message || error}`);
  }
  const sourceNames = Object.keys(sources).map(name => name === "btcMempool" ? "mempool.space" : name === "ethereumRpc" ? "PublicNode Ethereum RPC" : name);
  if (state) {
    // Rolling window: merge this refresh's rows with earlier ones (dedupe by event id) and drop rows first seen more than 3h ago.
    const history = state.rows || (state.rows = new Map());
    const nowIso = new Date(now).toISOString();
    for (const row of rows) {
      const key = row.eventId || row.id;
      history.set(key, { ...row, seenAt: history.get(key)?.seenAt || nowIso });
    }
    const cutoff = now - WHALE_RETENTION_MS;
    // Retention uses first-seen time so a lagging chain timestamp never evicts a row we just read.
    const at = (row) => { const t = Date.parse(row.seenAt || row.time || ""); return Number.isFinite(t) ? t : 0; };
    for (const [key, row] of history) if (at(row) < cutoff) history.delete(key);
    rows.splice(0, rows.length, ...history.values());
    if (history.size > WHALE_MAX_ROWS * 3) {
      const keep = [...history.entries()].sort((a, b) => at(b[1]) - at(a[1])).slice(0, WHALE_MAX_ROWS * 3);
      history.clear();
      for (const [key, row] of keep) history.set(key, row);
    }
  }
  if (!rows.length) return unavailableFeed("whales", sourceNames, errors.length ? errors.join("; ") : "no-large-transfers-or-eth-source-unavailable");
  const sortAt = (row) => { const t = Date.parse(row.time || row.seenAt || ""); return Number.isFinite(t) ? t : 0; };
  rows.sort((a, b) => sortAt(b) - sortAt(a));
  const limitedRows = rows.slice(0, WHALE_MAX_ROWS);
  return {
    kind: "whales",
    status: "ok",
    updatedAt: new Date(now).toISOString(),
    ttlSeconds: Math.floor(MAX_TTL_MS / 1000),
    rows: limitedRows,
    transfers: limitedRows,
    labelSources: Object.values(EXCHANGE_ADDRESS_LABELS).flatMap((map) => Object.values(map).map((entry) => entry.source)).filter((value, index, arr) => value && arr.indexOf(value) === index),
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
  minUsd = 1_000_000,
  interSymbolDelayMs = 0,
  log = () => {},
} = {}) {
  const cache = new Map();
  const cappedTtlMs = Math.min(Math.max(0, ttlMs), MAX_TTL_MS);
  const pending = new Map();
  const whaleState = { ethCursor: null, rows: new Map() };
  const builders = {
    "long-short": () => buildLongShort({ fetchImpl, now: now(), limit, sources: longShortSources, interSymbolDelayMs }),
    whales: () => buildWhales({ fetchImpl, now: now(), sources: whaleSources, minBtc, minEth, minUsd, btcUsd, state: whaleState }),
  };
  const refresh = (kind) => {
    if (!POSITION_RADAR_KINDS.includes(kind)) throw new RangeError(`unknown radar kind: ${kind}`);
    if (pending.has(kind)) return pending.get(kind);
    const run = builders[kind]()
      .then((next) => {
        if (next) {
          if (next.status === "ok") next.updatedAt = new Date(now()).toISOString();
          cache.set(kind, { at: now(), data: next });
        }
        return next;
      })
      .catch((error) => {
        log(`position radar ${kind}: ${error?.message || error}`);
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
    if (hit && now() - hit.at <= cappedTtlMs) return hit.data;
    const run = refresh(kind);
    await Promise.race([run, sleep(waitMs)]);
    const next = cache.get(kind);
    return next && now() - next.at <= cappedTtlMs ? next.data : unavailableFeed(kind, kind === "long-short" ? Object.keys(longShortSources) : Object.keys(whaleSources).map(name => name === "btcMempool" ? "mempool.space" : name === "ethereumRpc" ? "PublicNode Ethereum RPC" : name), "refresh-timeout");
  };
  return { read, refresh, cacheSize: () => cache.size };
}
