import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import worker, { routeMetadata } from "../worker/index.js";
import { computeRouteSeo } from "../src/data/seo-injection.js";

const feed = JSON.parse(await readFile(new URL("../public/content/news-feed.json", import.meta.url), "utf8"));
const forbidden = /guaranteed|risk-free|real-time|live yield|route safety guaranteed|available in every region|regional availability guaranteed|commission|rebate|nexu888|11350287|LUCKX|CANDY007|INS898|luckybitcoin/i;

function article(slug) {
  const row = feed.articles.find((item) => item.slug === slug);
  assert.ok(row, `${slug} article exists`);
  return row;
}

function assets() {
  return {
    fetch: async (request) => {
      const url = new URL(request.url);
      if (url.pathname === "/content/news-feed.json") return new Response(JSON.stringify(feed), { status: 200, headers: { "content-type": "application/json" } });
      if (url.pathname === "/content/news-feed.sha256.txt") return new Response("wave32-test", { status: 200, headers: { "content-type": "text/plain" } });
      return new Response("missing", { status: 404, headers: { "content-type": "text/plain" } });
    },
  };
}

function schemaText(seo) {
  return JSON.stringify(seo.schemas || seo.schema || {});
}

test("Wave32 news SERP overrides sharpen top-ten zero-CTR article snippets without changing canonicals", async () => {
  const cases = [
    {
      path: "/news/okx-usd-to-usdc-spot-pair-migration",
      article: article("okx-usd-to-usdc-spot-pair-migration"),
      title: /^OKX USD to USDC Migration \(Sept 2026\): API, Orders and Bots/,
      // Class b: 6435cda shortened the snippet while preserving the same migration fields.
      description: /open orders, bots, API instId and tradeQuoteCcy/,
      about: /OKX USD to USDC spot-pair migration/,
    },
    {
      path: "/news/hyperliquid-vs-dydx",
      article: article("hyperliquid-vs-dydx"),
      // Class b: long search titles now drop the trailing brand suffix through budgetTitle.
      title: /Hyperliquid vs dYdX: Fees, Funding and Liquidation/,
      description: /fees, funding, collateral, liquidation, oracle, wallet and recovery mechanics/,
      about: /choose Hyperliquid or dYdX for perp DEX trading/,
    },
  ];

  for (const item of cases) {
    const client = computeRouteSeo({ url: item.path, article: item.article });
    const server = await routeMetadata(new URL(`https://nexualpha.com${item.path}`), { ASSETS: assets() });
    assert.equal(client.status, 200, item.path);
    assert.equal(server.status, 200, item.path);
    assert.equal(client.canonical, `https://nexualpha.com${item.path}`, item.path);
    assert.equal(server.canonical, `https://nexualpha.com${item.path}`, item.path);
    assert.equal(client.robots, "index,follow", item.path);
    assert.equal(server.robots, "index,follow", item.path);
    assert.match(client.title, item.title, item.path);
    assert.match(server.title, item.title, item.path);
    assert.match(client.description, item.description, item.path);
    assert.match(server.description, item.description, item.path);
    assert.match(schemaText(client), item.about, item.path);
    assert.match(schemaText(server), item.about, item.path);
    assert.doesNotMatch(`${client.title}\n${client.description}\n${server.title}\n${server.description}\n${schemaText(client)}\n${schemaText(server)}`, forbidden, item.path);
  }
});

test("Wave32 DEX profile SERP snippets keep parity and source-bound intent for Aerodrome and Jupiter", async () => {
  const cases = [
    {
      path: "/exchanges/aerodrome",
      // Class b: long search titles now drop the trailing brand suffix through budgetTitle.
      title: /Aerodrome Review: Base DEX Fees, Pools, Slipstream & veAERO/,
      description: /pool-level fees, Slipstream routing, Base bridge, token contracts, gas, incentives and veAERO reward boundaries/,
      question: /Aerodrome route and pool fee plus veAERO conditions/,
      answer: /standard or Slipstream pool type.*displayed pool fee.*price impact/,
    },
    {
      path: "/exchanges/jupiter",
      // Class b: long search titles now drop the trailing brand suffix through budgetTitle.
      title: /Jupiter Solana Swap Routes, Ultra Quotes and Fee Checks/,
      description: /no-route or failed-swap causes, platform fee boundaries, slippage, priority fees and route legs/,
      question: /Jupiter route, test quote and platform fee conditions/,
      answer: /failed-swap diagnosis/,
    },
  ];

  for (const item of cases) {
    const client = computeRouteSeo({ url: item.path });
    const server = await routeMetadata(new URL(`https://nexualpha.com${item.path}`), { ASSETS: assets() });
    assert.equal(client.canonical, `https://nexualpha.com${item.path}`, item.path);
    assert.equal(server.canonical, `https://nexualpha.com${item.path}`, item.path);
    assert.match(client.title, item.title, item.path);
    assert.match(server.title, item.title, item.path);
    assert.match(client.description, item.description, item.path);
    assert.match(server.description, item.description, item.path);
    assert.match(schemaText(client), item.question, item.path);
    assert.match(schemaText(server), item.question, item.path);
    assert.match(schemaText(client), item.answer, item.path);
    assert.match(schemaText(server), item.answer, item.path);
    assert.doesNotMatch(`${client.title}\n${client.description}\n${server.title}\n${server.description}\n${schemaText(client)}\n${schemaText(server)}`, forbidden, item.path);
  }
});
