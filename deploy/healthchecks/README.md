# F21: reviewed repository-side healthcheck proposal

These snippets are review material, not an applied deployment. No SSH, Docker,
production change, automatic restart policy, publishing or second poller is
part of this proposal. `compose.snippets.yml` deliberately omits images and
commands: merge selected healthcheck entries into the existing stack only after
review. `Dockerfile.web.snippet` is the equivalent web image instruction; the
current `deploy/stage-remote.py` uses `docker run`, so the lead must explicitly
choose how to install it without changing the cutover flow.

## Evidence and meaning

| Container role (snippet key) | Probe and repository source | What passing proves / limitation |
| --- | --- | --- |
| web (`web`) | Exact HTTP 200 on local `/health/web-ready`; `pilot-01-prototype/server.mjs` | HTTP handler readiness only. `/health/live` is HTTP liveness. CTA/error storage/dependency readiness remain separate deployment gates. |
| tg-api (`api`) | Exact HTTP 200 on `127.0.0.1:14322/healthz`; `ops/pipeline-resilience/deploy/compose.resilience.yml` | Existing API health endpoint responds; dependency semantics need review against the external API source. |
| tg-worker (`worker`) | `worker-heartbeat.json.updatedAt`; `ops/pipeline-resilience/telegram/startup-heartbeats.patch` | Loop progress only; **blocked until the reviewed writer patch is installed and producing snapshots**. `backendConnectivity` is separate readiness; idle queue age is not failure. |
| scheduler (`scheduler`) | `scheduler-heartbeat.json.updatedAt`; `ops/telegram-scheduler/scheduler.sh` | Main timer progresses (30 seconds). Inspect `scheduler-jobs/*.json` exitCode/status for each actual job; timer health cannot prove jobs succeeded. |
| alert-sender (`alert-sender`) | `ALERT_HEARTBEAT_FILE.updatedAt`; `ops/alert-sender/alert-sender.mjs` | Attempt progress, including failed/degraded cycles. Does not prove Telegram delivery or fresh source data. |
| community-poller (`community-poller`) | `poller-health.json.updatedAt`; `ops/pipeline-resilience/telegram/startup-heartbeats.patch` | **Blocked until writer patch is installed**. Successful polling requires separate `lastSuccessfulPollAt`, failure count and connectivity review; offset/receipts must remain untouched. |
| rsshub (`rsshub`) | PID1 signal-zero process probe | Weak liveness only. No cheap verified local HTTP health endpoint or heartbeat writer is present in this repository. Confirm Node executable and PID1 ownership before using; an init wrapper would invalidate this probe. RSS feed fetching can trigger upstream work and is excluded from Docker readiness. |

Liveness is process/timer progress; readiness is the explicit local HTTP 200
(or separately inspected dependency status); freshness is the age of actual
source data. None implies publication, delivery, indexing or conversion success.
A green Docker state must not collapse these dimensions.

File probes reuse the existing dependency-free
`ops/pipeline-resilience/deploy/healthcheck.mjs` (stage it at the snippet path).
They parse `updatedAt`, reject missing/invalid JSON, missing/invalid timestamps,
ages above 600 seconds and clocks over 60 seconds into the future. Fresh
`failed`, `degraded` or `reconnecting` snapshots intentionally pass: restarting
on an upstream outage would obscure diagnostics and create restart loops.
The 600-second threshold is the existing resilience policy; scheduler/worker
write every 30 seconds, alert retries can back off to five minutes. Review that
budget against actual runtime cadence before promotion.

## Review and application gates

1. Confirm the actual Compose project and service keys. `web`, `api`, `worker`
   are roles here; they are not asserted live container names. Do not run this
   partial file alone or replace an existing service definition with it.
2. Confirm the absolute Node binary paths and the helper's read-only mount in
   each Telegram container; paths mirror the existing resilience overlay, not
   a claim about the running host. Web uses its own image Node on PATH.
3. Confirm persistent writable state directories and writer env match the
   reader. Do not create/touch synthetic heartbeats. Verify worker/poller
   source patch hashes/applicability per their README and stage only once.
4. Observe genuinely changing snapshots over at least two cycles, dependency
   outages, and recovery in a staging environment. Verify fresh failed cycles
   remain distinguishable from stale loops. RSSHub HTTP readiness remains a
   documented gap until its installed image/source establishes a cheap route.
5. Evaluate freshness independently: inspect the collector payload's own
   timestamps/source statuses and the existing `pilot-01-prototype/src/ops/operational-health.js`
   policy. Do not treat heartbeat `updatedAt` or a missing freshness marker as
   fresh business data. For delivery use existing receipts; never send a probe
   publication or require a busy queue to consider a worker alive.
6. Docker health marks status only; it does not restart a running container.
   These snippets add no watchdog labels, restart policy or depends_on gates.
   If an existing watchdog consumes health state, review its behavior before
   application. Rollback removes only these added healthcheck entries (or
   restores the prior ones); preserve state/receipts and existing mounts/env.

## Local verification

From repository root, using Node 24:

```sh
node --test deploy/healthchecks/healthchecks.test.mjs ops/pipeline-resilience/deploy/healthcheck.test.mjs
```

This validates the reused heartbeat helper. HTTP snippets deliberately use
`status === 200` and `redirect: 'manual'`, stricter than the existing helper's
HTTP mode (which admits redirects). The accompanying test executes the actual snippet commands against
local fixtures with 200, 302, 503 and unreachable responses.
Local fixtures and syntax parsing prove probe behavior only; no container,
image executable path, volume, network or live dependency has been verified.
