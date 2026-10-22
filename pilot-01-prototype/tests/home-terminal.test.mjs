// Owner 2026-10-14: the hero "terminal" phone mockup (BTC/ETH/SOL prices + sparkline) is removed from home entirely.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { JSDOM } from "jsdom";
import { tickerFromBinance } from "../src/data/ticker.js";
import { createSsrHarness } from "./helpers/ssr-hydration-harness.mjs";

const binanceRow = (symbol, lastPrice, priceChangePercent, quoteVolume) => ({ symbol, lastPrice: String(lastPrice), priceChangePercent: String(priceChangePercent), quoteVolume: String(quoteVolume) });
const SNAP = tickerFromBinance([
  binanceRow("BTCUSDT", 82576.4, -1.264, 1e10),
  binanceRow("ETHUSDT", 2484.45, 0.52, 8e9),
  binanceRow("SOLUSDT", 151.2, 3.1, 3e9),
], { now: Date.parse("2026-10-14T00:00:00Z") });

let harness;
test.before(async () => { harness = await createSsrHarness(); });
test.after(async () => { await harness?.close(); });

for (const path of ["/", "/zh-hans", "/ru"]) {
  test(`home ${path} renders no device mockup in the hero`, async () => {
    const html = await harness.render(`https://nexualpha.com${path}`, { ticker: SNAP });
    const dom = new JSDOM(html);
    const doc = dom.window.document;
    assert.ok(doc.querySelector(".h7-hero"), "hero still renders");
    assert.equal(doc.querySelector(".h7-hero .ht, .h7-terminal, #h7-terminal-root, .hx-terminal-host"), null);
    assert.equal(doc.querySelector(".h7-hero .ht-tick, .h7-hero .ht-series"), null);
    dom.window.close();
  });
}

test("CTA home shows the rebate globe instead of a price terminal or device (owner 2026-10-22)", async () => {
  const html = await harness.render("https://nexualpha.com/", { ticker: SNAP });
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  assert.equal(doc.querySelector(".h7-hero .h7-terminal"), null, "no BTC price terminal on the CTA hero");
  assert.equal(doc.querySelector(".h7-hero .hx-screen"), null, "retired device mockup stays absent");
  const stage = doc.querySelector(".h7-hero .hx-stage-art");
  assert.ok(stage, "rebate globe is in the SSR hero");
  assert.equal(stage.getAttribute("aria-hidden"), "true");
  assert.ok(stage.querySelector(".hx-globe-svg"), "static globe does not depend on client animation");
  assert.ok(stage.querySelectorAll(".hx-stage-value[data-final-value]").length >= 3);
  assert.doesNotMatch(stage.textContent, /BTC|\$82,576/, "no market prices in the rebate stage");
  dom.window.close();
});

test("terminal component, runtime, stylesheet and budget entry are gone", () => {
  const home = readFileSync(new URL("../src/components/v7/HomeV7.jsx", import.meta.url), "utf8");
  const budget = readFileSync(new URL("../scripts/verify-build-budget.mjs", import.meta.url), "utf8");
  for (const file of ["../src/components/v7/HeroTerminal.jsx", "../src/components/v7/hero-terminal.js", "../src/styles/v7/terminal-owner.css"]) {
    assert.equal(existsSync(new URL(file, import.meta.url)), false, file);
  }
  assert.doesNotMatch(home, /HeroTerminal|terminal-owner|StableHeroTerminal/);
  assert.doesNotMatch(budget, /HERO_TERMINAL_GZIP_MAX|terminal-owner\.css/);
});
