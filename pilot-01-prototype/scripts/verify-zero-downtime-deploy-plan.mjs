#!/usr/bin/env node
const plan = {
  status: "candidate-plan",
  scope: "local validation only; does not connect to production or mutate files",
  topology: {
    currentRisk: "single nexualpha-web container owns the only upstream port, so docker restart can reset live connections",
    upstreamHost: "127.0.0.1",
    activeLane: { name: "blue", container: "nexualpha-web-blue", port: 18080 },
    candidateLane: { name: "green", container: "nexualpha-web-green", port: 18081 },
    nginxInclude: "/www/server/panel/vhost/nginx/nexualpha-upstream.inc",
  },
  orderedPhases: [
    "backup-current-dist-and-nginx",
    "unpack-candidate-release-to-new-directory",
    "start-candidate-container-on-inactive-loopback-port",
    "check-candidate-live-health-version-and-headers",
    "write-next-upstream-include-to-temp-file",
    "nginx-config-test",
    "atomic-rename-upstream-include",
    "nginx-reload",
    "post-cutover-public-smoke",
    "keep-previous-container-and-release-for-rollback-window",
  ],
  candidateChecks: [
    { path: "/health/live", requiredStatus: 200 },
    { path: "/version.json", requiredStatus: 200, requireExpectedBuildId: true },
    { path: "/api/v1/health/ready", allowedStatuses: [200, 503], allowedDegradedReason: "coreApi:not_configured" },
    { path: "/", requiredStatus: 200, requireSingleSecurityHeaders: true },
  ],
  forbiddenBeforeCutover: [
    "docker restart nexualpha-web",
    "docker stop active container",
    "docker rm active container",
    "replace active dist in place",
  ],
  rollback: [
    "write previous upstream port to temp include",
    "nginx-config-test",
    "atomic-rename-upstream-include",
    "nginx-reload",
    "verify /version.json returns previous build",
  ],
  protectedSurfaces: [
    "src/data/partner-registry.js",
    "invitation links and referral codes",
    "production data files under /data/private/nexualpha",
  ],
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function isLoopbackPort(port) {
  return Number.isInteger(port) && port >= 1024 && port <= 65535;
}

assert(plan.topology.upstreamHost === "127.0.0.1", "UPSTREAM_MUST_BE_LOOPBACK_ONLY");
assert(plan.topology.activeLane.container !== plan.topology.candidateLane.container, "LANE_CONTAINERS_MUST_DIFFER");
assert(plan.topology.activeLane.port !== plan.topology.candidateLane.port, "LANE_PORTS_MUST_DIFFER");
assert(isLoopbackPort(plan.topology.activeLane.port), "ACTIVE_PORT_INVALID");
assert(isLoopbackPort(plan.topology.candidateLane.port), "CANDIDATE_PORT_INVALID");
assert(plan.orderedPhases.indexOf("start-candidate-container-on-inactive-loopback-port") < plan.orderedPhases.indexOf("nginx-reload"), "CANDIDATE_MUST_START_BEFORE_NGINX_RELOAD");
assert(plan.orderedPhases.indexOf("check-candidate-live-health-version-and-headers") < plan.orderedPhases.indexOf("atomic-rename-upstream-include"), "HEALTH_CHECK_MUST_PRECEDE_CUTOVER");
assert(plan.orderedPhases.includes("keep-previous-container-and-release-for-rollback-window"), "ROLLBACK_WINDOW_REQUIRED");
assert(plan.rollback.includes("verify /version.json returns previous build"), "ROLLBACK_VERSION_CHECK_REQUIRED");
assert(!plan.forbiddenBeforeCutover.some((command) => /nginx\s+-s\s+reload/.test(command)), "NGINX_RELOAD_IS_ALLOWED_ONLY_AFTER_CONFIG_TEST");
assert(plan.forbiddenBeforeCutover.some((command) => command.includes("docker restart")), "SINGLE_CONTAINER_RESTART_MUST_BE_FORBIDDEN");
const readiness = plan.candidateChecks.find((check) => check.path === "/api/v1/health/ready");
assert(readiness?.allowedStatuses?.includes(503), "READINESS_503_DEGRADED_BOUNDARY_MUST_BE_ALLOWED");
assert(plan.protectedSurfaces.includes("src/data/partner-registry.js"), "PARTNER_REGISTRY_MUST_BE_PROTECTED");

console.log(JSON.stringify({
  status: "PASS",
  summary: "Blue-green cutover plan keeps the active container serving until candidate health passes and nginx reload succeeds.",
  plan,
}, null, 2));
