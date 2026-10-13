// Ticker polling (lazy chunk, loaded by TickerBar after first paint): our own cached endpoint every 30 s while the tab
// is visible, plus once when it becomes visible again. Never an exchange URL from the browser.
import { startJsonPolling } from "../shared/json-polling.js";

const TICKER_URL = "/api/ticker.json";
export const TICKER_REFRESH_MS = 30 * 1000;

export function startTickerPolling(onData, { everyMs = TICKER_REFRESH_MS, fetchImpl, documentRef, setTimer, clearTimer, now } = {}) {
  return startJsonPolling({ request: TICKER_URL, intervalMs: everyMs, onData, fetchImpl, documentRef, setTimer, clearTimer, now });
}
