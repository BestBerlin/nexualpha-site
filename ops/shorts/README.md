# NexuAlpha daily data Shorts

```sh
node ops/shorts/make-short.mjs --lang zh-Hans --voice --out ops/shorts/samples
node ops/shorts/make-short.mjs --lang en --out ops/shorts/samples
node --test ops/shorts/*.test.mjs
```

Requires Node 20+, ffmpeg/ffprobe (defaults `/opt/homebrew/bin/`), and the existing
`pilot-01-prototype/node_modules/@resvg/resvg-js`. Voice additionally requires macOS
`say`, an installed mainland Chinese voice (Tingting preferred, Flo fallback), or
Samantha for English. No installation, publishing, uploads, or background jobs.
Use `FFMPEG` and `FFPROBE` to select other installed binaries.
Voice selection checks the installed language and probes for actual audio frames;
an advertised voice that produces empty audio is skipped. If none work, `--voice`
fails loudly. Some restricted macOS sessions let `say` exit successfully while
writing only an empty 4096-byte AIFF header. Caption-only previews are available
without `--voice`, but do not satisfy a voiced-sample delivery requirement.

If the installed Homebrew ffmpeg cannot load `libx265.216.dylib` while an older
compatible library remains installed, run with a process-local environment:

```sh
DYLD_LIBRARY_PATH=/opt/homebrew/Cellar/x265/4.2/lib node --test ops/shorts/*.test.mjs
DYLD_LIBRARY_PATH=/opt/homebrew/Cellar/x265/4.2/lib node ops/shorts/make-short.mjs --lang zh-Hans --voice --out ops/shorts/samples
DYLD_LIBRARY_PATH=/opt/homebrew/Cellar/x265/4.2/lib node ops/shorts/make-short.mjs --lang en --out ops/shorts/samples
```

The CLI reads `https://nexualpha.com/intel/market-events.json`, using its broader
embedded funding snapshot. If that block is absent, it reads
`https://nexualpha.com/intel/funding-rates.json`. Both timestamps, and fallback
venue read timestamps, must be no older than 60 minutes and not in the future.
An existing stale or malformed block fails rather than quietly substituting data.
Missing amounts, inconsistent totals, unknown liquidation venues, invalid sides,
out-of-window largest orders, and fewer than three funding rates fail loudly.
Null embedded venue rates are unavailable, never zero.

Five slides show 24h liquidations, the split, the largest covered order with locale-specific
time, the three largest absolute funding rates in the current snapshot, and an
end card. Funding is per settlement interval; it is not a 24h extreme or an
annualized return. Different intervals are disclosed, not normalized or guessed.
Compact USD numbers round down so lower-bound labels are conservative. Longs
and positive funding are green; shorts and negative funding are red.

Output is `<UTC feed date>-<lang>/short.mp4`, `meta.json`, and `upload.txt`, with
`source.json` retaining the exact fetched inputs for review. Metadata retains feed
timestamps, sources, slide captions, and render timings. Existing nonempty output
directories are never overwritten; use a different output root for another take.
Temporary failed renders are removed. Samples are gitignored. Nothing is uploaded.

The smoke test uses fixture slides and a temporary directory, renders a 3-slide
MP4, checks its actual streams and duration with ffprobe, and removes its files.

## v2 design and samples

```sh
node ops/shorts/make-short.mjs --lang zh-Hans --out ops/shorts/samples/v2
node ops/shorts/make-short.mjs --lang en --out ops/shorts/samples/v2
node --test ops/shorts/*.test.mjs
```

Each 35-second caption-only sample includes `contact-sheet.png`, extracted from the encoded
video at **2 / 9 / 16 / 23 / 31 seconds**. Samples use fresh public feeds, never a
fixture presented as live data. Samples remain ignored by default; the v2 review
samples are explicitly included in this change. Do not upload them automatically.

The 1080×1920 layout keeps content within x=64..920 and y=48..1500, leaving the
bottom 380px and right 140px for Shorts controls. `layout.mjs` owns shared colors,
typography, actual-glyph width fitting, the site's existing NexuAlpha mark, and
hero/split/receipt/funding/end layouts. English uses bundled Inter;
Chinese uses PingFang SC. Installed font files are discovered locally; no fonts
or dependencies are downloaded at render time. The unmodified Inter font asset and
its license/source are retained in `fonts/`; no system font is installed. Wide hero
numbers are condensed horizontally while preserving their large height. The domain is always one text element.

Numbers count up and proportionate bars grow for 0.8 seconds. Slide clips overlap
for a true 0.25-second cross-fade. The overlaps extend outgoing clips instead of
shortening the slide/voice timeline. Five caption-only slides remain 35 seconds,
H.264 / AAC, 30fps. Silent AAC is included for caption-only previews.

Chinese order times use UTC+8; English uses UTC. Funding keeps signed raw rates
and available settlement intervals; missing intervals remain unknown. The bars
compare absolute rates in this snapshot, not normalized annualized returns.

Captions are at most 16 characters per line. With `--voice`, each displayed
caption is synthesized separately, its duration is measured with ffprobe, and
those exact segment boundaries drive the captions and stitched narration.
Caption-only timing is evenly distributed and is not claimed as voice sync.
If macOS `say` writes empty audio, `--voice` still fails clearly; the caption-only
render stays available for review and the lead can render voiced outside sandbox.

Homebrew loader recovery is automatic for both ffmpeg and ffprobe: first try the
inherited environment; only when dyld reports a missing library, retry with
`DYLD_LIBRARY_PATH=/opt/homebrew/Cellar/x265/4.2/lib` prepended. Other encoder errors
are not retried or concealed. The manual commands above remain useful for
standalone ffmpeg/ffprobe calls.
