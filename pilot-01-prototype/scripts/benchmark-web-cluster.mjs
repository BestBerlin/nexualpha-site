#!/usr/bin/env node
// Bounded local SSR benchmark for environments that prohibit listening sockets.
// Real Node IncomingMessage/ServerResponse exercise the production HTTP handler;
// IPC scheduling and in-memory wire capture replace transport, not rendering.
import cluster from 'node:cluster';
import { IncomingMessage, ServerResponse } from 'node:http';
import { Duplex } from 'node:stream';
import { access, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import { availableParallelism } from 'node:os';
import { createProductionServer } from '../server.mjs';
import { createPrimaryServices } from '../server/cluster-services.mjs';
import { servePrimaryCalls } from '../server/cluster-rpc.mjs';

const channel = 'web-cluster-benchmark-v1';
const env = { NODE_ENV: 'production', INTEL_REFRESH: 'off', FX_REFRESH: 'off',
  BITGET_ALLIANCE_POOL: 'off', KRAKEN_USDG_LIVE: 'off', SSR_PAGE_CACHE: 'off' };

async function requestInMemory(server, pathname) {
  const chunks = [];
  const socket = new Duplex({ read() {}, write(chunk, encoding, done) {
    chunks.push(Buffer.from(chunk)); done();
  } });
  socket.remoteAddress = '127.0.0.1';
  const request = new IncomingMessage(socket);
  Object.assign(request, { method: 'GET', url: pathname, httpVersion: '1.1',
    httpVersionMajor: 1, httpVersionMinor: 1,
    headers: { host: 'localhost', 'user-agent': 'NexuAlpha-local-benchmark/1', accept: 'text/html' } });
  request.push(null);
  const response = new ServerResponse(request);
  response.assignSocket(socket);
  // Native HTTP connection setup normally forwards this event for ServerResponse.
  socket.on('drain', () => response.emit('drain'));
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { socket.destroy(); reject(new Error('HANDLER_TIMEOUT')); }, 60000);
    const fail = (error) => { clearTimeout(timer); socket.destroy(); reject(error); };
    response.once('error', fail);
    socket.once('error', fail);
    response.once('finish', () => {
      clearTimeout(timer);
      const wire = Buffer.concat(chunks);
      const headerEnd = wire.indexOf('\r\n\r\n');
      const result = { status: response.statusCode, bytes: wire.length,
        bodyBytes: headerEnd < 0 ? 0 : wire.length - headerEnd - 4 };
      response.detachSocket(socket);
      socket.destroy();
      resolve(result);
    });
    server.emit('request', request, response);
  });
}

if (cluster.isWorker) {
  // Fail closed if a future SSR dependency accidentally attempts an external call.
  globalThis.fetch = async () => { throw new Error('BENCHMARK_NETWORK_DISABLED'); };
  const server = await createProductionServer({ env });
  process.on('message', async (message) => {
    if (message?.channel !== channel) return;
    if (message.kind === 'stop') {
      await server.flush?.();
      server.emit('close');
      process.disconnect();
      setImmediate(() => process.exit(0));
      return;
    }
    if (message.kind !== 'request') return;
    try {
      const result = await requestInMemory(server, message.path);
      process.send({ channel, id: message.id, ...result });
    } catch (error) {
      process.send({ channel, id: message.id, error: error.message });
    }
  });
  process.send({ channel, kind: 'ready' });
} else {
  await access(new URL('../dist/server/index.js', import.meta.url));
  const feed = JSON.parse(await readFile(new URL('../dist/client/content/news-feed-summary.json', import.meta.url), 'utf8'));
  const paths = feed.articles.filter((row) => row.status === 'PUBLISHED').slice(0, 8).map((row) => `/news/${row.slug}`);
  if (paths.length !== 8) throw new Error('BENCHMARK_NEEDS_EIGHT_NEWS_ARTICLES');
  const requests = 128;
  const concurrency = 16;
  const warmupPerWorker = paths.length;
  const handlers = createPrimaryServices(env);
  cluster.setupPrimary({ exec: fileURLToPath(import.meta.url) });
  let id = 0;
  const runs = [];
  for (const count of [1, 2]) {
    const workers = [];
    const pending = new Map();
    const all = [];
    try {
      await Promise.all(Array.from({ length: count }, () => new Promise((resolve, reject) => {
        const worker = cluster.fork();
        workers.push(worker);
        servePrimaryCalls(worker, handlers);
        const startup = setTimeout(() => reject(new Error('WORKER_START_TIMEOUT')), 60000);
        worker.on('message', (message) => {
          if (message?.channel !== channel) return;
          if (message.kind === 'ready') { clearTimeout(startup); resolve(); return; }
          const entry = pending.get(message.id);
          if (!entry) return;
          pending.delete(message.id);
          clearTimeout(entry.timer);
          if (message.error) entry.reject(new Error(message.error));
          else entry.resolve(message);
        });
        worker.once('exit', (code, signal) => {
          clearTimeout(startup);
          if (code !== 0 || signal) {
            const error = new Error(`WORKER_EXIT_${code}_${signal}`);
            reject(error);
            for (const [key, entry] of pending) {
              if (entry.worker !== worker) continue;
              clearTimeout(entry.timer); pending.delete(key); entry.reject(error);
            }
          }
        });
      })));
      console.log(JSON.stringify({ phase: 'ready', workers: count }));
      const send = (worker, pathname) => new Promise((resolve, reject) => {
        const requestId = ++id;
        const timer = setTimeout(() => { pending.delete(requestId); reject(new Error('IPC_REQUEST_TIMEOUT')); }, 65000);
        pending.set(requestId, { resolve, reject, timer, worker });
        worker.send({ channel, kind: 'request', id: requestId, path: pathname }, (error) => {
          if (!error || !pending.delete(requestId)) return;
          clearTimeout(timer); reject(error);
        });
      });
      for (const worker of workers) for (const pathname of paths) {
        const result = await send(worker, pathname);
        if (result.status !== 200 || result.bodyBytes < 1) throw new Error(`WARMUP_FAILED_${result.status}_${pathname}`);
      }
      console.log(JSON.stringify({ phase: 'warm', workers: count }));
      let next = 0;
      const started = performance.now();
      await Promise.all(Array.from({ length: concurrency }, async () => {
        while (next < requests) {
          const index = next++;
          const begin = performance.now();
          const result = await send(workers[index % workers.length], paths[index % paths.length]);
          if (result.status !== 200 || result.bodyBytes < 1) throw new Error(`REQUEST_FAILED_${result.status}`);
          all.push({ latencyMs: performance.now() - begin, bytes: result.bytes });
        }
      }));
      const durationMs = performance.now() - started;
      const latencies = all.map((item) => item.latencyMs).sort((a, b) => a - b);
      const percentile = (p) => latencies[Math.ceil(p * latencies.length) - 1];
      const run = { workers: count, requests: all.length, concurrency, warmupPerWorker,
        durationMs, requestsPerSecond: all.length / (durationMs / 1000),
        p50Ms: percentile(.5), p90Ms: percentile(.9), p99Ms: percentile(.99),
        totalWireBytes: all.reduce((sum, item) => sum + item.bytes, 0), statuses: { 200: all.length } };
      runs.push(run);
      console.log(JSON.stringify(run));
    } finally {
      await Promise.all(workers.map((worker) => new Promise((resolve) => {
        if (worker.isDead()) { resolve(); return; }
        const timeout = setTimeout(() => worker.kill('SIGKILL'), 10000);
        worker.once('exit', () => { clearTimeout(timeout); resolve(); });
        worker.send({ channel, kind: 'stop' }, () => {});
      })));
      for (const entry of pending.values()) clearTimeout(entry.timer);
    }
  }
  const output = { measuredAt: new Date().toISOString(), node: process.version,
    machine: { platform: process.platform, architecture: process.arch, availableParallelism: availableParallelism() },
    method: 'in-memory HTTP handler over IPC, excludes socket/network overhead',
    limitations: 'Sequential single trial per worker count; fixed explicit IPC round-robin; does not exercise production cluster supervisor, listening sockets, kernel connection scheduling, or network.',
    build: JSON.parse(await readFile(new URL('../dist/client/version.json', import.meta.url), 'utf8')),
    config: { requests, concurrency, warmupPerWorker, paths, refresh: 'disabled', fetch: 'disabled', ssrPageCache: 'disabled' },
    runs, comparison: { throughputRatio: runs[1].requestsPerSecond / runs[0].requestsPerSecond,
      p90Ratio: runs[1].p90Ms / runs[0].p90Ms } };
  await writeFile(new URL('../.node-cluster-benchmark.json', import.meta.url), `${JSON.stringify(output, null, 2)}\n`);
}
