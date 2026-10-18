# Market collectors

## Whale collector

`whale-collector.mjs` writes the durable feed consumed by `/api/whales.json`.
It follows the same collector-volume pattern as `market-collector.mjs`: write
state under the market volume, then let the web container mount that volume
read-only.

Default production files:

- `WHALES_OUT_FILE=/var/lib/nexualpha-market/whales.json`
- `WHALE_HISTORY_FILE=/var/lib/nexualpha-market/whale-history.json`
- `WHALE_LOCK_FILE=/var/lib/nexualpha-market/whales.json.lock`

For a one-shot local probe, run from the repo root:

```bash
node ops/market-collector/whale-collector.mjs --once
```

Without env overrides, `--once` writes under `.private/whale-watch/`.

Sources are free public endpoints only. Hyperliquid uses the public info API
for clearinghouse state plus bounded 24h `userFillsByTime` backfill, cached per
wallet for at least five minutes, and the public stats leaderboard when no
wallet file is configured. BTC reads
`mempool.space/api/v1/prices` before falling back to a public Binance ticker
for the USD threshold. TRON reads Tronscan's public TRC20 transfer list for
USDT-TRC20. Key-gated sources are skipped unless an operator explicitly
configures them outside chat and outside this script.

The collector:

- runs one owner at a time through `WHALE_LOCK_FILE`; stale locks are reclaimed
  only when the recorded PID is proven dead, and release verifies the owner
  token before deleting the lock;
- writes `whales.json` and history through temp-file + rename;
- keeps position history in `WHALE_HISTORY_FILE` so accumulation signals mature
  across cycles;
- uses source-level exponential backoff after failures;
- clamps cycles to at least 60 seconds, transfer threshold to at least $5M, and
  position threshold to at least $1M;
- never labels a transfer as a sale, never turns unrealized PnL into realized
  PnL, and never fabricates liquidation signals when Hyperliquid fill payloads
  do not carry an explicit liquidation field.

Example compose shape, not deployed by this change:

```yaml
services:
  whale-collector:
    image: nexualpha-site:current
    command: ["node", "ops/market-collector/whale-collector.mjs"]
    environment:
      WHALES_OUT_FILE: /market/whales.json
      WHALE_HISTORY_FILE: /market/whale-history.json
      WHALE_CYCLE_MS: "60000"
    volumes:
      - /data/agent/state/market:/market
    restart: unless-stopped
```

The web stage mounts the same host directory read-only and sets
`WHALES_FILE=/market/whales.json`.

## Reboot recovery and heartbeat contract

Both long-running collectors use a serial loop. A failed initial cycle retries
with 1, 2, 4, 8, 16, then at most 30 seconds of delay, within a five-minute
startup budget. After that budget they remain alive and retry on their normal
cadence (market: five minutes; whales: at least one minute). No interval can
start a second cycle while the previous cycle is running. Synchronous stream
startup errors also reconnect without killing market REST collection.

HTTP deadlines cover headers and body reads (10 seconds). Market source groups
run concurrently, with persistent endpoint circuit breakers and a 60-second
group ceiling. OKX funding requests use batches of four; Binance funding can
still publish when OKX fails, and vice versa. Whale adapters keep their circuit
breakers across cycles and have a 45-second whole-source deadline; aborting a
source also aborts its bounded fetch calls. A source in cooldown is reported
as `open`, and healthy sources continue collecting.

Snapshots and JSON-lines history use same-directory temporary files followed
by rename. Every completed attempt writes `<OUT_FILE>.heartbeat.json` with
`updatedAt`, `status`, and `sourceStatus`; default paths are:

- `/var/lib/nexualpha-market/market-events.json.heartbeat.json`
- `/var/lib/nexualpha-market/whales.json.heartbeat.json`

On total outage the last good payload remains available with `stale: true`.
`generatedAt` retains its original data timestamp, while `updatedAt` records
the collector attempt. Whale snapshots additionally retain `dataUpdatedAt`.
Partial recovery sets `degraded: true` and a degraded heartbeat whenever any
source is failed, in cooldown, or the liquidation stream is unavailable.
Consumers needing current prices should require `sourceStatus.markets.status`
to be `ok` when source status is present, because other sources can recover
while the previous market-price block remains cached.
The heartbeat describes process progress; a fresh heartbeat does not imply
fresh upstream data. Monitor `status`, `stale`, `generatedAt`, and individual
source results separately. A filesystem write error is still an operational
failure and may prevent heartbeat persistence.

The one-shot data freshness probe writes
`<DATA_FRESHNESS_FILE>.heartbeat.json` even on network failure and retries
within the same five-minute startup budget. Samples retain upstream
`generatedAt` age checks, so a fresh collector heartbeat cannot make old
funding data pass the freshness scorecard.

Offline regression checks from the repository root:

```bash
node --test ops/market-collector/resilience.test.mjs ops/data-freshness/data-freshness.test.mjs pilot-01-prototype/tests/whale-collector.test.mjs pilot-01-prototype/tests/market-collector-funding.test.mjs
```

These simulate DNS failure, an unresponsive source/body, breaker recovery,
five-minute startup budgeting, and last-good writes. They do not demonstrate
production restart ordering; deployment and a staging Compose restart remain
the release owner's responsibility.
