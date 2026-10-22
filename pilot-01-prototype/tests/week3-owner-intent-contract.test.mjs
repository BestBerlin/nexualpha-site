import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { compareDirectAnswerFor } from "../src/data/compare-direct-answers.js";
import { priorityVenueAnswerFor } from "../src/data/priority-venue-answers.js";
import { TOKENIZED_ASSET_PAGES } from "../src/data/tokenized-assets-cluster.js";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));

async function renderOwnerIntentFixture() {
  const tempDir = await mkdtemp(path.join(projectRoot, "tests/.tmp-week3-owner-intent-"));
  try {
    const entryPath = path.join(tempDir, "entry.jsx");
    await writeFile(entryPath, `
      import React from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { CompareDeepPage } from "../../src/components/v3/V3Pages.jsx";
      import { VenueDetailPage } from "../../src/components/v3/VenueDetailPageStatic.jsx";
      import { TokenizedAssetsPage } from "../../src/components/v3/TokenizedAssetsPage.jsx";
      import { venueDatabase } from "../../src/data/venue-database.js";
      import { v3Copy } from "../../src/data/v3-product.js";

      const venues = Object.values(venueDatabase);
      const copy = { ...v3Copy("en"), common: { dimension: "Dimension" }, assetCapabilities: { none: "None" } };
      const renderVenue = (slug) => renderToStaticMarkup(<VenueDetailPage copy={copy} locale="en" venue={venueDatabase[slug]} venues={venues} updates={[]} market="unknown" product="unknown" />);
      const renderCompare = (selected) => renderToStaticMarkup(<CompareDeepPage copy={copy} locale="en" selected={selected} venues={venues} updates={[]} market="unknown" product="unknown" />);
      const renderTopic = (slug) => renderToStaticMarkup(<TokenizedAssetsPage slug={slug} locale="en" />);

      console.log(JSON.stringify({
        venues: {
          hyperliquid: renderVenue("hyperliquid"),
          uniswap: renderVenue("uniswap"),
          gmx: renderVenue("gmx"),
          drift: renderVenue("drift"),
        },
        compares: {
          bybitBitget: renderCompare(["bybit", "bitget"]),
          hyperliquidDydx: renderCompare(["hyperliquid", "dydx"]),
        },
        topics: {
          tokenizedAssets: renderTopic("tokenized-assets"),
          tokenizedTreasuries: renderTopic("tokenized-treasuries"),
          tokenizedStocks: renderTopic("tokenized-stocks-vs-perpetuals"),
        },
      }));
    `);

    const esbuildBin = path.join(projectRoot, "node_modules/.bin/esbuild");
    await access(esbuildBin);
    const bundlePath = path.join(tempDir, "bundle.cjs");
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

    return JSON.parse(execFileSync(process.execPath, [bundlePath], { cwd: projectRoot, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }));
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

test("priority venue answers expose owner questions and one primary next action", () => {
  const cases = [
    ["hyperliquid", /Should you use Hyperliquid/, "/compare/hyperliquid-vs-dydx"],
    ["uniswap", /Should you use Uniswap/, "/compare/uniswap-vs-jupiter"],
    ["gmx", /Should you use GMX/, "/topics/derivatives#perp-cost-field-dictionary"],
    ["drift", /Should you open Drift/, "/compare/hyperliquid-vs-dydx"],
  ];

  for (const [slug, questionPattern, href] of cases) {
    const answer = priorityVenueAnswerFor(slug, "en");
    assert.match(answer.ownerQuestion, questionPattern);
    assert.deepEqual(answer.primaryNextAction?.[1], href);
  }
});

test("compare direct answers expose owner questions and support-page next actions", () => {
  const bybitBitget = compareDirectAnswerFor("bybit-vs-bitget", "en");
  assert.match(bybitBitget.ownerQuestion, /Bybit vs Bitget.*fees.*KYC/i);
  assert.deepEqual(bybitBitget.primaryNextAction, ["Open the product-specific evidence first", "/topics/tokenized-stocks-vs-perpetuals"]);

  const hyperliquidDydx = compareDirectAnswerFor("hyperliquid-vs-dydx", "en");
  assert.match(hyperliquidDydx.ownerQuestion, /Hyperliquid vs dYdX.*fees.*KYC/i);
  assert.deepEqual(hyperliquidDydx.primaryNextAction, ["Read the dated source explainer first", "/news/hyperliquid-vs-dydx"]);
});

test("SSR renders owner-level H1s and tokenized topic primary actions", async () => {
  const html = await renderOwnerIntentFixture();

  for(const [slug, brand] of [['hyperliquid','Hyperliquid'],['uniswap','Uniswap'],['gmx','GMX'],['drift','Drift']]){
    const headings=[...html.venues[slug].matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)];
    assert.equal(headings.length,1,slug+' single owner heading');
    assert.ok(headings[0][1].includes(brand),slug+' venue identity in owner heading');
  }
  for(const [key, pair] of [['bybitBitget','bybit-vs-bitget'],['hyperliquidDydx','hyperliquid-vs-dydx']]){
    const h1=html.compares[key].match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)?.[1];
    assert.equal(h1,compareDirectAnswerFor(pair,'en').ownerQuestion,pair+' visible owner question');
  }

  assert.match(html.topics.tokenizedAssets, /href="\/topics\/tokenized-treasuries"[^>]*data-cta-placement="tokenized-assets-primary-next-action"/);
  assert.match(html.topics.tokenizedTreasuries, /href="\/news\/tokenized-treasuries-structure-access-risks"[^>]*data-cta-placement="tokenized-assets-primary-next-action"/);
  assert.match(html.topics.tokenizedStocks, /href="\/compare\/bybit-vs-bitget"[^>]*data-cta-placement="tokenized-assets-primary-next-action"/);
});

test("tokenized support pages keep a single configured primary next action", async () => {
  const source = await readFile(new URL("../src/components/v3/TokenizedAssetsPage.jsx", import.meta.url), "utf8");
  assert.match(source, /tokenized-assets-primary-next-action/);

  for (const [slug, page] of Object.entries(TOKENIZED_ASSET_PAGES)) {
    assert.ok(page.nextAction?.label?.en, `${slug}: next action label`);
    assert.match(page.nextAction.href, /^\/(?:topics|news|compare)\//, `${slug}: internal next action`);
  }
});
