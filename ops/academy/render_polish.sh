#!/bin/bash
# Silent visual diagnostics; the lead renders narration into a separate directory.
set -euo pipefail
cd "$(dirname "$0")/../.."
episodes=(ops/academy/episodes/[0-9][0-9]-*.json)
if [ "${#episodes[@]}" -ne 12 ]; then
  echo "Expected exactly 12 season-1 episodes" >&2
  exit 1
fi
for episode in "${episodes[@]}"; do
  python3 ops/academy/engine.py "$episode" \
    --out "ops/academy/samples/season1-polish/$(basename "$episode" .json)" \
    --diagnostic-silent --diagnostic-frame-rate 1
done
python3 ops/academy/verify_season.py --out ops/academy/samples/season1-polish
