// Home "Today's movers" (owner 2026-10-13, replaces the "Popular coins" chip wall): one headline line from the market
// collector (24h liquidations, else BTC funding) linking to the data page, then the top 5 gainers and top 5 losers of the
// last 24h among the ~100 largest coins, each row linking to its /coins page. Two columns on desktop; on mobile two tabs
// (plain radio inputs + CSS, so they work before this chunk hydrates). The body markup comes from moversBodyHtml, the
// same string the Worker splices into the prerendered home, so the server frame and the hydrated frame are identical.
// Fixed row heights (five rows per list, skeletons or blank pads when short): no layout shift. Lives in the lazy
// below-the-fold chunk; after hydration it refreshes from /api/movers.json every 60 s, only while it is on screen and
// the tab is visible. No call-to-action in any locale.
import React, { useEffect, useRef, useState } from "react";
import { localizedHref } from "../../data/locale-routing.js";
import { moversBodyHtml, moversCopy } from "../../data/movers-html.js";
import { MOVERS_PATH, isMoversSnapshot } from "../../data/movers.js";

export const MOVERS_REFRESH_MS = 60 * 1000;

export function MoversBoard({ locale = "en", initial = null }) {
  const c = moversCopy(locale);
  const [data, setData] = useState(() => (isMoversSnapshot(initial) ? initial : null));
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    let off = false, timer = null, visible = false, last = 0;
    const load = () => {
      if (off || document.visibilityState === "hidden") return;
      last = Date.now();
      fetch(MOVERS_PATH, { headers: { accept: "application/json" } })
        .then((r) => (r.ok ? r.json() : null))
        .then((next) => { if (!off && isMoversSnapshot(next)) setData(next); })
        .catch(() => {});
    };
    // At most one request per 60 s; the first one as soon as the board is on screen (the SSR frame may be minutes old).
    const tick = () => { if (visible && Date.now() - last >= MOVERS_REFRESH_MS - 1000) load(); };
    const start = () => { if (!timer) { tick(); timer = setInterval(tick, MOVERS_REFRESH_MS); } };
    const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
    const onVisibility = () => { if (document.visibilityState === "visible" && visible) tick(); };
    let observer = null;
    if (typeof IntersectionObserver === "function" && el) {
      observer = new IntersectionObserver((entries) => {
        visible = entries.some((e) => e.isIntersecting);
        if (visible) start(); else stop();
      });
      observer.observe(el);
    } else { visible = true; start(); }
    document.addEventListener("visibilitychange", onVisibility);
    return () => { off = true; stop(); observer?.disconnect(); document.removeEventListener("visibilitychange", onVisibility); };
  }, []);
  return <section className="h7-in h7-mv" id="h7-movers" aria-labelledby="h7-mv-h" data-testid="home-movers" ref={ref}>
    <div className="h7-mv-head">
      <h2 id="h7-mv-h"><span className="h7-mv-dot" aria-hidden="true" />{c.title}</h2>
      <a className="h7-mv-all" href={localizedHref("/coins", { locale })}>{c.all}<span aria-hidden="true" className="h7-mv-arrow">→</span></a>
    </div>
    <input type="radio" name="h7-mv-tab" id="h7-mv-t-up" className="h7-mv-r" defaultChecked />
    <input type="radio" name="h7-mv-tab" id="h7-mv-t-dn" className="h7-mv-r" />
    <div className="h7-mv-tabs"><label htmlFor="h7-mv-t-up">{c.up}</label><label htmlFor="h7-mv-t-dn">{c.down}</label></div>
    <div className="h7-mv-body" data-mv="body" dangerouslySetInnerHTML={{ __html: moversBodyHtml(data, locale) }} />
  </section>;
}
