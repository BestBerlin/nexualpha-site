#!/usr/bin/env node
// Localization gap sweep (scorecard M1): 14 non-English locales x 18 templates = 252 locale pages. Port of the QA
// l10n.py / l10n-full.py check (/Volumes/.../nx-agents/l10n) with two fixes (links-l10n lane 2026-10-11):
//   - text is read from real text nodes (the old regex split leaked <main>/<iframe> attributes and SVG <desc> into the
//     segment list), and
//   - each text node knows the nearest lang attribute around it, so English data the page declares as English
//     (official announcement titles, article headlines, source notes marked lang="en", URLs, codes) is reported apart
//     from UI copy.
// A segment (>= 25 characters inside <main>) that also appears on the English edition of the same template is
//   "ui"   when it is not inside an element declared lang="en" and is not data-shaped (URL, command, numbers), and
//   "data" otherwise. M1 passes when the "ui" count is 0.
//   node scripts/qa-l10n-gaps.mjs [--base=http://localhost:8952] [--out=report.json] [--concurrency=8]
import { writeFileSync } from "node:fs";
import { internalFetch } from "./lib/internal-http.mjs";
// UA "NexuAlpha-internal/qa-l10n-gaps", paced to 2 req/s against remote hosts (scripts/lib/internal-http.mjs).
const fetch = internalFetch("qa-l10n-gaps");

const arg = (name, fallback) => process.argv.slice(2).find((value) => value.startsWith(`--${name}=`))?.split("=").slice(1).join("=") || fallback;
const BASE = String(arg("base", "https://nexualpha.com")).replace(/\/$/, "");
const OUT = arg("out", null);
const CONCURRENCY = Number(arg("concurrency", "8"));
export const L10N_LOCALE_PREFIXES = ["zh-hans", "zh-hant", "ja", "ko", "ru", "es", "pt-br", "tr", "vi", "id-id", "de", "fr", "it", "ar"];
export const L10N_TEMPLATES = ["/", "/exchanges", "/exchanges/okx", "/compare/binance-vs-okx", "/compare/bitget-vs-mexc", "/liquidations", "/funding-rates", "/activities", "/telegram", "/rates", "/onchain", "/topics", "/factbook", "/about", "/editorial-policy", "/methodology", "/partners", "/news"];
const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);
const SKIP = new Set(["script", "style", "noscript", "template", "svg", "iframe", "textarea"]);
const decode = (value) => value.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&#x27;|&#39;/g, "'").replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code))).replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)));

/** Text segments of <main> (up to the footer) with the lang declared around each one. */
export function mainSegments(html) {
  const start = html.search(/<main\b/i);
  if (start < 0) return [];
  const body = html.slice(start).replace(/<footer\b[\s\S]*$/i, "");
  const segments = [];
  const stack = [];
  let skipDepth = 0;
  const tokenRe = /<!--[\s\S]*?-->|<\/?([a-zA-Z][a-zA-Z0-9-]*)\b([^>]*)>|([^<]+)/g;
  let match;
  while ((match = tokenRe.exec(body))) {
    const [whole, tagName, attrs, text] = match;
    if (text !== undefined) {
      if (skipDepth) continue;
      const lang = [...stack].reverse().find((entry) => entry.lang)?.lang || null;
      for (const piece of decode(text).split("\n")) {
        const value = piece.replace(/\s+/g, " ").trim();
        if (value) segments.push({ text: value, lang });
      }
      continue;
    }
    if (!tagName) continue;
    const name = tagName.toLowerCase();
    if (whole.startsWith("</")) {
      const index = stack.map((entry) => entry.name).lastIndexOf(name);
      if (index >= 0) {
        for (const entry of stack.splice(index)) if (SKIP.has(entry.name)) skipDepth = Math.max(0, skipDepth - 1);
      }
      if (name === "main") break;
      continue;
    }
    if (VOID.has(name) || whole.endsWith("/>")) continue;
    // Code samples (embed snippets, bot commands) are data whatever the page language.
    const lang = ["code", "pre", "kbd", "samp"].includes(name) ? "en-x-code" : attrs.match(/\blang="([^"]*)"/i)?.[1] || null;
    stack.push({ name, lang });
    if (SKIP.has(name)) skipDepth += 1;
  }
  // Inline elements split one sentence into several text nodes; join runs that share a lang into readable segments.
  return segments;
}

const DATA_SHAPED = [
  /^https?:\/\//i,                                   // URLs
  /^\/[a-z]+(?:\s|$)/,                                // bot commands (/calc …)
  /^[\d\s%$€.,:/\-–—+×()A-Z]*$/,                      // numbers, dates, codes
  /^(?:OKX|Bitget|Binance|Bybit|MEXC|Gate\.io|Kraken|Coinbase|NexuAlpha|BTC|ETH)\b/, // brand-led rows (as in l10n.py)
];
const isDataShaped = (text) => DATA_SHAPED.some((pattern) => pattern.test(text));

async function fetchHtml(pathname) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(`${BASE}${pathname}`, { headers: { "user-agent": "NexuAlpha-QA-l10n" } });
      if (response.status !== 200) return null;
      return await response.text();
    } catch { /* retry */ }
  }
  return null;
}

async function main() {
  const english = new Map();
  for (const template of L10N_TEMPLATES) {
    const html = await fetchHtml(template);
    english.set(template, new Set((html ? mainSegments(html) : []).map((segment) => segment.text).filter((text) => text.length >= 25)));
  }
  const jobs = L10N_LOCALE_PREFIXES.flatMap((prefix) => L10N_TEMPLATES.map((template) => ({ prefix, template, path: `/${prefix}${template === "/" ? "" : template}` })));
  const results = [];
  let next = 0;
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (next < jobs.length) {
      const job = jobs[next++];
      const html = await fetchHtml(job.path);
      if (!html) { results.push({ ...job, status: "fetch-failed", ui: [], data: [] }); continue; }
      const robots = html.match(/<meta name="robots" content="([^"]*)"/)?.[1] || null;
      const en = english.get(job.template);
      const seen = new Set();
      const ui = [];
      const data = [];
      for (const segment of mainSegments(html)) {
        if (segment.text.length < 25 || !en.has(segment.text) || seen.has(segment.text)) continue;
        seen.add(segment.text);
        const declaredEnglish = segment.lang && /^en\b/i.test(segment.lang);
        (declaredEnglish || isDataShaped(segment.text) ? data : ui).push(segment.text);
      }
      results.push({ ...job, robots, ui, data });
    }
  }));
  results.sort((a, b) => a.path.localeCompare(b.path));
  const uiTotal = results.reduce((sum, row) => sum + row.ui.length, 0);
  const dataTotal = results.reduce((sum, row) => sum + row.data.length, 0);
  const failed = results.filter((row) => row.status === "fetch-failed").length;
  console.log(`${BASE}: ${results.length} locale pages (${failed} not fetched); identical-to-English segments: ui ${uiTotal}, declared/data ${dataTotal}`);
  const byTemplate = new Map();
  for (const row of results) {
    const entry = byTemplate.get(row.template) || { ui: 0, data: 0, samples: new Map() };
    entry.ui += row.ui.length; entry.data += row.data.length;
    for (const text of row.ui) entry.samples.set(text, (entry.samples.get(text) || 0) + 1);
    byTemplate.set(row.template, entry);
  }
  for (const [template, entry] of byTemplate) {
    console.log(`  ${template.padEnd(26)} ui ${String(entry.ui).padStart(4)}  data ${String(entry.data).padStart(4)}`);
    for (const [text, count] of [...entry.samples].sort((a, b) => b[1] - a[1]).slice(0, 8)) console.log(`      ${String(count).padStart(3)}x ${text.slice(0, 120)}`);
  }
  if (OUT) writeFileSync(OUT, `${JSON.stringify({ base: BASE, generatedAt: new Date().toISOString(), uiTotal, dataTotal, pages: results }, null, 1)}\n`);
  process.exitCode = uiTotal ? 1 : 0;
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("qa-l10n-gaps.mjs")) await main();
