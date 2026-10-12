#!/bin/bash
# Coin data refresh on the BaoTa host (2026-10-12). Rewrites the runtime snapshot the web containers read
# (COINS_FILE=/intel-state/coins.json = host /data/private/nexualpha/intel/coins.json); /coins pages and /intel/coins.json
# pick it up within 5 minutes, no redeploy. The page set (sitemap, routes, descriptions) still ships with each release.
#   run.sh daily   exchange listings only (--reuse-universe, ~1 min)
#   run.sh weekly  full refresh: CoinGecko universe, prices, categories + listings (~10 min, free-tier rate limit)
# Install: docs/coins-refresh.md (host copy in /data/agent/srv/coins-refresh, cron 11:20 CST daily, Sun 12:10 CST weekly).
set -euo pipefail
HERE=$(cd "$(dirname "$0")" && pwd)
OUT=${COINS_OUT:-/data/private/nexualpha/intel/coins.json}
NODE=${NODE_BIN:-$(command -v node || echo /root/.nvm/versions/node/v20.20.2/bin/node)}
mode=${1:-daily}
args=(--json-only --out "$OUT")
[ "$mode" = daily ] && args+=(--reuse-universe)
[ -s "$OUT" ] || { echo "$(date -u +%FT%TZ) no $OUT yet: seed it with the release copy first" >&2; exit 1; }
cp -p "$OUT" "$OUT.prev"
cd "$HERE/app"
if timeout 1800 "$NODE" scripts/build-coin-availability.mjs "${args[@]}"; then
  echo "$(date -u +%FT%TZ) $mode ok"
else
  echo "$(date -u +%FT%TZ) $mode FAILED; $OUT unchanged (the generator writes via rename only after a usable snapshot)" >&2
  exit 1
fi
