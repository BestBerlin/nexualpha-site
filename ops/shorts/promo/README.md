# Promo Shorts (Nexubo host, HyperFrames + GSAP)

One JSON spec renders a ~30 s promo Short in 1080×1920 (`vertical`) and 1080×1080 (`square`) for every locale in the spec. Same look as the daily Shorts (ink background, Inter, blue accent, progress bar, NexuAlpha mark) with the canonical academy Nexubo rig (`../../academy-v3/characters.mjs`).

```sh
cd ops/shorts/promo
node --test build.test.mjs
node make-promo.mjs --spec bybit-stocks.json --out /path/outside/repo/video
node make-promo.mjs --spec bitget-alliance.json --out /tmp/x --locales zh-Hans --formats vertical --music calm
node ../audio-gate.mjs /tmp/x/zh-Hans-vertical.mp4        # exit 3 = blocked
```

Output: `<out>/<locale>-<format>.mp4` (H.264 + AAC, 30 fps) and `<out>/<locale>-<format>-contact.png` (one settled frame per scene plus the last frame, pulled from the encoded MP4). Intermediates go to `<out>/work`. Never commit MP4s.

- **Render**: reuses the academy kit's existing `node_modules` (HyperFrames 0.8.149, GSAP, qrcode); no installs. `make-promo.mjs` builds, lints, renders with `--strict`, then muxes voice + ducked music with ffmpeg and runs the audio gate (sets `DYLD_LIBRARY_PATH=/opt/homebrew/Cellar/x265/4.2/lib`).
- **Voiceover (every locale, mandatory)**: owner rule 2026-10-14 — no silent videos. Each locale is narrated with `../voice/voice.py` (offline, installed models only): en = owner's English clone (Qwen3-TTS Base 8bit), zh-Hans = Qwen3-TTS CustomVoice "Serena", es / pt-BR / tr / vi / id / ru / ar = VoxCPM2 cloned from a per-locale designed reference in `/Volumes/致态2TB/nx-agents/media/voices`. Lines come from `narration_i18n.<locale>.<scene>` (English falls back to `scenes[].narration`); a locale with a missing line fails the build. Takes in `<out>/work/voice/<locale>` are reused; delete one to retake. A take that does not fit its scene fails the build (shorten the line, never speed it up).
- **Music**: a light self-synthesised bed (`../voice/music_bed.py`, royalty-free, no samples; `--music bright|calm`, cached in `/Volumes/致态2TB/nx-agents/media/music`) is looped under the voice, ducked with `sidechaincompress`, and the mix is normalised to -16 LUFS / -1.5 dBTP.
- **Audio gate**: every output must pass `../audio-gate.mjs` (audio stream present, mean volume >= -30 dB, <= 40% silence); a failing file is deleted and the build stops. Uploaders run the same gate again before sending (YouTube `~/.codex/private/youtube/yt_upload.py`, Python gate `/Volumes/致态2TB/nx-agents/media/audio_gate.py`).
- **Spec**: `scenes[]` (`id` = hook/product/facts/shares/cta, `duration`, Nexubo `pose`/`expression`/`antenna`, English `narration`), `copy.<locale>`, `code`, `url`, `qr` (always a nexualpha.com page with `?src=short`, never a direct exchange link). Durations must sum to the target length on whole frames.
- **Fitting**: `.fit` elements shrink until they stay within `data-max` lines and never overflow, so long locales (es, pt-BR, tr, vi, id) keep the layout. Always look at the contact sheets.
- **Copy rules**: `assertPromoCopy` rejects fine print ("capital at risk", "not investment advice", "terms apply"), regulator claims ("SEC", "approved by"), percentages and rebate wording. Only facts from the partner's official announcement go in a spec.

Scene templates live in `build.mjs` (`sceneContent`); add a new scene id there and in `motion.js` for a different storyboard.
