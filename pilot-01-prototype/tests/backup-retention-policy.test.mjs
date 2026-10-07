import test from "node:test";
import assert from "node:assert/strict";
import policy from "../config/backup-retention-policy.json" with { type: "json" };

test("backup retention stays audit-only and preserves rollback safeguards", () => {
  assert.equal(policy.mode, "audit-only");
  assert.ok(Number(policy.ordinaryKeepCount) >= 14);
  assert.ok(Number(policy.rollbackWindowDays) >= 30);
  assert.equal(policy.currentReleaseKeep, true);
  assert.equal(policy.milestoneKeep, true);
  assert.equal(policy.destructiveActionsRequireExplicitReview, true);
  assert.ok(Array.isArray(policy.protectedPatterns));
  assert.ok(policy.protectedPatterns.includes("nexualpha-pre-candidate-*.tar.gz"));
});
