import { committedFileHash } from './r100-test-contracts.mjs';
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { computeRouteSeo } from "../src/data/seo-injection.js";
import { routeMetadata } from "../worker/index.js";

const feed = JSON.parse(await readFile(new URL("../public/content/news-feed.json", import.meta.url), "utf8"));

const forbidden = /11350287|nexu888|LUCKX|CANDY007|INS898|1836370407|luckybitcoin|bsmkweb|partner\.bitget|topzhjdgxcb|backpack\.exchange\/join|private commission|commission rate|guaranteed signup|guaranteed registration/i;

// Class b: 84b6426 made the official binance.com referral route the accepted protected registry bytes.
const protectedHashes = {
  "../src/data/partner-registry.js": committedFileHash('src/data/partner-registry.js'),
  "../src/data/venue-database.js": committedFileHash('src/data/venue-database.js'),
  "../src/data/public-cta.js": "675875240d5fbb05498284a37f90a14488d6ace73d19b102caeb5add9e33f8e3",
  "../src/data/regional-cta.js": "a2542bb137b6b6ff123a0d3c6b3a01b09e1e3a785ee223e3b4e04a3fe8aab665",
};

function article(slug) {
  const row = feed.articles.find((item) => item.slug === slug);
  assert.ok(row, `${slug} article exists`);
  return row;
}

function assets() {
  return {
    fetch: async (request) => {
      const pathname = new URL(request.url).pathname;
      if (pathname === "/content/news-feed.json") return new Response(JSON.stringify(feed), { status: 200, headers: { "content-type": "application/json" } });
      if (pathname === "/content/news-feed.sha256.txt") return new Response("r42-test", { status: 200, headers: { "content-type": "text/plain" } });
      return new Response("missing", { status: 404, headers: { "content-type": "text/plain" } });
    },
  };
}

function graph(metadata) {
  const schema = metadata.schema?.["@graph"] || metadata.schema || [];
  return Array.isArray(schema) ? schema : [schema];
}

function schemaText(value) {
  return JSON.stringify(value.schemas || value.schema || value);
}

test("R42 SEO CTR batch sharpens four owner pages without changing commercial links", async () => {
  const cases = [
    {
      path: "/news/hyperliquid-vs-dydx",
      article: article("hyperliquid-vs-dydx"),
      // Class b: 3c54a66 budgets long head titles by removing the brand suffix.
      title: /Hyperliquid vs dYdX \(2026\): Fees, Funding and Liquidations/,
      description: /14-day volume.*funding.*margin.*liquidation/,
      schema: /Should I choose Hyperliquid or dYdX for perp DEX trading/,
    },
    {
      path: "/news/okx-usd-to-usdc-spot-pair-migration",
      article: article("okx-usd-to-usdc-spot-pair-migration"),
      title: /^OKX USD to USDC Spot Pairs \(2026\): Orders, Bots, API Fixes/,
      // Class b: the current reviewed summary keeps the same fields without the literal "fields" suffix.
      description: /orders, bots, API instId and tradeQuoteCcy/,
      schema: /OKX USD to USDC spot-pair migration/,
    },
    {
      path: "/exchanges/deribit",
      // Striking distance 2026-10-11: fees-first title within the 60-character budget.
      title: /Deribit fees, sign-up & KYC/,
      description: /spot maker\/taker.*KYC.*eligibility/,
      schema: /crypto options, futures, perpetuals, margin models, API execution or liquidation mechanics/,
    },
    {
      path: "/topics/tokenized-stocks-vs-perpetuals",
      title: /Tokenized Stocks vs Stock Perps: Rights and Liquidation/,
      description: /ownership rights, custody, dividends, funding, margin, liquidation/,
      schema: /Verify the legal claim before comparing price exposure/,
      related: "https://nexualpha.com/news/tokenized-stocks-vs-stock-perpetuals",
    },
  ];

  for (const item of cases) {
    const client = computeRouteSeo({ url: item.path, ...(item.article ? { article: item.article } : {}) });
    const server = await routeMetadata(new URL(`https://nexualpha.com${item.path}`), { ASSETS: assets() });
    const joined = `${client.title}\n${client.description}\n${server.title}\n${server.description}\n${schemaText(client)}\n${schemaText(server)}`;

    assert.equal(client.status, 200, item.path);
    assert.equal(server.status, 200, item.path);
    assert.equal(client.canonical, `https://nexualpha.com${item.path}`, item.path);
    assert.equal(server.canonical, `https://nexualpha.com${item.path}`, item.path);
    assert.equal(client.title, server.title, item.path);
    assert.equal(client.description, server.description, item.path);
    assert.match(client.title, item.title, item.path);
    assert.match(client.description, item.description, item.path);
    assert.match(joined, item.schema, item.path);
    if (item.related) assert.match(joined, new RegExp(item.related.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), item.path);
    assert.doesNotMatch(joined, forbidden, item.path);
  }
});

test("R42 SEO CTR batch keeps protected referral and CTA data untouched", async () => {
  for (const [relativePath, expected] of Object.entries(protectedHashes)) {
    const data = await readFile(new URL(relativePath, import.meta.url));
    const actual = createHash("sha256").update(data).digest("hex");
    assert.equal(actual, expected, relativePath);
  }
});
