export const JSON_POLL_TIMEOUT_MS = 15_000;
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
  timeoutMs = JSON_POLL_TIMEOUT_MS,
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
  if (!(timeoutMs > 0) || !Number.isFinite(timeoutMs)) throw new TypeError("startJsonPolling requires a finite timeoutMs");
  if (typeof fetchImpl !== "function") return () => {};

  let stopped = false;
  let timer = null;
  let inFlight = false;
  let activeRound = null;
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

  const read = async (signal) => {
    const target = typeof request === "function" ? request() : request;
    if (!target) throw new Error("poll request unavailable");
    const init = { headers, signal };
    if (cache) init.cache = cache;
    const response = await fetchImpl(target, init);
    // A timed-out fetch implementation may ignore abort and still resolve.
    if (signal.aborted) throw new Error("poll aborted");
    if (!response?.ok) throw new Error(`poll HTTP ${response?.status || 0}`);
    const data = await response.json();
    if (signal.aborted) throw new Error("poll aborted");
    if (!isData(data)) throw new Error("poll payload rejected");
    return data;
  };

  function run() {
    timer = null;
    dueAt = null;
    if (stopped || !canPoll()) return;
    if (inFlight) { schedule(nextDelay); return; }
    inFlight = true;
    const controller = new AbortController();
    const round = { controller, deadline: null };
    activeRound = round;
    const finish = (error, data) => {
      if (stopped || activeRound !== round) return;
      clearTimer(round.deadline);
      activeRound = null;
      inFlight = false;
      if (error) {
        onError(error);
        scheduleAfterFailure();
      } else {
        try { onData(data); } catch (deliveryError) {
          onError(deliveryError);
          scheduleAfterFailure();
          return;
        }
        scheduleAfterSuccess();
      }
    };
    // Keep one deadline across both fetch and body decoding. Do not depend on
    // fetch honoring AbortSignal to release the polling loop.
    round.deadline = setTimer(() => {
      const error = new Error("poll deadline exceeded");
      error.name = "TimeoutError";
      controller.abort();
      finish(error);
    }, timeoutMs);
    read(controller.signal).then(data => finish(null, data), error => finish(error));
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
    if (activeRound) {
      clearTimer(activeRound.deadline);
      activeRound.controller.abort();
      activeRound = null;
      inFlight = false;
    }
    documentRef?.removeEventListener?.("visibilitychange", sync);
  };
  stop.sync = sync;
  return stop;
}
