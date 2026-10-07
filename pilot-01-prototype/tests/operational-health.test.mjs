import assert from "node:assert/strict";
import test from "node:test";
import { buildOperationalReport, summarizeOperationalCheck } from "../src/ops/operational-health.js";

test("operational health summary keeps readiness dependency evidence bounded", () => {
  const check = summarizeOperationalCheck(
    { id: "ready", path: "/health/ready", requiredStatus: 200 },
    { status: 503 },
    {
      status: "not-ready",
      dependencies: {
        growthEvents: { ready: false, adapter: "postgresql-prisma", source: "prisma", missing: ["GrowthEvent.occurredAt", 1, "extra"] },
      },
      error: { code: "DEPENDENCY_NOT_READY", message: "secret must not be retained" },
    },
  );
  assert.equal(check.ok, false);
  assert.deepEqual(check.body.dependencies.growthEvents, {
    ready: false,
    adapter: "postgresql-prisma",
    source: "prisma",
    missing: ["GrowthEvent.occurredAt", "extra"],
  });
  assert.equal("message" in check.body, false);
});

test("operational health preserves an expected Core API fallback reason", () => {
  const check = summarizeOperationalCheck(
    { id: "dependencies", path: "/health/dependencies", requiredStatus: 200 },
    { status: 200 },
    {
      status: "degraded",
      dependencies: {
        web: { ready: true, status: "ready" },
        cta: { ready: false, configured: false, status: "unavailable", reasonCode: "CTA_COLLECTOR_NOT_CONFIGURED" },
        core: { ready: false, configured: false, status: "unavailable", reasonCode: "CORE_API_ORIGIN_NOT_CONFIGURED" },
      },
    },
  );
  assert.equal(check.ok, true);
  assert.equal(check.expectedFallback, true);
  assert.equal(check.body.dependencies.core.reasonCode, "CORE_API_ORIGIN_NOT_CONFIGURED");
  const report = buildOperationalReport({ baseUrl: "http://candidate", generatedAt: "2026-09-09T00:00:00.000Z", checks: [check] });
  assert.equal(report.status, "PASS");
  assert.equal(report.recovery, null);
  assert.deepEqual(report.degradedOptionalDependencies, ["core", "cta"]);
});

test("operational report requires collector readiness only when explicitly requested", () => {
  const checks = [{ id: "ready", path: "/health/ready", ok: true, body: { status: "ready", dependencies: { growthEvents: { ready: false } } } }];
  assert.equal(buildOperationalReport({ baseUrl: "http://candidate", generatedAt: "2026-09-09T00:00:00.000Z", checks }).status, "PASS");
  const report = buildOperationalReport({ baseUrl: "http://candidate", generatedAt: "2026-09-09T00:00:00.000Z", checks, expectedGrowthEvents: true });
  assert.equal(report.status, "NEEDS_ATTENTION");
  assert.deepEqual(report.failures, ["growthEvents"]);
});
