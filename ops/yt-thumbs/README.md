# NexuAlpha YouTube thumbnail renderer

Run from the repository root on macOS with PingFang SC, the existing prototype
`@resvg/resvg-js` installation, and ffmpeg on PATH. No installs or YouTube API calls.

```sh
node ops/yt-thumbs/render-thumbs.mjs ops/yt-thumbs/fixture.json ops/yt-thumbs/out/fixture-final
node --test ops/yt-thumbs/render-thumbs.test.mjs
node ops/yt-thumbs/render-thumbs.mjs /Volumes/致态2TB/nx-agents/youtube/titles-v2.json ops/yt-thumbs/out/catalogue-v2
YT_THUMB_TEST_OUT=ops/yt-thumbs/out/catalogue-v2 YT_THUMB_TEST_INPUT=/Volumes/致态2TB/nx-agents/youtube/titles-v2.json node --test ops/yt-thumbs/render-thumbs.test.mjs
```

CLI: `node ops/yt-thumbs/render-thumbs.mjs [input.json] [output-directory]`.
Defaults: bundled fixture and `ops/yt-thumbs/out/`. Input is a nonempty array of
`{id, title, thumb_main, thumb_sub, topic}`. IDs must be unique safe filenames.
Topics: btc, eth, alt, macro, us-stock, strategy, exchange; other/unknown uses `$`.
Set `YT_THUMB_FONT` to a PingFang font file if the macOS asset path differs;
set `FFMPEG` to an alternate executable. The renderer supplies the Homebrew x265
library path when invoking ffmpeg.

Outputs: 1280×720 JPEG per ID, 4×3 contact sheets (320×180 cells, 1280×540,
last sheet padded), and `manifest.json` with actual resvg text bounds, font sizes,
accent detection, date and byte counts. All JPEGs must be smaller than 1,500,000
bytes. Generated outputs are ignored by Git. Existing files with matching names
are overwritten; use a fresh directory when changing catalogue membership to
avoid stale images. Source arrays are never edited.

A conservative character-width model proposes line breaks; resvg verifies each
line using the same font and weight as the final render. Measurements at 100 px
are cached and scaled linearly. The Bitcoin glyph is drawn as a vector because
PingFang lacks that character.
Hero text starts at 170 px and shrinks to fit two lines; exceptional long inputs
may require sizes below 130 px. Subtitles start at 54 px and fit one line.
Unbreakable numerical expressions (including `11 万`) and Latin words are never
split; impossible input fails before rendering. Bearish words take precedence,
then rebound/up words, then one number/word in blue. The timestamp exclusion is
x=1060…1280, y=640…720. Faint chart texture is decorative, not historical data.

Tests include actual rendered fixture output, so render the fixture first. No
site/UI changes are made; site test scripts and dependencies remain untouched.
