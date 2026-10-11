# QA issue log (2026-10-11 →)

Severity: S1 blocking / data error · S2 core UX or SEO defect · S3 consistency, copy, polish. Status: open · fixing (PR) · fixed (version) · verified live.

| # | Sev | Area | Finding (evidence) | Fix | Status |
|---|---|---|---|---|---|
| 1 | S2 | /news listings, all 15 locales | SSR body is an old "Market News & Source-Backed Research" hub with 3 article links; client replaces it with NewsListPage (41 links). CLS 0.55–0.94 at 390/1440; crawlers index stale copy. (`browser-templates.jsonl`, `newscls.py` diff) | Request-time SSR of NewsListPage via NEWS_SSR_RENDER; one copy source for the heading | fixing (agent news-ssr-cls) |
| 2 | S2 | /activities (all locales) | Live campaigns are client-fetched and inserted after SSR; CLS 0.34–0.57 at 390 | SSR campaigns from the announcements feed; skeleton fallback | fixing (agent news-ssr-cls) |
| 3 | S2 | 706 generated /compare/<a>-vs-<b> pages ×15 locales (sitemap.xml, index,follow) | Zero `<h1>` in SSR HTML (`http-sweep.jsonl` h1-count-0) | Generated pairs get one H1 in the dynamic compare work (PR in flight) | fixing (agent compare-any) |
| 4 | S2 | sitemap.xml | 6 URLs (ja/ko/tr × hyperliquid-vs-dydx, uniswap-vs-jupiter) listed but served `noindex,follow` | `scripts/sitemap-publication-policy.mjs`: exclude excluded-venue pairs from ja/ko/tr; test expectations updated | fixing (lead) |
| 5 | S2 | /topics/compliant-exchanges (en, ja, ko, tr) | Links to /compare/hashkey-vs-kraken → 404 | Point to an existing pair or render a non-link until the pair exists | open (waiting on compare-any answer) |
| 6 | S3 | 883 pages | `<title>` > 70 chars (377 > 80): mostly news titles (643) and ar/ja compare titles | Editorial; news titles are the article headline + brand. Decide a brand-suffix drop for long titles | open |
| 7 | S3 | /about at 320px | 10 tap targets < 24px (contact list links) | Enlarge link padding | open |
| 8 | — | QA tooling | `qa-flows.py` false negatives: directory search typed before hydration; language menu lives in the drawer on mobile | Script fixed | fixed |
| 9 | — | false positives | "undefined"/"TBD" in article prose (quoted source wording), sr-only spans flagged as clipped, aborted prefetches flagged as failed requests, legacy market pages (/br, /hk, /tw…) have their own `lang` | none | closed |

Open counts are maintained in `coverage.md`.
