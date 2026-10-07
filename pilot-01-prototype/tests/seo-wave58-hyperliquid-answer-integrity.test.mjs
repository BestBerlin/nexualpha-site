import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { computeRouteSeo } from "../src/data/seo-injection.js";
import { routeMetadata } from "../worker/index.js";

const EXPECTED_PARTNER_REGISTRY_SHA = "8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a";
const EXPECTED_TITLE = "Hyperliquid Fees, Referral Discount and Funded Account Checks — NexuAlpha";
const EXPECTED_DESCRIPTION = "Review Hyperliquid rolling 14-day fee tiers, hourly funding, referral discount vs cashback language, USDC collateral, sub-accounts, vault volume and funded-account claim boundaries.";
const HYPERLIQUID_DOCS = "https://hyperliquid.gitbook.io/hyperliquid-docs";

function assets() {
  return { fetch: async () => new Response("missing", { status: 404, headers: { "content-type": "text/plain" } }) };
}

function graphOf(schema) {
  return schema?.["@graph"] || (Array.isArray(schema) ? schema : [schema]);
}

function faqOf(schemas) {
  return schemas.find((schema) => schema["@type"] === "FAQPage");
}

function answerFor(faq, questionPattern) {
  const row = faq.mainEntity.find((entry) => questionPattern.test(entry.name));
  assert.ok(row, String(questionPattern));
  return row.acceptedAnswer;
}

test("Wave58 keeps Hyperliquid route identity frozen while client and Worker emit the same answer graph", async () => {
  const client = computeRouteSeo({ url: "/exchanges/hyperliquid", locale: "en" });
  const worker = await routeMetadata(new URL("https://nexualpha.com/exchanges/hyperliquid"), { ASSETS: assets() });
  const clientFaq = faqOf(client.schemas);
  const workerFaq = faqOf(graphOf(worker.schema));

  assert.equal(client.canonical, "https://nexualpha.com/exchanges/hyperliquid");
  assert.equal(worker.canonical, client.canonical);
  assert.equal(client.title, EXPECTED_TITLE);
  assert.equal(worker.title, EXPECTED_TITLE);
  assert.equal(client.description, EXPECTED_DESCRIPTION);
  assert.equal(worker.description, EXPECTED_DESCRIPTION);
  assert.equal(client.robots, "index,follow");
  assert.equal(worker.robots, "index,follow");
  assert.deepEqual(workerFaq.mainEntity, clientFaq.mainEntity);
});

test("Wave58 binds Hyperliquid fee and funded-account answers to their specific official sources", async () => {
  const clientFaq = faqOf(computeRouteSeo({ url: "/exchanges/hyperliquid", locale: "en" }).schemas);
  const funded = answerFor(clientFaq, /funded account/i);
  const referral = answerFor(clientFaq, /cashback or a referral discount/i);
  const feeDetails = answerFor(clientFaq, /cheaper than a centralized futures exchange/i);
  const funding = answerFor(clientFaq, /funding/i);
  const serialized = JSON.stringify(clientFaq);
  const page = computeRouteSeo({ url: "/exchanges/hyperliquid", locale: "en" }).schemas.find((schema) => schema["@type"] === "WebPage");

  for (const path of ["trading/sub-accounts", "trading/account-abstraction-modes", "for-developers/api/nonces-and-api-wallets"]) {
    assert.ok(funded.citation.includes(`${HYPERLIQUID_DOCS}/${path}`), `funded-account answer cites ${path}`);
  }
  assert.ok(feeDetails.citation.includes(`${HYPERLIQUID_DOCS}/trading/fees`));
  assert.ok(feeDetails.citation.includes(`${HYPERLIQUID_DOCS}/referrals`));
  assert.ok(referral.citation.includes(`${HYPERLIQUID_DOCS}/referrals`));
  assert.match(referral.text, /not a generic cashback promise/i);
  assert.match(referral.text, /do not apply to vaults or sub-accounts/i);
  assert.ok(feeDetails.citation.includes(`${HYPERLIQUID_DOCS}/hyperliquid-improvement-proposals-hips/hip-3-builder-deployed-perpetuals`));
  assert.ok(funding.citation.includes(`${HYPERLIQUID_DOCS}/trading/funding`));
  assert.match(serialized, /sub-account volume rules/);
  assert.match(serialized, /vault-volume separation/);
  assert.match(serialized, /HIP-3 market conditions/);
  assert.match(serialized, /API-wallet signing routes/);
  assert.match(serialized, /third-party capital allocation offer/);

  const legacyTupleFaq = faqOf(computeRouteSeo({ url: "/exchanges/binance", locale: "en" }).schemas);
  assert.ok(legacyTupleFaq.mainEntity.every((entry) => entry.acceptedAnswer.citation?.length >= 1));
});

test("Wave58 Hyperliquid first screen exposes review date, cost model and existing research owners", async () => {
  const source = await readFile(new URL("../src/components/v3/V3Pages.jsx", import.meta.url), "utf8");
  const start = source.indexOf("    hyperliquid: {");
  const end = source.indexOf("    uniswap: {", start);
  const block = source.slice(start, end);

  assert.match(block, /reviewedAt: "2026-09-15"/);
  assert.match(block, /round-trip trading fees ± hourly funding \+ spread\/slippage \+ collateral transfer and exit cost/);
  assert.match(block, /referral discount or reward boundary/);
  assert.match(block, /cashback search should be checked against official referral terms/);
  assert.match(block, /\/topics\/derivatives#perp-cost-field-dictionary/);
  assert.match(block, /\/news\/hyperliquid-vs-dydx/);
  assert.match(source, /className="v3-venue-direct-answer__reviewed"/);
  assert.match(source, /className="v3-venue-direct-answer__formula"/);
});

test("Wave58 Hyperliquid answer work preserves the protected partner registry SHA", async () => {
  const partnerRegistry = await readFile(new URL("../src/data/partner-registry.js", import.meta.url));
  assert.equal(createHash("sha256").update(partnerRegistry).digest("hex"), EXPECTED_PARTNER_REGISTRY_SHA);
});
