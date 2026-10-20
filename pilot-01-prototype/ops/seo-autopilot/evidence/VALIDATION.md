# Local validation — 2026-10-21

All commands below run from `pilot-01-prototype` unless noted. Runtime: Node v26.0.0 (repository declares Node 24).

- `node --test tests/seo-autopilot.test.mjs`: 9 passed, 0 failed.
- `node --test tests/route-seo-payload.test.mjs tests/seo-route-boundaries.test.mjs tests/striking-distance.test.mjs tests/seo-autopilot.test.mjs`: 39 passed, 0 failed, 0 skipped after the local client build.
- `npm run typecheck`: exit 0.
- `npx vite build`: exit 0; existing large-chunk warning. This is the client build, not the full production build pipeline.
- `node scripts/verify-build-budget.mjs --strict`: PASS, entry static closure 340019 gzip bytes / 350000 maximum.
- `npm run test:sites`: interrupted after an unrelated academy-generator failure; no complete suite result. Missing legacy input `/Users/bestberlin/Documents/ChatGPT/Crypto聚合/.gemini-v3/out/E01.json` (ENOENT). Interrupted while running Bitget/brand/Brazil/browser/build-data tests. Not claimed passing.
- `SEO_AUTOPILOT_DIR="$PWD/ops/seo-autopilot/evidence" SEO_AUTOPILOT_TOPICS_FILE="$PWD/ops/seo-autopilot/evidence/autopilot-topics.json" node ops/seo-autopilot/run.mjs`: exit 0, live GSC/Bing/site reads. 62 candidates; 10 recent URL inspections, all non-PASS; 8 guarded would-apply paths, 0 applied. No source JSON changes. No explicit unmatched radar hints, so no topic output created. Eight live-page fetch warnings (redirects/errors/timeouts are not followed).
- `git diff --check` from repository root: exit 0.

The JSON/Markdown daily report is a live snapshot, not proof of rank improvement or indexing. No aged production experiment exists in the empty overrides JSON; the seven/fourteen-day behavior is fixture-tested only. No deploy, push, submissions or nx-agents scheduler edits.

## Commit blocker

`git add pilot-01-prototype/ops/seo-autopilot pilot-01-prototype/src/data/seo-autopilot-overrides.json pilot-01-prototype/src/data/seo-autopilot.js pilot-01-prototype/src/data/seo-injection.js pilot-01-prototype/worker/index.js pilot-01-prototype/package.json pilot-01-prototype/tests/seo-autopilot.test.mjs` failed with exit 128:

```text
fatal: Unable to create '/Volumes/致态2TB/nexualpha-site-git/.git/worktrees/nx-wt-codex-seo-autopilot/index.lock': Operation not permitted
```

The subsequent `git commit` attempt failed with the same error. No commit created; changes remain unstaged on `codex/seo-autopilot`. Recovery requires a session with effective write access to this linked worktree's Git administrative directory. No sandbox workaround was attempted.
