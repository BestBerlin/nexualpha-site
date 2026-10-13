import { CollectorError, plain } from './common.mjs';
import { parseFeed } from './feeds.mjs';
import { storyFacts } from '../lib/facts.mjs';

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

const KUCOIN_TYPES = Object.freeze({
  'new-listings': 'listing',
  delistings: 'delisting',
  'latest-announcements': null,
});

const EXCHANGE_SOURCES = Object.freeze(new Set([
  'binance-announcements',
  'okx-announcements',
  'bybit-announcements',
  'bitget-announcements',
  'kucoin-announcements',
  'kraken-announcements',
  'kraken-status',
  'nexualpha-official-announcements',
]));

const ENDPOINTS = Object.freeze({
  'binance-announcements': { host: 'www.binance.com', path: '/bapi/composite/v1/public/cms/article/list/query' },
  'okx-announcements': { host: 'www.okx.com', path: '/api/v5/support/announcements' },
  'bybit-announcements': { host: 'api.bybit.com', path: '/v5/announcements/index' },
  'bitget-announcements': { host: 'api.bitget.com', path: '/api/v2/public/annoucements' },
  'kucoin-announcements': { host: 'api.kucoin.com', path: '/api/ua/v2/market/announcement' },
  'kraken-announcements': { host: 'blog.kraken.com', path: '/category/product/asset-listings/feed' },
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
  const bodyRequest = budgetedBodyRequest(request, ctx.bodyFetch);
  const sinceMs = since == null ? null : dateMs(since);
  let items;
  if (source.id === 'binance-announcements') items = await pollBinance(source, request, nowMs, bodyRequest);
  else if (source.id === 'okx-announcements') items = await pollOkx(source, request, nowMs, bodyRequest);
  else if (source.id === 'bybit-announcements') items = await pollBybit(source, request, nowMs, bodyRequest);
  else if (source.id === 'bitget-announcements') items = await pollBitget(source, request, nowMs, bodyRequest);
  else if (source.id === 'kucoin-announcements') items = await pollKucoin(source, request, nowMs, bodyRequest);
  else if (source.id === 'kraken-announcements') items = mapKrakenAnnouncements(await request(source.url, { format: 'text' }), source, nowMs);
  else if (source.id === 'kraken-status') items = mapKraken(await request(source.url), source, nowMs);
  else if (source.id === 'nexualpha-official-announcements') items = mapMirror(await request(source.url), source, nowMs);
  else throw new CollectorError(`Unsupported exchange source: ${source.id}`);
  return dedupe(items).filter(item => afterSince(item, sinceMs));
}

async function pollBinance(source, request, nowMs, bodyRequest = request) {
  const out = [];
  for (const [catalogId, category] of Object.entries(BINANCE_CATALOGS)) {
    const payload = await request(urlWithParams(source.url, { type: '1', pageNo: '1', pageSize: '20', catalogId }));
    out.push(...await mapBinance(payload, source, Number(catalogId), category, nowMs, bodyRequest));
  }
  return out;
}

async function pollOkx(source, request, nowMs, bodyRequest = request) {
  const out = [];
  for (const query of [
    { page: '1' },
    { page: '1', annType: 'announcements-new-listings' },
    { page: '1', annType: 'latest-events' },
    { page: '2', annType: 'latest-events' },
    { page: '1', annType: 'announcements-delistings' },
  ]) {
    out.push(...await mapOkx(await request(urlWithParams(source.url, query)), source, nowMs, bodyRequest));
  }
  return out;
}

async function pollBybit(source, request, nowMs, bodyRequest = request) {
  const out = [];
  for (const type of ['new_crypto', 'latest_activities', 'latest_bybit_news', 'product_updates', 'delistings']) {
    out.push(...await mapBybit(await request(urlWithParams(source.url, { locale: 'en-US', type, limit: '20' })), source, nowMs, bodyRequest));
  }
  return out;
}

async function pollBitget(source, request, nowMs, bodyRequest = request) {
  const out = [];
  for (const annType of ['coin_listings', 'trading_competitions_promotions', 'latest_news', 'product_updates', 'security', 'symbol_delisting']) {
    out.push(...await mapBitget(await request(urlWithParams(source.url, { language: 'en_US', annType, limit: '10' })), source, nowMs, bodyRequest));
  }
  return out;
}

async function pollKucoin(source, request, nowMs, bodyRequest = request) {
  const out = [];
  for (const type of ['latest-announcements', 'new-listings', 'delistings']) {
    out.push(...await mapKucoin(await request(urlWithParams(source.url, {
      language: 'en_US',
      type,
      pageNumber: '1',
      pageSize: '50',
    })), source, nowMs, bodyRequest));
  }
  return out;
}

async function mapBinance(payload, source, catalogId, category, nowMs, request) {
  const catalog = payload?.code === '000000'
    ? payload?.data?.catalogs?.find(row => row?.catalogId === catalogId)
    : null;
  if (!Array.isArray(catalog?.articles)) throw new CollectorError(`${source.id} malformed payload`);
  return (await mapRows(catalog.articles, async row => {
    const code = typeof row?.code === 'string' && /^[a-f0-9]{16,64}$/i.test(row.code) ? row.code : null;
    const url = code ? `https://www.binance.com/en/support/announcement/detail/${code}` : null;
    const detail = await announcementDetail({ title: row?.title, url, category, body: row?.body ?? row?.content, publishedAt: timestamp(row?.releaseDate, nowMs), nowMs }, request);
    return buildItem({
      external_id: code ? `binance:${code}` : null,
      url,
      title: detail.title,
      body_excerpt: detail.excerpt,
      published_at: timestamp(row?.releaseDate, nowMs),
      event_type_guess: exchangeEventType(category, row?.title),
      metrics: mergeMetrics(detail.metrics, rowTimingMetrics(row)),
    }, source);
  })).filter(Boolean);
}

async function mapOkx(payload, source, nowMs, request) {
  if (payload?.code !== '0' || !Array.isArray(payload?.data)) throw new CollectorError(`${source.id} malformed payload`);
  const rows = payload.data.flatMap(group => Array.isArray(group?.details) ? group.details : []);
  return (await mapRows(rows, async row => {
    const category = OKX_TYPES[row?.annType];
    const url = officialUrl(row?.url, 'www.okx.com');
    const detail = await announcementDetail({ title: row?.title, url, category, body: row?.desc ?? row?.content, publishedAt: timestamp(row?.pTime, nowMs), nowMs }, request);
    return buildItem({
      external_id: row?.url ? `okx:${row.url}` : null,
      url,
      title: detail.title,
      body_excerpt: detail.excerpt,
      published_at: timestamp(row?.pTime, nowMs),
      event_type_guess: exchangeEventType(category, row?.title),
      metrics: mergeMetrics(detail.metrics, rowTimingMetrics(row)),
    }, source);
  })).filter(Boolean);
}

async function mapBybit(payload, source, nowMs, request) {
  const rows = payload?.retCode === 0 ? payload?.result?.list : null;
  if (!Array.isArray(rows)) throw new CollectorError(`${source.id} malformed payload`);
  return (await mapRows(rows, async row => {
    const category = BYBIT_TYPES[row?.type?.key];
    const url = officialUrl(row?.url, 'announcements.bybit.com');
    const detail = await announcementDetail({ title: row?.title, url, category, body: row?.description ?? row?.content, publishedAt: timestamp(row?.publishTime ?? row?.dateTimestamp, nowMs), nowMs }, request);
    return buildItem({
      external_id: row?.url ? `bybit:${row.url}` : null,
      url,
      title: detail.title,
      body_excerpt: detail.excerpt,
      published_at: timestamp(row?.publishTime ?? row?.dateTimestamp, nowMs),
      event_type_guess: exchangeEventType(category, row?.title),
      metrics: mergeMetrics(detail.metrics, rowTimingMetrics(row)),
    }, source);
  })).filter(Boolean);
}

async function mapBitget(payload, source, nowMs, request) {
  if (payload?.code !== '00000' || !Array.isArray(payload?.data)) throw new CollectorError(`${source.id} malformed payload`);
  return (await mapRows(payload.data, async row => {
    const category = BITGET_TYPES[row?.annType];
    const url = officialUrl(row?.annUrl, 'www.bitget.com');
    const detail = await announcementDetail({ title: row?.annTitle, url, category, body: row?.content ?? row?.description, publishedAt: timestamp(row?.cTime, nowMs), nowMs }, request);
    return buildItem({
      external_id: row?.annId ? `bitget:${row.annId}` : null,
      url,
      title: detail.title,
      body_excerpt: detail.excerpt,
      published_at: timestamp(row?.cTime, nowMs),
      event_type_guess: exchangeEventType(category, row?.annTitle),
      metrics: mergeMetrics(detail.metrics, rowTimingMetrics(row)),
    }, source);
  })).filter(Boolean);
}

async function mapKucoin(payload, source, nowMs, request) {
  const rows = payload?.code === '200000' ? payload?.data?.list : null;
  if (!Array.isArray(rows)) throw new CollectorError(`${source.id} malformed payload`);
  return (await mapRows(rows, async row => {
    const types = Array.isArray(row?.type) ? row.type : [];
    const category = types.map(type => KUCOIN_TYPES[type]).find(Boolean) ?? null;
    const url = officialUrl(row?.url, 'www.kucoin.com');
    const detail = await announcementDetail({ title: row?.title, url, category, body: row?.description ?? row?.summary, publishedAt: timestamp(row?.releaseTime, nowMs), nowMs }, request);
    return buildItem({
      external_id: row?.id ? `kucoin:${row.id}` : null,
      url,
      title: detail.title,
      body_excerpt: detail.excerpt,
      published_at: timestamp(row?.releaseTime, nowMs),
      event_type_guess: exchangeEventType(category, row?.title),
      metrics: mergeMetrics(detail.metrics, rowTimingMetrics(row)),
    }, source);
  })).filter(Boolean);
}

function mapKrakenAnnouncements(xml, source, nowMs) {
  return parseFeed(xml).map(row => buildItem({
    external_id: row?.guid ? `kraken-blog:${row.guid}` : (row?.external_id ? `kraken-blog:${row.external_id}` : null),
    url: officialUrl(row?.url, 'blog.kraken.com'),
    title: row?.title,
    body_excerpt: 'listing',
    published_at: timestamp(row?.published_at, nowMs),
    event_type_guess: exchangeEventType('listing', row?.title),
  }, source)).filter(Boolean);
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

// Announcement bodies are optional enrichment: cap them per poll so a slow or blocking venue
// page can never push the list poll past the source timeout. Binance detail pages are
// client-rendered, so their body comes from the public CMS detail API instead.
const BODY_FETCH_DEFAULTS = Object.freeze({ maxFetches: 8, budgetMs: 25000, perFetchMs: 6000 });

function budgetedBodyRequest(request, options = {}) {
  const { maxFetches, budgetMs, perFetchMs } = { ...BODY_FETCH_DEFAULTS, ...(options ?? {}) };
  let used = 0;
  const deadline = Date.now() + budgetMs;
  return async (url, init) => {
    if (used >= maxFetches || Date.now() > deadline) throw new CollectorError('body fetch budget exhausted');
    used += 1;
    const binance = String(url).match(/^https:\/\/www\.binance\.com\/en\/support\/announcement\/detail\/([a-f0-9]{16,64})$/i);
    const run = binance
      ? request(`https://www.binance.com/bapi/composite/v1/public/cms/article/detail/query?articleCode=${binance[1]}`, { retry: false }).then(binanceBodyText)
      : request(url, init);
    let timer;
    try {
      return await Promise.race([run, new Promise((_, reject) => { timer = setTimeout(() => reject(new CollectorError('body fetch timeout')), perFetchMs); })]);
    } finally {
      clearTimeout(timer);
    }
  };
}

function binanceBodyText(payload) {
  let tree;
  try { tree = JSON.parse(payload?.data?.body ?? ''); } catch { return null; }
  const parts = [];
  const walk = node => {
    if (!node || typeof node !== 'object') return;
    if (node.node === 'text' && node.text) parts.push(node.text);
    (Array.isArray(node.child) ? node.child : []).forEach(walk);
    if (['p', 'li', 'h1', 'h2', 'h3', 'h4', 'tr', 'br'].includes(node.tag)) parts.push(' ');
  };
  walk(tree);
  const text = parts.join('').replace(/\s+/g, ' ').trim()
    .replace(/^This is a general announcement[^.]*\.(\s*Products and services[^.]*\.)?\s*/i, '');
  return text || null;
}

async function mapRows(rows, mapper, concurrency = 4) {
  const out = new Array(rows.length);
  let index = 0;
  const workers = Array.from({ length: Math.min(concurrency, rows.length) }, async () => {
    while (index < rows.length) {
      const current = index;
      index += 1;
      out[current] = await mapper(rows[current], current);
    }
  });
  await Promise.all(workers);
  return out;
}

// Body pages are fetched only when they can change a claim: hidden-asset titles, or recent
// listing/delisting notices. Older or general news rows keep the feed text, so a 10-minute
// poll does not re-download hundreds of announcement pages.
const BODY_FETCH_WINDOW_MS = 72 * 3600 * 1000;

async function announcementDetail({ title, url, category, body, publishedAt, nowMs }, request) {
  const hidden = hidesAsset(title, category);
  let sourceText = substantiveText(body);
  const publishedMs = publishedAt ? Date.parse(publishedAt) : NaN;
  const recentMarketNotice = ['listing', 'delisting'].includes(category)
    && Number.isFinite(publishedMs) && Number.isFinite(nowMs) && nowMs - publishedMs <= BODY_FETCH_WINDOW_MS;
  if ((hidden || (recentMarketNotice && (!sourceText || sourceText.length < 120))) && url) {
    const fetched = await fetchAnnouncementBody(url, request);
    if (fetched) sourceText = fetched;
  }
  const facts = storyFacts({ title, body_excerpt: sourceText ?? '' });
  const metrics = keyMetrics(facts);
  const tickers = metrics?.tickers ?? [];
  if (hidden && !tickers.length) {
    return {
      title,
      excerpt: sourceText ? substantiveExcerpt(sourceText, facts) : null,
      metrics: { ...(metrics ?? {}), detail_status: 'needs-detail' },
    };
  }
  const resolvedTitle = hidden && tickers.length ? `${plain(title)}: ${tickers.join(', ')}` : title;
  return {
    title: resolvedTitle,
    excerpt: substantiveExcerpt(sourceText, storyFacts({ title: resolvedTitle, body_excerpt: sourceText ?? '' })),
    metrics,
  };
}

async function fetchAnnouncementBody(url, request) {
  try {
    return substantiveText(await request(url, { format: 'text', retry: false }));
  } catch {
    return null;
  }
}

function substantiveText(value) {
  if (!['string', 'number', 'boolean'].includes(typeof value)) return null;
  const text = plain(String(value ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<header[\s\S]*?<\/header>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
    .replace(/&nbsp;/gi, ' '));
  if (!text || /^(listing|delisting|product_launch)$/i.test(text)) return null;
  return text;
}

function substantiveExcerpt(text, facts) {
  const body = substantiveText(text);
  if (!body) return null;
  const fields = keyFieldText(facts);
  const room = fields ? 600 - fields.length - 3 : 600;
  const excerpt = body.slice(0, Math.max(300, Math.min(600, room))).trim();
  return [excerpt, fields].filter(Boolean).join(' | ').slice(0, 600);
}

function keyMetrics(facts) {
  const out = {};
  const tickers = normalizeAssetTickers(facts.tickers);
  if (tickers.length) out.tickers = tickers;
  for (const key of ['dates', 'amounts']) if (facts[key]?.length) out[key] = facts[key];
  return Object.keys(out).length ? out : null;
}

function rowTimingMetrics(row) {
  const end = row?.endDateTimestamp ?? row?.endTime ?? row?.endTimestamp ?? row?.endAt;
  const start = row?.startDateTimestamp ?? row?.startTime ?? row?.startTimestamp ?? row?.startAt;
  const out = {};
  const endAt = timestamp(end, Number.MAX_SAFE_INTEGER);
  const startAt = timestamp(start, Number.MAX_SAFE_INTEGER);
  if (endAt) out.campaign_end_at = endAt;
  if (startAt) out.campaign_start_at = startAt;
  return Object.keys(out).length ? out : null;
}

function mergeMetrics(...values) {
  const out = Object.assign({}, ...values.filter(value => value && typeof value === 'object'));
  return Object.keys(out).length ? out : null;
}

function keyFieldText(facts) {
  const metrics = keyMetrics(facts);
  if (!metrics) return '';
  return `Key fields: ${Object.entries(metrics).map(([key, values]) => `${key} ${values.join(', ')}`).join('; ')}`;
}

function hidesAsset(title, category) {
  if (!['listing', 'delisting'].includes(category)) return false;
  const text = plain(title).toLowerCase();
  return /\b\d+\s+tokens?\b/.test(text) || /\btoken\(s\)\b/.test(text) || /\btrading pairs?\b/.test(text) && !storyFacts({ title }).tickers.length;
}

function normalizeAssetTickers(tickers = []) {
  const out = [];
  for (const ticker of tickers) {
    const value = String(ticker);
    const quote = value.match(/(USDT|USDC|USD)$/u)?.[1];
    const normalized = quote && value.length > quote.length + 1 ? value.slice(0, -quote.length) : value;
    if (normalized && !out.includes(normalized)) out.push(normalized);
  }
  return out;
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
