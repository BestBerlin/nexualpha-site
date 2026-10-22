# Web worker cluster

`node server.mjs` starts `min(4, availableParallelism())` workers by default, sharing
the existing `HOST`/`PORT` through Node's round-robin cluster listener. Set
`WEB_WORKERS=2` to select two workers; `WEB_WORKERS=1` runs the existing server in
one process. Invalid values fail startup. No dependencies or browser imports were added.

The primary restarts an unexpected worker exit after 100 ms, doubling per failed
replacement up to 5 s. A worker surviving 60 s resets its replacement backoff.
Eight exits across the pool in a rolling 60 s window stop the pool and exit 1,
allowing the container's restart policy to handle a broken release. A normal
SIGINT/SIGTERM stops replacements and sends SIGTERM to every worker. Workers stop
accepting connections, finish active HTTP requests, flush queued snapshots, and
exit. A worker drain failure propagates exit 1. After 30 s the primary kills
remaining workers and exits 1; the container stop grace must allow at least 30 s
if that entire drain window is needed. Normal cutover already uses
`docker stop --time 30`; failed-stage cleanup in `deploy-local.sh` uses 20 s.

## Shared state and file audit

| State / writer | Cluster behavior |
| --- | --- |
| Click burst and duplicate windows | One primary-owned window, shared by `/go` and `/api/cta-click`; worker restarts retain it. Existing bounded 10,000-key eviction still applies. Only the daily IP hash and venue key cross IPC. |
| Site beacon rate limit | One primary-owned 30/minute window; worker sends a SHA-256 client key, never the raw address. |
| Click hash salt | Configure the same stable `CLICK_HASH_SECRET` through the existing environment. Missing salt remains `unknown`. IPC classification failures also become `unknown`, preserving redirects. |
| `CLICK_EVENT_FILE` | Workers append one JSON line with explicit `flag: 'a'`, rejecting UTF-8 records >= 4096 bytes including newline. Operational counters/readiness remain per worker. |
| Error monitor | Workers append sanitized JSON lines with the same byte bound and append flag. Error dedupe remains per worker: one fingerprint can appear at most N times per five-minute dedupe window, without restarts. Readiness reflects the responding worker's last write. |
| Direct CTA collector / smoke collector | Primary owns recovery, trailing-line repair, event/session dedupe, experiment assignment locks, and serialized bounded appends. Worker preflight preserves method/origin/bot/body limits and custom registry options. The normal `CTA_ANALYTICS_ORIGIN` proxy remains unchanged. |
| Intel archive | Workers refresh independently; primary serializes read/union/atomic-rename per file. Current per-worker discoveries are merged back after IPC. |
| Flash memory | Primary merges retained first sightings before atomic replacement; shutdown flushes throttled saves. Existing 3,000-item/retention policy still applies. |
| OG cache | Complete image writes use PID + UUID temporary names, atomic rename and cleanup, including simultaneous requests for the same key. |
| Position radar snapshot | Not a web writer: web runtime uses `whaleFileOnly: true` and reads the collector's file. |
| Growth report exports | CLI writer, not reachable from the web runtime. |
| SSR page/feed readers | Independent per-worker caches and refreshes. |

Primary ownership is scoped to one container. Independent release containers do
not share click windows or a snapshot lock. Concurrent cutover containers retain
the existing cross-container snapshot lost-update risk; UUID temp names prevent
their temporary files from colliding. Persistent click reports still deduplicate
daily hashes. Primary restarts reset in-memory windows; direct CTA recovery loads
its persisted idempotency keys.

IPC has a 10 s request deadline and a 1,024 pending-call cap per worker. Operation
errors fail closed. These messages are private fork channels, with no HTTP admin
or crash endpoint.

## Deploy compatibility and validation

`deploy/deploy-local.sh` packages the entire `server/` directory. The added
`flash-feed.js` import is already in `prepare-sites-build.mjs`'s `flashData` list.
There are no new release tarball dependencies. `stage-remote.py` still checks
standby `/health/errors-ready` and reaches the separate collector for readiness
and a smoke event. Cutover/rollback page and `/version.json` checks are unchanged.
Readiness schemas/URLs are unchanged and continue to describe the responding
worker; they do not attest that every worker has finished startup.

Run `node --test tests/web-cluster.test.mjs tests/runtime-writers-cluster.test.mjs`
from the app directory. Real fork/IPC tests cover shared classifiers/rate limits,
restart/backoff, crash-loop exit, clean pool shutdown, failed drain propagation,
direct CTA dedupe, concurrent appends, snapshot merging and parallel OG writes.
When listening is allowed, the same suite also checks two-worker HTTP service,
an in-flight request during TERM and the built production health/CTA routes.
Tests explicitly skip those socket checks when the host returns EPERM/EACCES.

`node scripts/benchmark-web-cluster.mjs` compares one and two workers using the
same local build: 128 news requests, concurrency 16, eight warmups per worker,
refresh/network and SSR page cache disabled. It exercises the actual production
HTTP handler with Node IncomingMessage/ServerResponse over memory streams and
IPC. Output is `.node-cluster-benchmark.json`; a result requires every response
to be 200 with a nonempty body. This measures render/handler contention, excludes
socket/network costs, and does not validate the production listener/supervisor.
It is a single sequential trial, not a production capacity estimate. Run a real
HTTP load comparison on a host that permits listening before rollout.

## Local validation result

Node 24.19.0 on Darwin arm64 (12 available CPUs), same local build
`3.0-20261022T212523`, one sequential trial per worker count:

| Workers | Requests/s | p50 ms | p90 ms | p99 ms | Successful responses |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1 | 22.50 | 697.50 | 848.55 | 965.24 | 128/128 |
| 2 | 49.98 | 316.83 | 445.34 | 535.26 | 128/128 |

Handler throughput increased 2.22x and p90 decreased 47.52% in this limited
measurement. Both runs produced 12,843,312 wire bytes. Exact timings, paths,
configuration and limitations are in [benchmark.json](evidence/node-cluster/benchmark.json).
This is not a production HTTP throughput result.

The targeted suite passed 157 tests with 11 socket-dependent skips and zero
failures. Typecheck, syntax checks and strict build budget passed (349,899 gzip
bytes for the home entry closure, below 350,000). The fresh worktree needed
existing local i18n plugin cache blobs and its ignored empty hosting metadata:
the Node 24 `npm run build` completed client, both SSR builds, 2,590 prerenders
and critical CSS, then exited 1 for missing `.openai/hosting.json`. Restoring the
existing empty metadata and running `prepare-sites-build.mjs` plus the strict
budget verifier completed the remaining build stages successfully. Generated
tracked feed/sitemap/partner data was restored before commit.

TCP and Unix socket binding both returned EPERM in this sandbox. The existing
deployment HTTP probe test also failed for that reason; its static role check
passed. Real listener health, collector reachability and in-flight HTTP drain
must be rerun on a socket-enabled host before rollout. No deployment was made.
