// Home rail (2026-10-12): the latest 5 flash items, refreshed every 60 s, linking into /flash on our own site.
// The home page is prerendered, so the server ships the frame with five fixed-height placeholder rows (no layout shift)
// and the browser fills them from /content/flash.json once the rail approaches the viewport. Styles: home7.src.css.
import React, { useEffect, useRef, useState } from "react";
import { localizedHref } from "../../data/locale-routing.js";
import { FLASH_FEED_URL, FLASH_PATH, FLASH_REFRESH_MS, flashRailCopy } from "../../data/flash-path.js";

const ROWS = 5;

export function FlashRail({ locale = "en" }) {
  const copy = flashRailCopy(locale);
  const [items, setItems] = useState(null);
  const ref = useRef(null);
  useEffect(() => {
    let off = false, timer = null, observer = null;
    const load = () => fetch(`${FLASH_FEED_URL}?${new URLSearchParams({ locale, limit: String(ROWS) })}`, { headers: { accept: "application/json" } })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => { if (!off && Array.isArray(data?.items)) setItems(data.items.slice(0, ROWS)); })
      .catch(() => {});
    const start = () => {
      if (timer) return;
      load();
      timer = setInterval(() => { if (document.visibilityState !== "hidden") load(); }, FLASH_REFRESH_MS);
    };
    if (typeof IntersectionObserver === "function" && ref.current) {
      observer = new IntersectionObserver((entries) => { if (entries.some((entry) => entry.isIntersecting)) { observer.disconnect(); start(); } }, { rootMargin: "600px 0px" });
      observer.observe(ref.current);
    } else start();
    return () => { off = true; observer?.disconnect(); if (timer) clearInterval(timer); };
  }, [locale]);
  const rows = items || Array.from({ length: ROWS }, () => null);
  return <section className="h7-in h7-flash" aria-labelledby="h7-flash-h" ref={ref}>
    <div className="h7-flash-head">
      <h2 id="h7-flash-h"><span className="h7-flash-dot" aria-hidden="true" />{copy.title}</h2>
      <a href={localizedHref(FLASH_PATH, { locale })}>{copy.all}<span aria-hidden="true" className="h7-flash-arrow">→</span></a>
    </div>
    <ol className="h7-flash-list" aria-busy={items ? undefined : "true"}>
      {rows.map((item, index) => item
        ? <li key={item.id}>
          <time dateTime={item.time}><bdi>{String(item.time).slice(11, 16)}</bdi></time>
          <span className="h7-flash-tag" data-type={item.type}>{item.typeLabel}</span>
          <a href={localizedHref(item.path, { locale })} lang={item.lang !== locale ? item.lang : undefined} dir="auto">{item.headline}</a>
        </li>
        : <li key={`s${index}`} className="h7-flash-skel" aria-hidden="true"><span /><span /><span /></li>)}
    </ol>
  </section>;
}
