# Newsroom collectors

Dependency-free Node 20+ source-family modules expose
`supports(source)` and `poll(source, since, context)`. The CLI uses the existing
T1 `runPsql` adapter and standard PostgreSQL environment variables. This change
does not deploy a container, install a Mac daemon, or publish content.

```sh
node ops/newsroom/bin/newsroom.mjs migrate
node ops/newsroom/bin/newsroom.mjs seed
node ops/newsroom/bin/newsroom.mjs seed:watchlist
node ops/newsroom/bin/newsroom.mjs collect --source bitget-announcements
node ops/newsroom/bin/newsroom.mjs collect --all
node ops/newsroom/bin/newsroom.mjs collect --source x-api-v2 --dry-run ./collector-dry-run
node --test ops/newsroom/**/*.test.mjs
```

`seed:watchlist` defaults to the bundled verified input snapshot, or accepts
`--watchlist PATH --keywords PATH`. It imports 133 unique entities from 134 input
rows (Lookonchain appears twice) and 711 phrases across ten languages. It rejects
unverified account placeholders, preserves official URL references and explicit
corporate names/tickers, and does not claim a new role-verification date. Repeated
imports preserve live entity status, priority, addresses, keyword classifications,
source health, disabled sources and owner budgets. The input contains no explicit
phrase-to-event taxonomy mapping: keyword `event_type` remains unknown until
reviewed rather than being inferred from phrase order.

The import also registers valid watchlist Telegram channels as **leads**, plus a
separate `defillama-hacks` source initially marked `partial` (not live-probed by
this change). `defillama-protocols` retains its original registry meaning; it is
not repurposed as a hacks feed. Existing source registry statuses remain a
historical reachability snapshot until the corresponding collector runs.

Covered families:

| Module | Sources |
| --- | --- |
| `exchange.mjs` | Binance, OKX, Bybit, Bitget announcements (limit 10), Kraken incidents, NexuAlpha announcement mirror |
| `legal.mjs` | SEC press/litigation, CFTC, ESMA, Japan FSA, Fed, anonymous CourtListener RECAP search, EDGAR full-text and watchlist company filings |
| `feeds.mjs` | Media RSS, Bloomberg crypto headlines/links only, multilingual Google News entity/event queries, watchlist-matching Google Trends, verified Telegram via local RSSHub |
| `market.mjs` | mempool.space, Blockchair, DefiLlama USD pegs/supply and hacks, Hyperliquid OI/funding, Binance futures movers/OI/funding, own market events |
| `social.mjs` | X v2 watchlist account/event recent search; YouTube channel search metadata |

Sources outside the implemented families are reported as
`no-automated-collector` and left untouched. No authentication bypass or account
creation is attempted. Telegram defaults to the server-local RSSHub
`http://127.0.0.1:1200`; `RSSHUB_BASE_URL` can point at an internal container URL.

Each source has a default 60-second deadline (`--timeout-ms N` overrides it),
10-second request deadlines, and at most two transport/429/5xx retries with
exponential backoff. SEC requests send
`NexuAlpha newsroom ops@nexualpha.com` and are spaced at least 150 ms apart in
the sequential runner. After three consecutive failures, a persisted health
timestamp backs off the source up to one hour and its registered fallback is
attempted once. Failures, partial coverage, missing credentials, timeouts and
database write failures do not stop other sources. Unsupported/disabled sources
do not become falsely connected. API/transport errors omit credentials, request
URLs and response bodies.

RSSHub Telegram channels that return HTTP 503 on three consecutive collector
poll failures are marked `missing-authorization` with an explicit note and
skipped by later collector runs until their authorization/feed path is changed.
The counter is source health state, not individual transport retries inside one
poll, and it resets on non-503 failures or success. Public working Telegram
channels continue through the local RSSHub path unchanged.

Rows have a 600-character excerpt limit, canonical URL, content hash, entity
matches, known source time or null, and platform-native metrics. Market
provenance remains in `metrics.provenance`; observation time is not a fabricated
publication time. Liquidation windows/venues/lower-bound labels remain separate.
Non-paid feeds overlap the last health timestamp by 24 hours to accommodate
late publications and rotating queries; `(source_id, external_id)` absorbs
duplicates. X references are retained and linked to an already collected origin
when available. Bounded Google News queries and unresolved CIKs report partial
coverage rather than claiming exhaustive monitoring.

## Social credentials and budgets

Inject read-only `X_BEARER_TOKEN` and either `YOUTUBE_API_KEY` or a current
`YOUTUBE_ACCESS_TOKEN`. This code never opens the private credential files or
copies credentials to a deployment. OAuth refresh provisioning stays with the
runtime credential owner.

`newsroom_config.x_daily_read_budget` defaults to **0**, which prevents all X
requests even if a bearer token is present. A positive integer set by the owner
enables reads. YouTube uses `youtube_daily_unit_budget`, capped at 2,000 units;
handle resolution costs one unit and channel search costs 100. UTC-day usage is
kept in `newsroom_config` under `collector_usage:<platform>:YYYY-MM-DD`.
PostgreSQL advisory locks serialize reservations across processes, reread the
live cap, and reserve worst-case cost **before dispatch**. Requests that fail or
time out retain their reservations and are never automatically retried. X
reserves ten reads per request; a remaining budget below ten cannot dispatch.
YouTube emits titles, links and metadata-only flags, without interpreting what
was said in the video. Search/account coverage rotates by UTC hour.

Dry runs require no database, write one hex-encoded-source-ID NDJSON/status pair
per source, and **never dispatch paid social requests**. Other sources use their
real endpoints when invoked directly; all tests inject fixture requests instead.
The CLI prints a JSON per-source report, so automation must inspect each status
rather than treating process exit zero as every feed connected.

Fixture tests verify parsers, recorded response shapes, normalization, isolated
failures, timeouts, retries, circuit fallback, quotas, seed idempotency SQL and
NDJSON. Live API reachability, deployment credentials, and PostgreSQL execution
must be verified separately in the server runtime before operational rollout.
