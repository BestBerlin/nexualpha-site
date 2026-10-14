import { useEffect, useMemo, useRef } from "react";
import { usd } from "./home7-shared.jsx";

const SYMBOLS = Object.freeze(["BTC", "ETH", "SOL", "BNB", "XRP"]);
const PHONE_SYMBOLS = new Set(["BTC", "ETH", "SOL"]);

const COPY = Object.freeze({
  en: { title: "Market terminal", rebate: "Max yearly return", basis: "100K monthly volume · perpetual taker", pair: "BTC/USDT perpetual" },
  "zh-Hans": { title: "行情终端", rebate: "一年最高返还", basis: "月成交 $100K · 合约吃单", pair: "BTC/USDT 永续" },
  "zh-Hant": { title: "行情終端", rebate: "一年最高返還", basis: "月成交 $100K · 合約吃單", pair: "BTC/USDT 永續" },
  es: { title: "Terminal de mercado", rebate: "Devolución anual máxima", basis: "Volumen mensual $100K · taker perp", pair: "BTC/USDT perpetuo" },
  "pt-BR": { title: "Terminal de mercado", rebate: "Retorno anual máximo", basis: "Volume mensal de $100K · taker perp", pair: "BTC/USDT perpétuo" },
  fr: { title: "Terminal de marché", rebate: "Retour annuel maximal", basis: "Volume mensuel 100K $ · taker perp", pair: "BTC/USDT perpétuel" },
  de: { title: "Marktterminal", rebate: "Max. jährliche Rückzahlung", basis: "100K $ Monatsvolumen · Perp-Taker", pair: "BTC/USDT Perpetual" },
  it: { title: "Terminale mercato", rebate: "Ritorno annuo massimo", basis: "Volume mensile $100K · taker perp", pair: "BTC/USDT perpetuo" },
  ja: { title: "マーケット端末", rebate: "年間最大還元", basis: "月間出来高 $100K · perp taker", pair: "BTC/USDT 無期限" },
  ko: { title: "마켓 터미널", rebate: "연간 최대 환급", basis: "월 거래량 $100K · 무기한 taker", pair: "BTC/USDT 무기한" },
  tr: { title: "Piyasa terminali", rebate: "Azami yıllık iade", basis: "Aylık hacim $100K · perp taker", pair: "BTC/USDT sürekli" },
  ar: { title: "طرفية السوق", rebate: "أعلى استرداد سنوي", basis: "حجم شهري 100 ألف دولار · آخذ عقود دائمة", pair: "BTC/USDT دائم" },
  ru: { title: "Рыночный терминал", rebate: "Максимальный возврат за год", basis: "Объем $100K в месяц · perp taker", pair: "BTC/USDT бессрочный" },
  id: { title: "Terminal pasar", rebate: "Pengembalian tahunan maksimum", basis: "Volume bulanan $100K · taker perp", pair: "BTC/USDT perpetual" },
  vi: { title: "Bảng thị trường", rebate: "Hoàn lại tối đa mỗi năm", basis: "Khối lượng tháng $100K · taker perp", pair: "BTC/USDT vĩnh cửu" },
  ur: { title: "مارکیٹ ٹرمینل", rebate: "سالانہ زیادہ سے زیادہ واپسی", basis: "ماہانہ حجم $100K · perp taker", pair: "BTC/USDT perpetual" },
  uk: { title: "Ринковий термінал", rebate: "Максимальне річне повернення", basis: "Місячний обсяг $100K · perp taker", pair: "BTC/USDT безстроковий" },
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

function numberFromPrice(price) {
  const parsed = Number(String(price || "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function chartPath(values, actualSamples = values.length) {
  const points = values.length ? values.slice(-48) : [0];
  const min = Math.min(...points);
  const max = Math.max(...points);
  const pad = Math.max((max - min) * 0.08, max ? Math.abs(max) * 0.002 : 1);
  const low = min - pad;
  const high = max + pad;
  const span = high - low || 1;
  const step = points.length > 1 ? 400 / (points.length - 1) : 400;
  const coords = points.map((value, index) => {
    const x = Math.round(index * step * 100) / 100;
    const y = Math.round((150 - ((value - low) / span) * 150) * 100) / 100;
    return [x, y];
  });
  const line = coords.map(([x, y], index) => `${index ? "L" : "M"}${x} ${y}`).join("");
  const last = coords[coords.length - 1] || [400, 75];
  return {
    line,
    area: `${line}L400 150L0 150Z`,
    tip: last,
    mature: actualSamples >= 6,
  };
}

function tickerRows(data) {
  return SYMBOLS.map((sym) => data?.items?.find((item) => item?.sym === sym && typeof item.price === "string" && typeof item.change === "string") || { sym, price: "—", change: "—", dir: "flat" });
}

function Chart({ btc }) {
  const price = numberFromPrice(btc?.price) || 0;
  const spark = Array.isArray(btc?.spark) ? btc.spark.map(Number).filter(Number.isFinite) : [];
  const actualSamples = spark.length;
  const series = spark.length ? spark : [price, price];
  const path = chartPath(series, actualSamples);
  return (
    <svg className="ht-chart" viewBox="0 0 400 150" preserveAspectRatio="none" focusable="false">
      <defs>
        <linearGradient id="ht-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#315CFF" stopOpacity=".28" />
          <stop offset="1" stopColor="#315CFF" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g className="ht-grid"><path d="M0 37.5H400M0 75H400M0 112.5H400" /></g>
      <g className="ht-series" data-samples={actualSamples} data-mature={path.mature ? "true" : "false"}>
        <path className="ht-area" d={path.area} />
        <path className="ht-line" d={path.line} />
      </g>
      <circle className="ht-ring" cx={path.tip[0]} cy={path.tip[1]} r="3.5" />
      <circle className="ht-tip" cx={path.tip[0]} cy={path.tip[1]} r="3.5" />
    </svg>
  );
}

function DepthBars() {
  const asks = [0.42, 0.68, 0.34, 0.9, 0.56, 0.75];
  const bids = [0.62, 0.38, 0.82, 0.48, 0.7, 0.52];
  return (
    <div className="ht-depth" aria-hidden="true">
      <div className="ht-depth__side ht-depth__side--asks">{asks.map((w, i) => <i key={i} style={{ "--w": w }} />)}</div>
      <hr />
      <div className="ht-depth__side ht-depth__side--bids">{bids.map((w, i) => <i key={i} style={{ "--w": w }} />)}</div>
    </div>
  );
}

export function HeroTerminal({ locale = "en", selected, estimate, initialTicker, neutral = false }) {
  const copy = copyFor(locale);
  const ref = useRef(null);
  const ticker = isSnapshot(initialTicker) ? initialTicker : null;
  const rows = useMemo(() => tickerRows(ticker), [ticker]);
  const btc = rows.find((item) => item.sym === "BTC") || rows[0];
  const estimateValue = Number.isFinite(Number(estimate)) ? Math.max(0, Math.round(Number(estimate))) : null;
  const estimateText = estimateValue != null ? usd(estimateValue) : "—";
  const estimateNumber = estimateValue != null ? String(estimateValue) : "—";

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    let cancelled = false;
    let idleId = null;
    let idleHandle = false;
    let controller = null;
    const run = () => {
      if (cancelled) return;
      import("./hero-terminal.js")
        .then(({ initHeroTerminal }) => { if (!cancelled) controller = initHeroTerminal(element); })
        .catch(() => {});
    };
    const schedule = () => {
      if (typeof window.requestIdleCallback === "function") {
        idleHandle = true;
        idleId = window.requestIdleCallback(run, { timeout: 2500 });
      } else {
        idleId = setTimeout(run, 1200);
      }
    };
    const observer = typeof IntersectionObserver === "function"
      ? new IntersectionObserver(([entry]) => {
        if (entry?.isIntersecting) {
          observer.disconnect();
          schedule();
        }
      }, { rootMargin: "200px 0px", threshold: 0 })
      : null;
    if (observer) observer.observe(element); else schedule();
    return () => {
      cancelled = true;
      controller?.destroy?.();
      observer?.disconnect();
      if (idleId != null) {
        if (idleHandle && typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idleId);
        else clearTimeout(idleId);
      }
    };
  }, []);

  return (
    <figure
      ref={ref}
      className={`h7-terminal ht${neutral ? " h7-terminal--neutral ht--neutral" : ""}`}
      aria-hidden="true"
      data-brand={selected?.slug || "none"}
    >
      <div className="ht-frame">
        <div className="ht-screen">
          <ul className="ht-tick" data-compat="h7-terminal__ticker" dir="ltr">
            {rows.map((item) => (
              <li key={item.sym} data-sym={item.sym} data-dir={item.dir || "flat"} data-phone={PHONE_SYMBOLS.has(item.sym) ? "true" : "false"}>
                <b>{item.sym}</b>
                <span className="ht-p" data-ht={`${item.sym}-p`}>{item.price || "—"}</span>
                <span className="ht-c" data-ht={`${item.sym}-c`}>{item.change || "—"}</span>
              </li>
            ))}
          </ul>
          <div className="ht-head" dir="ltr">
            <b>{copy.pair}</b>
            <span className="ht-big" data-ht="BTC-p">{btc?.price || "—"}</span>
            <span className="ht-badge" data-ht="BTC-c" data-dir={btc?.dir || "flat"}>{btc?.change || "—"}</span>
          </div>
          <div className="ht-body">
            <Chart btc={btc} />
            <DepthBars />
          </div>
          {!neutral ? (
            <div className="ht-ret" data-venue={selected?.slug || "none"}>
              <span className="ht-ret-l">{copy.rebate} · {selected?.name || "NexuAlpha"}</span>
              <span className="ht-ret-v" aria-label={`+${estimateText}`}>+<span className="ht-ret-currency">$</span><span className="ht-ret-n" data-v={estimateNumber}>{estimateNumber}</span></span>
              <span className="ht-ret-a">{copy.basis}</span>
            </div>
          ) : null}
        </div>
      </div>
    </figure>
  );
}
