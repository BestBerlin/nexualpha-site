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
  const terminal = dom.window.document.querySelector(".h7-terminal.ht");
  assert.ok(terminal, "terminal SSR frame is reserved in the hero");
  assert.equal(terminal.getAttribute("aria-hidden"), "true");
  assert.equal(terminal.querySelector('.ht-tick [data-dir="down"] b')?.textContent, "BTC");
  assert.equal(terminal.querySelector('.ht-tick [data-dir="down"] .ht-p')?.textContent, "$82,576");
  assert.equal(terminal.querySelector('.ht-tick [data-dir="up"] b')?.textContent, "ETH");
  assert.match(terminal.querySelector(".ht-ret-l")?.textContent || "", /Max yearly return.*Bitget/i);
  assert.equal(terminal.querySelector(".ht-ret-n")?.getAttribute("data-v"), "432");
  assert.equal(terminal.querySelector(".ht-series")?.getAttribute("data-samples"), "0");
  assert.equal(terminal.hasAttribute("data-paused"), false, "SSR visible hero terminal does not unpause at idle and nudge after mount");
  assert.equal(terminal.querySelector(".ht-series")?.getAttribute("data-mature"), "false");
  dom.window.close();
});

test("neutral locales keep the terminal visual without fee or referral estimate fields", async () => {
  const html = await harness.render("https://nexualpha.com/ru", { ticker: SNAP });
  const dom = new JSDOM(html);
  const terminal = dom.window.document.querySelector(".h7-terminal--neutral");
  assert.ok(terminal, "neutral home still gets the terminal visual");
  assert.equal(terminal.querySelector(".ht-ret"), null);
  assert.equal(terminal.querySelector('.ht-tick [data-dir="down"] b')?.textContent, "BTC");
  dom.window.close();
});

test("home terminal stays lazy, subscribes to the shared ticker store, and keeps motion transform/opacity only", () => {
  const home = readFileSync(new URL("../src/components/v7/HomeV7.jsx", import.meta.url), "utf8");
  const app = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
  const terminal = readFileSync(new URL("../src/components/v7/HeroTerminal.jsx", import.meta.url), "utf8");
  const runtime = readFileSync(new URL("../src/components/v7/hero-terminal.js", import.meta.url), "utf8");
  const css = readFileSync(new URL("../src/styles/v7/terminal-owner.css", import.meta.url), "utf8");

  assert.match(home, /<StableHeroTerminal locale=\{locale\}/);
  assert.match(app, /initialTicker=\{initialTicker\}/);
  assert.match(terminal, /import\("\.\/hero-terminal\.js"\)/);
  assert.match(terminal, /requestIdleCallback/);
  assert.match(terminal, /rootMargin: "200px 0px"/);
  assert.doesNotMatch(terminal, /subscribeTicker|startJsonPolling|Array\.from\(\{ length: 48 \}/);
  assert.match(runtime, /subscribe as subscribeTicker/);
  assert.match(runtime, /entry\.intersectionRatio >= 0\.1/);
  assert.doesNotMatch(runtime, /entry\?\.isIntersecting/);
  assert.match(runtime, /DEPTH_INTERVAL_MS = 1400/);
  assert.match(runtime, /Math\.random\(\) \* 0\.36 - 0\.18/);
  assert.match(runtime, /const drawing = actual\.length >= 2 \? actual : \[latestPrice \|\| 0, latestPrice \|\| 0\]/);
  assert.match(runtime, /actualSamples >= 6/);
  assert.match(terminal, /typeof item\.price === "string"/);
  assert.doesNotMatch(terminal, /binance\.com|okx\.com|fapi\./i);
  assert.match(css, /aspect-ratio: 9 \/ 19\.5/);
  assert.match(css, /aspect-ratio: 4 \/ 3/);
  assert.match(css, /mask-image: linear-gradient\(#000 72%, transparent\)/);
  assert.match(css, /@property --ht-ret-n/);
  assert.match(css, /@keyframes ht-ret-count/);
  assert.doesNotMatch(css, /stroke-dash(?:array|offset)|box-shadow[^;]*animation/);
  assert.match(css, /animation-play-state: paused/);
  assert.match(css, /will-change: transform/);
  assert.match(css, /will-change: transform, opacity/);
});

test("home terminal budget is enforced as a hard gzipped cap", () => {
  const budget = readFileSync(new URL("../scripts/verify-build-budget.mjs", import.meta.url), "utf8");
  assert.match(budget, /HERO_TERMINAL_GZIP_MAX = 25_000/);
  assert.match(budget, /hero terminal JS\+CSS hard cap \(gzip\)/);
  assert.match(budget, /terminal-owner\.css/);
});
