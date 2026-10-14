// Persistence worker for the pure merge/scoring functions (T6 deployment).
// `dedupe` assigns unassigned raw_items to events; `score` appends event_scores rows.
// `status` and `exportTop` are read-only JSON views for operators and the Mac-side writer.
// Every function takes `execute(sql) -> stdout` (runPsql in production, a fake in tests).
import { relevanceForItem } from './relevance.mjs';
import { verifyEvent } from './verification.mjs';
import { mergeRawItems } from './dedupe.mjs';
import { configFromNewsroomRows, credibilityScore, scoreEvent } from './scoring.mjs';
import { dedupeEvidenceRows, isMirrorEvidence } from './evidence-quality.mjs';
import { claimFreshnessEligibilitySql, claimMarketNoiseEligibilitySql, claimRankOrderSql, claimStoryGroupKeySql, claimStoryVenueJsonSql, claimStoryWindowSql } from './claim-quality.mjs';
import { KNOWN_VENUES, inferNarrativeType, storyFacts } from './facts.mjs';

const lit = value => (value == null ? 'NULL' : `'${String(value).replaceAll("'", "''")}'`);
const jsonb = value => (value == null ? 'NULL' : `${lit(JSON.stringify(value))}::jsonb`);
const textArray = values => `ARRAY[${(values ?? []).map(lit).join(',')}]::text[]`;
const ts = value => (value ? `${lit(value)}::timestamptz` : 'NULL');
const parse = output => JSON.parse(output || '[]');
const rows = query => `SELECT coalesce(jsonb_agg(to_jsonb(result)), '[]'::jsonb) FROM (${query}) result;`;
const EVIDENCE_KINDS = new Set(['official_notice', 'original_statement', 'filing', 'court_record', 'onchain_tx', 'market_data', 'media_report', 'social_post', 'video']);

const ITEM_COLUMNS = `r.id, r.source_id, r.external_id, r.url, r.canonical_url, r.origin_item_id, r.author, r.author_account,
  r.title, r.body_excerpt, r.lang, r.published_at, r.fetched_at, r.metrics, r.metrics_at, r.entities, r.event_type_guess,
  r.simhash::text AS simhash, r.content_hash, s.platform, s.tier, s.verified_official`;

function boundedInteger(value, fallback, { min = 1, max = 100000 } = {}) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= min ? Math.min(parsed, max) : fallback;
}

function positiveIntegerLiteral(value, fallback = '0') {
  const text = String(value ?? '').trim();
  return /^(0|[1-9]\d*)$/u.test(text) ? text : fallback;
}

function existingEventsQuery({ windowHours, limit, afterId = '0' }) {
  return rows(`SELECT e.id, e.subject_entity, e.subjects, e.event_type, e.title_internal, e.occurred_at,
      e.source_published_at, e.original_links, e.discussion, e.effective_at, e.deadline_at, e.major_followup_at,
      e.story_asset, e.story_action, e.story_group_key,
      coalesce((SELECT jsonb_agg(jsonb_build_object('raw_item_id', v.raw_item_id, 'url', v.url, 'kind', v.kind, 'origin_key', v.origin_key,
        'is_independent', v.is_independent, 'excerpt', v.excerpt, 'author_account', v.author_account, 'published_at', v.published_at, 'source_platform', s.platform, 'source_tier', s.tier,
        'metrics', r.metrics, 'source_id', r.source_id) ORDER BY v.id)
        FROM event_evidence v LEFT JOIN raw_items r ON r.id=v.raw_item_id LEFT JOIN sources s ON s.id=r.source_id
        WHERE v.event_id=e.id), '[]'::jsonb) AS evidence,
      coalesce((SELECT jsonb_agg(jsonb_build_object('id', r.id, 'content_hash', r.content_hash, 'simhash', r.simhash::text,
        'published_at', r.published_at, 'fetched_at', r.fetched_at, 'title', r.title, 'body_excerpt', r.body_excerpt, 'source_id', r.source_id, 'entities', r.entities, 'event_type_guess', r.event_type_guess, 'metrics', r.metrics, 'url', r.url, 'canonical_url', r.canonical_url, 'platform', s2.platform, 'tier', s2.tier)) FROM raw_items r LEFT JOIN sources s2 ON s2.id=r.source_id WHERE r.event_id=e.id), '[]'::jsonb) AS raw_items
    FROM events e
    WHERE e.state NOT IN ('rejected','expired') AND e.last_update_at > now() - interval '${Number(windowHours)} hours'
      AND e.id > ${positiveIntegerLiteral(afterId)}
    ORDER BY e.id
    LIMIT ${Number(limit)}`);
}

function loadExistingDedupeEvents(execute, { windowHours, existingEventLimit }) {
  const existingEvents = [];
  let afterId = '0';
  for (;;) {
    const page = parse(execute(existingEventsQuery({ windowHours, limit: existingEventLimit, afterId })));
    existingEvents.push(...page);
    if (page.length < existingEventLimit) break;
    const nextId = positiveIntegerLiteral(page.at(-1)?.id, afterId);
    if (BigInt(nextId) <= BigInt(afterId)) throw new Error('dedupe event cursor did not advance');
    afterId = nextId;
  }
  return existingEvents;
}

export function loadDedupeInputs(execute, { windowHours = 48, limit = 3000, existingEventLimit = 250 } = {}) {
  const itemLimit = boundedInteger(limit, 3000, { max: 10000 });
  const eventLimit = boundedInteger(existingEventLimit, 250, { max: 5000 });
  const watchlist = parse(execute(rows(`SELECT id, kind, display_name, aliases, partner_slug, priority, status FROM watchlist_entities WHERE status='active'`)));
  const keywords = parse(execute(rows(`SELECT term, lang, event_type, entity_id, weight, status FROM keywords WHERE status='active'`)));
  const items = parse(execute(rows(`SELECT ${ITEM_COLUMNS} FROM raw_items r JOIN sources s ON s.id=r.source_id
    WHERE r.event_id IS NULL AND r.state='pending'
    ORDER BY r.id LIMIT ${itemLimit}`)));
  if (!items.length) return { watchlist, keywords, items, existingEvents: [] };
  const existingEvents = loadExistingDedupeEvents(execute, { windowHours, existingEventLimit: eventLimit });
  return { watchlist, keywords, items, existingEvents };
}

function evidenceValues(row) {
  const kind = EVIDENCE_KINDS.has(row.kind) ? row.kind : 'media_report';
  return `(${row.raw_item_id == null ? 'NULL' : Number(row.raw_item_id)}, ${lit(row.url || '')}, ${lit(kind)}, ${row.is_independent === false ? 'false' : 'true'}, ${lit(row.origin_key)}, ${lit(row.excerpt)}, ${lit(row.author_account)}, ${ts(row.published_at)})`;
}

function eventClaimMetadata(event) {
  const sourceRows = (event.raw_items?.length ? event.raw_items : event.evidence ?? []).map(row => ({ ...row, body_excerpt: row.body_excerpt ?? row.excerpt }));
  const facts = sourceRows.map(item => storyFacts(item));
  const metrics = sourceRows.map(item => item.metrics).filter(value => value && typeof value === 'object');
  const action = storyAction(event, facts);
  const asset = storyAsset(event, facts, metrics);
  const explicitDate = storyExplicitDate(event, facts, action, sourceRows);
  const metricDates = metricDateFields(metrics);
  const market = normalizedMarketMetrics(event, metrics);
  const venues = storyVenues(event, facts, metrics, sourceRows);
  const eventType = storyEventType(event, action, sourceRows);
  const discussion = { ...(event.discussion ?? {}) };
  if (asset && !discussion.asset) discussion.asset = asset;
  if (action && !discussion.action) discussion.action = action;
  if (Object.keys(market).length) discussion.market = { ...(discussion.market ?? {}), ...market };
  if (venues.length) discussion.story_venues = venues;
  const storyGroupKey = asset && action ? `${action}:${asset.toLowerCase()}` : event.story_group_key ?? event.storyGroupKey ?? null;
  return {
    discussion,
    story_asset: asset,
    story_action: action,
    story_group_key: storyGroupKey,
    event_type: eventType,
    effective_at: (event.effective_at ?? event.effectiveAt) || metricDates.effective_at || (action === 'listing' ? explicitDate : null),
    deadline_at: (event.deadline_at ?? event.deadlineAt) || metricDates.deadline_at || (action === 'delisting' ? explicitDate : null),
    major_followup_at: event.major_followup_at ?? event.majorFollowupAt ?? null,
  };
}

function storyAction(event, facts) {
  const action = event.story_action ?? event.storyAction ?? null;
  if (action) return action;
  const type = event.event_type ?? event.eventType;
  if (type === 'listing' || type === 'delisting') return type;
  return facts.find(row => row.action && row.action !== 'unknown')?.action ?? null;
}

function storyEventType(event, action, sourceRows) {
  const current = event.event_type ?? event.eventType ?? null;
  if (current && current !== 'unknown') return current;
  const actionType = { withdrawal_resume: 'withdrawal_halt', price_rise: 'price_move', price_fall: 'price_move' }[action] ?? action;
  if (actionType && actionType !== 'unknown') return actionType;
  const text = [event.title_internal, event.titleInternal, event.fact_summary, event.factSummary, ...sourceRows.flatMap(row => [row.title, row.body_excerpt, row.bodyExcerpt, row.excerpt])].filter(Boolean).join(' ');
  return inferNarrativeType(text) ?? current ?? 'unknown';
}

function storyAsset(event, facts, metrics) {
  const explicit = event.story_asset ?? event.storyAsset ?? null;
  if (explicit) return String(explicit).toUpperCase();
  const metricTicker = metrics.flatMap(row => row.tickers ?? row.assets ?? row.asset_symbols ?? []).find(Boolean);
  if (metricTicker) return normalizeAsset(metricTicker);
  const ticker = facts.flatMap(row => row.tickers ?? []).find(Boolean);
  if (ticker) return normalizeAsset(ticker);
  return null;
}

function storyVenues(event, facts, metrics, sourceRows) {
  const known = new Set(KNOWN_VENUES);
  const sourceVenueRe = new RegExp(`^(${KNOWN_VENUES.join('|')})-(?:announcements|status)$`, 'u');
  const values = [
    ...(Array.isArray(event.discussion?.story_venues) ? event.discussion.story_venues : []),
    ...(event.story_venues ?? event.storyVenues ?? []),
    ...metrics.flatMap(row => [row.venue, row.provenance?.venue, row.exchange]).filter(Boolean),
    ...sourceRows.flatMap(row => [row.source_id, row.sourceId]).filter(Boolean).map(value => String(value).match(sourceVenueRe)?.[1]).filter(Boolean),
    ...facts.flatMap(row => row.venues ?? []),
  ];
  return [...new Set(values.map(value => String(value).toLowerCase()).filter(value => known.has(value)))].sort();
}

function normalizeAsset(value) {
  const upper = String(value ?? '').toUpperCase();
  const quote = upper.match(/(USDT|USDC|USD)$/u)?.[1];
  return quote && upper.length > quote.length + 1 ? upper.slice(0, -quote.length) : upper;
}

function storyExplicitDate(event, facts, action = event.event_type ?? event.eventType, sourceRows = event.raw_items ?? []) {
  const sourceMs = Date.parse(event.source_published_at ?? event.sourcePublishedAt ?? event.raw_items?.[0]?.published_at ?? event.raw_items?.[0]?.publishedAt ?? '');
  const candidates = [];
  for (const item of sourceRows) {
    const text = [item.title, item.body_excerpt, item.bodyExcerpt].filter(Boolean).join(' ').normalize('NFKC');
    candidates.push(...eventTimeCandidates(text, action));
  }
  const valid = candidates
    .map(candidate => ({ ...candidate, ms: Date.parse(candidate.iso) }))
    .filter(candidate => Number.isFinite(candidate.ms) && (!Number.isFinite(sourceMs) || candidate.ms >= sourceMs - 24 * 36e5))
    .sort((a, b) => b.score - a.score || a.ms - b.ms);
  return valid[0]?.iso ?? null;
}

function eventTimeCandidates(text, action) {
  const out = [];
  const actionRe = action === 'delisting'
    ? /\bdelist|remove|trading pair|cease|stop trading|下架|退市/iu
    : /\blist|trading starts|trading opens|available for trading|上线|上線/iu;
  const sentences = text.split(/(?<=[.!?。；;])\s+/u).filter(Boolean);
  for (const sentence of sentences) {
    if (!actionRe.test(sentence)) continue;
    if (/\breview|published|announcement|updated\b/i.test(sentence) && !/\bdelist|list|trading|下架|上线|上線/iu.test(sentence)) continue;
    for (const match of sentence.matchAll(/\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::\d{2})?\s*(UTC|GMT|Z)?)?/gi)) {
      const date = `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
      const timezone = match[6] || /\b(?:UTC|GMT|Z)\b/i.test(sentence);
      const iso = match[4] && timezone ? `${date}T${match[4].padStart(2, '0')}:${match[5]}:00Z` : `${date}T23:59:59Z`;
      out.push({ iso, score: match[4] && timezone ? 3 : 2 });
    }
    for (const match of sentence.matchAll(/\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+(\d{1,2}),?\s+(20\d{2})(?:\s+at\s+(\d{1,2}):(\d{2})\s*(UTC|GMT|Z)?)?/gi)) {
      const month = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'].findIndex(value => match[1].toLowerCase().startsWith(value)) + 1;
      const date = `${match[3]}-${String(month).padStart(2, '0')}-${match[2].padStart(2, '0')}`;
      const timezone = match[6] || /\b(?:UTC|GMT|Z)\b/i.test(sentence);
      const iso = match[4] && timezone ? `${date}T${match[4].padStart(2, '0')}:${match[5]}:00Z` : `${date}T23:59:59Z`;
      out.push({ iso, score: match[4] && timezone ? 3 : 2 });
    }
    for (const match of sentence.matchAll(/\bat\s+(\d{1,2}):(\d{2})\s+(?:on\s+)?(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})(?:[^.?!;。；]*?\b(UTC|GMT|Z)\b)?/gi)) {
      if (!match[6] && !/\b(?:UTC|GMT|Z)\b/i.test(sentence)) continue;
      const date = `${match[3]}-${match[4].padStart(2, '0')}-${match[5].padStart(2, '0')}`;
      out.push({ iso: `${date}T${match[1].padStart(2, '0')}:${match[2]}:00Z`, score: 3 });
    }
    for (const match of sentence.matchAll(/\bat\s+(\d{1,2}):(\d{2})\s+(?:on\s+)?(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s*(\d{1,2}),?\s*(20\d{2})(?:[^.?!;。；]*?\b(UTC|GMT|Z)\b)?/gi)) {
      const month = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'].findIndex(value => match[3].toLowerCase().startsWith(value)) + 1;
      const date = `${match[5]}-${String(month).padStart(2, '0')}-${match[4].padStart(2, '0')}`;
      if (!match[6] && !/\b(?:UTC|GMT|Z)\b/i.test(sentence)) continue;
      out.push({ iso: `${date}T${match[1].padStart(2, '0')}:${match[2]}:00Z`, score: 3 });
    }
  }
  return out;
}

function firstValidIso(values) {
  for (const value of values) {
    if (!value) continue;
    const date = new Date(value);
    if (Number.isFinite(date.getTime())) return date.toISOString();
  }
  return null;
}

function metricDateFields(metrics) {
  return {
    effective_at: firstValidIso(metrics.map(row => row.effective_at ?? row.effectiveAt)),
    deadline_at: firstValidIso(metrics.map(row => row.deadline_at ?? row.deadlineAt ?? row.campaign_end_at ?? row.campaignEndAt)),
  };
}

function normalizedMarketMetrics(event, metrics) {
  const out = {};
  for (const row of metrics) {
    const window = String(row.provenance?.window ?? row.window ?? '').toLowerCase();
    if ((event.event_type ?? event.eventType) === 'liquidation_wave') {
      if (window === 'h1' && Number.isFinite(Number(row.total_liquidations_usd))) out.liquidations_usd_1h = Number(row.total_liquidations_usd);
      if (window === 'h24' && Number.isFinite(Number(row.total_liquidations_usd))) out.liquidations_usd_24h = Number(row.total_liquidations_usd);
    }
    const move = row.price_move_pct_1h ?? row.price_change_pct_1h ?? row.change_pct_1h;
    if (Number.isFinite(Number(move))) out.price_move_pct_1h = Number(move);
  }
  return out;
}

// Builds one transaction. The pure relevance gate supplies irrelevantItems; those rows are marked
// terminally irrelevant so the incremental queue does not reread them forever.
export function buildDedupeSql({ events, irrelevantItems = [] }, batchItemIds) {
  const batch = new Set(batchItemIds.map(Number));
  const statements = [];
  const assignedIds = new Set();
  const stats = { created: 0, updated: 0, assigned: 0, skipped_items: 0 };
  for (const event of events) {
    const meta = eventClaimMetadata(event);
    const newItems = (event.raw_items ?? []).filter(item => batch.has(Number(item.id)));
    if (!newItems.length) continue;
    const newIds = newItems.map(item => Number(item.id));
    for (const id of newIds) assignedIds.add(id);
    const newEvidence = dedupeEvidenceRows(event.evidence.filter(row => row.raw_item_id != null && batch.has(Number(row.raw_item_id)) && !isMirrorEvidence(row)));
    const credibility = credibilityScore(event);
    const isExisting = /^\d+$/.test(String(event.id));
    const evidenceInsert = newEvidence.length
      ? `INSERT INTO event_evidence(event_id, raw_item_id, url, kind, is_independent, origin_key, excerpt, author_account, published_at) SELECT target.id, v.raw_item_id::bigint, v.url, v.kind, v.is_independent, v.origin_key, v.excerpt, v.author_account, v.published_at::timestamptz FROM target, (VALUES ${newEvidence.map(evidenceValues).join(', ')}) AS v(raw_item_id, url, kind, is_independent, origin_key, excerpt, author_account, published_at)
        WHERE NOT EXISTS (
          SELECT 1 FROM event_evidence existing
          WHERE existing.event_id=target.id
            AND existing.url=v.url
            AND existing.kind=v.kind
            AND existing.origin_key IS NOT DISTINCT FROM v.origin_key
            AND existing.excerpt IS NOT DISTINCT FROM v.excerpt
            AND existing.author_account IS NOT DISTINCT FROM v.author_account
            AND existing.published_at IS NOT DISTINCT FROM v.published_at::timestamptz
        )`
      : null;
    const target = isExisting
      ? `UPDATE events SET last_update_at=now(), subjects=${textArray(event.subjects)}, original_links=${textArray(event.original_links)},
          source_published_at=${ts(event.source_published_at)}, discussion=${jsonb(meta.discussion)}, credibility=${credibility},
          event_type=${lit(meta.event_type)},
          effective_at=${ts(meta.effective_at)}, deadline_at=${ts(meta.deadline_at)}, major_followup_at=${ts(meta.major_followup_at)},
          story_asset=${lit(meta.story_asset)}, story_action=${lit(meta.story_action)}, story_group_key=${lit(meta.story_group_key)}
          WHERE id=${Number(event.id)} RETURNING id`
      : `INSERT INTO events(subject_entity, subjects, event_type, title_internal, occurred_at, source_published_at, original_links, discussion, credibility, effective_at, deadline_at, major_followup_at, story_asset, story_action, story_group_key)
          VALUES (${lit(event.subject_entity)}, ${textArray(event.subjects)}, ${lit(meta.event_type || event.event_type || 'unknown')}, ${lit(String(event.title_internal || 'Untitled newsroom event').slice(0, 600))},
          ${ts(event.occurred_at)}, ${ts(event.source_published_at)}, ${textArray(event.original_links)}, ${jsonb(meta.discussion)}, ${credibility},
          ${ts(meta.effective_at)}, ${ts(meta.deadline_at)}, ${ts(meta.major_followup_at)}, ${lit(meta.story_asset)}, ${lit(meta.story_action)}, ${lit(meta.story_group_key)}) RETURNING id`;
    statements.push(`WITH target AS (${target})${evidenceInsert ? `, ev AS (${evidenceInsert} RETURNING 1)` : ''}
      UPDATE raw_items SET event_id=(SELECT id FROM target), state='processed' WHERE id IN (${newIds.join(',')}) AND event_id IS NULL;`);
    stats[isExisting ? 'updated' : 'created'] += 1;
    stats.assigned += newIds.length;
  }
  const irrelevantIds = [...new Set([...irrelevantItems.map(item => Number(item.id)), ...batchItemIds.filter(id => !assignedIds.has(Number(id)))])];
  if (irrelevantIds.length) {
    statements.push(`UPDATE raw_items SET state='irrelevant' WHERE event_id IS NULL AND id IN (${irrelevantIds.join(',')});`);
    stats.skipped_items += irrelevantIds.length;
  }
  const sql = statements.length ? `BEGIN;\nSELECT pg_advisory_xact_lock(20261012,2);\n${statements.join('\n')}\nCOMMIT;` : null;
  return { sql, stats };
}

export function runDedupe(execute, options = {}) {
  const config = Object.fromEntries(parse(execute(rows(`SELECT key, value FROM newsroom_config WHERE key='dedupe'`))).map(row => [row.key, row.value]));
  const maxBatches = boundedInteger(options.maxBatches, 1, { max: 200 });
  const totals = { items: 0, created: 0, updated: 0, assigned: 0, skipped_items: 0 };
  for (let batch = 0; batch < maxBatches; batch += 1) {
    const { watchlist, keywords, items, existingEvents } = loadDedupeInputs(execute, options);
    if (!items.length) return totals;
    const result = mergeRawItems(items, { watchlist, keywords, existingEvents, config: config.dedupe ?? {} });
    const { sql, stats } = buildDedupeSql(result, items.map(item => item.id));
    if (sql) execute(sql);
    totals.items += items.length;
    totals.created += stats.created;
    totals.updated += stats.updated;
    totals.assigned += stats.assigned;
    totals.skipped_items += stats.skipped_items;
    if (items.length < boundedInteger(options.limit, 3000, { max: 10000 })) return totals;
  }
  return { ...totals, truncated: true };
}

export function loadScoreInputs(execute, { limit = 500, rescoreMinutes = 30 } = {}) {
  const configRows = parse(execute(rows(`SELECT key, value FROM newsroom_config WHERE key IN ('weights','thresholds','scoring_thresholds','claim_quality')`)));
  const entities = parse(execute(rows(`SELECT id, priority FROM watchlist_entities`)));
  const events = parse(execute(rows(`SELECT e.*, coalesce((SELECT jsonb_agg(jsonb_build_object('kind', v.kind, 'origin_key', v.origin_key, 'is_independent', v.is_independent,
        'source_platform', s.platform, 'source_tier', s.tier, 'verified_official', s.verified_official, 'url', v.url, 'title', r.title, 'excerpt', v.excerpt, 'published_at', v.published_at, 'metrics', r.metrics, 'source_id', r.source_id) ORDER BY v.id)
        FROM event_evidence v LEFT JOIN raw_items r ON r.id=v.raw_item_id LEFT JOIN sources s ON s.id=r.source_id WHERE v.event_id=e.id), '[]'::jsonb) AS evidence
    FROM events e
    LEFT JOIN LATERAL (SELECT max(scored_at) AS last_scored FROM event_scores WHERE event_id=e.id) ls ON true
    WHERE e.state IN ('new','candidate') AND e.last_update_at > now() - interval '7 days'
      AND (ls.last_scored IS NULL OR ls.last_scored < e.last_update_at OR ls.last_scored < now() - interval '${Number(rescoreMinutes)} minutes')
    ORDER BY e.last_update_at DESC LIMIT ${Number(limit)}`)));
  const articles = parse(execute(rows(`SELECT a.slug, a.main_question, a.published_at, e.subject_entity, e.event_type FROM articles a
    JOIN events e ON e.id=a.event_id WHERE a.published_at > now() - interval '14 days'`)));
  return { config: configFromNewsroomRows(configRows), entitiesById: Object.fromEntries(entities.map(row => [row.id, row])), events, articles };
}

export function buildScoreSql(scored) {
  if (!scored.length) return null;
  const values = scored.map(({ id, score }) => `(${Number(id)}, ${score.relevance}, ${score.heat}, ${score.timeliness}, ${score.new_info}, ${score.impact}, ${jsonb(score.weights)}, ${Number(score.editorial_score)}, ${Number(score.credibility)}, ${lit(score.priority_override)}, ${jsonb({ ...score.explain, publish_eligible: score.publish_eligible, review_eligible: score.review_eligible })})`);
  return `BEGIN;\nSELECT pg_advisory_xact_lock(20261012,3);
INSERT INTO event_scores(event_id, relevance, heat, timeliness, new_info, impact, weights, editorial_score, credibility, priority_override, explain) VALUES ${values.join(',\n')} ON CONFLICT DO NOTHING;
DELETE FROM event_scores s WHERE s.scored_at < now() - interval '7 days' AND EXISTS (SELECT 1 FROM event_scores n WHERE n.event_id=s.event_id AND n.scored_at > s.scored_at);
COMMIT;`;
}

export function runScore(execute, options = {}) {
  const { config, entitiesById, events, articles } = loadScoreInputs(execute, options);
  const now = options.now ?? new Date();
  const scored = events.map(event => ({ id: event.id, score: scoreEvent(event, { config, entitiesById, articles, now }) }));
  const sql = buildScoreSql(scored);
  if (sql) execute(sql);
  return { scored: scored.length, publish_eligible: scored.filter(row => row.score.publish_eligible).length, review_eligible: scored.filter(row => row.score.review_eligible).length };
}

export function statusQuery() {
  return `SELECT jsonb_build_object(
  'generated_at', now(),
  'source_counts', (SELECT coalesce(jsonb_object_agg(status, n), '{}'::jsonb) FROM (SELECT status, count(*) n FROM sources GROUP BY status) c),
  'sources_enabled', (SELECT count(*) FROM sources WHERE enabled),
  'sources', (SELECT coalesce(jsonb_agg(jsonb_build_object('id', id, 'platform', platform, 'status', status, 'enabled', enabled,
      'last_success_at', last_success_at, 'last_error_at', last_error_at, 'last_error', last_error, 'consecutive_failures', consecutive_failures)
      ORDER BY status, id), '[]'::jsonb) FROM sources),
  'last_runs', (SELECT coalesce(jsonb_agg(to_jsonb(j) ORDER BY j.job), '[]'::jsonb) FROM (SELECT DISTINCT ON (job) job, started_at, finished_at, exit_code, duration_ms, note FROM job_runs ORDER BY job, started_at DESC) j),
  'failed_runs_24h', (SELECT count(*) FROM job_runs WHERE exit_code<>0 AND started_at > now() - interval '24 hours'),
  'pool', jsonb_build_object(
    'raw_items', (SELECT count(*) FROM raw_items),
    'raw_items_24h', (SELECT count(*) FROM raw_items WHERE fetched_at > now() - interval '24 hours'),
    'raw_items_unassigned_48h', (SELECT count(*) FROM raw_items WHERE event_id IS NULL AND fetched_at > now() - interval '48 hours'),
    'last_item_fetched_at', (SELECT max(fetched_at) FROM raw_items),
    'events_by_state', (SELECT coalesce(jsonb_object_agg(state, n), '{}'::jsonb) FROM (SELECT state, count(*) n FROM events GROUP BY state) s),
    'last_scored_at', (SELECT max(scored_at) FROM event_scores),
    'watchlist_entities', (SELECT count(*) FROM watchlist_entities),
    'keywords', (SELECT count(*) FROM keywords))
);`;
}

// Shared by the read-only export and atomic writer claim.
export function publishEligibilitySql() {
  return `e.state IN ('new','candidate') AND e.verification_status IN ('verified-primary','corroborated')
    AND e.verified_at >= e.last_update_at
    AND s.scored_at >= e.last_update_at
    AND s.editorial_score >= coalesce(
      (SELECT coalesce((value->>'publish')::numeric,(value->>'publish_editorial_score_min')::numeric) FROM newsroom_config WHERE key='scoring_thresholds'),
      (SELECT coalesce((value->>'publish')::numeric,(value->>'publish_editorial_score_min')::numeric) FROM newsroom_config WHERE key='thresholds'),55)
    AND NOT EXISTS (SELECT 1 FROM review_queue q WHERE q.event_id=e.id AND q.resolved_at IS NULL)`;
}

export function claimEligibilitySql() {
  return `${publishEligibilitySql()}
    AND ${claimFreshnessEligibilitySql()}
    AND ${claimMarketNoiseEligibilitySql()}
    AND EXISTS (
      SELECT 1 FROM event_evidence claim_evidence
      LEFT JOIN raw_items claim_raw ON claim_raw.id=claim_evidence.raw_item_id
      WHERE claim_evidence.event_id=e.id
        AND claim_evidence.is_independent IS NOT FALSE
        AND (claim_evidence.kind='market_data' OR length(regexp_replace(coalesce(claim_evidence.excerpt,''), '\\s+', ' ', 'g')) >= 120)
        AND coalesce(claim_raw.source_id, claim_evidence.origin_key, '') NOT LIKE 'nexualpha-official%'
        AND coalesce(claim_raw.source_id, claim_evidence.origin_key, '') <> 'telegram-nexualphaclub-preview'
    )
    AND (e.event_type NOT IN ('listing','delisting')
      OR e.story_asset IS NOT NULL
      OR e.discussion ? 'asset'
      OR e.discussion ? 'assets')`;
}

export function claimRankSql() {
  return claimRankOrderSql();
}

export function claimStoryJsonSql(groupAlias = 'x') {
  const storyKey = claimStoryGroupKeySql({ eventAlias: 'related_event' });
  const anchorKey = claimStoryGroupKeySql({ eventAlias: groupAlias });
  const window = claimStoryWindowSql();
  return `jsonb_build_object(
        'story_group_key', ${anchorKey},
        'story_event_ids', coalesce((SELECT jsonb_agg(related_event.id ORDER BY related_event.source_published_at, related_event.id)
          FROM events related_event
          WHERE ${storyKey}=${anchorKey}
            AND abs(extract(epoch from (coalesce(related_event.source_published_at, related_event.occurred_at, related_event.first_seen_at) - coalesce(${groupAlias}.source_published_at, ${groupAlias}.occurred_at, ${groupAlias}.first_seen_at)))) <= extract(epoch from ${window})
        ), '[]'::jsonb),
        'venues', coalesce((SELECT jsonb_agg(DISTINCT story_venue.name)
          FROM events related_event
          CROSS JOIN LATERAL jsonb_array_elements_text(${claimStoryVenueJsonSql({ eventAlias: 'related_event' })}) AS story_venue(name)
          WHERE ${storyKey}=${anchorKey}
            AND story_venue.name IS NOT NULL AND story_venue.name <> ''
            AND abs(extract(epoch from (coalesce(related_event.source_published_at, related_event.occurred_at, related_event.first_seen_at) - coalesce(${groupAlias}.source_published_at, ${groupAlias}.occurred_at, ${groupAlias}.first_seen_at)))) <= extract(epoch from ${window})
        ), '[]'::jsonb))`;
}

export function exportTopQuery(limit = 50) {
  const n = Number(limit);
  if (!Number.isInteger(n) || n < 1 || n > 500) throw new Error('Invalid limit');
  return `SELECT jsonb_build_object('schema', 'newsroom.top-events.v1', 'generated_at', now(), 'limit', ${n},
  'note', 'Verified, score-eligible event leads. Article claim/package gates still required before publication.',
  'events', coalesce(jsonb_agg(x.doc ORDER BY x.rank), '[]'::jsonb))
FROM (
  SELECT row_number() OVER (ORDER BY ${claimRankSql()}) AS rank,
    ${claimStoryGroupKeySql()} AS story_group_key,
    jsonb_build_object('id', e.id, 'title_internal', e.title_internal, 'event_type', e.event_type, 'subject_entity', e.subject_entity, 'subjects', e.subjects,
      'state', e.state, 'verification_status', e.verification_status, 'credibility', e.credibility, 'occurred_at', e.occurred_at,
      'source_published_at', e.source_published_at, 'first_seen_at', e.first_seen_at, 'last_update_at', e.last_update_at,
      'effective_at', e.effective_at, 'deadline_at', e.deadline_at, 'major_followup_at', e.major_followup_at,
      'story_asset', e.story_asset, 'story_action', e.story_action, 'story_group_key', ${claimStoryGroupKeySql()},
      'original_links', e.original_links, 'fact_summary', e.fact_summary, 'discussion', e.discussion,
      'score', jsonb_build_object('scored_at', s.scored_at, 'editorial_score', s.editorial_score, 'credibility', s.credibility, 'priority_override', s.priority_override,
        'relevance', s.relevance, 'heat', s.heat, 'timeliness', s.timeliness, 'new_info', s.new_info, 'impact', s.impact, 'explain', s.explain),
      'story', ${claimStoryJsonSql('e')},
      'evidence', coalesce((SELECT jsonb_agg(jsonb_build_object('url', v.url, 'kind', v.kind, 'is_independent', v.is_independent, 'origin_key', v.origin_key,
          'excerpt', v.excerpt, 'author_account', v.author_account, 'published_at', v.published_at, 'confidence', v.confidence,
          'source_id', r.source_id, 'source_tier', so.tier, 'source_status', so.status) ORDER BY v.id)
        FROM event_evidence v LEFT JOIN raw_items r ON r.id=v.raw_item_id LEFT JOIN sources so ON so.id=r.source_id WHERE v.event_id=e.id), '[]'::jsonb)) AS doc
  FROM events e JOIN LATERAL (SELECT * FROM event_scores WHERE event_id=e.id ORDER BY scored_at DESC LIMIT 1) s ON true
  WHERE ${claimEligibilitySql()}
  ORDER BY rank LIMIT ${n}
) x;`;
}

export function runVerify(execute) {
  const events = parse(execute(rows(`SELECT e.*, coalesce((SELECT jsonb_agg(jsonb_build_object(
      'url', v.url, 'kind', v.kind, 'origin_key', v.origin_key, 'is_independent', v.is_independent,
      'excerpt', v.excerpt, 'title', r.title, 'published_at', v.published_at, 'metrics', r.metrics, 'source_id', r.source_id, 'source_platform', s.platform,
      'source_tier', s.tier, 'verified_official', s.verified_official))
      FROM event_evidence v LEFT JOIN raw_items r ON r.id=v.raw_item_id LEFT JOIN sources s ON s.id=r.source_id
      WHERE v.event_id=e.id), '[]'::jsonb) AS evidence
    FROM events e WHERE e.state IN ('new','candidate') AND (e.verified_at IS NULL OR e.verified_at < e.last_update_at)`)));
  if (!events.length) return { verified: 0 };
  const watchlist = parse(execute(rows(`SELECT id, kind, display_name, aliases, status FROM watchlist_entities WHERE status='active'`)));
  const keywords = parse(execute(rows(`SELECT term, lang, entity_id, status FROM keywords WHERE status='active'`)));
  const statements = events.map(event => {
    const relevant = relevanceForItem({ ...event, title: event.title_internal, body_excerpt: [event.fact_summary, ...event.evidence.map(row => row.excerpt)].filter(Boolean).join(' '), entities: event.subjects }, { watchlist, keywords }).relevant;
    const status = relevant ? verifyEvent(event, { watchlist }) : 'unverified';
    const meta = eventClaimMetadata(event);
    const update = `UPDATE events SET verification_status=${lit(status)}, verified_at=now(),
      event_type=${lit(meta.event_type)},
      discussion=${jsonb(meta.discussion)},
      effective_at=${ts(meta.effective_at)}, deadline_at=${ts(meta.deadline_at)}, major_followup_at=${ts(meta.major_followup_at)},
      story_asset=${lit(meta.story_asset)}, story_action=${lit(meta.story_action)}, story_group_key=${lit(meta.story_group_key)}
      WHERE id=${Number(event.id)} AND last_update_at=${ts(event.last_update_at)} RETURNING id`;
    return status === 'needs-review'
      ? `WITH target AS (${update}) INSERT INTO review_queue(event_id,reason,rule_ids) SELECT id, 'Event evidence needs review', ARRAY['EVENT_VERIFICATION'] FROM target WHERE NOT EXISTS (SELECT 1 FROM review_queue WHERE event_id=target.id AND resolved_at IS NULL AND rule_ids @> ARRAY['EVENT_VERIFICATION']);`
      : `${update};`;
  });
  execute(`BEGIN; SELECT pg_advisory_xact_lock(20261012,4); ${statements.join('\n')} COMMIT;`);
  return { verified: events.length };
}
