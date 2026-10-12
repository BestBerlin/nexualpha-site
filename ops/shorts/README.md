# NexuAlpha daily data Shorts v3

Run from this worktree with Node 20+, existing `@resvg/resvg-js`, and installed ffmpeg/ffprobe. No installs, model downloads, publishing or uploads occur.

```sh
./ops/shorts/make-daily.sh
./ops/shorts/make-daily.sh --locales en,vi --out ops/shorts/samples/v3-review
./ops/shorts/make-daily.sh --locales ar --out ops/shorts/samples/rtl-review
node --test ops/shorts/*.test.mjs
node ops/shorts/verify-output.mjs ops/shorts/samples/v3-review/2026-10-12
```

The default locales are en, es, pt-BR, vi, id, tr, ru and zh-Hans; Arabic is available explicitly for RTL review. All copy comes from `strings.mjs`. Captions retain complete sentences and wrap visually; decimal points do not split sentences. English is the master. Native review of translations remains a release responsibility.

One command fetches the public market feed once (and the funding fallback once if needed). Existing strict validation checks both timestamps independently, rejects data older than 60 minutes, future timestamps, inconsistent totals, unavailable rates, invalid sides and out-of-window largest orders. A malformed embedded funding block fails rather than being replaced. Exact inputs are retained in `source.json`. UTC feed date identifies the daily package; no historical observation is presented as today's data.

Output: `<out>/<UTC-feed-date>/<locale>/meta.json`, `portrait/{short.mp4,poster.png,captions.srt}` and `square/{short.mp4,poster.png,captions.srt}`. Videos are 1080×1920 / 1080×1080, H.264/AAC at 30 fps, nominally 30 seconds. Existing packages are preserved; use another output root for another take. Failed staged renders are removed; nothing uploads automatically. Generated samples remain ignored.

Metadata contains localized title/description/hashtags and CTA per platform (`youtube`, `tiktok`, `x`, `telegram`). Links point to the locale's liquidation page with `?src=<platform>-short`; no partner codes or referral links appear. Long/short liquidation totals are covered-venue lower bounds; funding is a raw per-settlement-interval snapshot, not normalized returns or 24-hour extremes.

Nexubo reuses the existing point-right mascot rig alongside the giant numbers. Its antenna is red when covered 24h liquidations reach $100M and green below that editorial animation threshold. Green is an animation state, not a market safety claim. Funding sign retains its own red/green meaning. The top-left mark and NexuAlpha wordmark persist. Number sizing uses actual glyph measurement and reduces font size without horizontal scaling. Portrait content stays within x=64..920 / y=48..1500, reserving room for Shorts controls; square is independently composed within x=64..1016 / y=48..1016.

Each locale also has portrait/square HTML previews with the existing local GSAP runtime, a paused seekable `window.__timelines.shorts` timeline, and Hyperframes scene metadata. Open with `?at=12` to review a settled frame. These previews show settled numbers; the MP4 renderer independently applies deterministic 0.8s count-up/host entrance and 0.25s crossfades. Poster images use the settled first slide; SRT timestamps follow actual slide/audio durations.

## Optional English clone narration

```sh
./ops/shorts/make-daily.sh --locales en,vi --voice --out ops/shorts/samples/voiced
```

Only English is voiced. Uses the owner's installed Qwen3-TTS Base 8bit model in clone mode and `/Volumes/致态2TB/nx-agents/education/v2/voice-en-master-reference.wav`, with the exact reference transcript from OWNER-NOTE.txt. No macOS voice substitution or downloads. `SHORTS_TTS_PYTHON` selects an already provisioned Python; missing module, local model, reference, or oversized narration fails clearly. Full voiced output must stay within 25–35 seconds; narration is measured rather than silently accelerated. Clone playback and consistency require review on the provisioned voice environment.

For deterministic offline samples, clearly marked as fixtures:

```sh
./ops/shorts/make-daily.sh --locales en,vi --fixture ops/shorts/fixtures/market.json --out ops/shorts/samples/offline
```

Fixtures validate relative to their recorded timestamp, use a `-fixture` directory suffix and `dataMode: fixture`. They never constitute live-data evidence. `make-short.mjs --lang LOCALE` remains available for one portrait render. `FFMPEG` and `FFPROBE` select installed binaries; the renderer retains its process-local Homebrew x265 loader recovery.
