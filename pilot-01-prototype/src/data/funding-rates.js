// Perpetual funding rates from each exchange's own public market-data endpoint (no key). Pure normalizers so the
// server module and the tests share them. A rate is a fraction per funding interval (0.0001 = 0.01% per period);
// an exchange or symbol that did not answer is simply absent — never zero, never guessed.
export const FUNDING_SYMBOLS = Object.freeze(["BTC", "ETH", "SOL", "XRP", "DOGE"]);
export const FUNDING_VENUES = Object.freeze(["binance", "okx", "bybit", "bitget", "gate-io", "hyperliquid"]);
export const FUNDING_PATH = "/intel/funding-rates.json";

const num = (v) => { const n = typeof v === "number" ? v : Number.parseFloat(v); return Number.isFinite(n) ? n : null; };
const row = (symbol, rate, intervalH, nextAt) => {
  const r = num(rate), h = num(intervalH);
  if (r == null || h == null || h <= 0 || h > 24 || Math.abs(r) > 0.05) return null;
  const next = num(nextAt);
  return { symbol, rate: r, intervalH: h, nextAt: next && next > 0 ? new Date(next).toISOString() : null };
};

export const normalizeFunding = {
  // premiumIndex (all symbols) + fundingInfo (only symbols with a non-default interval)
  binance(premium, info) {
    const hours = new Map((Array.isArray(info) ? info : []).map((x) => [x.symbol, num(x.fundingIntervalHours)]));
    const by = new Map((Array.isArray(premium) ? premium : []).map((x) => [x.symbol, x]));
    return FUNDING_SYMBOLS.map((s) => { const x = by.get(`${s}USDT`); return x && row(s, x.lastFundingRate, hours.get(`${s}USDT`) || 8, x.nextFundingTime); }).filter(Boolean);
  },
  // one funding-rate response per instrument: fundingTime is the settlement of the current period
  okx(symbol, json) {
    const x = json?.data?.[0];
    if (!x) return null;
    const h = (num(x.nextFundingTime) - num(x.fundingTime)) / 36e5;
    return row(symbol, x.fundingRate, Number.isFinite(h) && h > 0 ? h : 8, x.fundingTime);
  },
  bybit(json) {
    const by = new Map((json?.result?.list || []).map((x) => [x.symbol, x]));
    return FUNDING_SYMBOLS.map((s) => { const x = by.get(`${s}USDT`); return x && row(s, x.fundingRate, x.fundingIntervalHour || 8, x.nextFundingTime); }).filter(Boolean);
  },
  bitget(symbol, json) {
    const x = json?.data?.[0];
    return x ? row(symbol, x.fundingRate, x.fundingRateInterval, x.nextUpdate) : null;
  },
  "gate-io"(symbol, json) {
    return json && json.name ? row(symbol, json.funding_rate, num(json.funding_interval) / 3600, num(json.funding_next_apply) * 1000) : null;
  },
  // metaAndAssetCtxs: [meta, ctxs]; Hyperliquid funds every hour, on the hour
  hyperliquid(json, now = Date.now()) {
    const names = json?.[0]?.universe?.map((u) => u.name) || [];
    const ctxs = json?.[1] || [];
    const next = Math.ceil(now / 36e5) * 36e5;
    return FUNDING_SYMBOLS.map((s) => { const i = names.indexOf(s); return i >= 0 && ctxs[i] ? row(s, ctxs[i].funding, 1, next) : null; }).filter(Boolean);
  },
};

// Annualised from the per-interval rate, for comparing venues with different intervals (1h vs 8h).
export const fundingApr = (r) => r.rate * (24 / r.intervalH) * 365;

// Snapshot age is evaluated using a supplied clock so SSR and first hydration agree.
export const FUNDING_SOFT_AGE_MS = 10 * 60 * 1000;
export const FUNDING_MAX_AGE_MS = 2 * 60 * 60 * 1000;
export const isFundingSnapshot = (feed) => Boolean(feed && feed.venues && typeof feed.venues === "object" && !Array.isArray(feed.venues));
export function fundingSnapshot(feed, now = Date.parse(feed?.renderedAt || feed?.generatedAt)) {
  if (!isFundingSnapshot(feed)) return null;
  const venues = {};
  for (const [venue, source] of Object.entries(feed.venues)) {
    const lastSuccessAt = source.lastSuccessAt || source.readAt || null;
    const age = now - Date.parse(lastSuccessAt);
    const unavailable = source.status === 'unavailable' || !source.rows?.length || !Number.isFinite(age) || age < 0 || age >= FUNDING_MAX_AGE_MS;
    const stale = unavailable || source.ok === false || age >= FUNDING_SOFT_AGE_MS;
    venues[venue] = { ...source, lastSuccessAt, readAt: lastSuccessAt, stale, status: unavailable ? 'unavailable' : stale ? 'stale' : 'fresh', rows: unavailable ? [] : source.rows };
  }
  const values = Object.values(venues);
  const available = values.some(v => v.rows.length);
  const stale = !available || values.some(v => v.stale);
  return { ...feed, venues, stale, ok: available && !stale, status: !available ? 'unavailable' : stale ? 'stale' : 'fresh' };
}

// Readers: rows for one symbol across venues, sorted by annualised cost to longs (cheapest first).
export function fundingTable(feed, symbol) {
  const out = [];
  for (const venue of FUNDING_VENUES) {
    const source = feed?.venues?.[venue];
    const r = source?.status !== "unavailable" && source?.rows?.find((x) => x.symbol === symbol);
    if (r && Number.isFinite(r.rate) && Math.abs(r.rate) <= 0.05 && Number.isFinite(r.intervalH) && r.intervalH > 0 && r.intervalH <= 24) {
      out.push({ venue, ...r, apr: fundingApr(r), ok: source.ok, status: source.status, stale: source.stale, readAt: source.readAt, lastSuccessAt: source.lastSuccessAt, lastAttemptAt: source.lastAttemptAt, error: source.error });
    }
  }
  return out.sort((a, b) => a.apr - b.apr);
}
