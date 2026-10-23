# Market feed diet evidence

Baseline: `b381f232` on `codex/market-feed-diet`. Measurements were taken on the baseline build, then on the changed build, using the same checked-in feed and installed dependencies.

## Method and limits

Feed: `tests/fixtures/market-data/market-events.live-v2-2026-10-13.json`; generated `2026-10-13T15:56:40.750Z`; SHA-256 `900df37f0b56854debfe16fe6a675b78d59a0b2311240fb1830a0fb582b7daee`.

The measured historical feed is **28,245 raw / 6,221 gzip bytes**. The reported 2.4 MB production feed is absent from this checkout. These are offline response-body measurements from the built Worker and bundled SSR renderer, with 700 ms of jsdom hydration to observe initial JSON requests. Gzip sizes use `gzipSync`; headers, TLS, caches, JS, CSS and images are excluded. They are not live network-transfer or production performance claims.

## Before and after

The article slug is `coinbase-wallet-supported-network-transition-checklist` in both English and Simplified Chinese.

| Route | Before raw | After raw | Before gzip | After gzip | Initial market requests, before / after |
| --- | ---: | ---: | ---: | ---: | ---: |
| `/news/coinbase-wallet-supported-network-transition-checklist` | 150,629 | 124,490 | 31,474 | 25,851 | 1 / 0 |
| `/zh-hans/news/coinbase-wallet-supported-network-transition-checklist` | 173,101 | 146,970 | 37,508 | 31,853 | 1 / 0 |
| `/exchanges/okx` | 226,435 | 226,435 | 43,420 | 43,419 | 0 / 0 |
| `/compare/binance-vs-okx` | 219,787 | 219,787 | 37,180 | 37,180 | 0 / 0 |
| `/coins/bitcoin` | 87,280 | 87,280 | 17,470 | 17,470 | 0 / 0 |

The table adds HTML and initial market JSON bodies. Both articles previously fetched the full feed. They now include their small market snapshot in SSR and issue no initial market request. All five measured pages hydrate without errors. Venue, comparison and coin routes already used separate data feeds and needed no consumer change; tokenized pages use their tokenized-stock endpoints. `/coins/bitcoin` is the existing Bitcoin route.

| JSON response | Raw bytes | Gzip bytes |
| --- | ---: | ---: |
| `/api/market-events/asset?symbol=BTC` | 208 | 184 |
| `/api/market-events/asset?symbols=BTC,ETH` | 354 | 234 |
| Existing summary | 12,880 | 3,159 |

## Full data-page review

The three full-feed consumers remain unchanged. The fixture gives byte-identical initial rendered HTML with the existing summary and with the candidate trims below. This fixture does not exercise the current production feed's full seven-day/per-symbol timeline detail; the initial-render comparison does not prove interactive detail equivalence.

| Page | Candidate retained fields | Raw bytes | Gzip bytes | Initial HTML identical |
| --- | --- | ---: | ---: | --- |
| `/liquidations` | generatedAt + liquidations + history | 22,545 | 4,682 | true |
| `/liquidations/heatmap` | generatedAt + liquidations + history | 22,545 | 4,682 | true |
| `/funding-rates` | generatedAt + funding | 3,244 | 622 | true |

Funding-only trimming is a viable follow-up from this fixture. Liquidation charts still need deferred full detail for interactions. No full-feed polling behavior was changed without broader detail-state evidence.

## Implementation and checks

- `/api/market-events/asset`: single `symbol` or up to five comma-separated `symbols`; malformed requests are 400, unknown/mixed-unknown symbols 404, cold outage 503. Successful responses have `public, max-age=30` and only rail fields, `generatedAt`, `stale`.
- Node routes and article SSR share `marketEventsReader`; assets-only Worker hosts have a bounded 60-second last-good cache. Bounded SSR reads retain a warm cached frame as stale while a slow refresh continues. Cold SSR waiting is capped at 200 ms. Articles without relevant assets skip the read.
- Relevant articles use request-time SSR even with a current build-time prerender; SSR state and hydration use the same rows. A regression test first reproduced the matching-prerender bypass and now passes. A cold outage renders no invented figures; later recovery can reveal the previously unavailable rail.
- Article polling uses the existing visibility-aware, abortable polling scheduler. A mixed-symbol 404 retries individual symbols so partial coverage continues updating available rows.
- No new home static chunk: home gzip closure **316,871 -> 316,854 bytes**; both strict budgets PASS. Detailed manifests are in `budget-before.json` and `budget-after.json`.
- Generated public content, partner feeds and sitemaps were restored after measurement; partner facts and CTA logic were not edited.

Commands below were run from `pilot-01-prototype` using Node 24.19.0 (`PATH=/opt/homebrew/opt/node@24/bin:$PATH`).

```sh
npm run build
node scripts/verify-build-budget.mjs --strict
node scripts/measure-market-feed-diet.mjs before
node scripts/measure-market-feed-diet.mjs after
npm run typecheck
node --test tests/market-events-assets.test.mjs tests/market-events-assets-ssr.test.mjs tests/editorial-templates.test.mjs tests/client-json-polling.test.mjs tests/client-json-polling-deadline.test.mjs tests/runtime-article-edition.test.mjs
node --test tests/venue-graph.test.mjs tests/server-build-imports.test.mjs tests/data-pages.test.mjs tests/audit-performance.test.mjs
node --check src/data/market-events-assets.js
node --check src/components/v3/news/article-market-context-fetch.js
node --check worker/index.js
node --check server/market-events-feed.mjs
node --check scripts/measure-market-feed-diet.mjs
git diff --check
```

Results: baseline and final builds exit 0; strict budgets PASS; both measurement runs exit 0; typecheck exits 0; targeted tests **33 passed, 0 failed, 0 skipped**; built regression tests **23 passed, 0 failed, 0 skipped**; syntax and whitespace checks pass. Commands were limited to related suites; no full `npm test` was run.

The clean worktree initially lacked the Inlang CDN plugin cache and `.openai/hosting.json`. The first build failed with unavailable CDN plugins / `m[key] is not a function`; the next reached packaging and reported the missing hosting manifest. Build setup was repaired locally by copying the official plugin cache from the shared dependency checkout (`cp -R node_modules/../project.inlang/cache/plugins project.inlang/cache/`) and writing the same empty ignored hosting manifest used in `.github/workflows/build.yml`. No shared dependency or other checkout was changed.

## Remaining verification

- Real-browser layout/CLS at 390/768/1440 remains for the lead: this sandbox rejects loopback listening with `EPERM on 127.0.0.1`. Byte-identical SSR replay and hydration tests establish initial markup consistency, not a measured browser CLS score.
- Re-run the offline measurement with the current production-sized feed when a captured copy is available; no production-size savings are inferred from this historical fixture.
- Better Design `get_ux_principle` and `get_review_rules` returned quota-exhausted errors. No paid account or external preview was created. No deployment or push was performed.

## Commit handoff blocker

The requested local commit could not be created. `git add -- <task files>` failed before commit execution:

```text
fatal: Unable to create '/Volumes/致态2TB/nexualpha-site-git/.git/worktrees/nx-wt-codex-market-feed-diet/index.lock': Operation not permitted
```

The branch remains `codex/market-feed-diet`, HEAD `b381f232`. Generated public files were restored directly from `git show HEAD:<path>` after `git restore` encountered the same metadata lock restriction. A complete patch, including new files and evidence, is at `.task-evidence/market-feed-diet.patch`; its reverse applicability is checked against the final working tree. The intended Lore commit message is `commit-message.txt`. Recovery: stage and commit these changes from a process permitted to write this worktree's Git index. No permission or sandbox settings were changed.
