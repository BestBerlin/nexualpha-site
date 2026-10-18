# Telegram runtime patch bundle

These files are reviewable patches only. The external Telegram checkout and production are untouched. The patch is based on the current dirty contents of `/Users/bestberlin/Documents/ChatGPT/Telegram`, not its committed HEAD. `source-bases.json` pins both input files by SHA-256; recheck before applying or rebasing. `generate-patches.py` only reads that source tree and writes this bundle.

`startup-heartbeats.patch` changes only:

- `apps/worker/src/publication-worker.ts`: explicitly retains indefinite Valkey reconnects with 1–30 second exponential backoff, ten-second connect attempts and BullMQ's required `maxRetriesPerRequest: null`. It writes an atomic heartbeat every 30 seconds, including connectivity of both regular and blocking Redis clients, job progress/outcome and sanitized backend error time. Heartbeat writes fail visibly without terminating the worker. Shutdown stops the heartbeat timer. No publication retry or transport behavior changes.
- `apps/bot-community/src/polling-runner.ts`: writes an atomic `updatedAt` snapshot before polling, after a successful poll, after processing updates, and on failure before backing off. It keeps last successful poll time, failure count, phase and degraded connectivity separate. Existing 20-second long-poll transport deadlines, Telegram retry-after handling, delivery receipts and offset advancement remain intact. Generic failure backoff grows to 30 seconds. The current local source had no existing `POLL_HEALTH_SNAPSHOT_PATH` writes despite production's diagnostic environment setting, so this patch introduces that missing path.

Snapshot paths match the Compose overlay:

- Worker: `WORKER_HEARTBEAT_FILE`, fallback `WORKER_HEALTH_SNAPSHOT_PATH`, default `/var/lib/crypto-telegram-ops/worker-heartbeat.json`.
- Poller: `POLL_HEALTH_SNAPSHOT_PATH`, default `/var/lib/crypto-telegram-ops/poller-health.json`.

A fresh failure snapshot is evidence that the runtime is progressing while a dependency is down; it is not evidence that publication succeeded. The worker can remain alive through a backend outage without publishing. Poller snapshots contain no token, request URL, member identity, message text or raw exception. The worker's `lastProgressAt` is job activity; an idle queue does not require completed jobs to be live. The watchdog must use `updatedAt` for process freshness and report degraded backend connectivity separately.

BullMQ connection settings follow its [official connection guidance](https://docs.bullmq.io/guide/connections), and the patch uses the installed BullMQ 6.3.3 `getBackend()` API. Both worker Redis clients must reach `ready` before the snapshot says `connected`.

Run from the site worktree:

```sh
node --test ops/pipeline-resilience/telegram/startup-heartbeats.test.mjs
git -C '/Users/bestberlin/Documents/ChatGPT/Telegram' apply --check '/Volumes/致态2TB/nx-wt-codex-pipeline-resilience/ops/pipeline-resilience/telegram/startup-heartbeats.patch'
```

The four tests check exact source hashes and nonmutating patch applicability, execute the patched worker with a mocked BullMQ backend through connection failure/recovery, execute the patched poller loop through a simulated network failure, and compile both patched TypeScript entrypoints using an in-memory compiler overlay against the current source baseline. No external files are written. The TypeScript test reports any existing baseline diagnostics separately and rejects new diagnostics.

Limitations: no live Valkey/Telegram/Docker integration was run, no external application test suite was executed against an applied checkout, no source patch was applied or deployed, and no staging reboot was performed. Production may differ from the local dirty source and needs its own applicability review. Invalid runtime credentials/configuration retain existing failure semantics. Separately verified `apps/miniapp-verifier/src/server.ts` serves its health route at `/healthz`, not `/health`.
