# NexuAlpha academy episode engine

Local Python 3 / Pillow / NumPy renderer, ffmpeg H.264/AAC encoding, macOS `say` narration. No upload, service, package installation or partner-data mutation. Run commands from the repository root. Tested on the installed macOS fonts and binaries; this is a local production tool, not a cross-platform font bundle.

## Run

```sh
python3 -c 'import PIL, cv2, numpy, qrcode'
python3 ops/academy/engine.py ops/academy/episodes/10-check-network-before-withdraw.json --out ops/academy/samples/narrated
# English uses Samantha and English screen copy, with its own measured timing:
python3 ops/academy/engine.py ops/academy/episodes/10-check-network-before-withdraw.json --out ops/academy/samples/english --locale en
python3 -m unittest discover -s ops/academy -p 'test_*.py' -v
# After rendering the diagnostic reference: inspect streams, fully decode, and verify the encoded QR:
python3 ops/academy/verify_samples.py
```

`--preview-only` prepares audio/captions and contact sheets without encoding video. `--market US` supplies an explicit territorial context to the existing site gate. Supported spoken locales are `zh-Hans` (Tingting, rate 205) and `en` (Samantha, rate 165). Both language tracks and sentence captions are prepared; videos use the selected language. Listen and tune speech rate in `plan()` if a future script needs different pacing.

Empty speech output is an error, even if `say` exits successfully. This execution environment produced empty Tingting **and** Samantha audio. The committed reference under `samples/diagnostic/` is consequently **INCOMPLETE_SILENT_DIAGNOSTIC**: visibly watermarked “SILENT VISUAL REVIEW”, silent AAC, estimated durations, `*-estimated.srt`, and `diagnostic-timing.json`. It does not prove measured narration or sentence synchronization. Reproduce it explicitly:

```sh
python3 ops/academy/engine.py ops/academy/episodes/10-check-network-before-withdraw.json --out ops/academy/samples/diagnostic --diagnostic-silent
```

Use a fresh output directory for a narrated render; diagnostic timing cannot be reused as narrated timing. All outputs are restricted to this checkout, consistent with this task's write scope. Copying to the external education sample directory was excluded by the assigned checkout-only scope.

## Script format

JSON object with `meta` and a nonempty `scenes` array. `meta` fields:

- `level`: positive integer; `slug`: lowercase URL-safe hyphenated name.
- `title_zh`, `title_en`: episode titles; `next_title_zh`, `next_title_en`: explicit next episode titles.
- `cta`: `{ "kind": "neutral", "partner": null }` or `{ "kind": "partner", "partner": "<existing feed slug>" }`.
- Optional `sources` (original URLs) and `source_note` (claim boundaries and provenance).

Each scene contains nonempty `voice_zh`, `voice_en`, `title`, `sub`, optional `title_en`, `sub_en`, finite positive `min_s`, and `visual: { "type": "...", "params": {...} }`. English renders should supply English title/sub and `*_en` component labels. The reference includes these.

Normal timing: synthesize every sentence separately, measure PCM duration with ffprobe, and start captions at that audio boundary. Each scene lasts `ceil(max(min_s, sum(sentence_seconds) + 0.6) * 30) / 30` seconds. Intro is 3 seconds and end card is 7 seconds. Captions retain original text while spoken `USDT` becomes “U S D T” and Chinese Memo/Tag become spoken Chinese terms. Minimum visible type is 34px at the final export resolution; overflowing text fails instead of silently clipping or shrinking below the minimum.

## Components

All components use eased staged reveals and/or continuing subtle motion; none is a static screenshot. Portrait uses a tall content region and components choose layouts from available bounds.

| Type | Parameters |
| --- | --- |
| `flow` | `labels` (two platform labels) |
| `phone-mock` | `fields` (label/value pairs); generic illustrative UI |
| `checklist` | `items` (strings) |
| `compare-table` | `columns` (two headers), `rows` (label, left value, right value triples) |
| `warning-card` | `title`, `body` |
| `number-counter` | `value`, `label`, optional `prefix`, `suffix` |
| `timeline` | `events` (strings) |
| `split-choice` | `left`, `right`, `left_caption`, `right_caption` |
| `quote` / `definition` | `text`, optional `label` |

Component parameter details/defaults live in `visuals.py`. Localized parameters use `_en` variants for English; all authored text should be reviewed before release. Source imagery is the existing round SVG, rasterized from its actual path geometry without installing an SVG renderer.

## Commercial boundary

`cta.mjs` reads `buildPartnersFeed()` (the site's `/intel/partners.json` source) and `isPartnerPromotableIn()`. No invite code, registration URL or share is handwritten. Unknown/missing partners, neutral scripts, territorial restrictions, and `ru`, `ar`, `zh-Hant`, `ur`, `uk` fail closed. Invite codes appear only in the end card, alongside commission disclosure and the investment disclaimer. Feed shares are fractions, displayed as percentages; null omits the percentage. QR points only to `https://nexualpha.com/zh-hans/starter/<slug>?src=academy-video`, not a direct exchange registration URL. The reference episode is neutral and shows no partner code or rebate claim.

## Outputs and review

For each selected language: `master-<locale>.mp4` (1920×1080), `vertical-<locale>.mp4` (1080×1920), plus `-captions` variants. Both are 30fps H.264/yuv420p + AAC. Also: both language WAV/SRT tracks, timing JSON, SHA-256 script fingerprint, render manifest, landscape/portrait contact sheets, and 1280×720 `poster.jpg` in the same dark brand style. Sentence synthesis work files are ignored. `samples/diagnostic/ffprobe.json` records the actual reference streams. Review rendered videos (including speech and transitions), not just the contact sheets, before publication.

Tests cover schema, measured waveform scheduling, sentence boundaries, CTA policy, fractional rebate display, watermark persistence, text fit and component motion. No site files are changed, and no site build or deployment is performed.

## Season 1 writer conversion and batch rendering

Approved writer inputs are converted without changing narration, page copy, source URLs,
review notes or sensitive flags. Original CTA kind is retained as `original_kind`; `none`
stays `none`, a named partner becomes `partner`, and other actions become `neutral`.
Visual types stay unchanged; writer parameter keys are retained alongside engine aliases.
Embedded writer `cta_card` codes are retained as provenance but are never rendered.
Next-level titles are resolved from the complete input set, including the new level-10 order.
Timeline dates/events remain complete, and string phone fields receive no invented values.

```sh
python3 ops/academy/convert_writer_script.py /Volumes/致态2TB/nx-agents/education/scripts-final --out ops/academy/episodes
python3 -m unittest discover -s ops/academy -p 'test_*.py' -v
# Lead: full 30fps narrated zh-Hans exports, fresh output separate from diagnostics
bash ops/academy/render_season.sh
# Optional checkout-local destination
bash ops/academy/render_season.sh ops/academy/samples/season1-narrated-review
python3 ops/academy/verify_season.py --out ops/academy/samples/season1-narrated
```

The local season-1 samples are silent diagnostic reviews. `--diagnostic-frame-rate 1`
samples animation once per second and encodes held frames at 30fps; narrated/default
renders still draw every frame at 30fps. This lowers diagnostic cost without changing
narration timing, final frame size, minimum font sizes or preflight coverage. The manifest
records `motion_sample_fps` and estimated timing. These samples do not prove narrated
pacing or full-rate motion. Generate each diagnostic with:

```sh
for episode in ops/academy/episodes/[0-9][0-9]-*.json; do
  python3 ops/academy/engine.py "$episode" --out "ops/academy/samples/season1/$(basename "$episode" .json)" --diagnostic-silent --diagnostic-frame-rate 1
done
python3 ops/academy/verify_season.py
```

All twelve samples include four MP4 variants, contact sheets, a poster, estimated SRTs,
script fingerprints, manifests and ffprobe/full-decode/encoded-QR evidence. PCM WAV
tracks are local generated intermediates and ignored by git. Neutral and `none` end
cards link to their lesson page; QR links include `?src=academy-video`. Level 8 includes
the brief-approved Bitget partner-domain note. Partner/code/share still resolve at render
time through `cta.mjs`, using the repository source of `/intel/partners.json`; no partner
registry data is modified.

Encoder inputs are all closed before waiting for completion; finalization has a 60-second
timeout and removes partial outputs on failure. Restart a failed diagnostic in the same
output directory; narrated renders must use a separate directory.
