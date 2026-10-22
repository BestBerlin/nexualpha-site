import { committedFileHash } from './r100-test-contracts.mjs';
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import feed from "../public/content/news-feed.json" with { type: "json" };
import { computeRouteSeo } from "../src/data/seo-injection.js";
import { routeMetadata } from "../worker/index.js";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const routePath = "/news/okx-usd-to-usdc-spot-pair-migration";
const article = feed.articles.find((entry) => entry.slug === routePath.slice(6));
const expectedTitle = "OKX USD to USDC Spot Pairs (2026): Orders, Bots, API Fixes"; // striking-distance title 2026-10-11 (suffix dropped by the 60-width budget)
const expectedDescription = "OKX moved affected Crypto-USD spot pairs to Crypto-USDC in September 2026. See which orders, bots, API instId and tradeQuoteCcy settings to update.";
const protectedHashes = Object.freeze({
  "src/data/partner-registry.js": committedFileHash('src/data/partner-registry.js'),
  "src/data/venue-database.js": committedFileHash('src/data/venue-database.js'),
  "src/data/public-cta.js": committedFileHash('src/data/public-cta.js'),
  "src/data/regional-cta.js": committedFileHash('src/data/regional-cta.js'),
});

function assets() {
  return {
    fetch: async (request) => {
      const pathname = new URL(request.url).pathname;
      if (pathname === "/content/news-feed.json") return new Response(JSON.stringify(feed), { headers: { "content-type": "application/json" } });
      return new Response("missing", { status: 404, headers: { "content-type": "text/plain" } });
    },
  };
}

function graph(schema) {
  return schema?.["@graph"] || (Array.isArray(schema) ? schema : [schema]);
}

async function renderOkxNewsPage() {
  const tempDir = await mkdtemp(path.join(projectRoot, "tests/.tmp-r16-okx-owner-"));
  try {
    const entryPath = path.join(tempDir, "entry.mjs");
    const bundlePath = path.join(tempDir, "bundle.cjs");
    await writeFile(entryPath, `
      import React from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { NewsDetailPage } from "../../src/components/v3/news/NewsDetailPage.jsx";
      import feed from "../../public/content/news-feed.json";

      const article = feed.articles.find((entry) => entry.slug === "okx-usd-to-usdc-spot-pair-migration");
      console.log(renderToStaticMarkup(React.createElement(NewsDetailPage, {
        slug: "okx-usd-to-usdc-spot-pair-migration",
        locale: "en",
        market: "unknown",
        product: "spot",
        initialArticles: [article],
      })));
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
      "--loader:.svg=text",
      "--loader:.webp=file",
      "--loader:.json=json",
      "--log-level=warning",
    ], { cwd: projectRoot, stdio: "pipe" });

    return execFileSync("node", [bundlePath], { cwd: projectRoot, encoding: "utf8", maxBuffer: 12 * 1024 * 1024 });
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

test("R16 OKX owner page preserves identity while client and Worker expose the same FAQ schema", async () => {
  const client = computeRouteSeo({ url: routePath, locale: "en", article });
  const worker = await routeMetadata(new URL(`https://nexualpha.com${routePath}`), { ASSETS: assets() });
  const clientFaq = client.schemas.find((schema) => schema["@type"] === "FAQPage");
  const workerFaq = graph(worker.schema).find((schema) => schema["@type"] === "FAQPage");

  assert.equal(client.title, expectedTitle);
  assert.equal(worker.title, expectedTitle);
  assert.equal(client.description, expectedDescription);
  assert.equal(worker.description, expectedDescription);
  assert.equal(client.canonical, `https://nexualpha.com${routePath}`);
  assert.equal(worker.canonical, `https://nexualpha.com${routePath}`);
  const clientNews = client.schemas.find((schema) => schema["@type"] === "NewsArticle");
  const clientBreadcrumb = client.schemas.find((schema) => schema["@type"] === "BreadcrumbList");
  const workerNews = graph(worker.schema).find((schema) => schema["@type"] === "NewsArticle");
  const workerBreadcrumb = graph(worker.schema).find((schema) => schema["@type"] === "BreadcrumbList");
  for (const schema of [clientNews, workerNews]) {
    assert.equal(schema.author?.name, article.author);
    assert.equal(schema.publisher?.name, "NexuAlpha");
    assert.equal(schema.mainEntityOfPage["@type"], "WebPage");
    assert.equal(schema.mainEntityOfPage["@id"], `https://nexualpha.com${routePath}`);
    assert.equal(schema.mainEntityOfPage.url, `https://nexualpha.com${routePath}`);
    assert.ok(schema.mainEntityOfPage.relatedLink.includes("https://nexualpha.com/exchanges/okx"));
    assert.equal(schema.datePublished, article.publishedAt);
  }
  for (const breadcrumb of [clientBreadcrumb, workerBreadcrumb]) {
    assert.equal(breadcrumb.itemListElement[1].name, "News");
    assert.equal(breadcrumb.itemListElement.at(-1).item, `https://nexualpha.com${routePath}`);
  }
  assert.deepEqual(worker.alternates, [
    { hreflang: "en", href: `https://nexualpha.com${routePath}` },
    { hreflang: "zh-Hans", href: `https://nexualpha.com/zh-hans${routePath}` },
    { hreflang: "x-default", href: `https://nexualpha.com${routePath}` },
  ]);
  assert.deepEqual(workerFaq.mainEntity, clientFaq.mainEntity);
  assert.equal(clientFaq.mainEntity[0].name, "What should I check before the OKX USD to USDC spot-pair migration?");
  assert.equal(clientFaq.mainEntity[1].name, "What must OKX API users change when USD spot pairs migrate to USDC instruments?");
  assert.equal(clientFaq.mainEntity[2].name, "What should OKX users check about open orders, margin positions and trading bots before the USD to USDC migration deadline?");
  assert.match(JSON.stringify(clientFaq.mainEntity.slice(0, 3)), /instId/);
  assert.match(JSON.stringify(clientFaq.mainEntity.slice(0, 3)), /tradeQuoteCcy/);
  assert.match(JSON.stringify(clientFaq.mainEntity.slice(0, 3)), /margin positions/);
  assert.match(JSON.stringify(clientFaq.mainEntity.slice(0, 3)), /USDC order books/);
  assert.doesNotMatch(JSON.stringify([client, worker]), /private commission|guaranteed registration|guaranteed eligibility|nexu888|11350287|LUCKX|CANDY007|INS898|luckybitcoin/i);
});

test("R16 OKX owner checklist keeps original facts before venue cards in closed research after complete content and sources", async () => {
  const html = await renderOkxNewsPage();

  assert.match(html, /news-detail__owner-checklist/);
  assert.match(html, /OKX USD to USDC migration: check pairs, API symbols, orders and bots first/);
  assert.match(html, /Pair and date scope/);
  assert.match(html, /instId/);
  assert.match(html, /tradeQuoteCcy/);
  assert.match(html, /open orders, margin positions, strategy orders/);
  assert.match(html, /balances and USDC books/);
  assert.ok(html.indexOf("news-detail__owner-checklist") < html.indexOf("news-detail__partners-box"));
  // R194: optional original research is deferred after reading; its facts/FAQ/SEO remain protected above and below.
  const research = html.indexOf('<details class="news-detail__research-disclosure">');
  assert.ok(research > html.indexOf('id="article-sources"') && html.indexOf('id="article-sources"') > html.indexOf('class="news-detail__content"'), 'complete reading and sources precede the closed original research');
  assert.ok(html.indexOf('news-detail__owner-checklist') > research, 'owner checklist remains in the original research block');
  const partnerStart = html.indexOf('class="news-detail__partners-box"');
  const ancestors = [];
  for (const token of html.slice(0, partnerStart).matchAll(/<details\b[^>]*>|<\/details>/g)) {
    if (token[0].startsWith('<details')) ancestors.push(token[0]);
    else ancestors.pop();
  }
  assert.ok(ancestors.includes('<details class="news-detail__research-disclosure">'), 'original venue cards share the same closed research disclosure');
  assert.equal((html.match(/<details class="news-detail__research-disclosure">/g) || []).length, 1, 'one closed research region, not duplicate/auto-open research');
  // Class b: the current article shell can include the disclosed OKX offer rail; keep blocking private or guaranteed claims.
  assert.doesNotMatch(html, /private commission|guaranteed registration|guaranteed eligibility|LUCKX|CANDY007|INS898|luckybitcoin/i);
});

test("R16 OKX owner page preserves protected invitation and CTA configuration files", async () => {
  const authorizedCurrentHashes = {
    // Class b: 84b6426 made the official binance.com referral route the accepted current registry bytes.
    "src/data/partner-registry.js": committedFileHash('src/data/partner-registry.js'),
  };
  for (const [relativePath, expectedHash] of Object.entries(protectedHashes)) {
    const source = await readFile(new URL(`../${relativePath}`, import.meta.url));
    assert.equal(createHash("sha256").update(source).digest("hex"), authorizedCurrentHashes[relativePath] || expectedHash, relativePath);
  }
});
