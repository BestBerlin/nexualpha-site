import assert from "node:assert/strict";
import test from "node:test";

import { routeMetadata } from "../worker/index.js";
import { computeRouteSeo } from "../src/data/seo-injection.js";

const forbidden = /guaranteed|risk-free|always available|available in every region|registration result|guaranteed signup|guaranteed registration|profit|yield|commission|rebate|real-time fees|nexu888|11350287|LUCKX|CANDY007|INS898|luckybitcoin/i;

function assets() {
  return { fetch: async () => new Response("missing", { status: 404, headers: { "content-type": "text/plain" } }) };
}

function graph(metadata) {
  const schema = metadata.schema?.["@graph"] || metadata.schema || [];
  return Array.isArray(schema) ? schema : [schema];
}

function schemaText(value) {
  return JSON.stringify(value.schemas || graph(value));
}

function collectionPage(seo) {
  return seo.schemas.find((schema) => schema["@type"] === "CollectionPage");
}

test("Wave34 Bybit vs Bitget stock query separates equity, tokenized, perp and copy-trading intents", async () => {
  const path = "/compare/bybit-vs-bitget";
  const client = computeRouteSeo({ url: `${path}?locale=en` });
  const server = await routeMetadata(new URL(`https://nexualpha.com${path}?locale=en`), { ASSETS: assets() });
  const joined = `${client.title}\n${client.description}\n${server.title}\n${server.description}\n${schemaText(client)}\n${schemaText(server)}`;

  assert.equal(client.status, 200);
  assert.equal(server.status, 200);
  assert.equal(client.canonical, `https://nexualpha.com${path}`);
  assert.equal(server.canonical, `https://nexualpha.com${path}`);
  assert.equal(client.robots, "index,follow");
  assert.equal(server.robots, "index,follow");
  assert.equal(client.title, server.title);
  assert.equal(client.description, server.description);
  assert.match(client.title, /Bybit vs Bitget Stocks, Copy Trading, Fees/);
  assert.match(client.description, /xStocks fee schedule, stock futures, copy-trading profit sharing/i);
  assert.match(joined, /ordinary securities|真實股票|真实股票/);
  assert.match(joined, /tokenized exposure|代幣化敞口|代币化敞口/);
  assert.match(joined, /stock futures/);
  assert.match(joined, /Bybit xStocks/);
  assert.match(joined, /Bitget stock futures/);
  assert.match(joined, /copy trading/);
  assert.match(joined, /different paths|不同路径|不同路徑/);
  assert.match(joined, /not approval or a benefit promise|不是批准或权益承诺|不是批准或權益承諾/);
  assert.match(joined, /selected trader\/account page|account-route limits|账户页面|帳戶頁面/);
  assert.match(joined, /https:\/\/www\.bybit\.com/);
  assert.match(joined, /https:\/\/www\.bitget\.com/);
  assert.match(joined, /FAQ-xStocks-on-Bybit/);
  assert.match(joined, /7700532076057/);
  assert.match(joined, /12560603892733/);
  assert.match(joined, /Copy-Trading-Profit-Sharing-Explained/);
  assert.match(joined, /9083311039641/);
  assert.match(joined, /Adventure Zone & xStocks|Adventure Zone &amp; xStocks/);
  assert.match(joined, /ordinary crypto spot row|ordinary crypto spot fees/);
  // A sourced copy-trading charge describes a cost, not a profit promise.
  assert.match(joined, /copy-trading profit shar(?:e|ing)/);
  assert.doesNotMatch(joined.replaceAll("Copy-Trading-Profit-Sharing-Explained", "Copy-Trading-Cost-Explained").replaceAll("profit-sharing", "cost-sharing").replaceAll("copy-trading profit sharing", "copy-trading fee").replaceAll("copy-trading profit share", "copy-trading fee"), forbidden);
});

test("Wave34 derivatives topic covers perpetual platform mechanics without product-access promises", async () => {
  const path = "/topics/derivatives";
  const client = computeRouteSeo({ url: path });
  const server = await routeMetadata(new URL(`https://nexualpha.com${path}`), { ASSETS: assets() });
  const joined = `${client.title}\n${client.description}\n${server.title}\n${server.description}\n${schemaText(client)}\n${schemaText(server)}`;
  const collection = collectionPage(client);

  assert.equal(client.status, 200);
  assert.equal(server.status, 200);
  assert.equal(client.canonical, `https://nexualpha.com${path}`);
  assert.equal(server.canonical, `https://nexualpha.com${path}`);
  assert.equal(client.robots, "index,follow");
  assert.equal(server.robots, "index,follow");
  assert.equal(client.title, server.title);
  assert.equal(client.description, server.description);
  assert.match(client.title, /Crypto Perpetual Platform Comparison: Fees, Funding and Liquidation Checks/);
  assert.match(client.description, /funding, margin mode, liquidation rules, oracle route, collateral movement, regional access and product permissions/i);
  assert.match(joined, /funding cadence/);
  assert.match(joined, /isolated or cross margin/);
  assert.match(joined, /accepted collateral/);
  assert.match(joined, /oracle or mark-price route/);
  assert.match(joined, /liquidation rules/);
  assert.match(joined, /product access by region/);
  assert.match(joined, /Final product access, KYC, country availability, benefits, leverage and fee tier/);
  assert.ok(collection.relatedLink.includes("https://nexualpha.com/compare/bybit-vs-bitget"));
  assert.ok(collection.relatedLink.includes("https://nexualpha.com/compare/hyperliquid-vs-dydx"));
  assert.ok(collection.relatedLink.includes("https://nexualpha.com/topics/tokenized-stocks-vs-perpetuals"));
  assert.doesNotMatch(joined, forbidden);
});
