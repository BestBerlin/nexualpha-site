import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { JSDOM } from "jsdom";
import { tickerFromBinance } from "../src/data/ticker.js";
import { createSsrHarness } from "./helpers/ssr-hydration-harness.mjs";

const binanceRow = (symbol, lastPrice, priceChangePercent, quoteVolume) => ({ symbol, lastPrice: String(lastPrice), priceChangePercent: String(priceChangePercent), quoteVolume: String(quoteVolume) });
const SNAP = tickerFromBinance([
  binanceRow("BTCUSDT", 82576.4, -1.264, 1e10),
  binanceRow("ETHUSDT", 2484.45, 0.52, 8e9),
  binanceRow("SOLUSDT", 151.2, 3.1, 3e9),
  binanceRow("BNBUSDT", 612.3, 0.001, 1e9),
  binanceRow("XRPUSDT", 2.4108, -0.8, 2e9),
  binanceRow("GTCUSDT", 1.02, 53.12, 3.9e8),
], { now: Date.parse("2026-10-14T00:00:00Z") });

let harness;
test.before(async () => { harness = await createSsrHarness(); });
test.after(async () => { await harness?.close(); });

test("home hero terminal SSR uses the real ticker snapshot and existing selected-save estimate", async () => {
  const html = await harness.render("https://nexualpha.com/", { ticker: SNAP });
  const dom = new JSDOM(html);
  const terminal = dom.window.document.querySelector(".h7-terminal");
  assert.ok(terminal, "terminal SSR frame is reserved in the hero");
  assert.equal(terminal.querySelector('[data-dir="down"] b')?.textContent, "BTC");
  assert.equal(terminal.querySelector('[data-dir="down"] span')?.textContent, "$82,576");
  assert.equal(terminal.querySelector('[data-dir="up"] b')?.textContent, "ETH");
  assert.match(terminal.querySelector(".h7-terminal__estimate dt")?.textContent || "", /Through NexuAlpha.*Estimate/i);
  assert.match(terminal.querySelector(".h7-terminal__estimate dd")?.textContent || "", /^\$/);
  dom.window.close();
});

test("neutral locales keep the terminal visual without fee or referral estimate fields", async () => {
  const html = await harness.render("https://nexualpha.com/ru", { ticker: SNAP });
  const dom = new JSDOM(html);
  const terminal = dom.window.document.querySelector(".h7-terminal--neutral");
  assert.ok(terminal, "neutral home still gets the terminal visual");
  assert.equal(terminal.querySelector(".h7-terminal__estimate"), null);
  assert.equal(terminal.querySelector('[data-dir="down"] b')?.textContent, "BTC");
  dom.window.close();
});

test("home terminal stays lazy, polls only our ticker endpoint, and keeps decorative motion transform/opacity only", () => {
  const home = readFileSync(new URL("../src/components/v7/HomeV7.jsx", import.meta.url), "utf8");
  const app = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
  const terminal = readFileSync(new URL("../src/components/v7/HeroTerminal.jsx", import.meta.url), "utf8");
  const css = readFileSync(new URL("../src/styles/v7/terminal-owner.css", import.meta.url), "utf8");

  assert.match(home, /ssrHeroTerminalModules/);
  assert.match(home, /const loadHeroTerminal = \(\) =>/);
  assert.match(home, /<DeferUntilVisible target="\.h7-terminal"[^>]*prefetch=\{loadHeroTerminal\}/);
  assert.match(app, /initialTicker=\{initialTicker\}/);
  assert.match(terminal, /request: TICKER_URL/);
  assert.match(terminal, /TERMINAL_REFRESH_MS = 45 \* 1000/);
  assert.match(terminal, /startJsonPolling/);
  assert.match(terminal, /typeof item\.price === "string"/);
  assert.match(terminal, /data-visible=\{visible \? "true" : "false"\}/);
  assert.doesNotMatch(terminal, /binance\.com|okx\.com|fapi\./i);
  assert.match(css, /min-block-size: 248px/);
  assert.match(css, /min-block-size: 190px/);
  assert.doesNotMatch(css, /stroke-dash(?:array|offset)|animation:\s*h7-terminal-line/);
  assert.match(css, /animation-play-state: paused/);
  assert.match(css, /will-change: opacity, transform/);
  assert.match(css, /will-change: transform, opacity/);
});
