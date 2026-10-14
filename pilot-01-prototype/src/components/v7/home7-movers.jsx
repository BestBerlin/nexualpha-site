// Home "Today's movers" (owner 2026-10-13, replaces the "Popular coins" chip wall): one headline line from the market
// collector (24h liquidations, else BTC funding) linking to the data page, then the top 5 gainers and top 5 losers of the
// last 24h among the ~200 largest coins, each row linking to its /coins page. Two columns at every supported width. The body markup comes from moversBodyHtml, the
// same string the Worker splices into the prerendered home, so the server frame and the hydrated frame are identical.
// Fixed row heights (five rows per list, with unavailable states or blank pads when short): no layout shift. Lives in the lazy
// below-the-fold chunk; after hydration it refreshes from /api/movers.json every 30 s, only while it is on screen and
// the tab is visible. No call-to-action in any locale.
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { localizedHref } from "../../data/locale-routing.js";
import { moversBodyHtml, moversCopy } from "../../data/movers-html.js";
import { MOVERS_PATH, isMoversSnapshot } from "../../data/movers.js";
import { startJsonPolling } from "../shared/json-polling.js";
import "../../styles/v7/movers-owner.css";
import { subscribeLiveAge } from "../shared/live-age.js";

export const MOVERS_REFRESH_MS = 30 * 1000;

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
    const age = Math.max(0, Math.floor((now - at) / 1000));
    el.textContent = copy.age(age);
    root.toggleAttribute("data-stale", age > 300);
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
  const positions = useRef(new Map());
  useEffect(() => {
    const el = ref.current;
    let visible = !(typeof IntersectionObserver === "function" && el);
    let stopAge = null;
    const startAge = () => { stopAge?.(); stopAge = visible ? subscribeLiveAge((now) => updateAges(el, moversCopy(locale), now)) : null; };
    // One scheduler per mount: viewport exits pause it without resetting backoff or allowing overlapping fetches.
    const stopPolling = startJsonPolling({
      request: MOVERS_PATH,
      intervalMs: MOVERS_REFRESH_MS,
      isData: isMoversSnapshot,
      shouldPoll: () => visible && document.visibilityState === "visible",
      onData: (snapshot) => {
        el?.querySelectorAll("[data-mv-key]").forEach((row) => positions.current.set(row.dataset.mvKey, row.getBoundingClientRect().top));
        setData(snapshot);
      },
    });
    let observer = null;
    if (typeof IntersectionObserver === "function" && el) {
      observer = new IntersectionObserver((entries) => {
        visible = entries.some((e) => e.isIntersecting);
        startAge(); stopPolling.sync?.();
      });
      observer.observe(el);
      stopPolling.sync?.();
    } else { startAge(); stopPolling.sync?.(); }
    return () => { stopPolling(); observer?.disconnect(); stopAge?.(); };
  }, [locale]);
  useLayoutEffect(() => {
    const before = previousData.current;
    previousData.current = data;
    const changed = new Set(changedKeys(before, data));
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const old = new Map(eachRow(before).map((row) => [row.sym, row]));
    ref.current?.querySelectorAll("[data-mv-key]").forEach((row) => {
      const key = row.dataset.mvKey;
      const delta = positions.current.has(key) ? positions.current.get(key) - row.getBoundingClientRect().top : 0;
      if (!reduced && delta) row.animate?.([{ transform: `translateY(${delta}px)` }, { transform: "translateY(0)" }], { duration: 320, easing: "cubic-bezier(.16,1,.3,1)" });
      else if (!reduced && before && !old.has(key)) row.animate?.([{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 240 });
      if (!reduced && changed.has(key)) {
        const next = eachRow(data).find((r) => r.sym === key);
        const number = (text) => Number(String(text).replace(/[^0-9.−-]/g, "").replace("−", "-"));
        row.dataset.flashDir = number(next.change) >= number(old.get(key).change) ? "up" : "down";
        row.classList.add("h7-mv-flash");
        row.addEventListener("animationend", () => { row.classList.remove("h7-mv-flash"); delete row.dataset.flashDir; }, { once: true });
      }
    });
    positions.current.clear();
    updateAges(ref.current, c);
  }, [data, locale]);
  return <section className="h7-in h7-mv h7-mv-owner" id="h7-movers" aria-labelledby="h7-mv-h" data-testid="home-movers" ref={ref}>
    <div className="h7-mv-head">
      <h2 id="h7-mv-h"><span className="h7-mv-dot" aria-hidden="true" />{c.title}</h2>
      <a className="h7-mv-all" href={localizedHref("/coins", { locale })}>{c.all}<span aria-hidden="true" className="h7-mv-arrow">→</span></a>
    </div>
    <span className="h7-sr" role="status">{data && data !== initial ? c.updated("") : ""}</span>
    <div className="h7-mv-body" data-mv="body" dangerouslySetInnerHTML={{ __html: moversBodyHtml(data, locale) }} />
  </section>;
}
