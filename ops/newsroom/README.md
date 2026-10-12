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
