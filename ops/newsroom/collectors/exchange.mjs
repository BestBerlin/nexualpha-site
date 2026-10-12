import { CollectorError, plain } from './common.mjs';

const MAX_FUTURE_SKEW_MS = 60 * 60 * 1000;

const BINANCE_CATALOGS = Object.freeze({
  48: 'listing',
  49: null,
  93: null,
  161: 'delisting',
});

const OKX_TYPES = Object.freeze({
  'announcements-new-listings': 'listing',
  'latest-events': null,
  'announcements-delistings': 'delisting',
  'announcements-latest-announcements': null,
  'announcements-product-updates': 'product_launch',
  'announcements-deposit-withdrawal-suspension-resumption': null,
});

const BYBIT_TYPES = Object.freeze({
  new_crypto: 'listing',
  latest_activities: null,
  delistings: 'delisting',
  latest_bybit_news: null,
  product_updates: 'product_launch',
});

const BITGET_TYPES = Object.freeze({
  coin_listings: 'listing',
  trading_competitions_promotions: null,
  symbol_delisting: 'delisting',
  latest_news: null,
  product_updates: 'product_launch',
  security: null,
});

const EXCHANGE_SOURCES = Object.freeze(new Set([
  'binance-announcements',
  'okx-announcements',
  'bybit-announcements',
  'bitget-announcements',
  'kraken-status',
  'nexualpha-official-announcements',
]));

const ENDPOINTS = Object.freeze({
  'binance-announcements': { host: 'www.binance.com', path: '/bapi/composite/v1/public/cms/article/list/query' },
  'okx-announcements': { host: 'www.okx.com', path: '/api/v5/support/announcements' },
  'bybit-announcements': { host: 'api.bybit.com', path: '/v5/announcements/index' },
  'bitget-announcements': { host: 'api.bitget.com', path: '/api/v2/public/annoucements' },
  'kraken-status': { host: 'status.kraken.com', path: '/api/v2/incidents.json' },
  'nexualpha-official-announcements': { host: 'nexualpha.com', path: '/intel/official-announcements.json' },
});

export function supports(source) {
  return EXCHANGE_SOURCES.has(source?.id);
}

export async function poll(source, since = null, ctx = {}) {
  assertSource(source);
  const request = requestFromContext(ctx);
  const nowMs = dateFromContext(ctx).getTime();
  const sinceMs = since == null ? null : dateMs(since);
  let items;
  if (source.id === 'binance-announcements') items = await pollBinance(source, request, nowMs);
  else if (source.id === 'okx-announcements') items = await pollOkx(source, request, nowMs);
  else if (source.id === 'bybit-announcements') items = await pollBybit(source, request, nowMs);
  else if (source.id === 'bitget-announcements') items = await pollBitget(source, request, nowMs);
  else if (source.id === 'kraken-status') items = mapKraken(await request(source.url), source, nowMs);
  else if (source.id === 'nexualpha-official-announcements') items = mapMirror(await request(source.url), source, nowMs);
  else throw new CollectorError(`Unsupported exchange source: ${source.id}`);
  return dedupe(items).filter(item => afterSince(item, sinceMs));
}

async function pollBinance(source, request, nowMs) {
  const out = [];
  for (const [catalogId, category] of Object.entries(BINANCE_CATALOGS)) {
    const payload = await request(urlWithParams(source.url, { type: '1', pageNo: '1', pageSize: '20', catalogId }));
    out.push(...mapBinance(payload, source, Number(catalogId), category, nowMs));
  }
  return out;
}

async function pollOkx(source, request, nowMs) {
  const out = [];
  for (const query of [
    { page: '1' },
    { page: '1', annType: 'announcements-new-listings' },
    { page: '1', annType: 'latest-events' },
    { page: '2', annType: 'latest-events' },
    { page: '1', annType: 'announcements-delistings' },
  ]) {
    out.push(...mapOkx(await request(urlWithParams(source.url, query)), source, nowMs));
  }
  return out;
}

async function pollBybit(source, request, nowMs) {
  const out = [];
  for (const type of ['new_crypto', 'latest_activities', 'latest_bybit_news', 'product_updates', 'delistings']) {
    out.push(...mapBybit(await request(urlWithParams(source.url, { locale: 'en-US', type, limit: '20' })), source, nowMs));
  }
  return out;
}

async function pollBitget(source, request, nowMs) {
  const out = [];
  for (const annType of ['coin_listings', 'trading_competitions_promotions', 'latest_news', 'product_updates', 'security', 'symbol_delisting']) {
    out.push(...mapBitget(await request(urlWithParams(source.url, { language: 'en_US', annType, limit: '10' })), source, nowMs));
  }
  return out;
}

function mapBinance(payload, source, catalogId, category, nowMs) {
  const catalog = payload?.code === '000000'
    ? payload?.data?.catalogs?.find(row => row?.catalogId === catalogId)
    : null;
  if (!Array.isArray(catalog?.articles)) throw new CollectorError(`${source.id} malformed payload`);
  return catalog.articles.map(row => {
    const code = typeof row?.code === 'string' && /^[a-f0-9]{16,64}$/i.test(row.code) ? row.code : null;
    return buildItem({
      external_id: code ? `binance:${code}` : null,
      url: code ? `https://www.binance.com/en/support/announcement/detail/${code}` : null,
      title: row?.title,
      body_excerpt: category,
      published_at: timestamp(row?.releaseDate, nowMs),
      event_type_guess: exchangeEventType(category, row?.title),
    }, source);
  }).filter(Boolean);
}

function mapOkx(payload, source, nowMs) {
  if (payload?.code !== '0' || !Array.isArray(payload?.data)) throw new CollectorError(`${source.id} malformed payload`);
  const rows = payload.data.flatMap(group => Array.isArray(group?.details) ? group.details : []);
  return rows.map(row => {
    const category = OKX_TYPES[row?.annType];
    return buildItem({
      external_id: row?.url ? `okx:${row.url}` : null,
      url: officialUrl(row?.url, 'www.okx.com'),
      title: row?.title,
      body_excerpt: category,
      published_at: timestamp(row?.pTime, nowMs),
      event_type_guess: exchangeEventType(category, row?.title),
    }, source);
  }).filter(Boolean);
}

function mapBybit(payload, source, nowMs) {
  const rows = payload?.retCode === 0 ? payload?.result?.list : null;
  if (!Array.isArray(rows)) throw new CollectorError(`${source.id} malformed payload`);
  return rows.map(row => {
    const category = BYBIT_TYPES[row?.type?.key];
    return buildItem({
      external_id: row?.url ? `bybit:${row.url}` : null,
      url: officialUrl(row?.url, 'announcements.bybit.com'),
      title: row?.title,
      body_excerpt: category,
      published_at: timestamp(row?.publishTime ?? row?.dateTimestamp, nowMs),
      event_type_guess: exchangeEventType(category, row?.title),
    }, source);
  }).filter(Boolean);
}

function mapBitget(payload, source, nowMs) {
  if (payload?.code !== '00000' || !Array.isArray(payload?.data)) throw new CollectorError(`${source.id} malformed payload`);
  return payload.data.map(row => {
    const category = BITGET_TYPES[row?.annType];
    return buildItem({
      external_id: row?.annId ? `bitget:${row.annId}` : null,
      url: officialUrl(row?.annUrl, 'www.bitget.com'),
      title: row?.annTitle,
      body_excerpt: category,
      published_at: timestamp(row?.cTime, nowMs),
      event_type_guess: exchangeEventType(category, row?.annTitle),
    }, source);
  }).filter(Boolean);
}

function mapKraken(payload, source, nowMs) {
  if (!Array.isArray(payload?.incidents)) throw new CollectorError(`${source.id} malformed payload`);
  return payload.incidents.map(row => buildItem({
    external_id: row?.id ? `kraken-status:${row.id}` : null,
    url: officialUrl(row?.shortlink ?? row?.url, 'status.kraken.com') ?? 'https://status.kraken.com/',
    title: row?.name,
    body_excerpt: row?.status ?? row?.impact,
    published_at: timestamp(row?.created_at ?? row?.updated_at, nowMs),
    event_type_guess: statusEventType(row),
    metrics: row?.impact ? { impact: row.impact, status: row.status ?? null } : undefined,
  }, source)).filter(Boolean);
}

function mapMirror(payload, source, nowMs) {
  if (!Array.isArray(payload?.items)) throw new CollectorError(`${source.id} malformed payload`);
  return payload.items.map(row => buildItem({
    external_id: row?.id ? `mirror:${row.id}` : null,
    url: officialUrl(row?.url),
    title: row?.title,
    body_excerpt: row?.category,
    published_at: timestamp(row?.publishedAt ?? row?.published_at, nowMs),
    event_type_guess: exchangeEventType(row?.category, row?.title),
    metrics: row?.venue ? { venue: row.venue, source_type: row.sourceType ?? null } : undefined,
  }, source)).filter(Boolean);
}

function buildItem(item, source) {
  const title = plain(item.title).slice(0, 600);
  const url = item.url ? officialUrl(item.url) : null;
  if (!item.external_id || !url || !title || !item.published_at) return null;
  return {
    external_id: item.external_id,
    url,
    title,
    body_excerpt: item.body_excerpt ? plain(item.body_excerpt).slice(0, 600) : null,
    published_at: item.published_at,
    author: source.name,
    lang: 'en',
    event_type_guess: item.event_type_guess ?? null,
    ...(item.metrics ? { metrics: item.metrics } : {}),
  };
}

function assertSource(source) {
  if (!supports(source)) throw new CollectorError(`Unsupported exchange source: ${source?.id ?? 'unknown'}`);
  const expected = ENDPOINTS[source.id];
  let url;
  try {
    url = new URL(source.url);
  } catch {
    throw new CollectorError(`${source.id} endpoint is not a valid URL`);
  }
  if (url.hostname !== expected.host || url.pathname !== expected.path) {
    throw new CollectorError(`${source.id} endpoint does not match registry contract`);
  }
}

function requestFromContext(ctx) {
  if (typeof ctx.request !== 'function') throw new CollectorError('Collector context is missing request(url, options)');
  return ctx.request;
}

function dateFromContext(ctx) {
  const date = ctx.now instanceof Date ? ctx.now : ctx.now ? new Date(ctx.now) : new Date();
  if (!Number.isFinite(date.getTime())) throw new CollectorError('Collector context now is invalid');
  return date;
}

function urlWithParams(base, params) {
  const url = new URL(base);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return url.href;
}

function officialUrl(value, host = null) {
  if (!value) return null;
  try {
    const url = new URL(String(value));
    if (url.protocol !== 'https:') return null;
    if (host && url.hostname !== host) return null;
    return url.href;
  } catch {
    return null;
  }
}

function timestamp(value, nowMs) {
  const ms = dateMs(value);
  if (ms == null || ms > nowMs + MAX_FUTURE_SKEW_MS) return null;
  return new Date(ms).toISOString();
}

function dateMs(value) {
  if (value == null || value === '') return null;
  const date = new Date(Number.isFinite(Number(value)) && String(value).trim() !== '' ? Number(value) : value);
  const ms = date.getTime();
  return Number.isFinite(ms) && ms > 0 ? ms : null;
}

function afterSince(item, sinceMs) {
  return sinceMs == null || dateMs(item.published_at) > sinceMs;
}

function dedupe(items) {
  const byId = new Map();
  for (const item of items) if (!byId.has(item.external_id)) byId.set(item.external_id, item);
  return [...byId.values()];
}

function statusEventType(row) {
  const name = String(row?.name ?? '').toLowerCase();
  const status = String(row?.status ?? '').toLowerCase();
  const active = ['investigating', 'identified', 'monitoring'].includes(status);
  if (active && /\b(withdraw|deposit)\b/.test(name)) return 'withdrawal_halt';
  if (active && /\b(trad|funding|maintenance|matching engine|api)\b/.test(name)) return 'market_structure';
  return null;
}

function exchangeEventType(category, title) {
  if (category === 'listing' || category === 'delisting') return category;
  const text = String(title ?? '').toLowerCase();
  if (category === 'product_launch' && /\b(launch|introduc|support|available|open)\b/.test(text)) return 'product_launch';
  if (/\b(withdrawal|withdraw|deposit|funding)\b/.test(text) && /\b(suspend|pause|halt|resume|maintenance|disable)\b/.test(text)) return 'withdrawal_halt';
  if (/\b(maintenance|upgrade|trading pair|market maker|api|system)\b/.test(text)) return 'market_structure';
  if (/\b(security breach|exploit|hack|compromise)\b/.test(text)) return 'hack_exploit';
  return null;
}
