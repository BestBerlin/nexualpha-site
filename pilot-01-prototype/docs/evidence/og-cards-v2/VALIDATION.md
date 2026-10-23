# Validation and integration limits

All commands ran from `pilot-01-prototype/` unless stated otherwise.

- `node --test tests/og-cards-v2.test.mjs`: **6 passed**. 1,151 shaped text runs, 17 locales × 6 types, safe-area and collision checks, PNG dimensions/pixel variation, missing/malformed data, signed/zero chart values, fee gaps, 44 PNG tile equivalents. Warm cached requests: news 4.53ms, venue 1.36ms, compare 16.42ms, liquidations 0.91ms, funding 0.89ms, default 0.28ms (max of five requests each). Those request timings are rendered cache hits. Separately, warmed native rendering plus PNG encoding with explicit local fonts measured 28.76–46.23ms across all six types; each passed the <150ms assertion. Production Linux fonts still require integration verification.
- `node --test tests/og-image.test.mjs tests/brand-slogan.test.mjs tests/seo-audit-fixes-2026-10-11.test.mjs tests/runtime-writers-cluster.test.mjs tests/server-build-imports.test.mjs tests/brand-tiles.test.mjs`: **39 passed, 1 skipped**. HTTP server smoke skipped because binding loopback is denied (`EPERM`).
- `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run typecheck`: **passed** (exit 0).
- `PATH=/opt/homebrew/opt/node@24/bin:$PATH node scripts/verify-build-budget.mjs --strict`: **passed** for emitted client assets. This is not full-build clearance: empty translations from the unavailable plugins shrink that artifact.
- `node --check server/og-image.mjs && node --check src/data/social-image.js && node --check scripts/render-og-cards-v2-samples.mjs && git diff --check`: **passed**.
- `node scripts/render-og-cards-v2-samples.mjs`: **passed**, eight review PNGs plus SVGs. Actual historical collector snapshot dated 2026-10-13; not live-market evidence.
- `npm run build` and `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run build`: **failed**. Configured Inlang CDN plugin imports fail (`TypeError: fetch failed`); compiler emits empty messages and prerender fails with `TypeError: m[key] is not a function`. Retrying `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run i18n:compile` exits 0 but logs both plugin import failures; it does not recover translations. Existing generated translations copied into this worktree are overwritten by the same failing plugin step. No localization source changed. Five tracked generated data outputs were restored byte-for-byte from HEAD.

## Review limits

PNG samples were inspected directly, including English, CJK and Arabic. Text geometry uses resvg ink bounds; on this Mac it uses a bounded Helvetica/Heiti/Geeza font set to avoid repeated full system-font scanning. Set `OG_FONT_DIR` to measure with the production DejaVu/WenQuanYi mount during integration. Production mount was not available here. Chrome's URL policy rejected the local `file:` preview; no workaround was attempted. The local gallery `review.html` is provided for the lead. Better Design comprehension passed; its principles/review service exhausted its free-query quota. No completed DOM spacing or browser-width review is claimed for these raster cards.

## Local commit

Branch remains `codex/og-cards-v2`. Both `git add -- <scoped files>` and `git commit -F pilot-01-prototype/docs/evidence/og-cards-v2/commit-message.txt` failed with exit 128:

```
fatal: Unable to create '/Volumes/致态2TB/nexualpha-site-git/.git/worktrees/nx-wt-codex-og-cards-v2/index.lock': Operation not permitted
```

No commit was created. The changes remain in the worktree under the shared brief's extraction fallback. Include the new script, test, evidence, and **44 `public/brands/tile/*-128.png` assets** when extracting; resvg 2.6.2 cannot decode their existing WebP counterparts. Nothing was pushed or deployed.
