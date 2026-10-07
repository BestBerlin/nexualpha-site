import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const REQUIRED_FIELDS = ["fee", "funding", "collateral", "margin", "oracle", "liquidation"];
const EXPECTED_PARTNER_REGISTRY_SHA =
  "8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a";

const officialHosts = new Set([
  "hyperliquid.gitbook.io",
  "docs.dydx.xyz",
  "docs.gmx.io",
  "www.aevo.xyz",
]);

const jsonUrl = new URL("../public/research/wave48-perp-dex-cost-citations.json", import.meta.url);
const csvUrl = new URL("../public/research/wave48-perp-dex-cost-citations.csv", import.meta.url);
const partnerRegistryUrl = new URL("../src/data/partner-registry.js", import.meta.url);

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (inQuotes && char === '"' && next === '"') {
      field += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (!inQuotes && char === ",") {
      row.push(field);
      field = "";
      continue;
    }

    if (!inQuotes && (char === "\n" || char === "\r")) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }

    field += char;
  }

  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

test("Wave50 Perp DEX citation CSV is field-for-field parity with JSON", async () => {
  const [jsonText, csvText] = await Promise.all([readFile(jsonUrl, "utf8"), readFile(csvUrl, "utf8")]);
  const asset = JSON.parse(jsonText);
  const [headers, ...rows] = parseCsv(csvText.trim());

  assert.deepEqual(headers, [
    "venue_id",
    "venue_name",
    "field",
    "status",
    "value",
    "source_url",
    "checked_at",
    "limits",
  ]);
  assert.equal(rows.length, asset.venues.length * REQUIRED_FIELDS.length);

  const csvByKey = new Map(rows.map((row) => [`${row[0]}.${row[2]}`, row]));

  for (const venue of asset.venues) {
    assert.deepEqual(Object.keys(venue.fields).sort(), REQUIRED_FIELDS.toSorted());

    for (const fieldId of REQUIRED_FIELDS) {
      const field = venue.fields[fieldId];
      const row = csvByKey.get(`${venue.id}.${fieldId}`);

      assert.ok(row, `missing CSV row for ${venue.id}.${fieldId}`);
      assert.deepEqual(row, [
        venue.id,
        venue.name,
        fieldId,
        field.status,
        field.value,
        field.sourceUrl,
        field.checkedAt,
        field.limits,
      ]);
    }
  }
});

test("Wave50 Perp DEX source URLs stay official and public wording remains non-commercial", async () => {
  const assetText = await readFile(jsonUrl, "utf8");
  const csvText = await readFile(csvUrl, "utf8");
  const asset = JSON.parse(assetText);

  assert.equal(asset.protectedPartnerRegistrySha256, EXPECTED_PARTNER_REGISTRY_SHA);
  assert.doesNotMatch(`${assetText}\n${csvText}`, /private commission|invite code|referral link|guaranteed discount|guaranteed registration|guaranteed profit|signup bonus/i);
  assert.doesNotMatch(`${assetText}\n${csvText}`, /AGP-3-related reductions are pending/i);

  for (const venue of asset.venues) {
    for (const [fieldId, field] of Object.entries(venue.fields)) {
      const url = new URL(field.sourceUrl);
      assert.equal(url.protocol, "https:", `${venue.id}.${fieldId} source must be HTTPS`);
      assert.ok(officialHosts.has(url.hostname), `${venue.id}.${fieldId} source host is not in the official allowlist`);
      assert.ok(field.limits.length > 20, `${venue.id}.${fieldId} needs a substantive limitation`);
    }
  }
});

test("Wave50 Perp DEX review preserves protected partner registry SHA", async () => {
  const partnerRegistry = await readFile(partnerRegistryUrl);
  const actual = createHash("sha256").update(partnerRegistry).digest("hex");
  assert.equal(actual, EXPECTED_PARTNER_REGISTRY_SHA);
});
