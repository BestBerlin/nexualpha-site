import React, { useEffect, useRef, useState } from "react";
import { localizedHref } from "../../data/locale-routing.js";
import { WHALES_API_PATH, isWhalesSnapshot, whalesBodyHtml, whalesCopy } from "../../data/whales-home.js";
import { startJsonPolling } from "../shared/json-polling.js";
import "../../styles/v7/movers-owner.css";

export const MOVERS_REFRESH_MS = 60 * 1000;

function eachRow(snapshot) {
  return [...(snapshot?.signals || []), ...(snapshot?.positions || []), ...(snapshot?.transfers || []), ...(snapshot?.rows || [])];
}

function changedKeys(before, after) {
  if (!isWhalesSnapshot(before) || !isWhalesSnapshot(after)) return [];
  const key = (row, index) => String(row.id || row.txHash || `${row.coin || row.asset || row.symbol || "row"}-${index}`);
  const prev = new Set(eachRow(before).map(key));
  return eachRow(after).map(key).filter((rowKey) => !prev.has(rowKey));
}

function selectorEscape(value) {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") return CSS.escape(value);
  return String(value).replace(/["\\]/g, "\\$&");
}

export function MoversBoard({ locale = "en", initial = null }) {
  const c = whalesCopy(locale);
  const [data, setData] = useState(() => (isWhalesSnapshot(initial) ? initial : null));
  const ref = useRef(null);
  const previousData = useRef(data);
  useEffect(() => {
    const el = ref.current;
    let visible = !(typeof IntersectionObserver === "function" && el);
    let hasData = isWhalesSnapshot(initial);
    // The SSR snapshot is fresh: no request on mount, first refresh after one interval. Identical boards are not re-rendered.
    let shownHtml = hasData ? whalesBodyHtml(initial, locale) : "";
    const stopPolling = startJsonPolling({
      request: `${WHALES_API_PATH}?view=home`,
      intervalMs: MOVERS_REFRESH_MS,
      immediate: !hasData,
      isData: isWhalesSnapshot,
      shouldPoll: () => (!hasData || visible) && document.visibilityState === "visible",
      onData: (snapshot) => {
        hasData = true;
        const html = whalesBodyHtml(snapshot, locale);
        if (html === shownHtml) return;
        shownHtml = html;
        setData(snapshot);
      },
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
  return <section className="h7-in h7-mv h7-mv-owner h7-whales" id="h7-whales" aria-labelledby="h7-mv-h" data-testid="home-whales" ref={ref}>
    <div className="h7-mv-head">
      <h2 id="h7-mv-h"><span className="h7-mv-dot" aria-hidden="true" />{c.title}</h2>
      <a className="h7-mv-all" href={localizedHref("/whales", { locale })}>{c.all}<span aria-hidden="true" className="h7-mv-arrow">→</span></a>
    </div>
    <div className="h7-mv-body" data-mv="body" dangerouslySetInnerHTML={{ __html: whalesBodyHtml(data, locale) }} />
  </section>;
}
