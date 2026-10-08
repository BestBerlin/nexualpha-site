# V6 independent review, round 4: inner pages (build 3.0-20261008T1802-GH-94fcfbb, preview :4519)

Reviewer: independent; did not build any of this. `/version.json` = `{"version":"3.0.0","buildId":"3.0-20261008T1802-GH-94fcfbb"}` (verified first).
Method: Playwright Chromium at 1440x900 and 390x844. Every page was scrolled programmatically before each full-page capture, then captured again with every `main details` opened. Probes collected computed font-size and font-family sets, h1 position, lede, button variants, tap targets under 44px, saturated non-accent colours in default and open states, uppercase text, voids over 160px and scrollWidth. Interactions were scripted:
- /exchanges: segments, search, Verified first combined with sort, row hover, copy-code, and compare dock with 8 pairs (fresh context each), each resulting URL fetched.
- /rates: volume 0, empty, -5, 2.5M and 1e12; Spot/Perp and Taker/Maker; venue filter.
- /news: tabs and search.
- /exchanges/binance: sticky card at scrollY 0/800/1500/2500.
- Fee strings extracted from 14 pages and compared against `src/data/exchange-facts.js`.

Artifacts are in the scratchpad (`r4/`, `r4/sim/`, `res.json`, `res_sim.json`, `fees_out.txt`).

## 0. Ship-blocker: the merge emptied the V6 stylesheet

`94fcfbb Merge v6r4-fn (v6-merged4)` resolved a conflict in `pilot-01-prototype/src/styles/v6/index.css` by **deleting all 14 `@import` lines**. At 94fcfbb the blob is `e69de29` (the empty file).
- Parent `8defc35` ends with `@import "./pages-inner-r4.css";`.
- Parent `66b31a7` ends with `@import "./link-grids.css"; @import "./tap-targets.css";`.
- The conflict was over the tail, and the resolution dropped the whole file.

The served `index-B7W7JKU2.css` therefore contains **zero** `.v6:not(.home-refinement)` rules (grep count 0; `:not(#_)` appears once). `main.v6` is present in the DOM, but nothing styles it.

Consequences on the preview right now:
- **Homepage `/`**: completely unstyled. h1 is 90.56px at x=0. The intents render as grey browser buttons and the venues as a bulleted `<li>` list with grey boxes.
- **Inner pages** revert to the pre-V6 legacy look:
  - h1 is 60/48/56/36/32/50.4px depending on page, at x=65/112/116/196.
  - Body copy is in Pilot Inter.
  - Up to 23 distinct font sizes per page (/compare), e.g. 10/10.88/11/11.5/12.16/12.48/13/13.12/13.44/13.5/13.76/14.08/14.4/15/15.5/17.28/17.92/18.72/19/20.16/20.48/23.04/29.6/34.56/50.4/52/56/60.
  - Every R3 accent leak is back: amber `.v3-gold-matrix-*`, sky `.tg-deck`/`.decision-path-rail`/`.factbook-*`, indigo `a.v3-open-verifier-btn`, red `.v3-rule-badge`, legacy green rgb(34,200,138) primaries, and blue rgb(49,92,207) primaries on /br. Uppercase kickers are back ("REFERRAL CODE", "NEXT STEP", "BETTER FOR", "RECOMENDADO AGORA").
  - `/factbook` is again raw, unstyled underlined h2s, worse than R3 because each logo now floats detached between items.
  - `/rates` shows giant native radio buttons, and the `.rt-sr` screen-reader text is visible ("Binance 100Binance · 100 USDT/mo").
  - The `/br` cost box prints "R$ 1,00" twice.
  - The `/exchanges/{slug}` registration card is `position: static` and scrolls away (top −1323 at scrollY 1500).

The deploy gate passed this build, which means the gate does not check that styles load.

**Fix (one line of work, do it before anything else):** restore `src/styles/v6/index.css` to the union of both parents, in this order:
1. base
2. system
3. components
4. route-finder
5. compare-lab
6. verify-band
7. directory
8. closing
9. pages-br
10. pages-rates
11. pages-factbook
12. route-rail
13. pages-telegram
14. pages-inner-r4
15. link-grids
16. tap-targets

Then add a gate assertion: the built CSS must contain `.v6:not(.home-refinement)`, and computed `h1` on `/exchanges` must be 44px at 1440.

### How the rest of this review was done
The served build cannot be reviewed for design intent. So I injected the intended stylesheet into each page: those 16 files from 94fcfbb concatenated, appended as a `<style>` after load. I then re-ran the full capture and probe pass ("sim").

Data and interaction results are JS-driven, so they are valid for the served build too. Visual findings below refer to the sim unless marked **[served]**. The cascade position differs slightly from a real build, so re-verify after the rebuild.

## Scores (gate is 8)

| Dimension | Served 94fcfbb | Intended CSS (sim) | Reason (sim) |
|---|---|---|---|
| Typography | 2 | 7.5 | Desktop uses only 12/14/16/20/28/44 on all 12 pages. Mobile uses discrete 12/14/16/18/24/32 (only /factbook/binance still has 18.165px). Geist + Geist Mono only. Points lost: mono prose in the /rates table ("Spot Taker 0.10%", "checked 2026-10-08"), table text overlapping in /rates, h1 at x=200 on /factbook/{slug}. |
| Whitespace / rhythm | 3 | 6 | The dead right column on /exchanges/{slug} is fixed (the card stays sticky). Remaining voids: /methodology regional card (~640px empty left column); /telegram topic rows (link stack at right, ~110px empty under each dek); the /rates calculator left column (~200px between "Copy link" and "What the public fee check can answer"); ~270px dead band before the footer on /exchanges/{slug}. |
| Hierarchy | 3 | 5.5 | /exchanges/{slug} has more than 7 actions above Products: 4 bordered buttons stacked vertically, a 6-link underline row, a checklist and a "Review pre-registration checklist" button. /compare stacks matrix, decision card, 3 accordions, FAQ, then 2 more accordions. /rates shows a verdict that picks Binance on a 4-way tie. |
| Colour | 2.5 | 7.5 | One accent (31,224,192) in default and open states on 10 of 12 pages. White second-primary remains: `/methodology` "Contact Research Desk on Telegram", `/news` and `/activities` active segment (237,238,240). Turquoise is used on the non-signup "Compare total cost" rail link and on "Browse platform profiles". |
| Motion | 2 | 3 | There is still no signature moment on any inner page. `animation-timeline` is used 0 times on inner elements. Only `rt-figure-in` and CSS transitions run. There is no route or Crossroads motif anywhere off the homepage. |
| Micro-interaction | 4 | 6.5 | Segments, search, sort composed with Verified first, row hover (cell bg 33,34,37), copy-code check state, the dock disabling venues that have no page, the /rates perp toggle and the empty-volume prompt all now work. Remaining issues: 1e12 is silently clamped; /rates bars are identical; the disabled-checkbox reason exists only as a `title` tooltip; /news "Results: 416" never changes with the tab. |
| Responsive | 4 | 7 | No horizontal scroll on any page at either width. At 390 the remaining tap failures are: /telegram (`.tg-cmd-btn` 24px ×8, `a.tg-btn--secondary` 17px), /compare (`a.v3-back-link` 24px, 18px checkbox). /factbook/{slug} venue pills are clipped at the right edge with no scroll cue. |
| Originality | 2 | 3.5 | The inner pages are a clean, competent dark data template. There is zero Crossroads vocabulary (no nodes, no route rail, no destination), so "AI味浓" (generic AI feel) and "像 PPT" (slide-deck feel) still apply off the homepage. |

Per page, desktop and mobile combined (served → sim):

| Page | Served | Sim |
|---|---|---|
| /exchanges | 5 | 7 |
| /exchanges/binance | 3 | 6 |
| /exchanges/okx | 3 | 6 |
| /compare/binance-vs-okx | 2.5 | 5.5 |
| /rates | 2 | 5 |
| /factbook | **1** | 6.5 |
| /factbook/binance | 3 | 6 |
| /telegram | 3 | 5.5 |
| /br | 2.5 | 6 |
| /news | 3 | 6.5 |
| /activities | 3 | 6 |
| /methodology | 3 | 4.5 |

Homepage served: 1 (unstyled).

## Round-3 defect status (sim unless noted)

| R3 # | Status | Evidence |
|---|---|---|
| 1 Fee contradictions | **Mostly fixed** | See the data section below. |
| 2 Vertical referral code | **Fixed** | `button.v3-venue-quick-registration__code` is 146x44 at 1440 and 390. The code still appears 5–6 times on the page. |
| 3 /factbook unstyled | **Fixed in sim / regressed in served** | Dense rows (logo · name · dek · domain meta · "Open fact record"). The review date and "fields checked n/N" are still missing, and the same 14-word dek is repeated 24 times. |
| 4 Dead right column | **Fixed in sim / regressed in served** | The card stays at top 89px through scrollY 2500 (served: static, −2323). |
| 5a /news tabs | **Fixed** | Each tab returns a distinct featured set. However "Results: 416" is static, and "Circle CCTP V2 USDC" is filed under Fee Rates. |
| 5b /rates Perp DEX filter | **Fixed** | Returns 5 rows. /rates has no "DEX" segment while /exchanges does. |
| 5c Dock 404s | **Fixed** | HTX, HashKey and Aevo are disabled ("No comparison page yet"). All 8 tested pairs resolve to 200 pages. |
| 5d Sort cancels Verified first | **Fixed** | The verified group stays on top under every sort, and `aria-pressed` stays true. |
| 5e /rates input | **Partly** | 0, empty and negative inputs now prompt "Enter a monthly volume above 0". 999,999,999,999 is still silently clamped to 10,000,000 USDT/mo with no message. |
| 6 Disclosures in the legacy system | **Fixed in sim / regressed in served** | No new accents or uppercase in the open state on any page (sim). |
| 7 Flush footer | **Mostly fixed** | /exchanges/{slug} instead ends with a ~270px dead band. |
| 8 H1 position | **Fixed except /factbook/{slug}** | h1 is at y=128, x=120, 44px on 11 pages; /factbook/binance is at y=88, x=200. At 390 every h1 is 32px at y=124, except /exchanges/{slug} (y=116, with a 16px logo above) and /factbook/{slug} (x=96, y=84). |
| 9 /rates terminal | **Open** | Bars are identical (386px ×4). "Checked: 2026-10-08 +" is still a disclosure row, and at 390 it is set at 20px grey. "Conditions +" overlaps the Futures column and "Official check pending" overlaps the Rebate column. Mono prose remains. 16 rows still read "Pending source review". |
| 10 Accordion soup | **Partly** | The ± icon is consistent now. Action stacks remain (see defect 4). |
| 11 /news, /activities | **Partly** | /news now has the 3-column row. /activities row "+" icons sit at x≈1217 while page-level ones are at x≈1305. |
| 12 Tap targets | **Mostly fixed** | Remaining failures: /telegram and /compare (see the Responsive row). |
| 13 Buttons | **Partly** | 2–6 variants per page (down from 7–13 served). The white primary remains on 3 pages, and /br has a 52px and a 68px primary. |
| 14 /exchanges polish | **Partly** | Products still wrap to 2 lines on every row at 1440 (sim). The Hyperliquid row is taller. The action column is still ragged (Sign up 65px vs Check eligibility 86px). At 390, sort still takes 2 rows. |
| 15 /br | **Open** | The calculator still defaults to "R$ 1,00". The language switcher still truncates to "Português (B…". |
| 16 /methodology | **Open** | Card-in-card with a ~640px void, marketing badges, "All quantitative scores are formulaically derived" (no scores exist), and a white primary. |
| 17 Hygiene | **Partly** | Visible text is Geist-only (sim). `body` font-family is still `"Pilot Inter", Inter, …`. |

## Data consistency (scripted, 14 pages: /, /exchanges, /rates, /exchanges/{binance,okx,bybit,bitget}, /compare/{binance-vs-okx,okx-vs-bybit,bybit-vs-bitget}, /factbook/{binance,okx,bybit}, /br)

Every figure matches `exchange-facts.js` on every surface:
- Binance spot 0.10/0.10, perp null
- OKX 0.08/0.10 and 0.02/0.05
- Bybit 0.10/0.10 and 0.02/0.055
- Bitget 0.10/0.10 and 0.02/0.06

The fake "−10% Perpetual" discount for Binance is gone; only "−25% Spot" shows. The perp toggle on /rates now shows OKX 0.05% with Binance "Not yet checked".

Remaining inconsistencies:
- **Order flips between pages.** /exchanges, /exchanges/{slug}, /factbook and home print **maker / taker** (OKX "0.08 / 0.10"). /compare and the /rates benchmark print **taker / maker** (OKX "0.10% / 0.08%", perps "0.050% / 0.020%"). A reader sees OKX's two spot numbers swap between pages.
- **Decimal places differ.** /compare uses 3 decimals ("0.050%", "0.060%"); everywhere else uses 2–3 ("0.05", "0.06", "0.055").
- **Three different dates sit on one record:**
  - /exchanges/{slug} shows "Fees checked 2026-10-08" next to "Research checked Sep 4, 2026" and "Pending official-source review".
  - /factbook/{slug} shows "NexuAlpha Source Review: 2026-09-08" next to "Fees checked 2026-10-08".
  - The date formats also mix: "Sep 4, 2026" against ISO.
- **Uniswap** shows "Checked 2026-10-08" on /exchanges while both of its fee cells are "Not yet checked". Kraken has the same pattern for spot.
- **/factbook/{binance,okx,bybit}** each render a 10-row VIP table in which all 40 cells read "Pending official-source verification".
- **/rates verdict on a 4-way tie** shows "All 4 checked platforms charge the same base rate", yet highlights **Binance** as the figure and sets the primary to "Open official registration route · Binance". For a neutral comparison site this reads as a thumb on the scale.

## Defects, most severe first

1. **Empty `src/styles/v6/index.css` (merge 94fcfbb).** The whole V6 system is not shipped; home and every inner page are unstyled or legacy (section 0). Fix: restore the 16 imports and add a CSS-presence check plus a computed-h1 assertion to the deploy gate.

2. **Fee order and format flip between pages.**
   - Selectors: `.v3-matrix-*` (/compare), `.fee-terminal__rate*` (/rates benchmark).
   - Fix: render through one formatter, `formatPair(maker, taker)`, labelled "maker / taker", using the same decimals as the facts file (0.10, 0.08, 0.055).

3. **/rates terminal is still incoherent.**
   - In the benchmark table `.fee-terminal` (1440), "Conditions +" and "checked … Source" collide with the Futures column, and "Official check pending" overlaps the Rebate column. Fix: give each cell a fixed grid, and move Conditions into one row-level disclosure.
   - The four `.rt-bar` bars are 386px each. Fix: hide the bars when values tie.
   - "Checked: 2026-10-08 +" is a disclosure inside every card. Fix: make it 12px meta.
   - The tie verdict picks Binance. Fix: show "Tie, 4 venues" with no venue CTA.
   - Mono is used for prose. Fix: mono for numerals only.
   - Fix: collapse the 16 "Pending source review" rows into one "16 venues pending review" row.
   - Inputs over 1e10 are clamped silently. Fix: show an inline "Capped at 10,000,000,000 USDT" note.

4. **/exchanges/{slug} hierarchy and actions.**
   - The 16px logo sits above the h1 at 390 and 1440. The intended size is 48px; `.v3-venue-identity > img` resolves to 16px.
   - "Binance decision check…" is a 16px bold run-on title.
   - A 6-link underline soup sits under it.
   - Three loose outline buttons are stacked ("Open deep comparison", "Review pre-registration checklist", "Open official source +").
   - A ~270px dead band sits before the footer.
   - The referral code appears 5–6 times.
   - Fix: allow one primary (the card) and one secondary per section, merge the links into one "Sources" row list, show the code once in the card, and set the logo to 48px.

5. **Three dates on one record.**
   - Selectors: `.official-research__*` "Research checked Sep 4, 2026" and `.factbook-hero` "NexuAlpha Source Review: 2026-09-08".
   - Fix: show the fee check date from `exchange-facts.js` only. Label any other date by what it covers ("Domain notes reviewed 2026-09-08"), in ISO format.

6. **Uniswap and other venues show "Checked" with no checked field** (`.mx-checked` on /exchanges). Fix: render "Checked" only when at least one fee field is in the checked state. Otherwise show "Fields pending".

7. **/methodology is unchanged since R2.**
   - `.methodology` regional card: the left column ends about 640px before the right list does.
   - The badges "Traceable Sources / Zero Pay-for-Rank / On-Chain Solvency Audit" read as marketing.
   - "Four Core Quantitative Evaluation Pillars" is a heading over one collapsed row.
   - The copy says "All quantitative scores are formulaically derived", but no scores exist.
   - "Contact Research Desk on Telegram" uses the white primary.
   - The "Data Correction" text touches the card's bottom border.
   - Fix: flatten to v6 rows, delete the badges and the false claim, open the pillars inline, and use the outline secondary.

8. **No motion or route concept on inner pages.**
   - 0 view-timeline animations; no signature moment.
   - Fix (minimum): a scroll-linked route rail on `.v6` pages (h1 → data → destination CTA) using `animation-timeline: view()` inside `@supports`.
   - Also: the count-up already used by `rt-figure-in` on /exchanges fee cells when sorting, and a dock "draw route" stroke between the two selected logos.

9. **/factbook/{slug}.**
   - The h1 is at x=200 beside the logo. Every other page has x=120 with the logo above.
   - The venue pill strip `.factbook-venue-pill` is clipped at the right edge with no scroll affordance.
   - 40 identical "Pending" cells in the VIP table. Fix: collapse them to one line, "VIP tiers 1–9 not yet source-reviewed".
   - "Anti-Freeze Security Score / anti-freezing risk coefficient" is invented-metric copy.

10. **/telegram layout and tap targets.**
    - Each `.tg-topic-card` puts 3–4 links in the right column, leaving ~110px of empty space under each dek.
    - At 390, `.tg-cmd-btn` is 24px tall (×8) and `a.tg-btn--secondary` is 17px.
    - The page has 4 Telegram CTAs plus "Hide Telegram features".
    - Fix: put the links inline under the dek, give command buttons a 44px minimum height, and keep one Bot CTA.

11. **/br (R3 #15 still open).**
    - The calculator defaults to "R$ 1,00" (`b.br-cost-figure`). Fix: seed R$ 1.000.
    - The language switcher truncates to "Português (B…".
    - The page uses two primaries (52px and 68px heights).
    - **[served]** The figure is printed twice, and the primaries are blue rgb(49,92,207).

12. **Directory and table polish.**
    - Products wrap onto 2 lines on all 24 rows at 1440 (`.mx-td--prod`).
    - The action column is ragged (Sign up vs Check eligibility). Fix: a fixed 128px column with right-aligned buttons.
    - The Hyperliquid row is taller.
    - At 390, sort still takes 2 rows (`.mx-sort` ×3).
    - The disabled compare checkboxes explain themselves only via `title`. Fix: add a 12px "No comparison page yet" in the dock or under the row on focus.
    - /exchanges offers All/CEX/DEX/Perp DEX while /rates offers All/CEX/Perp DEX. Fix: use one segment set.

13. **White second-primary.** It appears on `/methodology` (Telegram CTA), `/news` and `/activities` (active segment, 237,238,240), and `/factbook` **[served]**. Fix: turquoise primary only; the active segment should be a graphite fill with a hairline.

14. **/compare.**
    - Five stacked disclosures after the decision card.
    - "Continue research" floats with a tiny caption.
    - Two parallel h1 templates exist across pairs: "Should you choose Binance or OKX after…" vs "KuCoin vs MEXC".
    - At 390, `a.v3-back-link` is 24px and the checkbox is 18px.
    - Fix: one template, and one disclosure group with "Sources and decision notes".

15. **/activities.** Row "+" icons sit at x≈1217 while page-level ones are at x≈1305. Turquoise primary is used for "Browse platform profiles", which is not a signup.

16. **Hygiene.**
    - The body stack is still `"Pilot Inter", Inter, …`.
    - /news "Results: 416" does not reflect the active tab.
    - /factbook/binance at 390 has a 18.165px `strong.act-val`, which is off the mobile scale.

## Cross-page matrix (sim, 1440)

| Page | h1 y/x | Lede | Button variants | Tap <44 (390) | Accent leaks default/open |
|---|---|---|---|---|---|
| /exchanges | 128/120 | 20 grey | 5 | 0 | –/– |
| /exchanges/binance, okx | 128/120 (16px logo above) | none | 3/5 | 0 | –/– |
| /compare/binance-vs-okx | 128/120 (back-link above) | none | 6 | 2 | –/– |
| /rates | 128/120 | none (h1 → terminal) | 3 | 0 | –/– |
| /factbook | 128/120 | 20 grey | 2 | 0 | –/– |
| /factbook/binance | **88/200** | 14 meta | 5 | 0 | –/– |
| /telegram | 128/120 | 20 grey | 3 | **9** | –/– |
| /br | 128/120 | 20 grey | 5 | 0 | –/– |
| /news | 128/120 | 20 grey | 4 (white seg) | 0 | –/– |
| /activities | 128/120 | 20 grey | 5 (white seg) | 0 | –/– |
| /methodology | 128/120 | 20 grey | 2 (white primary) | 0 | –/– |

There is no horizontal scroll on any page at 1440 or 390, in either build.

## Verdict
**Fail, and do not ship 94fcfbb.** A bad merge emptied the V6 stylesheet entry, so the preview shows an unstyled homepage and legacy inner pages, and every R3 colour and kicker leak is back.

With the intended CSS restored, round 4 is real progress:
- The data now agrees across all 14 pages.
- The vertical referral code, the /factbook index, the dead right column, the dock 404s, the sort/verified conflict, the news tabs and the perp toggle are all fixed.
- The type scale and h1 position are consistent.

The inner pages still land at about 5.5–7: competent and clean, but not award-calibre. The remaining gaps are hierarchy (action stacks), the /rates terminal, /methodology, maker/taker order flips, and the complete absence of motion and the Crossroads concept off the homepage.

Order: 0 (restore CSS, add a gate check) → 2 → 3 → 5/6 → 4 → 8 → the rest.
