import {
  canonicalizeUrl,
  commonValues,
  extractHardKeys,
  itemEntities,
  itemPublishedAt,
  itemSourcePublishedAt,
  originKey,
  sourcePlatform,
  sourceTier,
  trigramSimilarity,
} from './normalization.mjs';

export const DEFAULT_DEDUPE_CONFIG = {
  eventWindowHours: 48,
  titleSimilarity: 0.45,
};

const COMPATIBLE_EVENT_TYPES = new Map([
  ['withdrawal_halt', new Set(['withdrawal_halt', 'insolvency'])],
  ['bankruptcy_filing', new Set(['bankruptcy_filing', 'insolvency'])],
]);

function eventTypeOf(item) {
  return item.event_type ?? item.eventType ?? item.event_type_guess ?? item.eventTypeGuess ?? 'unknown';
}

function compatibleEventType(left, right) {
  if (left === right) return true;
  return COMPATIBLE_EVENT_TYPES.get(left)?.has(right) || COMPATIBLE_EVENT_TYPES.get(right)?.has(left) || false;
}

function timeDistanceHours(left, right) {
  const diff = Math.abs(left.getTime() - right.getTime());
  return diff / 36e5;
}

function linksFor(item) {
  return [
    item.original_url,
    item.originalUrl,
    item.cited_original_url,
    item.citedOriginalUrl,
    item.canonical_url,
    item.canonicalUrl,
    item.url,
  ].map(canonicalizeUrl).filter(Boolean);
}

function defaultEvidenceKind(item) {
  const platform = sourcePlatform(item);
  if (platform === 'x' || platform === 'telegram' || platform === 'weibo' || platform === 'instagram' || platform === 'tiktok') return 'social_post';
  if (platform === 'youtube') return 'video';
  if (platform === 'market') return 'market_data';
  if (platform === 'onchain') return (item.tx_hash || item.txHash || extractHardKeys(item).some(key => key.startsWith('tx:'))) ? 'onchain_tx' : 'market_data';
  if (platform === 'court') return 'court_record';
  if (platform === 'edgar') return 'filing';
  if (platform === 'media' || platform === 'google_news') return 'media_report';
  if (sourceTier(item) === 1 && ['exchange', 'project', 'regulator', 'court', 'edgar'].includes(platform)) return 'official_notice';
  return 'media_report';
}

function itemId(item) {
  return item.id ?? JSON.stringify([item.source_id ?? item.sourceId ?? '', item.external_id ?? item.externalId ?? item.url]);
}

function simhashValue(value) {
  const signedMin = -(1n << 63n);
  const unsignedMax = (1n << 64n) - 1n;
  let parsed = null;
  if (typeof value === 'bigint') parsed = value;
  if (typeof value === 'number' && Number.isSafeInteger(value)) parsed = BigInt(value);
  if (typeof value === 'string' && /^-?\d+$/.test(value)) parsed = BigInt(value);
  if (parsed == null || parsed < signedMin || parsed > unsignedMax) return null;
  return BigInt.asUintN(64, parsed);
}

function resolveOriginKey(item, itemsById, duplicateOriginById, seen = new Set()) {
  const duplicateOrigin = duplicateOriginById.get(itemId(item));
  if (duplicateOrigin) return duplicateOrigin;
  const parentId = item.origin_item_id ?? item.originItemId;
  if (parentId && !seen.has(parentId) && itemsById.has(parentId)) {
    seen.add(parentId);
    return resolveOriginKey(itemsById.get(parentId), itemsById, duplicateOriginById, seen);
  }
  return originKey(item);
}

function buildEvidence(item, itemsById, duplicateOriginById) {
  const excerpt = item.excerpt ?? item.body_excerpt ?? item.bodyExcerpt ?? item.title ?? null;
  const sourcePublishedAt = itemSourcePublishedAt(item);
  return {
    raw_item_id: item.id ?? null,
    url: canonicalizeUrl(item.url ?? item.canonical_url ?? item.canonicalUrl) ?? '',
    kind: item.evidence_kind ?? item.evidenceKind ?? defaultEvidenceKind(item),
    is_independent: true,
    origin_key: resolveOriginKey(item, itemsById, duplicateOriginById),
    excerpt: excerpt == null ? null : String(excerpt).slice(0, 600),
    author_account: item.author_account ?? item.authorAccount ?? null,
    published_at: sourcePublishedAt ? sourcePublishedAt.toISOString() : null,
    source_platform: sourcePlatform(item),
    source_tier: sourceTier(item),
    metrics: item.metrics ?? null,
    metrics_at: item.metrics_at ?? item.metricsAt ?? null,
  };
}

function hammingDistance(left, right) {
  const leftValue = simhashValue(left);
  const rightValue = simhashValue(right);
  if (leftValue == null || rightValue == null) return Number.POSITIVE_INFINITY;
  let value = leftValue ^ rightValue;
  let count = 0;
  while (value) {
    count += Number(value & 1n);
    value >>= 1n;
  }
  return count;
}

function normalizeExistingEvent(event) {
  const evidence = event.evidence ?? [];
  const rawItems = event.raw_items ?? event.rawItems ?? [];
  return {
    ...event,
    subjects: [...new Set([event.subject_entity, event.subjectEntity, ...(event.subjects ?? [])].filter(Boolean))],
    event_type: event.event_type ?? event.eventType ?? 'unknown',
    title_internal: event.title_internal ?? event.titleInternal ?? '',
    source_published_at: event.source_published_at ?? event.sourcePublishedAt ?? event.published_at ?? event.publishedAt ?? null,
    original_links: event.original_links ?? event.originalLinks ?? [],
    hard_keys: event.hard_keys ?? event.hardKeys ?? [],
    content_hashes: event.content_hashes ?? event.contentHashes ?? rawItems.map(item => item.content_hash ?? item.contentHash).filter(Boolean),
    simhashes: event.simhashes ?? rawItems.map(item => item.simhash).filter(value => simhashValue(value) != null),
    evidence,
    discussion: event.discussion ?? discussionFromEvidence(evidence),
    raw_items: rawItems,
  };
}

function discussionFromEvidence(evidence) {
  const originSeen = new Set();
  const byPlatform = {};
  for (const row of evidence) {
    const platform = row.source_platform;
    byPlatform[platform] ??= {
      independent_posts: 0,
      origin_keys: [],
      metric_growth_max: null,
      metrics_unknown: false,
    };
    const firstForOrigin = !originSeen.has(row.origin_key);
    if (firstForOrigin) {
      originSeen.add(row.origin_key);
      byPlatform[platform].independent_posts += 1;
      byPlatform[platform].origin_keys.push(row.origin_key);
    }
    row.is_independent = firstForOrigin;
    const growth = row.metrics?.growth ?? row.metrics?.growth_ratio ?? row.metrics?.growthRatio ?? null;
    if (firstForOrigin && Number.isFinite(growth)) byPlatform[platform].metric_growth_max = Math.max(byPlatform[platform].metric_growth_max ?? 0, growth);
    if (row.metrics == null) byPlatform[platform].metrics_unknown = true;
  }
  return {
    // This count is by origin_key only: syndication, quote coverage and reposts
    // of one source are one independent source.
    independent_origin_keys: [...originSeen],
    independent_sources: originSeen.size,
    platforms_with_independent_items: Object.values(byPlatform).filter(value => value.independent_posts > 0).length,
    by_platform: byPlatform,
    metric_total_across_platforms: null,
  };
}

function createEvent(item, index, watchlist, itemsById, duplicateOriginById) {
  const subjects = itemEntities(item, watchlist);
  const sourcePublishedAt = itemSourcePublishedAt(item);
  const evidence = [buildEvidence(item, itemsById, duplicateOriginById)];
  return {
    id: item.event_id ?? item.eventId ?? `event-${index + 1}`,
    subject_entity: item.subject_entity ?? item.subjectEntity ?? subjects[0] ?? null,
    subjects,
    event_type: eventTypeOf(item),
    title_internal: item.title ?? 'Untitled newsroom event',
    occurred_at: (item.occurred_at ?? item.occurredAt) ? new Date(item.occurred_at ?? item.occurredAt).toISOString() : null,
    source_published_at: sourcePublishedAt ? sourcePublishedAt.toISOString() : null,
    original_links: [...new Set(linksFor(item))],
    hard_keys: extractHardKeys(item),
    content_hashes: [item.content_hash ?? item.contentHash].filter(Boolean),
    simhashes: [item.simhash].filter(value => simhashValue(value) != null),
    evidence,
    discussion: discussionFromEvidence(evidence),
    raw_items: [item],
  };
}

function shouldAttach(item, event, config, watchlist, itemsById, duplicateOriginById) {
  const itemSubjects = itemEntities(item, watchlist);
  if (!itemSubjects.length || !commonValues(itemSubjects, event.subjects)) return false;
  if (!compatibleEventType(eventTypeOf(item), event.event_type)) return false;
  const itemOccurred = item.occurred_at ?? item.occurredAt;
  const eventOccurred = event.occurred_at ?? event.occurredAt;
  const knownOccurrences = itemOccurred && eventOccurred && Number.isFinite(Date.parse(itemOccurred)) && Number.isFinite(Date.parse(eventOccurred));
  const eventTime = knownOccurrences ? new Date(eventOccurred) : event.source_published_at ? new Date(event.source_published_at) : itemPublishedAt(event.raw_items?.[0] ?? event);
  if (timeDistanceHours(knownOccurrences ? new Date(itemOccurred) : itemPublishedAt(item), eventTime) > config.eventWindowHours) return false;
  const itemHardKeys = extractHardKeys(item);
  if (itemHardKeys.length && commonValues(itemHardKeys, event.hard_keys)) return true;
  const itemOrigin = resolveOriginKey(item, itemsById, duplicateOriginById);
  if (itemOrigin && event.evidence?.some(row => row.origin_key === itemOrigin)) return true;
  const itemLinks = linksFor(item);
  if (itemLinks.length && commonValues(itemLinks, event.original_links)) return true;
  const contentHash = item.content_hash ?? item.contentHash;
  if (contentHash && event.content_hashes?.includes(contentHash)) return true;
  if (simhashValue(item.simhash) != null && event.simhashes?.some(value => hammingDistance(item.simhash, value) <= 3)) return true;
  return trigramSimilarity(item.title ?? '', event.title_internal) >= config.titleSimilarity;
}

function attachItem(event, item, itemsById, duplicateOriginById) {
  event.raw_items.push(item);
  event.evidence.push(buildEvidence(item, itemsById, duplicateOriginById));
  event.original_links = [...new Set([...event.original_links, ...linksFor(item)])];
  event.hard_keys = [...new Set([...event.hard_keys, ...extractHardKeys(item)])].sort();
  event.content_hashes = [...new Set([...(event.content_hashes ?? []), item.content_hash ?? item.contentHash].filter(Boolean))];
  event.simhashes = [...new Set([...(event.simhashes ?? []), item.simhash].filter(value => simhashValue(value) != null))];
  const sourcePublishedAt = itemSourcePublishedAt(item);
  if (sourcePublishedAt && (!event.source_published_at || sourcePublishedAt < new Date(event.source_published_at))) event.source_published_at = sourcePublishedAt.toISOString();
  event.discussion = discussionFromEvidence(event.evidence);
}

function parentOriginKey(item, itemsById, seen = new Set()) {
  const parentId = item.origin_item_id ?? item.originItemId;
  if (parentId && !seen.has(parentId) && itemsById.has(parentId)) {
    seen.add(parentId);
    return parentOriginKey(itemsById.get(parentId), itemsById, seen);
  }
  return originKey(item);
}

function duplicateOriginMap(items, itemsById) {
  const sorted = [...items].sort((a, b) => itemPublishedAt(a) - itemPublishedAt(b));
  const byContentHash = new Map();
  const simhashRoots = [];
  const result = new Map();
  for (const item of sorted) {
    const id = itemId(item);
    const contentHash = item.content_hash ?? item.contentHash;
    if (contentHash && byContentHash.has(contentHash)) {
      result.set(id, byContentHash.get(contentHash));
      continue;
    }
    const simhash = simhashValue(item.simhash);
    if (simhash != null) {
      const match = simhashRoots.find(root => hammingDistance(simhash, root.simhash) <= 3 && timeDistanceHours(itemPublishedAt(item), root.publishedAt) <= DEFAULT_DEDUPE_CONFIG.eventWindowHours);
      if (match) {
        result.set(id, match.origin);
        continue;
      }
    }
    const rootOrigin = parentOriginKey(item, itemsById);
    if (contentHash) byContentHash.set(contentHash, rootOrigin);
    if (simhash != null) simhashRoots.push({ simhash, publishedAt: itemPublishedAt(item), origin: rootOrigin });
  }
  return result;
}

export function mergeRawItems(items, options = {}) {
  const config = { ...DEFAULT_DEDUPE_CONFIG, ...(options.config ?? {}) };
  const watchlist = options.watchlist ?? [];
  const events = structuredClone(options.existingEvents ?? []).map(normalizeExistingEvent);
  const itemsById = new Map(items.map(item => [itemId(item), item]));
  const duplicateOriginById = duplicateOriginMap(items, itemsById);
  const assignments = new Map();
  const seenExternalIds = new Set();
  for (const item of [...items].sort((a, b) => itemPublishedAt(a) - itemPublishedAt(b))) {
    const externalId = item.external_id ?? item.externalId;
    const uniqueKey = externalId ? JSON.stringify([item.source_id ?? item.sourceId ?? '', externalId]) : item.id ? `id:${item.id}` : null;
    if (uniqueKey && seenExternalIds.has(uniqueKey)) continue;
    if (uniqueKey) seenExternalIds.add(uniqueKey);
    let event = events.find(candidate => shouldAttach(item, candidate, config, watchlist, itemsById, duplicateOriginById));
    if (!event) {
      event = createEvent(item, events.length, watchlist, itemsById, duplicateOriginById);
      events.push(event);
    } else {
      attachItem(event, item, itemsById, duplicateOriginById);
    }
    assignments.set(itemId(item), event.id);
  }
  return { events, assignments };
}

export function countIndependentSources(evidence = []) {
  return new Set(evidence.map(row => row.origin_key ?? row.originKey).filter(Boolean)).size;
}
