import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));

async function renderStatic(source, tmpPrefix) {
  const dir = await mkdtemp(path.join(root, `tests/.tmp-${tmpPrefix}-`));
  try {
    const entry = path.join(dir, "entry.mjs");
    const bundle = path.join(dir, "bundle.cjs");
    await writeFile(entry, source);
    const esbuild = path.join(root, "node_modules/.bin/esbuild");
    await access(esbuild);
    execFileSync(esbuild, [
      entry,
      "--bundle",
      "--platform=node",
      "--format=cjs",
      `--outfile=${bundle}`,
      "--loader:.css=empty",
      "--log-level=warning",
    ], { cwd: root, stdio: "pipe" });
    return JSON.parse(execFileSync("node", [bundle], { cwd: root, encoding: "utf8" }));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test("Platform matcher disclosure has a named section and keyboard-visible trigger", async () => {
  const [component, css] = await Promise.all([
    readFile(new URL("../src/components/v3/PlatformMatcher.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/v3/matcher.css", import.meta.url), "utf8"),
  ]);

  assert.match(component, /<section className="v2-section platform-matcher" aria-labelledby="platform-matcher-title">/);
  assert.match(component, /<summary className="platform-matcher__summary">/);
  assert.match(component, /<strong id="platform-matcher-title">/);
  assert.match(css, /\.platform-matcher__summary:focus-visible \{[\s\S]*outline: 2px solid var\(--blue-text\);[\s\S]*outline-offset: 4px;/);
  assert.match(css, /\.platform-matcher__summary \{[\s\S]*min-block-size: 72px;/);
});

test("Bitget registration card exposes referral copy and handoff controls with accessible state labels", async () => {
  const html = await renderStatic(`
    import React from "react";
    import { renderToStaticMarkup } from "react-dom/server";
    import { RegistrationCard } from "../../src/components/v3/RegistrationCard.jsx";
    console.log(JSON.stringify(renderToStaticMarkup(React.createElement(RegistrationCard, {
      venueSlug: "bitget",
      fallbackDomain: "www.bitget.com",
      locale: "en",
      market: "unknown",
      product: "spot",
    }))));
  `, "r38-registration-a11y");

  assert.match(html, /<button[^>]+class="registration-card__copy-btn"[^>]*>Copy Code<\/button>/);
  assert.match(html, /<div class="registration-card__state-list" role="group" aria-label="Partner route, user benefit and regional eligibility">/);
  assert.match(html, /<details class="registration-card__mobile-route-details" open="">/);
  assert.match(html, /<summary class="registration-card__mobile-route-summary">/);
  assert.match(html, /href="https:\/\/partner\.bitget\.cafe\/bg\/C6PRAF"/);
  assert.match(html, /rel="sponsored noopener noreferrer"/);
  assert.match(html, /data-registration-decision-state="verify-first"/);
});

test("Registration card keyboard controls keep visible focus and minimum target size", async () => {
  const css = await readFile(new URL("../src/components/v3/registration-card.css", import.meta.url), "utf8");

  assert.match(css, /\.registration-card__copy-btn:focus-visible/);
  assert.match(css, /\.registration-card__primary-btn:focus-visible/);
  assert.match(css, /\.registration-card__research-actions a:focus-visible/);
  assert.match(css, /\.registration-card__mobile-route-details > summary:focus-visible/);
  assert.match(css, /\.registration-card__disclosure-details summary:focus-visible/);
  assert.match(css, /\.registration-card__copy-btn \{[\s\S]*min-height: 44px;/);
  assert.match(css, /\.registration-card__primary-btn \{[\s\S]*min-height: 44px;/);
});

test("Regional decision depth sections are named by their visible headings", async () => {
  const html = await renderStatic(`
    import React from "react";
    import { renderToStaticMarkup } from "react-dom/server";
    import { RegionalMarketDecisionDepth } from "../../src/components/v3/international/RegionalMarketDecisionDepth.jsx";
    console.log(JSON.stringify({
      eu: renderToStaticMarkup(React.createElement(RegionalMarketDecisionDepth, { market: "EU" })),
      uk: renderToStaticMarkup(React.createElement(RegionalMarketDecisionDepth, { market: "UK" })),
      jp: renderToStaticMarkup(React.createElement(RegionalMarketDecisionDepth, { market: "JP" })),
    }));
  `, "r38-regional-depth-a11y");

  assert.match(html.eu, /<section class="regional-decision-depth v3-card" data-regional-decision-depth="EU" lang="en" aria-labelledby="regional-decision-depth-title-EU">/);
  assert.match(html.eu, /<h2 id="regional-decision-depth-title-EU">France and Germany are evidence signals/);
  assert.match(html.uk, /aria-labelledby="regional-decision-depth-title-UK"/);
  assert.match(html.uk, /<h2 id="regional-decision-depth-title-UK">Four checks before treating a UK account route as ready<\/h2>/);
  assert.match(html.jp, /aria-labelledby="regional-decision-depth-title-JP"/);
  assert.match(html.jp, /<h2 id="regional-decision-depth-title-JP">登録前に、FSA登録、本人確認、JPY入金、商品範囲を分けて確認<\/h2>/);
});

test("Regional decision depth disclosure summaries have visible focus and touch target size", async () => {
  const css = await readFile(new URL("../src/components/v3/international/regional-market-decision-depth.css", import.meta.url), "utf8");

  assert.match(css, /\.regional-decision-depth__steps summary \{[\s\S]*min-height: 44px;/);
  assert.match(css, /\.regional-decision-depth__steps summary:focus-visible \{[\s\S]*outline: 2px solid var\(--blue-text, #53b1fd\);/);
  assert.match(css, /\.regional-decision-depth__steps summary::-webkit-details-marker \{[\s\S]*display: none;/);
});
