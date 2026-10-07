import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PERP_COST_FIELD_DICTIONARY, PERP_COST_FIELD_SOURCES } from "../src/data/perp-cost-field-dictionary.js";

test("Perp DEX cost dictionary keeps eight distinct comparison fields", () => {
  assert.equal(PERP_COST_FIELD_DICTIONARY.length, 8);
  assert.equal(new Set(PERP_COST_FIELD_DICTIONARY.map((field) => field.id)).size, 8);
  for (const field of PERP_COST_FIELD_DICTIONARY) {
    assert.ok(field.definitionEn.length > 50);
    assert.ok(field.comparisonRuleEn.length > 30);
  }
});

test("Perp DEX cost dictionary uses official protocol documentation", () => {
  assert.ok(PERP_COST_FIELD_SOURCES.length >= 8);
  for (const source of PERP_COST_FIELD_SOURCES) {
    const hostname = new URL(source.url).hostname;
    assert.ok(hostname === "hyperliquid.gitbook.io" || hostname === "docs.dydx.community");
  }
});

test("downloadable JSON mirrors the visible field IDs", async () => {
  const artifact = JSON.parse(await readFile(new URL("../public/research/perp-dex-cost-field-dictionary.json", import.meta.url), "utf8"));
  assert.deepEqual(artifact.fields.map((field) => field.id), PERP_COST_FIELD_DICTIONARY.map((field) => field.id));
  assert.equal(artifact.canonical, "https://nexualpha.com/topics/derivatives#perp-cost-field-dictionary");
});

test("derivatives topic exposes downloadable citation assets", async () => {
  const page = await readFile(new URL("../src/components/v3/TopicGuidePage.jsx", import.meta.url), "utf8");
  assert.match(page, /id="perp-cost-field-dictionary"/);
  assert.match(page, /\/research\/perp-dex-cost-field-dictionary\.csv/);
  assert.match(page, /\/research\/perp-dex-cost-field-dictionary\.json/);
});
