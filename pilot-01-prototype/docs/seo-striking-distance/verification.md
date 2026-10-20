# Verification and limits

All commands ran from `pilot-01-prototype/`. Final supported-runtime checks used:

```sh
export PATH=/opt/homebrew/opt/node@24/bin:$PATH
```

Node: v24.19.0. The initial shell default was v26.0.0.

## Passing checks

```sh
npm run build
```

Exit 0 on Node 24; 2,689 prerender routes, critical CSS and server packaging completed. The first Node 26 attempt stopped at packaging because the isolated worktree lacked ignored `.openai/hosting.json`; the primary checkout's existing configuration was copied locally and remains untracked/ignored.

The final client was refreshed after the market-gating and disclosure-layout corrections. Only this task's generated `dist/client/assets` was removed first; existing generated prerender assets were retained:

```sh
node --input-type=module -e 'import {build} from "vite"; await build({build:{emptyOutDir:false}}); process.exit(0)'
node scripts/build-route-css.mjs
node scripts/build-critical-css.mjs
node scripts/prepare-sites-build.mjs
node scripts/verify-build-budget.mjs --strict
```

All exited 0. Entry static closure: **345,336 B gzip / 350,000 B maximum**. App shell: 102,155 B / 400,000 B; V3 route: 186,796 B / 320,000 B. Existing circular-chunk and >500 kB chunk warnings remain diagnostic warnings.

```sh
node --test tests/seo-striking-distance.test.mjs tests/compare-striking-distance.test.mjs tests/compare-direct-answers.test.mjs tests/compare-decision-ssr.test.mjs tests/referral-seo.test.mjs tests/referral-native.test.mjs tests/seo-onpage-venue-h1.test.mjs tests/striking-answer-first-2026-10-18.test.mjs tests/ctr-titles-2026-10-13.test.mjs tests/seo-onpage-metadata-length.test.mjs tests/clean-footer-locales-ssr.test.mjs tests/brand-slogan.test.mjs
```

62 passed, 0 failed. Covers EN/zh-Hans metadata parity, helper-bound codes, fee-led answers, reverse headings, body/footer links and all eight reverse 301s preserving locale/query context, plus forbidden-market Hyperliquid copy.

```sh
node --test tests/venue-graph.test.mjs tests/server-build-imports.test.mjs tests/invite-code-consistency.test.mjs
```

15 passed, 0 failed. Includes venue import/preload isolation, hydration, server dependency packaging and 2,692 built HTML documents across 17 locales.

```sh
node --test tests/seo-striking-distance.test.mjs tests/referral-native.test.mjs tests/clean-footer-locales-ssr.test.mjs
```

18 passed, 0 failed after the final disclosure CSS correction.

```sh
node --test tests/locales-ur-uk.test.mjs
```

9 passed, 0 failed. Draft translations retain their underlying numeric/source structure independently of the new EN/zh-Hans overlays.

```sh
npm run typecheck
git diff --check
```

Both passed.

Chrome + computer-use: home footer inspected at 390/768/1440 px; all 16 discovery links present without horizontal overflow. EN Hyperliquid inspected on mobile/desktop. zh-Hans Bybit inspected at 390/768/1440 px after fixing full-width disclosure grid placement; badges no longer squeeze and disclosure/referral details no longer overlap. These are sample visual checks, not a full visual sweep of every targeted route.

## Broader suite limitation

```sh
npm run test:sites
```

The initial Node 26 run recorded 1,820 completed top-level passes and 29 failures, then stalled without a final TAP summary. It ran while build artifacts were being regenerated, so it is not clean final-build evidence. Several old home/compare metadata expectations and the draft-translation assertion were subsequently updated and independently rerun successfully above. Remaining observed failures include academy generation, legacy home mockup/terminal expectations, Turkish content, attribution, prerender/package contracts, and unrelated content/retrieval expectations. No baseline comparison proves all remaining failures predate this task.

The stalled processes held `/tmp/seo-sites.log` (PIDs 26718 and 26733). Tool interruption attempts did not end the run; a direct process signal was refused by the filesystem/process sandbox. The local Vite preview was stopped. The broad suite's generated `tests/.tmp-audit-content-cz7sHl/` was left untracked because the stalled process may still own it. A supported-runtime broad rerun with a bounded process timeout remains open.

No deployment, Search Console mutation, ranking improvement, indexing or conversion result is claimed.

## Local commit blocker

`git add -u pilot-01-prototype` and explicit `git add` of the new files both failed:

```text
fatal: Unable to create '/Volumes/致态2TB/nexualpha-site-git/.git/worktrees/nx-wt-codex-seo-striking-distance/index.lock': Operation not permitted
```

The branch remains `codex/seo-striking-distance`. No changes were staged or committed. No existing lock file was removed. Recovery requires managed write access to the linked Git metadata directory, then staging the listed task files and creating the authorized local Lore-format commit. The worktree files and a complete patch are preserved locally.
