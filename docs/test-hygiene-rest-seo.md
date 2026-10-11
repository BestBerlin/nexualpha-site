# Rest SEO test hygiene lane

Assigned scope: `retrieval-news-publication.test.mjs`, `seo-wave*` SEO tests, and `seo-whole-site.test.mjs` failures from the REST suite log.

## Summary

The assigned targeted SEO run now passes: 69 tests, 69 pass, 0 fail. The requested citation/source-script smoke run also passes: 56 tests, 56 pass, 0 fail. R95 compact retrieval parity passes with `public/llms-small.txt` restored to HEAD bytes; it pins the generated compact output to SHA-256 `1ff1305f683c0b54444e277138ab40c5cdea78d8923613c7696a731b2b9b4ece` so it does not depend on a dirty generated public artifact. The fixes keep assertions source-bound to current route metadata, publication policy, generated-audit behavior, and citation-safe llms output. No protected data, helper, Vite, or build files were changed in this lane.

The initial lane baseline from the targeted command had 22 failing subtests across these files. Leader baseline for the broader REST run was 483 total / 431 pass / 52 fail.

## Per-test table

| Test file / group | Class | Change |
| --- | --- | --- |
| `tests/citation-assets-discovery.test.mjs` / `scripts/generate-public-llms.mjs` | b | Kept the source-backed venue detail section free of referral-code route titles by emitting neutral `{venue} source review` labels while retaining source summaries, official-source links, and boundary language. |
| `tests/r95-compliant-retrieval-parity.test.mjs` | b | Replaced stale public-artifact equality with an exact SHA-256 pin for the approved generated compact llms output (`1ff1305f683c0b54444e277138ab40c5cdea78d8923613c7696a731b2b9b4ece`), covering the #85 brand slogan plus About/Research Desk and editorial-policy links without relying on dirty `public/llms-small.txt` bytes. |
| `tests/retrieval-news-publication.test.mjs` | b | Updated reviewed-news expectations for `b4c9051`: the reviewed-news cap is now 5000, sourced `PUBLISHED` arrivals are eligible, and manifest-carried sourced published articles can be indexable. |
| `tests/seo-wave28-metadata-localization.test.mjs` | b | Updated static `/onchain` and factbook localization assertions to current proof-of-reserves copy and date-in-schema behavior. |
| `tests/seo-wave29-description-dedup.test.mjs` | b/c | Added an isolated-run fallback to the recovered full Wave28 audit fixture (`20` duplicate-description groups, `19` duplicate-title groups, `53` duplicate-H1 groups), and aligned current metadata checks with Worker clamping plus approved referral-code SEO copy. |
| `tests/seo-wave30-title-h1-dispositions.test.mjs` | b/c | Added an isolated-run fallback to the recovered full Wave29 audit fixture (`19` duplicate-title groups, `53` duplicate-H1 groups), aligned current metadata checks with approved referral-code SEO copy, kept the 53 reviewed-disposition coverage count, and added an overbroad-disposition guard so unreviewed duplicate H1 paths still fail. |
| `tests/seo-wave32-serp-ctr.test.mjs` | b | Updated SERP title/snippet assertions for current budgeted titles and shortened OKX migration snippet copy. |
| `tests/seo-wave33-exact-query-intent.test.mjs` | b | Updated Hyperliquid exact-query assertions to the current approved referral-code metadata while preserving bans on guarantees, profit/yield promises, and private commission claims. |
| `tests/seo-wave35-ai-citation-trust.test.mjs` | b | Updated factbook `dateModified` assertion to use `factbookDates("binance").latestReviewOn`, matching the current schema source of truth. |
| `tests/seo-wave36-regional-hubs.test.mjs` | b/c | Added isolated-run fallbacks for the source-built route inventory and recovered full Wave35 audit fixture, and changed the regional-hub description comparison to Worker-side clamping only, matching commit `5a2f9c3`. |
| `tests/seo-wave42-gmx-title.test.mjs` | b | Updated GMX title expectation for current budgeted long-title behavior. |
| `tests/seo-wave46-search-growth.test.mjs` | b | Updated priority route expectations for current budgeted titles, Hyperliquid referral-code metadata, and FAQ count. |
| `tests/seo-whole-site.test.mjs` | b | Updated whole-site expectations for current compact fallback news rows, referral-code venue metadata, localized Hyperliquid descriptions, unknown sourced article indexability, alternates count, and No-KYC FAQ count. |

## Recovered audit fixture provenance

| Fixture | Source | SHA-256 | Preserved coverage |
| --- | --- | --- | --- |
| `pilot-01-prototype/tests/fixtures/seo/wave28-indexable-content-duplication-final.json` | `/Volumes/致态2TB/Codex/migration/mac-storage-20261007/projects/Crypto聚合/artifacts/seo/wave28-indexable-content-duplication-final.json` | `1fd0eeb6a6a2eaf2397207fc3c4010b50c8eae38d92f1aa19c5eb3a90afb1263` | 20 duplicate-description groups, 19 duplicate-title groups, 53 duplicate-H1 groups |
| `pilot-01-prototype/tests/fixtures/seo/wave29-indexable-content-duplication.json` | `/Volumes/致态2TB/Codex/migration/mac-storage-20261007/projects/Crypto聚合/artifacts/seo/wave29-indexable-content-duplication.json` | `d846d9dee4964cb514bf769adddd4f02e721b329d2b24e55226bd638efe169f9` | 19 duplicate-title groups, 53 duplicate-H1 groups |
| `pilot-01-prototype/tests/fixtures/seo/wave35-indexable-content-duplication.json` | `/Volumes/致态2TB/Codex/migration/mac-storage-20261007/projects/Crypto聚合/artifacts/seo/wave35-indexable-content-duplication.json` | `ae45eda828db884a1dbf04fb557b0afeb3415dd88b1c53a5d1d9d8bf38866e7d` | zero high-confidence duplicate/thin/fallback candidates |

## Original failing subtests from `/tmp/h-rest.log`

| Test file | Failing subtest in baseline log |
| --- | --- |
| `tests/citation-assets-discovery.test.mjs` | `AI discovery generator emits priority source-backed venue canonicals without public artifact mutation` |
| `tests/retrieval-news-publication.test.mjs` | `all six retained research answers stay selected and client/SSR indexable within unchanged budgets` |
| `tests/retrieval-news-publication.test.mjs` | `new PUBLISHED feed arrivals and feed order never replace the accepted 312 article roster` |
| `tests/retrieval-news-publication.test.mjs` | `matching prerender fingerprint and searchPublished true never bypass reviewed article guard` |
| `tests/seo-wave28-metadata-localization.test.mjs` | `Wave28 static pages receive locale-specific metadata without changing Worker/client policy` |
| `tests/seo-wave28-metadata-localization.test.mjs` | `Wave28 Factbook pages localize descriptions while preserving source-bound metadata` |
| `tests/seo-wave29-description-dedup.test.mjs` | module load failed before subtests: missing `artifacts/seo/wave28-indexable-content-duplication-final.json` |
| `tests/seo-wave30-title-h1-dispositions.test.mjs` | module load failed before subtests: missing `artifacts/seo/wave29-indexable-content-duplication.json` |
| `tests/seo-wave32-serp-ctr.test.mjs` | `Wave32 news SERP overrides sharpen top-ten zero-CTR article snippets without changing canonicals` |
| `tests/seo-wave32-serp-ctr.test.mjs` | `Wave32 DEX profile SERP snippets keep parity and source-bound intent for Aerodrome and Jupiter` |
| `tests/seo-wave33-exact-query-intent.test.mjs` | `Wave33 Hyperliquid exact queries cover fees and funded-account boundaries without promises` |
| `tests/seo-wave35-ai-citation-trust.test.mjs` | `Wave35 client and worker expose research-desk attribution on high-value comparison and topic pages` |
| `tests/seo-wave36-regional-hubs.test.mjs` | `Wave36 regional hubs expose source-backed FAQ schema without changing canonical or index policy` |
| `tests/seo-wave36-regional-hubs.test.mjs` | `Wave36 low-value consolidation audit has zero high-confidence current candidates` |
| `tests/seo-wave42-gmx-title.test.mjs` | `Wave42 changes only the English GMX title for the observed exact query` |
| `tests/seo-wave46-search-growth.test.mjs` | `Wave46 tokenized Treasuries article owns the yield-check search intent without a noindex comparison detour` |
| `tests/seo-wave46-search-growth.test.mjs` | `priority answers preserve Hyperliquid decision coverage and the GMX search title` |
| `tests/seo-whole-site.test.mjs` | `non-indexable news locales render localized fallback instead of a loading shell or long English body` |
| `tests/seo-whole-site.test.mjs` | `GSC priority DEX detail pages expose CTR-focused metadata and source-bound FAQ answers` |
| `tests/seo-whole-site.test.mjs` | `GSC priority venue overrides do not replace localized route metadata` |
| `tests/seo-whole-site.test.mjs` | `Wave12 Korean and Turkish high-intent pages expose localized AEO metadata and schemas` |
| `tests/seo-whole-site.test.mjs` | `article-owned client metadata follows loaded content, locale and missing-article state` |
| `tests/seo-whole-site.test.mjs` | `GSC priority no-KYC topic exposes direct inbound paths to perp comparison and venue profiles` |
| `tests/r95-compliant-retrieval-parity.test.mjs` | `R95 generated standard and full retrieval mirror all nine visible FAQs and exact source dates` |

## Verification

Command:

```bash
cd pilot-01-prototype && node --test tests/retrieval-news-publication.test.mjs tests/seo-wave28-metadata-localization.test.mjs tests/seo-wave29-description-dedup.test.mjs tests/seo-wave30-title-h1-dispositions.test.mjs tests/seo-wave32-serp-ctr.test.mjs tests/seo-wave33-exact-query-intent.test.mjs tests/seo-wave35-ai-citation-trust.test.mjs tests/seo-wave36-regional-hubs.test.mjs tests/seo-wave42-gmx-title.test.mjs tests/seo-wave46-search-growth.test.mjs tests/seo-whole-site.test.mjs
```

Result:

```text
# tests 69
# suites 0
# pass 69
# fail 0
# cancelled 0
# skipped 0
# todo 0
```

Citation/source-script smoke:

```bash
cd pilot-01-prototype && node --test tests/news-feed.test.mjs tests/hyperliquid-tier0-answer.test.mjs tests/telegram-30day-review-queue.test.mjs tests/citation-assets-discovery.test.mjs
```

Result:

```text
# tests 56
# suites 0
# pass 56
# fail 0
# cancelled 0
# skipped 0
# todo 0
```

R95 compact retrieval parity with `public/llms-small.txt` restored to HEAD bytes:

```bash
cd pilot-01-prototype && node --test tests/r95-compliant-retrieval-parity.test.mjs
```

Result:

```text
# tests 3
# suites 0
# pass 3
# fail 0
# cancelled 0
# skipped 0
# todo 0
```

Full REST-only rerun after the SEO/R95 fixes and clean public artifact:

```bash
cd pilot-01-prototype && node - <<'NODE' > /tmp/h-rest-files.txt
const p=require('./package.json');
const files=(script)=>script.match(/tests\/[^\s]+\.test\.mjs/g)||[];
const sites=new Set(files(p.scripts['test:sites']));
const whole=files(p.scripts['test:whole-site']);
const rest=whole.filter(f=>!sites.has(f));
console.error(`rest files: ${rest.length}`);
console.log(rest.join('\n'));
NODE
node --test $(cat /tmp/h-rest-files.txt) > /tmp/h-round3-rest-after-seo-clean-public.log 2>&1
```

Result: exit 1 because two out-of-scope tests still require the absent external candidate tree `/Volumes/release-candidates/r128-home-mobile/candidate/src/components/v3/TopicGuidePage.jsx`; all other REST tests pass.

```text
rest files: 91
# tests 488
# suites 0
# pass 486
# fail 2
# cancelled 0
# skipped 0
# todo 0
# duration_ms 30557.382625

Failing tests:
- tests/r97-hant-render-parity.test.mjs: ENOENT for /Volumes/release-candidates/r128-home-mobile/candidate/src/components/v3/TopicGuidePage.jsx
- tests/r98-topic-truth-boundary.test.mjs: ENOENT for /Volumes/release-candidates/r128-home-mobile/candidate/src/components/v3/TopicGuidePage.jsx
```

Hygiene:

```bash
git diff --check
```

Result: exit 0, no whitespace or conflict-marker errors.

## Remaining notes

- No class d failures remain in this assigned slice.
- The full REST-only rerun has two remaining failures, both outside this lane: `tests/r97-hant-render-parity.test.mjs` and `tests/r98-topic-truth-boundary.test.mjs` fail before assertions because `/Volumes/release-candidates/r128-home-mobile/candidate/src/components/v3/TopicGuidePage.jsx` is absent.
- Local commit creation is still blocked by the sandbox-reported `.git/index.lock` permission issue from the leader update; this lane did not work around it.
