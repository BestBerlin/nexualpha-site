#!/bin/zsh
# Interactive convenience only. launchd invokes write-batch.mjs with Node directly.
set -eu
exec /opt/homebrew/bin/node "${0:A:h}/write-batch.mjs" "$@"
