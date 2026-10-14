// Home "Today's movers" (owner 2026-10-13, replaces the "Popular coins" chip wall): one headline line from the market
// collector (24h liquidations, else BTC funding) linking to the data page, then the top 5 gainers and top 5 losers of the
// last 24h among the ~200 largest coins, each row linking to its /coins page. Two columns on desktop and compact stacked
// lists on mobile. The body markup comes from moversBodyHtml, the
// same string the Worker splices into the prerendered home, so the server frame and the hydrated frame are identical.
// Fixed row heights (five rows per list, with unavailable states or blank pads when short): no layout shift. Lives in the lazy
// below-the-fold chunk; after hydration it refreshes from /api/movers.json every 45 s, only while it is on screen and
// the tab is visible. No call-to-action in any locale.
import React, { useEffect, useRef, useState } from "react";
import { localizedHref } from "../../data/locale-routing.js";
import { moversBodyHtml, moversCopy } from "../../data/movers-html.js";
import { MOVERS_PATH, isMoversSnapshot } from "../../data/movers.js";
import { startJsonPolling } from "../shared/json-polling.js";
import "../../styles/v7/movers-owner.css";

export const MOVERS_REFRESH_MS = 45 * 1000;

function eachRow(snapshot) {
  return [...(snapshot?.up || []), ...(snapshot?.down || [])];
}

function changedKeys(before, after) {
  if (!isMoversSnapshot(before) || !isMoversSnapshot(after)) return [];
  const prev = new Map(eachRow(before).map((row) => [row.sym, `${row.price}|${row.change}`]));
  return eachRow(after).filter((row) => prev.has(row.sym) && prev.get(row.sym) !== `${row.price}|${row.change}`).map((row) => row.sym);
}

function updateAges(root, copy, now = Date.now()) {
  if (!root) return;
  root.querySelectorAll("[data-mv-age]").forEach((el) => {
    const at = Date.parse(el.getAttribute("datetime") || "");
    if (!Number.isFinite(at)) return;
    el.textContent = copy.age(Math.max(0, Math.floor((now - at) / 1000)));
  });
}

function selectorEscape(value) {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") return CSS.escape(value);
  return String(value).replace(/["\\]/g, "\\$&");
}

export function MoversBoard({ locale = "en", initial = null }) {
  const c = moversCopy(locale);
  const [data, setData] = useState(() => (isMoversSnapshot(initial) ? initial : null));
  const ref = useRef(null);
  const previousData = useRef(data);
  useEffect(() => {
    const el = ref.current;
    let visible = !(typeof IntersectionObserver === "function" && el);
    let hasData = isMoversSnapshot(initial);
    // One scheduler per mount: viewport exits pause it without resetting backoff or allowing overlapping fetches.
    const stopPolling = startJsonPolling({
      request: MOVERS_PATH,
      intervalMs: MOVERS_REFRESH_MS,
      isData: isMoversSnapshot,
      shouldPoll: () => (!hasData || visible) && document.visibilityState === "visible",
      onData: (snapshot) => { hasData = true; setData(snapshot); },
    });
    let observer = null;
    if (typeof IntersectionObserver === "function" && el) {
      observer = new IntersectionObserver((entries) => {
        visible = entries.some((e) => e.isIntersecting);
        stopPolling.sync?.();
      });
      observer.observe(el);
      stopPolling.sync?.();
    } else stopPolling.sync?.();
    return () => { stopPolling(); observer?.disconnect(); };
  }, []);
  useEffect(() => {
    updateAges(ref.current, c);
    const timer = window.setInterval(() => updateAges(ref.current, c), 1000);
    return () => window.clearInterval(timer);
  }, [locale, data]);
  useEffect(() => {
    const keys = changedKeys(previousData.current, data);
    previousData.current = data;
    if (!keys.length || !ref.current) return;
    const run = () => {
      for (const key of keys) {
        const row = ref.current?.querySelector(`[data-mv-key="${selectorEscape(key)}"]`);
        row?.classList.add("h7-mv-flash");
        window.setTimeout(() => row?.classList.remove("h7-mv-flash"), 900);
      }
    };
    if (typeof window.requestAnimationFrame === "function") window.requestAnimationFrame(run);
    else run();
  }, [data]);
  return <section className="h7-in h7-mv h7-mv-owner" id="h7-movers" aria-labelledby="h7-mv-h" data-testid="home-movers" ref={ref}>
    <div className="h7-mv-head">
      <h2 id="h7-mv-h"><span className="h7-mv-dot" aria-hidden="true" />{c.title}</h2>
      <a className="h7-mv-all" href={localizedHref("/coins", { locale })}>{c.all}<span aria-hidden="true" className="h7-mv-arrow">→</span></a>
    </div>
    <div className="h7-mv-body" data-mv="body" dangerouslySetInnerHTML={{ __html: moversBodyHtml(data, locale) }} />
  </section>;
}
