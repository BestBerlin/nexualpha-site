export const JSON_POLL_BACKOFF_MAX_MS = 2 * 60 * 1000;

const defaultDocument = () => (typeof document === "undefined" ? null : document);
const defaultFetch = () => (typeof fetch === "function" ? fetch : null);
const hidden = (doc) => doc?.visibilityState === "hidden";

export function startJsonPolling({
  request,
  onData,
  isData = (value) => Boolean(value),
  onError = () => {},
  intervalMs,
  maxBackoffMs = JSON_POLL_BACKOFF_MAX_MS,
  immediate = true,
  shouldPoll,
  fetchImpl = defaultFetch(),
  documentRef = defaultDocument(),
  setTimer = setTimeout,
  clearTimer = clearTimeout,
  now = Date.now,
  headers = { accept: "application/json" },
  cache,
} = {}) {
  if (typeof request !== "function" && typeof request !== "string") throw new TypeError("startJsonPolling requires a request");
  if (typeof onData !== "function") throw new TypeError("startJsonPolling requires onData");
  if (!(intervalMs > 0)) throw new TypeError("startJsonPolling requires intervalMs");
  if (typeof fetchImpl !== "function") return () => {};

  let stopped = false;
  let timer = null;
  let inFlight = false;
  let dueAt = null;
  let pendingDelay = immediate ? 0 : intervalMs;
  let nextDelay = intervalMs;
  const canPoll = () => (typeof shouldPoll === "function" ? shouldPoll() : !hidden(documentRef));

  const clear = () => {
    if (timer != null) clearTimer(timer);
    timer = null;
  };
  const schedule = (delay) => {
    pendingDelay = Math.max(0, delay);
    dueAt = now() + pendingDelay;
    if (stopped || timer != null || !canPoll()) return;
    timer = setTimer(run, pendingDelay);
  };
  const scheduleAfterFailure = () => {
    nextDelay = Math.min(maxBackoffMs, Math.max(intervalMs, nextDelay * 2));
    schedule(nextDelay);
  };
  const scheduleAfterSuccess = () => {
    nextDelay = intervalMs;
    schedule(intervalMs);
  };

  const read = async () => {
    const target = typeof request === "function" ? request() : request;
    if (!target) return false;
    const init = { headers };
    if (cache) init.cache = cache;
    const response = await fetchImpl(target, init);
    if (!response?.ok) throw new Error(`poll HTTP ${response?.status || 0}`);
    const data = await response.json();
    if (!isData(data)) throw new Error("poll payload rejected");
    if (!stopped) onData(data);
    return true;
  };

  async function run() {
    timer = null;
    dueAt = null;
    if (stopped || !canPoll()) return;
    if (inFlight) { schedule(nextDelay); return; }
    inFlight = true;
    try {
      const ok = await read();
      if (!stopped) {
        if (!ok) onError();
        (ok ? scheduleAfterSuccess : scheduleAfterFailure)();
      }
    } catch {
      if (!stopped) {
        onError();
        scheduleAfterFailure();
      }
    } finally {
      inFlight = false;
    }
  }

  const sync = () => {
    if (stopped) return;
    if (canPoll()) {
      const delay = dueAt == null ? pendingDelay : Math.max(0, dueAt - now());
      if (!timer && !inFlight) schedule(delay);
    } else {
      clear();
    }
  };
  documentRef?.addEventListener?.("visibilitychange", sync);
  schedule(pendingDelay);

  const stop = () => {
    stopped = true;
    clear();
    documentRef?.removeEventListener?.("visibilitychange", sync);
  };
  stop.sync = sync;
  return stop;
}
