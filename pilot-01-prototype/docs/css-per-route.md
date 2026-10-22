# Per-route stylesheet selection

The client build emits the Vite manifest and `style-modules.json` (original source module IDs to their emitted chunk CSS). The existing v6 postprocessor registers its full-inner and shared-home assets in that manifest. After prerendering, `build-route-styles.mjs` generates `route-styles.json` from those assets, the application's route resolver, and all 2,590 prerendered locale editions. The live tokenized-stocks template is additionally rendered in each home-supported locale, without changing SEO/prerender publication inventories.

Route-owned styles survive empty feed states. Home's deferred sections and venue research have explicit component roots separate from the hydration preload policy. Additional rendered component styles are found with the existing critical-CSS selector widening and conservative DOM matching. Entire stylesheets survive; declarations are never purged. The existing authored `page-*` template policy remains authoritative for early/mid/late layers. CSS selection does not preload deferred JavaScript.

The Worker validates the entry URL, original stylesheet inventory, selected asset paths and flattened cascade order before using the generated list. Unknown routes and missing, incomplete or stale manifests keep the existing fallback. Build-time article/venue/compare template unions cover new slugs. Home critical CSS is generated from precisely the selected list, and its existing all-at-once deferred switch and blocking fallback remain intact. Speculative modulepreload hints remain removed.

Tiny assets can merge only with a neighbour in the selected order, when neither URL is referenced by emitted JavaScript and neither contains import/charset/namespace directives. The measured build has no eligible pairs; its tiny assets retain runtime preload references. Rewriting those URLs or moving them across cascade layers was deliberately avoided.

## Measurement

`node scripts/measure-route-resources.mjs --output dist/route-resources-before.json`

`node scripts/measure-route-resources.mjs --output dist/route-resources-after.json`

These render the seven routes through the Worker using filesystem assets and the built runtime SSR renderer. CSS counts deduplicate noscript copies. JavaScript counts follow the entry and current-route hydration preload/static-import graph, including locale glossary modules. Sizes are raw bytes and independent per-file gzip level 6 estimates, not observed browser transfers. Deferred below-fold and user-triggered JS are outside this hydration graph.


## Verification and limitations

Build prerequisites in this isolated worktree were restored from the existing checkout: ignored `project.inlang/cache/plugins` and `.openai/hosting.json`. The empty generated Paraglide cache from the first failed compile was removed and `npm run i18n:compile` regenerated messages. Neither prerequisite is committed.

The original venue graph test fails because `home-below-fold` appears in the venue preload map. This was reproduced by extracting `HEAD:pilot-01-prototype/vite.config.mjs` into a temporary `vite.baseline.config.mjs`, running `npx vite build --config vite.baseline.config.mjs --outDir dist/baseline-client`, then running the built-entry test against that directory. The temporary config/test copy was removed. Browser JavaScript graphs are unchanged by this CSS lane.

The brief excludes localhost QA in this sandbox. Worker SSR link assertions replace `node scripts/qa-regression.mjs`; this does not establish measured browser CLS or absence of FOUC. Better Design principle/review calls returned the free-query quota error; spacing measurement was unavailable without rendered browser evidence. No account, service, deployment, push, or publication was performed.

## Before and after (bytes)

| Route | CSS files before → after | CSS raw before → after | CSS gzip before → after | JS files (unchanged) | JS raw / gzip (unchanged) |
|---|---:|---:|---:|---:|---:|
| `/` | 30 → 12 | 1,198,455 → 857,870 | 204,389 → 138,633 | 8 | 1,022,063 / 349,899 |
| `/zh-hans` | 30 → 12 | 1,198,455 → 857,870 | 204,389 → 138,633 | 8 | 1,022,063 / 349,899 |
| `/exchanges/bitget` | 20 → 19 | 860,531 → 826,326 | 136,496 → 130,248 | 51 | 3,615,808 / 1,221,588 |
| `/news/api-failover-cancel-control-disclosure-radar` | 8 → 8 | 680,284 → 713,827 | 102,926 → 110,035 | 49 | 3,578,962 / 1,183,567 |
| `/compare/binance-vs-okx` | 14 → 10 | 754,719 → 704,329 | 117,376 → 106,817 | 61 | 5,268,460 / 1,740,901 |
| `/tokenized-stocks` | 6 → 4 | 601,654 → 598,982 | 91,180 → 90,128 | 13 | 1,230,415 / 418,164 |
| `/funding-rates` | 9 → 7 | 668,664 → 675,396 | 103,609 → 104,260 | 34 | 2,518,687 / 847,033 |

Every measured route has zero modulepreload hints before and after. Home inline critical CSS stays 91,045 bytes. Five non-home SSR body hashes are unchanged; home bodies contain runtime data and their historical hashes differ. News and funding gain CSS for rendered components that the old prefix lists omitted (including `.top-decision-box` and `.nxd`). These correctness additions explain their small byte increases. No CSS declarations or JavaScript graphs changed.

## Final commands and results

Commands run from `pilot-01-prototype/`:

- `npm run build` — PASS after restoring ignored worktree prerequisites.
- `node scripts/build-route-styles.mjs && node scripts/build-critical-css.mjs && node scripts/prepare-sites-build.mjs && node scripts/verify-build-budget.mjs --strict` — PASS for the final 559-route stylesheet inventory, including the runtime stock template; home entry 349,899 / 350,000 bytes gzip.
- `node scripts/measure-route-resources.mjs --output dist/route-resources-before.json` and `node scripts/measure-route-resources.mjs --output dist/route-resources-after.json` — PASS, seven routes each.
- `node --test tests/route-styles.test.mjs tests/critical-css.test.mjs tests/home-lcp-css.test.mjs` — 20 PASS, 0 failures, 0 skipped.
- `node --test --test-name-pattern='stylesheets are re-linked|client builds drop' tests/perf-core-bundle.test.mjs` — 2 PASS.
- `npm run typecheck` — PASS.
- `node --test tests/venue-graph.test.mjs` — 5 PASS, 1 inherited preload-graph failure; original-config reproduction fails identically.
- `node scripts/qa-regression.mjs` — not run, per the brief's sandbox/localhost restriction.

The requested local commit is blocked at `git add`: Git cannot create `/Volumes/致态2TB/nexualpha-site-git/.git/worktrees/nx-wt-codex-css-per-route/index.lock` (`Operation not permitted`, exit 128). No commit or push was created. Per `_common.md`, the scoped working-tree changes are left for the lead to extract. Generated data was restored by reading original blobs from `HEAD`, without changing the protected index.
