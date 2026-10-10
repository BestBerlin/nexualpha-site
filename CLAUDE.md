# NexuAlpha site — project instructions

On every new session, first read `docs/company/ITERATION-v8.md` (current milestone, checklist, next steps) and
`docs/company/HANDOFF-LOCAL.md`. Design rules live in `pilot-01-prototype/docs/design-unified-v8.md`.

## Stable rules
- App: `pilot-01-prototype/` (React + Vite, SSR). Dev: `npx vite --port 5174`. Work branch `v7-home`; deploy only from
  `main` via the "Deploy to production" workflow (see `DEPLOY.md`), after the owner has approved the release.
- Never hand-type invite codes or registration links: use `publicCtaForVenue` / `regionalVenueCta`. Do not edit
  `src/data/partner-registry.js`, `src/data/source-bound-cta.js` or other `src/data` facts as part of design work.
- Every block showing a referral code or sponsored link shows a commission disclosure in the same viewport
  (`CommissionDisclosureLine`, reuse existing localized wording).
- Home styles: edit `src/styles/v7/home7.src.css`, then `node scripts/build-home7-css.mjs` (generated `home7.css`).
- Announcement items carry only title, time, official URL; feeds fail closed (no invented notices, fees or rewards).
- No scroll-driven `view()` entrance animations (content got stuck half-faded); respect `prefers-reduced-motion`.
- Verify visually in a real browser at 390 / 768 / 1440 before calling a UI change done; tests alone are not evidence.
- `npm test` has 57 pre-existing failures (see `pilot-01-prototype/docs/release-blockers-v8.md`); a change must not add new ones.
- Telegram stack (bot, Mini App app.nexualpha.com, channel feed) runs in Docker on the BaoTa server since 2026-10-10;
  CT121 copies are disabled rollback only. Bot sign-up cards and the Mini App read `/intel/partners.json`, so partner
  codes change in one place (the site data). Never run a second poller for the same bot token.
- After every site deploy: `node scripts/search-engines.mjs submit`.
- Search publication: an article is indexable when the feed says `seo.noindex === false`; the Codex publisher sets it via
  its quality gate. Never reintroduce a frozen roster or a locale whitelist that hides translated pages.
- Deploy health is more than HTTP 200: the standby must reach the running CTA collector and report the error monitor
  ready (deploy/stage-remote.py checks both). Public checks must not use `curl | grep -q` under pipefail.
- Production runs `node:20-bookworm-slim` with no npm install on the server: anything `server/*.mjs` imports at runtime
  must be inside the release tarball. Social cards (`/og/*.png`, `server/og-image.mjs`) need `node_modules/@resvg` with
  the Linux gnu+musl binaries — on a Mac build use `npm pack` + extract (npm refuses cross-platform installs); fonts
  come from the host mount `/data/private/nexualpha/og-fonts` (DejaVu = Latin/Cyrillic/Arabic, WenQuanYi = CJK).
- The article publisher (`AEO Crypto Factory/scripts/nexualpha-content-publish.mjs`) imports site scripts from the old
  checkout `/Users/bestberlin/Documents/ChatGPT/Crypto聚合/pilot-01-prototype`, not this repo: after changing
  `scripts/update-news-seo.mjs`, `import-nexualpha-content.mjs`, `sitemap-publication-policy.mjs`,
  `generate-prerender-manifest.mjs`, `src/data/news-feed-client.js` or `news-library.js`, copy them there.
- Data pages `/liquidations` and `/funding-rates` (15 locales) render from the market feed mounted at
  `MARKET_EVENTS_FILE` (host `/data/agent/state/market/market-events.json`, written by `ops/market-collector`).
  Sign-up click attribution: Telegram traffic via `/go/<partner>?src=`, site buttons via the `/api/cta-click` beacon
  (hrefs never change — the deploy CTA guard compares them); both append to `CLICK_EVENT_FILE`.
- Client bundle rule (PR #59): `App.jsx`'s SSR-only `import.meta.glob` is stripped from client builds by a vite
  transform; never add eager globs reachable from the browser entry. `scripts/verify-build-budget.mjs --strict`
  fails the build if the entry's static closure exceeds 350 KB gzip. Below-the-fold home modules hydrate through
  `DeferUntilVisible` (SSR HTML stays complete). `/exchanges` HTML is cached 60 s server-side (`x-nexualpha-ssr-cache`).
