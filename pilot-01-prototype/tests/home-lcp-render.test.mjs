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
  for (const pathname of ["/", "/zh-hans"]) {
    for (const heroVariant of ["a", "b"]) {
      const html = await harness.render(`https://nexualpha.com${pathname}`, { heroVariant });
      const dom = new JSDOM(html);
      const number = dom.window.document.querySelector(".h7-num");
      assert.ok(number, `${pathname}:${heroVariant}`);
      assert.equal(number.querySelector(".h7-roll").textContent, "40");
      assert.equal(number.querySelector(".h7-roll").hasAttribute("data-roll-static"), true);
      dom.window.close();
    }
  }
  const css = readFileSync(new URL("../src/styles/v7/home7.css", import.meta.url), "utf8");
  assert.match(css, /\.h7-roll\{display:inline-block;animation:h7up/);
  assert.match(css, /\.h7-roll\[data-roll-static\]\{animation:none\}/);
  assert.match(css, /\.h7-num>span:not\(\.h7-sr\):not\(\.h7-roll\)/, "preserve the number/percent gradient split");
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
