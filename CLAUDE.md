# NexuAlpha site — project instructions

On every new session, first read `docs/company/SCORECARD.md` (owner target ≥ 90/100, measurable criteria), `docs/company/ITERATION-v8.md` (current milestone, checklist, next steps) and
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
  Route SEO (seo-payload lane): `src/data/seo-injection.js` is Node/SSR-only (the client vite build throws if it is
  reached); the browser keeps the SSR head and, only after a client-side route change, fetches
  `/api/route-seo?path=…` (worker `routeSeoPayload`, same helpers as the SSR head) via `src/data/route-seo-client.js`.
- Full-site QA (2026-10-11): `docs/company/qa/` holds the coverage ledger, issue log and the sweep scripts
  (`scripts/qa-http-sweep.mjs`, `qa-browser-sweep.py`, `qa-flows.py`, run against production). Re-run them after
  any batch that touches routing, SSR or chunking; a page is "checked" only when it appears in the ledger.
- Every HTML splice in the Worker/server uses a function replacer (`html.replace(re, () => text)`): a string replacer
  expands `$'`/`$&` inside user or feed text (a Turkish "200$'a" truncated /tr/activities and broke hydration).
- Listing/collection routes (news lists, activities, data/brand pages, generated compare pairs) render at request time
  through `NEWS_SSR_RENDER` with the same component and props the client hydrates; never ship a different SSR
  template than the client component (CLS 0.5–0.9 and stale crawled copy were the symptom).
- Stylesheet chunk names decide what the Worker links per route (`route-v3-pages-*` etc.). A route's own CSS must live
  in its own chunk (`route-v3-pages-directory`), not inside another route's chunk, or Vite preloads that route's whole
  graph (the /exchanges 1 MB regression).
- Venue route (venue-graph lane): `/exchanges/<slug>` is its own route module (`src/components/v3/VenueDetailPage.jsx`,
  chunk `route-v3-venue`); the collapsed "Sources" hub (`VenueDetailResearch.jsx`, chunk `route-v3-venue-research`)
  hydrates only when opened (`DeferUntilVisible interactionOnly`, wired from App.jsx so esbuild tests can still render
  the page through `VenueDetailPageStatic.jsx`). Rollup folds the unassigned static dependencies of a manual chunk into
  whichever manual chunk visits them first: a small helper shared by two route chunks must be pinned in
  `vite.config.mjs` (`shared-venue-copy`, `shared-exchange-facts`, `data-campaign-copy`), and Vite's preload helper is
  pinned to `core-ui` or the browser entry imports a route chunk statically. Check with
  `tests/venue-graph.test.mjs` after a build: the venue preload list must not contain route-activity, route-v3-pages,
  route-topic-guide or data-compare-*.
- Web fonts: Geist (home hero, v5 pages) is preloaded in `index.html` and has metric-matched fallbacks (`"Geist V5
  Fallback"`, `"Geist Mono V5 Fallback"` in `src/styles/v5/base.css`); keep both families in every Geist font stack, or
  the font swap reflows the hero (CLS 0.1–0.19 on /it, /de).
