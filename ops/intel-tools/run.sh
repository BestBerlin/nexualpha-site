#!/bin/bash
# Crypto calendar refresh on the BaoTa host (2026-10-13). Rewrites the runtime snapshot the web containers read
# (CALENDAR_FILE = host /data/private/nexualpha/intel/calendar.json); /calendar, /calendar.ics and /intel/calendar.json
# pick it up within 5 minutes, no redeploy.
#   run.sh calendar  macro schedules, exchange dates, campaign deadlines -> calendar.json
# /etf-flows has no collector until a data source we may republish is approved (see docs/etf-calendar-refresh.md).
# Install: pilot-01-prototype/docs/etf-calendar-refresh.md (host copy in /data/agent/srv/intel-tools).
set -euo pipefail
HERE=$(cd "$(dirname "$0")" && pwd)
DIR=${INTEL_OUT_DIR:-/data/private/nexualpha/intel}
# The host's own node does not run on its glibc: use the same image as the web containers (no npm install needed).
IMAGE=${INTEL_TOOLS_IMAGE:-node:20-bookworm-slim}
mode=${1:-calendar}
case "$mode" in
  calendar) script=scripts/intel-tools/collect-calendar.mjs; file=calendar.json ;;
  *) echo "usage: run.sh calendar" >&2; exit 2 ;;
esac
[ -s "$DIR/$file" ] && cp -p "$DIR/$file" "$DIR/$file.prev"
if timeout 900 docker run --rm --name "intel-tools-$mode" -v "$HERE/app:/app:ro" -v "$DIR:/out" -w /app \
    "$IMAGE" node "$script" --out "/out/$file"; then
  echo "$(date -u +%FT%TZ) $mode ok"
else
  echo "$(date -u +%FT%TZ) $mode FAILED; $DIR/$file unchanged (the collector writes via rename only after a usable snapshot)" >&2
  exit 1
fi
