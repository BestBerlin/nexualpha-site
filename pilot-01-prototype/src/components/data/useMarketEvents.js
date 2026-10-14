// Shared client behaviour of the data pages: start from the server-rendered feed (hydration state), then re-read
// /intel/market-events.json every 60 s while the tab is visible. A failed read keeps the last good feed on screen.
import { useEffect, useState } from "react";
import { DATA_PAGE_REFRESH_MS, MARKET_EVENTS_PATH } from "../../data/market-data-pages.js";
import { useVisibleClock } from "../shared/visible-clock.js";

export function useMarketEvents(initialFeed) {
  const [feed, setFeed] = useState(initialFeed ?? null);
  useEffect(() => {
    let alive = true;
    const load = () => fetch(MARKET_EVENTS_PATH, { headers: { accept: "application/json" }, cache: "no-cache" })
      .then((r) => (r.ok ? r.json() : null))
      .then((next) => { if (alive && next && typeof next === "object" && next.generatedAt) setFeed(next); })
      .catch(() => { /* keep the last good feed; the page already says when it was generated */ });
    if (!initialFeed) load();
    const id = setInterval(() => { if (typeof document === "undefined" || document.visibilityState === "visible") load(); }, DATA_PAGE_REFRESH_MS);
    return () => { alive = false; clearInterval(id); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- initialFeed is the hydration seed only
  return feed;
}

export const prefersReducedMotion = () => typeof window !== "undefined" && typeof window.matchMedia === "function"
  && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Second ticker that only runs after mount, so SSR and the first client render agree (no countdown on the server).
// With prefers-reduced-motion the clock ticks once a minute (countdowns show hh:mm), so no digits change every second.
export function useClientNow(enabled = true) {
  const now = useVisibleClock(null, { everyMs: prefersReducedMotion() ? 60 * 1000 : 30 * 1000 });
  return enabled ? now : null;
}
