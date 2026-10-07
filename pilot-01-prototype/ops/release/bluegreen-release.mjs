#!/usr/bin/env node
import { createHash } from "node:crypto";
import {
  cp,
  access,
  lstat,
  mkdir,
  readFile,
  readlink,
  rename,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const VERSION = 1;
const LANES = {
  blue: { port: 18080 },
  green: { port: 18081 },
};
const SAFE_ID = /^[a-zA-Z0-9._-]{3,80}$/;
const SEMVERISH = /^[0-9]+(?:\.[0-9]+){0,2}(?:[-+][a-zA-Z0-9._-]+)?$/;
const DEFAULT_COMMERCIAL_FILES = [
  "src/data/partner-registry.js",
  "src/data/public-cta.js",
  "src/data/regional-cta.js",
  "src/data/venue-database.js",
];
const STATIC_ALIAS_PATHS = ["/version.json", "/assets/", "/brands/", "/fonts/"];
const HEALTH_PROBES = [
  { id: "version", path: "/version.json", expect: "version" },
  { id: "live", path: "/health/live", expect: "live" },
  { id: "dependencies", path: "/api/v1/health/ready", expect: "dependencies" },
  { id: "web", path: "/", expect: "web" },
];

export class ReleaseContractError extends Error {
  constructor(code, message = code, details = {}) {
    super(message);
    this.name = "ReleaseContractError";
    this.code = code;
    this.details = details;
  }
}

export async function stageRelease(options = {}) {
  const config = resolveConfig(options);
  const candidateDir = requirePath(options.candidateDir, "CANDIDATE_DIR_REQUIRED");
  const buildId = requireSafeId(options.buildId, "BUILD_ID_INVALID");
  const version = requireVersion(options.version);
  const state = await readState(config);
  const candidateVersion = await readCandidateVersion(candidateDir);
  assert(candidateVersion.buildId === buildId, "BUILD_ID_MISMATCH", { expected: buildId, actual: candidateVersion.buildId });
  assert(candidateVersion.version === version, "VERSION_MISMATCH", { expected: version, actual: candidateVersion.version });

  const commercial = await verifyCommercialHashes(config, options);
  const lane = inactiveLane(state.active?.lane);
  const releaseDir = path.join(config.releasesDir, buildId);
  await ensureStateDirs(config);
  await rm(releaseDir, { recursive: true, force: true });
  await cp(candidateDir, releaseDir, { recursive: true, verbatimSymlinks: true });

  const pending = {
    lane,
    port: LANES[lane].port,
    buildId,
    version,
    releaseDir,
    stagedAt: new Date().toISOString(),
    ctaCollector: {
      mode: "standby-until-proxy-cutover",
      writer: "public-proxy-active-lane",
      singleWriter: true,
    },
    commercial,
  };
  const next = {
    ...state,
    schemaVersion: VERSION,
    pending,
    commercial,
    updatedAt: new Date().toISOString(),
  };
  await writeState(config, next);
  return publicResult("STAGED", {
    stateDir: config.stateDir,
    pending: publicRelease(pending),
    commercial: publicCommercial(commercial),
  });
}

export async function preflightRelease(options = {}) {
  const config = resolveConfig(options);
  const state = await readState(config);
  assert(state.pending, "NO_PENDING_RELEASE");
  const candidateVersion = await readCandidateVersion(state.pending.releaseDir);
  assert(candidateVersion.buildId === state.pending.buildId, "PENDING_BUILD_ID_MISMATCH");
  assert(candidateVersion.version === state.pending.version, "PENDING_VERSION_MISMATCH");
  assert(state.pending.ctaCollector?.singleWriter === true, "CTA_SINGLE_WRITER_REQUIRED");
  assert(state.pending.ctaCollector?.mode === "standby-until-proxy-cutover", "CTA_CANDIDATE_MUST_NOT_WRITE_BEFORE_CUTOVER");
  const commercial = await verifyCommercialHashes(config, {
    commercialRoot: options.commercialRoot,
    commercialManifest: options.commercialManifest,
    expectedCommercialSha256: options.expectedCommercialSha256,
  });
  assertCommercialUnchanged(state.pending.commercial, commercial);

  const probeResults = await runHealthProbes(config, state.pending, options.httpProbe || localHttpProbe);
  const include = renderActiveInclude(state.pending, config);
  assert(include.includes(`127.0.0.1:${state.pending.port}`), "PROXY_INCLUDE_PORT_MISMATCH");
  assertIncludeCoversStaticAliases(include);
  return publicResult("PREFLIGHT_PASS", {
    active: publicRelease(state.active),
    pending: publicRelease(state.pending),
    checks: [
      "version-json-buildId",
      "version-json-version",
      "candidate-live-probe",
      "candidate-web-probe",
      "candidate-dependencies-probe",
      "loopback-proxy-include",
      "static-alias-target-ready",
      "cta-collector-single-writer",
      "commercial-hash",
    ],
    probes: probeResults,
    include,
    commercial: publicCommercial(commercial),
  });
}

export async function cutoverRelease(options = {}) {
  const config = resolveConfig(options);
  const state = await readState(config);
  assert(state.pending, "NO_PENDING_RELEASE");
  const expectedBuildId = options.buildId ? requireSafeId(options.buildId, "BUILD_ID_INVALID") : state.pending.buildId;
  assert(expectedBuildId === state.pending.buildId, "CUTOVER_BUILD_ID_MISMATCH", { expected: expectedBuildId, pending: state.pending.buildId });
  const preflight = await preflightRelease({ ...options, stateDir: config.stateDir });

  const previous = state.active || null;
  await ensureStateDirs(config);
  const commandRunner = options.commandRunner || dryRunCommandRunner;
  const include = renderActiveInclude(state.pending, config);
  const pendingIncludePath = await writePendingInclude(config, include);
  await runCommand(commandRunner, config.nginxTestCommand, { phase: "cutover", step: "nginx-test", pendingIncludePath, activeIncludePath: config.proxyIncludePath });
  await replaceActiveInclude(config, pendingIncludePath);
  await swapSymlink(config.staticAliasPath, state.pending.releaseDir);
  try {
    await runCommand(commandRunner, config.nginxReloadCommand, { phase: "cutover", step: "nginx-reload", activeIncludePath: config.proxyIncludePath });
  } catch (error) {
    if (previous) {
      await writeAtomic(config.proxyIncludePath, renderActiveInclude(previous, config));
      await swapSymlink(config.staticAliasPath, previous.releaseDir);
    }
    throw error;
  }

  const active = {
    ...state.pending,
    cutoverAt: new Date().toISOString(),
    ctaCollector: {
      mode: "public-writer-through-proxy",
      writer: "public-proxy-active-lane",
      singleWriter: true,
    },
  };
  const next = {
    ...state,
    active,
    previous,
    pending: null,
    ctaCollector: {
      singleWriter: true,
      publicWriterBuildId: active.buildId,
      publicWriterLane: active.lane,
      analyticsPath: "private-configured-outside-release-state",
    },
    updatedAt: new Date().toISOString(),
  };
  await writeState(config, next);
  return publicResult("CUTOVER_COMPLETE", {
    active: publicRelease(active),
    previous: publicRelease(previous),
    proxyIncludePath: config.proxyIncludePath,
    staticAliasPath: config.staticAliasPath,
    probes: preflight.probes,
    ctaCollector: next.ctaCollector,
  });
}

export async function rollbackRelease(options = {}) {
  const config = resolveConfig(options);
  const state = await readState(config);
  assert(state.previous, "NO_ROLLBACK_TARGET");
  const expectedBuildId = options.buildId ? requireSafeId(options.buildId, "BUILD_ID_INVALID") : state.previous.buildId;
  assert(expectedBuildId === state.previous.buildId, "ROLLBACK_BUILD_ID_MISMATCH", { expected: expectedBuildId, previous: state.previous.buildId });
  const previousVersion = await readCandidateVersion(state.previous.releaseDir);
  assert(previousVersion.buildId === state.previous.buildId, "ROLLBACK_VERSION_JSON_BUILD_ID_MISMATCH");
  assert(previousVersion.version === state.previous.version, "ROLLBACK_VERSION_JSON_VERSION_MISMATCH");

  const commandRunner = options.commandRunner || dryRunCommandRunner;
  const include = renderActiveInclude(state.previous, config);
  const pendingIncludePath = await writePendingInclude(config, include);
  await runCommand(commandRunner, config.nginxTestCommand, { phase: "rollback", step: "nginx-test", pendingIncludePath, activeIncludePath: config.proxyIncludePath });
  await replaceActiveInclude(config, pendingIncludePath);
  await swapSymlink(config.staticAliasPath, state.previous.releaseDir);
  try {
    await runCommand(commandRunner, config.nginxReloadCommand, { phase: "rollback", step: "nginx-reload", activeIncludePath: config.proxyIncludePath });
  } catch (error) {
    if (state.active) {
      await writeAtomic(config.proxyIncludePath, renderActiveInclude(state.active, config));
      await swapSymlink(config.staticAliasPath, state.active.releaseDir);
    }
    throw error;
  }

  const rolledBack = {
    ...state.previous,
    rollbackAt: new Date().toISOString(),
    ctaCollector: {
      mode: "public-writer-through-proxy",
      writer: "public-proxy-active-lane",
      singleWriter: true,
    },
  };
  const next = {
    ...state,
    active: rolledBack,
    previous: state.active || null,
    pending: null,
    ctaCollector: {
      singleWriter: true,
      publicWriterBuildId: rolledBack.buildId,
      publicWriterLane: rolledBack.lane,
      analyticsPath: "private-configured-outside-release-state",
    },
    updatedAt: new Date().toISOString(),
  };
  await writeState(config, next);
  return publicResult("ROLLBACK_COMPLETE", {
    active: publicRelease(rolledBack),
    previous: publicRelease(next.previous),
    proxyIncludePath: config.proxyIncludePath,
    staticAliasPath: config.staticAliasPath,
    ctaCollector: next.ctaCollector,
  });
}

export async function statusRelease(options = {}) {
  const config = resolveConfig(options);
  const state = await readState(config);
  let aliasTarget = null;
  try {
    const stat = await lstat(config.staticAliasPath);
    aliasTarget = stat.isSymbolicLink() ? await readlink(config.staticAliasPath) : "not-a-symlink";
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  return publicResult("STATUS", {
    active: publicRelease(state.active),
    previous: publicRelease(state.previous),
    pending: publicRelease(state.pending),
    staticAliasPath: config.staticAliasPath,
    staticAliasTarget: aliasTarget,
    proxyIncludePath: config.proxyIncludePath,
    ctaCollector: state.ctaCollector || null,
    commercial: publicCommercial(state.commercial || null),
  });
}

export async function main(argv = process.argv.slice(2)) {
  const [command, ...rest] = argv;
  const options = parseArgs(rest);
  const commands = {
    stage: stageRelease,
    preflight: preflightRelease,
    cutover: cutoverRelease,
    rollback: rollbackRelease,
    status: statusRelease,
  };
  if (!commands[command]) {
    throw new ReleaseContractError("COMMAND_INVALID", "Expected one of: stage, preflight, cutover, rollback, status");
  }
  return commands[command](options);
}

function resolveConfig(options) {
  const stateDir = path.resolve(options.stateDir || path.join(process.cwd(), ".nexualpha-bluegreen"));
  return {
    stateDir,
    statePath: path.resolve(options.statePath || path.join(stateDir, "state.json")),
    releasesDir: path.resolve(options.releasesDir || path.join(stateDir, "releases")),
    proxyIncludePath: path.resolve(options.proxyIncludePath || path.join(stateDir, "proxy", "nexualpha-upstream.inc")),
    pendingIncludePath: path.resolve(options.pendingIncludePath || path.join(stateDir, "proxy", "nexualpha-upstream.inc.next")),
    staticAliasPath: path.resolve(options.staticAliasPath || path.join(stateDir, "alias", "public")),
    commercialManifest: options.commercialManifest ? path.resolve(options.commercialManifest) : null,
    commercialRoot: path.resolve(options.commercialRoot || process.cwd()),
    nginxTestCommand: parseCommandOption(options.nginxTestCommand, ["nginx", "-t"]),
    nginxReloadCommand: parseCommandOption(options.nginxReloadCommand, ["nginx", "-s", "reload"]),
  };
}

async function ensureStateDirs(config) {
  await mkdir(config.releasesDir, { recursive: true });
  await mkdir(path.dirname(config.proxyIncludePath), { recursive: true });
  await mkdir(path.dirname(config.pendingIncludePath), { recursive: true });
  await mkdir(path.dirname(config.staticAliasPath), { recursive: true });
  await mkdir(path.dirname(config.statePath), { recursive: true });
}

async function readState(config) {
  try {
    return JSON.parse(await readFile(config.statePath, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    return {
      schemaVersion: VERSION,
      active: null,
      previous: null,
      pending: null,
      ctaCollector: null,
      commercial: null,
    };
  }
}

async function writeState(config, state) {
  await ensureStateDirs(config);
  await writeAtomic(config.statePath, `${JSON.stringify(state, null, 2)}\n`);
}

async function readCandidateVersion(candidateDir) {
  const candidates = [
    path.join(candidateDir, "version.json"),
    path.join(candidateDir, "dist", "client", "version.json"),
    path.join(candidateDir, "client", "version.json"),
  ];
  for (const file of candidates) {
    try {
      const json = JSON.parse(await readFile(file, "utf8"));
      assert(typeof json.buildId === "string" && SAFE_ID.test(json.buildId), "VERSION_JSON_BUILD_ID_INVALID");
      assert(typeof json.version === "string" && SEMVERISH.test(json.version), "VERSION_JSON_VERSION_INVALID");
      return { buildId: json.buildId, version: json.version, file };
    } catch (error) {
      if (error.code === "ENOENT") continue;
      throw error;
    }
  }
  throw new ReleaseContractError("VERSION_JSON_NOT_FOUND");
}

async function verifyCommercialHashes(config, options = {}) {
  const manifestPath = options.commercialManifest ? path.resolve(options.commercialManifest) : config.commercialManifest;
  let files = DEFAULT_COMMERCIAL_FILES;
  let expected = options.expectedCommercialSha256 || null;
  if (manifestPath) {
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    files = manifest.files || files;
    expected = expected || manifest.sha256 || null;
  }
  const commercialRoot = path.resolve(options.commercialRoot || config.commercialRoot);
  const entries = [];
  for (const file of files) {
    const relative = normalizeRelative(file);
    const source = await readFile(path.join(commercialRoot, relative));
    entries.push({
      path: relative,
      sha256: sha256(source),
      bytes: source.byteLength,
    });
  }
  const aggregate = sha256(entries.map((entry) => `${entry.path}\0${entry.sha256}\0${entry.bytes}`).join("\n"));
  if (expected) assert(aggregate === expected, "COMMERCIAL_HASH_MISMATCH", { expected, actual: aggregate });
  return {
    algorithm: "sha256",
    sha256: aggregate,
    files: entries,
  };
}

function assertCommercialUnchanged(left, right) {
  assert(left?.sha256 === right?.sha256, "COMMERCIAL_HASH_CHANGED", { expected: left?.sha256, actual: right?.sha256 });
  const leftFiles = new Map((left.files || []).map((entry) => [entry.path, entry.sha256]));
  for (const entry of right.files || []) {
    assert(leftFiles.get(entry.path) === entry.sha256, "COMMERCIAL_FILE_HASH_CHANGED", { path: entry.path });
  }
}

function renderActiveInclude(release, config) {
  assert(release?.port && Object.values(LANES).some((lane) => lane.port === release.port), "LANE_PORT_INVALID");
  const root = nginxPath(release.releaseDir);
  return [
    "# Generated by NexuAlpha bluegreen-release.mjs; contains no commercial terms.",
    `# buildId=${release.buildId} version=${release.version} lane=${release.lane}`,
    `set $nexualpha_upstream http://127.0.0.1:${release.port};`,
    "",
    "location = /version.json {",
    `  alias ${root}/version.json;`,
    "  add_header Cache-Control \"no-store\" always;",
    "}",
    "",
    "location /assets/ {",
    `  alias ${root}/assets/;`,
    "  access_log off;",
    "  add_header Cache-Control \"public, max-age=31536000, immutable\" always;",
    "}",
    "",
    "location /brands/ {",
    `  alias ${root}/brands/;`,
    "  access_log off;",
    "  add_header Cache-Control \"public, max-age=86400\" always;",
    "}",
    "",
    "location /fonts/ {",
    `  alias ${root}/fonts/;`,
    "  access_log off;",
    "  add_header Cache-Control \"public, max-age=31536000, immutable\" always;",
    "}",
    "",
    "location / {",
    "  proxy_set_header Host $host;",
    "  proxy_set_header X-Real-IP $remote_addr;",
    "  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;",
    "  proxy_set_header X-Forwarded-Proto $scheme;",
    "  proxy_pass $nexualpha_upstream;",
    "}",
    "",
  ].join("\n");
}

async function runHealthProbes(config, release, httpProbe) {
  const results = [];
  for (const probe of HEALTH_PROBES) {
    const result = await httpProbe({ ...probe, release, config, url: `http://127.0.0.1:${release.port}${probe.path}` });
    const normalized = normalizeProbeResult(result);
    if (probe.expect === "version") {
      assert(normalized.status === 200, "PROBE_VERSION_STATUS_INVALID", { observed: normalized.status });
      assert(normalized.body?.buildId === release.buildId, "PROBE_VERSION_BUILD_ID_MISMATCH", { expected: release.buildId, actual: normalized.body?.buildId });
      assert(normalized.body?.version === release.version, "PROBE_VERSION_MISMATCH", { expected: release.version, actual: normalized.body?.version });
    } else if (probe.expect === "dependencies") {
      assert([200, 503].includes(normalized.status), "PROBE_DEPENDENCIES_STATUS_INVALID", { observed: normalized.status });
      assert(typeof normalized.body === "object" && normalized.body, "PROBE_DEPENDENCIES_BODY_INVALID");
      assert("dependencies" in normalized.body || normalized.body.status === "ready" || normalized.body.status === "degraded", "PROBE_DEPENDENCIES_SHAPE_INVALID");
    } else {
      assert(normalized.status === 200, `PROBE_${probe.id.toUpperCase()}_STATUS_INVALID`, { observed: normalized.status });
    }
    results.push({ id: probe.id, path: probe.path, status: normalized.status });
  }
  return results;
}

async function localHttpProbe({ release, path: probePath }) {
  if (probePath === "/version.json") return { status: 200, body: JSON.parse(await readFile(path.join(release.releaseDir, "version.json"), "utf8")) };
  if (probePath === "/") {
    await access(path.join(release.releaseDir, "index.html"));
    return { status: 200, body: "ok" };
  }
  if (probePath === "/api/v1/health/ready") return { status: 200, body: { status: "ready", dependencies: { local: { ready: true } } } };
  if (probePath === "/health/live") return { status: 200, body: { status: "live" } };
  return { status: 404, body: null };
}

function normalizeProbeResult(result) {
  if (!result || typeof result !== "object") throw new ReleaseContractError("PROBE_RESULT_INVALID");
  return { status: result.status ?? result.statusCode, body: result.body ?? result.json ?? null };
}

async function dryRunCommandRunner(command, context) {
  return { status: "DRY_RUN", command, context };
}

async function runCommand(commandRunner, command, context) {
  const result = await commandRunner(command, context);
  if (result && typeof result === "object" && "code" in result && result.code !== 0) {
    throw new ReleaseContractError("COMMAND_FAILED", "COMMAND_FAILED", { command, code: result.code, context });
  }
  return result;
}

async function writePendingInclude(config, body) {
  await writeAtomic(config.pendingIncludePath, body);
  return config.pendingIncludePath;
}

async function replaceActiveInclude(config, pendingIncludePath) {
  await rename(pendingIncludePath, config.proxyIncludePath);
}

function assertIncludeCoversStaticAliases(include) {
  for (const aliasPath of STATIC_ALIAS_PATHS) {
    assert(include.includes(aliasPath), "STATIC_ALIAS_MISSING", { aliasPath });
  }
  assert(include.includes("location / {"), "ROOT_PROXY_LOCATION_MISSING");
  assert(include.includes("proxy_pass $nexualpha_upstream;"), "ROOT_PROXY_PASS_MISSING");
}

async function writeAtomic(file, body) {
  await mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(tmp, body, { mode: 0o600 });
  await rename(tmp, file);
}

async function swapSymlink(linkPath, targetPath) {
  await mkdir(path.dirname(linkPath), { recursive: true });
  const tmp = `${linkPath}.tmp-${process.pid}-${Date.now()}`;
  await rm(tmp, { recursive: true, force: true });
  await symlink(targetPath, tmp, "dir");
  await rm(linkPath, { recursive: true, force: true });
  await rename(tmp, linkPath);
}

function inactiveLane(activeLane) {
  if (activeLane === "blue") return "green";
  return "blue";
}

function publicRelease(release) {
  if (!release) return null;
  return {
    lane: release.lane,
    port: release.port,
    buildId: release.buildId,
    version: release.version,
    releaseDir: release.releaseDir,
    ctaCollector: release.ctaCollector,
    commercialSha256: release.commercial?.sha256 || null,
  };
}

function parseCommandOption(value, fallback) {
  if (!value) return fallback;
  if (Array.isArray(value)) return value;
  return String(value).split(" ").filter(Boolean);
}

function nginxPath(value) {
  return path.resolve(value).replaceAll("\\", "/");
}

function publicCommercial(commercial) {
  if (!commercial) return null;
  return {
    algorithm: commercial.algorithm,
    sha256: commercial.sha256,
    files: commercial.files.map((entry) => ({
      path: entry.path,
      sha256: entry.sha256,
      bytes: entry.bytes,
    })),
  };
}

function publicResult(status, payload) {
  return {
    status,
    ...payload,
    scope: "local-contract-only; no production mutation; no invitation content emitted",
  };
}

function parseArgs(args) {
  const options = {};
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg.startsWith("--")) throw new ReleaseContractError("ARG_INVALID", `Unexpected argument: ${arg}`);
    const key = arg.slice(2).replace(/-([a-z])/g, (_, value) => value.toUpperCase());
    const value = args[index + 1];
    if (!value || value.startsWith("--")) throw new ReleaseContractError("ARG_VALUE_REQUIRED", `Missing value for ${arg}`);
    options[key] = value;
    index += 1;
  }
  return options;
}

function requirePath(value, code) {
  if (!value || typeof value !== "string") throw new ReleaseContractError(code);
  return path.resolve(value);
}

function requireSafeId(value, code) {
  if (!value || !SAFE_ID.test(value)) throw new ReleaseContractError(code);
  return value;
}

function requireVersion(value) {
  if (!value || !SEMVERISH.test(value)) throw new ReleaseContractError("VERSION_INVALID");
  return value;
}

function normalizeRelative(file) {
  const relative = file.replaceAll("\\", "/").replace(/^\/+/, "");
  if (!relative || relative.includes("..") || path.isAbsolute(relative)) throw new ReleaseContractError("COMMERCIAL_FILE_PATH_INVALID");
  return relative;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function assert(condition, code, details = {}) {
  if (!condition) throw new ReleaseContractError(code, code, details);
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main()
    .then((result) => {
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    })
    .catch((error) => {
      const status = error instanceof ReleaseContractError ? error.code : "RELEASE_TOOL_ERROR";
      process.stderr.write(`${JSON.stringify({ status, message: error.message, details: error.details || {} }, null, 2)}\n`);
      process.exitCode = 1;
    });
}
