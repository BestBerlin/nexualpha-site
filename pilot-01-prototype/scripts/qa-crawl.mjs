#!/usr/bin/env node
// Full-site HTTP/SEO crawl (read-only GETs, polite concurrency). Usage:
//   node scripts/qa-crawl.mjs [site=https://nexualpha.com] [manifest=dist/client/prerender-manifest.json] [out=qa-crawl.json]
// For every prerendered route: status, time, <html lang>/dir, <title>, meta description, robots, canonical, hreflang set,
// h1 count, leaked template text (undefined / NaN / [object / {{ / i18n keys), and whether canonical/robots match the
// manifest's searchPublished flag. Writes a JSON report and prints a summary of failing checks.
import { readFileSync, writeFileSync } from "node:fs";
import { localizedPath } from "../src/data/locale-routing.js";
import { internalFetch } from "./lib/internal-http.mjs";
// UA "NexuAlpha-internal/qa-crawl", paced to 2 req/s against remote hosts (scripts/lib/internal-http.mjs).
const fetch = internalFetch("qa-crawl");

const site = (process.argv[2] || "https://nexualpha.com").replace(/\/$/, "");
const manifest = JSON.parse(readFileSync(process.argv[3] || "dist/client/prerender-manifest.json", "utf8"));
const outPath = process.argv[4] || "qa-crawl.json";
const routes = Object.values(manifest.routes);
const UA = { "user-agent": "Mozilla/5.0 (compatible; NexuAlphaQA/1.0; +https://nexualpha.com)" };
const HTML_LANG = { en: "en", "zh-Hans": "zh-Hans", "zh-Hant": "zh-Hant", "pt-BR": "pt-BR", id: "id" };

const pick = (re, html) => { const m = html.match(re); return m ? m[1].trim() : null; };
const decode = (s) => s && s.replace(/&amp;/g, "&").replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">");

async function check(r) {
  // manifest pathnames are locale-neutral; the public URL carries the locale prefix
  const path = localizedPath(r.pathname, r.locale);
  const url = site + path;
  const t0 = Date.now();
  let res, html = "";
  try {
    res = await fetch(url, { headers: UA, redirect: "manual", signal: AbortSignal.timeout(30000) });
    html = res.status === 200 ? await res.text() : "";
  } catch (e) {
    return { path, locale: r.locale, error: String(e.message || e), ms: Date.now() - t0 };
  }
  const ms = Date.now() - t0;
  const body = html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<style[\s\S]*?<\/style>/g, "");
  const text = body.replace(/<[^>]+>/g, " ");
  const canonical = pick(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/i, html) || pick(/<link[^>]+href="([^"]+)"[^>]+rel="canonical"/i, html);
  const robots = pick(/<meta[^>]+name="robots"[^>]+content="([^"]+)"/i, html);
  const hreflangs = [...html.matchAll(/<link[^>]+rel="alternate"[^>]+hreflang="([^"]+)"[^>]+href="([^"]+)"/gi)].map((m) => [m[1], m[2]]);
  const leaks = [];
  for (const [label, re] of [["undefined", /(?:^|[\s>:(])undefined(?:[\s<.,)]|$)/], ["NaN", /(?:^|[\s>$])NaN(?:[\s<%.,]|$)/], ["[object", /\[object [A-Z]/], ["{{", /\{\{[^}]*\}\}/], ["{max}", /\{(?:max|n|d|v)\}/], ["i18n-key", /\b[a-z]+\.[a-z]+[A-Z][A-Za-z0-9]*(?:\.[A-Za-z0-9]+)*\b/]]) {
    const m = text.match(re); if (m) leaks.push(`${label}: …${text.slice(Math.max(0, m.index - 30), m.index + 40).replace(/\s+/g, " ")}…`);
  }
  return {
    path, locale: r.locale, published: r.searchPublished, status: res.status, ms,
    location: res.headers.get("location"),
    lang: pick(/<html[^>]*\slang="([^"]+)"/i, html), dir: pick(/<html[^>]*\sdir="([^"]+)"/i, html),
    title: decode(pick(/<title[^>]*>([^<]*)<\/title>/i, html)), description: decode(pick(/<meta[^>]+name="description"[^>]+content="([^"]*)"/i, html)),
    robots, canonical, hreflangs: hreflangs.length, h1: (body.match(/<h1[\s>]/gi) || []).length, bytes: html.length, leaks,
  };
}

const results = [];
let i = 0;
async function worker() { while (i < routes.length) { const r = routes[i++]; results.push(await check(r)); if (results.length % 200 === 0) process.stderr.write(`${results.length}/${routes.length}\n`); } }
await Promise.all(Array.from({ length: 6 }, worker));

const issues = [];
const add = (kind, r, detail = "") => issues.push({ kind, path: r.path, locale: r.locale, detail });
const titles = new Map();
for (const r of results) {
  if (r.error) { add("fetch-error", r, r.error); continue; }
  if (r.status !== 200) { add("status", r, `${r.status} ${r.location || ""}`); continue; }
  if (r.ms > 3000) add("slow>3s", r, `${r.ms}ms`);
  const want = HTML_LANG[r.locale] || r.locale;
  if (r.lang !== want) add("html-lang", r, `${r.lang} want ${want}`);
  if (["ar", "ur"].includes(r.locale) && r.dir !== "rtl") add("dir", r, String(r.dir));
  if (!r.title) add("no-title", r);
  if (!r.description) add("no-description", r);
  if (r.h1 !== 1) add("h1-count", r, String(r.h1));
  const noindex = /noindex/i.test(r.robots || "");
  if (r.published && noindex) add("published-but-noindex", r, r.robots);
  if (r.published && r.canonical && new URL(r.canonical).pathname !== r.path) add("canonical-mismatch", r, r.canonical);
  if (r.published && !r.canonical) add("no-canonical", r);
  for (const l of r.leaks) add("leak", r, l);
  if (r.title) { const k = `${r.locale}|${r.title}`; titles.set(k, [...(titles.get(k) || []), r.path]); }
}
for (const [k, paths] of titles) if (paths.length > 1) issues.push({ kind: "duplicate-title", path: paths.slice(0, 3).join(" "), locale: k.split("|")[0], detail: `${paths.length}x ${k.split("|")[1].slice(0, 60)}` });

const ms = results.filter((r) => r.ms).map((r) => r.ms).sort((a, b) => a - b);
const summary = { site, routes: routes.length, ok: results.filter((r) => r.status === 200).length, p50: ms[Math.floor(ms.length * 0.5)], p90: ms[Math.floor(ms.length * 0.9)], max: ms[ms.length - 1], issues: Object.fromEntries(Object.entries(issues.reduce((a, x) => ((a[x.kind] = (a[x.kind] || 0) + 1), a), {})).sort()) };
writeFileSync(outPath, JSON.stringify({ summary, issues, results }, null, 1));
console.log(JSON.stringify(summary, null, 1));
