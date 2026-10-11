# NexuAlpha technical SEO + GEO audit — 2026-10-11

Scope: https://nexualpha.com, live production, fetched 2026-10-11 14:10–14:45 UTC with curl (≤ 2 req/s, generic audit UA plus Googlebot/GPTBot UA spot checks). Audit only: no code, content, server or settings were changed. Repo references are to `/Volumes/致态2TB/nexualpha-site-git/pilot-01-prototype` unless stated.

Skills applied: `seo-technical`, `seo-hreflang`, `seo-schema`, `seo-sitemap`, `geo-crawlers`, `geo-llmstxt`, `geo-citability` (home + `/exchanges/okx` + `/exchanges/bitget` + 5 articles), `seo-content` (home, `/exchanges/okx`, one new-lane article and one legacy article). The skills' helper scripts (`claude-seo …`) are not installed in this environment, so every check below was done by hand from raw HTML/XML. PageSpeed Insights returned "quota exceeded", so **no Core Web Vitals field or lab data was measured**.

Scores are heuristics from the skills' rubrics, not Google signals.

Context respected (not reported as problems): 15 locales with prefix routing; intentional `noindex` on locale article pages without a native edition; `rel="sponsored"` partner links and commission disclosure; home hero A/B cookie (verified: Googlebot and GPTBot UAs get variant `a`, and `<title>`, meta description and canonical are identical across variants — only the hero H1 wording differs).

---

## Ranking method

Priority = expected traffic impact (H/M/L) × effort (S/M/L). Ordered high impact / low effort first. "Verified" = observed directly on the live site with the evidence given. "Possible" = plausible but not proven with the data available (no GSC, no CWV, no SERP data in this session).

| # | Finding | Type | Impact | Effort | Confidence |
|---|---|---|---|---|---|
| 1 | Conflicting hreflang sets for 113 URLs between `sitemap.xml` and `locale-sitemap.xml` | Verified | High | S | High |
| 2 | `NewsArticle` JSON-LD has no `image` (and no Person author) | Verified | Med-High | S | High |
| 3 | Sitemap `<lastmod>` is the build date for non-article pages | Verified | Medium | S | High |
| 4 | 336 indexable locale news listing pages mostly link to noindexed articles | Verified | Medium | S-M | High |
| 5 | Article template puts ~160–200 words of boilerplate under an H2 before "The short answer" | Verified | Medium (GEO) | S | High |
| 6 | Placeholder / "pending" / internal-spec copy is server-rendered on money pages | Verified | Medium | S-M | High |
| 7 | Read time inflated ~3× on legacy articles | Verified | Low-Med | S | High |
| 8 | Named AI-bot groups in robots.txt do not inherit `Disallow: /go/` | Verified | Low-Med | S | High |
| 9 | llms.txt omits the site's core answer (referral codes/rebates), carries internal jargon, no summary blockquote | Verified (impact uncertain) | Low-Med (GEO) | S | Med |
| 10 | Legacy article library (~599 EN articles) is templated, low-demand, answer-last | Verified pattern | High | L | Med-High |
| 11 | Organisation-only authorship; About page has no named people / legal entity | Verified | Medium | M | Med |
| 12 | Short, first-sentence meta descriptions; some titles > 60 chars | Verified | Low | S | Med |
| 13 | `/embed/calculator` is indexable and in the sitemap | Verified | Low | S | High |
| 14–18 | Possible issues (regional page clusters, home weight/CWV, noindex+cross-canonical, SSR-empty live modules, Content-Signal/HSTS) | Possible | Low-Med | — | Low-Med |

---

## Verified issues

### 1. Conflicting hreflang between sitemaps for 113 URLs — High impact, small effort

**Evidence**
- 281 URLs appear in more than one sitemap; for 113 of them the `xhtml:link` alternate sets differ.
- Example `https://nexualpha.com/compare/binance-vs-bybit`:
  - `sitemap.xml`: alternates `en, ja, ko, tr, zh-Hans, x-default` (6)
  - `locale-sitemap.xml`: alternates for all 15 locales + `x-default` (16)
  - Page HTML: 16 `hreflang` links (matches locale-sitemap). All 14 locale alternates checked live return 200, `index,follow`, self-canonical.
- Same pattern on `/activities`, `/compare/binance-vs-okx` and the other compare/venue routes.

**Why it matters**: Google merges hreflang from HTML and every sitemap. Contradictory sets for the same `<loc>` are a mixed signal on exactly the pages with the most commercial value in es/pt-BR/fr/de/it/ru/ar/id/vi markets; the smaller set omits 10 locales.

**Fix**: emit hreflang for a URL from one source only. Either drop these URLs from `sitemap.xml` (they're owned by `locale-sitemap.xml`), or generate `sitemap.xml` alternates from the same locale map as the page/worker. Generators: `scripts/update-news-seo.mjs` (`mergeSitemap`, `publicationAlternates`, ~L137, L312) for `sitemap.xml`; `worker/index.js` `handleLocaleSitemap` for `locale-sitemap.xml`. Add a test that asserts identical alternate sets per `<loc>` across all four sitemaps (`tests/locale-sitemap.test.mjs` is the natural place).

### 2. `NewsArticle` structured data lacks `image`; author is only an Organisation — Med-High impact, small effort

**Evidence**: on all 5 sampled articles (e.g. `/news/how-to-sign-up-okx-referral-code-nexu888-fee-rebate`) the `NewsArticle` node has `headline, description, datePublished, dateModified, mainEntityOfPage, inLanguage, author, publisher, reviewedBy, isAccessibleForFree, hasPart, citation, relatedLink` but **no `image`**, even though a 1200×630 `og:image` exists at `/og/news/<slug>.png`. `author` is `Organization` "NexuAlpha Research Desk".

**Why it matters**: the site submits a Google News sitemap (102 items, last 2 days), so Top Stories/Discover eligibility matters; Google's Article docs recommend `image` (high-res, multiple ratios), and Discover relies on a large image. Missing image is the cheapest fix in this audit.

**Fix**: in `src/data/seo-injection.js` (~L2365, the `NewsArticle` builder) add `image: ["https://nexualpha.com/og/news/<slug>.png"]` (ideally also 1:1 and 4:3 crops). See #11 for the author question.

### 3. Sitemap `<lastmod>` = build date for non-article pages — Medium impact, small effort

**Evidence**: in `sitemap.xml`, 317 of 1,472 entries carry `2026-10-11` (today), including `/`, `/methodology`, `/exchanges/okx`, `/ja/exchanges/okx`, etc. The `/exchanges/okx` page's own JSON-LD says `"dateModified": "2026-09-15"`. All 1,472 entries also carry `<changefreq>`/`<priority>` (ignored by Google).

**Why it matters**: Google only uses `lastmod` when it is consistently accurate. Uniformly "today" values teach it to ignore the field, which slows recrawl of the articles that really did change.

**Fix**: `scripts/update-news-seo.mjs` L343 falls back to `generatedDate` for non-article paths — use the page's real content date (venue `dateModified`, factbook review date) or omit `lastmod`. Optionally drop `changefreq`/`priority`.

### 4. Indexable locale news listings that mostly point at noindexed articles — Medium impact, small–medium effort

**Evidence**
- `news-library-sitemap.xml` lists 56 listing URLs per locale for `es, pt-br, ru, tr, id-id, vi, zh-hans` (+56 EN) — 336 non-EN/non-zh listing URLs, all `index,follow` with self-canonicals (e.g. `/es/news/page/2` "Página 2 de 27", `/ru/news/page/3`, `/vi/news/category/guide`).
- `/es/news` links to 24 `/es/news/<slug>` articles: **23 are `noindex,follow`**, one is indexable.

**Why it matters**: these are thin hub pages whose main content is links to pages Google is told not to index — index bloat and wasted crawl on 336 URLs, and a weak quality signal for the locale sections.

**Fix** (pick one): (a) in non-native locales, list only native-edition articles and link the rest to the EN canonical; (b) `noindex,follow` locale listing pages beyond page 1 while native coverage is thin, and drop them from `news-library-sitemap.xml`. Code: `scripts/update-news-seo.mjs` (`buildNewsSeoFiles`), `src/components/v3/news/NewsListPage.jsx`.

### 5. Article template pushes the answer below a boilerplate H2 — Medium (GEO) impact, small effort

**Evidence**: every sampled article opens with the H2 **"Before you act on this market update"** (generic text, a "View Profile" partner card and a rebate widget: 159–202 words) **before** "The short answer" (`/news/coldcard-…`, `/news/trump-memecoin-…`, `/news/how-to-sign-up-okx-…`). Article tail adds three more generic H2s ("Mentioned Exchange Profiles", "Continue this research in the NexuAlpha Bot", "Continue with a venue decision").

**Why it matters**: answer engines and featured snippets favour the first passage under the H1. A generic H2 there is the most-repeated passage on the site and dilutes every article's heading outline.

**Fix**: render the short answer directly after the byline; turn the "Read this first" block into an `<aside>` without a heading (or move it after the answer); make the tail CTAs non-heading elements. `src/components/v3/news/NewsDetailPage.jsx` (`firstDecisionTitle` etc.) and `news-detail-copy-l10n.js`.

### 6. Placeholder, "pending" and internal-spec text in server-rendered money pages — Medium impact, small–medium effort

**Evidence (raw HTML, i.e. what crawlers and AI fetchers see)**
- Home: "Crypto Fear & Greed Index … Data unavailable — Data status: no verified live feed yet…" (`MarketFearGreedPanel.jsx`); 12 campaign cards each saying "Welcome campaign status Pending official-source review" (`CampaignRadar.jsx`); funding-rate table SSR'd as "— — —" with `aria-busy="true"`; an H3 "Answer the question before the Telegram handoff" whose body reads like a product spec ("Telegram visitors get a clear onsite path first…", `TelegramBotHub.jsx`).
- `/exchanges/okx` (same template on `/exchanges/bitget`): "Solvency & PoR Pending official-source verification", "Total Reserve Ratio Pending…" (`VenueDetailResearch.jsx`), "No reviewed, current activity is publishable." (`src/data/v3-product.js`), an empty H3 "Account and costs", "0/4 checked" interactive state.
- Legacy articles: empty H2 "Control Notes"; body copy says "In this package, it means…".

**Why it matters**: quality raters and LLM extractors read these as unfinished or low-value content on the pages that should rank and get cited for "OKX referral code", "Bitget fees", etc.

**Fix**: don't render modules with no verified data in SSR (render nothing, or one neutral line); remove empty headings; rewrite internal-spec copy in user language.

### 7. Read time inflated ~3× on legacy articles — Low-Med impact, small effort

**Evidence**: `/news/binance-order-amend-keep-priority-api-readiness-checklist` 1,220 words → "16 min"; `/news/aave-vs-lido-…` 1,541 words → "21 min"; `/news/how-to-compare-crypto-exchange-fee-schedules-…` 1,658 words → "15 min". New-lane articles are fine (2,066 words → "7 min").

**Cause**: `scripts/import-nexualpha-content.mjs` L148 — `Math.ceil(Math.max(enWords / 220, zhChars / 450))`, so the EN page shows the Chinese edition's reading time.

**Fix**: compute read time per locale from that locale's body. Re-import the stored `readTime` values.

### 8. Named AI-bot groups don't inherit `Disallow: /go/` — Low-Med impact, small effort

**Evidence**: `robots.txt` has `User-agent: GPTBot` / `ClaudeBot` / `PerplexityBot` / `OAI-SearchBot` / `Google-Extended` / `Bingbot` … each with only `Allow: /`. Only `User-agent: *` has `Disallow: /go/`. Crawlers obey only the most specific matching group, so these bots may fetch `/go/okx` (302 → `https://www.okx.com/join/nexu888`).

**Why it matters**: bot hits on `/go/*` can inflate partner-click and CTA analytics, and Bingbot gets the same exemption.

**Fix**: add `Disallow: /go/` under every named group in `public/robots.txt` (or merge them into one multi-`User-agent` group). Optionally add `Content-Signal: search=yes, ai-input=yes, ai-train=…` per the owner's stance.

### 9. llms.txt: misses the core answer, carries internal jargon — Low-Med (GEO) impact, small effort; impact uncertain

**Evidence** (`/llms.txt`: 200, 324 lines / 83 KB; `/llms-full.txt` 892 KB; `/llms-small.txt` exists; all 163 internal links return 200):
- It states: "Commercial terms, referral codes, commissions, rebates and welcome offers are omitted from this machine-readable layer", and calls the site "a neutral research directory". The home title is "Crypto Exchange Referral Codes & Fee Rebates" and the venue pages lead with "referral code nexu888 … up to 40%/60% back".
- No `>` summary blockquote after the H1. H1 is "NexuAlpha public source review index", not the brand.
- Internal labels exposed: "Wave48 Perp DEX cost citations", "Wave56 finding", "Wave57 finding".
- "Review record date: 2026-09-08", about a month old.
- About 2× the recommended size for llms.txt (the full detail belongs in llms-full.txt).

**Why it matters**: if an assistant uses llms.txt, it learns the site is a neutral directory and is told the referral code is out of scope — the opposite of what the money pages say. Google's own guidance says llms.txt is not needed for AI features, so the impact is limited to other assistants.

**Fix**: owner decision first (was excluding commercial terms intentional?). Then in `scripts/generate-public-llms.mjs`: brand H1, one-line `>` summary matching the home positioning, a short "Key facts" block (codes per exchange, rebate share, settlement cadence, disclosure link), drop "Wave" labels, and move long sections to llms-full.txt.

### 10. Legacy article library is templated, low-demand and answer-last — High impact, large effort

**Evidence**: 599 EN article URLs in the sitemaps. In a systematic sample of 22, **21 have no "The short answer"** section (only the 2026-10-11 ESMA piece does). They share one H2 skeleton: "Before you act… / Verified Fact Boundary / Decision Matrix / Source Map / Control Notes / 1..N / Known Unknowns / Practical Takeaway / Sources". Several repeat the same sentence frame in every numbered H3: "*X* is the decision point where public documentation must become an operating rule. In this package, it means…" (7–8 times in each of `/news/bybit-vs-okx-order-book-sequence-gap-recovery-controls`, `/news/coinbase-kraken-fix-sequence-reset-cancel-on-disconnect-controls`, `/news/aave-vs-lido-…`; a variant appears in `/news/how-to-compare-crypto-exchange-fee-schedules-…`). Topics skew toward low-search-demand API and controls subjects (e.g. `api-effective-deadline-retry-disclosure-radar`, `binance-test-order-vs-okx-place-order-pretrade-validation-controls`).

**Why it matters**: Google's core systems judge helpfulness site-wide. A large block of same-skeleton pages with repeated passages fits the "scaled content" pattern and can hold down the strong new-lane articles and venue pages. Citability of these pages is ~40/100, against ~75 for new-lane pages (see the scores table).

**Fix**: use GSC (`scripts/gsc-opportunity-queue.mjs`, `scripts/index-backlog-priority.mjs`) to sort the library into three groups: rewrite in the new-lane format (short answer first, concrete numbers, quick answers) where there are impressions; consolidate near-duplicates into topic hubs with 301s; noindex or remove pages with zero impressions after 90 days. The "news rewrite" in the 2026-10-10 growth plan already covers this. This finding adds the evidence and a way to choose which pages first.

### 11. Organisation-only authorship; thin About page — Medium impact, medium effort

**Evidence**: every article and venue page credits "NexuAlpha Research Desk" (an `Organization`) as both author and reviewer. `/about` (441 words) names no people and gives no legal entity, jurisdiction or postal address. Contact is Telegram only. `sameAs` lists Telegram channels, the bot, `app.nexualpha.com` (own subdomain) and X.

**Why it matters**: crypto fees and referral content is YMYL-adjacent. Google's "Who" test and the rater guidelines weight visible, accountable authors, and AI engines use entity clarity when choosing what to cite.

**Fix**: owner decision. At least publish the operating entity and jurisdiction plus an email address. Ideally add 1–2 named editors with bio pages (`Person` + `ProfilePage`) and use them as `author`, keeping the desk as `publisher`. Drop own properties from `sameAs`.

### 12. Meta descriptions and titles — Low impact, small effort

**Evidence**: article meta descriptions are the first sentence and short: 81 chars (`coldcard`), 84 (`trump`), 89 (`aave`), 100 (`fee-schedules`). Titles over ~60 chars get truncated: `aave-vs-lido` (79). Venue/home titles and descriptions are well sized (51–57 / 134–152).

**Fix**: generate 140–155-char descriptions that state the answer and the benefit. The `tests/seo-onpage-metadata-length.test.mjs` budget can enforce it.

### 13. `/embed/calculator` is indexable and in `sitemap.xml` — Low impact, small effort

**Evidence**: 200, `index,follow`, 178 words, self-canonical, hreflang `en` + `x-default`.

**Fix**: `noindex` embed routes and remove them from the sitemap (`src/data/seo-injection.js` L318/376/422; `server/embed-widgets.mjs`).

---

## Possible issues (not proven)

14. **Regional landing pages vs locale homes**: `/id` (lang `id`) and `/id-id`, `/jp` and `/ja`, `/br` and `/pt-br`, `/tw` and `/zh-hant`, plus `/us /uk /eu /sg /hk /kr /mx`. Each regional page forms its own two-entry cluster with `x-default` pointing to itself. The content differs (regional funding checks vs locale home), so this is fine in principle, but the pages can compete for "[country] crypto exchange" queries, and `x-default` = regional page is unusual. Check GSC for query overlap. If there is overlap, cross-link and give each page a distinct intent in its title, or put the regional page inside the locale cluster's path. Confidence: low-med.
15. **Home page weight / LCP**: 369 KB HTML (63.5 KB compressed) with ~173 KB inline CSS and 8 deferred stylesheets. TTFB 0.3–0.6 s from this location. CWV could not be measured because the PSI quota was exhausted. Re-run PSI/CrUX for `/` and `/exchanges/okx` on mobile before acting. Confidence: low.
16. **noindex + cross-locale canonical**: e.g. `/es/news/aave-vs-lido-…` is `noindex,follow` **and** canonical → `/news/aave-…`. Google advises against mixing the two signals. It's harmless in practice, but choosing one (canonical to EN without noindex, or noindex with a self canonical) is cleaner. The noindexed ES title is also an uppercased slug ("Investigación verificada por fuentes: AAVE VS LIDO EXIT"), which matters only if it is ever indexed. Confidence: med.
17. **Live data modules empty in SSR**: funding rates and the fear & greed index are client-only. Crawlers and AI fetchers see dashes, which wastes the home's most "fresh fact" surface. Consider SSR-ing the last cached snapshot with its timestamp. Confidence: med.
18. **Hardening/other**: HSTS lacks `includeSubDomains` (minor); no `Content-Signal` line in robots.txt; 1,472 `<priority>`/`<changefreq>` tags (ignored). Low impact.

---

## Passed checks (no action)

- **Crawlability**: robots.txt 200 and allows all major search/AI bots (OAI-SearchBot, GPTBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, Claude-User, PerplexityBot, Google-Extended, Applebot-Extended, Bingbot). No Cloudflare-managed block. No `noai`/X-Robots-Tag restrictions.
- **SSR**: full article, venue and home text is present in raw HTML (home ~5,000 words, venue ~1,960, articles 1,500–2,150). No JS dependency for primary content.
- **Canonicals**: self-referencing on every indexable page sampled. Redirects are single-hop 301 (http→https, www→apex, trailing slash→none). Unknown routes return a real 404. `?utm_` URLs canonicalise.
- **Sitemaps**: four sitemaps, valid XML, under limits. **No noindexed URLs listed** (all 17 locale article URLs listed checked `index,follow`). News sitemap has 102 items, all within the 2-day window. Every hreflang link is reciprocal (0 failures across 2,396 URLs), every set has `x-default`, codes are valid (`zh-Hans`, `zh-Hant`, `pt-BR`, `id`).
- **Venue / compare pages**: 14 locale alternates of `/exchanges/okx` and `/compare/binance-vs-bybit` all 200, indexable, self-canonical, 16 hreflang entries. Only minor English leakage (2 lines on `/es/exchanges/okx`).
- **Schema**: valid JSON-LD everywhere (WebSite, Organization with publishing/corrections/ownership policies, BreadcrumbList, WebPage, FAQPage on venues, CollectionPage/ItemList on listings, NewsArticle). FAQPage gets no Google rich result since 2026-05-07, so it's only useful as Info.
- **IndexNow** script and Bing/Yandex/Google verification files present.
- **Security headers**: HSTS, CSP (base), X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy.

---

## AI citability scores (geo-citability rubric; heuristic)

| Page | Answer (30%) | Self-contained (25%) | Structure (20%) | Stats (15%) | Unique (10%) | **Score** | Main gap |
|---|---|---|---|---|---|---|---|
| `/` (variant A) | 55 | 55 | 60 | 70 | 55 | **58** | H1 is slogan-only ("Stop gifting fees. Get up to 60% back."); placeholders (#6); no 2–3 sentence "what NexuAlpha is" answer near the top |
| `/exchanges/okx` | 75 | 60 | 55 | 70 | 60 | **65** | Strong H1/answer block (code, 40%, hourly). Diluted by pending/empty modules and many tiny H2/H3s |
| `/exchanges/bitget` | 75 | 60 | 55 | 70 | 60 | **65** | Same template as OKX |
| `/news/how-to-sign-up-okx-referral-code-nexu888-fee-rebate` | 80 | 75 | 85 | 60 | 55 | **74** | Boilerplate H2 before the answer (#5) |
| `/news/coldcard-x-account-phishing-post-what-to-do` | 80 | 75 | 80 | 55 | 60 | **72** | Same as above |
| `/news/trump-memecoin-gala-dinner-leaderboard-what-holders-should-know` | 80 | 75 | 85 | 80 | 65 | **78** | Best sampled page: dates, counts, prices, sources |
| `/news/how-to-compare-crypto-exchange-fee-schedules-without-missing-costs` | 35 | 40 | 55 | 30 | 30 | **40** | Templated H3s, empty "Control Notes", no numbers in body; high-intent topic wasted |
| `/news/aave-vs-lido-exit-path-health-factor-withdrawal-queue-controls` | 35 | 40 | 55 | 25 | 35 | **38** | Same template |

Rewrite example for `/news/how-to-compare-crypto-exchange-fee-schedules-…` (opening):
> To compare crypto exchange fees, line up four numbers per exchange: spot maker, spot taker, perpetual maker and perpetual taker at the regular-user tier, then add withdrawal fees and any referral rebate. At base rates re-read on 10 October 2026, OKX charges 0.08% maker / 0.10% taker on spot; [other venues' checked rates in a table].

## Content quality (seo-content; heuristic)

| Page | Content score | E-E-A-T (Exp/Expt/Auth/Trust) | Notes |
|---|---|---|---|
| `/` | 60 | 10/15/12/20 | Clear disclosure and sources; placeholders and spec copy hurt; no named people |
| `/exchanges/okx` | 66 | 12/17/13/22 | Dated fee table, official sources, anti-phishing domain list. Pending modules and empty headings |
| New-lane article (`okx` sign-up) | 76 | 13/18/13/23 | Answer-first, quick answers, limits, dated sources. Author is an org only |
| Legacy article (`fee-schedules`) | 42 | 6/13/10/18 | Templated, repetitive frames, inflated read time, no concrete figures |

---

## Suggested order of work

1. This week (all small): #1 hreflang single source, #2 `NewsArticle.image`, #3 real `lastmod`, #8 robots `/go/`, #7 read time, #13 embed noindex.
2. Next: #5 article template order, #6 remove SSR placeholders, #4 locale listing policy, #12 descriptions.
3. Owner decisions: #9 llms.txt positioning, #11 named authors / legal entity.
4. Ongoing: #10 legacy library triage driven by GSC data; re-run PSI/CrUX (#15) once quota resets.
