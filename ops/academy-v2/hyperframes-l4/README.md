# NexuAlpha Academy · Level 4 HyperFrames pilot

A local, silent Chinese visual pilot based on the supplied `04-signup-and-kyc.json`. Sources are preserved in `script.json`; their editorial claims and the referral destination have not been independently re-approved here. No account login, paid service, upload or publication is used.

**Status:** authoring and static lint complete; HTML hero frames reviewed in existing Chrome. **The two MP4 masters have not been rendered, and the requested local commit is blocked.** The managed shell sandbox rejects HyperFrames cache creation, process-priority changes and headless Chrome's Mach bootstrap registration. Logs in `evidence/` preserve these failures. `git add ops/academy-v2/hyperframes-l4` also fails creating `/Volumes/致态2TB/nexualpha-site-git/.git/worktrees/nx-wt-codex-hyperframes-pilot/index.lock` with `Operation not permitted`, despite the declared common Git directory write root. No alternate index, Git metadata relocation, commit or ref update was used. Browser layout/contrast/motion checks did not run and must not be read as passes.

Placement uses the brief's permitted fallback: `ops/academy-v2/hyperframes-l4/` in branch `codex/hyperframes-pilot`. The requested education output directory is outside the permitted worktree/write scope. Existing v1 assets and the application are untouched.

## Reproduce

All commands below run from this directory, on macOS with Node >=22, Chrome and FFmpeg. Dependencies are pinned by `package-lock.json`: HyperFrames 0.8.149, GSAP and QRCode. These are local project installs.

```sh
npm ci --cache .npm-cache
npm run build
npm test
export DO_NOT_TRACK=1
export DYLD_LIBRARY_PATH=/opt/homebrew/Cellar/x265/4.2/lib
npx --no-install hyperframes lint landscape --json
npx --no-install hyperframes lint portrait --json
npx --no-install hyperframes check landscape
npx --no-install hyperframes check portrait
npm run render
npm run contact-sheets -- --video
```

`render.mjs` requests high quality, 30fps, two workers and strict lint. Outputs are `renders/landscape.mp4` (1920×1080) and `renders/portrait.mp4` (1080×1920). `--video` contact sheets extract nine hero frames from those actual masters with FFmpeg, then tile them into PNGs. These commands require a runtime that permits launching the capture browser. Do not weaken the sandbox to make them run.

If an existing approved Chrome binary is available, HyperFrames officially accepts `HYPERFRAMES_BROWSER_PATH=/absolute/path/to/binary`. This bypasses a missing browser installation, **not** the sandbox's process restrictions. The cached headless binary was selected for the final measured attempts and still failed.

To preview temporarily in HyperFrames Studio:

```sh
DO_NOT_TRACK=1 npx --no-install hyperframes preview landscape --foreground --port 4567
DO_NOT_TRACK=1 npx --no-install hyperframes preview portrait --foreground --port 4568
```

Use the Studio URL printed by the CLI (`/#project/landscape` or `/#project/portrait`). Stop with Ctrl+C; no persistent Mac service is installed. For offline frame review, open `evidence/contact-landscape.html` or `evidence/contact-portrait.html` in Chrome. Both use local GSAP and assets; each iframe seeks synchronously through the actual authored timeline via `?at=<seconds>`.

## Components and motion

`DESIGN.md` fixes the supplied dark palette and PingFang SC / Inter typography. `components.mjs` exports intro, kinetic title, generic phone, checklist, comparison, definition, warning, moving-dot flow, CTA end card and timed caption groups. `motion.js` registers one paused GSAP timeline with HyperFrames. The intro is exactly three seconds. A blue shutter masks each scene cut over 12 frames (six in / six out), with no plain scene fades. There is no audio track yet, so “beat” means a scene-boundary editorial accent, not analyzed music beats.

Background grid and depth ring move slowly; entrances use restrained back, expo and power easing. The phone focuses a field, reveals typed demonstration data, moves a toggle, changes red rejection to green **资料已修正** (not a claim of KYC approval), and presses the submit button. All events are deterministic and seekable. No real exchange UI or personal data appears. The end card uses a real QR encoding `https://www.okx.com/join/nexu888`, the supplied code and adjacent disclosure. Region eligibility and current partner-link approval remain editorial checks before release.

Portrait changes layout, typography, spacing, phone sizing and caption position rather than cropping landscape. Its bottom 300px are reserved for platform controls. Caption budgets are 16 Chinese characters landscape / 12 portrait; word spans highlight only within supplied start/end intervals. Punctuation is preserved. Empty intervals display no caption; previous groups are hard-cleared.

## Replace estimated narration timing

The generated pilot is **88.2 seconds / 2,646 frames**, including the three-second intro. Each estimated scene duration is:

`ceil(max(min_s, Han-character-count / 4.5) + 0.4 seconds, to a 30fps frame)`.

Estimated word timing uses `Intl.Segmenter('zh')` and character-weighted intervals. It is a placeholder, not forced-alignment evidence. The last 0.4 seconds of every estimated scene are caption-free.

Copy `timing.json` to `timing-real.json`, set each scene's duration from `max(min_s, narration duration + 0.4)`, and replace `words` with the actual aligned tokens:

```json
{
  "version": 1,
  "fps": 30,
  "introDuration": 3,
  "scenes": [
    {
      "id": "scene-1",
      "duration": 10.4,
      "words": [
        { "text": "KYC", "start": 0.0, "end": 0.55 },
        { "text": "又被拒了", "start": 0.55, "end": 1.6 }
      ]
    }
  ]
}
```

The example is abbreviated: a real file requires all eight ordered scenes and the full narration. Word times are **local to each scene**, excluding the intro; the build adds scene offsets. Preserve all spoken text. `timing.schema.json` documents the file; `loadTiming` also enforces exact IDs/count, minima, finite positive duration, frame rounding, ordered/nonoverlapping words and scene bounds. An explicitly missing or invalid file fails rather than silently reverting to estimates. Omitted word arrays are estimated and should be replaced before narrated delivery.

```sh
node build.mjs timing-real.json
node contact-sheets.mjs
npm run render
```

Prepare a 48kHz narration WAV with each scene padded to its accepted duration and concatenated in scene order, **excluding the intro**. This alignment matters: simply concatenating raw utterances will drift where a scene has a minimum-duration hold. The current target narration track is 85.2 seconds; real timing will change it. Drop that assembled file into the project, then:

```sh
node mux.mjs narration.wav
```

The mux helper preserves silent masters, delays narration by three seconds, pads the tail, normalizes to -14 LUFS and produces AAC 48kHz narrated derivatives. It rejects audio longer than the scene track and never silently truncates narration. The helper has syntax verification only; audio integration is untested because no real WAV or masters are available.

## Contact sheets and measured render attempts

- [Landscape HTML](evidence/contact-landscape.html), [PDF](evidence/contact-landscape.pdf), [PNG](evidence/contact-landscape-page1.png).
- [Portrait HTML](evidence/contact-portrait.html), [complete two-page PDF](evidence/contact-portrait.pdf), [first-page PNG](evidence/contact-portrait-page1.png).

The PDFs were exported from existing Chrome with background graphics enabled and headings/footers disabled. They are real browser renders of **HTML timeline hero frames**, not frames extracted from MP4. The landscape PNG contains all nine frames; portrait PNG contains only page one, while the PDF contains all nine.

Measured on Apple M4 Pro, 12 CPU cores, 24GB RAM, macOS, Node 26.0.0: the final cached-browser render attempts failed before capture after **0.4s landscape / 0.4s portrait**. These are failure latencies, not render throughput. Successful full-master render time is unknown. See `evidence/render-times.json`, `render-*.log`, `check-landscape.log` and `inspect-portrait.log`. No broadcast-quality or completed-master claim is made.
