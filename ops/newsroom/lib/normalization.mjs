const TRACKING_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_id',
  'fbclid',
  'gclid',
  'mc_cid',
  'mc_eid',
  'ref',
  'ref_src',
]);

const ANNOUNCEMENT_SYMBOL_STOPWORDS = new Set(['NEW', 'SPOT', 'PERP', 'PAIR', 'PAIRS', 'TRADING', 'MARKET', 'MARKETS', 'TOKEN', 'TOKENS']);

export function canonicalizeUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(String(value));
    url.hostname = url.hostname.toLowerCase().replace(/^www\./, '').replace(/^mobile\./, '');
    if (url.hostname === 'twitter.com') url.hostname = 'x.com';
    url.hash = '';
    for (const key of [...url.searchParams.keys()]) {
      if (TRACKING_PARAMS.has(key.toLowerCase())) url.searchParams.delete(key);
    }
    const sorted = [...url.searchParams.entries()].sort(([a], [b]) => a.localeCompare(b));
    url.search = '';
    for (const [key, paramValue] of sorted) url.searchParams.append(key, paramValue);
    if ((url.protocol === 'https:' && url.port === '443') || (url.protocol === 'http:' && url.port === '80')) url.port = '';
    return url.toString().replace(/\/$/, '');
  } catch {
    return String(value).trim() || null;
  }
}

export function normalizeText(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[^\p{Letter}\p{Number}$#]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function trigrams(value) {
  // PostgreSQL pg_trgm pads each alphanumeric word with two leading spaces
  // and one trailing space before extracting trigrams.
  // https://www.postgresql.org/docs/16/pgtrgm.html
  const words = normalizeText(value).match(/[\p{Letter}\p{Number}]+/gu) ?? [];
  const grams = new Set();
  for (const word of words) {
    const padded = `  ${word} `;
    for (let i = 0; i <= padded.length - 3; i += 1) grams.add(padded.slice(i, i + 3));
  }
  return grams;
}

export function trigramSimilarity(left, right) {
  const a = trigrams(left);
  const b = trigrams(right);
  if (!a.size && !b.size) return 0;
  if (!a.size || !b.size) return 0;
  let shared = 0;
  for (const gram of a) if (b.has(gram)) shared += 1;
  return shared / (a.size + b.size - shared);
}

export function extractHardKeys(item) {
  const text = [
    item.official_notice_id,
    item.officialNoticeId,
    item.tx_hash,
    item.txHash,
    item.accession_number,
    item.accessionNumber,
    item.docket_number,
    item.docketNumber,
    item.url,
    item.canonical_url,
    item.canonicalUrl,
    item.title,
    item.body_excerpt,
    item.bodyExcerpt,
  ].filter(Boolean).join(' ');
  const keys = new Set();
  for (const match of text.matchAll(/\b0x[a-f0-9]{64}\b/gi)) keys.add(`tx:${match[0].toLowerCase()}`);
  for (const match of text.matchAll(/\b\d{10}-\d{2}-\d{6}\b/g)) keys.add(`sec:${match[0]}`);
  for (const match of text.matchAll(/\b(?:case|docket)\s*(?:no\.?|#)?\s*([0-9][a-z0-9:-]{4,})\b/gi)) keys.add(`docket:${match[1].toLowerCase()}`);
  if (item.official_notice_id || item.officialNoticeId) keys.add(`notice:${item.official_notice_id ?? item.officialNoticeId}`);
  const announcement = exchangeAnnouncementKey(item);
  if (announcement) keys.add(announcement);
  return [...keys].sort();
}

function exchangeAnnouncementKey(item) {
  const eventType = item.event_type_guess ?? item.eventTypeGuess ?? item.event_type ?? item.eventType;
  if (!['listing', 'delisting'].includes(eventType)) return null;
  const text = normalizeText([
    item.title,
    item.body_excerpt,
    item.bodyExcerpt,
    item.metrics?.venue,
    item.metrics?.provenance?.venue,
  ].filter(Boolean).join(' '));
  const venue = ['binance', 'okx', 'bybit', 'bitget', 'kraken', 'coinbase', 'kucoin', 'gate', 'mexc', 'htx']
    .find(name => text.includes(name) || String(item.source_id ?? item.sourceId ?? '').toLowerCase().includes(name));
  const symbol = extractAnnouncementSymbol([item.metrics?.symbol, item.metrics?.provenance?.symbol, item.title, item.body_excerpt, item.bodyExcerpt].filter(Boolean).join(' '));
  const published = itemSourcePublishedAt(item);
  const date = published ? published.toISOString().slice(0, 10) : null;
  if (!venue || !symbol || !date) return null;
  return `exchange-action:${venue}:${symbol}:${eventType}:${date}`;
}

function extractAnnouncementSymbol(value) {
  const text = String(value ?? '');
  for (const pattern of [
    /\b(?:lists?|listing|delists?|delisting)\s+(?:of\s+)?(?:[A-Z][A-Za-z0-9 .-]{1,80}\s+)?\(([A-Z0-9]{2,12})\)/i,
    /\b(?:lists?|listing|delists?|delisting)\s+([A-Z0-9]{2,12})\b/i,
    /\b([A-Z0-9]{2,12})(?:USDT|USDC|USD)\b/,
    /\b([A-Z0-9]{2,12})\s+(?:spot|perp|perpetual|trading pair|pairs?)\b/i,
  ]) {
    const match = text.match(pattern);
    if (match) {
      const symbol = match[1].toUpperCase();
      if (!ANNOUNCEMENT_SYMBOL_STOPWORDS.has(symbol)) return symbol;
    }
  }
  return null;
}

export function sourcePlatform(item) {
  return item.platform ?? item.source_platform ?? item.sourcePlatform ?? item.source?.platform ?? 'unknown';
}

export function sourceTier(item) {
  return Number(item.tier ?? item.source_tier ?? item.sourceTier ?? item.source?.tier ?? 3);
}

export function itemPublishedAt(item) {
  return itemSourcePublishedAt(item) ?? new Date(item.fetched_at ?? item.fetchedAt ?? 0);
}

export function itemSourcePublishedAt(item) {
  const value = item.published_at ?? item.publishedAt ?? item.source_published_at ?? item.sourcePublishedAt ?? null;
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

const NO_ENTITIES = Object.freeze([]);
const aliasCache = new WeakMap();
const entitiesCache = new WeakMap();

// Normalized aliases per watchlist array, computed once instead of per (item, event) comparison.
function watchlistAliases(watchlist) {
  let compiled = aliasCache.get(watchlist);
  if (compiled) return compiled;
  compiled = watchlist.filter(entity => !entity.status || entity.status === 'active').map(entity => ({
    id: entity.id,
    aliases: [
      entity.id,
      entity.partner_slug,
      entity.display_name?.en,
      entity.display_name?.['zh-Hans'],
      ...(entity.aliases ?? []),
    ].filter(Boolean).map(alias => normalizeText(alias)).filter(Boolean).map(normalized => ({
      normalized,
      token: /^[a-z0-9]+$/i.test(normalized) && !normalized.includes(' '),
    })),
  }));
  aliasCache.set(watchlist, compiled);
  return compiled;
}

// Pure function of (item object, watchlist array); dedupe asks once per candidate event, so cache it.
export function itemEntities(item, watchlist = NO_ENTITIES) {
  let byWatchlist = entitiesCache.get(item);
  if (!byWatchlist) entitiesCache.set(item, (byWatchlist = new Map()));
  if (!byWatchlist.has(watchlist)) byWatchlist.set(watchlist, computeItemEntities(item, watchlist));
  return [...byWatchlist.get(watchlist)];
}

function computeItemEntities(item, watchlist) {
  const explicit = new Set([item.subject_entity, item.subjectEntity, ...(item.entities ?? []), ...(item.subjects ?? [])].filter(Boolean));
  if (sourcePlatform(item) === 'exchange' && sourceTier(item) === 1) {
    const venue = String(item.source_id ?? item.sourceId ?? '').match(/^(binance|okx|bybit|bitget|coinbase|kucoin|kraken)-(?:announcements|status)$/)?.[1];
    if (venue) explicit.add(venue);
  }
  const text = normalizeText([item.title, item.body_excerpt, item.bodyExcerpt, item.author, item.author_account, item.authorAccount].filter(Boolean).join(' '));
  const tokens = new Set(text.split(' ').filter(Boolean));
  for (const entity of watchlistAliases(watchlist)) {
    if (entity.aliases.some(({ normalized, token }) => (token
      ? tokens.has(normalized) || tokens.has(`$${normalized}`) || tokens.has(`#${normalized}`)
      : text.includes(normalized)))) explicit.add(entity.id);
  }
  return [...explicit].sort();
}

export function originKey(item) {
  const mirrorKey = mirrorOriginKey(item);
  if (mirrorKey) return mirrorKey;
  if (item.origin_key || item.originKey) return String(item.origin_key ?? item.originKey);
  if (item.origin_item_id || item.originItemId) return `origin-item:${item.origin_item_id ?? item.originItemId}`;
  const referenced = item.referenced_tweet_id ?? item.referencedTweetId ?? item.referenced_tweets?.[0]?.id ?? item.referencedTweets?.[0]?.id;
  if (referenced) return `x:${referenced}`;
  const hardKey = extractHardKeys(item).find(key => !key.startsWith('exchange-action:') || !['media', 'google_news'].includes(sourcePlatform(item)));
  if (hardKey) return hardKey;
  const original = item.original_url ?? item.originalUrl ?? item.cited_original_url ?? item.citedOriginalUrl;
  if (original) {
    const canonical = canonicalizeUrl(original);
    const xStatus = canonical?.match(/^https:\/\/x\.com\/[^/]+\/status\/(\d+)/);
    if (xStatus) return `x:${xStatus[1]}`;
    return `url:${canonical}`;
  }
  const canonical = canonicalizeUrl(item.canonical_url ?? item.canonicalUrl ?? item.url);
  if (canonical) {
    const xStatus = canonical.match(/^https:\/\/x\.com\/[^/]+\/status\/(\d+)/);
    if (xStatus) return `x:${xStatus[1]}`;
    return `url:${canonical}`;
  }
  if (item.content_hash || item.contentHash) return `hash:${item.content_hash ?? item.contentHash}`;
  return `${item.source_id ?? item.sourceId ?? sourcePlatform(item)}:${item.external_id ?? item.externalId ?? item.id ?? 'unknown'}`;
}

function mirrorOriginKey(item) {
  const sourceId = String(item.source_id ?? item.sourceId ?? '');
  if (!sourceId.startsWith('nexualpha-official')) return null;
  const exchangeAction = extractHardKeys(item).find(key => key.startsWith('exchange-action:'));
  if (exchangeAction) return exchangeAction;
  const canonical = canonicalizeUrl(item.canonical_url ?? item.canonicalUrl ?? item.url);
  if (canonical) return `url:${canonical}`;
  return null;
}

export function commonValues(left = [], right = []) {
  const rightSet = new Set(right);
  return left.some(value => rightSet.has(value));
}
