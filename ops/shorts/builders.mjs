import {
  LIQUIDATION_REACTION_THRESHOLD_USD,
  PLATFORM_KEYS,
  RTL_LOCALES,
  SUPPORTED_LOCALES,
  getShortsStrings,
  localePath,
} from './strings.mjs';

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
function timestampLabel(value, lang) {
  const at = new Date(value);
  if (lang === 'zh-Hans') {
    return `${new Date(at.getTime() + 8 * HOUR).toISOString().slice(0, 19).replace('T', ' ')} UTC+8`;
  }
  return `${at.toISOString().slice(0, 19).replace('T', ' ')} UTC`;
}
export function captionLines(value, lang) {
  const parts = [];
  let line = '';
  const input = String(value).replace(/\s+/g, ' ').trim();
  for (let index = 0; index < input.length; index++) {
    const char = input[index];
    line += char;
    const prev = input[index - 1] ?? '';
    const next = input[index + 1] ?? '';
    const decimalPoint = char === '.' && /\d/.test(prev) && /\d/.test(next);
    if (!decimalPoint && /[。！？.!?]/u.test(char)) {
      const sentence = line.trim();
      if (sentence) parts.push(sentence);
      line = '';
    }
  }
  const tail = line.trim();
  if (tail) parts.push(tail);
  return parts.length ? parts : (input ? [input] : []);
}
function slideCopy(strings) {
  return {...strings.copy};
}
function callStrings(strings, group, key, values) {
  const entry = strings.slides[group][key];
  return typeof entry === 'function' ? entry(values) : entry;
}
function platformUrl(locale, platform) {
  return `https://nexualpha.com/${localePath(locale)}/liquidations?src=${platform}-short`;
}
function platformMeta(strings, values, locale, platform) {
  const entry = strings.meta[platform];
  const url = platformUrl(locale, platform);
  return {
    title: entry.title(values),
    description: `${entry.description(values)}\n${entry.ctaLabel}: ${url}\n${strings.copy.disclaimer}`,
    hashtags: [...entry.hashtags],
    cta: {label: entry.ctaLabel, url},
  };
}
export function buildPackage(data, lang) {
  requireValue(SUPPORTED_LOCALES.includes(lang), `Language must be one of ${SUPPORTED_LOCALES.join(', ')}`);
  const strings = getShortsStrings(lang);
  const q = data.liquidation, big = data.largest;
  const longShare = q.longUsd / q.totalUsd;
  const shortShare = q.shortUsd / q.totalUsd;
  const dominantShare = Math.max(longShare, shortShare);
  const dominantSide = shortShare >= longShare ? 'short' : 'long';
  const side = big.side === 'long' ? strings.labels.long : strings.labels.short;
  const time = timestampLabel(big.at, lang);
  const rateRows = data.rates.map(r => ({
    venue: r.venue,
    symbol: r.symbol,
    text: `${r.venue} · ${r.symbol}  ${fundingPercent(r.rate)}${r.intervalH ? ` / ${r.intervalH}h` : ''}`,
    rate: r.rate,
    intervalH: r.intervalH ?? null,
  }));
  const topRates = data.rates.map(r => `${r.symbol}, ${fundingPercent(r.rate)}`).join('; ');
  const values = {
    total: usd(q.totalUsd),
    spokenTotal: spokenUsdZh(q.totalUsd),
    longUsd: usd(q.longUsd),
    spokenLongUsd: spokenUsdZh(q.longUsd),
    shortUsd: usd(q.shortUsd),
    spokenShortUsd: spokenUsdZh(q.shortUsd),
    longShare: percent(longShare),
    shortShare: percent(shortShare),
    dominantShare: percent(dominantShare),
    dominantSide,
    venue: big.venue,
    symbol: big.symbol,
    sideLabel: side,
    sideUpper: big.side === 'long' ? strings.labels.sideLong : strings.labels.sideShort,
    bigUsd: usd(big.usd),
    spokenBigUsd: spokenUsdZh(big.usd),
    time,
    topRates,
  };
  const reaction = {
    pose: 'point-right',
    antenna: q.totalUsd >= LIQUIDATION_REACTION_THRESHOLD_USD ? 'red' : 'green',
    thresholdUsd: LIQUIDATION_REACTION_THRESHOLD_USD,
    metric: 'liquidation.totalUsd',
  };
  const base = {
    copy: slideCopy(strings),
    dir: strings.dir,
    rtl: RTL_LOCALES.includes(lang),
    reaction,
    mascot: {
      pose: reaction.pose,
      antenna: reaction.antenna,
      antennaThresholdUsd: reaction.thresholdUsd,
    },
  };
  const slides = [
    {
      ...base,
      kind: 'hero',
      title: callStrings(strings, 'hero', 'title', values),
      label: callStrings(strings, 'hero', 'label', values),
      hero: {value: q.totalUsd, format: 'usd'},
      support: callStrings(strings, 'hero', 'support', values),
      lines: callStrings(strings, 'hero', 'lines', values),
      narration: callStrings(strings, 'hero', 'narration', values),
    },
    {
      ...base,
      kind: 'split',
      title: callStrings(strings, 'split', 'title', values),
      label: callStrings(strings, 'split', 'label', values),
      hero: {value: dominantShare, format: 'percent', side: dominantSide},
      support: callStrings(strings, 'split', 'support', values),
      lines: callStrings(strings, 'split', 'lines', values),
      longUsd: q.longUsd, shortUsd: q.shortUsd,
      bar: {longShare, shortShare, longLabel: percent(longShare), shortLabel: percent(shortShare)},
      narration: callStrings(strings, 'split', 'narration', values),
    },
    {
      ...base,
      kind: 'receipt',
      title: callStrings(strings, 'receipt', 'title', values),
      label: callStrings(strings, 'receipt', 'label', values),
      hero: {value: big.usd, format: 'usd'},
      support: callStrings(strings, 'receipt', 'support', values),
      receipt: {venue: big.venue, symbol: big.symbol, side: big.side, time},
      lines: callStrings(strings, 'receipt', 'lines', values),
      narration: callStrings(strings, 'receipt', 'narration', values),
    },
    {
      ...base,
      kind: 'funding',
      title: callStrings(strings, 'funding', 'title', values),
      label: callStrings(strings, 'funding', 'label', values),
      hero: {value: data.rates[0].rate, format: 'funding'},
      support: callStrings(strings, 'funding', 'support', values),
      lines: callStrings(strings, 'funding', 'lines', values),
      rates: rateRows,
      narration: callStrings(strings, 'funding', 'narration', values),
    },
    {
      ...base,
      kind: 'end',
      title: callStrings(strings, 'end', 'title', values),
      label: callStrings(strings, 'end', 'label', values),
      domain: strings.copy.domain,
      cta: strings.copy.cta,
      support: callStrings(strings, 'end', 'support', values),
      lines: callStrings(strings, 'end', 'lines', values),
      narration: callStrings(strings, 'end', 'narration', values),
    },
  ].map(s => ({...s, captions: captionLines(s.narration,lang), duration: 6}));
  const platforms = Object.fromEntries(PLATFORM_KEYS.map(platform => [platform, platformMeta(strings, values, lang, platform)]));
  const primary = platforms.youtube;
  requireValue([...primary.title].length <= 70, 'Title exceeds 70 characters');
  return {slides, meta: {lang, locale: lang, dir: strings.dir, rtl: RTL_LOCALES.includes(lang), title: primary.title, description: primary.description, hashtags: primary.hashtags, cta: primary.cta, platforms, generatedAt: data.generatedAt, fundingAt: data.fundingAt, source: data.source, sourceUrls: [MARKET_URL, ...(data.fundingSourceUrl ? [data.fundingSourceUrl] : [])], date: data.generatedAt.slice(0,10), disclaimer: DISCLAIMER, reactionThresholdUsd: LIQUIDATION_REACTION_THRESHOLD_USD}};
}
