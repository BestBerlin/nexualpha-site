import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

export function atomicWriteJson(file, value) {
  atomicWriteText(file, `${JSON.stringify(value)}\n`);
}

export function atomicWriteText(file, value) {
  mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.${Math.random().toString(36).slice(2)}.tmp`;
  try {
    writeFileSync(tmp, value);
    renameSync(tmp, file);
  } finally { rmSync(tmp, { force: true }); }
}

export function readJson(file, fallback = null) {
  try { return JSON.parse(readFileSync(file, "utf8")); } catch { return fallback; }
}

export function sourcesDegraded(sourceStatus) {
  return Object.values(sourceStatus).some((source) => !["ok", "receiving"].includes(source.status));
}

// Race as well as abort: adapters and test doubles do not always honor signals.
export async function withDeadline(operation, timeoutMs, parentSignal) {
  const controller = new AbortController();
  let timer;
  let onAbort;
  const stop = new Promise((_, reject) => {
    onAbort = () => { controller.abort(parentSignal.reason); reject(parentSignal.reason || new Error("aborted")); };
    if (parentSignal?.aborted) onAbort();
    else parentSignal?.addEventListener("abort", onAbort, { once: true });
    timer = setTimeout(() => {
      const error = new Error(`source timeout after ${timeoutMs}ms`);
      controller.abort(error);
      reject(error);
    }, timeoutMs);
  });
  try {
    if (controller.signal.aborted) return await stop;
    return await Promise.race([Promise.resolve().then(() => operation(controller.signal)), stop]);
  } finally {
    clearTimeout(timer);
    parentSignal?.removeEventListener("abort", onAbort);
  }
}

// The same absolute deadline includes response body reads, not only headers.
export function boundedFetch(fetchImpl = fetch, { timeoutMs = 10_000, signal } = {}) {
  return async (url, init = {}) => {
    const expiresAt = Date.now() + timeoutMs;
    const parent = signal && init.signal ? AbortSignal.any([signal, init.signal]) : signal || init.signal;
    const transport = new AbortController();
    const response = await withDeadline((deadlineSignal) => fetchImpl(url, { ...init, signal: AbortSignal.any([deadlineSignal, transport.signal]) }), timeoutMs, parent);
    return new Proxy(response, {
      get(target, key) {
        if (["json", "text", "arrayBuffer"].includes(key) && typeof target[key] === "function") {
          return async () => {
            try { return await withDeadline(() => target[key](), Math.max(1, expiresAt - Date.now()), parent); }
            catch (error) { transport.abort(error); throw error; }
          };
        }
        const value = Reflect.get(target, key, target);
        return typeof value === "function" ? value.bind(target) : value;
      },
    });
  };
}

export function createSourceRunner({ now = Date.now, timeoutMs = 45_000, baseMs = 1_000, maxMs = 300_000, log = () => {} } = {}) {
  const states = {};
  const run = async (name, operation) => {
    const state = states[name] ||= { status: "pending", failures: 0, nextRetryAt: null, lastSuccessAt: null };
    if (now() < Date.parse(state.nextRetryAt || "")) {
      state.status = "open";
      throw new Error(`${name} backed off until ${state.nextRetryAt}`);
    }
    try {
      const result = await withDeadline(operation, timeoutMs);
      Object.assign(state, { status: "ok", failures: 0, nextRetryAt: null, lastSuccessAt: new Date(now()).toISOString(), error: null });
      return result;
    } catch (error) {
      state.failures += 1;
      Object.assign(state, { status: "error", error: String(error?.message || error).slice(0, 200), nextRetryAt: new Date(now() + Math.min(maxMs, baseMs * 2 ** Math.min(state.failures - 1, 20))).toISOString() });
      log(`${name}: ${state.error}; next retry ${state.nextRetryAt}`);
      throw error;
    }
  };
  return { run, status: () => structuredClone(states) };
}

// One owner, no overlapping setInterval calls. Keep the process alive after the
// five-minute startup recovery budget; later loops can still recover the feed.
export async function runCollectorLoop(run, {
  cycleMs, startupBudgetMs = 300_000, now = Date.now,
  wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  onError = () => {}, once = false, maxCycles = Infinity,
} = {}) {
  const startedAt = now();
  let startup = true;
  let failures = 0;
  for (let cycle = 0; cycle < maxCycles; cycle += 1) {
    let ok = false;
    try { ok = (await run()) !== false; }
    catch (error) { await onError(error); }
    if (ok) { startup = false; failures = 0; }
    else failures += 1;
    if (once || cycle + 1 >= maxCycles) return;
    const budgetLeft = startupBudgetMs - (now() - startedAt);
    const delay = startup && budgetLeft > 0
      ? Math.min(30_000, 1_000 * 2 ** Math.min(failures - 1, 10), budgetLeft)
      : cycleMs;
    await wait(delay);
  }
}
