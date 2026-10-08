# V6 independent review, round 1 (build 3.0-20261008T1335-GH-5404e9e). Gate: every score must be >= 8.

## Scores (stingy, by reviewers who did not build it)
R1 home desktop: typography 6.5, whitespace/rhythm 5, hierarchy 6, colour 7, motion 6, micro-interaction 6.5, originality 5. "Still ~70% AI-made / dashboard-like."
R2 mobile + i18n: responsive 6.5, mobile typography/whitespace 5.5.
R3 inner pages: cross-page consistency 3, inner typography 5, inner whitespace rhythm 4.

## R1 defects (home 1440)
1. Hero (section.rf) is 1867px tall; intents (core interaction) start at y~790, below the fold. Fix: align-items:center, intents ~y520, H1 ~56px, no 4-line break, or put intents beside the H1.
2. Route curves stop at the Spot card edge; reg card under node list; 200px void under intents. Fix: .rf-grid align-items:start, sticky left column.
3. Directory header void 257px (y=6378, a.dir6-all -> next); closing CTA gap 209px (y=7876), 150px+ empty under 'Tokenized Treasuries'. Fix: one section padding, kill 140px top margins.
4. Section padding not uniform: 130px dead band chips->Brazil strip; 230px under 'Open fee cost check'; 160px above Verify H2.
5. Compare lab default (Binance vs OKX) is a wall of 'Not yet checked' (5 of 8 cells). Use newly verified data (below); collapse empty rows to a single 'Fee data pending' line.
6. Verify step 1: domain renders as blurred 'Ww', progress line stops at 80%. Fix: type the domain out with steps(), finish at 100% with check tick.
7. Type scale violated: 17 sizes (11,12.5,12.6,13,15,18,19,21,40 off-scale), fonts ui-monospace and 'Pilot Inter' leak. Mobile reviewer found ~35 sizes (10..13.76 on .dir6-*, ticker, bottom nav, .rf-node).
8. Header text shows through nav. Fix: backdrop-filter blur(16px) + background rgb(14 14 16/.88).
9. .rf-node__fee and .rf-node__id mono-gray noise. Domain 12px opacity .6 non-mono.
10. Default hero card ignores intent: selecting Perps keeps Binance (perp unverified). Pick the first node that has data for that product; on mobile reset active node on intent change.
11. Research list (s10) is 28px grey links in undifferentiated 2 columns = SEO dump. 16px, 3 columns, arrow on hover.
12. 'Source notes View all' orphan at x=136 vs 120 left edge; two CTAs + 'Browse Yellow Pages' link in hero.
Originality: (1) make the route map the entire hero: full-bleed SVG paths You -> verify gate -> exchange nodes, scroll draws the line down the page linking compare/verify/directory; (2) one bold type moment per section (160px+ numeral fee or Verify domain at display size), editorial off-axis grid, full-bleed colour bands, break identical-card rhythm; (3) signature interaction: address-bar domain check char-by-char stamping 'official', magnetic/tactile Official signup CTA, reuse the stamp on directory rows.

## R2 defects (390 / 360, i18n)
1. Intent selector below fold at 390x844; at 360x740 half under bottom nav; hero stacks 3 CTAs + ~100px gap. Cut hero padding-block to 24px, CTAs in one row, intents up.
2. Route spine strikes through 'Venues for this route' label (all locales).
3. Tapping a venue puts the reg card ~600px below the list; intent change keeps previous active node. Reset to first venue with data; scroll card into view or open inline under node.
4. ~35 font sizes; 11-12px on ~900 nodes. Snap to 12/14/16 with clamp().
5. 55-62 tap targets < 44px in every locale: .rf-pill 32, .bleed-venue-btn 40, .dir6-seg__btn/.dir6-chip 40, .dir6-pick 32x32, .dir6-chipcode 36, .dir6-name 21, .nx-lang rows 38, .rebate-ticker__item 32, 'Read full disclosure' 16. min-block-size:44px.
6. Legacy .bleed-analyzer-section uses emoji icons and repeats compare content. Restyle with drawn SVG or hide.
7. Sticky .dir6-dock is 158px tall (20% of viewport) covering rows. Collapse to ~56px one-line bar.
8. ~250px dead band between 'Open the fee cost check' and 'Verify before you leave'; similar gap above footer; mobile --section-pad 72px.
9. Popular-matchup logos overlap/clip (.cl-pop__logos).
10. Closing band: 'Browse the directory' wider than container (24px left vs ~6px right gutter), 'Official sign-up pages only' clipped.
11. ja H1 breaks mid-word; de CTA wraps 2 lines. word-break:keep-all; line-break:strict; .rf-btn min-block-size:48px.
12. Language dropdown overlays nav and cuts 'Telegram Research'; two 'Search platforms' fields; ~270px dead space in menu; Hyperliquid has no logo; brand text looks underlined. Bottom-nav labels 10-11px; .cl-chips row (917px) has no scroll hint.

## R3 defects (inner pages; home also breaks the brief)
Root cause: base.css rules are scoped to .v6; inner pages only partly get it.
1. Four different primary-button fills (#1FE0C0 home/exchanges/binance, #22C88A /rates /compare, #315CCF /br, sky-blue /telegram). One --accent, one .btn-primary.
2. Button radii 4/6/7/8/10/20 and heights 36/38/40/44/45/56. One .btn: radius 8, heights 36 and 44 only.
3. Chips: three styles (sky-tinted 11.5px r7; factbook pills r20; exchanges segmented r4). One chip, 12px, neutral.
4. Second accents: /methodology gold callout; /activities /news blue/purple links, purple 'SOURCE-BACKED'. Links neutral with turquoise underline.
5. Kickers/eyebrows still present: 'E-E-A-T Institutional Research Standards', 'Fee benchmark', 'TELEGRAM BOT ECOSYSTEM', 'ANSWER FIRST', 'ONSITE -> BOT', 'CEX . TRUST SCORE', '01 / MATRIX', /compare '⚡ Quantitative metric matrix'. Delete.
6. /br hero left column empty ~300px below buttons (right form card taller); another ~200px void before 'Ler o caminho local'. align-self:start, gap 48, remove min-height.
7. /br off-brand: blue buttons, 3-box step card, paragraph jammed at 14px.
8. /exchanges/binance after first fold: H2 28px grey dimmed, ~120px gaps, right column empty after signup card. Sticky card + uniform 64px section gap.
9. /compare: mixed small headings, bare unlabeled <select> '—' above table, 'Final call' card navy gradient. One neutral --surface.
10. /rates: H1 + 100px gap + four stacked near-identical bordered cards (PPT stack). Merge into one tool panel.
11. /telegram: sky-blue CTA, 12px mono eyebrow, 83 tiny chips, link clusters floating right of FAQ rows. One primary button; left-aligned link list.
12. /activities: sparse 130px rows, 12px blue underlined links, ~3:1 'Account confirmation required' boxes. Raise muted colour; table.
13. /news: ~100px dead space after 'Results: 416', 13px mixed-case dates, purple label, ~100px empty above footer.
14. /factbook/*: full-bleed 1440 hero (x=0) vs 1200 elsewhere, dense 12px bordered cards, '01 /' numbered labels, overlapping 'Reserve review field' badge.
15. Home directory text 11-13px 'Pilot Inter', ~200px gaps.
Redesign next: /br, /rates, /factbook/*, then /telegram, /exchanges/binance.

## New verified data (2026-10-08, official sources; see docs/data/exchange-facts-20261008.json)
OKX spot 0.08/0.10 perp 0.02/0.05; Bitget spot 0.10/0.10 perp 0.02/0.06; Gate spot 0.10/0.10 perp 0.02/0.05. Still unverifiable: Coinbase, MEXC (ranges only), KuCoin, HTX, Binance perp. src/data/exchange-facts.js must be updated accordingly (okx, bitget -> verified; add gate; mexc/kucoin/htx unverifiable with nulls).
