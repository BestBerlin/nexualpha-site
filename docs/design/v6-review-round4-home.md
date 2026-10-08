# V6 independent review, round 4: HOME `/` (build 3.0-20261008T1802-GH-94fcfbb, branch v6-merged4)

Reviewer: independent, did not build. Gate: every score >= 8 (benchmark: Awwwards/FWA SOTD).
`/version.json` was verified as `{"version":"3.0.0","buildId":"3.0-20261008T1802-GH-94fcfbb"}`, served from `/home/claude/review/v6m4/pkg`.

## Verdict: BLOCKED, the build ships without the V6 stylesheet

The merge commit `94fcfbb` ("Merge v6r4-fn (v6-merged4)") emptied `pilot-01-prototype/src/styles/v6/index.css` to 0 bytes. The diff shows 14 lines deleted: all of its `@import`s. Probably a conflict between the `v6r4-fn` copy (which added `link-grids.css` and `tap-targets.css`) and the other branch's copy (which added `pages-inner-r4.css`) was resolved to nothing.

Only `compare-lab.css` still loads, because `CompareLab.jsx` imports it directly. Every rule for `.rr*`, `.rf-*`, `.vb__*`, `.dir6-*`, `.v6-close__*`, `.v6-wrap`, `.v6-h3` and `.v6-num` is absent from all 26 served stylesheets. At runtime, the class-coverage probe found:

| Section | Classes with no CSS rule |
|---|---|
| rail | 10 of 10 |
| hero | 66 of 115 |
| verify | 43 of 45 |
| directory | 86 of 119 |
| closing | 75 of 279 |

What the user actually sees on the served build:
- The hero, Verify, Directory and closing are unstyled HTML: browser-default bullets, grey UA buttons, and a 90.56px H1 bleeding from x=0 under the header.
- **The page grows without bound.** `svg.rf-svg` is no longer `position:absolute`. The RouteFinder ResizeObserver sizes the SVG to the grid, which grows the grid, which resizes the SVG again. Measured document height at 1440: 13,746 → 79,482 → 280,674px after 1.5s, 4.5s and 12.5s. At 390: 80,616 → 467,119px. Headless Chromium crashed ("Target crashed") taking a full-page capture.
- Compare Lab renders correctly but floats between thousands of pixels of empty route SVG.

Every score below is therefore given twice:
- **A — as served:** this is the gate.
- **B — CSS restored:** I re-injected `src/styles/v6/{base,system,components,route-finder,compare-lab,verify-band,directory,closing,pages-br,pages-rates,pages-factbook,route-rail,pages-telegram,pages-inner-r4,link-grids,tap-targets}.css` in import order through a Playwright route. This shows what the code would look like once the merge is fixed. Everything after the scores table refers to B unless it is marked [A].

## Method
- Playwright chromium (`/opt/pw-browsers`) at 1440x900 and at 390x844 (touch, is_mobile), for en, /de/, /ar/ and /ja/.
- Each page was scrolled in 300px steps, then returned to top, before the typeaudit-JS and full-page captures.
- Timed frames were taken during:
  - all 4 intents (60/200/450/900ms);
  - node hover and keyboard Tab/Arrow;
  - node click;
  - lab: swap hover/click (60/180/400), chip select, drag of a chip onto the venue slot, Arrow key on a chip;
  - popular-matchup hover;
  - Verify scroll-in (100/400/900/1800/3000) and venue switch;
  - directory: Perp DEX segment, No-KYC chip, code copy, pick-to-compare dock, Sign-up hover;
  - the route rail at 6 depths;
  - closing CTA hover.
- Mobile: intent tap, lab swap, Verify, DEX filter, closing.
- Route stroke-dashoffset was sampled at 16/100/250ms.
- Frames are in the reviewer scratchpad (`r4/ix-*.png`, `S-*.png`, `full-*.png`).

## Scores (0-10; 5 = competent template, 8 = award-worthy)

| Dimension | A as served | B CSS restored | One-line reason (B) |
|---|---|---|---|
| Typography | 1 | 7.5 | Every visible size is on the 7-step scale and only Geist/Geist Mono are used. There are still 16 line-height values, and the 72px compare numeral outranks the 44px H1 at 390. |
| Whitespace / rhythm | 1 | 6.5 | The directory void is gone. Verify still leaves a dead block of about 300px under steps 2 and 3, plus a 178px gap before the Directory H2. The hero foot carries two link rows. |
| Hierarchy | 1 | 7 | H1 > H2 now holds in every locale. Problems: the closing title equals the H1 (72/44), `.cl-gap__num` is 72px (larger than the mobile H1), and two accent CTAs compete in the hero. |
| Colour | 2 | 7 | Graphite discipline and the n2 closing band are good. Turquoise fill is used on 3 CTAs in the hero viewport plus the first directory row, which reads as a recommendation. |
| Motion | 1 | 6.5 | The Verify sequence is a real signature moment. The route draw is still imperceptible (90% drawn at 100ms), lab swap and FLIP do not animate, and the hero card stays invisible for about 1s on load. |
| Micro-interaction | 2 | 7.5 | Drag-to-slot, keyboard radios, node hover → readout, copy fallback and the synced compare dock all work. Chip selection reflows the row, and the gap row appears and disappears. |
| Responsive | 1 | 7 | The mobile hero logo strip is fixed, there is no horizontal scroll, and the bottom nav is fine. Verify venue chips sit flush against the screen edge, matchup copy is crushed, and some ja/ar nav tabs are under 44px wide. |
| Originality | 1 | 6.5 | The map now reads as a map (fan of routes, You → domain hub, rail into the closing route). Below the fold it is still "dark fintech sections" with a framed lab card and a table. |

**Gate fails: A is 0 of 8 at >= 8. B is also 0 of 8 at >= 8.** B is clearly better than round 3 on every axis except whitespace (unchanged).

## Distinct computed font sizes (visible text nodes)
Scale: 12 / 14 / 16 / 20 / 28 / 44 / 72.

| Render | Page | Sizes | Off-scale |
|---|---|---|---|
| A served | 1440, all 4 locales | 8, 11, 12, 12.16, 12.48, 12.6, 13, 13.33, 13.44, 13.76, 14, 16, 18, 20, 22, 28, 40, 60, 72, 90.56 | 14 off-scale (90.56 h1.rf-title, 60 h2#cl-title, 40 h3.v6-h3, 22 code-value, 8 brand fallback, …) |
| A served | 390, all 4 locales | 8, 10, 11, 12, 12.16, 12.48, 13, 13.33, 13.44, 13.76, 14, 16, 17, 18, 20, 22, 28, 36, 44.36, 72 | 14 off-scale |
| B restored | 1440, en/de/ar/ja | 12, 14, 16, 20, 28, 44, 72 | none. 72 is used by h1.rf-title **and** .v6-close__title (brief: 72 = hero display only) |
| B restored | 390, en/de/ar/ja | 12, 14, 16, 20, 28, 44, 72 | none. 72 is used only by `span.cl-gap__num` while the H1 is 44, so the scale is inverted |

- Line-heights (B): 0.90, 1.00, 1.05, 1.10, 1.15, 1.20, 1.25, 1.30, 1.35, 1.40, 1.45, 1.50, 1.55, 1.60, 1.65, 1.67. That is 16 values, unchanged since round 3. Body runs at 1.60, not 1.55.
- Families (B): Geist V5 and Geist Mono V5 only.
- [A] adds `Pilot Inter` (7 nodes, `b`) and `ui-monospace` (`.registration-card__code-value`).

## Voids > 160px
| Render | Location | Size |
|---|---|---|
| A | Whole page after the hero | Unbounded (route SVG feedback loop) |
| B | 1440, all locales: after `span.cl-pop__desc` → `h2#vb-title` (Compare → Verify) | 178px |
| B | 1440: under the Verify step 2/3 columns | About 300px of visual dead area (no text node, so typeaudit does not flag it) |
| B | 390 | None |

## Tap targets < 44px at 390 (B)
- `button.nx-skip` is 1x1 (visually hidden, so acceptable).
- `summary` "Read full disclosure" inside the registration card is 40px tall (en 114x40, de 180x40, ar 104x40, ja 96x40).
- Bottom nav, ar: "مقارنة" 37x48 and "اتصال" 39x44.
- Bottom nav, ja: "比較" 28x48.
- Give `.mobile-bottom-nav a` `min-inline-size: 44px`.

## Round-3 defects: status (judged on B, all regressed on A)
| # | Round-3 defect | Status |
|---|---|---|
| 1 | H1 smaller than H2s | **Fixed.** H1 72/44 vs H2 44/28 in en, de, ar and ja; `.rf-title--long` holds 72/44. |
| 2 | Spot/perp blanked by intent | **Fixed.** Facts persist and only the intent cell says "Not yet checked". |
| 3 | Hero-metric blocks / 138px closing | **Partial.** The hero `.rf-big` is gone and closing is capped at 72. `.cl-gap__num` is still a 72px turquoise stat. |
| 4 | Filler block in hero | **Partial.** Kicker and pill cloud are gone. "On this page" nav, 5 SEO text links, and the Telegram and Brazil rows remain as two link rows at the hero foot. |
| 5 | Route map not a map / no draw / hover | **Partial.** All qualifying routes draw, dim nodes are dimmed, and hover swaps the readout. The draw is still imperceptible (see #4 below). |
| 6 | Typewriter empties | **Fixed.** `.rf-gate` reads "binance.com" at 100/300/700/1500ms. |
| 7 | Lookalike glyph / mobile overflow | **Fixed** (underline plus a "+k" caption). The 390 chip row still has no inline padding (see #10 below). |
| 8 | Cream closing band | **Fixed.** Graphite n2, and the rail ends in the closing route stroke. |
| 9 | Voids | **Partial.** The directory void is fixed. The Verify dead band remains. |
| 10 | Rail orphan | **Mostly fixed.** It sits on the container edge (x=95) and is hidden below 768px. It is still an unlabelled 2px hairline. |
| 11 | Legacy calculator in lab | **Fixed.** `details.cl-fees` has been removed and the matchup rows share one anatomy. |
| 12 | Directory placeholder table | **Partial.** The DEX group collapses, there are no pre-ticks on load, and type is folded into meta. The first row's CTA is always filled accent. |
| 13 | Mobile hero stack | **Fixed.** Logo strip plus card; CTAs no longer wrap. |
| 14 | i18n copy | **Fixed** for /de and the en noun. |
| 15 | Verify column balance | **Fixed.** |
| 16 | Research/footer grid | **Fixed.** Shared columns at 662/889/1117. |

## Defects, most severe first

1. **[A] P0: V6 stylesheet missing from the build.**
   - Cause: `src/styles/v6/index.css` is 0 bytes after merge `94fcfbb`.
   - Fix: restore the union of both parents. In this order: base, system, components, route-finder, compare-lab, verify-band, directory, closing, pages-br, pages-rates, pages-factbook, route-rail, pages-telegram, pages-inner-r4, link-grids, tap-targets.
   - Add a deploy-gate check that fails if `dist/client/assets/*.css` contains no `.rf-svg` / `.dir6-row` / `.vb__route` selectors, or if `index.css` is empty.

2. **[A] P0: unbounded page growth (crashes capture, kills scroll and CLS).**
   - Where: `RouteFinder.jsx` around line 165. The ResizeObserver measures `.rf-grid` and writes `width`/`height` on `svg.rf-svg`, which is in normal flow when the CSS is absent.
   - Fix: make the SVG geometry independent of its own effect on layout. Set `style={{position:'absolute', inset:0}}` inline on the `<svg>`, observe `.rf-stage` rather than the grid, and skip the update when the new height equals the old height ±1px.

3. **Hero card and its Official-signup CTA are invisible for about 1s on load.**
   - `[id$=-panel]` has opacity 0 at 1000ms in en, and is still mid-fade in the ar capture.
   - This is the conversion element, and it also violates "content never hidden if JS/IO fails".
   - Fix: render the card at opacity 1 in SSR. Animate only a ≤240ms translate/opacity on intent change, never on first paint.

4. **The route draw still cannot be perceived.**
   - `rf-draw` runs 480ms with `cubic-bezier(.33,1,.68,1)` and a 60ms delay. Sampled `stroke-dashoffset` is 1 at 16ms, 0.10 at 100ms and 0.01 at 250ms. Every active segment shares the same offset (no `--i` stagger on `.rf-route__line--on`).
   - Result: frames at 60ms already show the full fan.
   - Fix: draw the active chain first (≈360ms, `cubic-bezier(.65,0,.35,1)`), then the fan, staggered `--i * 50ms`. Dim lines draw at 50% opacity. Lift `.rf-node[data-on]` only after its route lands.

5. **Hierarchy: the 72px compare numeral and the 72px closing title.**
   - At 390, `span.cl-gap__num` is 72px while `h1.rf-title` is 44px.
   - At 1440, `.v6-close__title` equals the H1 at 72px.
   - Fix: set `.cl-gap__num` to 44@1440 and 28@390 (mono) inline with its caption. Set `.v6-close__title` to 44@1440 and 28@390, or formally declare a single "closing display" exception in the brief. The scale cannot have two peaks.

6. **Accent discipline breaks in the hero and directory.**
   - The hero viewport shows three turquoise fills: "30s Matcher Wizard", "Official signup" in the card, and the node/route accents.
   - The directory always fills the first visible row's "Sign up" (Binance; Hyperliquid under Perp DEX; MEXC under No KYC), so filtering silently re-ranks.
   - Fix: make one filled CTA per viewport (the card's Official signup). Make the hero primary a ghost button with an accent arrow. Directory `.dir6-cta` should be ghost for every row, accent on hover/focus or selected.

7. **Verify band dead space (1440).**
   - Steps 2 and 3 end around 330px above the end of step 1, leaving about 300px of empty right-hand area. A further 178px follows before `h2` Directory.
   - Fix: on `.vb__route`, use `align-items:start` and move "Your address bar must show…" into step 1's caption. Alternatively, let the disclosure column carry the "In our reviewed record" proof list. Trim `.vb` `padding-block-end` so section padding stays exactly 128px.

8. **Compare Lab layout shifts on interaction.**
   - Selecting a chip adds the grip `<i class="cl-grip">` width, which reflows the row; "dYdX" drops to a third line.
   - Choosing a venue with no spot fee (Kraken) removes the whole `.cl-gap` row (about 80px jump).
   - Swap is instant: frames at 60/180/400ms are identical, so there is no FLIP although the brief requires it.
   - Fix:
     - Reserve the grip space on all chips (`visibility:hidden` when unselected).
     - Keep `.cl-gap` mounted, with "—" and the caption "Not yet checked".
     - Animate the swap with transform-based FLIP on `.cl-id` and bar `inline-size` (240ms).

9. **Hero foot is still a link dump.**
   - Two rows below the map: "On this page" plus 4 anchors, 5 SEO text links ("13 Flagship CEXs … Affiliate disclosure"), and the Telegram and Brazil rows.
   - This sits on top of the act boundary and reads as template filler.
   - Fix: move the SEO links into `.v6-close__index` (Related research) and the Telegram/Brazil rows into the footer column. Turn the "On this page" anchors into labels on the rail docks.

10. **Mobile chip rows have no inline gutter.**
    - `.vb__venues` (x=0, w=390, scrollWidth 467) and `.dir6-chips` (x=0, scrollWidth 635) start flush at the screen edge. After a lab swap, the active Verify chip is scrolled off-screen left.
    - `.cl-chips` overflows without a visible affordance beyond the mask.
    - Fix: `padding-inline: 24px; scroll-padding-inline: 24px`, and scroll the active chip into view with `inline:'nearest'`.

11. **Hero readout wraps its numerals at 1440.**
    - With On-chain or Fiat, `.rf-readout__facts` becomes 3 columns and "0.04 / 0.07 / %" breaks the percent sign onto its own line. Perp "0.015 / 0.045%" also wraps.
    - Fix: `white-space:nowrap` on `.rf-pair`. Put the intent cell on its own row below Spot/Perp instead of a third column.

12. **The On-chain intent lights only 2 of 8 nodes, and they are perp DEXs.**
    - Only Hyperliquid and GMX light up. The nodes list has no spot DEX (Uniswap/Jupiter exist in the lab and directory), so "DEX trading from a wallet" routes to perp venues only, and 6 dimmed CEX tiles fill the map.
    - Fix: build the node set per intent from the venue catalog (for On-chain: Uniswap, Jupiter, Hyperliquid, GMX…). Alternatively, swap dimmed tiles out with a 160ms crossfade so the map is never 75% disabled.

13. **Line-height sprawl.** There are 16 values; the brief allows body 1.55 and headings 1.05–1.15. Tokenise `--lh-body:1.55`, `--lh-head:1.1` and `--lh-ui:1.3`, and remove the 0.90/1.00/1.67 one-offs (`.rf-node__fee`, `.cl-gap__unit`, `small`).

14. **Tap targets.**
    - The registration-card `summary` ("Read full disclosure") is 40px tall: set `min-block-size:44px`.
    - The bottom-nav "比較" (28px) and "مقارنة" (37px) tabs are too narrow: set `min-inline-size:44px` on `.mobile-bottom-nav a`.

15. **Rail is still a hairline.** At 1440 it is a 2px line with empty `.rr__dock` ticks that carry no labels. It shows progress, but it is not a signature you notice. Label the docks (Compare / Verify / Directory / Open account) at 12px and light the active dock's label in the accent.

16. **Hover preview creates two subjects.**
    - Hovering OKX switches the left readout to OKX while the card on the right still shows Binance. The hovered route is not highlighted.
    - Fix: light the hovered route at `--n8` → accent 60% and ghost-swap the card head as well (or neither). Restore on pointerleave after 120ms.

17. **The copy fallback inserts a row (headless).** With clipboard permission denied, "Copy failed. Select the code below…" pushes the table down by about 40px. Render the fallback as an inline tooltip popover anchored to `.dir6-chipcode` so it does not shift layout. The success state ("Copied") is fine.

## What improved since round 3 (B only)
- Type scale compliance is complete: 7 sizes, 2 families. H1 is above H2 in every locale and width.
- Trust contradiction resolved: the facts are consistent across hero, lab and directory.
- The domain gate never empties. The lookalike now uses an underline plus a "+k" caption and no longer reads as a glitch.
- Mobile hero: horizontal logo strip and a single card with no duplicate venue.
- The closing band stays graphite, the rail flows into the closing route stroke, and Related research shares the footer column grid.
- Directory: the DEX "Not yet checked" group is collapsed, there are no pre-ticks on load, and type is folded into meta.
