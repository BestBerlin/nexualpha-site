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

Five slides show 24h liquidations, the split, the largest covered order with UTC
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
