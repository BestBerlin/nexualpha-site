#!/usr/bin/env bash
# Deploys ops/newsroom to BaoTa (T6). Run from the repo root on the Mac:
#   NEWSROOM_SSH=/path/to/ssh-wrapper ops/newsroom/deploy/deploy.sh [WATCHLIST_DIR]
# NEWSROOM_SSH must accept one remote shell command string (root on BaoTa).
# Steps: upload release -> switch `app` symlink -> build image -> migrate + seed + watchlist (idempotent) -> up -d.
# One-time prerequisites (db/role, env file, cron) are in nx-agents/newsroom/RUNBOOK-SERVER.md.
set -euo pipefail
export COPYFILE_DISABLE=1   # no macOS ._ metadata files in the upload
: "${NEWSROOM_SSH:?set NEWSROOM_SSH to the BaoTa ssh wrapper}"
WATCHLIST_DIR=${1:-/Volumes/致态2TB/nx-agents/newsroom/watchlist}
ROOT=/data/agent/srv/stacks/crypto-telegram-ops/newsroom
REL=$(date -u +%Y%m%dT%H%M%SZ)-$(git rev-parse --short HEAD)$(git diff --quiet HEAD -- ops/newsroom || echo -dirty)
cd "$(git rev-parse --show-toplevel)"

tar --no-xattrs -C ops/newsroom --exclude='node_modules' --exclude='.psql-test-*' -czf - . \
  | "$NEWSROOM_SSH" "set -e; mkdir -p $ROOT/releases/$REL && tar -xzf - -C $ROOT/releases/$REL"
tar --no-xattrs -C "$WATCHLIST_DIR" -czf - watchlist.json keywords.json \
  | "$NEWSROOM_SSH" "set -e; mkdir -p $ROOT/watchlist && tar -xzf - -C $ROOT/watchlist"

"$NEWSROOM_SSH" "set -euo pipefail; cd $ROOT
ln -sfn releases/$REL app
cp app/deploy/compose.yml compose.yml
mkdir -p /data/agent/state/newsroom
dc() { docker compose -p nexualpha-newsroom -f $ROOT/compose.yml \"\$@\"; }
dc build -q
run() { dc run --rm -T --no-deps --entrypoint \"\$1\" newsroom-collector \"\${@:2}\"; }
run node bin/newsroom.mjs migrate
run node bin/newsroom.mjs seed
run bash -c 'if node bin/newsroom.mjs --help | grep -q seed:watchlist; then node bin/newsroom.mjs seed:watchlist --watchlist /srv/newsroom/watchlist/watchlist.json --keywords /srv/newsroom/watchlist/keywords.json; else node deploy/watchlist-seed.mjs /srv/newsroom/watchlist | psql -X -q --no-password -v ON_ERROR_STOP=1 >/dev/null && echo watchlist: loaded by deploy/watchlist-seed.mjs; fi'
dc up -d --force-recreate newsroom-collector
ls -1dt releases/* | tail -n +6 | xargs -r rm -rf
echo deployed $REL"
