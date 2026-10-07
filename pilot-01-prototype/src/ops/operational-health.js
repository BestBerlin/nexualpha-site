export const OPERATIONAL_CHECKS = [
  { id: "live", path: "/health/live", requiredStatus: 200 },
  { id: "webReady", path: "/health/web-ready", requiredStatus: 200 },
  { id: "dependencies", path: "/health/dependencies", requiredStatus: 200 },
  { id: "bootstrap", path: "/site/bootstrap?locale=en", requiredStatus: 200, requireAvailable: true },
  { id: "venues", path: "/venues", requiredStatus: 200, requireAvailable: true },
  { id: "officialUpdates", path: "/official-updates", requiredStatus: 200 },
];

function safeBody(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const record = body;
  const dependencies = record.dependencies;
  return {
    status: typeof record.status === "string" ? record.status : undefined,
    buildId: typeof record.buildId === "string" ? record.buildId : undefined,
    service: typeof record.service === "string" ? record.service : undefined,
    reasonCode: typeof record.reasonCode === "string" ? record.reasonCode : undefined,
    errorCode: record.error && typeof record.error === "object" && typeof record.error.code === "string" ? record.error.code : undefined,
    dependencies: dependencies && typeof dependencies === "object" ? Object.fromEntries(
      Object.entries(dependencies).map(([name, value]) => {
        if (!value || typeof value !== "object") return [name, { ready: false }];
        const dependency = value;
        return [name, Object.fromEntries(Object.entries({
          ready: dependency.ready === true,
          configured: dependency.configured === true ? true : dependency.configured === false ? false : undefined,
          status: typeof dependency.status === "string" ? dependency.status : undefined,
          reasonCode: typeof dependency.reasonCode === "string" ? dependency.reasonCode : undefined,
          upstreamStatus: Number.isInteger(dependency.upstreamStatus) ? dependency.upstreamStatus : undefined,
          adapter: typeof dependency.adapter === "string" ? dependency.adapter : undefined,
          source: typeof dependency.source === "string" ? dependency.source : undefined,
          missing: Array.isArray(dependency.missing) ? dependency.missing.filter((item) => typeof item === "string").slice(0, 32) : undefined,
        }).filter(([, item]) => item !== undefined))];
      }),
    ) : undefined,
  };
}

export function summarizeOperationalCheck(check, response, body, error = null) {
  const safe = safeBody(body);
  const statusOk = response?.status === check.requiredStatus;
  const readyOk = check.id !== "ready" || safe?.status === "ready";
  const availabilityOk = !check.requireAvailable || safe?.status !== "unavailable";
  const expectedFallback = safe?.reasonCode === "CORE_API_ORIGIN_NOT_CONFIGURED"
    || Object.values(safe?.dependencies || {}).some((dependency) => dependency?.reasonCode === "CORE_API_ORIGIN_NOT_CONFIGURED");
  return {
    id: check.id,
    path: check.path,
    ok: !error && statusOk && readyOk && availabilityOk,
    expectedFallback,
    httpStatus: response?.status ?? null,
    body: safe,
    error: error ? String(error.message || error) : null,
  };
}

export function buildOperationalReport({ baseUrl, generatedAt, checks, expectedGrowthEvents = false }) {
  const dependencyCheck = checks.find((check) => check.id === "dependencies");
  const growthEvents = dependencyCheck?.body?.dependencies?.growthEvents
    || checks.find((check) => check.id === "ready")?.body?.dependencies?.growthEvents;
  const growthEventsOk = !expectedGrowthEvents || growthEvents?.ready === true;
  const failures = checks.filter((check) => !check.ok).map((check) => check.id);
  if (expectedGrowthEvents && !growthEventsOk && !failures.includes("ready")) failures.push("growthEvents");
  const degradedOptionalDependencies = Object.entries(dependencyCheck?.body?.dependencies || {})
    .filter(([name, dependency]) => ["core", "cta"].includes(name) && dependency?.ready !== true)
    .map(([name]) => name)
    .sort((left, right) => ["core", "cta"].indexOf(left) - ["core", "cta"].indexOf(right));
  const status = failures.length === 0 ? "PASS" : "NEEDS_ATTENTION";
  return {
    generatedAt,
    baseUrl,
    policy: "Read-only operational evidence. It does not prove traffic, registration, KYC, first trade, commission or conversion lift.",
    expectedGrowthEvents,
    status,
    failures,
    degradedOptionalDependencies,
    recovery: null,
    checks,
  };
}
