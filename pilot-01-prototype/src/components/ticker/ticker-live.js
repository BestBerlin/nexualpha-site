// Ticker polling (lazy chunk, loaded by TickerBar after first paint): our own cached endpoint every 30 s while the tab
// is visible, plus once when it becomes visible again. Never an exchange URL from the browser.
const TICKER_URL = "/api/ticker.json";
export const TICKER_REFRESH_MS = 30 * 1000;

export function startTickerPolling(onData, { everyMs = TICKER_REFRESH_MS } = {}) {
  let stopped = false;
  const load = async () => {
    if (stopped || document.visibilityState === "hidden") return;
    try {
      const response = await fetch(TICKER_URL, { headers: { accept: "application/json" } });
      if (!response.ok) return;
      const data = await response.json();
      if (!stopped) onData(data);
    } catch { /* keep the current frame */ }
  };
  load();
  const timer = setInterval(load, everyMs);
  const onVisible = () => { if (document.visibilityState === "visible") load(); };
  document.addEventListener("visibilitychange", onVisible);
  return () => { stopped = true; clearInterval(timer); document.removeEventListener("visibilitychange", onVisible); };
}
