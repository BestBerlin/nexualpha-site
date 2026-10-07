import { randomUUID } from 'node:crypto';
import { appendFile } from 'node:fs/promises';

const BUILD_ID = /^3\.0-[0-9A-Za-z._-]{6,64}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const COMPONENTS = new Set(['web', 'core', 'cta']);
const ERROR_CODES = new Set([
  'SITE_REQUEST_UNAVAILABLE',
  'CORE_API_ORIGIN_NOT_CONFIGURED',
  'CORE_API_UPSTREAM_UNAVAILABLE',
  'CTA_COLLECTOR_WRITE_FAILED',
]);

export function safeRequestId(value) {
  return UUID.test(String(value || '')) ? String(value) : randomUUID();
}

export function safeErrorRoute(pathname) {
  if (pathname === '/api/analytics/cta') return pathname;
  if (pathname === '/health/dependencies' || pathname === '/api/v1/health/dependencies') return '/health/dependencies';
  if (pathname === '/api/v1/health/ready' || pathname === '/api/v1/health/readiness' || pathname === '/api/v1/health/readiness/details') return '/api/v1/health/ready';
  if (pathname?.startsWith('/api/v1/')) return '/api/v1/*';
  return '/site-page';
}

export function createErrorMonitor(file, { buildId, environment = 'production', dedupeMs = 300000 } = {}) {
  if (!BUILD_ID.test(buildId || '')) throw new Error('ERROR_MONITOR_BUILD_ID_INVALID');
  if (environment !== 'production' && environment !== 'test') throw new Error('ERROR_MONITOR_ENVIRONMENT_INVALID');
  const recent = new Map();
  let serial = Promise.resolve();
  let ready = true;
  let lastFailureAt = null;

  const record = async ({ requestId, route, component, errorCode, httpStatus = 503, upstreamStatus } = {}) => {
    if (!COMPONENTS.has(component) || !ERROR_CODES.has(errorCode)) return false;
    const normalizedRoute = safeErrorRoute(route);
    const normalizedRequestId = safeRequestId(requestId);
    const fingerprint = `${component}:${errorCode}:${normalizedRoute}`;
    const now = Date.now();
    if ((recent.get(fingerprint) || 0) + dedupeMs > now) return false;
    recent.set(fingerprint, now);
    const row = {
      schemaVersion: 1,
      eventId: randomUUID(),
      occurredAt: new Date(now).toISOString(),
      environment,
      service: 'nexualpha-web',
      buildId,
      requestId: normalizedRequestId,
      route: normalizedRoute,
      component,
      errorCode,
      httpStatus: Number.isInteger(httpStatus) && httpStatus >= 400 && httpStatus <= 599 ? httpStatus : 503,
      ...(Number.isInteger(upstreamStatus) && upstreamStatus >= 100 && upstreamStatus <= 599 ? { upstreamStatus } : {}),
    };
    const operation = serial.then(() => appendFile(file, `${JSON.stringify(row)}\n`, { mode: 0o600 }));
    serial = operation.catch(() => {});
    try {
      await operation;
      ready = true;
      return true;
    } catch {
      if (recent.get(fingerprint) === now) recent.delete(fingerprint);
      ready = false;
      lastFailureAt = new Date().toISOString();
      process.stderr.write('ERROR_MONITOR_WRITE_FAILED\n');
      return false;
    }
  };

  return {
    record,
    status: () => ({ ready, configured: true, status: ready ? 'ready' : 'degraded', mode: 'local', environment, ...(lastFailureAt ? { lastFailureAt } : {}) }),
  };
}
