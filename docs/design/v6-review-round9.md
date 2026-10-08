# v6 review, round 9: independent regression and CTA-risk review

- Preview: `http://localhost:4991`, build `3.0-20261009T0655-GH-514ce74` (checked against `/version.json`)
- Live baseline: `https://nexualpha.com`, build `3.0-20261009T0059-GH-eef2205`
- Reviewer: independent. I did not build this. Method: Playwright (chromium, `--disable-gpu`) at 1440x900 and 390x844 (mobile and touch), with JS on and JS off, plus reduced motion where relevant.
- Scope of the merge: CSS split into route chunks with dead rules removed, CRO changes (sticky signup bars, full mobile directory, Compare Lab next step, outbound toast, code copy chip), and the r9 inner ledgers, route diagrams and scroll reveals.

## Verdict: NO-GO as built. GO once B1 is fixed (one-line CSS change), with no other blockers

### Blocker

**B1. `.cl-sr` is unstyled on every `/compare/*` page, in all locales. This regression comes from the CSS chunking.**
`InnerLedger.jsx` (the new r9 compare ledger, lines 124-140) uses the screen-reader-only class `cl-sr`. That rule is defined only in `styles/v6/compare-lab.css`, which is bundled into `page-home-late-*.css`. The worker strips that chunk on compare routes. Effects on `/compare/binance-vs-okx`, `/compare/okx-vs-bybit`, `/zh-hans/compare/binance-vs-okx` and the rest:
- The screen-reader sentence shows as visible duplicate copy under the gap figure: "Spot fee gap, percentage points: 0.02 pp. OKX is lower on Spot maker".
- Every ledger row prints "Binance:" / "OKX:" prefixes inline.
- The bar tracks are squeezed. At 1440 they shrink from 396 to 324 px. At 390 they shrink from 99 to 46-51 px, and the row labels sit flush against x=0.
- The compare hero grows by 23 px (desktop) and 55 px (mobile).

Fix: change these spans to `cro-sr` (defined in `cro.css`, which is in the shared core chunk), or copy the `.cl-sr` rule into `split/shared-b1.css`. To verify, re-run the stripped-vs-full chunk diff described below. It should show 0 differences on `/compare/*`.

This is the only difference the chunk-equivalence test found across 35 routes at 1440 and 14 routes at 390.

## 1. CSS chunking: route coverage

**Equivalence test (strongest check).** For each route I loaded the page as the worker serves it ("stripped") and again with every `page-*` / `core-*` chunk re-inserted in the build's cascade order ("full"). I then diffed 29 computed properties plus the box size of every element in `body`, with JS off and animations disabled. Any difference means a rule the route used to get from the single bundle is now missing.

| Result | Routes |
|---|---|
| 0 differences | `/` `/de` `/ar` `/exchanges` `/exchanges/{binance,bitget,uniswap}` `/ja/exchanges/bitget` `/rates` `/factbook` `/factbook/binance` `/telegram` `/br` `/br/pix` `/news` + article `/topics` `/topics/no-kyc` `/topics/derivatives` `/topics/tokenized-assets` `/mx` `/mx/comparar` `/mx/costos` `/tw` `/markets/turkiye` `/eu` `/embed/calculator` `/methodology` `/activities` `/onchain` `/partners` 404 (all at 1440). At 390: `/` `/exchanges` `/exchanges/bitget` `/rates` `/factbook/bitget` `/telegram` `/br` `/news` `/topics/no-kyc` `/mx` `/eu` `/embed/calculator` 404 |
| Differences | `/compare/binance-vs-okx` (26), `/compare/hyperliquid-vs-dydx` (18), `/zh-hans/compare/binance-vs-okx` (26), `/compare/okx-vs-bybit` at 390 (45). All of them are `.cl-sr` (B1). |

**Pixel diff against live (full page, animations off).** These routes are byte-identical to live at both widths: `/topics` `/topics/no-kyc` `/partners` `/onchain` `/br` `/br/pix` `/mx` `/eu` `/tw` `/markets/turkiye` `/embed/calculator` and the news article. `/methodology` and `/telegram` are also identical at 390. The changed routes (`/news`, `/methodology`, `/activities`, `/telegram`, `/factbook`, `/rates` at 1440, plus `/activities` and the home pages at 390) were inspected side by side. Every change comes from the intended r9 ledger and grid work or from the full mobile directory (home is about 1,580 px longer at 390). I found no collapsed or unstyled blocks.

**Computed-style sanity across 47 routes, both widths, JS on and off:**
- h1 size and family, body font and background, header and footer match live everywhere.
- Titles, h1 text, canonical and robots tags are identical to live.
- No horizontal overflow on any route at 390 or 1440, with JS on or off.
- `/compare` (hub) and the 404 page render without an h1 when JS is off. This is the same on live, so it is not a regression.

**Payload.** Render-blocking CSS per route went down a lot:

| Route | Live raw / gzip | Preview raw / gzip |
|---|---|---|
| `/` | 1.32 MB / 203 KB | 0.99 MB / 165 KB |
| `/exchanges/binance` | 1.17 MB / 174 KB | 0.68 MB / 107 KB |
| `/compare/*` | 1.13 MB / 166 KB | 0.60 MB / 93 KB |
| `/news` | 1.09 MB / 159 KB | 0.51 MB / 80 KB |
| `/topics/no-kyc` | 1.08 MB / 157 KB | 0.51 MB / 78 KB |

The site is a multi-page app: there is no `pushState` routing, so a route that has its stylesheets stripped is never reused by client-side navigation. The per-route stripping is therefore safe.

## 2. Sponsored and referral links and invite codes

I scrolled each page in full (so lazy sections mount) and collected every `a[data-cta-kind=registration]` and `a[rel*=sponsored]`. Routes covered: `/` `/exchanges` `/exchanges/{binance,okx,bitget,bybit}` `/compare/{binance-vs-okx,bybit-vs-bitget,okx-vs-bybit,binance-vs-bybit,okx-vs-mexc}` `/rates` `/de` `/zh-hans/exchanges/bitget`, at 1440 and 390, on both preview and live.

- **The set of hrefs is identical to live on every route at both widths.** The only differences are additions:
  - The new `data-cta-code` attributes. Each one matches the code carried in its own href; no mismatches.
  - One extra instance of an existing href per page: the new sticky bars and the Compare Lab next step.
- **Bitget:** every Bitget registration link is `https://partner.bitget.cafe/bg/C6PRAF`, and the code shown is `nexu888` (registration card, sticky bar, compare sticky, toast and Compare Lab chip). `C6PRAF` is never displayed as a code.
- Other links unchanged: Binance `bsmkweb.cc/join?ref=11350287`, OKX `okx.com/join/nexu888`, Bybit `affiliate_id=48553`, Gate `nexubest`, MEXC `4BRhe`, KuCoin `NEXU_KUCOIN`, Kraken `7f97gkqw`, Backpack `luckybitcoin`, Deribit, HTX, HashKey, Hyperliquid `NEXU888`, GMX, Aevo.
- On mobile home, more codes are now displayed than on live because the full directory renders. This is intended.

## 3. Sticky bars and Compare Lab next step

**Venue page (`/exchanges/bitget`, 390).**
- The bar is hidden while the registration card's primary button is on screen.
- It appears once that button scrolls out of view (y≈1,200) and hides again before the footer (gone by y≈4,270, with the footer top at 576).
- There is exactly one filled primary per viewport at every sampled position.
- Buttons are 68 px tall and the code box is 140x68.
- Checked in ar (RTL mirrored correctly), ja and vi: no clipping and no overflow.

**Compare page (`/compare/bybit-vs-bitget`, 390).**
- The bar is a 45 px bottom bar with two equal outlined signup buttons (44 px tall), so neither venue is presented as the winner.
- It hides while the final-choice card is on screen and does not overlap the footer.
- German labels wrap to a 57 px bar with no clipping.
- Mobile improvement over live: live showed two filled primaries in one viewport at 390, the preview never does. At 1440 the final-choice card still shows two filled "Register on Official Site" buttons side by side; that is unchanged from live.

**Desktop:** no sticky bar; the registration card on venue pages is sticky. Fine.

**Compare Lab next step** (all four popular pairs exercised):

| Pair | Next step | Correct? |
|---|---|---|
| Binance vs OKX | "Lower checked spot fee: OKX" plus OKX signup and code chip | Yes. OKX is lower or equal on both spot rates and strictly lower on maker. |
| Bybit vs Bitget | Neutral ("No checked fee gap decides this pair"), no partner link | Yes (identical spot rates) |
| Uniswap vs Jupiter | Neutral | Yes (spot rates not checked) |
| Hyperliquid vs dYdX | Neutral | Yes (spot rates not checked) |

A winner is never named on a tie or on unchecked rates. When a signup step is shown, "Open full comparison" correctly steps down to an outline button.

**Code chip:** copies `nexu888` (clipboard verified). The "Copied" pop-up and the live-region text work. It also reports success with clipboard permission denied (the fallback path). The button is 44 px tall.

## 4. Outbound toast

Click tests ran with external hosts stubbed, so no real partner traffic was generated:
- venue sticky at 390
- registration card at 1440
- compare sticky at 390
- Compare Lab next step at 1440

In every case the popup opened to the exact href within about 0.2 s and the opener page did not navigate. The toast ("<Venue> official signup opened in a new tab. Check the code … is filled in" plus Copy and ×) appears after the click:
- It never blocks navigation.
- At 390 it sits above the sticky bar with no overlap (toast bottom 752, bar top 759 or 799).
- It is not modal and auto-hides about 9 s after the page becomes visible again.

No page errors.

## 5. Home click latency

Measured with Event Timing on the Compare Lab swap button and the popular-pair "Preview" buttons, preview vs live:

| Condition | Preview (ms) | Live (ms) |
|---|---|---|
| CPU 1x | 32-112 | 40-112 |
| CPU 4x, after settling | 112-384 | 128-416 |
| CPU 4x, click right after `load` | 120-176 | 112-192 |

This is parity. One 3.1 s outlier appeared in the first run with 4x throttling and did not reproduce in 9 later trials.

## 6. Horizontal scroll

None: 47 routes x 2 widths x JS on/off, plus the localized sticky checks.

## 7. Console errors and failed requests

- No `pageerror` and no console errors on any of the 47 routes, at either width, with JS on.
- The only failed request is the expected 404 document on `/compare` (hub) and on the 404 test route; live behaves the same.
- Environment note: the preview's `/news` feed is stale (batch `20261005T0435`, 416 articles) while live is on `20261009T0435` (554 articles), so the newest live articles return 404 on the preview. `deploy/stage-remote.py` carries the live `/app/dist/client/content` mount into the new container, so this should not reach production. Post-deploy check: `/news` still lists 554 articles and `/news/binance-vs-okx-account-configuration-api-key-permission-controls` returns 200.

## 8. Scores (0-10, honest)

| Dimension | Home | Inner (venue, compare, rates, factbook) |
|---|---|---|
| Visual quality and consistency | 8 | 7 (B1 visibly breaks the compare ledger) |
| Information hierarchy and clarity | 7.5 | 7.5 |
| CTA clarity and conversion path | 8 | 8 |
| Trust, disclosure and neutrality | 7.5 | 8 |
| Performance (CSS weight, interaction) | 7 | 8 |
| Mobile and responsive | 7.5 | 7.5 |
| Accessibility (tap targets, SR text, focus) | 7.5 | 6.5 (SR text leaking visibly; labels at x=0) |
| i18n and RTL robustness | 8 | 8 |

## Top 8 remaining defects (most severe first)

1. **B1: `.cl-sr` missing on `/compare/*`** in all locales, at 1440 and 390. Visible duplicate sentence, inline "Venue:" labels, squeezed bars, mobile labels against the left edge. Fix: use `cro-sr` or move the rule to the shared chunk.
2. **Compare Lab copy tension.** The footnote says "Side by side, not a ranking", and directly below it the next step names a venue and pushes its signup on the strength of a 0.02 pp spot-maker gap, even when that venue's perp rates are unchecked. Consider "Lower checked spot maker fee: OKX (0.02 pp)" and keeping the claim scoped to spot.
3. **Venue mobile sticky bar is heavy:** 85 px (10% of an 844 px viewport) with 68 px buttons. 56 px buttons with a single-line code box would recover reading space.
4. **Home at 390 is about 1,580 px longer** because the full directory renders (de and ja: 7,968 → 9,549 px). Content after the directory (the verify section, the lower funnel) is pushed far down. Watch scroll depth, or collapse after about 8 rows with a "Show all 24" control.
5. **Render-blocking CSS is still about 0.5-1.0 MB raw per route** (home 995 KB raw, 165 KB gzip) across about 15-20 stylesheet requests. The split is a large win, but home is still heavy.
6. **Scroll reveals start at opacity 0.** After a programmatic or anchor jump scroll, the "Before you register" group on compare pages and the "Questions answered" disclosure on `/telegram` were briefly invisible. They are not stuck: they revealed after re-entry, and live behaves the same. Low risk, but anchor targets should be pre-revealed.
7. **`/compare` hub is a 404** (live too). It is a natural crawl and nav target, and a missed SEO and CTA landing page.
8. **The 404 page with JS off has no server-rendered h1 or content** (live too).

## Method notes

- Scripts and temporary JPEGs were kept in the session scratchpad and deleted after review. Nothing was committed.
- The chunk-equivalence harness (stripped vs full cascade, computed-style diff) is the cheapest guard for future CSS splits. It should run in CI over the 13 deploy-gate routes plus `/compare/*`.
