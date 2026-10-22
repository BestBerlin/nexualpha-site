import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("backup retention stays audit-only and preserves rollback safeguards", async (t) => {
  let policy;
  try { policy = JSON.parse(await readFile(new URL("../config/backup-retention-policy.json", import.meta.url), "utf8")); }
  catch (error) {
    if (error.code === "ENOENT") { t.skip("Deployment backup retention policy config/backup-retention-policy.json is unavailable in this checkout"); return; }
    throw error;
  }
  assert.equal(policy.mode, "audit-only");
  assert.ok(Number(policy.ordinaryKeepCount) >= 14);
  assert.ok(Number(policy.rollbackWindowDays) >= 30);
  assert.equal(policy.currentReleaseKeep, true);
  assert.equal(policy.milestoneKeep, true);
  assert.equal(policy.destructiveActionsRequireExplicitReview, true);
  assert.ok(Array.isArray(policy.protectedPatterns));
  assert.ok(policy.protectedPatterns.includes("nexualpha-pre-candidate-*.tar.gz"));
});
