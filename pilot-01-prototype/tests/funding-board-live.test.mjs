// Home funding board stuck at "—" (2026-10-14). The feed shape was fine (unchanged since the board shipped on 2026-10-10:
// {generatedAt, venues: {<slug>: {ok, readAt, rows: [{symbol, rate, intervalH, nextAt}]}}}); the board needed stable SSR
// markup and lazy client hydration without removing the lower-half subtree.
// 1. The live JSON (fixture saved from production) maps to six numeric rows per symbol.
// 2. The shared gate still works for other deferred routes, while home now uses StableHomeBelowFold with direct SSR text.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { buildSync } from "esbuild";
import { FUNDING_SYMBOLS, FUNDING_VENUES, fundingTable } from "../src/data/funding-rates.js";

const live = JSON.parse(readFileSync(new URL("./fixtures/funding-rates-live-2026-10-14.json", import.meta.url), "utf8"));

test("the live funding JSON maps to a numeric row for every venue and symbol", () => {
  assert.ok(Number.isFinite(Date.parse(live.generatedAt)));
  for (const symbol of FUNDING_SYMBOLS) {
    const rows = fundingTable(live, symbol);
    assert.deepEqual(rows.map((r) => r.venue).sort(), [...FUNDING_VENUES].sort(), `${symbol}: all six venues`);
    for (const r of rows) {
      assert.ok(Number.isFinite(r.rate) && Number.isFinite(r.apr) && r.intervalH > 0, `${symbol}/${r.venue}: numbers`);
      assert.ok(Number.isFinite(Date.parse(r.nextAt)), `${symbol}/${r.venue}: next settlement time`);
    }
    for (let i = 1; i < rows.length; i += 1) assert.ok(rows[i - 1].apr <= rows[i].apr, `${symbol}: cheapest for longs first`);
  }
  // A venue the server dropped (or a symbol it did not answer) is absent, never a zero row.
  const partial = { ...live, venues: { binance: live.venues.binance } };
  assert.deepEqual(fundingTable(partial, "BTC").map((r) => r.venue), ["binance"]);
});

function loadGate() {
  const entry = fileURLToPath(new URL("../src/components/shared/DeferUntilVisible.jsx", import.meta.url));
  const code = buildSync({ entryPoints: [entry], bundle: true, write: false, format: "cjs", platform: "node", jsx: "automatic", external: ["react", "react/jsx-runtime"] }).outputFiles[0].text;
  const module = { exports: {} };
  new Function("module", "exports", "require", code)(module, module.exports, createRequire(import.meta.url));
  return module.exports;
}

function fakePage(rects) {
  const listeners = new Map();
  const elements = Object.entries(rects).map(([id, rect]) => ({ id, rect, children: [], contains(node) { return node === this || this.children.includes(node); } }));
  const doc = {
    querySelectorAll: (selector) => selector.split(",").map((s) => s.trim().replace(/^#/, "")).map((id) => elements.find((e) => e.id === id)).filter(Boolean),
    addEventListener: (type, fn, options) => { assert.equal(options.capture, true, "document capture phase runs before React's root listener"); listeners.set(type, fn); },
    removeEventListener: (type) => listeners.delete(type),
  };
  const observers = [];
  class IntersectionObserver {
    constructor(callback) { this.callback = callback; this.targets = []; observers.push(this); }
    observe(target) { this.targets.push(target); }
    disconnect() { this.targets = []; }
    // Like the browser: the first callback reports every observed target's current position.
    flush() { this.callback(this.targets.map((target) => ({ target, isIntersecting: target.rect.top < 900 && target.rect.bottom > 0, boundingClientRect: target.rect }))); }
  }
  return { doc, elements, listeners, observers, IntersectionObserver };
}

test("the home deferral gate opens for a reader already scrolled past the first watched section", () => {
  const { watchDeferTarget } = loadGate();
  // Reader is at the funding board: #h7-flash is 2000 px above the viewport, the board itself is on screen.
  const page = fakePage({ "h7-flash": { top: -2400, bottom: -2000 } });
  let opened = 0;
  watchDeferTarget({ target: "#h7-flash", rootMargin: "50% 0px", interactionOnly: false, open: () => { opened += 1; }, doc: page.doc, IntersectionObserver: page.IntersectionObserver });
  page.observers[0].flush();
  assert.equal(opened, 1, "an element above the viewport counts as reached");

  const below = fakePage({ "h7-flash": { top: 3000, bottom: 3400 } });
  let openedBelow = 0;
  watchDeferTarget({ target: "#h7-flash", rootMargin: "50% 0px", interactionOnly: false, open: () => { openedBelow += 1; }, doc: below.doc, IntersectionObserver: below.IntersectionObserver });
  below.observers[0].flush();
  assert.equal(openedBelow, 0, "still deferred while the section is further down the page");
});

test("any listed section opens the gate, and a tap inside it is caught on the document", () => {
  const { watchDeferTarget } = loadGate();
  const page = fakePage({ "h7-flash": { top: 3000, bottom: 3400 }, "h7-funding": { top: 100, bottom: 700 } });
  let opened = 0;
  const stop = watchDeferTarget({ target: "#h7-flash, #h7-funding", rootMargin: "50% 0px", interactionOnly: false, open: () => { opened += 1; }, doc: page.doc, IntersectionObserver: page.IntersectionObserver });
  assert.equal(page.observers[0].targets.length, 2, "every match is observed");
  page.observers[0].flush();
  assert.equal(opened, 1);

  const tapped = fakePage({ "h7-funding": { top: 4000, bottom: 4600 } });
  let openedByTap = 0;
  watchDeferTarget({ target: "#h7-funding", rootMargin: "50% 0px", interactionOnly: false, open: () => { openedByTap += 1; }, doc: tapped.doc, IntersectionObserver: tapped.IntersectionObserver });
  const tab = {};
  tapped.elements[0].children.push(tab);
  tapped.listeners.get("pointerdown")({ target: {} });
  assert.equal(openedByTap, 0, "a tap elsewhere does not open it");
  tapped.listeners.get("pointerdown")({ target: tab });
  assert.equal(openedByTap, 1, "a tap on the BTC/ETH tabs opens it");

  stop();
  assert.equal(page.listeners.size, 0, "cleanup removes the document listeners");
});

test("the home page keeps lower-half data SSR-stable while lazy hydrating its controller", () => {
  const home = readFileSync(new URL("../src/components/v7/HomeV7.jsx", import.meta.url), "utf8");
  assert.match(home, /function StableHomeBelowFold\(props\)/);
  assert.match(home, /<ServerHomeBelowFold \{\.\.\.props\} \/>/);
  assert.match(home, /hydrateRoot\(hostRef\.current, element\)/);
  assert.match(home, /<StableHomeBelowFold[^>]*fundingFeed=\{fundingFeed\}/);
  assert.doesNotMatch(home, /<DeferUntilVisible[^>]*HomeBelowFold/);
});
