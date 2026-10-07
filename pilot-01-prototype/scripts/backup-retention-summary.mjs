#!/usr/bin/env node

import { readFile } from "node:fs/promises";

const auditPath = process.argv[2] || "artifacts/ops/backup-retention-audit.json";
const policyPath = process.argv[3] || "config/backup-retention-policy.json";
const audit = JSON.parse(await readFile(auditPath, "utf8"));
const policy = JSON.parse(await readFile(policyPath, "utf8"));
const now = Date.now() / 1000;
const rollbackCutoff = now - Number(policy.rollbackWindowDays) * 86400;
const protectedPattern = new RegExp(policy.protectedPatterns.map((value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replaceAll("\\*", ".*")).join("|"));

const entries = (audit.newest || []).map((entry) => {
  const name = entry.path.split("/").pop();
  const protectedByName = protectedPattern.test(name);
  const inRollbackWindow = entry.mtime >= rollbackCutoff;
  return { path: entry.path, size: entry.size, protectedByName, inRollbackWindow, disposition: protectedByName || inRollbackWindow ? "keep" : "review" };
});

const summary = {
  status: policy.mode === "audit-only" ? "READY_FOR_REVIEW" : "POLICY_REJECTED",
  mode: policy.mode,
  totalAudited: audit.total,
  sampled: entries.length,
  keep: entries.filter((entry) => entry.disposition === "keep").length,
  review: entries.filter((entry) => entry.disposition === "review").length,
  destructiveActions: "disabled",
  entries,
};
console.log(JSON.stringify(summary, null, 2));
if (summary.status !== "READY_FOR_REVIEW") process.exitCode = 1;
