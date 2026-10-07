import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildOperationalReport, OPERATIONAL_CHECKS, summarizeOperationalCheck } from "../src/ops/operational-health.js";

const baseUrl = (process.env.HEALTH_BASE_URL || "http://127.0.0.1:4173/api/v1").replace(/\/$/, "");
const outputPath = path.resolve(process.env.OPERATIONAL_HEALTH_REPORT || "artifacts/operational-health/latest.json");
const expectedGrowthEvents = process.env.HEALTH_EXPECT_GROWTH_EVENTS === "1";

async function runCheck(check) {
  try {
    const response = await fetch(`${baseUrl}${check.path}`, { signal: AbortSignal.timeout(10000), headers: { accept: "application/json" } });
    let body = null;
    try { body = await response.json(); } catch { /* the summary records a safe null body */ }
    return summarizeOperationalCheck(check, response, body);
  } catch (error) {
    return summarizeOperationalCheck(check, null, null, error);
  }
}

const checks = await Promise.all(OPERATIONAL_CHECKS.map(runCheck));
const report = buildOperationalReport({ baseUrl, generatedAt: new Date().toISOString(), checks, expectedGrowthEvents });
await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ status: report.status, failures: report.failures, outputPath }, null, 2));
if (report.status === "NEEDS_ATTENTION") process.exitCode = 1;
