# NexuAlpha SEO / AEO / GEO Audit v2

Status: proposal for owner review. Read-only audit of the live site plus a code read of `origin/main` (23cbdf8). **No site code, SEO field, partner registry, invite code or href was changed.** Prepared 2026-10-08.

> 中文摘要：站点技术底座（canonical、robots、hreflang 互指、JSON-LD 语法、标题唯一性）基本健康；真正的问题是**索引面太大且同质化**（861 个提交 URL 中 624 个是新闻模板页，站内自评 656 个"低差异"），**内链发现能力弱**（从首页按 HTML 链接只能到达 155/861 个 sitemap URL，605 个孤儿页），以及**首屏资源过重**（1.05 MB 阻塞渲染 CSS）。建议：先瘦身索引、修内链、修 CWV，再按 10 个"答案页"做 AEO，全部基于 `docs/data/exchange-facts-20261008.json` 已核验数据。`/{locale}/br` 404 建议 301/308 到 `/br`（低风险，小收益），差异方案见 §3，未应用。

## 0. Method and honesty notes

- **Live evidence (2026-10-08, ~18:00 UTC):** fetched `robots.txt`, `sitemap.xml`, `news-sitemap.xml`, `llms*.txt`, `/content/search-publication-report.json`, `/prerender-manifest.json`, `/route-inventory.json`, then crawled all **861** sitemap URLs (all returned 200) and ~300 internal link targets outside the sitemap. Parsed `<title>`, meta description, robots, canonical, hreflang, `<html lang>`, JSON-LD, `<h1>`, body text and `<a href>`.
- **Link graph caveat:** depth/orphan numbers use links present in the **server-rendered HTML** only. Links that appear after hydration are not counted. Google renders JS, but SSR links are the reliable discovery path, so this is the right conservative measure.
- **Duplication measure:** 5-word shingle Jaccard similarity of `<main>` text (8-character shingles for Chinese). This is a proxy, not Google's algorithm.
- **No GSC/Bing data was available to me.** "~300 indexed / 5 indexed languages" comes from the brief, not from an export. No search volumes are used or invented. Every "impact" below is an **estimate** (directional judgement), not a forecast.
- Facts used for answer pages come only from `docs/data/exchange-facts-20261008.json` and the primary sources cited in `keyword-map-v1.md` / `region-compliance-v1.md`. Anything marked `unverifiable`/`null` there stays unpublished.

## 1. Audit findings

### 1.1 What is healthy (keep, do not churn)

| Check | Result (live) |
|---|---|
| HTTP status of sitemap URLs | 861/861 = 200 |
| robots meta on sitemap URLs | 861/861 `index,follow` |
| Canonical | 861/861 self-referencing, absolute |
| `<h1>` | exactly 1 on all 861 |
| Duplicate `<title>` | **0** duplicates across 861 |
| hreflang | 1,400 alternate pairs checked, **0 non-reciprocal**, 0 missing self-reference, 0 `<html lang>` vs hreflang mismatches |
| Sitemap vs page hreflang | sitemap `xhtml:link` sets match on-page sets (publication-gated, see `scripts/sitemap-publication-policy.mjs`) |
| Non-published locale pages | e.g. `/es/exchanges/binance`, `/fr/rates`, `/es/compare/binance-vs-okx`: `noindex,follow`, self-canonical, no hreflang. Consistent. |
| Unknown routes | `/compare/foo-vs-bar`, `/exchanges/foo`, `/news/does-not-exist`: real 404 + `X-Robots-Tag: noindex,nofollow` (no soft-404) |
| Query-parameter URLs | `/exchanges/binance?market=BR` canonicalises to the clean URL |
| JSON-LD | 1 block per page, 861/861 parse as valid JSON |
| Affiliate links | registration links carry `rel="sponsored noopener noreferrer"` |
| robots.txt | allows all, explicitly allows GPTBot, OAI-SearchBot, ChatGPT-User, PerplexityBot, ClaudeBot, Claude-SearchBot, Google-Extended, Applebot-Extended, Bingbot; lists both sitemaps |
| `/sitemap_index.xml` | 301 to `/sitemap.xml` |
| IndexNow | key file `/b1804ac24a39a342c5a66462430c2106.txt` is served (200) |

### 1.2 Index surface: prerendered vs published vs useful

From `/prerender-manifest.json` (generated 2026-10-08 17:00 UTC) and `/content/search-publication-report.json`:

| | Count |
|---|---|
| Prerendered route-locale documents | **2,270** |
| Published to sitemap (`searchPublished: true`, `index,follow`) | **861** |
| Prerendered but noindex | 1,409 |
| Indexed in Google (brief, unverified) | ~300 |
| Site's own `lowDifferentiationUrlCount` | **656 of 861** (76%) |

Published URLs by template: article (news) **624** (312 EN + 312 zh-Hans), venue 71, comparison 38, factbook 32, topic 26, home 15, regionalPreview 11, brazilDecision 7, others 37.
Published by locale: en 390, zh-Hans 367, ja 27, ko 27, tr 27, pt-BR 8, zh-Hant 5, es 2, id 2, ar/de/fr/it/ru/vi 1 each (home only).

Noindex prerendered documents by template (largest): factbook 328, research (`/activities/research/*`) 315, venue 244, article 208, comparison 131, kolLanding (`/ref/*`) 45, topic 40.

**Reading:** about 72% of the submitted sitemap is news-template content. With ~300 indexed, Google is already choosing; the unindexed remainder is most likely "Crawled/Discovered, currently not indexed" (verify in GSC Pages report). A smaller, stronger set should index at a higher rate and concentrate signals on the money pages.

### 1.3 Thin / duplicate content

| Group | Pages | Median share of text that is shared boilerplate* | Pairs with Jaccard > 0.5 | Max |
|---|---|---|---|---|
| EN news `/news/*` | 312 | 27% | **1,071** | 0.81 |
| zh-Hans news | 312 | 23% | 343 | 0.72 |
| EN factbook `/factbook/*` | 24 | **83%** | 231 of 276 possible | 0.81 |
| EN venue `/exchanges/*` | 21 | 61% | 48 | 0.76 |

\*shingles that appear on more than half the pages in the group.

Examples of near-duplicate pairs: `how-to-create-backpack-exchange-account-…` vs `how-to-register-gate-account-…` (0.81); `aerodrome` vs `raydium` factbook (0.81); `curve` vs `pancakeswap` venue (0.75).

Other duplicate signals:
- **3 meta descriptions reused across 45 zh-Hans news pages** (one boilerplate disclaimer sentence used as the description on 35 pages: "本文只处理可由公开官方或机构来源支撑的决策问题…").
- `/factbook/{slug}` and `/exchanges/{slug}` target the same intent (fees, KYC, regional access) for the same venue: internal cannibalisation.
- Many EN news topics are API/ops checklists (e.g. `binance-test-order-vs-okx-place-order-pretrade-validation-controls`) with weak fit to the CTA funnel and unknown demand.
- Length: 360 titles > 65 chars, 372 descriptions > 165 chars, 162 descriptions < 70 chars (truncation, not a ranking factor; low priority).
- Factbook titles embed a review date (`Binance Source Review Factbook [2026-09-08]`), which goes stale in the SERP.

### 1.4 Internal links, depth, orphans

- From `/` following SSR `<a href>` only, **155 of 861** sitemap URLs are reachable (depth 1: 67, depth 2: 46, depth 3: 39, depth 4: 2).
- **605 sitemap URLs have zero inbound SSR links from any other sitemap page** ("orphans"): 298 EN news, 298 zh-Hans news, plus `/us`, `/tw`, `/id` (country hubs) and the home pages of `/ar`, `/de`, `/fr`, `/it`, `/ru`, `/vi`, `/id-id`.
- `/news` SSR links ~24 articles and has **no pagination**; the other ~290 articles are discoverable only via the sitemap.
- The English home has **no crawlable link to any language version** (`/zh-hans`, `/ja`, …) or to most country hubs (`/us`, `/uk`, `/eu`, `/tw`, `/hk`, `/jp`, `/kr`, `/sg`). The language switcher is JS-only. hreflang still helps, but hubs with no inbound links get little crawl priority.
- Internal links point at noindex pages at scale: `/zh-hans/factbook` and `/zh-hans/topics` (each linked from **366** pages, both noindex), `/ja|ko|tr/{news,topics,partners,factbook}` (27 each), `/compare/coinbase-vs-kraken` (8, noindex though it is a keyword-map P0), `/activities/research/*` (noindex). Equity flows into dead ends.
- 62 links point to `/exchanges/{htx,hashkey,aevo}`, each a 301 to `/factbook/{slug}`; link directly to the final URL.
- Internal links carry tracking parameters (`?market=GLOBAL&product=research`, and on home a `/pt-br/telegram?...&utm_source=telegram&tg_expires=…` link). Canonicals absorb this, but it wastes crawl and pollutes analytics attribution (`utm_*` on internal links overwrites the real source).
- Any `A-vs-B` pair of known venues renders 200 + noindex (`/compare/kraken-vs-mexc`, reversed `/compare/bybit-vs-okx`). That is a large crawlable URL space (roughly N² pairs × 15 locales), a crawl-budget sink.

### 1.5 Structured data

- Syntax valid everywhere. Types used: Organization, WebSite, WebPage, BreadcrumbList, FAQPage, Question/Answer, Dataset, DataDownload, DigitalDocument, ItemList, NewsArticle, CollectionPage.
- `NewsArticle` has no `image` (recommended for Article rich results; 648 nodes).
- Publisher `logo` is an SVG URL (`/brand/nexualpha/nexualpha-round.svg`). A raster PNG of at least 112x112 is the safe choice for Google's logo guidelines.
- `FAQPage` markup is fine to keep for AEO/LLM parsing, but Google has limited FAQ rich results to authoritative government/health sites since 2023, so expect no SERP feature from it.
- Nested author `Organization` nodes lack `logo`/`sameAs` (3,567 nodes). Not an error, but `sameAs` (Telegram, X, GitHub) on the single publisher Organization strengthens entity recognition for GEO.
- `/rates` and `/embed/calculator` use only `WebPage`. `/rates` is the strongest fee-comparison asset and could carry a `Dataset` (or `Table` within `WebPage`) with `dateModified` matching the facts file.

### 1.6 Core Web Vitals risks (lab inference, no CrUX data seen)

| Signal | Evidence | Risk |
|---|---|---|
| Render-blocking CSS | home loads **15** stylesheets; `index-BHD2UcQ5.css` is **1.05 MB raw / 152 KB gzip** | High LCP/FCP risk on mobile |
| Main JS | `index-OZVFX25B.js` 369 KB raw / 128 KB gzip | INP/TBT risk on low-end Android (BR, ID, VN, TR audiences) |
| HTML weight | home 310 KB (42.7 KB gzip), ~3,300 elements; localized homes 255-312 KB | Large DOM: style/layout cost, INP |
| Compression | gzip only, no brotli observed | ~15-20% extra transfer (estimate) |
| Images | 102 `<img>` on home, all with width/height (good for CLS), 91 lazy | OK; check the LCP image is **not** lazy |
| Preload | no `preload` for LCP image or fonts | Possible LCP delay and font swap CLS |

Action: pull CrUX / PageSpeed field data for `/`, `/exchanges/binance`, `/br`, `/compare/binance-vs-okx` before investing; the above are risks, not measured failures.

### 1.7 llms.txt / GEO surface

- `/llms.txt` exists but is **538 KB** (1,456 lines, 898 links); `/llms-full.txt` is 892 KB; `/llms-small.txt` 4.4 KB. The llms.txt convention is a short curated Markdown index; the current file is closer to a dump. Its "Review record date" is **2026-09-08**, older than the 2026-10-08 facts.
- `llms-small.txt` links `/tr/markets/turkiye` (noindex) and `/jp?locale=ja`, `/kr?locale=ko` (query-locale URLs).
- llms files intentionally omit referral/commission terms. Good for trust, but they also omit the **verified fee numbers**, which are what answer engines cite.

### 1.8 Search engine verification (as visible from outside)

| Engine | Evidence | Status |
|---|---|---|
| Google Search Console | DNS TXT `google-site-verification=mPgpknzk_pY8cQ9te93gdq5lWeJWxop0eJ9rH3JiG-Y` on `nexualpha.com`. No HTML meta tag. | **Verified via DNS (Domain property).** Correct method; nothing to add to HTML. |
| Bing Webmaster Tools | No `msvalidate.01` meta, `/BingSiteAuth.xml` = 404, no Bing TXT record | **Not visible.** Could still be verified via "Import from GSC" (not visible externally). |
| IndexNow (Bing, Yandex, Seznam, Naver) | Key file served; `scripts/indexnow-submit.mjs` exists | Key in place; submission cadence unknown |
| Yandex / Baidu / Naver | no tokens | Not verified. Naver matters only if `/ko` is a growth target. |

**What the owner must provide** (I cannot obtain these):
1. GSC export, last 3 months: Performance (queries x pages, by country) and **Pages/Indexing report** (indexed vs "Crawled - currently not indexed" vs "Discovered" lists). This decides the slimming cut-list.
2. Confirm whether Bing Webmaster Tools is set up. If not: sign in, choose **Import from Google Search Console** (no code change), submit `sitemap.xml`. Otherwise give me the `msvalidate.01` token to add (needs approval, SEO field).
3. CrUX/PageSpeed field data access (or permission to run PSI on 5 URLs).
4. A decision on which locales are growth markets (see §2, P1-3).
5. Referral programme confirmations requested in `keyword-map-v1.md` §8.

## 2. Prioritised actions

Effort: S < 1 day, M 1-3 days, L > 3 days (engineering estimate). Impact = estimate.

### P0 (do first: unblock indexing quality and the money pages)

| # | Action | Why (evidence) | Expected impact (estimate) | Effort | Needs SEO-field approval? |
|---|---|---|---|---|---|
| P0-1 | **Index slimming, phase 1** (plan in §2.4): remove ~430-500 news URLs from the sitemap and set them `noindex,follow`; keep ~60-120 high-fit articles per language | 624/861 sitemap URLs are news; 1,071 near-duplicate EN pairs; 596 news orphans | Higher indexed ratio of kept pages; crawl shifts to venue/compare/rates. Medium to high | M | **Yes** (robots + sitemap policy) |
| P0-2 | **Consolidate `/factbook/{slug}` into `/exchanges/{slug}`** for venues that have both: factbook becomes a `#sources` section, `/factbook/{slug}` 301s to `/exchanges/{slug}#sources`; factbook-only venues (htx, hashkey, aevo) stay | Factbook 83% boilerplate; same intent as venue page; cannibalisation | One stronger page per venue. Medium | M | **Yes** |
| P0-3 | **Crawlable links to every indexable hub**: footer block with plain `<a>` to the 15 language homes and the country hubs (`/br /mx /us /uk /eu /sg /tw /hk /jp /kr /id`); `/news` pagination (`/news?page=2` or `/news/page/2`, self-canonical) or topical news hubs | 155/861 reachable from home; 605 orphans; language homes and `/us`,`/tw`,`/id` orphaned | Discovery and crawl priority for hubs. Medium | S-M | No (links only); pagination URLs need approval |
| P0-4 | **Stop linking into noindex dead ends**: hide or retarget links to `/zh-hans/factbook`, `/zh-hans/topics`, `/{ja,ko,tr}/{news,topics,partners,factbook}` until those hubs are indexable; link to final URLs instead of the htx/hashkey/aevo 301s | 366 + 4x27 + 62 links | Recovers internal equity. Low-medium | S | No |
| P0-5 | **Ship the 3 highest-fit answer blocks on existing indexed pages** (§4 #1 Hyperliquid fees, #3 OKX vs Bybit, #2 cheapest base spot fees on `/rates`): a 40-60 word direct answer, a dated fee table and source link at the top | Hyperliquid fees is an existing GSC query; data verified 2026-10-08 | Best chance of first clicks and AI citations. Medium | S each | Copy is content, but titles/descriptions stay locked |
| P0-6 | **Render-blocking CSS diet**: split the 1.05 MB `index-*.css` per route, inline critical CSS, preload the LCP image, enable brotli at nginx | §1.6 | CWV pass rate on mobile (estimate); also crawl efficiency | M | No |

### P1 (next 2-4 weeks)

| # | Action | Evidence | Impact (est.) | Effort | Approval |
|---|---|---|---|---|---|
| P1-1 | `/{locale}/{country}*` → `/{country}*` redirect (§3) | 404 on `/es/br`, `/pt-br/br/pix`, `/ja/jp`, `/es/mx`, `/zh-hans/us` | Small; UX and stray external/AI links | S | Routing change (no SEO fields) |
| P1-2 | **Canonical pair order for comparisons**: 301 reversed pairs (`/compare/bybit-vs-okx` → `/compare/okx-vs-bybit`); for non-curated pairs keep noindex but stop linking them, or 404 pairs with no page content | N² crawl space | Crawl budget. Low-medium | S-M | Yes |
| P1-3 | **Locale focus decision**: index fully only where content is reviewed and the market fits compliance: EN, zh-Hans, pt-BR (`/br`), es (`/mx`). For ar/de/fr/it/ru/vi/id keep only the home page indexed (current state) or noindex it too until there is reviewed content; tr/vi/id stay info-only per `region-compliance-v1.md` | 9 locales publish 1 URL each; their homes are orphans | Focus. Low-medium | S | Yes |
| P1-4 | **Promote `/compare/coinbase-vs-kraken`** into `CURATED_COMPARISONS` (currently noindex, 8 inbound links, keyword-map P0) once Coinbase facts are verified (currently `unverifiable`) | facts file | New ranking target | S | Yes |
| P1-5 | Remove from sitemap and noindex: `/embed/calculator` (161 words, widget), `/partners` (399 words). Keep `/onchain` only if it gains unique content (400 words) | §1.4 counts | Removes thin pages. Low | S | Yes |
| P1-6 | **Strip `utm_*`/`tg_*` from internal hrefs**; carry attribution in `data-*` attributes or first-party events instead | §1.4 | Clean crawl and analytics | S | No (do not change partner hrefs) |
| P1-7 | Unique meta descriptions for the 45 zh-Hans news pages sharing 3 descriptions; drop the review date from factbook titles | §1.3 | CTR hygiene. Low | S | **Yes** |
| P1-8 | **Rebuild `llms.txt` as a <=30 KB curated index** (§5); move the bulk to `llms-full.txt`; refresh the review date; add a `facts.json`/CSV link for the fee table | §1.7 | GEO citation quality. Medium (estimate) | S | No (not an SEO field in code) |
| P1-9 | Bing Webmaster Tools import from GSC plus a sitemap submit; confirm IndexNow runs after each deploy | §1.8 | Bing/Copilot/DuckDuckGo coverage; ChatGPT search relies partly on Bing. Low-medium | S (owner) | No |
| P1-10 | `/topics/no-kyc` H1 names specific venues ("Crypto access without KYC: Hyperliquid, dYdX and MEXC"). Reframe it as an informational risk explainer to stay within region-compliance "no circumvention guidance" | `region-compliance-v1.md` §1 Must-not 6 | Avoids a trust/compliance liability on an indexed page | S | Yes (H1/title) |

### P2 (later / opportunistic)

| # | Action | Notes |
|---|---|---|
| P2-1 | `NewsArticle.image` (1200 px wide), PNG publisher logo, `sameAs` on the publisher Organization | §1.5 |
| P2-2 | `/rates` structured data as `Dataset` with `dateModified` = facts `as_of`, plus CSV/JSON download of the verified fee table | AEO/GEO citation asset |
| P2-3 | Title/description length pass (360 long titles) | cosmetic, after slimming |
| P2-4 | Stop publishing `/route-inventory.json` and `/prerender-manifest.json` publicly (537 KB, reveals internal route policy) | hygiene |
| P2-5 | Empty `news-sitemap.xml` (0 URLs, listed in robots.txt): keep only if fresh news will flow; otherwise remove from robots.txt | hygiene |
| P2-6 | Naver Search Advisor only if `/ko` becomes a target | §1.8 |

### 2.4 Index-slimming plan (proposal only; SEO fields are locked until approval)

Target: shrink the sitemap from **861 to roughly 230-330 URLs** (estimate), concentrated on commercial and answer intent. Every removed URL stays reachable (`noindex,follow`, or a 301 where consolidated). Nothing is deleted.

| Route class | Now in sitemap | Proposal | After (est.) |
|---|---|---|---|
| Home x 15 locales | 15 | Keep en, zh-Hans, pt-BR, es, ja, ko, zh-Hant; for ar/de/fr/it/ru/vi/id/tr decide per P1-3 (default: keep, add inbound links) | 7-15 |
| `/exchanges/{slug}` (en + zh-Hans + ja/ko/tr priority) | 71 | Keep. Absorb factbook (P0-2). DEX long-tail venues (aerodrome, curve, raydium, pancakeswap, gmx) stay in EN only | ~55-65 |
| `/factbook/{slug}` | 32 | 301 to `/exchanges/{slug}#sources` where a venue page exists; keep htx/hashkey/aevo | 3-6 |
| `/compare/*` curated | 38 | Keep; add coinbase-vs-kraken when facts are verified; 301 reversed pairs | 38-45 |
| `/topics/*` | 26 | Keep compliant-exchanges, derivatives, no-kyc (reframed), tokenized-assets; review meme-coins, tokenized-* for fit | 15-26 |
| `/news/*` EN | 312 | Keep ~60-120 with search or CTA fit: how-to-register / KYC / withdrawal / fee / "vs" topics, and any URL with GSC impressions. **Consolidate** near-duplicate families (Jaccard > 0.6) into one canonical article each and 301 the rest. Noindex API-ops checklists without impressions | 60-120 |
| `/news/*` zh-Hans | 312 | Mirror the EN keep-list; respect the policy default `zhHansArticleLimit: 30` as the floor for the first cut, expand on evidence | 30-120 |
| `/br/*` | 7 | Keep (strongest local asset) | 7 |
| Regional previews (`/mx /us /uk /eu /sg /tw /hk /jp /kr /id`) | 11 | Keep those with >1,500 words (`/us /uk /eu /sg /mx /id /kr`); `/jp` (424 words), `/hk` (714), `/tw` (864) noindex until expanded | 7-11 |
| Utility (`/embed/calculator`, `/partners`, `/onchain`, `/telegram`, `/activities`, `/methodology`, `/rates`, `/exchanges`, `/news`, `/topics`, `/factbook`) | ~25 | Keep `/rates`, `/exchanges`, `/methodology`, `/news`, `/activities`; noindex `/embed/calculator`, `/partners`; `/telegram` and `/onchain` en-only | ~10-15 |

Rules for the cut:
1. **Never noindex a URL that has GSC clicks or >=10 impressions in the last 90 days without owner sign-off** (needs the export). Put those on a protected list in `config/search-publication-baseline.json` (`protectedIndexedUrls` already exists for this).
2. Record each removal in `historicalIndexedUrlDispositions` (`accessible_noindex` or `redirected_legacy`), which the policy script already supports.
3. Change in two waves 2-3 weeks apart and watch GSC "Indexed" and impressions per class; roll back a class if impressions drop more than 20% without a matching gain elsewhere (threshold is a judgement).

## 3. `/{locale}/br` 404: evidence and recommendation

### Evidence (live, 2026-10-08)

| URL | Status |
|---|---|
| `/br`, `/br/pix` | 200 |
| `/es/br`, `/pt-br/br`, `/zh-hans/br`, `/ar/br`, `/es/br/pix`, `/pt-br/br/pix`, `/id-id/br/pix` | **404**, `X-Robots-Tag: noindex,nofollow` |
| Same pattern for other countries: `/es/mx`, `/ja/jp`, `/zh-hant/tw`, `/es/us`, `/zh-hans/us`, `/ko/kr` | **404** |

Code path (`worker/index.js` ~L2808 `parsePublicRoute`, ~L2847 `legacyLocaleRedirect`; mirror in `src/data/locale-routing.js` L159, L267):
- `/es/br` has a locale first segment (`es`), but the remainder `/br` is a country route, so `isLocalePathEligible("/br")` is false. The parser falls through to `localeSource: "default"` with `contentPathname: "/es/br"`.
- `legacyLocaleRedirect` only acts on `zh-cn/*`, on a `?locale=` query, or on `/br?locale≠pt-BR`. None match, so no redirect; the asset lookup misses and the worker serves the 404 shell.
- The site itself never links to these URLs: 0 occurrences in the crawl of 861 pages. The in-app language switcher builds `/br?locale=xx`, which already redirects to `/br`. These URLs come from humans guessing, external links, or LLM-generated links. GSC/log counts were not available to me.

hreflang on `/br` (live): `pt-BR → /br`, `x-default → /br` (two-member set; `/br/pix` the same). `/pt-br` (language home) separately declares `pt-BR → /pt-br` inside the 15-locale home cluster. The two clusters do not reference each other, so there is no reciprocity error, but **two different URLs both claim pt-BR for Portuguese Brazil.** Keep `/br` as the Brazil owner and make `/pt-br` link prominently to `/br` (it already does); do not merge the clusters without GSC evidence of cannibalisation.

### Recommendation: yes, redirect (P1, low risk, small gain)

Redirect `/{localePrefix}/{countryPrefix}(/rest)` to `/{countryPrefix}(/rest)` in one hop, keeping the same preserved params (`utm_*`, `market`, `product`, `gclid`…), and dropping the locale. Reasons:
- The country route owns its language (`/br` is pt-BR by design; `localizedPath` deliberately never prefixes country routes). The redirect target is the canonical, indexable URL, so there is no duplicate or hreflang conflict.
- It turns dead external/AI links into equity for `/br`, the site's strongest local asset.
- It matches the existing behaviour for `/br?locale=xx → /br`.
- Risk is low: it only fires when the remainder is a country prefix; locale-eligible paths are untouched; the target never redirects again (checked). Status: the existing handler sends **308** (permanent, method-preserving; Google treats 301 and 308 the same). Keep 308 for consistency, or change that one return to 301 if the owner prefers.
- Not P0: nothing links to these URLs internally, so the traffic at stake is probably small (estimate). Pull the 404 report from GSC or nginx (`scripts/audit-traffic-404.mjs`) to size it.

### Proposed diff (NOT applied)

`pilot-01-prototype/src/data/locale-routing.js`

```diff
@@ export function legacyLocaleRedirect(url) {
       return `${localizedPath(contentPathname, "zh-Hans")}${preserved}`;
     }
   }
+  // /{locale}/{country}/... was never rendered (country routes own their
+  // language) and returned 404. Send it to the country owner, one hop.
+  const segments = String(parsed.pathname || "").split("/").filter(Boolean);
+  if (segments.length >= 2 && LOCALE_CODE_BY_PREFIX[segments[0].toLowerCase()]) {
+    const remainder = normalizePathname(`/${segments.slice(1).join("/")}`);
+    if (countryPrefixForPath(remainder)) {
+      return `${remainder}${preservedRedirectSearch(parsed.searchParams)}`;
+    }
+  }
   const route = parsePublicRoute(parsed.pathname, parsed.searchParams);
   const queryLocale = parsed.searchParams.get("locale");
```

`pilot-01-prototype/worker/index.js` (the live request path; same logic, helpers `LOCALE_CODE_BY_PREFIX` L2414, `normalizePathname` L2775 and `countryPrefixForPath` already exist)

```diff
@@ function legacyLocaleRedirect(url) {
     const preserved = preservedRedirectSearch(url.searchParams);
     return `${localizedPath(contentPathname, "zh-Hans")}${preserved}`;
   }
+  const segments = String(url.pathname || "").split("/").filter(Boolean);
+  if (segments.length >= 2 && LOCALE_CODE_BY_PREFIX[segments[0].toLowerCase()]) {
+    const remainder = normalizePathname(`/${segments.slice(1).join("/")}`);
+    if (countryPrefixForPath(remainder)) return `${remainder}${preservedRedirectSearch(url.searchParams)}`;
+  }
   const route = parsePublicRoute(url.pathname, url.searchParams);
```

`pilot-01-prototype/tests/locale-routing.test.mjs` (new test)

```js
test("locale-prefixed country routes redirect once to the country owner", () => {
  assert.equal(legacyLocaleRedirect("https://nexualpha.com/es/br"), "/br");
  assert.equal(legacyLocaleRedirect("https://nexualpha.com/pt-br/br/pix?utm_source=x&y=1"), "/br/pix?utm_source=x");
  assert.equal(legacyLocaleRedirect("https://nexualpha.com/ja/jp"), "/jp");
  assert.equal(legacyLocaleRedirect("https://nexualpha.com/id-id/id"), "/id");
  assert.equal(legacyLocaleRedirect("https://nexualpha.com/es/exchanges/binance"), null);
  assert.equal(legacyLocaleRedirect("https://nexualpha.com/tr/markets/turkiye"), null);
  assert.equal(legacyLocaleRedirect("https://nexualpha.com/br"), null); // no loop
});
```

Dry run: I applied the `src/data` change to a scratch copy only and ran 13 cases, including loop checks, `/ZH-HANS/us`, `/es/brand/x.png` (unchanged) and the existing zh-CN and `/br?locale=ar` behaviour, all as expected. The existing `locale-routing` and `r106-country-english-routing` suites passed against the patched copy (11/11). `r105` could not run from the scratch location because of unrelated relative imports; run the full `npm run test:sites` in the real tree before merging.

## 4. AEO content plan: 10 answer pages

Rules: each page opens with a 40-60 word direct answer, then a dated fee or eligibility table, the official source link, a "checked on" date, the commission disclosure next to any CTA, and the region gate from `region-compliance-v1.md`. Values below are copied from `docs/data/exchange-facts-20261008.json` (`as_of` 2026-10-08, percent). The facts file uses slug `gate`; the site uses `gate-io`. Prefer upgrading existing indexed URLs over creating new ones, because new URLs need approval.

| # | Answer page (query family) | Target URL | Verified data to use | Blockers / do-not-publish | Keyword-map rows | Pri |
|---|---|---|---|---|---|---|
| 1 | **Hyperliquid fees** ("hyperliquid fees", "hyperliquid referral discount") | `/exchanges/hyperliquid` (exists, indexed, GSC query) | Perp tier 0 maker 0.015 / taker 0.045; spot 0.04 / 0.07; HYPE staking discount 5/10/15/20/30/40% at >10/>100/>1k/>10k/>100k/>500k HYPE. Referral: 4% off the first $25M (keyword-map §5, Hyperliquid docs) | Facts file says the referral % is "not stated on page"; cite the referrals doc separately with its own date | 101-103, 110 | P0 |
| 2 | **Cheapest base spot fees** ("lowest crypto exchange fees", "binance vs okx vs bybit fees") | `/rates` (exists, indexed) | Spot maker/taker: OKX 0.08/0.10; Binance 0.10/0.10 (BNB -25%); Bybit 0.10/0.10; Bitget 0.10/0.10; Gate 0.10/0.10 (GT 0.09/0.09); Hyperliquid 0.04/0.07; MEXC maker 0.00, taker 0.00-0.05 by pair | Kraken spot 0.40/0.80 flagged for re-check (keep "Not yet checked", as live already does); Coinbase, KuCoin, HTX unverifiable, so show as unverified, never as a number | 3, 13, 23, 33, 73 | P0 |
| 3 | **OKX vs Bybit fees** | `/compare/okx-vs-bybit` (exists) | Spot 0.08/0.10 vs 0.10/0.10; perp 0.02/0.05 vs 0.02/0.055. Availability: OKX restricted list vs Bybit excluded list (region-compliance §3) | Bybit perp row not labelled USDT; say "Perpetual & Futures row" | 14, 25 | P0 |
| 4 | **Binance vs OKX fees** | `/compare/binance-vs-okx` (exists) | Spot 0.10/0.10 (BNB -25%) vs 0.08/0.10; BNB futures discount 10%; OKX perp 0.02/0.05 | Binance perp base rate is null, so write "Binance does not publish a base futures rate we could verify" | 5, 15 | P0 |
| 5 | **Bybit vs Bitget fees** | `/compare/bybit-vs-bitget` (exists) | Spot both 0.10/0.10; perp 0.02/0.055 vs 0.02/0.06; Bitget prohibited list includes US, CA, FR, DE, AT, JP, SG | BGB and MNT discount % not retrieved, so no number | 24, 34 | P1 |
| 6 | **Perp DEX vs CEX futures fees** ("hyperliquid vs binance futures fees", "cheapest perpetual futures fees") | `/topics/derivatives` (exists, 5 locales) | Hyperliquid 0.015/0.045; OKX 0.02/0.05; Gate 0.02/0.05; Kraken Futures 0.02/0.05; Bybit 0.02/0.055; Bitget 0.02/0.06 | Binance, MEXC, KuCoin, HTX perp null, so list as unverified. Leverage-promotion limits per region (UK, BR, US) apply | 105, 106 | P1 |
| 7 | **Is Gate.io available in the US?** | `/exchanges/gate-io` (exists) | Gate user agreement cl. 2.5 restricted list: US, UK, CA, FR, DE, ES, NL, AT, IN, ID, VN, AE, … (region-compliance §3); spot 0.10/0.10, perp 0.02/0.05 | No CTA for restricted visitors; list is "non-exhaustive", so say so | 69, 63 | P0 |
| 8 | **Is Bybit available in the US / UK?** | `/exchanges/bybit` (exists) | Bybit excluded list incl. US; France exit 2 Aug 2024; UK relaunch 19 Dec 2025 via an FCA-authorised firm's approval, Bybit says it is not FCA-authorised (keyword-map stubs #29, #30) | UK default is info-only, no bonus language (FCA incentive ban) | 29, 30 | P0 |
| 9 | **Is MEXC legit?** | `/exchanges/mexc` (exists) | Liechtenstein FMA warning 28 Feb 2024 (primary); fee page: spot maker 0.00%, taker range by pair; MX deduction 20% | Facts status `unverifiable`; terms page 404. **Information only, no CTA**, risk text prominent | 77, 78 | P1 |
| 10 | **Binance ou OKX no Brasil: taxas, Pix e derivativos** (pt-BR region guide) | `/br/comparar` (exists, indexed) | Spot 0.10/0.10 vs 0.08/0.10; OKX restricts Brazil derivatives and P2P (OKX disclosure page); Binance–CVM 2020 bar and Aug 2024 settlement; BCB Res. 519/520 effective 2 Feb 2026, filing deadline ~30 Oct 2026 | Date-stamp authorisation status (it changes within weeks); counsel items in region-compliance §5.6 | 9 (+ §7 pt-BR) | P0 |

Already covered and worth a light refresh rather than a new page: "uniswap fees" / "uniswap testnet" on `/exchanges/uniswap` (facts: Uniswap Labs interface fee 0% as of 2025-12-27; pool tiers from the Uniswap docs cited in keyword-map §5).

Answer block template (use on all ten):

```
Q: {exact query phrasing}
A (40-60 words): {answer with the numbers, the scope (tier/product) and "checked {as_of}"}
Table: venue | product | maker | taker | tier | source | checked
Caveat line: "Rates change; your tier, region and token-discount settings decide what you actually pay."
Disclosure beside CTA: "Ad: NexuAlpha earns a commission if you open an account through this link."
```

Measurement: track each row as a GSC query group (impressions and average position for 8 weeks, not clicks), and log AI citations monthly with the existing `docs/evidence/ai-citation-baseline-*` method.

## 5. GEO tactics (generative engines)

1. **Slim `llms.txt`** (P1-8): at most ~30 KB with H1, a one-paragraph summary, then curated sections: *Fees (verified 2026-10-08)* with an inline Markdown table of the verified maker/taker rows; *Comparisons* (10 curated URLs); *Region guides* (`/br`, `/mx`, `/us`, `/uk`, `/eu`); *Method* (`/methodology`); *Optional* (`llms-full.txt`). Make the review date match the facts file. Drop query-locale and noindex URLs.
2. **Publish the facts as a citable dataset**: `/research/exchange-fees-2026-10-08.json` and `.csv` (from the facts file, verified rows only, nulls kept as null), linked from `/rates`, `llms.txt` and each answer page, with `Dataset` JSON-LD. LLMs cite stable, dated, machine-readable tables.
3. **Lead with the factual sentence**: put the number, scope and date in the first 1-2 sentences of every answer page, phrased as a stand-alone quotable claim ("At tier 0, Hyperliquid charges 0.045% taker and 0.015% maker on perpetuals (Hyperliquid docs, checked 2026-10-08).").
4. **Visible citations**: an outbound link to the official fee or terms page next to every number (already the pattern on `/compare/okx-vs-bybit`); keep `rel="noopener"` without `nofollow` on source links.
5. **Entity consistency**: one publisher Organization with `name`, `url`, PNG `logo`, and `sameAs` (Telegram bot or channel, X, GitHub if public); the same "NexuAlpha Research Desk" byline and `/methodology` link everywhere.
6. **Freshness signals that are true**: `dateModified` only when facts change (the policy script already avoids build-date lastmod; keep it that way).
7. **Crawler access is already open** (robots allows GPTBot, OAI-SearchBot, PerplexityBot, ClaudeBot, Google-Extended). Do not add per-bot blocks; check after each deploy that the CSS/JS diet does not move answer text into client-only rendering.
8. **Bing coverage** (P1-9) matters for GEO, because several assistants ground on Bing results.

## 6. Top 10 recommendations (summary)

1. **P0-1** Cut the sitemap from 861 toward ~230-330 URLs: noindex or consolidate the near-duplicate news families (624 news URLs, 1,071 near-duplicate EN pairs), protecting anything with GSC impressions.
2. **P0-2** Merge `/factbook/{slug}` (83% boilerplate) into `/exchanges/{slug}#sources` with 301s.
3. **P0-3** Add crawlable links to language homes, country hubs and paginated news (only 155/861 URLs reachable from home; 605 orphans).
4. **P0-4** Stop linking 366 pages into the noindex `/zh-hans/factbook` and `/zh-hans/topics` hubs and other noindex dead ends; link 301 targets directly.
5. **P0-5** Ship answer blocks on `/exchanges/hyperliquid`, `/rates`, `/compare/okx-vs-bybit` from verified facts first.
6. **P0-6** Split or inline the 1.05 MB render-blocking CSS, preload the LCP image, enable brotli.
7. **P1-1** Redirect `/{locale}/{country}*` to `/{country}*` (diff in §3; low risk).
8. **P1-8** Rebuild `llms.txt` as a short curated index with the verified fee table and a dated JSON/CSV dataset.
9. **P1-9** Set up Bing Webmaster Tools (import from GSC); GSC is already DNS-verified.
10. **P1-3 / P1-10** Pick focus locales (en, zh-Hans, pt-BR/`/br`, es/`/mx`) and reframe `/topics/no-kyc` to stay inside the compliance rules.

Owner inputs needed: GSC Performance and Pages exports (90 days), Bing status, CrUX/PSI access, the locale-focus decision, and approval for every item marked "Needs SEO-field approval".
