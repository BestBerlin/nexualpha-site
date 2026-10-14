import { Worker } from 'node:worker_threads';

// Only public HTML enters the pool. Readers remain in the parent so live feeds,
// archives and their write locks have one owner; worker RPC transfers snapshots.
export function createSsrWorkerPool({ workerUrl, clientRoot, distRoot, size = 2, maxQueue = 64, timeoutMs = 30_000 } = {}) {
  const queue = [];
  const slots = [];
  let sequence = 0;
  let closed = false;
  const stats = { completed: 0, failed: 0 };
  const finish = (slot, error, response) => {
    const job = slot.job;
    if (!job) return;
    clearTimeout(job.timer);
    slot.job = null;
    if (error) { stats.failed++; job.reject(error); }
    else { stats.completed++; job.resolve(new Response(job.method === 'HEAD' ? null : response.body, { status: response.status, headers: response.headers })); }
    slot.worker.unref();
    dispatch();
  };
  const spawn = () => {
    const slot = { worker: new Worker(new URL('./ssr-render-thread.mjs', import.meta.url), { workerData: { workerUrl, clientRoot, distRoot } }), job: null };
    slots.push(slot);
    slot.worker.unref();
    slot.worker.on('message', async (message) => {
      if (!slot.job || slot.job.id !== message.id) return;
      if (message.type === 'reader') {
        const job = slot.job;
        try {
          const value = await job.readers.get(message.name)(...message.args);
          if (slot.job === job) slot.worker.postMessage({ type: 'reader-result', id: message.id, call: message.call, value });
        } catch (error) {
          if (slot.job === job) slot.worker.postMessage({ type: 'reader-result', id: message.id, call: message.call, error: String(error?.message || error) });
        }
      } else finish(slot, message.error ? new Error(message.error) : null, message);
    });
    const replace = (error) => {
      if (!slots.includes(slot)) return;
      slots.splice(slots.indexOf(slot), 1);
      slot.worker.terminate().catch(() => {});
      finish(slot, error);
      if (!closed && queue.length) { spawn(); dispatch(); }
    };
    slot.worker.on('error', replace);
    slot.worker.on('exit', (code) => replace(new Error(`SSR worker exited (${code})`)));
    slot.replace = replace;
    return slot;
  };
  const dispatch = () => {
    if (closed) return;
    for (const slot of slots) {
      if (slot.job || !queue.length) continue;
      const job = queue.shift();
      slot.job = job;
      slot.worker.ref();
      slot.worker.postMessage({ type: 'render', id: job.id, url: job.url, method: job.method, headers: job.headers, env: job.env });
    }
  };
  for (let i = 0; i < Math.max(1, Math.min(3, size)); i++) spawn();
  return {
    fetch(request, environment) {
      if (closed || queue.length + slots.filter((slot) => slot.job).length >= maxQueue) return Promise.reject(new Error('SSR pool unavailable'));
      const readers = new Map();
      const serialize = (value, name) => {
        if (typeof value === 'function') { readers.set(name, value); return { __ssrReader: name }; }
        if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, serialize(child, `${name}.${key}`)]));
        return value;
      };
      const env = Object.fromEntries(Object.entries(environment).filter(([key]) => !['ASSETS', 'NEWS_SSR_RENDER', 'WORKER_POLLED_JSON_CACHE_SCOPE'].includes(key)).map(([key, value]) => [key, serialize(value, key)]));
      return new Promise((resolve, reject) => {
        const job = { id: ++sequence, url: request.url, method: request.method, headers: [...request.headers], env, readers, resolve, reject };
        job.timer = setTimeout(() => {
          const slot = slots.find((candidate) => candidate.job === job);
          if (slot) slot.replace(new Error('SSR worker timed out'));
          else if (queue.includes(job)) { queue.splice(queue.indexOf(job), 1); stats.failed++; reject(new Error('SSR queue timed out')); }
        }, timeoutMs);
        queue.push(job);
        while (slots.length < Math.max(1, Math.min(3, size))) spawn();
        dispatch();
      });
    },
    stats: () => ({ ...stats, workers: slots.length, active: slots.filter((slot) => slot.job).length, queued: queue.length }),
    async close() {
      closed = true;
      for (const job of queue.splice(0)) { clearTimeout(job.timer); job.reject(new Error('SSR pool closed')); }
      await Promise.all(slots.map((slot) => { finish(slot, new Error('SSR pool closed')); return slot.worker.terminate(); }));
    },
  };
}
