// Public data pages /liquidations and /funding-rates (owner 2026-10-10): hourly-updated numbers other sites and AI
// engines can cite. Everything here is pure and dependency-free so the worker (route metadata, JSON-LD), the SSR
// bundle and the browser share one reader and one copy table. The only data source is the market collector's feed
// (ops/market-collector/market-collector.mjs) served by nginx at MARKET_EVENTS_PATH; nothing is invented when it is
// missing — the pages render an "unavailable" state instead.
import { localizedPath } from "./locale-routing.js";
import { NEXUALPHA_PUBLISHER, RESEARCH_DESK } from "./brand-entity.js";
import { formatSgt } from "./local-time.js";

import { DATA_PAGE_NAV, DATA_PAGE_PATHS, FUNDING_RATES_PATH, LIQUIDATIONS_PATH, LIQUIDATION_HEATMAP_PATH, MARKET_EVENTS_PATH } from "./market-data-pages-nav.js";

export { DATA_PAGE_NAV, DATA_PAGE_PATHS, FUNDING_RATES_PATH, LIQUIDATIONS_PATH, LIQUIDATION_HEATMAP_PATH, MARKET_EVENTS_PATH };
export const DATA_PAGE_LOCALES = Object.freeze(["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "it", "ja", "ko", "ru", "tr", "id", "vi", "ar", "ur", "uk"]);
export const DATA_PAGE_REFRESH_MS = 60 * 1000;
// Annualised estimate: the current 8-hour rate repeated 3 times a day for 365 days (labelled as an estimate in the UI).
export const FUNDING_PERIODS_PER_YEAR = 3 * 365;
export const DATA_PAGE_SIGNUP_VENUES = Object.freeze(["okx", "bitget", "binance"]);
const PUBLIC_ORIGIN = "https://nexualpha.com";

const num = (v) => { const n = typeof v === "number" ? v : Number.parseFloat(v); return Number.isFinite(n) ? n : null; };
const isoOrNull = (v) => { const t = Date.parse(v); return Number.isFinite(t) ? new Date(t).toISOString() : null; };

// Feed symbols: Binance "SOLUSDT", OKX "OKX:SOLUSDT". Multiplier contracts keep their prefix ("1000PEPE").
export function splitSymbol(symbol) {
  const raw = String(symbol || "");
  const [venuePrefix, rest] = raw.includes(":") ? raw.split(":", 2) : [null, raw];
  const venue = venuePrefix ? (venuePrefix.toUpperCase() === "OKX" ? "OKX" : venuePrefix) : "Binance";
  const base = rest.replace(/(USDT|USDC|USD|BUSD)$/i, "") || rest;
  return { base, venue, raw };
}

function readWindow(w) {
  if (!w || typeof w !== "object") return null;
  const longUsd = num(w.longUsd) ?? 0, shortUsd = num(w.shortUsd) ?? 0;
  const totalUsd = num(w.totalUsd) ?? longUsd + shortUsd;
  const topSymbols = (Array.isArray(w.topSymbols) ? w.topSymbols : [])
    .map((t) => ({ ...splitSymbol(t.symbol), usd: num(t.usd) ?? 0 }))
    .filter((t) => t.usd > 0)
    .map((t) => ({ ...t, share: totalUsd > 0 ? t.usd / totalUsd : 0 }));
  const largest = w.largest && num(w.largest.usd) > 0
    ? { ...splitSymbol(w.largest.symbol), side: w.largest.side === "short" ? "short" : "long", usd: num(w.largest.usd), at: isoOrNull(w.largest.at) }
    : null;
  return { longUsd, shortUsd, totalUsd, orders: num(w.orders) ?? 0, longShare: totalUsd > 0 ? longUsd / totalUsd : 0.5, topSymbols, largest };
}

// null when the feed has no usable liquidation block (page shows the unavailable state).
export function readLiquidations(feed) {
  const l = feed?.liquidations;
  const generatedAt = isoOrNull(feed?.generatedAt);
  if (!l || !generatedAt) return null;
  const h1 = readWindow(l.h1), h4 = readWindow(l.h4), h24 = readWindow(l.h24);
  if (!h1 && !h4 && !h24) return null;
  return { generatedAt, source: typeof l.source === "string" ? l.source : "", coverageSince: isoOrNull(l.coverageSince), windows: { h1, h4, h24 } };
}

export const annualizedFunding = (rate) => (rate == null ? null : rate * FUNDING_PERIODS_PER_YEAR);

// null when the collector has not written a `funding` block yet (older collector) or it is empty.
export function readFunding(feed) {
  const f = feed?.funding;
  const generatedAt = isoOrNull(f?.generatedAt) || isoOrNull(feed?.generatedAt);
  if (!f || !generatedAt || !Array.isArray(f.rows)) return null;
  const rows = f.rows.map((r) => {
    const binanceRate = num(r.binanceRate), okxRate = num(r.okxRate);
    if (!r.symbol || (binanceRate == null && okxRate == null)) return null;
    return {
      symbol: String(r.symbol), binanceRate, okxRate,
      binanceNextAt: isoOrNull(r.binanceNextAt), okxNextAt: isoOrNull(r.okxNextAt),
      binanceApr: annualizedFunding(binanceRate), okxApr: annualizedFunding(okxRate),
    };
  }).filter(Boolean);
  if (!rows.length) return null;
  return { generatedAt, source: typeof f.source === "string" ? f.source : "", rows };
}

// Liquidation history written by the collector (ops/market-collector/market-history.mjs) under `history`: hourly
// points, daily totals (UTC days; the current day is partial) and records. null when the collector has not written
// it yet (older collector). `collecting` is true while fewer than two days exist — the page then says so instead of
// drawing a chart from one bar.
export const HISTORY_MIN_DAYS = 2;
export function readHistory(feed) {
  const h = feed?.history;
  if (!h || typeof h !== "object") return null;
  const since = isoOrNull(h.since);
  if (!since) return null;
  const daily = (Array.isArray(h.daily) ? h.daily : [])
    .filter((d) => d && /^\d{4}-\d{2}-\d{2}$/.test(String(d.day)))
    .map((d) => {
      const longUsd = num(d.longUsd) ?? 0, shortUsd = num(d.shortUsd) ?? 0;
      return { day: String(d.day), longUsd, shortUsd, totalUsd: num(d.totalUsd) ?? longUsd + shortUsd, hours: num(d.hours) ?? 0, partial: d.partial === true };
    })
    .sort((a, b) => a.day.localeCompare(b.day));
  const hourly = (Array.isArray(h.hourly) ? h.hourly : [])
    .map((p) => ({ t: isoOrNull(p?.t), totalUsd: num(p?.totalUsd) ?? 0, longUsd: num(p?.longUsd) ?? 0, shortUsd: num(p?.shortUsd) ?? 0, h24Usd: num(p?.h24Usd) ?? null }))
    .filter((p) => p.t);
  const largest = h.records?.largestDay && num(h.records.largestDay.totalUsd) != null
    ? { day: String(h.records.largestDay.day), totalUsd: num(h.records.largestDay.totalUsd), partial: h.records.largestDay.partial === true }
    : null;
  const days = num(h.days) ?? daily.length;
  return {
    since, updatedAt: isoOrNull(h.updatedAt), days, daily, hourly,
    avgDailyUsd: num(h.avgDailyUsd),
    records: { largestDay: largest, todayRankInMonth: num(h.records?.todayRankInMonth), daysInMonth: num(h.records?.daysInMonth) ?? 0 },
    collecting: daily.length < HISTORY_MIN_DAYS,
  };
}

// What the server embeds for hydration: the data blocks, the history summary and majors, never the 80 headlines.
export function compactMarketEvents(feed) {
  if (!feed || typeof feed !== "object") return null;
  const out = { generatedAt: feed.generatedAt ?? null };
  if (feed.liquidations) out.liquidations = feed.liquidations;
  if (feed.funding) out.funding = feed.funding;
  if (feed.history) out.history = feed.history;
  if (Array.isArray(feed.market?.majors)) out.market = { majors: feed.market.majors };
  return out;
}

// Embeddable widgets (2026-10-11): GET /embed/<kind> is a self-contained HTML page served by server/embed-widgets.mjs,
// /embed/<kind>.js injects it as a responsive iframe. These snippets are what the "Embed this" block shows.
export const EMBED_PATH_PREFIX = "/embed/";
export const EMBED_KINDS = Object.freeze({ liquidations: { path: LIQUIDATIONS_PATH, height: 360 }, "funding-rates": { path: FUNDING_RATES_PATH, height: 400 } });
export const EMBED_MAX_HEIGHT = 400;
export const embedKindForPath = (pathname) => Object.keys(EMBED_KINDS).find((kind) => EMBED_KINDS[kind].path === pathname) || null;
export const embedSource = (kind) => `embed-${kind}`;
export function embedSnippets(kind, locale = "en", { origin = PUBLIC_ORIGIN, theme = "dark" } = {}) {
  const spec = EMBED_KINDS[kind];
  if (!spec) return null;
  const title = dataPageCopy(locale)[kind === "liquidations" ? "liquidations" : "funding"].h1;
  const query = `?locale=${encodeURIComponent(locale)}&theme=${theme}`;
  const src = `${origin}${EMBED_PATH_PREFIX}${kind}${query}`;
  return {
    src,
    iframe: `<iframe src="${src}" title="${title.replace(/"/g, "&quot;")} — NexuAlpha" width="100%" height="${spec.height}" loading="lazy" style="border:0;max-width:100%;border-radius:12px"></iframe>`,
    script: `<script src="${origin}${EMBED_PATH_PREFIX}${kind}.js" data-locale="${locale}" data-theme="${theme}" async></script>`,
  };
}

// Deterministic formatting (same string on the server and in every browser, so hydration never mismatches).
export function formatUsdCompact(value) {
  const n = num(value);
  if (n == null) return "—";
  const abs = Math.abs(n);
  const fmt = (v, unit) => { const d = v >= 100 ? 0 : v >= 10 ? 1 : 2; return `${v.toFixed(d)}${unit}`; };
  const body = abs >= 1e9 ? fmt(abs / 1e9, "B") : abs >= 1e6 ? fmt(abs / 1e6, "M") : abs >= 1e3 ? fmt(abs / 1e3, "K") : abs.toFixed(0);
  return `${n < 0 ? "−" : ""}$${body}`;
}
export function formatUsdFull(value) {
  const n = num(value);
  if (n == null) return "—";
  return `$${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}
export function formatRatePct(rate, digits = 4) {
  const n = num(rate);
  if (n == null) return "—";
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  return `${sign}${(Math.abs(n) * 100).toFixed(digits)}%`;
}
export function formatUtc(iso, { seconds = false } = {}) {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "—";
  return formatSgt(iso, "en", seconds ? "seconds" : "stamp");
}
export function formatUtcTime(iso) {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "—";
  return formatSgt(iso, "en", "clock");
}
// seconds: false gives hh:mm (the reduced-motion clock ticks once a minute).
export function formatCountdown(ms, { seconds = true } = {}) {
  if (!(ms > 0)) return seconds ? "00:00:00" : "00:00";
  const s = Math.floor(ms / 1000);
  const parts = [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60];
  return (seconds ? parts : parts.slice(0, 2)).map((n) => String(n).padStart(2, "0")).join(":");
}

const COPY = {
  en: {
    nav: DATA_PAGE_NAV["en"],
    common: {
      home: "Home", updated: "Updated", source: "Source", refresh: "Re-reads the feed every 60 seconds while this page is open. Times are SGT.",
      unavailableTitle: "Live data is temporarily unavailable", unavailable: "The feed refreshes every few minutes. Nothing is estimated while it is missing — try again shortly.",
      explainer: "What this page shows", faq: "Frequently asked questions", relatedData: "More live data", json: "Raw JSON feed",
      embedTitle: "Embed this on your site", embedIntro: "Paste one of these snippets. The widget shows the same live numbers as this page, fits any column width and links back here.",
      embedIframe: "iframe", embedScript: "Script tag", copy: "Copy", copied: "Copied", embedTerms: "Free to embed. Keep the attribution link; the figures are a lower bound from Binance and OKX, refreshed every five minutes.",
      poweredBy: "Powered by NexuAlpha", embedUpdated: "updated",
    },
    liquidations: {
      title: "Crypto Liquidations Today — Live 1h / 4h / 24h Totals | NexuAlpha",
      description: "Live crypto futures liquidations today: 1h, 4h and 24h totals, long vs short split, most liquidated symbols and the largest single order on Binance and OKX.",
      h1: "Crypto liquidations today",
      lead: "How much leveraged crypto was force-closed in the last hour, four hours and 24 hours on Binance and OKX futures, split into long and short positions.",
      h1Window: "Last 1 hour", h4Window: "Last 4 hours", h24Window: "Last 24 hours", total: "Total liquidated",
      longs: "Longs liquidated", shorts: "Shorts liquidated", orders: (n) => `${n} orders`, split: "Long vs short (24h)",
      topTitle: "Most liquidated symbols (24h)", colSymbol: "Symbol", colVenue: "Exchange", colUsd: "Liquidated", colShare: "Share",
      largestTitle: "Largest single liquidation (24h)", sideLong: "long", sideShort: "short", largestLine: (s) => `${s.base} ${s.side} on ${s.venue}`,
      sourceLine: "Binance USDT-M force-order stream + OKX liquidation orders",
      coverage: "Counting since",
      historyTitle: "Last 30 days", historyLead: "Daily liquidation totals on Binance and OKX futures, summed from hourly snapshots over each UTC day, longs and shorts stacked.",
      historyCollecting: (date) => `History is being collected since ${date}. The 30-day chart appears once two full days exist.`,
      historyChartLabel: "Daily liquidation totals, last 30 days", historyAvg: "30-day average", historyToday: "Today so far", historyLargest: "Largest day in the window",
      historyPartial: "Today's bar covers only the hours collected so far (UTC).", historyAxis: "Day of month (UTC)", historyDays: (n) => `${n} days of history`,
      historyVsAvg: ({ direction, pct, now, avg }) => direction === "near" ? `The last 24 hours (${now}) are in line with the 30-day daily average (${avg}).` : `The last 24 hours (${now}) are ${pct}% ${direction === "above" ? "above" : "below"} the 30-day daily average (${avg}).`,
      historyRank: (rank, days) => `Today ranks ${rank} of ${days} days this month by liquidation volume (1 = largest).`,
      explainer: [
        "A liquidation happens when a leveraged futures position loses so much margin that the exchange force-closes it. The position is sold (long) or bought back (short) at market, which often pushes the price further in the same direction.",
        "A long squeeze is a wave of long liquidations during a fall; a short squeeze is the mirror image during a rally. When both columns are large in the same window, longs and shorts were both wiped out — traders call this a double kill (多空双杀): a sharp move in one direction followed by a sharp reversal.",
        "The figures come from Binance's public force-order stream, which sends at most one order per symbol per second, plus OKX's liquidation-order endpoint for BTC, ETH, SOL, XRP and DOGE. They are a lower bound for two exchanges, not the whole market, and they are not investment advice.",
      ],
      faq: [
        ["What is a crypto liquidation?", "A liquidation is the forced closing of a leveraged position by the exchange when its margin falls below the maintenance requirement. The trader loses the margin; the exchange closes the position at market to stop further losses."],
        ["Why are long and short liquidations shown separately?", "Long liquidations happen when the price falls, short liquidations when it rises. The split shows which side of the market was caught out. Large numbers on both sides in the same window point to a sharp move followed by a reversal (多空双杀)."],
        ["Where does this data come from and how complete is it?", "From Binance's public USDT-M force-order WebSocket stream and OKX's public liquidation-orders API, aggregated by NexuAlpha every five minutes. Binance sends at most one order per symbol per second, so the totals are a lower bound and cover only these two exchanges."],
        ["How often is this page updated?", "The collector rewrites the feed every five minutes and the page re-reads it every 60 seconds while open. The timestamp above the numbers shows when the feed was last generated, in SGT."],
      ],
      datasetName: "NexuAlpha live crypto liquidations (Binance + OKX)",
      datasetDescription: "Aggregated futures liquidations over 1h, 4h and 24h windows: long and short USD totals, order counts, most liquidated symbols and the largest single order. Lower bound from two exchanges, rewritten every five minutes.",
    },
    funding: {
      title: "Crypto Funding Rates — Binance vs OKX Perpetuals, Live | NexuAlpha",
      description: "Live perpetual funding rates on Binance and OKX for the top 20 symbols: current rate, annualized estimate and next funding time. Positive: longs pay shorts.",
      h1: "Crypto funding rates: Binance vs OKX",
      lead: "Current funding rate per period for the most traded USDT perpetual contracts, with an annualized estimate and the next settlement time on each exchange.",
      colSymbol: "Symbol", colBinance: "Binance", colOkx: "OKX", colApr: "Annualized (est.)", colNext: "Next funding", perPeriod: "per period",
      estNote: "Annualized estimate = current rate × 3 × 365, assuming the 8-hour rate repeats all year. A comparison aid, not a forecast.",
      legend: "Positive: longs pay shorts. Negative: shorts pay longs.", nextIn: "in",
      sourceLine: "Binance USDT-M premiumIndex + OKX public funding-rate API · top symbols by Binance 24h volume",
      explainer: [
        "Perpetual futures never expire, so exchanges use funding payments to keep the contract price near the spot index. Every funding period (usually 8 hours) one side pays the other: when the rate is positive longs pay shorts, when it is negative shorts pay longs.",
        "A persistently high positive rate means the crowd is long and paying for it — a crowded trade that can unwind quickly. A negative rate means shorts are paying, which often appears after sharp drops. Comparing Binance with OKX shows where the same position is cheaper to hold.",
        "Rates are read from each exchange's public API. The annualized column multiplies the current rate by 1,095 periods a year; it is a comparison aid, not a prediction. Some contracts settle every 4 hours or every hour on one venue — check the contract specification before trading.",
      ],
      faq: [
        ["What is a funding rate?", "A periodic payment between long and short holders of a perpetual contract that keeps its price close to the spot index. It is exchanged between traders, not paid to the exchange."],
        ["What does a positive or negative funding rate mean?", "Positive: longs pay shorts and the market leans long. Negative: shorts pay longs and the market leans short. Size matters: 0.01% per 8 hours is the common neutral baseline on Binance; 0.1% or more is unusually high."],
        ["How is the annualized rate calculated?", "Annualized = current rate × 3 periods per day × 365 days. It assumes the current rate persists, which it rarely does, so treat it as a comparison aid rather than an expected return."],
        ["Why do Binance and OKX show different rates?", "Each exchange computes funding from its own order book and index, with its own interest-rate component, caps and sometimes a different interval. That gap is why traders compare venues before holding a position."],
      ],
      datasetName: "NexuAlpha live perpetual funding rates (Binance + OKX)",
      datasetDescription: "Current funding rate and next funding time for the top 20 USDT perpetual symbols on Binance and OKX, read from the exchanges' public APIs and rewritten every five minutes.",
    },
  },
  "zh-Hans": {
    nav: DATA_PAGE_NAV["zh-Hans"],
    common: {
      home: "首页", updated: "更新于", source: "来源", refresh: "页面打开期间每 60 秒重新读取数据，时间均为 SGT。",
      unavailableTitle: "实时数据暂时不可用", unavailable: "数据源每几分钟刷新一次。数据缺失时不做任何估算，请稍后再试。",
      explainer: "本页说明", faq: "常见问题", relatedData: "更多实时数据", json: "原始 JSON 数据",
      embedTitle: "嵌入到你的网站", embedIntro: "复制下面任一代码。小组件显示与本页相同的实时数字，自动适配栏宽，并链接回本页。",
      embedIframe: "iframe", embedScript: "Script 标签", copy: "复制", copied: "已复制", embedTerms: "免费嵌入。请保留署名链接；数字是 Binance 与 OKX 的下限值，每五分钟刷新。",
      poweredBy: "由 NexuAlpha 提供", embedUpdated: "更新于",
    },
    liquidations: {
      title: "今日加密货币爆仓数据 — 1 小时 / 4 小时 / 24 小时实时统计 | NexuAlpha",
      description: "实时统计 Binance 与 OKX 合约爆仓：1h、4h、24h 总额，多空分布，爆仓最多的币种与最大单笔爆仓。",
      h1: "今日加密货币爆仓",
      lead: "过去 1 小时、4 小时和 24 小时内，Binance 与 OKX 合约被强制平仓的杠杆仓位规模，按多单与空单拆分。",
      h1Window: "过去 1 小时", h4Window: "过去 4 小时", h24Window: "过去 24 小时", total: "爆仓总额",
      longs: "多单爆仓", shorts: "空单爆仓", orders: (n) => `${n} 笔`, split: "多空分布（24 小时）",
      topTitle: "爆仓最多的币种（24 小时）", colSymbol: "币种", colVenue: "交易所", colUsd: "爆仓金额", colShare: "占比",
      largestTitle: "最大单笔爆仓（24 小时）", sideLong: "多单", sideShort: "空单", largestLine: (s) => `${s.venue} ${s.base} ${s.side}`,
      sourceLine: "Binance USDT 合约强平推送 + OKX 爆仓订单",
      coverage: "统计起点",
      historyTitle: "最近 30 天", historyLead: "Binance 与 OKX 合约的每日爆仓总额，按 UTC 日由每小时快照累加，多单与空单叠加显示。",
      historyCollecting: (date) => `历史数据自 ${date} 开始采集，累计满两天后显示 30 天图表。`,
      historyChartLabel: "每日爆仓总额（最近 30 天）", historyAvg: "30 天平均", historyToday: "今日至今", historyLargest: "区间内最大单日",
      historyPartial: "今日柱只包含已采集的小时（UTC）。", historyAxis: "日期（UTC）", historyDays: (n) => `已累计 ${n} 天`,
      historyVsAvg: ({ direction, pct, now, avg }) => direction === "near" ? `过去 24 小时（${now}）与 30 天日均（${avg}）基本持平。` : `过去 24 小时（${now}）比 30 天日均（${avg}）${direction === "above" ? "高" : "低"} ${pct}%。`,
      historyRank: (rank, days) => `按爆仓金额，今日在本月 ${days} 天中排第 ${rank}（1 为最大）。`,
      explainer: [
        "爆仓（强制平仓）指杠杆合约仓位亏损到保证金不足时，交易所强制以市价平掉该仓位：多单被卖出、空单被买回，往往会把价格继续推向同一方向。",
        "下跌中大量多单被平叫“多头挤压”，上涨中大量空单被平叫“空头挤压”。当同一时间窗内多空两栏都很大，就是多空双杀：先朝一个方向急拉，再迅速反转。",
        "数据来自 Binance 公开的强平推送（每个币种每秒最多推送一笔）以及 OKX 针对 BTC、ETH、SOL、XRP、DOGE 的公开爆仓订单接口。它只是两家交易所的下限，不代表全市场，也不构成投资建议。",
      ],
      faq: [
        ["什么是加密货币爆仓？", "当杠杆仓位的保证金低于维持要求时，交易所会强制以市价平仓，这就是爆仓。交易者损失保证金，交易所通过平仓阻止亏损继续扩大。"],
        ["为什么要把多单和空单爆仓分开显示？", "价格下跌时多单被爆，价格上涨时空单被爆。拆分后能看出哪一方被市场打中。同一时间窗内两侧都很大，说明出现了急涨急跌的反转，即多空双杀。"],
        ["数据来自哪里，完整吗？", "来自 Binance 公开的 USDT 合约强平 WebSocket 推送和 OKX 公开的爆仓订单 API，由 NexuAlpha 每五分钟汇总一次。Binance 每个币种每秒最多推送一笔，因此总额是下限，且只覆盖这两家交易所。"],
        ["页面多久更新一次？", "采集器每五分钟重写一次数据文件，页面打开期间每 60 秒重新读取。数字上方的时间戳是数据生成时间（SGT）。"],
      ],
      datasetName: "NexuAlpha 实时加密货币爆仓数据（Binance + OKX）",
      datasetDescription: "1 小时、4 小时、24 小时窗口内的合约爆仓汇总：多空美元总额、笔数、爆仓最多的币种与最大单笔。两家交易所的下限，每五分钟重写。",
    },
    funding: {
      title: "加密货币资金费率实时对比 — Binance vs OKX 永续合约 | NexuAlpha",
      description: "Binance 与 OKX 永续合约前 20 大币种实时资金费率：当前费率、年化估算与下次结算时间。正数为多头付费。",
      h1: "加密货币资金费率：Binance vs OKX",
      lead: "成交量最大的 USDT 永续合约当前每期资金费率，附年化估算与两家交易所的下次结算时间。",
      colSymbol: "币种", colBinance: "Binance", colOkx: "OKX", colApr: "年化（估算）", colNext: "下次结算", perPeriod: "每期",
      estNote: "年化估算 = 当前费率 × 3 × 365，假设 8 小时费率全年不变。仅用于横向比较，不是预测。",
      legend: "正数：多头付给空头；负数：空头付给多头。", nextIn: "剩余",
      sourceLine: "Binance USDT 合约 premiumIndex + OKX 公开资金费率 API · 按 Binance 24 小时成交量选取币种",
      explainer: [
        "永续合约没有到期日，交易所通过资金费用让合约价格贴近现货指数。每个结算周期（通常 8 小时）由一方付给另一方：费率为正时多头付给空头，为负时空头付给多头。",
        "持续偏高的正费率说明市场拥挤做多且在为此付费，这种拥挤交易可能快速反转；负费率说明空头在付费，常出现在急跌之后。对比 Binance 与 OKX 可以看出同一仓位在哪家持有更便宜。",
        "费率读取自各交易所公开 API。年化一栏把当前费率乘以每年 1095 期，仅作比较参考，不是预测。部分合约在某家交易所按 4 小时或 1 小时结算，交易前请核对合约规格。",
      ],
      faq: [
        ["什么是资金费率？", "永续合约多空双方之间定期交换的费用，用来让合约价格贴近现货指数。费用在交易者之间转移，不是付给交易所。"],
        ["正费率和负费率分别代表什么？", "正数：多头付给空头，市场偏多；负数：空头付给多头，市场偏空。幅度很重要：Binance 上每 8 小时 0.01% 是常见的中性基准，0.1% 以上属于异常偏高。"],
        ["年化费率怎么计算？", "年化 = 当前费率 × 每天 3 期 × 365 天。它假设当前费率持续不变，而这很少发生，所以应当看作比较工具而不是预期收益。"],
        ["为什么 Binance 和 OKX 的费率不同？", "每家交易所用自己的订单簿和指数计算资金费率，利率分量、上限以及结算周期也可能不同。正是这种差异让交易者在持仓前比较不同平台。"],
      ],
      datasetName: "NexuAlpha 实时永续合约资金费率（Binance + OKX）",
      datasetDescription: "Binance 与 OKX 前 20 大 USDT 永续币种的当前资金费率与下次结算时间，读取自交易所公开 API，每五分钟重写。",
    },
  },
  "zh-Hant": {
    nav: DATA_PAGE_NAV["zh-Hant"],
    common: {
      home: "首頁", updated: "更新於", source: "來源", refresh: "頁面開啟期間每 60 秒重新讀取資料，時間均為 SGT。",
      unavailableTitle: "即時資料暫時無法取得", unavailable: "資料來源每幾分鐘更新一次。資料缺失時不做任何估算，請稍後再試。",
      explainer: "本頁說明", faq: "常見問題", relatedData: "更多即時資料", json: "原始 JSON 資料",
      embedTitle: "嵌入到你的網站", embedIntro: "複製下面任一程式碼。小工具顯示與本頁相同的即時數字，自動適配欄寬，並連結回本頁。",
      embedIframe: "iframe", embedScript: "Script 標籤", copy: "複製", copied: "已複製", embedTerms: "免費嵌入。請保留署名連結；數字是 Binance 與 OKX 的下限值，每五分鐘更新。",
      poweredBy: "由 NexuAlpha 提供", embedUpdated: "更新於",
    },
    liquidations: {
      title: "今日加密貨幣爆倉數據 — 1 小時 / 4 小時 / 24 小時即時統計 | NexuAlpha",
      description: "即時統計 Binance 與 OKX 合約爆倉：1h、4h、24h 總額，多空分布，爆倉最多的幣種與最大單筆爆倉。",
      h1: "今日加密貨幣爆倉",
      lead: "過去 1 小時、4 小時和 24 小時內，Binance 與 OKX 合約被強制平倉的槓桿倉位規模，按多單與空單拆分。",
      h1Window: "過去 1 小時", h4Window: "過去 4 小時", h24Window: "過去 24 小時", total: "爆倉總額",
      longs: "多單爆倉", shorts: "空單爆倉", orders: (n) => `${n} 筆`, split: "多空分布（24 小時）",
      topTitle: "爆倉最多的幣種（24 小時）", colSymbol: "幣種", colVenue: "交易所", colUsd: "爆倉金額", colShare: "占比",
      largestTitle: "最大單筆爆倉（24 小時）", sideLong: "多單", sideShort: "空單", largestLine: (s) => `${s.venue} ${s.base} ${s.side}`,
      sourceLine: "Binance USDT 合約強平推送 + OKX 爆倉訂單",
      coverage: "統計起點",
      historyTitle: "最近 30 天", historyLead: "Binance 與 OKX 合約的每日爆倉總額，按 UTC 日由每小時快照累加，多單與空單疊加顯示。",
      historyCollecting: (date) => `歷史資料自 ${date} 開始採集，累計滿兩天後顯示 30 天圖表。`,
      historyChartLabel: "每日爆倉總額（最近 30 天）", historyAvg: "30 天平均", historyToday: "今日至今", historyLargest: "區間內最大單日",
      historyPartial: "今日柱只包含已採集的小時（UTC）。", historyAxis: "日期（UTC）", historyDays: (n) => `已累計 ${n} 天`,
      historyVsAvg: ({ direction, pct, now, avg }) => direction === "near" ? `過去 24 小時（${now}）與 30 天日均（${avg}）基本持平。` : `過去 24 小時（${now}）比 30 天日均（${avg}）${direction === "above" ? "高" : "低"} ${pct}%。`,
      historyRank: (rank, days) => `按爆倉金額，今日在本月 ${days} 天中排第 ${rank}（1 為最大）。`,
      explainer: [
        "爆倉（強制平倉）指槓桿合約倉位虧損到保證金不足時，交易所強制以市價平掉該倉位：多單被賣出、空單被買回，往往會把價格繼續推向同一方向。",
        "下跌中大量多單被平叫「多頭擠壓」，上漲中大量空單被平叫「空頭擠壓」。當同一時間窗內多空兩欄都很大，就是多空雙殺：先朝一個方向急拉，再迅速反轉。",
        "資料來自 Binance 公開的強平推送（每個幣種每秒最多推送一筆）以及 OKX 針對 BTC、ETH、SOL、XRP、DOGE 的公開爆倉訂單介面。它只是兩家交易所的下限，不代表全市場，也不構成投資建議。",
      ],
      faq: [
        ["什麼是加密貨幣爆倉？", "當槓桿倉位的保證金低於維持要求時，交易所會強制以市價平倉，這就是爆倉。交易者損失保證金，交易所透過平倉阻止虧損繼續擴大。"],
        ["為什麼要把多單和空單爆倉分開顯示？", "價格下跌時多單被爆，價格上漲時空單被爆。拆分後能看出哪一方被市場打中。同一時間窗內兩側都很大，說明出現了急漲急跌的反轉，即多空雙殺。"],
        ["資料來自哪裡，完整嗎？", "來自 Binance 公開的 USDT 合約強平 WebSocket 推送和 OKX 公開的爆倉訂單 API，由 NexuAlpha 每五分鐘彙總一次。Binance 每個幣種每秒最多推送一筆，因此總額是下限，且只涵蓋這兩家交易所。"],
        ["頁面多久更新一次？", "採集器每五分鐘重寫一次資料檔，頁面開啟期間每 60 秒重新讀取。數字上方的時間戳是資料生成時間（SGT）。"],
      ],
      datasetName: "NexuAlpha 即時加密貨幣爆倉資料（Binance + OKX）",
      datasetDescription: "1 小時、4 小時、24 小時窗口內的合約爆倉彙總：多空美元總額、筆數、爆倉最多的幣種與最大單筆。兩家交易所的下限，每五分鐘重寫。",
    },
    funding: {
      title: "加密貨幣資金費率即時對比 — Binance vs OKX 永續合約 | NexuAlpha",
      description: "Binance 與 OKX 永續合約前 20 大幣種即時資金費率：目前費率、年化估算與下次結算時間。正數為多頭付費。",
      h1: "加密貨幣資金費率：Binance vs OKX",
      lead: "成交量最大的 USDT 永續合約目前每期資金費率，附年化估算與兩家交易所的下次結算時間。",
      colSymbol: "幣種", colBinance: "Binance", colOkx: "OKX", colApr: "年化（估算）", colNext: "下次結算", perPeriod: "每期",
      estNote: "年化估算 = 目前費率 × 3 × 365，假設 8 小時費率全年不變。僅用於橫向比較，不是預測。",
      legend: "正數：多頭付給空頭；負數：空頭付給多頭。", nextIn: "剩餘",
      sourceLine: "Binance USDT 合約 premiumIndex + OKX 公開資金費率 API · 按 Binance 24 小時成交量選取幣種",
      explainer: [
        "永續合約沒有到期日，交易所透過資金費用讓合約價格貼近現貨指數。每個結算週期（通常 8 小時）由一方付給另一方：費率為正時多頭付給空頭，為負時空頭付給多頭。",
        "持續偏高的正費率說明市場擁擠做多且在為此付費，這種擁擠交易可能快速反轉；負費率說明空頭在付費，常出現在急跌之後。對比 Binance 與 OKX 可以看出同一倉位在哪家持有更便宜。",
        "費率讀取自各交易所公開 API。年化一欄把目前費率乘以每年 1095 期，僅作比較參考，不是預測。部分合約在某家交易所按 4 小時或 1 小時結算，交易前請核對合約規格。",
      ],
      faq: [
        ["什麼是資金費率？", "永續合約多空雙方之間定期交換的費用，用來讓合約價格貼近現貨指數。費用在交易者之間轉移，不是付給交易所。"],
        ["正費率和負費率分別代表什麼？", "正數：多頭付給空頭，市場偏多；負數：空頭付給多頭，市場偏空。幅度很重要：Binance 上每 8 小時 0.01% 是常見的中性基準，0.1% 以上屬於異常偏高。"],
        ["年化費率怎麼計算？", "年化 = 目前費率 × 每天 3 期 × 365 天。它假設目前費率持續不變，而這很少發生，所以應當看作比較工具而不是預期收益。"],
        ["為什麼 Binance 和 OKX 的費率不同？", "每家交易所用自己的訂單簿和指數計算資金費率，利率分量、上限以及結算週期也可能不同。正是這種差異讓交易者在持倉前比較不同平台。"],
      ],
      datasetName: "NexuAlpha 即時永續合約資金費率（Binance + OKX）",
      datasetDescription: "Binance 與 OKX 前 20 大 USDT 永續幣種的目前資金費率與下次結算時間，讀取自交易所公開 API，每五分鐘重寫。",
    },
  },
  es: {
    nav: DATA_PAGE_NAV["es"],
    common: {
      home: "Inicio", updated: "Actualizado", source: "Fuente", refresh: "Relee el feed cada 60 segundos mientras la página está abierta. Horas en SGT.",
      unavailableTitle: "Los datos en vivo no están disponibles temporalmente", unavailable: "El feed se actualiza cada pocos minutos. Nada se estima mientras falta; vuelve a intentarlo en breve.",
      explainer: "Qué muestra esta página", faq: "Preguntas frecuentes", relatedData: "Más datos en vivo", json: "Feed JSON en bruto",
      embedTitle: "Inserta esto en tu sitio", embedIntro: "Pega uno de estos fragmentos. El widget muestra las mismas cifras en vivo que esta página, se adapta a cualquier ancho y enlaza de vuelta aquí.",
      embedIframe: "iframe", embedScript: "Etiqueta script", copy: "Copiar", copied: "Copiado", embedTerms: "Gratis. Conserva el enlace de atribución; las cifras son un límite inferior de Binance y OKX, actualizadas cada cinco minutos.",
      poweredBy: "Con tecnología de NexuAlpha", embedUpdated: "actualizado",
    },
    liquidations: {
      title: "Liquidaciones cripto hoy — Totales en vivo 1h / 4h / 24h | NexuAlpha",
      description: "Liquidaciones de futuros cripto hoy, en vivo: totales de 1h, 4h y 24h, reparto largos vs cortos, símbolos más liquidados y la mayor orden en Binance y OKX.",
      h1: "Liquidaciones cripto de hoy",
      lead: "Cuánto apalancamiento se cerró a la fuerza en la última hora, cuatro horas y 24 horas en los futuros de Binance y OKX, separado en posiciones largas y cortas.",
      h1Window: "Última hora", h4Window: "Últimas 4 horas", h24Window: "Últimas 24 horas", total: "Total liquidado",
      longs: "Largos liquidados", shorts: "Cortos liquidados", orders: (n) => `${n} órdenes`, split: "Largos vs cortos (24h)",
      topTitle: "Símbolos más liquidados (24h)", colSymbol: "Símbolo", colVenue: "Exchange", colUsd: "Liquidado", colShare: "Cuota",
      largestTitle: "Mayor liquidación individual (24h)", sideLong: "largo", sideShort: "corto", largestLine: (s) => `${s.base} ${s.side} en ${s.venue}`,
      sourceLine: "Stream de órdenes forzadas USDT-M de Binance + órdenes de liquidación de OKX",
      coverage: "Contando desde",
      historyTitle: "Últimos 30 días", historyLead: "Totales diarios de liquidaciones en los futuros de Binance y OKX, sumados a partir de instantáneas horarias por día UTC, con largos y cortos apilados.",
      historyCollecting: (date) => `El historial se recopila desde el ${date}. El gráfico de 30 días aparece cuando existen dos días completos.`,
      historyChartLabel: "Totales diarios de liquidaciones, últimos 30 días", historyAvg: "Media de 30 días", historyToday: "Hoy hasta ahora", historyLargest: "Mayor día del periodo",
      historyPartial: "La barra de hoy solo cubre las horas recopiladas hasta ahora (UTC).", historyAxis: "Día del mes (UTC)", historyDays: (n) => `${n} días de historial`,
      historyVsAvg: ({ direction, pct, now, avg }) => direction === "near" ? `Las últimas 24 horas (${now}) están en línea con la media diaria de 30 días (${avg}).` : `Las últimas 24 horas (${now}) están un ${pct}% ${direction === "above" ? "por encima" : "por debajo"} de la media diaria de 30 días (${avg}).`,
      historyRank: (rank, days) => `Hoy ocupa el puesto ${rank} de ${days} días de este mes por volumen liquidado (1 = mayor).`,
      explainer: [
        "Una liquidación ocurre cuando una posición de futuros apalancada pierde tanto margen que el exchange la cierra a la fuerza. La posición se vende (largo) o se recompra (corto) a mercado, lo que suele empujar el precio aún más en la misma dirección.",
        "Un long squeeze es una ola de liquidaciones de largos durante una caída; un short squeeze es su imagen espejo durante una subida. Cuando ambas columnas son grandes en la misma ventana, largos y cortos fueron barridos a la vez: un movimiento brusco en una dirección seguido de una reversión brusca (多空双杀).",
        "Las cifras proceden del stream público de órdenes forzadas de Binance, que envía como máximo una orden por símbolo y segundo, más el endpoint de órdenes de liquidación de OKX para BTC, ETH, SOL, XRP y DOGE. Son un límite inferior de dos exchanges, no todo el mercado, y no constituyen asesoramiento de inversión.",
      ],
      faq: [
        ["¿Qué es una liquidación cripto?", "Es el cierre forzoso de una posición apalancada por parte del exchange cuando su margen cae por debajo del requisito de mantenimiento. El trader pierde el margen; el exchange cierra la posición a mercado para frenar más pérdidas."],
        ["¿Por qué se muestran por separado las liquidaciones de largos y cortos?", "Los largos se liquidan cuando el precio cae y los cortos cuando sube. El reparto muestra qué lado del mercado quedó atrapado. Cifras grandes en ambos lados en la misma ventana indican un movimiento brusco seguido de una reversión."],
        ["¿De dónde salen los datos y qué tan completos son?", "Del stream WebSocket público de órdenes forzadas USDT-M de Binance y de la API pública de órdenes de liquidación de OKX, agregados por NexuAlpha cada cinco minutos. Binance envía como máximo una orden por símbolo y segundo, así que los totales son un límite inferior y cubren solo estos dos exchanges."],
        ["¿Con qué frecuencia se actualiza la página?", "El colector reescribe el feed cada cinco minutos y la página lo relee cada 60 segundos mientras está abierta. La marca de tiempo sobre las cifras indica cuándo se generó el feed, en SGT."],
      ],
      datasetName: "Liquidaciones cripto en vivo de NexuAlpha (Binance + OKX)",
      datasetDescription: "Liquidaciones de futuros agregadas en ventanas de 1h, 4h y 24h: totales en USD de largos y cortos, número de órdenes, símbolos más liquidados y mayor orden individual. Límite inferior de dos exchanges, reescrito cada cinco minutos.",
    },
    funding: {
      title: "Funding cripto en vivo — Perpetuos Binance vs OKX | NexuAlpha",
      description: "Funding de perpetuos en Binance y OKX para los 20 símbolos principales: tasa actual, estimación anualizada y próximo funding. Positiva: los largos pagan.",
      h1: "Tasas de funding cripto: Binance vs OKX",
      lead: "Tasa de funding actual por periodo de los contratos perpetuos USDT más negociados, con una estimación anualizada y la próxima liquidación en cada exchange.",
      colSymbol: "Símbolo", colBinance: "Binance", colOkx: "OKX", colApr: "Anualizada (est.)", colNext: "Próximo funding", perPeriod: "por periodo",
      estNote: "Estimación anualizada = tasa actual × 3 × 365, suponiendo que la tasa de 8 horas se repite todo el año. Es una ayuda para comparar, no un pronóstico.",
      legend: "Positiva: los largos pagan a los cortos. Negativa: los cortos pagan a los largos.", nextIn: "en",
      sourceLine: "premiumIndex USDT-M de Binance + API pública de funding de OKX · símbolos por volumen 24h en Binance",
      explainer: [
        "Los futuros perpetuos nunca vencen, así que los exchanges usan pagos de funding para mantener el precio del contrato cerca del índice spot. En cada periodo (normalmente 8 horas) un lado paga al otro: con tasa positiva los largos pagan a los cortos; con tasa negativa, los cortos pagan a los largos.",
        "Una tasa positiva alta y persistente significa que la mayoría está larga y paga por ello: una operación saturada que puede deshacerse rápido. Una tasa negativa significa que los cortos pagan, algo frecuente tras caídas bruscas. Comparar Binance con OKX muestra dónde es más barato mantener la misma posición.",
        "Las tasas se leen de la API pública de cada exchange. La columna anualizada multiplica la tasa actual por 1.095 periodos al año; es una ayuda comparativa, no una predicción. Algunos contratos liquidan cada 4 horas o cada hora en un exchange: revisa la especificación del contrato antes de operar.",
      ],
      faq: [
        ["¿Qué es la tasa de funding?", "Un pago periódico entre quienes están largos y cortos en un contrato perpetuo que mantiene su precio cerca del índice spot. Se intercambia entre traders; no se paga al exchange."],
        ["¿Qué significa una tasa de funding positiva o negativa?", "Positiva: los largos pagan a los cortos y el mercado se inclina al alza. Negativa: los cortos pagan a los largos y el mercado se inclina a la baja. La magnitud importa: 0,01 % por 8 horas es la base neutral habitual en Binance; 0,1 % o más es inusualmente alto."],
        ["¿Cómo se calcula la tasa anualizada?", "Anualizada = tasa actual × 3 periodos al día × 365 días. Supone que la tasa actual se mantiene, lo que rara vez ocurre, así que úsala para comparar y no como rendimiento esperado."],
        ["¿Por qué Binance y OKX muestran tasas distintas?", "Cada exchange calcula el funding con su propio libro de órdenes e índice, con su componente de tipo de interés, sus límites y a veces un intervalo distinto. Esa diferencia es la razón por la que los traders comparan plataformas antes de mantener una posición."],
      ],
      datasetName: "Tasas de funding de perpetuos en vivo de NexuAlpha (Binance + OKX)",
      datasetDescription: "Tasa de funding actual y próxima liquidación de los 20 principales perpetuos USDT en Binance y OKX, leídas de las API públicas de los exchanges y reescritas cada cinco minutos.",
    },
  },
  "pt-BR": {
    nav: DATA_PAGE_NAV["pt-BR"],
    common: {
      home: "Início", updated: "Atualizado", source: "Fonte", refresh: "Relê o feed a cada 60 segundos enquanto a página está aberta. Horários em SGT.",
      unavailableTitle: "Os dados ao vivo estão temporariamente indisponíveis", unavailable: "O feed é atualizado a cada poucos minutos. Nada é estimado enquanto ele falta; tente novamente em instantes.",
      explainer: "O que esta página mostra", faq: "Perguntas frequentes", relatedData: "Mais dados ao vivo", json: "Feed JSON bruto",
      embedTitle: "Incorpore isto no seu site", embedIntro: "Cole um destes trechos. O widget mostra os mesmos números ao vivo desta página, adapta-se a qualquer largura e aponta de volta para aqui.",
      embedIframe: "iframe", embedScript: "Tag script", copy: "Copiar", copied: "Copiado", embedTerms: "Gratuito. Mantenha o link de atribuição; os números são um limite inferior da Binance e da OKX, atualizados a cada cinco minutos.",
      poweredBy: "Fornecido por NexuAlpha", embedUpdated: "atualizado",
    },
    liquidations: {
      title: "Liquidações cripto de hoje — Totais ao vivo 1h / 4h / 24h | NexuAlpha",
      description: "Liquidações de futuros cripto hoje, ao vivo: totais de 1h, 4h e 24h, divisão long vs short, símbolos mais liquidados e a maior ordem na Binance e na OKX.",
      h1: "Liquidações cripto de hoje",
      lead: "Quanto de alavancagem foi fechado à força na última hora, nas últimas quatro horas e em 24 horas nos futuros da Binance e da OKX, separado em posições long e short.",
      h1Window: "Última hora", h4Window: "Últimas 4 horas", h24Window: "Últimas 24 horas", total: "Total liquidado",
      longs: "Longs liquidados", shorts: "Shorts liquidados", orders: (n) => `${n} ordens`, split: "Long vs short (24h)",
      topTitle: "Símbolos mais liquidados (24h)", colSymbol: "Símbolo", colVenue: "Exchange", colUsd: "Liquidado", colShare: "Participação",
      largestTitle: "Maior liquidação individual (24h)", sideLong: "long", sideShort: "short", largestLine: (s) => `${s.base} ${s.side} na ${s.venue}`,
      sourceLine: "Stream de ordens forçadas USDT-M da Binance + ordens de liquidação da OKX",
      coverage: "Contando desde",
      historyTitle: "Últimos 30 dias", historyLead: "Totais diários de liquidações nos futuros da Binance e da OKX, somados a partir de snapshots horários por dia UTC, com longs e shorts empilhados.",
      historyCollecting: (date) => `O histórico é coletado desde ${date}. O gráfico de 30 dias aparece quando houver dois dias completos.`,
      historyChartLabel: "Totais diários de liquidações, últimos 30 dias", historyAvg: "Média de 30 dias", historyToday: "Hoje até agora", historyLargest: "Maior dia do período",
      historyPartial: "A barra de hoje cobre apenas as horas coletadas até agora (UTC).", historyAxis: "Dia do mês (UTC)", historyDays: (n) => `${n} dias de histórico`,
      historyVsAvg: ({ direction, pct, now, avg }) => direction === "near" ? `As últimas 24 horas (${now}) estão em linha com a média diária de 30 dias (${avg}).` : `As últimas 24 horas (${now}) estão ${pct}% ${direction === "above" ? "acima" : "abaixo"} da média diária de 30 dias (${avg}).`,
      historyRank: (rank, days) => `Hoje ocupa a posição ${rank} de ${days} dias deste mês em volume liquidado (1 = maior).`,
      explainer: [
        "Uma liquidação acontece quando uma posição alavancada em futuros perde tanta margem que a exchange a fecha à força. A posição é vendida (long) ou recomprada (short) a mercado, o que costuma empurrar o preço ainda mais na mesma direção.",
        "Um long squeeze é uma onda de liquidações de longs durante uma queda; um short squeeze é o espelho disso durante uma alta. Quando as duas colunas são grandes na mesma janela, longs e shorts foram varridos juntos: um movimento forte em uma direção seguido de uma reversão forte (多空双杀).",
        "Os números vêm do stream público de ordens forçadas da Binance, que envia no máximo uma ordem por símbolo por segundo, mais o endpoint de ordens de liquidação da OKX para BTC, ETH, SOL, XRP e DOGE. São um limite inferior de duas exchanges, não o mercado inteiro, e não constituem recomendação de investimento.",
      ],
      faq: [
        ["O que é uma liquidação cripto?", "É o fechamento forçado de uma posição alavancada pela exchange quando a margem cai abaixo do requisito de manutenção. O trader perde a margem; a exchange fecha a posição a mercado para conter novas perdas."],
        ["Por que longs e shorts aparecem separados?", "Longs são liquidados quando o preço cai; shorts, quando sobe. A divisão mostra qual lado do mercado foi pego. Números grandes nos dois lados na mesma janela indicam um movimento brusco seguido de reversão."],
        ["De onde vêm os dados e quão completos são?", "Do stream WebSocket público de ordens forçadas USDT-M da Binance e da API pública de ordens de liquidação da OKX, agregados pela NexuAlpha a cada cinco minutos. A Binance envia no máximo uma ordem por símbolo por segundo, então os totais são um limite inferior e cobrem apenas essas duas exchanges."],
        ["Com que frequência a página é atualizada?", "O coletor reescreve o feed a cada cinco minutos e a página o relê a cada 60 segundos enquanto está aberta. O carimbo de tempo acima dos números mostra quando o feed foi gerado, em SGT."],
      ],
      datasetName: "Liquidações cripto ao vivo da NexuAlpha (Binance + OKX)",
      datasetDescription: "Liquidações de futuros agregadas em janelas de 1h, 4h e 24h: totais em USD de longs e shorts, número de ordens, símbolos mais liquidados e maior ordem individual. Limite inferior de duas exchanges, reescrito a cada cinco minutos.",
    },
    funding: {
      title: "Funding cripto ao vivo — Perpétuos Binance vs OKX | NexuAlpha",
      description: "Taxas de funding de perpétuos na Binance e na OKX para os 20 principais símbolos: taxa atual, estimativa anualizada e próximo funding. Positiva: longs pagam.",
      h1: "Taxas de funding cripto: Binance vs OKX",
      lead: "Taxa de funding atual por período dos contratos perpétuos USDT mais negociados, com estimativa anualizada e o próximo acerto em cada exchange.",
      colSymbol: "Símbolo", colBinance: "Binance", colOkx: "OKX", colApr: "Anualizada (est.)", colNext: "Próximo funding", perPeriod: "por período",
      estNote: "Estimativa anualizada = taxa atual × 3 × 365, supondo que a taxa de 8 horas se repita o ano inteiro. Serve para comparar, não é previsão.",
      legend: "Positiva: longs pagam aos shorts. Negativa: shorts pagam aos longs.", nextIn: "em",
      sourceLine: "premiumIndex USDT-M da Binance + API pública de funding da OKX · símbolos por volume 24h na Binance",
      explainer: [
        "Futuros perpétuos nunca vencem, então as exchanges usam pagamentos de funding para manter o preço do contrato perto do índice spot. A cada período (normalmente 8 horas) um lado paga o outro: com taxa positiva os longs pagam aos shorts; com taxa negativa, os shorts pagam aos longs.",
        "Uma taxa positiva alta e persistente significa que a maioria está comprada e paga por isso — uma operação lotada que pode se desfazer rápido. Uma taxa negativa significa que os shorts estão pagando, o que costuma aparecer após quedas fortes. Comparar Binance e OKX mostra onde a mesma posição é mais barata de manter.",
        "As taxas são lidas da API pública de cada exchange. A coluna anualizada multiplica a taxa atual por 1.095 períodos por ano; é uma ajuda de comparação, não uma previsão. Alguns contratos acertam a cada 4 horas ou a cada hora em uma exchange — confira a especificação do contrato antes de operar.",
      ],
      faq: [
        ["O que é taxa de funding?", "Um pagamento periódico entre quem está long e quem está short em um contrato perpétuo, que mantém o preço perto do índice spot. É trocado entre traders, não pago à exchange."],
        ["O que significa uma taxa de funding positiva ou negativa?", "Positiva: longs pagam aos shorts e o mercado está inclinado para a alta. Negativa: shorts pagam aos longs e o mercado está inclinado para a baixa. O tamanho importa: 0,01% por 8 horas é a base neutra comum na Binance; 0,1% ou mais é incomumente alto."],
        ["Como a taxa anualizada é calculada?", "Anualizada = taxa atual × 3 períodos por dia × 365 dias. Supõe que a taxa atual persista, o que raramente acontece; use-a para comparar e não como retorno esperado."],
        ["Por que Binance e OKX mostram taxas diferentes?", "Cada exchange calcula o funding com seu próprio livro de ordens e índice, com seu componente de juros, limites e às vezes um intervalo diferente. Essa diferença é o motivo pelo qual traders comparam plataformas antes de manter uma posição."],
      ],
      datasetName: "Taxas de funding de perpétuos ao vivo da NexuAlpha (Binance + OKX)",
      datasetDescription: "Taxa de funding atual e próximo acerto dos 20 principais perpétuos USDT na Binance e na OKX, lidas das APIs públicas das exchanges e reescritas a cada cinco minutos.",
    },
  },
  fr: {
    nav: DATA_PAGE_NAV["fr"],
    common: {
      home: "Accueil", updated: "Mis à jour", source: "Source", refresh: "Relit le flux toutes les 60 secondes tant que la page est ouverte. Heures en SGT.",
      unavailableTitle: "Les données en direct sont temporairement indisponibles", unavailable: "Le flux se rafraîchit toutes les quelques minutes. Rien n'est estimé en son absence ; réessayez dans un instant.",
      explainer: "Ce que montre cette page", faq: "Questions fréquentes", relatedData: "Plus de données en direct", json: "Flux JSON brut",
      embedTitle: "Intégrer sur votre site", embedIntro: "Collez l'un de ces extraits. Le widget affiche les mêmes chiffres en direct que cette page, s'adapte à toute largeur et renvoie ici.",
      embedIframe: "iframe", embedScript: "Balise script", copy: "Copier", copied: "Copié", embedTerms: "Gratuit. Conservez le lien d'attribution ; les chiffres sont une borne basse Binance + OKX, actualisés toutes les cinq minutes.",
      poweredBy: "Propulsé par NexuAlpha", embedUpdated: "mis à jour",
    },
    liquidations: {
      title: "Liquidations crypto du jour — Totaux 1h / 4h / 24h en direct | NexuAlpha",
      description: "Liquidations de futures crypto en direct : totaux 1h, 4h et 24h, répartition longs/shorts, symboles les plus liquidés et plus gros ordre sur Binance et OKX.",
      h1: "Liquidations crypto aujourd'hui",
      lead: "Combien de positions à levier ont été fermées de force sur la dernière heure, les quatre dernières heures et 24 heures sur les futures Binance et OKX, séparées en longs et shorts.",
      h1Window: "Dernière heure", h4Window: "4 dernières heures", h24Window: "24 dernières heures", total: "Total liquidé",
      longs: "Longs liquidés", shorts: "Shorts liquidés", orders: (n) => `${n} ordres`, split: "Longs vs shorts (24h)",
      topTitle: "Symboles les plus liquidés (24h)", colSymbol: "Symbole", colVenue: "Plateforme", colUsd: "Liquidé", colShare: "Part",
      largestTitle: "Plus grosse liquidation unique (24h)", sideLong: "long", sideShort: "short", largestLine: (s) => `${s.base} ${s.side} sur ${s.venue}`,
      sourceLine: "Flux d'ordres forcés USDT-M Binance + ordres de liquidation OKX",
      coverage: "Comptage depuis",
      historyTitle: "30 derniers jours", historyLead: "Totaux quotidiens des liquidations sur les futures Binance et OKX, cumulés à partir d'instantanés horaires par jour UTC, longs et shorts empilés.",
      historyCollecting: (date) => `L'historique est collecté depuis le ${date}. Le graphique sur 30 jours apparaît dès que deux jours complets existent.`,
      historyChartLabel: "Totaux quotidiens des liquidations, 30 derniers jours", historyAvg: "Moyenne sur 30 jours", historyToday: "Aujourd'hui jusqu'ici", historyLargest: "Plus grosse journée de la période",
      historyPartial: "La barre du jour ne couvre que les heures déjà collectées (UTC).", historyAxis: "Jour du mois (UTC)", historyDays: (n) => `${n} jours d'historique`,
      historyVsAvg: ({ direction, pct, now, avg }) => direction === "near" ? `Les 24 dernières heures (${now}) sont dans la moyenne quotidienne sur 30 jours (${avg}).` : `Les 24 dernières heures (${now}) sont ${pct}% ${direction === "above" ? "au-dessus" : "en dessous"} de la moyenne quotidienne sur 30 jours (${avg}).`,
      historyRank: (rank, days) => `Aujourd'hui se classe ${rank}e sur ${days} jours ce mois-ci en volume liquidé (1 = le plus élevé).`,
      explainer: [
        "Une liquidation survient quand une position de futures à levier perd tant de marge que la plateforme la ferme de force. La position est vendue (long) ou rachetée (short) au marché, ce qui pousse souvent le prix encore plus loin dans la même direction.",
        "Un long squeeze est une vague de liquidations de longs pendant une baisse ; un short squeeze en est le miroir pendant une hausse. Quand les deux colonnes sont élevées sur la même fenêtre, longs et shorts ont été balayés ensemble : un mouvement brusque dans un sens suivi d'un retournement brusque (多空双杀).",
        "Les chiffres proviennent du flux public d'ordres forcés de Binance, qui envoie au plus un ordre par symbole et par seconde, plus l'endpoint d'ordres de liquidation d'OKX pour BTC, ETH, SOL, XRP et DOGE. C'est une borne inférieure pour deux plateformes, pas l'ensemble du marché, et ce n'est pas un conseil en investissement.",
      ],
      faq: [
        ["Qu'est-ce qu'une liquidation crypto ?", "C'est la fermeture forcée d'une position à levier par la plateforme lorsque sa marge passe sous le seuil de maintenance. Le trader perd la marge ; la plateforme ferme la position au marché pour stopper les pertes."],
        ["Pourquoi séparer les liquidations longs et shorts ?", "Les longs sont liquidés quand le prix baisse, les shorts quand il monte. La répartition montre quel côté du marché a été pris à revers. Des montants élevés des deux côtés sur la même fenêtre signalent un mouvement brusque suivi d'un retournement."],
        ["D'où viennent ces données et sont-elles complètes ?", "Du flux WebSocket public d'ordres forcés USDT-M de Binance et de l'API publique d'ordres de liquidation d'OKX, agrégés par NexuAlpha toutes les cinq minutes. Binance envoie au plus un ordre par symbole et par seconde : les totaux sont donc une borne inférieure et ne couvrent que ces deux plateformes."],
        ["À quelle fréquence la page est-elle mise à jour ?", "Le collecteur réécrit le flux toutes les cinq minutes et la page le relit toutes les 60 secondes tant qu'elle est ouverte. L'horodatage au-dessus des chiffres indique la génération du flux, en SGT."],
      ],
      datasetName: "Liquidations crypto en direct NexuAlpha (Binance + OKX)",
      datasetDescription: "Liquidations de futures agrégées sur 1h, 4h et 24h : totaux USD longs et shorts, nombre d'ordres, symboles les plus liquidés et plus gros ordre unique. Borne inférieure de deux plateformes, réécrite toutes les cinq minutes.",
    },
    funding: {
      title: "Taux de funding crypto — Binance vs OKX en direct | NexuAlpha",
      description: "Funding des perpétuels Binance et OKX pour les 20 premiers symboles : taux actuel, estimation annualisée et prochain funding. Positif : les longs paient.",
      h1: "Taux de funding crypto : Binance vs OKX",
      lead: "Taux de funding actuel par période des contrats perpétuels USDT les plus échangés, avec une estimation annualisée et le prochain règlement sur chaque plateforme.",
      colSymbol: "Symbole", colBinance: "Binance", colOkx: "OKX", colApr: "Annualisé (est.)", colNext: "Prochain funding", perPeriod: "par période",
      estNote: "Estimation annualisée = taux actuel × 3 × 365, en supposant que le taux de 8 heures se répète toute l'année. Une aide à la comparaison, pas une prévision.",
      legend: "Positif : les longs paient les shorts. Négatif : les shorts paient les longs.", nextIn: "dans",
      sourceLine: "premiumIndex USDT-M Binance + API publique de funding OKX · symboles par volume 24h sur Binance",
      explainer: [
        "Les futures perpétuels n'expirent jamais ; les plateformes utilisent donc des paiements de funding pour maintenir le prix du contrat près de l'indice spot. À chaque période (généralement 8 heures), un camp paie l'autre : taux positif, les longs paient les shorts ; taux négatif, les shorts paient les longs.",
        "Un taux positif élevé et persistant signifie que la foule est longue et paie pour cela — un trade encombré qui peut se dénouer vite. Un taux négatif signifie que les shorts paient, ce qui apparaît souvent après des chutes brutales. Comparer Binance et OKX montre où la même position coûte le moins à conserver.",
        "Les taux sont lus sur l'API publique de chaque plateforme. La colonne annualisée multiplie le taux actuel par 1 095 périodes par an ; c'est une aide à la comparaison, pas une prédiction. Certains contrats règlent toutes les 4 heures ou chaque heure sur une plateforme : vérifiez la spécification du contrat avant de trader.",
      ],
      faq: [
        ["Qu'est-ce qu'un taux de funding ?", "Un paiement périodique entre détenteurs longs et shorts d'un contrat perpétuel, qui maintient son prix près de l'indice spot. Il s'échange entre traders et n'est pas versé à la plateforme."],
        ["Que signifie un taux de funding positif ou négatif ?", "Positif : les longs paient les shorts et le marché penche à la hausse. Négatif : les shorts paient les longs et le marché penche à la baisse. L'ampleur compte : 0,01 % par 8 heures est la base neutre courante sur Binance ; 0,1 % ou plus est inhabituellement élevé."],
        ["Comment le taux annualisé est-il calculé ?", "Annualisé = taux actuel × 3 périodes par jour × 365 jours. Il suppose que le taux actuel persiste, ce qui est rare : utilisez-le pour comparer, pas comme rendement attendu."],
        ["Pourquoi Binance et OKX affichent-ils des taux différents ?", "Chaque plateforme calcule le funding à partir de son propre carnet d'ordres et de son indice, avec sa composante de taux d'intérêt, ses plafonds et parfois un intervalle différent. Cet écart explique pourquoi les traders comparent les plateformes avant de conserver une position."],
      ],
      datasetName: "Taux de funding perpétuels en direct NexuAlpha (Binance + OKX)",
      datasetDescription: "Taux de funding actuel et prochain règlement des 20 premiers perpétuels USDT sur Binance et OKX, lus sur les API publiques des plateformes et réécrits toutes les cinq minutes.",
    },
  },
  de: {
    nav: DATA_PAGE_NAV["de"],
    common: {
      home: "Start", updated: "Aktualisiert", source: "Quelle", refresh: "Liest den Feed alle 60 Sekunden neu, solange die Seite offen ist. Zeiten in SGT.",
      unavailableTitle: "Live-Daten sind vorübergehend nicht verfügbar", unavailable: "Der Feed wird alle paar Minuten erneuert. Solange er fehlt, wird nichts geschätzt – bitte gleich noch einmal versuchen.",
      explainer: "Was diese Seite zeigt", faq: "Häufige Fragen", relatedData: "Mehr Live-Daten", json: "Roh-JSON-Feed",
      embedTitle: "Auf der eigenen Seite einbetten", embedIntro: "Einen dieser Schnipsel einfügen. Das Widget zeigt dieselben Live-Zahlen wie diese Seite, passt sich jeder Spaltenbreite an und verlinkt hierher.",
      embedIframe: "iframe", embedScript: "Script-Tag", copy: "Kopieren", copied: "Kopiert", embedTerms: "Kostenlos. Der Quellenlink bleibt erhalten; die Zahlen sind eine Untergrenze von Binance und OKX, alle fünf Minuten aktualisiert.",
      poweredBy: "Bereitgestellt von NexuAlpha", embedUpdated: "aktualisiert",
    },
    liquidations: {
      title: "Krypto-Liquidationen heute — Live-Summen 1h / 4h / 24h | NexuAlpha",
      description: "Krypto-Futures-Liquidationen live: Summen für 1h, 4h und 24h, Long-/Short-Verteilung, meistliquidierte Symbole und größte Einzelorder auf Binance und OKX.",
      h1: "Krypto-Liquidationen heute",
      lead: "Wie viel gehebeltes Kapital in der letzten Stunde, in vier Stunden und in 24 Stunden auf Binance- und OKX-Futures zwangsweise geschlossen wurde, getrennt nach Long- und Short-Positionen.",
      h1Window: "Letzte Stunde", h4Window: "Letzte 4 Stunden", h24Window: "Letzte 24 Stunden", total: "Insgesamt liquidiert",
      longs: "Longs liquidiert", shorts: "Shorts liquidiert", orders: (n) => `${n} Orders`, split: "Long vs. Short (24h)",
      topTitle: "Meistliquidierte Symbole (24h)", colSymbol: "Symbol", colVenue: "Börse", colUsd: "Liquidiert", colShare: "Anteil",
      largestTitle: "Größte Einzelliquidation (24h)", sideLong: "Long", sideShort: "Short", largestLine: (s) => `${s.base} ${s.side} auf ${s.venue}`,
      sourceLine: "Binance USDT-M Force-Order-Stream + OKX-Liquidationsorders",
      coverage: "Gezählt seit",
      historyTitle: "Letzte 30 Tage", historyLead: "Tägliche Liquidationssummen auf Binance- und OKX-Futures, je UTC-Tag aus stündlichen Momentaufnahmen addiert, Longs und Shorts gestapelt.",
      historyCollecting: (date) => `Die Historie wird seit dem ${date} gesammelt. Das 30-Tage-Diagramm erscheint, sobald zwei volle Tage vorliegen.`,
      historyChartLabel: "Tägliche Liquidationssummen, letzte 30 Tage", historyAvg: "30-Tage-Durchschnitt", historyToday: "Heute bisher", historyLargest: "Größter Tag im Zeitraum",
      historyPartial: "Der heutige Balken umfasst nur die bisher erfassten Stunden (UTC).", historyAxis: "Tag des Monats (UTC)", historyDays: (n) => `${n} Tage Historie`,
      historyVsAvg: ({ direction, pct, now, avg }) => direction === "near" ? `Die letzten 24 Stunden (${now}) liegen im 30-Tage-Tagesdurchschnitt (${avg}).` : `Die letzten 24 Stunden (${now}) liegen ${pct}% ${direction === "above" ? "über" : "unter"} dem 30-Tage-Tagesdurchschnitt (${avg}).`,
      historyRank: (rank, days) => `Heute liegt nach Liquidationsvolumen auf Platz ${rank} von ${days} Tagen in diesem Monat (1 = größter).`,
      explainer: [
        "Eine Liquidation tritt ein, wenn eine gehebelte Futures-Position so viel Margin verliert, dass die Börse sie zwangsweise schließt. Die Position wird zum Marktpreis verkauft (Long) oder zurückgekauft (Short), was den Kurs oft weiter in dieselbe Richtung drückt.",
        "Ein Long Squeeze ist eine Welle von Long-Liquidationen im Kursrückgang; ein Short Squeeze ist das Spiegelbild in einer Rally. Sind beide Spalten im selben Zeitfenster groß, wurden Longs und Shorts gemeinsam ausgelöscht: eine scharfe Bewegung in eine Richtung mit anschließender scharfer Umkehr (多空双杀).",
        "Die Zahlen stammen aus Binance' öffentlichem Force-Order-Stream, der höchstens eine Order pro Symbol und Sekunde sendet, plus dem OKX-Endpunkt für Liquidationsorders bei BTC, ETH, SOL, XRP und DOGE. Sie sind eine Untergrenze für zwei Börsen, nicht der gesamte Markt, und keine Anlageberatung.",
      ],
      faq: [
        ["Was ist eine Krypto-Liquidation?", "Die zwangsweise Schließung einer gehebelten Position durch die Börse, wenn die Margin unter die Mindestanforderung fällt. Der Trader verliert die Margin; die Börse schließt die Position zum Marktpreis, um weitere Verluste zu stoppen."],
        ["Warum werden Long- und Short-Liquidationen getrennt gezeigt?", "Longs werden bei fallenden, Shorts bei steigenden Kursen liquidiert. Die Aufteilung zeigt, welche Marktseite erwischt wurde. Hohe Werte auf beiden Seiten im selben Fenster deuten auf eine scharfe Bewegung mit anschließender Umkehr."],
        ["Woher stammen die Daten und wie vollständig sind sie?", "Aus Binance' öffentlichem USDT-M-Force-Order-WebSocket-Stream und der öffentlichen OKX-API für Liquidationsorders, von NexuAlpha alle fünf Minuten aggregiert. Binance sendet höchstens eine Order pro Symbol und Sekunde, daher sind die Summen eine Untergrenze und decken nur diese zwei Börsen ab."],
        ["Wie oft wird die Seite aktualisiert?", "Der Collector schreibt den Feed alle fünf Minuten neu, die Seite liest ihn alle 60 Sekunden, solange sie offen ist. Der Zeitstempel über den Zahlen zeigt, wann der Feed erzeugt wurde (SGT)."],
      ],
      datasetName: "NexuAlpha Live-Krypto-Liquidationen (Binance + OKX)",
      datasetDescription: "Aggregierte Futures-Liquidationen in 1h-, 4h- und 24h-Fenstern: Long- und Short-Summen in USD, Orderanzahl, meistliquidierte Symbole und größte Einzelorder. Untergrenze aus zwei Börsen, alle fünf Minuten neu geschrieben.",
    },
    funding: {
      title: "Krypto-Funding-Raten — Binance vs. OKX Perpetuals, live | NexuAlpha",
      description: "Funding-Raten der Perpetuals auf Binance und OKX für die Top-20-Symbole: aktuelle Rate, annualisierte Schätzung und nächstes Funding. Positiv: Longs zahlen.",
      h1: "Krypto-Funding-Raten: Binance vs. OKX",
      lead: "Aktuelle Funding-Rate pro Periode der meistgehandelten USDT-Perpetuals mit annualisierter Schätzung und nächstem Abrechnungszeitpunkt auf jeder Börse.",
      colSymbol: "Symbol", colBinance: "Binance", colOkx: "OKX", colApr: "Annualisiert (gesch.)", colNext: "Nächstes Funding", perPeriod: "pro Periode",
      estNote: "Annualisierte Schätzung = aktuelle Rate × 3 × 365, unter der Annahme, dass sich die 8-Stunden-Rate das ganze Jahr wiederholt. Eine Vergleichshilfe, keine Prognose.",
      legend: "Positiv: Longs zahlen an Shorts. Negativ: Shorts zahlen an Longs.", nextIn: "in",
      sourceLine: "Binance USDT-M premiumIndex + öffentliche OKX-Funding-API · Symbole nach 24h-Volumen auf Binance",
      explainer: [
        "Perpetual Futures laufen nie aus; deshalb nutzen Börsen Funding-Zahlungen, um den Kontraktpreis nahe am Spot-Index zu halten. In jeder Periode (meist 8 Stunden) zahlt eine Seite an die andere: bei positiver Rate zahlen Longs an Shorts, bei negativer Rate Shorts an Longs.",
        "Eine dauerhaft hohe positive Rate bedeutet, dass die Mehrheit long ist und dafür zahlt – ein überfüllter Trade, der sich schnell auflösen kann. Eine negative Rate bedeutet, dass Shorts zahlen, was oft nach scharfen Kursrückgängen auftritt. Der Vergleich von Binance und OKX zeigt, wo dieselbe Position günstiger zu halten ist.",
        "Die Raten werden aus der öffentlichen API jeder Börse gelesen. Die annualisierte Spalte multipliziert die aktuelle Rate mit 1.095 Perioden pro Jahr; sie ist eine Vergleichshilfe, keine Vorhersage. Manche Kontrakte rechnen auf einer Börse alle 4 Stunden oder jede Stunde ab – vor dem Handel die Kontraktspezifikation prüfen.",
      ],
      faq: [
        ["Was ist eine Funding-Rate?", "Eine periodische Zahlung zwischen Long- und Short-Haltern eines Perpetual-Kontrakts, die dessen Preis nahe am Spot-Index hält. Sie wird zwischen Tradern getauscht, nicht an die Börse gezahlt."],
        ["Was bedeutet eine positive oder negative Funding-Rate?", "Positiv: Longs zahlen an Shorts, der Markt neigt zur Long-Seite. Negativ: Shorts zahlen an Longs, der Markt neigt zur Short-Seite. Die Höhe zählt: 0,01 % pro 8 Stunden ist die übliche neutrale Basis auf Binance; 0,1 % oder mehr ist ungewöhnlich hoch."],
        ["Wie wird die annualisierte Rate berechnet?", "Annualisiert = aktuelle Rate × 3 Perioden pro Tag × 365 Tage. Es wird angenommen, dass die aktuelle Rate bestehen bleibt, was selten der Fall ist – also als Vergleichshilfe, nicht als erwartete Rendite behandeln."],
        ["Warum zeigen Binance und OKX unterschiedliche Raten?", "Jede Börse berechnet das Funding aus ihrem eigenen Orderbuch und Index, mit eigener Zinskomponente, eigenen Obergrenzen und teils anderem Intervall. Diese Lücke ist der Grund, warum Trader Plattformen vergleichen, bevor sie eine Position halten."],
      ],
      datasetName: "NexuAlpha Live-Funding-Raten für Perpetuals (Binance + OKX)",
      datasetDescription: "Aktuelle Funding-Rate und nächste Abrechnung der Top-20-USDT-Perpetuals auf Binance und OKX, aus den öffentlichen APIs der Börsen gelesen und alle fünf Minuten neu geschrieben.",
    },
  },
  it: {
    nav: DATA_PAGE_NAV["it"],
    common: {
      home: "Home", updated: "Aggiornato", source: "Fonte", refresh: "Rilegge il feed ogni 60 secondi mentre la pagina è aperta. Orari in SGT.",
      unavailableTitle: "I dati in tempo reale non sono temporaneamente disponibili", unavailable: "Il feed si aggiorna ogni pochi minuti. Nulla viene stimato quando manca; riprova tra poco.",
      explainer: "Cosa mostra questa pagina", faq: "Domande frequenti", relatedData: "Altri dati in tempo reale", json: "Feed JSON grezzo",
      embedTitle: "Incorpora nel tuo sito", embedIntro: "Incolla uno di questi snippet. Il widget mostra gli stessi numeri in tempo reale di questa pagina, si adatta a qualsiasi larghezza e rimanda qui.",
      embedIframe: "iframe", embedScript: "Tag script", copy: "Copia", copied: "Copiato", embedTerms: "Gratuito. Mantieni il link di attribuzione; le cifre sono un limite inferiore di Binance e OKX, aggiornate ogni cinque minuti.",
      poweredBy: "Powered by NexuAlpha", embedUpdated: "aggiornato",
    },
    liquidations: {
      title: "Liquidazioni crypto di oggi — Totali live 1h / 4h / 24h | NexuAlpha",
      description: "Liquidazioni di futures crypto oggi, in tempo reale: totali 1h, 4h e 24h, ripartizione long/short, simboli più liquidati e ordine più grande su Binance e OKX.",
      h1: "Liquidazioni crypto di oggi",
      lead: "Quanta leva è stata chiusa forzatamente nell'ultima ora, nelle ultime quattro ore e in 24 ore sui futures di Binance e OKX, divisa tra posizioni long e short.",
      h1Window: "Ultima ora", h4Window: "Ultime 4 ore", h24Window: "Ultime 24 ore", total: "Totale liquidato",
      longs: "Long liquidati", shorts: "Short liquidati", orders: (n) => `${n} ordini`, split: "Long vs short (24h)",
      topTitle: "Simboli più liquidati (24h)", colSymbol: "Simbolo", colVenue: "Exchange", colUsd: "Liquidato", colShare: "Quota",
      largestTitle: "Liquidazione singola più grande (24h)", sideLong: "long", sideShort: "short", largestLine: (s) => `${s.base} ${s.side} su ${s.venue}`,
      sourceLine: "Stream ordini forzati USDT-M Binance + ordini di liquidazione OKX",
      coverage: "Conteggio dal",
      historyTitle: "Ultimi 30 giorni", historyLead: "Totali giornalieri delle liquidazioni sui futures Binance e OKX, sommati da istantanee orarie per giorno UTC, long e short impilati.",
      historyCollecting: (date) => `La cronologia viene raccolta dal ${date}. Il grafico a 30 giorni compare quando esistono due giorni completi.`,
      historyChartLabel: "Totali giornalieri delle liquidazioni, ultimi 30 giorni", historyAvg: "Media a 30 giorni", historyToday: "Oggi finora", historyLargest: "Giorno più grande del periodo",
      historyPartial: "La barra di oggi copre solo le ore raccolte finora (UTC).", historyAxis: "Giorno del mese (UTC)", historyDays: (n) => `${n} giorni di cronologia`,
      historyVsAvg: ({ direction, pct, now, avg }) => direction === "near" ? `Le ultime 24 ore (${now}) sono in linea con la media giornaliera a 30 giorni (${avg}).` : `Le ultime 24 ore (${now}) sono del ${pct}% ${direction === "above" ? "sopra" : "sotto"} la media giornaliera a 30 giorni (${avg}).`,
      historyRank: (rank, days) => `Oggi è al posto ${rank} su ${days} giorni di questo mese per volume liquidato (1 = maggiore).`,
      explainer: [
        "Una liquidazione avviene quando una posizione in futures a leva perde così tanto margine che l'exchange la chiude forzatamente. La posizione viene venduta (long) o ricomprata (short) a mercato, spingendo spesso il prezzo ancora più nella stessa direzione.",
        "Un long squeeze è un'ondata di liquidazioni di long durante un calo; uno short squeeze è l'immagine specchio durante un rialzo. Quando entrambe le colonne sono grandi nella stessa finestra, long e short sono stati spazzati via insieme: un movimento brusco in una direzione seguito da un'inversione brusca (多空双杀).",
        "I numeri provengono dallo stream pubblico di ordini forzati di Binance, che invia al massimo un ordine per simbolo al secondo, più l'endpoint OKX degli ordini di liquidazione per BTC, ETH, SOL, XRP e DOGE. Sono un limite inferiore per due exchange, non l'intero mercato, e non costituiscono consulenza finanziaria.",
      ],
      faq: [
        ["Che cos'è una liquidazione crypto?", "È la chiusura forzata di una posizione a leva da parte dell'exchange quando il margine scende sotto il requisito di mantenimento. Il trader perde il margine; l'exchange chiude la posizione a mercato per fermare ulteriori perdite."],
        ["Perché long e short sono mostrati separatamente?", "I long vengono liquidati quando il prezzo scende, gli short quando sale. La ripartizione mostra quale lato del mercato è stato colpito. Valori elevati su entrambi i lati nella stessa finestra indicano un movimento brusco seguito da un'inversione."],
        ["Da dove arrivano i dati e quanto sono completi?", "Dallo stream WebSocket pubblico di ordini forzati USDT-M di Binance e dall'API pubblica degli ordini di liquidazione di OKX, aggregati da NexuAlpha ogni cinque minuti. Binance invia al massimo un ordine per simbolo al secondo, quindi i totali sono un limite inferiore e coprono solo questi due exchange."],
        ["Con quale frequenza si aggiorna la pagina?", "Il collector riscrive il feed ogni cinque minuti e la pagina lo rilegge ogni 60 secondi mentre è aperta. Il timestamp sopra i numeri indica quando il feed è stato generato, in SGT."],
      ],
      datasetName: "Liquidazioni crypto live NexuAlpha (Binance + OKX)",
      datasetDescription: "Liquidazioni di futures aggregate su finestre di 1h, 4h e 24h: totali USD long e short, numero di ordini, simboli più liquidati e ordine singolo più grande. Limite inferiore di due exchange, riscritto ogni cinque minuti.",
    },
    funding: {
      title: "Tassi di funding crypto — Perpetual Binance vs OKX, live | NexuAlpha",
      description: "Tassi di funding dei perpetual su Binance e OKX per i primi 20 simboli: tasso attuale, stima annualizzata e prossimo funding. Positivo: i long pagano.",
      h1: "Tassi di funding crypto: Binance vs OKX",
      lead: "Tasso di funding attuale per periodo dei contratti perpetual USDT più scambiati, con stima annualizzata e prossimo regolamento su ciascun exchange.",
      colSymbol: "Simbolo", colBinance: "Binance", colOkx: "OKX", colApr: "Annualizzato (stima)", colNext: "Prossimo funding", perPeriod: "per periodo",
      estNote: "Stima annualizzata = tasso attuale × 3 × 365, assumendo che il tasso a 8 ore si ripeta tutto l'anno. Un aiuto al confronto, non una previsione.",
      legend: "Positivo: i long pagano gli short. Negativo: gli short pagano i long.", nextIn: "tra",
      sourceLine: "premiumIndex USDT-M Binance + API pubblica funding OKX · simboli per volume 24h su Binance",
      explainer: [
        "I futures perpetual non scadono mai, quindi gli exchange usano i pagamenti di funding per tenere il prezzo del contratto vicino all'indice spot. In ogni periodo (di solito 8 ore) una parte paga l'altra: con tasso positivo i long pagano gli short, con tasso negativo gli short pagano i long.",
        "Un tasso positivo alto e persistente significa che la folla è long e paga per esserlo — un trade affollato che può sciogliersi in fretta. Un tasso negativo significa che pagano gli short, cosa frequente dopo cali bruschi. Confrontare Binance e OKX mostra dove la stessa posizione costa meno da mantenere.",
        "I tassi sono letti dall'API pubblica di ogni exchange. La colonna annualizzata moltiplica il tasso attuale per 1.095 periodi all'anno; è un aiuto al confronto, non una previsione. Alcuni contratti regolano ogni 4 ore o ogni ora su un exchange: verifica la specifica del contratto prima di operare.",
      ],
      faq: [
        ["Che cos'è il tasso di funding?", "Un pagamento periodico tra chi è long e chi è short su un contratto perpetual, che ne mantiene il prezzo vicino all'indice spot. Viene scambiato tra trader, non pagato all'exchange."],
        ["Cosa significa un tasso di funding positivo o negativo?", "Positivo: i long pagano gli short e il mercato è sbilanciato al rialzo. Negativo: gli short pagano i long e il mercato è sbilanciato al ribasso. L'entità conta: 0,01% per 8 ore è la base neutra comune su Binance; 0,1% o più è insolitamente alto."],
        ["Come si calcola il tasso annualizzato?", "Annualizzato = tasso attuale × 3 periodi al giorno × 365 giorni. Presume che il tasso attuale persista, cosa che accade raramente: usalo per confrontare, non come rendimento atteso."],
        ["Perché Binance e OKX mostrano tassi diversi?", "Ogni exchange calcola il funding dal proprio order book e dal proprio indice, con la propria componente di interesse, i propri limiti e a volte un intervallo diverso. Quel divario è il motivo per cui i trader confrontano le piattaforme prima di mantenere una posizione."],
      ],
      datasetName: "Tassi di funding perpetual live NexuAlpha (Binance + OKX)",
      datasetDescription: "Tasso di funding attuale e prossimo regolamento dei primi 20 perpetual USDT su Binance e OKX, letti dalle API pubbliche degli exchange e riscritti ogni cinque minuti.",
    },
  },
  ja: {
    nav: DATA_PAGE_NAV["ja"],
    common: {
      home: "ホーム", updated: "更新", source: "出典", refresh: "ページを開いている間、60秒ごとにフィードを再読み込みします。時刻はSGTです。",
      unavailableTitle: "ライブデータは一時的に利用できません", unavailable: "フィードは数分ごとに更新されます。欠損中は一切推定しません。しばらくしてからお試しください。",
      explainer: "このページの見方", faq: "よくある質問", relatedData: "その他のライブデータ", json: "生のJSONフィード",
      embedTitle: "自分のサイトに埋め込む", embedIntro: "いずれかのコードを貼り付けてください。ウィジェットはこのページと同じライブ数値を表示し、幅に合わせて伸縮し、ここへリンクします。",
      embedIframe: "iframe", embedScript: "scriptタグ", copy: "コピー", copied: "コピーしました", embedTerms: "無料で埋め込めます。出典リンクは残してください。数値はBinanceとOKXの下限値で、5分ごとに更新されます。",
      poweredBy: "Powered by NexuAlpha", embedUpdated: "更新",
    },
    liquidations: {
      title: "本日の暗号資産清算額 — 1時間・4時間・24時間のライブ集計 | NexuAlpha",
      description: "BinanceとOKXの先物清算をライブ集計。1h・4h・24hの合計、ロング／ショート比率、清算が多い銘柄、最大の単一清算。",
      h1: "本日の暗号資産清算",
      lead: "直近1時間・4時間・24時間にBinanceとOKXの先物で強制決済されたレバレッジポジションの規模を、ロングとショートに分けて表示します。",
      h1Window: "直近1時間", h4Window: "直近4時間", h24Window: "直近24時間", total: "清算合計",
      longs: "ロング清算", shorts: "ショート清算", orders: (n) => `${n}件`, split: "ロング対ショート（24時間）",
      topTitle: "清算が多い銘柄（24時間）", colSymbol: "銘柄", colVenue: "取引所", colUsd: "清算額", colShare: "比率",
      largestTitle: "最大の単一清算（24時間）", sideLong: "ロング", sideShort: "ショート", largestLine: (s) => `${s.venue} の ${s.base} ${s.side}`,
      sourceLine: "Binance USDT-M 強制決済ストリーム + OKX 清算注文",
      coverage: "集計開始",
      historyTitle: "過去30日", historyLead: "BinanceとOKX先物の日次ロスカット総額。UTC日ごとに毎時スナップショットを合算し、ロングとショートを積み上げて表示します。",
      historyCollecting: (date) => `履歴は ${date} から収集中です。2日分がそろうと30日チャートが表示されます。`,
      historyChartLabel: "日次ロスカット総額（過去30日）", historyAvg: "30日平均", historyToday: "本日（現時点）", historyLargest: "期間中の最大日",
      historyPartial: "本日のバーは収集済みの時間帯のみを含みます（UTC）。", historyAxis: "日（UTC）", historyDays: (n) => `履歴 ${n} 日分`,
      historyVsAvg: ({ direction, pct, now, avg }) => direction === "near" ? `過去24時間（${now}）は30日の日平均（${avg}）とほぼ同水準です。` : `過去24時間（${now}）は30日の日平均（${avg}）を ${pct}% ${direction === "above" ? "上回って" : "下回って"}います。`,
      historyRank: (rank, days) => `ロスカット金額では、本日は今月 ${days} 日のうち ${rank} 位です（1 が最大）。`,
      explainer: [
        "清算（強制決済）は、レバレッジをかけた先物ポジションの証拠金が不足し、取引所が強制的にポジションを閉じることです。ロングは成行で売られ、ショートは買い戻されるため、価格が同じ方向へさらに動くことが多くなります。",
        "下落局面でロングが連鎖的に清算されるのがロングスクイーズ、上昇局面でショートが清算されるのがショートスクイーズです。同じ時間枠で両方の数値が大きい場合、ロングとショートの両方が一掃された「多空双殺」で、一方向への急変動の後に急反転が起きたことを示します。",
        "数値はBinanceの公開強制決済ストリーム（銘柄ごとに毎秒最大1件）と、BTC・ETH・SOL・XRP・DOGEを対象とするOKXの清算注文エンドポイントから取得しています。2取引所の下限値であり市場全体ではなく、投資助言でもありません。",
      ],
      faq: [
        ["暗号資産の清算とは何ですか？", "証拠金が維持証拠金を下回ったとき、取引所がレバレッジポジションを強制的に閉じることです。トレーダーは証拠金を失い、取引所は損失拡大を止めるため成行で決済します。"],
        ["ロングとショートの清算を分けて表示する理由は？", "ロングは価格下落時、ショートは価格上昇時に清算されます。分けることで市場のどちら側が巻き込まれたかが分かります。同じ時間枠で両側とも大きければ、急変動の後に反転が起きた（多空双殺）ことを示します。"],
        ["データの出典と網羅性は？", "BinanceのUSDT-M強制決済WebSocketストリームとOKXの公開清算注文APIから取得し、NexuAlphaが5分ごとに集計しています。Binanceは銘柄ごとに毎秒最大1件しか配信しないため、合計は下限値で、対象もこの2取引所に限られます。"],
        ["ページの更新頻度は？", "収集プログラムが5分ごとにフィードを書き直し、ページは開いている間60秒ごとに再読み込みします。数値の上のタイムスタンプはフィード生成時刻（SGT）です。"],
      ],
      datasetName: "NexuAlpha ライブ暗号資産清算データ（Binance + OKX）",
      datasetDescription: "1時間・4時間・24時間の先物清算集計：ロングとショートのUSD合計、件数、清算が多い銘柄、最大の単一注文。2取引所の下限値を5分ごとに更新。",
    },
    funding: {
      title: "暗号資産の資金調達率 — Binance vs OKX 無期限先物をライブ比較 | NexuAlpha",
      description: "BinanceとOKXの無期限先物、上位20銘柄の資金調達率をライブ表示。現在のレート、年率換算の推定値、次回の資金調達時刻。",
      h1: "暗号資産の資金調達率：Binance vs OKX",
      lead: "出来高上位のUSDT無期限契約について、現在の1期間あたりの資金調達率、年率換算の推定値、各取引所の次回決済時刻を表示します。",
      colSymbol: "銘柄", colBinance: "Binance", colOkx: "OKX", colApr: "年率換算（推定）", colNext: "次回の資金調達", perPeriod: "1期間あたり",
      estNote: "年率換算の推定値 = 現在のレート × 3 × 365。8時間レートが1年続くと仮定した比較用の数値で、予測ではありません。",
      legend: "プラス：ロングがショートに支払い。マイナス：ショートがロングに支払い。", nextIn: "あと",
      sourceLine: "Binance USDT-M premiumIndex + OKX 公開資金調達率API · Binanceの24時間出来高で銘柄を選定",
      explainer: [
        "無期限先物には満期がないため、取引所は資金調達の支払いで契約価格を現物指数に近づけます。各期間（通常8時間）ごとに一方が他方へ支払い、レートがプラスならロングがショートに、マイナスならショートがロングに支払います。",
        "高いプラスのレートが続くのは、多数がロングでその代価を払っている状態で、混雑した取引は急速に巻き戻されることがあります。マイナスのレートはショートが支払っている状態で、急落の後によく見られます。BinanceとOKXを比較すると、同じポジションをどちらで安く保有できるかが分かります。",
        "レートは各取引所の公開APIから取得しています。年率換算の列は現在のレートに年1,095期間を掛けたもので、比較のための目安であり予測ではありません。一部の契約は一方の取引所で4時間ごとや1時間ごとに決済されるため、取引前に契約仕様を確認してください。",
      ],
      faq: [
        ["資金調達率とは何ですか？", "無期限契約のロング保有者とショート保有者の間で定期的に交換される支払いで、契約価格を現物指数に近づける役割があります。トレーダー間で授受され、取引所に支払うものではありません。"],
        ["プラスとマイナスの資金調達率は何を意味しますか？", "プラスはロングがショートに支払い、市場がロングに偏っている状態。マイナスはショートがロングに支払い、市場がショートに偏っている状態です。大きさも重要で、Binanceでは8時間あたり0.01%が一般的な中立水準、0.1%以上は異常に高い水準です。"],
        ["年率換算はどう計算しますか？", "年率換算 = 現在のレート × 1日3期間 × 365日。現在のレートが続くと仮定しますが実際にはまれなので、期待収益ではなく比較の目安として扱ってください。"],
        ["BinanceとOKXでレートが異なるのはなぜですか？", "各取引所は自社の板と指数から資金調達率を計算し、金利要素、上限、場合によっては決済間隔も異なります。この差があるからこそ、トレーダーはポジションを保有する前に取引所を比較します。"],
      ],
      datasetName: "NexuAlpha ライブ無期限先物資金調達率（Binance + OKX）",
      datasetDescription: "BinanceとOKXの上位20 USDT無期限銘柄の現在の資金調達率と次回決済時刻。取引所の公開APIから取得し、5分ごとに更新。",
    },
  },
  ko: {
    nav: DATA_PAGE_NAV["ko"],
    common: {
      home: "홈", updated: "업데이트", source: "출처", refresh: "페이지가 열려 있는 동안 60초마다 피드를 다시 읽습니다. 시간은 SGT입니다.",
      unavailableTitle: "실시간 데이터를 일시적으로 사용할 수 없습니다", unavailable: "피드는 몇 분마다 갱신됩니다. 데이터가 없는 동안에는 어떤 값도 추정하지 않습니다. 잠시 후 다시 시도하세요.",
      explainer: "이 페이지가 보여주는 것", faq: "자주 묻는 질문", relatedData: "더 많은 실시간 데이터", json: "원본 JSON 피드",
      embedTitle: "내 사이트에 삽입", embedIntro: "아래 코드 중 하나를 붙여 넣으세요. 위젯은 이 페이지와 같은 실시간 숫자를 보여주고, 어떤 너비에도 맞으며, 이 페이지로 링크합니다.",
      embedIframe: "iframe", embedScript: "script 태그", copy: "복사", copied: "복사됨", embedTerms: "무료로 삽입할 수 있습니다. 출처 링크는 유지해 주세요. 숫자는 Binance와 OKX의 하한값이며 5분마다 갱신됩니다.",
      poweredBy: "Powered by NexuAlpha", embedUpdated: "업데이트",
    },
    liquidations: {
      title: "오늘의 암호화폐 청산 — 1시간·4시간·24시간 실시간 집계 | NexuAlpha",
      description: "바이낸스·OKX 선물 청산 실시간 집계: 1h·4h·24h 합계, 롱/숏 비율, 청산 상위 종목, 최대 단일 청산.",
      h1: "오늘의 암호화폐 청산",
      lead: "최근 1시간, 4시간, 24시간 동안 바이낸스와 OKX 선물에서 강제 청산된 레버리지 포지션 규모를 롱과 숏으로 나누어 보여줍니다.",
      h1Window: "최근 1시간", h4Window: "최근 4시간", h24Window: "최근 24시간", total: "총 청산액",
      longs: "롱 청산", shorts: "숏 청산", orders: (n) => `${n}건`, split: "롱 vs 숏 (24시간)",
      topTitle: "청산이 많은 종목 (24시간)", colSymbol: "종목", colVenue: "거래소", colUsd: "청산액", colShare: "비중",
      largestTitle: "최대 단일 청산 (24시간)", sideLong: "롱", sideShort: "숏", largestLine: (s) => `${s.venue} ${s.base} ${s.side}`,
      sourceLine: "바이낸스 USDT-M 강제청산 스트림 + OKX 청산 주문",
      coverage: "집계 시작",
      historyTitle: "최근 30일", historyLead: "Binance와 OKX 선물의 일별 청산 총액. UTC 일 단위로 매시간 스냅샷을 합산하고 롱과 숏을 쌓아 표시합니다.",
      historyCollecting: (date) => `기록은 ${date}부터 수집 중입니다. 이틀분이 쌓이면 30일 차트가 표시됩니다.`,
      historyChartLabel: "일별 청산 총액, 최근 30일", historyAvg: "30일 평균", historyToday: "오늘(현재까지)", historyLargest: "기간 중 최대 일",
      historyPartial: "오늘 막대는 지금까지 수집된 시간만 포함합니다(UTC).", historyAxis: "일(UTC)", historyDays: (n) => `기록 ${n}일`,
      historyVsAvg: ({ direction, pct, now, avg }) => direction === "near" ? `최근 24시간(${now})은 30일 일평균(${avg})과 비슷한 수준입니다.` : `최근 24시간(${now})은 30일 일평균(${avg})보다 ${pct}% ${direction === "above" ? "높습니다" : "낮습니다"}.`,
      historyRank: (rank, days) => `청산 금액 기준으로 오늘은 이번 달 ${days}일 중 ${rank}위입니다(1 = 최대).`,
      explainer: [
        "청산은 레버리지 선물 포지션의 증거금이 부족해져 거래소가 포지션을 강제로 닫는 것입니다. 롱은 시장가로 매도되고 숏은 되매수되며, 이 과정이 가격을 같은 방향으로 더 밀어내는 경우가 많습니다.",
        "하락 중 롱이 연쇄 청산되는 것이 롱 스퀴즈, 상승 중 숏이 청산되는 것이 숏 스퀴즈입니다. 같은 시간대에 두 열이 모두 크면 롱과 숏이 함께 쓸려 나간 양방향 청산(多空双杀)으로, 한 방향 급등락 뒤에 급반전이 있었다는 뜻입니다.",
        "수치는 종목당 초당 최대 1건만 전송하는 바이낸스 공개 강제청산 스트림과 BTC·ETH·SOL·XRP·DOGE에 대한 OKX 청산 주문 엔드포인트에서 가져옵니다. 두 거래소의 하한값일 뿐 전체 시장이 아니며, 투자 조언도 아닙니다.",
      ],
      faq: [
        ["암호화폐 청산이란 무엇인가요?", "증거금이 유지 증거금 아래로 떨어지면 거래소가 레버리지 포지션을 강제로 닫는 것입니다. 트레이더는 증거금을 잃고, 거래소는 손실 확대를 막기 위해 시장가로 포지션을 정리합니다."],
        ["롱과 숏 청산을 따로 보여주는 이유는?", "롱은 가격이 떨어질 때, 숏은 오를 때 청산됩니다. 나누어 보면 시장의 어느 쪽이 당했는지 알 수 있습니다. 같은 시간대에 양쪽 모두 크다면 급등락 뒤 반전이 있었다는 신호(多空双杀)입니다."],
        ["데이터 출처와 완전성은?", "바이낸스 공개 USDT-M 강제청산 WebSocket 스트림과 OKX 공개 청산 주문 API에서 가져와 NexuAlpha가 5분마다 집계합니다. 바이낸스는 종목당 초당 최대 1건만 보내므로 합계는 하한값이며 이 두 거래소만 포함합니다."],
        ["페이지는 얼마나 자주 업데이트되나요?", "수집기가 5분마다 피드를 다시 쓰고, 페이지는 열려 있는 동안 60초마다 다시 읽습니다. 숫자 위의 타임스탬프는 피드 생성 시각(SGT)입니다."],
      ],
      datasetName: "NexuAlpha 실시간 암호화폐 청산 데이터 (바이낸스 + OKX)",
      datasetDescription: "1시간·4시간·24시간 구간의 선물 청산 집계: 롱·숏 USD 합계, 건수, 청산 상위 종목, 최대 단일 주문. 두 거래소의 하한값이며 5분마다 갱신.",
    },
    funding: {
      title: "암호화폐 펀딩비 — 바이낸스 vs OKX 무기한 선물 실시간 비교 | NexuAlpha",
      description: "바이낸스·OKX 무기한 선물 상위 20개 종목의 실시간 펀딩비: 현재 요율, 연환산 추정치, 다음 정산 시각. 양수는 롱이 지급.",
      h1: "암호화폐 펀딩비: 바이낸스 vs OKX",
      lead: "거래량 상위 USDT 무기한 계약의 현재 회당 펀딩비와 연환산 추정치, 각 거래소의 다음 정산 시각을 보여줍니다.",
      colSymbol: "종목", colBinance: "바이낸스", colOkx: "OKX", colApr: "연환산 (추정)", colNext: "다음 펀딩", perPeriod: "회당",
      estNote: "연환산 추정치 = 현재 요율 × 3 × 365. 8시간 요율이 1년 내내 반복된다고 가정한 비교용 수치이며 예측이 아닙니다.",
      legend: "양수: 롱이 숏에게 지급. 음수: 숏이 롱에게 지급.", nextIn: "남은 시간",
      sourceLine: "바이낸스 USDT-M premiumIndex + OKX 공개 펀딩비 API · 바이낸스 24시간 거래량 기준 종목 선정",
      explainer: [
        "무기한 선물은 만기가 없어 거래소는 펀딩 지급으로 계약 가격을 현물 지수에 가깝게 유지합니다. 매 정산 주기(보통 8시간)마다 한쪽이 다른 쪽에 지급하며, 요율이 양수면 롱이 숏에게, 음수면 숏이 롱에게 지급합니다.",
        "높은 양수 요율이 지속되면 다수가 롱 포지션을 잡고 그 비용을 내고 있다는 뜻으로, 과밀한 거래는 빠르게 되돌려질 수 있습니다. 음수 요율은 숏이 지급하는 상태로 급락 뒤에 자주 나타납니다. 바이낸스와 OKX를 비교하면 같은 포지션을 어디서 더 저렴하게 유지할 수 있는지 알 수 있습니다.",
        "요율은 각 거래소의 공개 API에서 읽습니다. 연환산 열은 현재 요율에 연 1,095회를 곱한 비교용 수치이며 예측이 아닙니다. 일부 계약은 한 거래소에서 4시간 또는 1시간마다 정산되므로 거래 전 계약 명세를 확인하세요.",
      ],
      faq: [
        ["펀딩비란 무엇인가요?", "무기한 계약의 롱과 숏 보유자 사이에서 주기적으로 교환되는 지급금으로, 계약 가격을 현물 지수에 가깝게 유지합니다. 트레이더 사이에서 오가며 거래소에 내는 것이 아닙니다."],
        ["양수 또는 음수 펀딩비는 무엇을 의미하나요?", "양수: 롱이 숏에게 지급하며 시장이 롱으로 치우쳐 있습니다. 음수: 숏이 롱에게 지급하며 시장이 숏으로 치우쳐 있습니다. 크기도 중요합니다. 바이낸스에서 8시간당 0.01%가 일반적인 중립 기준이고 0.1% 이상은 비정상적으로 높은 수준입니다."],
        ["연환산 요율은 어떻게 계산하나요?", "연환산 = 현재 요율 × 하루 3회 × 365일. 현재 요율이 계속된다고 가정하지만 실제로는 드물기 때문에 기대 수익이 아닌 비교 도구로 보세요."],
        ["바이낸스와 OKX의 요율이 다른 이유는?", "각 거래소가 자체 호가창과 지수로 펀딩비를 계산하고, 이자율 요소·상한·때로는 정산 간격도 다릅니다. 이 차이 때문에 트레이더는 포지션을 유지하기 전에 거래소를 비교합니다."],
      ],
      datasetName: "NexuAlpha 실시간 무기한 선물 펀딩비 (바이낸스 + OKX)",
      datasetDescription: "바이낸스와 OKX 상위 20개 USDT 무기한 종목의 현재 펀딩비와 다음 정산 시각. 거래소 공개 API에서 읽어 5분마다 갱신.",
    },
  },
  ru: {
    nav: DATA_PAGE_NAV["ru"],
    common: {
      home: "Главная", updated: "Обновлено", source: "Источник", refresh: "Перечитывает фид каждые 60 секунд, пока страница открыта. Время в SGT.",
      unavailableTitle: "Данные в реальном времени временно недоступны", unavailable: "Фид обновляется каждые несколько минут. Пока его нет, ничего не оценивается — попробуйте чуть позже.",
      explainer: "Что показывает эта страница", faq: "Частые вопросы", relatedData: "Больше данных в реальном времени", json: "Сырой JSON-фид",
      embedTitle: "Встроить на свой сайт", embedIntro: "Вставьте один из фрагментов. Виджет показывает те же живые цифры, что и эта страница, подстраивается под любую ширину и ссылается сюда.",
      embedIframe: "iframe", embedScript: "Тег script", copy: "Копировать", copied: "Скопировано", embedTerms: "Бесплатно. Сохраняйте ссылку на источник; цифры — нижняя граница по Binance и OKX, обновление каждые пять минут.",
      poweredBy: "При поддержке NexuAlpha", embedUpdated: "обновлено",
    },
    liquidations: {
      title: "Ликвидации крипты сегодня — 1ч / 4ч / 24ч онлайн | NexuAlpha",
      description: "Ликвидации крипто-фьючерсов онлайн: суммы за 1ч, 4ч и 24ч, лонги и шорты, самые ликвидируемые монеты и крупнейший ордер на Binance и OKX.",
      h1: "Ликвидации криптовалют сегодня",
      lead: "Сколько позиций с плечом было принудительно закрыто за последний час, четыре часа и сутки на фьючерсах Binance и OKX, с разбивкой на лонги и шорты.",
      h1Window: "Последний час", h4Window: "Последние 4 часа", h24Window: "Последние 24 часа", total: "Всего ликвидировано",
      longs: "Ликвидировано лонгов", shorts: "Ликвидировано шортов", orders: (n) => `${n} ордеров`, split: "Лонги и шорты (24ч)",
      topTitle: "Самые ликвидируемые монеты (24ч)", colSymbol: "Монета", colVenue: "Биржа", colUsd: "Ликвидировано", colShare: "Доля",
      largestTitle: "Крупнейшая единичная ликвидация (24ч)", sideLong: "лонг", sideShort: "шорт", largestLine: (s) => `${s.base} ${s.side} на ${s.venue}`,
      sourceLine: "Поток принудительных ордеров Binance USDT-M + ордера ликвидации OKX",
      coverage: "Подсчёт с",
      historyTitle: "Последние 30 дней", historyLead: "Дневные суммы ликвидаций на фьючерсах Binance и OKX: почасовые снимки, сложенные за каждый день UTC, лонги и шорты друг над другом.",
      historyCollecting: (date) => `История собирается с ${date}. График за 30 дней появится, когда накопятся два полных дня.`,
      historyChartLabel: "Дневные суммы ликвидаций, последние 30 дней", historyAvg: "Среднее за 30 дней", historyToday: "Сегодня на данный момент", historyLargest: "Крупнейший день периода",
      historyPartial: "Столбик за сегодня включает только уже собранные часы (UTC).", historyAxis: "День месяца (UTC)", historyDays: (n) => `${n} дней истории`,
      historyVsAvg: ({ direction, pct, now, avg }) => direction === "near" ? `Последние 24 часа (${now}) на уровне среднего дневного значения за 30 дней (${avg}).` : `Последние 24 часа (${now}) на ${pct}% ${direction === "above" ? "выше" : "ниже"} среднего дневного значения за 30 дней (${avg}).`,
      historyRank: (rank, days) => `По объёму ликвидаций сегодня занимает ${rank}-е место из ${days} дней этого месяца (1 = крупнейший).`,
      explainer: [
        "Ликвидация происходит, когда фьючерсная позиция с плечом теряет столько маржи, что биржа принудительно её закрывает. Позиция продаётся (лонг) или выкупается (шорт) по рынку, что часто толкает цену дальше в том же направлении.",
        "Лонг-сквиз — волна ликвидаций лонгов на падении; шорт-сквиз — её зеркальное отражение на росте. Когда обе колонки велики в одном окне, лонги и шорты вынесло одновременно: резкое движение в одну сторону, затем резкий разворот (多空双杀).",
        "Цифры берутся из публичного потока принудительных ордеров Binance, который передаёт не более одного ордера на символ в секунду, и из эндпоинта ордеров ликвидации OKX для BTC, ETH, SOL, XRP и DOGE. Это нижняя граница по двум биржам, не весь рынок, и не инвестиционная рекомендация.",
      ],
      faq: [
        ["Что такое ликвидация в крипте?", "Принудительное закрытие позиции с плечом биржей, когда её маржа падает ниже поддерживающего уровня. Трейдер теряет маржу; биржа закрывает позицию по рынку, чтобы остановить дальнейшие потери."],
        ["Почему лонги и шорты показаны отдельно?", "Лонги ликвидируются при падении цены, шорты — при росте. Разбивка показывает, какую сторону рынка застали врасплох. Большие суммы с обеих сторон в одном окне указывают на резкое движение с последующим разворотом."],
        ["Откуда данные и насколько они полны?", "Из публичного WebSocket-потока принудительных ордеров Binance USDT-M и публичного API ордеров ликвидации OKX; NexuAlpha агрегирует их каждые пять минут. Binance передаёт не более одного ордера на символ в секунду, поэтому суммы — нижняя граница и охватывают только эти две биржи."],
        ["Как часто обновляется страница?", "Сборщик перезаписывает фид каждые пять минут, а страница перечитывает его каждые 60 секунд, пока открыта. Метка времени над цифрами показывает момент формирования фида в SGT."],
      ],
      datasetName: "Ликвидации криптовалют в реальном времени NexuAlpha (Binance + OKX)",
      datasetDescription: "Агрегированные ликвидации фьючерсов за 1ч, 4ч и 24ч: суммы лонгов и шортов в USD, число ордеров, самые ликвидируемые монеты и крупнейший ордер. Нижняя граница по двум биржам, перезаписывается каждые пять минут.",
    },
    funding: {
      title: "Ставки финансирования — Binance и OKX онлайн | NexuAlpha",
      description: "Ставки финансирования бессрочных контрактов на Binance и OKX для топ-20 монет: текущая ставка, годовая оценка и время следующей выплаты. Плюс — платят лонги.",
      h1: "Ставки финансирования крипто: Binance и OKX",
      lead: "Текущая ставка финансирования за период по самым торгуемым бессрочным контрактам в USDT, годовая оценка и время следующего расчёта на каждой бирже.",
      colSymbol: "Монета", colBinance: "Binance", colOkx: "OKX", colApr: "Годовая (оценка)", colNext: "Следующая выплата", perPeriod: "за период",
      estNote: "Годовая оценка = текущая ставка × 3 × 365 при условии, что 8-часовая ставка повторяется весь год. Это ориентир для сравнения, не прогноз.",
      legend: "Плюс: лонги платят шортам. Минус: шорты платят лонгам.", nextIn: "через",
      sourceLine: "Binance USDT-M premiumIndex + публичный API ставок OKX · монеты по суточному объёму на Binance",
      explainer: [
        "Бессрочные фьючерсы не истекают, поэтому биржи используют платежи финансирования, чтобы держать цену контракта рядом со спотовым индексом. Каждый период (обычно 8 часов) одна сторона платит другой: при положительной ставке лонги платят шортам, при отрицательной — шорты лонгам.",
        "Устойчиво высокая положительная ставка означает, что толпа в лонгах и платит за это — переполненная сделка, которая может быстро развернуться. Отрицательная ставка означает, что платят шорты; это часто бывает после резких падений. Сравнение Binance и OKX показывает, где ту же позицию дешевле держать.",
        "Ставки читаются из публичного API каждой биржи. Колонка годовой оценки умножает текущую ставку на 1 095 периодов в год; это ориентир для сравнения, а не предсказание. Некоторые контракты на одной из бирж рассчитываются каждые 4 часа или каждый час — проверьте спецификацию контракта перед сделкой.",
      ],
      faq: [
        ["Что такое ставка финансирования?", "Периодический платёж между держателями лонгов и шортов бессрочного контракта, который удерживает его цену рядом со спотовым индексом. Он переходит между трейдерами, а не платится бирже."],
        ["Что означает положительная или отрицательная ставка?", "Положительная: лонги платят шортам, рынок смещён в лонг. Отрицательная: шорты платят лонгам, рынок смещён в шорт. Важен размер: 0,01% за 8 часов — обычный нейтральный уровень на Binance; 0,1% и выше — необычно много."],
        ["Как рассчитывается годовая ставка?", "Годовая = текущая ставка × 3 периода в день × 365 дней. Предполагается, что текущая ставка сохранится, что бывает редко, поэтому используйте её для сравнения, а не как ожидаемую доходность."],
        ["Почему Binance и OKX показывают разные ставки?", "Каждая биржа считает финансирование по своей книге ордеров и индексу, со своей процентной составляющей, лимитами и иногда другим интервалом. Этот разрыв — причина, по которой трейдеры сравнивают площадки перед удержанием позиции."],
      ],
      datasetName: "Ставки финансирования бессрочных контрактов в реальном времени NexuAlpha (Binance + OKX)",
      datasetDescription: "Текущая ставка финансирования и время следующего расчёта для топ-20 бессрочных контрактов в USDT на Binance и OKX, прочитанные из публичных API бирж и перезаписываемые каждые пять минут.",
    },
  },
  tr: {
    nav: DATA_PAGE_NAV["tr"],
    common: {
      home: "Ana sayfa", updated: "Güncellendi", source: "Kaynak", refresh: "Sayfa açıkken akışı her 60 saniyede yeniden okur. Saatler SGT.",
      unavailableTitle: "Canlı veri geçici olarak kullanılamıyor", unavailable: "Akış birkaç dakikada bir yenilenir. Veri yokken hiçbir şey tahmin edilmez; kısa süre sonra yeniden deneyin.",
      explainer: "Bu sayfa ne gösterir", faq: "Sık sorulan sorular", relatedData: "Daha fazla canlı veri", json: "Ham JSON akışı",
      embedTitle: "Sitenize gömün", embedIntro: "Bu parçalardan birini yapıştırın. Bileşen bu sayfadaki canlı sayıların aynısını gösterir, her sütun genişliğine uyar ve buraya bağlanır.",
      embedIframe: "iframe", embedScript: "Script etiketi", copy: "Kopyala", copied: "Kopyalandı", embedTerms: "Ücretsiz. Kaynak bağlantısını koruyun; rakamlar Binance ve OKX alt sınırıdır, beş dakikada bir yenilenir.",
      poweredBy: "NexuAlpha tarafından sağlanır", embedUpdated: "güncellendi",
    },
    liquidations: {
      title: "Bugünkü Kripto Tasfiyeleri — Canlı 1s / 4s / 24s | NexuAlpha",
      description: "Kripto vadeli tasfiyeleri canlı: 1s, 4s ve 24s toplamları, long/short dağılımı, en çok tasfiye edilen semboller ve Binance ile OKX'teki en büyük emir.",
      h1: "Bugünkü kripto tasfiyeleri",
      lead: "Son bir saat, dört saat ve 24 saatte Binance ve OKX vadelilerinde zorla kapatılan kaldıraçlı pozisyonların büyüklüğü, long ve short olarak ayrılmış hâlde.",
      h1Window: "Son 1 saat", h4Window: "Son 4 saat", h24Window: "Son 24 saat", total: "Toplam tasfiye",
      longs: "Tasfiye edilen longlar", shorts: "Tasfiye edilen shortlar", orders: (n) => `${n} emir`, split: "Long vs short (24s)",
      topTitle: "En çok tasfiye edilen semboller (24s)", colSymbol: "Sembol", colVenue: "Borsa", colUsd: "Tasfiye", colShare: "Pay",
      largestTitle: "En büyük tek tasfiye (24s)", sideLong: "long", sideShort: "short", largestLine: (s) => `${s.venue} üzerinde ${s.base} ${s.side}`,
      sourceLine: "Binance USDT-M zorunlu emir akışı + OKX tasfiye emirleri",
      coverage: "Sayım başlangıcı",
      historyTitle: "Son 30 gün", historyLead: "Binance ve OKX vadeli işlemlerinde günlük tasfiye toplamları; her UTC günü için saatlik anlık görüntülerden toplanır, long ve short üst üste gösterilir.",
      historyCollecting: (date) => `Geçmiş ${date} tarihinden beri toplanıyor. İki tam gün oluştuğunda 30 günlük grafik görünür.`,
      historyChartLabel: "Günlük tasfiye toplamları, son 30 gün", historyAvg: "30 günlük ortalama", historyToday: "Bugün şimdiye kadar", historyLargest: "Dönemin en büyük günü",
      historyPartial: "Bugünün çubuğu yalnızca şimdiye kadar toplanan saatleri kapsar (UTC).", historyAxis: "Ayın günü (UTC)", historyDays: (n) => `${n} günlük geçmiş`,
      historyVsAvg: ({ direction, pct, now, avg }) => direction === "near" ? `Son 24 saat (${now}) 30 günlük günlük ortalamayla (${avg}) aynı seviyede.` : `Son 24 saat (${now}) 30 günlük günlük ortalamanın (${avg}) %${pct} ${direction === "above" ? "üzerinde" : "altında"}.`,
      historyRank: (rank, days) => `Tasfiye hacmine göre bugün bu ayın ${days} günü içinde ${rank}. sırada (1 = en büyük).`,
      explainer: [
        "Tasfiye, kaldıraçlı bir vadeli pozisyonun teminatı o kadar erir ki borsanın pozisyonu zorla kapatmasıdır. Pozisyon piyasa fiyatından satılır (long) veya geri alınır (short); bu da fiyatı çoğu zaman aynı yönde daha da iter.",
        "Long squeeze, düşüşte art arda long tasfiyeleri; short squeeze ise yükselişte bunun aynadaki görüntüsüdür. Aynı zaman penceresinde iki sütun da büyükse longlar ve shortlar birlikte silinmiştir: bir yöne sert hareket, ardından sert dönüş (多空双杀).",
        "Rakamlar, sembol başına saniyede en fazla bir emir gönderen Binance'in halka açık zorunlu emir akışından ve BTC, ETH, SOL, XRP ve DOGE için OKX'in tasfiye emri uç noktasından gelir. İki borsa için alt sınırdır, tüm piyasa değildir ve yatırım tavsiyesi değildir.",
      ],
      faq: [
        ["Kripto tasfiyesi nedir?", "Teminatı sürdürme gereksiniminin altına düşen kaldıraçlı bir pozisyonun borsa tarafından zorla kapatılmasıdır. Yatırımcı teminatı kaybeder; borsa, daha fazla zararı durdurmak için pozisyonu piyasa fiyatından kapatır."],
        ["Long ve short tasfiyeleri neden ayrı gösteriliyor?", "Longlar fiyat düşerken, shortlar yükselirken tasfiye edilir. Ayrım, piyasanın hangi tarafının yakalandığını gösterir. Aynı pencerede iki tarafta da büyük rakamlar, sert bir hareketin ardından dönüş olduğuna işaret eder."],
        ["Veri nereden geliyor ve ne kadar eksiksiz?", "Binance'in halka açık USDT-M zorunlu emir WebSocket akışından ve OKX'in halka açık tasfiye emirleri API'sinden; NexuAlpha bunları her beş dakikada toplar. Binance sembol başına saniyede en fazla bir emir gönderdiği için toplamlar alt sınırdır ve yalnızca bu iki borsayı kapsar."],
        ["Sayfa ne sıklıkla güncellenir?", "Toplayıcı akışı her beş dakikada yeniden yazar, sayfa açıkken her 60 saniyede yeniden okur. Rakamların üstündeki zaman damgası akışın SGT olarak ne zaman üretildiğini gösterir."],
      ],
      datasetName: "NexuAlpha canlı kripto tasfiyeleri (Binance + OKX)",
      datasetDescription: "1s, 4s ve 24s pencerelerinde toplanan vadeli tasfiyeleri: long ve short USD toplamları, emir sayısı, en çok tasfiye edilen semboller ve en büyük tek emir. İki borsadan alt sınır, her beş dakikada yeniden yazılır.",
    },
    funding: {
      title: "Kripto Fonlama Oranları — Binance vs OKX Perpetual, Canlı | NexuAlpha",
      description: "Binance ve OKX'te en büyük 20 sembol için canlı perpetual fonlama oranları: güncel oran, yıllık tahmin ve sonraki fonlama zamanı. Pozitif: longlar öder.",
      h1: "Kripto fonlama oranları: Binance vs OKX",
      lead: "En çok işlem gören USDT perpetual sözleşmelerinin dönem başına güncel fonlama oranı, yıllık tahmin ve her borsadaki sonraki ödeme zamanı.",
      colSymbol: "Sembol", colBinance: "Binance", colOkx: "OKX", colApr: "Yıllık (tahmin)", colNext: "Sonraki fonlama", perPeriod: "dönem başına",
      estNote: "Yıllık tahmin = güncel oran × 3 × 365; 8 saatlik oranın yıl boyunca tekrarlandığı varsayılır. Karşılaştırma aracıdır, tahmin değildir.",
      legend: "Pozitif: longlar shortlara öder. Negatif: shortlar longlara öder.", nextIn: "kalan",
      sourceLine: "Binance USDT-M premiumIndex + OKX halka açık fonlama API'si · semboller Binance 24s hacmine göre",
      explainer: [
        "Perpetual vadeliler hiç sona ermez; bu yüzden borsalar sözleşme fiyatını spot endekse yakın tutmak için fonlama ödemeleri kullanır. Her dönemde (genellikle 8 saat) bir taraf diğerine öder: oran pozitifken longlar shortlara, negatifken shortlar longlara öder.",
        "Sürekli yüksek pozitif oran, kalabalığın long olduğunu ve bunun için ödeme yaptığını gösterir; böyle sıkışık işlemler hızla çözülebilir. Negatif oran shortların ödediğini gösterir ve sert düşüşlerden sonra sık görülür. Binance ile OKX'i karşılaştırmak aynı pozisyonun nerede daha ucuz tutulduğunu gösterir.",
        "Oranlar her borsanın halka açık API'sinden okunur. Yıllık sütun güncel oranı yılda 1.095 dönemle çarpar; bu bir karşılaştırma aracıdır, öngörü değildir. Bazı sözleşmeler bir borsada 4 saatte veya saatte bir ödenir; işlem öncesi sözleşme özelliklerini kontrol edin.",
      ],
      faq: [
        ["Fonlama oranı nedir?", "Perpetual sözleşmede long ve short tutanlar arasında yapılan, fiyatı spot endekse yakın tutan dönemsel bir ödemedir. Yatırımcılar arasında el değiştirir, borsaya ödenmez."],
        ["Pozitif veya negatif fonlama oranı ne anlama gelir?", "Pozitif: longlar shortlara öder, piyasa long tarafa yaslanır. Negatif: shortlar longlara öder, piyasa short tarafa yaslanır. Büyüklük önemlidir: Binance'te 8 saatte %0,01 yaygın nötr seviyedir; %0,1 ve üzeri alışılmadık derecede yüksektir."],
        ["Yıllık oran nasıl hesaplanır?", "Yıllık = güncel oran × günde 3 dönem × 365 gün. Güncel oranın sürdüğünü varsayar, ki bu nadiren olur; bu yüzden beklenen getiri değil karşılaştırma aracı olarak görün."],
        ["Binance ve OKX neden farklı oranlar gösterir?", "Her borsa fonlamayı kendi emir defteri ve endeksinden, kendi faiz bileşeni, tavanları ve bazen farklı aralıkla hesaplar. Bu fark, yatırımcıların pozisyon tutmadan önce platformları karşılaştırmasının nedenidir."],
      ],
      datasetName: "NexuAlpha canlı perpetual fonlama oranları (Binance + OKX)",
      datasetDescription: "Binance ve OKX'teki en büyük 20 USDT perpetual sembolünün güncel fonlama oranı ve sonraki ödeme zamanı; borsaların halka açık API'lerinden okunur ve her beş dakikada yeniden yazılır.",
    },
  },
  id: {
    nav: DATA_PAGE_NAV["id"],
    common: {
      home: "Beranda", updated: "Diperbarui", source: "Sumber", refresh: "Membaca ulang feed setiap 60 detik selama halaman terbuka. Waktu dalam SGT.",
      unavailableTitle: "Data langsung sementara tidak tersedia", unavailable: "Feed diperbarui setiap beberapa menit. Tidak ada yang diperkirakan saat data hilang; coba lagi sebentar.",
      explainer: "Apa yang ditampilkan halaman ini", faq: "Pertanyaan umum", relatedData: "Data langsung lainnya", json: "Feed JSON mentah",
      embedTitle: "Sematkan di situs Anda", embedIntro: "Tempel salah satu cuplikan ini. Widget menampilkan angka langsung yang sama dengan halaman ini, menyesuaikan lebar kolom, dan menautkan kembali ke sini.",
      embedIframe: "iframe", embedScript: "Tag script", copy: "Salin", copied: "Tersalin", embedTerms: "Gratis. Pertahankan tautan atribusi; angkanya adalah batas bawah dari Binance dan OKX, diperbarui setiap lima menit.",
      poweredBy: "Didukung oleh NexuAlpha", embedUpdated: "diperbarui",
    },
    liquidations: {
      title: "Likuidasi Kripto Hari Ini — Total Langsung 1j / 4j / 24j | NexuAlpha",
      description: "Likuidasi futures kripto langsung: total 1j, 4j, dan 24j, pembagian long vs short, simbol paling banyak dilikuidasi, dan order terbesar di Binance dan OKX.",
      h1: "Likuidasi kripto hari ini",
      lead: "Seberapa besar posisi berleverage yang ditutup paksa dalam satu jam, empat jam, dan 24 jam terakhir di futures Binance dan OKX, dipisah menjadi posisi long dan short.",
      h1Window: "1 jam terakhir", h4Window: "4 jam terakhir", h24Window: "24 jam terakhir", total: "Total dilikuidasi",
      longs: "Long dilikuidasi", shorts: "Short dilikuidasi", orders: (n) => `${n} order`, split: "Long vs short (24j)",
      topTitle: "Simbol paling banyak dilikuidasi (24j)", colSymbol: "Simbol", colVenue: "Bursa", colUsd: "Dilikuidasi", colShare: "Porsi",
      largestTitle: "Likuidasi tunggal terbesar (24j)", sideLong: "long", sideShort: "short", largestLine: (s) => `${s.base} ${s.side} di ${s.venue}`,
      sourceLine: "Stream force-order USDT-M Binance + order likuidasi OKX",
      coverage: "Dihitung sejak",
      historyTitle: "30 hari terakhir", historyLead: "Total likuidasi harian di futures Binance dan OKX, dijumlahkan dari snapshot per jam untuk setiap hari UTC, long dan short ditumpuk.",
      historyCollecting: (date) => `Riwayat dikumpulkan sejak ${date}. Grafik 30 hari muncul setelah ada dua hari penuh.`,
      historyChartLabel: "Total likuidasi harian, 30 hari terakhir", historyAvg: "Rata-rata 30 hari", historyToday: "Hari ini sejauh ini", historyLargest: "Hari terbesar dalam periode",
      historyPartial: "Batang hari ini hanya mencakup jam yang sudah terkumpul (UTC).", historyAxis: "Tanggal (UTC)", historyDays: (n) => `${n} hari riwayat`,
      historyVsAvg: ({ direction, pct, now, avg }) => direction === "near" ? `24 jam terakhir (${now}) sejalan dengan rata-rata harian 30 hari (${avg}).` : `24 jam terakhir (${now}) ${pct}% ${direction === "above" ? "di atas" : "di bawah"} rata-rata harian 30 hari (${avg}).`,
      historyRank: (rank, days) => `Hari ini menempati peringkat ${rank} dari ${days} hari bulan ini berdasarkan volume likuidasi (1 = terbesar).`,
      explainer: [
        "Likuidasi terjadi ketika posisi futures berleverage kehilangan margin begitu besar sehingga bursa menutupnya secara paksa. Posisi dijual (long) atau dibeli kembali (short) di harga pasar, yang sering mendorong harga lebih jauh ke arah yang sama.",
        "Long squeeze adalah gelombang likuidasi long saat harga turun; short squeeze adalah kebalikannya saat harga naik. Ketika kedua kolom besar dalam jendela yang sama, long dan short tersapu bersamaan: pergerakan tajam ke satu arah diikuti pembalikan tajam (多空双杀).",
        "Angka berasal dari stream force-order publik Binance, yang mengirim paling banyak satu order per simbol per detik, plus endpoint order likuidasi OKX untuk BTC, ETH, SOL, XRP, dan DOGE. Ini batas bawah untuk dua bursa, bukan seluruh pasar, dan bukan nasihat investasi.",
      ],
      faq: [
        ["Apa itu likuidasi kripto?", "Penutupan paksa posisi berleverage oleh bursa ketika marginnya turun di bawah persyaratan pemeliharaan. Trader kehilangan margin; bursa menutup posisi di harga pasar untuk menghentikan kerugian lebih lanjut."],
        ["Mengapa likuidasi long dan short ditampilkan terpisah?", "Long dilikuidasi saat harga turun, short saat harga naik. Pembagian ini menunjukkan sisi pasar mana yang terjebak. Angka besar di kedua sisi dalam jendela yang sama menandakan pergerakan tajam yang diikuti pembalikan."],
        ["Dari mana data ini dan seberapa lengkap?", "Dari stream WebSocket force-order USDT-M publik Binance dan API order likuidasi publik OKX, diagregasi oleh NexuAlpha setiap lima menit. Binance mengirim paling banyak satu order per simbol per detik, sehingga total adalah batas bawah dan hanya mencakup dua bursa ini."],
        ["Seberapa sering halaman diperbarui?", "Pengumpul menulis ulang feed setiap lima menit dan halaman membacanya ulang setiap 60 detik selama terbuka. Stempel waktu di atas angka menunjukkan kapan feed dibuat, dalam SGT."],
      ],
      datasetName: "Likuidasi kripto langsung NexuAlpha (Binance + OKX)",
      datasetDescription: "Likuidasi futures agregat dalam jendela 1j, 4j, dan 24j: total USD long dan short, jumlah order, simbol paling banyak dilikuidasi, dan order tunggal terbesar. Batas bawah dari dua bursa, ditulis ulang setiap lima menit.",
    },
    funding: {
      title: "Funding Rate Kripto — Perpetual Binance vs OKX, Langsung | NexuAlpha",
      description: "Funding rate perpetual di Binance dan OKX untuk 20 simbol teratas: rate saat ini, estimasi tahunan, dan waktu funding berikutnya. Positif: long membayar.",
      h1: "Funding rate kripto: Binance vs OKX",
      lead: "Funding rate saat ini per periode untuk kontrak perpetual USDT paling aktif, dengan estimasi tahunan dan waktu penyelesaian berikutnya di tiap bursa.",
      colSymbol: "Simbol", colBinance: "Binance", colOkx: "OKX", colApr: "Tahunan (est.)", colNext: "Funding berikutnya", perPeriod: "per periode",
      estNote: "Estimasi tahunan = rate saat ini × 3 × 365, dengan asumsi rate 8 jam berulang sepanjang tahun. Alat perbandingan, bukan ramalan.",
      legend: "Positif: long membayar short. Negatif: short membayar long.", nextIn: "dalam",
      sourceLine: "premiumIndex USDT-M Binance + API funding publik OKX · simbol berdasarkan volume 24j Binance",
      explainer: [
        "Futures perpetual tidak pernah jatuh tempo, sehingga bursa memakai pembayaran funding untuk menjaga harga kontrak dekat dengan indeks spot. Setiap periode (biasanya 8 jam) satu sisi membayar sisi lain: saat rate positif long membayar short, saat negatif short membayar long.",
        "Rate positif yang terus tinggi berarti mayoritas sedang long dan membayar untuk itu — posisi ramai yang bisa terurai cepat. Rate negatif berarti short yang membayar, sering muncul setelah penurunan tajam. Membandingkan Binance dengan OKX menunjukkan di mana posisi yang sama lebih murah dipertahankan.",
        "Rate dibaca dari API publik tiap bursa. Kolom tahunan mengalikan rate saat ini dengan 1.095 periode per tahun; ini alat perbandingan, bukan prediksi. Beberapa kontrak diselesaikan setiap 4 jam atau setiap jam di satu bursa — periksa spesifikasi kontrak sebelum trading.",
      ],
      faq: [
        ["Apa itu funding rate?", "Pembayaran berkala antara pemegang long dan short kontrak perpetual yang menjaga harganya dekat dengan indeks spot. Dipertukarkan antar trader, bukan dibayarkan ke bursa."],
        ["Apa arti funding rate positif atau negatif?", "Positif: long membayar short dan pasar condong long. Negatif: short membayar long dan pasar condong short. Besarannya penting: 0,01% per 8 jam adalah dasar netral umum di Binance; 0,1% atau lebih tergolong sangat tinggi."],
        ["Bagaimana rate tahunan dihitung?", "Tahunan = rate saat ini × 3 periode per hari × 365 hari. Mengasumsikan rate saat ini bertahan, yang jarang terjadi, jadi gunakan sebagai alat perbandingan, bukan imbal hasil yang diharapkan."],
        ["Mengapa Binance dan OKX menampilkan rate yang berbeda?", "Setiap bursa menghitung funding dari order book dan indeksnya sendiri, dengan komponen suku bunga, batas, dan terkadang interval yang berbeda. Selisih itulah alasan trader membandingkan platform sebelum menahan posisi."],
      ],
      datasetName: "Funding rate perpetual langsung NexuAlpha (Binance + OKX)",
      datasetDescription: "Funding rate saat ini dan waktu penyelesaian berikutnya untuk 20 simbol perpetual USDT teratas di Binance dan OKX, dibaca dari API publik bursa dan ditulis ulang setiap lima menit.",
    },
  },
  vi: {
    nav: DATA_PAGE_NAV["vi"],
    common: {
      home: "Trang chủ", updated: "Cập nhật", source: "Nguồn", refresh: "Đọc lại nguồn dữ liệu mỗi 60 giây khi trang đang mở. Giờ theo SGT.",
      unavailableTitle: "Dữ liệu trực tiếp tạm thời không khả dụng", unavailable: "Nguồn dữ liệu làm mới vài phút một lần. Không có gì được ước tính khi dữ liệu thiếu; hãy thử lại sau ít phút.",
      explainer: "Trang này cho biết điều gì", faq: "Câu hỏi thường gặp", relatedData: "Thêm dữ liệu trực tiếp", json: "Nguồn JSON thô",
      embedTitle: "Nhúng vào trang của bạn", embedIntro: "Dán một trong các đoạn mã này. Widget hiển thị cùng số liệu trực tiếp như trang này, co giãn theo mọi độ rộng và liên kết về đây.",
      embedIframe: "iframe", embedScript: "Thẻ script", copy: "Sao chép", copied: "Đã sao chép", embedTerms: "Miễn phí. Giữ liên kết ghi nguồn; số liệu là giới hạn dưới từ Binance và OKX, cập nhật mỗi năm phút.",
      poweredBy: "Cung cấp bởi NexuAlpha", embedUpdated: "cập nhật",
    },
    liquidations: {
      title: "Thanh lý crypto hôm nay — Tổng trực tiếp 1h / 4h / 24h | NexuAlpha",
      description: "Thanh lý hợp đồng tương lai crypto hôm nay, trực tiếp: tổng 1h, 4h và 24h, tỷ lệ long/short, các mã bị thanh lý nhiều nhất và lệnh lớn nhất trên Binance và OKX.",
      h1: "Thanh lý crypto hôm nay",
      lead: "Lượng vị thế đòn bẩy bị đóng cưỡng chế trong một giờ, bốn giờ và 24 giờ qua trên hợp đồng tương lai Binance và OKX, tách theo vị thế long và short.",
      h1Window: "1 giờ qua", h4Window: "4 giờ qua", h24Window: "24 giờ qua", total: "Tổng thanh lý",
      longs: "Long bị thanh lý", shorts: "Short bị thanh lý", orders: (n) => `${n} lệnh`, split: "Long so với short (24h)",
      topTitle: "Mã bị thanh lý nhiều nhất (24h)", colSymbol: "Mã", colVenue: "Sàn", colUsd: "Đã thanh lý", colShare: "Tỷ trọng",
      largestTitle: "Lệnh thanh lý đơn lớn nhất (24h)", sideLong: "long", sideShort: "short", largestLine: (s) => `${s.base} ${s.side} trên ${s.venue}`,
      sourceLine: "Luồng lệnh cưỡng chế USDT-M của Binance + lệnh thanh lý OKX",
      coverage: "Tính từ",
      historyTitle: "30 ngày gần nhất", historyLead: "Tổng thanh lý theo ngày trên hợp đồng tương lai Binance và OKX, cộng từ các ảnh chụp hàng giờ cho mỗi ngày UTC, long và short xếp chồng.",
      historyCollecting: (date) => `Lịch sử được thu thập từ ${date}. Biểu đồ 30 ngày sẽ hiện khi có đủ hai ngày trọn vẹn.`,
      historyChartLabel: "Tổng thanh lý theo ngày, 30 ngày gần nhất", historyAvg: "Trung bình 30 ngày", historyToday: "Hôm nay đến hiện tại", historyLargest: "Ngày lớn nhất trong kỳ",
      historyPartial: "Cột hôm nay chỉ gồm các giờ đã thu thập (UTC).", historyAxis: "Ngày trong tháng (UTC)", historyDays: (n) => `${n} ngày lịch sử`,
      historyVsAvg: ({ direction, pct, now, avg }) => direction === "near" ? `24 giờ qua (${now}) ngang mức trung bình ngày của 30 ngày (${avg}).` : `24 giờ qua (${now}) ${direction === "above" ? "cao hơn" : "thấp hơn"} ${pct}% so với trung bình ngày của 30 ngày (${avg}).`,
      historyRank: (rank, days) => `Theo khối lượng thanh lý, hôm nay xếp thứ ${rank} trong ${days} ngày của tháng này (1 = lớn nhất).`,
      explainer: [
        "Thanh lý xảy ra khi vị thế hợp đồng tương lai có đòn bẩy mất quá nhiều ký quỹ khiến sàn buộc phải đóng vị thế. Vị thế bị bán (long) hoặc mua lại (short) theo giá thị trường, thường đẩy giá đi xa hơn theo cùng hướng.",
        "Long squeeze là làn sóng thanh lý long khi giá giảm; short squeeze là hình ảnh phản chiếu khi giá tăng. Khi cả hai cột đều lớn trong cùng khung thời gian, long và short cùng bị quét sạch: một cú biến động mạnh theo một hướng rồi đảo chiều mạnh (多空双杀).",
        "Số liệu lấy từ luồng lệnh cưỡng chế công khai của Binance, vốn chỉ gửi tối đa một lệnh mỗi mã mỗi giây, cộng với điểm cuối lệnh thanh lý của OKX cho BTC, ETH, SOL, XRP và DOGE. Đây là giới hạn dưới của hai sàn, không phải toàn thị trường và không phải lời khuyên đầu tư.",
      ],
      faq: [
        ["Thanh lý crypto là gì?", "Là việc sàn buộc đóng một vị thế đòn bẩy khi ký quỹ giảm xuống dưới mức duy trì. Nhà giao dịch mất ký quỹ; sàn đóng vị thế theo giá thị trường để ngăn lỗ thêm."],
        ["Vì sao thanh lý long và short được tách riêng?", "Long bị thanh lý khi giá giảm, short khi giá tăng. Việc tách cho thấy bên nào của thị trường bị bất ngờ. Số lớn ở cả hai bên trong cùng khung thời gian cho thấy một cú biến động mạnh rồi đảo chiều."],
        ["Dữ liệu đến từ đâu và đầy đủ đến mức nào?", "Từ luồng WebSocket lệnh cưỡng chế USDT-M công khai của Binance và API lệnh thanh lý công khai của OKX, được NexuAlpha tổng hợp mỗi năm phút. Binance chỉ gửi tối đa một lệnh mỗi mã mỗi giây nên tổng là giới hạn dưới và chỉ bao gồm hai sàn này."],
        ["Trang cập nhật bao lâu một lần?", "Bộ thu thập ghi lại nguồn dữ liệu mỗi năm phút và trang đọc lại mỗi 60 giây khi đang mở. Dấu thời gian phía trên các con số cho biết thời điểm tạo dữ liệu, theo SGT."],
      ],
      datasetName: "Thanh lý crypto trực tiếp NexuAlpha (Binance + OKX)",
      datasetDescription: "Thanh lý hợp đồng tương lai tổng hợp theo khung 1h, 4h và 24h: tổng USD long và short, số lệnh, mã bị thanh lý nhiều nhất và lệnh đơn lớn nhất. Giới hạn dưới từ hai sàn, ghi lại mỗi năm phút.",
    },
    funding: {
      title: "Funding rate crypto — Binance vs OKX trực tiếp | NexuAlpha",
      description: "Funding rate hợp đồng vĩnh cửu trên Binance và OKX cho 20 mã hàng đầu: tỷ lệ hiện tại, ước tính năm hóa và thời điểm funding tiếp theo. Dương: long trả.",
      h1: "Funding rate crypto: Binance vs OKX",
      lead: "Funding rate hiện tại mỗi kỳ của các hợp đồng vĩnh cửu USDT giao dịch nhiều nhất, cùng ước tính năm hóa và thời điểm thanh toán tiếp theo trên mỗi sàn.",
      colSymbol: "Mã", colBinance: "Binance", colOkx: "OKX", colApr: "Năm hóa (ước tính)", colNext: "Funding tiếp theo", perPeriod: "mỗi kỳ",
      estNote: "Ước tính năm hóa = tỷ lệ hiện tại × 3 × 365, giả định tỷ lệ 8 giờ lặp lại cả năm. Chỉ để so sánh, không phải dự báo.",
      legend: "Dương: long trả cho short. Âm: short trả cho long.", nextIn: "còn",
      sourceLine: "premiumIndex USDT-M Binance + API funding công khai OKX · chọn mã theo khối lượng 24h trên Binance",
      explainer: [
        "Hợp đồng vĩnh cửu không có ngày hết hạn, nên các sàn dùng khoản thanh toán funding để giữ giá hợp đồng gần chỉ số giao ngay. Mỗi kỳ (thường 8 giờ) một bên trả cho bên kia: tỷ lệ dương thì long trả cho short, âm thì short trả cho long.",
        "Tỷ lệ dương cao kéo dài nghĩa là đám đông đang long và trả tiền cho điều đó — một giao dịch quá đông có thể đảo chiều nhanh. Tỷ lệ âm nghĩa là short đang trả, thường xuất hiện sau các cú giảm mạnh. So sánh Binance với OKX cho thấy giữ cùng một vị thế ở đâu rẻ hơn.",
        "Tỷ lệ được đọc từ API công khai của từng sàn. Cột năm hóa nhân tỷ lệ hiện tại với 1.095 kỳ mỗi năm; đó là công cụ so sánh, không phải dự đoán. Một số hợp đồng thanh toán mỗi 4 giờ hoặc mỗi giờ trên một sàn — hãy kiểm tra thông số hợp đồng trước khi giao dịch.",
      ],
      faq: [
        ["Funding rate là gì?", "Khoản thanh toán định kỳ giữa người giữ long và short của hợp đồng vĩnh cửu, giúp giá hợp đồng bám sát chỉ số giao ngay. Khoản này trao đổi giữa các nhà giao dịch, không trả cho sàn."],
        ["Funding rate dương hoặc âm có ý nghĩa gì?", "Dương: long trả cho short, thị trường nghiêng về long. Âm: short trả cho long, thị trường nghiêng về short. Độ lớn rất quan trọng: 0,01% mỗi 8 giờ là mức trung tính phổ biến trên Binance; 0,1% trở lên là cao bất thường."],
        ["Tỷ lệ năm hóa được tính như thế nào?", "Năm hóa = tỷ lệ hiện tại × 3 kỳ mỗi ngày × 365 ngày. Giả định tỷ lệ hiện tại duy trì, điều hiếm khi xảy ra, nên hãy coi đó là công cụ so sánh thay vì lợi suất kỳ vọng."],
        ["Vì sao Binance và OKX hiển thị tỷ lệ khác nhau?", "Mỗi sàn tính funding từ sổ lệnh và chỉ số riêng, với thành phần lãi suất, mức trần và đôi khi chu kỳ khác nhau. Khoảng cách đó là lý do nhà giao dịch so sánh các sàn trước khi giữ vị thế."],
      ],
      datasetName: "Funding rate hợp đồng vĩnh cửu trực tiếp NexuAlpha (Binance + OKX)",
      datasetDescription: "Funding rate hiện tại và thời điểm thanh toán tiếp theo của 20 mã vĩnh cửu USDT hàng đầu trên Binance và OKX, đọc từ API công khai của các sàn và ghi lại mỗi năm phút.",
    },
  },
  ar: {
    nav: DATA_PAGE_NAV["ar"],
    common: {
      home: "الرئيسية", updated: "آخر تحديث", source: "المصدر", refresh: "تُعاد قراءة البيانات كل 60 ثانية ما دامت الصفحة مفتوحة. الأوقات بتوقيت SGT.",
      unavailableTitle: "البيانات المباشرة غير متاحة مؤقتًا", unavailable: "يتجدد المصدر كل بضع دقائق. لا يُقدَّر أي رقم أثناء غيابه؛ حاول مرة أخرى بعد قليل.",
      explainer: "ماذا تعرض هذه الصفحة", faq: "الأسئلة الشائعة", relatedData: "مزيد من البيانات المباشرة", json: "بيانات JSON الخام",
      embedTitle: "ضمّن هذا في موقعك", embedIntro: "الصق أحد هذين المقطعين. تعرض الأداة الأرقام المباشرة نفسها الموجودة في هذه الصفحة، وتتكيف مع أي عرض، وتربط إلى هنا.",
      embedIframe: "iframe", embedScript: "وسم script", copy: "نسخ", copied: "تم النسخ", embedTerms: "مجاني. احتفظ برابط الإسناد؛ الأرقام حد أدنى من Binance وOKX وتُحدَّث كل خمس دقائق.",
      poweredBy: "مقدَّم من NexuAlpha", embedUpdated: "تحديث",
    },
    liquidations: {
      title: "تصفيات العملات الرقمية اليوم — مجاميع مباشرة 1س / 4س / 24س | NexuAlpha",
      description: "تصفيات العقود الآجلة للعملات الرقمية اليوم مباشرة: مجاميع 1س و4س و24س، توزيع الشراء مقابل البيع، أكثر الرموز تصفية، وأكبر أمر على Binance وOKX.",
      h1: "تصفيات العملات الرقمية اليوم",
      lead: "حجم المراكز ذات الرافعة التي أُغلقت قسرًا خلال الساعة الأخيرة وأربع ساعات و24 ساعة على عقود Binance وOKX الآجلة، مقسّمة إلى مراكز شراء وبيع.",
      h1Window: "آخر ساعة", h4Window: "آخر 4 ساعات", h24Window: "آخر 24 ساعة", total: "إجمالي التصفيات",
      longs: "تصفيات مراكز الشراء", shorts: "تصفيات مراكز البيع", orders: (n) => `${n} أمرًا`, split: "الشراء مقابل البيع (24س)",
      topTitle: "أكثر الرموز تصفية (24س)", colSymbol: "الرمز", colVenue: "المنصة", colUsd: "المُصفّى", colShare: "الحصة",
      largestTitle: "أكبر تصفية منفردة (24س)", sideLong: "شراء", sideShort: "بيع", largestLine: (s) => `${s.base} ${s.side} على ${s.venue}`,
      sourceLine: "تدفق الأوامر القسرية USDT-M من Binance + أوامر التصفية من OKX",
      coverage: "العدّ منذ",
      historyTitle: "آخر 30 يومًا", historyLead: "إجمالي التصفيات اليومي على عقود Binance وOKX الآجلة، مجموعًا من لقطات كل ساعة لكل يوم UTC، مع تراكب مراكز الشراء والبيع.",
      historyCollecting: (date) => `يُجمع السجل منذ ${date}. يظهر مخطط 30 يومًا بعد توافر يومين كاملين.`,
      historyChartLabel: "إجمالي التصفيات اليومي، آخر 30 يومًا", historyAvg: "متوسط 30 يومًا", historyToday: "اليوم حتى الآن", historyLargest: "أكبر يوم في الفترة",
      historyPartial: "يغطي عمود اليوم الساعات المجموعة حتى الآن فقط (UTC).", historyAxis: "يوم الشهر (UTC)", historyDays: (n) => `${n} يومًا من السجل`,
      historyVsAvg: ({ direction, pct, now, avg }) => direction === "near" ? `آخر 24 ساعة (${now}) مطابقة تقريبًا للمتوسط اليومي لـ30 يومًا (${avg}).` : `آخر 24 ساعة (${now}) ${direction === "above" ? "أعلى" : "أدنى"} من المتوسط اليومي لـ30 يومًا (${avg}) بنسبة ${pct}%.`,
      historyRank: (rank, days) => `بحجم التصفيات، يحتل اليوم المرتبة ${rank} من ${days} يومًا هذا الشهر (1 = الأكبر).`,
      explainer: [
        "تحدث التصفية عندما يخسر مركز عقود آجلة برافعة مالية قدرًا كبيرًا من الهامش فتُغلقه المنصة قسرًا. يُباع المركز (شراء) أو يُعاد شراؤه (بيع) بسعر السوق، وهو ما يدفع السعر غالبًا أبعد في الاتجاه نفسه.",
        "ضغط الشراء هو موجة تصفيات لمراكز الشراء أثناء الهبوط؛ وضغط البيع هو صورته المعكوسة أثناء الصعود. عندما يكون العمودان كبيرين في النافذة الزمنية نفسها، فقد جُرف الطرفان معًا: حركة حادة في اتجاه ثم انعكاس حاد (多空双杀).",
        "تأتي الأرقام من تدفق الأوامر القسرية العام في Binance، الذي يرسل أمرًا واحدًا على الأكثر لكل رمز في الثانية، إضافة إلى نقطة نهاية أوامر التصفية في OKX لرموز BTC وETH وSOL وXRP وDOGE. إنها حد أدنى لمنصتين فقط، لا السوق بالكامل، وليست نصيحة استثمارية.",
      ],
      faq: [
        ["ما التصفية في العملات الرقمية؟", "هي إغلاق المنصة القسري لمركز برافعة مالية عندما يهبط هامشه دون متطلب الصيانة. يخسر المتداول الهامش، وتغلق المنصة المركز بسعر السوق لمنع مزيد من الخسائر."],
        ["لماذا تُعرض تصفيات الشراء والبيع منفصلة؟", "تُصفّى مراكز الشراء عند هبوط السعر ومراكز البيع عند صعوده. يوضح التقسيم أي جانب من السوق وقع في الفخ. الأرقام الكبيرة على الجانبين في النافذة نفسها تشير إلى حركة حادة تليها انعكاسة."],
        ["من أين تأتي البيانات وما مدى اكتمالها؟", "من تدفق WebSocket العام للأوامر القسرية USDT-M في Binance ومن واجهة أوامر التصفية العامة في OKX، وتجمعها NexuAlpha كل خمس دقائق. ترسل Binance أمرًا واحدًا على الأكثر لكل رمز في الثانية، لذا المجاميع حد أدنى وتغطي هاتين المنصتين فقط."],
        ["كم مرة تُحدَّث الصفحة؟", "يعيد المُجمِّع كتابة البيانات كل خمس دقائق، وتعيد الصفحة قراءتها كل 60 ثانية أثناء فتحها. يوضح الطابع الزمني أعلى الأرقام وقت إنشاء البيانات بتوقيت SGT."],
      ],
      datasetName: "تصفيات العملات الرقمية المباشرة من NexuAlpha (Binance + OKX)",
      datasetDescription: "تصفيات العقود الآجلة المجمّعة على نوافذ 1س و4س و24س: مجاميع الشراء والبيع بالدولار، عدد الأوامر، أكثر الرموز تصفية، وأكبر أمر منفرد. حد أدنى من منصتين، يُعاد كتابته كل خمس دقائق.",
    },
    funding: {
      title: "أسعار التمويل — Binance مقابل OKX مباشرة | NexuAlpha",
      description: "أسعار تمويل العقود الدائمة مباشرة على Binance وOKX لأكبر 20 رمزًا: السعر الحالي، التقدير السنوي، وموعد التمويل التالي. الموجب: يدفع المشترون.",
      h1: "أسعار التمويل للعملات الرقمية: Binance مقابل OKX",
      lead: "سعر التمويل الحالي لكل فترة لأكثر عقود USDT الدائمة تداولًا، مع تقدير سنوي وموعد التسوية التالية على كل منصة.",
      colSymbol: "الرمز", colBinance: "Binance", colOkx: "OKX", colApr: "سنوي (تقدير)", colNext: "التمويل التالي", perPeriod: "لكل فترة",
      estNote: "التقدير السنوي = السعر الحالي × 3 × 365، بافتراض تكرار سعر 8 ساعات طوال العام. أداة مقارنة، لا توقّع.",
      legend: "موجب: يدفع المشترون للبائعين. سالب: يدفع البائعون للمشترين.", nextIn: "بعد",
      sourceLine: "Binance USDT-M premiumIndex + واجهة أسعار التمويل العامة في OKX · الرموز حسب حجم تداول 24س على Binance",
      explainer: [
        "لا تنتهي العقود الدائمة أبدًا، لذا تستخدم المنصات مدفوعات التمويل لإبقاء سعر العقد قريبًا من مؤشر السوق الفوري. في كل فترة (عادة 8 ساعات) يدفع طرف للآخر: عندما يكون السعر موجبًا يدفع المشترون للبائعين، وعندما يكون سالبًا يدفع البائعون للمشترين.",
        "السعر الموجب المرتفع باستمرار يعني أن الأغلبية في مراكز شراء وتدفع ثمن ذلك — صفقة مزدحمة قد تنفك بسرعة. السعر السالب يعني أن البائعين يدفعون، وغالبًا يظهر بعد الهبوط الحاد. مقارنة Binance بـ OKX تُظهر أين يكون الاحتفاظ بالمركز نفسه أرخص.",
        "تُقرأ الأسعار من الواجهة العامة لكل منصة. يضرب العمود السنوي السعر الحالي في 1,095 فترة سنويًا؛ وهو أداة مقارنة لا تنبؤ. بعض العقود تُسوّى كل 4 ساعات أو كل ساعة على إحدى المنصتين — راجع مواصفات العقد قبل التداول.",
      ],
      faq: [
        ["ما سعر التمويل؟", "دفعة دورية بين حاملي مراكز الشراء والبيع في عقد دائم تُبقي سعره قريبًا من مؤشر السوق الفوري. تُتبادل بين المتداولين ولا تُدفع للمنصة."],
        ["ماذا يعني سعر التمويل الموجب أو السالب؟", "موجب: يدفع المشترون للبائعين والسوق يميل إلى الشراء. سالب: يدفع البائعون للمشترين والسوق يميل إلى البيع. الحجم مهم: 0.01% لكل 8 ساعات هو المستوى المحايد الشائع على Binance؛ و0.1% أو أكثر مرتفع بشكل غير معتاد."],
        ["كيف يُحسب السعر السنوي؟", "السنوي = السعر الحالي × 3 فترات يوميًا × 365 يومًا. يفترض استمرار السعر الحالي، وهو ما يندر حدوثه، فتعامل معه كأداة مقارنة لا كعائد متوقع."],
        ["لماذا تعرض Binance وOKX أسعارًا مختلفة؟", "تحسب كل منصة التمويل من دفتر أوامرها ومؤشرها، بمكوّن فائدة وحدود خاصة بها وأحيانًا بفاصل زمني مختلف. هذا الفارق هو سبب مقارنة المتداولين للمنصات قبل الاحتفاظ بمركز."],
      ],
      datasetName: "أسعار تمويل العقود الدائمة المباشرة من NexuAlpha (Binance + OKX)",
      datasetDescription: "سعر التمويل الحالي وموعد التسوية التالية لأكبر 20 رمز USDT دائمًا على Binance وOKX، مقروءة من الواجهات العامة للمنصتين ويُعاد كتابتها كل خمس دقائق.",
    },
  },
};

const REVIEW_PENDING_COPY_PATCH = Object.freeze({
  // l10n: needs native review
  ur: {
    nav: DATA_PAGE_NAV["ur"],
    common: {
      home: "ہوم", updated: "اپ ڈیٹ", source: "ماخذ", refresh: "صفحہ کھلا ہو تو فیڈ ہر 60 سیکنڈ بعد دوبارہ پڑھی جاتی ہے۔ اوقات SGT میں ہیں۔",
      unavailableTitle: "لائیو ڈیٹا عارضی طور پر دستیاب نہیں", unavailable: "فیڈ ہر چند منٹ بعد تازہ ہوتی ہے۔ غیر موجودگی میں کوئی اندازہ نہیں لگایا جاتا — کچھ دیر بعد دوبارہ کوشش کریں۔",
      explainer: "یہ صفحہ کیا دکھاتا ہے", faq: "اکثر پوچھے گئے سوالات", relatedData: "مزید لائیو ڈیٹا", json: "خام JSON فیڈ",
      embedTitle: "اسے اپنی سائٹ پر ایمبیڈ کریں", embedIntro: "ان میں سے کوئی ٹکڑا پیسٹ کریں۔ ویجیٹ یہی براہ راست اعداد دکھاتا ہے، کسی بھی کالم کی چوڑائی میں فٹ ہوتا ہے اور واپس اسی صفحے سے لنک کرتا ہے۔",
      embedIframe: "iframe", embedScript: "اسکرپٹ ٹیگ", copy: "کاپی", copied: "کاپی ہو گیا", embedTerms: "ایمبیڈ مفت ہے۔ انتسابی لنک برقرار رکھیں؛ اعداد Binance اور OKX سے کم از کم حد ہیں اور ہر پانچ منٹ بعد تازہ ہوتے ہیں۔",
      poweredBy: "NexuAlpha سے تقویت یافتہ", embedUpdated: "اپ ڈیٹ",
    },
    liquidations: {
      title: "آج کی کرپٹو لیکویڈیشنز — لائیو 1 گھنٹہ / 4 گھنٹے / 24 گھنٹے | NexuAlpha",
      description: "آج کی براہ راست کرپٹو فیوچرز لیکویڈیشنز: 1 گھنٹہ، 4 گھنٹے اور 24 گھنٹے کے کل اعداد، لانگ اور شارٹ تقسیم، سب سے زیادہ لیکویڈ ہونے والے رموز اور Binance و OKX پر سب سے بڑا واحد آرڈر۔",
      h1: "آج کی کرپٹو لیکویڈیشنز",
      lead: "Binance اور OKX فیوچرز پر پچھلے ایک، چار اور 24 گھنٹوں میں کتنا لیوریجڈ کرپٹو زبردستی بند ہوا، لانگ اور شارٹ پوزیشنز کی تقسیم کے ساتھ۔",
      h1Window: "گزشتہ 1 گھنٹہ", h4Window: "گزشتہ 4 گھنٹے", h24Window: "گزشتہ 24 گھنٹے", total: "کل لیکویڈیشن",
      longs: "لانگ لیکویڈیشنز", shorts: "شارٹ لیکویڈیشنز", orders: (n) => `${n} آرڈرز`, split: "لانگ بمقابلہ شارٹ (24 گھنٹے)",
      topTitle: "سب سے زیادہ لیکویڈ ہونے والے رموز (24 گھنٹے)", colSymbol: "علامت", colVenue: "ایکسچینج", colUsd: "لیکویڈ رقم", colShare: "حصہ",
      largestTitle: "سب سے بڑی واحد لیکویڈیشن (24 گھنٹے)", sideLong: "لانگ", sideShort: "شارٹ", largestLine: (s) => `${s.base} ${s.side} — ${s.venue}`,
      sourceLine: "Binance USDT-M جبری آرڈر اسٹریم + OKX لیکویڈیشن آرڈرز",
      coverage: "گنتی شروع", historyTitle: "گزشتہ 30 دن", historyLead: "Binance اور OKX فیوچرز پر روزانہ لیکویڈیشن کے کل اعداد، ہر UTC دن کے گھنٹہ وار اسنیپ شاٹس سے جمع، لانگ اور شارٹ الگ تہوں میں۔",
      historyCollecting: (date) => `تاریخ ${date} سے جمع ہو رہی ہے۔ 30 دن کا چارٹ دو مکمل دن دستیاب ہونے کے بعد ظاہر ہوتا ہے۔`,
      historyChartLabel: "روزانہ لیکویڈیشن کل اعداد، گزشتہ 30 دن", historyAvg: "30 دن اوسط", historyToday: "آج اب تک", historyLargest: "اس عرصے کا سب سے بڑا دن",
      historyPartial: "آج کا ستون صرف اب تک جمع شدہ گھنٹے دکھاتا ہے (UTC).", historyAxis: "مہینے کا دن (UTC)", historyDays: (n) => `${n} دن کی تاریخ`,
      historyVsAvg: ({ direction, pct, now, avg }) => direction === "near" ? `گزشتہ 24 گھنٹے (${now}) 30 دن کی روزانہ اوسط (${avg}) کے قریب ہیں۔` : `گزشتہ 24 گھنٹے (${now}) 30 دن کی روزانہ اوسط (${avg}) سے ${pct}% ${direction === "above" ? "اوپر" : "نیچے"} ہیں۔`,
      historyRank: (rank, days) => `لیکویڈیشن حجم کے لحاظ سے آج اس مہینے کے ${days} دنوں میں ${rank} نمبر پر ہے (1 = سب سے بڑا).`,
      explainer: [
        "لیکویڈیشن اس وقت ہوتی ہے جب لیوریجڈ فیوچرز پوزیشن اتنا مارجن کھو دیتی ہے کہ ایکسچینج اسے زبردستی بند کر دیتا ہے۔ پوزیشن مارکیٹ پر بیچی جاتی ہے (لانگ) یا واپس خریدی جاتی ہے (شارٹ)، جو اکثر قیمت کو اسی سمت مزید دھکیلتا ہے۔",
        "لانگ دباؤ گراوٹ کے دوران لانگ لیکویڈیشنز کی لہر ہے؛ شارٹ دباؤ ریلی کے دوران اس کا عکس ہے۔ جب اسی وقت کے خانے میں دونوں کالم بڑے ہوں تو دونوں طرف صاف ہوئیں — ایک تیز حرکت کے بعد تیز پلٹاؤ، جسے ٹریڈرز 多空双杀 کہتے ہیں۔",
        "اعداد Binance کے عوامی جبری آرڈر اسٹریم سے آتے ہیں، جو ہر علامت فی سیکنڈ زیادہ سے زیادہ ایک آرڈر بھیجتا ہے، ساتھ OKX کے BTC, ETH, SOL, XRP اور DOGE لیکویڈیشن آرڈر API سے۔ یہ دو ایکسچینجز کی کم حد ہے، پوری مارکیٹ نہیں، اور سرمایہ کاری کا مشورہ نہیں۔",
      ],
      faq: [
        ["کرپٹو لیکویڈیشن کیا ہے؟", "جب لیوریجڈ پوزیشن کا مارجن لازمی حد سے نیچے آ جائے تو ایکسچینج اسے زبردستی بند کر دیتا ہے۔ ٹریڈر مارجن کھو دیتا ہے؛ ایکسچینج مزید نقصان روکنے کے لیے پوزیشن مارکیٹ پر بند کرتا ہے۔"],
        ["لانگ اور شارٹ لیکویڈیشن الگ کیوں دکھائی گئی ہیں؟", "لانگ لیکویڈیشن قیمت گرنے پر ہوتی ہے، شارٹ لیکویڈیشن قیمت بڑھنے پر۔ یہ تقسیم دکھاتی ہے کہ مارکیٹ کی کون سی طرف پھنس گئی۔ ایک ہی وقت کے خانے میں دونوں طرف بڑے اعداد تیز حرکت کے بعد پلٹاؤ، یعنی 多空双杀، کی طرف اشارہ کرتے ہیں۔"],
        ["یہ ڈیٹا کہاں سے آتا ہے اور کتنا مکمل ہے؟", "Binance کے عوامی USDT-M جبری آرڈر WebSocket اسٹریم اور OKX کے عوامی لیکویڈیشن آرڈرز API سے؛ NexuAlpha ہر پانچ منٹ بعد اسے جمع کرتا ہے۔ Binance ہر علامت فی سیکنڈ زیادہ سے زیادہ ایک آرڈر بھیجتا ہے، اس لیے کل اعداد کم حد ہیں اور صرف ان دو ایکسچینجز کو کور کرتے ہیں۔"],
        ["یہ صفحہ کتنی بار اپ ڈیٹ ہوتا ہے؟", "کلیکٹر ہر پانچ منٹ بعد فیڈ دوبارہ لکھتا ہے اور صفحہ کھلا ہو تو ہر 60 سیکنڈ بعد اسے دوبارہ پڑھتا ہے۔ اعداد کے اوپر وقت دکھاتا ہے کہ فیڈ آخری بار کب SGT میں بنی۔"],
      ],
      datasetName: "NexuAlpha براہ راست کرپٹو لیکویڈیشنز (Binance + OKX)",
      datasetDescription: "1 گھنٹہ، 4 گھنٹے اور 24 گھنٹے کے خانوں میں جمع شدہ فیوچرز لیکویڈیشنز: لانگ اور شارٹ کے USD کل اعداد، آرڈر گنتی، سب سے زیادہ لیکویڈ ہونے والے رموز اور سب سے بڑا واحد آرڈر۔ دو ایکسچینجز سے کم از کم حد، ہر پانچ منٹ بعد دوبارہ لکھی جاتی ہے۔",
    },
    funding: {
      title: "کرپٹو فنڈنگ شرحیں — Binance مقابل OKX پرپیچوئلز، براہ راست | NexuAlpha",
      description: "Binance اور OKX پر 20 بڑے رموز کے لیے براہ راست پرپیچوئل فنڈنگ شرحیں: موجودہ شرح، سالانہ تخمینہ اور اگلی فنڈنگ کا وقت۔ مثبت شرح میں لانگ پوزیشنز شارٹ پوزیشنز کو ادائیگی کرتی ہیں۔",
      h1: "کرپٹو فنڈنگ شرحیں: Binance مقابل OKX", lead: "سب سے زیادہ ٹریڈ ہونے والے USDT پرپیچوئل معاہدوں کے لیے ہر مدت کی موجودہ فنڈنگ شرح، سالانہ تخمینہ اور ہر ایکسچینج پر اگلے تصفیے کا وقت۔",
      colSymbol: "علامت", colBinance: "Binance", colOkx: "OKX", colApr: "سالانہ تخمینہ", colNext: "اگلی فنڈنگ", perPeriod: "فی مدت",
      estNote: "سالانہ تخمینہ = موجودہ شرح × 3 × 365، اس فرض کے ساتھ کہ 8 گھنٹے کی شرح پورا سال دہرائی جائے۔ یہ موازنہ مدد ہے، پیش گوئی نہیں۔",
      legend: "مثبت شرح: لانگ پوزیشنز شارٹ پوزیشنز کو ادائیگی کرتی ہیں۔ منفی شرح: شارٹ پوزیشنز لانگ پوزیشنز کو ادائیگی کرتی ہیں۔", nextIn: "میں",
      sourceLine: "Binance USDT-M premiumIndex + OKX عوامی فنڈنگ شرح API · Binance کے 24 گھنٹے حجم کے بڑے رموز",
      explainer: [
        "پرپیچوئل فیوچرز ختم نہیں ہوتے، اس لیے ایکسچینجز فنڈنگ ادائیگیاں استعمال کرتے ہیں تاکہ معاہدے کی قیمت اسپاٹ انڈیکس کے قریب رہے۔ ہر فنڈنگ مدت میں، عموماً ہر 8 گھنٹے، ایک طرف دوسری کو ادائیگی کرتی ہے۔",
        "مسلسل بلند مثبت شرح کا مطلب ہے کہ زیادہ تر بازار لانگ طرف ہے اور اس کی لاگت ادا کر رہا ہے — ہجوم والی پوزیشن جلد پلٹ سکتی ہے۔ منفی شرح کا مطلب ہے کہ شارٹ پوزیشنز ادائیگی کر رہی ہیں، جو اکثر تیز گراوٹ کے بعد آتا ہے۔",
        "شرحیں ہر ایکسچینج کی عوامی API سے پڑھی جاتی ہیں۔ سالانہ تخمینہ والا کالم موجودہ شرح کو سال کے 1,095 ادوار سے ضرب دیتا ہے؛ یہ موازنہ مدد ہے، پیش گوئی نہیں۔ کچھ معاہدے کسی ایک پلیٹ فارم پر ہر 4 گھنٹے یا ہر گھنٹے تصفیہ کرتے ہیں — ٹریڈ سے پہلے معاہدے کی تفصیل چیک کریں۔",
      ],
      faq: [
        ["فنڈنگ شرح کیا ہے؟", "پرپیچوئل معاہدے کی لانگ اور شارٹ پوزیشن رکھنے والوں کے درمیان وقفہ وار ادائیگی، جو اس کی قیمت کو اسپاٹ انڈیکس کے قریب رکھتی ہے۔ یہ ٹریڈرز کے درمیان منتقل ہوتی ہے؛ ایکسچینج کو فیس نہیں دی جاتی۔"],
        ["مثبت یا منفی فنڈنگ شرح کا کیا مطلب ہے؟", "مثبت: لانگ پوزیشنز شارٹ پوزیشنز کو ادائیگی کرتی ہیں اور بازار لانگ طرف جھکتا ہے۔ منفی: شارٹ پوزیشنز لانگ پوزیشنز کو ادائیگی کرتی ہیں اور بازار شارٹ طرف جھکتا ہے۔ مقدار اہم ہے: Binance پر ہر 8 گھنٹے 0.01% عام غیر جانب دار بنیاد ہے؛ 0.1% یا اس سے زیادہ غیر معمولی طور پر بلند ہے۔"],
        ["سالانہ شرح کیسے حساب ہوتی ہے؟", "سالانہ شرح = موجودہ شرح × روزانہ 3 ادوار × 365 دن۔ یہ فرض کرتی ہے کہ موجودہ شرح برقرار رہے گی، جو کم ہی ہوتا ہے، اس لیے اسے متوقع منافع کے بجائے موازنہ مدد سمجھیں۔"],
        ["Binance اور OKX مختلف شرحیں کیوں دکھاتے ہیں؟", "ہر ایکسچینج اپنی آرڈر بک اور انڈیکس سے فنڈنگ حساب کرتا ہے، اپنی شرح سود جزو، حدوں اور کبھی مختلف وقفے کے ساتھ۔ یہی فرق ٹریڈرز کو پوزیشن رکھنے سے پہلے پلیٹ فارمز کا موازنہ کرواتا ہے۔"],
      ],
      datasetName: "NexuAlpha براہ راست پرپیچوئل فنڈنگ شرحیں (Binance + OKX)",
      datasetDescription: "Binance اور OKX پر 20 بڑے USDT پرپیچوئل رموز کی موجودہ فنڈنگ شرح اور اگلے تصفیے کا وقت، دونوں ایکسچینجز کی عوامی APIs سے پڑھا گیا اور ہر پانچ منٹ بعد دوبارہ لکھا جاتا ہے۔",
    },
  },
  // l10n: needs native review
  uk: {
    nav: DATA_PAGE_NAV["uk"],
    common: {
      home: "Головна", updated: "Оновлено", source: "Джерело", refresh: "Поки сторінка відкрита, фід перечитується кожні 60 секунд. Час подано в SGT.",
      unavailableTitle: "Живі дані тимчасово недоступні", unavailable: "Фід оновлюється кожні кілька хвилин. Коли його немає, нічого не оцінюється — спробуйте ще раз трохи пізніше.",
      explainer: "Що показує ця сторінка", faq: "Поширені запитання", relatedData: "Більше живих даних", json: "Сирий JSON-фід",
      embedTitle: "Вбудувати на свій сайт", embedIntro: "Вставте один із цих фрагментів. Віджет показує ті самі живі числа, підлаштовується під будь-яку ширину колонки й посилається назад сюди.",
      embedIframe: "iframe", embedScript: "Тег script", copy: "Копіювати", copied: "Скопійовано", embedTerms: "Вбудовування безплатне. Залишайте посилання з атрибуцією; числа є нижньою межею з Binance та OKX і оновлюються кожні п’ять хвилин.",
      poweredBy: "Працює на NexuAlpha", embedUpdated: "оновлено",
    },
    liquidations: {
      title: "Криптоліквідації сьогодні — 1г / 4г / 24г | NexuAlpha",
      description: "Живі ліквідації криптоф’ючерсів: підсумки за 1, 4 і 24 години, розподіл довгих і коротких позицій, найліквідованіші символи й найбільший ордер на Binance та OKX.",
      h1: "Криптоліквідації сьогодні", lead: "Скільки криптопозицій із плечем примусово закрито за останню годину, чотири години та 24 години на ф’ючерсах Binance і OKX, з розподілом на довгі та короткі позиції.",
      h1Window: "Остання 1 година", h4Window: "Останні 4 години", h24Window: "Останні 24 години", total: "Усього ліквідовано",
      longs: "Ліквідовано довгі позиції", shorts: "Ліквідовано короткі позиції", orders: (n) => `${n} ордерів`, split: "Довгі проти коротких позицій (24 год)",
      topTitle: "Найбільш ліквідовані символи (24 год)", colSymbol: "Символ", colVenue: "Біржа", colUsd: "Ліквідовано", colShare: "Частка",
      largestTitle: "Найбільша одиночна ліквідація (24 год)", sideLong: "довга позиція", sideShort: "коротка позиція", largestLine: (s) => `${s.base} ${s.side} на ${s.venue}`,
      sourceLine: "Стрім примусових ордерів Binance USDT-M + ордери ліквідацій OKX",
      coverage: "Рахується з", historyTitle: "Останні 30 днів", historyLead: "Денні підсумки ліквідацій на ф’ючерсах Binance та OKX, зібрані з погодинних знімків за кожен день UTC, із поділом довгих і коротких позицій.",
      historyCollecting: (date) => `Історія збирається з ${date}. 30-денний графік з’явиться після появи двох повних днів.`,
      historyChartLabel: "Денні підсумки ліквідацій, останні 30 днів", historyAvg: "30-денне середнє", historyToday: "Сьогодні поки що", historyLargest: "Найбільший день у вікні",
      historyPartial: "Сьогоднішній стовпчик охоплює лише вже зібрані години (UTC).", historyAxis: "День місяця (UTC)", historyDays: (n) => `${n} днів історії`,
      historyVsAvg: ({ direction, pct, now, avg }) => direction === "near" ? `Останні 24 години (${now}) близькі до 30-денного денного середнього (${avg}).` : `Останні 24 години (${now}) на ${pct}% ${direction === "above" ? "вище" : "нижче"} за 30-денне денне середнє (${avg}).`,
      historyRank: (rank, days) => `За обсягом ліквідацій сьогодні посідає ${rank} місце з ${days} днів цього місяця (1 = найбільший).`,
      explainer: [
        "Ліквідація відбувається, коли ф’ючерсна позиція з плечем втрачає стільки маржі, що біржа примусово її закриває. Довга позиція продається або коротка позиція викуповується за ринком, що часто штовхає ціну далі в тому самому напрямку.",
        "Тиск на довгі позиції — це хвиля їхніх ліквідацій під час падіння; тиск на короткі позиції є дзеркальною ситуацією під час ралі. Коли обидві колонки великі в одному вікні, обидві сторони були вибиті — різкий рух в один бік і різкий розворот, тобто 多空双杀.",
        "Числа беруться з публічного стріму примусових ордерів Binance, який надсилає максимум один ордер на символ за секунду, плюс API ліквідаційних ордерів OKX для BTC, ETH, SOL, XRP і DOGE. Це нижня межа для двох бірж, не весь ринок, і не інвестиційна порада.",
      ],
      faq: [
        ["Що таке криптоліквідація?", "Це примусове закриття позиції з плечем біржею, коли її маржа падає нижче підтримувальної вимоги. Трейдер втрачає маржу; біржа закриває позицію за ринком, щоб зупинити подальші збитки."],
        ["Навіщо показувати ліквідації довгих і коротких позицій окремо?", "Ліквідації довгих позицій відбуваються, коли ціна падає, а ліквідації коротких позицій — коли зростає. Розподіл показує, яка сторона ринку потрапила в пастку. Великі числа з обох боків в одному вікні вказують на різкий рух і подальший розворот (多空双杀)."],
        ["Звідки ці дані й наскільки вони повні?", "З публічного WebSocket-стріму примусових ордерів Binance USDT-M і публічного API ліквідаційних ордерів OKX; NexuAlpha агрегує дані кожні п’ять хвилин. Binance надсилає максимум один ордер на символ за секунду, тому підсумки є нижньою межею й покривають лише ці дві біржі."],
        ["Як часто оновлюється сторінка?", "Збирач переписує фід кожні п’ять хвилин, а сторінка перечитує його кожні 60 секунд, поки відкрита. Позначка часу над числами показує, коли фід востаннє було згенеровано в SGT."],
      ],
      datasetName: "Живі криптоліквідації NexuAlpha (Binance + OKX)",
      datasetDescription: "Агреговані ф’ючерсні ліквідації у вікнах 1 год, 4 год і 24 год: суми довгих і коротких позицій у USD, кількість ордерів, найбільш ліквідовані символи й найбільший окремий ордер. Нижня межа з двох бірж, переписується кожні п’ять хвилин.",
    },
    funding: {
      title: "Ставки фінансування криптодеривативів: Binance проти OKX | NexuAlpha",
      description: "Живі ставки фінансування безстрокових контрактів Binance та OKX для 20 найбільших символів: поточна ставка, річна оцінка й час наступного фінансування. Позитивне значення: довгі позиції платять коротким.",
      h1: "Ставки фінансування криптодеривативів: Binance проти OKX", lead: "Поточна ставка фінансування за період для найактивніших USDT безстрокових контрактів, з річною оцінкою й часом наступного розрахунку на кожній біржі.",
      colSymbol: "Символ", colBinance: "Binance", colOkx: "OKX", colApr: "Річний (оцінка)", colNext: "Наступне фінансування", perPeriod: "за період",
      estNote: "Річна оцінка = поточна ставка × 3 × 365, якщо припустити, що 8-годинна ставка повторюється весь рік. Це допомога для порівняння, не прогноз.",
      legend: "Позитивна ставка: довгі позиції платять коротким. Негативна: короткі позиції платять довгим.", nextIn: "через",
      sourceLine: "Binance USDT-M premiumIndex + публічний API ставки фінансування OKX · найбільші символи за 24-годинним обсягом Binance",
      explainer: [
        "Безстрокові ф’ючерси не мають строку завершення, тому біржі використовують платежі фінансування, щоб ціна контракту трималася біля спотового індексу. Кожен період фінансування (зазвичай 8 годин) одна сторона платить іншій.",
        "Стійко висока позитивна ставка означає, що більшість стоїть у довгих позиціях і платить за це — переповнена угода може швидко розгорнутися назад. Негативна ставка означає, що платять короткі позиції, часто після різких падінь. Порівняння Binance з OKX показує, де ту саму позицію дешевше тримати.",
        "Ставки читаються з публічного API кожної біржі. Річна колонка множить поточну ставку на 1 095 періодів на рік; це інструмент порівняння, не прогноз. Деякі контракти розраховуються кожні 4 години або щогодини на одній біржі — перевіряйте специфікацію перед торгівлею.",
      ],
      faq: [
        ["Що таке ставка фінансування?", "Періодичний платіж між власниками довгих і коротких позицій у безстроковому контракті, який утримує його ціну близько до спотового індексу. Він переходить між трейдерами, а не сплачується біржі."],
        ["Що означає позитивна або негативна ставка фінансування?", "Позитивна ставка означає, що довгі позиції платять коротким і ринок схиляється в бік довгих позицій. Негативна ставка означає, що короткі позиції платять довгим і ринок схиляється в бік коротких. Розмір важливий: 0,01% за 8 годин — типова нейтральна база на Binance; 0,1% або більше є незвично високим."],
        ["Як розраховується річна ставка?", "Річна ставка = поточна ставка × 3 періоди на день × 365 днів. Це припускає, що поточна ставка збережеться, що трапляється рідко, тому розглядайте її як інструмент порівняння, а не очікувану дохідність."],
        ["Чому Binance і OKX показують різні ставки?", "Кожна біржа обчислює фінансування зі своєї книги ордерів та індексу, із власною складовою процентної ставки, обмеженнями й іноді іншим інтервалом. Через цю різницю трейдери порівнюють платформи перед утриманням позиції."],
      ],
      datasetName: "Живі ставки фінансування безстрокових контрактів NexuAlpha (Binance + OKX)",
      datasetDescription: "Поточна ставка фінансування й час наступного розрахунку для 20 найбільших USDT безстрокових символів на Binance та OKX, прочитані з публічних APIs обох бірж і переписані кожні п’ять хвилин.",
    },
  },
});

const copyForReviewPendingLocale = (locale) => {
  const patch = REVIEW_PENDING_COPY_PATCH[locale];
  if (!patch) return null;
  return {
    ...COPY.en,
    ...patch,
    common: { ...COPY.en.common, ...patch.common },
    liquidations: { ...COPY.en.liquidations, ...patch.liquidations },
    funding: { ...COPY.en.funding, ...patch.funding },
  };
};


export function dataPageCopy(locale) {
  return COPY[locale] || copyForReviewPendingLocale(locale) || (String(locale || "").startsWith("zh") ? COPY["zh-Hans"] : COPY.en);
}
export const dataPageLocaleKeys = () => Object.keys(COPY);

function pageKey(pathname) {
  if (pathname === LIQUIDATIONS_PATH) return "liquidations";
  if (pathname === FUNDING_RATES_PATH) return "funding";
  return null;
}

export function isDataPagePath(pathname) {
  return DATA_PAGE_PATHS.includes(pathname);
}

export function dataPageMeta(pathname, locale) {
  const key = pageKey(pathname);
  if (!key) return null;
  const page = dataPageCopy(locale)[key];
  return { title: page.title, description: page.description, h1: page.h1 };
}

const localizedUrl = (pathname, locale, origin) => `${origin}${localizedPath(pathname, locale)}`.replace(/\/$/, "") || origin;

// FAQPage + Dataset + BreadcrumbList for the route metadata (worker) and the client head. Deterministic: no live
// numbers, so the schema never goes stale between collector cycles. temporalCoverage is open-ended from the launch
// date (the pages have shown live figures since then); for /liquidations it moves earlier when the worker passes a
// `history` (readHistory) whose first hourly snapshot predates the launch — never later, the live window counts too.
const DATA_LAUNCH_DAY = "2026-10-10";
export function dataPageTemporalCoverage(key, history) {
  const since = key === "liquidations" && history?.since ? history.since.slice(0, 10) : null;
  return `${since && since < DATA_LAUNCH_DAY ? since : DATA_LAUNCH_DAY}/..`;
}
export function dataPageSchemas(pathname, locale, { origin = PUBLIC_ORIGIN, history = null } = {}) {
  const key = pageKey(pathname);
  if (!key) return [];
  const copy = dataPageCopy(locale);
  const page = copy[key];
  const url = localizedUrl(pathname, locale, origin);
  const homeUrl = localizedUrl("/", locale, origin);
  return [
    {
      "@context": "https://schema.org", "@type": "Dataset",
      name: page.datasetName, description: page.datasetDescription, url, inLanguage: locale,
      isAccessibleForFree: true, license: `${origin}/methodology#data-license`,
      creator: RESEARCH_DESK,
      publisher: NEXUALPHA_PUBLISHER,
      temporalCoverage: dataPageTemporalCoverage(key, history),
      keywords: key === "liquidations" ? ["crypto liquidations", "long squeeze", "short squeeze", "Binance", "OKX", "futures"] : ["funding rate", "perpetual futures", "Binance", "OKX", "annualized funding"],
      variableMeasured: key === "liquidations"
        ? ["longUsd", "shortUsd", "totalUsd", "orders", "topSymbols", "largest"]
        : ["binanceRate", "binanceNextAt", "okxRate", "okxNextAt"],
      measurementTechnique: key === "liquidations"
        ? "Binance USDT-M force-order WebSocket stream (at most one order per symbol per second) plus OKX public liquidation-orders API; aggregated every five minutes; lower bound"
        : "Binance USDT-M premiumIndex and OKX public funding-rate API, read every five minutes",
      distribution: [{ "@type": "DataDownload", encodingFormat: "application/json", contentUrl: `${origin}${MARKET_EVENTS_PATH}` }],
    },
    {
      "@context": "https://schema.org", "@type": "FAQPage", inLanguage: locale,
      mainEntity: page.faq.map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })),
    },
    {
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: copy.common.home, item: homeUrl },
        { "@type": "ListItem", position: 2, name: page.h1, item: url },
      ],
    },
  ];
}
