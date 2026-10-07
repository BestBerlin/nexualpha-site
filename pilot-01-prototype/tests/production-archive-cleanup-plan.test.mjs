import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { planArchiveCleanup } from "../scripts/production-archive-cleanup-plan.mjs";

const exec = promisify(execFile);
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const script = path.join(projectRoot, "scripts", "production-archive-cleanup-plan.mjs");

async function fixture() {
  const dir = await mkdtemp(path.join(os.tmpdir(), "nexu-archive-plan-"));
  const releases = path.join(dir, "releases");
  const backups = path.join(dir, "backups");
  const commercial = path.join(dir, "commercial", "src", "data");
  await mkdir(releases, { recursive: true });
  await mkdir(backups, { recursive: true });
  await mkdir(commercial, { recursive: true });

  const active = await release(releases, "3.0-active");
  const previous = await release(releases, "3.0-previous");
  const pending = await release(releases, "3.0-pending");
  const stale = await release(releases, "3.0-stale");
  const stateFile = path.join(dir, "state.json");
  await writeFile(stateFile, `${JSON.stringify({
    active: { buildId: "3.0-active", releaseDir: active },
    previous: { buildId: "3.0-previous", releaseDir: previous },
    pending: { buildId: "3.0-pending", releaseDir: pending },
  })}\n`);

  await file(backups, "nexualpha-pre-release-20260928T010000.tar.gz", "newest backup");
  await file(backups, "nexualpha-pre-release-20260927T010000.tar.gz", "second backup");
  await file(backups, "nexualpha-pre-release-20260926T010000.tar.gz", "old backup");
  await file(commercial, "partner-registry.js", "PRIVATE_INVITE_CODE_NEVER_EMIT");
  await file(commercial, "regional-cta.js", "PRIVATE_REGIONAL_INVITE_NEVER_EMIT");

  return {
    dir,
    roots: [releases, backups, path.join(dir, "commercial")],
    stateFile,
    active,
    previous,
    pending,
    stale,
    close: () => rm(dir, { recursive: true, force: true }),
  };
}

async function release(root, buildId) {
  const dir = path.join(root, buildId);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "version.json"), `${JSON.stringify({ version: "3.0.0", buildId })}\n`);
  await writeFile(path.join(dir, "index.html"), `<html data-build="${buildId}"></html>\n`);
  return dir;
}

async function file(root, name, body) {
  const target = path.join(root, name);
  await writeFile(target, `${body}\n`);
  return target;
}

test("dry-run keeps active, previous, pending and the two newest backups while marking stale unreferenced releases as candidates", async () => {
  const f = await fixture();
  try {
    const plan = await planArchiveCleanup({ roots: f.roots, stateFile: f.stateFile, now: new Date("2026-09-28T12:00:00Z") });
    assert.equal(plan.mode, "dry-run");
    assert.equal(plan.status, "READY_FOR_REVIEW");
    assert.equal(plan.requirements.applySupported, false);

    const byPath = new Map(plan.entries.map((entry) => [entry.path, entry]));
    assert.equal(byPath.get(f.active).disposition, "keep");
    assert.ok(byPath.get(f.active).referencedBy.includes("state:active.releaseDir"));
    assert.equal(byPath.get(f.previous).disposition, "keep");
    assert.ok(byPath.get(f.previous).referencedBy.includes("state:previous.releaseDir"));
    assert.equal(byPath.get(f.pending).disposition, "keep");
    assert.ok(byPath.get(f.pending).referencedBy.includes("state:pending.releaseDir"));
    assert.equal(byPath.get(f.stale).disposition, "candidate");

    const backups = plan.entries.filter((entry) => entry.kind === "backup");
    assert.equal(backups.filter((entry) => entry.disposition === "keep").length, 2);
    assert.equal(backups.filter((entry) => entry.disposition === "candidate").length, 1);
    assert.ok(plan.totals.bytesCandidate > 0);
  } finally {
    await f.close();
  }
});

test("dry-run protects commercial paths without exposing invite contents", async () => {
  const f = await fixture();
  try {
    const plan = await planArchiveCleanup({ roots: f.roots, stateFile: f.stateFile });
    const serialized = JSON.stringify(plan);
    const commercialEntry = plan.entries.find((entry) => entry.path.endsWith("partner-registry.js"));
    const regionalEntry = plan.entries.find((entry) => entry.path.endsWith("regional-cta.js"));

    assert.equal(commercialEntry.disposition, "blocked");
    assert.ok(commercialEntry.protection.includes("commercial-protected-path"));
    assert.equal(regionalEntry.disposition, "blocked");
    assert.ok(regionalEntry.protection.includes("commercial-protected-path"));
    assert.doesNotMatch(serialized, /PRIVATE_INVITE_CODE_NEVER_EMIT/);
    assert.doesNotMatch(serialized, /PRIVATE_REGIONAL_INVITE_NEVER_EMIT/);
    assert.match(commercialEntry.sha256, /^[a-f0-9]{64}$/);
    assert.match(regionalEntry.sha256, /^[a-f0-9]{64}$/);
  } finally {
    await f.close();
  }
});

test("directory candidates include deterministic sha256 manifest hashes", async () => {
  const f = await fixture();
  try {
    const plan = await planArchiveCleanup({ roots: [path.dirname(f.stale)], stateFile: f.stateFile });
    const stale = plan.entries.find((entry) => entry.path === f.stale);
    const expected = createHash("sha256")
      .update([
        `index.html\0${createHash("sha256").update(`<html data-build="3.0-stale"></html>\n`).digest("hex")}\0${Buffer.byteLength(`<html data-build="3.0-stale"></html>\n`)}`,
        `version.json\0${createHash("sha256").update(`${JSON.stringify({ version: "3.0.0", buildId: "3.0-stale" })}\n`).digest("hex")}\0${Buffer.byteLength(`${JSON.stringify({ version: "3.0.0", buildId: "3.0-stale" })}\n`)}`,
      ].join("\n"))
      .digest("hex");

    assert.equal(stale.sha256, expected);
    assert.equal(stale.manifest.files.length, 2);
  } finally {
    await f.close();
  }
});

test("CLI defaults to dry-run and rejects apply fail-closed", async () => {
  const f = await fixture();
  try {
    const { stdout } = await exec(process.execPath, [
      script,
      "--root", f.roots[0],
      "--state-file", f.stateFile,
    ]);
    const plan = JSON.parse(stdout);
    assert.equal(plan.mode, "dry-run");
    assert.equal(plan.status, "READY_FOR_REVIEW");

    await assert.rejects(
      exec(process.execPath, [script, "--apply", "--root", f.roots[0], "--state-file", f.stateFile]),
      (error) => {
        assert.match(error.stderr, /APPLY_NOT_IMPLEMENTED/);
        return true;
      },
    );
    await stat(f.stale);
  } finally {
    await f.close();
  }
});
