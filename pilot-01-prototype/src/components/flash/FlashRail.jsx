// Home rail (2026-10-12): the latest 5 flash items, refreshed every 60 s, linking into /flash on our own site.
// The home page is prerendered, so the server ships the frame with five fixed-height placeholder rows (no layout shift)
// and the browser fills them from /api/flash.json once the rail approaches the viewport. HomeV7 loads this module
// as its own chunk when the rail scrolls near (DeferUntilVisible), so it stays out of the entry. Styles: home7.src.css.
import React, { useEffect, useRef, useState } from "react";
import { localizedHref } from "../../data/locale-routing.js";
import { FLASH_PATH } from "../../data/flash-path.js";

// Same values as FLASH_FEED_URL / FLASH_REFRESH_MS in flash.js (not imported: that module carries the page strings).
const FLASH_FEED_URL = "/api/flash.json";
const FLASH_REFRESH_MS = 60 * 1000;

// Rail strings (this module is its own lazy chunk on the home page).
const RAIL = {
  en: ["Flash · live updates", "View all"], "zh-Hans": ["快讯 · 实时更新", "查看全部"], "zh-Hant": ["快訊 · 即時更新", "查看全部"],
  es: ["Flash · en vivo", "Ver todo"], "pt-BR": ["Flash · ao vivo", "Ver tudo"], fr: ["Flash · en direct", "Tout voir"], de: ["Flash · live", "Alle ansehen"],
  it: ["Flash · live", "Vedi tutto"], ja: ["速報 · ライブ", "すべて見る"], ko: ["속보 · 실시간", "전체 보기"], ru: ["Флеш · онлайн", "Смотреть все"],
  tr: ["Flaş · canlı", "Tümünü gör"], id: ["Flash · langsung", "Lihat semua"], vi: ["Tin nhanh · trực tiếp", "Xem tất cả"], ar: ["عاجل · مباشر", "عرض الكل"],
  ur: ["فلیش · لائیو", "سب دیکھیں"], uk: ["Флеш · наживо", "Дивитися всі"],
};
export function flashRailCopy(locale) {
  const [title, all] = RAIL[locale] || (String(locale || "").startsWith("zh") ? RAIL["zh-Hans"] : RAIL.en);
  return { title, all };
}

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
  return <section className="h7-in h7-flash" id="h7-flash" aria-labelledby="h7-flash-h" ref={ref}>
    <div className="h7-flash-head">
      <h2 id="h7-flash-h"><span className="h7-flash-dot" aria-hidden="true" />{copy.title}</h2>
      <a href={localizedHref(FLASH_PATH, { locale })}>{copy.all}<span aria-hidden="true" className="h7-flash-arrow">→</span></a>
    </div>
    <ol className="h7-flash-list" aria-busy={items ? undefined : "true"}>
      {rows.map((item, index) => item
        ? <li key={item.id}>
          <time dateTime={item.time}><bdi>{String(item.time).slice(11, 16)}</bdi></time>
          <span className="h7-flash-tag" data-type={item.type} data-important={item.important ? "true" : undefined}>{item.typeLabel}</span>
          <a href={localizedHref(item.path, { locale })} lang={item.lang !== locale ? item.lang : undefined} dir="auto">{item.headline}</a>
        </li>
        : <li key={`s${index}`} className="h7-flash-skel" aria-hidden="true"><span /><span /><span /></li>)}
    </ol>
  </section>;
}
