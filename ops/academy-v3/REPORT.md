## Changed files

All changes are under `ops/academy-v3/`:

- `characters.mjs`, `widgets.mjs`: reusable rig and teaching components.
- `contract.mjs`, `build.mjs`, `motion.js`, `style.css`: validated episode contract, bilingual composition builder, deterministic GSAP timeline, shared tokens and separate portrait layout.
- `sample-e05.json`: hand-authored bilingual E05 KYC sample, English demo first.
- `render.sh`, `contact-sheets.mjs`, `gallery.mjs`: render handoff, contact sheets and 30-specimen component gallery.
- `*.test.mjs` (four files), `package.json`, `.gitignore`, `README.md`, `REPORT.md`.
- `evidence/`: four lint receipts, four timeline records, four HTML contact sheets, three Chrome JPG reviews, 36-frame geometry record, visual-review summary and two render failure logs.

## What and why

**Local commit blocked:** files are preserved, but `git add ops/academy-v3` failed before staging because the managed sandbox denied the Git worktree index lock. No commit, push or deployment occurred.

Built a shared HyperFrames + GSAP kit for the 24-episode academy, without changing the site or partner registry and without dependency downloads. Reused the existing official logo and Bitcoin-belly mascot rig; authored original adult-chibi Sam.

Components: Nexubo's six requested poses and expressions; Sam's five expressions/four poses; line-timed talking; antenna red/shake/warning-chip ding; study/trading/transfer sets; price board, market/limit ticket, ledger, address/network/memo form, risk meter, OHLC chart, isolated box/cross pool, identity/checklist/warning UI; permanent logo lockup, 9s opening, 4–6s close, 3–5s hook, optional disclosed conversion card and starter-path QR; highlighted captions, WebVTT and silent SFX hooks.

JSON contract: `version`, `episode`, `slug`, localized `title`, `direction`, `shots[{id,duration,set,visual_en,onscreen_text_*,antenna,ding,nexubo,sam,widgets,lines}]`, `end_hook`, `close_duration`, optional `conversion_card`. Lines and words use shot-local seconds. First shot is 6s; builder inserts the 3s brand shot. `visual_en` preserves storyboard intent; explicit widget/rig props drive deterministic visuals. Numerical teaching values are supplied props. Full field/prop documentation and commands are in `README.md`.

E05 is 120 seconds / 3,600 frames, silent, with estimated word timing. Built en and zh-Hans in 1920×1080 and separately composed 1080×1920. SFX are intentional silent placeholders. HTML contact sheets and Chrome JPGs are not MP4 frame evidence.

## Tests (exact commands and results)

Run from `ops/academy-v3/` unless stated otherwise:

- `npm test` — 22 passed, 0 failed. Covers complete rig matrices, timing/text validation, widget props/domains, runtime execution and reverse seeking, warning beat, caption gaps/highlights, conversion disclosure and exact QR output.
- `node build.mjs sample-e05.json en` and `node build.mjs sample-e05.json zh-Hans` — passed; four 120s / 3,600-frame compositions, WebVTT and SFX cue sidecars generated.
- `DO_NOT_TRACK=1 node_modules/.bin/hyperframes lint build/en-landscape --json` — passed, 0 errors / 0 warnings.
- `DO_NOT_TRACK=1 node_modules/.bin/hyperframes lint build/en-portrait --json` — passed, 0 errors / 0 warnings.
- `DO_NOT_TRACK=1 node_modules/.bin/hyperframes lint build/zh-Hans-landscape --json` — passed, 0 errors / 0 warnings.
- `DO_NOT_TRACK=1 node_modules/.bin/hyperframes lint build/zh-Hans-portrait --json` — passed, 0 errors / 0 warnings. Receipts saved in `evidence/lint-*.json`.
- `node contact-sheets.mjs en` and `node contact-sheets.mjs zh-Hans` — passed; four HTML contact sheets generated.
- `node gallery.mjs` — passed; 30 widget/character/set specimens generated.
- `bash -n render.sh`, `node --check build.mjs`, `node --check motion.js`, `node --check gallery.mjs`, `node --check contact-sheets.mjs` — all passed.
- Repository root: `git diff --check` — passed.
- `python3 -m http.server 4571 --bind 127.0.0.1 --directory ops/academy-v3` from repository root, then Chrome + computer-use review — 36 frames across both locales/formats; correct locale, no measured teaching/cast/caption overlap after the spacing fix. Evidence: `browser-geometry.json`, `visual-review.json`, `contact-chrome-*.jpg`. Preview server stopped after review.
- `HYPERFRAMES_BROWSER_PATH=/Users/bestberlin/.cache/hyperframes/chrome/chrome-headless-shell/mac_arm-152.0.7977.30/chrome-headless-shell-mac-arm64/chrome-headless-shell bash render.sh en` — exit 1 before capture for both formats: `uv_os_setpriority returned EPERM (operation not permitted)`. No MP4 master was produced. Exact renderer logs are saved.

No site-wide application tests were run: application code and package scripts were unchanged.

## Open questions

- Lead must stage and commit the preserved directory on `codex/academy-template-v3` in a session with Git metadata write access. Exact error: `Unable to create /Volumes/致态2TB/nexualpha-site-git/.git/worktrees/nx-wt-codex-academy-template-v3/index.lock: Operation not permitted`. This session cannot request expanded permissions; no alternate Git index/ref workaround was used. `evidence/git-add.log` records the failed command. A Lore-compatible proposed message is in `COMMIT-MESSAGE.txt`.

- Lead must render in a runtime permitting HyperFrames process priority/browser launch: `bash render.sh en sample-e05.json`; optionally `bash render.sh zh-Hans sample-e05.json`. Select an existing approved browser via `HYPERFRAMES_BROWSER_PATH`. This also generates MP4-derived contact sheets on success.
- The incoming episode directory was absent. Lead should adapt those scripts to the documented JSON contract; no natural-language storyboard-to-image generation is implied.
- Real voice, aligned words, original/licensed SFX, commercial-card approval, font/license review and final playback/mobile/art-direction acceptance remain production gates. Only en/zh-Hans were visually checked; RTL layout support is prepared, but Arabic production validation is pending.
