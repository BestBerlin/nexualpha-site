import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  PRIORITY_QUERY_OWNER_REGISTRY,
  priorityCanonicalOwnerPath,
  priorityOwnerForPath,
  priorityOwnerForQuery,
} from "../src/data/priority-query-owner-registry.js";
import { computeRouteSeo } from "../src/data/seo-injection.js";
import { routeMetadata } from "../worker/index.js";

const protectedFiles = {
  "src/data/partner-registry.js": "8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a",
  "src/data/venue-database.js": "0ce124afbe9f4758ce9ec093c79372550ce2e2e90a7342aa05ecc8d3482e1d52",
  "src/data/public-cta.js": "675875240d5fbb05498284a37f90a14488d6ace73d19b102caeb5add9e33f8e3",
  "src/data/regional-cta.js": "a2542bb137b6b6ff123a0d3c6b3a01b09e1e3a785ee223e3b4e04a3fe8aab665",
};

const assets = {
  fetch: async () => new Response("missing", { status: 404, headers: { "content-type": "text/plain" } }),
};

function graph(schema) {
  const value = schema?.["@graph"] || schema || [];
  return Array.isArray(value) ? value : [value];
}

function schemaOf(schemas, type) {
  return graph(schemas).find((schema) => schema?.["@type"] === type);
}

test("R48 maps six search opportunities to one canonical owner and one support boundary", () => {
  const cases = [
    ["aerodrome-base-dex", "aerodrome slipstream", "/exchanges/aerodrome", "/factbook/aerodrome"],
    ["gate-io-decision", "gate.io 紹介コード", "/exchanges/gate-io", "/news/how-to-register-gate-account-complete-identity-verification-and-secure-access"],
    ["gmx-v2-decision", "gmx v2 perpetual dex", "/exchanges/gmx", "/factbook/gmx"],
    ["crypto-perpetual-platform", "crypto perpetual platform", "/topics/derivatives", "/news/cex-vs-dex-vs-perp-dex"],
    ["no-kyc-access", "no kyc crypto platform", "/topics/no-kyc", "/news/exchange-subaccount-kyc-api-restriction-disclosure-radar"],
    ["meme-coin-platform", "أفضل عملات الميم", "/topics/meme-coins", "/news/gate-vs-mexc-spot-order-types-control-boundaries"],
  ];

  for (const [id, query, ownerPath, supportPath] of cases) {
    const owner = PRIORITY_QUERY_OWNER_REGISTRY[id];
    assert.equal(owner.canonicalOwnerPath, ownerPath, id);
    assert.equal(owner.supportPath, supportPath, id);
    assert.equal(priorityOwnerForQuery(query)?.canonicalOwnerPath, ownerPath, query);
    assert.equal(priorityCanonicalOwnerPath(query), ownerPath, query);
    assert.equal(priorityOwnerForPath(ownerPath)?.canonicalOwnerPath, ownerPath, ownerPath);
    assert.equal(priorityOwnerForPath(supportPath)?.canonicalOwnerPath, ownerPath, supportPath);
    assert.match(owner.ownerBoundary, /should land|should remain/i, `${id}: explicit boundary`);
  }
});

test("R48 Aerodrome and GMX use concise decision-first English snippets in client and worker", async () => {
  const cases = [
    [
      "/exchanges/aerodrome",
      "Aerodrome Review: Base DEX Fees, Pools, Slipstream & veAERO — NexuAlpha",
      /Base-native DEX.*pool contracts.*price impact.*veAERO/is,
    ],
    [
      "/exchanges/gmx",
      "GMX v2 Fees: Pools, Price Impact, Funding and Liquidation — NexuAlpha",
      /wallet-connected.*(?:swap|perpetual).*(?:perpetual|swap).*borrow cost.*liquidation/is,
    ],
  ];

  for (const [path, title, answerPattern] of cases) {
    const client = computeRouteSeo({ url: path, locale: "en" });
    const worker = await routeMetadata(new URL(`https://nexualpha.com${path}`), { ASSETS: assets });
    const joined = `${JSON.stringify(client.schemas)}\n${JSON.stringify(worker.schema)}`;

    assert.equal(client.title, title, path);
    assert.equal(worker.title, title, path);
    assert.equal(client.canonical, `https://nexualpha.com${path}`, path);
    assert.equal(worker.canonical, `https://nexualpha.com${path}`, path);
    assert.equal(client.robots, "index,follow", path);
    assert.equal(worker.robots, "index,follow", path);
    assert.match(joined, answerPattern, path);
    assert.doesNotMatch(joined, /guaranteed|risk-free|always available/i, path);
  }
});

test("R48 Gate.io owner is source-bound, internally connected and mirrored to the worker", async () => {
  const path = "/exchanges/gate-io";
  const client = computeRouteSeo({ url: path, locale: "en" });
  const worker = await routeMetadata(new URL(`https://nexualpha.com${path}`), { ASSETS: assets });
  const clientPage = schemaOf(client.schemas, "WebPage");
  const workerPage = schemaOf(worker.schema, "WebPage");
  const clientFaq = schemaOf(client.schemas, "FAQPage");
  const workerFaq = schemaOf(worker.schema, "FAQPage");
  const joined = `${JSON.stringify(client.schemas)}\n${JSON.stringify(worker.schema)}`;

  assert.equal(client.title, "Gate.io Fees, KYC, Listings and Referral Code Checks — NexuAlpha");
  assert.equal(worker.title, client.title);
  assert.equal(worker.description, client.description);
  assert.match(joined, /official regional domain.*identity requirements.*spot or futures fee schedule/is);
  assert.match(joined, /does not prove attribution, eligibility, reward value, account approval or commission/i);
  assert.ok(clientPage.citation.includes("https://www.gate.com/docs/developers/apiv4/"));
  assert.ok(workerPage.citation.includes("https://www.gate.com/help/trade/spot/22550/gate-io-s-spot-trading-fee-rules"));
  assert.ok(clientPage.relatedLink.includes("https://nexualpha.com/compare/gate-io-vs-coinbase"));
  assert.ok(clientPage.relatedLink.includes("https://nexualpha.com/topics/meme-coins"));
  assert.deepEqual(workerPage.relatedLink, clientPage.relatedLink);
  assert.ok(clientFaq.mainEntity.length >= 4);
  assert.deepEqual(workerFaq.mainEntity, clientFaq.mainEntity);
  assert.doesNotMatch(joined, /nexubest|nexu888|11350287|LUCKX|CANDY007|INS898|luckybitcoin/i);
});

test("R48 keeps all protected invitation and CTA registries byte-identical", async () => {
  for (const [relativePath, expectedSha] of Object.entries(protectedFiles)) {
    const source = await readFile(new URL(`../${relativePath}`, import.meta.url));
    assert.equal(createHash("sha256").update(source).digest("hex"), expectedSha, relativePath);
  }
});
