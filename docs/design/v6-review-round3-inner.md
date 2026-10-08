# V6 independent review, round 3: inner pages (branch v6-merged3 @ b3ea693, preview :4463)

Reviewer: independent; did not build any of this. Method: Playwright Chromium at 1440x900 and 390x844. Each page was scrolled programmatically before the full-page capture. I also ran typeaudit.py, a custom probe for h1, button, colour and tap-target metrics, and scripted interactions: rates calculator, /exchanges filters, sort, search and compare dock, /news tabs and search, and copy-code. A further pass captured every `main details` opened.
Pages: /exchanges, /exchanges/binance, /exchanges/okx, /compare/binance-vs-okx, /rates, /factbook, /factbook/binance, /telegram, /br, /news, /activities, /methodology.
Route note: **/binance, /okx and /compare return 404** (the detail pages live at /exchanges/{slug}). The "Compare" nav item points to `/#compare`, so there is no compare index page.

## Scores (gate is 8)

| Dimension | Score | One-line reason |
|---|---|---|
| Typography | 6.5 | The desktop scale is clean now (only 12/14/16/20/28/44 are present on every page). It loses points for mono used in prose labels, 28px underlined link-headings on /factbook, lede sizes of 14/16/20px in two different greys, and uppercase legacy kickers inside the disclosures. |
| Whitespace / rhythm | 4.5 | /exchanges/{slug} has an empty right column of about 2,300px. /factbook has a ~45% empty panel and 0px gaps between items. Five pages end flush against the footer. /news rows are about 55% empty. |
| Hierarchy | 5 | Pages are stacks of accordions with 3–6 CTAs of similar weight and link soup. Labels such as "Pending official-source verification" are used as row titles. |
| Colour | 6 | The default state is disciplined. The open states still leak amber (`.v3-gold-matrix-summary`), sky (`.tg-deck`, `.decision-path-rail`), blue (`/br` details border) and a gold referral code. |
| Motion | 3.5 | No signature moment on any inner page. `animation-timeline: view()` is used 0 times. The only motion is `mx-row-in`, `v5-enter` and `rt-figure-in`. The route metaphor is absent. |
| Micro-interaction | 5 | Copy-code feedback works and CTA hovers exist. Table rows have no hover. Disclosure icons turn into "\|". The News and Rates filters are broken, the compare dock links to 404s, and sorting silently cancels "Verified first". |
| Responsive | 6 | No horizontal scroll anywhere. Tap targets fail on /rates (22–24px), /telegram (17–24px) and /factbook (31/40px), plus the Related-research links (34px) on every page. Headings are centred on /br at 390 but left-aligned everywhere else. |
| Originality | 3.5 | The inner pages are a generic dark fintech template with zero "Crossroads" vocabulary: no route rail, no nodes, no destination. On these pages the "AI味浓" (generic AI feel) and "像 PPT" (slide-deck feel) verdicts still stand. |

Per page (desktop and mobile combined): /exchanges 6.5 · /exchanges/binance 4 · /exchanges/okx 4 · /compare/binance-vs-okx 4.5 · /rates 4.5 · **/factbook 2** · /factbook/binance 5 · /telegram 5 · /br 5.5 · /news 5 · /activities 4.5 · /methodology 5.

What improved since R2: the desktop type scale is fully on-scale; h1 is 44px and x=120 on every page except /factbook/{slug} (x=200 beside the logo); no horizontal scroll; /exchanges rows are uniform at about 56px; /news dates are ISO.

## Defects, most severe first

1. **Verified-data contradictions across pages (trust).** The same venue shows different fees, check dates and statuses depending on the page.
   - Binance spot fee: /exchanges says "0.10/0.10 Checked 2026-10-08". /rates says "Checked: 2026-09-22". /factbook/binance says "NexuAlpha Source Review: 2026-09-08" and "Current fees have not completed source review".
   - OKX spot: /exchanges says 0.08/0.10, checked 2026-10-08. /compare/binance-vs-okx and /rates both say "Pending official-source verification".
   - Perps: /exchanges shows checked perp fees for OKX, Bybit, Bitget, Kraken, Gate.io and Hyperliquid. The /rates **Perpetuals** toggle shows all four cards as "Pending source review" with empty bars and no verdict figure (`.rt-verdict` is removed from the DOM).
   - Binance perp: shown as "–" and "Not yet checked", yet the same page advertises "−10% Perpetual" fee discount.

   Fix: route every surface (`ExchangeMatrix`, `fee-terminal`/`rt-*`, v3 compare matrix, `FactbookPage`) through a single fact source keyed by venue+field+checkedAt (`src/data/exchange-facts.js`). Delete the per-page fee copies.

2. **The referral code renders vertically, one digit per line**, when "Invitation, fees and registration checks" is opened on /exchanges/{slug} at 1440. The button is `button.v3-venue-quick-registration__code` at 26x136 inside `.v3-venue-quick-registration__body` (210px wide). The same disclosure also shows the code 3 times, adds a 28px "User fee benefit follows current partner terms" slide-card and a 4-column grid that wraps to one word per line, leaving a ~250px void. This is the revenue element. Fix: `white-space:nowrap; min-width:max-content` on the code, restyle the whole `.v3-venue-quick-registration` block to the v6 row system, and show the code once.

3. **/factbook index is unstyled.** `main.collection-hub-page` and `.topic-card` have no CSS (grep finds no rule; the page is `CollectionHubPage.jsx`, kind=factbook). The result is 24 identical blocks of underlined 28px h2, boilerplate sentence, domain as body text and a button, with **0px gap between each button and the next heading**. Everything sits in a lighter panel that runs to x=1320 while content stops at about x=780, so about 45% of the panel is empty for 5,000px. /topics probably shares this. Fix: render it as the same dense directory row as /exchanges (logo · name · type · last source-review date · fields checked n/N · open record), with no link underlines on headings and the domain as 12px meta.

4. **/exchanges/{slug} has a ~2,300px dead right column.** `.v3-profile-action-column` is `position:sticky`, but its track ends with the card, so the card scrolls away (measured top −1411 at scrollY 1500). From y≈720 to the footer, the right 38% of the page is empty. "Products" has 3 rows against 6 in "Regions", which leaves a hole. Fix: make the sticky column span the full grid row (`align-self:stretch`, card `position:sticky; top:88px`), or collapse to a single 760px column with the card docked. Also pair Products and Regions into one two-column ledger.

5. **Inner-page interactions are broken.**
   - (a) /news tabs: "Fee Rates" and "Compliance" return **0 results**, and "Deep Research" returns 416, the same as All. These are dead filters.
   - (b) /rates venue filter "Perp DEX" shows DEX and Perp DEX together (11 rows). Either relabel it "DEX" or filter correctly.
   - (c) The /exchanges compare dock builds `/compare/{a}-vs-{b}` for any pair, and many pairs **404** (aerodrome-vs-aevo, binance-vs-aevo). Disable pairs without a page, or fall back to a generic compare route.
   - (d) On /exchanges, clicking any sort header silently discards "Verified first" while the toggle stays `aria-pressed=true`. Make them compose, or untoggle visibly.
   - (e) /rates input: empty or 0 shows "0 USDT/mo" with no prompt, and 999999999999 is silently clamped to "10,000,000" with no message.

6. **Disclosures open into a different, legacy design system ("PPT" and accent leaks).** With `main details` opened:
   - /compare shows "IDEAL TRADER PROFILE", "BETTER FOR", "Candidate A/B" uppercase kickers, a gold-tinted `.v3-gold-matrix-summary` (amber rgba(253,176,34)), a gold/yellow referral code and a second set of turquoise "Visit Binance" buttons.
   - /telegram "Editorial notes and publication review" exposes an **internal growth-ops board**: "53 reviewed drafts send users to NexuAlpha before the Bot", a 53 / 7 days / 0 hero-metric stat block, "Cadence: weekly review" and raw slugs such as `hyperliquid_fees_en`. `section.tg-search-topics` is **7,202px** tall and uses a sky border rgba(125,211,252).
   - /activities `nav.decision-path-rail` has a "NEXT DECISION" kicker with a sky border.

   Fix: restyle every disclosure body to v6 tokens, remove the uppercase kickers and second accents, and remove the internal ops content from public pages entirely.

7. **Pages end flush against the footer, and section padding is inconsistent.** `main` has `padding-bottom:0` on every page. The last element touches the footer rule on /factbook/binance (partner-route band: "pending" sits on the footer line), /methodology (governance card), /activities, /compare ("Continue research" row) and /br. Elsewhere the gaps are about 110px. Brief rule: 128px desktop / 72px mobile. Fix: one `.v6-page > :last-child{margin-block-end:128px}` (72 on mobile).

8. **H1 vertical position and lede are inconsistent.**
   - h1 top y = 88 (factbook, telegram, news, activities), 92 (factbook/binance), 112 (exchanges, rates, br), 123 (methodology, with an eyebrow "Last Revised…" above the h1, which is banned), 136 (compare, with a back-link above), 152 (exchanges/slug, with a logo above).
   - Lede: 20px #b0b4ba (exchanges, telegram, br), 20px #edeef0 (factbook), 20px #9aa5b5 (news), 16px #9aa5b5 (methodology), 14px (activities).
   - At 390 there are two different h1 clamps (32.58px and 32.76px).

   Fix: one `.v6-pagehead` (back-link or logo in a fixed 24px slot, h1 44px at a fixed top, lede 20px `--text-2`). Move "Last Revised" into the meta line under the lede.

9. **/rates terminal is incoherent.**
   - The four venue cards show identical full-width grey bars (every venue costs 100), so the bars carry no information.
   - "Checked: 2026-09-22 +" is rendered as a disclosure row inside each card. The Bybit logo tile is about 54px against 40px for the others.
   - The left column has about 120px of dead space between "Copy link" and "What the public fee check can answer".
   - The bottom strip has 3 button styles plus 6 loose links with arrows, and a centred link stack at 390.
   - In the benchmark table, the "Conditions +" link overruns into the Futures column (overlaps "Pending source review"). Prose labels ("Spot Taker 0.10%", "checked 2026-09-22") are set in Geist Mono. 20 of 24 rows read "Pending source review".

   Fix: bars only when values differ (scale to max). Put the date as 12px meta and drop the accordion. Collapse pending venues into one "20 venues pending review" row. Mono for numerals only.

10. **Accordion soup / hierarchy.** /compare stacks 3 accordions, then FAQ, then 2 more accordions. /exchanges/{slug} has 7 disclosures, 4 loose bordered buttons stacked vertically ("Open deep comparison", "Review pre-registration checklist", the "Open official source +" button with a plus) and a 6-link underline row. Labels are statuses rather than titles ("Pending official-source verification" as a row header on /factbook/binance). "Show pending fields" is followed by "Show fewer metrics −" (R2 #9 is still open), and at 390 the same control reads "View full quantitative matrix +". The open-state icon renders as a lone "|" instead of "−" (e.g. `.v3-venue-quick-registration` summary at 390). Fix: max 1 primary + 1 secondary per section, one disclosure component with a consistent ± icon, and FAQ titles phrased as questions ("Binance: Official domain marked" is not a question).

11. **/news and /activities layout.**
   - /news: each row is a 28px title at left and "NexuAlpha Research Desk / Read Article →" pinned at x≈1120, leaving about 55% of the row empty. The boxed category chip is still there, and the closing CTA trio sits on the "Research index" rule with 0 gap.
   - /activities: the empty-state sentence is run-on ("No verified recent activity Compare platform profiles or…", missing punctuation). The "Account confirmation required" chip is 16px and boxed. Row plus icons sit at x≈1221 while page-level ones sit at x≈1309.
   - Fix: a 3-column news row (date+type meta 2 cols, title+dek 7 cols, action 3 cols), punctuation, and aligned icons.

12. **Tap targets <44px at 390.**
   - /rates: `a.rt-offer` "Offer & eligibility" 24px and venue name links 22px.
   - /telegram: `a.tg-btn--secondary` "Compare platforms →" 17px, topic links 22px, `a.tg-topic-card__bot` 18px, `.tg-cmd-btn` 24px.
   - /factbook: h2 links 31px and `.button-quiet` 40px.
   - /factbook/binance: `a.factbook-domain-link` 21px and `.factbook-answer-card__link` 37px.
   - /compare: 18px checkbox inputs.
   - Every page: Related-research links 34px.

   Fix: `min-height:44px; display:inline-flex; align-items:center` on inline action links in main.

13. **Buttons.** I measured 22 bordered/filled control variants in main at 1440:
   - Heights: 36/40/44/48/52/56/58/59/68/105.
   - Radii: 0/6/8/9/10px.
   - Fills: transparent, rgb(24,25,27), rgb(39,42,45), rgba(15,23,42,.88), rgb(237,238,240) (white primary on /factbook and /news tab), turquoise.

   /factbook and /methodology use a **white** primary button, which is a second primary style. /activities "Show all platform research" uses radius 10 and 12px text. /br `a.br-early-next-step__primary` is 52px.

   Fix: sm 36 / md 44 / lg 48, radius 8, a turquoise primary only, and one outline secondary.

14. **/exchanges table polish.**
   - The Products column wraps "Spot, Perps, Fiat" and "Spot, On-chain" onto 2 lines on every row. Widen it or use icons/abbreviations.
   - The Hyperliquid row is taller because "Checked 2026-10-08" wraps under "Perp DEX".
   - Sort headers are boxed buttons while Products/Region/Referral headers are plain text, so the header row looks mixed.
   - "Sign up" (96px) and "Check eligibility" (116px) give a ragged right edge; use a fixed 128px action column.
   - Rows have no hover state (background is unchanged on hover), and the selection checkboxes have no column header or hint that they feed the compare dock.
   - At 390, the sort UI takes 2 rows of boxed selects above the first card.

15. **/br specifics.**
   - The calculator defaults to "R$ 1,00", which reads as broken. Seed a realistic amount (e.g. R$ 1.000 → R$ 1,00 fee shown as a fee).
   - "Ler o caminho local" and "Ler critérios completos" are fully boxed disclosures with text touching the left border (padding 0) and a blue border (111,144,255), unlike every other disclosure.
   - The language switcher truncates to "Português (B…".
   - At 390, "Comparar estas opções" and "Fontes oficiais…" are centred while everything else is left-aligned.
   - The hero CTA "Decisor rápido →" points to the card directly above it at 390.

16. **/methodology.** It is still card-in-card (`.methodology` regional card: the left text ends at y≈880 while the right list runs about 500px further, leaving a void). "Four Core Quantitative Evaluation Pillars" is a heading over a single collapsed accordion, so the content is hidden behind a title. The tags "Traceable Sources / Zero Pay-for-Rank / On-Chain Solvency Audit" read as marketing badges. The copy says "All quantitative scores are formulaically derived", but no scores exist anywhere on the site.

17. **Hygiene.**
   - `body` font-family is `"Pilot Inter", Inter, …`. Visible text resolves to Geist, but Inter is on the brief's banned list; set the body stack to Geist.
   - Hidden `b` elements at 0px font-size (`/exchanges/{slug}`, `/compare`) are counted as text nodes. Use `.sr-only` instead of font-size:0.
   - The 390 lede is 18.165px and h1 is 32.58/32.76px. Not on a defined mobile scale; define discrete mobile steps (e.g. 12/14/16/18/24/32).

## Cross-page consistency matrix (1440)

| Page | h1 y | Lede | Ends at footer with | Accent leaks (default / opened) |
|---|---|---|---|---|
| /exchanges | 112 | 20 grey | ~110px | – / – |
| /exchanges/binance, /okx | 152 | none | ~150px void (right column empty for 2,300px) | – / sky "Pending" em, turquoise kicker |
| /compare/binance-vs-okx | 136 | back-link | 0 (row touches) | – / amber gold matrix, gold code |
| /rates | 112 | none | ~65px | – / – |
| /factbook | 88 | 20 white | 0 | – / – |
| /factbook/binance | 92 (x=200) | 14 meta | 0 | – / – |
| /telegram | 88 | 20 grey | 0 | – / sky deck, teal manual-review |
| /br | 112 | 20 grey | ~0 | blue details border / – |
| /news | 88 | 20 blue-grey | 0 (CTA trio on rule) | – / – |
| /activities | 88 | 14 | 0 | – / sky rail |
| /methodology | 123 (eyebrow) | 16 blue-grey | 0 | – / – |

## Verdict
On inner pages the system work has landed (type scale, container x=120, no horizontal scroll), but the pages are not award-calibre. Two of them are visibly broken (/factbook index unstyled; the vertical referral code on venue pages). The data contradicts itself between pages, which undermines the site's whole trust proposition. Every disclosure opens into the pre-V6 design. Nothing on these pages carries the Crossroads/route concept or any motion signature, so the user's "AI味浓 / 像 PPT / 没有交互感" complaints (generic AI feel / slide-deck feel / no sense of interaction) remain valid here. Fix order: 1 → 2 → 3 → 5 → 4 → 6, then the rhythm items (7, 8, 10).
