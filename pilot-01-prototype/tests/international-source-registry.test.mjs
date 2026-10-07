import assert from "node:assert/strict";
import test from "node:test";
import { INTERNATIONAL_SOURCE_REVIEWED_AT, internationalSourcesFor } from "../src/data/international-source-registry.js";

test("international research previews expose official, reviewed source records", () => {
  assert.match(INTERNATIONAL_SOURCE_REVIEWED_AT, /^2026-09-15$/);
  for (const market of ["MX", "TW", "ID", "HK", "EU", "UK", "JP", "KR", "SG", "TR", "US"]) {
    const record = internationalSourcesFor(market);
    assert.ok(record.authority);
    assert.ok(record.sources.length >= 2, market);
    for (const item of record.sources) {
      assert.match(item.url, /^https:\/\//);
      assert.equal(item.status, "source-linked");
      assert.equal(item.reviewedAt, INTERNATIONAL_SOURCE_REVIEWED_AT);
      assert.ok(item.note);
    }
  }
});

test("international source registry fails closed for an unselected market", () => {
  const record = internationalSourcesFor("unknown");
  assert.equal(record.authority, "Market-specific authority not selected");
  assert.deepEqual(record.sources, []);
});
