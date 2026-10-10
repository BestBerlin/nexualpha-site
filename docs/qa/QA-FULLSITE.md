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
| HTTP/SEO crawl (status, lang/dir, title, description, robots, canonical, hreflang, h1, leaked text) | 2271/2271 routes | running |
| Browser layout sweep (overflow, off-scale fonts, <44px targets, light surfaces, disclosures) | 33 templates (en) @390 | running |
| Same sweep @768 / @1440 | 33 templates | todo |
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
| — | (excluded) | directory type radios, sponsored link names | read_page showed no names | text content gives the accessible name | not a defect |
| — | (excluded) | checkboxes 18–20px (/onchain, /compare) | label wrapper ≥44px | — | not a defect |
| — | (excluded) | header search / language 36px @1440 | desktop pointer; ≥24px WCAG 2.5.8; 44px at 390 | — | not a defect |

Flows verified (dev, 2026-10-10): F1 language switch keeps page (/exchanges/okx → /ja/exchanges/okx, back works) ✓ · F2 search "bitget" → Enter → /exchanges/bitget ✓ · F3 directory filter (Perp DEX = 4, URL state), empty state + reset (24/24), pick 2 → dock → /zh-hans/compare/binance-vs-okx ✓ · F4 profile copy code → "已复制 ✓", official link okx.com/join/nexu888, rebate line ✓.
Note: the first crawl run was invalid (manifest paths are locale-neutral; the crawler fetched English for every locale). Fixed the crawler (localizedPath) and re-ran.

## Fixes and verification
(filled as fixed)
