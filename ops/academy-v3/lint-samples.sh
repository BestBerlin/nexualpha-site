#!/usr/bin/env bash
# Strict HyperFrames lint for every built composition: all 24 English episodes (both formats)
# plus the E05 Simplified Chinese sample. Pass variants (e.g. E01-en) to lint a subset.
set -euo pipefail
cd "$(dirname "$0")"
export DO_NOT_TRACK=1
if [[ $# -gt 0 ]]; then variants=("$@"); else
  variants=(); for n in $(seq -w 1 24); do variants+=("E$n-en"); done; variants+=(E05-zh-Hans)
fi
for variant in "${variants[@]}"; do
  for format in landscape portrait; do
    node_modules/.bin/hyperframes lint "build/$variant-$format" --json > "evidence/lint-$variant-$format.json" 2>&1
    echo "PASS $variant-$format"
  done
done
