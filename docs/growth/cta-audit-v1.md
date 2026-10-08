# CTA / conversion-path audit v1 (r9 CRO)

Branch `v6r9-cro`, audited against live https://nexualpha.com (build of `main` 23cbdf8) on 2026-10-08
at 1440x900 and 390x844 (Playwright, Chromium). Money event = click on an official signup / partner route
(`a[rel~="sponsored"][data-cta-kind="registration"]`). Partner registry, invite codes, registration hrefs and
`rel="sponsored"` were **not** changed: on every audited page the set of sponsored hrefs is identical to live
(see Verification).

## 1. Findings (before)

### Steps to an official signup, by intent

| Visitor intent | Entry | Clicks to official signup | Notes |
|---|---|---|---|
| "I know the venue, give me the link" | `/` hero registration card | 1 | Binance card in the hero; code + Copy + "Official sign-up". Good. |
| "Show me all venues" (desktop) | `/` directory or `/exchanges` | 1 | Every row: code chip with copy, "Sign up" button. Good. |
| "Show me all venues" (phone) | `/` directory | 2 for 8 of 15 partner venues | MEXC, Backpack, Deribit, HTX, HashKey, Hyperliquid, GMX, Aevo sat behind "Show more platforms (12)". The fold also applied only after hydration, so rows were visible in the server HTML and then collapsed (a layout jump). |
| "Which of A or B?" (home Compare Lab) | `/#compare` | 2 (lab -> full compare page -> decision card) | The lab named the lower-fee venue ("OKX is lower on Spot maker") but offered no next step except an internal link. |
| "Which of A or B?" (compare page, phone) | `/compare/binance-vs-okx` | 1, but first signup at y = 3,325 px | Sticky bar only activated after `#compare-versus-card` (inside "Sources and decision notes", y = 5,000+), so it never showed while reading. On phones both buttons read "Register on Official Site" with the venue names hidden. |
| "Which of A or B?" (compare page, desktop) | same | 1 at y = 2,040 | Decision card is fine. Code shown as "Code: 11350287" looks like a chip but is not copyable. |
| "I'm on the Bitget profile" (phone) | `/exchanges/bitget` | 1 at the top; **2 from the sticky bar** | The sticky bar's primary ("Review code and signup conditions") scrolled back to `#registration-path`; the visitor then had to find and press the card button. Bar also stayed over the footer (disclosure, copyright) at page end. |
| "Cheapest fees" | `/rates` | 1 | Cost calculator "Register at X" is clear. Benchmark table rows labelled the sponsored signup link **"Official terms ↗"**: the label promises a terms page and delivers a signup page. Trust problem. |

### What competes with the primary CTA
- Home (1440): 47 sponsored anchors in the DOM, 13 visible; the rest are hidden carriers (campaign radar, cost calculator, rate terminal) kept for link-graph parity. Visible competition is low; no change needed.
- Compare Lab: "Open full comparison" (filled, internal) was the only filled button; the money action did not exist.
- Compare sticky: two filled green buttons (two primaries) once it finally appeared.
- Venue sticky: code button + "Official / fee benefit" perk + outlined review link. No filled primary at all.

### Copy clarity and trust
- Signup labels vary: "Official sign-up ↗", "Sign up", "Register on Official Site ↗", "Register at X ↗", "Official terms ↗", "Open official registration ↗". Mostly fine; "Official terms" is wrong.
- Affiliate disclosure is visible but calm on every money surface (registration card "Transparent affiliate disclosure", compare hero note, venue note, footer). Not scary. Keep.
- Bitget shows referral code **nexu888** everywhere; the partner link stays `partner.bitget.cafe/bg/C6PRAF`. Confirmed on `/`, `/exchanges`, `/exchanges/bitget`, `/compare/bybit-vs-bitget`.

### Copy flow
- Directory chip: copy + "Copied" pop + live region + manual-select fallback. Good.
- Registration card: "Copy Code" -> "Copied ✓". Good.
- Compare decision card: code not copyable (friction).
- No feedback after an outbound click; a visitor returning from the venue tab has no reminder of the code.

### Analytics hooks (existing)
`src/data/cta-analytics.js` (installed in `main.jsx`) posts to `/api/analytics/cta`:
`referral_click` + `outbound_handoff` on clicks of anchors whose href matches a partner registration URL
(platform is derived from the href, placement from `data-cta-placement`), `cta_visible` (IntersectionObserver, 25 %),
`decision_select` / `decision_impression` for `[data-growth-decision]`, `telegram_handoff`, `page_view`.
Suppressed for webdriver, DNT, GPC, bots and `?analytics_test`. Code copies were **not** tracked.
`npm run audit:cta-funnel` checks every registration anchor for a stable placement and a traced href: 0 issues before, 0 after.

## 2. Changes (this branch)

| # | Change | Files |
|---|---|---|
| 1 | Home directory: mobile fold removed. All 15 partner rows (and the rest) render on phones; no hidden signups, no post-hydration collapse. Cost: mobile home grows by about 1,500 px. | `components/v6/DirectoryV6.jsx` |
| 2 | Venue profile mobile sticky: primary is now a filled **"Open official signup ↗"** that opens the *same* protected href as the registration card (same `buildRegistrationDecisionState` gate; falls back to the old review link where the card would not open a partner route). Code button stays on the left with "Copied" feedback. The bar steps away when the footer enters the viewport. | `components/v3/V3Pages.jsx`, `styles/v6/cro.css` |
| 3 | Compare sticky: shown once the hero has scrolled away; hidden while the decision card (same two routes) or the footer is on screen. On phones it is a **bottom** bar. Neutral by design: two equal outlined buttons that name the venue ("Bybit signup ↗" / "Bitget signup ↗"), no filled winner. | `components/v3/V3Pages.jsx`, `styles/v6/cro.css` |
| 4 | Compare decision card: code is a copy chip (`CodeChip`) with "Copied" pop + polite live region + manual fallback text. | `components/v3/CompareFinalChoiceCard.jsx`, `components/v6/CodeChip.jsx` |
| 5 | Compare Lab next step: names a venue **only** when both venues have verified spot maker and taker rates and one is lower-or-equal on both and strictly lower on at least one ("Lower checked spot fee: OKX" + "Open OKX official signup ↗" + code chip). Otherwise neutral text and "Choose in the directory ↓". When the signup step shows, "Open full comparison" drops to an outline (one filled action). Fee numbers are untouched; the rule reads the same verified `EXCHANGE_FACTS` the ledger shows. | `components/v6/CompareLab.jsx` |
| 6 | `/rates` benchmark rows: "Official terms ↗" on sponsored signup links renamed to "Official signup ↗" (15 locales). | `components/v3/FeeBenchmarkTerminal.jsx` |
| 7 | Outbound-click feedback: after a click on a registration link that opens a new tab, a small toast says "<Venue> official signup opened in a new tab. Check the code <code> is filled in before you submit." with Copy code + close. It never prevents navigation; it counts down only while the page is visible, so it is still there when the visitor comes back. | `data/outbound-feedback.js`, `main.jsx` |
| 8 | Stable attributes: every primary registration anchor carries `data-cta-kind`, `data-cta-platform`, `data-cta-placement`; primary ones also `data-cta-code` (the public code the link already carries; used by the toast). New placements: `compare-lab-next-signup`, `compare-lab-next-code`, `compare-lab-next-directory`, `compare-final-choice-code`, `venue-mobile-sticky-code`, `outbound-toast`. `venue-mobile-sticky` keeps its name but is now `data-cta-kind="registration"` where the route opens directly. | several |
| 9 | Code-copy tracking without a collector change: a copy sends `decision_select` with `decision = copy_code_<slug>` and `placement = <chip placement>`. No code value is sent. | `data/cta-ui-copy.js` |

Copy for the new strings lives in `data/cta-ui-copy.js` (15 locales). App-shell JS: 372,538 B (budget 400,000; r8 was 369,238).

## 3. What to measure

Collector events already exist; read them per page and placement.

- **Signup CTR per page** = `referral_click` / `page_view`, split by device. Baseline the week before deploy.
- **Placement share** of `referral_click`: `directory-card` (mobile rows 9-15 especially: mexc, backpack, deribit, htx, hashkey, hyperliquid, gmx, aevo), `venue-mobile-sticky`, `compare-sticky-registration`, `compare-lab-next-signup`, `rate-benchmark-row`.
- **Visible-to-click** per placement = `referral_click` / `cta_visible` (same placement). The sticky bars and the lab step should be judged on this, not raw clicks.
- **Code copy rate** = `decision_select` where `decision` starts with `copy_code_` / `cta_visible` for that venue; and copy-then-click within a session.
- **Compare Lab**: share of lab sessions that reach `compare-lab-next-signup` vs `compare-lab-cta` (full comparison) vs `compare-lab-next-directory`.
- Guardrails: `/rates` and venue-profile bounce, compare-page scroll depth, mobile home scroll depth (the unfolded directory is longer), and any rise in "Show more" style complaints in feedback. An outgoing click is not a registration: report clicks, not "signups".

## 4. A/B suggestions (in priority order)

Use the existing `?experiment=&variant=` plumbing (`experiment-registry.js`); register before running.

1. **Mobile directory density**: control = all rows (this branch) vs variant = partner rows first-class, non-partner rows folded *with a visible count* ("+9 platforms without a partner route"). Primary metric: directory `referral_click` per mobile home view. Watch for editorial-trust cost; the control is the safer default.
2. **Compare sticky weight**: neutral outlined pair (this branch) vs filled pair. Metric: `compare-sticky-registration` visible-to-click. Keep the lab's "data-backed only" rule in both.
3. **Venue sticky label**: "Open official signup" vs "Open Bitget signup" (venue name in the label). Metric: `venue-mobile-sticky` visible-to-click.
4. **Outbound toast**: on vs off (variant suppresses the toast). Metric: returning-session second click (another venue or same venue) and code copies from `outbound-toast`.
5. **Compare Lab step copy**: "Lower checked spot fee: X" vs showing the figures inline ("0.08% vs 0.10% maker"). Metric: `compare-lab-next-signup` CTR.

## 5. Verification (branch preview, build 3.0-20261009T0219-GH-5c1ba2a)

- Sponsored hrefs: for `/`, `/exchanges`, `/exchanges/{binance,okx,bitget,bybit}`, `/compare/binance-vs-okx`, `/compare/bybit-vs-bitget`, `/rates`, `/de`, `/ar`, `/ja` at 1440 and 390 the **set** of `a[rel~="sponsored"]` hrefs is identical to live (counts grow by one where a new placement reuses an existing href: home lab step, venue sticky). No registration anchor lacks platform/placement.
- Codes shown: binance 11350287, bybit 48553, bitget nexu888, okx nexu888, kraken 7f97gkqw, gate-io nexubest, kucoin NEXU_KUCOIN, mexc 4BRhe, backpack luckybitcoin, deribit NEXU_DERIBIT, htx nexu888, hyperliquid NEXU888 (unchanged).
- Scripted paths (390): all 15 directory signup rows visible, no "Show more"; MEXC chip copies `4BRhe` with "Copied"; MEXC signup opens a new tab and the toast appears above the bottom nav with a working Copy code. Lab: Binance/OKX -> OKX step with `okx.com/join/nexu888`; Bybit/Bitget and Binance/Coinbase -> neutral. Venue sticky (bitget, binance, okx, bybit): hidden at top, active mid-page with href identical to the registration card, hidden at the footer. Compare sticky: hidden at top, active mid-page at the bottom edge on phones, hidden at the decision card and the footer; decision-card chips copy.
- `linkcheck.py` (live vs preview, 10 paths x 2 widths): title, description, canonical, h1 and JSON-LD identical everywhere; no horizontal scroll. The only href-list differences are the intended ones: home (+`/de`, `/ar`, `/ja`) gains one existing OKX partner href (Compare Lab step); venue profiles swap the sticky bar's internal `/exchanges/<slug>#registration-path` for the card's own partner href. `/exchanges`, `/compare/binance-vs-okx`, `/rates`: identical.
- `typeaudit.py` (`/`, `/exchanges/bitget`, `/compare/binance-vs-okx`, `/rates`): Geist only, no voids, no overflow.
- `npm run audit:cta-funnel`: 0 issues. CI build incl. strict budget: pass (app shell 372,538 B).

## 6. Known limits
- The Compare Lab names a venue on a base-rate difference only (e.g. OKX 0.08% vs Binance 0.10% maker, takers equal). It says exactly that and nothing more, but it is still a nudge next to "Side by side, not a ranking"; if editorial prefers zero nudges, set the step to always-neutral (one line in `CompareLab.jsx`).
- Unfolding the mobile directory lengthens the phone home page; test 1 above exists to check that this does not cost more than it earns.
- The toast relies on `data-cta-code`; registration links without it (hidden carriers, legacy surfaces) still get the toast, just without a code line.
- Source-contract tests in `tests/` were not run here (CI runs build only); the relevant ones were read and the venue-sticky gate expression was kept in the form `tests/r137-profile-sticky.test.mjs` asserts.
