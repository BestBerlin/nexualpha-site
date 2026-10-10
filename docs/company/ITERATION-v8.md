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
| (run 37950795136) | 3.0-20261009T2319-GH-0f3c920 | Redesign phase 1 (owner-approved after local preview): headline left, rebate ledger card right (estimate from published fees, rolling figures, copy capsule, disclosure in card), animated 50% inside the ledger, partner strip below; 15 locales. CTA gate identical (19/15/2/2/2/2). Next: phase 2 (volume slider + rolling numbers), phase 3 (micro-interactions), phase 4 (mobile craft; bottom dock needs owner sign-off). |
| (run 37963859359) | 3.0-20261010T0106-GH-070b520 | Pain-first headline + OKX/Bitget/Binance sign-up desk (HOME_PUSH, HOME_AUTO_SETTLE = okx/bitget/binance per owner), logo-blue accent, in-button partner-link disclosure; calculator sticky controls + related-research rows (whitespace fixes); perpetual fees by default; fee facts re-verified 2026-10-10 (docs/data/exchange-facts-20261010.json: Binance perps 0.02/0.05 added, dYdX added). CTA gate identical. **Current live.** Pending: MEXC/HTX/Kraken/KuCoin/Coinbase/Deribit/Backpack fee verification (agent running); GMX/AMM fee ranges need a range display; Drift unpublished (docs now redirect to 'Velocity'). |

Rollback: Actions → "Rollback production" with the newest release name (returns to the previous one), e.g. `gh-20261009t2034-3738f5c` (returns to ba66747), or `gh-20261009t2026-ba66747` (returns to pre-v8 `gh-20261009t1328-63a82a1`).

**Milestone status: 23/23 accepted (2026-10-09).** Acceptance means this stage met its checklist, not that the site cannot improve.

## Next
Next milestone backlog (ranked): (1) schedule the notice fetch (Bybit works from this machine, not from CI cloud IPs — needs a runner/server cron that writes `public/intel/` or a server-side path; no scheduler is configured yet); (2) owner decisions: sticky-bar disclosure as a full sentence, 50% tier, H1 sign-off for other locales, translations of the home copy (13 locales); (3) news list boilerplate summaries, dock chip name truncation, /ar ticker label, zh search result titles; (4) triage the 56 pre-existing failing tests (release-blockers-v8.md).

## 2026-10-10 — conversion + craft round (owner briefs) — status for the next session
Main (`11d1eb3`) is ahead of live (`3.0-20261010T0106-GH-070b520`) and NOT deployed yet.
- **Blocker:** GitHub Actions artifact storage quota was full (386 release packages, ~13.5 GB). 380 old artifacts deleted
  with owner approval; retention now 3 days (PR #12). GitHub recalculates usage every 6–12 h, so uploads still failed at
  ~10:15 CST. **Resume:** `gh run rerun <latest build run> --failed`; when the upload passes, run "Deploy to production"
  from main, then `node scripts/verify-live-v8.mjs https://nexualpha.com` and a 390/1440 browser check.
- Waiting to ship (PR #11, #13): left hero CTA pair; brand-tinted OKX/Bitget/Binance desk + brand-coloured sign-up button
  with in-button disclosure; phone bottom dock (owner asked 2026-10-10); logo tinted titanium/teal; obsidian-glass desk,
  ambient light; three steps as a flow; log-scale volume slider with rolling amounts; Kraken/KuCoin perp/Deribit fees.
- Verified locally: 15 locales at 390x844 show the sign-up button on the first screen; rule 8 ok (zh/en/es); sweeps clean
  (zh/en/ja/ar/de); npm test 56 failures = baseline; tsc clean.
- Fee facts: docs/data/exchange-facts-20261010.json (embedded in src/data/exchange-facts.js; apply script kept in session
  scratchpad — re-create from the JSON shape if needed). Not verifiable from official sources yet: HTX, Coinbase, Backpack,
  KuCoin spot; MEXC unpublished (official sources disagree, varies by pair); Drift unpublished (docs redirect to "Velocity");
  GMX and AMMs need a range display (no maker/taker).
- Copy rules kept: no "locked"/"exclusive"/"automatic for all"; auto-settle badge only for HOME_AUTO_SETTLE (okx, bitget, binance).
- Next: deploy when quota clears; fee-range display for GMX/AMMs; inner pages (exchange detail first) in the new visual
  language; CTA click events for copy/tab/dock; SERP titles/descriptions for the low CTR.

## 2026-10-10 releases (deployed from this Mac with the owner's SSH permission rules; GitHub artifact quota still full)
| Release | buildId | Notes |
|---|---|---|
| gh-20261010t1027-11d1eb3 | 3.0-20261010T1027-GH-11d1eb3 | Conversion + craft pass, slider, more fees. Server then ran out of memory (24 old web containers); owner stopped 22 of them. |
| gh-20261010t1107-7949c79 | 3.0-20261010T1107-GH-7949c79 | Owner shares: OKX up to 40%, Binance up to 25%, Bitget up to 60% (headline now 60%); OKX/Binance paid hourly, Bitget daily; original logo colours restored. CTA gate identical; 13 routes 200. **Current live.** Rollback target: 11d1eb3 (running). |
Local deploy = the same steps as deploy.yml (build gates → scp + sha256 → stage-remote.py → cutover-remote.py → public checks → rollback-remote.py on failure), run with `ssh -i ~/.ssh/nexualpha_gh_deploy -p 56724 root@103.250.172.210` (allowed in ~/.claude/settings.json). After each release keep only live + previous web container running.
