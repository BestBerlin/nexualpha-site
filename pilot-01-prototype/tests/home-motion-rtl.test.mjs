// Home polish (2026-10-15): no infinite animation anywhere on home (idle main-thread budget; the hot-event gold sweep
// runs two cycles, then rests), reduced motion = fully static, CTA arrows point the reading direction in ar / ur, and
// the ticker's symbols and prices carry no link underline (focus outline kept).
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { localizedHref } from "../src/data/locale-routing.js";
import { createSsrHarness } from "./helpers/ssr-hydration-harness.mjs";

const read = (rel) => readFile(new URL(`../${rel}`, import.meta.url), "utf8");
// Stylesheets that style the home page (header shell, ticker, home v7, Telegram strip).
const HOME_CSS = ["src/styles/v7/home7.src.css", "src/components/ticker/ticker.css", "src/components/v3/telegram-signal-strip.css", "src/styles/v5/shell.css"];

/** Innermost `{ ... }` blocks whose animation runs forever, unless the block is scroll-driven (animation-timeline). */
export function infiniteAnimations(css) {
  const bare = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const out = [];
  for (const [, selector, body] of bare.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
    if (/animation-timeline\s*:/.test(body)) continue;
    for (const [decl] of body.matchAll(/animation(?:-iteration-count)?\s*:[^;]*/g)) if (/\binfinite\b/.test(decl)) out.push(`${selector.trim()} { ${decl.trim()} }`);
  }
  return out;
}

test("home CSS: no infinite animation (scroll-driven timelines excepted)", async () => {
  assert.deepEqual(infiniteAnimations(".a{animation:x 1s infinite}.b{animation:y 1s linear 2}.c{animation:z 1s infinite;animation-timeline:scroll()}/* infinite */"), [".a { animation:x 1s infinite }"]);
  for (const file of HOME_CSS) assert.deepEqual(infiniteAnimations(await read(file)), [], file);
});

test("hot event chip: two gold sweeps then static; reduced motion makes the whole home static", async () => {
  const css = await read("src/styles/v7/home7.src.css");
  assert.match(css, /@ \.h7-ic-event\[data-hot\]\{[^}]*animation:nx-gold-sweep 2\.6s linear 2,nx-chip-glow 2\.6s ease-out 2/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)\{@ \*,@ \*::before,@ \*::after\{animation:none!important\}\}/);
  const ticker = await read("src/components/ticker/ticker.css");
  assert.match(ticker, /animation: nx-ticker-marquee 48s linear 3;/, "the phone marquee makes three passes, then rests");
});

let harness;
test.before(async () => { harness = await createSsrHarness(); });
test.after(async () => { await harness?.close(); });

test("ar / ur home: every CTA arrow sits in a span that flips in RTL", async () => {
  const css = (await read("src/styles/v7/home7.src.css")) + (await read("src/components/v3/telegram-signal-strip.css"));
  const flipping = [...css.matchAll(/\.([a-z0-9_-]+(?:arrow|__arr))(?::dir\(rtl\))\s*\{[^}]*scaleX\(-1\)/g)].map((m) => m[1]);
  for (const name of ["h7-tg-arrow", "tg-signal-strip__arr", "h7-academy-arrow", "h7-mv-arrow"]) assert.ok(flipping.includes(name), name);
  for (const locale of ["ar", "ur"]) {
    const html = await harness.render(`https://nexualpha.com${localizedHref("/", { locale })}`, {});
    const main = html.slice(0, html.indexOf("class=\"nx-ftr\"") > 0 ? html.indexOf("class=\"nx-ftr\"") : html.length);
    const arrows = [...main.matchAll(/→/g)];
    assert.ok(arrows.length >= 5, `${locale}: Telegram strip + block arrows rendered`);
    for (const m of arrows) {
      const before = main.slice(Math.max(0, m.index - 160), m.index);
      const span = before.match(/<span\b[^>]*\bclass="([^"]+)"[^>]*>$/);
      assert.ok(span && flipping.includes(span[1]), `${locale}: unflipped arrow after …${before.slice(-80)}`);
    }
  }
});

test("ticker: symbols and prices carry no link underline; focus outline kept", async () => {
  const css = await read("src/components/ticker/ticker.css");
  assert.match(css, /\.nx-ticker \.nx-ticker__item > a, \.nx-ticker \.nx-ticker__item > a:hover \{ text-decoration: none; \}/, "beats `.v5 a` (0,1,1)");
  assert.doesNotMatch(css.replace(/\/\*[\s\S]*?\*\//g, ""), /text-decoration: underline/);
  assert.match(css, /\.nx-ticker \.nx-ticker__item > a:focus-visible \{ outline: 2px solid/);
});
