import assert from "node:assert/strict";
import { createRequire } from "node:module";
import vm from "node:vm";
import test from "node:test";
import { buildSync } from "esbuild";
import React from "react";
import { JSDOM } from "jsdom";
import { CALC_CHIPS, CALC_SAY, CALC_VMAX, calcToPos, calcToVol } from "../src/components/v7/home7-hero-volume.js";
import { renderToStaticMarkup } from "react-dom/server";
import { readDecisionReturnState } from "../src/data/decision-return.js";

const require = createRequire(import.meta.url);
const compiled = buildSync({
  entryPoints: ["src/components/v7/HomeCalculator.jsx"], bundle: true, write: false,
  format: "cjs", platform: "node", external: ["react", "react/jsx-runtime"],
  loader: { ".css": "empty", ".webp": "text" }, logLevel: "silent",
}).outputFiles[0].text;

// Run the actual component's handlers and returned props through controlled rerenders.
// Child components stay opaque; no browser, network request or production state is used.
function calculator({ initialVolume = 1000, locale = "en" } = {}) {
  let volume = initialVolume, cursor = 0;
  const slots = [], effects = [], updates = [];
  const react = { ...React,
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === "function" ? initial() : initial;
      return [slots[index], next => { slots[index] = typeof next === "function" ? next(slots[index]) : next; }];
    },
    useEffect(effect) { effects.push(effect); },
    useId() { return "audit-volume-feedback"; },
  };
  const module = { exports: {} };
  vm.runInNewContext(compiled, { module, exports: module.exports, require: id => id === "react" ? react : require(id), console, URL, URLSearchParams, Intl });
  function nodes(node, predicate, result = []) {
    if (Array.isArray(node)) { for (const child of node) nodes(child, predicate, result); }
    else if (node && typeof node === "object") {
      if (predicate(node)) result.push(node);
      nodes(node.props?.children, predicate, result);
    }
    return result;
  }
  function render() {
    cursor = 0;
    const tree = module.exports.HomeCalculator({
      locale, vol: volume, setVol: next => { volume = next; updates.push(next); },
      t: { perpL: "Perpetuals", spotL: "Spot", maker: "Maker", taker: "Taker", all: "All" },
      mode: "taker", setMode() {}, product: "perp", setProduct() {}, calc: { rows: [], best: null, most: null },
    });
    const result = {
      input: nodes(tree, n => n.type === "input" && n.props.type !== "range")[0],
      slider: nodes(tree, n => n.type === "input" && n.props.type === "range")[0],
      chips: nodes(tree, n => n.type === "button").slice(0, CALC_CHIPS.length),
      feedback: nodes(tree, n => n.props?.className === "h7-vd")[0],
      rates: nodes(tree, n => n.type === "a" && n.props.className?.includes("h7-rates"))[0],
    };
    for (const effect of effects.splice(0)) effect();
    return result;
  }
  return { render, updates, get volume() { return volume; },
    edit(text) { render().input.props.onChange({ target: { value: text } }); return render(); },
    external(next) { volume = next; render(); return render(); },
  };
}

test("calculator retains decimal amounts and accepts valid comma-grouped pastes", () => {
  for (const [text, expected] of [["100.50", 100.5], ["1,234.56", 1234.56], ["0.01", 0.01], [".5", 0.5], ["1,000,000.25", 1000000.25], [" 25.50 ", 25.5]]) {
    const c = calculator();
    const ui = c.edit(text);
    assert.equal(c.volume, expected, text);
    assert.equal(ui.input.props.inputMode, "decimal", "mobile keyboard exposes the decimal key");
    assert.equal(Boolean(ui.input.props["aria-invalid"]), false, text);
    assert.equal(ui.slider.props.value, calcToPos(expected), text);
  }
});

test("calculator preserves a trailing decimal point and zero fractional digits while typing", () => {
  const c = calculator();
  for (const text of ["100", "100.", "100.5", "100.50"]) {
    assert.equal(c.edit(text).input.props.value, text, text);
  }
  assert.equal(c.volume, 100.5);
});

test("negative, malformed, non-finite and out-of-range values keep the last valid amount and report an error", () => {
  for (const text of ["-100", "−100", "100abc", "1,23", "12,34,567", "1.2.3", "1e3", "NaN", "Infinity", "9".repeat(400), String(CALC_VMAX + 1)]) {
    const c = calculator({ initialVolume: 42.5 });
    const ui = c.edit(text);
    assert.equal(c.volume, 42.5, `${text.slice(0, 24)} must not change the calculation`);
    assert.equal(c.updates.length, 0);
    assert.equal(ui.input.props.value, text);
    assert.equal(ui.input.props["aria-invalid"], true);
    assert.equal(ui.input.props["aria-describedby"], ui.feedback.props.id);
    assert.equal(ui.feedback.props["aria-live"], "polite");
    assert.equal(ui.feedback.props.children, CALC_SAY.en.invalid.replace("{max}", CALC_VMAX.toLocaleString("en-US")));
  }
});

test("empty, zero and maximum stay finite; slider/chips and external values clear stale drafts", () => {
  const c = calculator();
  assert.equal(c.edit("").input.props.value, "");
  assert.equal(c.volume, 0);
  assert.equal(c.edit("0").input.props.value, "0");
  assert.equal(c.volume, 0);
  c.edit(String(CALC_VMAX));
  assert.equal(c.volume, CALC_VMAX);
  c.edit("-100");
  c.render().slider.props.onChange({ target: { value: "600" } });
  assert.equal(c.volume, calcToVol(600));
  assert.equal(Boolean(c.render().input.props["aria-invalid"]), false);
  assert.equal(c.render().input.props.value, c.volume.toLocaleString("en-US"));
  for (let i = 0; i < CALC_CHIPS.length; i++) {
    c.edit("123.");
    c.render().chips[i].props.onClick();
    assert.equal(c.volume, CALC_CHIPS[i]);
    const ui = c.render();
    assert.equal(ui.input.props.value, CALC_CHIPS[i].toLocaleString("en-US"));
    assert.equal(ui.chips[i].props["aria-pressed"], true);
    assert.equal(ui.slider.props.value, calcToPos(CALC_CHIPS[i]));
  }
  c.edit("12.");
  assert.equal(c.external(7.125).input.props.value, "7.125");
  assert.equal(c.external(12).input.props.value, "12", "an old draft never reappears");
  assert.ok(c.updates.every(value => Number.isFinite(value) && value >= 0 && value <= CALC_VMAX));
});

test("invalid-volume feedback is available through the existing 17 locale dictionaries", () => {
  assert.equal(Object.keys(CALC_SAY).length, 17);
  for (const [locale, copy] of Object.entries(CALC_SAY)) {
    assert.ok(copy.invalid?.includes("{max}"), locale);
    assert.ok(copy.invalid.includes("1,234.56"), `${locale}: explicit accepted format`);
    const ui = calculator({ locale }).edit("-100");
    assert.equal(ui.input.props["aria-label"], copy.label);
    assert.equal(ui.feedback.props.children, copy.invalid.replace("{max}", CALC_VMAX.toLocaleString("en-US")), locale);
  }
});

test("SSR coin venue links resolve to exactly one matching table row in all 17 locales", () => {
  const compiledCoins = buildSync({
    entryPoints: ["src/components/coins/CoinPages.jsx"], bundle: true, write: false,
    format: "cjs", platform: "node", external: ["react", "react/jsx-runtime"],
    define: { "import.meta.env.SSR": "true" },
    loader: { ".css": "empty", ".webp": "text" }, logLevel: "silent",
  }).outputFiles[0].text;
  const module = { exports: {} };
  vm.runInNewContext(compiledCoins, { module, exports: module.exports, require, console, URL, URLSearchParams, Intl });
  for (const prefix of Object.keys(CALC_SAY)) {
      const html = renderToStaticMarkup(React.createElement(module.exports.CoinPage, { locale: prefix, slug: "bitcoin" }));
      const dom = new JSDOM(html), doc = dom.window.document;
      try {
        const links = [...doc.querySelectorAll('.nxc-listed a[href^="#venue-"]')];
        assert.ok(links.length > 0, prefix);
        for (const link of links) {
          const id = link.getAttribute("href").slice(1);
          const targets = doc.querySelectorAll(`[id="${id}"]`);
          assert.equal(targets.length, 1, `${prefix || "/"}: ${id}`);
          assert.equal(targets[0].tagName, "TR");
          assert.equal(targets[0].dataset.venue, id.slice("venue-".length));
        }
      } finally { dom.window.close(); }
  }
});

test("mounted React input keeps decimals, exposes invalid feedback, and recovers through a preset", async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: "https://nexualpha.test/", pretendToBeVisual: true });
  const saved = new Map();
  for (const [name, value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator, HTMLElement: dom.window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true })) {
    saved.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
  }
  let root;
  try {
    const module = { exports: {} };
    vm.runInNewContext(compiled, { module, exports: module.exports, require, console, URL, URLSearchParams, Intl });
    const { createRoot } = require("react-dom/client");
    function Controlled() {
      const [vol, setVol] = React.useState(1000);
      return React.createElement(React.Fragment, null,
        React.createElement(module.exports.HomeCalculator, {
          locale: "en", vol, setVol,
          t: { perpL: "Perpetuals", spotL: "Spot", maker: "Maker", taker: "Taker", all: "All" },
          mode: "taker", setMode() {}, product: "perp", setProduct() {}, calc: { rows: [], best: null, most: null },
        }), React.createElement("output", { "data-volume": vol }, String(vol)));
    }
    root = createRoot(document.getElementById("root"));
    await React.act(async () => { root.render(React.createElement(Controlled)); });
    const input = document.querySelector(".h7-vin input");
    const setter = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value").set;
    async function enter(value) {
      await React.act(async () => {
        setter.call(input, value);
        input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
      });
    }
    await enter("100.");
    assert.equal(input.value, "100.");
    assert.equal(document.querySelector("output").dataset.volume, "100");
    await enter("100.50");
    assert.equal(input.value, "100.50");
    assert.equal(document.querySelector("output").dataset.volume, "100.5");
    const linkedAmount = () => {
      const url = new URL(document.querySelector(".h7-rates").href);
      return readDecisionReturnState(url.search, url.hash)?.volume;
    };
    assert.equal(linkedAmount(), 100.5, "mounted final href matches the displayed accepted amount");
    await enter("0.004");
    assert.equal(linkedAmount(), Number(document.querySelector("output").dataset.volume), "mounted href never rounds a different stored amount");
    assert.equal(input.getAttribute("aria-invalid"), "true");
    assert.equal(document.querySelector("output").dataset.volume, "100.5");
    await enter("-100");
    assert.equal(input.value, "-100");
    assert.equal(input.getAttribute("aria-invalid"), "true");
    assert.equal(document.querySelector("output").dataset.volume, "100.5");
    assert.match(document.getElementById(input.getAttribute("aria-describedby")).textContent, /last valid amount/);
    await React.act(async () => { document.querySelector(".h7-ctl button").click(); });
    assert.equal(input.value, CALC_CHIPS[0].toLocaleString("en-US"));
    assert.equal(input.hasAttribute("aria-invalid"), false);
    assert.equal(document.querySelector("output").dataset.volume, String(CALC_CHIPS[0]));
  } finally {
    if (root) await React.act(async () => { root.unmount(); });
    for (const [name, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete globalThis[name];
    }
    dom.window.close();
  }
});


test("final cost-calculator href preserves the accepted amount and rejects excess decimal precision", () => {
  for (const locale of Object.keys(CALC_SAY)) {
    const c = calculator({ initialVolume: 42.5, locale });
    const linkedVolume = ui => {
      const url = new URL(ui.rates.props.href, "https://nexualpha.test");
      return readDecisionReturnState(url.search, url.hash)?.volume;
    };
    for (const text of ["0.004", "1.005", "100.1234", "1,000.001", ".001"]) {
      const ui = c.edit(text);
      assert.equal(linkedVolume(ui), c.volume, `${locale} ${text}: final href must not change the amount`);
      assert.equal(c.volume, 42.5, `${locale} ${text}: preserve last valid amount`);
      assert.equal(ui.input.props["aria-invalid"], true);
      assert.equal(ui.input.props.value, text);
    }
    for (const [text, expected] of [["100.", 100], ["100.50", 100.5], ["0.01", 0.01], ["1,234.56", 1234.56], [".5", 0.5]]) {
      const ui = c.edit(text);
      assert.equal(c.volume, expected, text);
      assert.equal(linkedVolume(ui), expected, `${locale} ${text}: final href preserves exact accepted amount`);
      assert.equal(Boolean(ui.input.props["aria-invalid"]), false);
      assert.equal(ui.input.props.value, text);
    }
  }
});
