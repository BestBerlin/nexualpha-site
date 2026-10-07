import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const artifactUrl = new URL("../public/research/wave48-tokenized-treasury-rights-ops.json", import.meta.url);
const partnerRegistryUrl = new URL("../src/data/partner-registry.js", import.meta.url);
const protectedPartnerRegistrySha = "8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a";

async function loadArtifact() {
  return JSON.parse(await readFile(artifactUrl, "utf8"));
}

test("Wave50 Treasury review keeps USDY issuer wording source-bounded", async () => {
  const artifact = await loadArtifact();
  const usdy = artifact.products.find((product) => product.id === "ondo-usdy");

  assert.ok(usdy, "missing USDY record");
  assert.match(usdy.legalClaimOrIssuerSpv, /Ondo Global Markets \(BVI\) Limited/);
  assert.match(usdy.legalClaimOrIssuerSpv, /reconciled against the current offering documents/i);
  assert.ok(
    usdy.unknownsLimits.some((limit) => /Issuer domicile presentation should be reconciled/i.test(limit)),
    "USDY should preserve issuer domicile wording as an unresolved source boundary",
  );
});

test("Wave50 Treasury review registers current Franklin and BlackRock official sources", async () => {
  const artifact = await loadArtifact();
  const sourceIds = new Set(artifact.sourceRegister.map((source) => source.id));
  const benji = artifact.products.find((product) => product.id === "franklin-benji-fobxx");
  const buidl = artifact.products.find((product) => product.id === "blackrock-buidl");

  assert.ok(sourceIds.has("franklin-benji-product"));
  assert.ok(sourceIds.has("blackrock-buidl-token-addresses"));
  assert.equal(
    benji.secondaryOfficialUrl,
    "https://www.franklintempleton.com/investments/options/money-market-funds/products/29386/SINGLCLASS/franklin-on-chain-u-s-government-money-fund/FOBXX",
  );
  assert.equal(
    buidl.officialTokenAddressUrl,
    "https://www.blackrock.com/corporate/compliance/scams-and-fraud/blackrock-token-addresses",
  );
});

test("Wave50 Treasury review keeps BUIDL operational claims fail-closed", async () => {
  const artifact = await loadArtifact();
  const buidl = artifact.products.find((product) => product.id === "blackrock-buidl");

  assert.ok(buidl, "missing BUIDL record");
  assert.match(buidl.recordkeeper, /unknown/i);
  assert.match(buidl.custody, /unknown/i);
  assert.match(buidl.redemption, /unknown/i);
  assert.match(buidl.yieldBasis, /unknown/i);
  assert.ok(
    buidl.unknownsLimits.some((limit) => /secondary summaries/i.test(limit)),
    "BUIDL should not fill offering-document gaps from secondary summaries",
  );
});

test("Wave50 Treasury review did not mutate protected partner registry", async () => {
  const source = await readFile(partnerRegistryUrl);
  const digest = createHash("sha256").update(source).digest("hex");
  assert.equal(digest, protectedPartnerRegistrySha);
});
