# Telegram scheduler env path repair

`scheduler.sh` is based on the production scheduler captured read-only from
`nexualpha-prod` on 2026-10-14. The scheduler previously exported `poller_env` but not `STACK`.
`discussion-close` calls that function through `bash -c`, where `$STACK` was
empty and the source path became `/community-poller.env`.

The scheduler now exports `COMMUNITY_POLLER_ENV_FILE`, defaulting to
`/srv/agent/stacks/crypto-telegram-ops/community-poller.env` for unset or empty
values. The exported function also has that default. It checks for a readable
regular file before sourcing and emits one error with the expected path per
failed run. Missing files and failed sources prevent command execution. It does
not log env contents. Successful jobs retain their scheduling intervals. A failed
job retries after 5, 10, 20, ... seconds, capped at 300 seconds (or its normal
interval if shorter); the loop stays alive while reboot-time DNS/network recovers.
Each job is still bounded by `timeout`. A passing invocation resets backoff.

Atomic JSON status lives in `$SCHEDULER_STATE_DIR` (default
`/var/lib/crypto-telegram-ops`): `scheduler-heartbeat.json` updates every 30 seconds;
`scheduler-jobs/<name>.json` records `running`/`ok`/`failed`, `updatedAt` and the last
exit code. The main heartbeat proves loop liveness; inspect the job files for
upstream failures. Mount this directory persistently and use the main heartbeat
for the scheduler healthcheck. No credentials are written to status files.

Channel morning, Monday noon poll and Monday tool slots catch up through their
same local day after data recovers. Daily digest/funnel slots catch up through
the same UTC day. Persisted per-target receipts skip confirmed sends and retain
ambiguous `pending` sends for manual review; failures must never be marked as
completed slots. Announcements retain their 36-hour cutoff and article editions
retain their 90-minute pacing. Initial baselines still prevent backlog floods.

The alert daemon retries failed cycles after 1, 2, 4, ... seconds (up to five
minutes) and returns to two-minute cadence after recovery. Its atomic
`ALERT_HEARTBEAT_FILE` defaults beside `ALERT_STATE_FILE` as `heartbeat.json`;
the channel job writes `CHANNEL_FEED_STATE_DIR/heartbeat.json`. Both include
source outcomes and mark caught Telegram failures as degraded. Market-backed
catch-up waits when a feed is explicitly stale or its tracked market source is
failed/open, even when other collector sources are healthy.

Provision `channel-feed/delivery-receipts.mjs` with the rest of the channel
bundle. Announcements and listing DMs keep receipt keys per item and recipient,
so regrouped listings cannot repeat confirmed items. Unknown outcomes and active
rate-limit backoff are quarantined while unrelated new notices can progress.

To opt into daily-card catch-up, stage its existing renderer dependencies and
private journal mount, then set `DAILY_SOCIAL_ENABLE=1`. The scheduler invokes
`generate.mjs --catch-up` every five minutes, eligible after 09:00 Singapore time.
It stays in preview mode unless `DAILY_SOCIAL_POST=1` is also explicitly set.
Use the daily-card README for required feed, account and private credential paths.
Do not run an additional daily-card cron alongside this scheduler job.

## Server handoff (not applied)

On the new production host `156.225.26.69:42909`, replace
`/srv/agent/stacks/crypto-telegram-ops/baota/scheduler.sh` with this tracked file,
after preserving the existing script. In
`/srv/agent/stacks/crypto-telegram-ops/baota/apps-compose.yml`, add this exact
line under the existing `scheduler:` service:

```yaml
    environment: { COMMUNITY_POLLER_ENV_FILE: /srv/agent/stacks/crypto-telegram-ops/community-poller.env }
```

This is the **container** path. The existing anchor mounts
`/data/agent/srv:/srv/agent`, and a read-only check confirmed the expected file
is readable inside `nexualpha-tg-scheduler-1`. Keep that mount. No credentials
need to be copied into Compose or the repository. The Compose setting is
explicit configuration; the updated script's fallback also works without it.
Adding the setting alone to the old script does not repair the old loader.

After a separately authorized deployment of both changes, recreate only the
scheduler service for the new Compose environment to take effect:

```sh
docker compose -p nexualpha-tg -f /srv/agent/stacks/crypto-telegram-ops/baota/apps-compose.yml --profile cutover up -d --no-deps --force-recreate scheduler
```

Then inspect the next `discussion-close` cycle for the env diagnostic and job
exit status. This task does not apply that change, recreate a container, invoke
discussion closing, or establish a successful production run. Rollback uses
the saved script and removal of the added Compose line, followed by the same
scheduler-only recreation.

## Local verification

```sh
bash -n ops/telegram-scheduler/scheduler.sh
node --test ops/telegram-scheduler/scheduler.test.mjs
git diff --check
```

Tests run the actual initialization and exported function in child Bash,
including the production discussion invocation, using disposable local env
fixtures, plus one bounded job loop with fake timeout/sleep commands to simulate
two reboot-time failures and recovery. They never start production jobs or contact Telegram.
