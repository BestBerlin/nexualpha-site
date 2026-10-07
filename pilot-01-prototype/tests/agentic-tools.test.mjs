import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import worker from "../worker/index.js";

test("Worker topic source copy contains no unsafe absolute marketing claims", async () => {
  const source = await readFile(new URL("../worker/index.js", import.meta.url), "utf8");
  const forbidden = [
    /risk[- ]free/i,
    /foolproof/i,
    /guaranteed unblockable/i,
    /guarantee zero bank freezes/i,
    /100%[^\n]{0,48}(safe|安全|防冻|不冻结)/i,
    /structurally safer/i,
  ];

  for (const pattern of forbidden) {
    assert.doesNotMatch(source, pattern);
  }
});

test("agent manifest is a tool directory and does not self-declare as OpenAPI", async () => {
  const manifest = JSON.parse(await readFile(new URL("../public/.well-known/agent.json", import.meta.url), "utf8"));

  assert.equal(Object.hasOwn(manifest, "api"), false);
  assert.equal(manifest.directory_type, "tool_directory");
  assert.equal(manifest.base_url, "https://nexualpha.com");
  assert.ok(Array.isArray(manifest.tools));

  const serialized = JSON.stringify(manifest);
  assert.equal(serialized.includes('"type":"openapi"'), false);
  assert.equal(serialized.includes('"url":"https://nexualpha.com/.well-known/agent.json"'), false);
});

test("agent API /api/v1/agent/lowest-fee returns source-bound published fee scenarios with CORS", async () => {
  const request = new Request("https://example.test/api/v1/agent/lowest-fee?volume=50000&type=futures");
  const response = await worker.fetch(request, { ASSETS: { fetch: async () => new Response("missing", { status: 404 }) } });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("access-control-allow-origin"), "*");
  assert.equal(response.headers.get("content-type"), "application/json; charset=utf-8");

  const data = await response.json();
  assert.equal(data.status, "success");
  assert.equal(data.sourceStatus, "limited_published_base_fee_scenario");
  assert.equal(data.query.volumeUsd, 50000);
  assert.equal(data.query.marketType, "futures");
  assert.equal(data.optimalVenue, undefined);
  assert.ok(data.lowestPublishedBaseFeeScenario);
  assert.ok(data.lowestPublishedBaseFeeScenario.name);
  assert.ok(data.lowestPublishedBaseFeeScenario.baseTakerFee);
  assert.ok(data.lowestPublishedBaseFeeScenario.estimatedTakerCostUsd >= 0);
  assert.ok(data.publishedBaseFeeScenarios.length >= 3);
  assert.ok(data.sourceLinks.includes("https://nexualpha.com/methodology"));

  const serialized = JSON.stringify(data);
  assert.equal(serialized.includes("rebatePercent"), false);
  assert.equal(serialized.includes("netTakerFee"), false);
  assert.equal(serialized.includes("optimalVenue"), false);
});

test("agent API /api/v1/agent/verify-domain reports registry matches without security guarantees", async () => {
  const okRequest = new Request("https://example.test/api/v1/agent/verify-domain?domain=binance.com");
  const okResponse = await worker.fetch(okRequest, { ASSETS: { fetch: async () => new Response("missing", { status: 404 }) } });

  assert.equal(okResponse.status, 200);
  const okData = await okResponse.json();
  assert.equal(okData.status, "success");
  assert.equal(okData.matchesKnownOfficialDomain, true);
  assert.equal(okData.matchStatus, "known_official_domain_registry_match");
  assert.equal(okData.venue.slug, "binance");
  assert.equal(Object.hasOwn(okData.venue, "porCoverage"), false);
  assert.equal(Object.hasOwn(okData, "securityRating"), false);
  assert.match(okData.decisionUse, /only checks whether/);

  const fakeRequest = new Request("https://example.test/api/v1/agent/verify-domain?domain=binance-safety-login.top");
  const fakeResponse = await worker.fetch(fakeRequest, { ASSETS: { fetch: async () => new Response("missing", { status: 404 }) } });

  assert.equal(fakeResponse.status, 200);
  const fakeData = await fakeResponse.json();
  assert.equal(fakeData.status, "warning");
  assert.equal(fakeData.matchesKnownOfficialDomain, false);
  assert.equal(fakeData.matchStatus, "not_found_in_registry");
  assert.equal(Object.hasOwn(fakeData, "securityRating"), false);
  assert.equal(Object.hasOwn(fakeData, "verifiedRegistryCount"), false);
  assert.equal(Object.hasOwn(fakeData, "registryCount"), false);
  assert.match(fakeData.decisionUse, /not a risk finding/);

  const serialized = JSON.stringify([okData, fakeData]);
  assert.equal(serialized.includes("A+ Verified Official"), false);
  assert.equal(serialized.includes("verified registry"), false);
  assert.equal(serialized.includes("phishing"), false);
});

test("agent API /api/v1/agent/por-status fails closed instead of certifying reserves", async () => {
  const req = new Request("https://example.test/api/v1/agent/por-status?slug=okx");
  const res = await worker.fetch(req, { ASSETS: { fetch: async () => new Response("missing", { status: 404 }) } });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, "success");
  assert.equal(data.slug, "okx");
  assert.equal(data.sourceStatus, "official_source_review_required");
  assert.equal(data.porCoverage, "unknown_pending_official_review");
  assert.equal(data.reserveDisclosureStatus, "unknown_pending_official_review");
  assert.equal(data.merkleTreeStatus, "unknown_pending_official_review");
  assert.equal(Object.hasOwn(data, "independentAuditor"), false);
  assert.ok(data.sourceLinks.includes("https://nexualpha.com/methodology"));
  assert.match(data.decisionUse, /does not certify reserve adequacy/);

  const serialized = JSON.stringify(data);
  assert.equal(serialized.includes("CRYPTOGRAPHICALLY_VERIFIED"), false);
  assert.equal(serialized.includes("NexuAlpha Verification Desk"), false);

  // Unknown slug
  const badReq = new Request("https://example.test/api/v1/agent/por-status?slug=non-existent-exchange");
  const badRes = await worker.fetch(badReq, { ASSETS: { fetch: async () => new Response("missing", { status: 404 }) } });
  assert.equal(badRes.status, 404);
});
