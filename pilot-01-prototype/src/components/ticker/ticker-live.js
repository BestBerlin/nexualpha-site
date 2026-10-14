// Ticker polling (lazy chunk, loaded by TickerBar after first paint): subscribe to the shared live hub so home does not
// run separate ticker, movers, flash and funding timers.
import { LIVE_HUB_REFRESH_MS, subscribeLiveHub } from "../shared/live-hub.js";

export const TICKER_REFRESH_MS = LIVE_HUB_REFRESH_MS;

const validSnapshot = (value) => Boolean(value && Array.isArray(value.items) && value.items.length);
const listeners = new Set();
let latest = null;

function publish(next) {
  latest = next;
  for (const listener of [...listeners]) listener(next);
}

export function subscribe(fn, options = {}) {
  if (typeof fn !== "function") throw new TypeError("subscribe requires a function");
  listeners.add(fn);
  if (latest) fn(latest);
  const stopHub = subscribeLiveHub("ticker", (snapshot) => {
    if (validSnapshot(snapshot)) publish(snapshot);
  }, options);
  return () => {
    listeners.delete(fn);
    stopHub();
  };
}

export function startTickerPolling(onData, options = {}) {
  return subscribe(onData, options);
}
