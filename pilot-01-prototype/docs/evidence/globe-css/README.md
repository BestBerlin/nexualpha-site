# Globe render evidence

Run from `pilot-01-prototype/`:

```sh
/opt/homebrew/opt/node@24/bin/node scripts/render-globe-evidence.mjs
```

Uses the existing `jsdom`, Vite SSR loader and `@resvg/resvg-js` dependencies. No added packages, browser, listening
server, remote page or network fetch is needed. Vite runs in middleware mode only to obtain the real English home
stage markup and its venue selection. Both runtime modules are mounted against that markup with deterministic
geometry and a fixed clock (`performance.now() = 0`). Chip labels, logos and amounts are omitted from the crop;
the actual SSR venue elements determine route count, order and selection. No financial data is synthesized.

## Files

- `before-canvas.svg` / `.png`: actual old renderer from Git revision `b497d6ea`, captured by a small Canvas2D-to-SVG
  recording adapter. Includes the old projected dotted land, lighting bands, atmosphere, grid and visible routes.
- `after-css.svg` / `.png`: current working `home7-globe.js`, mounted in jsdom. Uses its generated two-period SVG
  texture, measured disc geometry, generated grid and route paths. CSS spherical lighting is represented with
  equivalent fixed SVG radial gradients; outer/inset CSS box shadows use approximate SVG rim/halo gradients.
- `before-ssr.svg` / `.png`: supplementary static SSR fallback supplied before runtime rendering was available.
  It shows only the dotted graticule and hub, so it must not be used as the old runtime parity comparison.
- `render-manifest.json`: current module SHA-256 and output PNG hashes/sizes; regenerated without timestamps.
- `PLAN.md`: implementation/verification plan owned by the main agent.

## Normalization and limits

These are **600 × 600 globe-art renders**, not 390/768/1440 responsive screenshots. The host is explicitly 600px
square. SVG circle rectangles derive from the SSR `r` attributes at 6px per viewBox unit; five 100 × 45px chip anchor
boxes occupy the crop's corners and bottom center. This isolates the globe while keeping route geometry repeatable.
Both images use reduced motion: land is held at its initial position; travelling pulses are omitted; the hub remains.
The same real SSR selected venue is passed through each renderer's `select` method.

The old module measures the **first SVG circle** (halo `r=40`, yielding a 240px radius). The replacement measures
`.hx-globe-rim` (`r=34`, yielding a 204px radius). The images preserve this source-level difference rather than
rescaling one image to hide it. The new disc matches the actual reserved SSR sphere.

Resvg does not execute CSS animation, layout a browser page or exercise a GPU compositor. These artifacts support
review of land texture, sphere lighting, palette and route composition only. They do **not** prove live CSS rendering,
animation continuity, pulse motion, offscreen pausing, paint/compositing behavior, idle-JS time, responsive alignment,
font fit or CLS. The lead must still review the real page at 390/768/1440 and collect runtime/performance evidence.

The Canvas2D adapter supports only the operations used by the baseline and asserts concentric radial gradients,
identity transforms and full-circle arcs. Unexpected operations fail the script. SVG anti-aliasing and gradients can
differ slightly from browser Canvas2D; the after image's box-shadow approximation is also an explicit visual limit.
