# Leader test hygiene review

Round 3: no local commit was created. `git add` and `git commit` still fail to create `/Volumes/致态2TB/nexualpha-site-git/.git/worktrees/nx-wt-codex-test-hygiene-01/index.lock` with `Operation not permitted`. `git merge origin/main` also fails to create `ORIG_HEAD.lock`. No Git-directory or sandbox workaround was attempted. The required merge and local commits remain blocked.

| Original failing test | Class | Action / evidence |
|---|---|---|
| NX-05 /onchain is a verification guide in all 15 locales: honest title, description, schema and status | b | Apply the approved title budget to the expected raw guide title; 3c54a66. |
| editorial identity stays separate from the functional heading and controls | b | Check current hx trust-line/title/subtitle classes; directory hero redesign preserved separate elements. |
| registered onsite experiments stay designed and first-party only | b | Only home_hero_copy_v1 is ACTIVE after owner approval in PR #79; retain all outcome guardrails. |
| regional research cards keep question, answer, and next step in a readable vertical flow | b | Pin shared line-height token and original 1.55 fallback; 244ad6f. |
| HTML asset responses preserve existing CSP while adding frame protection | b | Assert private home cache required for active hero assignment; PR #79. |
| Singapore regional worker metadata keeps answer-first checks and onsite CTA order | b | Pin long served title without suffix; 3c54a66. |
| commercial destinations are unchanged by the fee-answer edit | b | Update only partner-registry hash to the owner-approved Binance primary-domain change, 84b6426. |
| dated artifacts preserve draft-only inventory across the scoped OKX source recheck | b | Same single authorized hash transition; historical Telegram artifact bytes remain unchanged. |
| server-rendered news routes expose canonical metadata and fail unknown slugs closed | b | Explicitly flag the unreviewed fixture noindex; publication is feed-owned, b4c9051. Preserve unknown-route 404 assertions. |
| AI discovery generator emits priority source-backed venue canonicals without public artifact mutation | a | Source-review section accidentally exposed commercial SEO titles after b4c9051. Use venue source-review labels; keep all existing no-code assertions and source/canonical checks. |
| regional JP KR and Türkiye routes ship full SSR with delayed hydration budgets | b | Shared CSS split 451eb4b deliberately added core-b/core-c. Budget six links and additionally enforce regional/shared-only prefixes. |
| bootstrap matches neutral SSR first, then restores the captured decision URL despite child effects | c | Resolve actual PR #78 hero context import in copied-source fixture; provide browser listener APIs used by real click installers. URL assertions unchanged. |
| bootstrap forces explicit SSR English before restoring Japanese query locale | c | Same deterministic browser fixture repair. |
| bootstrap fallback and explicit client-render keep the full browser URL from their first pass | c | Same deterministic browser fixture repair. |
| captured BR widget URL switches from generic neutral embed and restores amount, platform and fee inputs | c | Same deterministic browser fixture repair. |
| fee benchmark uses reviewed spot records and localized reviewed copy | b | Cover reviewed spot AND perpetual schedules including OKX, with source/date/tier/scope/conditions. Locale-aware exact rate formatting; 4a31e90. |
| rates route exposes answer-first conversion bridge through source-bound CTA routes | b | Result cards precede follow-up action strip after 4a31e90. Retain exact onsite and protected CTA checks. |
| fee benchmark mobile expand controls are localized for every supported locale | d | Keep failing: c581073 replaced six-row expansion with checked-only ledger and unchecked-venue disclosure. There is no such control in current product. Needs Claude decision. |
| fee benchmark preserves source-bound CTA destinations and mobile six-row behavior | d | Keep failing: mobile-extra row hiding was removed in c581073. Protected CTA assertions still pass before the historical mobile assertion. Needs Claude decision. |

## Targeted checks

From repository root:

- `node --test pilot-01-prototype/tests/experiment-registry.test.mjs pilot-01-prototype/tests/audit-content.test.mjs pilot-01-prototype/tests/brand-editorial.test.mjs pilot-01-prototype/tests/regional-preview.test.mjs pilot-01-prototype/tests/sites-worker.test.mjs` — 121 passed, 0 failed.
- `node --test pilot-01-prototype/tests/news-feed.test.mjs pilot-01-prototype/tests/hyperliquid-tier0-answer.test.mjs pilot-01-prototype/tests/telegram-30day-review-queue.test.mjs pilot-01-prototype/tests/citation-assets-discovery.test.mjs` — 56 passed, 0 failed.

From `pilot-01-prototype`:

- `npm run typecheck` — exit 0.
- `node --test tests/prerender-contract.test.mjs` — 29 passed, 0 failed.
- `node --test --test-name-pattern='bootstrap|captured BR' tests/frontend-contract.test.mjs` — 5 passed, 0 failed.
- `node --test tests/fee-benchmark-reviewed.test.mjs` — 3 passed, 2 failed (the two class-d contracts above).

The inline bootstrap fixture changes address product imports/listener installation added since the fixture was written. They do not alter Vite, build configuration, standalone test helpers, or bypass environment restrictions.


## Final Round 3 verification

- Preserved Round 2 baseline: sites 1,071 tests / 1,011 pass / 59 fail / 1 skip; rest 483 / 431 / 52 / 0.
- Round 3 resumed baseline: sites 1,079 / 1,047 / 31 / 1; rest 485 / 475 / 10 / 0.
- Final sites: 1,079 / 1,068 / 10 / 1 (`/tmp/h-round3-sites-clean.log`). All ten remaining failures are class d and retained with Needs Claude decision comments.
- Final rest, after tightening current feed/href contracts: 488 / 486 / 2 / 0 (`/tmp/h-round3-rest-final-reviewed.log`). Both remaining failures are class c missing-original-R128-fixture blockers, not removed features.
- Build succeeds (2,332 prerender routes and strict bundle budget); typecheck, syntax checks and diff whitespace checks pass.
- All 111 original failure entries and the additional compact-retrieval failure are classified in `docs/test-hygiene-per-test.md`.
- Two shared test contracts were updated for exact intended behavior, not as environment workarounds: PR #76 repaired five feed summaries (exact current SHA, unchanged historical manifest/receipt/ledger); baseline a4dee31 omits one archived compare shortcut (exact remaining ordered href equality). Final focused run: 19 passed / 0 failed.
- Vite/build configuration, package scripts, protected data and tracked public outputs remain unchanged. The generated route-CSS timestamp artifact was restored from HEAD bytes after verification. `.openai` is not included.
- `origin/main` is still five commits ahead, including PR #87. The merge and required small commits remain blocked by Git lock-file permission errors. The suite results describe this branch plus its reviewed working-tree edits, not merged main.
- Completion is blocked until Git metadata lock writes are allowed and the exact historical R128 fixture is recovered. No commit, push, deployment or protected-data edit was performed.

## Complete changed-file inventory

- `docs/test-hygiene-contract.md`
- `docs/test-hygiene-leader.md`
- `docs/test-hygiene-per-test.md`
- `docs/test-hygiene-rest-r.md`
- `docs/test-hygiene-rest-seo.md`
- `pilot-01-prototype/scripts/generate-public-llms.mjs`
- `pilot-01-prototype/src/components/v3/FeeBenchmarkTerminal.jsx`
- `pilot-01-prototype/src/data/regional-directory.js`
- `pilot-01-prototype/tests/audit-content.test.mjs`
- `pilot-01-prototype/tests/brand-editorial.test.mjs`
- `pilot-01-prototype/tests/compare-any.test.mjs`
- `pilot-01-prototype/tests/compare-compact-pending.test.mjs`
- `pilot-01-prototype/tests/compare-decision-ssr.test.mjs`
- `pilot-01-prototype/tests/compare-direct-answers.test.mjs`
- `pilot-01-prototype/tests/compare-pairs-market-plan.test.mjs`
- `pilot-01-prototype/tests/cost-decision-locales.test.mjs`
- `pilot-01-prototype/tests/decision-return-calculators.test.mjs`
- `pilot-01-prototype/tests/detail-composition.test.mjs`
- `pilot-01-prototype/tests/experiment-registry.test.mjs`
- `pilot-01-prototype/tests/fee-benchmark-reviewed.test.mjs`
- `pilot-01-prototype/tests/fixtures/seo/README.md`
- `pilot-01-prototype/tests/fixtures/seo/wave28-indexable-content-duplication-final.json`
- `pilot-01-prototype/tests/fixtures/seo/wave29-indexable-content-duplication.json`
- `pilot-01-prototype/tests/fixtures/seo/wave35-indexable-content-duplication.json`
- `pilot-01-prototype/tests/frontend-contract.test.mjs`
- `pilot-01-prototype/tests/hyperliquid-tier0-answer.test.mjs`
- `pilot-01-prototype/tests/news-feed.test.mjs`
- `pilot-01-prototype/tests/prerender-contract.test.mjs`
- `pilot-01-prototype/tests/r100-topic-faq-contract.test.mjs`
- `pilot-01-prototype/tests/r101-hyperliquid-fee-scenario.test.mjs`
- `pilot-01-prototype/tests/r101-hyperliquid-seo-preserve.test.mjs`
- `pilot-01-prototype/tests/r102-treasury-seo-preserve.test.mjs`
- `pilot-01-prototype/tests/r106-context-preservation.test.mjs`
- `pilot-01-prototype/tests/r106-mx-display-seo.test.mjs`
- `pilot-01-prototype/tests/r106-mx-native-copy.test.mjs`
- `pilot-01-prototype/tests/r108-treasury-news-handoff.test.mjs`
- `pilot-01-prototype/tests/r16-okx-owner-page.test.mjs`
- `pilot-01-prototype/tests/r18-regional-decision-depth.test.mjs`
- `pilot-01-prototype/tests/r189-feed-contract.mjs`
- `pilot-01-prototype/tests/r189-presentation-contract.mjs`
- `pilot-01-prototype/tests/r42-home-short-path.test.mjs`
- `pilot-01-prototype/tests/r42-seo-ctr-batch1.test.mjs`
- `pilot-01-prototype/tests/r93-uniswap-retrieval-parity.test.mjs`
- `pilot-01-prototype/tests/r95-compliant-funding-boundary.test.mjs`
- `pilot-01-prototype/tests/r95-compliant-retrieval-parity.test.mjs`
- `pilot-01-prototype/tests/r95-standalone-worker-package.test.mjs`
- `pilot-01-prototype/tests/r95-telegram-review-index.test.mjs`
- `pilot-01-prototype/tests/r98-topic-truth-boundary.test.mjs`
- `pilot-01-prototype/tests/regional-preview.test.mjs`
- `pilot-01-prototype/tests/retrieval-news-publication.test.mjs`
- `pilot-01-prototype/tests/seo-wave28-metadata-localization.test.mjs`
- `pilot-01-prototype/tests/seo-wave29-description-dedup.test.mjs`
- `pilot-01-prototype/tests/seo-wave30-title-h1-dispositions.test.mjs`
- `pilot-01-prototype/tests/seo-wave32-serp-ctr.test.mjs`
- `pilot-01-prototype/tests/seo-wave33-exact-query-intent.test.mjs`
- `pilot-01-prototype/tests/seo-wave35-ai-citation-trust.test.mjs`
- `pilot-01-prototype/tests/seo-wave36-regional-hubs.test.mjs`
- `pilot-01-prototype/tests/seo-wave42-gmx-title.test.mjs`
- `pilot-01-prototype/tests/seo-wave46-search-growth.test.mjs`
- `pilot-01-prototype/tests/seo-whole-site.test.mjs`
- `pilot-01-prototype/tests/sites-worker.test.mjs`
- `pilot-01-prototype/tests/telegram-30day-review-queue.test.mjs`
- `pilot-01-prototype/tests/venue-decision-content.test.mjs`
- `pilot-01-prototype/tests/venue-detail-decision-ssr.test.mjs`
- `pilot-01-prototype/tests/venue-fee-summary.test.mjs`
- `pilot-01-prototype/tests/week2-mobile-shortpath-contract.test.mjs`
