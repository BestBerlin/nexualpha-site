// Persistence worker for the pure merge/scoring functions (T6 deployment).
// `dedupe` assigns unassigned raw_items to events; `score` appends event_scores rows.
// `status` and `exportTop` are read-only JSON views for operators and the Mac-side writer.
// Every function takes `execute(sql) -> stdout` (runPsql in production, a fake in tests).
import { relevanceForItem } from './relevance.mjs';
import { verifyEvent } from './verification.mjs';
import { mergeRawItems } from './dedupe.mjs';
import { configFromNewsroomRows, credibilityScore, scoreEvent } from './scoring.mjs';

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

export function loadDedupeInputs(execute, { windowHours = 48, limit = 3000 } = {}) {
  const watchlist = parse(execute(rows(`SELECT id, kind, display_name, aliases, partner_slug, priority, status FROM watchlist_entities WHERE status='active'`)));
  const keywords = parse(execute(rows(`SELECT term, lang, event_type, entity_id, weight, status FROM keywords WHERE status='active'`)));
  const items = parse(execute(rows(`SELECT ${ITEM_COLUMNS} FROM raw_items r JOIN sources s ON s.id=r.source_id
    WHERE r.event_id IS NULL AND r.state='pending'
    ORDER BY r.id LIMIT ${Number(limit)}`)));
  if (!items.length) return { watchlist, keywords, items, existingEvents: [] };
  const existingEvents = parse(execute(rows(`SELECT e.id, e.subject_entity, e.subjects, e.event_type, e.title_internal, e.occurred_at,
      e.source_published_at, e.original_links, e.discussion,
      coalesce((SELECT jsonb_agg(jsonb_build_object('raw_item_id', v.raw_item_id, 'url', v.url, 'kind', v.kind, 'origin_key', v.origin_key,
        'is_independent', v.is_independent, 'published_at', v.published_at, 'source_platform', s.platform, 'source_tier', s.tier,
        'metrics', r.metrics, 'source_id', r.source_id) ORDER BY v.id)
        FROM event_evidence v LEFT JOIN raw_items r ON r.id=v.raw_item_id LEFT JOIN sources s ON s.id=r.source_id
        WHERE v.event_id=e.id), '[]'::jsonb) AS evidence,
      coalesce((SELECT jsonb_agg(jsonb_build_object('id', r.id, 'content_hash', r.content_hash, 'simhash', r.simhash::text,
        'published_at', r.published_at, 'fetched_at', r.fetched_at, 'title', r.title, 'body_excerpt', r.body_excerpt, 'source_id', r.source_id, 'entities', r.entities, 'event_type_guess', r.event_type_guess, 'url', r.url, 'canonical_url', r.canonical_url, 'platform', s2.platform, 'tier', s2.tier)) FROM raw_items r LEFT JOIN sources s2 ON s2.id=r.source_id WHERE r.event_id=e.id), '[]'::jsonb) AS raw_items
    FROM events e WHERE e.state NOT IN ('rejected','expired') AND e.last_update_at > now() - interval '${Number(windowHours)} hours'`)));
  return { watchlist, keywords, items, existingEvents };
}

function evidenceValues(row) {
  const kind = EVIDENCE_KINDS.has(row.kind) ? row.kind : 'media_report';
  return `(${row.raw_item_id == null ? 'NULL' : Number(row.raw_item_id)}, ${lit(row.url || '')}, ${lit(kind)}, ${row.is_independent === false ? 'false' : 'true'}, ${lit(row.origin_key)}, ${lit(row.excerpt)}, ${lit(row.author_account)}, ${ts(row.published_at)})`;
}

// Builds one transaction. The pure relevance gate supplies irrelevantItems; those rows are marked
// terminally irrelevant so the incremental queue does not reread them forever.
export function buildDedupeSql({ events, irrelevantItems = [] }, batchItemIds) {
  const batch = new Set(batchItemIds.map(Number));
  const statements = [];
  const assignedIds = new Set();
  const stats = { created: 0, updated: 0, assigned: 0, skipped_items: 0 };
  for (const event of events) {
    const newItems = (event.raw_items ?? []).filter(item => batch.has(Number(item.id)));
    if (!newItems.length) continue;
    const newIds = newItems.map(item => Number(item.id));
    for (const id of newIds) assignedIds.add(id);
    const newEvidence = event.evidence.filter(row => row.raw_item_id != null && batch.has(Number(row.raw_item_id)));
    const credibility = credibilityScore(event);
    const isExisting = /^\d+$/.test(String(event.id));
    const evidenceInsert = newEvidence.length
      ? `INSERT INTO event_evidence(event_id, raw_item_id, url, kind, is_independent, origin_key, excerpt, author_account, published_at) SELECT target.id, v.raw_item_id::bigint, v.url, v.kind, v.is_independent, v.origin_key, v.excerpt, v.author_account, v.published_at::timestamptz FROM target, (VALUES ${newEvidence.map(evidenceValues).join(', ')}) AS v(raw_item_id, url, kind, is_independent, origin_key, excerpt, author_account, published_at)`
      : null;
    const target = isExisting
      ? `UPDATE events SET last_update_at=now(), subjects=${textArray(event.subjects)}, original_links=${textArray(event.original_links)},
          source_published_at=${ts(event.source_published_at)}, discussion=${jsonb(event.discussion)}, credibility=${credibility}
          WHERE id=${Number(event.id)} RETURNING id`
      : `INSERT INTO events(subject_entity, subjects, event_type, title_internal, occurred_at, source_published_at, original_links, discussion, credibility)
          VALUES (${lit(event.subject_entity)}, ${textArray(event.subjects)}, ${lit(event.event_type || 'unknown')}, ${lit(String(event.title_internal || 'Untitled newsroom event').slice(0, 600))},
          ${ts(event.occurred_at)}, ${ts(event.source_published_at)}, ${textArray(event.original_links)}, ${jsonb(event.discussion)}, ${credibility}) RETURNING id`;
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
  const { watchlist, keywords, items, existingEvents } = loadDedupeInputs(execute, options);
  if (!items.length) return { items: 0, created: 0, updated: 0, assigned: 0, skipped_items: 0 };
  const result = mergeRawItems(items, { watchlist, keywords, existingEvents, config: config.dedupe ?? {} });
  const { sql, stats } = buildDedupeSql(result, items.map(item => item.id));
  if (sql) execute(sql);
  return { items: items.length, ...stats };
}

export function loadScoreInputs(execute, { limit = 500, rescoreMinutes = 30 } = {}) {
  const configRows = parse(execute(rows(`SELECT key, value FROM newsroom_config WHERE key IN ('weights','thresholds','scoring_thresholds')`)));
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

export function exportTopQuery(limit = 50) {
  const n = Number(limit);
  if (!Number.isInteger(n) || n < 1 || n > 500) throw new Error('Invalid limit');
  return `SELECT jsonb_build_object('schema', 'newsroom.top-events.v1', 'generated_at', now(), 'limit', ${n},
  'note', 'Verified, score-eligible event leads. Article claim/package gates still required before publication.',
  'events', coalesce(jsonb_agg(x.doc ORDER BY x.rank), '[]'::jsonb))
FROM (
  SELECT row_number() OVER (ORDER BY (s.priority_override='official_major') DESC NULLS LAST, s.editorial_score DESC, e.source_published_at DESC NULLS LAST, e.id) AS rank,
    jsonb_build_object('id', e.id, 'title_internal', e.title_internal, 'event_type', e.event_type, 'subject_entity', e.subject_entity, 'subjects', e.subjects,
      'state', e.state, 'verification_status', e.verification_status, 'credibility', e.credibility, 'occurred_at', e.occurred_at,
      'source_published_at', e.source_published_at, 'first_seen_at', e.first_seen_at, 'last_update_at', e.last_update_at,
      'original_links', e.original_links, 'fact_summary', e.fact_summary, 'discussion', e.discussion,
      'score', jsonb_build_object('scored_at', s.scored_at, 'editorial_score', s.editorial_score, 'credibility', s.credibility, 'priority_override', s.priority_override,
        'relevance', s.relevance, 'heat', s.heat, 'timeliness', s.timeliness, 'new_info', s.new_info, 'impact', s.impact, 'explain', s.explain),
      'evidence', coalesce((SELECT jsonb_agg(jsonb_build_object('url', v.url, 'kind', v.kind, 'is_independent', v.is_independent, 'origin_key', v.origin_key,
          'excerpt', v.excerpt, 'author_account', v.author_account, 'published_at', v.published_at, 'confidence', v.confidence,
          'source_id', r.source_id, 'source_tier', so.tier, 'source_status', so.status) ORDER BY v.id)
        FROM event_evidence v LEFT JOIN raw_items r ON r.id=v.raw_item_id LEFT JOIN sources so ON so.id=r.source_id WHERE v.event_id=e.id), '[]'::jsonb)) AS doc
  FROM events e JOIN LATERAL (SELECT * FROM event_scores WHERE event_id=e.id ORDER BY scored_at DESC LIMIT 1) s ON true
  WHERE ${publishEligibilitySql()}
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
    const update = `UPDATE events SET verification_status=${lit(status)}, verified_at=now() WHERE id=${Number(event.id)} AND last_update_at=${ts(event.last_update_at)} RETURNING id`;
    return status === 'needs-review'
      ? `WITH target AS (${update}) INSERT INTO review_queue(event_id,reason,rule_ids) SELECT id, 'Event evidence needs review', ARRAY['EVENT_VERIFICATION'] FROM target WHERE NOT EXISTS (SELECT 1 FROM review_queue WHERE event_id=target.id AND resolved_at IS NULL AND rule_ids @> ARRAY['EVENT_VERIFICATION']);`
      : `${update};`;
  });
  execute(`BEGIN; SELECT pg_advisory_xact_lock(20261012,4); ${statements.join('\n')} COMMIT;`);
  return { verified: events.length };
}
