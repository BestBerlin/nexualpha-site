# SEO structure verification

Scope: local branch `codex/seo-structure`, baseline `dfdf926f3369fcb9c3ce4530cba6e3701d0b33d1`. No deployment, push, production mutation or search submission. Counts use the checked-in 416-article feed dated `2026-10-04T20:46:19.460Z`, not current production or GSC results.

Advertised sitemap URLs: **5,812 -> 5,558**. Bounded home/generated-pair noindex count: **3,559 -> 3,691** (not a full-site census). [Sitemap policy](./sitemap-policy.md) gives every sitemap type and locale; the before/after JSON files include per-type locale details.

## Results and reproducible commands

Run from `pilot-01-prototype/` with Node 24.19.0:

```sh
export PATH=/opt/homebrew/opt/node@24/bin:$PATH
npm run build
node scripts/verify-build-budget.mjs --strict
npm run typecheck
npm run test:seo-structure
node scripts/seo-structure-counts.mjs > docs/evidence/seo-structure-20261023/sitemap-after.json
node scripts/verify-article-link-policy.mjs docs/evidence/seo-structure-20261023/article-links.json
node scripts/crawl-built-link-surface.mjs ../.audit/seo-structure-crawl-full.json
git diff --check
```

The build packages the new Worker dependency and runs the strict bundle gate. There is no project lint command. TypeScript checking, Node parsing, rendered schema assertions and the test suite supply static and behavioral checks. Full `npm test` was not run; the project notes that it exceeds one hour.

Final build: PASS. Strict home initial JS: **349,827 gzip bytes / 350,000**. Typecheck: PASS. Task suite: **236 passed, 0 failed, 0 skipped**. Article selector sweep: **448 editions passed**, all with five related articles and an exchange destination. Incidental build-generated summary/intel/LLMS/referral data changes were restored as required; sitemap XML and the publication policy report are intentional changes. Counts and FAQ tests were rechecked after restoration.

Final full crawl: **5,558/5,558 sitemap targets passed within three clicks**, zero sitemap parse errors and zero target status/canonical/indexability/depth failures. It fetched 6,921 rendered documents, including 5,582 indexable documents. `crawl-depth-summary.json` contains depth histograms, per-sitemap counts and the separately recorded non-sitemap 404. The full raw report stays in ignored `.audit/seo-structure-crawl-full.json`; this compact report and the progress log are reviewable evidence.

The crawler starts at `/`; sitemap URLs are targets, never synthetic navigation edges. It follows actual same-origin HTML anchors, honors robots/nofollow, and checks status, self-canonical and indexability. A noindex archive can supply follow links. The packaged Worker and production news SSR renderer run in-process because this sandbox forbids an HTTP listener and Chromium cannot start. This verifies rendered HTML, not browser geometry or production HTTP behavior. `environment.json` records the unavailable browser/Better Design checks and ignored local build prerequisites.

## Changes verified

- All Urdu/Ukrainian editions are reachable but noindex; neither URLs nor alternates enter generated sitemaps. English `/uk` remains a country route.
- Generated pair pages without unique research remain linked and noindex. Curated comparisons remain eligible.
- Empty collections and archives beyond page one are excluded without hiding their navigation.
- Four existing `/topics` sections link fees, rebates/referrals, tokenized stocks, and funding/liquidations to their established money pages and approved research. English and Chinese introductory copy is distinct per topic; fallback language is labeled.
- Home reserves newest and strongest research slots and directly links edition archives plus coin/license/converter hubs. Existing news and exchange article selectors remain in use.
- All 448 search-published editions in the snapshot have five related articles and an exchange destination. Invalid converter destinations fall back to a supported converter.
- Summary projections preserve explicit search approval; missing approval cannot promote a listing. Client topic refresh uses the public Worker projection, since the static summary intentionally strips SEO flags.
- Template JSON-LD checks cover Article/NewsArticle, BreadcrumbList, FAQPage, Organization social identities and other template-specific types. Relative FAQ citations become absolute. Deposit SSR uses its real marker so its page body and links survive rendering.

## Supplemental legacy checks

```sh
node --test tests/news-feed.test.mjs tests/r274-news-alternate-hydration.test.mjs tests/r286-news-summary-claims.test.mjs
```

Result: 41 passed, 5 failed (`projection-tests.log`). Two assertion failures reproduce on an isolated unchanged baseline: expanded meta-description versus an exact historical string, and a fake-article publication assertion. `projection-baseline.log` records the identical baseline result (41 passed, 2 failed, 43 tests). The other three tests depend on absent `baseline/before-summary-claims-*` files or a frozen historical feed hash. These historical tests and source facts were left unchanged.

Browser responsive/spacing QA remains unverified. Better Design principle/review calls exhausted the available query quota; `inspect-spacing` required a browser capture. No indexing/ranking improvement is claimed from local tests.

The crawl also found one non-sitemap 404: `/news/bybit-us-stocks-etfs-usdc-alpaca-what-you-own`, linked by `/activities/bybit-stocks`. Neither that article nor its existing canonical destination appears in this historical feed. Its live availability is unknown; campaign facts and the existing link were left unchanged. This does not affect the sitemap target pass.

## Local commit blocker

From the repository root, `git add -- pilot-01-prototype` returned **exit 128**:

```text
fatal: Unable to create '/Volumes/致态2TB/nexualpha-site-git/.git/worktrees/nx-wt-codex-seo-structure/index.lock': Operation not permitted
```

No commit was created. Branch remains `codex/seo-structure` at the baseline SHA. The queue `_common.md` explicitly permits leaving the working-tree changes for lead extraction if the sandbox blocks committing. The intended Lore commit message is in `commit-message.txt`; `changed-files.txt` includes tracked and untracked deliverables. Recovery requires a session permitted to write the shared Git metadata, then staging these changes and committing with that message. No permission or sandbox settings were changed.

The same index restriction blocked `git restore`; the eight incidental files were instead restored byte-for-byte with `git show HEAD:pilot-01-prototype/<path>` and a write to their allowed worktree paths. `node --test tests/partner-venue-faq.test.mjs` then passed **8/8**, and regenerated policy counts stayed unchanged.
