# V6 independent review, round 8: regression gate for the `:has()` rewrite (build 3.0-20261009T0021-GH-eef2205)

Reviewer: independent; I did not build this. Preview: `localhost:4891`. Baseline: LIVE `https://nexualpha.com`.

## Verdict: **GO** for production deploy

I found no blocking regression in the shell. That covers the header, footer, mobile bottom nav, regional dock, sticky bar, html/body styles, sticky behaviour and horizontal overflow.

All 10 rewritten `html`/`body` `:has()` selectors, plus the `.rf-grid` one, match exactly the same elements as the old selectors:
- on every route tested;
- at 1440 and at 390;
- before scrolling, after a full programmatic scroll, with JS disabled (SSR HTML), and after home interactions.

The computed styles of the shell elements match LIVE, apart from intentional changes and timing-dependent values that move the same way on both builds.

Several behaviour changes are not regressions, but the owner should know about them before deploy (section 5).

## 1. Build checks

- `/version.json` on `localhost:4891` returns `3.0-20261009T0021-GH-eef2205`. LIVE returns `3.0-20261008T2307-GH-7b09806`.
- Diff `7b09806..eef2205`:
  - The `:has()` rewrites are in `system.css`, `v5/base.css`, `v5/shell.css`, `fintech-premium.css`, `mobile-bottom-nav.css`, `regional-mobile-decision-dock.css`, `home-r6.css`, `home-r7.css` and `pages-inner-r4.css`.
  - Two new stylesheets: `home-r8.css` and `pages-inner-r8.css`.
  - CJK and Arabic fonts are collapsed to one `-400` file per script, and the `-500/-600/-700` files are deleted. The old weight files were byte-identical copies, so no glyph data changed.
- Method: Playwright `channel='chromium'` with `--disable-gpu`, at 1440x900 and 390x844 (`is_mobile`, touch). Every page was scrolled to the bottom in 700px steps before measuring.
- I took 6 side-by-side JPEGs and deleted them after review.

## 2. Selector equivalence (the main risk)

For each pair, I evaluated `documentElement/body.matches(old)` against `matches(new)` on the preview DOM.

Old → new pairs:
- `body:has(.regional-mobile-decision-dock)` → `body:has(> #root > main > section > .regional-mobile-decision-dock)`
- `body:has(.mobile-bottom-nav)` → `body:has(> #root > .mobile-bottom-nav, > #root > main > .mobile-bottom-nav)`
- `body:has(.v3-profile-page)` / `body:has(.v3-compare-page)` → `body:has(> #root > main.v3-…)`
- `html:has(.mobile-bottom-nav):not(:has(.v3-profile-page, .v3-compare-page))` → the structural form
- `html:has(.v3-mobile-sticky-bar)` → `html:has(> body > #root > main > .v3-mobile-sticky-bar)`
- `html:has(.v5)` → `html:has(> body > #root > main.v5, > body > #root > main > .v5)`
- `body:has(.v5 .container)` → `body:has(> #root > main.v5 > .container)`
- `body:has(main.v6:not(.home-refinement))` → `body:has(> #root > main.v6:not(.home-refinement))`
- `body:has(main#top.v6.home-refinement)` → `body:has(> #root > main#top.v6.home-refinement)`
- `.rf-grid:not(:has(.rf-svg[data-live]))` → `:not(:has(> .rf-svg[data-live]))`. `.rf-svg` is a direct child of `.rf-grid`, and the pair was verified after an intent click with `data-live` set.

Routes covered:
- 25 routes × 2 viewports: `/`, `/de`, `/ar`, `/ja`, `/es`, `/vi`, `/exchanges`, `/exchanges/{binance,bitget,okx}`, `/compare/binance-vs-okx`, `/rates`, `/factbook`, `/factbook/binance`, `/telegram`, `/br`, `/news`, `/news/cftc-sec-…-boundary-map`, `/activities`, `/methodology`, `/topics`, `/topics/meme-coins`, `/de/exchanges`, `/ar/exchanges/binance`, `/ja/rates`.
- 15 more routes × 2 viewports: `/mx`, `/tw`, `/markets/turkiye`, `/mx/comparar`, `/mx/costos`, `/mx/conta`, `/tw/comparar`, `/hk/costos`, `/int`, `/eu`, `/ko`, `/exchanges/mexc`, `/zh-CN`, `/fr/factbook`, and a 404.
- 16 routes with JS disabled.

**Result: 0 mismatches.** The DOM contract holds everywhere I looked:
- `main` is always a direct child of `#root`. `pageShell` is a Fragment, and `DeferredBoundary` adds no wrapper; `#root` siblings are only `<template>` markers.
- `.mobile-bottom-nav` is either a `#root` child (inner pages) or a `main` child (home).
- The regional dock sits at `#root > main > section.v2-shell > nav`.

Fragility note: these selectors now encode the DOM shape. A future wrapper `<div>` around `main` would silently drop the inner-page footer and header styling and the nav padding. Add a contract test that asserts `#root > main` and the nav and dock parents.

## 3. Computed-style diff vs LIVE (bottom state, after full scroll)

These shell properties were compared:
- `html`: background, `scroll-padding-*`, `scrollbar-color`, overflow;
- `body`: padding-bottom, background, overflow, font, `--content`, `--page-pad`, `--v6-gap`, `--mobile-bottom-nav-reserve`;
- `.nx-hdr`, `__inner`; `.nx-ftr`, `__inner`, `__title`, footer link, copyright; `.crawl-priority-links` and its link;
- `.mobile-bottom-nav`, its label; the regional dock; `.v3-mobile-sticky-bar`.

Each was checked on 21 properties plus its rect. The result is **identical on every inner route at both widths**, except for these:

| Diff | Where | Verdict |
|---|---|---|
| `--mobile-bottom-nav-height` 62 vs 80, so body `padding-bottom` is 70 vs 88 and footer `padding-bottom` is 90 vs 28 | `/`, `/de`, `/ar`, `/ja`, `/tw` at 390 | **Not a regression.** It is a JS-measured value that settles after load. LIVE `/es` and `/vi` show the same 62/90 values, and the preview starts at 80/28 too. The copyright clears the nav on both builds. |
| `.nx-hdr__inner` height 55 vs 59/63 | various, both directions | **Not a regression.** This is the compact-on-scroll header. Both builds read 59/63 at the top and 55 when scrolled. |
| ar font stack now starts with `"Pilot Noto Arabic"` | `/ar*` | Intentional (commit 813abf8). |
| `.crawl-priority-links` taller on `/compare/*` and `/tw/comparar` | compare scope | Intentional: a third "compare" group was added. |
| Header "Market News" → "Market news" | all en pages (0.6% header pixel diff) | Intentional casing change. |

Other checks:
- **Sticky behaviour:** the header, sticky bar, bottom nav and dock have the same position and visibility at scroll 1500 on every route.
- **Horizontal scroll:** none on any route at either width, on either build.
- **Console:** 0 errors and 0 failed requests on the preview across all routes. (LIVE only showed navigation-abort noise.)
- **Pixel diffs:**
  - The header strip is 0.00% at 390 on all 13 key pages.
  - Footer strips differ by 0–5%. That comes from the textured background and the one-line footer height change. I inspected `/` and `/exchanges/binance` side by side at 390, and they are visually equivalent.
  - Hero diffs (home 15%, `/compare` 9%, `/methodology` 7%) are the intended r8 content changes.

## 4. Requested functional checks

### Click latency (PerformanceObserver `event`, max duration per interaction, 6 samples each)

The CPU is unthrottled, in headless chromium with no GPU. The sandbox CPU is slow, so read these as relative numbers.

| | Hero node | Intent | Lab chip |
|---|---|---|---|
| Preview 1440 | 32–232 (median about 184) | 128–224 | **40–128** |
| LIVE 1440 | 176–432 | 296–368 | 336–768 |
| Preview 390 | 144–208 | 176–280 | 272–328 |
| LIVE 390 | 128–232 | 144–264 | 272–560 |

- On desktop, the hero and intent are about 2x faster and the lab chip is up to 10x faster.
- At 390, the hero and intent are **not** better than LIVE. The breakdown for a 390 tap is:
  - node: delay 36, processing 2, presentation 250ms;
  - intent: delay 11, processing 1, presentation 268ms.
- So the remaining cost is style, layout and paint after pointerdown, not JS.
- With 4x CPU throttle, desktop interactions are still 1.2–2.3s on the preview.

### `/exchanges` spot sort, ascending

- Order: Hyperliquid 0.04/0.07 → OKX 0.08/0.10 → Binance → Bitget → Bybit → Gate.io (all 0.10/0.10, sorted A–Z), then the 18 not-yet-checked venues A–Z.
- Kraken has a checked perp but an unchecked spot fee, so it correctly sinks into that group.
- This matches the rule: taker, then maker, then name. `aria-sort` reads `ascending`. **Pass** at 1440 and 390.
- LIVE still orders ties in source order (Binance, Bybit, Bitget, OKX…).

### Invite codes vs LIVE

I compared, after a full scroll:
- the full innerText occurrence counts of the known codes;
- the full set of external links on each page, which includes the join/register URLs;
- `outerHTML` occurrence counts.

**Every code string is unchanged:**

| Page | Codes |
|---|---|
| `/` | 11350287, nexu888, NEXU888, 48553, nexubest, luckybitcoin, NEXUALPHA |
| `/exchanges` | same 7 codes as `/` |
| `/exchanges/binance` | 11350287 |
| `/exchanges/bitget` | nexu888 |
| `/exchanges/okx` | nexu888 (`okx.com/join/nexu888` ×2 on both) |
| `/compare/binance-vs-okx` | 11350287 + nexu888 |
| `/factbook/binance` | 11350287 |
| `/de/exchanges/bitget` | nexu888 |

`outerHTML` counts are identical on every page. There is no `/binance` route on either build (both return 404); `/exchanges/binance` is the profile.

Differences (none touch a code or an affiliate URL):
1. The label "Referral Code" is now "Referral code" (casing only).
2. **390 home:** the directory now really collapses 12 rows behind "Show more platforms (12)". On LIVE, `data-collapsed` never gets set, so all 20 rows show. The codes for MEXC, Backpack, Hyperliquid and others are therefore no longer visible on the first mobile pass, although they stay in the HTML.
3. `/exchanges/okx` lost one duplicated official-sources list, and the "About OKX" (`okx.com/about`) link went with it. Announcements, fees, KYC and join links remain.

## 5. Behaviour changes to confirm before deploy (not blocking)

1. **Telegram fee-calculator deep links were removed** from `/`, `/rates`, all home locales and `/hk/costos`. The removed links are `fee_calc_all_spot_100000_…_c_z6ys84` and `fee_calc_all_spot_m_GLOBAL_…_c_1266gq`. `/rates` keeps 1 Telegram route instead of 3 (commit fad2530, intentional). Bot-attribution dashboards keyed on those two campaign ids will drop to zero.
2. The mobile home directory collapse (item 2 above) will change mobile CTA exposure for 12 venues compared with what production shows today.
3. The `/fonts/*-500/600/700.woff2` files are gone, so they return 404 for any stale cached HTML or CSS during rollout. The impact is low: it falls back to system faces.

## 6. Scores (0–10; 5 = competent template, 8 = award-worthy)

These scores are based on this round's evidence plus a spot-check of R7 open items. They are not a full re-audit of every dimension.

| Dimension | Home R7 → **R8** | Inner R7 → **R8** | Reason |
|---|---|---|---|
| Typography | 8 → **8** | 7.5 → **8** | Title Case headings are gone from /factbook/binance. Casing is still mixed ("Copy Code", "Global / Decentralized", "Official signup" vs "sign-up"). |
| Whitespace / rhythm | 7.5 → **7.5** | 7 → **7** | Not re-measured in depth. The R7 slabs and seams were not re-verified as fixed. |
| Hierarchy | 8 → **8.5** | 7 → **7.5** | "Source notes" moved off the H1 kicker. /compare lost "Show pending fields", "Show fewer metrics" and "Full matrix". /rates has a single "Continue comparison" and a single Telegram route. /methodology dropped the over-claim. |
| Colour | 8 → **8** | 7.5 → **7.5** | No change observed. |
| Motion | 7.5 → **7.5** | 6.5 → **6.5** | Not improved. Mobile tap presentation is about 250ms. |
| Micro-interaction | 7.5 → **8** | 7.5 → **8** | Desktop latency is 2–10x better. The sort tie-break is fixed. The mobile hero tap is still about 250ms. |
| Responsive | 8.5 → **8.5** | 8 → **8** | No horizontal scroll anywhere. Desktop still has 70 sub-44px targets on /rates and 36 on /compare (up from 30). |
| Originality | 7 → **7** | 5.5 → **5.5** | Unchanged. |

**Home: 6 of 8 dimensions are at 8 or above. Inner: 4 of 8. The design gate (all 8 or above) still fails, but that gate is separate from the deploy gate.**

## 7. Top 8 remaining defects

1. **Mobile tap latency on the hero:** node and intent pointerdown take 250–290ms in presentation (style and paint), with processing under 3ms. This is no better than LIVE. Find the `:active`/`:hover`/transition invalidation on `#top.v6`. The `#top.v6.home-refinement:has(>.rr[data-ready]) :is(.rf…)` rule is a candidate.
2. **Profile pages at 390:** at max scroll, the `.v3-mobile-sticky-bar` (85px) covers the footer copyright. Its top is at 759 and the copyright bottom is at 816, because `body` has `padding-bottom: 0` on `.v3-profile-page`. This happens on both builds.
3. **`/markets/turkiye` server-renders an empty `#root`** on both builds, so it is blank without JS and gives crawlers nothing.
4. **One 1.05MB render-blocking `index-*.css` on every route.** 54 `:has()` rules remain; they are now scoped, but the file size is the real cost.
5. **The mobile bottom-nav reserve is measured late** (80 → 62px after load). The body and footer padding jump about 18px and 62px at the page end, on both builds.
6. **Casing inconsistency:** "Copy Code", "Official signup" vs "Check before sign-up", "Global / Decentralized", and "Referral code" next to "Copy Code" in the same card.
7. **/activities is monotonous:** 6× "Account confirmation required" and 6× "Page read". **/telegram** has "Continue in Bot ↗" ×4.
8. **Desktop tap targets:** 70 controls under 44px on /rates, 36 on /compare and 32 on /activities at 1440 (sort chips and inline source links).
