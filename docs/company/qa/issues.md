# QA issue log (2026-10-11 →)

Severity: S1 blocking / data error · S2 core UX or SEO defect · S3 consistency, copy, polish. Status: open · fixing (PR) · fixed (version) · verified live.

| # | Sev | Area | Finding (evidence) | Fix | Status |
|---|---|---|---|---|---|
| 1 | S2 | /news listings, all 15 locales | SSR body is an old "Market News & Source-Backed Research" hub with 3 article links; client replaces it with NewsListPage (41 links). CLS 0.55–0.94 at 390/1440; crawlers index stale copy. (`browser-templates.jsonl`, `newscls.py` diff) | Request-time SSR of NewsListPage via NEWS_SSR_RENDER; one copy source for the heading | fixing (agent news-ssr-cls) |
| 2 | S2 | /activities (all locales) | Live campaigns are client-fetched and inserted after SSR; CLS 0.34–0.57 at 390 | SSR campaigns from the announcements feed; skeleton fallback | fixing (agent news-ssr-cls) |
| 3 | S2 | 706 generated /compare/<a>-vs-<b> pages ×15 locales (sitemap.xml, index,follow) | Zero `<h1>` in SSR HTML (`http-sweep.jsonl` h1-count-0) | PR #60: every generated pair renders one H1; only 34 pairs stay index,follow (en/zh-Hans/zh-Hant), the rest noindex,follow; sitemap regenerated | verified live (5383420) |
| 4 | S2 | sitemap.xml | 6 URLs (ja/ko/tr × hyperliquid-vs-dydx, uniswap-vs-jupiter) listed but served `noindex,follow` | `scripts/sitemap-publication-policy.mjs` (also synced to the publisher checkout); regenerated public/sitemap.xml | fixed (deploying) |
| 5 | S2 | /topics/compliant-exchanges (en, ja, ko, tr) | Links to /compare/hashkey-vs-kraken → 404 | Bridge uses comparePathFor(); no compare action for factbook-only venues | verified live (5383420) |
| 6 | S3 | 883 pages | `<title>` > 70 chars (377 > 80): mostly news titles (643) and ar/ja compare titles | Editorial; news titles are the article headline + brand. Decide a brand-suffix drop for long titles | open |
| 7 | S3 | /about at 320–390px, 15 locales | 10 tap targets < 24px (contact list links) | `.nxb-contacts a` 44px min-height | fixed (pending deploy) |
| 8 | — | QA tooling | `qa-flows.py` false negatives: directory search typed before hydration; language menu lives in the drawer on mobile | Script fixed | fixed |
| 9 | — | false positives | "undefined"/"TBD" in article prose (quoted source wording), sr-only spans flagged as clipped, aborted prefetches flagged as failed requests, legacy market pages (/br, /hk, /tw…) have their own `lang` | none | closed |
| 10 | S2 | /<locale>/topics, /<locale>/factbook (noindex fallback locales, e.g. /ja/topics) | SSR fallback body replaced by the client render: CLS 0.3–0.8 at 390 (`browser-sweep.jsonl`, `clip2.py`) — same family as #1 | Request-time SSR of the localized component for fallback locales | open (after #1 lands) |
| 11 | S2 | /tr/activities at 390 | React error #418 (hydration text mismatch) in the console | Same SSR/client copy source for activities | fixing (agent news-ssr-cls) |
| 12 | S3 | /compare/* at 390 | Small shifts (CLS 0.02–0.05) from the hero actions / disclosure line after hydration | Reserve height for the hero action row | open |
| 13 | S3 | Locale home pages (e.g. /it, /de, /tr at 390/1440) | Hero rebate card (`.h7-lg-*`) shifts ≈0.18 at hydration; sweep peaks 0.4–0.8 include below-fold hydration while scrolling | Make the card's SSR and hydrated layout identical (tab widths, copy button) | open |
| 14 | S2 | /exchanges after PR #60 | Settled JS 456 → 1003 KB: picker import pulled compare-generated + route-v3-pages | compare-slug.js split + own chunks; directory closure −216 KB raw, no heavy module | fixed (deploying) |

Open counts are maintained in `coverage.md`.
