// Home rail (2026-10-12): the latest 5 flash items, refreshed every 60 s, linking into /flash on our own site.
// The home page now ships the latest request-time snapshot in SSR HTML and the browser replaces it from
// /api/live.json after hydration. HomeV7 loads this module as its own chunk when the rail scrolls near
// (DeferUntilVisible), so it stays out of the entry. Styles: home7.src.css.
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { localizedHref } from "../../data/locale-routing.js";
import { dataStatusCopy } from "../../content/data-status-copy.js";
import { formatSgt } from "../../data/local-time.js";
import { moversCopy } from "../../data/movers-html.js";
import { subscribeLiveAge, relativeFeedTime } from "../shared/live-age.js";
import "../../styles/v7/flash-rail.css";
import { FLASH_PATH } from "../../data/flash-path.js";
import { LIVE_HUB_REFRESH_MS, subscribeLiveHub } from "../shared/live-hub.js";

// Same values as FLASH_FEED_URL / FLASH_REFRESH_MS in flash.js (not imported: that module carries the page strings).
const FLASH_REFRESH_MS = LIVE_HUB_REFRESH_MS;

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
  return { title: title.split(" · ")[0], all };
}

const ROWS = 5;

function initialRows(initial) {
  return Array.isArray(initial?.items) ? initial.items.filter((item) => item && typeof item.headline === "string" && typeof item.path === "string" && typeof item.time === "string").slice(0, ROWS) : null;
}

export function FlashRail({ locale = "en", initial }) {
  const copy = flashRailCopy(locale);
  const [items, setItems] = useState(() => initialRows(initial));
  const [updatedAt, setUpdatedAt] = useState(initial?.generatedAt || null);
  const ref = useRef(null);
  const positions = useRef(new Map());
  const newKeys = useRef(new Set());
  useEffect(() => {
    let visible = false, stopAge = null;
    const ages = (now) => {
      if (Math.floor(now / 1000) % 30 !== 0) return;
      ref.current?.querySelectorAll("time[data-flash-relative]").forEach((time) => {
        time.textContent = relativeFeedTime(time.dateTime, locale, now);
      });
    };
    const syncAge = () => {
      ref.current?.toggleAttribute("data-paused", !visible || document.visibilityState !== "visible");
      stopAge?.(); stopAge = visible ? subscribeLiveAge(ages) : null;
    };
    const stopHub = subscribeLiveHub("flash", (data) => {
      if (!visible || !Array.isArray(data?.items)) return;
        const next = initialRows(data);
        if (!next?.length) return;
        const existing = new Set();
        ref.current?.querySelectorAll("li[data-flash-key]").forEach((row) => {
          existing.add(row.dataset.flashKey);
          positions.current.set(row.dataset.flashKey, row.getBoundingClientRect().top);
        });
        newKeys.current = new Set(next.filter((item) => !existing.has(item.id || item.path)).slice(0, 3).map((item) => item.id || item.path));
        setItems(next); setUpdatedAt(data.generatedAt || next[0]?.time);
    }, { locale });
    const observer = typeof IntersectionObserver === "function" ? new IntersectionObserver((entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
      syncAge();
    }) : null;
    if (observer && ref.current) observer.observe(ref.current);
    else { visible = true; syncAge(); }
    document.addEventListener("visibilitychange", syncAge);
    return () => { observer?.disconnect(); stopHub(); stopAge?.(); document.removeEventListener("visibilitychange", syncAge); };
  }, [locale]);
  useLayoutEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let index = 0;
    ref.current?.querySelectorAll("li[data-flash-key]").forEach((row) => {
      const key = row.dataset.flashKey;
      if (newKeys.current.has(key)) {
        row.animate?.([{ opacity: 0, transform: "translateY(-8px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 280, delay: index++ * 60, easing: "cubic-bezier(.16,1,.3,1)" });
        row.classList.remove("hx-flash-new"); void row.offsetWidth; row.classList.add("hx-flash-new");
      } else if (positions.current.has(key)) {
        const delta = positions.current.get(key) - row.getBoundingClientRect().top;
        if (delta) row.animate?.([{ transform: `translateY(${delta}px)` }, { transform: "translateY(0)" }], { duration: 320, easing: "cubic-bezier(.16,1,.3,1)" });
      }
    });
    positions.current.clear(); newKeys.current.clear();
  }, [items]);
  const rows = items || [];
  return <section className="h7-in h7-flash" id="h7-flash" aria-labelledby="h7-flash-h" ref={ref} data-paused>
    <div className="h7-flash-head">
      <h2 id="h7-flash-h"><span className="h7-flash-dot" aria-hidden="true" />{copy.title}</h2>
      <a href={localizedHref(FLASH_PATH, { locale })}>{copy.all}<span aria-hidden="true" className="h7-flash-arrow">→</span></a>
    </div>
    <ol className="h7-flash-list" >
      {!rows.length && <li role="status">{dataStatusCopy(locale).empty}</li>}
      {rows.map((item) => <li key={item.id || item.path} data-flash-key={item.id || item.path} data-important={item.important || undefined}>
          <time dateTime={item.time} data-flash-relative title={formatSgt(item.time, locale, "clock")}>{relativeFeedTime(item.time, locale, Date.parse(initial?.generatedAt || item.time))}</time>
          <span className="h7-flash-tag" data-type={item.type} data-important={item.important ? "true" : undefined}>{item.typeLabel}</span>
          <a href={localizedHref(item.path, { locale })} lang={item.lang !== locale ? item.lang : undefined} dir="auto">{item.headline}</a>
        </li>)}
      {Array.from({ length: Math.max(0, ROWS - Math.max(1, rows.length)) }, (_, i) => <li className="hx-flash-pad" aria-hidden="true" key={`pad-${i}`} />)}
    </ol>
    {updatedAt && <p className="hx-flash-updated">{moversCopy(locale).updated(formatSgt(updatedAt, locale, "clock"))}</p>}
  </section>;
}
