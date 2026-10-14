import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const protectedPartnerRegistrySha = "8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a";

const assetPaths = [
  "../public/research/wave48-perp-dex-cost-citations.json",
  "../public/research/wave48-tokenized-treasury-rights-ops.json",
];

async function loadAsset(path) {
  return JSON.parse(await readFile(new URL(path, import.meta.url), "utf8"));
}

test("Wave52 citation assets expose stable citation metadata without personal-author claims", async () => {
  for (const path of assetPaths) {
    const asset = await loadAsset(path);
    const assetText = JSON.stringify(asset);

    assert.match(asset.title, /Wave48/);
    assert.ok(asset.description.length > 80, `${path} needs a substantive description`);
    assert.equal(asset.publisher.name, "NexuAlpha");
    assert.equal(asset.publisher.url, "https://nexualpha.com/");
    assert.equal(asset.publisher.contactPoint, "mailto:contact@nexualpha.com");
    assert.equal(asset.author.name, "NexuAlpha Editorial Research");
    assert.equal(asset.author.type, "Organization");
    assert.equal(asset.author.url, "https://nexualpha.com/methodology");
    assert.equal(asset.contact, "mailto:contact@nexualpha.com");
    assert.equal(asset.correctionsContact, "mailto:contact@nexualpha.com");
    assert.equal(asset.license, "https://nexualpha.com/methodology#data-license");
    assert.match(asset.licenseScope, /original compilation/i);
    assert.match(asset.licenseScope, /Access does not grant redistribution rights/i);
    assert.match(asset.licenseScope, /Third-party source documents/i);
    assert.equal(asset.methodologyUrl, "https://nexualpha.com/methodology#data-license");
    assert.doesNotMatch(`${asset.license} ${asset.licenseScope}`, /creativecommons|CC BY|CC0/i);
    assert.match(asset.createdAt, /^2026-09-15/);
    assert.match(asset.updatedAt, /^2026-09-(?:15|16)/);
    assert.match(asset.preferredCitation, /^NexuAlpha Editorial Research\. \(2026\)\./);
    assert.match(asset.preferredCitation, /https:\/\/nexualpha\.com\/research\/wave48-/);
    assert.doesNotMatch(
      assetText,
      /private commission|commission rate|invite code|referral code|guaranteed registration|guaranteed eligibility/i,
    );
  }
});

test("Wave52 metadata work preserves the protected partner registry", async () => {
  const partnerRegistry = await readFile(new URL("../src/data/partner-registry.js", import.meta.url));
  assert.equal(createHash("sha256").update(partnerRegistry).digest("hex"), protectedPartnerRegistrySha);
});
