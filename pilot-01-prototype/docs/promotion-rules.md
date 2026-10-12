# News promotion rules

`src/data/promotions.js` is the shared resolver for React article pages and Worker fallback HTML. It uses the existing public partner feed for signup codes, shares and dated terms confirmations. A build never refreshes a verification date. Undated signup terms remain disabled, and confirmed terms stop qualifying after 30 days.

`node scripts/generate-promotions.mjs` snapshots the same official event feed and owner-curated campaigns used by Activities. Announcement publication/fetch timestamps do not establish campaign validity or eligibility. A campaign needs explicit `startAt`, `endAt`, `checkedAt`, `regions` and localized `conditions` before the generator enables it. Keep expired rows as dated evidence; the resolver excludes them. No WEEX or placeholder referral routes are imported.

Article `topicTags` (or `tags`), `relatedVenues`, and optional `cta: { venue, topic, coin }` supply relevance. Names in prose and titles alone do not trigger ads. Up to two qualifying offers render; an unmatched article gets the internal comparison tool. Region gates reuse the partner geography policy, and ru/ar/zh-Hant/ur/uk remain neutral.

`SponsoredSlot` supports inline, end, sidebar and mobile variants. The news page uses an inline slot after the first third of the body when a commercial offer matches, an end card in normal flow on all devices, and a sidebar inside the desktop rail at 1200px and above. It reserves card height and shares the rail's sticky scrolling container with navigation. It does not use a floating mobile bar. Commercial links use `/go/<partner>?src=...` with locale/market context and `rel="sponsored noopener"`; article references retain ordinary source-link attributes.

After updating rules, run the build to refresh `public/intel/promotions.json`. Keep Vite builds and Vite-backed tests sequential: both regenerate `src/paraglide`. Focused verification:

```sh
node --test tests/promotions.test.mjs tests/sponsored-slot.test.mjs tests/promotions-worker-ssr.test.mjs
npm run build
npm run test:sites -- --test-concurrency=1
npm run typecheck
node scripts/verify-build-budget.mjs --strict
```
