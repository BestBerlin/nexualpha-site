import assert from "node:assert/strict";
import test from "node:test";
import { visibleOfficialUpdates } from "../src/components/official-updates/official-updates-model.js";

const now = Date.parse("2026-09-04T12:00:00.000Z");
const approved = { id: "approved", kind: "PRODUCT_UPDATE", platform: { slug: "okx", name: "OKX" }, title: "Safe approved fixture", officialSource: { type: "OFFICIAL_PRODUCT_NOTICE", url: "https://www.okx.com/help/example" }, discoveredAt: "2026-09-04T09:00:00.000Z", reviewStatus: "APPROVED", verifiedAt: "2026-09-04T10:00:00.000Z", expiresAt: "2026-09-05T00:00:00.000Z", fixture: false };

test("only current public-approved official updates can reach the detail surface", () => {
  assert.deepEqual(visibleOfficialUpdates([approved, { ...approved, id: "pending", reviewStatus: "PENDING" }, { ...approved, id: "revoked", reviewStatus: "REVOKED" }, { ...approved, id: "fixture", fixture: true }, { ...approved, id: "expired", expiresAt: "2026-09-04T11:00:00.000Z" }, { ...approved, id: "bad-url", officialSource: { ...approved.officialSource, url: "not-a-url" } }, { ...approved, id: "no-discovered", discoveredAt: "invalid" }, { ...approved, id: "no-verified", verifiedAt: "invalid" }], now), [approved]);
});

test("already-filtered public official update view-models remain visible", () => {
  const { reviewStatus, fixture, ...publicViewModel } = approved;
  assert.deepEqual(visibleOfficialUpdates([publicViewModel, { ...publicViewModel, id: "expired-public", expiresAt: "2026-09-04T11:00:00.000Z" }, { ...publicViewModel, id: "http-public", officialSource: { ...publicViewModel.officialSource, url: "http://www.okx.com/help/example" } }, { ...publicViewModel, id: "bad-url-public", officialSource: { ...publicViewModel.officialSource, url: "javascript:alert(1)" } }], now), [publicViewModel]);
});

test("malformed official update inputs fail closed without throwing", () => {
  assert.deepEqual(visibleOfficialUpdates(null, now), []);
  assert.deepEqual(visibleOfficialUpdates("not-an-array", now), []);
  assert.deepEqual(visibleOfficialUpdates([null, undefined, "bad", 7, { id: "missing-fields" }], now), []);
});
