// Single-shot container healthcheck. A degraded but progressing collector is alive.
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
export async function healthcheck(kind, target, { now = Date.now(), maxAgeMs = 600_000, fetchImpl = fetch } = {}) {
  if (kind === 'file') {
    const snapshot = JSON.parse(await readFile(target, 'utf8'));
    const stamp = Date.parse(snapshot.updatedAt || '');
    if (!Number.isFinite(stamp) || now - stamp > maxAgeMs || stamp > now + 60_000) throw new Error('stale-heartbeat');
    return true;
  }
  if (kind === 'http') {
    const response = await fetchImpl(target, { signal: AbortSignal.timeout(5000), redirect: 'manual' });
    if (response.status < 200 || response.status >= 400) throw new Error('http-unhealthy');
    return true;
  }
  throw new Error('unknown healthcheck kind');
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  healthcheck(process.argv[2], process.argv[3]).catch(error => { console.error(error.message); process.exitCode = 1; });
}
