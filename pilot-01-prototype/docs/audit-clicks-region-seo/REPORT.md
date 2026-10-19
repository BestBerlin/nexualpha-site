# Changed files

- `server/analytics-origin.mjs`, `server/cta-click.mjs`, `server/cta-collector.mjs`: shared collector origin policy.
- `server/click-storage.mjs`, `server/go-redirect.mjs`, `server.mjs`: observable storage failures, health counters, final redirect policy.
- `scripts/generate-prerender-manifest.mjs`, `scripts/sitemap-publication-policy.mjs`, `src/data/news-feed-client.js`, `src/data/seo-injection.js`, `worker/index.js`: shared publication eligibility while preserving native metadata for readable noindex articles.
- `src/components/v3/VenueDetailPage.jsx`, `src/components/v3/venue-detail-layout.css`: source-review target and sticky-header offset.
- `package.json`, four new `tests/audit-*.test.mjs` files, and existing attribution/campaign/beacon/experiment/heatmap/partner-program tests: regression coverage and updated exact neutral-redirect contracts.
- `artifacts/audit-source-review/check.py`, `docs/audit-clicks-region-seo/`, and root `docs/audit-clicks-region-seo-go-callsites.md`: reproduction, validation and call-site inventory.

# What and why

| Item | Root cause | Change and evidence |
|---|---|---|
| F06 | Beacon had no Origin check. | Extracted the existing collector's exact-Origin rule into a shared helper, also rejecting cross-site Fetch Metadata. An absent Origin is accepted only with `Sec-Fetch-Site: same-origin`; absent/opaque/conflicting provenance is rejected before rate limiting/body parsing. Same-origin text/plain beacons work; cross-site posts return 403 and write nothing. |
| F07 | Both recorders discarded mkdir/append errors. | Shared writer emits sanitized structured `click_storage_write_failed` logs with source/code/cumulative failure count. Beacon returns 503 on failed persistence; /go still redirects. `/health/click-storage` and `/api/v1/health/click-storage` expose only configured/ready/writes/failures, no PII or filesystem paths. Recovery clears degraded readiness while preserving cumulative failures. |
| F02 | Final policy only covered special entry branches. | Every resolved route reuses publicCtaForVenue/actionGate, isNeutralCtaLocale and partnerPromotionGate before commercial counting/final redirect. URL market, trusted edge country and same-origin referring context each retain veto authority. Denied traffic receives a localized own-site venue 302 with no commercial count. Neutral locales remain information-only; Turkish/TR contexts cannot reach Bitget. No targets, invite codes, registry or partner data changed. |
| F12 | Readable editions and stale inventory could become search-publication authority. | Require PUBLISHED and explicit seo.noindex false, reconcile article sitemap locales with current eligibility, retain readable prerender editions independently, and preserve explicit noindex in summary projections. Shared helpers already feed update-news-seo and news-library, so those consumers need no duplicate policy. Tests include all four audit slugs and absent Turkish native-body fallback with ID/VI siblings. |
| F11 | Link used source-review but the template only owned sources. | Real source section now owns a unique persistent source-review id outside lazy hydration; legacy sources stays valid. Both use 6rem scroll margin. Japanese KuCoin/Gate.io/MEXC/Coinbase SSR and hydration tests confirm unique targets and no hydration errors. |

The outcome monitor can GET the health path without credentials. Counters are process-local, reset on restart, and indicate operational persistence only; they are not conversions. CF-IPCountry is trustworthy only when the deployment edge overwrites it and direct origin access is restricted. Locale, selected market and edge geography do not prove residence.

Publisher sync required (lead-owned; not performed outside this worktree):

- `scripts/generate-prerender-manifest.mjs`
- `scripts/sitemap-publication-policy.mjs`
- `src/data/news-feed-client.js`

Also merge `src/data/seo-injection.js` and `worker/index.js` so readable noindex/canonicalized editions retain native metadata and canonical resolution. The lead should sync the metadata helper if the publisher worktree imports it.

The full /go inventory below was enumerated before policy implementation. Tests/fixtures/evidence were excluded; source producers, consumers, stored article/academy content and relevant documentation were retained. Existing website buttons that directly target partners retain those exact hrefs; this final-route guard governs requests that reach /go.

# /go call-site inventory (before policy edits)

Enumerated source producers and consumers, including site buttons, campaign helpers, article/official-source rewriting, APK/backup links, partner-program decoration, Telegram alert/channel/bot feed flows and stored academy content. Comments and documentation are retained for completeness; tests/fixtures/evidence excluded.

All actual final routes use the resolved venue policy. Language/URL market/trusted edge country are independent policy inputs, never proof of real residence. Missing signals preserve existing global flows. Allowed campaign expiry hops retain policy context; denied expiry requests go directly to the neutral venue page. APK routes obey the same info-only gate.

| File | Lines | Expected behavior |
|---|---|---|
| `pilot-01-prototype/src/components/apps/AppDownloadPage.jsx` | 5, 25, 33, 39 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `pilot-01-prototype/src/components/beginner/BitgetGuidePage.jsx` | 11 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `pilot-01-prototype/src/components/campaigns/BinanceOctoberPage.jsx` | 3 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `pilot-01-prototype/src/components/campaigns/BitgetAlliancePage.jsx` | 3 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `pilot-01-prototype/src/components/campaigns/BybitStocksPage.jsx` | 3 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `pilot-01-prototype/src/components/campaigns/KrakenUsdgPage.jsx` | 3, 4 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `pilot-01-prototype/src/components/coins/CoinPages.jsx` | 5 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `pilot-01-prototype/src/components/data/FundingMatrixPage.jsx` | 69 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `pilot-01-prototype/src/components/deposit/DepositPages.jsx` | 57 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `pilot-01-prototype/src/components/glossary/GlossaryPages.jsx` | 5 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `pilot-01-prototype/src/components/radar/RadarPages.jsx` | 27, 141, 347 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `pilot-01-prototype/src/components/shared/BackupSignupLink.jsx` | 2, 7, 12 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `pilot-01-prototype/src/components/shared/SourceLink.jsx` | 5 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `pilot-01-prototype/src/components/tokenized-stocks/TokenizedStocksDetail.jsx` | 6 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `pilot-01-prototype/src/components/v3/CampaignRadar.jsx` | 17, 397 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `pilot-01-prototype/src/components/v3/CleanFooter.jsx` | 353, 363 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `pilot-01-prototype/src/components/v3/CostDecision.jsx` | 4, 168, 179 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `pilot-01-prototype/src/components/v3/ExchangeMatrix.jsx` | 11, 443 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `pilot-01-prototype/src/components/v3/FeeBenchmarkTerminal.jsx` | 19, 626 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `pilot-01-prototype/src/components/v3/FeeRebateCalculator.jsx` | 9, 158 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `pilot-01-prototype/src/components/v3/KolLandingPage.jsx` | 8, 102 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `pilot-01-prototype/src/components/v3/RegistrationCard.jsx` | 56, 827 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `pilot-01-prototype/src/components/v3/TopDecisionBox.jsx` | 40 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `pilot-01-prototype/src/components/v3/TradingBleedAnalyzer.jsx` | 11, 176 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `pilot-01-prototype/src/components/v3/VenueDetailPage.jsx` | 41, 674, 914, 1058 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `pilot-01-prototype/src/components/v3/VenueDetailResearch.jsx` | 18, 1040 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `pilot-01-prototype/src/components/v3/VenueYellowPages.jsx` | 20, 1189 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `pilot-01-prototype/src/components/v3/activity/CampaignJoin.jsx` | 2, 21 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `pilot-01-prototype/src/components/v3/news/NewsVenueOffer.jsx` | 9, 39, 45, 47 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `pilot-01-prototype/src/components/v7/home7-shared.jsx` | 36 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `pilot-01-prototype/src/data/academy.js` | 91, 92 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `pilot-01-prototype/src/data/article-inline-markdown.js` | 29 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `pilot-01-prototype/src/data/backup-signup.js` | 2, 35, 36, 39, 42 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `pilot-01-prototype/src/data/beginner.js` | 20 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `pilot-01-prototype/src/data/binance-october.js` | 6, 42, 57, 98, 104 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `pilot-01-prototype/src/data/bitget-alliance.js` | 2, 6, 41, 116, 122 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `pilot-01-prototype/src/data/bybit-stocks-signup.js` | 2, 11 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `pilot-01-prototype/src/data/campaign-autodraft.js` | 40 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `pilot-01-prototype/src/data/coins.js` | 3, 127 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `pilot-01-prototype/src/data/compare-cta.js` | 10 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `pilot-01-prototype/src/data/converter.js` | 81 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `pilot-01-prototype/src/data/deposit.js` | 6, 12, 139, 140, 151 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `pilot-01-prototype/src/data/etf-signup.js` | 2, 19 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `pilot-01-prototype/src/data/exchange-apk.js` | 1, 46 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `pilot-01-prototype/src/data/exchange-outbound.js` | 6, 85, 97, 103 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `pilot-01-prototype/src/data/factbook-registry.js` | 336, 907 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `pilot-01-prototype/src/data/flash.js` | 58 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `pilot-01-prototype/src/data/funding-matrix.js` | 91, 123, 128 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `pilot-01-prototype/src/data/glossary.js` | 4, 38 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `pilot-01-prototype/src/data/heatmap-view.js` | 4 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `pilot-01-prototype/src/data/home-hero-experiment.js` | 2, 102 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `pilot-01-prototype/src/data/kraken-usdg.js` | 2, 7, 8, 41, 51, 138, 139, 147 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `pilot-01-prototype/src/data/legal-pages.js` | 20, 58 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `pilot-01-prototype/src/data/licenses-cta.js` | 20 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `pilot-01-prototype/src/data/locale-policy.js` | 2 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `pilot-01-prototype/src/data/neutral-article.js` | 2 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `pilot-01-prototype/src/data/partner-geo-restrictions.js` | 34 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `pilot-01-prototype/src/data/partner-view.js` | 37, 40, 49, 53, 61, 67 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `pilot-01-prototype/src/data/partners-feed.js` | 28 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `pilot-01-prototype/src/data/promotions.generated.js` | 45, 95, 145, 195, 245, 295, 345, 395, 445, 495, 545, 595, 645, 695, 745, 795, 845, 895, 945, 995, 1045 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `pilot-01-prototype/src/data/promotions.js` | 22, 38 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `pilot-01-prototype/src/data/radar.js` | 6 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `pilot-01-prototype/src/data/source-bound-cta.js` | 78, 85 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `pilot-01-prototype/src/data/tokenized-stocks.js` | 6, 7, 37 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `pilot-01-prototype/src/data/topic-guides-data.js` | 465, 685, 947, 985 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `pilot-01-prototype/scripts/campaign-autodraft.mjs` | 56, 57, 121 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `pilot-01-prototype/scripts/generate-promotions.mjs` | 13 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `pilot-01-prototype/scripts/qa-regression-manifest.mjs` | 87 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `pilot-01-prototype/scripts/qa-regression.mjs` | 380, 400, 493, 501, 502, 599, 609, 633, 643, 644 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `ops/academy-v3/README.md` | 128 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `ops/academy-v3/REPORT.md` | 105 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `ops/academy-v3/episode-config.mjs` | 21, 22, 23 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `ops/academy-v3/episodes/E04.json` | 2072, 2425, 2792 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `ops/academy-v3/episodes/E05.json` | 2083, 2426, 2738 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `ops/academy-v3/episodes/E06.json` | 2554 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `ops/academy-v3/episodes/E07.json` | 2185, 2543, 2865 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `ops/academy-v3/episodes/E12.json` | 2045, 2057, 2069 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `ops/academy-v3/episodes/E13.json` | 2020, 2032, 2044 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `ops/academy-v3/episodes/E24.json` | 2424, 2436, 2448 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `ops/academy-v3/episodes/source/E04.json` | 179, 186, 246, 279 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `ops/academy-v3/episodes/source/E05.json` | 181, 188, 248, 281 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `ops/academy-v3/episodes/source/E06.json` | 223 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `ops/academy-v3/episodes/source/E07.json` | 191, 198, 258, 291 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `ops/academy-v3/from-v3.mjs` | 186 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `ops/alert-sender/alert-sender.mjs` | 11, 61, 261 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `ops/alert-sender/funnel-report.mjs` | 2 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `ops/alert-sender/poller/apply-neutral-patch.mjs` | 10 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `ops/alert-sender/site-features.mjs` | 10 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `ops/channel-feed/channel-feed.mjs` | 157, 222 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `ops/channel-feed/official-source.mjs` | 57 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `ops/growth-analytics/umami.mjs` | 52 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `ops/writer-pipeline/README.md` | 55 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `ops/writer-pipeline/social-batch.mjs` | 65 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |
| `ops/writer-pipeline/social-rules.mjs` | 30 | Unchanged reviewed target/code if allowed; venue research redirect without commercial count if neutral or geo denied. |

# Tests (exact commands and results)

All commands below run from `pilot-01-prototype` unless noted. Logs are adjacent to this report.

- `npm run build` — PASS, exit 0 after restoring the existing ignored `.openai/hosting.json` build input from the main checkout into this worktree. Includes strict budget gate. Initial attempt stopped at the missing input; the complete retry passed. No hosting/deployment change committed.
- `npm run typecheck` — PASS, exit 0 (`typecheck-final.txt`).
- `node --test tests/audit-click-storage.test.mjs tests/audit-go-policy.test.mjs tests/audit-news-publication-eligibility.test.mjs tests/audit-source-review-anchor.test.mjs` — PASS 18/18 (`focused-final.txt`).
- `node --test tests/audit-click-storage.test.mjs tests/cta-click-beacon.test.mjs tests/security-request-guards.test.mjs tests/cta-collector.test.mjs tests/server-build-imports.test.mjs` — PASS 52/52 (`click-integration.txt`). Includes real read-only directory, missing-directory creation, injected EROFS/EACCES/ENOENT/ENOSPC, recovery, response semantics, and the production health route.
- `node --test tests/audit-go-policy.test.mjs tests/go-redirect.test.mjs tests/partner-program.test.mjs tests/liq-heatmap.test.mjs tests/bitget-alliance.test.mjs tests/binance-october.test.mjs tests/exchange-apk.test.mjs tests/campaign-autodraft.test.mjs` — PASS 66/66 (`routes.txt`).
- Before implementation, `node --test tests/audit-go-policy.test.mjs` failed 3 of its original 4 cases; `node --test tests/audit-news-publication-eligibility.test.mjs` failed both original cases; `node --test tests/audit-source-review-anchor.test.mjs` failed both original cases. Coverage was subsequently expanded.
- F06/F07 original-source replay: `git show HEAD:pilot-01-prototype/server/cta-click.mjs` and `git show HEAD:pilot-01-prototype/server/go-redirect.mjs` were copied to temporary sibling modules; a copy of the regression imported those modules. `node --test --test-name-pattern='F06|F07 beacon|F07 redirect' tests/audit-original-storage.test.mjs` — expected FAIL 3/3 (`storage-original.txt`): original cross-site status 204, original failed-count beacon status 204, and original redirect never invoked observable storage. Temporary replay modules were removed.
- `node --check server.mjs`, `node --check server/go-redirect.mjs`, `node --check server/cta-click.mjs`, and `git diff --check` — PASS.
- `python3 artifacts/audit-source-review/check.py` — BLOCKED before navigation: Chromium `bootstrap_check_in ... MachPortRendezvousServer ... Permission denied (1100)` (`browser-blocker.txt`). Computer Use also reported Chrome unavailable and an empty browser-provider inventory. No real-browser screenshot or visual-offset claim is made.

- Final `npm run test:sites` — exit 1: **2,199 tests; 2,194 passed, 2 failed, 3 skipped** (`test-sites-verified.txt`). No new failing names versus unchanged HEAD. The supplied 57-name baseline is stale: neither remaining failure is in it. Both were independently reproduced in an isolated HEAD snapshot at `98cb38df` with `node --test --test-name-pattern='academy data generator reproduces checked-in generated files|the real client island keeps the same SSR sections through hydration and the first parent update' tests/academy.test.mjs tests/home-lower-hydration.test.mjs` — expected 2/2 failed (`head-baseline.txt`).
- `node --test --test-name-pattern='weaker duplicate:|Worker metadata applies generated|F12' tests/news-search-state.test.mjs tests/seo-generated-metadata-budget.test.mjs tests/audit-news-publication-eligibility.test.mjs` — PASS 6/6 after preserving native noindex metadata. Final full suite also passes these assertions.
- `node --test tests/go-attribution.test.mjs` — PASS 5/5. Updated the obsolete 403 expectation to exact own-site 302 and supplied a real feed because policy now runs after target resolution. Allowed attribution assertions remain intact.

# Open questions

- Real-browser F11 offsets/screenshots remain unverified. Chromium launch is denied, no Computer Use browser provider is available, and native Chrome access times out. Once a browser is available, run `npx vite --port 5197` and `python3 artifacts/audit-source-review/check.py` for 390/768/1440 checks, then export screenshots to `/Volumes/致态2TB/NexuAlpha/archive/live-checks/2026-10-19/audit-seo/`. No files were written outside the worktree.
- Existing HEAD failures remain outside this task: missing historical Academy `.gemini-v3/out/E01.json`, and HomeCalculator hydration aria-describedby/id mismatch (`_R_4_` vs `_R_hr_`). Refresh the supplied baseline or fix them in their owning lane; do not interpret this branch as a fully green whole-site release.
- Lead must sync the publisher files, review, merge and deploy. No push, production change, real partner signup, indexing or conversion verification was performed. Trusted-edge header enforcement and health-monitor consumption remain deployment checks.
- Git metadata limitation: the sandbox rejects this worktree's normal `index.lock`. Staging uses the ignored alternate index `pilot-01-prototype/dist/audit-index`; Git objects and the requested branch ref use the authorized shared repository. The normal worktree index cannot be refreshed here, so assess cleanliness with `GIT_INDEX_FILE="$PWD/pilot-01-prototype/dist/audit-index" git status --short` from the repository root. Restoring writable worktree Git metadata is required before normal index operations in this checkout.
