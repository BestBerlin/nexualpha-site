import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { AEO_QUESTION_REGISTRY } from "../src/data/aeo-question-registry.js";
import { computeRouteSeo } from "../src/data/seo-injection.js";
import { routeMetadata } from "../worker/index.js";

const assets = () => ({ fetch: async () => new Response("missing", { status: 404 }) });
const graph = (schema) => schema?.["@graph"] || (Array.isArray(schema) ? schema : [schema]);
const faq = (schemas) => schemas.find((item) => item?.["@type"] === "FAQPage");

test("Wave59 Uniswap AEO questions map one existing canonical to official entity sources", () => {
  const entries = AEO_QUESTION_REGISTRY.filter((item) => [
    "uniswap-api-web-testnet-scope",
    "uniswap-mainnet-wallet-preview-boundary",
    "uniswap-token-router-permit2-spender",
    "uniswap-approval-revoke-boundary",
  ].includes(item.id));

  assert.equal(entries.length, 4);
  for (const entry of entries) {
    assert.equal(entry.canonicalPath, "/exchanges/uniswap");
    assert.equal(entry.status, "source-linked");
    assert.equal(entry.reviewedAt, "2026-09-16");
    assert.ok(entry.sourceUrls.every((url) => url.startsWith("https://")));
    assert.match(entry.answerBoundary, /do not infer eligibility or a promotion/);
  }
});

test("Wave59 Uniswap client and Worker expose matching testnet and contract-role answers", async () => {
  const client = computeRouteSeo({ url: "/exchanges/uniswap", locale: "en" });
  const worker = await routeMetadata(new URL("https://nexualpha.com/exchanges/uniswap"), { ASSETS: assets() });
  const clientFaq = faq(client.schemas);
  const workerFaq = faq(graph(worker.schema));
  const clientPage = client.schemas.find((item) => item?.["@type"] === "WebPage");
  const workerPage = graph(worker.schema).find((item) => item?.["@type"] === "WebPage");

  assert.equal(client.status, 200);
  assert.equal(worker.status, 200);
  assert.equal(client.canonical, "https://nexualpha.com/exchanges/uniswap");
  assert.equal(worker.canonical, client.canonical);
  assert.equal(client.title, worker.title);
  assert.equal(client.description, worker.description);
  assert.equal(client.title, "Uniswap Testnet, Mainnet, Permit2 and Swap Preview Checklist — NexuAlpha");
  assert.match(client.description, /official app and docs, API and web testnet scope, mainnet chain, token contract, pool route, Permit2 spender, gas and wallet transaction preview/);
  assert.equal(clientPage.dateModified, "2026-09-22");
  assert.equal(workerPage.dateModified, clientPage.dateModified);
  assert.deepEqual(clientFaq, { "@context": "https://schema.org", ...workerFaq });

  const text = JSON.stringify(clientFaq);
  const directAnswer = clientFaq.mainEntity[0];
  const testnetAnswer = clientFaq.mainEntity.find((item) => /API testnets and the web app/.test(item.name));
  const roleAnswer = clientFaq.mainEntity.find((item) => /token contract, Universal Router, Permit2 and spender/.test(item.name));
  const revokeAnswer = clientFaq.mainEntity.find((item) => /disconnecting a wallet revoke/.test(item.name));
  assert.match(directAnswer.name, /before using Uniswap testnet or mainnet/);
  assert.match(directAnswer.acceptedAnswer.text, /official Uniswap app and docs first/);
  assert.match(directAnswer.acceptedAnswer.text, /gas asset and final wallet transaction preview/);
  assert.match(directAnswer.acceptedAnswer.text, /do not prove mainnet liquidity, execution quality or token safety/);
  assert.ok(directAnswer.acceptedAnswer.citation.includes("https://app.uniswap.org/"));
  assert.ok(directAnswer.acceptedAnswer.citation.includes("https://developers.uniswap.org/docs/get-started/quickstart"));
  assert.ok(testnetAnswer.acceptedAnswer.citation.includes("https://developers.uniswap.org/docs/trading/swapping-api/supported-chains"));
  assert.ok(roleAnswer.acceptedAnswer.citation.includes("https://developers.uniswap.org/docs/protocols/universal-router/overview"));
  assert.ok(roleAnswer.acceptedAnswer.citation.includes("https://developers.uniswap.org/docs/protocols/permit2/overview"));
  assert.ok(revokeAnswer.acceptedAnswer.citation.includes("https://support.uniswap.org/hc/en-us/articles/25380237324685-How-to-revoke-token-approvals"));
  assert.match(text, /Ethereum Sepolia, Unichain Sepolia and Base Sepolia/);
  assert.match(text, /only Ethereum Sepolia and Unichain Sepolia/);
  assert.match(text, /token contract identifies the asset/);
  assert.match(text, /Universal Router can route the swap path/);
  assert.match(text, /Permit2 can manage signature-based token permissions/);
  assert.match(text, /spender is the address allowed to move tokens/);
  assert.match(text, /Disconnecting stops a site session/);
  assert.match(text, /token approvals remain on-chain until revoked or changed/);
  assert.doesNotMatch(text, /guaranteed safe|certified safe|risk-free|testnet proves|mainnet is safe|free gas/i);
});

test("Wave59 llms inventories expose Uniswap retrieval questions on the owner canonical", async () => {
  for (const name of ["llms.txt", "llms-full.txt"]) {
    const content = await readFile(new URL(`../public/${name}`, import.meta.url), "utf8");
    assert.match(content, /Which Uniswap testnets are available through the API versus the official web interface/);
    assert.match(content, /Why does a Uniswap testnet or API result not replace the mainnet wallet transaction preview before signing/);
    assert.match(content, /How do the token contract, Universal Router, Permit2 contract and spender differ before a Uniswap wallet signature/);
    assert.match(content, /Why does disconnecting a wallet from Uniswap not revoke token approvals or Permit2 permissions/);
    assert.match(content, /canonical: https:\/\/nexualpha\.com\/exchanges\/uniswap/);
    assert.match(content, /developers\.uniswap\.org\/docs\/trading\/swapping-api\/supported-chains/);
    assert.match(content, /40050562560781-Crypto-Wallet-Signature-Scams/);
  }
});
