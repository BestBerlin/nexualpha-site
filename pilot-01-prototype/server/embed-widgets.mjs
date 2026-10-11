// Embeddable data widgets (2026-10-11): GET /embed/liquidations and GET /embed/funding-rates render a self-contained
// HTML page (inline CSS, no script, no site shell, 100 % wide, at most 400 px tall) with the same numbers as the data
// pages, read from the same collector feed, plus a "Powered by NexuAlpha · updated HH:MM UTC" link back to the full
// page carrying ?src=embed-<kind> so sign-ups from that visit attribute to the embed (src/data/cta-click-beacon.js).
// GET /embed/<kind>.js is a tiny injector that inserts the iframe after its own <script> tag.
// Headers: no X-Frame-Options and `frame-ancestors *` so any site can iframe it; X-Robots-Tag noindex (crawlable, not
// indexed, never in a sitemap); Cache-Control public, max-age=300 (the collector rewrites every five minutes).
// Options: ?locale=<one of the 17 UI locales>, ?theme=dark|light and (funding only) ?symbol=BTC to list that row first. Nothing is estimated when the feed is missing —
// the widget shows the pages' "temporarily unavailable" copy instead.
import {
  DATA_PAGE_LOCALES, EMBED_KINDS, EMBED_MAX_HEIGHT, EMBED_PATH_PREFIX, dataPageCopy, embedSource, formatRatePct, formatUsdCompact, formatUtcTime,
  readFunding, readLiquidations,
} from "../src/data/market-data-pages.js";
import { localizedPath } from "../src/data/locale-routing.js";

export const EMBED_ORIGIN = "https://nexualpha.com";
export const EMBED_SIZE_BUDGET = 25 * 1024;
export const EMBED_CACHE_CONTROL = "public, max-age=300";
const UNAVAILABLE_CACHE_CONTROL = "public, max-age=60";
const SCRIPT_CACHE_CONTROL = "public, max-age=3600";
const CSP = "default-src 'none'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'; frame-ancestors *";
const FUNDING_ROWS = 8;

const esc = (value) => String(value ?? "").replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" }[c]));
const pct = (share) => `${Math.round(share * 100)}%`;

export function normalizeEmbedLocale(value) {
  if (!value) return "en";
  const lowered = String(value).toLowerCase();
  return DATA_PAGE_LOCALES.find((locale) => locale.toLowerCase() === lowered) || "en";
}
export const normalizeEmbedTheme = (value) => (String(value || "").toLowerCase() === "light" ? "light" : "dark");

// Brand tokens (src/styles/tokens.css) for the dark theme; the light theme mirrors them on a paper background.
const THEMES = {
  dark: { bg: "#0c1219", ink: "#f5f7fa", muted: "#9aa5b5", line: "rgba(180,196,211,.16)", long: "#22c88a", short: "#e65b5b", link: "#6f90ff", soft: "rgba(255,255,255,.04)" },
  light: { bg: "#ffffff", ink: "#15171b", muted: "#626873", line: "rgba(21,23,27,.14)", long: "#13a06e", short: "#d04646", link: "#315ccf", soft: "rgba(21,23,27,.04)" },
};

function styles(theme) {
  const c = THEMES[theme];
  return `html,body{margin:0;padding:0;background:${c.bg};color:${c.ink}}
body{font:14px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Inter,"Noto Sans",sans-serif;-webkit-font-smoothing:antialiased}
.w{box-sizing:border-box;width:100%;max-height:${EMBED_MAX_HEIGHT}px;overflow:hidden;padding:14px 16px 12px;display:flex;flex-direction:column;gap:8px;font-variant-numeric:tabular-nums}
.h{display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap}
.h b{font-size:15px;font-weight:650;letter-spacing:-.01em}.h span{font-size:12px;color:${c.muted}}
.big{margin:0;font-size:clamp(28px,9vw,40px);font-weight:700;letter-spacing:-.02em;line-height:1.05}
.bar{display:flex;height:10px;border-radius:999px;overflow:hidden;background:${c.short}}.bar i{display:block;background:${c.long}}
.split{display:flex;justify-content:space-between;gap:8px 12px;flex-wrap:wrap;margin:0;font-size:12.5px}
.long{color:${c.long}}.short{color:${c.short}}.pos{color:${c.long}}.neg{color:${c.short}}
.mini{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:0;padding:8px 0 0;border-top:1px solid ${c.line}}
.mini div{min-width:0}.mini dt{font-size:11px;line-height:1.25;color:${c.muted}}.mini dd{margin:2px 0 0;font-size:15px;font-weight:650}
.mini dd small{display:block;font-size:11px;font-weight:500;color:${c.muted}}
table{width:100%;border-collapse:collapse;font-size:13px}th,td{padding:5px 4px;border-bottom:1px solid ${c.line};text-align:left;white-space:nowrap}
th{font-size:11px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:${c.muted}}.num{text-align:right}tbody th{font-weight:650;text-transform:none;letter-spacing:0;font-size:13px;color:${c.ink}}
tbody tr:last-child th,tbody tr:last-child td{border-bottom:0}
tbody tr.hl th,tbody tr.hl td{background:${c.soft}}tbody tr.hl th{box-shadow:inset 3px 0 0 ${c.link}}
.u{margin:0;padding:10px 12px;border:1px dashed ${c.line};border-radius:10px;background:${c.soft};color:${c.muted};font-size:13px}.u b{display:block;color:${c.ink};margin-bottom:2px}
.f{margin-top:auto;padding-top:8px;border-top:1px solid ${c.line};font-size:12px;color:${c.muted};display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap}
.f a{color:${c.link};font-weight:600;text-decoration:none}.f a:hover{text-decoration:underline}
[dir=rtl] .num{text-align:left}[dir=rtl] th,[dir=rtl] td{text-align:right}
@media(prefers-reduced-motion:no-preference){.bar i{transition:width .26s ease}}`;
}

function footer(kind, locale, generatedAt, origin) {
  const copy = dataPageCopy(locale).common;
  const href = `${origin}${localizedPath(EMBED_KINDS[kind].path, locale)}?src=${embedSource(kind)}`;
  const updated = generatedAt ? ` <span dir="ltr">${esc(copy.embedUpdated)} ${esc(formatUtcTime(generatedAt))}</span>` : "";
  return `<footer class="f"><a href="${esc(href)}" target="_blank" rel="noopener" data-embed-source="${embedSource(kind)}">${esc(copy.poweredBy)}</a>${updated}</footer>`;
}

function unavailable(locale) {
  const copy = dataPageCopy(locale).common;
  return `<p class="u" role="status"><b>${esc(copy.unavailableTitle)}</b>${esc(copy.unavailable)}</p>`;
}

function liquidationsBody(feed, locale) {
  const copy = dataPageCopy(locale).liquidations;
  const data = readLiquidations(feed);
  const day = data?.windows.h24;
  if (!data || !day) return { body: `<header class="h"><b>${esc(copy.h1)}</b></header>${unavailable(locale)}`, ok: false, generatedAt: data?.generatedAt || null };
  const largest = day.largest;
  const side = largest ? (largest.side === "short" ? copy.sideShort : copy.sideLong) : "";
  const mini = [
    [copy.h1Window, data.windows.h1 ? formatUsdCompact(data.windows.h1.totalUsd) : "—", ""],
    [copy.h4Window, data.windows.h4 ? formatUsdCompact(data.windows.h4.totalUsd) : "—", ""],
    [copy.largestTitle, largest ? formatUsdCompact(largest.usd) : "—", largest ? `${largest.base} ${side} · ${largest.venue}` : ""],
  ].map(([dt, dd, small]) => `<div><dt>${esc(dt)}</dt><dd dir="ltr">${esc(dd)}${small ? `<small translate="no">${esc(small)}</small>` : ""}</dd></div>`).join("");
  const body = `<header class="h"><b>${esc(copy.h1)}</b><span>${esc(copy.h24Window)} · ${esc(copy.orders(day.orders))}</span></header>
<p class="big" dir="ltr">${esc(formatUsdCompact(day.totalUsd))}</p>
<div class="bar" role="img" aria-label="${esc(`${copy.longs} ${pct(day.longShare)} · ${copy.shorts} ${pct(1 - day.longShare)}`)}" dir="ltr"><i style="width:${Math.max(2, Math.min(98, Math.round(day.longShare * 1000) / 10))}%"></i></div>
<p class="split"><span class="long" dir="ltr">${esc(copy.longs)} ${esc(formatUsdCompact(day.longUsd))} · ${pct(day.longShare)}</span><span class="short" dir="ltr">${esc(copy.shorts)} ${esc(formatUsdCompact(day.shortUsd))} · ${pct(1 - day.longShare)}</span></p>
<dl class="mini">${mini}</dl>`;
  return { body, ok: true, generatedAt: data.generatedAt };
}

// ?symbol=BTC (article directive `::embed funding BTC`, D3): that symbol's row is listed first and highlighted. A symbol
// the feed does not carry changes nothing.
export const normalizeEmbedSymbol = (value) => (/^[A-Za-z0-9]{1,15}$/.test(String(value || "")) ? String(value).toUpperCase() : null);

function fundingBody(feed, locale, symbol = null) {
  const copy = dataPageCopy(locale).funding;
  const data = readFunding(feed);
  if (!data) return { body: `<header class="h"><b>${esc(copy.h1)}</b></header>${unavailable(locale)}`, ok: false, generatedAt: null };
  const tone = (rate) => (rate == null ? "" : rate > 0 ? " pos" : rate < 0 ? " neg" : "");
  const focus = symbol ? data.rows.find((r) => String(r.symbol).toUpperCase() === symbol) : null;
  const ordered = focus ? [focus, ...data.rows.filter((r) => r !== focus)] : data.rows;
  const rows = ordered.slice(0, FUNDING_ROWS).map((r) => `<tr${r === focus ? ' class="hl"' : ""}><th scope="row" translate="no">${esc(r.symbol)}</th><td class="num${tone(r.binanceRate)}" dir="ltr">${esc(formatRatePct(r.binanceRate))}</td><td class="num${tone(r.okxRate)}" dir="ltr">${esc(formatRatePct(r.okxRate))}</td><td class="num" dir="ltr">${esc(formatRatePct(r.binanceApr, 1))} / ${esc(formatRatePct(r.okxApr, 1))}</td></tr>`).join("");
  const body = `<header class="h"><b>${esc(copy.h1)}</b><span>${esc(copy.legend)}</span></header>
<table><thead><tr><th scope="col">${esc(copy.colSymbol)}</th><th scope="col" class="num">${esc(copy.colBinance)}</th><th scope="col" class="num">${esc(copy.colOkx)}</th><th scope="col" class="num">${esc(copy.colApr)}</th></tr></thead><tbody>${rows}</tbody></table>`;
  return { body, ok: true, generatedAt: data.generatedAt };
}

// The whole widget page. `feed` is the collector document (or null).
export function renderEmbedHtml(kind, feed, { locale = "en", theme = "dark", origin = EMBED_ORIGIN, symbol = null } = {}) {
  if (!EMBED_KINDS[kind]) return null;
  const loc = normalizeEmbedLocale(locale), th = normalizeEmbedTheme(theme);
  const copy = dataPageCopy(loc);
  const { body, ok, generatedAt } = kind === "liquidations" ? liquidationsBody(feed, loc) : fundingBody(feed, loc, normalizeEmbedSymbol(symbol));
  const title = `${kind === "liquidations" ? copy.liquidations.h1 : copy.funding.h1} — NexuAlpha`;
  const html = `<!doctype html>
<html lang="${esc(loc)}" dir="${["ar", "ur"].includes(loc) ? "rtl" : "ltr"}" data-theme="${th}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<meta name="color-scheme" content="${th}">
<title>${esc(title)}</title>
<style>${styles(th)}</style>
</head>
<body><div class="w" data-embed="${esc(kind)}" data-state="${ok ? "ready" : "unavailable"}">
${body}
${footer(kind, loc, generatedAt, origin)}
</div></body>
</html>
`;
  return { html, ok, generatedAt };
}

// Script-tag installer: <script src="https://nexualpha.com/embed/liquidations.js" data-locale="en" data-theme="dark"></script>
// inserts a 100 %-wide iframe right after itself. No dependencies, no globals, works with `async`.
export function embedInjectorScript(kind, { origin = EMBED_ORIGIN } = {}) {
  const spec = EMBED_KINDS[kind];
  if (!spec) return null;
  const title = `${dataPageCopy("en")[kind === "liquidations" ? "liquidations" : "funding"].h1} — NexuAlpha`;
  return `(function(){var s=document.currentScript;if(!s){var all=document.getElementsByTagName("script");s=all[all.length-1];}if(!s||!s.parentNode)return;
var d=s.dataset||{},q=[];if(d.locale)q.push("locale="+encodeURIComponent(d.locale));if(d.theme)q.push("theme="+encodeURIComponent(d.theme));
var f=document.createElement("iframe");f.src=${JSON.stringify(`${origin}${EMBED_PATH_PREFIX}${kind}`)}+(q.length?"?"+q.join("&"):"");
f.title=${JSON.stringify(title)};f.loading="lazy";f.setAttribute("scrolling","no");f.referrerPolicy="strict-origin-when-cross-origin";
f.style.cssText="display:block;width:100%;max-width:100%;height:${spec.height}px;border:0;border-radius:12px;overflow:hidden";
s.parentNode.insertBefore(f,s.nextSibling);})();
`;
}

const EMBED_ROUTE = new RegExp(`^${EMBED_PATH_PREFIX.replace(/\//g, "\\/")}(${Object.keys(EMBED_KINDS).join("|")})(\\.js)?$`);

// Request handler for the production server. Returns null for paths it does not own (e.g. /embed/calculator stays
// with the worker). `readFeed` is the market-events reader's read() (cached 60 s, null when the feed is missing).
export function createEmbedRoute({ readFeed, origin = EMBED_ORIGIN, log = () => {} } = {}) {
  return async function handle(request) {
    const url = new URL(request.url);
    const match = url.pathname.match(EMBED_ROUTE);
    if (!match) return null;
    if (request.method !== "GET" && request.method !== "HEAD") return new Response(null, { status: 405, headers: { allow: "GET, HEAD", "cache-control": "no-store" } });
    const [, kind, isScript] = match;
    const common = { "x-robots-tag": "noindex", "x-content-type-options": "nosniff" };
    if (isScript) {
      const js = embedInjectorScript(kind, { origin });
      return new Response(request.method === "HEAD" ? null : js, { status: 200, headers: { ...common, "content-type": "text/javascript; charset=utf-8", "cache-control": SCRIPT_CACHE_CONTROL, "access-control-allow-origin": "*" } });
    }
    let feed = null;
    try { feed = typeof readFeed === "function" ? await readFeed() : null; } catch (error) { log(`embed feed read failed: ${error?.message || error}`); }
    const { html, ok } = renderEmbedHtml(kind, feed, { locale: url.searchParams.get("locale"), theme: url.searchParams.get("theme"), origin, symbol: url.searchParams.get("symbol") });
    return new Response(request.method === "HEAD" ? null : html, { status: 200, headers: {
      ...common, "content-type": "text/html; charset=utf-8", "cache-control": ok ? EMBED_CACHE_CONTROL : UNAVAILABLE_CACHE_CONTROL,
      "content-security-policy": CSP, "referrer-policy": "strict-origin-when-cross-origin",
    } });
  };
}
