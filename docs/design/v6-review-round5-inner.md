# V6 independent review, round 5: inner pages (build 3.0-20261008T1943-GH-5890f04, preview :4631)

Reviewer: independent; I did not build any of this.

Build checks, done first:
- `/version.json` returns `{"version":"3.0.0","buildId":"3.0-20261008T1943-GH-5890f04"}`.
- The stylesheet is applied. On `/exchanges` at 1440 the h1 is 44px at x=120, y=128.
- `index-*.css` contains 1,030 `home-refinement` rules and 26 `.v6r` (route rail) rules.
- The R4 ship-blocker (empty `v6/index.css`) is fixed.

Method:
- Playwright Chromium (`--disable-gpu`, one browser per page) at 1440x900 and 390x844.
- Each page was scrolled programmatically before every full-page capture, then captured again with all `main details` opened.
- Probes collected:
  - computed font-size and font-family sets (default and open states);
  - h1 size and position;
  - button variants;
  - tap targets under 44px;
  - saturated non-accent colours;
  - uppercase text;
  - voids over 160px;
  - scrollWidth;
  - no-JS rendering;
  - reveal state after jump-scrolls.
- The route rail (`.v6r`) was measured at 1440, 1280, 1100 and 390. I recorded its x position, any content boxes it crosses, the fill height at 0/33/66/100% scroll, and the dock-node on/off state.
- Interactions were scripted:
  - `/exchanges`: segments, search (match and no-match), the three sorts with `aria-sort`, Verified first, copy-code (clipboard read back) and the compare dock (resulting URL fetched).
  - `/rates`: volume 100000, 0, empty, −5, 2.5M and 1e12; Spot/Perp; Taker/Maker.
  - `/news`: tabs and search.
  - `/activities`: category chips.
- Fee strings and dates were extracted from 12 pages: `/`, `/exchanges`, `/exchanges/{okx,binance}`, `/compare/{binance-vs-okx,okx-vs-bybit}`, `/rates`, `/factbook`, `/factbook/{okx,binance}`, `/br` and `/telegram`.

## Scores (gate is 8)

| Dimension | R4 (sim) | **R5** | Reason |
|---|---|---|---|
| Typography | 7.5 | **7.5** | Desktop uses only 12/14/16/20/28/44 on all 12 pages; mobile only 12/14/16/18/20(brand)/24/32. Visible text is Geist / Geist Mono only, and the body stack is Geist now. Lost points: mid-word breaks "Not / yet / check / ed" in /exchanges cells at 390; "0.10% / 0.10%Regular User" with no space on /compare; "0/4 checked" set at 20px against a 16px title on one baseline; mixed % formats ("0.08 / 0.10 %" vs "0.08% / 0.10%"). |
| Whitespace / rhythm | 6 | **6** | New: the rail cuts through the text column on /exchanges/{slug} (defect 1). Still present: half-width text blocks with an empty right half on /methodology and /telegram; a ~190–210px gap between the last content and the footer on /exchanges, /factbook and /methodology; a ~120px hole inside the /rates calculator card (Bot block); unequal Products/Regions columns on the profile. |
| Hierarchy | 5.5 | **6** | The code shows once on the profile and /methodology is flattened, but four action stacks remain: 7 actions before "Pre-registration decision" on the profile (the 6-link soup); /compare has a matrix, a card-in-card decision, then 7 disclosures; the /rates calculator card is 2,600px at 390 because Bot and directory blocks sit inside it; /br has 4 turquoise primaries. |
| Colour | 7.5 | **7** | The white primary is gone and the /news and /activities active segment is graphite. New or remaining leaks: blue `rgb(83,177,253)` "+" on `button.v3-matrix-expand` (/compare, 390); slate `rgba(15,23,42)` "Reset" button on the profile; white `rgb(237,238,240)` hairline on the active `/rates` venue segment and the `/factbook/{slug}` pills; turquoise on non-signup actions ("Comparar estas opções" anchor, two "Confira domínio…" profile links, "Próximo: Pix e BRL", "Compare total cost →" on /news, /activities and /rates). |
| Motion | 3 | **5** | The route rail now exists on all 12 inner pages, with a scroll fill, dock nodes that light with a ring pulse, and a destination node. Reveal is progressive (no-JS shows everything, and jump-scrolls never leave content hidden). It reads as a reading-progress bar in route costume: nodes are unlabeled, there is no stub to the CTA, and /exchanges has a single node at the very end. On the profile it is broken (defect 1). There is no inner `animation-timeline` and no count-up or dock route draw. |
| Micro-interaction | 6.5 | **7** | Working: segments (24/13/6/5), search with a "No platforms match these filters" empty state, three sorts with correct `aria-sort`, Verified first, copy (clipboard verified, ✓ state and live region), the dock ("Bitget × VS Bybit" → `/compare/bitget-vs-bybit` 200; 3 venues disabled with visible "No comparison page yet"), the /news result count (416/314/12/90; "okx" → 68), the /rates zero prompt and 1e10 cap message. Broken: /activities chips all read "0" while 21 reward entries render; /rates perp mode lists unchecked Binance first; the tie still carries a Binance-specific CTA. |
| Responsive | 7 | **7** | No horizontal scroll at either width; 0 tap targets under 44px at 390 except a 20px checkbox that has a 44px label (pass). The /compare back link and /telegram commands are fixed, and the /exchanges sort fits one row. Remaining: word-broken fee cells, "No comparison page yet" wrapping to 3 lines in the identity cell, the rail sitting as a 2px sliver at x=5 inside the 24px gutter, and very long /rates (7,605px) and /exchanges (6,303px) pages at 390. |
| Originality | 3.5 | **4.5** | The rail is the first Crossroads vocabulary off the homepage, so this moved up. The pages are still a competent dark data template: row lists, outline buttons and ± disclosures. Nothing an Awwwards juror would remember. |

Per page (desktop and mobile combined; 5 = competent template, 8 = award-worthy):

| Page | R4 sim | **R5** | One-line reason |
|---|---|---|---|
| /exchanges | 7 | **7.5** | Products on one line, an aligned action column, a working dock. Lost on the mobile word-break and the "Checked" date overflowing into the spot column on the Hyperliquid row (1440). |
| /exchanges/binance | 6 | **5** | The rail runs through the h1, chips, fee table labels and headings; a node covers the "C" of "Check before…"; the link soup remains. |
| /exchanges/okx | 6 | **5** | Same as Binance. |
| /compare/binance-vs-okx | 5.5 | **6** | Order is consistent now. Still card-in-card plus 7 disclosures, "METRICS" in uppercase, and the blue "+" at 390. |
| /rates | 5 | **6.5** | Bars gone, pending rows collapsed, tie labelled, cap message. Still: Binance tie CTA, unchecked venue first in perp mode, and an overloaded calculator card. |
| /factbook | 6.5 | **7** | Clean, dense rows with a node per row. The same 14-word dek repeats 24 times, and there is no review date or field count per row. |
| /factbook/binance | 6 | **6.5** | h1 is at x=120, the pills wrap, and VIP is collapsed to one line. Remaining: two dates, "Solvency Telemetry" copy and an uppercase "MANDATORY" badge. |
| /telegram | 5.5 | **6.5** | Inline links and 44px targets. The column is ~60% wide with the right 40% empty at 1440. |
| /br | 6 | **6** | The language switcher and seeded R$1.000 are fixed. Remaining: 4 turquoise non-signup primaries, two 52px multi-line primaries, and a 20px bold restatement of the h1 mid-page. |
| /news | 6.5 | **7** | Tabs and count work, with a calm list. Only 4 visible items before "Show more" makes the page feel thin. |
| /activities | 6 | **6** | The chip counts read 0 and contradict "Registration rewards 21"; an empty-state card sits above populated rows. |
| /methodology | 4.5 | **6** | Badges and the white CTA are gone and the pillars are inline. Remaining: half-width blocks, a floating "contact@nexualpha.com" button, and "Rating Methodology" in the h1 with no ratings. |

## Round-4 defect status

| R4 # | Status | Evidence |
|---|---|---|
| 1 Empty V6 stylesheet | **Fixed** | h1 is 44px at x=120, y=128 on 9 pages (x=120, y=148–152 on the profile, factbook detail and compare pages, which carry a logo or back link above). 32px at x=24 on mobile. |
| 2 Fee order and format flip | **Fixed (order), partly (format)** | OKX spot reads 0.08 / 0.10 (maker / taker) on /, /exchanges, /exchanges/okx, /compare and /rates. The 3-decimal 0.050 is gone. The % placement still differs: `/exchanges` "0.08 / 0.10 %" vs everywhere else "0.08% / 0.10%". |
| 3 /rates terminal | **Mostly fixed** | No identical bars; "17 venues pending source review" is one row; 1e12 shows "Volume capped at 10,000,000,000 USDT, the calculator maximum."; 0, empty and −5 show "Enter a monthly volume above 0…". Open: the "Offer & eligibility" row on a 4-way tie still offers "Open official registration route · Binance"; in Perp + Maker, Binance ("Not yet checked") is listed **first**, above the three tied checked venues. |
| 4 Profile hierarchy | **Partly** | The code shows once and the logo is ~48px. The 6-link underline row, two loose outline buttons, the "0/4 checked" disclosure, and the "Account and costs / Sources and security / Continue following" label-over-row (eyebrow) pattern remain. |
| 5 Three dates | **Partly** | Every date is now labelled and ISO on inner pages. But the profile still shows "Fees checked 2026-10-08" + "Research checked 2026-09-04" + "Source check: 2026-09-06". /factbook/{slug} shows "Fees checked 2026-10-08" + "NexuAlpha Source Review: 2026-09-08". **/compare/binance-vs-okx shows only "Official Binance and OKX sources reviewed 2026-09-22" above fee figures checked 2026-10-08.** The home page uses "Oct 8, 2026". |
| 6 "Checked" without a checked field | **Fixed** | Uniswap shows no "Checked". Kraken shows it because its perp fee is checked. |
| 7 /methodology | **Mostly fixed** | See the per-page note. The h1 "Rating Methodology" still promises ratings that do not exist. |
| 8 No inner motion | **Partly** | The rail is on 12/12 pages. See defects 1 and 6. |
| 9 /factbook/{slug} | **Mostly fixed** | h1 at x=120; pills wrap; VIP collapsed to "10 recorded fee tiers: not yet source-reviewed". Invented-metric copy remains ("Solvency Telemetry", "Clean Reserve Ratio"). |
| 10 /telegram | **Fixed** | Links are inline; 0 targets under 44px at 390. |
| 11 /br | **Partly** | Language switcher shows "Português (Brasil)"; the calculator is seeded at R$1.000. There are now **4** turquoise buttons, none of them a signup. |
| 12 Directory polish | **Mostly fixed** | Products on one line, the action column aligned, sort fits one row at 390, the disabled reason is visible text. Open: the segment sets differ (/exchanges All/CEX/DEX/Perp DEX vs /rates All/CEX/Perp DEX); "No comparison page yet" wraps to 3 lines at 390. |
| 13 White second primary | **Mostly fixed** | Residual white `rgb(237,238,240)` border on the active `/rates` "All 24 Venues" segment and on the active `/factbook/{slug}` pills. |
| 14 /compare | **Partly** | The back link and checkbox pass. Remaining: 7 disclosures, a card-in-card, the uppercase "METRICS" table header, and the "vs COMPARE" uppercase in the related-pair cards. |
| 15 /activities | **Partly** | "Browse platform profiles" is now an outline button. New defect: every chip count is 0. |
| 16 Hygiene | **Fixed** | Body font is Geist; the /news count reflects tab and search; 18.165px is gone. |

## Defects, most severe first

1. **The route rail draws through the content column on `/exchanges/{slug}`.**
   - Where: `.v6r` on /exchanges/binance and /exchanges/okx. The rail is at x=125 while content starts at x=120, at every desktop width (1100: rail 29 vs content 24; 1280: rail 45 vs content 40).
   - What it hits: 43 content boxes, including the h1 "B", the CEX chip, "Spot"/"Perpetual"/"Fee discount", "Binance decision check…", "Pre-registration decision", and the "Must verify / Not ideal for" labels. A 10px node sits on top of the "C" of "Check before opening the official flow". The turquoise fill makes it the brightest thing on the page.
   - Every other page puts the rail 25px left of the content (x=95 vs 120). The profile computes `left` from the wrong container, because its `main` content is offset by the 2-column grid.
   - Fix: anchor `--v6r-x` to `container-left − 25px` (the same formula the other pages use), or hide the rail when `container-left < 48px`. Add a probe that no `main` text box intersects `.v6r__track`.

2. **The /rates tie and perp mode still favour Binance.**
   - With Spot + Taker (a 4-way tie), the "Offer & eligibility" row offers the single venue CTA "Open official registration route · Binance ↗". At 390 it wraps to 2 lines.
   - With Perpetuals + Maker, the result list puts Binance ("Not yet checked") first, above OKX, Bybit and Bitget (tied at 0.02%).
   - Fix: on a tie, drop the venue-named CTA (keep "Continue comparison"). Sort checked venues before unchecked ones, and render unchecked ones last in a muted row.

3. **/activities category chips all read 0.**
   - `All0`, `Listings0`, `Rewards0`, `Products / multi-asset0`, `Rules / region0`, while 6 reward rows render and the summary reads "Registration rewards 21 / source entries 36".
   - The count is also glued to the label with no gap.
   - Fix: compute counts from the same dataset the rows use, and render them as a separate 12px mono `<span>` with a gap; hide a chip whose count is 0, or show "–".

4. **Date story still contradicts itself.**
   - /compare/binance-vs-okx shows only "Official Binance and OKX sources reviewed 2026-09-22" (`.v3-decision` card meta) while the matrix figures come from the 2026-10-08 fee check. A reader dates the fees to 09-22.
   - The profile shows three dates (Fees checked / Research checked / Source check).
   - The factbook shows two dates.
   - The home page shows "Oct 8, 2026" against ISO everywhere else.
   - Fix: on /compare add "Fees checked 2026-10-08" from `exchange-facts.js` next to the matrix title. On the profile, merge the dates into one meta line: "Fees checked 2026-10-08 · Product notes 2026-09-04 · Offers 2026-09-06". Use ISO on the home page.

5. **Accent used for non-signup actions (the brief allows it only on the primary CTA, positive data and the active route).**
   - /br has 4 turquoise buttons: "Comparar estas opções" (an anchor), 2× "Confira domínio, KYC, moeda de depósito e elegibilidade antes de inserir dados" (52px, two-line, linking to profiles), and "Próximo: Pix e BRL".
   - /news, /activities and /rates use turquoise for "Compare total cost →".
   - Fix: make all of these outline secondaries; at most one turquoise signup per view.

6. **The rail is a progress bar, not a route.**
   - Nodes are unlabeled dots whose positions are arbitrary DOM offsets (e.g. the profile has 10 nodes, 4 of them within 360px).
   - /exchanges has one node, at the end of the table.
   - On mobile it is a 2px sliver at x=5, inside the gutter.
   - The stub to the destination CTA never draws on inner pages (`--v6r-stub: 0px`).
   - Fix: place nodes only at h2s and give each a 12px label on hover/focus (desktop). Draw the stub into the page's real destination (the registration card on the profile, the dock on /exchanges, the result on /rates). Add one inner signature: a count-up on /rates figures on input, or a curved route drawn between the two dock logos. On mobile, drop the rail and show a 2px top progress bar instead.

7. **Profile action soup (`/exchanges/{slug}`).**
   - Seven actions sit before "Pre-registration decision": "Must verify" disclosure, then 6 underline links in 2 ragged rows.
   - "Open deep comparison" and "Review pre-registration checklist" float as loose buttons after a disclosure with "0/4 checked" set at 20px against a 16px title.
   - "Account and costs / Sources and security / Continue following" are 16px label-over-row eyebrows (banned pattern).
   - A slate `rgba(15,23,42,.88)` "Reset" button sits in the checklist.
   - Fix: one "Sources" row list (domain · fees · KYC · regions, with ↗), one secondary ("Compare with OKX"), the checklist count at 14px meta, the eyebrows removed, and Reset restyled to the outline secondary.

8. **/compare stacking.**
   - Below the matrix: "Show pending fields", a card-in-card decision with "Full matrix / Review sources and decision notes", then "Review fees, reserves and KYC", "Pre-registration verdict", "Open scenario fit and next steps", the FAQ, "Must verify before registration" and "Continue research". That is 7+ disclosures in a row.
   - The codes appear 3× each.
   - The uppercase "METRICS" header remains.
   - "0.10% / 0.10%Regular User" has no space.
   - The "Show more/fewer metrics" "+" is blue `rgb(83,177,253)` at 390.
   - Fix: one "Sources and decision notes" group, the code shown once per venue in the decision card, sentence case, and a 12px meta tier label on its own line.

9. **Mobile directory cells break mid-word.**
   - At 390, `/exchanges` Binance perp and Kraken spot render "Not / yet / check / ed".
   - HTX, HashKey and Aevo render "No / comparison / page yet" in a ~70px column.
   - Fix: `overflow-wrap: normal; word-break: normal` on `.mx-td` values; on mobile, place the fee pair under the name at full width (as the code chip already is) and move "No comparison page yet" under the checkbox as one 12px line.

10. **/rates calculator card is overloaded.**
    - Inside one bordered card: the calculator, "What the public fee check can answer", 3 compare links, the Offer row with 3 buttons, "Need the full directory?", the Bot promo with two Telegram links, and a route row.
    - At 390 the card is ~2,600px and contains a ~120px hole between "Open NexuAlpha Bot" and "Telegram support".
    - Fix: end the card at the result list and the Offer row; move the directory and Bot blocks below the benchmark table as plain rows.

11. **Horizontal voids at 1440.**
    - /methodology: "Editorial Independence", "Data License" and "Data Correction" are ~560px wide with ~640px empty to the right, and "contact@nexualpha.com" floats right-aligned with no relation to the text.
    - /telegram: the content column is ~60% of the container.
    - /exchanges, /factbook and /methodology: ~190–210px from the last row to the footer, against a 128px section-padding rule.
    - Fix: use a 2-column (4/8) layout with the h2 on the left and body on the right for methodology and telegram sections; put the action inline under the text; cap the gap before the footer at 128px.

12. **Directory and segment consistency.**
    - /exchanges offers All/CEX/DEX/Perp DEX; /rates offers All 24 Venues/CEX/Perp DEX.
    - Fee pair format: "0.08 / 0.10 %" (/exchanges) vs "0.08% / 0.10%" (rest).
    - "Verified first" puts Uniswap and Aerodrome (both "Not yet checked") in the verified group, which contradicts the visible "Not yet checked".
    - Hyperliquid's "Checked 2026-10-08" meta overflows into the spot-fee column at 1440.
    - Fix: one segment set and one formatter, define "verified" as at least one checked fee field, and let the identity cell meta wrap.

13. **/br second h1.** `b` (20px bold) "Compare custos e condições antes de abrir sua conta cripto no Brasil" at y=1784 repeats the h1 above the step tracker. The calculator's "R$ 1,00" result at R$1.000 is correct (0.10%) but reads as a token value. Fix: drop the restatement; show "R$ 1,00 de taxa em R$ 1.000" as one sentence.

14. **/factbook copy.**
    - The same 14-word dek repeats on all 24 rows.
    - Rows show no review date and no "n/N fields checked" (R3 ask, still open).
    - The detail page shows "Proof of Reserves (PoR) & Solvency Telemetry", "Clean Reserve Ratio", and an uppercase "MANDATORY" badge.
    - Fix: per-row "Fees checked 2026-10-08 · 2/4 fields", plain headings, sentence-case badge.

15. **Reveal fragility (minor).** In a capture with a fast scroll (600px steps, 120ms dwell), the profile's "Similar platforms" row and the Products/Regions columns were still at opacity 0 at capture time. With 300px steps or a 1.5s dwell they reveal, and no-JS shows everything. Fix: reveal anything above the current scroll position immediately (no transition) on scroll end.

## Cross-page matrix (1440 / 390)

| Page | h1 (1440 y/x · 390 y/x) | Off-scale sizes | Button variants | Tap <44 (390) | Non-accent saturated colours |
|---|---|---|---|---|---|
| /exchanges | 128/120 · 124/24 | none | 5 | 0 | – |
| /exchanges/binance, okx | 152/120 (logo) · 204/24 | none | 3 | 0 | slate Reset |
| /compare/binance-vs-okx | 148/120 (back link) · 144/24 | none | 8 | 0 (checkbox has 44px label) | blue "+" (390) |
| /rates | 128/120 · 124/24 | none | 4 | 0 | white active hairline |
| /factbook | 128/120 · 124/24 | none | 2 | 0 | – |
| /factbook/binance | 152/120 (logo) · 148/24 | none | 5 | 0 | white active hairline |
| /telegram | 128/120 · 124/24 | none | 3 | 0 | – |
| /br | 128/120 · 124/24 | none | 6 (4 turquoise) | 0 | – |
| /news | 128/120 · 124/24 | none | 4 | 0 | – |
| /activities | 128/120 · 124/24 | none | 5 | 0 | – |
| /methodology | 128/120 · 124/24 | none | 1 | 0 | – |

Distinct computed font sizes:
- 1440, all pages (default and open): 12, 14, 16, 20, 28, 44.
- 390: 12, 14, 16, 18, 20 (header brand label only), 24, 32.

There is no horizontal scroll at either width.

## Verdict

**Fail the gate (no dimension reaches 8), but this is the best inner build so far and it is shippable after defect 1.**

Fixed since R4:
- The stylesheet loads.
- Maker/taker order is consistent on every surface.
- The /rates terminal is honest about ties and caps.
- /methodology and /telegram are flattened.
- Tap targets pass.

Two things block "award-worthy":
- **The rail ships broken on the most commercially important template** (/exchanges/{slug}). It is a one-line coordinate fix, and it must ship before anything else.
- **The motion concept is thin.** The rail is a progress meter; nothing on an inner page moves in response to what the visitor chooses.

Neutrality issues (the Binance tie CTA and unchecked-first ordering) and the broken /activities counts are the next priority because they cost trust.

Order: 1 → 2 → 3 → 4 → 5 → 9 → 7/8 → 6 → the rest.
