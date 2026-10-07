import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import test from "node:test";

const REQUIRED_FIELDS = ["fee", "funding", "collateral", "margin", "oracle", "liquidation"];
const EXPECTED_PARTNER_REGISTRY_SHA =
  "8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a";

const artifactUrl = new URL("../public/research/wave48-perp-dex-cost-citations.json", import.meta.url);
const csvUrl = new URL("../public/research/wave48-perp-dex-cost-citations.csv", import.meta.url);

test("Wave48 Perp DEX cost citation asset covers four official-source venues", async () => {
  const artifact = JSON.parse(await readFile(artifactUrl, "utf8"));

  assert.equal(artifact.assetId, "wave48-perp-dex-cost-citations");
  assert.equal(artifact.protectedPartnerRegistrySha256, EXPECTED_PARTNER_REGISTRY_SHA);
  assert.match(artifact.boundary, /not a live quote/i);
  assert.match(artifact.boundary, /not a referral/i);

  assert.equal(artifact.venues.length, 4);
  assert.deepEqual(
    artifact.venues.map((venue) => venue.id).sort(),
    ["aevo", "dydx", "gmx", "hyperliquid"],
  );

  for (const venue of artifact.venues) {
    assert.equal(venue.type, "PERP_DEX");
    assert.match(venue.checkedAt, /^2026-09-15T/);
    assert.ok(Array.isArray(venue.limits));
    assert.ok(venue.limits.length >= 2);
    assert.deepEqual(Object.keys(venue.fields).sort(), REQUIRED_FIELDS.toSorted());

    for (const fieldId of REQUIRED_FIELDS) {
      const field = venue.fields[fieldId];
      assert.ok(["known", "unknown"].includes(field.status), `${venue.id}.${fieldId} has invalid status`);
      assert.ok(field.value.length > 20, `${venue.id}.${fieldId} needs a substantive value`);
      assert.match(field.sourceUrl, /^https:\/\//, `${venue.id}.${fieldId} needs a source URL`);
      assert.match(field.checkedAt, /^2026-09-15T/);
      assert.ok(field.limits.length > 20, `${venue.id}.${fieldId} needs limits`);
    }
  }
});

test("Wave48 CSV mirrors the venue-field matrix", async () => {
  const csv = await readFile(csvUrl, "utf8");
  const lines = csv.trim().split("\n");

  assert.equal(lines[0], "venue_id,venue_name,field,status,value,source_url,checked_at,limits");
  assert.equal(lines.length, 1 + 4 * REQUIRED_FIELDS.length);

  for (const venueId of ["hyperliquid", "dydx", "gmx", "aevo"]) {
    for (const fieldId of REQUIRED_FIELDS) {
      assert.ok(
        lines.some((line) => line.startsWith(`${venueId},`) && line.includes(`,${fieldId},known,`)),
        `missing ${venueId}.${fieldId}`,
      );
    }
  }
});

test("Wave48 work preserves the protected partner registry SHA", async () => {
  const partnerRegistry = await readFile(new URL("../src/data/partner-registry.js", import.meta.url));
  const actual = createHash("sha256").update(partnerRegistry).digest("hex");
  assert.equal(actual, EXPECTED_PARTNER_REGISTRY_SHA);
});
