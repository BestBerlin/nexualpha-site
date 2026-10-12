# Promo Shorts (Nexubo host, HyperFrames + GSAP)

One JSON spec renders a ~30 s promo Short in 1080×1920 (`vertical`) and 1080×1080 (`square`) for every locale in the spec. Same look as the daily Shorts (ink background, Inter, blue accent, progress bar, NexuAlpha mark) with the canonical academy Nexubo rig (`../../academy-v3/characters.mjs`).

```sh
cd ops/shorts/promo
node --test build.test.mjs
node make-promo.mjs --spec bybit-stocks.json --out /path/outside/repo/video
node make-promo.mjs --spec bybit-stocks.json --out /tmp/x --locales en,tr --formats vertical --no-voice
```

Output: `<out>/<locale>-<format>.mp4` (H.264 + AAC, 30 fps) and `<out>/<locale>-<format>-contact.png` (one settled frame per scene plus the last frame, pulled from the encoded MP4). Intermediates go to `<out>/work`. Never commit MP4s.

- **Render**: reuses the academy kit's existing `node_modules` (HyperFrames 0.8.149, GSAP, qrcode); no installs. `make-promo.mjs` builds, lints, renders with `--strict`, then muxes audio with ffmpeg (sets `DYLD_LIBRARY_PATH=/opt/homebrew/Cellar/x265/4.2/lib`).
- **Narration**: only `narration_locale` (English) is voiced, with the owner's English clone (Qwen3-TTS Base 8bit via `/Volumes/致态2TB/nx-agents/education/v2/.venv`, offline). Other locales get localized on-screen text and a silent AAC track. Takes in `<out>/work/voice` are reused; delete one to retake it. A take that does not fit its scene fails the build.
- **Spec**: `scenes[]` (`id` = hook/product/facts/shares/cta, `duration`, Nexubo `pose`/`expression`/`antenna`, English `narration`), `copy.<locale>`, `code`, `url`, `qr` (always a nexualpha.com page with `?src=short`, never a direct exchange link). Durations must sum to the target length on whole frames.
- **Fitting**: `.fit` elements shrink until they stay within `data-max` lines and never overflow, so long locales (es, pt-BR, tr, vi, id) keep the layout. Always look at the contact sheets.
- **Copy rules**: `assertPromoCopy` rejects fine print ("capital at risk", "not investment advice", "terms apply"), regulator claims ("SEC", "approved by"), percentages and rebate wording. Only facts from the partner's official announcement go in a spec.

Scene templates live in `build.mjs` (`sceneContent`); add a new scene id there and in `motion.js` for a different storyboard.
