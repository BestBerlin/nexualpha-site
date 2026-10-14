#!/usr/bin/env bash
# Replaces the CT121 systemd timers on the BaoTa server. One loop per job: run, then wait the same interval the
# timer used (OnUnitActiveSec/OnUnitInactiveSec). A failing job is logged and retried on the next cycle.
NODE=/srv/agent/runtimes/node-v22.19.0-linux-x64/bin/node
REL=/srv/agent/releases/crypto-telegram-news
STACK=/srv/agent/stacks/crypto-telegram-ops
export COMMUNITY_POLLER_ENV_FILE="${COMMUNITY_POLLER_ENV_FILE:-$STACK/community-poller.env}"

job() { # name first-delay interval timeout cwd -- command...
  local name=$1 first=$2 every=$3 limit=$4 cwd=$5; shift 6
  ( sleep "$first"
    while :; do
      local t0=$(date +%s)
      ( cd "$cwd" && timeout "$limit" "$@" ) 2>&1 | sed "s/^/[$name] /"
      echo "[$name] exit=${PIPESTATUS[0]} took=$(( $(date +%s) - t0 ))s"
      sleep "$every"
    done ) &
}

poller_env() {
  local env_file="${COMMUNITY_POLLER_ENV_FILE:-/srv/agent/stacks/crypto-telegram-ops/community-poller.env}"
  if [[ ! -f "$env_file" || ! -r "$env_file" ]]; then
    printf 'ERROR: community poller env file missing or unreadable: %s\n' "$env_file" >&2
    return 1
  fi
  set -a
  . "$env_file" || return "$?"
  set +a
  exec "$@"
}
export -f poller_env

job market-sync 120 300 90 "$REL/2026-09-05-market-04" -- \
  env MARKET_PULSE_FILE=/var/lib/crypto-telegram-ops/market-pulse.json \
  "$NODE" "$REL/2026-09-05-market-04/dist/apps/worker/src/market-pulse-intake-runner.js"

job discussion-close 120 60 120 "$REL/2026-09-05-market-04" -- \
  bash -c 'poller_env "$0" "$1"' "$NODE" "$REL/2026-09-05-market-04/infra/staging/close-due-market-discussions.mjs"

job news-sync 180 900 300 "$REL/2026-09-07-v3-alpha-03" -- \
  env NEWS_INTAKE_FILE=/var/lib/crypto-telegram-ops/news-candidates.json \
  "$NODE" "$REL/2026-09-07-v3-alpha-03/dist/apps/worker/src/news-intake-runner.js"

job source-sync 300 1800 300 /srv/agent/projects/crypto-telegram-ops -- \
  env OFFICIAL_SOURCE_INTAKE_FILE=/var/lib/crypto-telegram-ops/official-source-intake.json \
  "$NODE" dist/apps/worker/src/official-source-sync-runner.js

job channel-feed 120 600 120 "$STACK/channel-feed" -- \
  env CHANNEL_FEED_TARGETS=zh:@NexuAlphaClub,en:@NexuAlphaGlobal,ru:@NexuAlphaRU,tr:-1003789577571,vi:-1004303684624 \
  "$NODE" "$STACK/channel-feed/channel-feed.mjs"

job x-poster 240 300 120 "$STACK/x-poster" -- \
  env X_ENV_FILE="$STACK/x-nexualpha.env" X_STATE_DIR=/var/lib/crypto-telegram-ops/x-poster MAX_PLAIN_PER_DAY=10 MAX_LINK_PER_DAY=2 X_MAX_WEIGHTED=1200 \
  "$NODE" "$STACK/x-poster/x-poster.mjs" --once


# public feed freshness sample every 5 min (scorecard D2, 2026-10-11): /var/lib/crypto-telegram-ops/data-freshness.jsonl
job data-freshness 60 300 60 "$STACK/data-freshness" -- \
  "$NODE" "$STACK/data-freshness/data-freshness.mjs"

wait
