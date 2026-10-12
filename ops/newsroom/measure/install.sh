#!/bin/sh
# Installs the T9 measurement loop on the internal disk (scheduled tasks and launchd cannot rely on the external volume):
#   sh ops/newsroom/measure/install.sh
# Then the Claude scheduled task "nexualpha-newsroom-measure" (09:10 Asia/Shanghai) runs:
#   node ~/.codex/private/newsroom-measure/measure.mjs
set -eu
HERE=$(cd "$(dirname "$0")" && pwd)
REPO=$(cd "$HERE/../../.." && pwd)
DEST="$HOME/.codex/private/newsroom-measure"
mkdir -p "$DEST"
chmod 700 "$DEST"
cp "$HERE/measure.mjs" "$HERE/gsc.mjs" "$DEST/"
LIST=$(ls "$REPO"/ops/newsroom/thin-noindex-*.json | sort | tail -1)
cp "$LIST" "$DEST/thin-noindex.json"
cp "$REPO/deploy/known_hosts" "$DEST/known_hosts"
echo "installed to $DEST (thin list: $(basename "$LIST"))"
