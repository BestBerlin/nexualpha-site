#!/bin/bash
# Tokenized-stocks listing refresh on the production host (2026-10-18). Rewrites the runtime snapshot the web containers
# read (TS_LIVE_FILE=/intel-state/tokenized-stocks.json = host /data/private/nexualpha/intel/tokenized-stocks.json): the
# ticker and exchange pages and /intel/tokenized-stocks.json pick up new stock listings and delistings within 5 minutes,
# no redeploy. Each change is appended to tokenized-stocks-events.jsonl and kept in the snapshot's rolling `events` log
# (the pages show it; the newsroom source nexualpha-tokenized-stocks turns it into listing/delisting events).
# Install: pilot-01-prototype/docs/tokenized-stocks-refresh.md (host copy in /data/agent/srv/tokenized-stocks-refresh,
# cron every 3 hours at :35).
set -euo pipefail
HERE=$(cd "$(dirname "$0")" && pwd)
OUT=${TS_LIVE_OUT:-/data/private/nexualpha/intel/tokenized-stocks.json}
IMAGE=${TS_REFRESH_IMAGE:-node:20-bookworm-slim}
[ -s "$OUT" ] || { echo "$(date -u +%FT%TZ) no $OUT yet: seed it with the release copy (public/intel/tokenized-stocks.json) first" >&2; exit 1; }
cp -p "$OUT" "$OUT.prev"
name=$(basename "$OUT")
if timeout 600 docker run --rm --name tokenized-stocks-refresh -v "$HERE/app:/app:ro" -v "$(dirname "$OUT"):/out" -w /app \
    "$IMAGE" node scripts/build-tokenized-stocks-live.mjs --json-only --out "/out/$name" --events "/out/tokenized-stocks-events.jsonl"; then
  echo "$(date -u +%FT%TZ) ok"
else
  echo "$(date -u +%FT%TZ) FAILED; $OUT unchanged (the generator writes via rename only after a usable snapshot)" >&2
  exit 1
fi
