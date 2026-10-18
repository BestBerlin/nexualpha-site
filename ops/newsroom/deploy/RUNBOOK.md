# Newsroom reboot recovery

This is a deployment proposal and local verification record. No production process was restarted.

| Failure mode | Previous behavior | Recovery with this change |
| --- | --- | --- |
| DNS/Postgres unavailable while booting | CLI failed on its first connection attempt | Fresh psql processes retry proven connection establishment failures with 1–30 second exponential backoff, capped at five minutes; the scheduler continues after a failed job |
| DB disconnect during a write | Failed job | Fail that query without replaying an ambiguous write; the next scheduled run reconnects; raw item ingestion retains transactional uniqueness |
| DB/socket/query stalls | Query could hold a job until its outer timeout | 10 second connect timeout, 30 second statement timeout, 45 second client process timeout plus existing whole-job timeout |
| One collector fails or hangs | Source circuit breakers and source/request deadlines | Preserved; atomic collect-sources.json records source status, including persistence failures |
| Scheduler heartbeat masks a dead job loop | A generic touch heartbeat always looked alive | Atomic heartbeat.json includes independent collect/pipeline/daily markers; health requires aggregate freshness under 10 minutes and job progress under 11 minutes (10 minute schedule plus jitter) |
| Reader observes half a dry-run snapshot | Direct file writes | Temporary file plus rename for NDJSON and source JSON; production export snapshots already used validated atomic replacement |
| Large dedupe result | Keyset paging plus enlarged output buffer | Preserved: default 250-event pages, advancing IDs, 128 MB client cap |

## Startup ordering and restart ownership

Postgres and RSSHub live in another Compose project and are reached through host networking. Cross-project `depends_on` cannot order them. Bring up their owning stacks first, wait for their healthchecks, then start the newsroom stack. The newsroom scheduler uses `restart: unless-stopped`, independently starts collect after 30 seconds, daily after 60 seconds, and pipeline after 330 seconds. Dependency retries remain necessary even with ordered startup because Postgres can restart later.

The scheduler owns recurring collect/pipeline/daily jobs, per-job flock locks, and outer timeouts of 570/300/120 seconds. A database outage never terminates the scheduler. The collector keeps per-source backoff and bounded requests; a persistence failure is visible in the collection report. SQL/authentication errors fail immediately. Lost in-flight connections are deliberately not retried inside a mutation because the database might already have committed it. Inspect writer claims before manually repeating writer commands.

The deployment's shared watchdog owns restarts of an unhealthy or stale newsroom container; Docker health status alone does not restart a running container. Configure it against `/state/heartbeat.json` or this service's Docker health, never the old `/state/heartbeat` touch file. Scheduler failure outcomes and source failures remain separate from liveness: a fresh failed cycle must remain visible without causing a restart loop while Postgres is unavailable.

## Staging reboot check (operator/deployer)

These commands require a staging copy, staging private env file and isolated state/output mounts. Do not run against production to validate this patch.

1. Start Postgres/RSSHub staging dependencies, then `docker compose -p nexualpha-newsroom-staging -f <staging-compose.yml> up -d --build`.
2. `docker compose -p nexualpha-newsroom-staging -f <staging-compose.yml> restart`; inspect `logs --since 15m newsroom-collector` and `ps`.
3. Restart the staging Postgres container during collect/pipeline. Verify reconnect within five minutes when failure happened before execution, or one visible failed cycle followed by recovery for an in-flight disconnect. Compare counts/uniqueness of raw items and check writer claims before repeating any manual mutation.
4. Read `/state/heartbeat.json`, `/state/collect-sources.json`, `/state/logs/{collect,pipeline,daily}.log`; require changing timestamps, per-job exit codes and per-source statuses. Check `top-events.json` remains parseable while exporting and remains last-good if pipeline fails.
5. Pause a staging job loop: its progress marker must expire even if the aggregate writer is alive. Stop the aggregate writer: freshness must fail after 10 minutes. Verify shared watchdog records a restart.

Local tests simulate psql startup refusal/DNS recovery, five-minute retry exhaustion, no replay after ambiguous loss, output buffer protection, dead job detection, per-source failure isolation and dedupe paging. Docker is unavailable in the current workspace, so Compose restart and live Postgres restart were not exercised.

## Daily maintenance proposal (not installed)

Schedule a single locked daily server-side job outside collection peak time using the existing private PG environment, `PGCONNECT_TIMEOUT=10` and a bounded statement timeout. First back up the database and measure table size, dead tuples and transaction age. Initially delete only `job_runs` older than 90 days in bounded batches, then issue `VACUUM (ANALYZE) job_runs;` in a separate nontransactional psql call. Retain 30 days of status snapshots as the current daily job already does.

For raw items, event evidence and scores, agree retention and archival rules before deletion: events, evidence, writer claims and articles have cross references and are editorial audit records. Propose archiving expired/rejected unclaimed events older than 90 days only after verifying no article, claim or evidence reference needs them. Keep `autovacuum` enabled; inspect `pg_stat_user_tables` daily. Do not run `VACUUM FULL` in an automated job because it requires exclusive locks. Record maintenance outcome and duration in the server ops log and surface failures through the existing owner alert channel.
