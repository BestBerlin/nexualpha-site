import React, { useEffect } from "react";

export const LIVE_LABELS = {
  en: "LIVE", "zh-Hans": "实时", "zh-Hant": "即時", es: "EN VIVO", "pt-BR": "AO VIVO",
  fr: "EN DIRECT", de: "LIVE", it: "IN DIRETTA", ja: "ライブ", ko: "실시간", ru: "ОНЛАЙН",
  tr: "CANLI", id: "LANGSUNG", vi: "TRỰC TIẾP", ar: "مباشر", ur: "براہ راست", uk: "НАЖИВО",
};
export function LiveBadge({ locale }) {
  return <span className="h7-board-live"><i aria-hidden="true" />{LIVE_LABELS[locale] || LIVE_LABELS.en}</span>;
}

// The SSR markup remains untouched until hydration has finished and the browser is idle.
export function useBoardMotion(ref, locale) {
  useEffect(() => {
    let stopped = false, cleanup;
    const run = () => import("./home7-board-motion.js").then(({ startBoardMotion }) => {
      if (!stopped && ref.current) cleanup = startBoardMotion(ref.current, locale);
    });
    const idle = typeof requestIdleCallback === "function";
    const id = idle ? requestIdleCallback(run) : setTimeout(run, 200);
    return () => { stopped = true; idle ? cancelIdleCallback(id) : clearTimeout(id); cleanup?.(); };
  }, [ref, locale]);
}
