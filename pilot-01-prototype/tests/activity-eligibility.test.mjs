import assert from "node:assert/strict";
import test from "node:test";
import { normalizeActivityEligibility } from "../src/components/v3/activity/activity-eligibility.js";
import { OFFICIAL_EXCHANGE_ACTIVITIES } from "../src/data/generated-official-activities.js";

const now = Date.parse("2026-09-07T09:00:00Z");

const completeUpdate = {
  id: "binance-reviewed-campaign",
  platform: { slug: "binance", name: "Binance" },
  officialSource: { type: "announcement", url: "https://www.binance.com/en/support/announcement/test" },
  discoveredAt: "2026-09-07T08:00:00Z",
  verifiedAt: "2026-09-07T08:30:00Z",
  expiresAt: "2026-09-08T09:00:00Z",
  eligibility: {
    regions: ["Public source says eligible regions vary by account"],
    accountTypes: ["Verified main account"],
    userSegment: ["New users"],
    taskSteps: ["Open assigned task", "Complete KYC", "Complete required trade"],
    rewardTypes: ["Voucher"],
  },
  activityCta: { verified: true, url: "https://www.binance.com/en/support/announcement/test" },
};

test("empty official activity feed stays compatible with eligibility projection", () => {
  assert.deepEqual(OFFICIAL_EXCHANGE_ACTIVITIES, []);
  assert.equal(normalizeActivityEligibility(null, { now }).cta.enabled, false);
});

test("activity CTA opens only when source, eligibility fields, deadline and verified action are present", () => {
  const result = normalizeActivityEligibility(completeUpdate, { locale: "en", now, researchHref: "/activities/research/binance" });

  assert.equal(result.status, "ready");
  assert.equal(result.cta.enabled, true);
  assert.equal(result.cta.href, completeUpdate.activityCta.url);
  assert.deepEqual(result.missingKeys, []);
  assert.equal(result.source.host, "www.binance.com");
  assert.equal(result.rows.find((row) => row.key === "regions").value, "Public source says eligible regions vary by account");
  assert.equal(result.rows.find((row) => row.key === "taskSteps").value, "Open assigned task · Complete KYC · Complete required trade");
});

test("missing critical eligibility fields fail closed and keep the same-platform research alternative", () => {
  const result = normalizeActivityEligibility({
    ...completeUpdate,
    eligibility: { regions: ["EEA"] },
    activityCta: { verified: true, url: completeUpdate.activityCta.url },
  }, { locale: "zh-Hans", now, researchHref: "/activities/research/binance?locale=zh-Hans" });

  assert.equal(result.status, "blocked");
  assert.equal(result.cta.enabled, false);
  assert.equal(result.cta.href, null);
  assert.equal(result.cta.alternativeHref, "/activities/research/binance?locale=zh-Hans");
  assert.ok(result.missingKeys.includes("accountTypes"));
  assert.ok(result.missingKeys.includes("userSegment"));
  assert.ok(result.missingKeys.includes("taskSteps"));
  assert.ok(result.missingKeys.includes("rewardTypes"));
  assert.equal(result.rows.find((row) => row.key === "accountTypes").value, "已审核来源未说明");
});

test("expired activity remains fail-closed even when all eligibility fields exist", () => {
  const result = normalizeActivityEligibility({
    ...completeUpdate,
    expiresAt: "2026-09-07T09:00:00Z",
  }, { locale: "en", now, researchHref: "/activities/research/binance" });

  assert.equal(result.expired, true);
  assert.equal(result.status, "expired");
  assert.equal(result.cta.enabled, false);
  assert.equal(result.missingKeys.length, 0);
});

test("unverified or unsafe activity actions never become participation CTA", () => {
  for (const activityCta of [
    { verified: false, url: completeUpdate.activityCta.url },
    { verified: true, url: "http://www.binance.com/en/support/announcement/test" },
    { verified: true, url: "javascript:alert(1)" },
    null,
  ]) {
    const result = normalizeActivityEligibility({ ...completeUpdate, activityCta }, { now, researchHref: "/activities/research/binance" });
    assert.equal(result.status, "blocked");
    assert.equal(result.cta.enabled, false);
  }
});
