import test from "node:test";
import assert from "node:assert/strict";
import { internationalSourceRegistry } from "../src/data/international-source-registry.js";

test("international source registry has refreshable official HTTPS records", () => {
  const records = Object.entries(internationalSourceRegistry).flatMap(([market, pack]) => pack.sources.map((source) => ({ market, source })));
  assert.ok(records.length >= 6);
  for (const { market, source } of records) {
    assert.match(market, /^(MX|TW|ID|HK|EU|UK|US|JP|KR|SG|TR|OTHER)$/);
    assert.match(source.url, /^https:\/\//);
    assert.ok(source.reviewedAt);
    assert.ok(source.role);
    assert.ok(source.note);
  }
});
