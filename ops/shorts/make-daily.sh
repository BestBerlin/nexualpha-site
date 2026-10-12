#!/bin/sh
set -eu
cd "$(dirname "$0")/../.."
exec node ops/shorts/daily.mjs "$@"
