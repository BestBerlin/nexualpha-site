# Newsroom event pool (T1 + T3)

Local implementation of the 2026-10-12 newsroom design, scoped to the queue
`newsroom-pool/BRIEF.md`. No collector, deployment, claim/publish workflow, gate,
watchlist verification or promotion activation is performed by this change.

## Database and CLI

The migration mirrors design §2, including `article_metrics`. Migrations are
idempotent on a compatible schema, not an automatic repair of schema drift.
`migrate` and `seed` run sorted SQL files in one transaction under a shared
advisory lock. Install a PostgreSQL client in the execution environment; `pg`
is absent from this repository's lockfiles, so the CLI uses `psql` without adding
dependencies. Use PostgreSQL 16 and a dedicated `newsroom` database/role.

Connection comes from standard libpq environment variables (`PGHOST`, `PGPORT`,
`PGUSER`, `PGDATABASE`, `PGPASSFILE`). The default database is `newsroom`.
Passwords belong in private libpq configuration, never command arguments or
newsroom config. No connection is made by `--help` or the unit test suite.

```sh
node ops/newsroom/bin/newsroom.mjs migrate
node ops/newsroom/bin/newsroom.mjs seed
node ops/newsroom/bin/newsroom.mjs events:top --limit 10
node ops/newsroom/bin/newsroom.mjs event:show 1
node ops/newsroom/bin/newsroom.mjs review:list
node ops/newsroom/bin/newsroom.mjs shortfall:log --slot 2026-10-12T21:35:00+08:00 --wanted 2 --eligible 0 --published 0 --note 'No eligible events'
node ops/newsroom/bin/newsroom.mjs config:get weights
node ops/newsroom/bin/newsroom.mjs config:set weights '{"relevance":25,"heat":20,"timeliness":20,"new_info":20,"impact":15}'
```

Read commands return JSON; absent results return `[]`. `events:top` ranks
unclaimed `new`/`candidate` events with their latest scoring pass, queue overrides
first. It does not claim rows or authorize publishing. `event:show` returns
score history, evidence and related articles. Shortfalls upsert by day/slot;
timestamps must include a timezone. Omit `--day` to use the slot's local date.
`config:set` accepts JSON and checks that editorial weights total 100.

The seed contains 68 feed/account entries. Sources are a **historical reachability snapshot from SOURCES.md**, not a new
live connectivity test or account verification. Missing authorization and stale
feeds remain distinguishable from usable feeds. A connected API does not imply
approved paid reads. T7 owns the verified watchlist/accounts/keywords; none are
invented here. No promotions are enabled or populated.

## Validation

```sh
node --test ops/newsroom/**/*.test.mjs
node ops/newsroom/bin/newsroom.mjs --help
bash -n ops/newsroom/scripts/test-postgres.sh
bash ops/newsroom/scripts/test-postgres.sh
```

The default suite checks SQL structure and seed contracts without a database,
plus pure merge/scoring behavior and CLI query construction. Parsing is not
proof that PostgreSQL accepts or executes the SQL.

The optional Docker runner uses a disposable PostgreSQL 16 container, a unique
Compose project name, tmpfs data and no published port. It supplies a temporary
`psql` wrapper, applies migrations and seeds twice, exercises JSON read commands,
config roundtrip and shortfall upsert, then runs the pure tests. Cleanup removes
only that test project's container and wrapper. Trust authentication is limited
to this isolated throwaway container. It needs Docker Compose v2 with `--wait`;
it never uses the host's production PostgreSQL connection.

## Pure-function integration

`lib/normalization.mjs`, `lib/dedupe.mjs` and `lib/scoring.mjs` accept plain
objects. Pass the `config:get` rows through `configFromNewsroomRows` before
scoring to use the stored weight and threshold values. The scorer returns the
weight snapshot, separate credibility, eligibility and explanation; the merger
returns event groups and item assignments. Their module comments document input
fields. T7 supplies the verified active watchlist.

`followupDecision(event, item)` in `lib/lifecycle.mjs` returns whether a published
event warrants a follow-up (response, filing, repayment, number change strictly
above 20%, or a different reader question). Otherwise append evidence and update
the existing article under its slug. `expiryDecision(event, {now, format})`
checks unclaimed event windows; unknown source times remain unknown. These are
pure decisions that a future persistence worker must apply transactionally.

## Limits

The pure functions provide decisions for a future collector/merge worker; this
change does not schedule or persist those decisions. Relevance/impact/growth
normalization are deterministic starting heuristics where the design leaves
numeric mappings open; review score explanations before tuning. Unknown values
remain visible as unknown. Editorial ranking and credibility are independent;
ranking never substitutes for verification gates or publish eligibility.

## Collector extension

The T2 collector CLI, bundled watchlist loader, source-family coverage,
credential contract, quotas, dry-run behavior and fixture tests are documented
in [collectors/README.md](collectors/README.md).

## Publishable pool upgrade (2026-10-12)

Run `migrate` before starting the updated scheduler. The pipeline now runs
`dedupe → score → verify → export:top`, stopping if a prerequisite fails.
`events:top` remains an operator ranking view; `export:top` includes only
new/candidate events at or above the current configured publish threshold,
with fresh scores and fresh `verified-primary`/`corroborated` verification,
and no unresolved review entry. Official-major priority never bypasses these checks.

`verify` checks the captured headline/fact summary against captured evidence.
A matching verified tier-1 exchange/regulator/court/company filing source is
primary; two matching independent non-mirror publishers can corroborate.
Different URLs from one publisher and reposts sharing an origin count once.
Fraud/insolvency allegations without matching primary evidence, and conflicting
evidence, go to `review_queue` as `needs-review`. Review entries are not silently
resolved by a later collection. This is event-level verification, not a substitute
for the claim-level article/package gates in [gates/README.md](gates/README.md).
Conservative exact normalized fact matching can leave paraphrased reports
unverified; operators should inspect captured evidence rather than lower the gate.

Raw items now have a durable `pending`/`processed`/`irrelevant` work state.
Dedupe reads only pending rows, in ID order, including older backlog, and marks
assigned or irrelevant rows in the same transaction. It does not use a timestamp
watermark that could lose late inserts. Existing event evidence remains available
for clustering across runs. Migration 091 adds origin, fetched-time, pending-work,
evidence-event and score indexes; the event-state index already exists in 001.
Existing assigned history is retained; the upgrade does not delete old events.
Verification also rechecks relevance for existing unclaimed events; unrelated
legacy regulator leads remain unverified and cannot export. Existing erroneous
event history is retained for operator review.

The bundled `db/coin-universe.json` is a compact snapshot of
`pilot-01-prototype/public/intel/coins.json`, so the standalone deployed newsroom
has the same coin symbols without depending on the site's directory layout.
Refresh this snapshot when changing the site's coin universe.

Relevance requires a scoped watchlist subject, crypto terms, coin symbols or
exchange names, or a concrete market event in the owner's equity/cross-asset
scope. Generic regulator names and enforcement words alone are insufficient.
NexuAlpha exchange announcement mirrors never count as independent sources;
listing/delisting clustering also uses venue, symbol, action and date.

Telegram RSSHub sources with three consecutive HTTP 503 responses become
`missing-authorization` and are skipped until an operator restores access.
Other source failures remain isolated. Feed URL/status updates and collection
notes preserve the distinction between reachable feeds and unavailable ones.

For a deployment performance check, time a pipeline with the real database and
backlog after migration. Local pure tests do not prove the <30-second production
pipeline target; database/container validation requires PostgreSQL/Docker.

## Story clustering and calibration (2026-10-13)

Clustering uses compatible actions, shared subjects, a 48-hour window, normalized
word similarity and shared captured tickers, amounts or dates. English/Chinese
watchlist aliases participate in fact matching. Contradictory venues, symbols,
amounts or explicit dates block attachment even when a URL/hash matches. Merge
reasons and item facts persist in `discussion.merge_provenance`; independently
reported stories retain publisher/origin identity. Captured titles and excerpts
supply corroboration facts rather than requiring identical headlines.

Heat uses independent sources with time decay; unknown growth metrics remain
unknown. Verified notable exchange listings/delistings receive explicit relevance
and impact adjustments, without inventing discussion metrics or bypassing
verification, novelty, credibility or article gates. The bundled coin universe's
first 200 entries are the local notable-asset snapshot, not a refreshed market
ranking.

```sh
node ops/newsroom/bin/newsroom.mjs calibrate
node ops/newsroom/bin/newsroom.mjs config:get scoring_thresholds
node ops/newsroom/bin/newsroom.mjs config:set scoring_thresholds '{"publish_editorial_score_min":55}'
```

`calibrate` is read-only: the last 72 hours, thresholds 40/45/50/55, UTC daily
counts and totals normalized over three days against a target of 40/day, including
qualified events already claimed or published. Review
measured availability before tuning the stored threshold; calibration does not
change verification rules or authorize publication. The default remains 55.

EDGAR collection and pending-item relevance admit only 8-K, 10-Q, 10-K, S-1 and
13F families with watchlist-company or crypto context. Structured-note filings
such as 424B2, FWP and 497 are excluded. Direct KuCoin announcements and Kraken
asset-listing RSS supplement the existing mirror and status feeds.

Deployment checks `deploy/backup.sh --dry-run` before switching releases. It
compares the server and `pg_dump` major versions inside the PostgreSQL container;
the backup also executes its dump there. Unit tests use a Docker command double;
a real dump/restore and live database calibration still require the deployment
environment. Existing processed events are not destructively reset or reclustered.
