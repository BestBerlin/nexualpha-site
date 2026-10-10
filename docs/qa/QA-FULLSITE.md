# Full-site QA — coverage, issues, fixes (started 2026-10-10)

Resume here. Live = `main` at start: `3.0-20261010T1107-GH-7949c79` (main `7949c79`).
Tools: `pilot-01-prototype/scripts/qa-crawl.mjs` (HTTP/SEO crawl of every prerendered route),
`pilot-01-prototype/scripts/browser-sweep.js` (in-browser layout + disclosure sweep). Raw outputs live next to this file.

## Inventory (source: dist/client/prerender-manifest.json, 2271 routes; 861 searchPublished, 1410 noindex)
| Template | Routes | Notes |
|---|---|---|
| /news/* | 832 | news detail (SSR news renderer) |
| /factbook/* | 360 | venue factbook |
| /exchanges/* | 315 | exchange detail (21 venues × 15 locales) |
| /activities/*/* | 315 | activity research per venue |
| /compare/* | 165 | pair compare |
| /topics/* | 66 | topic guides |
| /ref/* | 45 | referral landing |
| /, /exchanges, /activities, /rates, /onchain, /methodology, /embed/calculator, /partners, /telegram | 15 each | one per locale |
| regional: /br, /mx, /tw, /hk, /jp, /kr, /sg, /eu, /uk, /us, /vn, /id, /int (+ /br/*, /mx/*, /tw/*, /hk/*) | 35 | regional hubs |
| /markets/*, /news, /topics, /factbook | 6 | |
| 404 | — | /no-such-page-qa |
Locales (routes): en 525, zh-Hans 513, zh-Hant 101, es 97, pt-BR 100, fr 93, de 93, ja 94, ko 94, ar 93 (RTL), tr 94, ru 93, id 94, vi 94, it 93.

## Coverage status
| Check | Scope | Status |
|---|---|---|
| HTTP/SEO crawl (status, lang/dir, title, description, robots, canonical, hreflang, h1, leaked text) | 2271/2271 routes | done: 2271/2271 200; lang/dir/title/description/h1 0 issues; 56 "leaks" all prose/API names (false positive); 13 canonical "mismatches" are ?locale= variants canonicalised to the hub (intended, not in sitemap); 15 duplicate titles are noindex /ref pages; 832/832 news >3 s -> Q6 |
| Browser layout sweep (overflow, off-scale fonts, <44px targets, light surfaces, disclosures) | 33 templates (en) @390 | running |
| Same sweep @1440 | 27 templates | done: 0 overflow |
| e2e (void/type/overflow/tap/collision/css/cta/jsoff/console/i18n) live, 5 widths | full set | done: 0 FAIL; warnings triaged -> Q9-Q12 |
| Locale sweep (15 locales × key templates) | — | todo |
| Core flows (search, directory filter, compare, calculator, profile CTA, language switch) | — | todo |
| Performance baseline (home, directory, profile, compare, news; mobile+desktop) | — | todo |

## Issues (id · severity · where · repro · expected/actual · status)
| ID | Sev | Where | Repro / evidence | Expected → actual | Status |
|---|---|---|---|---|---|
| Q1 | High (compliance) | /embed/calculator (+ calculator drawer) | sweep @390: 1 sponsored link, 0 disclosures | disclosure next to the registration link → none | fixed (CommissionDisclosureLine in TradingBleedAnalyzer), re-swept 1/1 |
| Q2 | Medium (a11y/touch) | 13 regional hubs (regional-market-preview), /partners, /ref/*, calculator venue switch, /br, /methodology, embed footer | sweep @390: links 22–40px tall or <44px wide | ≥44px targets → 18–40px | fixed in shared CSS (site-signature.css), re-swept: 0 left on those pages |
| Q3 | High (conversion/consistency) | /exchanges/{okx,binance,bitget} all locales | home desk says "Bitget up to 60% · settled daily"; profile said "benefits need verification" | same terms on the landing page → missing | fixed: ownerRebateLine() shared by home + RegistrationCard; test tests/owner-rebate-line.test.mjs |
| Q4 | Medium (SEO/links) | any page URL with trailing slash | curl /exchanges/okx/ → 404 | 301 to /exchanges/okx → 404 | fixed in server.mjs (301, query kept), verified on local prod server |
| Q5 | Low | /news/<missing> | 404 took ~5 s | fast 404 → 5 s | same root as Q6 |
| Q6 | High (performance) | /news/* (832 routes) | crawl: TTFB 4–5 s under load, ~1.5 s idle (profiles ~0.7 s); header x-nexualpha-news-render: runtime | fast → every request re-read/parsed/hashed the 1.3 MB feed | fixed: 60 s parsed-feed cache in worker; verify on standby vs live at deploy |
| Q7 | Medium (owner rule) | /rates calculator | defaulted to spot | perps by default (owner: show contract fees) | fixed (FeeBenchmarkTerminal) |
| Q8 | Low (data truth) | dYdX spot (directory, profile) | "not yet checked" | "not offered" (no spot on dYdX v4) | fixed: state "none" from data `offered:false`; 15-locale label; tests/fee-not-offered |
| Q9 | High (visual, owner screenshot) | home zh/zh-Hant/ja | headline broke mid-phrase, "40%" split, calc title stranded "少。" | :lang(zh) `text-wrap:pretty` shorthand reset `white-space:nowrap` | fixed: text-wrap-style; unbreakable phrases sized by container; verified 4 locales x 9 widths (320-1440) and live 1180 |
| Q10 | Medium (layout) | /topics/derivatives download strip 390-1024 | buttons squeezed to 44px, labels overlapped; label "Wave48" internal | fixed: flex 0 0 auto (0/22 overflow), labels "Citations CSV/JSON" |
| Q11 | Medium (i18n) | /{locale}/exchanges/* PoR panel + pending decision copy | English on 9-12 locales, zh-Hant got Simplified | fixed: porUi for es/pt-BR/fr/de/ar/ru/id/vi/it; shared pending-decision-copy.js (15 locales); zh strings without English parentheticals |
| Q12 | Low (touch) | disclosure link 16px, news venue chips 34px, factbook domain 42px, embed buttons | open (next batch) |
| — | (excluded) | profile source titles in English ("Binance identity verification FAQ") | titles of English official documents they link to | not a defect |
| — | (excluded) | directory type radios, sponsored link names | read_page showed no names | text content gives the accessible name | not a defect |
| — | (excluded) | checkboxes 18–20px (/onchain, /compare) | label wrapper ≥44px | — | not a defect |
| — | (excluded) | header search / language 36px @1440 | desktop pointer; ≥24px WCAG 2.5.8; 44px at 390 | — | not a defect |

Flows verified (dev, 2026-10-10): F1 language switch keeps page (/exchanges/okx → /ja/exchanges/okx, back works) ✓ · F2 search "bitget" → Enter → /exchanges/bitget ✓ · F3 directory filter (Perp DEX = 4, URL state), empty state + reset (24/24), pick 2 → dock → /zh-hans/compare/binance-vs-okx ✓ · F4 profile copy code → "已复制 ✓", official link okx.com/join/nexu888, rebate line ✓.
Note: the first crawl run was invalid (manifest paths are locale-neutral; the crawler fetched English for every locale). Fixed the crawler (localizedPath) and re-ran.

## Fixes and verification
Release `3.0-20261010T1152-GH-52b4720` (PR #16), deployed 2026-10-10 11:5x via local stage/cutover:
- Tests: test:sites 726 (669 pass; the 56 failures are the pre-existing set, unchanged); 10 new QA tests pass; dist worker parity 2/2.
- Standby preflight 13/13 routes, CTA links identical to live on 6 pages; public checks 13/13 + 3 invite codes.
- Perf (same server, same mounted 23 MB feed): news TTFB live 0.82-1.15 s -> standby 0.03-0.06 s (first request 0.42 s); public 0.28-0.35 s incl. TLS. Unknown-news 404 0.82 s -> 0.008 s.
- Q4 live: /exchanges/okx/ -> 301 /exchanges/okx. Q9 live at 1180: headline 2 lines, 40% 1 line, calc title 1 line.
