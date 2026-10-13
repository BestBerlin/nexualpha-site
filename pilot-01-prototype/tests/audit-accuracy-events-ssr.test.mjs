import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { access, mkdtemp, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));

const sharedFeed = {
  generatedAt: "2026-10-13T10:00:00.000Z",
  items: [{
    id: "okx:https://www.okx.com/help/okx-current-shared-feed-notice",
    venue: "okx",
    category: "event",
    title: "OKX current shared feed notice",
    url: "https://www.okx.com/help/okx-current-shared-feed-notice",
    publishedAt: "2026-10-13T09:00:00.000Z",
    sourceType: "official_api",
  }],
};

test("the same official announcement fixture is visible in home, compare and profile SSR", async () => {
  const tempDir = await mkdtemp(path.join(projectRoot, "tests/.tmp-audit-events-ssr-"));
  try {
    const entryPath = path.join(tempDir, "entry.mjs");
    const bundlePath = path.join(tempDir, "bundle.cjs");
    await writeFile(entryPath, `
      import React from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { HomeBelowFold } from "../../src/components/v7/home7-below.jsx";
      import { H7_COPY } from "../../src/components/v7/home7-copy.js";
      import { CompareDeepPage } from "../../src/components/v3/V3Pages.jsx";
      import { VenueDetailPage } from "../../src/components/v3/VenueDetailPage.jsx";
      import { v3Copy } from "../../src/data/v3-product.js";
      import { venueDatabase } from "../../src/data/venue-database.js";

      const feed = ${JSON.stringify(sharedFeed)};
      const copy = { ...v3Copy("en"), common: { dimension: "Dimension", verifiedSource: "Verified source" }, assetCapabilities: { none: "Pending source review" }, decisionWorkbench: { discovered: "Discovered" } };
      const venues = Object.values(venueDatabase);
      const priced = [{ slug: "okx", name: "OKX", maker: 0.08, taker: 0.1, share: 0.4, code: "nexu888", url: "https://www.okx.com/join/nexu888", open: true, gross: 100, net: 60, save: 40 }];
      const calc = { rows: priced, best: priced[0], most: priced[0], maxGross: 100 };
      const noop = () => {};
      const home = renderToStaticMarkup(React.createElement(HomeBelowFold, { t: H7_COPY.en, locale: "en", market: "unknown", movers: null, vol: 100000, setVol: noop, mode: "taker", setMode: noop, product: "spot", setProduct: noop, calc, priced, initialOfficialAnnouncements: feed }));
      const compare = renderToStaticMarkup(React.createElement(CompareDeepPage, { copy, locale: "en", selected: ["binance", "okx"], venues, updates: feed.items, market: "unknown", product: "spot" }));
      const profile = renderToStaticMarkup(React.createElement(VenueDetailPage, { copy, locale: "en", venue: venueDatabase.okx, venues, updates: feed.items, market: "unknown", product: "spot" }));
      console.log(JSON.stringify({ home, compare, profile }));
    `);

    const esbuildBin = path.join(projectRoot, "node_modules/.bin/esbuild");
    await access(esbuildBin);
    execFileSync(esbuildBin, [
      entryPath,
      "--bundle",
      "--platform=node",
      "--format=cjs",
      `--outfile=${bundlePath}`,
      "--loader:.css=empty",
      "--log-level=warning",
    ], { cwd: projectRoot, stdio: "pipe" });

    const rendered = JSON.parse(execFileSync("node", [bundlePath], { cwd: projectRoot, encoding: "utf8" }));
    for (const [surface, html] of Object.entries(rendered)) {
      assert.match(html, /OKX current shared feed notice/, `${surface} should render the shared OKX notice`);
    }
    assert.doesNotMatch(rendered.home, /No current exchange notice/i);
    assert.doesNotMatch(rendered.profile, /No reviewed exchange activity|No current exchange notice/i);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});
