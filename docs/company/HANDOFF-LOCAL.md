# Handoff to local Code session (2026-10-09)

Repo: BestBerlin/nexualpha-site · work branch: `v7-home` (NOT deployed, do not deploy). App dir: `pilot-01-prototype/`.
Deploy rule: only from `main` via `gh workflow run deploy.yml --ref main`, and only after the owner approves.

## Direction (decided)
NexuAlpha is not "a rebate page". It is an exchange intel desk: official announcements from exchanges, each with a fee comparison and a compliant sign-up path. Rebate is the second layer, not the headline. Aggregators (BlockBeats, CoinMarketCal...) win on speed; we win on "what to do after the news" (fees, rebate, region, sign-up) in 15 languages.

## Done on v7-home
- `src/components/v7/HomeV7.jsx` + `home7-copy.js` (zh-Hans/en only) + `src/styles/v7/home7.css` (generated from a `.h7`-scoped source with a `:not(#_)` specificity bump, because v6 CSS is a specificity stack).
- Announcements: `src/data/announcement-intel.js` (pure normalizers, fail-closed), `scripts/fetch-official-announcements.mjs` (Bitget + Bybit public endpoints), `tests/announcement-intel.test.mjs` (5 pass), `public/content/official-announcements.json` (snapshot from 2026-10-09, Bitget only; Bybit returned 403 from the cloud).
- Home block "交易所刚刚发布的公告" + per-item "对比四家" bottom sheet (native `<dialog>`).
- `generated-official-activities.js` is deliberately untouched (empty, fail-closed, tests assert it).

## Next (in order)
1. Run it locally (`npm i && npm run dev`), walk the home page at 390px: thumb reach, first-screen value, MobileBottomNav overlapping content.
2. Run Bybit from this machine; if it works, schedule `node scripts/fetch-official-announcements.mjs` (cron) and publish the JSON.
3. Machine-translate announcement TITLES only (label as machine translation, keep official link).
4. Translate the home copy for the other 13 locales (per-locale lead: rebate-first vs trust-first, owner to confirm tiers).
5. Event decision pages (SEO): one page per listing/airdrop with multi-exchange comparison. Needs prerender manifest work; do after 1-4.
6. Before any deploy: full `npm test`, e2e/tap-target/locale checks, owner sign-off on the new home H1 (SEO).

## Rules that must hold
- Never type invite codes/links by hand: use `publicCtaForVenue`. Do not touch `partner-registry`.
- Announcement items carry only title, time, official URL. No reward/eligibility claims (those belong to the reviewed activity model).
- Owner-supplied rebate shares live in `src/data/home-rebate-tiers.js` (OKX 20, Binance 20, Bitget 30, Bybit unknown; headline max 50 needs written confirmation).
- No Cloudflare/anti-bot workarounds; respect robots/ToS (tiers: Bitget/Bybit API, OKX docs to verify, Binance needs an API key the owner creates, Gate/KuCoin/Kraken/MEXC page scraping only after robots/ToS check, Coinbase is X-only).
- Partner count in code is 22 (12 CEX + 10 DEX), not 21/24.
