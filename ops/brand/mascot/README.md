# NexuAlpha academy mascot · Direction A

Start with **[board.html](board.html)**, then **[idle.html](idle.html)**. Everything is local; no CDN or paid API is needed to view the pages. The browser's file navigation policy may require a normal local preview server outside the restricted agent session.

## Deliverables

- `svg/model-sheet.svg`: layered front / three-quarter / side / back turnaround.
- `svg/model-*.svg`: four individual views.
- `svg/expression-*.svg`: happy, thinking, surprised, warning, celebrating, confused.
- `svg/pose-*.svg`: wave hello, point right, hold phone, hold shield, thumbs up, facepalm.
- `exports/*-1600.png`: all 16 character variants and model sheet; two 1600 × 2000 presentation boards; sticker contact sheet.
- `stickers/*.png`: eight transparent 512 × 512 previews with a white contour; corresponding editable SVGs included. No Telegram upload or pack creation was performed.
- `DESIGN.md`: shape language, rig contract, mood mapping and name screening.
- `manifest.json`: palette and complete asset inventory.

The HTML board mixes dark and light stages. **PNG boards are separately vector-composed presentations, not screenshots of the HTML.** The character artwork is identical in both. Read `evidence/verification.md` for the browser-verification limitation.

## Regenerate and verify

Run from the repository root with Python 3 and Node 22+. Use the existing site dependencies (`@resvg/resvg-js`, `jsdom`) and installed Pillow; no install is required.

```sh
python3 ops/brand/mascot/build.py
node ops/brand/mascot/export.mjs
node ops/brand/mascot/verify.mjs
python3 ops/brand/mascot/verify-exports.py
node --check ops/brand/mascot/idle.js
node --check ops/brand/mascot/export.mjs
```

Keep the HTML CSS and vector board layout coordinated if presentation copy changes. `build.py` owns generated SVGs, manifest and HTML. `export.mjs` owns raster outputs, sticker SVGs and vector boards. Hand-edit these generators rather than generated files.

## Third-party provenance

`vendor/gsap.min.js` is GSAP **3.15.0**, a single 72,927-byte download from the npm package via [jsDelivr](https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js). Its original copyright/license header is retained. It is subject to the [GSAP Standard License](https://gsap.com/community/standard-license/); do not treat it as MIT. Timeline implementation follows [official GSAP timeline documentation](https://gsap.com/docs/v3/GSAP/Timeline/). No third-party character imagery, external fonts, models or paid generation APIs were used.
