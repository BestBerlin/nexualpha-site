## Changed files

Uncommitted: the sandbox blocked the required Git index write. All changes are under `ops/brand/mascot/`: generators and checks (`build.py`, `export.mjs`, `verify.mjs`, `verify-exports.py`), `board.html`, `idle.html`, `idle.js`, `style.css`, `manifest.json`, documentation, 19 SVGs in `svg/`, 20 PNG exports, eight sticker SVG/PNG pairs, local GSAP 3.15.0 and verification evidence.

## What and why

Board: `ops/brand/mascot/board.html`. Idle demo: `ops/brand/mascot/idle.html`.

Delivered Direction A as original editable vector construction: rounded brand-blue monster, large asymmetric eyes, tiny limbs, gold belly coin and one curved mood antenna. Includes four views, six expressions and six teaching poses; semantic mood mapping; dark/light presentation stages; 1600 px exports; eight transparent 512 × 512 stickers. Separate rig groups allow future GSAP animation. The local GSAP idle loop is exactly two seconds with bounce, blink, light pulse, pause/resume and reduced-motion support.

Name proposals: Nexubo, Bopinu, Pibolu. Exact-name web screening found no well-known brand/character collision in returned results, with incidental text/handle/domain occurrences documented in `DESIGN.md`. This is not trademark clearance or verified suitability in every language.

PNG boards are vector-composed presentations, not screenshots of HTML. No paid APIs, large downloads, production changes, partner-data edits, push or deployment.

## Tests (exact commands and results)

Run from the repository root unless stated otherwise:

- `python3 ops/brand/mascot/build.py` — PASS; 16 standalone SVGs, layered model sheet, manifest and HTML generated.
- `node ops/brand/mascot/export.mjs` — PASS; 20 PNG exports at 1600 px plus eight 512 px sticker PNGs and corresponding SVGs.
- `node ops/brand/mascot/verify.mjs` — PASS; asset counts, layer IDs, SVG parsing, mood colors, local HTML references, actual GSAP timeline/control logic and reduced-motion transitions. JSDOM geometry stubs mean this is not browser-rendering evidence.
- `python3 ops/brand/mascot/verify-exports.py` — PASS; dimensions, RGBA transparency and clipping-safe padding.
- `node --check ops/brand/mascot/idle.js` — PASS.
- `node --check ops/brand/mascot/export.mjs` — PASS.
- `cd pilot-01-prototype && npm test > ../ops/brand/mascot/evidence/site-tests.log 2>&1` — FAIL, exit 1. Typecheck passed; test:sites: 1,137 tests / 1,129 pass / 3 fail / 5 skipped. Later chained stages did not run. Failures cite missing `dist/news-ssr/entry-server.js`, `dist/client/index.html` and prerender build inputs. Names do not match the supplied historical 57-failure list; no baseline-equivalence claim. Full output saved.
- `python3 -c 'from playwright.sync_api import sync_playwright; p=sync_playwright().start(); b=p.chromium.launch(); print("Chromium launch OK"); b.close(); p.stop()'` — BLOCKED; sandbox Mach-port permission failure and SIGTRAP. Computer-use also refused the file URL under its URL policy; no workaround attempted.
- `git diff --check` — PASS (tracked-file check; the new asset directory remains untracked).
- `git add ops/brand/mascot` — BLOCKED: `fatal: Unable to create '/Volumes/致态2TB/nexualpha-site-git/.git/worktrees/nx-wt-codex-mascot-a/index.lock': Operation not permitted`. No files staged and no local commit created. Branch confirmed as `codex/mascot-a`.

Dark/light raster boards and sticker contact sheet were visually inspected. Browser layout at 390 / 768 / 1440 and real SVG motion remain unverified.

## Open questions

- Lead review: choose the final name and complete native-language/trademark review.
- Lead QA: verify HTML layout and actual SVG motion in a permitted browser, including narrow widths and reduced motion. Current PNG boards are not HTML screenshot evidence.
- Site suite: supply/build missing application artifacts and rerun if full-site green evidence is required. Existing application sources and assertions were untouched.

- Local commit: restore permitted Git metadata writes for this worktree, then run `git add ops/brand/mascot && git diff --cached --check && git commit -F ops/brand/mascot/COMMIT-MESSAGE.txt` on `codex/mascot-a`. No permission escalation or alternative index was attempted.
