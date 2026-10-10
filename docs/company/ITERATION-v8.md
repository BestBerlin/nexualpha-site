# Iteration v8 — unified intel-desk site (milestone record)

Read this first when resuming. Owner goal (2026-10-09): award-level craft (Awwwards/Webby/FWA as reference, never claimed),
trustworthy, useful, real conversion. Budget for this milestone: 20 execution rounds.

## Verified state (2026-10-09)
- Live: `https://nexualpha.com/version.json` → `3.0-20261009T1328-GH-63a82a1` (= `main` 63a82a1, older home design).
- Work branch: `v7-home` = main + 8 commits (fast-forward possible). v8 work is commit `57baf4c` onwards.
- Deploy: GitHub Actions "Deploy to production" (manual, from `main`); gates = typecheck, full build + strict budget,
  `tests/dist-shell-contract.test.mjs`, CTA-link gate vs live (`deploy/stage-remote.py`), public checks, auto-rollback.
- `npm test`: 688 tests, 57 failing before v8 and unchanged since (stale contract/data tests; not a deploy gate). See
  `pilot-01-prototype/docs/release-blockers-v8.md`.

## Design decisions
- One dark system: `pilot-01-prototype/docs/design-unified-v8.md` (tokens, rules, direction A).
- ~~Direction A "intel desk"~~ superseded 2026-10-09 by owner: the site is a fee-compare + rebate product; notices are secondary; the animated 50% hero is the signature.
- Home headline shows "up to 50%" (owner-confirmed marketing) with the per-venue footnote.
- Mobile bottom dock removed (owner request); footer policy text folded, not deleted (no standalone policy page yet).

## Frozen scope
Routes (zh-hans, en; ar where noted): `/`, `/exchanges` (+ar), `/exchanges/okx` (+ar), `/exchanges/binance`,
`/compare/binance-vs-okx`, `/compare/bybit-vs-bitget`, `/rates`, `/news` + one article, `/activities`, `/telegram`.
Widths: 390, 768, 1440.
Core paths: search dialog → result; directory filter + empty state; directory → compare; rates calculator; home notice
desk → fee comparison → sheet; profile copy code + official link; home calculator.

## Acceptance checklist (status: ✅ pass · ❌ fail · ⏳ not yet verified)
| # | Item | Evidence required | Status |
|---|---|---|---|
| 1 | No horizontal overflow, 11 routes × 390/768/1440 | JS scrollWidth sweep | ✅ 13 routes × 390/768/1440: 0 overflow |
| 2 | No truncated/overlapping h1, CTA, invite code at 3 widths | screenshots reviewed | ✅ independent re-review: 9 routes × 390/768/1440, no clipped h1/CTA/code, no overflow; dock-over-footer fixed (body reserve) |
| 3 | Fonts only on the sanctioned scale (12/14/16/18/20/24/28/32/44/72) | JS sweep | ✅ 0 off-scale sizes, 3 widths |
| 4 | Touch targets ≥44px at 390 (documented exceptions only) | JS sweep | ✅ 0 targets <44px at 390 (fixed ticker, sticky disclosures, rates venue link) |
| 5 | No light surfaces; accent only on primary CTA / positive / active | JS sweep + screenshots | ✅ 0 light surfaces; hero keeps one filled CTA |
| 6 | Rule 8: every sponsored link has a disclosure in the same viewport (home, directory, profile, compare ×2, rates; 390 + 1440) | scripted check | ✅ home 5/5, directory 15/15 (zh, ar), profile 1/1, compare 2/2 ×2, rates 11/11; 390/768/1440 |
| 7 | Invite codes/registration hrefs unchanged vs live (CTA gate pages) | local SSR vs live href diff | ✅ local build vs live: 6 gate pages identical (19/15/1/1/1/2 links) |
| 8 | Fees and notices show source + date; unverified shown as pending | page check | ✅ desk as-of time, footnote date, directory/rates/profile checked dates + sources; unverified = 尚未核验 |
| 9 | Search: open from header, query "okx", open result | browser run | ✅ okx → 3 results → Enter opens /exchanges/okx; empty-query hint |
| 10 | Directory: type filter, text filter, empty state, reset | browser run | ✅ DEX 6/24, 'bitg' 1/24, empty state + reset → 24/24 |
| 11 | Directory → compare two venues → compare page + sticky bar | browser run | ✅ two picks → 打开对比 → /compare/bitget-vs-binance, sticky bar + disclosure |
| 12 | Rates calculator updates on input; invalid input handled | browser run | ✅ volume/market/order update; empty or negative → prompt, amounts '–' |
| 13 | Home desk: select notice → comparison updates; sheet opens, Esc closes | browser run | ✅ rows mix Bybit/Bitget, comparison switches spot/perp, sheet Esc/× + focus return |
| 14 | Profile: copy-code works; official link is `rel=sponsored` with live href | browser run | ✅ copy → '已复制 ✓'; official link okx.com/join/nexu888 rel=sponsored |
| 15 | Home calculator chips / maker-taker / input update results | browser run | ✅ chips + maker/taker update; empty input → honest prompt (was '$0') |
| 16 | Notice feed loading + failure states (feed 404) render honestly | browser run | ✅ feed missing → ticker hidden, desk '暂时读不到公告', no skeleton |
| 17 | Reduced motion: ticker and animations stop | emulated check | ✅ rules for every animated element + global safety net (static check; OS setting cannot be emulated here) |
| 18 | Keyboard: visible focus on desk rows, sheet closes with Esc and returns focus | browser run | ✅ Tab reaches desk rows (2px accent ring), Enter selects, sheet focus trap/return |
| 19 | `npm test`: no new failures vs the 57 baseline | test log diff | ✅ 56 failing, all pre-existing (the 'regional JP/KR/TR stylesheet budget' one also fails on live: /jp ships 6 stylesheets there too) |
| 20 | CI-equivalent build passes locally (typecheck, build, budget, dist-shell-contract) | command output | ✅ typecheck, client+SSR+news build, prerender 2271 routes, strict budget, dist-shell-contract 3/3 |
| 21 | Independent review (separate agent) reports no high-severity issue | review report | ✅ re-review (separate agent): H1/H2/H3 fixed, no HIGH issues; mediums logged below |
| 22 | Pushed to `v7-home`; merged to `main` | git refs | ✅ PR #1 merged (main ba66747), PR #2 merged (main 3738f5c) |
| 23 | Deployed via workflow; live buildId + CTA links + key routes verified; rollback name recorded | live checks | ✅ live 3.0-20261009T2034-GH-3738f5c: verify-live-v8 all passed (13 routes 200, 3 invite codes, desk, disclosure, 55 notices); browser-checked /zh-hans 390 and /zh-hans/exchanges 1440 |

## Log
- R1 (2026-10-09): versions verified; v8 work committed as `57baf4c` on `v7-home`; checklist frozen.
- R2: sweeps at 390/768/1440; fixed 44px targets (ticker, sticky disclosures, rates link); calculator empty state; desk loading vs failed; search dialog restyle.
- R3: CI-equivalent build passes; CTA gate identical to live; core paths 9-18 verified in browser.
- R4: notices refreshed locally (Bybit works from this machine: 55 items); desk mixes exchanges; single filled CTA; focus return; tag clamp; reduced-motion safety net; rail labels removed (truncated); inner-page kicker + terminal frames.
- R5 (independent 3-perspective review, separate agent): found 3 HIGH — (1) profile CTA + code above the fold without disclosure at 390 (my rule-8 check only centred each link; replaced by an every-scroll-position check), (2) directory 4-column table colliding at 768, (3) mobile compare dock clearing picks (dock floated 92px up for the removed bottom nav; whole slot was a remove button). Fixed: disclosure line directly under every registration CTA; directory card layout up to 960px; dock on the safe area, only × removes, reserve space; plus RTL ticker, zh kicker, checked picks, rates glyph, news tabs, CJK wrapping, calculator countdown, search focus ring. Rule-8 transient: while a sticky bar slides in (<0.5s) its link can appear before its disclosure; settled states all pass.
- R6: re-review passed (no HIGH). Open mediums/lows: sticky-bar disclosure is a link label (owner sign-off), dock chip truncates long names, /ar ticker label English, zh search shows an English result title, search title wording, news summaries repeat boilerplate, folded rates links still in tab order (to check).
- Known trade-offs: rates calculator default stays spot/taker (locked by restore logic and tests; ties are the true result). Compare/profile sticky bars keep the "合作披露" link label (full sentence is sticky above the cards).

## Releases
| Release | buildId | Notes |
|---|---|---|
| gh-20261009t2026-ba66747 | 3.0-20261009T2026-GH-ba66747 | v8. First run blocked by the CTA gate only because the old home's registration card (code 11350287) is gone; link sets identical and the code is still shown in the calculator row, so re-run with `allow_cta_change`. Live notice feed 404: production mounts managed content over `/content`. |
| gh-20261009t2034-3738f5c | 3.0-20261009T2034-GH-3738f5c | Feed moved to `/intel/official-announcements.json`; CTA gate passed without override. |
| 3.0-20261009T2048-GH-b644e1e | 3.0-20261009T2048-GH-b644e1e | Rebate headline (owner-confirmed 50% marketing) + notice desk. |
| (run 37932992588) | 3.0-20261009T2053-GH-1f2a95a | Owner correction: product, not exchange PR. Animated 50% rebate hero restored (also on phones), notice desk + site ticker removed, notices moved below the calculator. verify-live-v8 passed; browser-checked 390/1440. |
| (run 37938510630) | 3.0-20261009T2140-GH-6f24037 | Phone hero fixed after owner screenshot: chips had collided and run off the edge, particles crossed text. Now headline → 50% → four chips in one row → caption → copy/CTA/disclosure. |
| (run 37943963293) | 3.0-20261009T2224-GH-4b8b96d | Partner wall: all 10 partners with real codes (logos, disclosed shares) under the animated 50%; home copy in all 15 locales (zh-Hant had shown Simplified, 13 locales English). |
| (run 37947377440) | 3.0-20261009T2252-GH-5837ced | Three-step rebate guide replaces the chart; calc rows regridded; CJK display text breaks only after punctuation; footer centred; notices refreshed by the server every 30 min (server/intel-feed.mjs; live feed confirmed). First run 37946604272 stopped by the CTA gate: removing the home research drawer dropped 13 sign-up links (Aevo, HashKey, HTX have no other one) — drawer restored pending owner decision. |

| gh-20261010t1152-52b4720 | 3.0-20261010T1152-GH-52b4720 | Full-site QA batch 1 (PR #16), local deploy: CJK home headline / 40% / calc title no longer break (text-wrap shorthand reset nowrap); news TTFB 0.8-1.15 s -> 0.03-0.06 s on standby (parse cached by feed sha); trailing slash 301; profile rebate line; PoR + pending copy in 15 locales; dYdX spot "not offered". Standby preflight 13/13, CTA links identical, public checks + invites passed. Previous 1107-7949c79 kept for rollback; 1027 stopped. **Current live.** |
Rollback: Actions → "Rollback production" with the newest release name (returns to the previous one), e.g. `gh-20261009t2034-3738f5c` (returns to ba66747), or `gh-20261009t2026-ba66747` (returns to pre-v8 `gh-20261009t1328-63a82a1`).

**Milestone status: 23/23 accepted (2026-10-09).** Acceptance means this stage met its checklist, not that the site cannot improve.

## Next
Next milestone backlog (ranked): (1) schedule the notice fetch (Bybit works from this machine, not from CI cloud IPs — needs a runner/server cron that writes `public/intel/` or a server-side path; no scheduler is configured yet); (2) owner decisions: sticky-bar disclosure as a full sentence, 50% tier, H1 sign-off for other locales, translations of the home copy (13 locales); (3) news list boilerplate summaries, dock chip name truncation, /ar ticker label, zh search result titles; (4) triage the 56 pre-existing failing tests (release-blockers-v8.md).
