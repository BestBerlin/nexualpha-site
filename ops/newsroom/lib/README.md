# Newsroom T3 library contracts

Pure modules only. They do not read Postgres, files, environment variables or
network resources. Callers load `newsroom_config` and pass config objects in.

## Config rows

The seed-owned SQL contract is:

- `newsroom_config.key = 'weights'`
  - JSON: `{ "relevance": 25, "heat": 20, "timeliness": 20, "new_info": 20, "impact": 15 }`
  - All five keys are required and must total `100`.
- `newsroom_config.key = 'thresholds'`
  - Seed keys: `publish`, `review`, `publishCredibilityMin`,
    `flashCredibilityMin`, `reviewCredibilityMin`, `repeatAngleSimilarity`.
  - The corresponding snake_case names (`publish_editorial_score_min`,
    `publish_credibility_min`, etc.) are accepted for external callers.

Use `configFromNewsroomRows(rows)` from `scoring.mjs` to map SQL rows into the
shape expected by `scoreEvent`.

## Exports

`normalization.mjs`

- `canonicalizeUrl(value: string): string | null`
  - Removes tracking params and normalizes `twitter.com`/`mobile.twitter.com`
    to `x.com`.
- `originKey(item: RawItemLike): string`
  - Returns stable keys such as `x:<tweet_id>`, `notice:<id>`, `tx:<hash>` or
    `url:<canonical_url>`.
- `itemEntities(item, watchlist): string[]`
  - Uses explicit `subject_entity`, `subjects`, `entities` and active watchlist
    aliases. Non-active watchlist rows are ignored.
- `trigramSimilarity(left, right): number`
  - Uses word padding and set overlap from [PostgreSQL 16 pg_trgm](https://www.postgresql.org/docs/16/pgtrgm.html).
    Returns `0..1`; empty-vs-empty is `0` so blank titles do not merge.

`dedupe.mjs`

- `mergeRawItems(items, { watchlist?, existingEvents?, config? }): { events, assignments }`
  - Clusters by entity/type/time window plus title similarity, shared original
    links, hard keys, exact `content_hash` or near `simhash`.
  - Duplicate `(source_id, external_id)` rows are ignored. Assignments use raw
    database ids, or a JSON-encoded `[source_id, external_id]` key before insert.
  - Evidence `origin_key` follows `origin_item_id` chains to the root item.
  - Discussion counts independence by distinct `origin_key`; reposts and
    syndication of one origin count once.
  - Per-platform metric growth is kept separate; `metric_total_across_platforms`
    is always `null`.
- `countIndependentSources(evidence): number`

Callers must also run `followupDecision` and `expiryDecision` from
`lifecycle.mjs` when handling already-published events or expiry windows. The
merge function only clusters unassigned items.

`scoring.mjs`

- `configFromNewsroomRows(rows): { weights, thresholds }`
- `scoreEvent(event, { config?, articles?, entitiesById?, now? }): EventScoreLike`
  - Returns `relevance`, `heat`, `timeliness`, `new_info`, `impact`,
    `editorial_score`, `credibility`, `priority_override`, `publish_eligible`,
    `review_eligible` and `explain`.
  - Credibility is never added to `editorial_score`.
  - `priority_override='official_major'` only affects queue ordering. It does
    not bypass `relevance > 0`, editorial score, credibility thresholds or later
    verification gates.
- `credibilityScore(event): 0 | 1 | 2 | 3`
- `officialMajorOverride(event): 'official_major' | null`

## Input shape

The library accepts the DB field names from design §2 (`source_id`,
`external_id`, `source_published_at`, `origin_item_id`, `body_excerpt`,
`event_type_guess`, `subject_entity`) and common camelCase equivalents. Evidence
excerpts are capped at 600 characters to match the raw item storage contract.
