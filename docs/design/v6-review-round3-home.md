# V6 independent review, round 3: HOME `/` (branch v6-merged3, head b3ea693)

Reviewer: independent, did not build. Gate: every score >= 8 (benchmark: Awwwards/FWA SOTD).
Method: Playwright chromium at 1440x900 and 390x844 (touch, DPR2), en, /de, /ar. I scrolled each page in 300px steps to trigger reveals and then took full-page captures. I took timed frames during the interactions listed below. typeaudit.py was run on `/`, `/de/` and `/ar/`.
Interactions exercised: all 4 intents (frames at 60/200/450/900ms), node hover and keyboard tab, compare-lab swap, chip select, drag of a chip onto a venue slot, popular-matchup hover, fee-check expand, verify scroll-in sequence (100/400/900/1800ms) and venue switch, directory segment filter (Perp DEX: 5 of 24), No-KYC chip (12 of 24), code copy, pick-to-compare dock, route-rail docking at 6 scroll depths, closing CTA hover. Mobile: intent tap, verify, compare, directory.

## Scores (0-10; 5 = competent template, 8 = award-worthy)

| Dimension | Score | One-line reason |
|---|---|---|
| Typography | 6 | The 1440 scale is close. Hierarchy inverts on mobile and in /de, 138px and 56px are still off-scale, and there are 16 line-height values. |
| Whitespace / rhythm | 6 | A 224px void after the directory, a dead band under Verify, and the hero is 1255px tall with a filler "bridge" inside it. |
| Hierarchy | 5.5 | H1 is smaller than the H2s at 390 and in de, there are two 72px hero-metric blocks plus a 138px closing title, and the hero's right column competes with the H1. |
| Colour | 6.5 | Accent discipline is mostly good. The cream closing band adds a second theme, and turquoise on cream is weak. |
| Motion | 6.5 | The Verify sequence and directory filter fades work. Route redraw is not perceptible, the domain typewriter empties, and the rail is a 1px line nobody will notice. |
| Micro-interaction | 7 | Drag-to-swap, the shared compare state with the directory dock, copy and intent→card scroll are real gains. Node hover previews only the domain. |
| Responsive | 6 | Verify overflows at 390, rail nodes sit half off-screen, the hero stack is about 1700px with a duplicated venue, and the CTA arrow wraps. |
| Originality | 5.5 | It is still "dark fintech template + one widget". The route metaphor lights one line and is not a map, and the closing band reads as a Stripe-style poster. |

The gate fails: 0 of 8 dimensions are >= 8. This is better than round 2 on micro-interaction (drag, synced dock, mobile scroll-to-card). On data trust it has regressed: see #2.

## Distinct computed font sizes (visible text nodes)

Scale: 12 / 14 / 16 / 20 / 28 / 44 / 72.

| Page | Sizes | Off-scale |
|---|---|---|
| 1440 `/` | 12, 14, 16, 20, 28, 44, **56** (h1.rf-title), 72 (span.rf-fee, span.cl-gap__num), **138** (.v6-close__title, 7 nodes) | 56, 138 |
| 1440 `/de/` | 12, 14, 16, 20, 28, 44 (h1.rf-title--long = same as H2s), 72, **138** | 138 |
| 1440 `/ar/` | same as en | 56, 138 |
| 390 `/` | 12, 14, 16, **18.165** (verify domain field b / lookalike), 20, **24** (span.rf-big__u), 28, **32** (h1.rf-title), **32.58** (h2#vb-title), 44 (h2 cl/dir/close), **45.1** (span.rf-fee), 72 (cl-gap__num) | 12 sizes in total, 5 off-scale |
| 390 `/de/` | adds h1.rf-title--long at **24px** | 24 |

Line-heights in use: 0.90, 0.92, 1.00, 1.05, 1.10, 1.15, 1.20, 1.25, 1.30, 1.35, 1.40, 1.45, 1.50, 1.55, 1.65, 1.67 (16 values; the brief allows body 1.55 and headings 1.05-1.15).
The ancestor `div` still declares `"Pilot Inter", Inter` (overridden, but banned family in the cascade).

## Defects, most severe first

1. **Hierarchy inversion: the H1 is smaller than section H2s.**
   - At 390: `h1.rf-title` is 32px, but `.cl__head h2`, `.dir6-head h2` and `.v6-close__title` are 44px. `h2#vb-title` is 32.58px, so the four H2s use two different sizes.
   - In /de at 1440, `h1.rf-title--long` is 44px, equal to every H2. At /de 390 it drops to 24px.
   - Fix: give the section H2 one token, `clamp(28px, …, 44px)`, so it is 28 at 390. The H1 must stay at least one step above every H2 in every locale. Make `.rf-title--long` floor at 44@1440 and 32@390 and allow three lines instead of shrinking. Use one `--t-h2` for `.vb__title` too.

2. **Trust contradiction in the hero card.**
   - With the Fiat on-ramp intent, the Binance card says "Spot Maker / taker: Not yet checked" and so does every node. The directory row shows Binance spot 0.10/0.10, checked 2026-10-08.
   - With On-chain, the Hyperliquid card shows Spot and Perp as "Not yet checked". The directory shows 0.04/0.07 checked and the compare lab shows perp 0.015/0.045.
   - The fields are labelled Spot/Perp, so blanking them by intent is a false statement.
   - Fix (`RouteFinder.jsx`, `.rf-facts`): always render the verified spot/perp facts. Only the intent-specific readout (`.rf-big`) may say "Not yet checked for on-ramp".

3. **Banned hero-metric stat blocks, twice, plus a poster headline.**
   - `.rf-big/.rf-fee` is a 72px turquoise "0.10%" directly under the CTAs. With Fiat or On-chain it becomes a large grey "Not yet checked", which is a dead hero.
   - `.cl-gap__num` is a 72px turquoise "0.02pp" with a dotted leader.
   - `.v6-close__title` is 138px over three lines.
   - Fix: move the fee into the active node/card (where hover can change it). Render the compare gap inline in the ledger header at 28px mono. Cap the closing title at 72px, or document 138 as the only display step and remove 56.

4. **Filler block inside the hero breaks the five-act composition.**
   - About 450px between the hero and Compare (`div.rf-more` y=856-1132, `a.br-entry-link`, `nav.home-section-nav`) contains:
     - a kicker line (`p.rf-more__badge` "Verified Crypto Platforms Directory · 24 Venues · Zero Custody", which is banned);
     - a paragraph;
     - five tag pills (`a.rf-pill` "13 Flagship CEXs"…);
     - a "Pick a platform now" heading with a sub-line that repeats it;
     - the Telegram row (`a.rf-tg`);
     - the Brazil row;
     - an "On this page" nav that sits 16px above the Compare H2.
   - This is the most "AI template" part of the page and makes `section.rf` 1255px tall at 900px viewport.
   - Fix: move the SEO links into the closing/research index or a single quiet row. Delete the kicker and pill cloud. Drop the section nav, or make it the route rail's labels.

5. **The route map is not a map.**
   - Only one route is lit (You → active venue). The other venues get stubs. In frames at 60ms and 200ms after an intent click, the new route is already fully drawn, so the `rf-draw` reveal is not perceptible.
   - Hovering or focusing a node only re-types the domain pill. The readout and card do not preview that venue's fee (the brief requires a fee preview).
   - Fix: draw all qualifying routes on intent change (staggered 40ms, 400-500ms expo-out; dim ones at `--n8`). On node hover/focus, temporarily swap `.rf-big` and the card facts (final values only, opacity/translate). Light the hovered route.

6. **The domain typewriter still produces empty states** (round 2 #8 not fixed).
   - `.rf-gate` innerText is '' at 300ms (en, de) and '' again at 4000ms (ar, re-typing loop).
   - The full-page captures for de and ar show the pill as a bare shield icon.
   - The Verify official field shows "www.ok▏" for about 400ms before resolving.
   - Fix: render the full domain in SSR. Animate a mask/caret over already-present text and never clear the string.

7. **Verify lookalike and mobile overflow.**
   - The diff glyph (grey box plus strikethrough over the inserted char, e.g. "www.ok[k]x.com") reads as a font/rendering glitch. Strikethrough also says "deleted" when the char was inserted.
   - The lookalike text is clipped at the right ("co▏").
   - At 390, the domain field and OFFICIAL stamp run past the viewport edge.
   - At 390, `.vb__venues` spans x=0 to 390 (scrollWidth 467), ignoring the 24px gutter, so "Binance" sits flush against the screen edge.
   - Fix: highlight the char with an underline in `--danger`-neutral plus a caption "extra k". Give the field `min-width: 0` and `overflow: hidden` with the text set to `text-overflow: ellipsis` only on the lookalike. Use `margin-inline: calc(-1*gutter)` plus `padding-inline: gutter` with scroll-snap and a mask fade for the chip row.

8. **The closing band introduces a second theme and breaks the route.**
   - `.v6-close__band { background: var(--paper) }` is a cream poster in a graphite site, and turquoise stroke on cream has weak contrast.
   - The rail endpoint dot at x=63 is about 50px away from the route stroke start at x=115, so the "destination" is disconnected.
   - The 138px type wraps to three lines and pushes the CTA about 600px down.
   - Fix: keep graphite, make the band one step lighter (`--n2`), cap type at 72, and make the rail itself turn into the CTA's route stroke. One continuous path is the metaphor the brief asks for.

9. **Voids.**
   - 224px empty after `a.dir6-all` at all three locales (y≈5557 en, 5674 de, 5458 ar), on top of 128px section padding.
   - About 150px dead band under the Verify left column with nothing on the right (`.vb__route` grid, the disclosure column ends early).
   - Fix: remove the extra `margin-block-end` on `.dir6`/`.dir6-all`, and give `.vb__route` `align-items: start` with balanced columns.

10. **The route rail is a stray border, not a signature.**
    - At 1440 it is a 1px line at x=63, outside the 120px container: an orphan on no grid column.
    - At 390, `.rr__node` elements are at x=-2…8, half off-screen, and read as clipping bugs.
    - Fix: anchor it to the container edge (x=120 minus 24), make the docks labelled (Act names as the section nav), and hide it below 768px or turn it into a top progress hairline.

11. **Legacy system inside the compare plate.**
    - Expanding "Open the fee cost check" (`details.cl-fees`) reveals the old calculator: a Monthly Volume slider, "Review official terms & register", "Open fee query in Telegram", "Copy link to continue later" and "Embed this calculator on your site". It uses different buttons, radii and text styles.
    - Popular matchups mix states: the active row shows a bare turquoise "• Preview", the others an arrow plus an outlined "Preview" button.
    - Fix: restyle with v6 tokens (one md button, one ghost) or link out. Use the same row anatomy for the active and inactive matchup (active = accent left rule).

12. **Directory reads as a placeholder table.**
    - 11 of 24 rows say "Not yet checked", including a run of 7 identical DEX rows with "–" and "Check eligibility".
    - Turquoise-outline "Sign up" alternates with white-outline "Check eligibility", which creates zebra noise.
    - Binance and OKX load pre-ticked (synced compare picks), which looks like a recommendation.
    - The "■ CEX" type column duplicates the segment filter.
    - Fix: one CTA style (ghost; accent only on hover/selected). Show a muted single "—" cell instead of repeated "Not yet checked". Show picks as ticked only after user action, or label the dock "Comparing: Binance vs OKX". Fold the type into the name meta.

13. **Mobile hero.**
    - The stack is about 1700px: intents → You → domain → 8 nodes, with the card injected after the first node, so "Binance" appears twice in a row (node, then card head).
    - "Compare Platforms →" wraps its arrow onto line two, and "30s Matcher Wizard" wraps.
    - Fix: on ≤600px, collapse non-active nodes into a horizontal logo strip (scroll-snap) above the card, and use `white-space: nowrap` on CTA labels with shorter copy.

14. **i18n and copy.**
    - /de hero tertiary link is "Zurück zum Verzeichnis" ("Back to directory") on the home page.
    - EN uses "Browse Yellow Pages" while the section is "Crypto Platform Directory". Pick one noun.
    - /ar: the readout "0.10% / 0.10" puts the percent sign on the wrong operand. Wrap numerals in `<bdi dir="ltr">`.

15. **Verify column balance.** Columns are about 2:1.3:1.3. The disclosure body is set at 20px while the other step bodies are 14-16px, which makes the third column the heaviest thing in the band. Fix: equal columns, with body 16px in all three.

16. **Footer and research grid misalignment.** The "Related research" link columns start at x≈425, 655 and 885, while the footer link columns start at x≈660, 890 and 1115. They are two 12-column interpretations stacked. Fix: share the same column template.

## What improved since round 2
- Drag a chip onto a venue slot (ghost plus drop highlight) works.
- Compare picks sync to the directory pick dock ("Kraken vs Bitget · Open comparison").
- Tapping an intent on mobile scrolls the card into view.
- The Verify scroll-in sequence (type → OFFICIAL stamp → line fill → lookalike) is a real signature moment.
- Directory filter rows fade in and the counts are correct (Perp DEX 5/24, No KYC 12/24).
- Container x=120 is consistent, including the footer. No horizontal scroll at either width.
