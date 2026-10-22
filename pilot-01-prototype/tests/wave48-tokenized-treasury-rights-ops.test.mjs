import { committedFileHash } from './r100-test-contracts.mjs';
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const artifactUrl = new URL("../public/research/wave48-tokenized-treasury-rights-ops.json", import.meta.url);
const protectedPartnerRegistryUrl = new URL("../src/data/partner-registry.js", import.meta.url);
const protectedPartnerRegistrySha = committedFileHash("src/data/partner-registry.js");

async function loadArtifact() {
  return JSON.parse(await readFile(artifactUrl, "utf8"));
}

test("Wave48 tokenized Treasury asset preserves required rights and operations fields", async () => {
  const artifact = await loadArtifact();
  const requiredFields = [
    "legalClaimOrIssuerSpv",
    "recordkeeper",
    "custody",
    "redemption",
    "eligibilityJurisdiction",
    "yieldBasis",
    "checkedAt",
    "sourceUrl",
    "unknownsLimits",
  ];

  assert.equal(artifact.id, "wave48-tokenized-treasury-rights-ops");
  assert.equal(artifact.boundary.notInvestmentAdvice, true);
  assert.equal(artifact.boundary.noSignupOrReferralRoute, true);
  assert.deepEqual(artifact.requiredFields, requiredFields);
  assert.ok(artifact.products.length >= 3);

  const productTypes = new Set(artifact.products.map((product) => product.productType));
  assert.ok(productTypes.size >= 3, "expected at least three distinct tokenized Treasury product types");

  for (const product of artifact.products) {
    for (const field of requiredFields) {
      assert.ok(product[field], `${product.id} missing ${field}`);
    }
    assert.match(product.sourceUrl, /^https:\/\//, `${product.id} sourceUrl must be https`);
    assert.equal(product.checkedAt, artifact.boundary.checkedAt, `${product.id} checkedAt should match boundary`);
    assert.ok(Array.isArray(product.unknownsLimits), `${product.id} unknownsLimits must be an array`);
    assert.ok(product.unknownsLimits.length >= 2, `${product.id} should preserve unresolved limits`);
    assert.ok(product.sourceEvidence.length >= 2, `${product.id} should carry source evidence notes`);
  }
});

test("Wave48 asset stays on official or primary source domains", async () => {
  const artifact = await loadArtifact();
  const allowedHosts = new Set([
    "superstate.com",
    "ondo.finance",
    "www.blackrock.com",
    "www.franklintempleton.com",
    "www.sec.gov",
    "securitize.io",
  ]);

  for (const product of artifact.products) {
    assert.ok(allowedHosts.has(new URL(product.sourceUrl).hostname), `${product.id} has non-primary source ${product.sourceUrl}`);
    if (product.secondaryOfficialUrl) {
      assert.ok(allowedHosts.has(new URL(product.secondaryOfficialUrl).hostname), `${product.id} has non-primary secondary source`);
    }
  }

  for (const source of artifact.sourceRegister) {
    assert.ok(allowedHosts.has(new URL(source.url).hostname), `${source.id} has non-primary source register URL`);
    assert.match(source.sourceType, /(official|sec)/i, `${source.id} should be official or SEC source`);
  }
});

test("Wave48 asset keeps BUIDL operations fail-closed where primary evidence was incomplete", async () => {
  const artifact = await loadArtifact();
  const buidl = artifact.products.find((product) => product.id === "blackrock-buidl");
  assert.ok(buidl, "missing BUIDL record");
  assert.match(buidl.recordkeeper, /unknown/i);
  assert.match(buidl.custody, /unknown/i);
  assert.match(buidl.redemption, /unknown/i);
  assert.match(buidl.yieldBasis, /unknown/i);
  assert.ok(buidl.unknownsLimits.some((limit) => /offering memorandum|offering documents/i.test(limit)));
});

test("Wave48 asset did not mutate protected partner registry", async () => {
  const source = await readFile(protectedPartnerRegistryUrl);
  const digest = createHash("sha256").update(source).digest("hex");
  assert.equal(digest, protectedPartnerRegistrySha);
});
