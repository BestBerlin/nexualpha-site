// Linkable data assets (SEO W43, 2026-10-18): pure builders shared by the pages (route chunk route-data-assets), the
// Worker head (Dataset JSON-LD), the CSV downloads (/research/<key>.csv) and the SVG embeds (/embed/<key>.svg).
// Every figure comes from data the site already publishes; nothing is estimated:
// - exchange-fee-index: src/data/exchange-facts.js (official fee pages, review date per venue). Unchecked fields stay
//   empty with status "not-checked".
// - tokenized-stock-tracker: src/data/tokenized-stocks-facts.js (research packet, every value with its official source).
// - whale-accumulation-report: the live whale feed (/api/whales.json, collector file) — signals of the tracked
//   Hyperliquid wallets whose last fill falls in the 7 days before the snapshot. No feed = no report (unavailable).
import { factsForVenue, feeFact, feePct } from "./exchange-facts.js";
import { orderVenues } from "./venue-priority.js";
import { TS_CHECKED, TS_EXCHANGES, TS_SOURCES, tsSymbol } from "./tokenized-stocks-facts.js";
import { DATA_ASSETS, dataAssetCsvPath, dataAssetSvgPath } from "./data-assets-routes.js";

export const DATA_ASSET_ORIGIN = "https://nexualpha.com";
export const DATA_ASSET_LICENSE_URL = "https://creativecommons.org/licenses/by/4.0/";
export const DATA_ASSET_LICENSE_NAME = "CC BY 4.0";
export const DATA_ASSET_AUTHOR = "NexuAlpha Research";
export const DATA_ASSETS_LAUNCH_DAY = "2026-10-18";

// Singapore time (site rule): own tiny formatter so this route chunk does not absorb sgt-time.js.
const SGT = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Singapore", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
export function sgtParts(value) {
  const t = typeof value === "number" ? value : Date.parse(value);
  if (!Number.isFinite(t)) return null;
  const p = Object.fromEntries(SGT.formatToParts(new Date(t)).map((x) => [x.type, x.value]));
  return { day: `${p.year}-${p.month}-${p.day}`, time: `${p.hour === "24" ? "00" : p.hour}:${p.minute}` };
}
/** "2026-10-18 22:48 SGT" (zh: "… 新加坡时间"). */
export function sgtStamp(value, locale = "en") {
  const p = sgtParts(value);
  return p ? `${p.day} ${p.time} ${String(locale).startsWith("zh") ? "新加坡时间" : "SGT"}` : "—";
}

const turkey = (locale, market) => /^tr(?:-|$)/i.test(String(locale || "")) || String(market || "").toUpperCase() === "TR";

// ---------------------------------------------------------------- exchange fee index
export const FEE_INDEX_EDITION = "2026-10";
// Priority venues first (owner order), then the other centralized and perp venues with a published fee page.
// Uniswap is left out: AMM pool fees are not maker/taker fees.
export const FEE_INDEX_VENUES = Object.freeze(["bitget", "okx", "binance", "bybit", "gate-io", "mexc", "htx", "kraken", "kucoin", "coinbase", "hyperliquid", "dydx", "deribit"]);

const cleanUrl = (u) => (typeof u === "string" && u.startsWith("https://") ? u : null);
const median = (values) => {
  const v = [...values].sort((a, b) => a - b);
  if (!v.length) return null;
  const mid = Math.floor(v.length / 2);
  return v.length % 2 ? v[mid] : Math.round(((v[mid - 1] + v[mid]) / 2) * 1e6) / 1e6;
};

function feeSide(slug, product) {
  const f = feeFact(slug, product);
  return { maker: f.state === "checked" ? f.maker : null, taker: f.state === "checked" ? f.taker : null, state: f.state, checkedOn: f.checkedOn, note: f.state === "checked" ? f.note : "" };
}

/** Index rows in owner order. Türkiye pages drop Bitget. */
export function feeIndexRows({ locale = "en", market } = {}) {
  const ordered = orderVenues(FEE_INDEX_VENUES, "en").filter((slug) => !(turkey(locale, market) && slug === "bitget"));
  return ordered.map((slug) => {
    const facts = factsForVenue(slug);
    if (!facts) return null;
    const spot = feeSide(slug, "spot");
    const perp = feeSide(slug, "perp");
    const sources = facts.sourceUrls.map(cleanUrl).filter(Boolean);
    return {
      slug, name: facts.name, type: facts.type, spot, perp,
      reviewedOn: spot.checkedOn || perp.checkedOn || null,
      sourceUrl: sources[0] || null, sourceUrls: sources,
    };
  }).filter(Boolean);
}

export function feeIndexStats(rows = feeIndexRows()) {
  const checked = (product, side) => rows.map((r) => r[product][side]).filter((v) => Number.isFinite(v));
  const perpTakers = rows.filter((r) => Number.isFinite(r.perp.taker));
  const lowestPerp = perpTakers.length ? Math.min(...perpTakers.map((r) => r.perp.taker)) : null;
  const dates = rows.map((r) => r.reviewedOn).filter(Boolean).sort();
  return {
    venues: rows.length,
    checkedVenues: rows.filter((r) => r.reviewedOn).length,
    medianSpotTaker: median(checked("spot", "taker")),
    medianSpotMaker: median(checked("spot", "maker")),
    medianPerpTaker: median(checked("perp", "taker")),
    medianPerpMaker: median(checked("perp", "maker")),
    lowestPerpTaker: lowestPerp,
    lowestPerpTakerVenues: perpTakers.filter((r) => r.perp.taker === lowestPerp).map((r) => r.name),
    firstReviewed: dates[0] || null,
    lastReviewed: dates.at(-1) || null,
  };
}

// ---------------------------------------------------------------- tokenized stock tracker
export const TS_LANE_LABEL = Object.freeze({ spot: "stock token", perp: "stock perpetual", preipo: "pre-IPO perpetual" });

const laneSourceIds = (lane) => {
  const ids = new Set();
  for (const value of Object.values(lane || {})) if (value && Array.isArray(value.s)) value.s.forEach((id) => ids.add(id));
  return [...ids];
};

/** One row per exchange x lane, owner order; Türkiye drops Bitget. */
export function tokenizedTrackerRows({ locale = "en", market } = {}) {
  const exchanges = orderVenues(TS_EXCHANGES, "en").filter((ex) => !(turkey(locale, market) && ex.slug === "bitget"));
  const rows = [];
  for (const ex of exchanges) {
    for (const laneKey of ["spot", "perp", "preipo"]) {
      const lane = ex[laneKey];
      if (!lane) continue;
      const tickers = lane.tickers?.v || [];
      const primaryIds = lane.tickers?.s || lane.form?.s || [];
      const primary = TS_SOURCES[primaryIds[0]] || null;
      const sources = laneSourceIds(lane).map((id) => TS_SOURCES[id]).filter(Boolean);
      const regionSources = (ex.excluded?.s || []).map((id) => TS_SOURCES[id]).filter(Boolean);
      rows.push({
        slug: ex.slug, exchange: ex.name, lane: laneKey,
        family: laneKey === "preipo" ? "Pre-IPO perp" : lane.form?.v || "",
        tickers, symbols: tickers.map((t) => tsSymbol(lane, t)),
        listedCount: lane.count?.v || null, listedCountAsOf: lane.count?.asOf || null,
        settle: lane.settle?.v || null, hours: lane.hours?.v || null, maxLeverage: lane.lev?.v ?? null,
        restricted: ex.excluded?.v || [],
        sourceUrl: primary?.url || null, sourceDate: primary?.date || null, sourceDateKind: primary?.dateKind || null,
        sources, regionSources,
      });
    }
  }
  return rows;
}

/** Tickers by number of distinct exchanges that list them (spot tokens + stock perps). */
export function tickerCoverage(rows = tokenizedTrackerRows()) {
  const map = new Map();
  for (const row of rows) {
    if (row.lane === "preipo") continue;
    for (const t of row.tickers) {
      if (!map.has(t)) map.set(t, new Set());
      map.get(t).add(row.exchange);
    }
  }
  return [...map.entries()].map(([ticker, set]) => ({ ticker, exchanges: [...set], count: set.size }))
    .sort((a, b) => b.count - a.count || a.ticker.localeCompare(b.ticker));
}

export function tokenizedTrackerStats(rows = tokenizedTrackerRows()) {
  const dates = rows.flatMap((r) => r.sources.map((s) => s.date)).filter(Boolean).sort();
  const families = [...new Set(rows.filter((r) => r.lane === "spot").map((r) => r.family))];
  const coverage = tickerCoverage(rows);
  return {
    exchanges: new Set(rows.map((r) => r.slug)).size,
    spotExchanges: new Set(rows.filter((r) => r.lane === "spot").map((r) => r.slug)).size,
    perpExchanges: new Set(rows.filter((r) => r.lane === "perp").map((r) => r.slug)).size,
    preipoExchanges: new Set(rows.filter((r) => r.lane === "preipo").map((r) => r.slug)).size,
    families, tickers: coverage.length, top: coverage[0] || null,
    firstSource: dates[0] || null, checkedOn: TS_CHECKED,
  };
}

// ---------------------------------------------------------------- whale accumulation report
export const WHALE_REPORT_DAYS = 7;
export const WHALE_CATEGORIES = Object.freeze(["accumulation", "distribution", "shortAdd", "shortCover"]);

// The feed's explorer link (Hyperliquid's public address explorer) is kept only when it is an https link on that host.
const EXPLORER_HOST = "app.hyperliquid.xyz";
function explorerUrlOf(value) {
  try { const u = new URL(String(value)); return u.protocol === "https:" && u.hostname === EXPLORER_HOST ? u.href : null; } catch { return null; }
}

function whaleCategory(signal) {
  const type = String(signal?.signalType || signal?.type || "");
  const side = String(signal?.side || "");
  if (type === "accumulation") return "accumulation";
  if (type === "distribution") return "distribution";
  if (type === "increase_short") return "shortAdd";
  if (type === "reduce_short") return "shortCover";
  if (type === "new-position") return side === "short" ? "shortAdd" : "accumulation";
  return null;
}

/**
 * Report from a whales snapshot ({ signals, dataUpdatedAt|updatedAt }), or null when the snapshot has no usable
 * signals. Cluster rows (coordinated-*) repeat their member wallets' signals and are counted, not summed.
 */
export function readWhaleReport(snapshot, { days = WHALE_REPORT_DAYS } = {}) {
  if (!snapshot || typeof snapshot !== "object" || !Array.isArray(snapshot.signals)) return null;
  const end = Date.parse(snapshot.dataUpdatedAt || snapshot.updatedAt || snapshot.generatedAt || "");
  if (!Number.isFinite(end)) return null;
  const start = end - days * 864e5;
  const seen = new Set();
  const signals = [];
  let clusters = 0;
  for (const s of snapshot.signals) {
    if (!s || typeof s !== "object" || seen.has(s.id)) continue;
    seen.add(s.id);
    const time = Date.parse(s.time || "");
    if (!Number.isFinite(time) || time < start || time > end + 60_000) continue;
    if (/^coordinated-/.test(String(s.signalType || s.type || ""))) { clusters += 1; continue; }
    const category = whaleCategory(s);
    const usd = Number(s.totalUsd ?? s.sizeUsd);
    if (!category || !Number.isFinite(usd) || usd <= 0 || typeof s.coin !== "string") continue;
    signals.push({
      id: String(s.id), coin: s.coin.slice(0, 24), category, signalType: String(s.signalType || s.type),
      market: s.market === "spot" ? "spot" : "perp", side: String(s.side || ""), usd: Math.round(usd),
      wallets: Number.isFinite(s.walletsCount) ? s.walletsCount : 1, fills: Number.isFinite(s.fills) ? s.fills : null,
      activeDays: Number.isFinite(s.days) ? s.days : null, period: typeof s.period === "string" ? s.period.slice(0, 8) : null,
      time: new Date(time).toISOString(), address: typeof s.address === "string" ? s.address : null,
      explorerUrl: explorerUrlOf(s.explorerUrl),
    });
  }
  if (!signals.length) return null;
  signals.sort((a, b) => b.usd - a.usd);
  const totals = Object.fromEntries(WHALE_CATEGORIES.map((c) => [c, { usd: 0, count: 0 }]));
  const coins = new Map();
  for (const s of signals) {
    totals[s.category].usd += s.usd;
    totals[s.category].count += 1;
    if (!coins.has(s.coin)) coins.set(s.coin, { coin: s.coin, ...Object.fromEntries(WHALE_CATEGORIES.map((c) => [c, 0])), total: 0, signals: 0 });
    const row = coins.get(s.coin);
    row[s.category] += s.usd;
    row.total += s.usd;
    row.signals += 1;
  }
  const byCoin = [...coins.values()].map((r) => ({ ...r, netLong: r.accumulation - r.distribution })).sort((a, b) => b.total - a.total);
  const topAccumulation = [...byCoin].filter((r) => r.accumulation > 0).sort((a, b) => b.accumulation - a.accumulation)[0] || null;
  return {
    windowStart: new Date(start).toISOString(), windowEnd: new Date(end).toISOString(), days,
    signals, totals, byCoin, clusters, topAccumulation,
    wallets: new Set(signals.map((s) => s.address).filter(Boolean)).size,
  };
}

/** Small hydration seed: the report itself (no raw feed). */
export const compactWhaleReport = (report) => (report ? { ...report, signals: report.signals.slice(0, 60) } : null);

// ---------------------------------------------------------------- CSV
const csvCell = (value) => {
  if (value === null || value === undefined) return "";
  const text = Array.isArray(value) ? value.join(";") : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};
const csv = (header, rows) => `${[header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n")}\r\n`;

export function feeIndexCsv(rows = feeIndexRows()) {
  return csv(
    ["edition", "exchange", "slug", "venue_type", "spot_maker_pct", "spot_taker_pct", "spot_status", "spot_scope", "perp_maker_pct", "perp_taker_pct", "perp_status", "perp_scope", "reviewed_on", "source_url", "other_source_urls", "license", "attribution"],
    rows.map((r) => [FEE_INDEX_EDITION, r.name, r.slug, r.type, r.spot.maker, r.spot.taker, statusOf(r.spot.state), r.spot.note, r.perp.maker, r.perp.taker, statusOf(r.perp.state), r.perp.note, r.reviewedOn, r.sourceUrl, r.sourceUrls.slice(1), DATA_ASSET_LICENSE_NAME, `Source: NexuAlpha ${DATA_ASSET_ORIGIN}${DATA_ASSETS["exchange-fee-index"]}`]),
  );
}
const statusOf = (state) => (state === "checked" ? "checked" : state === "none" ? "not-offered" : state === "recheck" ? "re-check" : "not-checked");

export function tokenizedTrackerCsv(rows = tokenizedTrackerRows()) {
  return csv(
    ["checked_on", "exchange", "slug", "product", "token_family", "tickers_named_in_source", "exchange_symbols", "listed_count", "listed_count_as_of", "settlement", "trading_hours", "max_leverage", "restricted_regions", "source_url", "source_date", "source_date_kind", "region_source_urls", "license", "attribution"],
    rows.map((r) => [TS_CHECKED, r.exchange, r.slug, TS_LANE_LABEL[r.lane], r.family, r.tickers, r.symbols, r.listedCount, r.listedCountAsOf, r.settle, r.hours, r.maxLeverage, r.restricted, r.sourceUrl, r.sourceDate, r.sourceDateKind, r.regionSources.map((s) => s.url), DATA_ASSET_LICENSE_NAME, `Source: NexuAlpha ${DATA_ASSET_ORIGIN}${DATA_ASSETS["tokenized-stock-tracker"]}`]),
  );
}

export function whaleReportCsv(report) {
  if (!report) return csv(["status"], [["unavailable"]]);
  return csv(
    ["window_start_utc", "window_end_utc", "coin", "category", "signal_type", "market", "side", "usd_reference", "wallets", "fills", "active_days", "period", "last_event_utc", "wallet", "explorer_url", "license", "attribution"],
    report.signals.map((s) => [report.windowStart, report.windowEnd, s.coin, s.category, s.signalType, s.market, s.side, s.usd, s.wallets, s.fills, s.activeDays, s.period, s.time, s.address, s.explorerUrl, DATA_ASSET_LICENSE_NAME, `Source: NexuAlpha ${DATA_ASSET_ORIGIN}${DATA_ASSETS["whale-accumulation-report"]}`]),
  );
}

// ---------------------------------------------------------------- SVG charts
// Self-contained SVG (no script, no external fonts), fixed width 640; height fixed per asset so the iframe snippet can
// state it. Every chart carries "Source: NexuAlpha" and the asset URL in the footer.
export const SVG_WIDTH = 640;
const ROW_H = { "exchange-fee-index": 30, "tokenized-stock-tracker": 26, "whale-accumulation-report": 30 };
const ROWS_MAX = { "exchange-fee-index": FEE_INDEX_VENUES.length, "tokenized-stock-tracker": 12, "whale-accumulation-report": 8 };
const HEAD = 78, FOOT = 46;
export const svgHeight = (key) => HEAD + ROW_H[key] * ROWS_MAX[key] + FOOT;

const THEME = {
  light: { bg: "#ffffff", ink: "#15171b", muted: "#626873", line: "#e3e6eb", a: "#315ccf", b: "#13a06e", c: "#d04646", d: "#c08a14" },
  dark: { bg: "#0c1219", ink: "#f5f7fa", muted: "#9aa5b5", line: "#223041", a: "#6f90ff", b: "#22c88a", c: "#e65b5b", d: "#e0b040" },
};
const esc = (v) => String(v ?? "").replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" }[c]));
const fmtUsd = (n) => (n >= 1e9 ? `$${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `$${Math.round(n / 1e3)}K` : `$${Math.round(n)}`);
export const formatUsdShort = fmtUsd;

function svgFrame(key, { title, subtitle, legend = [], body, note }, c) {
  const h = svgHeight(key);
  const url = `${DATA_ASSET_ORIGIN}${DATA_ASSETS[key]}`;
  let lx = 24;
  const legendSvg = legend.map(([label, color]) => {
    const x = lx;
    lx += 22 + label.length * 6.6 + 14;
    return `<rect x="${x}" y="58" width="12" height="12" rx="3" fill="${color}"/><text x="${x + 18}" y="68" font-size="12" fill="${c.muted}">${esc(label)}</text>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SVG_WIDTH}" height="${h}" viewBox="0 0 ${SVG_WIDTH} ${h}" role="img" aria-labelledby="t d" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Inter,'Noto Sans','PingFang SC',sans-serif">
<title id="t">${esc(title)}</title><desc id="d">${esc(subtitle)} Source: NexuAlpha, ${esc(url)} (${DATA_ASSET_LICENSE_NAME}).</desc>
<rect width="100%" height="100%" rx="12" fill="${c.bg}"/>
<text x="24" y="30" font-size="17" font-weight="700" fill="${c.ink}">${esc(title)}</text>
<text x="24" y="49" font-size="12" fill="${c.muted}">${esc(subtitle)}</text>
${legendSvg}
${body}
<line x1="24" x2="${SVG_WIDTH - 24}" y1="${h - FOOT + 8}" y2="${h - FOOT + 8}" stroke="${c.line}"/>
<text x="24" y="${h - 16}" font-size="12" fill="${c.muted}">${note ? `${esc(note)} · ` : ""}Source: <tspan font-weight="700" fill="${c.a}">NexuAlpha</tspan> · ${esc(url.replace("https://", ""))} · ${DATA_ASSET_LICENSE_NAME}</text>
</svg>
`;
}

function barRows(key, rows, c, max, { labelWidth = 120 } = {}) {
  const x0 = 24 + labelWidth, width = SVG_WIDTH - x0 - 96;
  return rows.map((row, i) => {
    const y = HEAD + i * ROW_H[key];
    const bars = row.bars.length;
    const bh = bars > 1 ? 9 : 14;
    let parts = `<text x="24" y="${y + ROW_H[key] / 2 + 4}" font-size="13" font-weight="600" fill="${c.ink}">${esc(row.label)}</text>`;
    row.bars.forEach((bar, j) => {
      const by = y + (ROW_H[key] - bars * bh - (bars - 1) * 3) / 2 + j * (bh + 3);
      let x = x0;
      for (const seg of bar.segments) {
        const w = max > 0 && Number.isFinite(seg.value) ? Math.max(seg.value > 0 ? 2 : 0, (seg.value / max) * width) : 0;
        if (w > 0) parts += `<rect x="${x.toFixed(1)}" y="${by.toFixed(1)}" width="${w.toFixed(1)}" height="${bh}" rx="2" fill="${seg.color}"/>`;
        x += w;
      }
      parts += `<text x="${(x + 6).toFixed(1)}" y="${(by + bh - 1).toFixed(1)}" font-size="11" fill="${c.muted}">${esc(bar.text)}</text>`;
    });
    return parts;
  }).join("\n");
}

export function feeIndexSvg({ theme = "light" } = {}) {
  const c = THEME[theme] || THEME.light;
  const rows = feeIndexRows();
  const max = Math.max(...rows.flatMap((r) => [r.spot.taker, r.perp.taker]).filter(Number.isFinite));
  const chartRows = rows.map((r) => ({
    label: r.name,
    bars: [
      { segments: [{ value: r.spot.taker, color: c.a }], text: Number.isFinite(r.spot.taker) ? `spot ${feePct(r.spot.taker)}` : r.spot.state === "none" ? "no spot market" : "spot not checked" },
      { segments: [{ value: r.perp.taker, color: c.b }], text: Number.isFinite(r.perp.taker) ? `perp ${feePct(r.perp.taker)}` : "perp not checked" },
    ],
  }));
  const s = feeIndexStats(rows);
  return svgFrame("exchange-fee-index", {
    title: `Crypto Exchange Fee Index — ${editionLabel("en")}`,
    subtitle: `Base-tier taker fees from official fee pages · median spot ${feePct(s.medianSpotTaker)}, perp ${feePct(s.medianPerpTaker)}`,
    legend: [["Spot taker", c.a], ["Perp taker", c.b]],
    body: barRows("exchange-fee-index", chartRows, c, max),
    note: `Reviewed ${s.firstReviewed}–${s.lastReviewed}`,
  }, c);
}

export function tokenizedTrackerSvg({ theme = "light" } = {}) {
  const c = THEME[theme] || THEME.light;
  const coverage = tickerCoverage().slice(0, ROWS_MAX["tokenized-stock-tracker"]);
  const stats = tokenizedTrackerStats();
  const max = Math.max(...coverage.map((r) => r.count), 1);
  return svgFrame("tokenized-stock-tracker", {
    title: "Tokenized US stocks: where each ticker trades",
    subtitle: `Exchanges naming the ticker for stock tokens or stock perps · ${stats.exchanges} exchanges tracked, checked ${stats.checkedOn}`,
    legend: [["Exchanges listing the ticker", c.a]],
    body: barRows("tokenized-stock-tracker", coverage.map((r) => ({ label: r.ticker, bars: [{ segments: [{ value: r.count, color: c.a }], text: `${r.count} exchange${r.count === 1 ? "" : "s"}` }] })), c, max, { labelWidth: 70 }),
  }, c);
}

export function whaleReportSvg(report, { theme = "light" } = {}) {
  const c = THEME[theme] || THEME.light;
  const colors = { accumulation: c.b, distribution: c.c, shortAdd: c.d, shortCover: c.a };
  if (!report) {
    return svgFrame("whale-accumulation-report", {
      title: "Whale accumulation report", subtitle: "The whale feed is temporarily unavailable; no figures are shown.",
      body: `<text x="24" y="${HEAD + 30}" font-size="13" fill="${c.muted}">Report unavailable — it returns with the next feed snapshot.</text>`,
    }, c);
  }
  const rows = report.byCoin.slice(0, ROWS_MAX["whale-accumulation-report"]);
  const max = Math.max(...rows.map((r) => r.total), 1);
  const end = sgtParts(report.windowEnd);
  return svgFrame("whale-accumulation-report", {
    title: `Whale accumulation report — 7 days to ${end?.day || ""}`,
    subtitle: `Tracked Hyperliquid wallets · ${report.signals.length} signals · reference USD by signal type · ${end?.day || ""} ${end?.time || ""} SGT`,
    legend: [["Accumulation", colors.accumulation], ["Distribution", colors.distribution], ["Short added", colors.shortAdd], ["Short covered", colors.shortCover]],
    body: barRows("whale-accumulation-report", rows.map((r) => ({ label: r.coin, bars: [{ segments: WHALE_CATEGORIES.map((k) => ({ value: r[k], color: colors[k] })), text: fmtUsd(r.total) }] })), c, max, { labelWidth: 70 }),
  }, c);
}

// ---------------------------------------------------------------- labels, embed snippets, citation
export function editionLabel(locale = "en") {
  return String(locale).startsWith("zh") ? "2026 年 10 月" : "October 2026";
}

export function dataAssetUrls(key) {
  return {
    page: `${DATA_ASSET_ORIGIN}${DATA_ASSETS[key]}`,
    csv: `${DATA_ASSET_ORIGIN}${dataAssetCsvPath(key)}`,
    svg: `${DATA_ASSET_ORIGIN}${dataAssetSvgPath(key)}`,
  };
}

/** Copy-paste snippets: an image link (plain <a>, followed) and an iframe, each with the "Source: NexuAlpha" credit. */
export function dataAssetEmbedSnippets(key, title) {
  const u = dataAssetUrls(key);
  const h = svgHeight(key);
  const credit = `<p>Source: <a href="${u.page}">NexuAlpha</a> (${DATA_ASSET_LICENSE_NAME})</p>`;
  return {
    image: `<a href="${u.page}"><img src="${u.svg}" alt="${esc(title)} — Source: NexuAlpha" width="${SVG_WIDTH}" height="${h}" style="max-width:100%;height:auto" loading="lazy"></a>\n${credit}`,
    iframe: `<iframe src="${u.svg}" title="${esc(title)} — NexuAlpha" width="${SVG_WIDTH}" height="${h}" style="border:0;max-width:100%" loading="lazy"></iframe>\n${credit}`,
  };
}

/** "Cite this" strings (APA-style and plain attribution). `year` and `version` describe the edition. */
export function dataAssetCitation(key, title, { year = "2026", version } = {}) {
  const u = dataAssetUrls(key);
  return {
    apa: `${DATA_ASSET_AUTHOR}. (${year}). ${title}${version ? ` (${version})` : ""} [Data set]. NexuAlpha. ${u.page}`,
    attribution: `Source: NexuAlpha (${u.page}), ${DATA_ASSET_LICENSE_NAME}.`,
  };
}
