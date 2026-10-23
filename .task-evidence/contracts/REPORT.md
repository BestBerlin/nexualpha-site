# Contracts lane report

## Changed files

- pilot-01-prototype/tests/exchange-apk.test.mjs
- pilot-01-prototype/tests/home-hero-experiment.test.mjs
- pilot-01-prototype/tests/internal-http.test.mjs
- pilot-01-prototype/tests/frontend-contract.test.mjs
- pilot-01-prototype/tests/perf-core-bundle.test.mjs
- pilot-01-prototype/tests/home-layout.test.mjs (diagnostic text only)

## What and why

| Original failing title | File | Class | Change |
| --- | --- | --- | --- |
| /go/okx-apk and /go/binance-apk 302 to the official URL and count the click like other /go routes | exchange-apk.test.mjs | a | Keep exact redirects and APK context, assert classified bot evidence plus internal request exclusion; requests with no validated IP remain unknown. |
| /go/<partner> and the site beacon record experiment + variant while it runs, nothing extra when off | home-hero-experiment.test.mjs | a | Keep exact experiment tuples for visitors, assert bot has no experiment fields and internal request writes no row; remove obsolete fire-and-forget polling because collector writes are awaited. |
| site-facing QA scripts use the internal fetch | internal-http.test.mjs | a | Verify shared helper import and injected crawlLinkSurface fetch default, preserving strict initializers for other QA scripts. |
| homepage keeps decisions above the compact closing band | frontend-contract.test.mjs | a | Permit intended crawl discovery after closing band and before footer; assert owner section order partner strip -> whales -> tokenized strip -> deferred decisions. |
| SSR home keeps the scroll-deferred sections' text for crawlers and no-JS readers | perf-core-bundle.test.mjs | a | Keep SSR text, footer and retired-wall checks; assert crawl discovery placement and owner section order including lower latest-analysis section. Disable unnecessary HMR/dependency discovery in this SSR-only Vite harness. |
| current homepage browser geometry / Chinese homes remain readable at 320px with enlarged root text | home-layout.test.mjs | unresolved | Keep geometric assertion intact, add locale/clientHeight/scrollHeight/font/line-height/overflowY diagnostics. Browser execution blocked by sandbox, so neither a/b/c can be established honestly. |

No product, fee, code, CTA, or registry changes. No skips introduced.

## Tests (exact commands and results)

Working directory for commands below: /Volumes/致态2TB/nx-wt-codex-tests-green-c/pilot-01-prototype.

- `node --test --test-timeout=300000 tests/exchange-apk.test.mjs`: 9 pass, 0 fail, 0 skipped (exchange-apk.after.tap).
- `node --test --test-timeout=300000 tests/home-hero-experiment.test.mjs`: 12 pass, 0 fail, 0 skipped (home-hero-experiment.after.tap).
- `node --test --test-timeout=300000 tests/internal-http.test.mjs`: 4 pass, 0 fail, 0 skipped (internal-http.after.tap).
- `node --test --test-timeout=300000 tests/frontend-contract.test.mjs`: 165 pass, 0 fail, 0 skipped (frontend-contract.after.tap).
- `node --test --test-timeout=300000 tests/perf-core-bundle.test.mjs`: 10 pass, 0 fail, 0 skipped (perf-core-bundle.after.tap).
- `node --test --test-timeout=300000 tests/home-layout.test.mjs`: 1 pass, 0 fail, 7 existing capability skips, EPERM on 127.0.0.1 (home-layout.final.tap).
- `git diff --check -- tests/{exchange-apk,home-hero-experiment,internal-http,frontend-contract,home-layout,perf-core-bundle}.test.mjs`: exit 0.

Every original assigned file ran alone before edits (the six *.before.tap files). Initial APK and hero SSR cases encountered missing ignored offline localization cache; root restored the existing cache inputs. Original APK click failure, internal-http, frontend-contract and perf SSR stale assertions were reproduced. The original hero file was additionally reproduced unchanged from HEAD as tests/.home-hero-before.repro.mjs after offline inputs were restored: 11 pass, 1 fail (the exact crawler-row assertion, home-hero-experiment.original-offline.tap); temporary source file removed.

A bounded request-interception browser fallback was tried to eliminate loopback dependency, but Chrome itself failed to launch (Code:null, no stderr). It was reverted per root instruction; home-layout.after.tap preserves that failed diagnostic attempt and is superseded by home-layout.final.tap.

## Open questions

- Original full-run.tap lines 9980-10007 show enlarged Chinese headline scrollHeight/clientHeight failure, with no locale or numeric measurements. Current CSS has automatic heading heights, no vertical clipping on heading/hero/copy, neutral heading line-height 1.15 (home7.src.css:1081), natural heading line-height 1.28 (1204). CJK glyph overflow can make scrollHeight alone insufficient proof of clipping, but that is an unverified hypothesis. A browser-capable run must distinguish genuine clipping from measurement assumption; do not weaken assertion or change CSS without measurements.
- Lead owns build, strict budget, full suite and commit.
