// Our own QA / sweep / verification scripts against nexualpha.com (perf diagnosis 2026-10-22: a qa-regression run sent
// 6 407 requests in one evening hour with UA "node", and the single Node SSR process served visitors 13-26 s late).
//
// Every script that requests the public site goes through internalFetch():
//   - User-Agent carries "NexuAlpha-internal/<script>" (appended to a device UA when a script needs one), so nginx can
//     tell our traffic apart (rate-limit it, keep it out of the micro-cache stats, log it separately);
//   - requests to a non-loopback host are paced to NEXUALPHA_INTERNAL_RPS (default 2 per second, process-wide);
//     loopback targets (the staged standby on 127.0.0.1, a local `node server.mjs`) are not paced, so the deploy gate
//     keeps its speed. NEXUALPHA_INTERNAL_RPS=0 disables pacing (only for a deliberate load test).

export const INTERNAL_UA_PREFIX = "NexuAlpha-internal/";
export const DEFAULT_INTERNAL_RPS = 2;

export function internalUserAgent(script, baseUserAgent = "") {
  const token = `${INTERNAL_UA_PREFIX}${String(script || "script").replace(/[^A-Za-z0-9._-]/g, "-")}`;
  if (!baseUserAgent) return token;
  return baseUserAgent.includes(INTERNAL_UA_PREFIX) ? baseUserAgent : `${baseUserAgent} ${token}`;
}

export function isLoopbackUrl(url) {
  try {
    const host = new URL(String(url)).hostname.replace(/^\[|\]$/g, "");
    return host === "localhost" || host.endsWith(".localhost") || host === "::1" || /^127\./.test(host);
  } catch { return false; }
}

export function configuredRps(env = process.env) {
  const raw = env.NEXUALPHA_INTERNAL_RPS;
  if (raw === undefined || raw === "") return DEFAULT_INTERNAL_RPS;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : DEFAULT_INTERNAL_RPS;
}

/** One pacer per process: concurrent workers share the same budget. */
export function createPacer({ rps = configuredRps(), now = Date.now, sleep = (ms) => new Promise((r) => setTimeout(r, ms)) } = {}) {
  let next = 0;
  return async function wait(url) {
    if (!rps || isLoopbackUrl(url)) return;
    const gap = 1000 / rps;
    const at = Math.max(now(), next);
    next = at + gap;
    const delay = at - now();
    if (delay > 0) await sleep(delay);
  };
}

const sharedPacer = createPacer();
export const paceInternalRequest = (url) => sharedPacer(url);

/** fetch() with the internal UA and the shared pace. Same signature as fetch. */
export function internalFetch(script, { fetchImpl = globalThis.fetch, pace = sharedPacer } = {}) {
  return async (input, init = {}) => {
    const url = typeof input === "string" || input instanceof URL ? String(input) : input.url;
    await pace(url);
    const headers = new Headers(init.headers || (typeof input === "object" && !(input instanceof URL) ? input.headers : undefined));
    headers.set("user-agent", internalUserAgent(script, headers.get("user-agent") || ""));
    return fetchImpl(input, { ...init, headers });
  };
}
