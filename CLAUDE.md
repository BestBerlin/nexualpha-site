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
- Fee facts: `docs/data/exchange-facts-YYYYMMDD.json` is embedded verbatim in `src/data/exchange-facts.js`; only official
  fee pages/APIs count as sources, each figure keeps its URL and a note; unverifiable stays null.
- Browser checks: `scripts/browser-sweep.js` (load in the dev page; `__sweep(routes)` layout, `__rule8(routes)` disclosures).
- Owner decisions on positioning/claims live in `docs/company/ITERATION-v8.md` (partner node, OKX/Bitget push, auto-settle list).
- `npm test` has 56 pre-existing failures (see `pilot-01-prototype/docs/release-blockers-v8.md`); a change must not add new ones.
