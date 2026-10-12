#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
locale="${1:-en}"
input="${2:-sample-e05.json}"
case "$locale" in en|zh-Hans) ;; *) echo 'Supported locales: en, zh-Hans' >&2; exit 2;; esac
if [[ ! -x node_modules/.bin/hyperframes ]]; then
  echo 'Missing shared node_modules. Follow README.md; no install/download is performed.' >&2
  exit 2
fi
node build.mjs "$input" "$locale"
variant="$(node --input-type=module -e 'import fs from "node:fs";const e=JSON.parse(fs.readFileSync(process.argv[1]));console.log((e.production_id ? e.production_id+"-" : "")+process.argv[2])' "$input" "$locale")"
mkdir -p renders evidence
export DO_NOT_TRACK=1
# On this Mac FFmpeg needs its existing x265 library; other systems retain their environment.
if [[ -d /opt/homebrew/Cellar/x265/4.2/lib ]]; then
  export DYLD_LIBRARY_PATH="/opt/homebrew/Cellar/x265/4.2/lib${DYLD_LIBRARY_PATH:+:$DYLD_LIBRARY_PATH}"
fi
failed=0
for format in landscape portrait; do
  node_modules/.bin/hyperframes lint "build/$variant-$format" --json > "evidence/lint-$variant-$format.json" 2>&1 || { failed=1; continue; }
  node_modules/.bin/hyperframes render "build/$variant-$format" --fps 30 --quality high --workers 2 --strict --output "renders/$variant-$format.mp4" > "evidence/render-$variant-$format.log" 2>&1 || failed=1
done
if [[ "$failed" != 0 ]]; then
  echo 'Render/lint failed; see evidence logs. No master completion claimed.' >&2
  exit 1
fi
episode_id="$(node --input-type=module -e 'import fs from "node:fs";console.log(JSON.parse(fs.readFileSync(process.argv[1])).production_id ?? "")' "$input")"
node contact-sheets.mjs "$locale" ${episode_id:+--episode="$episode_id"} --video
