export const MARKET_URL = 'https://nexualpha.com/intel/market-events.json';
export const FUNDING_URL = 'https://nexualpha.com/intel/funding-rates.json';
export const DISCLAIMER = '数据来自 NexuAlpha 覆盖的交易所，为下限，不构成投资建议';
const HOUR = 3600000;
function requireValue(ok, message) { if (!ok) throw new Error(message); }
function text(value, name) { requireValue(typeof value === 'string' && value.trim().length > 0 && value.length < 300, `Missing or invalid ${name}`); return value; }
function number(value, name, min = 0) { requireValue(typeof value === 'number' && Number.isFinite(value) && value >= min, `Missing or invalid ${name}`); return value; }
export function assertFresh(value, now, name) {
  const at = Date.parse(value);
  requireValue(Number.isFinite(at) && at <= now && now - at <= HOUR, `${name} timestamp missing, future-dated, or older than 60 min: ${value}`);
  return at;
}
export function validateData(market, fundingFeed = null, now = Date.now()) {
  const at = assertFresh(market?.generatedAt, now, 'Market');
  const source = text(market?.liquidations?.source, 'liquidation source');
  const q = market?.liquidations?.h24;
  for (const key of ['totalUsd', 'longUsd', 'shortUsd']) number(q?.[key], key);
  requireValue(q.totalUsd > 0 && Math.abs(q.totalUsd - q.longUsd - q.shortUsd) <= 1, 'Liquidation total and split inconsistent or empty');
  const largest = q.largest;
  text(largest?.symbol, 'largest symbol');
  number(largest?.usd, 'largest usd');
  requireValue(largest.usd > 0 && largest.usd <= q.totalUsd, 'Largest size outside total');
  requireValue(['long', 'short'].includes(largest.side), 'Invalid largest side');
  const largestAt = Date.parse(largest.at);
  requireValue(Number.isFinite(largestAt) && largestAt <= at && at - largestAt <= 24 * HOUR, 'Largest liquidation outside 24h window');
  const parts = largest.symbol.split(':');
  requireValue(parts.length <= 2, 'Malformed venue-qualified largest symbol');
  const [prefix, symbol] = parts.length === 2 ? parts : ['Binance', largest.symbol];
  requireValue(['OKX', 'Binance'].includes(prefix) && source.includes(prefix) && symbol && !symbol.includes(':'), 'Cannot verify largest venue from source');
  const funding = market.funding || fundingFeed;
  assertFresh(funding?.generatedAt, now, 'Funding');
  const rates = [];
  if (market.funding) {
    text(funding.source, 'funding source');
    requireValue(Array.isArray(funding.rows), 'Missing funding rows');
    for (const row of funding.rows) {
      text(row.symbol, 'funding symbol');
      for (const venue of ['binance', 'okx']) {
        requireValue(Object.hasOwn(row, `${venue}Rate`), `Missing ${venue}Rate`);
        const rate = row[`${venue}Rate`];
        if (rate === null) continue; // unavailable is never zero
        number(rate, 'funding rate', -0.05);
        requireValue(Math.abs(rate) <= 0.05, 'Funding rate outside supported range');
        rates.push({venue: venue === 'okx' ? 'OKX' : 'Binance', symbol: row.symbol, rate});
      }
    }
  } else {
    requireValue(funding.venues && typeof funding.venues === 'object', 'Missing funding venues');
    for (const [venue, entry] of Object.entries(funding.venues)) {
      if (entry.ok !== true) continue;
      assertFresh(entry.readAt, now, `${venue} funding`);
      requireValue(Array.isArray(entry.rows), 'Missing venue funding rows');
      for (const row of entry.rows) {
        text(row.symbol, 'funding symbol'); number(row.rate, 'funding rate', -0.05);
        number(row.intervalH, 'funding interval');
        requireValue(row.intervalH > 0 && row.intervalH <= 24 && Math.abs(row.rate) <= 0.05, 'Invalid funding interval/rate');
        rates.push({venue, symbol: row.symbol, rate: row.rate, intervalH: row.intervalH});
      }
    }
  }
  requireValue(rates.length >= 3, 'At least three verified funding rates required');
  return {generatedAt: market.generatedAt, source, liquidation: q, largest: {...largest, venue: prefix, symbol}, fundingAt: funding.generatedAt,
    rates: rates.sort((a,b) => Math.abs(b.rate)-Math.abs(a.rate) || a.venue.localeCompare(b.venue) || a.symbol.localeCompare(b.symbol)).slice(0,3)};
}
// Floor compact USD values so a rounded-up number never overstates a lower bound.
export function usd(value) {
  number(value, 'USD');
  const unit = value >= 1e9 ? [1e9, 'B'] : value >= 1e6 ? [1e6, 'M'] : value >= 1e3 ? [1e3, 'K'] : [1, ''];
  return `$${(Math.floor(value / unit[0] * 100) / 100).toFixed(unit[1] ? 2 : 0)}${unit[1]}`;
}
export const percent = value => `${(value * 100).toFixed(1)}%`;
export const fundingPercent = value => `${value > 0 ? '+' : ''}${(value * 100).toFixed(5)}%`;
const spokenUsdZh = value => value >= 10000 ? `${(Math.floor(value / 10000 * 100) / 100).toFixed(2)}万美元` : `${Math.floor(value)}美元`;
export function buildPackage(data, lang) {
  requireValue(['zh-Hans', 'en'].includes(lang), 'Language must be zh-Hans or en');
  const zh = lang === 'zh-Hans', q = data.liquidation, big = data.largest;
  const shortShare = q.shortUsd / q.totalUsd;
  const title = zh ? `24小时爆仓至少 ${usd(q.totalUsd)}，空头占 ${percent(shortShare)}` : `24h liquidations ≥ ${usd(q.totalUsd)}; shorts ${percent(shortShare)}`;
  const scope = zh ? '覆盖交易所下限' : 'Covered venues · lower bound';
  const side = zh ? (big.side === 'long' ? '多头' : '空头') : big.side;
  const rates = data.rates.map(r => ({text: `${r.venue} · ${r.symbol}  ${fundingPercent(r.rate)}${r.intervalH ? ` / ${r.intervalH}h` : ''}`, rate: r.rate}));
  const slides = [
    {title: zh ? '24小时爆仓数据' : '24h liquidation data', lines: [zh ? `至少 ${usd(q.totalUsd)}` : `At least ${usd(q.totalUsd)}`, zh ? `空头占 ${percent(shortShare)}` : `Shorts: ${percent(shortShare)}`, scope], narration: zh ? `24小时爆仓至少${spokenUsdZh(q.totalUsd)}，空头占${percent(shortShare)}。` : title},
    {title: zh ? '多空爆仓分布' : 'Long / short split', lines: [scope, `${zh ? '多头' : 'Longs'} ${usd(q.longUsd)} · ${percent(1-shortShare)}`, `${zh ? '空头' : 'Shorts'} ${usd(q.shortUsd)} · ${percent(shortShare)}`], bar: {longShare: 1-shortShare}, narration: zh ? `多头${spokenUsdZh(q.longUsd)}，空头${spokenUsdZh(q.shortUsd)}，均为下限。` : `Long liquidations ${usd(q.longUsd)}. Shorts ${usd(q.shortUsd)}. A lower bound.`},
    {title: zh ? '覆盖内最大单笔' : 'Largest observed order', lines: [`${big.venue} · ${big.symbol}`, `${side} · ${usd(big.usd)}`, `${big.at.replace('T',' ').replace(/\.\d+Z$/, ' UTC')}`], narration: zh ? `覆盖内最大单笔，${big.venue}，${side}，${spokenUsdZh(big.usd)}。` : `Largest observed order: ${big.venue}, ${big.symbol}, ${side}, ${usd(big.usd)}.`},
    {title: zh ? '资金费率绝对值前三' : 'Top 3 absolute funding rates', lines: [zh ? '每结算周期费率，周期可能不同' : 'Per settlement interval; intervals vary', zh ? '当前快照，不代表24小时极值' : 'Current snapshot, not 24h extremes'], rates, narration: zh ? '当前资金费率，绝对值前三见屏幕。每结算周期费率，周期可能不同。' : `Current funding snapshot. Top three by absolute rate: ${data.rates.map(r=>`${r.symbol}, ${fundingPercent(r.rate)}`).join('; ')}.`},
    {title: zh ? '完整数据 nexualpha.com' : 'Full data nexualpha.com', lines: ['Telegram @NexuAlphaClub', zh ? '数据为覆盖交易所的下限' : 'Covered venues only; a lower bound', zh ? '不构成投资建议' : 'Not investment advice'], narration: zh ? '完整数据见网站和电报。数据为覆盖交易所下限，不构成投资建议。' : 'Full data on NexuAlpha dot com. Telegram: NexuAlphaClub. A lower bound, not investment advice.'},
  ].map(s => ({...s, duration: 7}));
  const description = [zh ? '24小时爆仓总额与多空分布，仅代表覆盖交易所。' : '24h liquidations and long/short split for covered venues.', zh ? '最大单笔为覆盖内观测；资金费率为当前每结算周期快照。' : 'Largest observed order; funding is a current per-interval snapshot.', `https://nexualpha.com/zh-hans/liquidations?src=yt-short https://t.me/NexuAlphaClub`, DISCLAIMER].join('\n');
  const hashtags = zh ? ['#比特币','#加密货币','#爆仓','#资金费率','#NexuAlpha','#Shorts'] : ['#Bitcoin','#Crypto','#Liquidations','#FundingRates','#NexuAlpha','#Shorts'];
  requireValue([...title].length <= 70, 'Title exceeds 70 characters');
  return {slides, meta: {lang, title, description, hashtags, generatedAt: data.generatedAt, fundingAt: data.fundingAt, source: data.source, sourceUrls: [MARKET_URL, ...(data.fundingSourceUrl ? [data.fundingSourceUrl] : [])], date: data.generatedAt.slice(0,10), disclaimer: DISCLAIMER}};
}
