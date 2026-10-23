# Validation — inner visual v3

Commands run from `pilot-01-prototype/` unless stated otherwise. Node: 24.19.0 via the existing Homebrew Node 24 installation. No dependencies were installed.

```sh
node scripts/build-inner9-css.mjs
```

PASS: route CSS generated from the `.src.css` files.

```sh
PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run build
PATH=/opt/homebrew/opt/node@24/bin:$PATH node scripts/verify-build-budget.mjs --strict
PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run typecheck
```

All exit 0. Strict budget status PASS; home initial static closure is **318,045 bytes gzip**, below 350,000. The normal build includes 2,590 prerender routes and 559 route-style surfaces. Existing duplicate-key/circular-chunk warnings remain. Initial fresh-worktree prerequisite failures were recovered by reusing the existing ignored compiler-plugin cache and empty hosting config; neither is committed.

```sh
PATH=/opt/homebrew/opt/node@24/bin:$PATH node --test tests/venue-visual-v3.test.mjs tests/referral-native.test.mjs tests/venue-detail-decision-ssr.test.mjs tests/registration-card-ssr.test.mjs tests/footer-redesign-hrefs.test.mjs tests/inner-visual-card-art.test.mjs tests/inner-visual-article.test.mjs tests/compare-visual-v2.test.mjs tests/compare-visual-v3.test.mjs tests/exchange-scorecards.test.mjs tests/exchange-scorecards-ssr.test.mjs tests/article-related-links.test.mjs tests/news-library.test.mjs tests/seo-onpage-news-autolink.test.mjs
```

PASS: **106 tests; 106 passed; zero failed/skipped**. Covers exact existing referral data and qualifications, neutral-policy behavior, shared comparison destinations, footer href preservation, numeric fee/bar math and per-metric winners, missing data, resource/card labels and tracking, semantic long tables, and exclusion of every new visual enhancement from the built home entry closure.

```sh
PATH=/opt/homebrew/opt/node@24/bin:$PATH node --test tests/venue-graph.test.mjs tests/venue-visual-v3.test.mjs tests/compare-cls.test.mjs tests/article-embeds.test.mjs
```

PASS: **23 tests; 23 passed; zero failed/skipped**. The venue preload graph excludes compare/activity/topic graphs. Hydration and article-embed tests pass on the final build. These tests overlap the targeted suite and are not 23 additional unique tests. Earlier article-embed failures before a valid full build no longer reproduce.

```sh
PATH=/opt/homebrew/opt/node@24/bin:$PATH node scripts/render-inner-visual-v3-evidence.mjs --browser-assets
node --check vite.config.mjs
node --check scripts/render-inner-visual-v3-evidence.mjs
git diff --check
```

All PASS. The renderer saved **11 HTTP-200 Worker SSR documents**, with an H1 and no SSR-fallback marker. It also staged disposable real-path browser copies in ignored `dist/client/`.

Chrome + computer-use: **22 final route/width profiles**, including 390/768/1440/1728 and English/Chinese/Arabic samples. Zero horizontal page overflow; comparison header links measure at least 44px wide. The mobile article table measured 680px inside a 325px scrolling frame. Keyboard ArrowRight scrolled it to 120px; native comparison and venue disclosures opened successfully. See `browser-metrics.json`, `browser-interactions.json`, PNGs and `layout-notes.md`.

Completed Better Design spacing checks at all four widths report **zero critical/serious findings** on visible changed panels. The separately documented intentional hidden semantic header and internally clipped table contents are excluded; raw captures and the initial report are retained. Moderate legacy spacing findings remain.

**CLS constraint remains open:** final matrix maximum 0.0373022222; a repeat article anchor load reached 0.0451100194. Recorded sources include the shared header and the article cluster-links container. This is not a global CLS-0 pass. Normal Node-preview/API smoke could not run (`listen EPERM`); static SSR/client review is a narrower check. Raw-CDP reduced-motion emulation was denied, so no browser emulation pass is claimed.

From repository root:

```sh
git restore -- pilot-01-prototype/public
git commit -m 'Make inner-page decisions easier to scan' -m 'Constraint: Preserve existing partner facts, CTA destinations and route-owned assets.
Confidence: high
Scope-risk: moderate
Tested: Full build, strict budget, typecheck, targeted SSR and route graph tests; responsive Chrome review.
Not-tested: Normal Node preview (listen EPERM); browser reduced-motion emulation denied; unconditional global CLS 0.
Co-Authored-By: Codex <noreply@openai.com>'
```

Both Git write operations are **BLOCKED**, exit 128:

```text
fatal: Unable to create '/Volumes/致态2TB/nexualpha-site-git/.git/worktrees/nx-wt-codex-inner-visual-v3/index.lock': Operation not permitted
```

No commit was created. Per the shared brief's fallback, changes remain in the working tree on `codex/inner-visual-v3`. The 16 build-generated tracked public files were restored byte-for-byte using `git show HEAD:<path>` and writes inside the authorized worktree. No public data, facts, home source, deployment or production files are part of the final diff. The complete intended commit message is in `COMMIT-MESSAGE.txt`.
