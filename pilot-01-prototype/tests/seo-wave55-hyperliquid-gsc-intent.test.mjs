import { referralSeoFor } from '../src/data/referral-seo.js';
import { committedFileHash } from './r100-test-contracts.mjs';
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { computeRouteSeo } from "../src/data/seo-injection.js";
import sitesWorker, { routeMetadata } from "../worker/index.js";

const EXPECTED_PARTNER_REGISTRY_SHA =
  committedFileHash('src/data/partner-registry.js');

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

test("Wave55 Hyperliquid metadata strengthens fees and funded-account answer coverage without changing URL", async () => {
  const client = computeRouteSeo({ url: "/exchanges/hyperliquid", locale: "en" });
  const worker = await routeMetadata(new URL("https://nexualpha.com/exchanges/hyperliquid"), { ASSETS: assets() });
  const clientText = JSON.stringify(client.schemas);
  const workerText = JSON.stringify(worker.schema);
  const clientFaq = client.schemas.find((schema) => schema["@type"] === "FAQPage");
  const workerFaq = graphOf(worker.schema).find((schema) => schema["@type"] === "FAQPage");

  assert.equal(client.status, 200);
  assert.equal(client.canonical, "https://nexualpha.com/exchanges/hyperliquid");
  assert.equal(worker.canonical, "https://nexualpha.com/exchanges/hyperliquid");
  assert.equal(client.title, referralSeoFor("hyperliquid").title);
  assert.equal(worker.title, client.title);

  assert.equal(clientFaq.mainEntity.length, 7);
  assert.equal(workerFaq.mainEntity.length, 7);
  assert.match(clientText, /rolling 14-day volume/);
  assert.match(clientText, /referral-code fee discount/);
  assert.match(clientText, /not a generic cashback promise/);
  assert.match(clientText, /sub-account volume rules/);
  assert.match(clientText, /vault-volume separation/);
  assert.match(clientText, /HIP-3 market conditions/);
  assert.match(workerText, /API-wallet signing routes/);
  assert.match(workerText, /third-party capital allocation offer/);
  assert.match(workerText, /promised trader-funding result/);

  const pageSchema = client.schemas.find((schema) => schema["@type"] === "WebPage");
  assert.ok(pageSchema.citation.includes("https://hyperliquid.gitbook.io/hyperliquid-docs/referrals"));
  assert.ok(pageSchema.citation.includes("https://hyperliquid.gitbook.io/hyperliquid-docs/hypercore/usdc"));
  assert.ok(pageSchema.citation.includes("https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/nonces-and-api-wallets"));
  assert.ok(pageSchema.citation.includes("https://hyperliquid.gitbook.io/hyperliquid-docs/hyperliquid-improvement-proposals-hips/hip-3-builder-deployed-perpetuals"));
  assert.ok(pageSchema.relatedLink.includes("https://nexualpha.com/topics/derivatives#perp-cost-field-dictionary"));

  assert.doesNotMatch(`${clientText}\n${workerText}`, /private commission|commission rate|guaranteed funded account|guaranteed capital allocation|invite code|referral link|guaranteed cashback/i);
});

test("Wave55 Hyperliquid SSR keeps the extractable source map in HTML", async () => {
  const response = await sitesWorker.fetch(
    new Request("https://nexualpha.com/exchanges/hyperliquid", { headers: { accept: "text/html" } }),
    { ASSETS: assets() },
  );
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /<script id="nexualpha-route-schema" type="application\/ld\+json">/);
  assert.match(html, /referral-code fee discount/);
  assert.match(html, /not a generic cashback promise/);
  assert.match(html, /sub-account volume rules/);
  assert.match(html, /vault-volume separation/);
  assert.match(html, /HIP-3 market conditions/);
  assert.match(html, /API-wallet signing routes/);
  assert.doesNotMatch(html, /private commission|commission rate|guaranteed funded account|invite code|referral link|guaranteed cashback/i);
});

test("Wave55 Hyperliquid SEO work preserves the protected partner registry SHA", async () => {
  const partnerRegistry = await readFile(new URL("../src/data/partner-registry.js", import.meta.url));
  const actual = createHash("sha256").update(partnerRegistry).digest("hex");

  assert.equal(actual, EXPECTED_PARTNER_REGISTRY_SHA);
});
