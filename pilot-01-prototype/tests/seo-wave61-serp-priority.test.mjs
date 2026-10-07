import assert from "node:assert/strict";
import test from "node:test";

import { computeRouteSeo } from "../src/data/seo-injection.js";
import { routeMetadata } from "../worker/index.js";

const forbidden = /guaranteed|risk-free|always available|available in every region|registration result|guaranteed signup|guaranteed registration|private commission|commission|nexu888|11350287|LUCKX|CANDY007|INS898|luckybitcoin/i;

function assets() {
  return { fetch: async () => new Response("missing", { status: 404, headers: { "content-type": "text/plain" } }) };
}

function graph(metadata) {
  const schema = metadata.schema?.["@graph"] || metadata.schema || [];
  return Array.isArray(schema) ? schema : [schema];
}

function schemaOf(schemas, type) {
  return schemas.find((schema) => schema?.["@type"] === type || schema?.subjectOf?.["@type"] === type);
}

function faqEntries(schema) {
  const faq = schema?.["@type"] === "FAQPage" ? schema : schema?.subjectOf;
  return faq?.mainEntity || [];
}

test("Wave61 default compare pages use distinct sourced SERP answers without touching CTA claims", async () => {
  const cases = [
    ["/compare/binance-vs-okx", /Fees, Products, KYC and Web3 Access Checks/, /published fee tables, spot and derivatives product scope/, /How should I compare Binance and OKX/],
    ["/compare/binance-vs-bybit", /Fees, Futures, Earn and KYC Checks/, /spot and futures fees, product scope, Earn or copy-trading boundaries/, /How should I compare Binance and Bybit/],
    ["/compare/okx-vs-bybit", /Fees, Web3, Derivatives and Account Checks/, /exchange-account products from wallet or Web3 routes/, /How should I compare OKX and Bybit/],
    ["/compare/binance-vs-mexc", /Fees, Listings, KYC and Region Checks/, /listing breadth, identity requirements, regional limits/, /How should I compare Binance and MEXC/],
    ["/compare/okx-vs-mexc", /Fees, Wallet Routes, Listings and KYC Checks/, /exchange trading, Web3-style access, listing discovery or futures execution/, /How should I compare OKX and MEXC/],
  ];
  const titles = new Set();
  const descriptions = new Set();

  for (const [path, titlePattern, answerPattern, questionPattern] of cases) {
    const client = computeRouteSeo({ url: path });
    const server = await routeMetadata(new URL(`https://nexualpha.com${path}`), { ASSETS: assets() });
    const clientPage = schemaOf(client.schemas, "WebPage");
    const serverPage = schemaOf(graph(server), "WebPage");
    const clientFaq = schemaOf(client.schemas, "FAQPage");
    const serverFaq = schemaOf(graph(server), "FAQPage");
    const joined = `${client.title}\n${client.description}\n${JSON.stringify(client.schemas)}\n${JSON.stringify(server.schema)}`;

    assert.equal(client.status, 200, path);
    assert.equal(server.status, 200, path);
    assert.equal(client.robots, "index,follow", path);
    assert.equal(server.robots, "index,follow", path);
    assert.equal(client.title, server.title, path);
    assert.equal(client.description, server.description, path);
    assert.match(client.title, titlePattern, path);
    assert.match(joined, answerPattern, path);
    assert.match(joined, questionPattern, path);
    assert.ok(clientPage.relatedLink?.length >= 5, `${path}: related links`);
    assert.deepEqual(clientPage.relatedLink, serverPage.relatedLink, path);
    assert.ok(clientPage.citation?.length >= 4, `${path}: citations`);
    assert.deepEqual(faqEntries(clientFaq), faqEntries(serverFaq), path);
    assert.ok(faqEntries(clientFaq).length >= 3, `${path}: FAQ count`);
    assert.doesNotMatch(joined, forbidden, path);
    titles.add(client.title);
    descriptions.add(client.description);
  }

  assert.equal(titles.size, cases.length, "compare titles stay differentiated");
  assert.equal(descriptions.size, cases.length, "compare descriptions stay differentiated");
});

test("Wave61 rates route owns fee-benchmark intent with published-source boundaries", async () => {
  const path = "/rates";
  const client = computeRouteSeo({ url: path });
  const server = await routeMetadata(new URL(`https://nexualpha.com${path}`), { ASSETS: assets() });
  const joined = `${client.title}\n${client.description}\n${JSON.stringify(client.schemas)}\n${JSON.stringify(server.schema)}`;

  assert.equal(client.title, "Crypto Exchange Fee Benchmark Terminal — NexuAlpha");
  assert.equal(server.title, client.title);
  assert.match(client.description, /Compare published maker and taker fee references across CEX, DEX and perpetual platforms/);
  assert.equal(server.description, client.description);
  assert.match(joined, /VIP tier, funding, withdrawal and account terms/);
  assert.match(joined, /published base fee references and scenario assumptions/);
  assert.match(joined, /Confirm final account terms in the official platform flow/);
  assert.doesNotMatch(joined, forbidden);
});

test("Wave61 tokenized-assets cluster differentiates parent, Treasury and stock-perp snippets", async () => {
  const cases = [
    ["/topics/tokenized-assets", /Treasury, Stock and Perp Exposure Checks/, /legal claim, issuer or broker model, custody, redemption, eligibility/, /fund share, security entitlement, note, tokenized claim, stock perpetual/],
    ["/topics/tokenized-treasuries", /BUIDL, OUSG, BENJI, Redemption and Custody/, /issuer, legal wrapper, recordkeeper, custodian, redemption/, /legal wrapper and recordkeeper/],
    ["/topics/tokenized-stocks-vs-perpetuals", /Tokenized Stocks vs Stock Perps: Rights and Liquidation/, /ownership rights, custody, dividends, funding, margin, liquidation/, /legal claim before comparing price exposure/],
  ];
  const titles = new Set();
  const descriptions = new Set();

  for (const [path, titlePattern, bodyPattern, faqPattern] of cases) {
    const client = computeRouteSeo({ url: path });
    const server = await routeMetadata(new URL(`https://nexualpha.com${path}`), { ASSETS: assets() });
    const clientFaq = schemaOf(client.schemas, "FAQPage");
    const serverFaq = schemaOf(graph(server), "FAQPage");
    const page = schemaOf(client.schemas, "CollectionPage");
    const joined = `${client.title}\n${client.description}\n${JSON.stringify(client.schemas)}\n${JSON.stringify(server.schema)}`;

    assert.equal(client.status, 200, path);
    assert.equal(server.status, 200, path);
    assert.equal(client.robots, "index,follow", path);
    assert.equal(server.robots, "index,follow", path);
    assert.equal(client.title, server.title, path);
    assert.equal(client.description, server.description, path);
    assert.match(client.title, titlePattern, path);
    assert.match(joined, bodyPattern, path);
    assert.ok(page.relatedLink?.length >= 5, `${path}: related link coverage`);
    assert.ok(faqEntries(clientFaq).length >= 4, `${path}: FAQ coverage`);
    const clientFaqText = JSON.stringify(faqEntries(clientFaq));
    const serverFaqText = JSON.stringify(faqEntries(serverFaq));
    assert.match(clientFaqText, faqPattern, `${path}: client FAQ intent`);
    assert.match(serverFaqText, faqPattern, `${path}: worker FAQ intent`);
    assert.doesNotMatch(joined, forbidden, path);
    titles.add(client.title);
    descriptions.add(client.description);
  }

  assert.equal(titles.size, cases.length, "tokenized titles stay differentiated");
  assert.equal(descriptions.size, cases.length, "tokenized descriptions stay differentiated");
});
