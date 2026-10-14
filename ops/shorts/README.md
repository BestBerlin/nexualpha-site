# NexuAlpha daily data Shorts v3

Run from this worktree with Node 20+, existing `@resvg/resvg-js`, and installed ffmpeg/ffprobe. No installs, model downloads, publishing or uploads occur.

```sh
./ops/shorts/make-daily.sh
./ops/shorts/make-daily.sh --locales en,vi --out ops/shorts/samples/v3-final
./ops/shorts/make-daily.sh --locales ar --out ops/shorts/samples/rtl-review
node --test ops/shorts/*.test.mjs
node ops/shorts/verify-output.mjs ops/shorts/samples/v3-final/2026-10-12
```

The default locales are en, es, pt-BR, vi, id, tr, ru and zh-Hans; Arabic is available explicitly for RTL review. All copy comes from `strings.mjs`. Captions retain complete sentences and wrap visually; decimal points do not split sentences. English is the master. Native review of translations remains a release responsibility.

One command fetches the public market feed once (and the funding fallback once if needed). Existing strict validation checks both timestamps independently, rejects data older than 60 minutes, future timestamps, inconsistent totals, unavailable rates, invalid sides and out-of-window largest orders. A malformed embedded funding block fails rather than being replaced. Exact inputs are retained in `source.json`. Singapore day identifies the daily package and locale metadata; no historical observation is presented as today's data.

Output: `<out>/<SGT-feed-date>/<locale>/meta.json`, `portrait/{short.mp4,poster.png,captions.srt,contact-sheet.png}` and `square/{short.mp4,poster.png,captions.srt,contact-sheet.png}`. Videos are 1080×1920 / 1080×1080, H.264/AAC at 30 fps, nominally 30 seconds. Existing packages are preserved; use another output root for another take. A per-day `.lock` file blocks overlapping cron/manual renders until the active run exits; inspect the previous job before removing a leftover lock. Failed staged renders are removed; nothing uploads automatically. Generated samples remain ignored.

Metadata contains localized title/description/hashtags and CTA per platform (`youtube`, `tiktok`, `x`, `telegram`). Links use the site's canonical locale routing (English `/liquidations`, Indonesian `/id-id/liquidations`) and point to the locale's liquidation page with `?src=<platform>-short`; no partner codes or referral links appear. Long/short liquidation totals are covered-venue lower bounds; funding is a raw per-settlement-interval snapshot, not normalized returns or 24-hour extremes.

Nexubo reuses the academy rig with scene-specific poses and expressions below the giant numbers. Its antenna is red when covered 24h liquidations reach $100M and green below that editorial animation threshold. Green is an animation state, not a market safety claim. Funding sign retains its own red/green meaning. The top-left mark and NexuAlpha wordmark persist. Number sizing uses actual glyph measurement and reduces font size without horizontal scaling. Portrait content stays within x=64..920 / y=48..1780, reserving room for Shorts controls; square is independently composed within x=64..1016 / y=48..1016.

Each locale also has portrait/square HTML previews with the existing local GSAP runtime, a paused seekable `window.__timelines.shorts` timeline, and Hyperframes scene metadata. Open with `?at=12` to review a settled frame. These previews show settled numbers; the MP4 renderer independently applies deterministic 0.8s count-up/host entrance and 0.25s crossfades. Poster images use the settled first slide; SRT timestamps follow actual slide/audio durations.

## Voiceover and music (every locale, default on)

```sh
./ops/shorts/make-daily.sh --locales en,vi --out ops/shorts/samples/voiced
./ops/shorts/make-daily.sh --no-voice --out /tmp/layout-draft     # layout drafts only: silent, marked publishable:false
node ops/shorts/audio-gate.mjs <file.mp4> --platform youtube        # exit 3 = blocked
```

Owner rule 2026-10-14: every published video has a natural voiceover in its locale plus light background music, and passes the audio gate (audio stream, mean volume >= -30 dB, <= 40% silent via silencedetect). English uses the owner's Qwen3-TTS Base 8bit clone of `/Volumes/致态2TB/nx-agents/education/v2/voice-en-master-reference.wav`; other locales use `ops/shorts/voice/voice.py` (Qwen3-TTS CustomVoice "Serena" for zh-Hans, VoxCPM2 locale clones for es, pt-BR, vi, id, tr, ru, ar). The music bed (`ops/shorts/voice/music_bed.py`, self-synthesised, royalty-free) is ducked under the voice and the mix is normalised to -16 LUFS. No macOS voice substitution or downloads. `SHORTS_TTS_PYTHON` / `SHORTS_LOCALE_TTS_PYTHON` select provisioned Pythons; missing modules, models, references, or oversized narration fail clearly. Voiced output must stay within 25–35 seconds; narration is measured rather than silently accelerated.

For deterministic offline samples, clearly marked as fixtures:

```sh
./ops/shorts/make-daily.sh --locales en,vi --fixture ops/shorts/fixtures/market.json --out ops/shorts/samples/offline
```

Fixtures validate relative to their recorded timestamp, use a `-fixture` directory suffix and `dataMode: fixture`. They never constitute live-data evidence. `make-short.mjs --lang LOCALE` remains available for one portrait render. `FFMPEG` and `FFPROBE` select installed binaries; the renderer retains its process-local Homebrew x265 loader recovery.

Revision 2 uses the canonical academy Nexubo poses as a large host below the metrics, with a gentle entrance scale-in/bob. Each scene shares one trader explanation between its frame, narration and SRT; final cards show the domain and one CTA with Nexubo waving. Fine print is omitted from all locales and platform descriptions by owner direction. Review samples: `./ops/shorts/make-daily.sh --locales en,vi,ar --out ops/shorts/samples/v3-r2`.
