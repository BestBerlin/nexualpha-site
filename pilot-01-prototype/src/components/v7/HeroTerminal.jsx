import { useEffect, useMemo, useRef, useState } from "react";
import { startJsonPolling } from "../shared/json-polling.js";
import { usd } from "./home7-shared.jsx";

const TICKER_URL = "/api/ticker.json";
const TERMINAL_REFRESH_MS = 45 * 1000;
const SYMBOLS = Object.freeze(["BTC", "ETH", "SOL"]);

const COPY = Object.freeze({
  en: { title: "Market terminal", ticker: "Price ticker", estimate: "Estimate", route: "Fee route" },
  "zh-Hans": { title: "行情终端", ticker: "价格行情", estimate: "估算", route: "费用路径" },
  "zh-Hant": { title: "行情終端", ticker: "價格行情", estimate: "估算", route: "費用路徑" },
  es: { title: "Terminal de mercado", ticker: "Precios", estimate: "Estimación", route: "Ruta de comisiones" },
  "pt-BR": { title: "Terminal de mercado", ticker: "Preços", estimate: "Estimativa", route: "Rota de taxas" },
  fr: { title: "Terminal de marché", ticker: "Cours", estimate: "Estimation", route: "Trajet des frais" },
  de: { title: "Marktterminal", ticker: "Kurse", estimate: "Schätzung", route: "Gebührenpfad" },
  it: { title: "Terminale mercato", ticker: "Prezzi", estimate: "Stima", route: "Percorso fee" },
  ja: { title: "マーケット端末", ticker: "価格", estimate: "推定", route: "手数料経路" },
  ko: { title: "마켓 터미널", ticker: "가격", estimate: "추정", route: "수수료 경로" },
  tr: { title: "Piyasa terminali", ticker: "Fiyatlar", estimate: "Tahmin", route: "Ücret yolu" },
  ar: { title: "طرفية السوق", ticker: "الأسعار", estimate: "تقدير", route: "مسار الرسوم" },
  ru: { title: "Рыночный терминал", ticker: "Цены", estimate: "Оценка", route: "Маршрут комиссий" },
  id: { title: "Terminal pasar", ticker: "Harga", estimate: "Estimasi", route: "Jalur biaya" },
  vi: { title: "Bảng thị trường", ticker: "Giá", estimate: "Ước tính", route: "Luồng phí" },
  ur: { title: "مارکیٹ ٹرمینل", ticker: "قیمتیں", estimate: "اندازہ", route: "فیس راستہ" },
  uk: { title: "Ринковий термінал", ticker: "Ціни", estimate: "Оцінка", route: "Маршрут комісій" },
});

function copyFor(locale) {
  const raw = String(locale || "en");
  return COPY[raw] || COPY[raw.split("-")[0]] || COPY.en;
}

function isSnapshot(value) {
  return Boolean(value && Array.isArray(value.items) && value.items.some((item) => (
    SYMBOLS.includes(item?.sym) &&
    typeof item.price === "string" &&
    typeof item.change === "string" &&
    (item.dir == null || ["up", "down", "flat"].includes(item.dir))
  )));
}

function useElementVisibility(ref) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(([entry]) => setVisible(Boolean(entry?.isIntersecting)), { threshold: 0.05 });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return visible;
}

function MiniTicker({ data }) {
  const rows = SYMBOLS.map((sym) => data?.items?.find((item) => item?.sym === sym && typeof item.price === "string" && typeof item.change === "string") || { sym, price: "—", change: "—", dir: "flat" });
  return (
    <ul className="h7-terminal__ticker" dir="ltr">
      {rows.map((item) => (
        <li key={item.sym} data-dir={item.dir || "flat"}>
          <b>{item.sym}</b>
          <span>{item.price || "—"}</span>
          <i>{item.change || "—"}</i>
        </li>
      ))}
    </ul>
  );
}

function DecorativeFlow() {
  const bars = [36, 54, 28, 68, 42, 58, 34, 72, 46, 62, 38, 52];
  return (
    <div className="h7-terminal__flow" aria-hidden="true">
      <svg viewBox="0 0 280 92" role="presentation" focusable="false">
        <defs>
          <linearGradient id="h7-terminal-line" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#315CFF" />
            <stop offset="58%" stopColor="#3FA9FF" />
            <stop offset="100%" stopColor="#1FE0C0" />
          </linearGradient>
        </defs>
        <path className="h7-terminal__grid" d="M0 18H280M0 46H280M0 74H280M34 0V92M88 0V92M142 0V92M196 0V92M250 0V92" />
        <path className="h7-terminal__line" d="M6 64C28 40 42 54 58 42C78 27 92 29 112 48C132 66 150 35 166 28C190 18 198 48 218 42C238 36 248 22 274 31" />
        <circle className="h7-terminal__pulse" cx="218" cy="42" r="4" />
      </svg>
      <div className="h7-terminal__bars">
        {bars.map((height, index) => <span key={index} style={{ "--h": `${height}%`, "--d": `${index * 80}ms` }} />)}
      </div>
    </div>
  );
}

export function HeroTerminal({ locale = "en", selected, estimate, estimateLabel, initialTicker, neutral = false }) {
  const copy = copyFor(locale);
  const ref = useRef(null);
  const visible = useElementVisibility(ref);
  const [ticker, setTicker] = useState(() => (isSnapshot(initialTicker) ? initialTicker : null));
  const estimateText = useMemo(() => (Number.isFinite(Number(estimate)) ? usd(Number(estimate)) : "—"), [estimate]);

  useEffect(() => {
    const stop = startJsonPolling({
      request: TICKER_URL,
      intervalMs: TERMINAL_REFRESH_MS,
      onData: (next) => setTicker(next),
      isData: isSnapshot,
      shouldPoll: () => visible && (typeof document === "undefined" || document.visibilityState !== "hidden"),
      cache: "no-cache",
    });
    return stop;
  }, [visible]);

  return (
    <article ref={ref} className={`h7-terminal${neutral ? " h7-terminal--neutral" : ""}`} aria-label={copy.title} data-brand={selected?.slug || "none"} data-visible={visible ? "true" : "false"}>
      <div className="h7-terminal__chrome" aria-hidden="true">
        <span />
      </div>
      <div className="h7-terminal__head">
        <span>{copy.ticker}</span>
        <b>{selected?.name || "NexuAlpha"}</b>
      </div>
      <MiniTicker data={ticker} />
      <DecorativeFlow />
      {!neutral ? <dl className="h7-terminal__estimate">
        <div>
          <dt>{estimateLabel ? `${estimateLabel} · ${copy.estimate}` : copy.estimate}</dt>
          <dd>{estimateText}</dd>
        </div>
        <div>
          <dt>{copy.route}</dt>
          <dd>{selected?.share ? `${Math.round(selected.share * 100)}%` : "—"}</dd>
        </div>
      </dl> : null}
    </article>
  );
}
