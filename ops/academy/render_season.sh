#!/bin/bash
# Lead's narrated season render. Never reuse silent diagnostic output directories.
set -euo pipefail
cd "$(dirname "$0")/../.."
export DYLD_LIBRARY_PATH="/opt/homebrew/Cellar/x265/4.2/lib${DYLD_LIBRARY_PATH:+:$DYLD_LIBRARY_PATH}"
out="${1:-ops/academy/samples/season1-narrated}"
episodes=(ops/academy/episodes/[0-9][0-9]-*.json)
if [ "${#episodes[@]}" -ne 12 ]; then
  echo "Expected exactly 12 season-1 episodes" >&2
  exit 1
fi
for episode in "${episodes[@]}"; do
  name="$(basename "$episode" .json)"
  python3 ops/academy/engine.py "$episode" --out "$out/$name" --locale zh-Hans
done
