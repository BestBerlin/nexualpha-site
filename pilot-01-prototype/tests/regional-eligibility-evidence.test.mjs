import test from "node:test";
import assert from "node:assert/strict";
import { regionalEligibilityState, isCurrentRegionalEligibilityEvidence } from "../src/data/regional-eligibility-evidence.js";
import { venueMarketStatus } from "../src/data/directory-context.js";

test("real venue records fail closed without a dated product-specific eligibility record", () => {
  assert.deepEqual(regionalEligibilityState({ slug: "binance", market: "HK", product: "spot" }), { status: "unverified", evidence: null });
  assert.equal(venueMarketStatus({ slug: "binance" }, "HK"), "unverified");
});

test("eligibility evidence requires sources, timestamps, and a future expiry", () => {
  const base = {
    status: "eligible",
    sourceUrls: ["https://official.example/eligibility"],
    checkedAt: "2026-09-09T00:00:00Z",
    expiresAt: "2026-10-09T00:00:00Z",
  };
  assert.equal(isCurrentRegionalEligibilityEvidence(base, { now: new Date("2026-09-10T00:00:00Z") }), true);
  assert.equal(isCurrentRegionalEligibilityEvidence({ ...base, sourceUrls: [] }, { now: new Date("2026-09-10T00:00:00Z") }), false);
  assert.equal(isCurrentRegionalEligibilityEvidence({ ...base, expiresAt: "2026-09-09T00:00:00Z" }, { now: new Date("2026-09-10T00:00:00Z") }), false);
  assert.equal(isCurrentRegionalEligibilityEvidence({ ...base, status: "source-linked" }, { now: new Date("2026-09-10T00:00:00Z") }), false);
});

test("caller-provided research rows retain discovery classification without becoming production eligibility", () => {
  assert.equal(venueMarketStatus({ slug: "research-row", supportedRegions: ["LATAM"], restrictedRegions: [] }, "MX"), "matched");
});
