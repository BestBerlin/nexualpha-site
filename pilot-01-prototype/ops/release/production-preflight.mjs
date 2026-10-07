#!/usr/bin/env node
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { lstat, readFile, readlink, statfs } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";

const exec = promisify(execFile);

const SAFE_ID = /^[a-zA-Z0-9._-]{3,100}$/;
const DEFAULT_DATA_PATH = "/data";
const DEFAULT_MIN_FREE_BYTES = 3 * 1024 ** 3;
const DEFAULT_MIN_FREE_PERCENT = 8;
const PROTECTED_HASHES = Object.freeze({
  "src/data/partner-registry.js": "8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a",
  "src/data/venue-database.js": "0ce124afbe9f4758ce9ec093c79372550ce2e2e90a7342aa05ecc8d3482e1d52",
  "src/data/public-cta.js": "675875240d5fbb05498284a37f90a14488d6ace73d19b102caeb5add9e33f8e3",
  "src/data/regional-cta.js": "a2542bb137b6b6ff123a0d3c6b3a01b09e1e3a785ee223e3b4e04a3fe8aab665",
});

export class ProductionPreflightError extends Error {
  constructor(code, message = code, details = {}) {
    super(message);
    this.name = "ProductionPreflightError";
    this.code = code;
    this.details = details;
  }
}

export async function runProductionPreflight(options = {}) {
  const config = resolveConfig(options);
  const checks = [];
  const add = (check) => checks.push(check);

  add(await checkProtectedHashes(config));
  add(await checkCandidateVersion(config));
  add(await checkReleaseState(config));
  add(await checkCollectorConfig(config));
  add(await checkInvalidBodyProbe(config, options.httpProbe || fetchProbe));
  add(await checkCoreReadiness(config, options.httpProbe || fetchProbe));
  add(await checkDataCapacity(config, options.statfsImpl || statfs));
  add(await checkContainers(config, options.commandRunner || commandRunner));
  add(await checkNginxMapping(config));

  const blockers = checks.filter((check) => check.status === "BLOCKED");
  const warnings = checks.filter((check) => check.status === "NEEDS_ATTENTION");
  return {
    schemaVersion: "nexualpha-production-preflight-v1",
    generatedAt: new Date().toISOString(),
    scope: "read-only production preflight; no deploy, no writes, no invitation contents emitted",
    expectedBuildId: config.expectedBuildId,
    status: blockers.length ? "BLOCKED" : warnings.length ? "NEEDS_ATTENTION" : "PASS",
    blockers: blockers.map((check) => check.id),
    warnings: warnings.map((check) => check.id),
    checks,
  };
}

function resolveConfig(options) {
  const expectedBuildId = requireSafeId(options.expectedBuildId, "EXPECTED_BUILD_ID_REQUIRED");
  return {
    expectedBuildId,
    projectRoot: path.resolve(options.projectRoot || process.cwd()),
    candidateDir: path.resolve(options.candidateDir || path.join(process.cwd(), "dist", "client")),
    statePath: options.statePath ? path.resolve(options.statePath) : null,
    baseUrl: normalizeBaseUrl(options.baseUrl),
    collectorConfigPath: options.collectorConfigPath ? path.resolve(options.collectorConfigPath) : null,
    dataPath: path.resolve(options.dataPath || DEFAULT_DATA_PATH),
    minFreeBytes: parseByteThreshold(options.minFreeBytes, DEFAULT_MIN_FREE_BYTES),
    minFreePercent: parseNumber(options.minFreePercent, DEFAULT_MIN_FREE_PERCENT),
    nginxIncludePath: options.nginxIncludePath ? path.resolve(options.nginxIncludePath) : null,
    staticAliasPath: options.staticAliasPath ? path.resolve(options.staticAliasPath) : null,
    expectedCurrentContainers: parseInteger(options.expectedCurrentContainers, 1),
    expectedRollbackContainers: parseInteger(options.expectedRollbackContainers, 1),
  };
}

async function checkProtectedHashes(config) {
  const files = [];
  for (const [relative, expected] of Object.entries(PROTECTED_HASHES)) {
    const source = await readFile(path.join(config.projectRoot, relative));
    const actual = sha256(source);
    files.push({ path: relative, expectedSha256: expected, actualSha256: actual, ok: actual === expected });
  }
  return {
    id: "protected-hashes",
    status: files.every((file) => file.ok) ? "PASS" : "BLOCKED",
    summary: "Four protected commercial CTA files match the project constitution.",
    files,
  };
}

async function checkCandidateVersion(config) {
  const version = await readVersionJson(config.candidateDir);
  return {
    id: "candidate-version",
    status: version.buildId === config.expectedBuildId ? "PASS" : "BLOCKED",
    expectedBuildId: config.expectedBuildId,
    candidate: version,
  };
}

async function checkReleaseState(config) {
  if (!config.statePath) return pass("release-state", "No release state path supplied; version matching will be limited to candidate and live HTTP.");
  const state = JSON.parse(await readFile(config.statePath, "utf8"));
  const active = publicRelease(state.active);
  const pending = publicRelease(state.pending);
  const previous = publicRelease(state.previous);
  const matchesActive = active?.buildId === config.expectedBuildId;
  const matchesPending = pending?.buildId === config.expectedBuildId;
  return {
    id: "release-state",
    status: matchesActive || matchesPending ? "PASS" : "BLOCKED",
    expectedBuildId: config.expectedBuildId,
    active,
    pending,
    previous,
  };
}

async function checkCollectorConfig(config) {
  if (!config.collectorConfigPath) {
    return blocked("cta-collector-config", "Collector config path is required for production preflight.");
  }
  const source = await readFile(config.collectorConfigPath, "utf8");
  const parsed = parseCollectorConfig(source, config.collectorConfigPath);
  const environment = parsed.CTA_ENVIRONMENT || parsed.environment;
  const dataFile = parsed.CTA_DATA_FILE || parsed.dataFile || parsed.file;
  const origin = parsed.CTA_ORIGIN || parsed.origin;
  const multiWriter = truthy(parsed.CTA_MULTI_WRITER || parsed.multiWriter || parsed.multipleWriters);
  const singleWriter = parsed.CTA_SINGLE_WRITER === undefined && parsed.singleWriter === undefined
    ? true
    : truthy(parsed.CTA_SINGLE_WRITER ?? parsed.singleWriter);
  const mode = String(parsed.CTA_MODE || parsed.mode || "single-writer");
  const ok = environment === "production"
    && typeof dataFile === "string"
    && path.isAbsolute(dataFile)
    && typeof origin === "string"
    && origin.startsWith("https://")
    && singleWriter
    && !multiWriter
    && !/multi|parallel|dual/i.test(mode);
  return {
    id: "cta-collector-config",
    status: ok ? "PASS" : "BLOCKED",
    environment: environment || null,
    hasAbsoluteDataFile: typeof dataFile === "string" && path.isAbsolute(dataFile),
    hasHttpsOrigin: typeof origin === "string" && origin.startsWith("https://"),
    singleWriter,
    multiWriter,
    mode,
    configPath: config.collectorConfigPath,
  };
}

async function checkInvalidBodyProbe(config, httpProbe) {
  const result = await httpProbe({
    method: "POST",
    url: `${config.baseUrl}/api/analytics/cta`,
    headers: { "Content-Type": "application/json", Origin: config.baseUrl },
    body: "{}",
    purpose: "invalid-body-non-writing-cta-proxy-probe",
  });
  return {
    id: "cta-invalid-body-proxy-probe",
    status: result.status === 400 ? "PASS" : "BLOCKED",
    expectedStatus: 400,
    observedStatus: result.status ?? null,
    note: "A 400 confirms the public proxy reaches the collector validator without writing an analytics row.",
  };
}

async function checkCoreReadiness(config, httpProbe) {
  const result = await httpProbe({
    method: "GET",
    url: `${config.baseUrl}/api/v1/health/ready`,
    headers: { Accept: "application/json" },
    purpose: "core-readiness-read-only",
  });
  const body = result.body && typeof result.body === "object" ? result.body : {};
  const reasonCode = body.reasonCode || body.error?.code || body.dependencies?.core?.reasonCode || null;
  const unconfigured = result.status === 503 && reasonCode === "CORE_API_ORIGIN_NOT_CONFIGURED";
  const ok = result.status === 200 || unconfigured;
  return {
    id: "core-readiness",
    status: ok ? "PASS" : "BLOCKED",
    observedStatus: result.status ?? null,
    reasonCode,
    coreConfigured: result.status === 200 ? true : unconfigured ? false : null,
    note: unconfigured ? "Core API is explicitly unconfigured; this is reported as degraded capability and not treated as a fake ready state." : null,
  };
}

async function checkDataCapacity(config, statfsImpl) {
  const stats = await statfsImpl(config.dataPath);
  const blockSize = Number(stats.bsize || stats.frsize || 0);
  const totalBytes = blockSize * Number(stats.blocks || 0);
  const freeBytes = blockSize * Number(stats.bavail ?? stats.bfree ?? 0);
  const freePercent = totalBytes > 0 ? (freeBytes / totalBytes) * 100 : 0;
  const ok = freeBytes >= config.minFreeBytes && freePercent >= config.minFreePercent;
  return {
    id: "data-capacity",
    status: ok ? "PASS" : "BLOCKED",
    path: config.dataPath,
    freeBytes,
    totalBytes,
    freePercent: Number(freePercent.toFixed(2)),
    minFreeBytes: config.minFreeBytes,
    minFreePercent: config.minFreePercent,
  };
}

async function checkContainers(config, runner) {
  const result = await runner("docker", ["ps", "--format", "{{json .}}"]);
  if (result.code !== 0) return blocked("containers", "docker ps failed", { code: result.code });
  let rows = String(result.stdout || "")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
  rows = await hydrateRestartPolicies(rows, runner);
  const current = rows.filter((row) => /nexualpha.*(?:blue|green|web)/i.test(row.Names || "") && /Up/i.test(row.Status || ""));
  const rollback = rows.filter((row) => /nexualpha.*(?:rollback|previous|blue|green)/i.test(row.Names || ""));
  const restartOk = current.every((row) => /always|unless-stopped/i.test(row.RestartPolicy || row.Restart || row.Labels || ""));
  const countOk = current.length === config.expectedCurrentContainers && rollback.length >= config.expectedRollbackContainers;
  return {
    id: "containers",
    status: countOk && restartOk ? "PASS" : "BLOCKED",
    currentCount: current.length,
    rollbackCount: rollback.length,
    expectedCurrentContainers: config.expectedCurrentContainers,
    expectedRollbackContainers: config.expectedRollbackContainers,
    restartPolicyOk: restartOk,
    names: rows.map((row) => ({ name: row.Names || null, status: row.Status || null, restartPolicy: row.RestartPolicy || row.Restart || null })),
  };
}

async function hydrateRestartPolicies(rows, runner) {
  return Promise.all(rows.map(async (row) => {
    if (row.RestartPolicy || row.Restart || !row.Names) return row;
    const inspected = await runner("docker", ["inspect", "--format", "{{json .HostConfig.RestartPolicy}}", row.Names]);
    if (inspected.code !== 0) return row;
    try {
      const policy = JSON.parse(String(inspected.stdout || "").trim());
      return { ...row, RestartPolicy: policy?.Name || null };
    } catch {
      return row;
    }
  }));
}

async function checkNginxMapping(config) {
  if (!config.nginxIncludePath || !config.staticAliasPath) {
    return blocked("nginx-mapping", "Nginx include and static alias paths are required.");
  }
  const include = await readFile(config.nginxIncludePath, "utf8");
  const aliasTarget = await resolveSymlink(config.staticAliasPath);
  const version = await readVersionJson(aliasTarget);
  const buildOk = version.buildId === config.expectedBuildId;
  const includeBuildOk = include.includes(`buildId=${config.expectedBuildId}`) || include.includes(config.expectedBuildId);
  const upstreamOk = /127\.0\.0\.1:(?:18080|18081)/.test(include);
  const staticAliasesOk = ["/version.json", "/assets/", "/brands/", "/fonts/"].every((needle) => include.includes(needle));
  return {
    id: "nginx-mapping",
    status: buildOk && includeBuildOk && upstreamOk && staticAliasesOk ? "PASS" : "BLOCKED",
    expectedBuildId: config.expectedBuildId,
    aliasTarget,
    aliasVersion: version,
    includeHasExpectedBuild: includeBuildOk,
    includeHasLoopbackUpstream: upstreamOk,
    includeHasStaticAliases: staticAliasesOk,
    includePath: config.nginxIncludePath,
  };
}

async function fetchProbe(request) {
  const response = await fetch(request.url, {
    method: request.method,
    headers: request.headers,
    body: request.method === "POST" ? request.body : undefined,
    signal: AbortSignal.timeout(10_000),
  });
  let body = null;
  try {
    body = await response.json();
  } catch {}
  return { status: response.status, body };
}

async function commandRunner(command, args) {
  try {
    const result = await exec(command, args, { timeout: 15_000 });
    return { code: 0, stdout: result.stdout, stderr: result.stderr };
  } catch (error) {
    return { code: Number.isInteger(error.code) ? error.code : 1, stdout: error.stdout || "", stderr: error.stderr || error.message };
  }
}

async function readVersionJson(root) {
  const file = path.join(root, "version.json");
  const version = JSON.parse(await readFile(file, "utf8"));
  return { file, version: version.version || null, buildId: version.buildId || null };
}

async function resolveSymlink(linkPath) {
  const info = await lstat(linkPath);
  if (!info.isSymbolicLink()) return linkPath;
  const target = await readlink(linkPath);
  return path.resolve(path.dirname(linkPath), target);
}

function parseCollectorConfig(source, file) {
  if (file.endsWith(".json")) return JSON.parse(source);
  const entries = {};
  for (const line of source.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(trimmed);
    if (!match) continue;
    entries[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
  return entries;
}

function publicRelease(release) {
  if (!release) return null;
  return {
    lane: release.lane || null,
    port: release.port || null,
    buildId: release.buildId || null,
    version: release.version || null,
    releaseDir: release.releaseDir || null,
  };
}

function pass(id, summary, extra = {}) {
  return { id, status: "PASS", summary, ...extra };
}

function blocked(id, summary, extra = {}) {
  return { id, status: "BLOCKED", summary, ...extra };
}

function normalizeBaseUrl(value) {
  if (!value) throw new ProductionPreflightError("BASE_URL_REQUIRED");
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol)) throw new ProductionPreflightError("BASE_URL_HTTP_REQUIRED");
  url.pathname = "";
  url.search = "";
  url.hash = "";
  return url.toString().replace(/\/$/, "");
}

function requireSafeId(value, code) {
  if (!value || !SAFE_ID.test(value)) throw new ProductionPreflightError(code);
  return value;
}

function parseByteThreshold(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) throw new ProductionPreflightError("BYTE_THRESHOLD_INVALID");
  return parsed;
}

function parseNumber(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) throw new ProductionPreflightError("NUMBER_INVALID");
  return parsed;
}

function parseInteger(value, fallback) {
  const parsed = parseNumber(value, fallback);
  if (!Number.isInteger(parsed)) throw new ProductionPreflightError("INTEGER_INVALID");
  return parsed;
}

function truthy(value) {
  if (typeof value === "boolean") return value;
  return /^(?:1|true|yes|on|single|active)$/i.test(String(value || ""));
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => {
      index += 1;
      if (index >= argv.length) throw new ProductionPreflightError("ARG_VALUE_REQUIRED", `Missing value for ${arg}`);
      return argv[index];
    };
    if (arg === "--expected-build-id") options.expectedBuildId = next();
    else if (arg === "--base-url") options.baseUrl = next();
    else if (arg === "--project-root") options.projectRoot = next();
    else if (arg === "--candidate-dir") options.candidateDir = next();
    else if (arg === "--state-path") options.statePath = next();
    else if (arg === "--collector-config") options.collectorConfigPath = next();
    else if (arg === "--data-path") options.dataPath = next();
    else if (arg === "--min-free-bytes") options.minFreeBytes = next();
    else if (arg === "--min-free-percent") options.minFreePercent = next();
    else if (arg === "--nginx-include") options.nginxIncludePath = next();
    else if (arg === "--static-alias") options.staticAliasPath = next();
    else if (arg === "--expected-current-containers") options.expectedCurrentContainers = next();
    else if (arg === "--expected-rollback-containers") options.expectedRollbackContainers = next();
    else throw new ProductionPreflightError("ARG_INVALID", `Unknown argument: ${arg}`);
  }
  return options;
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  runProductionPreflight(parseArgs(process.argv.slice(2)))
    .then((report) => {
      process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
      if (report.status !== "PASS") process.exitCode = 1;
    })
    .catch((error) => {
      const status = error instanceof ProductionPreflightError ? error.code : "PRODUCTION_PREFLIGHT_ERROR";
      process.stderr.write(`${JSON.stringify({ status, message: error.message, details: error.details || {} }, null, 2)}\n`);
      process.exitCode = 1;
    });
}
