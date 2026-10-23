// Shared client behaviour of the data pages: start from the server-rendered feed (hydration state), then re-read
// /intel/market-events.json every 60 s while the tab is visible. A failed read keeps the last good feed on screen.
import { useEffect, useState } from "react";
// The light nav module, not market-data-pages.js: home7-funding imports this hook, and the full data-page module
// would add ~55 KB gz to the home JS (release captain 2026-10-15).
import { DATA_PAGE_REFRESH_MS, MARKET_EVENTS_PATH } from "../../data/market-data-pages-nav.js";
import { startJsonPolling } from "../shared/json-polling.js";
import { scheduleVisible } from "../shared/visibility-scheduler.js";

export function useMarketEvents(initialFeed) {
  const [feed, setFeed] = useState(initialFeed ?? null);
  useEffect(() => {
    return startJsonPolling({
      request: initialFeed?.liquidations?.timeline?.detailsDeferred ? "/api/market-events/summary" : MARKET_EVENTS_PATH,
      intervalMs: DATA_PAGE_REFRESH_MS,
      immediate: !initialFeed,
      initialData: initialFeed,
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
export function useClientNow(enabled = true, intervalMs = null, target = null) {
  const [now, setNow] = useState(null);
  useEffect(() => {
    if (!enabled) return undefined;
    const doc = typeof document === "undefined" ? null : document;
    const delay = intervalMs ?? (prefersReducedMotion() ? 60 * 1000 : 1000);
    let stop = () => {};
    let visible = !target || typeof IntersectionObserver !== "function";
    const tick = () => setNow(Date.now());
    const sync = () => {
      stop();
      if (!visible || doc?.visibilityState === "hidden") return;
      tick();
      stop = scheduleVisible(tick, delay);
    };
    const observer = target && typeof IntersectionObserver === "function" ? new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      sync();
    }) : null;
    observer?.observe(target);
    sync();
    doc?.addEventListener?.("visibilitychange", sync);
    return () => {
      stop();
      observer?.disconnect();
      doc?.removeEventListener?.("visibilitychange", sync);
    };
  }, [enabled, intervalMs, target]);
  return now;
}
