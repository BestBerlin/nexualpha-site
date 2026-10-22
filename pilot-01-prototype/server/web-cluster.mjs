import cluster from 'node:cluster';
import { availableParallelism } from 'node:os';
import { servePrimaryCalls } from './cluster-rpc.mjs';

export function webWorkerCount(value = process.env.WEB_WORKERS) {
  if (value === undefined) return Math.min(4, availableParallelism());
  if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value))) throw new Error('WEB_WORKERS_MUST_BE_A_POSITIVE_INTEGER');
  return Number(value);
}

export function superviseWebWorkers({ count, handlers = {}, restartBaseMs = 100, restartMaxMs = 5000,
  crashWindowMs = 60000, maxCrashes = 8, shutdownMs = 30000 } = {}) {
  let stopping = false;
  let exitCode = 0;
  const crashes = [];
  const timers = new Set();
  let shutdownTimer;
  // Explicit round-robin: the primary accepts/distributes sockets; all workers use the same port.
  cluster.schedulingPolicy = cluster.SCHED_RR;
  const finish = () => {
    if (stopping && Object.keys(cluster.workers).length === 0) {
      clearTimeout(shutdownTimer);
      process.exit(exitCode);
    }
  };
  const shutdown = (code = 0) => {
    if (stopping) return;
    stopping = true;
    exitCode = code;
    for (const timer of timers) clearTimeout(timer);
    timers.clear();
    for (const worker of Object.values(cluster.workers)) worker.process.kill('SIGTERM');
    shutdownTimer = setTimeout(() => {
      exitCode = 1;
      for (const worker of Object.values(cluster.workers)) worker.process.kill('SIGKILL');
      finish();
    }, shutdownMs);
    finish();
  };
  const fork = (attempt = 0) => {
    if (stopping) return;
    const started = Date.now();
    const worker = cluster.fork();
    servePrimaryCalls(worker, handlers);
    worker.once('listening', () => process.stdout.write(`NexuAlpha worker ready pid=${worker.process.pid}\n`));
    worker.once('exit', (code, signal) => {
      if (stopping) {
        if (code !== 0 || signal) exitCode = 1;
        finish();
        return;
      }
      const now = Date.now();
      while (crashes.length && crashes[0] <= now - crashWindowMs) crashes.shift();
      crashes.push(now);
      process.stderr.write(`NexuAlpha worker exited pid=${worker.process.pid} code=${code} signal=${signal}\n`);
      if (crashes.length >= maxCrashes) {
        process.stderr.write('WEB_WORKER_CRASH_LOOP\n');
        shutdown(1);
        return;
      }
      const failures = now - started >= crashWindowMs ? 0 : attempt;
      const delay = Math.min(restartMaxMs, restartBaseMs * 2 ** failures);
      const timer = setTimeout(() => { timers.delete(timer); fork(failures + 1); }, delay);
      timers.add(timer);
    });
  };
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => shutdown());
  for (let i = 0; i < count; i += 1) fork();
  return { shutdown };
}

export async function listenWebWorker(createServer, { port = Number(process.env.PORT || 8080), host = process.env.HOST || '0.0.0.0' } = {}) {
  let server;
  let stopping = false;
  const shutdown = () => {
    if (stopping) return;
    stopping = true;
    if (!server) return; // startup awaits may still be running; close immediately after they settle
    server.close(async () => {
      try { await server.flush?.(); } catch { process.exitCode = 1; }
      if (process.connected) process.disconnect();
      process.exit(process.exitCode || 0);
    });
  };
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, shutdown);
  if (cluster.isWorker) process.once('disconnect', shutdown);
  server = await createServer();
  // A TERM during startup must not leave a newly listening worker behind.
  if (stopping) { stopping = false; shutdown(); return server; }
  server.listen(port, host, () => process.stdout.write(`NexuAlpha server listening on port ${server.address().port}\n`));
  return server;
}
