// US spot crypto ETF flows (/etf-flows, 2026-10-13). Pure and dependency-free: the Worker head, the SSR bundle, the
// browser and the host collector (ops/intel-tools/collect-etf-flows.mjs) share this reader. The collector writes
// /intel/etf-flows.json from issuer-published fund data; a flow is never estimated here — a fund without a reported
// figure for a day shows "—" and the day total says how many funds reported.
//
// Snapshot shape (schema nexualpha.etf-flows.v1):
// { schema, generatedAt, method, sources: [{ name, url }],
//   funds: [{ ticker, name, issuer, asset, feePct, sourceUrl, sourceName, latest: { date, sharesOutstanding, nav, aumUsd, holdings } }],
//   days:  [{ date: "YYYY-MM-DD", asset: "BTC", flows: { IBIT: usd | null, … } }] }

export const ETF_SCHEMA = "nexualpha.etf-flows.v1";
export const ETF_ASSETS = Object.freeze(["BTC", "ETH", "SOL", "XRP", "LTC", "HBAR", "DOGE", "AVAX", "LINK", "DOT", "SUI"]);
export const ETF_CHART_WINDOWS = Object.freeze([30, 90]);

const num = (v) => { const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN; return Number.isFinite(n) ? n : null; };
const isoOrNull = (v) => { const t = Date.parse(v); return Number.isFinite(t) ? new Date(t).toISOString() : null; };
const isDay = (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v || ""));
const cleanUrl = (v) => (/^https:\/\/[^\s"<>]+$/.test(String(v || "")) ? String(v) : null);
const cleanText = (v, max = 120) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);

/** Normalised snapshot or null when it is unusable (no funds or no dated rows). */
export function readEtfFlows(json) {
  if (!json || typeof json !== "object") return null;
  const generatedAt = isoOrNull(json.generatedAt);
  if (!generatedAt) return null;
  const funds = (Array.isArray(json.funds) ? json.funds : []).map((f) => {
    const ticker = cleanText(f?.ticker, 8).toUpperCase();
    const asset = cleanText(f?.asset, 8).toUpperCase();
    if (!/^[A-Z0-9]{2,6}$/.test(ticker) || !ETF_ASSETS.includes(asset)) return null;
    const l = f.latest && typeof f.latest === "object" ? f.latest : {};
    return {
      ticker, asset, name: cleanText(f.name, 90) || ticker, issuer: cleanText(f.issuer, 60), feePct: num(f.feePct),
      sourceUrl: cleanUrl(f.sourceUrl), sourceName: cleanText(f.sourceName, 80),
      latest: { date: isDay(l.date) ? l.date : null, sharesOutstanding: num(l.sharesOutstanding), nav: num(l.nav), aumUsd: num(l.aumUsd), holdings: num(l.holdings) },
    };
  }).filter(Boolean);
  if (!funds.length) return null;
  const tickers = new Set(funds.map((f) => f.ticker));
  const days = (Array.isArray(json.days) ? json.days : []).map((d) => {
    const asset = cleanText(d?.asset, 8).toUpperCase();
    if (!isDay(d?.date) || !ETF_ASSETS.includes(asset) || !d.flows || typeof d.flows !== "object") return null;
    const flows = {};
    for (const [ticker, value] of Object.entries(d.flows)) if (tickers.has(ticker)) flows[ticker] = num(value);
    return { date: d.date, asset, flows };
  }).filter(Boolean).sort((a, b) => a.date.localeCompare(b.date));
  const sources = (Array.isArray(json.sources) ? json.sources : []).map((s) => ({ name: cleanText(s?.name, 80), url: cleanUrl(s?.url) })).filter((s) => s.name && s.url);
  return { generatedAt, method: cleanText(json.method, 400), sources, funds, days };
}

/** Assets that have at least one fund, in ETF_ASSETS order. */
export const etfAssets = (data) => ETF_ASSETS.filter((asset) => data?.funds.some((f) => f.asset === asset));

/**
 * One asset's view: its funds (largest AUM first), its daily rows with totals, the latest complete-or-partial day and
 * the cumulative sum over the days we hold. A day total is the sum of the funds that reported; `reported` / `expected`
 * say how many did (a fund launched later is not expected before its first reported day).
 */
export function etfAssetView(data, asset) {
  if (!data) return null;
  const funds = data.funds.filter((f) => f.asset === asset).sort((a, b) => (b.latest.aumUsd ?? -1) - (a.latest.aumUsd ?? -1) || a.ticker.localeCompare(b.ticker));
  if (!funds.length) return null;
  const firstSeen = {};
  const rows = data.days.filter((d) => d.asset === asset);
  for (const row of rows) for (const [ticker, value] of Object.entries(row.flows)) if (value != null && !firstSeen[ticker]) firstSeen[ticker] = row.date;
  const days = rows.map((row) => {
    const expectedTickers = funds.filter((f) => firstSeen[f.ticker] && firstSeen[f.ticker] <= row.date).map((f) => f.ticker);
    const values = expectedTickers.map((t) => row.flows[t]).filter((v) => v != null);
    return { date: row.date, flows: row.flows, totalUsd: values.length ? values.reduce((s, v) => s + v, 0) : null, reported: values.length, expected: expectedTickers.length };
  }).filter((d) => d.reported > 0);
  let running = 0;
  const cumulative = days.map((d) => ({ date: d.date, usd: (running += d.totalUsd) }));
  const latest = days[days.length - 1] || null;
  const aumValues = funds.map((f) => f.latest.aumUsd).filter((v) => v != null);
  const holdingValues = funds.map((f) => f.latest.holdings).filter((v) => v != null);
  return {
    asset, funds, days, cumulative, latest,
    since: days[0]?.date || null,
    cumulativeUsd: cumulative.length ? cumulative[cumulative.length - 1].usd : null,
    aumUsd: aumValues.length ? aumValues.reduce((s, v) => s + v, 0) : null,
    aumFunds: aumValues.length,
    holdings: holdingValues.length ? holdingValues.reduce((s, v) => s + v, 0) : null,
    holdingFunds: holdingValues.length,
    asOf: funds.map((f) => f.latest.date).filter(Boolean).sort().pop() || null,
  };
}

/** Sum of the daily totals over the last n days held (null when there are none). */
export function etfWindowSum(view, n) {
  const slice = view?.days.slice(-n) || [];
  return slice.length ? { usd: slice.reduce((s, d) => s + (d.totalUsd ?? 0), 0), days: slice.length, from: slice[0].date, to: slice[slice.length - 1].date } : null;
}

// ------------------------------------------------------------------ chart model (inline SVG, deterministic)
export const ETF_CHART = Object.freeze({ wide: { width: 960, height: 280 }, compact: { width: 420, height: 240 } });
function niceStep(max) {
  if (!(max > 0)) return 1;
  const raw = max / 3, mag = 10 ** Math.floor(Math.log10(raw));
  return [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) || raw;
}
export function etfChartModel(days, { width = ETF_CHART.wide.width, height = ETF_CHART.wide.height, format = (v) => String(v) } = {}) {
  const plot = { x: width > 600 ? 64 : 52, y: 12, width: 0, height: height - 40 };
  plot.width = width - plot.x - 8;
  const values = days.map((d) => d.totalUsd ?? 0);
  const maxAbs = Math.max(1, ...values.map(Math.abs));
  const hasNeg = values.some((v) => v < 0), hasPos = values.some((v) => v > 0);
  const step = niceStep(maxAbs);
  const top = hasPos ? Math.ceil(Math.max(0, ...values) / step) * step || step : 0;
  const bottom = hasNeg ? Math.floor(Math.min(0, ...values) / step) * step : 0;
  const span = top - bottom || step;
  const yOf = (v) => plot.y + ((top - v) / span) * plot.height;
  const baseline = yOf(0);
  const slot = days.length ? plot.width / days.length : plot.width;
  const barWidth = Math.max(1, Math.min(28, slot * 0.72));
  const bars = days.map((d, i) => {
    const v = d.totalUsd ?? 0, y = yOf(Math.max(0, v)), h = Math.abs(yOf(v) - baseline);
    return { date: d.date, totalUsd: d.totalUsd, partial: d.reported < d.expected, x: +(plot.x + i * slot + (slot - barWidth) / 2).toFixed(2), y: +y.toFixed(2), width: +barWidth.toFixed(2), height: +Math.max(v === 0 ? 0 : 1, h).toFixed(2), sign: v < 0 ? "out" : "in" };
  });
  const ticks = [];
  for (let v = bottom; v <= top + step / 2; v += step) ticks.push({ value: v, y: +yOf(v).toFixed(2), label: format(v) });
  const labelEvery = Math.max(1, Math.ceil(days.length / (width > 600 ? 8 : 4)));
  const xLabels = days.map((d, i) => ({ i, d })).filter(({ i }) => i % labelEvery === 0 || i === days.length - 1)
    .filter(({ i }, k, all) => k === all.length - 1 || all[all.length - 1].i - i >= labelEvery * 0.6)
    .map(({ i, d }) => ({ x: +(plot.x + i * slot + slot / 2).toFixed(2), y: height - 8, label: d.date.slice(5) }));
  return { width, height, plot: { ...plot, baseline: +baseline.toFixed(2) }, bars, ticks, xLabels };
}

// ------------------------------------------------------------------ formatting (same string on server and browser)
const group = (s) => s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
/** Exact USD with sign: +$12,345,678 / −$1,234 / $0. */
export function formatSignedUsd(value) {
  const n = num(value);
  if (n == null) return "—";
  const r = Math.round(n);
  return `${r > 0 ? "+" : r < 0 ? "−" : ""}$${group(String(Math.abs(r)))}`;
}
/** Millions with one decimal and sign, as ETF flow tables print them: +123.4M / −5.0M. */
export function formatSignedMillions(value) {
  const n = num(value);
  if (n == null) return "—";
  const m = Math.round(n / 1e5) / 10;
  const [i, f] = Math.abs(m).toFixed(1).split(".");
  return `${m > 0 ? "+" : m < 0 ? "−" : ""}${group(i)}.${f}M`;
}
export function formatUsdShort(value) {
  const n = num(value);
  if (n == null) return "—";
  const a = Math.abs(n), sign = n < 0 ? "−" : "";
  if (a >= 1e9) return `${sign}$${(a / 1e9).toFixed(2)}B`;
  if (a >= 1e6) return `${sign}$${(a / 1e6).toFixed(1)}M`;
  if (a >= 1e3) return `${sign}$${(a / 1e3).toFixed(0)}K`;
  return `${sign}$${a.toFixed(0)}`;
}
export function formatAmount(value, digits = 0) {
  const n = num(value);
  if (n == null) return "—";
  const [i, f] = Math.abs(n).toFixed(digits).split(".");
  return `${n < 0 ? "−" : ""}${group(i)}${f ? `.${f}` : ""}`;
}
export const formatNav = (value) => { const n = num(value); return n == null ? "—" : `$${n.toFixed(2)}`; };
export const formatFeePct = (value) => { const n = num(value); return n == null ? "—" : `${n.toFixed(2)}%`; };
export function formatUtcStamp(iso) {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "—";
  const d = new Date(t), p = (x) => String(x).padStart(2, "0");
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())} UTC`;
}

/** What the server embeds for hydration: the snapshot with each asset's last `days` rows (the chart's longest window). */
export function compactEtfFlows(json, days = 95) {
  if (!json || typeof json !== "object" || !Array.isArray(json.days)) return json ?? null;
  const keep = new Set();
  const byAsset = new Map();
  for (const row of json.days) { if (!byAsset.has(row?.asset)) byAsset.set(row?.asset, []); byAsset.get(row?.asset).push(row); }
  for (const rows of byAsset.values()) rows.sort((a, b) => String(a?.date).localeCompare(String(b?.date))).slice(-days).forEach((row) => keep.add(row));
  return { ...json, days: json.days.filter((row) => keep.has(row)) };
}
