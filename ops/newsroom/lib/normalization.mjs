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
  return [...keys].sort();
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

export function itemEntities(item, watchlist = []) {
  const explicit = new Set([item.subject_entity, item.subjectEntity, ...(item.entities ?? []), ...(item.subjects ?? [])].filter(Boolean));
  const text = normalizeText([item.title, item.body_excerpt, item.bodyExcerpt, item.author, item.author_account, item.authorAccount].filter(Boolean).join(' '));
  const tokens = new Set(text.split(' ').filter(Boolean));
  for (const entity of watchlist) {
    if (entity.status && entity.status !== 'active') continue;
    const aliases = [
      entity.id,
      entity.partner_slug,
      entity.display_name?.en,
      entity.display_name?.['zh-Hans'],
      ...(entity.aliases ?? []),
    ].filter(Boolean);
    if (aliases.some(alias => {
      const normalized = normalizeText(alias);
      if (!normalized) return false;
      if (/^[a-z0-9]+$/i.test(normalized) && !normalized.includes(' ')) {
        return tokens.has(normalized) || tokens.has(`$${normalized}`) || tokens.has(`#${normalized}`);
      }
      return text.includes(normalized);
    })) explicit.add(entity.id);
  }
  return [...explicit].sort();
}

export function originKey(item) {
  if (item.origin_key || item.originKey) return String(item.origin_key ?? item.originKey);
  if (item.origin_item_id || item.originItemId) return `origin-item:${item.origin_item_id ?? item.originItemId}`;
  const referenced = item.referenced_tweet_id ?? item.referencedTweetId ?? item.referenced_tweets?.[0]?.id ?? item.referencedTweets?.[0]?.id;
  if (referenced) return `x:${referenced}`;
  const hardKey = extractHardKeys(item)[0];
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

export function commonValues(left = [], right = []) {
  const rightSet = new Set(right);
  return left.some(value => rightSet.has(value));
}
