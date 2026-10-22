import cluster from 'node:cluster';

const channel = 'nexualpha-primary-v1';
const pending = new Map();
let sequence = 0;
let installed = false;
export const isClusterWorker = () => cluster.isWorker;

// No HTTP endpoint exposes these operations. Only forked workers hold the IPC channel.
export function primaryCall(operation, payload) {
  if (!installed) {
    installed = true;
    process.on('message', (message) => {
      if (message?.channel !== channel || message.kind !== 'reply') return;
      const entry = pending.get(message.id);
      if (!entry) return;
      pending.delete(message.id);
      clearTimeout(entry.timer);
      if (message.ok) entry.resolve(message.value);
      else entry.reject(new Error('PRIMARY_OPERATION_FAILED'));
    });
    process.once('disconnect', () => {
      for (const entry of pending.values()) {
        clearTimeout(entry.timer);
        entry.reject(new Error('PRIMARY_DISCONNECTED'));
      }
      pending.clear();
    });
  }
  if (!process.connected || !process.send) return Promise.reject(new Error('PRIMARY_DISCONNECTED'));
  if (pending.size >= 1024) return Promise.reject(new Error('PRIMARY_QUEUE_FULL'));
  return new Promise((resolve, reject) => {
    const id = ++sequence;
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error('PRIMARY_OPERATION_TIMEOUT'));
    }, 10000);
    pending.set(id, { resolve, reject, timer });
    process.send({ channel, kind: 'call', id, operation, payload }, (error) => {
      if (!error || !pending.delete(id)) return;
      clearTimeout(timer);
      reject(new Error('PRIMARY_DISCONNECTED'));
    });
  });
}

export function servePrimaryCalls(worker, handlers) {
  worker.on('message', async (message) => {
    if (message?.channel !== channel || message.kind !== 'call') return;
    let reply;
    try {
      if (!Object.hasOwn(handlers, message.operation)) throw new Error('UNKNOWN_OPERATION');
      reply = { ok: true, value: await handlers[message.operation](message.payload) };
    } catch {
      reply = { ok: false };
    }
    if (worker.isConnected()) worker.send({ channel, kind: 'reply', id: message.id, ...reply }, () => {});
  });
}
