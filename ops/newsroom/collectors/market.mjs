import { CollectorError, digest, plain } from './common.mjs';

const DEFAULT_MARKET_URL = 'https://nexualpha.com/intel/market-events.json';
const SUPPORTED_IDS = new Set([
  'mempool-space',
  'blockchair-bitcoin-stats',
  'defillama-stablecoins',
  'defillama-hacks',
  'hyperliquid-info',
  'binance-futures-24hr',
  'nexualpha-market-events',
]);
const DAY_MS = 24 * 60 * 60 * 1000;
const BIG_MOVE_PCT = 15;
const BIG_MOVE_VOLUME_USD = 50_000_000;
const FUNDING_EXTREME = 0.0005;
const OI_CHANGE_PCT = 8;
const STABLECOIN_LOWER = 0.985;
const STABLECOIN_UPPER = 1.015;
const STABLECOIN_SUPPLY_MOVE_PCT = 1.5;
const MEMPOOL_FAST_FEE = 100;
const MEMPOOL_MIN_TIP_FEE = 50;

export function supports(source) {
  return SUPPORTED_IDS.has(source?.id);
}

export async function poll(source, since = null, ctx = {}) {
  if (!supports(source)) return [];
  const request = ctx.request;
  if (typeof request !== 'function') throw new CollectorError('ctx.request is required for market collector');
  const now = date(ctx.now ?? new Date(), 'ctx.now');
  const items = await pollSource(source, request, now);
  return filterSince(items, since);
}

async function pollSource(source, request, now) {
  switch (source.id) {
    case 'mempool-space':
      return pollMempool(source, request, now);
    case 'blockchair-bitcoin-stats':
      return pollBlockchair(source, request, now);
    case 'defillama-stablecoins':
      return pollDefiLlamaStablecoins(source, request, now);
    case 'defillama-hacks':
      return pollDefiLlamaHacks(source, request, now);
    case 'hyperliquid-info':
      return pollHyperliquid(source, request, now);
    case 'binance-futures-24hr':
      return pollBinanceFutures(source, request, now);
    case 'nexualpha-market-events':
      return pollOwnMarketFeed(source, request, now);
    default:
      throw new CollectorError(`Unsupported market source ${source.id ?? source.url}`);
  }
}

async function pollMempool(source, request, now) {
  const tipHeight = await request(source.url);
  const feesUrl = new URL('/api/v1/fees/recommended', source.url).href;
  const fees = await request(feesUrl);
  const height = number(tipHeight);
  const fastestFee = number(fees?.fastestFee);
  const halfHourFee = number(fees?.halfHourFee);
  const hourFee = number(fees?.hourFee);
  if (height == null || fastestFee == null || halfHourFee == null || hourFee == null) malformed('mempool.space');
  if (fastestFee < MEMPOOL_FAST_FEE && hourFee < MEMPOOL_MIN_TIP_FEE) return [];
  return [item(source, {
    id: `mempool-fees:${height}:${fastestFee}`,
    url: feesUrl,
    title: `Bitcoin mempool fee spike: fastest fee ${fastestFee} sat/vB`,
    body: `mempool.space reports fastest ${fastestFee} sat/vB, half-hour ${halfHourFee} sat/vB and hour ${hourFee} sat/vB at tip height ${height}.`,
    at: null,
    event: 'liquidity_anomaly',
    metrics: { fastest_fee_sat_vb: fastestFee, half_hour_fee_sat_vb: halfHourFee, hour_fee_sat_vb: hourFee, tip_height: height, observed_at_ms: now.getTime() },
    provenance: { kind: 'bitcoin_fee_pressure', source: 'mempool.space', tip_height: height, observed_at: now.toISOString() },
  })];
}

async function pollBlockchair(source, request, now) {
  const json = await request(source.url);
  const data = json?.data;
  const bestBlock = number(data?.best_block_height ?? data?.blocks);
  const mempoolTx = number(data?.mempool_transactions);
  const suggestedFeePerByte = number(data?.suggested_transaction_fee_per_byte_sat);
  const avgFee24h = number(data?.average_transaction_fee_24h);
  if (bestBlock == null || (mempoolTx == null && suggestedFeePerByte == null && avgFee24h == null)) malformed('Blockchair Bitcoin stats');
  if ((mempoolTx ?? 0) < 100_000 && (suggestedFeePerByte ?? 0) < MEMPOOL_MIN_TIP_FEE) return [];
  return [item(source, {
    id: `blockchair-bitcoin:${bestBlock}:${Math.round(mempoolTx ?? suggestedFeePerByte ?? avgFee24h)}`,
    url: source.url,
    title: 'Blockchair Bitcoin congestion signal',
    body: `Blockchair reports Bitcoin height ${bestBlock}${mempoolTx == null ? '' : ` with ${Math.round(mempoolTx)} mempool transactions`}${suggestedFeePerByte == null ? '' : ` and suggested fee ${suggestedFeePerByte} sat/vB`}.`,
    at: null,
    event: 'liquidity_anomaly',
    metrics: compactMetrics({ best_block_height: bestBlock, mempool_transactions: mempoolTx, suggested_fee_sat_vb: suggestedFeePerByte, average_transaction_fee_24h: avgFee24h, observed_at_ms: now.getTime() }),
    provenance: { kind: 'bitcoin_network_congestion', source: 'Blockchair', observed_at: now.toISOString() },
  })];
}

async function pollDefiLlamaStablecoins(source, request, now) {
  const json = await request(source.url);
  const rows = Array.isArray(json?.peggedAssets) ? json.peggedAssets : Array.isArray(json) ? json : null;
  if (!rows) malformed('DefiLlama stablecoins');
  const out = [];
  for (const stable of rows) {
    const symbol = String(stable.symbol ?? stable.name ?? '').trim();
    if (!symbol) continue;
    if ((stable.pegType ?? 'peggedUSD') !== 'peggedUSD') continue;
    const price = number(stable.price);
    const supplyUsd = number(stable.circulating?.peggedUSD ?? stable.circulating?.usd ?? stable.supply ?? stable.mcap);
    const priorSupplyUsd = number(stable.circulatingPrevDay?.peggedUSD ?? stable.circulatingPrevDay?.usd ?? stable.supplyPrevDay);
    const supplyMovePct = supplyUsd != null && priorSupplyUsd > 0 ? roundPct((supplyUsd / priorSupplyUsd - 1) * 100) : number(stable.change_1d ?? stable.circulating?.peggedUSD24hChangePct);
    const offPeg = price != null && (price < STABLECOIN_LOWER || price > STABLECOIN_UPPER);
    const supplyMove = supplyMovePct != null && Math.abs(supplyMovePct) >= STABLECOIN_SUPPLY_MOVE_PCT;
    if (!offPeg && !supplyMove) continue;
    const label = symbol.toUpperCase();
    out.push(item(source, {
      id: `defillama-stablecoin:${label}:${price ?? 'no-price'}:${supplyMovePct ?? 'no-supply'}`,
      url: stable.url ?? `https://defillama.com/stablecoin/${encodeURIComponent(stable.gecko_id ?? stable.id ?? symbol)}`,
      title: `${label} stablecoin ${offPeg ? 'peg anomaly' : 'supply move'}`,
      body: `DefiLlama reports ${label}${price == null ? '' : ` at $${price}`}${supplyMovePct == null ? '' : ` and 24h supply move ${supplyMovePct}%`}.`,
      at: null,
      event: offPeg ? 'stablecoin_depeg' : 'flows',
      metrics: compactMetrics({ price_usd: price, supply_usd: supplyUsd, supply_move_24h_pct: supplyMovePct, observed_at_ms: now.getTime() }),
      provenance: { kind: offPeg ? 'stablecoin_peg' : 'stablecoin_supply', source: 'DefiLlama', symbol: label, peg_type: 'peggedUSD', observed_at: now.toISOString() },
    }));
  }
  return out;
}

async function pollDefiLlamaHacks(source, request, now) {
  const hacksUrl = source.url;
  const json = await request(hacksUrl);
  const rows = Array.isArray(json) ? json : Array.isArray(json?.hacks) ? json.hacks : null;
  if (!rows) malformed('DefiLlama hacks');
  return rows.slice(0, 50).map(row => {
    const amountUsd = number(row.amount ?? row.amountUsd ?? row.amount_usd);
    const when = hackDate(row.date ?? row.timestamp ?? row.published_at);
    const name = plain(row.name ?? row.protocol ?? row.target ?? 'DeFi protocol');
    if (!name || amountUsd == null || amountUsd < 1_000_000) return null;
    return item(source, {
      id: `defillama-hack:${digest(`${name}:${when?.toISOString() ?? 'undated'}:${amountUsd}`).slice(0, 16)}`,
      url: row.source ?? row.url ?? `https://defillama.com/hacks`,
      title: `${name} exploit recorded by DefiLlama`,
      body: `DefiLlama records a ${name} exploit with roughly ${Math.round(amountUsd).toLocaleString('en-US')} USD affected.`,
      at: when,
      event: 'hack_exploit',
      metrics: { amount_usd: amountUsd, observed_at_ms: now.getTime() },
      provenance: { kind: 'hack_feed', source: 'DefiLlama', protocol: name, observed_at: now.toISOString() },
    });
  }).filter(Boolean);
}

async function pollHyperliquid(source, request, now) {
  const json = await request(source.url, { method: 'POST', body: JSON.stringify({ type: 'metaAndAssetCtxs' }), headers: { 'content-type': 'application/json' } });
  const meta = json?.[0], ctxs = json?.[1];
  if (!meta?.universe || !Array.isArray(ctxs)) malformed('Hyperliquid info');
  const rows = meta.universe.map((asset, i) => ({ name: asset.name, ...ctxs[i] })).filter(row => row.name);
  const byOi = rows.map(row => {
    const mark = number(row.markPx ?? row.midPx ?? row.oraclePx);
    const openInterest = number(row.openInterest);
    return { row, mark, openInterest, oiUsd: mark != null && openInterest != null ? mark * openInterest : null, funding: number(row.funding), dayNtlVlm: number(row.dayNtlVlm) };
  }).filter(row => row.oiUsd != null || row.funding != null);
  if (!byOi.length) malformed('Hyperliquid info asset contexts');
  const topOi = byOi.filter(row => row.oiUsd != null).sort((a, b) => b.oiUsd - a.oiUsd).slice(0, 3);
  const funding = byOi.filter(row => row.funding != null && Math.abs(row.funding) >= FUNDING_EXTREME).sort((a, b) => Math.abs(b.funding) - Math.abs(a.funding)).slice(0, 3);
  return [
    ...topOi.map(row => item(source, {
      id: `hyperliquid-oi:${row.row.name}:${Math.round(row.oiUsd)}`,
      url: 'https://app.hyperliquid.xyz/trade',
      title: `Hyperliquid ${row.row.name} open interest is about ${usd(row.oiUsd)}`,
      body: `Hyperliquid info API reports ${row.row.name} open interest near ${usd(row.oiUsd)}${row.mark == null ? '' : ` at mark ${row.mark}`}.`,
      at: null,
      event: 'market_structure',
      metrics: compactMetrics({ open_interest_usd: row.oiUsd, open_interest_contracts: row.openInterest, mark_price_usd: row.mark, day_notional_volume_usd: row.dayNtlVlm, observed_at_ms: now.getTime() }),
      provenance: { kind: 'hyperliquid_open_interest', venue: 'Hyperliquid', symbol: row.row.name, observed_at: now.toISOString() },
    })),
    ...funding.map(row => item(source, {
      id: `hyperliquid-funding:${row.row.name}:${row.funding}`,
      url: 'https://app.hyperliquid.xyz/trade',
      title: `Hyperliquid ${row.row.name} funding rate is ${roundPct(row.funding * 100)}%`,
      body: `Hyperliquid info API reports ${row.row.name} funding at ${roundPct(row.funding * 100)}%.`,
      at: null,
      event: 'liquidity_anomaly',
      metrics: compactMetrics({ funding_rate: row.funding, funding_pct: roundPct(row.funding * 100), open_interest_usd: row.oiUsd, observed_at_ms: now.getTime() }),
      provenance: { kind: 'hyperliquid_funding', venue: 'Hyperliquid', symbol: row.row.name, observed_at: now.toISOString() },
    })),
  ];
}

async function pollBinanceFutures(source, request, now) {
  const tickers = await request(source.url);
  if (!Array.isArray(tickers)) malformed('Binance futures 24h ticker');
  const premium = await request(new URL('/fapi/v1/premiumIndex', source.url).href);
  if (!Array.isArray(premium)) malformed('Binance futures premiumIndex');
  const top = tickers
    .filter(t => /USDT$/.test(String(t.symbol ?? '')) && number(t.quoteVolume) >= BIG_MOVE_VOLUME_USD)
    .sort((a, b) => number(b.quoteVolume) - number(a.quoteVolume))
    .slice(0, 10);
  const out = [];
  for (const t of top.filter(t => Math.abs(number(t.priceChangePercent) ?? 0) >= BIG_MOVE_PCT)) {
    const change = number(t.priceChangePercent);
    const volume = number(t.quoteVolume);
    out.push(item(source, {
      id: `binance-mover:${t.symbol}:${change}:${Math.round(volume)}`,
      url: `https://www.binance.com/en/futures/${t.symbol}`,
      title: `${t.symbol} moved ${change}% in 24h on Binance futures`,
      body: `Binance futures 24h ticker reports ${t.symbol} ${change}% with about ${usd(volume)} quote volume.`,
      at: null,
      event: 'price_move',
      metrics: compactMetrics({ change_24h_pct: change, quote_volume_24h_usd: volume, last_price_usd: number(t.lastPrice), observed_at_ms: now.getTime() }),
      provenance: { kind: 'binance_top_mover', venue: 'Binance Futures', symbol: t.symbol, observed_at: now.toISOString() },
    }));
  }
  for (const f of premium.filter(row => Math.abs(number(row.lastFundingRate) ?? 0) >= FUNDING_EXTREME).slice(0, 10)) {
    const rate = number(f.lastFundingRate);
    out.push(item(source, {
      id: `binance-funding:${f.symbol}:${rate}:${f.nextFundingTime ?? ''}`,
      url: `https://www.binance.com/en/futures/${f.symbol}`,
      title: `${f.symbol} Binance funding rate is ${roundPct(rate * 100)}%`,
      body: `Binance premiumIndex reports ${f.symbol} last funding rate ${roundPct(rate * 100)}%${f.nextFundingTime ? ` and next funding time ${new Date(number(f.nextFundingTime)).toISOString()}` : ''}.`,
      at: null,
      event: 'liquidity_anomaly',
      metrics: compactMetrics({ funding_rate: rate, funding_pct: roundPct(rate * 100), next_funding_time_ms: number(f.nextFundingTime), observed_at_ms: now.getTime() }),
      provenance: { kind: 'binance_funding', venue: 'Binance Futures', symbol: f.symbol, observed_at: now.toISOString() },
    }));
  }
  for (const symbol of top.slice(0, 3).map(t => t.symbol)) {
    const oiUrl = new URL(`/futures/data/openInterestHist?symbol=${encodeURIComponent(symbol)}&period=1h&limit=25`, source.url).href;
    const history = await request(oiUrl);
    if (!Array.isArray(history) || history.length < 2) continue;
    const first = number(history[0]?.sumOpenInterestValue);
    const last = number(history.at(-1)?.sumOpenInterestValue);
    const firstTs = number(history[0]?.timestamp);
    const lastTs = number(history.at(-1)?.timestamp);
    if (first == null || first <= 0 || last == null) continue;
    const change = roundPct((last / first - 1) * 100);
    if (Math.abs(change) < OI_CHANGE_PCT) continue;
    const hours = firstTs != null && lastTs != null && lastTs > firstTs ? roundPct((lastTs - firstTs) / 3_600_000) : null;
    const window = hours != null && hours >= 23 && hours <= 25 ? '24h' : hours == null ? 'sampled' : `${hours}h`;
    out.push(item(source, {
      id: `binance-oi:${symbol}:${change}:${Math.round(last)}`,
      url: `https://www.binance.com/en/futures/${symbol}`,
      title: `${symbol} Binance open interest changed ${change}% over ${window}`,
      body: `Binance futures open interest history reports ${symbol} notional open interest changed ${change}% over the ${window} sample window.`,
      at: null,
      event: 'market_structure',
      metrics: compactMetrics({ open_interest_usd: last, open_interest_change_pct: change, window_hours: hours, observed_at_ms: now.getTime() }),
      provenance: { kind: 'binance_open_interest', venue: 'Binance Futures', symbol, window, observed_at: now.toISOString() },
    }));
  }
  return out;
}

async function pollOwnMarketFeed(source, request, now) {
  const json = await request(source.url ?? DEFAULT_MARKET_URL);
  if (!json || typeof json !== 'object' || !json.generatedAt) malformed('NexuAlpha market-events feed');
  const generatedAt = date(json.generatedAt, 'market feed generatedAt');
  const url = source.url ?? DEFAULT_MARKET_URL;
  const out = [];
  for (const [window, row] of Object.entries(json.liquidations ?? {})) {
    if (!/^h\d+$/.test(window) || !row || typeof row !== 'object') continue;
    const totalUsd = number(row.totalUsd);
    if (totalUsd == null || totalUsd <= 0) continue;
    const topSymbols = Array.isArray(row.topSymbols) ? row.topSymbols.map(x => String(x.symbol ?? '')).filter(Boolean) : [];
    out.push(item(source, {
      id: `nexualpha-liquidations:${window}:${generatedAt.toISOString()}:${Math.round(totalUsd)}`,
      url,
      title: `Crypto futures liquidation lower bound ${usd(totalUsd)} over ${window}`,
      body: `NexuAlpha market feed reports at least ${usd(totalUsd)} liquidated over ${window}. The feed labels this as a lower bound and keeps venue/window provenance.`,
      at: generatedAt,
      event: 'liquidation_wave',
      metrics: compactMetrics({ total_liquidations_usd: totalUsd, long_liquidations_usd: number(row.longUsd), short_liquidations_usd: number(row.shortUsd), orders: number(row.orders) }),
      provenance: { kind: 'liquidations', window, lower_bound: true, venues: ownMarketVenues(json.liquidations.source), source: json.liquidations.source, coins: topSymbols, largest: row.largest ?? null },
    }));
  }
  for (const event of Array.isArray(json.events) ? json.events : []) {
    if (!event?.type || !event?.text) continue;
    out.push(item(source, {
      id: `nexualpha-event:${digest(`${event.type}:${event.text}:${generatedAt.toISOString()}`).slice(0, 16)}`,
      url,
      title: plain(event.text),
      body: `NexuAlpha market feed event type ${event.type} with severity ${event.severity ?? 'unknown'}.`,
      at: generatedAt,
      event: eventType(event.type),
      metrics: {},
      provenance: { kind: 'market_collector_event', collector_type: event.type, severity: event.severity ?? null },
    }));
  }
  for (const row of Array.isArray(json.funding?.rows) ? json.funding.rows : []) {
    const rates = [number(row.binanceRate), number(row.okxRate)].filter(v => v != null);
    const maxAbs = rates.reduce((m, v) => Math.abs(v) > Math.abs(m) ? v : m, 0);
    if (Math.abs(maxAbs) < FUNDING_EXTREME) continue;
    out.push(item(source, {
      id: `nexualpha-funding:${row.symbol}:${json.funding.generatedAt ?? generatedAt.toISOString()}:${maxAbs}`,
      url,
      title: `${row.symbol} funding rate extreme in NexuAlpha feed`,
      body: `NexuAlpha funding feed reports ${row.symbol} with max absolute funding rate ${roundPct(maxAbs * 100)}% across available venues.`,
      at: date(json.funding.generatedAt ?? generatedAt, 'funding generatedAt'),
      event: 'liquidity_anomaly',
      metrics: compactMetrics({ binance_funding_rate: number(row.binanceRate), okx_funding_rate: number(row.okxRate), max_abs_funding_rate: Math.abs(maxAbs) }),
      provenance: { kind: 'funding', venues: ownFundingVenues(row), symbol: row.symbol },
    }));
  }
  return out;
}

function item(source, { id, url, title, body, at, event, metrics, provenance }) {
  const publishedAt = at == null ? null : date(at, 'published_at').toISOString();
  const numericMetrics = { ...compactMetrics(metrics), provenance };
  return {
    external_id: id,
    url,
    title: plain(title),
    body_excerpt: plain(body),
    published_at: publishedAt,
    metrics: numericMetrics,
    event_type_guess: event,
    author: source.name,
    author_account: source.id,
  };
}

function filterSince(items, since) {
  if (!since) return items;
  const floor = date(since, 'since');
  return items.filter(row => row.published_at == null || date(row.published_at, 'item published_at') > floor);
}

function number(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number.parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : null;
}

function date(value, label) {
  const parsed = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(parsed.getTime())) throw new CollectorError(`Malformed ${label}`);
  return parsed;
}

function hackDate(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'number' && value > 10_000 && value < 10_000_000_000) return new Date(value * 1000);
  return date(value, 'DefiLlama hack date');
}

function compactMetrics(values) {
  const out = {};
  for (const [key, value] of Object.entries(values ?? {})) {
    if (key === 'provenance') continue;
    const parsed = number(value);
    if (parsed != null) out[key] = parsed;
  }
  return out;
}

function roundPct(value) {
  return Math.round(value * 100) / 100;
}

function usd(value) {
  const n = number(value) ?? 0;
  if (Math.abs(n) >= 1_000_000_000) return `$${roundPct(n / 1_000_000_000)}B`;
  if (Math.abs(n) >= 1_000_000) return `$${roundPct(n / 1_000_000)}M`;
  return `$${Math.round(n).toLocaleString('en-US')}`;
}

function malformed(label) {
  throw new CollectorError(`Malformed ${label} response`);
}

function ownMarketVenues(source = '') {
  const venues = [];
  if (/binance/i.test(source)) venues.push('Binance USDT-M');
  if (/okx/i.test(source)) venues.push('OKX');
  return venues.length ? venues : ['NexuAlpha market collector'];
}

function ownFundingVenues(row) {
  const venues = [];
  if (number(row.binanceRate) != null) venues.push('Binance Futures');
  if (number(row.okxRate) != null) venues.push('OKX');
  return venues;
}

function eventType(type) {
  return ({
    'sharp-move': 'price_move',
    'big-day': 'price_move',
    'top-mover': 'price_move',
    'open-interest': 'market_structure',
    'liquidation-spike': 'liquidation_wave',
    'both-sides-liquidated': 'liquidation_wave',
  })[type] ?? 'liquidity_anomaly';
}
