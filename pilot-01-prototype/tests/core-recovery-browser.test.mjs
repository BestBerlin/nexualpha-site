import assert from "node:assert/strict";
import test from "node:test";
import { parseArgs, run } from "../scripts/verify-core-recovery.mjs";

test("core recovery browser verifier dry-run documents test-only API stub boundaries", async () => {
  const result = await run(parseArgs(["--dry-run", "--mode", "contract"]));

  assert.equal(result.status, "DRY_RUN");
  assert.equal(result.plan.mode, "contract");
  assert.match(result.plan.policy, /TEST-ONLY API stub/);
  assert.match(result.plan.policy, /no real backend or third-party requests/);
});

test("core recovery browser verifier defaults evidence to parent v3 repair artifacts", () => {
  const options = parseArgs([]);

  assert.match(options.artifactRoot, /artifacts\/v3-repair$/);
  assert.match(options.distDir, /pilot-01-prototype\/dist\/client$/);
});
