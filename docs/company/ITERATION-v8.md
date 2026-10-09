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
- Direction A "intel desk" (owner choice): announcement-led home, notice ticker site-wide, terminal panels, hairline ruling.
- Home headline no longer shows the unconfirmed "up to 50%"; rebate shares stay per-exchange in the calculator.
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
| 1 | No horizontal overflow, 11 routes × 390/768/1440 | JS scrollWidth sweep | ⏳ |
| 2 | No truncated/overlapping h1, CTA, invite code at 3 widths | screenshots reviewed | ⏳ |
| 3 | Fonts only on the sanctioned scale (12/14/16/18/20/24/28/32/44/72) | JS sweep | ⏳ |
| 4 | Touch targets ≥44px at 390 (documented exceptions only) | JS sweep | ⏳ |
| 5 | No light surfaces; accent only on primary CTA / positive / active | JS sweep + screenshots | ⏳ |
| 6 | Rule 8: every sponsored link has a disclosure in the same viewport (home, directory, profile, compare ×2, rates; 390 + 1440) | scripted check | ⏳ |
| 7 | Invite codes/registration hrefs unchanged vs live (CTA gate pages) | local SSR vs live href diff | ⏳ |
| 8 | Fees and notices show source + date; unverified shown as pending | page check | ⏳ |
| 9 | Search: open from header, query "okx", open result | browser run | ⏳ |
| 10 | Directory: type filter, text filter, empty state, reset | browser run | ⏳ |
| 11 | Directory → compare two venues → compare page + sticky bar | browser run | ⏳ |
| 12 | Rates calculator updates on input; invalid input handled | browser run | ⏳ |
| 13 | Home desk: select notice → comparison updates; sheet opens, Esc closes | browser run | ⏳ |
| 14 | Profile: copy-code works; official link is `rel=sponsored` with live href | browser run | ⏳ |
| 15 | Home calculator chips / maker-taker / input update results | browser run | ⏳ |
| 16 | Notice feed loading + failure states (feed 404) render honestly | browser run | ⏳ |
| 17 | Reduced motion: ticker and animations stop | emulated check | ⏳ |
| 18 | Keyboard: visible focus on desk rows, sheet closes with Esc and returns focus | browser run | ⏳ |
| 19 | `npm test`: no new failures vs the 57 baseline | test log diff | ⏳ |
| 20 | CI-equivalent build passes locally (typecheck, build, budget, dist-shell-contract) | command output | ⏳ |
| 21 | Independent review (separate agent) reports no high-severity issue | review report | ⏳ |
| 22 | Pushed to `v7-home`; merged to `main` | git refs | ⏳ |
| 23 | Deployed via workflow; live buildId + CTA links + key routes verified; rollback name recorded | live checks | ⏳ |

## Log
- R1 (2026-10-09): versions verified; v8 work committed as `57baf4c` on `v7-home`; checklist frozen.

## Next
Run the verification sweeps (items 1-6, 9-18), fix what fails, then build gate (20), review (21), release (22-23).
