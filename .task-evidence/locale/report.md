# Locale and SSR test lane

All 12 original assigned failures are class (a), stale assertions following intended SEO structure changes. No product code changed.

| Original failing test | File | Class | Change |
|---|---|---|---|
| four app routes SSR in English and Simplified Chinese with matching client SEO and hydration | `tests/app-downloads.test.mjs` | a | Published hreflang count 18 -> 16; ur/uk stay gated. |
| all locale editions are localized and indexable, neutral locales never contain a sign-up block | `tests/app-downloads.test.mjs` | a | Expect ur/uk noindex while preserving every locale SSR/localization and neutral CTA checks. |
| profile crosslinks, lazy route module, sitemap index and unsupported app routes | `tests/app-downloads.test.mjs` | a | Sitemap includes four app pages x 15 reviewed locales; assert gated locales absent. |
| all 170 sitemap pages have matching Worker and app metadata, full reciprocal hreflang and 50 visible FAQ answers | `tests/beginner-path.test.mjs` | a | All 170 readable editions remain checked; ur/uk noindex and no alternates, reviewed editions have 16 reciprocal alternates. Client/Worker robots parity added. |
| locale fallback editions are server-rendered with the client component: main landmark, one H1, links, minimal payload | `tests/fallback-locale-ssr.test.mjs` | a | /topics carries explicit empty newsArticles summary input, mirrored in client render and minimal hydration state. |
| legal metadata: six indexable URLs and English canonical for other locales | `tests/legal-pages.test.mjs` | a | Native-review fallback editions carry no hreflang; legal title/canonical/robots parity retained. |
| native-review locales remain gated outside the approved whale information page | `tests/locales-ur-uk.test.mjs` | a | Whale exception removed: ur/uk are noindex, no alternates, absent from tools sitemap. |
| listing routes are server-rendered by NewsListPage: one H1 equal to the client heading, 24 cards, search and chips | `tests/news-listing-ssr.test.mjs` | a | Summary hydration retains only seo:{noindex:false}; body/source/full SEO payload exclusions preserved. |
| news list route prerenders the core editions and every locale with a native article | `tests/prerender-route-inventory.test.mjs` | a | An empty English listing has no indexed locale; one native English article opens it while translated locales still require five. |
| radar metadata is canonical, indexable and schema stays visible-page truthful | `tests/radar-seo.test.mjs` | a | Native-review ur/uk whale pages noindex under global publication gate. |
| radar inventory and sitemap cover every locale prefix | `tests/radar-seo.test.mjs` | a | All readable inventory locales retained; sitemap excludes ur/uk for both radar families. |
| sitemap: every edition with hreflang, listed in the index and robots.txt, committed copy current | `tests/tokenized-stocks.test.mjs` | a | Expect only reviewed locales in sitemap; committed XML freshness equality retained. |

## Commands and evidence

Working directory: `pilot-01-prototype/`. Every file was run separately before edits using:

`node --test --test-timeout=300000 tests/<name>.test.mjs > ../.task-evidence/locale/<name>.before.tap 2>&1`

Initial runs reproduced stale assertions and additionally failed SSR because new worktree lacked ignored Paraglide plugin cache; lead copied existing cache and restored generated messages. No assertions were weakened for that environment error.

Final isolated command per file:
- `node --test --test-reporter=tap --test-timeout=300000 tests/app-downloads.test.mjs > ../.task-evidence/locale/app-downloads.retry.tap 2>&1` — 7 tests, 7 pass, 0 fail.
- `node --test --test-reporter=tap --test-timeout=300000 tests/beginner-path.test.mjs > ../.task-evidence/locale/beginner-path.retry.tap 2>&1` — 9 tests, 9 pass, 0 fail.
- `node --test --test-reporter=tap --test-timeout=300000 tests/fallback-locale-ssr.test.mjs > ../.task-evidence/locale/fallback-locale-ssr.retry.tap 2>&1` — 5 tests, 5 pass, 0 fail.
- `node --test --test-reporter=tap --test-timeout=300000 tests/legal-pages.test.mjs > ../.task-evidence/locale/legal-pages.after.tap 2>&1` — 3 tests, 3 pass, 0 fail.
- `node --test --test-reporter=tap --test-timeout=300000 tests/locales-ur-uk.test.mjs > ../.task-evidence/locale/locales-ur-uk.after.tap 2>&1` — 9 tests, 8 pass, 1 fail.
- `node --test --test-reporter=tap --test-timeout=300000 tests/news-listing-ssr.test.mjs > ../.task-evidence/locale/news-listing-ssr.retry.tap 2>&1` — 5 tests, 5 pass, 0 fail.
- `node --test --test-reporter=tap --test-timeout=300000 tests/prerender-route-inventory.test.mjs > ../.task-evidence/locale/prerender-route-inventory.retry.tap 2>&1` — 9 tests, 9 pass, 0 fail.
- `node --test --test-reporter=tap --test-timeout=300000 tests/radar-seo.test.mjs > ../.task-evidence/locale/radar-seo.after.tap 2>&1` — 4 tests, 4 pass, 0 fail.
- `node --test --test-reporter=tap --test-timeout=300000 tests/tokenized-stocks.test.mjs > ../.task-evidence/locale/tokenized-stocks.retry.tap 2>&1` — 20 tests, 19 pass, 1 fail.

`git diff --check -- pilot-01-prototype/tests/{app-downloads,beginner-path,fallback-locale-ssr,legal-pages,locales-ur-uk,news-listing-ssr,prerender-route-inventory,radar-seo,tokenized-stocks}.test.mjs` — passed.

## Remaining build-dependent checks

The only remaining failures are stale committed generated XML: `public/sitemap-topics-tools.xml` still lists ur/uk whale URLs and `public/sitemap-tokenized-stocks.xml` differs from the current builder. Lead owns build/generation and final full run; keep XML freshness checks intact. No build, commit or product data edits were performed in this lane.

## Follow-up review after sitemap regeneration

- Read-only reviewed the nine locale/SSR test diffs and `tests/referral-seo.test.mjs` against current publication policy, news summary projection and striking-distance snippet helpers.
- No blocking loss of meaningful coverage found. All 170 beginner editions still exercise Worker/client metadata; ur/uk now explicitly assert noindex and no hreflang. App/radar/tokenized sitemaps explicitly reject the gated editions rather than dropping their checks. SSR root/hydration parity, link counts and summary-only payload restrictions remain.
- Referral exceptions are confined to English Gate.io/Hyperliquid query-first snippets. Their comparisons to shared helpers are wiring checks rather than independent copy tests; independent guarantees remain in `seo-striking-distance.test.mjs` (Gate.io real registry code retained in title) and `seo-wave33-exact-query-intent.test.mjs` / `seo-onpage-gsc-2026-10-22.test.mjs` (Hyperliquid qualified 4% discount, fee facts and funded-account boundaries). The exceptions correctly stop requiring obsolete description codes/shares.
- `cd pilot-01-prototype && node --test --test-reporter=tap --test-timeout=300000 tests/locales-ur-uk.test.mjs > ../.task-evidence/locale/locales-ur-uk.regenerated.tap 2>&1` — PASS: 9 tests, 9 pass, 0 fail, 0 skip; 2.84 seconds.
- Root reported tokenized-stocks passing with regenerated XML in its combined rerun. This lane did not independently repeat it in the follow-up.
