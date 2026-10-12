#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
export DO_NOT_TRACK=1
for variant in E05-en E09-en E21-en E05-zh-Hans; do
  for format in landscape portrait; do
    node_modules/.bin/hyperframes lint "build/$variant-$format" --json > "evidence/lint-$variant-$format.json" 2>&1
    echo "PASS $variant-$format"
  done
done
