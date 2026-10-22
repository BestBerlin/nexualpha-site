import { committedFileHash } from './r100-test-contracts.mjs';
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { AEO_QUESTION_REGISTRY } from "../src/data/aeo-question-registry.js";
import {
  PRIORITY_QUERY_OWNER_REGISTRY,
  priorityCanonicalOwnerPath,
  priorityOwnerForPath,
  priorityOwnerForQuery,
} from "../src/data/priority-query-owner-registry.js";
import {
  TELEGRAM_WAVE9_SEARCH_TOPICS,
  TELEGRAM_WAVE11_SEARCH_TOPICS,
  TELEGRAM_WAVE13_SEARCH_TOPICS,
  TELEGRAM_WAVE20_SEARCH_TOPIC_ROUTES,
  TELEGRAM_WAVE21_GSC_QUERY_ROUTES,
  TELEGRAM_WAVE33_SEARCH_TOPICS,
  TELEGRAM_WAVE35_SEARCH_TOPICS,
} from "../src/data/telegram-config.js";
import { computeRouteSeo } from "../src/data/seo-injection.js";
import { routeMetadata } from "../worker/index.js";
import feed from "../public/content/news-feed.json" with { type: "json" };

const topicOwner = "/topics/tokenized-treasuries";
const articlePath = "/news/tokenized-treasuries-structure-access-risks";
const protectedFiles = {
  "src/data/partner-registry.js": committedFileHash('src/data/partner-registry.js'),
  "src/data/venue-database.js": committedFileHash('src/data/venue-database.js'),
  "src/data/public-cta.js": committedFileHash('src/data/public-cta.js'),
  "src/data/regional-cta.js": committedFileHash('src/data/regional-cta.js'),
};
const articleBySlug = (slug) => feed.articles.find((article) => article.slug === slug);

function graph(schema) {
  return schema?.["@graph"] || (Array.isArray(schema) ? schema : [schema]);
}

function publicUrls(values) {
  return values.map((path) => `https://nexualpha.com${path}`);
}

test("R36 registers generic tokenized treasury queries to the evergreen topic owner", () => {
  const owner = PRIORITY_QUERY_OWNER_REGISTRY["tokenized-treasuries"];
  assert.equal(owner.canonicalOwnerPath, topicOwner);
  assert.equal(owner.supportPath, articlePath);
  assert.equal(priorityOwnerForQuery("tokenized treasury")?.canonicalOwnerPath, topicOwner);
  assert.equal(priorityOwnerForQuery("tokenized treasuries")?.canonicalOwnerPath, topicOwner);
  assert.equal(priorityOwnerForPath(articlePath)?.canonicalOwnerPath, topicOwner);
  assert.equal(priorityCanonicalOwnerPath("tokenized treasury"), topicOwner);
});

test("R36 AEO and Telegram routes use the same tokenized Treasury owner", () => {
  const aeo = AEO_QUESTION_REGISTRY.filter((item) => item.id.startsWith("tokenized-treasury-"));
  assert.ok(aeo.length >= 2);
  assert.ok(aeo.every((item) => item.canonicalPath === topicOwner));

  const expectedOwnerTopicIds = new Set([
    "tokenized-treasuries-en",
    "tokenized-treasury-buidl-benji-en",
    "tokenized-assets-custody-proof-en",
    "tokenized-treasury-redemption-risk-en",
    "rwa-treasury-transfer-restrictions-en",
    "tokenized-treasury-issuer-custody-redemption-en",
    "ai-citation-tokenized-asset-ownership-redemption-en",
  ]);
  const tokenizedSearchTopics = [
    ...TELEGRAM_WAVE9_SEARCH_TOPICS,
    ...TELEGRAM_WAVE11_SEARCH_TOPICS,
    ...TELEGRAM_WAVE13_SEARCH_TOPICS,
    ...TELEGRAM_WAVE33_SEARCH_TOPICS,
    ...TELEGRAM_WAVE35_SEARCH_TOPICS,
  ].filter((topic) => expectedOwnerTopicIds.has(topic.id));
  assert.deepEqual(new Set(tokenizedSearchTopics.map((topic) => topic.id)), expectedOwnerTopicIds);
  assert.ok(tokenizedSearchTopics.every((topic) => topic.primaryPath === topicOwner));
  assert.ok(tokenizedSearchTopics.every((topic) => topic.supportPaths.includes(articlePath)));

  const wave20 = TELEGRAM_WAVE20_SEARCH_TOPIC_ROUTES.find((route) => route.id === "tokenized-treasury-custody-redemption-en");
  const wave21 = TELEGRAM_WAVE21_GSC_QUERY_ROUTES.find((route) => route.id === "gsc-tokenized-treasury");
  assert.equal(wave20.canonicalPath, topicOwner);
  assert.equal(wave21.canonicalPath, topicOwner);
  assert.ok(wave20.supportPaths.includes(articlePath));
  assert.ok(wave21.supportPaths.includes(articlePath));
});

test("R36 tokenized article schema is a dated source trail that links back to the topic owner", async () => {
  const client = computeRouteSeo({ url: articlePath, locale: "en", article: articleBySlug("tokenized-treasuries-structure-access-risks") });
  const worker = await routeMetadata(new URL(`https://nexualpha.com${articlePath}`), {
    ASSETS: { fetch: async () => new Response(await readFile(new URL("../public/content/news-feed.json", import.meta.url), "utf8"), { headers: { "content-type": "application/json" } }) },
  });
  for (const schema of [
    client.schemas.find((item) => item?.["@type"] === "NewsArticle"),
    graph(worker.schema).find((item) => item?.["@type"] === "NewsArticle"),
  ]) {
    assert.equal(schema.isPartOf, `https://nexualpha.com${topicOwner}`);
    assert.equal(schema.articleSection, "Dated source trail");
    // SEO w43: relatedLink lives on the mainEntityOfPage WebPage (schema.org defines it on WebPage, not NewsArticle).
    assert.equal(schema.relatedLink, undefined);
    assert.ok(schema.mainEntityOfPage.relatedLink.includes(`https://nexualpha.com${topicOwner}`));
    assert.ok(schema.mainEntityOfPage.relatedLink.includes(`https://nexualpha.com${articlePath}`));
    assert.ok(schema.mainEntityOfPage.relatedLink.includes("https://nexualpha.com/research/wave48-tokenized-treasury-rights-ops.json"));
  }
});


test("R36 llms retrieval questions route tokenized Treasury answers to the owner", async () => {
  const llms = await readFile(new URL("../public/llms.txt", import.meta.url), "utf8");
  assert.match(llms, /When someone searches tokenized treasury, what legal claim should be checked before comparing yield\? — canonical: https:\/\/nexualpha\.com\/topics\/tokenized-treasuries/);
  assert.match(llms, /Do BUIDL and BENJI give the same ownership, redemption and transfer rights as directly holding Treasury bills\? — canonical: https:\/\/nexualpha\.com\/topics\/tokenized-treasuries/);
});

test("R36 product-boundary news pages link back to their canonical owners", () => {
  const bybitBitget = computeRouteSeo({ url: "/news/bybit-vs-bitget-fees-products-risk-controls", article: articleBySlug("bybit-vs-bitget-fees-products-risk-controls") });
  const uniswapPancake = computeRouteSeo({ url: "/news/uniswap-v3-vs-pancakeswap-v3-concentrated-liquidity-controls", article: articleBySlug("uniswap-v3-vs-pancakeswap-v3-concentrated-liquidity-controls") });

  // SEO w43: the article's related links ride on its mainEntityOfPage WebPage.
  const bybitSchema = bybitBitget.schemas.find((item) => item?.["@type"] === "NewsArticle").mainEntityOfPage;
  assert.ok(bybitSchema.relatedLink.includes("https://nexualpha.com/compare/bybit-vs-bitget"));
  assert.ok(bybitSchema.relatedLink.includes("https://nexualpha.com/topics/tokenized-stocks-vs-perpetuals"));
  assert.ok(bybitSchema.relatedLink.includes("https://nexualpha.com/factbook/bybit"));
  assert.ok(bybitSchema.relatedLink.includes("https://nexualpha.com/factbook/bitget"));
  assert.match(JSON.stringify(bybitBitget.schemas), /stock query prove either platform offers real shares/);

  const uniswapSchema = uniswapPancake.schemas.find((item) => item?.["@type"] === "NewsArticle").mainEntityOfPage;
  assert.ok(uniswapSchema.relatedLink.includes("https://nexualpha.com/exchanges/uniswap"));
  assert.ok(uniswapSchema.relatedLink.includes("https://nexualpha.com/compare/uniswap-vs-jupiter"));
  assert.ok(uniswapSchema.relatedLink.includes("https://nexualpha.com/factbook/uniswap"));
  assert.ok(uniswapSchema.relatedLink.includes("https://nexualpha.com/factbook/pancakeswap"));
  assert.match(JSON.stringify(uniswapPancake.schemas), /liquidity position is safe or profitable/);
});

test("R36 factbook owner links include exchange, compare and topic paths for Hyperliquid and Uniswap", () => {
  const hyperliquid = computeRouteSeo({ url: "/factbook/hyperliquid" });
  const uniswap = computeRouteSeo({ url: "/factbook/uniswap" });
  // SEO w43: a Dataset carries its related links on the WebPage it is the main entity of.
  const hyperliquidDataset = hyperliquid.schemas.find((item) => item?.["@type"] === "Dataset").mainEntityOfPage;
  const uniswapDataset = uniswap.schemas.find((item) => item?.["@type"] === "Dataset").mainEntityOfPage;

  for (const expected of publicUrls(["/exchanges/hyperliquid", "/compare/hyperliquid-vs-dydx", "/topics/derivatives", "/news/hyperliquid-vs-dydx"])) {
    assert.ok(hyperliquidDataset.relatedLink.includes(expected), expected);
  }
  for (const expected of publicUrls(["/exchanges/uniswap", "/compare/uniswap-vs-jupiter", "/news/uniswap-v3-vs-pancakeswap-v3-concentrated-liquidity-controls", "/topics/no-kyc"])) {
    assert.ok(uniswapDataset.relatedLink.includes(expected), expected);
  }
});

test("R36 preserves protected invitation and CTA registries", async () => {
  for (const [relativePath, expectedSha] of Object.entries(protectedFiles)) {
    const source = await readFile(new URL(`../${relativePath}`, import.meta.url));
    assert.equal(createHash("sha256").update(source).digest("hex"), expectedSha, relativePath);
  }
});
