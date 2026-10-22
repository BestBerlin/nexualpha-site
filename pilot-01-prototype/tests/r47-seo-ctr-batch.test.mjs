import { committedFileHash } from './r100-test-contracts.mjs';
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { computeRouteSeo } from "../src/data/seo-injection.js";
import { OKX_USD_USDC_OWNER_CHECKLIST } from "../src/data/news-feed-client.js";
import { priorityVenueAnswerFor } from "../src/data/priority-venue-answers.js";
import { TOKENIZED_ASSET_PAGES } from "../src/data/tokenized-assets-cluster.js";
import { routeMetadata } from "../worker/index.js";

const feed = JSON.parse(await readFile(new URL("../public/content/news-feed.json", import.meta.url), "utf8"));
const protectedHashes = {
  "../src/data/partner-registry.js": committedFileHash('src/data/partner-registry.js'),
  "../src/data/venue-database.js": committedFileHash('src/data/venue-database.js'),
  "../src/data/public-cta.js": "675875240d5fbb05498284a37f90a14488d6ace73d19b102caeb5add9e33f8e3",
  "../src/data/regional-cta.js": "a2542bb137b6b6ff123a0d3c6b3a01b09e1e3a785ee223e3b4e04a3fe8aab665",
};

function article(slug) {
  const value = feed.articles.find((entry) => entry.slug === slug);
  assert.ok(value, `${slug} article exists`);
  return value;
}

function assets() {
  return { fetch: async (request) => {
    const pathname = new URL(request.url).pathname;
    if (pathname === "/content/news-feed.json") return new Response(JSON.stringify(feed), { status: 200, headers: { "content-type": "application/json" } });
    if (pathname === "/content/news-feed.sha256.txt") return new Response("r47-test", { status: 200, headers: { "content-type": "text/plain" } });
    return new Response("missing", { status: 404 });
  } };
}

test("R47 gives four English owner pages concise query-first snippets and direct answers", async () => {
  const cases = [
    ["/news/okx-usd-to-usdc-spot-pair-migration", article("okx-usd-to-usdc-spot-pair-migration"), /^OKX USD to USDC Spot Pairs \(2026\): Orders, Bots, API Fixes/, /official pair scope first/],
    ["/news/hyperliquid-vs-dydx", article("hyperliquid-vs-dydx"), /^Hyperliquid vs dYdX \(2026\): Fees, Funding and Liquidations/, /no single quoted rate settles the decision/],
    ["/exchanges/deribit", null, /^Deribit fees, sign-up & KYC/, /Open Deribit when the query is about crypto options/],
    ["/topics/tokenized-stocks-vs-perpetuals", null, /^Tokenized Stocks vs Stock Perps: Rights and Liquidation/, /legal claim before comparing price exposure/],
  ];

  for (const [path, articleValue, titlePattern, answerPattern] of cases) {
    const client = computeRouteSeo({ url: path, locale: "en", ...(articleValue ? { article: articleValue } : {}) });
    const server = await routeMetadata(new URL(`https://nexualpha.com${path}`), { ASSETS: assets() });
    const serialized = JSON.stringify([client.schemas, server.schema]);
    assert.equal(client.status, 200, path);
    assert.equal(server.status, 200, path);
    assert.equal(client.canonical, `https://nexualpha.com${path}`, path);
    assert.equal(server.canonical, `https://nexualpha.com${path}`, path);
    assert.equal(client.robots, "index,follow", path);
    assert.equal(server.robots, "index,follow", path);
    assert.equal(client.title, server.title, path);
    assert.equal(client.description, server.description, path);
    assert.match(client.title, titlePattern, path);
    assert.ok(client.description.length <= 160, `${path} meta description is concise`);
    assert.match(serialized, answerPattern, path);
  }

  assert.match(OKX_USD_USDC_OWNER_CHECKLIST.summary, /official pair scope first/i);
  assert.match(priorityVenueAnswerFor("deribit", "en").body, /Use Deribit for an options, futures or perpetual route only after confirming/);
  assert.match(TOKENIZED_ASSET_PAGES["tokenized-stocks-vs-perpetuals"].directAnswer.en, /legal claim before comparing price exposure/i);
});

test("R47 leaves referral and CTA registries byte-for-byte unchanged", async () => {
  for (const [relativePath, expected] of Object.entries(protectedHashes)) {
    const data = await readFile(new URL(relativePath, import.meta.url));
    assert.equal(createHash("sha256").update(data).digest("hex"), expected, relativePath);
  }
});
