import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { compareDirectAnswerFor } from "../src/data/compare-direct-answers.js";
import { localizedPath } from "../src/data/locale-routing.js";
import { computeRouteSeo } from "../src/data/seo-injection.js";
import { sitemapLocalesForRoute } from "../scripts/sitemap-publication-policy.mjs";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));

const qaPairs = (faq) => faq.mainEntity.map((entry) => [entry.name, entry.acceptedAnswer.text]);

async function renderComparePage(slugs, locale = "en") {
  const tempDir = await mkdtemp(path.join(projectRoot, "tests/.tmp-owner-compare-"));
  try {
    const entryPath = path.join(tempDir, "entry.mjs");
    await writeFile(entryPath, `
      import React from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { CompareDeepPage } from "../../src/components/v3/V3Pages.jsx";
      import { venueDatabase } from "../../src/data/venue-database.js";
      import { v3Copy } from "../../src/data/v3-product.js";
      const locale = ${JSON.stringify(locale)};
      const html = renderToStaticMarkup(React.createElement(CompareDeepPage, {
        copy: { ...v3Copy(locale), common: { dimension: "Dimension" }, assetCapabilities: { none: "None" } },
        locale,
        selected: ${JSON.stringify(slugs)},
        venues: Object.values(venueDatabase),
        updates: [],
        market: "unknown",
        product: "swap",
      }));
      console.log(html);
    `);

    const esbuildBin = path.join(projectRoot, "node_modules/.bin/esbuild");
    const bundlePath = path.join(tempDir, "bundle.cjs");
    await access(esbuildBin);
    execFileSync(esbuildBin, [
      entryPath,
      "--bundle",
      "--platform=node",
      "--format=cjs",
      `--outfile=${bundlePath}`,
      "--loader:.css=empty",
      "--loader:.svg=text",
      "--loader:.webp=file",
      "--log-level=warning",
    ], { cwd: projectRoot, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });

    const bundle = await readFile(bundlePath, "utf8");
    return execFileSync("node", ["-"], { cwd: projectRoot, input: bundle, encoding: "utf8", maxBuffer: 8 * 1024 * 1024 });
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

test("Uniswap vs Jupiter compare page is indexable and schema stays bounded by the visible support answer", () => {
  const answer = compareDirectAnswerFor("uniswap-vs-jupiter", "en");
  const seo = computeRouteSeo({ url: "/compare/uniswap-vs-jupiter", locale: "en" });
  const page = seo.schemas.find((schema) => schema["@type"] === "WebPage");
  const faq = seo.schemas.find((schema) => schema["@type"] === "FAQPage")
    || seo.schemas.find((schema) => schema.subjectOf?.["@type"] === "FAQPage")?.subjectOf;
  const visibleQa = [[answer.seoQuestion, answer.body], ...answer.faq];

  assert.equal(seo.status, 200);
  assert.equal(seo.robots, "index,follow");
  assert.equal(seo.canonical, "https://nexualpha.com/compare/uniswap-vs-jupiter");
  assert.equal(page.dateModified, answer.reviewedAt);
  assert.match(seo.title, /Uniswap vs Jupiter: Chain, Route, Fees and Wallet Preview Checks/);
  assert.match(seo.description, /token contract or mint, route source, slippage/);
  assert.deepEqual(qaPairs(faq), visibleQa);
  assert.equal(answer.primaryNextAction[1], "/exchanges/uniswap");
  assert.ok(answer.internalLinks.some(([, href]) => href === "/exchanges/uniswap"));
  assert.match(answer.boundary, /cannot confirm token safety/);
  assert.doesNotMatch(JSON.stringify([seo, answer]), /\bnexu888\b|11350287|private commission|guaranteed|risk-free/i);
});

test("Uniswap vs Jupiter SSR exposes source-bound support body, limitations and primary next step", async () => {
  const html = await renderComparePage(["uniswap", "jupiter"]);
  const start = html.indexOf('class="v3-compare-final-choice-card"');
  const end = html.indexOf('id="compare-versus-card"', start);
  assert.ok(start > 0 && end > start, "final choice card should render before versus cards");
  const block = html.slice(start, end);

  assert.match(block, /Uniswap vs Jupiter: compare chain, router, token mint, fees and wallet preview before signing\./);
  assert.match(block, /Compare Uniswap and Jupiter as wallet-connected swap routes, not as exchange accounts/);
  assert.match(block, /Official Uniswap and Jupiter sources reviewed September 22, 2026/);
  assert.match(block, /Review the Uniswap owner page first/);
  assert.match(block, /href="\/exchanges\/uniswap"/);
  assert.match(block, /This comparison cannot confirm token safety, route execution, final cost/);
  assert.match(block, /Uniswap supported chains/);
  assert.match(block, /Jupiter Ultra API/);
});

test("Owner compare support routes enter sitemap locales and public llms support-owner records", async () => {
  assert.deepEqual(
    sitemapLocalesForRoute({ pathname: "/compare/uniswap-vs-jupiter", template: "comparison", index: true, expectedStatus: 200 }),
    ["en", "zh-Hans", "ja", "ko", "tr"],
  );
  assert.deepEqual(
    sitemapLocalesForRoute({ pathname: "/compare/hyperliquid-vs-dydx", template: "comparison", index: true, expectedStatus: 200 }),
    ["en", "zh-Hans", "ja", "ko", "tr"],
  );

  const tempDir = await mkdtemp(path.join(projectRoot, "tests/.tmp-owner-llms-"));
  try {
    execFileSync("node", ["scripts/generate-public-llms.mjs"], {
      cwd: projectRoot,
      env: { ...process.env, NEXUALPHA_LLMS_OUTPUT_DIR: tempDir },
      encoding: "utf8",
      maxBuffer: 16 * 1024 * 1024,
    });
    const llms = await readFile(path.join(tempDir, "llms.txt"), "utf8");
    const full = await readFile(path.join(tempDir, "llms-full.txt"), "utf8");
    for (const content of [llms, full]) {
      assert.match(content, /## Support-owner comparison records/);
      assert.match(content, /Canonical: https:\/\/nexualpha\.com\/compare\/uniswap-vs-jupiter/);
      assert.match(content, /Canonical: https:\/\/nexualpha\.com\/compare\/hyperliquid-vs-dydx/);
      assert.match(content, /Robots: index,follow/);
      assert.match(content, /Reviewed: 2026-09-22/);
      assert.match(content, /Primary next step: Review the Uniswap owner page first: https:\/\/nexualpha\.com\/exchanges\/uniswap/);
      assert.match(content, /Limitations: This comparison cannot confirm token safety/);
      assert.match(content, /Support-owner answer: Compare Hyperliquid and dYdX by execution model/);
    }
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("Localized path helper does not create a new canonical URL for the default Uniswap Jupiter route", () => {
  assert.equal(localizedPath("/compare/uniswap-vs-jupiter", "en"), "/compare/uniswap-vs-jupiter");
});
