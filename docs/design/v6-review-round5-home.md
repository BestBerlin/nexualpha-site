# V6 independent review, round 5: HOME `/` (build 3.0-20261008T1943-GH-5890f04, branch v6-merged5)

Reviewer: independent, did not build. Gate: every score must be at least 8 (benchmark: Awwwards/FWA SOTD).

## Build checks

- `/version.json` returns `{"version":"3.0.0","buildId":"3.0-20261008T1943-GH-5890f04"}`. It is served by `preview.sh v6-merged5 4631`.
- The stylesheet is applied. `h1.rf-title` is 72px at x=120 on `/` at 1440, and 44px at x=24 at 390.
- Document height is stable at 6818px (en, 1440). The round-4 growth loop is gone.
- No page errors in any capture.

## Method

- Browser: Playwright `channel='chromium'` with `--disable-gpu`, one browser per run.
- Viewports: 1440x900 and 390x844 (touch, `is_mobile`).
- Locales: en, `/de/`, `/ar/`, `/ja/`.
- Before each type audit and full-page capture, the page was scrolled in 300px steps and then returned to the top.
- Interaction frames and samples:
  - all 4 intents (16 / 100 / 150 / 250 / 400 / 700ms);
  - node hover and click;
  - keyboard Arrow and Tab on the intent radio group;
  - lab: swap hover and click (40 / 120 / 240 / 500ms), chip select (Kraken), ArrowRight on a chip, drag of Coinbase onto the second slot, popular-matchup hover;
  - Verify scroll-in (100 / 400 / 900 / 1800 / 3000ms) and venue switch;
  - directory: Perp DEX segment, No KYC chip, code copy (clipboard granted), Sign-up hover;
  - rail at 6 scroll depths;
  - closing CTA hover.
- Mobile: intent tap, chip-row gutters, copy, row heights, bottom nav.
- Screenshots were JPEGs in the scratchpad and were deleted after review.

Timing caveat: headless chromium without a GPU under CPU load stretches timings. Durations were therefore read from the CSS and checked against frames, not trusted from samples alone.

## Scores (0-10; 5 = competent template, 8 = award-worthy)

| Dimension | R4 (B) | **R5** | One-line reason |
|---|---|---|---|
| Typography | 7.5 | **7.5** | All 7 size steps hold and there are now only 3 line-heights (1.05 / 1.15 / 1.55). Off-brief weights 650/700/800 remain, and the ja H1 breaks the word プラット / フォーム. |
| Whitespace / rhythm | 6.5 | **6.5** | There is a 162px Compare → Verify void in every locale and dead area under Verify steps 2 and 3. The lab is 1500px tall. The hero card has a reserved empty band. On mobile, the CTA sits 1.5 screens down. |
| Hierarchy | 7 | **7.5** | There is a single 72 peak (H1 only), and the closing title and gap numeral are now 44. The directory still promotes the no-code row with a filled CTA. The hover readout and the card show two different subjects. |
| Colour | 7 | **7.5** | Only one filled accent in the hero viewport. However: a filled turquoise "Check eligibility" (Coinbase) at 1440, a neon drop-shadow glow on the active route, and all 4 rail labels in the accent by the closing. |
| Motion | 6.5 | **7** | Segment-sequenced route draw, FLIP swap (168 → 23 → 0.8px → none) and the Verify arming are all real. But the conversion card blinks to opacity 0 on every choice. The routes and the rail are client-only and arrive after hydration. There is no count-up. |
| Micro-interaction | 7.5 | **8** | Drag-to-slot, ArrowRight on chips, radio-group keyboard with a 2px accent focus ring, stable chip widths, a gap row that stays mounted, copy pop with a check, and Sign-up hover fill all work. |
| Responsive | 7 | **6.5** | The 24px chip gutters are fixed and there is no horizontal scroll. The mobile Official-signup CTA is at y=1286 behind 3 stacked buttons, directory rows are 171–185px each, and the ar/ja bottom-nav tabs are under 44px wide. |
| Originality | 6.5 | **6.5** | The "map" is still a comb: one trunk into a column of tiles beside a card. Below the fold is a framed form-like lab, a step band and a table. Competent dark fintech, not SOTD. |

**Gate fails: 1 of 8 scores is at or above 8 (micro-interaction).** This round is a real improvement over round 4 (B) in hierarchy, colour, motion and micro-interaction. Whitespace, responsive and originality have not moved.

## Distinct computed font sizes (visible text nodes)

Scale: 12 / 14 / 16 / 20 / 28 / 44 / 72.

| Viewport | Locales | Sizes | Off-scale |
|---|---|---|---|
| 1440 | en / de / ar / ja | 12, 14, 16, 20, 28, 44, 72 | none. 72 is used only by `h1.rf-title`. |
| 390 | en / de / ar / ja | 12, 14, 16, 20, 28, 44 | none. 44 is used only by the H1. |

- **Line-heights:** 1.05, 1.15 and 1.55 only. Round-4 defect #13 is fixed.
- **Families:** Geist V5 and Geist Mono V5 only.
- **Weights:** 400, 450, 500, 600, 650, 700, 800. The brief allows 400/500/600 only. The off-brief weights are:
  - `.registration-card__next-step span`: 800 ("Next step");
  - `.registration-card__next-step b`: 700;
  - card detail `b`: 650 ("Configured", "Confirm on the official…", "Available to confirm…");
  - `b` names in `.cl-pop__names`: 700 (Binance, OKX);
  - `.v2-brand-fallback`: 700 ("AE" for Aevo);
  - `.nx-search__label`: 450.

## Voids > 160px

| Render | Location | Size |
|---|---|---|
| 1440, all 4 locales | After `a.cl-pop__link` → `h2#vb-title` (Compare → Verify). en at y=2281, de 2293, ar 2231, ja 2303. | 162px |
| 1440 (visual, no text node) | Under `.vb__st--2` and `.vb__st--3`. Steps are 237px and 266px tall vs 340px for step 1, then 128px of pad, so the right two-thirds are empty for about 230px before the Directory H2. | about 230px |
| 1440 and 390 | Inside `.rf-card`, between "Route, code and eligibility details" and the disclosure (reserved height) | about 56px. Not more than 160px, but it reads as a hole in the conversion card. |
| 390 | None by text-gap audit | — |

## Tap targets < 44px at 390

| Element | Size | Note |
|---|---|---|
| `button.nx-skip` | 1x1 | Visually hidden; acceptable. |
| ar `.mobile-bottom-nav` "مقارنة" | 37x48 | Still open from round 4. |
| ar `.mobile-bottom-nav` "اتصال" | 39x44 | Still open from round 4. |
| ja `.mobile-bottom-nav` "比較" | 28x48 | Still open from round 4. |
| `a.dir6-group__name` "Curve" (1440) | 39x44 | |
| Header `a` "مقارنة" (ar, 1440) | 37x48 | |

The registration-card `summary` now passes.

## Round-4 defects: status

| # | Round-4 defect | Status |
|---|---|---|
| 1 | `v6/index.css` emptied | **Fixed** (6ccd292). |
| 2 | Unbounded page growth | **Fixed.** Height is stable at 6818 (en 1440) and the SVG is 1440x831. |
| 3 | Hero card invisible about 1s on load | **Fixed on load** (opacity 1 at 100ms). **New:** the card now blinks to opacity 0 on every intent or node change (see #4 below). |
| 4 | Route draw imperceptible | **Fixed.** Chain segments draw 220ms each at a 180ms stagger, `cubic-bezier(.65,0,.35,1)`. The fan draws 320ms with `--i*40ms` at opacity 0.5. The 150ms frame shows the route mid-draw. |
| 5 | 72px numeral / 72px closing title | **Fixed.** Both are 44 (28 at 390). |
| 6 | Accent discipline | **Partial.** The hero has one fill. The directory "Check eligibility" (no-code rows) is a filled accent at 1440 but ghost at 390. |
| 7 | Verify dead space and 178px gap | **Partial.** Steps are now 6/3/3 and the gap is 162px (still above 160). About 230px of dead area remains under steps 2 and 3. |
| 8 | Lab layout shift / no FLIP | **Fixed.** FLIP works, chip widths are constant, and `.cl-gap` stays mounted with "Not yet checked". |
| 9 | Hero foot link dump | **Fixed.** The links have moved to the closing index. |
| 10 | Mobile chip rows flush to the edge | **Fixed.** `.vb__venues` and `.dir6-chips` have 24px padding and scroll-padding. |
| 11 | Readout numeral wrap | **Fixed** in the readout (the intent cell is on its own row). **New:** node tiles overflow (see #8 below). |
| 12 | On-chain lights perp DEXs only | **Fixed.** The node set swaps to Uniswap / PancakeSwap / Jupiter / Raydium / Hyperliquid / dYdX / GMX / Drift. **New:** 7 of the 8 read "Spot —" (see #9 below). |
| 13 | Line-height sprawl | **Fixed** (3 values). |
| 14 | Tap targets | **Partial.** The `summary` passes. The ar/ja bottom-nav tabs are still narrow. |
| 15 | Rail is a hairline | **Fixed.** Docks are labelled Compare / Verify / Directory / Open account at 12px, and the active label lights. **New:** every passed label stays accent (see #15 below). |
| 16 | Hover creates two subjects | **Not fixed.** On OKX hover, the readout shows OKX, `.rf-route.is-hot` lights, and the card still shows Binance. |
| 17 | Copy fallback shifts the layout | **Fixed / n.a.** Copy succeeded (clipboard = "11350287"). Document height was unchanged at 6818, and the `.dir6-pop` "Copied" popover is used. |

## Defects, most severe first

1. **Mobile: the conversion card is 1.5 screens below the fold.**
   - At 390, "Official signup" is at y=1286, `.rf-intent` at 622 and `.rf-card` at 937. The fixed `.mobile-bottom-nav` covers 782–844.
   - In front of it are three full-width stacked buttons ("30s Matcher Wizard", "Compare Platforms", "Browse the directory") plus the intent row.
   - Fix:
     - At 390, render one primary ghost button and one text link side by side (48px).
     - Move the intent row directly under the value line.
     - Put the logo strip and a compact card (logo, code, Official signup) in the first viewport. Keep fees, domain and disclosure in a disclosure row below.
     - Target: CTA bottom ≤ 760px.

2. **The route map and the rail are client-only, so the signature visual is missing at first paint, for no-JS, and until hydration.**
   - `.rf-svg` has 0 paths and `.rr` has 0 children until hydration. Measured 3.5–5.4s after DOMContentLoaded (headless, en and ar). At t=1.5s after networkidle, ar still had a 0x0 SVG.
   - LCP is taken without the map, and the rail pops in later.
   - Fix: SSR a static geometry. The node column has fixed row heights (81px pitch) and the intents are fixed tiles, so the default intent's paths can be computed at build time in viewBox units (`preserveAspectRatio="none"` plus `vector-effect: non-scaling-stroke`). Let the client ResizeObserver only refine them. Do the same for `.rr` (CSS-only track and fill via `animation-timeline: scroll()` with a fallback).

3. **The "map" is still a comb, not a map (originality).**
   - At 1440, the fan collapses into a 1px vertical trunk at x≈820 with 8 stubs into a column of 180px tiles, and then a 282px card column.
   - It reads as "list + card" with decorative hairlines. The routes have no horizontal travel and do not cross any space.
   - Fix:
     - Give the map its own field. Stagger the nodes on two x-positions (zig-zag, e.g. 834 / 900) or arc them, so the curves span 160–240px horizontally.
     - Light the hovered route all the way to the node, then dock the card to the chosen node: the card head slides beside the node, connected by the route end.
     - Remove the 12-col "three boxes" read.

4. **The conversion card blinks to opacity 0 on every choice.**
   - `.rf-card[data-swap]` uses `rf-swap 240ms … both` from `opacity:0`. Sampled opacity was 0 at 30, 120 and 240ms after a node click and 1 at 400ms, and 0 at 16ms after an intent change.
   - The Official-signup button disappears each time the user explores.
   - Fix: animate only the inner `.registration-card__head`/code (opacity 0.4 → 1, translate 8px → 0, 200ms). Keep the card frame and the CTA at opacity 1.

5. **Hover still creates two subjects (round-4 #16 unchanged).**
   - Hovering OKX changes `.rf-readout` to OKX and lights `.rf-route.is-hot`, but `.rf-card` stays Binance.
   - Fix: on hover, ghost-swap the card head (logo, name, domain) at 60% opacity. Otherwise, keep the readout on the selected venue and show the hover fee in a tooltip on the node itself. Restore on `pointerleave` after 120ms.

6. **Directory accent fill re-ranks venues at 1440.**
   - `.dir6-cta--verify` ("Check eligibility", e.g. Coinbase row 2) is filled turquoise `rgb(31,224,192)` at 1440 while every "Sign up" is ghost. The most saturated element in the table points at a venue with no code.
   - At 390 the same button is ghost, which is inconsistent.
   - Fix: make `.dir6-cta--verify` ghost at every width. Use the accent only on hover, focus or selection.

7. **Compare → Verify void and Verify dead area.**
   - The gap after `.cl-pop__link` to `h2#vb-title` is 162px (all locales).
   - `.vb__st--2` and `--3` end about 100px above step 1, then 128px of pad.
   - Section padding is applied inconsistently: `#compare` is 0/128, `.vb` 0/0 and `#exchanges` 128/64.
   - Fix:
     - Normalise to `padding-block: 128px` on each `.v6-section` and zero the internal margins.
     - Use `align-items: end` on `.vb__route`, or move "Your address bar must show exactly this domain…" under steps 2–3 as a full-width foot line, so all three stations end on one baseline.

8. **Node tile numerals overflow at 1440.**
   - With Perps active, Hyperliquid's "Perp 0.015 / 0.045%" runs to x≈1021, past the 1013 tile edge. Bybit's "0.02 / 0.055%" touches the edge.
   - Fix: give `.rf-node__fee` 12px mono with `font-variant-numeric: tabular-nums`. Drop the repeated "Perp/Spot" prefix (the intent already says it), or give the node column 200px.

9. **The On-chain intent shows a map of dashes.**
   - 7 of the 8 DEX nodes read "Spot —", the default subject is the 5th node (Hyperliquid), and the readout cell says "On-chain: Not yet checked".
   - The route the user asked for has almost no information.
   - Fix: for DEX nodes, show what is verified (chain, e.g. "Ethereum · Solana", and the official domain) instead of a fee dash. State "Fees not yet checked" once in the readout. Reorder so the selected node is first, or animate the selection to it.

10. **The Compare Lab is a 1500px framed form.**
    - It has two identical 10-chip clouds (20 `label.cl-chip`) above a centred id row. On an unchecked venue (Coinbase) half of every bar row is "—" with nothing on the other side.
    - Visually this is a settings panel in a card: the "PPT" feel the user named.
    - Fix:
      - Replace the chip clouds with one slot-picker per side (logo combobox or horizontal logo rail), with drag and keyboard retained.
      - Drop the outer frame (full-bleed ledger on the page grid).
      - Collapse unchecked rows into one "Not yet checked: spot, perp" line.
      - Target ≤ 900px height.

11. **Off-brief font weights.**
    - 800 on `.registration-card__next-step span`, 700 on `.registration-card__next-step b`, `.cl-pop__names b` and `.v2-brand-fallback`, 650 on card-detail `b`, and 450 on `.nx-search__label`.
    - Fix: map to 600 (strong) or 500. Add a `b, strong { font-weight: 600 }` reset inside `#top.v6`.

12. **ja H1 breaks inside a word.**
    - "暗号資産プラット / フォームと / 公式ルートを比較". `h1` has `word-break: auto-phrase` but also `overflow-wrap: anywhere`, which lets Chromium split the katakana compound.
    - Fix: on `:lang(ja) h1.rf-title` set `overflow-wrap: normal; line-break: strict`, or insert `<wbr>` at phrase boundaries in the ja string ("暗号資産<wbr>プラットフォームと<wbr>公式ルートを比較").

13. **Tap targets.**
    - The ar/ja bottom-nav tabs are still 28–39px wide. Set `min-inline-size: 44px` on `.mobile-bottom-nav a` (and `flex: 1 0 44px`).
    - Set `min-inline-size: 44px` and padding on `a.dir6-group__name` (Curve, 39px).

14. **Mobile directory rows are 171–185px each.**
    - Each row is a 3-tier card (identity / fee and code / full-width Sign up). Twelve rows is about 2100px, which is not the "dense list" the brief asks for.
    - Fix: use a 2-line row (logo, name and meta on line 1; fee, code chip and a compact 44px Sign-up icon button on line 2), at about 104px per row.

15. **Rail accent dilution.**
    - By the closing, all four `.rr__lab` labels are accent (`data-on` 1111). "Open account" wraps to two lines in the gutter.
    - Fix: accent only the current dock and return passed docks to `--text` with an accent node. Use `white-space: nowrap` and a shorter label ("Open").

16. **Reserved empty band inside the hero card.** There are about 56px of nothing between `details` "Route, code and eligibility details" and the disclosure (1440 and 390). Remove the min-height reservation, or place the "Check before signup" line there.

17. **The active route glow is a neon trope.** `.rf-route__line--on { filter: drop-shadow(0 0 5px accent 70%) }` adds AI-style glow. Drop the filter. Use a 2px stroke plus the travelling pulse.

18. **No fee count-up on node hover/focus.** The brief says the hover previews the fee with a count-up; the readout swaps instantly (identical at 40, 120 and 300ms). Add a 240ms tabular count, or drop it from the brief.

19. **Closing index at 390.**
    - The 2-column link grid wraps titles into 2–3 lines at line-height 1.15 (e.g. "Hyperliquid vs / dYdX", "Join NexuAlpha Telegram · Rebate Tracking · Safe Onboarding").
    - Together with "Open research tools", it forms a link wall of about 900px right after the CTA band.
    - Fix: use a single column at 390 with 1.3 line-height and 12px vertical padding, and collapse the groups into `<details>` (keeping the hrefs in the DOM).

## What improved since round 4

- The build is whole: the stylesheet is restored and height is stable. Type is on 7 sizes, 3 line-heights and 2 families in every locale and width, with a single 72 peak.
- The route draw is now staged and visible, the lab swap is a true FLIP, chips no longer reflow, and the gap row is persistent.
- The on-chain node set is a real DEX set, the hero foot link rows are gone, the rail has labelled docks, and the mobile chip gutters are fixed.
- The hero CTA hierarchy is cleaner (one filled CTA per viewport), and the closing title is demoted to 44.
