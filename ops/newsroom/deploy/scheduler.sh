#!/usr/bin/env bash
# Newsroom scheduler for BaoTa (T6), same loop pattern as crypto-telegram-ops/baota/scheduler.sh.
#   scheduler.sh            run all loops (container entrypoint)
#   scheduler.sh run JOB    run one job now with the same lock/log/run-record (JOB: collect|pipeline|daily)
# Each job holds a flock under $NEWSROOM_STATE/locks so loops and manual runs never overlap.
# Every run is recorded in the job_runs table and appended to $NEWSROOM_STATE/logs/<job>.log.
set -uo pipefail
export TZ=Asia/Singapore
export PGCONNECT_TIMEOUT=${PGCONNECT_TIMEOUT:-10}
export PGOPTIONS="${PGOPTIONS:-} -c statement_timeout=30000"
APP=${NEWSROOM_APP:-/srv/newsroom/app}
CLI=(node "$APP/bin/newsroom.mjs")
OUT=${NEWSROOM_OUT:-/out}
STATE=${NEWSROOM_STATE:-/state}
COLLECT_MODE=${COLLECT_MODE:-all}          # all = `collect --all`; per-source = one process per enabled source
COLLECT_SOURCE_TIMEOUT=${COLLECT_SOURCE_TIMEOUT:-120}
EXPORT_LIMIT=${EXPORT_LIMIT:-50}
SNAPSHOT_HOUR=${SNAPSHOT_HOUR:-9}          # daily status snapshot after 09:00 Asia/Singapore
mkdir -p "$STATE/locks" "$STATE/logs" "$OUT/status"

job_heartbeat() { node "$APP/deploy/heartbeat.mjs" job "$@"; }

log() { printf '%s [%s] %s\n' "$(date -Is)" "$1" "$2"; }

rotate() { local f=$1; [ -f "$f" ] && [ "$(stat -c %s "$f")" -gt 5242880 ] && mv -f "$f" "$f.1"; true; }

record_run() { # job started_epoch exit_code note
  local ms=$(( ($(date +%s) - $2) * 1000 ))
  psql -X -q --no-password -v ON_ERROR_STOP=1 -v job="$1" -v started="$2" -v code="$3" -v ms="$ms" -v note="${4:0:500}" >/dev/null <<'SQL' || log "$1" "WARN could not record run"
INSERT INTO job_runs(job, started_at, exit_code, duration_ms, note) VALUES (:'job', to_timestamp(:'started'::double precision), :'code'::int, :'ms'::int, nullif(:'note',''));
SQL
}

has_command() { "${CLI[@]}" --help 2>/dev/null | head -1 | grep -qE "(^|[| ])$1([ |]|$)"; }

job_collect() {
  if ! has_command collect; then echo "skipped: collect is not in this release yet (T2 collectors pending)"; return 0; fi
  if [ "$COLLECT_MODE" = per-source ]; then
    local failed=0 total=0 id source_ids
    source_ids=$(psql -X -At --no-password -v ON_ERROR_STOP=1 -c "SELECT id FROM sources WHERE enabled AND status IN ('connected','partial') ORDER BY id") || return $?
    for id in $source_ids; do
      total=$((total+1))
      timeout "$COLLECT_SOURCE_TIMEOUT" "${CLI[@]}" collect --source "$id"; local rc=$?
      [ "$rc" -eq 0 ] || { failed=$((failed+1)); echo "source $id failed (exit $rc)"; }
    done
    echo "per-source collect: $((total-failed))/$total ok"
    [ "$failed" -lt "$total" ] || [ "$total" -eq 0 ]
  else
    "${CLI[@]}" collect --all
  fi
}

write_json() { # target file, from stdin; atomic replace, private perms
  local tmp; tmp=$(mktemp "$1.XXXXXX") && cat > "$tmp" && node -e 'JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"))' "$tmp" \
    && chmod 0640 "$tmp" && mv -f "$tmp" "$1" || { rm -f "$tmp"; return 1; }
}

job_pipeline() {
  local rc=0
  "${CLI[@]}" dedupe || return 1
  "${CLI[@]}" score || return 1
  "${CLI[@]}" verify || return 1
  "${CLI[@]}" export:top --limit "$EXPORT_LIMIT" | write_json "$OUT/top-events.json" && echo "exported top-events.json" || rc=1
  "${CLI[@]}" status | write_json "$OUT/status-latest.json" || rc=1
  return $rc
}

job_daily() {
  local today; today=$(date +%F)
  if [ "$(date +%-H)" -lt "$SNAPSHOT_HOUR" ] || [ -s "$OUT/status/status-$today.json" ]; then echo "snapshot not due"; return 0; fi
  "${CLI[@]}" status | write_json "$OUT/status/status-$today.json" || return 1
  find "$OUT/status" -name 'status-*.json' -mtime +30 -delete
  echo "wrote status/status-$today.json"
}

run_job() { # name
  local name=$1 t0 rc out
  exec 9>"$STATE/locks/$name.lock"
  if ! flock -n 9; then log "$name" "skip: previous run still holds the lock"; exec 9>&-; return 0; fi
  t0=$(date +%s)
  rotate "$STATE/logs/$name.log"
  out=$( { "job_$name"; } 2>&1 ); rc=$?
  printf '%s\n' "$out" | sed "s/^/$(date -Is) [$name] /" | tee -a "$STATE/logs/$name.log"
  log "$name" "exit=$rc took=$(( $(date +%s) - t0 ))s" | tee -a "$STATE/logs/$name.log"
  record_run "$name" "$t0" "$rc" "$(printf '%s' "$out" | tail -3 | tr '\n' ' ')"
  exec 9>&-
  return $rc
}

loop() { # name first-delay interval timeout
  local name=$1 first=$2 every=$3 limit=$4
  ( sleep "$first"
    while :; do
      local t0=$(date +%s) rc
      job_heartbeat "$name" running
      timeout "$limit" bash "$0" run "$name"; rc=$?
      job_heartbeat "$name" completed "$rc"
      if [ "$rc" -eq 124 ]; then log "$name" "killed after ${limit}s timeout"; record_run "$name" "$t0" 124 "timeout after ${limit}s"; fi
      local left=$(( every - ($(date +%s) - t0) )); [ "$left" -gt 30 ] || left=30
      sleep "$left"
    done ) &
}

if [ "${1:-}" = run ]; then
  case "${2:-}" in collect|pipeline|daily) run_job "$2"; exit $? ;; *) echo "usage: $0 run collect|pipeline|daily" >&2; exit 2 ;; esac
fi

log scheduler "start: collect every 10 min, pipeline (dedupe+score+verify+export) every 10 min offset 5 min, daily status after ${SNAPSHOT_HOUR}:00"
for job in collect pipeline daily; do job_heartbeat "$job" waiting; done
node "$APP/deploy/heartbeat.mjs" write
loop collect 30 600 570
loop pipeline 330 600 300
loop daily 60 600 120
( while :; do node "$APP/deploy/heartbeat.mjs" write; sleep 30; done ) &
wait
