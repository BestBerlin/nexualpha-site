# V6 independent review, round 7: inner pages (build 3.0-20261008T2250-GH-7b09806, preview :4781)

Reviewer: independent; I did not build any of this. Scored against `docs/design/v6-brief.md`. Round-6 defect numbers refer to `v6-review-round6-inner.md`.

## Build check

`/version.json` returns `{"version":"3.0.0","buildId":"3.0-20261008T2250-GH-7b09806"}`.

## Method

- **Browser:** Playwright Chromium (`channel='chromium'`, `--disable-gpu`) at 1440x900, 1280x900 and 390x844.
- **Pages:** all 12, each scrolled programmatically in 400px steps. Each page was probed twice: as served, and with every `main details` opened.
- **Probes:**
  - computed font sizes and families;
  - h1 position;
  - targets under 44px;
  - uppercase text;
  - saturated colours;
  - turquoise-filled actions;
  - vertical voids over 160px;
  - scrollWidth;
  - dates and fees;
  - rail parts intersected against every text line box;
  - rail fill at 0, 33, 66 and 100% scroll.
- **Screenshots:** full-page segments plus viewport shots at scroll positions, to check the sticky card and the rail branch.
- **Interactions scripted:**
  - `/exchanges`:
    - 4 segments by mouse, plus ArrowRight;
    - search: "okx", "zzzz" and clear;
    - 3 sorts × 2 directions, with `aria-sort` read back;
    - copy-code, with the clipboard read back;
    - the dock (2-venue cap, route drawing, resulting URL fetched: 200) at 1440 and 390.
  - `/rates`: inputs 0, empty, −5, 1e12 and 12345.67, across all 4 Spot/Perp × Taker/Maker modes, with a count-up sampled every 60ms.
  - `/compare`: the sticky bar against the header at 5 scroll depths.

## Scores (gate is 8)

| Dimension | R6 | **R7** | Reason |
|---|---|---|---|
| Typography | 7.5 | **7.5** | Desktop sizes are 12/14/16/20/28/44 on all 12 pages. Families are Geist V5 and Geist Mono V5 only, with no uppercase eyebrows. Phone sizes are 12/14/16/18/20/24/28/32: 8 steps on the profile, where 18 and 24 are off-scale clamp products. Title Case headings survive on /factbook/binance ("Regulatory Compliance, KYC & Account Security", "Recorded Alternate Domains & Subdomains") and /methodology ("…Commercial Wall of Separation"), against sentence case elsewhere. At 390, "0/4 checked" wraps to two lines. |
| Whitespace / rhythm | 6.5 | **7** | The 1,600px profile right-column void is gone, because the card is now sticky through the page. The /compare hero void and the /br button field are gone. New or remaining problems: half-width or offset hairlines on 5 pages (defect 8); /exchanges has a 26px tonal seam under the header and a 128px tinted slab after the table holding only the rail's end node; /factbook row heights vary from 80 to 113px because "· 1/2 fee / fields" wraps in a too-narrow facts column; the /telegram hero right half (about 700×450) is empty. |
| Hierarchy | 6.5 | **7** | /activities no longer contradicts itself (the empty state, duplicate dek and stat strip are gone). The /br h1 restatement is gone. Still: /compare has a Jump-to nav, a Metrics select, "Show pending fields 5", "Show fewer metrics" and a lone "Full matrix" link stacked over one 4-row table. "Pending official-source verification" is used as a row label with the field names as values (factbook detail), which reads as an empty form. |
| Colour | 7 | **7.5** | The /activities invisible CTA is fixed, and the dock and factbook-hero accent is gone. Residual: "Launch Assistant Bot ↗" is still turquoise (/telegram). Turquoise arrows sit on secondary link rows ("Compare total cost →", on /rates and /factbook/binance). Static radio-ring bullets read as controls (defect 6). |
| Motion | 6 | **6.5** | The rail now lives in the gutter between the text column and the card (x=927 at 1440, 847 at 1280). It shows at 1280, has 0 text intersections on 12 pages × 3 widths, and its curved elbow lands exactly on the "Official signup" vertical centre while the card is sticky. That is the first inner moment that feels designed. The dock draws a 40px turquoise route between the two venues. Still: /rates has no count-up (the value is final within 60ms of input). On /factbook and /news the rail becomes a per-row index with 300–360px vertical article-title labels. On /exchanges it runs about 2,000px past its last node through nothing. |
| Micro-interaction | 7.5 | **7.5** | Segments (24/13/6/5) work with keyboard and a live region. Search with empty state and Reset works. Copy works (clipboard, "Copied", aria-label). The dock caps at 2, disables the rest, and links to `/compare/binance-vs-coinbase` (200). /rates modes are correct (Binance perp is "Not yet checked" and listed last; the Perp+Maker 3-way tie is honest). Lost points: the spot-fee sort has no secondary key (defect 1), and the dock's 40px route is too small to register as a reward. |
| Responsive | 7.5 | **8** | No horizontal scroll at 390, 1280 or 1440. The rail exists at 1280. Primary targets under 44px at 390 are low (1–7 per page). Remaining: /methodology has 7 small targets at 390 (JSON/CSV) and /compare has 7 when opened; desktop has 67–70 targets under 44px on /exchanges and /rates (sort chips, inline source links). |
| Originality | 5 | **5.5** | The rail-to-CTA elbow and the dock route are real Crossroads vocabulary. Everything else is still a competent dark data template: hairline rows, outline buttons and ＋ disclosures. The new per-row rail nodes on /factbook and /news dilute the metaphor instead of strengthening it. |

**Gate: fail.** Responsive reaches 8. Every other dimension is below 8.

### Per page (5 = competent template, 8 = award-worthy)

| Page | R6 | **R7** | One-line reason |
|---|---|---|---|
| /exchanges | 8 | **8** | Still the best inner page: dock route, logos fixed at 32px, real spaces in the fee pair. Lost on the spot-sort tie order, the clipped Bybit wordmark, the tinted slab after the table and the empty rail tail. |
| /exchanges/binance | 6.5 | **7** | The sticky card and the curved branch to "Official signup" fix the biggest R6 issues. But "Products" lists editorial claims, not products. "Similar platforms" has rules at 896 vs 694, "1 platforms ↓", and buttons with both a border and an underline. The FAQ reads "Binance: Official domain marked". "Reviewed official updates" is an empty-state line with 3 buttons. |
| /exchanges/okx | 6.5 | **7** | Same template, same issues. |
| /compare/binance-vs-okx | 6 | **6.5** | The sticky bar no longer collides (it never shows: transform −45 at every depth), and "Show 1 more question" is fixed. Still too many matrix controls, the orphan half-box "Show pending fields 5", and PoR showing "Pending" next to "View audit report". |
| /rates | 7 | **6.5** | Every R6 #13 item remains. "Continue comparison" ×2. "Offer & eligibility" sits over "Method:", and in the DOM that footer row comes before the inputs. The "Checked / Conditions" labels don't fit their content. The h2 promises "Slippage". Telegram support ×2. No count-up. The tie note box ends at 1215 vs a row edge of 1288. |
| /factbook | 6.5 | **7** | A per-row date and n/2 fields (R6 #12 fixed), real fee deks, and the accent CTA removed. Rows are uneven because the facts column wraps. Rail nodes sit on rows 1–10 of 24 only. |
| /factbook/binance | 6 | **6** | The taxonomy and "MANDATORY" are fixed. New: a 24-chip venue cloud with chips nested inside chips; "Pending…" used as row labels; static radio bullets; Title Case headings; HQ "Global / Decentralized"; "User benefit status: pending" in lowercase. |
| /telegram | 7 | **7** | Good Q&A rows. Still turquoise. "Continue in Bot ↗" ×4. Row rules at 1320 vs 1304, and the feature card rules are offset 8px. "Web Preview Archive ↗" floats alone. |
| /br | 5.5 | **7** | Real improvement: a hero decision card, no restatement, a clean options list, and dated official sources. Lost on the fake radio stepper, a trivial 44px "R$ 1,00" as the hero number, the half-boxed "Ler o caminho local", and non-ISO mono dates ("22 de set. de 2026"). |
| /news | 7.5 | **7.5** | Calm list. "Results: 416" next to 4 visible items. The next-step trio is bordered buttons here but text links on /rates and /factbook. The rail label is a 360px vertical article title. |
| /activities | 5 | **6.5** | The contradictions are gone. Now monotonous: 6 identical "Account confirmation required" chips, the meaningless link "Page read", no visible check date, and an "Activities and listings" title over reward rows only. A double hairline sits before "Source notes…". |
| /methodology | 7 | **7** | The h1, ISO dates and unnumbered pillars are fixed. The pillar 1 copy over-claims ("models VIP0 to VIP9… Net Rate = Base Rate × (1 − Rebate Ratio)… verified broker agreements") while the site shows only base tiers ("10 recorded fee tiers: not yet source-reviewed"). JSON/CSV links are small. The hero rule ends at 884. |

## Round-6 defect status

| R6 # | Status | Evidence |
|---|---|---|
| 1 Invisible /activities CTA | **Fixed** | No transparent ink-on-dark CTA. The Telegram link now sits inside "Source notes, review rules and Telegram". |
| 2 /compare sticky bar over header | **Fixed (by never showing)** | `.v3-compare-sticky-bar` stays `translateY(-45px)` and opacity 0 at scroll 600–2600 (1440) and at 390. |
| 3 Profile right-column void | **Fixed** | The card stays sticky at scroll 2600. 0 voids over 160px. |
| 4 Rail stub glitch and truncated labels | **Fixed** | The curved elbow lands on the signup button's vertical centre at 1440 and 1280, with full labels. |
| 5 Rail gone at 1280 | **Fixed** | Rail at x=23 (content at 40) on standard pages and x=847 on the profile. /exchanges has 4 nodes (filter bar and sort header). |
| 6 Profile disclosure stack | **Mostly fixed** | One "Sources and security" group; the checklist is folded into "Check before opening the official flow 0/4 checked". Remaining: odd subtitle "Account and costs · Continue following"; 10 `details` in the DOM. |
| 7 /compare layering | **Partly fixed** | Grammar fixed; one glyph system (＋). Remaining: Metrics select, Jump-to, the half-box "Show pending fields", "Show fewer metrics", lone "Full matrix". |
| 8 /activities contradictions | **Fixed** | Replaced by monotony (see the /activities row above). |
| 9 /br | **Fixed** | Remaining issues are listed in the /br row above. |
| 10 Accent on non-signup | **Partly fixed** | Factbook and dock fixed. /telegram "Launch Assistant Bot" is still turquoise. |
| 11 Dock collision | **Fixed** | 32x32 logos and a route glyph instead of the VS badge. The Bybit wordmark still clips in rows (defect 2). |
| 12 Factbook copy/taxonomy | **Fixed** | Per-row date and fields; shared segments; MANDATORY and Telemetry removed. |
| 13 /rates concatenation | **Not fixed** | See defect 3. |
| 14 /telegram opened state | **Fixed** | 3-column command cards. The keyword soup was not reproduced in the default view. |
| 15 /methodology | **Mostly fixed** | Copy over-claim and JSON/CSV target size remain. |
| 16 Hygiene | **Partly fixed** | Footer eyebrows fixed and fee-pair spaces fixed. The Related research grid still loses a column on /compare (Fee tools / Tokenized only) and /rates (Comparisons / Tokenized), leaving about a 290px gap. |

## Fee/date consistency (scripted)

**Fees agree everywhere:** /exchanges, /exchanges/okx, /compare, /rates, /factbook rows and /factbook/binance.

| Venue | Spot (maker / taker) | Perp (maker / taker) |
|---|---|---|
| OKX | 0.08% / 0.10% | 0.02% / 0.05% |
| Binance | 0.10% / 0.10% | Not yet checked |
| Bybit | 0.10% / 0.10% | 0.02% / 0.055% |
| Bitget | 0.10% / 0.10% | 0.02% / 0.06% |
| Hyperliquid | 0.04% / 0.07% | 0.015% / 0.045% |

**Tier labels are still inconsistent:** Bybit and Gate show "VIP 0" on /rates, while OKX and Binance show "Regular User", Bitget "Standard non-VIP" and Kraken "Public source tier".

**Dates:**
- Default views show one date: 2026-10-08 on fee pages, 2026-10-04 on /news, 2026-09-15 on /methodology.
- Opened views add more:

| Page (opened) | Extra dates |
|---|---|
| Profile | 09-04, 09-06 |
| /factbook/binance | 09-08 |
| /compare | 09-22 |
| /activities | 09-06 (hidden by default) |

## Defects, most severe first

1. **The /exchanges spot-fee sort has no tie-break, so Binance sits above a cheaper OKX.**
   - Ascending order is Hyperliquid, Binance, Bybit, Bitget, OKX, Gate. OKX (0.08 / 0.10) is strictly cheaper than the 0.10 / 0.10 venues.
   - Descending order is Binance, Bybit, Bitget, OKX, Gate, so OKX sits above Gate even though Gate is dearer.
   - It is a stable sort on taker only, so source order (Binance first) wins every tie in both directions. That is a neutrality issue on the money page.
   - Fix: sort by taker, then maker, then name. Apply the same rule to the Perp column.
2. **The Bybit wordmark overflows or clips its logo tile on 6 pages** (renders as "BYB!T"/"YBI'T"): /exchanges rows, profile "Similar platforms", /factbook, /factbook/binance chips, /activities and /rates.
   - Fix: a fixed 32px tile with `object-fit: contain`, `overflow: hidden` and 4px padding, or use the square Bybit mark asset.
3. **/rates (R6 #13 and #10 not fixed).**
   - "Continue comparison" appears twice.
   - The "Offer & eligibility" heading sits over a "Method:" sentence, and that footer row is first in DOM order, ahead of the inputs, which breaks reading and tab order.
   - The labels "Checked" and "Conditions" sit over "It can…" and "It cannot…".
   - The h2 promises "& Slippage" with no slippage data.
   - Telegram support appears twice.
   - The tie note box ends at 1215 while the rows end at 1288.
   - There is no count-up.
   - Fix:
     - Move the footer after the rows in the DOM.
     - Keep one "Continue comparison".
     - Relabel the explainer "Can answer / Cannot answer".
     - Drop "Slippage".
     - Make the note full width.
     - Add the 320ms count-up on input (reduced-motion: instant).
4. **"Pending" next to evidence links, and empty-field dumps.**
   - /compare PoR shows "Pending official-source verification" and also "View audit report ↗".
   - /factbook/binance "Auditor and verification methodology" shows "Pending" and also "Review official reserve proof ↗".
   - /factbook/binance uses "Pending official-source verification" as a left-column label, with field names ("KYC Tier Breakdown", "Restricted Jurisdictions", "Declared total reserve ratio"…) as values.
   - Fix: write "Official page linked, figures not yet reviewed". Collapse unverified fields into one sentence ("6 fields not yet reviewed: …") instead of a label/value grid.
5. **/compare control pile-up.**
   - Over one 4-row matrix: "Jump to" nav, a "Metrics" select, the matrix, a "Show pending fields 5 ＋" disclosure drawn as an open half-box (left, right and bottom borders, no top), a "Show fewer metrics −" button, and then a lone underlined "Full matrix" link.
   - The same half-box disclosure appears on /br ("Ler o caminho local").
   - Fix: delete the select and "Show fewer metrics". Make "Pending fields (5)" a standard hairline disclosure. Remove the "Full matrix" link or attach it to the matrix title.
6. **Static radio rings read as controls.**
   - Where: the /factbook/binance "three conditions" list and the /br "Shortlist sugerido" stepper use ring-with-dot bullets identical to radio buttons, but they are not interactive.
   - Fix: plain 8px route nodes (the rail's node glyph), or make them real checkboxes tied to the "0/4 checked" pattern.
7. **Accent residue (R6 #10).**
   - "Launch Assistant Bot ↗" on /telegram is still turquoise-filled.
   - Turquoise `→` glyphs appear on secondary next-step links (/rates, /factbook/binance).
   - Fix: outline-secondary, and neutral arrows.
8. **Hairline misalignment (reads as unfinished).**
   - Profile "Similar platforms": the section rule spans to 896, the row rules end at 694, and the descriptions sit 20px below the venue names.
   - /telegram: the first rule ends at 1320 and the others at 1304. The feature-card rules start at 128 vs 120.
   - /methodology: the hero meta rule ends at 884.
   - /factbook/binance: the base-fee note rule ends at 694.
   - /activities: double rules 32px apart before "Source notes…".
   - Fix: one row component whose rule spans its container.
9. **Profile content quality.**
   - The "Products" heading lists editorial claims ("Official announcement and fee paths are clear enough for source review"), not products.
   - "Regions and eligibility" mixes generic caveats.
   - The subtitle "Account and costs · Continue following" is unclear.
   - The FAQ entry "Binance: Official domain marked" is not a question.
   - "1 platforms ↓" is ungrammatical.
   - "Reviewed official updates" is an empty-state sentence plus 3 buttons, one of them a disclosure dressed as a button ("Open official source ＋").
   - "Similar platforms" buttons combine a border and an underline.
   - Fix:
     - List actual products (Spot, Perps, Options, Earn, P2P) from `exchange-facts.js`.
     - Turn the FAQ titles into questions.
     - Write "Show 1 more platform".
     - Collapse empty updates to one line and one link.
     - Use plain row links in "Similar platforms".
10. **The rail as row index dilutes the route.**
    - /factbook puts nodes on rows 1–10 of 24, with 12px vertical labels "Binance Factbook…".
    - /news labels are 300–360px vertical article titles.
    - The /exchanges rail runs about 2,000px past its last node into a tinted 128px slab, with a 26px seam under the header.
    - Fix: rail nodes only at h2-level sections (max about 6), labels capped at 3 words. On /exchanges, add nodes at the first "Not yet checked" row and the dock, and end the rail at the table bottom. Remove the seam and the slab tint.
11. **/activities is monotonous and hides recency.**
    - Six identical "Account confirmation required" chips.
    - The link label "Page read" means nothing.
    - The check date (2026-09-06, 32 days old) appears only when opened.
    - The title says "Activities and listings", but there are no listings.
    - Fix: per-row "Source checked 2026-09-06 · 32 days" in mono, drop the identical chip (say it once in the dek), rename "Page read" to "Official page ↗", and retitle to "Registration rewards" or add listings.
12. **/methodology over-claims.**
    - Pillar 1 claims VIP0–VIP9 modelling, a rebate formula and verified broker agreements. The product shows base tiers only.
    - JSON/CSV links are under 24px high (7 small targets at 390).
    - Fix: describe what is actually checked (base maker/taker, official page, date), and give data links a 44px row.
13. **Related research footer** loses a column on /compare and /rates, leaving about a 290px gap. Fix: auto-fit the columns or always render 4.
14. **/factbook/binance venue switcher**: 24 chips in which each chip wraps a bordered name pill inside a bordered button (card-in-card), forming a 3-row tag cloud. Fix: a `select` or the shared segment plus a compact name row.
15. **Hero number on /br**: a 44px mono "R$ 1,00" (0.10% of R$1,000) is the most prominent element on the page and says little. Fix: make the default hypothesis R$ 10.000 or demote the figure to 28px; use ISO or `dd/mm/aaaa` dates consistently.

## Verdict

**Fail the gate.** This round fixed every R6 ship-blocker:
- the invisible CTA;
- the header collision;
- the profile void;
- the rail at 1280;
- the stub glitch.

It also produced the first inner signature that feels designed: the rail elbow docking onto "Official signup".

The remaining work is mostly finish and honesty:
- the sort tie-break (neutrality);
- the Bybit logo;
- /rates leftovers;
- "Pending + link" contradictions;
- /compare controls;
- hairline alignment.

Originality will not clear 8 until the dock route and a /rates count-up become visible moments, and the rail stops indexing rows.

**Order:** 1 → 2 → 3 → 4 → 5 → 8 → 6/7 → 9 → 10 → rest.
