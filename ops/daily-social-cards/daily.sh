#!/bin/sh
# UTC cron: 0 1 * * * /path/to/repo/ops/daily-social-cards/daily.sh
# Equivalent to 09:00 Asia/Singapore; dry-run unless --post is explicitly passed.
set -eu
task_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
exec "${NODE_BIN:-node}" "$task_dir/generate.mjs" "$@"
