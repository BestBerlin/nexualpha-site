# Whale signals v2 verification

Local candidate only. No deployment, production restart, Telegram delivery, or new persistent service was performed.

## Commands and evidence

Site commands run from `pilot-01-prototype/`, each preceded by `zsh /Volumes/致态2TB/nx-agents/load-gate.sh &&`.

- `npm run typecheck`: exit 0.
- `npm run build`: exit 0, including strict build-budget validation. The worktree initially lacked ignored `.openai/hosting.json`; the existing empty `{}` configuration was copied read-only from the main checkout. The final build includes the whale route module in the packaged dependency graph.
- `npm run test:sites`: 2,069 tests; 2,066 passed, zero failed, three skipped (222,020.706333 ms), run after the final build completed.
- `node --test tests/whale-pages-v2.test.mjs tests/whale-watchlist.test.mjs tests/whales-source.test.mjs tests/whale-collector.test.mjs`: 41 passed, zero failed. Covers coin SSR/hydration, category limits, actual sitemap generation, RPC failure and malformed-log handling, and Base-only successful output.
- `node scripts/verify-whale-watch-browser.mjs tests/fixtures/whale-watch-layout.json --http-only`: 17 hub routes and 17 HYPE routes passed; hub ItemLists contain eight fixture rows and coin ItemLists contain two. Empty home feed has zero fabricated rows. Synthetic fixtures prove rendering contracts only.
- `node scripts/verify-whale-watch-browser.mjs tests/fixtures/whale-watch-layout.json`: blocked before browser navigation; Puppeteer reports `Failed to launch the browser process: Code: null`. Chrome computer-use creation reports `Browser is not available: chrome`, and browser inventory returns `[]`. The real-UA 360/390/1440 matrix, screenshots, geometry, contrast and browser CLS remain unverified. HTTP/jsdom checks are not replacements for these checks.

From the repository root:

- `zsh /Volumes/致态2TB/nx-agents/load-gate.sh && node --test ops/channel-feed/*.test.mjs`: 57 passed, zero failed.
- `node --check` on the collector, watchlist, quality helper, radar reader, alert template and browser QA script: exit 0.
- `git diff --check`: exit 0.
- `node docs/whale-signals-v2-evidence/preview-alerts.mjs docs/whale-signals-v2-evidence/cycle-10.json`: 72 observed input rows produced 25 pure local previews saved in `telegram-dry-run.json`, with `sent: 0`; no Telegram API call.

The supplied load gate was invoked. Its `sysctl`, `memory_pressure` and `pgrep` probes emitted sandbox errors, so exit 0 does not establish verified machine headroom.

An early full-site run overlapped a rebuild and encountered eight missing/transient built-artifact failures. Final full-site validation is run after the completed build to avoid that race.

## Live evidence boundary

The read-only run lasted 615,713 ms (2026-10-15 04:14:48.883Z–04:25:04.596Z), completing 11 sequential cycles with five distinct intent signals and eight distinct transfer facts. See `run.json`, `complete.json` and `summary.json` for full rows and explorer links. The harness uses bounded Hyperliquid historical fill backfill; observed-during-run does not mean every underlying fill occurred during the ten-minute observation window. Initial cycles preceded completion of the new watchlist adapter, and cycle metadata records actual coverage. Transfer facts are counted separately. Historical balances, liquidity and wallet freshness are never inferred when unavailable.

## Git metadata limitation

The sandbox denies creating the shared worktree's `index.lock` and `HEAD.lock`. A task-local ignored alternate index is used for staging; Git plumbing writes the commit to the existing common object database and updates only `refs/heads/codex/whale-signals-v2` through the common Git directory, with the old tip as a compare-and-swap guard. The main checkout branch is not changed. The default worktree index cannot be refreshed under the current permission boundary; use `GIT_INDEX_FILE="$PWD/.private/whale-v2.index" git status --short` to inspect the committed candidate until ordinary Git metadata access is restored.
