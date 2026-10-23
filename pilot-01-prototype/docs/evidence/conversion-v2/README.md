# Conversion v2 evidence

These are full route SSR captures from the built `dist/ssr/entry-server.js`, using the checked-in news feed. They are HTML evidence, not browser screenshots or live deployment evidence.

| File | Route |
| --- | --- |
| zh-hans-exchanges-bitget.html | /zh-hans/exchanges/bitget |
| tr-exchanges-okx.html | /tr/exchanges/okx |
| zh-hans-article.html | /zh-hans/news/okx-third-party-app-ip-whitelist-broker-api-key-checklist |
| en-article.html | /news/okx-third-party-app-ip-whitelist-broker-api-key-checklist |

Regenerate from `pilot-01-prototype` after building:

```sh
node scripts/capture-conversion-evidence.mjs
```

The capture script requires the expected conversion marker in each route. `tests/conversion-v2.test.mjs` checks that each saved article has exactly one card immediately after the lead, with its source-bound sign-up URL and code.

Sticky SSR starts hidden; client observation activates it only below 768px after the hero CTA passes above the viewport, while no other on-page registration CTA or footer is visible. Dismissal is session-scoped. Non-partners, restricted markets and neutral locales have no sticky promotion. Article cards require checked spot and perpetual fees; paired partners receive one internal comparison card.

Existing sticky `/go` href parameters are preserved. New article sign-up hrefs and invite codes are exact `publicCtaForVenue` outputs. Fees, rebate shares and disclosure text use existing data/copy modules. The click collector and redirect mechanisms were not edited.

Real-browser checks at 390/768/1440 and measured CLS remain pending: the sandbox rejected localhost binding (`listen EPERM 127.0.0.1:5187`), and browser URL policy rejected local `file:` navigation. No screenshots, visual pass, measured conversion uplift or >=95 conversion score are claimed.

## Validation

Run from `pilot-01-prototype` with Node 24 (`PATH=/opt/homebrew/opt/node@24/bin:$PATH`).

- `npm run build` — passed, including prerendering, route/critical CSS, Sites packaging and strict budgets.
- `node scripts/verify-build-budget.mjs --strict` — PASS; home initial JS 316,869 bytes gzip, limit 350,000.
- `npm run typecheck` — passed.
- `node --test tests/conversion-v2.test.mjs tests/conversion-copy-feedback.test.mjs tests/conversion-metadata.test.mjs tests/venue-graph.test.mjs tests/registration-card-ssr.test.mjs tests/registration-copy-locales.test.mjs tests/r277-copy-failure-recovery.test.mjs tests/news-feed.test.mjs tests/r274-news-alternate-hydration.test.mjs tests/venue-detail-decision-ssr.test.mjs tests/public-cta.test.mjs tests/attribution-locale-gates.test.mjs` — 139 passed, 0 failed.
- `node --test tests/server-build-imports.test.mjs tests/cta-click-beacon.test.mjs tests/go-redirect.test.mjs` — 18 passed, 0 failed, 1 skipped (loopback bind EPERM).
- `node --test tests/conversion-v2.test.mjs tests/venue-graph.test.mjs` — final post-build check: 15 passed, 0 failed.
- `node scripts/capture-conversion-evidence.mjs` — all four route markers present.
- `git diff --check` — passed.

The worktree initially lacked the ignored Inlang plugin cache and `.openai/hosting.json`; local copies from the existing site checkout restored those build prerequisites. No dependencies, hosting settings, partner facts or generated public-data changes are part of the prepared changes.

Local Git staging/commit is blocked by the sandbox: `index.lock` under the shared Git worktree metadata cannot be created (`Operation not permitted`). Changes remain in the requested branch worktree for the lead to extract, as allowed by `_common.md`.
