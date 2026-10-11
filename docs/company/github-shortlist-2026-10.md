# GitHub shortlist for NexuAlpha (2026-10)

Status: research only. Nothing installed, nothing committed.
Method: `gh search repos ... --sort stars` across six areas (37 queries), then `gh api repos/<repo>` for stars, license, last push and archive flag. Data pulled 2026-10-11. "Last push" = `pushed_at` on the default repo, which is close to the last-commit date.

What we already run (so recommendations build on it, not around it):
- Site: React 19 + Vite 6 SSR, `@inlang/paraglide-js`, `@resvg/resvg-js` 2.6.2, axe-core, jsdom.
- Telegram monorepo (`/Users/bestberlin/Documents/ChatGPT/Telegram`): `grammy` 1.46, BullMQ + ioredis, Next 16 (Mini App + admin), Postgres, zod. No grammY plugins and no Mini App SDK imported today.
- Claude skills already installed in this environment: `seo-*` (claude-seo), `geo-*` (geo-seo-claude), `postiz`, `searchfit-seo`. These are not listed again as new finds.

Licence rule applied: MIT / Apache-2.0 / ISC / BSD / CC0 are OK. MPL-2.0 is OK when used unmodified as a dependency. AGPL is only acceptable as a separate self-hosted service we don't modify. Repos with no licence are reference-only.

---

## Top 15 (verdicts)

| # | Repo | Stars | Last push | Licence | Verdict | Effort |
|---|------|------:|-----------|---------|---------|:------:|
| 1 | [tradingview/lightweight-charts](https://github.com/tradingview/lightweight-charts) | 17.5k | 2026-10-09 | Apache-2.0 | **Adopt now** | M |
| 2 | [ccxt/ccxt](https://github.com/ccxt/ccxt) (+ [sieblyio/okx-api](https://github.com/sieblyio/okx-api), [sieblyio/bitget-api](https://github.com/sieblyio/bitget-api)) | 44.3k (168 / 77) | 2026-10-08 | MIT | **Adopt now** (worker side only) | M |
| 3 | [vercel/satori](https://github.com/vercel/satori) | 14.0k | 2026-10-09 | MPL-2.0 | **Adopt now** | S |
| 4 | grammY plugins: [auto-retry](https://github.com/grammyjs/auto-retry), [ratelimiter](https://github.com/grammyjs/ratelimiter), [menu](https://github.com/grammyjs/menu), [parse-mode](https://github.com/grammyjs/parse-mode), [i18n](https://github.com/grammyjs/i18n) | 10–65 each (core 3.8k) | 2026-07 to 09 | MIT | **Adopt now** (auto-retry, menu, parse-mode); i18n try later | S |
| 5 | [harlan-zw/unlighthouse](https://github.com/harlan-zw/unlighthouse) | 4.9k | 2026-10-11 | MIT | **Adopt now** | S |
| 6 | [lycheeverse/lychee](https://github.com/lycheeverse/lychee) | 4.0k | 2026-10-11 | Apache-2.0 / MIT | **Adopt now** | S |
| 7 | [google/schema-dts](https://github.com/google/schema-dts) | 1.2k | 2026-10-02 | Apache-2.0 | **Adopt now** | S |
| 8 | [lingualdev/i18n-check](https://github.com/lingualdev/i18n-check) | 186 | 2026-10-08 | MIT | **Adopt now** (pilot on `locales/*.json`) | S |
| 9 | [Telegram-Mini-Apps/tma.js](https://github.com/Telegram-Mini-Apps/tma.js) | 1.2k | 2026-10-09 | MIT | Try later | M |
| 10 | [umputun/tg-spam](https://github.com/umputun/tg-spam) | 452 | 2026-10-11 | MIT | Try later | S |
| 11 | [apache/echarts](https://github.com/apache/echarts) | 67.5k | 2026-10-04 | Apache-2.0 | Try later (heatmaps only) | M |
| 12 | [plhery/node-twitter-api-v2](https://github.com/plhery/node-twitter-api-v2) | 1.6k | 2026-08-04 | Apache-2.0 | Try later | S |
| 13 | [gitroomhq/postiz-app](https://github.com/gitroomhq/postiz-app) | 37.0k | 2026-10-11 (v2.25.1) | AGPL-3.0 | Try later (separate container, unmodified) | M |
| 14 | [line/line-bot-sdk-nodejs](https://github.com/line/line-bot-sdk-nodejs) | 1.1k | 2026-10-10 | Apache-2.0 | Try later (when JP/TH/TW push starts) | S |
| 15 | [obra/superpowers](https://github.com/obra/superpowers) | 297k | 2026-10-10 | MIT | Try later (dev workflow skills) | S |

### Notes on each

**1. lightweight-charts — price/funding/OI charts on venue and market pages.**
45 KB canvas library from TradingView, made for financial time series (candles, lines, histograms). Fits "live modules" in the growth plan: funding-rate history, OI, basis per venue. React-agnostic, so it can mount inside an SSR island after hydration.
Risks: needs client-side JS (render a static SVG/number fallback on SSR for crawlers and AI). The licence asks for attribution. Keep the default `attributionLogo` link or add an equivalent TradingView credit, and ship NOTICE. Respect `prefers-reduced-motion` ourselves (no animated scrolling).
Alternative if bundle size matters more than finance features: [leeoniya/uPlot](https://github.com/leeoniya/uPlot) (10.6k, MIT, ~50 KB, also fast).

**2. ccxt (worker) + sieblyio OKX/Bitget SDKs — one normalised feed of public market data.**
ccxt gives the same API for funding rates, open interest, tickers and fee schedules across 100+ exchanges, using public endpoints with no API keys. It belongs in the Node worker that already builds `market-command.js` data, never in the browser bundle (it is large). For OKX and Bitget, which we list first, the sieblyio SDKs are leaner, typed, and cover WebSockets. Use them if we only need two or three venues live.
Risks: exchange rate limits (cache in Redis, which is already deployed). ccxt exposes trading methods but we will only use public endpoints, with no keys and no trade calls. Data shown must stay "source-bound" (repo principle): store the source and fetch time with every number.

**3. satori — OG images and Telegram image cards from JSX.**
Turns JSX + CSS into SVG. We already ship `@resvg/resvg-js`, so satori → resvg → PNG completes the pipeline with no headless browser. Use it for per-article and per-venue OG images in 17 locales (bundle CJK/Thai/Arabic fonts), and for the "market card" images posted to the 5 Telegram channels every 2 h.
Risks: subset of CSS only (flexbox, no grid). MPL-2.0 is file-level copyleft and fine unmodified. Font files add build size. Alternative: [kane50613/takumi](https://github.com/kane50613/takumi) (3.1k, Apache-2.0, Rust, also renders JSX). Younger project; consider it if satori is slow on CJK.

**4. grammY plugins — reliability for 5 channels + bot.**
We already use `grammy` but hand-roll everything else. `auto-retry` handles Telegram 429 flood-wait responses automatically, which matters for scheduled bursts to 5 channels. `menu` gives stateful inline-keyboard menus (venue picker, language picker). `parse-mode` builds safe formatted text (no broken MarkdownV2 escaping). `ratelimiter` protects the bot from user spam. `i18n` (Fluent) is optional because copy may stay in our own locale files.
Risks: low. Small plugins in the same org as the core library. `@grammyjs/runner` was last pushed 2024-09; only needed if we stay on long polling at scale. Note: use `@grammyjs/conversations` v2 only if we build multi-step flows.

**5. unlighthouse — Lighthouse on every URL, all locales.**
Crawls the sitemap and runs Lighthouse per page. Gives a single report of CWV/SEO/a11y across 17 locales × templates, and catches regressions like a missing `lang`/hreflang or LCP drops. Run it against the BaoTa preview before big deploys (matches the "preview before big deploys" rule). CI mode with budgets exists.
Risks: heavy (Chromium). Run it on demand or nightly, not on every commit. Sample by template if the full URL count grows into the thousands.

**6. lychee — broken-link and referral-link guard.**
Fast Rust link checker (CLI + GitHub Action). Point it at the built `dist/` or the sitemap to catch dead internal links, dead source citations, and changed referral URLs before release. It complements the `nexualpha-release-control` skill's "protected referral links" check.
Risks: exchange sites often return 403 to bots. Keep an allowlist and accept 403/429 for known partner domains instead of failing the build. Alternative in TS: [JustinBeckwith/linkinator](https://github.com/JustinBeckwith/linkinator) (1.3k, MIT).

**7. schema-dts — typed JSON-LD.**
TypeScript types for all of Schema.org. Wrapping our Article/FAQPage/Organization/BreadcrumbList/Review generators in these types catches invalid properties at build time. Low-cost AEO hygiene. Types only, zero runtime.
Risks: none meaningful. Google rich-result rules are stricter than Schema.org, so keep the existing seo-schema skill check too.

**8. i18n-check — missing/broken keys across 17 locales.**
CLI that compares every locale file to the source locale (en) and reports missing keys, extra keys, and broken ICU placeholders. Our `pilot-01-prototype/locales/*.json` fits. Paraglide/inlang message files are JSON but not exactly ICU or i18next. Run a 10-minute pilot first; if it misreads the format, a 40-line in-house script does the same job.
Risks: small project (186 stars) but active and single-purpose.

**9. tma.js — Mini App SDK.**
The maintained TypeScript SDK for Mini Apps (`@tma.js/sdk-react`): theme params → CSS variables (our Mini App can follow Telegram dark/light), back button, haptics, secure `initData` validation on the server, viewport. The org also ships [reactjs-template](https://github.com/Telegram-Mini-Apps/reactjs-template) (430 stars, last push 2025-11) as a reference.
Risks: API changes between major versions. Our Mini App runs on Next 16, so adoption is incremental. Server-side `initData` HMAC validation is the most valuable piece and can be adopted alone.

**10. tg-spam — anti-spam for community groups.**
Self-hosted Docker bot (Go), MIT, pushed today. Uses message similarity, the CAS ban list, stop words, and optional LLM checks, and learns from admin feedback. Crypto groups attract scam spam ("DM me for signals", fake support), so this protects the brand if we open discussion groups linked to the channels. It runs as one more container on BaoTa, next to the bot stack.
Risks: Go stack (we don't modify it, just run it). The optional OpenAI check sends message text to a third party, so keep it off or document it in PRIVACY.md. Simpler join-captcha alternative: [fossifer/Telegram-CAPTCHA-bot](https://github.com/fossifer/Telegram-CAPTCHA-bot) (132, MIT, Python).

**11. ECharts — funding/liquidation heatmaps and treemaps.**
No credible open-source "liquidation heatmap" project exists (search results are small, unlicensed, or scrape CoinGlass). The right path is our own data (from #2) plus a charting library with heatmap and treemap built in. ECharts does that and is tree-shakable.
Risks: even tree-shaken it is ~300 KB+. Load it only on the page that needs the heatmap, never site-wide. Liquidation data itself is not in public exchange APIs in a complete form, so do not imply completeness.

**12. node-twitter-api-v2 — official X API v2 client.**
The de-facto TS client (typed, OAuth 1.0a/2.0, media upload, threads). Use it for posting our own content to our own X account.
Risks / ToS: official API only, which is fine. The X API free tier is very limited and paid tiers are expensive, so check current pricing before building. Automated posting must follow X automation rules (no duplicate spam across accounts, label as automated if bot-like). The official [xdevplatform/twitter-api-typescript-sdk](https://github.com/xdevplatform/twitter-api-typescript-sdk) was last pushed 2024-01, so prefer plhery.

**13. Postiz — self-hosted cross-poster.**
37k stars, very active, uses official platform APIs (X, LinkedIn, Facebook, Instagram, Threads, Telegram, Bluesky, etc.). It has a public API, and the `postiz` skill is already available here. It gives one queue for "publish to X + Telegram + others" from the 2-hourly content lane.
Risks: AGPL-3.0, which is fine only as an unmodified separate container. It is a big stack (Postgres, Redis, workers), so it adds ops load on BaoTa. Each platform still needs its own developer app/approval. MIT alternative: [inovector/mixpost](https://github.com/inovector/mixpost) (3.8k, Laravel, last push 2026-03, slower).

**14. LINE Messaging API SDK (official).**
Official Node/TS SDK, Apache-2.0, very active. Relevant when the JP / zh-Hant (TW) / TH audiences need a LINE Official Account broadcast mirror of the Telegram channels.
Risks: LINE OA broadcast messages are metered (paid plans by volume). Official, so ToS-safe.

**15. obra/superpowers — agent workflow skills.**
Huge, MIT, active collection of Claude Code skills for planning, TDD, debugging and code review discipline. Useful for the Codex/Claude dual-agent setup (structured plans before edits).
Risks: it overlaps with skills and AGENTS.md rules we already have. Pilot it in one session before enabling it globally, because it changes agent behaviour broadly.

---

## Skip list (and why)

| Repo | Why skip |
|------|----------|
| [wwebjs/whatsapp-web.js](https://github.com/wwebjs/whatsapp-web.js) (22.7k, Apache-2.0) | Automates WhatsApp Web, which breaks WhatsApp ToS (risk of number bans). Official route is the Cloud API, e.g. [Secreto31126/whatsapp-api-js](https://github.com/Secreto31126/whatsapp-api-js) (356, MIT, active). **WhatsApp Channels have no public posting API**, so channel posting stays manual. |
| [RFS-ADRENO/zca-js](https://github.com/RFS-ADRENO/zca-js) (664, MIT) | "Unofficial Zalo API" for personal accounts, which breaks ToS. No maintained official Zalo OA Node SDK found on GitHub (`zaloplatform/*` 404). For Vietnam, call the Zalo OA Open API directly over HTTPS. |
| [pat310/google-trends-api](https://github.com/pat310/google-trends-api) (974, MIT) | Last push 2022-11. Unofficial and scrapes Google endpoints (ToS grey, breaks often). Use Google Trends UI / Search Console / DataForSEO (skill exists) instead. Same reason to skip autocomplete scrapers. |
| [Rongronggg9/RSS-to-Telegram-Bot](https://github.com/Rongronggg9/RSS-to-Telegram-Bot) (2.2k, AGPL, Python) | Good bot, but we already publish from our own pipeline every 2 h with BullMQ. It would duplicate the content lane and lose our formatting/CTA control. |
| [typpo/quickchart](https://github.com/typpo/quickchart) (2.1k, AGPL) / [ChartjsNodeCanvas](https://github.com/SeanSobey/ChartjsNodeCanvas) (258, MIT) | Server chart PNGs need native canvas in Docker. satori + resvg (already a dependency) can render SVG charts without it. |
| shadcn-ui / radix / magicui / tremor | Strong libraries, but our site has its own token system and visual constitution with no Tailwind. Importing a component kit would fight DESIGN.md. Tremor's last push was 2025-10 (slowing). Use them for pattern reference only. |
| [motiondivision/motion](https://github.com/motiondivision/motion) (34k, MIT) | Excellent (`useReducedMotion`), but CSS transitions + `prefers-reduced-motion` already cover our needs. Adds ~30 KB+ for little gain. Revisit for the Mini App only. |
| [spothq/cryptocurrency-icons](https://github.com/spothq/cryptocurrency-icons) (2.8k, CC0) | Last push 2024-08, missing newer coins. Exchange and coin logos are trademarks anyway, so use official press-kit logos for partner venues. For generic UI icons, [tabler-icons](https://github.com/tabler/tabler-icons) (22k, MIT) or [lucide](https://github.com/lucide-icons/lucide) (25k, ISC) are fine if needed. |
| Liquidation/funding "dashboard" repos | All under ~50 stars, mostly no licence, several scrape CoinGlass (ToS). Build from #2 + #11 instead. |
| hreflang checker repos | None mature (all <5 stars). The `seo-hreflang` skill + unlighthouse + a sitemap-based script cover it. |
| [mxmzb/indexnow-indexing-script](https://github.com/mxmzb/indexnow-indexing-script) (GPL-2.0) | GPL, and IndexNow is a single POST. Write ~20 lines in the deploy script, or use [bojieyang/indexnow-action](https://github.com/bojieyang/indexnow-action) (63, MIT, active) as reference. This matches the "sitemap submit each deploy" rule. |
| llms.txt generators | [dotenvx/llmstxt](https://github.com/dotenvx/llmstxt) (149, BSD-3, sitemap → llms.txt) is a fine reference, but our build already knows every route. Generate llms.txt in `prepare-sites-build.mjs`. Spec: [AnswerDotAI/llms-txt](https://github.com/AnswerDotAI/llms-txt) (2.7k, Apache-2.0). |
| [anthropics/skills](https://github.com/anthropics/skills) (180k) | No repo-level licence. Individual skills carry their own terms, and some (document skills) are source-available, not open source. Read them as examples and don't vendor them. |
| Claude "SEO skill" forks (r14-…, r08-…, etc.) | Mass-forked repos with no licence, created the same day. Likely spam or SEO farms. We already run the upstream claude-seo / geo-seo-claude. |
| Telegram referral/analytics bots | Small, Python, mostly unlicensed, or about inviting fake accounts (svtcore/telegram-referral-bot = referral abuse). Track referrals with our own `start` deep-link payloads + Postgres. For channel analytics use Telegram's native channel stats (≥ 50 subs) plus our own UTM/click logs. |

## Longlist reference (checked, not ranked)

- Telegram: telegraf/telegraf 9.2k MIT; yagop/node-telegram-bot-api 9.2k MIT (both fine, but we're on grammY); twa-dev/SDK 331 MIT (last push 2025-02, so prefer tma.js); 1inch/shieldy 957 MIT (captcha, last push 2026-02); assimon/captcha-bot 232 MIT (Go).
- Charts/data: klinecharts/KLineChart 4.2k Apache-2.0 (candles, Chinese-first community); observablehq/plot 5.4k ISC (static SVG charts, good for SSR); sieblyio/binance 929 MIT; sieblyio/bybit-api 346 MIT; ccxt-rest (stale 2023, skip).
- SEO/perf: sitespeedio/sitespeed.io 5.0k MIT (deeper perf monitoring, heavier than unlighthouse); GoogleChrome/lighthouse-ci 7.1k Apache-2.0 (last push 2026-03); apify/crawlee 26k Apache-2.0 (only if we need a custom crawler of our own site); JustinBeckwith/linkinator 1.3k MIT.
- i18n: lingodotdev/lingo.dev 5.4k Apache-2.0 (AI translation CLI, tied to their hosted engine); opral/inlang 2.0k (the paraglide upstream, **no licence file at repo root**, so check the package licence before vendoring anything); i18next-parser (archived).
- OG: kane50613/takumi 3.1k Apache-2.0; thx/resvg-js 2.0k MPL-2.0 (already used).
- Social: Secreto31126/whatsapp-api-js 356 MIT (official Cloud API); gokapso/whatsapp-cloud-inbox 782 MIT; WhatsApp/WhatsApp-Nodejs-SDK (archived, skip); inovector/mixpost 3.8k MIT.

## Suggested order (if the owner approves)

1. Small and safe this week: grammY `auto-retry` + `parse-mode` + `menu`; `schema-dts`; `i18n-check` pilot; lychee + unlighthouse run against the preview before deploys; IndexNow ping in the deploy script.
2. Live modules sprint: ccxt / sieblyio OKX+Bitget in the worker → lightweight-charts on venue pages (with SSR fallback numbers) → satori market cards for channels and OG images.
3. Later: tma.js `initData` validation in the Mini App; tg-spam if groups open; X via node-twitter-api-v2 or Postiz once the API budget is approved; LINE OA when Asia locales ramp.
