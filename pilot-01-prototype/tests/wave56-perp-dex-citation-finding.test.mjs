import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { computeRouteSeo } from "../src/data/seo-injection.js";
import { routeMetadata } from "../worker/index.js";

const protectedPartnerRegistrySha = "8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a";
const expectedFields = ["fee", "funding", "collateral", "margin", "oracle", "liquidation"];
const expectedVenueHosts = {
  hyperliquid: "hyperliquid.gitbook.io",
  dydx: "docs.dydx.xyz",
  gmx: "docs.gmx.io",
  aevo: "www.aevo.xyz",
};

function assets() {
  return {
    fetch: async () => new Response("missing", { status: 404, headers: { "content-type": "text/plain" } }),
  };
}

function schemas(value) {
  const graph = value?.["@graph"] || value || [];
  return Array.isArray(graph) ? graph : [graph];
}

function findDataset(value) {
  return schemas(value)
    .flatMap((schema) => [schema, ...(schema?.hasPart || [])])
    .find((schema) => schema?.["@type"] === "Dataset" && schema.url === "https://nexualpha.com/research/wave48-perp-dex-cost-citations.json");
}

test("Wave56 Perp DEX finding is derived from the dated source matrix", async () => {
  const asset = JSON.parse(await readFile(new URL("../public/research/wave48-perp-dex-cost-citations.json", import.meta.url), "utf8"));
  const finding = asset.findings.find((item) => item.id === "wave56-perp-dex-cost-stack-requires-multiple-fields");

  assert.ok(finding, "Wave56 finding should be present");
  assert.equal(finding.asOf, "2026-09-15T22:43:11+08:00");
  assert.equal(finding.stats.reviewedVenueCount, 4);
  assert.equal(finding.stats.requiredFieldCount, 6);
  assert.equal(finding.stats.knownVenueFieldRecords, 24);
  assert.match(finding.statement, /single static fee or live funding quote/i);
  assert.match(finding.limitations, /not a live-rate feed/i);
  assert.match(finding.limitations, /venue ranking/i);
  assert.doesNotMatch(JSON.stringify(finding), /referral link|invite code|private commission|guaranteed registration/i);

  const venuesById = new Map(asset.venues.map((venue) => [venue.id, venue]));
  for (const evidence of finding.evidence) {
    const venue = venuesById.get(evidence.venue);
    assert.ok(venue, `missing venue ${evidence.venue}`);
    assert.deepEqual(evidence.fields, expectedFields);
    assert.deepEqual(Object.keys(venue.fields).sort(), expectedFields.toSorted());
    assert.equal(evidence.sourceHosts[0], expectedVenueHosts[evidence.venue]);
    for (const fieldId of expectedFields) {
      const field = venue.fields[fieldId];
      assert.equal(field.status, "known", `${evidence.venue}.${fieldId} status`);
      assert.equal(new URL(field.sourceUrl).hostname, expectedVenueHosts[evidence.venue]);
    }
  }
});

test("Wave56 finding is exposed by the derivatives owner page and Dataset schema", async () => {
  const component = await readFile(new URL("../src/components/v3/TopicGuidePage.jsx", import.meta.url), "utf8");
  assert.match(component, /Citation-ready finding · 2026-09-15/);
  assert.match(component, /all 24 required venue-field entries as source-backed known/);

  const clientDataset = findDataset(computeRouteSeo({ url: "/topics/derivatives", locale: "en" }).schemas);
  const workerDataset = findDataset((await routeMetadata(new URL("https://nexualpha.com/topics/derivatives"), { ASSETS: assets() })).schema);

  for (const dataset of [clientDataset, workerDataset]) {
    assert.ok(dataset, "Wave48 Perp DEX Dataset schema should be discoverable");
    assert.match(dataset.abstract, /all 24 required venue-field records are source-backed as known/i);
    assert.match(dataset.description, /not a live quote/i);
    assert.equal(dataset.isPartOf, "https://nexualpha.com/topics/derivatives#perp-cost-field-dictionary");
    assert.ok(dataset.citation.includes("https://nexualpha.com/research/wave48-perp-dex-cost-citations.json"));
    assert.doesNotMatch(JSON.stringify(dataset), /\/ref\/|ref=|private commission|invite code|guaranteed registration/i);
  }
});

test("Wave56 finding is included in public AI source indexes without creating commercial claims", async () => {
  const llms = await readFile(new URL("../public/llms.txt", import.meta.url), "utf8");
  const full = await readFile(new URL("../public/llms-full.txt", import.meta.url), "utf8");

  for (const text of [llms, full]) {
    assert.match(text, /Wave56 finding: across Hyperliquid, dYdX, GMX and Aevo/);
    assert.match(text, /single static fee or live funding quote/);
    assert.doesNotMatch(text, /private commission|invite code|guaranteed registration|guaranteed eligibility/i);
  }
});

test("Wave56 work preserves the protected partner registry", async () => {
  const partnerRegistry = await readFile(new URL("../src/data/partner-registry.js", import.meta.url));
  assert.equal(createHash("sha256").update(partnerRegistry).digest("hex"), protectedPartnerRegistrySha);
});
