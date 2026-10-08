# V6 independent review, round 7: HOME `/` (build 3.0-20261008T2250-GH-7b09806)

Reviewer: independent, did not build. Gate: every score must be at least 8 (benchmark: Awwwards/FWA SOTD).

## Build checks

- `/version.json` on `localhost:4781` returns `{"version":"3.0.0","buildId":"3.0-20261008T2250-GH-7b09806"}`.
- `h1.rf-title` is 72px at x=120 at 1440 (ar: 72px, x=630–1320, line-height 90px = 1.25). At 390 it is 44px at x=24.
- Document height at 1440: en 6367, de 6437, ar 6183, ja 6229. At 390: en 8005, de 8127, ar 7642, ja 7864.
- No horizontal scroll and no page errors in any render.
- With JS: CLS 0.0013 and LCP 1176ms (`rf-title`, headless).

## Method

- Browser: Playwright `channel='chromium'` with `--disable-gpu`.
- Viewports: 1440x900 and 390x844 (`is_mobile`, touch). Locales: en, `/de/`, `/ar/`, `/ja/`.
- Before every audit and every full-page capture, the page was scrolled in 300px steps and then returned to the top.
- Interaction frames and samples:
  - Hero:
    - all 4 intents;
    - node hover at 40, 120 and 300ms;
    - node click, with rAF sampling of `stroke-dashoffset` on `.rf-route__line--on`, the card top and the readout;
    - ArrowRight on the radio group, then Tab ×4.
  - Lab: swap (rAF and PerformanceObserver `event` / `longtask`), chip click (Kraken), slot A click, ArrowRight on a chip, drag of Coinbase onto slot B.
  - Verify: scroll-in sampled every frame for 2.2s; venue switch to Coinbase.
  - Directory: Perp DEX segment, No KYC chip, code copy (clipboard granted), Sign-up hover, "+" compare pick.
  - Rail at depths 0, 1200, 2400, 3600 and 4800.
  - Reduced motion.
- JS disabled: first paint at 1440 and 390.
- First-seen timing polled from `commit`.
- All JPEGs were deleted after review.

Timing caveat: headless chromium without a GPU is slow. The latency numbers below are relative evidence and should be re-measured on a mid-range Android device.

## Scores (0-10; 5 = competent template, 8 = award-worthy)

| Dimension | R6 | **R7** | One-line reason |
|---|---|---|---|
| Typography | 8 | **8** | **What holds:** 7 sizes, all on scale; weights 400/500/600; 3 line-heights (plus the documented ar 1.25); ja tiles now "法定入金" and "DEX取引" on one line; ar H1 has room to breathe. **Still open:** casing is mixed across legacy strings, the ar/ja web fonts ship one weight file aliased to 400–700, and the ar stack lists OS faces before the shipped face. |
| Whitespace / rhythm | 7.5 | **7.5** | **Still open:** a 271px dark band from the directory into the closing band (stacked 128 + 128 pads; 182–187px at 390); about 105px holes under Verify steps 2 and 3; about 300px of empty gutter left of lab slot A; `padding-top: 0` on every section. |
| Hierarchy | 7.5 | **8** | **Improved:** reading order = interaction order (lede → intents → readout → one ghost button + one link), with one filled CTA per viewport. **Still open:** "Source notes · View all" is still a kicker above the H1 at 1440, and the directory opens with a second intent picker. |
| Colour | 8 | **8** | Accent discipline holds. **Still open:** a hovered route turns accent next to the selected route (two accent routes), and in the lab both sides' bars are accent when the values are equal, so "positive" stops meaning anything. |
| Motion | 7.5 | **7.5** | **Fixed:** re-route about 300ms, card dock about 300ms, Verify sequence about 930ms with the stamp present from frame 0, scroll-driven rail fill. **Still open:** no count-up anywhere, and 200–650ms main-thread long tasks on every click freeze the frames these animations need. |
| Micro-interaction | 8 | **7.5** | Hover chip (domain + fee), copy, drag, radio keys, 2px rings and Sign-up fill all work. **Regression in feel:** the swap click spends 244–290ms in the handler (event duration 480–616ms), and a chip click 407+184ms (688ms). The lab feels sticky. The chip tooltip covers "Second venue". |
| Responsive | 8 | **8.5** | Official signup is in the first viewport in all 4 locales (en 631, ar 653, ja 635, de 702). There are **zero** tap targets under 44px at 390 in all 4 locales. The ja tiles are fixed, and the vertical Verify stepper is good. |
| Originality | 7 | **7** | The hero is a real composition, and the closing band's route line into the CTA is a nice rhyme. Below the fold it is still ledger → stepper → table → sitemap. This is accomplished product UI, not SOTD. |

**Gate fails: 5 of 8 dimensions are at 8 or above (typography, hierarchy, colour, responsive, plus micro-interaction held back by latency). Whitespace, motion, micro-interaction and originality are below 8.**

## Distinct computed font sizes (visible text, after scroll pass)

| Viewport | Locales | Sizes | Off-scale |
|---|---|---|---|
| 1440 | en / de / ar / ja | 12, 14, 16, 20, 28, 44, 72 | none. 72 is used only by `h1.rf-title`. |
| 390 | en / de / ar / ja | 12, 14, 16, 20, 28, 44 | none. 44 is used only by the H1. 28 is used by the h2s. |

- **Weights:** 400 / 500 / 600 only.
- **Line-heights:**
  - 1.05: H1 en/de.
  - 1.15: headings, and the ja H1.
  - 1.55: body.
  - 1.25: ar display (documented exception).
- **Families:**
  - Computed first family is "Geist V5" / "Geist Mono V5".
  - ar and ja actually render in "Pilot Noto Arabic" / "Pilot Noto JP", which are loaded (`document.fonts`).
  - However, `ar-400/500/600/700.woff2` are byte-identical (md5 45da26e2…), and `ja-*` are too (md5 e8f023e8…). One weight file is declared as four weights, so there is no true 600 in ar/ja headings: they render as 400, or as synthetic bold on some engines.

## Voids > 160px

| Render | Voids |
|---|---|
| 1440 en | 4340→4611 (**271px**): "24 platforms" → "Pick your route." |
| 1440 de / ar / ja | 271 / 280 / 230px at the same seam. |
| 390 en / de / ar / ja | 182 / 182 / 187 / 187px at the same seam. |

At this seam, the directory's 128px (72 at 390) bottom pad is stacked on the closing band's own top inset. The band has a lighter fill, so the eye reads one pad, then a second empty slab. No other voids.

Sub-threshold holes:

- Under Verify steps 2 and 3: about 105px below the helper text, against step 1's taller column.
- Left of lab slot A: an empty x=120–410 strip beside the right-aligned "Binance" id.

## Tap targets < 44px at 390

**None** in en, de, ar or ja: the ar footer link, the section-nav links and the bottom nav all pass.

At 1440, the header search and language buttons are 36px tall. This is not a touch context and is acceptable.

## JS disabled / first paint

- The hero is complete with JS off at both widths:
  - 23 route paths, 4 of them on;
  - card + Official signup;
  - 10 lab chips and 20 directory rows;
  - the Verify stamp is final (opacity 1).
- **Rail:** 5 segments and 4 docks are SSR'd. The fill is driven by `animation-timeline` (`scaleY` 0.027 at the top). With JS on, the docks, routes and H1 are all present at the first poll after commit (0.84s headless). **Round-6 #1 is fixed.**
- **New:**
  - With JS off, the OKX and Hyperliquid node logos are blank (Binance, Bybit, Bitget, Kraken and Gate render).
  - The hover chips (`.rf-chip`) are opacity 0 by design.
- Reduced motion: the active routes have `stroke-dashoffset: 0` and no animation.

## Round-6 defects: status

| # | Round-6 defect | Status |
|---|---|---|
| 1 | Rail client-only, about 5s late | **Fixed.** SSR docks, scroll-driven fill, present at first paint. (Hidden below 48rem by design.) |
| 2 | Verify verdict about 3.7s | **Fixed.** `typed` reaches 1 at about 420ms and the fake row at about 715ms. The stamp scales 1.18→1 by about 930ms and is never absent. A venue switch swaps the domain instantly and keeps the stamp. |
| 3 | On-chain map empty / two domains | **Fixed.** The nodes show chains (HyperBFT L1, Arbitrum · Avalanche, Solana…). There is one canonical `app.hyperliquid.xyz` in the gate, card and readout. Residual: the Hyperliquid node shows no fee while the readout shows Perp 0.015/0.045, and "dYdX Chain · Cosm…" is ellipsised. |
| 4 | ja intent mid-word breaks | **Fixed** ("法定入金", "DEX取引"; `word-break: auto-phrase`). |
| 5 | Verify holes / one-sided pads | **Partly.** The stations are now top-aligned. The holes moved below steps 2 and 3 (about 105px). Every section still has `padding-top: 0` (pads are bottom-only), and the directory→closing seam is now a 271px void (#3 below). |
| 6 | Node hover previews nothing / count-up | **Half fixed.** Hover and focus now show a mono chip (`www.bitget.com 0.10/0.10%`) at the node within 40ms. There is still no count-up, on hover or on click (the readout swaps values in one frame). |
| 7 | Route redraw about 900ms | **Fixed.** On a node click, segments 1–2 are already drawn at 87ms, segment 3 at about 215ms and segment 4 at about 300ms. |
| 8 | Hero order / CTAs / casing | **Fixed.** The order is lede → intents → readout → "Find my match in 30s" (ghost) + "Compare two platforms →" (link). |
| 9 | Closing index wastes its label column | **Mostly fixed.** Labels sit in a column with 3 link columns. "Join NexuAlpha Telegram · Rebate Tracking · Safe Onboarding" still wraps. It is still about 800px of sitemap before the footer's own link grid. |
| 10 | ar/ja display not designed | **Partly.** The ar line-height is 1.25, and Pilot Noto Arabic/JP load. But the weight files are aliased (see above), and the ar stack puts "Noto Sans Arabic", "Geeza Pro" and "Segoe UI" before the shipped face, so the face differs by OS. |
| 11 | Lab swap late / `transition: all` | **Transition fixed** (`background-color, border-color, translate, box-shadow` 140ms). **Latency not fixed and worse understood:** see #1 below. |
| 12 | Two identical logo rails | **Fixed.** There is one shared rail, and clicking slot A retargets it ("First venue"). Drag to a slot still works. |
| 13 | "Source notes" kicker above H1 | **Not fixed** at 1440 (y=64–112, in all locales). At 390 it sits after the CTAs, where it is an orphan line before a 72px pad. |
| 14 | Fiat intent adds only "Not yet checked" | **Not fixed.** The readout gains "Fiat on-ramp: Not yet checked", the nodes are unchanged, and Hyperliquid/GMX are ghosted. |
| 15 | Small tap targets | **Fixed.** None under 44px at 390 in any locale. |

## Defects, most severe first

1. **Every click on the page costs 200–650ms of main-thread work. This is the root of "没有交互感" and the reason the motion and micro scores stalled.**
   - Long tasks measured after each action (headless, no GPU):
     - node click: 329ms;
     - intent: 320 + 204ms;
     - lab swap: 212, 326 and 227ms;
     - lab chip: 644, 334 and 428ms.
   - Event Timing: the swap `click` has a processing time of 244–290ms (event duration 480–616ms), and the chip `click` has two handlers, 407 + 184ms (688ms).
   - An rAF sampler started on the swap's `pointerdown` received **one** frame in 3.7s.
   - Corroborating symptom: changing the lab pair re-orders the Verify venue chips. Lab state is lifted high enough that Compare, Verify (and likely the directory) re-render together.
   - Even at a 4x real-device speed-up, the swap and chip clicks sit at 120–170ms of input delay, which is enough to make the FLIP feel late.
   - Fix:
     - Keep each act's state local. Verify should take its default venue once, not subscribe to the lab.
     - `memo` the directory and the closing index.
     - Wrap non-urgent updates in `startTransition`.
     - Make the chip handler single (the label plus input currently fire `click` twice).
     - Target: under 50ms processing per click.
     - Verify with `PerformanceObserver({type:'event'})` on a throttled 4x CPU.

2. **Count-up still absent (the brief's named hover/focus behaviour).**
   - Hover shows a static chip, and a click swaps the readout in one frame (Binance 0.10 → Hyperliquid 0.04).
   - Fix: tween the readout's numbers over 240ms with tabular nums on selection change, and inside the hover chip. Alternatively, remove it from the brief explicitly. Do not leave it as a silent gap.

3. **A 271px dead slab between the directory and the closing band (182–187px at 390).**
   - `#exchanges` pads 128 at the bottom. The closing band then adds its own top inset (about 130) on a lighter fill.
   - Fix: either drop `#exchanges` padding-bottom to 64 when followed by `.v6-close__band`, or set the band's top inset to 64. The colour change already separates the acts.
   - While there, make section pads symmetric (`padding-block: 128px` / `72px`). Currently every section is 0/128.

4. **The "Source notes · View all" kicker still sits above the H1 at 1440 (round-6 #13, unaddressed).**
   - It is 48px of grey 14px label above the 72px display, in every locale.
   - Fix: move it into the card foot ("Sources ↓"), or under the readout as a 12px meta line. At 390, put it inside the card instead of orphaning it before the Compare pad.

5. **Lab composition is lopsided: bare slot A vs boxed slot B, and an empty left gutter.**
   - Slot A "Binance/CEX" is right-aligned text plus logo, with x=120–410 empty. Slot B is a framed 480px card.
   - The Kraken tooltip on chip hover overlaps the "Second venue" label.
   - Fix:
     - Render both ids identically (both framed or both bare), with the active slot shown by a 2px accent underline or outline only.
     - Centre the pair on cols 2–6 / 7–11 so there is no dead gutter.
     - Place the chip tooltip below the chip, or hide the label while a tooltip shows.

6. **Directory opens with a second intent picker that carries a Brazil context on an English page.**
   - The "Choose by how you intend to trade / Open to refine residence, product and funding route… / Current context BR · spot · Pix" bar sits between the h2 and the filters.
   - It duplicates the hero's intent group, shows a Brazil-specific context to a global visitor, and adds a 4th control row before any data.
   - Filtering also inserts a new line ("Showing 12 of 24 · Reset filters") above the list, which pushes the rows down about 60px on each filter toggle.
   - Fix:
     - Collapse the bar into a single text link after the list ("Refine by residence and funding →"), or hide it outside `/br`.
     - Keep the count and Reset in the filter row (`margin-inline-start: auto`) so toggling does not move the list.

7. **Casing and terminology are still inconsistent (part of the "AI味" complaint).**
   - Title Case leaks from legacy components:
     - "Referral Code", "Official Domain", "Transparent Affiliate Disclosure:" (card);
     - "Spot Maker / taker" (readout);
     - "Crypto Platform Directory" (h2, vs sentence-case "Compare meaningful differences…" and "Verify before you leave");
     - "Activities and listings center" (nav);
     - footer "Platform Directory", "Fee Calculator", "Topic Guides".
   - "signup" / "Sign up" / "sign-up" all appear on one page.
   - Fix: sentence case everywhere, and one form ("sign-up" as noun and adjective, "Sign up" as the verb button). Fix it in the i18n source strings, not via `text-transform`.

8. **ar/ja web fonts are one weight aliased to four, and the ar stack is OS-dependent.**
   - `ar-400…700.woff2` are identical files, as are `ja-*`. The H1 and h2 at 600 therefore have no real bold: they render as 400, or as synthetic bold on some engines, so the hierarchy weakens exactly in the locales the user checks.
   - "Noto Sans Arabic", "Geeza Pro" and "Segoe UI" precede the shipped face, so macOS and Windows users see different Arabic faces.
   - Fix:
     - Ship real 400 and 600 subsets (or a variable subset with a `font-weight: 400 600` range).
     - Put the shipped family first in `:lang(ar)` / `:lang(ja)`.
     - Relatedly, en and de pages also download Pilot Noto SC, TC and JP (about 120KB): `unicode-range: U+0-10FFFF` plus a glyph Geist lacks triggers the fallback. Give each CJK face a real unicode-range.

9. **Verify copy contradicts itself, and the venue chips reorder under the user.**
   - For Coinbase, step 2 shows "No code needed for this venue", followed by "If the signup page does not prefill it, enter it before you submit."
   - The chip order changes with lab state (OKX, Coinbase, Binance… after lab edits).
   - Fix:
     - Hide the prefill helper when no code exists.
     - Keep chip order fixed and only move the selection.
   - The holes under steps 2 and 3 (about 105px) could take a shared foot row: "Your address bar…" in step 1 is the only foot line, so move the step-1 note out and put all three notes on one baseline.

10. **Fiat on-ramp intent still produces no information (round-6 #14).**
    - Fix:
      - Show verified methods as chips (Card / Bank / P2P) when the record has them.
      - Otherwise, state once under the intents: "Payment methods not yet checked — confirm on the official page."
      - Do not add a "Not yet checked" row to every readout.

11. **The hovered route goes accent while the selected route is also accent.** Two accent routes compete, and the brief reserves the accent for *the* active route. Fix: render the hover preview at the neutral 70% tone with a dashed or thinner stroke, and keep the accent for the selection.

12. **With JS off, the OKX and Hyperliquid node logos are blank.** They are likely `loading="lazy"` images, or an SVG sprite that is only injected after hydration. Fix: use `loading="eager"` for the 8 hero nodes, or inline the SVG.

13. **The closing index is still a sitemap (about 800px of 6 link groups) directly above a footer with its own link grid.** Fix: collapse the groups into `<details>` at all widths (hrefs stay in the DOM, which satisfies SEO), or merge them into the footer columns. Doing this would also remove most of the post-CTA scroll.

14. **Originality ceiling below the fold.** Compare (ledger), Verify (stepper), Directory (table) and Closing (sitemap) are each well made but familiar. To reach SOTD, the route metaphor must *transform* content, not just thread a hairline past it. Examples:
    - Verify's three stations become literal stops on the rail, so the rail bends into them.
    - The selected hero venue travels down the page, persisting as the lab's slot A, the Verify domain and the highlighted directory row, so the route is continuous.

## What improved since round 6

- **The page spine now exists at first paint:** the rail is SSR'd with scroll-timeline fill and no 5s pop-in.
- **Verify reads in under a second:** the stamp never disappears, and the venue switch is instant.
- **Hero logic and order are coherent:** intents come before results, the On-chain intent shows chains, there is one canonical domain, the re-route takes about 300ms, and hover shows a domain + fee chip.
- **The lab lost its double rail,** and there is now a single shared picker with slot targeting.
- **Mobile is fully clean:** no sub-44 targets in any locale, the CTA is in the first viewport, and ja tiles and ar leading are fixed.
