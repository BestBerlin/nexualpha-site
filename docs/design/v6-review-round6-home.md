# V6 independent review, round 6: HOME `/` (build 3.0-20261008T2111-GH-c32002e)

Reviewer: independent, did not build. Gate: every score must be at least 8 (benchmark: Awwwards/FWA SOTD).

## Build checks

- `/version.json` returns `{"version":"3.0.0","buildId":"3.0-20261008T2111-GH-c32002e"}` on `localhost:4731`.
- `h1.rf-title` is 72px at x=120 on `/` at 1440 (ar: 72px, right-aligned at x=630). At 390 it is 44px at x=24.
- Document height at 1440 is en 6299, de 6312, ar 6101 and ja 6162 (round 5: 6818). At 390 it is en 8008, de 8130, ar 7603 and ja 7866. No horizontal scroll and no page errors in any capture.

## Method

- Browser: Playwright `channel='chromium'` with `--disable-gpu`.
- Viewports: 1440x900 and 390x844 (`is_mobile`, touch).
- Locales: en, `/de/`, `/ar/`, `/ja/`.
- Before every type, void or tap audit and every full-page capture, the page was scrolled in 300px steps and then returned to the top.
- Interaction frames and samples:
  - Hero:
    - all 4 intents (frames at 16 / 150 / 400 / 900ms);
    - node hover (40 / 120 / 300ms);
    - node click, with rAF sampling of the card position and of `stroke-dashoffset` on the active route;
    - keyboard: ArrowRight on the radio group, then Tab;
    - focus on a node (count-up check).
  - Lab: swap hover and click (rAF-sampled FLIP), chip select (Kraken), ArrowRight on a chip, drag of Coinbase onto slot B.
  - Verify: scroll-in sampled every 100ms for 6s, venue switch, code copy.
  - Directory: Perp DEX segment, No KYC chip, code copy (clipboard granted), Sign-up hover.
  - Rail at 6 depths; closing band.
- JS disabled: first paint at 1440 and 390.
- First-paint timing with JS: polling from `commit`.
- Screenshots were JPEG/PNG files in the scratchpad and were deleted after review.

Timing caveat: headless chromium without a GPU stretches timings. Durations were cross-checked against the computed CSS.

## Scores (0-10; 5 = competent template, 8 = award-worthy)

| Dimension | R5 | **R6** | One-line reason |
|---|---|---|---|
| Typography | 7.5 | **8** | Clean in every locale and width: 7 sizes, weights 400/500/600 only, 3 line-heights, 2 families, and the ja H1 no longer splits a word. Still open: ja intent tiles break mid-word ("オンチェー/ン", "法定通貨入/金"), Arabic display at line-height 1.05 is cramped, there is no deliberate CJK/Arabic face, and CTA casing is mixed. |
| Whitespace / rhythm | 6.5 | **7.5** | No void over 160px in any locale. The lab dropped from 1500 to 727px and the Verify stations share one baseline. Still: about 125px holes mid-column in Verify steps 2 and 3, directory bottom pad 64 vs 128 everywhere else, and a closing index whose 360px label column sits empty while links wrap. |
| Hierarchy | 7.5 | **7.5** | One 72 peak and one filled CTA per viewport. But in the hero the answer (readout) sits above the question (intents), and there are three equal-weight secondary actions. Node hover now shows no preview at all. |
| Colour | 7.5 | **8** | The directory "Check eligibility" is ghost, the neon glow filter is gone, and passed rail docks return to neutral. The accent is used for the CTA, positive data and the active route only. |
| Motion | 7 | **7.5** | The routes are now server-rendered, the card no longer blinks, the card docks with a route that runs into its head, the FLIP swap works, and there is an ambient pulse. But the route redraw takes about 900ms per choice, the Verify verdict lands about 3.7s after scroll-in, the rail mounts about 5s after commit, there is no count-up, and the swap commits about 280ms after the click. |
| Micro-interaction | 8 | **8** | Drag, chip arrows, radio keys, 2px focus rings, copy with a "Copied" pop, Sign-up hover fill and swap-icon rotation all work. Node hover only brightens a hairline, and the `.cl-chip` uses `transition: all`. |
| Responsive | 6.5 | **8** | Official signup is now at y=631–679 at 390 (round 5: 1286), inside the first viewport in all 4 locales (de 702–750). Directory rows are about 113px, the bottom nav is 73x49 per tab, and there is no horizontal scroll. Still open: ja tile wraps, Arabic leading, and the hidden `.rf-skip` nav and ar footer links under 44px. |
| Originality | 6.5 | **7** | The hero is now a real composition: intent → You → gate → arced node stack → card, with the route entering the card. Below the fold it is still a familiar ledger, stepper and table with a hairline thread. Good product UI, but not SOTD. |

**Gate fails: 4 of 8 dimensions are at or above 8 (typography, colour, micro-interaction, responsive). Whitespace, hierarchy, motion and originality are below 8.** This is the biggest single-round jump so far.

## Distinct computed font sizes (visible text nodes, after scroll pass)

Scale: 12 / 14 / 16 / 20 / 28 / 44 / 72.

| Viewport | Locales | Sizes | Off-scale |
|---|---|---|---|
| 1440 | en / de / ar / ja | 12, 14, 16, 20, 28, 44, 72 | none. 72 is used only by `h1.rf-title`. 44 is used by the h2s and `span` "Pick" (closing title). |
| 390 | en / de / ar / ja | 12, 14, 16, 20, 28, 44 | none. 44 is used only by the H1. 28 is used by the h2s and `.cl-gap__num`. |

- **Weights:** 400 / 500 / 600 only, in all 8 renders. Round-5 defect #11 is fixed.
- **Line-heights:** 1.05 / 1.15 / 1.55 only.
- **Families (computed):** "Geist V5" and "Geist Mono V5" only. Geist has no Arabic or CJK glyphs, so ar and ja actually render in an unspecified system fallback.
- The 60px h2s (`campaign-radar__title`, `fee-terminal__title` and others) exist only inside the closed "Open research tools" disclosure, which has 0 height. They are not visible, but they will be the moment it opens.

## Voids > 160px

| Render | Result |
|---|---|
| 1440 en / de / ar / ja | **none** by the text/element gap audit. Compare → Verify is now about 127px (pad 128). |
| 390 en / de / ar / ja | **none**. |

Visible holes below the threshold:

- `.vb__st--2` and `--3`: about 125px between the code box or disclosure paragraph and the bottom-aligned foot line.
- Closing `Related research`: the 360px label column holds only small group labels, while the links wrap into 150px columns.

## Tap targets < 44px at 390

| Element | Size | Note |
|---|---|---|
| `button.nx-skip` | 1x1 | Visually hidden; acceptable. |
| `.rf-skip .home-section-nav a` "比較" (ja) | 28x48 | Sits in the visually hidden section nav. Check that it reaches 44 wide when it is revealed on focus. |
| `.rf-skip .home-section-nav a` "مقارنة" (ar) | 37x48 | Same. |
| `.clean-footer__nav a` "اتصال" (ar) | 39x44 | Footer. |
| `.mobile-bottom-nav` tabs | 73x49 | **Fixed**: every tab passes in all 4 locales. |

At 1440 the footer links are 36px tall (not a touch context).

## JS disabled / first paint

- At both 1440 and 390, the hero is complete with JS off:
  - 22 route paths are present, 4 of them on;
  - the card and Official signup are present;
  - there are 20 lab chips and 20 directory rows;
  - the Verify stamp is in its final state.
- Content is never hidden; the only opacity-0 nodes are the `.dir6-pop` "Copied" popovers.
- **Rail (`.rr`): 0 docks with JS off.** With JS on, the docks mount 4.8–5.6s after `commit` (headless).
- With JS off at 390 the document is 10026px tall (vs 8008 with JS), because the directory "Show more" collapse is JS-only. This is acceptable as progressive enhancement.

## Round-5 defects: status

| # | Round-5 defect | Status |
|---|---|---|
| 1 | Mobile CTA 1.5 screens down | **Fixed.** Official signup is at y=631–679 (en), 617–665 (ar), 635–683 (ja) and 702–750 (de). The intents sit directly under the lede and the node strip under them. |
| 2 | Map and rail client-only | **Half fixed.** The routes are SSR (22 paths at DOMContentLoaded and with JS off). The rail is still client-only and mounts about 5s late. |
| 3 | Map is a comb | **Mostly fixed.** The nodes now sit on an arc (x 762→830). The route runs intent → You → gate → node → card head, and travels about 450px vertically into the card for lower nodes. Still three columns (copy / nodes / card). |
| 4 | Card blinks to opacity 0 | **Fixed.** Card and head opacity stay at 1 at every sample. The card docks (top 179→227, about 300–600ms). |
| 5 | Hover creates two subjects | **Fixed by subtraction.** Hover now only brightens the hovered route, and the readout and card stay on the selection. However, hover now previews nothing (see #6 below). |
| 6 | Directory accent fill | **Fixed.** `.dir6-cta--verify` is ghost; the accent appears only on hover or selection. |
| 7 | Compare → Verify void and Verify dead area | **Mostly fixed.** The gap is about 127px and all 3 stations are 340px on one baseline. The holes have moved mid-column (#5 below). The section pads are still 0/128, 0/128 and 0/64. |
| 8 | Node numerals overflow | **Fixed.** On Perps, every fee ends 13px inside its tile (Hyperliquid 950 vs 963). |
| 9 | On-chain map of dashes | **Not fixed.** All 8 DEX nodes read "Not yet checked", and the readout contradicts them (#3 below). The selected node is now first. |
| 10 | Lab is a 1500px framed form | **Mostly fixed.** It is unframed and 727px tall, with one 44px logo rail per side and collapsed rows on unchecked venues. Two identical 10-logo rails still read as a settings strip. |
| 11 | Off-brief weights | **Fixed** (400/500/600). |
| 12 | ja H1 word break | **Fixed** ("暗号資産 / プラットフォーム / と公式ルートを比較"). **New:** the ja intent tiles break mid-word (#4 below). |
| 13 | Tap targets | **Mostly fixed.** The bottom nav is 73x49. The ar footer link and the hidden section-nav links remain. |
| 14 | Mobile directory rows 171–185px | **Fixed.** Rows are about 113px, and "Show more platforms (12)" collapses the rest. |
| 15 | Rail accent dilution | **Fixed.** Passed docks are `rgb(176,180,186)`; only the current dock is accent. |
| 16 | Reserved band in the card | **Fixed.** Details end at 637 and the disclosure starts at 653 (16px). |
| 17 | Neon glow on the route | **Fixed** (`filter: none`, 2px stroke). |
| 18 | No fee count-up | **Not fixed.** Focus or hover on a node leaves the readout on the selected venue; nothing counts. |
| 19 | Closing index link wall at 390 | **Fixed at 390** (groups collapsed). At 1440 it is still a 600px link grid with a wasted label column (#9 below). |

## Defects, most severe first

1. **The rail is still client-only and arrives about 5 seconds late (signature element missing at first paint and with JS off).**
   - `.rr` has 0 children with JS off. With JS on, `.rr__dock` first appears 4.8–5.6s after `commit` (headless; real devices will be faster but still post-hydration). It is the page's spine ("route" metaphor), and it pops in under the reader.
   - Fix: SSR the track, the 4 docks and their labels as static markup, with dock positions as CSS custom properties written at build time or from section order via `position: sticky` anchors. Drive the fill with `animation-timeline: scroll(root)` inside `@supports`, and let JS only refine `data-on`.

2. **Verify verdict lands too late: the domain-check micro-sequence takes about 3.7s.**
   - Sampled after `#verify` scrolls in:
     - `vb__typed` reaches 1 at 0.2s;
     - `.vb__bar--fake` fades in at 1.5–1.9s;
     - `.vb__stamp` ("OFFICIAL") only reaches 1 at 3.7–3.9s.
   - Until then, the official bar shows an empty lock slot and no verdict (seen in the 400ms and 1800ms frames). After a venue switch, the sequence replays and the stamp is again missing at 700ms.
   - A reader scrolling at normal speed passes the station before the proof appears. The brief caps durations at 120–400ms.
   - Fix: compress to about 900ms total (typed 0–250, fake row 250–500, stamp 500–800 with a 160ms scale-in). Render the lock icon immediately. On venue switch, crossfade the domain text in 200ms and keep the stamp.

3. **On-chain intent: the map is still empty of facts, and the readout contradicts the nodes.**
   - With On-chain active, all 8 nodes read "`<domain>` · Not yet checked".
   - Meanwhile `.rf-readout` for the selected Hyperliquid shows "Spot 0.04 / 0.07% · Perp 0.015 / 0.045%", and its node says "Not yet checked".
   - The gate label shows `hyperliquid.xyz` while the card shows `app.hyperliquid.xyz` as the "Official Domain". Two different official domains on one screen undermines the trust promise.
   - Fix:
     - Show one canonical domain per venue in the gate, card and Verify (`app.hyperliquid.xyz` if that is the record).
     - Make node text intent-specific: for the DEX set show the chain(s) ("Arbitrum", "Solana", "BNB Chain") as verified meta.
     - When a fee exists for that venue, show it in the node, so it agrees with the readout.

4. **ja intent tiles break inside words.**
   - At 1440, `.rf-intent` labels wrap as "法定通貨入 / 金" and "オンチェー / ン" inside 93px tiles. The same happens at 390 (tiles 70px tall).
   - Fix: on `:lang(ja) .rf-intent`, use `word-break: keep-all; line-break: strict; overflow-wrap: normal`, and shorten the strings ("法定入金", "オンチェーン" on one line). Alternatively, let the tiles grow to `min-inline-size: max-content` with the radiogroup scrolling.

5. **Verify: mid-column holes in steps 2 and 3, and inconsistent section padding.**
   - With `align-items: end`, step 2 has about 125px of nothing between the `NEXU888 / Copy code` box and "If the signup page does not prefill it…". Step 3 has the same gap between the disclosure paragraph and "Read the affiliate disclosure".
   - `#exchanges` padding-bottom is 64px while `#compare` and `#verify` use 128. Every section has padding-top 0, so the brief's "128 desktop / 72 mobile, always" is applied one-sided.
   - Fix:
     - Top-align the stations and move the three foot lines ("Your address bar…", "If the signup page…", "Read the affiliate disclosure") into one shared row (`grid-row: 3` across the route grid), so the hole becomes a deliberate baseline band.
     - Set `#exchanges { padding-block-end: 128px }` (72 at 390).

6. **Node hover and focus preview nothing, and there is still no count-up (brief item).**
   - On hover, the OKX route brightens. The readout and card stay on the selection and there is no tooltip (`[role=tooltip]` count 0).
   - On focus of Bitget, the readout stays OKX for 300ms. The node already prints its fee, so hover adds no information.
   - Fix: on hover or focus, show a 12px mono chip anchored to the node end of the route (official domain plus the fee for the active intent). Count the number from the selected venue's value in 240ms with tabular nums, and restore on leave after 120ms. Alternatively, remove the count-up from the brief.

7. **Route redraw is slow on every exploration (about 900ms).**
   - rAF sampling after a node click: the 4 chain segments animate one after another. Segment 1 ends at about 440ms, segment 3 at 640–870ms and segment 4 at more than 900ms. The card docks at 300–600ms.
   - The brief asks for 500ms expo-out. At 900ms per click, rapid browsing feels laggy, and the route reaches the card after the card has already changed.
   - Fix: on the first, scroll-in draw, keep the staged chain. On subsequent selections, redraw only the segment that changes (gate → node → card) in 320ms expo-out, and keep intent → You → gate static.

8. **Hero order: the answer sits above the question, and secondary CTAs are equal-weight.**
   - Left column order is H1 → lede → three CTAs ("30s Matcher Wizard", "Compare Platforms →", "Browse the directory") → readout (`.rf-readout`: Binance fees) → "What do you want to do?" intents.
   - The interactive premise ("state your intent") comes last, after the result it produces. Two boxed ghost buttons plus a link compete with the card's single filled CTA.
   - Casing is inconsistent: "Compare Platforms" (Title Case) vs "Browse the directory" vs "30s Matcher Wizard".
   - Fix:
     - Put the intents directly under the lede, and the readout under the intents (reading order = interaction order, as already done at 390).
     - Reduce the actions to one ghost button plus one text link.
     - Use sentence case everywhere ("Compare platforms").

9. **Closing "Related research" index at 1440 wastes its left column.**
   - `.v6-close` is 1384px tall (en). The group labels ("Brazil decisions", "Comparisons", …) sit alone in a 360px column. The links are packed into three 150px columns and wrap ("Brazil platform / comparison", "Join NexuAlpha Telegram / · Rebate Tracking · / Safe Onboarding").
   - It reads as a sitemap dump right after the strongest band on the page.
   - Fix: use a 12-column grid with labels in cols 1–3 and links in cols 4–12 as 3 × 3-col cells (about 280px each, no wrap). Alternatively, apply the 390 treatment at all widths (`<details>` per group, closed by default, hrefs stay in the DOM).

10. **Arabic and Japanese display type are not designed.**
    - The computed family is "Geist V5", but Geist lacks Arabic and CJK glyphs, so both locales fall back to an arbitrary system face.
    - The Arabic H1 at 72px and line-height 1.05 has ascenders and dots crowding the line above ("العملات الرقمية / والمسارات الرسمية"), and at 390 the 4 lines nearly touch.
    - Fix:
      - Add `:lang(ar)` and `:lang(ja)` stacks with an explicit pairing (e.g. IBM Plex Sans Arabic / Noto Sans Arabic UI, and Noto Sans JP or the system "Hiragino Sans"), subset and `font-display: swap`.
      - Set `:lang(ar) .rf-title, :lang(ar) .v6-h1 { line-height: 1.25 }` (a documented exception to the 1.05–1.15 heading rule).

11. **Lab swap reacts late, and `.cl-chip` uses `transition: all`.**
    - rAF sampling: the content does not move for about 280ms after the click (only the icon rotates). The FLIP then runs from 720px to 0 over about 300ms, so the result settles about 600ms after the click.
    - `.cl-chip { transition: all }` animates layout properties and risks jank.
    - Fix: commit state synchronously on click and start the FLIP in the same frame, with the icon rotating in parallel. Replace `all` with `background-color, border-color, translate, box-shadow` at 140ms.

12. **Lab still opens with two identical 10-logo rails (the "settings strip").**
    - `.cl-grid--pick` holds two 44px rails of the same 10 grey logos left and right, under the ids. The bars area for an unchecked venue collapses well, but the first impression of the section is still a form.
    - Fix:
      - Show the rail only for the side being edited: click on `.cl-id--a/--b` opens its rail in place of the bars, with a 240ms height transition.
      - Alternatively, use one shared rail where a click fills the "active" slot (highlighted id), keeping drag-to-slot.

13. **Hero "Source notes · View all" bar reads as a kicker above the H1.**
    - `aside.rebate-ticker-bar` sits at y=64–112, directly above the H1 at 1440 (12/14px grey label plus a link).
    - The brief bans kickers above headings, and it pushes the H1 down 48px.
    - Fix: move it under the readout or into the footer of `.rf-card` ("Sources"). At 390 it already sits below the CTAs.

14. **Fiat on-ramp intent adds an all-"Not yet checked" row.**
    - Choosing Fiat on-ramp adds "Fiat on-ramp: Not yet checked" to the readout for every venue. Hyperliquid and GMX are ghosted as "Not offered".
    - The intent therefore produces no positive information.
    - Fix: show the verified on-ramp methods (card / bank / P2P) as chips when the record has them. Otherwise, state once under the intents: "Payment methods not yet checked — confirm on the official page."

15. **Small tap targets.**
    - The ar footer `a` "اتصال" is 39x44.
    - The `.rf-skip .home-section-nav a` links are 28–37px wide (hidden until focus; confirm the focus-visible state is at least 44x44).
    - Fix: give `min-inline-size: 44px` and inline padding to both.

## What improved since round 5

- The hero map is now SSR and visible with JS off. The nodes arc, the route flows intent → You → gate → node → card head, the card no longer blinks and it docks.
- Mobile is solved: the conversion card and Official signup are in the first viewport in every locale, the bottom nav passes, and the directory rows are about 113px with "Show more".
- The type system is fully on spec (weights 400/500/600, 3 line-heights, 7 sizes), and the ja H1 breaks correctly.
- Accent discipline holds everywhere (directory ghost CTAs, no glow, neutral passed rail docks). There are no voids over 160px, and the lab is half its former height.
