#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, "..");
const DEFAULT_OUTPUT = path.join(projectRoot, "artifacts", "operational-health", "live-runtime-latest.json");

const LIVE_RUNTIME_ENDPOINTS = Object.freeze([
  { id: "version", path: "/version.json", layer: "web", requiredStatus: 200 },
  { id: "live", path: "/health/live", layer: "web", requiredStatus: 200 },
  { id: "webReady", path: "/health/web-ready", layer: "web", requiredStatus: 200 },
  { id: "ctaReady", path: "/health/cta-ready", layer: "cta", optional: true, acceptableStatuses: [200, 503] },
  { id: "errorsReady", path: "/health/errors-ready", layer: "errors", optional: true, acceptableStatuses: [200, 503] },
  { id: "dependencies", path: "/health/dependencies", layer: "dependencies", requiredStatus: 200 },
  { id: "coreReadiness", path: "/api/v1/health/ready", layer: "core", optional: true, acceptableStatuses: [200, 503] },
]);

function parseArgs(argv) {
  const options = {
    baseUrl: null,
    output: DEFAULT_OUTPUT,
    timeoutMs: 10_000,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => {
      index += 1;
      if (index >= argv.length) throw new Error(`${arg} requires a value`);
      return argv[index];
    };

    if (arg === "--base-url") options.baseUrl = next();
    else if (arg === "--output") options.output = next();
    else if (arg === "--timeout-ms") options.timeoutMs = Number.parseInt(next(), 10);
    else if (arg === "--help" || arg === "-h") options.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function printHelp() {
  console.log([
    "Usage: node scripts/collect-live-runtime-health.mjs --base-url <url> [options]",
    "",
    "Creates an explicit read-only live runtime snapshot for weekly-growth-ops.",
    "The command never contacts production unless --base-url is supplied.",
    "",
    "Options:",
    "  --base-url <url>     Explicit site origin, for example https://nexualpha.com.",
    "  --output <file>      Snapshot JSON path. Default: artifacts/operational-health/live-runtime-latest.json",
    "  --timeout-ms <ms>    Per-endpoint timeout. Default: 10000.",
  ].join("\n"));
}

function normalizeBaseUrl(value) {
  if (!value) throw new Error("LIVE_HEALTH_BASE_URL_REQUIRED");
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("LIVE_HEALTH_BASE_URL_HTTP_REQUIRED");
  url.pathname = url.pathname.replace(/\/+$/, "");
  url.search = "";
  url.hash = "";
  return url.toString().replace(/\/$/, "");
}

async function readSafeJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function sanitizeBody(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const dependencies = body.dependencies && typeof body.dependencies === "object" ? body.dependencies : null;
  return {
    status: typeof body.status === "string" ? body.status : undefined,
    service: typeof body.service === "string" ? body.service : undefined,
    buildId: typeof body.buildId === "string" ? body.buildId : undefined,
    version: typeof body.version === "string" ? body.version : undefined,
    coreApi: typeof body.coreApi === "string" ? body.coreApi : undefined,
    configured: typeof body.configured === "boolean" ? body.configured : undefined,
    ready: typeof body.ready === "boolean" ? body.ready : undefined,
    reasonCode: typeof body.reasonCode === "string" ? body.reasonCode : undefined,
    errorCode: body.error && typeof body.error === "object" && typeof body.error.code === "string" ? body.error.code : undefined,
    remediation: typeof body.remediation === "string" ? body.remediation : undefined,
    dependencies: dependencies ? Object.fromEntries(Object.entries(dependencies).map(([name, value]) => {
      if (!value || typeof value !== "object") return [name, { ready: false }];
      return [name, Object.fromEntries(Object.entries({
        ready: value.ready === true,
        configured: value.configured === true ? true : value.configured === false ? false : undefined,
        status: typeof value.status === "string" ? value.status : undefined,
        reasonCode: typeof value.reasonCode === "string" ? value.reasonCode : undefined,
        upstreamStatus: Number.isInteger(value.upstreamStatus) ? value.upstreamStatus : undefined,
      }).filter(([, item]) => item !== undefined))];
    })) : undefined,
  };
}

async function collectEndpoint(baseUrl, endpoint, timeoutMs) {
  const url = `${baseUrl}${endpoint.path}`;
  try {
    const response = await fetch(url, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(timeoutMs),
    });
    const body = sanitizeBody(await readSafeJson(response));
    const acceptable = endpoint.acceptableStatuses || [endpoint.requiredStatus];
    return {
      id: endpoint.id,
      path: endpoint.path,
      layer: endpoint.layer,
      optional: endpoint.optional === true,
      httpStatus: response.status,
      ok: acceptable.includes(response.status),
      requiredStatus: endpoint.requiredStatus || null,
      acceptableStatuses: acceptable,
      body,
      error: null,
    };
  } catch (error) {
    return {
      id: endpoint.id,
      path: endpoint.path,
      layer: endpoint.layer,
      optional: endpoint.optional === true,
      httpStatus: null,
      ok: false,
      requiredStatus: endpoint.requiredStatus || null,
      acceptableStatuses: endpoint.acceptableStatuses || [endpoint.requiredStatus],
      body: null,
      error: String(error.message || error),
    };
  }
}

function dependencyFrom(endpoint) {
  const body = endpoint?.body || {};
  return {
    httpStatus: endpoint?.httpStatus ?? null,
    ok: endpoint?.ok === true,
    status: body.status || null,
    configured: typeof body.configured === "boolean" ? body.configured : null,
    ready: typeof body.ready === "boolean" ? body.ready : null,
    reasonCode: body.reasonCode || body.errorCode || null,
  };
}

function classifySnapshot({ baseUrl, generatedAt, endpoints }) {
  const byId = Object.fromEntries(endpoints.map((endpoint) => [endpoint.id, endpoint]));
  const hardFailures = endpoints
    .filter((endpoint) => endpoint.optional !== true && endpoint.ok !== true)
    .map((endpoint) => endpoint.id);
  const dependencyBody = byId.dependencies?.body?.dependencies || {};
  const optionalDependencies = {
    cta: dependencyBody.cta || dependencyFrom(byId.ctaReady),
    errors: dependencyBody.errorMonitor || dependencyFrom(byId.errorsReady),
    core: dependencyBody.core || dependencyBody.coreApi || dependencyFrom(byId.coreReadiness),
  };
  const optionalDegraded = Object.entries(optionalDependencies)
    .filter(([, dependency]) => dependency && dependency.ready !== true)
    .map(([name]) => name);
  const status = hardFailures.length ? "NEEDS_ATTENTION" : "PASS";
  const versionBody = byId.version?.body || {};

  return {
    schemaVersion: "nexualpha-live-runtime-health-v1",
    source: "explicit-live-http",
    generatedAt,
    baseUrl,
    policy: "Read-only live HTTP snapshot. Core, CTA and error-monitor 503 responses are recorded as capability state and do not by themselves prove the website is down.",
    status,
    failures: hardFailures,
    version: {
      httpStatus: byId.version?.httpStatus ?? null,
      packageVersion: versionBody.version || null,
      buildId: versionBody.buildId || null,
    },
    layers: {
      web: {
        live: dependencyFrom(byId.live),
        ready: dependencyFrom(byId.webReady),
      },
      cta: dependencyFrom(byId.ctaReady),
      errors: dependencyFrom(byId.errorsReady),
      dependencies: dependencyFrom(byId.dependencies),
      core: dependencyFrom(byId.coreReadiness),
    },
    degradedOptionalDependencies: optionalDegraded,
    recovery: hardFailures.length ? {
      condition: `Fix required live runtime endpoint(s): ${hardFailures.join(", ")}.`,
    } : null,
    endpoints,
  };
}

export async function collectLiveRuntimeHealth({ baseUrl, generatedAt = new Date().toISOString(), timeoutMs = 10_000 } = {}) {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  const boundedTimeoutMs = Math.max(250, Math.min(Number(timeoutMs) || 10_000, 30_000));
  const endpoints = await Promise.all(LIVE_RUNTIME_ENDPOINTS.map((endpoint) => collectEndpoint(normalizedBaseUrl, endpoint, boundedTimeoutMs)));
  return classifySnapshot({ baseUrl: normalizedBaseUrl, generatedAt, endpoints });
}

export async function writeLiveRuntimeHealth(options = {}) {
  const report = await collectLiveRuntimeHealth(options);
  const output = path.resolve(options.output || DEFAULT_OUTPUT);
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return { report, output };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) {
      printHelp();
    } else {
      if (!options.baseUrl) throw new Error("LIVE_HEALTH_BASE_URL_REQUIRED: pass --base-url explicitly; this command has no default production target.");
      const { report, output } = await writeLiveRuntimeHealth(options);
      console.log(JSON.stringify({ status: report.status, failures: report.failures, degradedOptionalDependencies: report.degradedOptionalDependencies, output }, null, 2));
      if (report.status === "NEEDS_ATTENTION") process.exitCode = 1;
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
