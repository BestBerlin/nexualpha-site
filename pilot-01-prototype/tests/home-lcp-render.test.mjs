import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import React, { act } from "react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import { JSDOM } from "jsdom";
import { createSsrHarness } from "./helpers/ssr-hydration-harness.mjs";

let harness;
test.before(async () => { harness = await createSsrHarness(); });
test.after(async () => { await harness?.close(); });

test("both English and Chinese hero variants keep the SSR number fully visible without a mount nudge", async () => {
  // Hero v3 (owner 2026-10-14): the figure is the dollar rebate for the default 1000万U on Bitget, as static real text.
  for (const [pathname, text, num] of [["/", "$3,600", "3,600"], ["/zh-hans", "$3,600", "3,600"]]) {
    for (const heroVariant of ["a", "b"]) {
      const html = await harness.render(`https://nexualpha.com${pathname}`, { heroVariant });
      const dom = new JSDOM(html);
      const number = dom.window.document.querySelector(".hx-rate-num");
      assert.ok(number, `${pathname}:${heroVariant}`);
      assert.equal(number.textContent, text, "owner 2026-10-14 (#231): the figure is static real text in the HTML");
      assert.equal(number.querySelector(".hx-rate-n").textContent, num);
      assert.equal(number.querySelector(".hx-rate-pct").textContent, "$");
      assert.ok(dom.window.document.querySelector(".hx-rate-logo [data-brand-slug]"), "selected exchange logo is paired with the hero number");
      assert.equal(number.querySelector(".h7-roll"), null, "hero number is static, not the shared ledger roller");
      dom.window.close();
    }
  }
  const css = readFileSync(new URL("../src/styles/v7/home7.src.css", import.meta.url), "utf8");
  assert.match(css, /@ \.hx-rate-num/);
  assert.match(css, /@ :is\(\.hx-rate-n,\.hx-rate-pct\)\{[^}]*background:var\(--hx-rate-grad\)[^}]*background-clip:text/, "gradient sits on each glyph run (#231: WebKit hid the % on a clipped parent)");
  assert.match(css, /@ \.hx-rate-u\{[^}]*background:var\(--hx-rate-grad\)[^}]*background-clip:text/, "the 万/亿/K unit is its own glyph run too");
  assert.doesNotMatch(css, /@ \.hx-rate-num\{[^}]*background-clip/, "no background-clip:text on the parent of the glyph runs");
  assert.doesNotMatch(css, /hx-count|counter\(n\)/, "no count-up (owner 2026-10-14)");
  const tokens = readFileSync(new URL("../src/styles/tokens.css", import.meta.url), "utf8");
  assert.match(tokens, /--hx-rate-grad:linear-gradient\(100deg,#FFFFFF 0%,#7FE7FF 55%,#39E1C8 100%\)/, "addendum: high-luminance stops only");
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /letter-spacing:-\.055em/);
});

test("shared Roll still hydrates unchanged for non-hero ledger figures", async () => {
  const css = readFileSync(new URL("../src/styles/v7/home7.css", import.meta.url), "utf8");
  assert.match(css, /\.h7-roll\{display:inline-block;animation:h7up/);
  assert.match(css, /\.h7-roll\[data-roll-static\]\{animation:none\}/);
  assert.doesNotMatch(css, /\.h7-num\s*\{[^}]*font-size:/, "legacy sizing cannot override the dedicated figure component");
});

test("home hero does not render the decorative canvas flow or a per-frame canvas loop", async () => {
  const html = await harness.render("https://nexualpha.com/");
  const dom = new JSDOM(html);
  assert.equal(dom.window.document.querySelector(".h7-hero canvas, .h7-fl"), null);
  dom.window.close();

  const source = readFileSync(new URL("../src/components/v7/HomeV7.jsx", import.meta.url), "utf8");
  assert.equal(source.includes("getContext(\"2d\")"), false);
  assert.equal(source.includes("requestAnimationFrame(frame)"), false);
  assert.equal(source.includes("cancelAnimationFrame(raf)"), false);
});

test("Roll hydrates unchanged with zero RAFs, then animates a real value change and cancels on unmount", async () => {
  const { Roll } = await harness.vite.ssrLoadModule("/src/components/v7/home7-shared.jsx");
  const props = { value: 40, fmt: String, nudge: "okx", animateNudge: false };
  const html = renderToString(React.createElement(Roll, props));
  const dom = new JSDOM(`<div id="root">${html}</div>`);
  const frames = new Map();
  let nextFrame = 0;
  const overrides = {
    window: dom.window, document: dom.window.document,
    IS_REACT_ACT_ENVIRONMENT: true,
    requestAnimationFrame: (fn) => { frames.set(++nextFrame, fn); return nextFrame; },
    cancelAnimationFrame: (id) => frames.delete(id),
  };
  dom.window.matchMedia = () => ({ matches: false });
  const saved = new Map(Object.keys(overrides).map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const [key, value] of Object.entries(overrides)) Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  const errors = [];
  let root;
  try {
    const container = dom.window.document.getElementById("root");
    await act(async () => { root = hydrateRoot(container, React.createElement(React.StrictMode, null, React.createElement(Roll, props)), { onRecoverableError: (error) => errors.push(error.message) }); });
    assert.deepEqual(errors, []);
    assert.equal(container.innerHTML, html);
    assert.equal(frames.size, 0, "unchanged SSR value must not schedule a 700 ms animation loop");
    const render = (value, nudge = "bitget") => React.createElement(React.StrictMode, null, React.createElement(Roll, { ...props, value, nudge, animateNudge: true }));
    await act(async () => { root.render(render(30)); });
    assert.equal(frames.size, 1);
    assert.ok(container.querySelector(".h7-roll:not([data-roll-static])"), "venue selection retains the spring nudge");
    const frame = [...frames.values()][0];
    frames.clear();
    await act(async () => { frame(performance.now() + 701); });
    assert.equal(container.textContent, "30");
    assert.equal(frames.size, 0);
    await act(async () => { root.render(render(30, "bybit")); });
    assert.equal(frames.size, 0, "same-value venue changes need only the CSS nudge");
    await act(async () => { root.render(render(20)); });
    assert.equal(frames.size, 1);
    await act(async () => { root.unmount(); root = null; });
    assert.equal(frames.size, 0, "pending value animation is cancelled");
  } finally {
    if (root) await act(async () => root.unmount());
    for (const [key, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
    dom.window.close();
  }
});

test("RebateNumber renders the final value statically (owner 2026-10-14: Android count-up stalled at 56)", async () => {
  const source = readFileSync(new URL("../src/components/v7/RebateNumber.jsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /requestAnimationFrame/, "no RAF count-up that can stall mid-way");
  assert.match(source, /const rounded = String\(target\)/, "digits always equal the registry share");
  assert.doesNotMatch(source, /useState|useEffect/, "no client state can diverge from the SSR value");
});
