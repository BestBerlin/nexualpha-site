## Changed files

All changes are under `ops/academy-v3/`:

- `from-v3.mjs`, `from-v3.test.mjs`, `episodes/{E05,E09,E21}.json` and frozen `episodes/source/` inputs.
- `build.mjs`, `contract.mjs`, `style.css`, `motion.js`, `widgets.mjs`, `contact-sheets.mjs`, `render.sh`.
- `build-samples.sh`, `lint-samples.sh`, `sample-production.test.mjs`.
- `narrate.sh`, `narration-plan.mjs`, `narration-plan.test.mjs`, `README.md`, this report.
- `evidence/`: eight HTML contact sheets, eight Chrome screenshots, eight timelines/lint results, browser geometry, narration plan/blocked manifest, E05 render failure logs.

## What and why

Adapted the merged scripts without duplicating brand/cards or losing dialogue. Built E05 (130s), E09 (154s), E21 (124s) in English, plus E05 Simplified Chinese on-screen text, each in 16:9 and 9:16. Builds use separate episode paths and deterministic estimated timing.

Revised shared framing, active gestures, layered sets, 34px teaching UI, KYC rejection/correction specimens, sequential checklist ticks, transfer endpoint matching, and an animated auto-add pipe/risk indicator. E05 preserves the supplied partner name/code/link/disclosure/availability on its designed card. QR follows the kit contract and targets the source-slug lesson page. E21 has no conversion or partner data. Hook and close narration/captions are retained.

Added an offline narration handoff: the owner's exact female clone setup for Nexubo/narrator and a separate recorded friendly adult male VoiceDesign instruction for Sam. No installs, downloads, push or deployment.

## Tests (exact commands and results)

From the repository root:

- `bash ops/academy-v3/build-samples.sh` — PASS: all eight compositions/contact sheets; durations 130/154/124s.
- `npm test --prefix ops/academy-v3` — PASS: 35/35, including source dialogue/timing preservation, commercial disclosure, actual GSAP forward/reverse seeking, KYC stamps and risk-state changes.
- `bash ops/academy-v3/lint-samples.sh` — PASS: all eight HyperFrames lint runs.
- `bash -n ops/academy-v3/{narrate.sh,render.sh,build-samples.sh,lint-samples.sh}` — PASS.
- `for file in ops/academy-v3/{build,contract,from-v3,narration-plan,contact-sheets}.mjs ops/academy-v3/motion.js; do node --check "$file"; done` — PASS.
- `for ep in E05 E09 E21; do cmp "ops/academy-v3/episodes/source/$ep.json" "/Volumes/致态2TB/nx-agents/education/v3/episodes/$ep.json"; done` — PASS: frozen sources identical.
- `git diff --check` — PASS.

From `ops/academy-v3`:

- `bash narrate.sh --plan-only` — PASS: 28 lines across 28 source scenes.
- `bash narrate.sh` — BLOCKED, exit 3: Metal unavailable; blocked manifest saved, no wav delivered.
- `HYPERFRAMES_BROWSER_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' bash render.sh en episodes/E05.json` — BLOCKED, exit 1: both render attempts stop before capture with `uv_os_setpriority returned EPERM`; lint passes. No MP4 master delivered.

Visible Chrome/computer-use inspected all eight contact sheets and measured 76 scene samples. Saved screenshots and geometry document teaching UI >=34px and teaching content clear of caption areas. These are HTML timeline previews, not encoded-video/playback evidence. The full-site suite was not run: no site code changed.

## Open questions

- Lead must run narration/render scripts in a Metal/process-capable session with existing cached models, review Sam voice consistency, align actual audio, replace silent SFX, mux and inspect final playback. The 6s conversion and 4s hooks may need longer windows for natural narration.
- Restricted-language card data is preserved; only the requested en/zh-Hans versions are built. Restricted-language production remains a separate gate.
- Series-name/brand approval remains with the owner, as recorded in the source Bible.
- Sandbox denies the linked worktree's normal Git index lock. Commits use a temporary index and update only `codex/academy-v3-samples`. The ordinary index can show stale changes despite HEAD matching the files; refresh with `git reset --mixed HEAD` in a permitted local session before further staging.
