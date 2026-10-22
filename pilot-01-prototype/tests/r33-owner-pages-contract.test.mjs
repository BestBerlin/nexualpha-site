import assert from "node:assert/strict";
import test from "node:test";

import feed from "../public/content/news-feed.json" with { type: "json" };
import { compareDirectAnswerFor } from "../src/data/compare-direct-answers.js";
import { computeRouteSeo } from "../src/data/seo-injection.js";
import { TOPIC_GUIDES } from "../src/data/topic-guides-data.js";
import { routeMetadata } from "../worker/index.js";

const OWNER_PAGES = [
  {
    path: "/news/tokenized-treasuries-structure-access-risks",
    article: feed.articles.find((article) => article.slug === "tokenized-treasuries-structure-access-risks"),
    expected: /tokenized Treasury legally represents/i,
    related: ["/topics/tokenized-treasuries", "/topics/tokenized-assets", "/topics/tokenized-stocks-vs-perpetuals"],
  },
  {
    path: "/compare/bybit-vs-bitget",
    expected: /ordinary crypto futures, xStocks-style exposure, stock futures, copy trading/i,
    related: ["/exchanges/bybit", "/exchanges/bitget", "/topics/derivatives", "/topics/tokenized-assets"],
  },
  {
    path: "/topics/derivatives",
    expected: /fees.*funding.*liquidation/i,
    related: ["/compare/binance-vs-okx", "/compare/bybit-vs-bitget", "/compare/hyperliquid-vs-dydx"],
  },
];

const forbiddenCommercialLeak = /private commission|commission rate|11350287|nexu888|LUCKX|CANDY007|INS898|luckybitcoin|guaranteed registration|guaranteed signup|guaranteed yield|risk-free/i;

function assets() {
  return {
    fetch: async () => new Response(JSON.stringify(feed), { headers: { "content-type": "application/json" } }),
  };
}

function graph(schema) {
  const values = schema?.["@graph"] || schema || [];
  return Array.isArray(values) ? values : [values];
}

function pageSchema(schemas) {
  return graph(schemas).find((schema) => ["WebPage", "NewsArticle", "CollectionPage"].includes(schema?.["@type"]));
}

function faqSchema(schemas) {
  return graph(schemas).find((schema) => schema?.["@type"] === "FAQPage" || schema?.subjectOf?.["@type"] === "FAQPage");
}

function relatedLinks(schema) {
  return schema?.relatedLink || schema?.mainEntityOfPage?.relatedLink || [];
}

test("R33 priority owner pages are indexable, answer-first and internally connected in client and Worker metadata", async () => {
  const titles = new Set();
  const descriptions = new Set();

  for (const page of OWNER_PAGES) {
    const client = computeRouteSeo({ url: page.path, locale: "en", article: page.article });
    const worker = await routeMetadata(new URL(`https://nexualpha.com${page.path}`), { ASSETS: assets() });
    const clientPage = pageSchema(client.schemas);
    const workerPage = pageSchema(worker.schema);
    const clientText = `${client.title}\n${client.description}\n${JSON.stringify(client.schemas)}`;
    const workerText = `${worker.title}\n${worker.description}\n${JSON.stringify(worker.schema)}`;

    assert.equal(client.status, 200, `${page.path}: client status`);
    assert.equal(worker.status, 200, `${page.path}: worker status`);
    assert.equal(client.robots, "index,follow", `${page.path}: client robots`);
    assert.equal(worker.robots, "index,follow", `${page.path}: worker robots`);
    assert.equal(client.canonical, `https://nexualpha.com${page.path}`, `${page.path}: client canonical`);
    assert.equal(worker.canonical, client.canonical, `${page.path}: worker canonical`);
    assert.equal(worker.title, client.title, `${page.path}: title parity`);
    assert.equal(worker.description, client.description, `${page.path}: description parity`);
    assert.match(`${clientText}\n${workerText}`, page.expected, `${page.path}: answer-first intent`);
    assert.ok(relatedLinks(clientPage).length >= 3, `${page.path}: client internal links`);
    assert.ok(relatedLinks(workerPage).length >= 3, `${page.path}: worker internal links`);
    for (const href of page.related) {
      assert.ok(relatedLinks(clientPage).some((link) => String(link).endsWith(href)), `${page.path}: client related ${href}`);
      assert.ok(relatedLinks(workerPage).some((link) => String(link).endsWith(href)), `${page.path}: worker related ${href}`);
    }
    assert.ok(faqSchema(client.schemas), `${page.path}: client FAQ or answer schema`);
    assert.ok(faqSchema(worker.schema), `${page.path}: worker FAQ or answer schema`);
    assert.doesNotMatch(`${clientText}\n${workerText}`, forbiddenCommercialLeak, `${page.path}: no private commercial leak`);
    titles.add(client.title);
    descriptions.add(client.description);
  }

  assert.equal(titles.size, OWNER_PAGES.length, "R33 page titles are unique");
  assert.equal(descriptions.size, OWNER_PAGES.length, "R33 page descriptions are unique");
});

test("R33 visible owner data routes users by decision type without changing invitation links", () => {
  const compare = compareDirectAnswerFor("bybit-vs-bitget", "en");
  const derivatives = TOPIC_GUIDES.derivatives;
  const tokenized = OWNER_PAGES[0].article;

  assert.ok(compare.internalLinks.some(([, href]) => href === "/topics/derivatives"));
  assert.ok(compare.internalLinks.some(([, href]) => href === "/topics/tokenized-assets"));
  assert.match(compare.nextSteps.join(" "), /derivatives checklist/);
  assert.match(derivatives.searchAnswer.bodyEn, /tokenized-stock guide/);
  assert.match(tokenized.content.en, /\[tokenized stocks vs perpetuals\]\(\/topics\/tokenized-stocks-vs-perpetuals\)/);
  assert.doesNotMatch(
    [
      compare.nextSteps.join(" "),
      compare.internalLinks.map(([, href]) => href).join(" "),
      derivatives.searchAnswer.bodyEn,
      tokenized.content.en,
    ].join("\n"),
    forbiddenCommercialLeak,
  );
});
