# Pipeline resilience — local change set, no deployment

Scope: `codex/pipeline-resilience`. All edits and test artifacts stay in this worktree. The external Telegram/content checkouts are inputs only. Production was inspected read-only through the brief's SSH wrapper. No service was restarted, no message was sent, and no cron/launchd job was installed.

## Failure modes and recovery ownership

| Failure | Before | After this change is shipped |
|---|---|---|
| DNS/network unavailable after reboot | Uncaught initial collector cycle could exit or prevent its timer starting | Serial daemon owner retries 1/2/4/8/16/30 seconds within a five-minute startup budget, then continues normal cycles; degraded heartbeat survives failures |
| Tronscan slow/down | Whale sources ran sequentially and breakers reset between cycles | Independent source families start together; persistent per-source breaker, 45-second source and 10-second fetch/body deadlines |
| Process dies during file write | Some readers could observe partial JSON/history | Same-directory temporary file + rename; last-good payload retained |
| Collector alive but backend down | Container uptime looked healthy | Atomic `updatedAt` attempt heartbeat includes source/dependency state; data timestamps remain separate |
| Collector hangs | `unless-stopped` does not restart unhealthy running containers | File freshness HEALTHCHECK + opt-in host watchdog restart after heartbeat age >600 seconds (plus healthcheck/cron jitter); ten-minute startup/cooldown grace |
| Morning/digest window missed | Exact hour check skipped the slot for the day | Same-day catch-up once usable data returns; durable delivery identities/pending receipts prevent automatic replay after ambiguous sends |
| Newsroom PostgreSQL restart | Initial connection failure could lose a job | Bounded pre-execution reconnect, connect/statement/process deadlines, next scheduled attempt; no blind replay after ambiguous in-flight loss |
| Article lane stops | Mac scheduled task can be asleep/offline with no server guard | Independent server guard every 30 minutes, ALERT artifact and deduped owner DM when newest publishedAt >3 hours old |
| Feed source disappears | Market reader expired last-good data; some fallbacks lost stale flag | Preserve last-good source timestamp and mark `stale:true`; cold caches remain honestly unavailable |

## Placement and shipping prerequisites (lead only)

1. Back up deployed code, Compose files and state before promotion. Keep receipt/history directories intact. Never start a second bot poller or live sender.
2. Market deployment must include `resilience.mjs` beside both collector entrypoints. Whale bundling must include the changed `server/position-radar.mjs`; copying an old whale bundle will not pick up the parallel source fix. Data freshness imports `../market-collector/resilience.mjs`, so retain that relative layout.
3. Deploy the changed alert/channel/scheduler/social entrypoints together with their existing helpers. Deploy the newsroom app directory and `deploy/heartbeat.mjs` together. See `ops/market-collector/README.md`, `ops/telegram-scheduler/README.md`, and `ops/newsroom/deploy/RUNBOOK.md` for their contracts.
4. External Telegram files cannot be edited by this lane. `ops/pipeline-resilience/telegram/startup-heartbeats.patch` is based on the current **dirty local source**, pinned by SHA-256. Lead must compare to the actual deployed release, apply/rebase in an isolated Telegram checkout, build and run its full suite before shipping. Preserve its credential changes and existing diagnostics. This change set does not claim that external full-suite verification happened.
5. Copy `ops/pipeline-resilience/` to host `/data/agent/srv/stacks/crypto-telegram-ops/resilience/`. The existing Docker bind `/data/agent/srv:/srv/agent` exposes it at **container** `/srv/agent/stacks/crypto-telegram-ops/resilience/`. Cron templates intentionally use the **host** `/data/agent/srv/...` path. Existing Compose config is host `/srv/agent/stacks/crypto-telegram-ops/baota/apps-compose.yml`; verify its real mount/symlink on the target rather than assuming these host prefixes are interchangeable.
6. Merge `deploy/compose.resilience.yml` over the existing Telegram Compose file. It preserves existing volumes, profiles, env files and commands. Newsroom is a separate Compose project and gets its healthcheck/label from its own updated compose.yml. Infrastructure Postgres/Valkey stays in its existing separate project with existing healthy probes. Compose dependencies cannot reference services in a different project; application reconnects bridge that boundary.
7. Before promotion, on an isolated staging stack: `docker compose -f <base> -f <overlay> config --quiet`. Do not run this with a second production token or shared production state. Test with dummy credentials, separate database/Valkey and isolated volumes. Next: `docker compose -f <base> -f <overlay> up -d --wait`, then `docker compose -f <base> -f <overlay> restart`; inspect health and receipt counts. Docker is unavailable in this local sandbox, so these are lead validation steps, not claimed test results.

## What restarts what

- Docker `restart: unless-stopped`: process exits/reboot, respecting an explicitly stopped service.
- Collector/delivery loops: retry transient source and dependency failures within the running process. Source failure is reported as degraded; a fresh heartbeat does not prove fresh data or successful delivery.
- Compose `service_healthy`: initial `up` ordering for miniapp → verifier and admin/scheduler → API; scheduler also waits for the market process heartbeat. These conditions are not runtime supervisors and are not guaranteed to re-gate an Engine restart. Reconnect logic handles runtime/reboot races.
- Host `deploy/watchdog.cron`: every two minutes, inspect only running containers in projects `nexualpha-tg`/`nexualpha-newsroom` bearing `com.nexualpha.watchdog=true`; restart only `unhealthy` containers more than ten minutes after start. Explicit stops and unlabelled/unrelated containers remain untouched. Restart time resets the grace period. Watchdog logs only container IDs, reasons and error classes. No raw inspect environments or Docker output are logged.
- Healthchecks: collector/poller/worker/scheduler/alert heartbeats; HTTP API `/healthz`, verifier `/healthz`, miniapp `/`, admin `/`; newsroom checks both scheduler and scheduled-job freshness. Newsroom labels opt into the same host watchdog.
- Mac templates: `content/com.nexualpha.content-awake.plist` keeps caffeinate alive; `content/com.nexualpha.content-app.plist` runs `open -W -a Claude` and reopens it after exit. These are user-session LaunchAgents: the user must be logged in, and FileVault/unattended-login constraints still apply. Templates are validated, not installed. Existing scheduled task remains its publication owner.

## Heartbeat and data clocks

| Service | Container path |
|---|---|
| Market | `/var/lib/nexualpha-market/market-events.json.heartbeat.json` |
| Whale | `/var/lib/nexualpha-market/whales.json.heartbeat.json` |
| Alert sender | `/var/lib/nexualpha-alerts/heartbeat.json` (overlay sets `ALERT_HEARTBEAT_FILE`) |
| Channel job | `/var/lib/nexualpha-channel-feed/heartbeat.json` |
| Scheduler | `/var/lib/crypto-telegram-ops/scheduler-heartbeat.json` and `scheduler-jobs/*.json` |
| Community poller | `/var/lib/crypto-telegram-ops/poller-health.json` (requires Telegram source patch) |
| Queue worker | `/var/lib/crypto-telegram-ops/worker-heartbeat.json` (requires Telegram source patch) |
| Newsroom | `/state/heartbeat.json` and `/state/{collect,pipeline,daily}.heartbeat.json` |

`updatedAt` is loop progress. `generatedAt` and whale `dataUpdatedAt` retain data age during total source failure. `stale:true` propagates through ticker/market/whale/runtime intel fallbacks. FX retains validated rates beyond its former expiry with explicit stale state; announcements refresh independent venues concurrently within 30-second source budgets and retain aged/failed snapshots with source diagnostics. Source status and delivery receipts are separate from liveness. If no valid snapshot ever existed, no synthetic prices/events are created; cold ticker can return 503, while the home whale module remains fail-soft.

## Content guard and manual catch-up

`content/guard.py` reads the public summary feed (or explicit `--feed <file>`), finds newest **publishedAt**, ignores future/draft dates, and treats an unreadable/empty feed as unhealthy. After three hours it atomically writes `/data/agent/state/content-guard/ALERT.json`. It reuses the health monitor's private owner route: OWNER_CHAT_ID from the alert-sender container and COMMUNITY_BOT_TOKEN from the poller, falling back to verifier. Tokens are read only on the server and never logged, passed on a process command line, or copied into this repo. It sends one incident DM, retries a failed send on the next cron run, and sends one recovery DM. It never publishes an article. A tiny crash window between Telegram acceptance and local notification-state persistence can duplicate an owner alert; no Telegram exactly-once guarantee is claimed.

Lead can install `content/content-guard.cron` after checking server Python/Docker access and state permissions; it runs every 30 minutes. Detection latency is up to 3h30m plus scheduler/network delay. Local dry-run is nonmutating:

```sh
python3 ops/pipeline-resilience/content/guard.py --feed pilot-01-prototype/public/content/news-feed-summary.json --dry-run
python3 ops/pipeline-resilience/content/catch-up.py --engine '/Users/bestberlin/Documents/AEO Crypto Factory/deployment/nexualpha-content-engine' --dry-run
```

Manual recovery (after reading current ledgers, quotas and active task state):

```sh
python3 ops/pipeline-resilience/content/catch-up.py --engine '/Users/bestberlin/Documents/AEO Crypto Factory/deployment/nexualpha-content-engine'
```

The wrapper locks `state/content-run.lock` with flock and runs one `caffeinate -dims claude -p` cycle following the existing runbook. It does not create a second scheduler. To serialize manual and scheduled CLI runs, both must use this wrapper; the existing Claude desktop scheduled task does not automatically share this lock. Check it has finished before manual catch-up, and never run two publishers. No Mac launchd/content state was changed here. Daily-social scheduler activation remains explicit (`DAILY_SOCIAL_ENABLE=1`, delivery additionally `DAILY_SOCIAL_POST=1`); preview does not implicitly publish.

## Verify after reboot (read-only first)

1. `docker ps --format '{{.Names}} {{.Status}}'`: Postgres/Valkey healthy, then workers/poller/API, miniapp/verifier, market/whale, alerts/scheduler/newsroom. Running is not enough; inspect health, heartbeat and source statuses.
2. Read only `.State.Health` from relevant containers. Heartbeat JSON updatedAt should advance; compare data generatedAt/dataUpdatedAt and source lastSuccessAt separately. A degraded heartbeat requires investigating source/DB/Telegram failures; restarting a healthy loop does not fix an upstream outage.
3. `curl --fail --max-time 15 https://nexualpha.com/api/ticker.json`, `/api/whales.json?view=home`, `/intel/market-events.json`: verify original timestamps, stale flag on retained data, JSON validity and recovery after source returns. Confirm home modules still render/hide empty boards without invented values.
4. Inspect persisted delivery receipts: each same-day catch-up slot delivered at most once. A pending receipt represents an ambiguous send and must be reconciled with actual channel history before clearing; never delete state to force retry.
5. Read newsroom job/source markers and query the existing paged dedupe path. Retention/VACUUM is a proposal in its runbook; no DELETE/VACUUM/DB migration is installed or run by this change.
6. Read content guard state/ALERT and compare summary newest publishedAt; a local seed is not production truth. Validate the owner alert route on the server only with explicit lead-controlled test delivery.

## Evidence and limits

The brief's read-only production inspection saw market collector uptime of two seconds while peer services were up six hours; this corroborates process instability but does not prove a specific crash cause from the limited log tail. Local fault-injection covers startup DNS failure, bounded timeout/source isolation, stale fallbacks, catch-up/delivery receipt cases and DB reconnect paths. No live reboot, Docker merge/restart, real Telegram send, live DB restart or content publication was performed. See REPORT.md for exact completed commands and results.
