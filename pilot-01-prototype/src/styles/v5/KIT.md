# NexuAlpha V5 kit

Dark, restrained, data-led. Opt in per page: wrap the page in `<div className="v5">`. Nothing outside `.v5` changes.
Files: `src/styles/v5/{tokens,base,motion}.css` (loaded via `index.css`), helpers in `src/lib/v5/` (`import { Reveal, CountUp, useInView, useSpotlight } from "../lib/v5/index.js"`).

Rules baked in (do not fight them): no eyebrow/kicker above headings, no section numbers, no hero-metric blocks, no sparklines, no gradient text, no glass, no identical card grids. Separate content with hairlines and space, not boxes. One accent only.

## Fonts
Geist (sans) and Geist Mono, latin only, self-hosted at `/fonts/geist/` (45KB total, OFL). `font-display: swap`. Preload in the route head:
`<link rel="preload" href="/fonts/geist/geist-sans-latin.woff2" as="font" type="font/woff2" crossorigin>` (add mono only if numbers in mono are above the fold).
CJK/Arabic fall back to the existing Pilot Noto families. Use `--font-sans`, `--font-mono`; class `.mono` for code/data.

## Colour tokens
Neutrals `--n1` (page) to `--n12` (strong text). Semantic: `--bg --surface --surface-raised --surface-hover --text-strong --text --text-muted --line --line-strong --control-edge`.
Accent (logo turquoise check): `--accent --accent-hi --accent-lo --accent-wash --on-accent`, alias `--positive`. Risk: `--red --amber` (+ `-wash`), aliases `--negative --caution`.
Rules: accent for primary CTA and positive/up values only. `--text-muted` only on n1-n3. `--n9` is decorative, never text. Never convey up/down by colour alone: add a sign or word. Contrast table is in `tokens.css`.

## Type
Steps (max 8): `--t-xs --t-sm --t-base --t-lg --t-xl --t-2xl --t-3xl --t-display` (display max 6rem). Classes `.t-xs .t-sm .t-base .t-lg .t-xl .t-2xl .t-3xl .t-display`; `h1` is display, `h2` 3xl, `h3` 2xl, `h4` xl. Display tracking -0.035em. Paragraphs are capped at 70ch (`.measure`, `.measure-narrow`).
`.num` on every numeric cell/figure: tabular figures, aligned to inline-end. `.text-up .text-down .text-caution .text-muted .text-strong`.

## Space, shape, depth
Spacing `--s-1..--s-32` (4px base), `--gutter`, `--page-max` (76rem). Layout: `.container`, `.section` (vertical rhythm), `.stack` (`--stack`), `.cluster` (`--gap`).
Radii only `--r-sm 4 / --r-md 8 / --r-lg 14`. Hairlines `--hairline`, `--hairline-strong`, utilities `.rule-top .rule-bottom`.
Depth `--shadow-1/2/3` (offset + blur) and `--inset-top`. Surfaces: `.surface` (flat, hairline), `.surface-raised`, `.surface-overlay` (menus/dialogs only).

## Components
```html
<a class="btn btn-primary" href="...">Open account</a>   <!-- the CTA: accent fill, dark text -->
<a class="btn btn-secondary">Compare fees</a>  <button class="btn btn-ghost">Cancel</button>
<label class="label" for="q">Search</label><input id="q" class="input">  <!-- aria-invalid="true" + .field-error -->
<span class="tag tag-up">+0.4%</span> <span class="tag tag-risk">Withdrawal limits</span> <span class="tag tag-caution">Review</span>
```
Table (sticky header, hairline rows, hover):
```html
<div class="table-wrap" tabindex="0"><table class="table"><thead><tr><th>Exchange</th><th class="num">Maker</th></tr></thead>
<tbody><tr><td>Binance</td><td class="num">0.100%</td></tr></tbody></table></div>
```
Ruled rows (list without cards): set columns with `--cols` (and `--cols-sm` under 40rem).
```html
<ul class="rows"><li><a class="row" style="--cols:2rem 1fr auto auto"><span>...</span><span>Name</span><span class="num">4.2</span><span class="num text-up">+1.3%</span></a></li></ul>
```
Apply `.row` to the direct children of `.rows`.

## Motion (all under prefers-reduced-motion: no-preference; tokens `--ease-out`, `--dur-1 120ms`, `--dur-2 240ms`, `--dur-3 400ms`)
- `.enter` + `style="--i:n"`: CSS entrance for the first viewport (blur/translate/opacity, 70ms stagger).
- `<Reveal as="section" index={i}>`: scroll reveal for everything below the fold. Server HTML is fully visible; hides only offscreen elements after mount, so there is no flash.
- `.reveal-scroll`: CSS-only scroll-driven alternative (`animation-timeline: view()`, `@supports` guarded; static where unsupported). Do not combine with `.reveal`.
- `<div class="scroll-progress"></div>`: 2px accent reading-progress bar (scroll-driven, hidden when unsupported). Use on long reads only.
- `.lift`: hover raise for clickable surfaces.
- `.spotlight`: hairline card whose border and surface light up near the pointer. Call `useSpotlight(containerRef)` once on a wrapper; it sets `--mx/--my`.
- `.beam`: accent arc travelling the border. At most once per page (the one hero panel).
- Marquee, one per page max, duplicate the items once and mark the copy `aria-hidden`:
```html
<div class="marquee" style="--marquee-dur:45s"><div class="marquee__track"><span>logo</span>...<span aria-hidden="true">logo</span>...</div></div>
```
Reduced motion turns the marquee into a wrapping static list. RTL flips direction automatically.
- `<CountUp value={1234.5} decimals={1} prefix="$" suffix="M" locale={lang}/>`: renders the final value on the server and under reduced motion; counts up only when the number starts below the fold. Wrap in a cell with `.num`.
- `useInView({once, rootMargin})` returns `[ref, inView]` for custom effects (SSR-safe, false on first render).

## Accessibility and RTL
Logical properties only (`inline-start/end`, `block-*`); never write `left/right/margin-left`. Focus ring is a 2px accent outline (`:focus-visible`); selection, caret, scrollbar and placeholder are themed. Tap targets are 44px (`.btn`, `.input`). Keep the page one language-correct `dir` on `<html>` or `.v5` for RTL.
