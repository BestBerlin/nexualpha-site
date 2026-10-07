import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));

const protectedHashes = {
  "src/data/partner-registry.js": "8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a",
  "src/data/venue-database.js": "0ce124afbe9f4758ce9ec093c79372550ce2e2e90a7342aa05ecc8d3482e1d52",
  "src/data/public-cta.js": "675875240d5fbb05498284a37f90a14488d6ace73d19b102caeb5add9e33f8e3",
  "src/data/regional-cta.js": "a2542bb137b6b6ff123a0d3c6b3a01b09e1e3a785ee223e3b4e04a3fe8aab665",
};

const protectedMaterial = /partner\.bitget|accounts\.binance|bsmkweb|topzhjdgxcb|\bref=|\binviteCode=|11350287|nexu888|\baffiliate_id=|private commission/i;

async function bundleAndRun(source) {
  const tempDir = await mkdtemp(path.join(projectRoot, "tests/.tmp-r46-news-decision-bridge-"));
  try {
    const entryPath = path.join(tempDir, "entry.mjs");
    const bundlePath = path.join(tempDir, "bundle.cjs");
    await writeFile(entryPath, source);

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

    return execFileSync("node", [bundlePath], { cwd: projectRoot, encoding: "utf8", maxBuffer: 8 * 1024 * 1024 });
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

function articleFixture(overrides) {
  return {
    slug: "okx-usd-to-usdc-spot-pair-migration",
    categoryName: { en: "Exchange operations" },
    publishedAt: "2026-09-29T00:00:00Z",
    readTime: "5 min",
    author: "NexuAlpha Research",
    title: { en: "OKX USD to USDC spot pair migration" },
    summary: { en: "A source-bound fixture for OKX account operations." },
    content: { en: "## Direct answer\nReview the migration before changing account routes.\n\n## Comparison at a glance\nThe longer article continues here." },
    relatedVenues: ["okx"],
    sources: [{ id: "official", publisher: "Official source", title: "Official notice", url: "https://example.com/official" }],
    seo: { internalLinkTargets: ["/compare/binance-vs-okx", "/exchanges/okx"] },
    ...overrides,
  };
}

test("R46 OKX migration news bridge keeps Binance vs OKX comparison and internal registration checks", async () => {
  const output = await bundleAndRun(`
    import React from "react";
    import { renderToStaticMarkup } from "react-dom/server";
    import { NewsDetailPage } from "../../src/components/v3/news/NewsDetailPage.jsx";

    const article = ${JSON.stringify(articleFixture())};
    const html = renderToStaticMarkup(React.createElement(NewsDetailPage, {
      slug: article.slug,
      locale: "en",
      market: "GLOBAL",
      product: "spot",
      initialArticles: [article],
    }));
    console.log(JSON.stringify({ html }));
  `);
  const { html } = JSON.parse(output);

  assert.match(html, /href="\/compare\/binance-vs-okx\?market=GLOBAL&amp;product=spot"/);
  assert.match(html, /href="\/exchanges\/okx\?market=GLOBAL&amp;product=spot#registration-path"/);
  assert.doesNotMatch(html, /href="\/exchanges\/binance\?market=GLOBAL&amp;product=spot#registration-path"/);
  assert.match(html, /data-next-decision-action="compare"/);
  assert.match(html, /data-cta-placement="news-detail-venue-card"/);
  assert.doesNotMatch(html, protectedMaterial);
});

test("R46 Hyperliquid news bridge sends readers to derivatives guide and side-by-side comparison", async () => {
  const hyperliquidArticle = articleFixture({
    slug: "hyperliquid-vs-dydx",
    title: { en: "Hyperliquid vs dYdX" },
    summary: { en: "A source-bound fixture for perpetual venue decisions." },
    content: { en: "## Direct answer\nSeparate collateral, custody and liquidation mechanics first.\n\n## Comparison at a glance\nThe longer article continues here." },
    relatedVenues: ["hyperliquid", "dydx"],
    seo: { internalLinkTargets: ["/topics/derivatives", "/compare/hyperliquid-vs-dydx"] },
  });

  const output = await bundleAndRun(`
    import React from "react";
    import { renderToStaticMarkup } from "react-dom/server";
    import { NewsDetailPage } from "../../src/components/v3/news/NewsDetailPage.jsx";

    const article = ${JSON.stringify(hyperliquidArticle)};
    const html = renderToStaticMarkup(React.createElement(NewsDetailPage, {
      slug: article.slug,
      locale: "en",
      market: "GLOBAL",
      product: "perpetuals",
      initialArticles: [article],
    }));
    console.log(JSON.stringify({ html }));
  `);
  const { html } = JSON.parse(output);

  assert.match(html, /href="\/compare\/hyperliquid-vs-dydx\?market=GLOBAL&amp;product=perpetuals"/);
  assert.match(html, /href="\/topics\/derivatives\?market=GLOBAL&amp;product=perpetuals"/);
  assert.match(html, /href="\/exchanges\/hyperliquid\?market=GLOBAL&amp;product=perpetuals#registration-path"/);
  assert.match(html, /href="\/exchanges\/dydx\?market=GLOBAL&amp;product=perpetuals#registration-path"/);
  assert.doesNotMatch(html, protectedMaterial);
});

test("R46 news decision bridge preserves protected commercial registries", async () => {
  for (const [relativePath, expectedHash] of Object.entries(protectedHashes)) {
    const file = await readFile(new URL(`../${relativePath}`, import.meta.url));
    assert.equal(createHash("sha256").update(file).digest("hex"), expectedHash, relativePath);
  }
});
