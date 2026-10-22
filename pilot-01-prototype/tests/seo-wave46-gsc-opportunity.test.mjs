import assert from "node:assert/strict";
import test from "node:test";

import feed from "../public/content/news-feed.json" with { type: "json" };
import { computeRouteSeo } from "../src/data/seo-injection.js";
import sitesWorker, { routeMetadata } from "../worker/index.js";

const htmlShell = "<!doctype html><html><head><title>Base</title></head><body><div id=\"root\"></div></body></html>";

function assets() {
  return {
    async fetch(request) {
      const pathname = new URL(request.url).pathname;
      if (pathname === "/index.html" || pathname === "/") {
        return new Response(htmlShell, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } });
      }
      return new Response("Not Found", { status: 404, headers: { "content-type": "text/plain" } });
    },
  };
}

function graphOf(schema) {
  return schema?.["@graph"] || (Array.isArray(schema) ? schema : [schema]);
}

test("Wave46 Hyperliquid route answers the fees and funded-account GSC intents in client and Worker metadata", async () => {
  const client = computeRouteSeo({ url: "/exchanges/hyperliquid", locale: "en" });
  const worker = await routeMetadata(new URL("https://nexualpha.com/exchanges/hyperliquid"), { ASSETS: assets() });
  const clientFaq = client.schemas.find((schema) => schema["@type"] === "FAQPage");
  const workerFaq = graphOf(worker.schema).find((schema) => schema["@type"] === "FAQPage");
  const clientText = JSON.stringify(client.schemas);
  const workerText = JSON.stringify(worker.schema);

  assert.equal(client.status, 200);
  assert.equal(worker.robots, "index,follow");
  assert.match(clientText, /rolling 14-day volume/);
  assert.match(clientText, /hourly peer-to-peer funding/);
  assert.match(clientText, /self-funded wallet collateral/);
  assert.match(clientText, /third-party capital allocation offer/);
  assert.match(workerText, /maker\/taker fee tier based on rolling 14-day volume/);
  assert.match(workerText, /funding is separate from maker\/taker trading fees/i);
  assert.ok(clientFaq.mainEntity.length >= 5);
  assert.ok(workerFaq.mainEntity.length >= 5);
  assert.ok(client.schemas.find((schema) => schema["@type"] === "WebPage").relatedLink.includes("https://nexualpha.com/compare/hyperliquid-vs-dydx"));
  assert.doesNotMatch(`${clientText}\n${workerText}`, /private commission|commission rate|guaranteed funded account|guaranteed capital allocation/i);
});

test("Wave46 tokenized Treasuries article and topic expose BUIDL versus BENJI as a separate answer block", () => {
  const article = feed.articles.find((item) => item.slug === "tokenized-treasuries-structure-access-risks");
  const topic = computeRouteSeo({ url: "/topics/tokenized-treasuries", locale: "en" });
  const collection = topic.schemas.find((schema) => schema["@type"] === "CollectionPage");
  const faq = topic.schemas.find((schema) => schema["@type"] === "FAQPage");
  const articleText = `${article.content.en}\n${article.aeo.directAnswer}\n${article.aeo.questions.join("\n")}`;
  const topicText = JSON.stringify([collection, faq]);

  assert.match(article.content.en, /## BUIDL and BENJI as different structures/i);
  assert.match(article.aeo.directAnswer, /different fund, recordkeeping, access and redemption arrangements/i);
  assert.match(articleText, /BlackRock.*SEC.*Securitize/i);
  assert.match(articleText, /Franklin Templeton.*FOBXX.*Benji/i);
  assert.match(topicText, /Recordkeeper and official register/);
  assert.match(topicText, /Are BUIDL and BENJI the same kind of tokenized Treasury exposure/);
  assert.doesNotMatch(`${articleText}\n${topicText}`, /guaranteed yield|direct ownership guarantee|private commission|ref=|registration link/i);
});

test("Wave46 Worker HTML keeps route schema extractable after Hyperliquid answer update", async () => {
  const response = await sitesWorker.fetch(new Request("https://nexualpha.com/exchanges/hyperliquid", { headers: { accept: "text/html" } }), { ASSETS: assets() });
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /<script id="nexualpha-route-schema" type="application\/ld\+json">/);
  assert.match(html, /maker\/taker fee tier based on rolling 14-day volume/);
  assert.match(html, /hourly peer-to-peer funding/);
  assert.doesNotMatch(html, /private commission|commission rate|guaranteed funded account/i);
});
