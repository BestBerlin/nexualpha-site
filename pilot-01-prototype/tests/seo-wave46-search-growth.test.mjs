import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { computeRouteSeo } from "../src/data/seo-injection.js";
import { normalizeNewsFeed } from "../src/data/news-feed-client.js";
import { routeMetadata } from "../worker/index.js";

const rawFeed = JSON.parse(await readFile(new URL("../public/content/news-feed.json", import.meta.url), "utf8"));
const articles = normalizeNewsFeed(rawFeed);

function findArticle(slug) {
  const article = articles.find((entry) => entry.slug === slug);
  assert.ok(article, `${slug} exists`);
  return article;
}

function schemaList(value) {
  const graph = value?.["@graph"] || value || [];
  return Array.isArray(graph) ? graph : [graph];
}

function findSchema(value, type) {
  return schemaList(value).find((entry) => entry?.["@type"] === type);
}

function assets() {
  return {
    fetch: async (request) => {
      const pathname = new URL(request.url).pathname;
      if (pathname === "/content/news-feed.json") {
        return new Response(JSON.stringify(rawFeed), { headers: { "content-type": "application/json" } });
      }
      return new Response("missing", { status: 404 });
    },
  };
}

test("Wave46 tokenized Treasuries article owns the yield-check search intent without a noindex comparison detour", async () => {
  const slug = "tokenized-treasuries-structure-access-risks";
  const article = findArticle(slug);
  const client = computeRouteSeo({ url: `/news/${slug}`, article, locale: "en" });
  const worker = await routeMetadata(new URL(`https://nexualpha.com/news/${slug}`), { ASSETS: assets() });

  assert.equal(client.title, "Tokenized Treasuries: BUIDL, BENJI, Ownership and Redemption Checks — NexuAlpha");
  assert.equal(worker.title, "Tokenized Treasuries: BUIDL, BENJI, Ownership and Redemption Checks — NexuAlpha");
  assert.match(client.description, /legally represents before comparing yield/);
  assert.match(worker.description, /legally represents before comparing yield/);
  assert.ok(article.seo.internalLinkTargets.includes("/news/coinbase-vs-kraken"));
  assert.ok(!article.seo.internalLinkTargets.includes("/compare/coinbase-vs-kraken"));

  for (const [surface, schemas] of [["client", client.schemas], ["worker", worker.schema]]) {
    const newsArticle = findSchema(schemas, "NewsArticle");
    const faq = findSchema(schemas, "FAQPage");
    assert.ok(newsArticle, `${surface} NewsArticle`);
    assert.equal(newsArticle.about?.name, "What should I verify before comparing tokenized Treasury yield?");
    assert.ok(newsArticle.relatedLink.includes("https://nexualpha.com/news/coinbase-vs-kraken"));
    assert.doesNotMatch(newsArticle.relatedLink.join("\n"), /\/compare\/coinbase-vs-kraken|\/ref\/|ref=|register|commission/i);
    assert.ok(faq?.mainEntity?.length >= 4, `${surface} visible FAQ schema`);
  }
});

test("Wave46 news decision summary exposes a source-bound next step, not a raw registration route", async () => {
  const source = await readFile(new URL("../src/components/v3/news/NewsDetailPage.jsx", import.meta.url), "utf8");
  const block = source.slice(
    source.indexOf('"tokenized-treasuries-structure-access-risks"'),
    source.indexOf("},\n};", source.indexOf('"tokenized-treasuries-structure-access-risks"')),
  );

  assert.match(block, /Compare Coinbase vs Kraken evidence/);
  assert.match(block, /href: "\/news\/coinbase-vs-kraken"/);
  assert.doesNotMatch(block, /\/ref\/|ref=|register|commission/i);
});

test("priority answers preserve Hyperliquid decision coverage and the GMX search title", async () => {
  const hyperliquid = computeRouteSeo({ url: "/exchanges/hyperliquid", locale: "en" });
  const hyperliquidPage = hyperliquid.schemas.find((entry) => entry["@type"] === "WebPage");
  const hyperliquidFaq = hyperliquid.schemas.find((entry) => entry["@type"] === "FAQPage");

  assert.equal(hyperliquid.title, "Hyperliquid Fees, Referral Discount and Funded Account Checks — NexuAlpha");
  assert.match(hyperliquid.description, /rolling 14-day fee tiers/);
  assert.match(hyperliquid.description, /funded-account claim boundaries/);
  assert.ok(hyperliquidPage.relatedLink.includes("https://nexualpha.com/compare/hyperliquid-vs-dydx"));
  assert.ok(hyperliquidPage.relatedLink.includes("https://nexualpha.com/topics/no-kyc"));
  assert.ok(hyperliquidPage.citation.includes("https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees"));
  assert.ok(hyperliquidFaq);
  assert.equal(hyperliquidFaq.mainEntity.length, 5);
  const answers = JSON.stringify(hyperliquidFaq.mainEntity);
  assert.match(answers, /funded account/);
  assert.match(answers, /rolling 14-day volume/);
  assert.match(answers, /vault-volume separation/);
  assert.match(answers, /sub-account volume rules/);
  assert.match(answers, /HIP-3 market conditions/);
  assert.match(answers, /maintenance margin/);
  assert.ok(hyperliquidFaq.mainEntity.every((q) => q.acceptedAnswer.citation?.length > 0));

  const gmx = computeRouteSeo({ url: "/exchanges/gmx", locale: "en" });
  assert.equal(gmx.title, "GMX v2 Fees: Pools, Price Impact, Funding and Liquidation — NexuAlpha");
});
