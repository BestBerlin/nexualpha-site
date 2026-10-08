# V6 independent review, round 6: inner pages (build 3.0-20261008T2111-GH-c32002e, preview :4731)

Reviewer: independent; I did not build any of this. Scored against `docs/design/v6-brief.md`. Round-5 defect numbers refer to `v6-review-round5-inner.md`.

## Build checks

- `/version.json` returns `{"version":"3.0.0","buildId":"3.0-20261008T2111-GH-c32002e"}`.
- `/exchanges` at 1440: the h1 is 44px at x=120, y=128.

## Method

- Playwright Chromium (`channel='chromium'`, `--disable-gpu`) at 1440x900 and 390x844, plus rail checks at 1280, 1366, 1536 and 1920.
- Each page was scrolled programmatically in 400px steps, then probed in two states: as served, and with every `main details` opened.
- Probes collected:
  - computed font-size and font-family sets;
  - h1 position;
  - targets under 44px;
  - uppercase text;
  - saturated non-accent colours;
  - turquoise-filled actions;
  - vertical voids over 160px;
  - scrollWidth;
  - dates and fee strings;
  - every rail part (track, fill, nodes, labels, stub) intersected against every text line box in `main`;
  - rail fill at 0/33/66/100% scroll;
  - fixed and sticky layers.
- Interactions were scripted:
  - `/exchanges`:
    - 4 segments by mouse and by keyboard (ArrowRight);
    - search ("okx" returns 1, "zzzz" shows the empty state, clearing returns 24);
    - 3 sorts × 2 directions, with `aria-sort` read back;
    - Verified first;
    - copy-code, with the clipboard read back;
    - the compare dock (resulting URL fetched: 200).
  - `/rates`: volumes 0, empty, −5, 2.5M and 1e12, across all 4 Spot/Perp × Taker/Maker modes.
- No-JS and `prefers-reduced-motion` were checked on the profile, /rates and /activities: 0 hidden elements.

## Scores (gate is 8)

| Dimension | R5 | **R6** | Reason |
|---|---|---|---|
| Typography | 7.5 | **7.5** | Desktop sizes are 12/14/16/20/28/44 on all 12 pages. Mobile sizes are 12/14/16/18/20/24/32. Families are Geist V5 and Geist Mono V5 only. Mid-word breaks are gone. Lost points: 12px vertical rail labels truncated with "…" and clipped under the header ("Produ"); mixed disclosure glyphs (＋ vs ▼) on the same page; "Show 1 more questions"; a 4-line 44px h1 on /compare; textContent glue such as `0.10%/0.10%` and `0.08%/0.10%Regular User` (home), which screen readers read as one token. |
| Whitespace / rhythm | 6 | **6.5** | /methodology and /telegram now use a proper 4/8 split. New or remaining problems: on the profile, the right ~424px column is empty from y≈1400 to the footer (about 1,600px of void) because the registration card's sticky cell ends with the hero grid; the /compare hero has an empty right half; the /br mid-page is a cramped field of 12 outline buttons with 8px gaps, while the rest of the page uses 48–128px; on the profile, three trailing disclosures sit roughly 80px apart with no dividers. |
| Hierarchy | 6 | **6.5** | The profile action soup is reduced (3 source links, no eyebrows). Still: 8 visible disclosures on the profile; "Must verify before registration" twice on one screen; /activities with an empty state ("No verified recent activity") above 6 populated rows, two h2s with the identical dek, and a 3-tile stat strip (banned hero-metric pattern); the /br h1 restated mid-page. |
| Colour | 7 | **7** | Turquoise is gone from /br, /news, /activities and /rates secondaries. The blue "+" and the white hairlines are gone. But there is a new ship-blocker: the /activities Telegram CTA renders `rgb(4,19,15)` ink on a transparent background, so it is invisible (about 1.1:1). Accent still appears on non-signup actions: "Start with Binance source record" (/factbook), "Launch Assistant Bot" (/telegram) and "Open comparison" (the dock). The profile checklist cards use a navy `rgba(15,23,42)` tint. |
| Motion | 5 | **6** | The rail now has per-h2 nodes, rotated labels on the current node and a stub branch into the registration card, and below about 1300px it becomes a 2px top progress bar. It never crosses text (0 intersections on 12 pages × 1440/1366/1536/1920). But the stub reads as a stray 860px horizontal rule parallel to the hairlines, the rail vanishes at 1280 (the most common laptop width), and nothing reacts to input (no count-up on /rates, no route drawn in the dock). |
| Micro-interaction | 7 | **7.5** | Everything scripted works: segments (24/13/6/5) with keyboard support and a live region, search with an empty state, sorts with correct `aria-sort` and unchecked venues last in both directions, Verified first (Uniswap and Aerodrome no longer misgrouped), copy (clipboard plus "Copied" plus aria-label), and the dock (→ `/compare/bitget-vs-bybit`, 200). The /rates tie and Binance ordering are fixed. Broken: the dock's VS badge overlaps and clips the Bybit logo (46px image vs 34px); the /compare sticky venue bar (45px, z60) sits over the 56px site header, so the header's active underline and button bottoms show through. |
| Responsive | 7 | **7.5** | /exchanges at 390 is now stacked cards with labelled fee rows, so no word breaks. There is no horizontal scroll at 390, 1280 or 1440, and 0 primary targets under 44px at 390. Remaining: /compare "Open independent profile" links are 270x30 at 390; the rail drops to a top bar below about 1300px, so 1280 laptops never see the route. |
| Originality | 4.5 | **5** | The labelled rail with a branch into the CTA card is real Crossroads vocabulary, but it is a vertical line with dots. The pages remain a competent dark data template (row lists, outline buttons, ＋ disclosures). Nothing on an inner page is memorable. |

**Per page** (5 = competent template, 8 = award-worthy):

| Page | R5 | **R6** | One-line reason |
|---|---|---|---|
| /exchanges | 7.5 | **8** | Best inner page. Clean rhythm, consistent `%` format, working filters, sorts and dock, and good mobile cards. Lost on the dock logo overlap and a rail with no labels (start and destination only). |
| /exchanges/binance | 5 | **6.5** | The rail is fixed (x=94 vs 120). Still: a 1,600px right-column void, 8 disclosures, a duplicate "Must verify", a slate checklist card grid, three dates when opened, and the stub hitting the card about 130px below its CTA. |
| /exchanges/okx | 5 | **6.5** | Same template and the same issues. |
| /compare/binance-vs-okx | 6 | **6** | "Fees checked 2026-10-08" now sits under the matrix title, and the blue "+" and METRICS are gone. Still: the sticky bar overlaps the header, a hero right-half void, "Review sources and decision notes" next to "Sources and decision notes", a "Metrics" select where 5 of 8 options are "Pending", and mixed ＋/▼ glyphs. |
| /rates | 6.5 | **7** | Tie and ordering are honest, and the Bot block is out of the card. The card still mixes in "What the public fee check can answer" and 3 links. "Continue comparison" appears twice. The "Offer & eligibility" heading sits over a "Method:" sentence. The Conditions text concatenates sentences with no punctuation ("…USDC columns Uses Binance's…", "…fee page Taken from…"). |
| /factbook | 7 | **6.5** | Unchanged: the same dek on 24 rows, no date or field count per row, and an accent CTA that is not a signup. |
| /factbook/binance | 6.5 | **6** | "Solvency Telemetry", "Clean Reserve Ratio" and "MANDATORY" remain. Segments read "CEXs / Perp DEXs / Spot DEXs" (≠ /exchanges). A lone right-floated "▼ View Markdown data" button. Two dates. |
| /telegram | 6.5 | **7** | 4/8 Q&A rows read well. Opened: the command deck is a card-in-card 3+1 grid with an orphan 4th card, and the "Questions answered" disclosure is a ~100-link multilingual keyword soup (Korean, Turkish and Japanese on an English page). |
| /br | 6 | **5.5** | The turquoise misuse is fixed. The h1 restatement under "Rota principal · passo 1 de 4" (an eyebrow) remains, and the mid-page is a cramped button field (CTA band, 2 cards, a stepper, 2 buttons, 3 chips, a Bot card with pills, 3 "Próximos passos" buttons). |
| /news | 7 | **7.5** | Calm list, working tabs, count and search, and an outline "Compare total cost". |
| /activities | 6 | **5** | Chips replaced by a Platform select. But: an invisible Telegram CTA, "No verified recent activity" above populated rows, the same dek ×3, a stat strip with "source entries 36 / Current 0 / Registration rewards 21" (lowercase, contradictory), and all rows dated 2026-09-06 (32 days) under the note "older than 7 days are flagged". |
| /methodology | 6 | **7** | 4/8 sections fix the half-width void. Still: the h1 "Rating Methodology" has no ratings; the dates are non-ISO ("September 2026 (v3.8)", "15 September 2026"); there are numbered pillars; and the copy over-claims ("We audit… historical order-matching uptime"); JSON/CSV links are 38x18. |

## Round-5 defect status

| R5 # | Status | Evidence |
|---|---|---|
| 1 Rail crosses the profile column | **Fixed** | Track at x=94 vs content at 120 (1440). At 1366: 57/83; 1536: 142/168; 1920: 334/360. 0 text intersections for track, nodes, labels and stub on all 12 pages. |
| 2 /rates favours Binance | **Fixed** | A 4-way tie shows "Continue comparison" with no venue CTA. In Perp + Taker and Perp + Maker, Binance "Not yet checked" is listed last. |
| 3 /activities chips read 0 | **Fixed by removal** | Chips replaced by a Platform `<select>`. A new contradiction replaced them (defect 8 below). |
| 4 Date story | **Partly** | Fixed: /compare shows "Fees checked 2026-10-08" in mono under the matrix title, and home is ISO. Open: the profile shows 2026-10-08 + 09-04 + 09-06 when opened; the factbook detail shows 10-08 + 09-08; /methodology uses "September 2026" and "15 September 2026". |
| 5 Accent on non-signup actions | **Mostly fixed** | /br, /news, /activities and /rates are clean. Residual: "Start with Binance source record" (/factbook), "Launch Assistant Bot" (/telegram), "Open comparison" (dock). |
| 6 Rail is only a progress bar | **Partly** | Nodes sit at h2s with vertical 12px labels (current one visible), a stub branches into the registration card, and a top bar shows below ~1300px. Open: /exchanges has 2 unlabeled nodes; labels truncate ("officia…") and clip under the header; the stub lands ~130px below "Official signup"; no inner reacts-to-input motion. |
| 7 Profile action soup | **Partly** | Fixed: 3 source links (was 6), eyebrows gone, Reset outline, "0/4 checked" in 12px mono. Open: 8 disclosures; "Must verify before registration" as both disclosure and row label; slate-tinted 4-card checklist grid; lone "Open deep comparison"; "Monitor on Telegram ↗" is a disclosure that looks like an external link. |
| 8 /compare stacking | **Partly** | Fixed: blue "+", METRICS and the "Regular User" glue. Open: 5 disclosure layers with near-duplicate names, the "Metrics" jump-select, and mixed ＋/▼ glyphs. |
| 9 Mobile mid-word breaks | **Fixed** | Stacked mobile cards with "Spot fee / Perp fee" rows. |
| 10 /rates card overloaded | **Mostly fixed** | Bot and directory are out. Explainer and link list remain inside; "Continue comparison" appears ×2. |
| 11 Horizontal voids | **Fixed on methodology/telegram; new on profile and compare** | See defect 3 below. |
| 12 Directory consistency | **Mostly fixed** | /rates segments now match /exchanges, Verified first is correct, and the Hyperliquid date wraps. Open: the factbook detail uses "CEXs / Perp DEXs / Spot DEXs"; Bybit's tier reads "VIP 0" vs "Regular User" elsewhere. |
| 13 /br second h1 | **Not fixed** | |
| 14 /factbook copy | **Not fixed** | |
| 15 Reveal fragility | **Not reproduced** | No-JS and reduced-motion show everything. |

## Fee/date consistency (scripted)

**OKX spot 0.08% / 0.10%:**
- /exchanges, /exchanges/okx, /compare/binance-vs-okx, /compare/okx-vs-bybit and /rates all agree.
- `/` uses the variant format "0.08/0.10%" plus the glued "0.08%/0.10%Regular User".

**Other fees:**
- OKX perp is 0.02% / 0.05% everywhere.
- Bybit perp is 0.02% / 0.055% on both /exchanges and /rates.
- Binance perp reads "Not yet checked" everywhere.

**Dates:**
- Default view shows a single date ("Fees checked 2026-10-08") on all fee pages.
- Opened disclosures add 09-04 / 09-06 (profile), 09-08 (factbook detail) and 09-22 (compare).

## Defects, most severe first

1. **Invisible CTA on /activities.**
   - Where: `a.activity-center-v3__tg-btn` ("Subscribe to Telegram source-reviewed research ↗").
   - Problem: it computes `color: rgb(4,19,15)` on `background: transparent` inside a dark card, so it is an empty-looking 368x44 box. Contrast is about 1.1:1, an AA failure, and the CTA is lost.
   - Cause: the turquoise fill was removed but the on-accent ink was kept.
   - Fix: use the outline-secondary token (`color: var(--text)`). Grep for other `color` values set to the on-accent ink without the accent background.

2. **The /compare sticky venue bar collides with the site header.**
   - Where: `.v3-compare-sticky-bar` (fixed, top 0, 45px, z60) over `.nx-hdr__bar` (fixed, 56px, z40).
   - Problem: the bottom 11px of the header shows through. You can see the turquoise active "Compare" underline at y≈55 and the bottoms of the Search and English buttons under the bar. It reads as a rendering glitch.
   - Fix: make the bar 56px and opaque, or hide the header while the bar is shown (`[data-compare-sticky] .nx-hdr {transform: translateY(-100%)}`). Alternatively, dock the bar at `top: 56px`.

3. **Profile right-column void (/exchanges/{slug}, 1440).**
   - Problem: `.registration-card` is sticky only inside the hero grid cell. From "Products / Regions and eligibility" down (y≈1400 → footer, about 1,600px), the right 424px of the 1200 container is empty, and every lower section is ~776px wide. This is the user's "大量留白" verdict.
   - Fix: span the grid to the end of `main` so the card stays sticky through the page, or switch the lower sections to the full 12 columns (Products 6 / Regions 6, disclosures full width).
   - Also equalise Products (3 rows) and Regions (6 rows), or stack them as one row list.

4. **The rail stub reads as a glitch, not a route.**
   - Where: `.v6r__stub`, a 2px turquoise line 860px wide, drawn at a fixed page y (1122 on Binance, 660 on OKX). It sits between two hairlines (406/422/467 at scroll 700) and ends at the card's left edge about 130px below "Official signup".
   - Because the card is sticky and the stub is not, the stub meets a different part of the card as you scroll.
   - Fix: draw the stub in the card's own coordinate space, aimed at `.registration-card__primary-btn`'s vertical centre. Curve it (a quarter-radius elbow from the rail, using the homepage's route curve) and animate `stroke-dashoffset` once when it enters.
   - Labels: the rotated `.v6r__lab` should never truncate. Use a horizontal 12px label to the left of the node, or the first 3 words only, and keep it below the header (`top ≥ 56px`).

5. **The rail vanishes at 1280.**
   - The `[data-bar]` mode starts below about 1300px, so the most common laptop width gets only a 2px top bar, and /exchanges at 1440 gets 2 unlabeled nodes.
   - Fix: at 1024–1365, keep the rail inside the 24px gutter by shifting content 24px, or move it to the right edge of the text column. On /exchanges, add nodes at the filter bar, the first "Not yet checked" row and the dock.

6. **Profile disclosure stack and duplicate labels.**
   - Problem: 8 visible disclosures; "Must verify before registration" appears as both a disclosure title and the row label under "Pre-registration decision".
   - "Monitor on Telegram ↗" is a `summary` with ＋ that looks like an external link.
   - The 4 checklist cards use a navy `rgba(15,23,42)` tint, an identical-card grid.
   - "Open deep comparison" floats alone.
   - Fix:
     - Merge "Invitation, fees and registration checks" and "Open deeper verification material" into one "Sources".
     - Make Telegram a plain row link.
     - Restyle the checklist as 4 inline toggle rows on graphite.
     - Put "Compare with OKX" next to the checklist count.

7. **/compare disclosure layering and controls.**
   - "Full matrix / Review sources and decision notes" and "Sources and decision notes" are two adjacent disclosures with near-identical names.
   - The FAQ uses ▼ while the rest use ＋.
   - The `select` "Metrics" jumps to 8 metrics, 5 of which are "Pending official-source verification".
   - "Show 1 more questions" is ungrammatical.
   - The hero h1 runs 4 lines at 44px with an empty right half.
   - Fix:
     - Use one sources disclosure and one glyph system.
     - Remove the select (the matrix is short) or list only checked metrics.
     - Write "Show 1 more question".
     - Shorten the h1 ("Binance or OKX: fees, products, KYC and Web3 access") or put the decision summary card in the right half.

8. **/activities contradicts itself.**
   - "No verified recent activity" (empty state) sits above 6 populated rows.
   - "Registration rewards" and "Rewards and activity research" are two h2s with the identical dek. The dek appears a third time in the stat strip.
   - The stat strip "source entries 36 / Current 0 / Registration rewards 21" is a banned hero-metric block, in lowercase, and contradicts the rows.
   - All rows read "Source check: 2026-09-06" under a rule that flags anything older than 7 days, but there is no visible flag beyond the generic "Recheck required" chip.
   - Fix: delete the empty state when rows exist, use one h2, drop the stat strip, and show "Rechecking: 32 days old" per row.

9. **/br mid-page button field and h1 restatement (R5 #13, open).**
   - The section "Rota principal · passo 1 de 4" plus a 20px "Compare custos e condições antes de abrir sua conta cripto no Brasil" repeats the h1.
   - About 12 outline buttons and chips are crammed into ~400px with 8px gaps, between sections spaced 64–128px.
   - Fix: delete the restatement and the eyebrow. Keep the stepper plus one "Próximo: Pix e BRL" button. Fold "Critérios de apoio" chips and "Próximos passos" into a single row list. Give the Bot card the standard section spacing and drop its pill links.

10. **Accent on non-signup actions (residual from R5 #5).**
    - "Start with Binance source record" (`/factbook` hero) is turquoise and is also Binance-first (a neutrality smell).
    - "Launch Assistant Bot ↗" (`a.tg-btn`, /telegram) is turquoise.
    - "Open comparison" (`.mx-dock a.mx-btn`) is turquoise.
    - Fix: outline-secondary for all three. If the dock needs emphasis, use a white-on-graphite border, not the accent.

11. **Dock visual collision.**
    - The `.mx-dock__vs` badge (30px, x=542) overlaps the second slot's logo. Bybit's `img.v2-brand` renders at 46x46 vs Binance's 34x34, so the Bybit wordmark is clipped ("YBI'T") at both 1440 and 390.
    - Fix: give `.mx-dock img.v2-brand` a fixed 32px size with `object-fit: contain` and a 4px radius tile. Reserve a 32px gutter for the VS badge between the slots. This is the obvious place for an inner signature: draw a curved route between the two logos when the second slot fills.

12. **Factbook copy and taxonomy (R5 #14, open).**
    - The same 14-word dek repeats on 24 rows, with no "Fees checked · n/N fields" per row.
    - The detail page keeps "Proof of Reserves (PoR) & Solvency Telemetry", "Clean Reserve Ratio" and a "MANDATORY" badge.
    - The detail segments read "All Factbook research records (24) / CEXs (13) / Perp DEXs (5) / Spot DEXs (6)", while /exchanges uses All/CEX/DEX/Perp DEX.
    - A lone right-floated "▼ View Markdown data" button sits 120px below the Copy Markdown button.
    - Fix: a per-row date and field count, plain headings, a sentence-case badge, the shared segment component and labels, and the export buttons in one row.

13. **/rates copy concatenation.**
    - The Conditions text joins two strings with no punctuation: "…excluding USDC columns Uses Binance's Regular User row…" and "Base rate from the official fee page Taken from the platform's…".
    - "Continue comparison" appears twice.
    - The "Offer & eligibility" heading sits over a "Method:" sentence.
    - Fix: join with ". " and rename the footer row "Method"; keep one "Continue comparison".

14. **/telegram opened state.**
    - The command deck is a card-in-card 3+1 grid with an orphan "Anti-Phishing Verifier" card.
    - "Questions answered on NexuAlpha" expands into ~100 keyword links in 5 languages on an English page.
    - Fix: a 2×2 grid or row list for commands; filter the question index to the page locale and cap it at about 12.

15. **/methodology.**
    - The h1 promises "Rating Methodology" with no ratings.
    - The dates are non-ISO ("September 2026 (v3.8 Specification)", "Page reviewed 15 September 2026").
    - The pillars are numbered 1–4.
    - Pillar 4 over-claims ("We audit mandatory KYC… historical order-matching uptime").
    - JSON/CSV links are 38x18.
    - Fix: "Data and review methodology", ISO dates, unnumbered pillars, honest scope copy, and 24px-high data links.

16. **Hygiene.**
    - Footer column headings "COMPARISONS / FEE TOOLS / TOKENIZED ASSETS" are letter-spaced uppercase eyebrows on every page. On /compare the Comparisons column is missing, which leaves a 460px gap between Fee tools and Tokenized assets.
    - The /exchanges fee pair has no spaces in textContent (`0.10%/0.10%`); add real spaces or an `aria-label`.
    - /compare "Open independent profile" links are 270x30 at 390.

## Verdict

**Fail the gate. No dimension reaches 8; /exchanges alone reaches 8 as a page.** This round fixed the R5 ship-blockers:
- the rail no longer crosses text at any width;
- the /rates neutrality issues are fixed;
- mobile word-breaks are gone;
- /methodology and /telegram have a real layout.

It shipped two new visible defects, both one-line fixes:
- an invisible CTA (/activities);
- a sticky bar overlapping the header (/compare).

**Order:** 1 → 2 → 3 → 8 → 4/5 (rail as a designed route, including at 1280) → 6/7 → 9 → 10/11 → rest.

The motion and originality ceiling will not move until an inner page responds to input (a route drawn in the dock, or a count-up on /rates).
