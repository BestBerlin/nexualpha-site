# Verification commands

Run from `pilot-01-prototype/`. Logs beside this file retain exact output; a passing build/budget is technical evidence, not browser or production approval.

```sh
node scripts/build-inner9-css.mjs
npm run build
node scripts/verify-build-budget.mjs --strict
node --test --test-concurrency=1 tests/inner-visual-card-art.test.mjs tests/inner-visual-article.test.mjs tests/compare-visual-v2.test.mjs tests/venue-faq-ssr.test.mjs tests/exchange-key-facts.test.mjs tests/venue-detail-decision-ssr.test.mjs tests/venue-facts-localization.test.mjs tests/venue-fee-summary.test.mjs tests/venue-page-slimming.test.mjs tests/compare-direct-answers.test.mjs tests/compare-faq-locales.test.mjs tests/compare-scorecard-cta.test.mjs tests/compare-any.test.mjs tests/compare-reading-structure.test.mjs tests/news-detail-copy-l10n.test.mjs tests/news-offer-and-placeholders.test.mjs tests/r119-news-hierarchy.test.mjs tests/r300-article-navigation.test.mjs
node --test --test-concurrency=1 tests/article-embeds.test.mjs tests/news-locales.test.mjs tests/news-article-endpoint.test.mjs tests/article-related-links.test.mjs tests/compare-cls.test.mjs tests/compare-compact-pending.test.mjs tests/compare-decision-ssr.test.mjs
node --test --test-concurrency=1 tests/venue-graph.test.mjs
node --test tests/inner-visual-card-art.test.mjs
node scripts/render-inner-visual-evidence.mjs
git diff --check
git diff --exit-code HEAD -- public src/data
```

- Main targeted batch: 96 tests, 77 passed, 19 historical-review-fixture skips, 0 failures (`tests.log`).
- Extended news/compare batch: 42 passed, 0 failures (`extended-tests.log`). Article embed tests pass after restoring the local plugin cache; earlier null-root failures were a consequence of missing generated locale functions.
- Venue graph: 6 passed, including actual built preloads and en/it/ar SSR hydration (`venue-graph.log`). New assertions pin both extracted helpers.
- Card art: 4 passed, including explicit traversal of the built home's static JS imports; neither art nor venue icon helpers enters the closure (`card-art-tests.log`). This adds a build-specific guard after the 3 art checks included in the main batch.
- Final build and strict budget: see `build.log` and `budget.json`. The app shell, V3 route, shared navigation CSS and home static-closure checks must all pass. No new home-entry helper dependency is permitted.
- SSR export: five complete status-200 documents without SSR fallback markers; actual feed article in English and Simplified Chinese (`ssr-manifest.json`).
- Generated public/data files are restored to HEAD after verification and excluded from this change.

## Environment recovery

The normal build initially failed because this isolated worktree lacked two ignored local inputs. No production or dependency configuration was changed:

1. Cached Paraglide plugins copied into this worktree's `project.inlang/cache/plugins/`; corresponding source/destination SHA-256 values match: `85862f6305793b56bfd9afe5368b096e63fb2aeab38b7799c051517be3499c0b` and `9486558801c08ebb018223c51c2044b6c3c23fc2a8c0e7894a57882b34feb6ca`. The failed generated compilation cache was invalidated so locale modules regenerate normally.
2. The existing ignored `.openai/hosting.json` copied from the main checkout for `prepare-sites-build.mjs`.

A first integration build also exposed an SSR chunk initialization cycle; pinning the new shared visual helpers in both build modes resolved it. Existing duplicate data-key/circular-chunk warnings remain outside this visual scope. No push or deployment was performed.

## Browser review

See `LAYOUT.md`. Chromium could not launch under this sandbox (`MachPortRendezvousServer`, permission denied 1100). CLS, rendered responsive geometry, axe and full-page screenshots remain unverified. `compare-cls.test.mjs` is a test contract, not a browser CLS measurement. Better Design's principle/review-rules queries were quota-blocked; its spacing status was `needs-capture`.

## Local commit blocker

Branch remains `codex/inner-visual-v2`. Staging the scoped files with `git add -- ...` failed before a commit could be created:

```text
fatal: Unable to create '/Volumes/致态2TB/nexualpha-site-git/.git/worktrees/nx-wt-codex-inner-visual-v2/index.lock': Operation not permitted
```

All implementation/evidence files remain in this worktree, unstaged. Build-generated tracked files were restored byte-for-byte from `git show HEAD:<path>` because `git restore` hit the same index-lock denial. `git diff --exit-code HEAD -- public src/data` and `git diff --check` pass. The final focused art/article rerun passes 12/12 (`final-art-tests.log`).

The root `.tmp-inner-visual-v2.patch` contains tracked changes and new files for lead extraction. `git apply --reverse --check .tmp-inner-visual-v2.patch` validates that it matches this worktree without changing files. Intended Lore commit text is in `COMMIT-MESSAGE.txt`. Recovery: apply/review the patch and create the local commit in a controller context that can write this worktree's Git metadata. No push or deployment is authorized by this handoff.
