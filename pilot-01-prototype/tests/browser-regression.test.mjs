import assert from "node:assert/strict";
import test from "node:test";
import { isDirectoryComparisonHref, locales, parseArgs, regionalLocales, regionalRoutes, routes, run, viewports } from "../scripts/verify-browser.mjs";

test("browser regression plan covers every V3 route, locale, and viewport", async () => {
  const result = await run(parseArgs(["--dry-run", "--base-url", "http://localhost:4173"]));

  assert.equal(result.status, "DRY_RUN");
  assert.deepEqual(routes.map((route) => route.path), ["/", "/exchanges", "/exchanges/binance", "/compare/binance-vs-okx", "/activities"]);
  assert.ok(routes.find((route) => route.id === "compare-binance-okx").required.includes(".v3-compare-section-disclosure"));
  assert.equal(locales.length, 15);
  assert.deepEqual(viewports.map((viewport) => viewport.width), [375, 768, 1440]);
  assert.deepEqual(result.plan.screenshotLocales.sort(), ["ar", "en", "it", "zh-Hans", "zh-Hant"]);
});

test("browser regression evidence defaults to parent v3 repair artifacts", () => {
  const options = parseArgs([]);

  assert.match(options.artifactRoot, /artifacts\/v3-repair$/);
  assert.equal(options.baseUrl, "http://localhost:4173");
});

test("browser regression supports targeted interaction-only verification", () => {
  const options = parseArgs(["--interaction-only", "--mode", "anchor-smoke"]);

  assert.equal(options.interactionOnly, true);
  assert.equal(options.mode, "anchor-smoke");
});

test("browser regression accepts clean directory comparison hrefs and rejects noisy context", () => {
  assert.equal(isDirectoryComparisonHref("/compare/binance-vs-coinbase"), true);
  assert.equal(isDirectoryComparisonHref("/compare/binance-vs-coinbase?market=BR&product=spot&account_stage=ready&utm_source=directory"), true);
  assert.equal(isDirectoryComparisonHref("/compare/binance-vs-coinbase?locale=zh-Hans"), true);

  assert.equal(isDirectoryComparisonHref("/compare/binance-vs-coinbase?market=unknown"), false);
  assert.equal(isDirectoryComparisonHref("/compare/binance-vs-coinbase?product=unknown"), false);
  assert.equal(isDirectoryComparisonHref("/compare/binance-vs-coinbase?locale=en"), false);
  assert.equal(isDirectoryComparisonHref("/compare/binance-vs-coinbase?unexpected=stale"), false);
  assert.equal(isDirectoryComparisonHref("/compare/binance-vs-coinbase-vs-okx"), false);
  assert.equal(isDirectoryComparisonHref("/exchanges/binance"), false);
  assert.equal(isDirectoryComparisonHref("not a url"), false);
});

test("browser regression exposes an opt-in international regional matrix", async () => {
  const result = await run(parseArgs(["--dry-run", "--regional-only"]));

  assert.equal(result.status, "DRY_RUN");
  assert.equal(result.plan.regionalOnly, true);
  assert.deepEqual(result.plan.routes.map((route) => route.path), ["/br", "/mx", "/tw", "/id", "/hk", "/eu", "/uk"]);
  assert.deepEqual(result.plan.locales, regionalLocales);
  assert.equal(regionalRoutes.length, 7);
});

test("browser regression supports strict core data and prisma health verification", async () => {
  const result = await run(parseArgs(["--dry-run", "--expect-core", "--expect-prisma-health"]));

  assert.equal(result.plan.expectCore, true);
  assert.equal(result.plan.expectPrismaHealth, true);
});

test("browser regression keeps the mobile hero CTA bounds in scope", async () => {
  const source = await import("node:fs/promises").then((fs) => fs.readFile(new URL("../scripts/verify-browser.mjs", import.meta.url), "utf8"));

  assert.match(source, /requiredHeroLocales = new Set\(\["en", "zh-Hans", "zh-Hant"\]\)/);
  assert.match(source, /item\.height < 44 \|\| item\.height > 72/);
});

test("browser regression keeps homepage brand, slogan, h1, and comparison link gates in scope", async () => {
  const source = await import("node:fs/promises").then((fs) => fs.readFile(new URL("../scripts/verify-browser.mjs", import.meta.url), "utf8"));

  assert.match(source, /\.crossroads__card/);
  assert.match(source, /crossroads-comparison-navigates/);
  assert.match(source, /\.nexualpha-wordmark__mark, \.v2-brand/);
  assert.match(source, /logo\.objectFit !== "contain"/);
  assert.match(source, /\.hero-brand-slogan/);
  assert.match(source, /heroH1LineFailures/);
  assert.match(source, /\.crossroads__card/);
  assert.match(source, /home-comparison-links-navigate/);
});

test("browser regression keeps homepage section and locale continuity gates in scope", async () => {
  const source = await import("node:fs/promises").then((fs) => fs.readFile(new URL("../scripts/verify-browser.mjs", import.meta.url), "utf8"));

  assert.match(source, /homepage-core-sections-visible/);
  assert.match(source, /locale-core-sections-do-not-disappear/);
  assert.match(source, /dependencies\?\.repository\?\.source !== "prisma"/);
});

test("browser regression keeps route scroll budgets in scope", async () => {
  const source = await import("node:fs/promises").then((fs) => fs.readFile(new URL("../scripts/verify-browser.mjs", import.meta.url), "utf8"));

  assert.match(source, /const scrollBudgets =/);
  assert.match(source, /scrollBudgetFailures/);
  assert.match(source, /home: \{ 375: 16000/);
  assert.match(source, /activities: \{ 375: 22000/);
});

test("browser regression ignores children clipped by intentional horizontal scrollers", async () => {
  const source = await import("node:fs/promises").then((fs) => fs.readFile(new URL("../scripts/verify-browser.mjs", import.meta.url), "utf8"));

  assert.match(source, /const isInsideHorizontalScroller = \(element\) =>/);
  assert.match(source, /canScrollHorizontally && node\.scrollWidth > node\.clientWidth \+ 1/);
  assert.match(source, /if \(isInsideHorizontalScroller\(element\)\) return null;/);
});
