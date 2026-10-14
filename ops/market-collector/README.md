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
