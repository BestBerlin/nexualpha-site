import React, { useEffect, useRef, useState } from "react";
import { localizedHref } from "../../data/locale-routing.js";
import { WHALES_API_PATH, isWhalesSnapshot, whalesBodyHtml, whalesCopy } from "../../data/whales-home.js";
import { startJsonPolling } from "../shared/json-polling.js";
import "../../styles/v7/movers-owner.css";
import { LiveBadge, useBoardMotion } from "./home7-board-motion.jsx";

export const MOVERS_REFRESH_MS = 60 * 1000;

export function MoversBoard({ locale = "en", initial = null }) {
  const c = whalesCopy(locale);
  const [data, setData] = useState(() => (isWhalesSnapshot(initial) ? initial : null));
  // The worker splices the rows into the server HTML but the client gets no snapshot prop. Keep those rows (read once
  // from the DOM) until a fetched board differs; rendering the empty board first dropped every row and rebuilt them,
  // which shifted the page once the board moved up next to the hero (owner 2026-10-22, CLS 0.18 on /ru at 1440).
  const [serverBody] = useState(() => (typeof document === "undefined" || data ? "" : document.querySelector('#h7-whales [data-mv="body"]')?.innerHTML || ""));
  const ref = useRef(null);
  useBoardMotion(ref, locale);
  useEffect(() => {
    const el = ref.current;
    let visible = !(typeof IntersectionObserver === "function" && el);
    let hasData = isWhalesSnapshot(initial);
    // The SSR snapshot is fresh: no request on mount, first refresh after one interval. Identical boards are not re-rendered.
    let shownHtml = hasData ? whalesBodyHtml(initial, locale) : serverBody;
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
  return <section className="h7-in h7-mv h7-mv-owner h7-whales" id="h7-whales" aria-labelledby="h7-mv-h" data-testid="home-whales" ref={ref}>
    <div className="h7-mv-head">
      <h2 id="h7-mv-h"><span className="h7-mv-dot" aria-hidden="true" />{c.title}<LiveBadge locale={locale} /></h2>
      <a className="h7-mv-all" href={localizedHref("/whales", { locale })}>{c.all}<span aria-hidden="true" className="h7-mv-arrow">→</span></a>
    </div>
    <div className="h7-mv-body" data-mv="body" dangerouslySetInnerHTML={{ __html: data || !serverBody ? whalesBodyHtml(data, locale) : serverBody }} />
  </section>;
}
