#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
node from-v3.mjs
for episode in E05 E09 E21; do
  node build.mjs "episodes/$episode.json" en
  node contact-sheets.mjs en "--episode=$episode"
done
node build.mjs episodes/E05.json zh-Hans
node contact-sheets.mjs zh-Hans --episode=E05
if [[ "${1:-}" == --render ]]; then
  for episode in E05 E09 E21; do bash render.sh en "episodes/$episode.json"; done
  bash render.sh zh-Hans episodes/E05.json
fi
