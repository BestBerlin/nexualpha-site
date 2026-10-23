import assert from "node:assert/strict";
import test from "node:test";

import worker, { routeMetadata } from "../worker/index.js";
import { computeRouteSeo } from "../src/data/seo-injection.js";

const forbidden = /guaranteed|risk-free|always available|available in every region|registration result|guaranteed signup|guaranteed registration|profit|yield|private commission/i;

function assets() {
  return { fetch: async () => new Response("missing", { status: 404, headers: { "content-type": "text/plain" } }) };
}

function faqSchemaClient(seo) {
  return seo.schemas.find((schema) => schema["@type"] === "FAQPage");
}

function faqSchemaWorker(metadata) {
  const graph = Array.isArray(metadata.schema?.["@graph"]) ? metadata.schema["@graph"] : metadata.schema;
  return Array.isArray(graph) ? graph.find((schema) => schema["@type"] === "FAQPage") : null;
}

function text(value) {
  return JSON.stringify(value);
}

test("Wave33 Hyperliquid exact queries cover fees and funded-account boundaries without promises", async () => {
  const path = "/exchanges/hyperliquid";
  const client = computeRouteSeo({ url: path });
  const server = await routeMetadata(new URL(`https://nexualpha.com${path}`), { ASSETS: assets() });
  const clientFaq = faqSchemaClient(client);
  const serverFaq = faqSchemaWorker(server);
  const joined = `${client.title}\n${client.description}\n${server.title}\n${server.description}\n${text(clientFaq)}\n${text(serverFaq)}`;

  assert.equal(client.canonical, `https://nexualpha.com${path}`);
  assert.equal(server.canonical, `https://nexualpha.com${path}`);
  assert.equal(client.robots, "index,follow");
  assert.equal(server.robots, "index,follow");
  // The current English GSC snippet leads with fee and funded-account intent.
  assert.match(client.title, /Hyperliquid fees, rebates & funded account checks/);
  assert.match(server.title, /Hyperliquid fees, rebates & funded account checks/);
  assert.match(client.description, /rebates mean a conditional 4% fee discount/);
  assert.match(server.description, /rebates mean a conditional 4% fee discount/);
  assert.match(joined, /rolling 14-day volume/);
  assert.match(joined, /peer-to-peer and paid every hour/);
  assert.match(joined, /equity falls below maintenance margin/);
  assert.match(joined, /vault participation/);
  assert.match(joined, /do not prove third-party trader-funding offers, a third-party capital allocation offer/);
  assert.match(joined, /API-wallet signing routes/);
  assert.deepEqual(clientFaq.mainEntity, serverFaq.mainEntity);
  assert.doesNotMatch(joined, forbidden);
});

test("Wave33 Uniswap testnet query says testnet is not mainnet real-money execution", async () => {
  const path = "/exchanges/uniswap";
  const client = computeRouteSeo({ url: path });
  const server = await routeMetadata(new URL(`https://nexualpha.com${path}`), { ASSETS: assets() });
  const clientFaq = faqSchemaClient(client);
  const serverFaq = faqSchemaWorker(server);
  const joined = `${client.title}\n${client.description}\n${server.title}\n${server.description}\n${text(clientFaq)}\n${text(serverFaq)}`;

  assert.equal(client.canonical, `https://nexualpha.com${path}`);
  assert.equal(server.canonical, `https://nexualpha.com${path}`);
  assert.equal(client.robots, "index,follow");
  assert.equal(server.robots, "index,follow");
  assert.match(client.title, /Uniswap Testnet, Mainnet, Permit2/);
  assert.match(server.title, /Uniswap Testnet, Mainnet, Permit2/);
  assert.match(client.description, /wallet transaction preview/);
  assert.match(server.description, /wallet transaction preview/);
  assert.match(joined, /Ethereum Sepolia, Unichain Sepolia and Base Sepolia/);
  assert.match(joined, /only Ethereum Sepolia and Unichain Sepolia as testnet options/);
  assert.match(joined, /not proof of mainnet liquidity or token safety/);
  assert.match(joined, /Permit2 can manage signature-based token permissions/);
  assert.match(joined, /spender is the address allowed to move tokens/);
  assert.match(joined, /token approvals remain on-chain until revoked or changed/);
  assert.deepEqual(clientFaq.mainEntity, serverFaq.mainEntity);
  assert.doesNotMatch(joined, forbidden);
});
