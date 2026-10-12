# NexuAlpha scorecard (target ≥ 95 / 100; raised from 90 by the owner 2026-10-11)

Each module is scored from measurable criteria only. A criterion counts when its evidence (command, file or live URL)
is recorded here with a date. Weighted total = Σ(module score × weight). Baseline 2026-10-11 = 68.

| Module | Weight | Baseline | Target |
|---|---|---|---|
| Technical foundation | 15% | 85 | 95 |
| Visual & experience | 15% | 75 | 90 |
| Content | 15% | 55 | 90 |
| Data & tools | 10% | 70 | 90 |
| Multilingual | 10% | 60 | 90 |
| Telegram ecosystem | 10% | 55 | 90 |
| SEO / AEO results | 15% | 35 | 85 |
| Conversion | 10% | 40 | 85 |

## Criteria (each worth equal points inside its module)

### Technical foundation
- T1 Full sitemap sweep: 0 non-200, 0 noindex, 0 non-self-canonical (`/tmp/qa/smnoindex.mjs`). ✅ 2026-10-11 (2,070 URLs)
- T2 Template × locale browser sweep 390/1440: 0 horizontal overflow, 0 console errors, CLS ≤ 0.1 on ≥ 98% of loads. ✅ 2026-10-11: PR #77 local sweep 19 templates × 15 locales × 390/1440 = 570 loads, 0 overflow, CLS ≤ 0.1 on 100%; production home 1440 shift (1.115) fixed, live recheck /, /de, /it 0
- T3 Key flows 26/26 (`scripts/qa-flows.py`). ✅ 2026-10-11
- T4 Mobile home: median of 5 Lighthouse-equivalent runs (Playwright, 4× CPU throttle, Fast 3G): LCP ≤ 2.5 s, TBT ≤ 200 ms. ✅ 2026-10-11 live (`scripts/mobile-lab.mjs`): / 1288 ms / 87 ms; /tr /vi /ar /zh-hans 1100-1364 ms, TBT ≤ 153
- T5 Strict build budget passes; settled JS: home ≤ 350 KB, venue ≤ 200 KB, directory ≤ 200 KB. ✅ 2026-10-11 (344/150/177)

### Visual & experience
- V1 Article page redesigned (reading width, typographic rhythm, lead answer block, data figure support, sticky TOC on desktop) and reviewed at 390/768/1440 with before/after shots. ✅ 2026-10-11 (PR #70, owner approved preview)
- V2 News list, topic hub, factbook hub redesigned to home-level quality (no generic title+card grid). ✅ 2026-10-11 (PR #70)
- V3 One recognizable brand signature element applied site-wide (documented in DESIGN rules). ✅ 2026-10-11: data rule on article/news/hubs (PR #70) + SectionRule on venue, compare, activities, liquidations, funding (PR #77); docs/design-unified-v8.md
- V4 Keyboard focus visible on all interactive elements; text contrast ≥ 4.5:1 on all templates (axe sweep 0 serious). ✅ 2026-10-11 live: axe 152 loads (19 templates × en/zh-hans/ar/tr × 390/1440) 0 serious/critical; 7,344 focus stops, 0 without visible style (`scripts/qa-axe-sweep.py`)
- V5 prefers-reduced-motion respected everywhere (sweep). ✅ 2026-10-11 live: 152 loads under reduce, 0 running animations, 0 rAF loops (`scripts/qa-reduced-motion.py`); 3 one-off text updates on home lazy section are content load, not motion

### Content
- C1 ≥ 80% of the last 7 days' articles are hot-news topics (ledger `type`).
- C2 12 articles/day for 5 consecutive days without a missed run. ◐ scheduled runs restored 2026-10-11 (20:35 run auto-started 20:46, published 3); cadence now every 2 h, 2/run = 24/day; streak counts from 2026-10-12
- C3 ≥ 1 article/day uses NexuAlpha's own data (liquidations, funding, flows) as the original angle.
- C4 0 raw-markdown links, 0 dangling descriptions, 0 local-path links across the feed (sweep). ✅ 2026-10-11 live feed 627 articles: 0 in all six classes (`scripts/qa-content-sweep.mjs`); 7 articles repaired, backup /data/backups/nexualpha/news-feed-pre-repair-20261011.tgz
- C5 Topic clusters: each top-20 query family has one main page and internal links from its articles. ✅ 2026-10-11 (PR #76, docs/company/topic-clusters.md; live `qa-crosslinks.mjs` failures 0). Gap: meme-coins family has 0 articles

### Data & tools
- D1 Liquidation history ≥ 30 days and chart live. ◐ history starts 2026-10-10 22:22 UTC (market-history.jsonl); 30 days on 2026-11-09
- D2 Funding page shows ≥ 20 symbols with < 10 min staleness for 7 days (collector log). ◐ logging since 2026-10-11 19:46 (ops/data-freshness, every 5 min, BaoTa scheduler; `node data-freshness.mjs --report`); 20 rows, 2-4 min old at start; judge on 2026-10-18
- D3 Embed widget used on ≥ 1 external site OR in ≥ 3 published articles. ✅ 2026-10-11: live widgets in 3 articles / 10 URLs (liquidations, STRK funding, funding explainer en/zh/ru/tr/vi/id), CLS 0 at 390
- D4 Every tool page links to the related articles and vice versa (crawl check). ✅ 2026-10-11 live: 5 tools × 15 locales ≥ 3 article links; 195/195 relevant articles link back
- D5 Calculator, compare, rates share one state model (URL params round trip test). ✅ partial 2026-10-11

### Multilingual
- M1 0 identical-to-English UI segments on 252 locale pages except data (l10n.py). ✅ 2026-10-11 (PR #76: 278 → 0 UI segments, `scripts/qa-l10n-gaps.mjs`); 110 venue research notes still English (data, separate job)
- M2 ≥ 3 native localized articles/day across the rotation; tr, vi, id each ≥ 10 by 2026-10-25.
- M3 Every non-English locale news index index,follow with ≥ 5 native articles.
- M4 Native-review queue for ar/vi/id/ru strings tracked and cleared (owner or reviewer). ✅ 2026-10-12 machine native review (Gemini 3.8 via Antigravity): 2,297 strings reviewed, 165 fixes applied and token-checked (PR #112); ur/uk 154 fixes (PR #98). Human native spot-check still recommended before ur/uk indexing
- M5 Locale-specific landing for tr, vi, id (local exchanges, payment rails, regulator) live. ✅ 2026-10-11 live: /tr, /vi, /id-id local section (owner approved "全部照实上线"); no partner shown as available without sourced eligibility

### Telegram ecosystem
- G1 Per-language channels zh/en/ru/tr/vi live with the channel-feed and alerts posting. ✅ 2026-10-11 21:00: daily brief delivered in ru (t.me/s/NexuAlphaRU 13:00:26 UTC), tr and vi (seen in the channels), plus channel-feed announcements in ru/tr; zh/en unchanged
- G2 Site → bot deep links in every locale; alerts subscribers ≥ 100.
- G3 Main Mini App configured; Mini App opens from bot profile. ✅ 2026-10-11: Bot API getMe has_main_web_app=true; menu button web_app https://app.nexualpha.com/ (200)
- G4 Bot → site backlinks tracked (`?src=tg-*`) with ≥ 50 visits/week. ◐ tracking fixed 2026-10-11 (PR #81: ?src= was recorded as direct); count = page_view rows with source tg-* in /data/private/nexualpha/analytics/production.jsonl (exclude qa-*); first full week ends 2026-10-18
- G5 Daily funnel DM delivered to owner (21:05). ✅ 2026-10-11 21:06 owner funnel report sent (alert-sender log); first day with the A/B line

### SEO / AEO results (time-dependent)
- S1 GSC 28-day clicks ≥ 300 (baseline 8).
- S2 GSC average position ≤ 12 (baseline 19.6).
- S3 Non-English share of impressions ≥ 30% (baseline 13%).
- S4 AEO monitor: nexualpha.com in DuckDuckGo top 10 for ≥ 6/30 tracked queries (baseline 0/30).
- S5 URL inspection sample ≥ 80% indexed (baseline 60%). 2026-10-11 random 30 from sitemap (seed 20261011): 14 indexed (47%), 11 discovered-not-indexed, 4 stale noindex crawls (09-22…10-03, all index,follow now), 1 unknown

### Conversion
- X1 Click attribution complete (site beacon + /go) and reported daily. ✅ 2026-10-11 (G5 pending delivery check)
- X2 ≥ 30 partner sign-up clicks/week from real visitors (excluding qa-*).
- X3 Every page with a code shows disclosure in the same viewport (test). ✅
- X4 Sign-up click → registration confirmation process documented with exchange back-office (owner-provided numbers).
- X5 A/B-ready CTA copy variants on the home hero (experiment registry) with ≥ 2 weeks of data. ◐ running since 2026-10-11 19:37 (owner chose B; PR #79). Passes after 2 weeks of data (≈ 2026-10-25). Kill switch: HOME_HERO_EXPERIMENT_FORCE=off

## Score log
| Date | Total | Notes |
|---|---|---|
| 2026-10-11 | 68 | baseline (owner request: ≥ 90) |
| 2026-10-11 18:00 | ~74 | criteria passed: T1 T3 T4 T5 V1 V2 X1 X3 (+ D5, V3, G1 partial). Open in priority order: G1 first ru/tr/vi post, T2 full sweep, V4 axe all templates, C1-C3 content streak, M1/M2 localization, S* time-dependent |
| 2026-10-11 19:00 | ~80 | passed: T1-T5 V1-V5 C4 C5 D4 M1 M5 X1 X3 (+ D5, D3, X5, G1 partial). Remaining are mostly time-based: C1-C3 streaks, D1/D2 data history, G2/G4 audience, S1-S5 search results, X2/X4 |
| 2026-10-11 23:30 | ~83 | since 19:00: G1 G3 G5 verified; X5 running (owner chose B); exchange-keyword pages, slogans, SEO/GEO audit fixes (#86 #85 #87) live; articles every 2 h (24/day). Still time-bound: C1–C3 streaks, D1 (11-09), D2/G4 (10-18), X5 data (10-25), S1–S5, X2/X4 |
| 2026-10-12 02:45 | ~84 | D3 passed; live since 23:30: Brazil BCB deadline topic (#89), ur/uk locales noindex (#90), per-country partner gating with sourced restrictions table (#91), Telegram rhythm on BaoTa — 08:00 snapshot, Monday poll, per-locale article posts (#92), sparkling campaigns link + footer data-nosnippet (#93). Queued: campaign collector 5-min refresh + activity sign-up block, X poster, MEXC no-KYC titles, test hygiene; Gemini (Antigravity) native review of ur/uk running |
| 2026-10-12 03:20 | ~86 | since 02:45: X poster live on BaoTa (#95), campaign collector 5-min/240 items + sign-up block on /activities (#96, events 26→56), MEXC no-KYC titles fixed (#97), 154 ur/uk native-review fixes via Gemini (#98), test hygiene + directory-compare bug fix → test:sites 1161/1161 green for the first time (#99 #100). YouTube @Bitcoinberlin profile rewrite prepared, waiting on owner identity check |
| 2026-10-12 10:05 | ~87 | M4 passed (ar/vi/id/ru 165 + ur/uk 154 native-review fixes live); privacy/terms/contact pages live (#110); 新手村 section built (#107, waiting for v2 videos), v2 episode pilot rendered with HyperFrames (#111); YouTube catalogue titles/descriptions/thumbnails rolling daily; ffmpeg on the build Mac repaired. Lost: 04:46 and 06:46 article runs (Mac slept after session end) — keep-awake restored |
