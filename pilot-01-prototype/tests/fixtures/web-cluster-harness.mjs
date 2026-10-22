import cluster from 'node:cluster';
import { createServer } from 'node:http';
import { superviseWebWorkers, listenWebWorker } from '../../server/web-cluster.mjs';
import { primaryCall } from '../../server/cluster-rpc.mjs';
import { createPrimaryServices, createWebCtaCollector } from '../../server/cluster-services.mjs';

if (cluster.isPrimary) {
  superviseWebWorkers({ count: 2, handlers: createPrimaryServices(),
    restartBaseMs: 50, maxCrashes: process.env.CRASH_LOOP ? 3 : 8 });
} else if (process.env.CRASH_LOOP) {
  process.exit(2);
} else if (process.env.IPC_ONLY) {
  // Real fork/IPC/lifecycle coverage even on hosts that prohibit listening sockets.
  const results = [];
  for (let i = 0; i < 7; i += 1) results.push(await primaryCall('click-window', { key: 'shared-hash:venue' }));
  const allowed = [];
  for (let i = 0; i < 16; i += 1) allowed.push(await primaryCall('click-allow', { key: 'shared-rate-hash' }));
  const cta = [];
  if (process.env.SHARED_CTA_FILE) {
    const collect = createWebCtaCollector(process.env.SHARED_CTA_FILE, { environment: 'test', origin: 'https://nexualpha.com' });
    await collect.ready;
    for (let i = 0; i < 3; i += 1) cta.push((await collect(new Request('https://nexualpha.com/api/analytics/cta', { method: 'POST',
      headers: { origin: 'https://nexualpha.com', 'content-type': 'application/json' }, body: process.env.SHARED_CTA_EVENT }))).status);
    const rejected = await collect(new Request('https://nexualpha.com/api/analytics/cta', { method: 'POST',
      headers: { origin: 'https://untrusted.example', 'content-type': 'application/json' }, body: 'a'.repeat(4096) }));
    cta.push(rejected.status);
  }
  console.log(JSON.stringify({ event: 'ipc-ready', pid: process.pid, results, allowed, cta }));
  const timer = setInterval(() => {}, 1000);
  process.once('SIGTERM', () => {
    clearInterval(timer);
    process.exitCode = process.env.FAIL_DRAIN ? 1 : 0;
    process.disconnect();
    process.exit(process.exitCode);
  });
} else {
  await listenWebWorker(async () => createServer((req, res) => {
    if (req.url === '/slow') {
      console.log(`slow-started pid=${process.pid}`);
      setTimeout(() => res.end(`finished pid=${process.pid}`), 250);
    } else res.end(`pid=${process.pid}`);
  }));
}
