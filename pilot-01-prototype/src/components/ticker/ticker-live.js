// Ticker polling (lazy chunk, loaded by TickerBar after first paint): one shared subscription store for all live market
// widgets. It polls only our cached endpoint while the tab is visible. Never an exchange URL from the browser.
import { startJsonPolling } from "../shared/json-polling.js";

const TICKER_URL = "/api/ticker.json";
export const TICKER_REFRESH_MS = 15 * 1000;

const validSnapshot = (value) => Boolean(value && Array.isArray(value.items) && value.items.length);
const listeners = new Set();
let latest = null;
let stopPolling = null;

function publish(next) {
  latest = next;
  for (const listener of [...listeners]) listener(next);
}

function ensurePolling({ everyMs = TICKER_REFRESH_MS, fetchImpl, documentRef, setTimer, clearTimer, now } = {}) {
  if (stopPolling) return;
  stopPolling = startJsonPolling({
    request: TICKER_URL,
    intervalMs: everyMs,
    onData: publish,
    isData: validSnapshot,
    fetchImpl,
    documentRef,
    setTimer,
    clearTimer,
    now,
    cache: "no-cache",
  });
}

export function subscribe(fn, options = {}) {
  if (typeof fn !== "function") throw new TypeError("subscribe requires a function");
  listeners.add(fn);
  if (latest) fn(latest);
  ensurePolling(options);
  return () => {
    listeners.delete(fn);
    if (listeners.size === 0) {
      stopPolling?.();
      stopPolling = null;
    }
  };
}

export function startTickerPolling(onData, options = {}) {
  return subscribe(onData, options);
}
