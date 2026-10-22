#!/usr/bin/env node
// Full-site HTTP sweep (QA 2026-10-11): status, redirects, canonical, robots, title/description lengths, h1 count,
// hreflang count, JSON-LD presence, placeholder/untranslated-text smells, and an internal-link crawl that discovers
// pages missing from the sitemaps and reports broken internal links. Output: JSON lines + a summary.
//   node scripts/qa-http-sweep.mjs <urls.txt> <out.jsonl> [--crawl] [--concurrency 12]
import { readFile, writeFile, appendFile } from "node:fs/promises";
import { internalFetch } from "./lib/internal-http.mjs";
// UA "NexuAlpha-internal/qa-http-sweep", paced to 2 req/s against remote hosts (scripts/lib/internal-http.mjs).
const fetch = internalFetch("qa-http-sweep");

const [, , listPath, outPath, ...rest] = process.argv;
const crawl = rest.includes("--crawl");
const concurrency = Number(rest[rest.indexOf("--concurrency") + 1]) || 12;
const ORIGIN = "https://nexualpha.com";
const UA = "NexuAlpha-QA-sweep/1.0 (+https://nexualpha.com/about)";
const CJK = new Set(["zh-hans", "zh-hant", "ja", "ko"]);
const LOCALES = /^(zh-hans|zh-hant|ja|ko|ru|es|pt-br|tr|vi|id-id|de|fr|it|ar|ur|uk-ua)$/;
const SMELLS = [
  [/lorem ipsum/i, "lorem"], [/\bTODO\b|\bTBD\b|\bFIXME\b/, "todo"], [/\{\{[^}]+\}\}/, "mustache"],
  [/\b(nav|cta|hero|footer|common|meta)\.[a-z][a-zA-Z0-9_.]+\b(?![^<]*<\/(code|script))/, "i18n-key"],
  [/undefined|NaN(?![a-zA-Z])/, "undefined-or-NaN"], [/\[object Object\]/, "object-object"],
  [/placeholder text|sample text|dummy/i, "placeholder"],
];

const seen = new Set();
const queue = [];
for (const line of (await readFile(listPath, "utf8")).split("\n")) {
  const u = line.trim(); if (!u) continue;
  const url = u.startsWith("http") ? u : ORIGIN + u;
  if (!seen.has(url)) { seen.add(url); queue.push({ url, source: "sitemap" }); }
}
await writeFile(outPath, "");

function localeOf(pathname) { const first = pathname.split("/").filter(Boolean)[0] || ""; return LOCALES.test(first) ? first : "en"; }
function attr(html, re) { const m = html.match(re); return m ? m[1] : null; }
function count(html, re) { return (html.match(re) || []).length; }
function stripTags(s) { return s.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " "); }

async function check(item) {
  const { url } = item;
  const row = { url, source: item.source, path: new URL(url).pathname };
  try {
    const res = await fetch(url, { redirect: "manual", headers: { "user-agent": UA, accept: "text/html" } });
    row.status = res.status;
    row.contentType = res.headers.get("content-type") || "";
    if ([301, 302, 307, 308].includes(res.status)) { row.location = res.headers.get("location"); return row; }
    if (!row.contentType.includes("text/html")) return row;
    const html = await res.text();
    row.bytes = html.length;
    row.lang = attr(html, /<html[^>]*\blang="([^"]*)"/i);
    row.dir = attr(html, /<html[^>]*\bdir="([^"]*)"/i);
    row.title = attr(html, /<title[^>]*>([^<]*)<\/title>/i)?.trim() || "";
    row.description = attr(html, /<meta\s+name="description"\s+content="([^"]*)"/i) || "";
    row.canonical = attr(html, /<link\s+rel="canonical"\s+href="([^"]*)"/i);
    row.robots = attr(html, /<meta\s+name="robots"\s+content="([^"]*)"/i);
    row.h1 = count(html, /<h1\b/gi);
    row.hreflang = count(html, /hreflang=/gi);
    row.jsonld = count(html, /application\/ld\+json/gi);
    row.ogImage = attr(html, /<meta\s+property="og:image"\s+content="([^"]*)"/i);
    row.imgNoAlt = count(html, /<img(?![^>]*\balt=)[^>]*>/gi);
    const locale = localeOf(row.path);
    row.locale = locale;
    const limitD = CJK.has(locale) ? 80 : 160;
    row.issues = [];
    if (row.status !== 200) row.issues.push(`status-${row.status}`);
    if (!row.title) row.issues.push("no-title"); else if (row.title.length > 70) row.issues.push(`title-long-${row.title.length}`);
    if (!row.description) row.issues.push("no-description"); else if (row.description.length > limitD) row.issues.push(`description-long-${row.description.length}`);
    if (row.h1 !== 1) row.issues.push(`h1-count-${row.h1}`);
    if (!row.canonical) row.issues.push("no-canonical");
    else if (row.canonical !== url && row.canonical !== url.replace(/\/$/, "") && !/index,follow/.test(row.robots || "") === false) row.issues.push("canonical-differs");
    if (row.canonical && row.canonical !== url && /index/.test(row.robots || "") && !/noindex/.test(row.robots || "")) row.issues.push(`indexable-but-canonical-elsewhere`);
    if (item.source === "sitemap" && /noindex/.test(row.robots || "")) row.issues.push("sitemap-noindex");
    if (row.imgNoAlt) row.issues.push(`img-no-alt-${row.imgNoAlt}`);
    const expectedLang = { "zh-hans": "zh-Hans", "zh-hant": "zh-Hant", "pt-br": "pt-BR", "id-id": "id" }[locale] || locale;
    if (row.lang && row.lang.toLowerCase() !== expectedLang.toLowerCase()) row.issues.push(`html-lang-${row.lang}`);
    if ((locale === "ar" || locale === "ur") && row.dir !== "rtl") row.issues.push(`${locale}-not-rtl`);
    const text = stripTags(html);
    for (const [re, name] of SMELLS) if (re.test(text)) row.issues.push(`smell-${name}`);
    if (crawl) {
      const links = new Set();
      for (const m of html.matchAll(/<a\s[^>]*href="([^"#?]+)(?:[?#][^"]*)?"/gi)) {
        let href = m[1];
        if (href.startsWith("/")) href = ORIGIN + href; else if (!href.startsWith(ORIGIN)) continue;
        if (/\.(png|jpg|jpeg|svg|webp|css|js|json|xml|txt|csv|pdf|ico)$/i.test(href)) continue;
        links.add(href.replace(/\/$/, "") || ORIGIN + "/");
      }
      row.links = links.size;
      for (const l of links) if (!seen.has(l) && seen.size < 6000) { seen.add(l); queue.push({ url: l, source: `link:${row.path}` }); }
    }
  } catch (e) { row.error = String(e.message || e); row.issues = ["fetch-error"]; }
  return row;
}

let done = 0;
async function worker() {
  while (queue.length) {
    const item = queue.shift();
    const row = await check(item);
    await appendFile(outPath, JSON.stringify(row) + "\n");
    done++;
    if (done % 100 === 0) console.log(`${done} done, ${queue.length} queued`);
  }
}
await Promise.all(Array.from({ length: concurrency }, worker));
const rows = (await readFile(outPath, "utf8")).trim().split("\n").map((l) => JSON.parse(l));
const byIssue = {};
for (const r of rows) for (const i of r.issues || []) (byIssue[i.replace(/-\d+$/, "")] ||= []).push(r.path);
console.log(`\n${rows.length} URLs checked (${rows.filter((r) => r.source !== "sitemap").length} discovered by crawl)`);
for (const [k, v] of Object.entries(byIssue).sort((a, b) => b[1].length - a[1].length)) console.log(`${String(v.length).padStart(5)}  ${k}  e.g. ${v.slice(0, 3).join(" ")}`);
