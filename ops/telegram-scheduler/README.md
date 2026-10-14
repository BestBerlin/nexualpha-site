# Telegram scheduler env path repair

`scheduler.sh` is the production scheduler captured read-only from
`nexualpha-prod` on 2026-10-14, with only the poller env initialization and loader
changed. The scheduler previously exported `poller_env` but not `STACK`.
`discussion-close` calls that function through `bash -c`, where `$STACK` was
empty and the source path became `/community-poller.env`.

The scheduler now exports `COMMUNITY_POLLER_ENV_FILE`, defaulting to
`/srv/agent/stacks/crypto-telegram-ops/community-poller.env` for unset or empty
values. The exported function also has that default. It checks for a readable
regular file before sourcing and emits one error with the expected path per
failed run. Missing files and failed sources prevent command execution. It does
not log env contents. Existing scheduling intervals and other jobs are retained.

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
fixtures. They never start scheduler loops or contact Telegram.
