# Deep site audit — 2026-10-14

Scope: `codex/deep-audit-site`, isolated worktree `/Volumes/致态2TB/nx-wt-codex-deep-audit-site`, based on `582428a2`. Seven parallel audit lanes plus independent integration review. Local changes only; no deployment, push, indexing submission, account creation, or production data mutation. Partner registry code values are unchanged. Source reports are `audit-area-1.md` through `audit-area-7.md`; this integrated report supersedes their earlier build/test limitations.

## Findings

Cleanup plan for pre-existing home-copy build warnings: verify the effective Urdu/Ukrainian CTA strings first, delete only shadowed duplicate declarations, then rerun the contract and strict build. Keep the rendered strings and review gates unchanged.

`y` means the demonstrated defect was repaired and regression coverage added. It does not establish production rollout or close an unmeasured operational claim. Paths below are relative to `pilot-01-prototype/` unless stated otherwise.

| ID | Severity | File:line | Finding and repair | Fixed? |
| --- | --- | --- | --- | --- |
| R1 | P1 | `src/data/locale-routing.js:47` | Country roots `/id`, `/jp`, `/kr` were swallowed by retired language aliases. Preserve the country roots; deeper retired language paths still redirect to `/id-id`, `/ja`, `/ko`. | y |
| R2 | P1 | `worker/index.js:9426` | Attribution query HTML could enter shared caches. `src` and partner `p` now make direct and redirected HTML private/no-store. | y |
| R3 | P1 | `server/ssr-page-cache.mjs:20` | Sorting duplicate query values merged distinct first-value locale requests. Sort keys only, preserve same-key value order, and isolate origins. | y |
| R4 | P1 | `server/ssr-page-cache.mjs:77` | Private/no-store/no-cache/Set-Cookie/Vary responses could be shared. Reject them; partner-personalized requests bypass cache. Cookie-less public visitors retain cache hits. | y |
| R5 | P1 | `worker/index.js:4781`; `src/components/flash/FlashPages.jsx:120` | Complete Flash feed outage could throw or become an indexable empty 200. Serve route-correct unavailable SSR with 503, no-store, Retry-After 300, noindex, no fabricated freshness and no immediate failed refetch. Last-good feed behavior remains covered. | y |
| R6 | P1 | `src/data/home-hero-experiment.js` | HeadlessChrome changed the rendered hero variant for identical cookies/experiment context. Normalize HeadlessChrome to Chrome for rendering assignments while retaining crawler/analytics filtering. Assert complete built HTML equality for both variants. | y |
| H1 | P1 | `src/components/data/useMarketEvents.js:28` | Funding clocks continued ticking in hidden tabs. Stop the timer while hidden, resume with a current tick, and respect reduced motion. | y |
| H2 | P1 | `src/components/data/FundingMatrixPage.jsx`; `LiquidationHeatmapPage.jsx`; `useMarketEvents.js`; `src/components/intel-tools/shared.jsx`; `src/components/v3/activity/LiveCampaigns.jsx`; `src/components/v7/home7-funding.jsx` | Multiple local interval implementations lacked consistent hidden-tab/no-overlap behavior. Reuse the existing polling controller, preserving SSR seeds and last-good state. | y |
| H3 | P1 | `src/data/exchange-key-facts-source.js:23` | Distinct OKX AUSTRAC records shared React keys. Include actual record identifiers in generated fact IDs; assert uniqueness without changing facts. | y |
| H4 | P1 | `src/components/v3/OnsiteTelegramBotHandoff.jsx:74` | Server/client expiry clocks caused attribute mismatches. Omit transient return href until mount, then generate a fresh seven-day TTL. Keep hooks unconditional across eligible/ineligible transitions. | y |
| H5 | P1 | `src/components/shell/LanguageMenu.jsx:28` | Missing selected-locale options produced uppercase SSR captions and native client captions. Use the locale manifest for the active caption; retain the authoritative option links. | y |
| H6 | P1 | `src/data/licenses.js:42`; `src/components/licenses/LicensePages.jsx` | Node and Chrome used different Hong Kong display names in Arabic/Urdu, causing actual React #418. Use deterministic native labels; preserve jurisdiction identity. | y |
| H7 | P1 | `src/entry-server.jsx:32`; `src/App.jsx:540` | Regional prerenders computed header alternates without the actual route context, yielding an empty SSR language list and client-added options. Reuse the existing application router for SSR SEO computation; test against Worker head/state alternates. | y |
| H8 | P1 | Telegram research cards and `RegistrationCard.jsx` | Other Telegram cards also generated expiry parameters independently during SSR/client rendering. Use shared post-mount return clocks; omit transient attrs on SSR/first render, then retain fresh seven-day TTL. Future-date regressions cover hub, registration, rates, regional and Brazil shapes. | y |
| H9 | P1 | `src/components/v3/TokenizedAssetsPage.jsx:93` | Distinct stock/perpetual decision rows shared their destination URL as React key. Include the stable English decision label in the key; retain both research choices and assert clean hydration in English/Chinese. | y |
| H10 | P1 | `src/components/v3/TelegramReturnBanner.jsx` | Anonymous resume URLs appended a second hash after a public context fragment. Build one fragment target with the safe context; assert preserved resume routing and no renewal of invalid/expired Telegram fields. | y |
| C1 | P1 | `src/data/venue-database.js:327` | Gate's venue target disagreed with the protected registry and `/go` target. Align official host/registration URL to the existing registry; preserve invite code and historical mirror aliases. Domain disagreement was verified; a failed real signup was not observed. | y |
| C2 | P1 | `src/components/v3/exchange-matrix-copy.js:4` | Chinese exchange directories visibly repeated `尚未核验` placeholders. Replace them with native instructions to consult official fees. Unknown numeric values remain null and unknown state remains explicit in data. | y |
| C3 | P1 | `src/components/v3/VenueDetailResearch.jsx:1031`; `VenueDetailPage.jsx:860` | Built source panels contained 425 N/A savings values and 20 Chinese missing-date placeholders. Render a savings figure only when its estimate is supported; render a review-date badge only with a recorded date. Keep the existing unknown-condition explanation, official-source instructions and null data. Expanded 17-locale SSR regression covers these branches. | y |
| C4 | P1 | `src/components/v3/TelegramAlertsHero.jsx`; `tests/visual-conversion.test.mjs` | Bot hero rendered an invented $1.28M liquidation record attributed to public venues. Replace the placeholder preview with existing supported commands and native instructions; preserve four topics, bot/channel links and SGT schedules. Assert absence of invented record values across all17 locales. | y |
| L1 | P1 | `src/components/apps/AppDownloadPage.jsx:23` | Source check dates ignored page locale. Use shared locale formatting while retaining machine-readable dateTime; verify all 17 locales. | y |
| L2 | P1 | `src/components/v3/ExchangeKeyFacts.jsx`; `src/data/exchange-key-facts-copy.js` | Three key-fact labels leaked English on localized pages. Add explicit native labels for reserves, KYC and deposits in all 17 locales. Facts and source records are unchanged. | y |
| L5 | P1 | `src/styles/v7/home7.src.css`; generated `home7.css` | Traditional Chinese neutral home title forced a twelve-character phrase beyond its column (612px text vs 540px column at1440). Restore column-aware responsive sizing for both zh-Hant and runtime zh-TW tags while preserving the phrase; verify actual Chrome geometry at mobile/tablet/desktop widths. | y |
| L3 | P2 | `tests/i18n-tooling.test.mjs:48` | Selector tests pinned an obsolete implementation and rejected the actual hreflang selector. Assert supported locale/catalog alignment and the current authoritative selector path. | y |
| L4 | P2 | `src/components/v7/home7-copy.js:54` | Duplicate Urdu/Ukrainian CTA properties produced build warnings and shadowed earlier labels. Verify effective values before and after, then delete only the overwritten declarations. | y |
| S1 | P1 | `src/data/referral-native.js:43`; `src/components/v3/VenueDetailPage.jsx:582` | Native referral headings exceeded budgets or mixed dates with codes; fallback H1s still appended a runtime year. Keep native titles short and use existing SEO titles for fallback headings. Benefits/dates remain in their evidence context; code values are preserved. | y |
| S2 | P2 | `scripts/audit-seo-index.mjs` | Audit omitted metadata budgets, page-type schema checks and llms consistency; script JSON was incorrectly HTML-decoded. Parse raw JSON-LD, validate page types/context and existing locale budgets, guard invite-code/year titles, and resolve llms pages/assets. | y |
| S3 | P2 | `scripts/audit-seo-index.mjs` | Canonical aliases generated false duplicate-title findings. Audit duplicates among indexable self-canonical owners; continue per-page checks for aliases and reject true owner duplicates. | y |
| B1 | P1 | `.openai/hosting.json:1`; repository `.gitignore:6` | Fresh worktree strict build failed because required hosting configuration was ignored/untracked. Track safe packaging configuration with no secrets. | y |
| B2 | P1 | `tests/r128-home-benefit-dedup.test.mjs`; `r156-home-workbench.test.mjs`; `r158-home-hierarchy.test.mjs`; `r163-home-task-copy.test.mjs` | Tests depended on absent historical peer worktrees. Replace obsolete byte-equality checks with current hermetic rendered semantic checks for locale, code, eligibility, /go, ordering, and disclosure. No tests deleted or newly skipped. | y |
| B3 | P2 | `tests/quality-sweep-v4.test.mjs`; `tests/r76-pix-recipient.test.mjs`; routing/heading/frontend contracts | Exact source/blob assertions described obsolete implementations. Pin the equivalent or stronger current behavior; update the venue blob hash only for the authorized Gate URL repair. All other protected blobs remain locked. | y |
| B4 | P2 | `package.json` | New runtime, collector, hydration, hermetic and i18n regressions were outside the active gate. Include them in test:sites; keep concurrency at four. No dependency changes. | y |
| B5 | P1 | `vite.config.mjs:219` | During integration, shared return-clock/data-clock hooks were absorbed by route chunks, pulling calculators, deferred home and topic data into venue preloads. Give the CSS-free shared modules their own chunks; keep the existing strict venue graph exclusion test unchanged. | y |
| T1 | P1 | `server/ssr-page-cache.mjs:33` | Cache retention had no byte bound and simultaneous crawlers repeated SSR work. Bound entries/retained bytes, prune expiration, and coalesce only proven-public renders; failures/private responses are never shared. | y |
| T2 | P1 | `server/cta-collector.mjs:66` | Runtime idempotency/assignment sets grew indefinitely; startup loaded/split the full historical JSONL log. Stream recovery and prune the existing 30-day window during runtime. Retain restart, concurrency, partial-tail and variant-conflict behavior. | y |
| T3 | P1 | `server.mjs:312` | Slow/disconnected HTTP clients could eagerly drain Web responses. Use Node pipeline backpressure and upstream cancellation; test a paused socket against a high-volume producer. | y |
| T4 | P2 | `server.mjs:323` | Server shutdown retained interval-backed feed readers/cache buffers. Stop intel/funding/FX readers and clear cache on close. | y |
| O1 | P1 | Runtime operational claim | The reported 743→966 MB/90-minute production growth is not reproduced or fully attributed here. Concrete retention/streaming defects are fixed; short built-server heap/RSS measurements do not prove the long production symptom resolved. | n |
| O2 | P2 | Browser idle-work criterion | Exact ScriptDuration <50 ms/5 s remains unmeasured because browser approval rejected raw CDP Performance.enable. Timer/visibility/no-overlap regressions are verified independently. | n |
| O3 | P2 | `deploy-local.sh` | Requested script is absent from this checkout. Available Python staging/cutover/rollback helpers have tests; the absent script's CTA/lock behavior cannot be audited. | n |
| O4 | P2 | Native editorial review | Some source/research notes retain original English; Urdu/Ukrainian copy has existing native-review gates. Catalog/UI tests do not establish native editorial review or permission to index those editions. | n |
| O5 | P2 | External load gate and linked-worktree Git index | Gate runs but sandbox denies sysctl/sysmon/pgrep telemetry. Default linked index.lock is denied; task-local Git index is used for authorized local commits. Neither limitation changes source tests. | n |

## Verification

All application commands below run from `pilot-01-prototype`. The required final pipeline is:

```sh
zsh /Volumes/致态2TB/nx-agents/load-gate.sh &&
npm run i18n:compile > ../audit-final-compile.log 2>&1 &&
npm run build -- --strict > ../audit-final-build.log 2>&1 &&
npm run typecheck > ../audit-final-typecheck.log 2>&1 &&
npm run test:sites > ../audit-final-test-sites.log 2>&1
```

Final result: exit0. i18n:compile passed; strict build and every budget passed; typecheck passed; test:sites 2,018 tests, 2,015 passed, 0 failed, 3 unchanged optional skips (231,824ms). Earlier interrupted or stale-build sweeps are diagnostic evidence only. Local raw logs/JSONL are ignored under `.audit/` and `audit-*.log`; this report preserves curated results.

Additional exact commands:

```sh
zsh /Volumes/致态2TB/nx-agents/load-gate.sh && node scripts/deep-audit-hydration.mjs > ../audit-final-hydration.log 2>&1
zsh /Volumes/致态2TB/nx-agents/load-gate.sh && node scripts/audit-seo-index.mjs --output ../.audit/seo-final.json --pretty > ../audit-final-seo.log 2>&1
zsh /Volumes/致态2TB/nx-agents/load-gate.sh && node --expose-gc scripts/deep-audit-runtime.mjs > ../audit-final-runtime.log 2>&1
zsh /Volumes/致态2TB/nx-agents/load-gate.sh && npm run i18n:check > ../audit-final-i18n-check.log 2>&1
zsh /Volumes/致态2TB/nx-agents/load-gate.sh && node --test tests/venue-graph.test.mjs > ../audit-final-venue-graph.log 2>&1
zsh /Volumes/致态2TB/nx-agents/load-gate.sh && node --test tests/venue-detail-decision-ssr.test.mjs tests/public-copy-sanitizer.test.mjs > ../audit-expanded-copy-after.log 2>&1
zsh /Volumes/致态2TB/nx-agents/load-gate.sh && node --test tests/visual-conversion.test.mjs tests/telegram-return-hydration.test.mjs > ../audit-alert-placeholder-after.log 2>&1 && npm run typecheck > ../audit-alert-typecheck.log 2>&1
```

From the repository root:

```sh
zsh /Volumes/致态2TB/nx-agents/load-gate.sh && python3 -m unittest discover -s deploy/tests -v > audit-final-deploy-helpers.log 2>&1
git diff --check
git diff origin/main -- pilot-01-prototype/src/data/partner-registry.js
```

Evidence summary (final broad run results appended below):

- i18n check: 17 catalogs, 116 keys, placeholder signatures, RTL metadata, review gates and UI limits passed.
- Venue preload regression: 6 passed, 0 failed, including the unchanged forbidden-heavy-graph contract.
- Expanded venue/directory copy regression: 7 passed, 0 failed; the new placeholder assertion failed before the source fix.
- Bot command/TTL regression: 8 passed, 0 failed; the fake-record assertion failed before replacing the preview. Typecheck passed.
- Python deploy-helper tests: 17 passed. These exercise local stubs; they did not deploy.
- Existing test:sites skips are unchanged: optional CJK live-browser runner, optional narrow funding DOM runner, and authorized external Telegram checkout. No new skips were introduced.
- No lint command/config is supplied by this app. Typecheck, strict build budgets, the active suite and `node --check` on 53 changed/new JS/MJS files provide static validation; no new dependencies were added.


Final broad evidence:

- Hydration: 2,502/2,502 routes returned 200; 0 console/recoverable errors, 0 redirects. Includes the final Bot command-guide markup. The subsequent alias correction changes CSS only; the browser geometry proof below covers it.
- SEO: 29 sitemaps, 5,051 sitemap URLs, 6,285 rendered pages, 345 llms page references, 64 static references; 0 rendering/audit failures. The final suite reruns its built-site SEO regression after rebuilding CSS.
- Actual-body copy scan: 2,546 built HTML/JSON files; 0 live-field placeholders, 0 synthetic alert records. Remaining 76 token hits are methodology/instruction prose or quoted incomplete official-source terms; these remain explicit caveats, not claimed live values.
- Visible Chrome: final 78-case matrix across all17 home/OKX locales, regional roots, CJK directories, RTL venues, funding matrix, activities, Bot hub and tokenized topic. Widths 320/360/390/430/768/1440; final console errors, page overflow and heading overflow all0. Traditional Chinese six-width rechecks cover the runtime `zh-TW` alias. Its desktop heading now measures 540px client /540px scroll, compared with 540/612 before repair. Three additional Sources-panel interactions (zh-Hant Aevo, Arabic OKX, Urdu OKX) hydrated their deferred content with no console errors, placeholders or page overflow. The viewport override was reset, the dedicated Chrome tab closed, and temporary preview servers stopped.
- Final mixed crawler/API probe: 80 requests across 17 locale directories, concurrent with80 news-search API requests; both failure counts0. Cache miss→hit and cookie bypass confirmed. Crawler p95 36.73ms; API p95 35.35ms. Heap delta0.96MB, RSS delta115.80MB, end heap109.07MB/RSS481.86MB. Expected offline-feed warnings are present. This is a short local probe, not a production soak or a proof that RSS growth ended.

## Boundaries and open questions

- No production deployment occurred. Local Node 26/browser results do not establish production Node 20 behavior, uptime, real conversions, rebate eligibility, indexing, or ranking.
- Schedule an authorized production-like 90-minute soak with RSS/heap/external-buffer samples and heap profiles before closing O1. The short probe records RSS growth as well as a small heap delta.
- Exact browser idle CPU timing needs the rejected Performance measurement authority; do not substitute an indirect raw-CDP workaround.
- Supply the actual deploy-local.sh revision/location in an accessible authorized checkout to assess its rollback/CTA/lock contract.
- Native review remains necessary for source-heavy localized notes and the existing Urdu/Ukrainian publication gates.

## Local Git delivery

The managed sandbox denies the linked worktree's normal `index.lock` and `COMMIT_EDITMSG`. A task-local Git index under `.audit/final.index` stages the complete tree. Git plumbing (`write-tree`, `commit-tree`, expected-old-value `update-ref`) provides the authorized local commit without editing the original checkout or escalating permissions. The default linked-worktree index remains stale; it can be refreshed when normal index writes are permitted. The task-local index is used to verify committed-tree/working-tree equality. A full binary patch is retained locally under `.audit/final.patch`.

## Changed-file inventory

The task-local Git index contains the complete integration. Generated llms/sitemap/fact artifacts were regenerated from existing authoritative source values; changed ordering/casing reflects the registry, not new code values or publication authority. Build timestamps are local artifact provenance, not production evidence.



- `.gitignore`
- `AUDIT.md`
- `audit-area-1.md`
- `audit-area-2.md`
- `audit-area-3.md`
- `audit-area-4.md`
- `audit-area-5.md`
- `audit-area-6.md`
- `audit-area-7.md`
- `audit-runtime-plan.md`
- `pilot-01-prototype/.openai/hosting.json`
- `pilot-01-prototype/package.json`
- `pilot-01-prototype/public/content/search-publication-report.json`
- `pilot-01-prototype/public/intel/partners.json`
- `pilot-01-prototype/public/llms-full.txt`
- `pilot-01-prototype/public/llms-small.txt`
- `pilot-01-prototype/public/llms.txt`
- `pilot-01-prototype/public/sitemap-apps.xml`
- `pilot-01-prototype/public/sitemap.xml`
- `pilot-01-prototype/scripts/audit-seo-index.mjs`
- `pilot-01-prototype/scripts/deep-audit-dev-preview.mjs`
- `pilot-01-prototype/scripts/deep-audit-hydration.mjs`
- `pilot-01-prototype/scripts/deep-audit-runtime.mjs`
- `pilot-01-prototype/server.mjs`
- `pilot-01-prototype/server/cta-collector.mjs`
- `pilot-01-prototype/server/ssr-page-cache.mjs`
- `pilot-01-prototype/src/App.jsx`
- `pilot-01-prototype/src/components/apps/AppDownloadPage.jsx`
- `pilot-01-prototype/src/components/data/FundingMatrixPage.jsx`
- `pilot-01-prototype/src/components/data/LiquidationHeatmapPage.jsx`
- `pilot-01-prototype/src/components/data/useMarketEvents.js`
- `pilot-01-prototype/src/components/flash/FlashPages.jsx`
- `pilot-01-prototype/src/components/intel-tools/shared.jsx`
- `pilot-01-prototype/src/components/licenses/LicensePages.jsx`
- `pilot-01-prototype/src/components/shell/LanguageMenu.jsx`
- `pilot-01-prototype/src/components/v3/ExchangeKeyFacts.jsx`
- `pilot-01-prototype/src/components/v3/OnsiteTelegramBotHandoff.jsx`
- `pilot-01-prototype/src/components/v3/RegistrationCard.jsx`
- `pilot-01-prototype/src/components/v3/TelegramAlertsHero.jsx`
- `pilot-01-prototype/src/components/v3/TelegramBotHub.jsx`
- `pilot-01-prototype/src/components/v3/TelegramReturnBanner.jsx`
- `pilot-01-prototype/src/components/v3/TokenizedAssetsPage.jsx`
- `pilot-01-prototype/src/components/v3/TradingBleedAnalyzer.jsx`
- `pilot-01-prototype/src/components/v3/VenueDetailPage.jsx`
- `pilot-01-prototype/src/components/v3/VenueDetailResearch.jsx`
- `pilot-01-prototype/src/components/v3/activity/LiveCampaigns.jsx`
- `pilot-01-prototype/src/components/v3/exchange-matrix-copy.js`
- `pilot-01-prototype/src/components/v3/international/BrazilDecisionPage.jsx`
- `pilot-01-prototype/src/components/v3/international/RegionalMarketDecisionDepth.jsx`
- `pilot-01-prototype/src/components/v3/telegram-return-hydration.js`
- `pilot-01-prototype/src/components/v7/home7-copy.js`
- `pilot-01-prototype/src/components/v7/home7-funding.jsx`
- `pilot-01-prototype/src/data/exchange-key-facts-copy.js`
- `pilot-01-prototype/src/data/exchange-key-facts-source.js`
- `pilot-01-prototype/src/data/exchange-key-facts.generated.js`
- `pilot-01-prototype/src/data/flash.js`
- `pilot-01-prototype/src/data/home-hero-experiment.js`
- `pilot-01-prototype/src/data/licenses.js`
- `pilot-01-prototype/src/data/locale-routing.js`
- `pilot-01-prototype/src/data/referral-native.js`
- `pilot-01-prototype/src/data/venue-database.js`
- `pilot-01-prototype/src/entry-server.jsx`
- `pilot-01-prototype/src/styles/v7/home7.css`
- `pilot-01-prototype/src/styles/v7/home7.src.css`
- `pilot-01-prototype/tests/app-downloads.test.mjs`
- `pilot-01-prototype/tests/cta-collector.test.mjs`
- `pilot-01-prototype/tests/data-page-hydration-lifecycle.test.mjs`
- `pilot-01-prototype/tests/deep-audit-runtime.test.mjs`
- `pilot-01-prototype/tests/exchange-key-facts.test.mjs`
- `pilot-01-prototype/tests/factbook-date-truth.test.mjs`
- `pilot-01-prototype/tests/finder-behavior.test.mjs`
- `pilot-01-prototype/tests/flash.test.mjs`
- `pilot-01-prototype/tests/frontend-contract.test.mjs`
- `pilot-01-prototype/tests/home-hero-experiment.test.mjs`
- `pilot-01-prototype/tests/i18n-tooling.test.mjs`
- `pilot-01-prototype/tests/licenses.test.mjs`
- `pilot-01-prototype/tests/locale-routing.test.mjs`
- `pilot-01-prototype/tests/partners-feed.test.mjs`
- `pilot-01-prototype/tests/perf-ssr-page-cache.test.mjs`
- `pilot-01-prototype/tests/prerender-contract.test.mjs`
- `pilot-01-prototype/tests/public-copy-sanitizer.test.mjs`
- `pilot-01-prototype/tests/quality-sweep-v4.test.mjs`
- `pilot-01-prototype/tests/r128-home-benefit-dedup.test.mjs`
- `pilot-01-prototype/tests/r156-home-workbench.test.mjs`
- `pilot-01-prototype/tests/r158-home-hierarchy.test.mjs`
- `pilot-01-prototype/tests/r163-home-task-copy.test.mjs`
- `pilot-01-prototype/tests/r76-pix-recipient.test.mjs`
- `pilot-01-prototype/tests/seo-index-audit.test.mjs`
- `pilot-01-prototype/tests/seo-onpage-venue-h1.test.mjs`
- `pilot-01-prototype/tests/sites-worker.test.mjs`
- `pilot-01-prototype/tests/telegram-context-return.test.mjs`
- `pilot-01-prototype/tests/telegram-ecosystem.test.mjs`
- `pilot-01-prototype/tests/telegram-return-hydration.test.mjs`
- `pilot-01-prototype/tests/venue-detail-decision-ssr.test.mjs`
- `pilot-01-prototype/tests/visual-conversion.test.mjs`
- `pilot-01-prototype/vite.config.mjs`
- `pilot-01-prototype/worker/index.js`
