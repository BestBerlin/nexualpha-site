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

| gh-20261010t1152-52b4720 | 3.0-20261010T1152-GH-52b4720 | Full-site QA batch 1 (PR #16), local deploy: CJK home headline / 40% / calc title no longer break (text-wrap shorthand reset nowrap); news TTFB 0.8-1.15 s -> 0.03-0.06 s on standby (parse cached by feed sha); trailing slash 301; profile rebate line; PoR + pending copy in 15 locales; dYdX spot "not offered". Standby preflight 13/13, CTA links identical, public checks + invites passed. Previous 1107-7949c79 kept for rollback; 1027 stopped. |
| (local) | 3.0-20261010T1311 … T1411 | Settle badge as two chips; search-engine verification files served 200; `scripts/search-engines.mjs` (verify / submit / status); Telegram pill in header + home Telegram block; live announcement stream. |
| (local) | 3.0-20261010T1448-GH-d22491b | Announcements from six exchanges (OKX, Binance, KuCoin, Kraken, Bitget, Bybit) with sign-up routes; placeholder `NEXU_*` codes gated out (3 links removed, `ALLOW_CTA_CHANGE=1`); funding-rate board. |
| (local) | 3.0-20261010T1455-GH-2e45bc2 | Owner: no floating offer / no home row buttons. News sign-up card under the article, in the side rail, and timed at 15 s (phones only). |
| (local) | 3.0-20261010T1527-GH-1d9a928 / T1536-GH-3664fce | Layout pass across all 15 locales at 966-1440 / 768 / 390 (600-page sweep 317 -> 148, rest intentional scroll rows / button wraps). |
| (local) | 3.0-20261010T1552-GH-b7a27a8 | `/intel/partners.json` for the Telegram Mini App and channel feed. |
| (local) | 3.0-20261010T1651-GH-f65d304 / T1653-GH-254a2c3 | Activities: live exchange campaigns (event notices, 30 days) with invite routes; English channel @NexuAlphaGlobal on the home page. Sitemaps submitted (Yandex fetch failed once, retried). |
Rollback: Actions → "Rollback production" with the newest release name (returns to the previous one), e.g. `gh-20261009t2034-3738f5c` (returns to ba66747), or `gh-20261009t2026-ba66747` (returns to pre-v8 `gh-20261009t1328-63a82a1`).

**Milestone status: 23/23 accepted (2026-10-09).** Acceptance means this stage met its checklist, not that the site cannot improve.

## Next
Next milestone backlog (ranked): (1) schedule the notice fetch (Bybit works from this machine, not from CI cloud IPs — needs a runner/server cron that writes `public/intel/` or a server-side path; no scheduler is configured yet); (2) owner decisions: sticky-bar disclosure as a full sentence, 50% tier, H1 sign-off for other locales, translations of the home copy (13 locales); (3) news list boilerplate summaries, dock chip name truncation, /ar ticker label, zh search result titles; (4) triage the 56 pre-existing failing tests (release-blockers-v8.md).

| (local) | 3.0-20261010T1832-GH-4a8fc4b | Search: 13 more locales indexable for translated pages, referral-code titles (15 locales), frozen news roster lifted. First try 1822 aborted (standby could not load the CTA module graph -> standalone generated partner data); 1829 rolled back by a false public check (grep -q + pipefail). |
| (local) | 3.0-20261010T1840-GH-476175e | Live /news-sitemap.xml from the mounted feed. |
| (local) | 3.0-20261010T1849-GH-3ca22e9 | Audit fixes: CTA proxy -> running R58 collector on nexualpha-internal (clicks failed since 2026-10-06), error monitor ready, 21-day hashed asset retention, /api/news/article/<slug> (8 KB instead of a 4.4 MB feed), full analysis open, Hyperliquid title keeps "fees/funded account", empty sitemap not submitted. **Current live.** |

## 2026-10-10 search incident (audit: AEO Crypto Factory/reports/nexualpha-incident-audit-20261010)
Root causes: frozen 312-slug roster made 297/609 articles noindex; 13 of 15 locales noindex on translated pages;
news sitemap built before the feed existed (always empty); CTA proxy pointed at an exited collector; no error monitor;
template filler (569 articles repeat a sentence 3+ times, 210 identical zh summaries); all categories "research".
Fixed: site (PR #31-#34), deploy/stage-remote.py, Codex publisher (`AEO Crypto Factory/scripts/nexualpha-content-publish.mjs`:
legacy roster + quality gate, feed normalization; backups `*.bak-20261010*`), `Crypto聚合` checkout roster/caps (backup
`.backup-20261010-search-gate`). New Codex prompt: `Crypto聚合/CODEX-NEXUALPHA-CONTENT-PROMPT-20261010.md` (12/day, demand-led).
Rehearsal on live data: indexable articles 312 -> 583, sitemap 861 -> 1403 URLs, news sitemap 122 URLs.

## 2026-10-10 Telegram stack (not part of the site deploy)
Accepted 7/7 + 4/4:
- Stack moved from CT121 (home) to the BaoTa server in Docker (compose project `nexualpha-tg`, file
  `/srv/agent/stacks/crypto-telegram-ops/baota/apps-compose.yml`, profile `cutover`; DB project `crypto-telegram-ops`).
  Checks: bot replies (owner-confirmed), poller coverage full, DB 20 tables restored, timers -> `scheduler.sh` all exit 0,
  encrypted daily backup verified (11:55 CST), restart policies, CT121 units disabled (rollback only, never run both).
- Bot: `/signup` (+ /注册 /开户 /邀请码, private free-text intent) card with every partner invite code and link from
  `/intel/partners.json`, hub button, command menu read back. No rebate lookup (owner: not possible).
- Mini App: 5th tab "活动" (same rule as the site module), 15 locales, 390 checked, no overflow.
- app.nexualpha.com off the Cloudflare tunnel: A 103.250.172.210 DNS-only + BaoTa nginx + Let's Encrypt (acme.sh,
  auto-renew). From the owner's network 2-40 s -> ~0.3 s per request, first screen ~1.8 s. Rollback:
  `Telegram/switch-app-domain.sh --rollback`. Runbook: `Telegram/BAOTA-MIGRATION-CUTOVER.md`.

## Resume here
Next (owner-approved order): news pipeline (also fills the empty news-sitemap), Brazil/global pages, AEO answers,
backlinks. Open owner decisions: the Mini App's old demo prediction game; KuCoin / Deribit / GMX invite codes;
bot menu button still reads back `commands`.

## 2026-10-10 late: locale sitemap, partner FAQ, full-site diagnosis
- Live 3.0-20261010T2241-GH-df9a0b7 (PR #46 partner venue FAQ in 15 locales, PR #47 /locale-sitemap.xml).
- /locale-sitemap.xml: 418 indexable self-canonical URLs across 15 locales with xhtml alternates; submitted to Google (pending), Bing (418 read), Yandex.
- Deploy CTA guard flagged one added link on /exchanges/okx (OKX official referral-program help page, not a registration link); allowed with ALLOW_CTA_CHANGE=1.
- Tests: 774 run, 56 fail, all on the baseline list.
- Diagnosis published (claude.ai artifact 8NRd7qhzDkfiVzYFUbSkHS). Main findings: GSC 28d 1,770 impr / 4 clicks / pos 20.4;
  commercial pages 0 clicks; exchange H1s miss search terms; long meta descriptions (ru 293 chars); /br and /sg duplicate /pt-br and /en;
  llms.txt 620 KB; Telegram page doesn't describe alerts; no unified /go attribution; bot only zh/en; no news imagery;
  14 locales have shell pages only. Proposed: /liquidations and /funding-rates data pages, localized news lane (4/day), bot locales.

## 2026-10-11: roadmap batch 1 (seven parallel agents, lead-merged)
Live 3.0-20261010T2337-GH-464ed9e (+ main 9a760a4 pending deploy). Merged PRs #48 attribution, #49 OG cards, #50 visual
conversion, #51 news locales, #52 data pages, #53 compare pairs. Each merged with package.json test-list union; full
`npm test` after #52: 820 tests / 56 fail, all baseline; after #53: 57 fail where the one extra name
(`prerender manifest covers each route's original content languages`) passes on a fresh dist (stale local dist).
- Site: `/liquidations`, `/funding-rates` ×15 locales (Dataset/FAQ/Breadcrumb JSON-LD, hreflang, in locale sitemap: 448
  URLs); 4 new comparison pairs ×15; `/telegram` rewritten as alerts product page; alerts strip on home / venue / news
  list; compare mobile first screen = verdict + two official sign-up buttons; section eyebrows; activities grouped
  (390 height 9323 → 7368); `/og/<kind>/<id>.png` cards (news / venue / compare / liquidations) wired into og:image;
  `/api/cta-click` beacon; news feed schema accepts all 15 locales, `/<locale>/news/<slug>` indexable when a native
  body exists; alerts deep links `?start=alerts-<lang>`.
- Ops: market-collector writes `funding` (20 symbols); alert-sender adds backlinks (`?src=tg-alert` etc.), 13:05 UTC
  owner funnel DM (needs `OWNER_CHAT_ID`), non-zh subscribers get English; bot release `2026-10-11-alerts-i18n-01`
  (alerts card in 8 languages); BotFather: Mini App enabled on @NexuAlphaAssistantBot (https://app.nexualpha.com/).
- Content: llms.txt 620 KB → ~82 KB (newest 80 articles; bulk sections stay in llms-full.txt); scheduled task now
  writes 1 localized edition per run (tr→vi→ru→es→pt-BR→id); publisher copies synced into the Crypto聚合 checkout.
- Deploy script: ships `node_modules/@resvg` (gnu+musl via npm pack); mounts og-fonts, og-cache, market feed.
- Owner decision: no posting in stranger Telegram groups (spam farms / captcha gates) — channel cross-promo, Main Mini
  App, per-language channels instead.
- Open: OWNER_CHAT_ID for the funnel DM; HTX localized profiles need the venue reactivated; Naver / Cốc Cốc webmaster
  accounts; per-language channels; seo-onpage PR (titles, H1, description clamp, /br /sg 301, tr percent, news→venue links).
- 2026-10-11 later: PR #54 seo-onpage merged (intent H1 on exchange pages, home title/description ×15, 160/80-char
  description clamp, Turkish %60, news→venue autolinks + related line). Lead rewrote 44 mechanically trimmed
  descriptions by hand and moved the prerender contract to the official binance.com route. `/br` and `/sg` were NOT
  redirected: `/br` is a 7-page Portuguese hub with its own tests and `/sg` a unique checklist — consolidation with
  `/pt-br` needs an owner decision (GSC: /br pos 71, duplicates /pt-br intent).
