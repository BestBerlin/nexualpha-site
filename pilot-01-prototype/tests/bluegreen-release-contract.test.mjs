import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  writeFile,
} from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  cutoverRelease,
  preflightRelease,
  rollbackRelease,
  stageRelease,
  statusRelease,
} from "../ops/release/bluegreen-release.mjs";

const exec = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const script = path.join(root, "ops/release/bluegreen-release.mjs");
const secret = "PRIVATE_INVITE_CODE_NEVER_EMIT";

async function fixture() {
  const dir = await mkdtemp(path.join(os.tmpdir(), "nexu-bluegreen-"));
  const stateDir = path.join(dir, "state");
  const commercialRoot = path.join(dir, "commercial");
  const candidateA = path.join(dir, "candidate-a");
  const candidateB = path.join(dir, "candidate-b");
  await mkdir(path.join(commercialRoot, "src/data"), { recursive: true });
  await writeFile(path.join(commercialRoot, "src/data/partner-registry.js"), `export const registry = ${JSON.stringify(secret)};\n`);
  await writeFile(path.join(commercialRoot, "src/data/public-cta.js"), "export const publicCta = true;\n");
  await writeFile(path.join(commercialRoot, "src/data/regional-cta.js"), "export const regionalCta = true;\n");
  await writeFile(path.join(commercialRoot, "src/data/venue-database.js"), "export const venues = [];\n");
  await writeCandidate(candidateA, { version: "3.0.0", buildId: "3.0-test-blue" });
  await writeCandidate(candidateB, { version: "3.0.0", buildId: "3.0-test-green" });
  return {
    dir,
    stateDir,
    commercialRoot,
    candidateA,
    candidateB,
    close: () => rm(dir, { recursive: true, force: true }),
  };
}

async function writeCandidate(dir, version) {
  await mkdir(path.join(dir, "assets"), { recursive: true });
  await mkdir(path.join(dir, "brands"), { recursive: true });
  await mkdir(path.join(dir, "fonts"), { recursive: true });
  await writeFile(path.join(dir, "version.json"), `${JSON.stringify(version)}\n`);
  await writeFile(path.join(dir, "index.html"), `<html data-build="${version.buildId}"></html>\n`);
  await writeFile(path.join(dir, "assets/app.js"), `document.documentElement.dataset.build=${JSON.stringify(version.buildId)};\n`);
  await writeFile(path.join(dir, "brands/logo.txt"), "brand\n");
  await writeFile(path.join(dir, "fonts/font.txt"), "font\n");
}

function aggregateCommercialHash(rootDir) {
  const files = ["src/data/partner-registry.js", "src/data/public-cta.js", "src/data/regional-cta.js", "src/data/venue-database.js"];
  return Promise.all(files.map(async (file) => {
    const source = await readFile(path.join(rootDir, file));
    return {
      path: file,
      sha256: createHash("sha256").update(source).digest("hex"),
      bytes: source.byteLength,
    };
  })).then((entries) => createHash("sha256").update(entries.map((entry) => `${entry.path}\0${entry.sha256}\0${entry.bytes}`).join("\n")).digest("hex"));
}

test("stage, preflight, cutover, status and rollback switch proxy plus static alias without leaking commercial content", async () => {
  const f = await fixture();
  try {
    const expectedCommercialSha256 = await aggregateCommercialHash(f.commercialRoot);
    const stagedA = await stageRelease({
      stateDir: f.stateDir,
      candidateDir: f.candidateA,
      buildId: "3.0-test-blue",
      version: "3.0.0",
      commercialRoot: f.commercialRoot,
      expectedCommercialSha256,
    });
    assert.equal(stagedA.status, "STAGED");
    assert.equal(stagedA.pending.lane, "blue");
    assert.equal(stagedA.pending.port, 18080);
    assert.equal(stagedA.commercial.sha256, expectedCommercialSha256);
    assert.doesNotMatch(JSON.stringify(stagedA), new RegExp(secret));

    const preflightA = await preflightRelease({ stateDir: f.stateDir, commercialRoot: f.commercialRoot });
    assert.equal(preflightA.status, "PREFLIGHT_PASS");
    assert.ok(preflightA.checks.includes("cta-collector-single-writer"));
    assert.ok(preflightA.checks.includes("commercial-hash"));

    const cutoverA = await cutoverRelease({ stateDir: f.stateDir, buildId: "3.0-test-blue", commercialRoot: f.commercialRoot });
    assert.equal(cutoverA.status, "CUTOVER_COMPLETE");
    assert.equal(cutoverA.active.lane, "blue");
    assert.equal(cutoverA.ctaCollector.singleWriter, true);
    assert.equal(cutoverA.ctaCollector.publicWriterBuildId, "3.0-test-blue");
    assert.equal(await realpath(cutoverA.staticAliasPath), await realpath(cutoverA.active.releaseDir));
    const blueInclude = await readFile(cutoverA.proxyIncludePath, "utf8");
    assert.match(blueInclude, /127\.0\.0\.1:18080/);
    assert.match(blueInclude, /location = \/version\.json/);
    assert.match(blueInclude, /location \/assets\//);
    assert.match(blueInclude, /location \/brands\//);
    assert.match(blueInclude, /location \/fonts\//);
    assert.match(blueInclude, /location \/ \{/);
    assert.match(blueInclude, /proxy_pass \$nexualpha_upstream;/);

    await stageRelease({
      stateDir: f.stateDir,
      candidateDir: f.candidateB,
      buildId: "3.0-test-green",
      version: "3.0.0",
      commercialRoot: f.commercialRoot,
      expectedCommercialSha256,
    });
    const cutoverB = await cutoverRelease({ stateDir: f.stateDir, buildId: "3.0-test-green", commercialRoot: f.commercialRoot });
    assert.equal(cutoverB.status, "CUTOVER_COMPLETE");
    assert.equal(cutoverB.active.lane, "green");
    assert.equal(cutoverB.previous.buildId, "3.0-test-blue");
    assert.equal(await realpath(cutoverB.staticAliasPath), await realpath(cutoverB.active.releaseDir));
    assert.match(await readFile(cutoverB.proxyIncludePath, "utf8"), /127\.0\.0\.1:18081/);

    const statusB = await statusRelease({ stateDir: f.stateDir });
    assert.equal(statusB.active.buildId, "3.0-test-green");
    assert.equal(statusB.ctaCollector.publicWriterBuildId, "3.0-test-green");
    assert.doesNotMatch(JSON.stringify(statusB), new RegExp(secret));

    const rollback = await rollbackRelease({ stateDir: f.stateDir, buildId: "3.0-test-blue" });
    assert.equal(rollback.status, "ROLLBACK_COMPLETE");
    assert.equal(rollback.active.buildId, "3.0-test-blue");
    assert.equal(rollback.ctaCollector.publicWriterBuildId, "3.0-test-blue");
    assert.match(await readFile(rollback.proxyIncludePath, "utf8"), /127\.0\.0\.1:18080/);
  } finally {
    await f.close();
  }
});

test("execution adapter validates probes, runs nginx test before replacement, then reloads", async () => {
  const f = await fixture();
  const events = [];
  try {
    await stageRelease({ stateDir: f.stateDir, candidateDir: f.candidateA, buildId: "3.0-test-blue", version: "3.0.0", commercialRoot: f.commercialRoot });
    const httpProbe = fakeProbe(events);
    const commandRunner = async (command, context) => {
      events.push(`command:${context.step}:${command.join(" ")}`);
      return { code: 0 };
    };
    const result = await cutoverRelease({ stateDir: f.stateDir, buildId: "3.0-test-blue", commercialRoot: f.commercialRoot, httpProbe, commandRunner });
    assert.equal(result.status, "CUTOVER_COMPLETE");
    assert.deepEqual(events, [
      "probe:/version.json",
      "probe:/health/live",
      "probe:/api/v1/health/ready",
      "probe:/",
      "command:nginx-test:nginx -t",
      "command:nginx-reload:nginx -s reload",
    ]);
    assert.match(await readFile(result.proxyIncludePath, "utf8"), /127\.0\.0\.1:18080/);
  } finally {
    await f.close();
  }
});

test("nginx test failure keeps the previous include and alias untouched", async () => {
  const f = await fixture();
  try {
    await stageRelease({ stateDir: f.stateDir, candidateDir: f.candidateA, buildId: "3.0-test-blue", version: "3.0.0", commercialRoot: f.commercialRoot });
    const first = await cutoverRelease({ stateDir: f.stateDir, buildId: "3.0-test-blue", commercialRoot: f.commercialRoot });
    const originalInclude = await readFile(first.proxyIncludePath, "utf8");
    const originalAlias = await realpath(first.staticAliasPath);

    await stageRelease({ stateDir: f.stateDir, candidateDir: f.candidateB, buildId: "3.0-test-green", version: "3.0.0", commercialRoot: f.commercialRoot });
    await assert.rejects(
      cutoverRelease({
        stateDir: f.stateDir,
        buildId: "3.0-test-green",
        commercialRoot: f.commercialRoot,
        httpProbe: fakeProbe([]),
        commandRunner: async (_command, context) => (context.step === "nginx-test" ? { code: 1 } : { code: 0 }),
      }),
      { code: "COMMAND_FAILED" },
    );
    assert.equal(await readFile(first.proxyIncludePath, "utf8"), originalInclude);
    assert.equal(await realpath(first.staticAliasPath), originalAlias);
    const status = await statusRelease({ stateDir: f.stateDir });
    assert.equal(status.active.buildId, "3.0-test-blue");
    assert.equal(status.pending.buildId, "3.0-test-green");
  } finally {
    await f.close();
  }
});

test("probe failure keeps the previous include and alias untouched before nginx test", async () => {
  const f = await fixture();
  const events = [];
  try {
    await stageRelease({ stateDir: f.stateDir, candidateDir: f.candidateA, buildId: "3.0-test-blue", version: "3.0.0", commercialRoot: f.commercialRoot });
    const first = await cutoverRelease({ stateDir: f.stateDir, buildId: "3.0-test-blue", commercialRoot: f.commercialRoot });
    const originalInclude = await readFile(first.proxyIncludePath, "utf8");
    const originalAlias = await realpath(first.staticAliasPath);

    await stageRelease({ stateDir: f.stateDir, candidateDir: f.candidateB, buildId: "3.0-test-green", version: "3.0.0", commercialRoot: f.commercialRoot });
    await assert.rejects(
      cutoverRelease({
        stateDir: f.stateDir,
        buildId: "3.0-test-green",
        commercialRoot: f.commercialRoot,
        httpProbe: async ({ path: probePath, release }) => {
          events.push(`probe:${probePath}`);
          if (probePath === "/version.json") return { status: 200, body: { version: release.version, buildId: "wrong-build" } };
          return { status: 200, body: { status: "ok", dependencies: {} } };
        },
        commandRunner: async (command, context) => {
          events.push(`command:${context.step}:${command.join(" ")}`);
          return { code: 0 };
        },
      }),
      { code: "PROBE_VERSION_BUILD_ID_MISMATCH" },
    );
    assert.deepEqual(events, ["probe:/version.json"]);
    assert.equal(await readFile(first.proxyIncludePath, "utf8"), originalInclude);
    assert.equal(await realpath(first.staticAliasPath), originalAlias);
    const status = await statusRelease({ stateDir: f.stateDir });
    assert.equal(status.active.buildId, "3.0-test-blue");
    assert.equal(status.pending.buildId, "3.0-test-green");
  } finally {
    await f.close();
  }
});

test("reload failure restores the previous include, alias and state", async () => {
  const f = await fixture();
  try {
    await stageRelease({ stateDir: f.stateDir, candidateDir: f.candidateA, buildId: "3.0-test-blue", version: "3.0.0", commercialRoot: f.commercialRoot });
    const first = await cutoverRelease({ stateDir: f.stateDir, buildId: "3.0-test-blue", commercialRoot: f.commercialRoot });
    const originalInclude = await readFile(first.proxyIncludePath, "utf8");
    const originalAlias = await realpath(first.staticAliasPath);

    await stageRelease({ stateDir: f.stateDir, candidateDir: f.candidateB, buildId: "3.0-test-green", version: "3.0.0", commercialRoot: f.commercialRoot });
    await assert.rejects(
      cutoverRelease({
        stateDir: f.stateDir,
        buildId: "3.0-test-green",
        commercialRoot: f.commercialRoot,
        httpProbe: fakeProbe([]),
        commandRunner: async (_command, context) => (context.step === "nginx-reload" ? { code: 1 } : { code: 0 }),
      }),
      { code: "COMMAND_FAILED" },
    );
    assert.equal(await readFile(first.proxyIncludePath, "utf8"), originalInclude);
    assert.equal(await realpath(first.staticAliasPath), originalAlias);
    const status = await statusRelease({ stateDir: f.stateDir });
    assert.equal(status.active.buildId, "3.0-test-blue");
  } finally {
    await f.close();
  }
});

test("rollback uses the same nginx test, atomic replacement and reload order", async () => {
  const f = await fixture();
  const events = [];
  try {
    await stageRelease({ stateDir: f.stateDir, candidateDir: f.candidateA, buildId: "3.0-test-blue", version: "3.0.0", commercialRoot: f.commercialRoot });
    await cutoverRelease({ stateDir: f.stateDir, buildId: "3.0-test-blue", commercialRoot: f.commercialRoot });
    await stageRelease({ stateDir: f.stateDir, candidateDir: f.candidateB, buildId: "3.0-test-green", version: "3.0.0", commercialRoot: f.commercialRoot });
    await cutoverRelease({ stateDir: f.stateDir, buildId: "3.0-test-green", commercialRoot: f.commercialRoot });
    const result = await rollbackRelease({
      stateDir: f.stateDir,
      buildId: "3.0-test-blue",
      commandRunner: async (command, context) => {
        events.push(`command:${context.phase}:${context.step}:${command.join(" ")}`);
        return { code: 0 };
      },
    });
    assert.equal(result.status, "ROLLBACK_COMPLETE");
    assert.deepEqual(events, [
      "command:rollback:nginx-test:nginx -t",
      "command:rollback:nginx-reload:nginx -s reload",
    ]);
    assert.match(await readFile(result.proxyIncludePath, "utf8"), /127\.0\.0\.1:18080/);
  } finally {
    await f.close();
  }
});

test("buildId, version and commercial hash mismatches fail closed before cutover", async () => {
  const f = await fixture();
  try {
    await assert.rejects(
      stageRelease({
        stateDir: f.stateDir,
        candidateDir: f.candidateA,
        buildId: "3.0-wrong-build",
        version: "3.0.0",
        commercialRoot: f.commercialRoot,
      }),
      { code: "BUILD_ID_MISMATCH" },
    );

    await assert.rejects(
      stageRelease({
        stateDir: f.stateDir,
        candidateDir: f.candidateA,
        buildId: "3.0-test-blue",
        version: "3.0.1",
        commercialRoot: f.commercialRoot,
      }),
      { code: "VERSION_MISMATCH" },
    );

    await assert.rejects(
      stageRelease({
        stateDir: f.stateDir,
        candidateDir: f.candidateA,
        buildId: "3.0-test-blue",
        version: "3.0.0",
        commercialRoot: f.commercialRoot,
        expectedCommercialSha256: "0".repeat(64),
      }),
      { code: "COMMERCIAL_HASH_MISMATCH" },
    );
  } finally {
    await f.close();
  }
});

test("CLI returns sanitized JSON and nonzero contract errors", async () => {
  const f = await fixture();
  try {
    const result = await exec(process.execPath, [
      script,
      "stage",
      "--state-dir", f.stateDir,
      "--candidate-dir", f.candidateA,
      "--build-id", "3.0-test-blue",
      "--version", "3.0.0",
      "--commercial-root", f.commercialRoot,
    ], { cwd: root });
    const parsed = JSON.parse(result.stdout);
    assert.equal(parsed.status, "STAGED");
    assert.doesNotMatch(result.stdout + result.stderr, new RegExp(secret));

    await assert.rejects(
      exec(process.execPath, [
        script,
        "cutover",
        "--state-dir", f.stateDir,
        "--build-id", "3.0-other",
        "--commercial-root", f.commercialRoot,
      ], { cwd: root }),
      (error) => {
        assert.notEqual(error.code, 0);
        assert.match(error.stderr, /CUTOVER_BUILD_ID_MISMATCH/);
        assert.doesNotMatch(error.stderr, new RegExp(secret));
        return true;
      },
    );
  } finally {
    await f.close();
  }
});

function fakeProbe(events) {
  return async ({ path: probePath, release }) => {
    events.push(`probe:${probePath}`);
    if (probePath === "/version.json") return { status: 200, body: { version: release.version, buildId: release.buildId } };
    if (probePath === "/api/v1/health/ready") return { status: 200, body: { status: "ready", dependencies: { core: { ready: true } } } };
    return { status: 200, body: { status: "ok" } };
  };
}
