## Changed files

All changes are under `ops/academy-v2/hyperframes-l4/`: design/README, copied script and brand assets, pinned local package manifests, reusable HTML components, CSS/GSAP motion, build/render/contact-sheet/mux tools, timing loader/schema/JSON, two composition HTML files, tests and evidence.

## What and why

Built separately composed 1920×1080 and 1080×1920 HyperFrames sources with a three-second intro, kinetic headings, phone micro-interactions, staggered checklist ticks, comparison, warning, moving-dot flow, CTA/QR/disclosure and per-word highlighted captions. Estimated duration: 88.2 seconds at 30fps. The strict loader accepts future real scene/word timing without silently discarding it.

Used the brief's permitted worktree fallback. No login, paid service, upload or publication. Contact sheets are browser-rendered HTML hero frames, not encoded-video evidence:

- [Landscape PDF](evidence/contact-landscape.pdf) / [PNG](evidence/contact-landscape-page1.png).
- [Portrait complete PDF](evidence/contact-portrait.pdf) / [first-page PNG](evidence/contact-portrait-page1.png).

**Incomplete:** neither silent MP4 master exists, and changes remain uncommitted on `codex/hyperframes-pilot`. Rendering and automated browser audits are blocked by sandbox permissions. Broadcast quality and successful render time are unverified.

## Tests (exact commands and results)

Commands ran from this project directory unless stated otherwise.

- `npm run build` — exit 0; both native composition sizes, 88.2s / 2,646 frames.
- `npm test` — exit 0; 11 passed, 0 failed.
- `DO_NOT_TRACK=1 node_modules/.bin/hyperframes lint landscape --json` and `DO_NOT_TRACK=1 node_modules/.bin/hyperframes lint portrait --json` — each exit 0, zero errors/warnings.
- `node_modules/.bin/prettier --check build.mjs components.mjs contact-sheets.mjs render.mjs mux.mjs motion.js style.css timing.mjs timing.schema.json timing.test.mjs build.test.mjs package.json DESIGN.md README.md` — exit 0, all files formatted.
- `for file in build.mjs components.mjs contact-sheets.mjs render.mjs mux.mjs motion.js; do node --check "$file" || exit 1; done` — exit 0.
- `npm run contact-sheets` — exit 0; two HTML contact sheets. PDFs exported through existing Chrome and visually reviewed.
- `sips -s format png evidence/contact-landscape.pdf --out evidence/contact-landscape-page1.png` and equivalent portrait command — exit 0; PDFs rasterized for inspection.
- `DO_NOT_TRACK=1 DYLD_LIBRARY_PATH=/opt/homebrew/Cellar/x265/4.2/lib node_modules/.bin/hyperframes check landscape` — exit 1; Chrome Mach bootstrap permission denied (1100). Layout/contrast/motion results are empty, not passes.
- `DO_NOT_TRACK=1 DYLD_LIBRARY_PATH=/opt/homebrew/Cellar/x265/4.2/lib node_modules/.bin/hyperframes inspect portrait --samples 15` — exit 1; same Chrome restriction.
- `HYPERFRAMES_BROWSER_PATH=/Users/bestberlin/.cache/puppeteer/chrome-headless-shell/mac_arm-155.0.8059.39/chrome-headless-shell-mac-arm64/chrome-headless-shell npm run render` — exit 1; both formats hit `uv_os_setpriority returned EPERM` before capture. Final attempt latency: 0.4s each; not render throughput. Initial default-browser attempts also failed creating the browser cache outside writable scope.
- `git diff --check` (worktree root) — exit 0; the new directory is still untracked, so this checks only the existing index. Source formatting and syntax checks above cover the new files.
- `git add ops/academy-v2/hyperframes-l4` (worktree root) — exit 128; cannot create `/Volumes/致态2TB/nexualpha-site-git/.git/worktrees/nx-wt-codex-hyperframes-pilot/index.lock`: `Operation not permitted`. No commit was created.

## Open questions

- The managed permission profile must allow normal writes to the actual worktree Git index and branch metadata before the authorized local commit can be made. Once available: `git add ops/academy-v2/hyperframes-l4`, then commit on `codex/hyperframes-pilot` using Lore trailers.

- Rendering requires an execution environment permitted to launch the existing Chrome capture process. Then run `npm run render`, inspect/probe both masters and `npm run contact-sheets -- --video`.
- Real narration WAV and aligned word/scene timing are pending, as expected by the brief. Mux integration is syntax-checked only.
- Full motion playback, automated geometry/contrast verification and editorial/partner eligibility review remain before release.
