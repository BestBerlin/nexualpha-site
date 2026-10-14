// Shared client behaviour of the data pages: start from the server-rendered feed (hydration state), then re-read
// /intel/market-events.json every 60 s while the tab is visible. A failed read keeps the last good feed on screen.
import { useEffect, useState } from "react";
import { DATA_PAGE_REFRESH_MS, MARKET_EVENTS_PATH } from "../../data/market-data-pages.js";
import { startJsonPolling } from "../shared/json-polling.js";

export function useMarketEvents(initialFeed) {
  const [feed, setFeed] = useState(initialFeed ?? null);
  useEffect(() => {
    return startJsonPolling({
      request: MARKET_EVENTS_PATH,
      intervalMs: DATA_PAGE_REFRESH_MS,
      immediate: !initialFeed,
      cache: "no-cache",
      isData: (next) => Boolean(next && typeof next === "object" && next.generatedAt),
      onData: setFeed,
      onError: () => { /* keep the last good feed; the page already says when it was generated */ },
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- initialFeed is the hydration seed only
  return feed;
}

export const prefersReducedMotion = () => typeof window !== "undefined" && typeof window.matchMedia === "function"
  && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Second ticker that only runs after mount, so SSR and the first client render agree (no countdown on the server).
// With prefers-reduced-motion the clock ticks once a minute (countdowns show hh:mm), so no digits change every second.
export function useClientNow(enabled = true, intervalMs = null) {
  const [now, setNow] = useState(null);
  useEffect(() => {
    if (!enabled) return undefined;
    const doc = typeof document === "undefined" ? null : document;
    const delay = intervalMs ?? (prefersReducedMotion() ? 60 * 1000 : 1000);
    let id = null;
    const clear = () => {
      if (id !== null) clearInterval(id);
      id = null;
    };
    const tick = () => setNow(Date.now());
    const sync = () => {
      clear();
      if (doc?.visibilityState === "hidden") return;
      tick();
      id = setInterval(tick, delay);
    };
    sync();
    doc?.addEventListener?.("visibilitychange", sync);
    return () => {
      clear();
      doc?.removeEventListener?.("visibilitychange", sync);
    };
  }, [enabled, intervalMs]);
  return now;
}
