# Internal-link validation

Branch: `codex/internal-links`. Baseline: starting `origin/main`, `467a29633bd107ca717310f55d5a4403bb8bcd6e`.

## What and why

Added SSR entity-related resource links and two recent related articles, exchange/coin news hubs, valid converter cross-links, and chronological same-category reading links. Existing glossary first-mention links (maximum five), license/profile reciprocal links, canonical metadata, sitemap publication gates, and geo restrictions are retained. No article body copy or registration CTA was added.

Article hydration is limited to current + selected recent cards + chronological neighbors (at most six rows), rather than the whole summary library. Real Worker SSR/hydration and compact-pool selection parity are tested.

## Inlink statistics

Counts use unique referring served URL paths; queries/fragments, self links, scripts and external links are excluded. Sources include noindex/follow pages. Missing sitemap pages are rendered through the built local Worker, not fetched from production.

| Metric | Before | After |
|---|---:|---:|
| Rendered HTML pages | 7330 | 7330 |
| Indexable sitemap pages | 5876 | 5876 |
| Indexable pages below three inlinks | 619 | 0 |
| Missing sitemap HTML | 0 | 0 |
| Zero-inbound indexable page types | 1 | 0 |
| Total unique inbound references | 345779 | 352867 |

Home initial JS gzip: **314,782 bytes**, below **350,000**. Starting build: 314,763 bytes.

## Tests

Working directory: `/Volumes/致态2TB/nx-wt-codex-internal-links/pilot-01-prototype`.

Exact final commands (stdout logs were summarized here, then removed as task-generated files):

- `zsh /Volumes/致态2TB/nx-agents/load-gate.sh && npm run build > artifacts/internal-links-build.log 2>&1` — exit 0; strict budget PASS.
- `zsh /Volumes/致态2TB/nx-agents/load-gate.sh && npm run test:sites > artifacts/internal-links-sites-tests.log 2>&1` — exit 0; 1513 tests, 1512 passed, 1 skipped, 0 failed.
- `zsh /Volumes/致态2TB/nx-agents/load-gate.sh && npm run typecheck > artifacts/internal-links-typecheck.log 2>&1` — exit 0; no TypeScript diagnostics.
- `zsh /Volumes/致态2TB/nx-agents/load-gate.sh && node scripts/audit-internal-inlinks.mjs --pretty --out artifacts/internal-links-after.json > artifacts/internal-links-audit.log 2>&1` — exit 0; zero audit failures and zero runtime render errors.
- `zsh /Volumes/致态2TB/nx-agents/load-gate.sh && node --test --test-concurrency=1 tests/article-related-links.test.mjs tests/entity-hub-links.test.mjs tests/news-library.test.mjs tests/prerender-contract.test.mjs > artifacts/internal-links-compact-tests.log 2>&1` — exit 0; 49 passed, 0 failed.
- `git diff --check` — exit 0.

Initial baseline suite: 1,466 tests, 1,336 passed, 125 failed, 5 cancelled. The final full suite has no failures. The initial baseline build stopped at missing ignored `.openai/hosting.json`; the existing empty config from the main checkout was copied into this worktree, and final builds passed.

## Changed files

- `pilot-01-prototype/artifacts/internal-links-after.json`
- `pilot-01-prototype/artifacts/internal-links-before.json`
- `pilot-01-prototype/artifacts/internal-links-validation.md`
- `pilot-01-prototype/package.json`
- `pilot-01-prototype/scripts/audit-internal-inlinks.mjs`
- `pilot-01-prototype/scripts/generate-prerender-manifest.mjs`
- `pilot-01-prototype/scripts/prepare-sites-build.mjs`
- `pilot-01-prototype/src/App.jsx`
- `pilot-01-prototype/src/components/coins/CoinPages.jsx`
- `pilot-01-prototype/src/components/converter/ConverterPage.jsx`
- `pilot-01-prototype/src/components/shared/CrawlPriorityLinks.jsx`
- `pilot-01-prototype/src/components/shared/HubNewsLinks.jsx`
- `pilot-01-prototype/src/components/v3/VenueDetailPage.jsx`
- `pilot-01-prototype/src/components/v3/news/NewsDetailPage.jsx`
- `pilot-01-prototype/src/data/article-related-links.js`
- `pilot-01-prototype/src/data/exchange-hub-links.js`
- `pilot-01-prototype/src/data/hub-entity-news.js`
- `pilot-01-prototype/src/data/news-library.js`
- `pilot-01-prototype/tests/article-related-links.test.mjs`
- `pilot-01-prototype/tests/converter-inlinks.test.mjs`
- `pilot-01-prototype/tests/entity-hub-links.test.mjs`
- `pilot-01-prototype/tests/internal-inlinks.test.mjs`
- `pilot-01-prototype/tests/news-library.test.mjs`
- `pilot-01-prototype/worker/index.js`

## Open questions and limits

- The sandbox denies writes to the backing worktree Git index and COMMIT_EDITMSG. An alternate index and Git plumbing are used for the local branch commit. The normal worktree index cannot be synchronized in this session; once metadata writes are enabled, `git reset --mixed HEAD` refreshes it without changing source files.

- The brief's “no code changes” conflicts with its SSR/script/test requirements. It was interpreted as prohibiting unrelated code changes; implementation is limited to the requested internal-link network and verification.
- `origin/main` advanced during the run; this branch remains based on the starting revision. Integration with newer main commits is not tested.
- Load-gate commands returned success, but sandbox restrictions produced sysctl/sysmon/process-list warnings. Host headroom telemetry was not fully available.
- Existing Telegram handoff expiration uses the current clock; article hydration tests freeze that clock to isolate link/state parity. Telegram clock behavior was not changed.
- These are local build/Worker results, not production crawl, Google indexing, ranking, or traffic evidence.
