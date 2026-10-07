import assert from "node:assert/strict";
import test from "node:test";

import { AEO_HIGH_INTENT_VISIBILITY_BASELINE } from "../src/data/aeo-question-registry.js";
import { exchangeResearch } from "../src/data/exchange-research.js";
import { priorityVenueAnswerFor } from "../src/data/priority-venue-answers.js";
import { computeRouteSeo } from "../src/data/seo-injection.js";
import { routeMetadata } from "../worker/index.js";

const assets = () => ({ fetch: async () => new Response("missing", { status: 404 }) });
const graph = (schema) => schema?.["@graph"] || (Array.isArray(schema) ? schema : [schema]);
const faq = (schemas) => schemas.find((item) => item?.["@type"] === "FAQPage");
const textOf = (value) => JSON.stringify(value);

test("R44 Uniswap owner answer targets the GSC testnet query without unsafe transfer language", () => {
  const answer = priorityVenueAnswerFor("uniswap", "en");
  const text = textOf(answer);

  assert.match(answer.title, /uniswap testnet/i);
  assert.match(answer.body, /uniswap testnet/i);
  assert.match(answer.body, /official app and docs/i);
  assert.match(answer.body, /do not connect a wallet or send value/i);
  assert.match(text, /API table can expose more testnet coverage than the public web app/i);
  assert.match(text, /wallet's final mainnet transaction preview/i);
  assert.match(text, /Compare Uniswap vs Jupiter/i);
  assert.match(text, /Open on-chain liquidity checks/i);
  assert.doesNotMatch(text, /send (?:real )?(?:funds|tokens) to (?:a )?(?:test|unknown|unverified) contract|guaranteed safe|testnet proves mainnet/i);
});

test("R44 Uniswap client and Worker schema expose the same testnet direct answer", async () => {
  const client = computeRouteSeo({ url: "/exchanges/uniswap", locale: "en" });
  const worker = await routeMetadata(new URL("https://nexualpha.com/exchanges/uniswap"), { ASSETS: assets() });
  const clientFaq = faq(client.schemas);
  const workerFaq = faq(graph(worker.schema));
  const page = client.schemas.find((item) => item?.["@type"] === "WebPage");

  assert.equal(client.status, 200);
  assert.equal(worker.status, 200);
  assert.deepEqual(clientFaq, { "@context": "https://schema.org", ...workerFaq });
  assert.equal(page.dateModified, "2026-09-22");
  assert.ok(page.relatedLink.includes("https://nexualpha.com/compare/uniswap-vs-jupiter"));
  assert.ok(page.relatedLink.includes("https://nexualpha.com/onchain?product=swap"));

  const direct = clientFaq.mainEntity[0];
  const schemaText = textOf(clientFaq);
  assert.match(direct.name, /uniswap testnet/i);
  assert.match(direct.acceptedAnswer.text, /API table/i);
  assert.match(direct.acceptedAnswer.text, /public web app/i);
  assert.match(direct.acceptedAnswer.text, /do not connect a wallet or send value/i);
  assert.ok(direct.acceptedAnswer.citation.includes("https://app.uniswap.org/"));
  assert.ok(direct.acceptedAnswer.citation.includes("https://developers.uniswap.org/docs/trading/swapping-api/supported-chains"));
  assert.match(schemaText, /Ethereum Sepolia, Unichain Sepolia and Base Sepolia/);
  assert.match(schemaText, /final mainnet transaction preview/);
  assert.match(schemaText, /unknown contract/i);
  assert.doesNotMatch(schemaText, /risk-free|free gas|guaranteed safe|testnet proves/i);
});

test("R44 Uniswap research facts and AEO baseline record exact testnet intent", () => {
  const facts = exchangeResearch.uniswap.facts.map((item) => `${item.label.en}: ${item.value.en}`).join("\n");
  const baseline = AEO_HIGH_INTENT_VISIBILITY_BASELINE.find((item) => item.id === "baseline-uniswap-testnet-gsc");

  assert.ok(baseline, "exact GSC testnet baseline should exist");
  assert.equal(baseline.query, "uniswap testnet");
  assert.equal(baseline.targetUrl, "https://nexualpha.com/exchanges/uniswap");
  assert.match(baseline.notes, /exact-query visibility/i);
  assert.doesNotMatch(baseline.notes, /\b\d+\s+impressions\s+and\s+0\s+clicks\b/i);
  assert.match(facts, /uniswap testnet/i);
  assert.match(facts, /official app, supported-chains table and deployments/i);
  assert.match(facts, /not deposit instructions/i);
  assert.match(facts, /Never send value to a copied or unknown contract/i);
  assert.doesNotMatch(facts, /testnet proves mainnet|guaranteed safe|risk-free/i);
});
