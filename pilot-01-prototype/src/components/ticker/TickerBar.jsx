// Hydration-stable market strip. Two accessible/hidden copies loop at every width; the idle-loaded runtime
// measures the list, pauses background motion and polls the cached feed (6 s visible, 30 s hidden).
// Feed changes tween and briefly tint digits; reduced motion keeps only the colour cue and manual scrolling.
import React, { useEffect, useRef, useState } from "react";
import { localizedHref } from "../../data/locale-routing.js";
import "./ticker.css";
import { METRIC_LABELS } from "../../data/ticker-labels.js";

export const TICKER_BAR_SYMBOLS = ["BTC", "ETH", "SOL", "BNB", "XRP", "DOGE", "HYPE"];
const COIN_SLUG = { BTC: "bitcoin", ETH: "ethereum", SOL: "solana", BNB: "bnb", XRP: "xrp", DOGE: "dogecoin", HYPE: "hyperliquid" };
// [region label, mover label]
const COPY = {
  en: ["Market prices, 24h change", "Top mover"], "zh-Hans": ["行情 · 24 小时涨跌", "最大异动"], "zh-Hant": ["行情 · 24 小時漲跌", "最大異動"],
  es: ["Precios del mercado, cambio 24 h", "Mayor movimiento"], "pt-BR": ["Preços do mercado, variação 24 h", "Maior variação"], fr: ["Cours du marché, variation 24 h", "Plus forte variation"],
  de: ["Marktpreise, 24-Std.-Änderung", "Größte Bewegung"], it: ["Prezzi di mercato, variazione 24 h", "Maggiore variazione"], ja: ["相場・24時間騰落", "最大変動"],
  ko: ["시세 · 24시간 변동", "최대 변동"], ru: ["Цены рынка, изменение за 24 ч", "Лидер движения"], tr: ["Piyasa fiyatları, 24 saatlik değişim", "En çok hareket"],
  id: ["Harga pasar, perubahan 24 jam", "Pergerakan terbesar"], vi: ["Giá thị trường, biến động 24 giờ", "Biến động mạnh nhất"], ar: ["أسعار السوق، تغيّر 24 ساعة", "الأكثر تحركًا"],
  ur: ["مارکیٹ قیمتیں، 24 گھنٹے کی تبدیلی", "سب سے بڑی حرکت"], uk: ["Ціни ринку, зміна за 24 год", "Лідер руху"],
};
const copyFor = (locale) => COPY[locale] || (String(locale || "").startsWith("zh") ? COPY["zh-Hans"] : COPY.en);
const validSnapshot = (value) => Boolean(value && Array.isArray(value.items) && value.items.length);
const EMPTY = "—";


function Row({ item, locale, hidden }) {
  return <li className="nx-ticker__item" data-sym={item.sym} data-dir={item.dir || "flat"}>
    <a href={localizedHref(`/coins/${COIN_SLUG[item.sym]}`, { locale })} tabIndex={hidden ? -1 : undefined}>
      <b translate="no">{item.sym}</b>
      <span className="nx-ticker__p" data-tk={`${item.sym}-p`} suppressHydrationWarning>{item.price || EMPTY}</span>
      <span className="nx-ticker__c" data-tk={`${item.sym}-c`} suppressHydrationWarning>{item.change || EMPTY}</span>
    </a>
  </li>;
}



function List({ items, mover, metrics, label, locale, hidden }) {
  return <ul className="nx-ticker__list" aria-hidden={hidden ? "true" : undefined}>
    {items.map((item) => <Row key={item.sym} item={item} locale={locale} hidden={hidden} />)}
    <li className="nx-ticker__item nx-ticker__item--mover" data-sym="mover" data-dir={mover?.dir || "flat"}>
      <span className="nx-ticker__l">{label}</span>
      <b translate="no" data-tk="mover-sym" suppressHydrationWarning>{mover?.sym || EMPTY}</b>
      <span className="nx-ticker__c" data-tk="mover-c" suppressHydrationWarning>{mover?.change || EMPTY}</span>
    </li>
    {(metrics || []).map(metric => <li className="nx-ticker__item nx-ticker__item--mover" key={metric.id}>
      <span className="nx-ticker__l">{(METRIC_LABELS[locale] || METRIC_LABELS.en)[metric.id === "btc-funding" ? 0 : 1]}</span>
      <span className="nx-ticker__p">{metric.value}</span>
    </li>)}
  </ul>;
}

export function TickerBar({ locale = "en", initial = null }) {
  const [data, setData] = useState(() => (validSnapshot(initial) ? initial : null));
  const rootRef = useRef(null);

  useEffect(() => {
    let off = false, stop = null, handle = null;
    const start = () => import("./ticker-live.js")
      .then(({ startTickerMotion }) => { if (!off) stop = startTickerMotion(rootRef.current, (next) => { if (validSnapshot(next)) setData(next); }, data); })
      .catch(() => {});
    // After first paint, off the critical path.
    if (typeof window.requestIdleCallback === "function") handle = window.requestIdleCallback(start, { timeout: 2500 });
    else handle = setTimeout(start, 1200);
    return () => {
      off = true;
      if (typeof window.cancelIdleCallback === "function" && typeof window.requestIdleCallback === "function") window.cancelIdleCallback(handle); else clearTimeout(handle);
      stop?.();
    };
  }, []);
  const [label, moverLabel] = copyFor(locale);
  const items = TICKER_BAR_SYMBOLS.flatMap((sym) => { const item = data?.items?.find((item) => item?.sym === sym); return item ? [item] : (["DOGE", "HYPE"].includes(sym) ? [] : [{ sym, price: EMPTY, change: EMPTY, dir: "flat" }]); });
  return <div ref={rootRef} className="nx-ticker" role="region" aria-label={label} dir={["ar", "ur"].includes(locale) ? "rtl" : "ltr"} data-ticker-source={data?.source || "none"}>
    <div className="nx-ticker__viewport">
      <div className="nx-ticker__track">
        <List items={items} mover={data?.mover} metrics={data?.metrics} label={moverLabel} locale={locale} />
        <List items={items} mover={data?.mover} metrics={data?.metrics} label={moverLabel} locale={locale} hidden />
      </div>
    </div>
  </div>;
}

export default TickerBar;
