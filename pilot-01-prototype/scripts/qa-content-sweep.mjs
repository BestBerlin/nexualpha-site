#!/usr/bin/env node
// News-feed content sweep (links-l10n lane 2026-10-11; scorecard C4).
//
//   node scripts/qa-content-sweep.mjs [--feed=public/content/news-feed.json] [--base=http://localhost:8952]
//        [--out=report.json] [--concurrency=8] [--max-pages=0]
//
// Data pass (always): every article, every locale edition, every field a reader sees (title, summary, body, SEO
// description, AEO direct answer, source titles):
//   raw-markdown-link   "[label](target)" that would show as text: in plain-text fields (title, summary, description,
//                       direct answer) any such sequence; in the body, one the article renderer's tokenizer cannot parse
//   markdown-in-plain   **bold** / `code` markers in plain-text fields (shown literally)
//   dangling            summary / description that ends mid-sentence (no terminal punctuation) or with an ellipsis
//   local-path          local filesystem paths (/Users/, /Volumes/, /home/, /tmp/, file://, C:\) anywhere
//   undefined-null      "undefined", "[object Object]", "NaN" anywhere, and "null" as a whole field / table cell /
//                       sentence fragment in reader-facing text
//   broken-internal     internal link targets (body links, seo.internalLinkTargets) that name no existing page
// Rendered pass (--base): fetches each article edition (/news/<slug> and every localized edition path) without
// JavaScript and scans the server-rendered <main> text for the same patterns, then requests every internal link the
// pages carry and reports the ones that do not answer 200 (redirects followed once).
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { countRawMarkdownLinks, resolveArticleLinkHref, tokenizeInlineMarkdown } from "../src/data/article-inline-markdown.js";
import { LOCALE_PREFIX_BY_CODE, localizedPath, parsePublicRoute } from "../src/data/locale-routing.js";
import { venueDatabase } from "../src/data/venue-database.js";
import { TOPIC_SLUGS } from "../src/data/topic-slugs.js";
import { TOKENIZED_ASSET_SLUGS } from "../src/data/tokenized-asset-slugs.js";
import { parseComparePair } from "../src/data/compare-generated.js";
import { newsArticleAvailableLocales } from "../src/data/news-feed-client.js";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const arg = (name, fallback) => process.argv.slice(2).find((value) => value.startsWith(`--${name}=`))?.split("=").slice(1).join("=") || fallback;
const FEED = arg("feed", path.join(root, "public/content/news-feed.json"));
const BASE = arg("base", "")?.replace(/\/$/, "");
const OUT = arg("out", null);
const CONCURRENCY = Number(arg("concurrency", "8"));
const MAX_PAGES = Number(arg("max-pages", "0"));

const feed = JSON.parse(readFileSync(FEED, "utf8"));
const articles = (feed.articles || []).filter((article) => article?.slug && (!article.status || article.status === "PUBLISHED"));
const slugs = new Set(articles.map((article) => article.slug));
const findings = [];
const add = (kind, slug, locale, field, sample) => findings.push({ kind, slug, locale, field, sample: String(sample).replace(/\s+/g, " ").slice(0, 160) });

// ---- patterns ------------------------------------------------------------------------------------------------------
const LOCAL_PATH = /(?:^|[\s("'`<>=\[])(?:\/Users\/[^\s)"'`]+|\/Volumes\/[^\s)"'`]+|\/home\/[a-z][^\s)"'`]*|\/private\/(?:tmp|var)\/[^\s)"'`]*|\/tmp\/[^\s)"'`]+|\/var\/folders\/[^\s)"'`]+|file:\/\/[^\s)"'`]+|[A-Z]:\\[^\s)"'`]+)/;
// Template leaks, not the English words: a field, cell or clause that is only "undefined" / "null" / "NaN", one that
// follows a label or operator ("Fee: undefined", "= null", "(NaN)"), or a stringified object.
const UNDEFINED = /\[object Object\]|(?:^|[:=(|]\s*|\$\{)(?:undefined|null|NaN)\s*(?:$|[|),;}])|(?<![A-Za-z])NaN(?:%|\s*(?:USD|USDT|bps))/m;
const NULL_FRAGMENT = /^\s*(?:null|undefined)\s*$/im;
const TERMINAL = /[.!?。！？…)"”’»」』\]%]$|[0-9A-Za-z]\)$/;
const ELLIPSIS_END = /(?:\.\.\.|…)\s*$/;
const STRONG_OR_CODE = /\*\*[^*\n]+\*\*|`[^`\n]+`/;
const RAW_LINK = /\[[^\[\]\n]+\]\([^)\n]*\)/;

const textOf = (value) => (typeof value === "string" ? value : "");
const editions = (value) => (value && typeof value === "object" ? Object.entries(value).filter(([, text]) => typeof text === "string") : []);

// ---- internal link targets -----------------------------------------------------------------------------------------
const STATIC_PATHS = new Set(["/", "/news", "/exchanges", "/compare", "/topics", "/factbook", "/rates", "/activities", "/liquidations", "/funding-rates", "/methodology", "/about", "/editorial-policy", "/partners", "/telegram", "/onchain"]);
const CATEGORY_PATH = /^\/news\/category\/(guide|comparison|exchange-update|regulation|rwa|research)(?:\/page\/\d+)?$/;
function internalTargetExists(pathname) {
  if (STATIC_PATHS.has(pathname) || CATEGORY_PATH.test(pathname) || /^\/news\/page\/\d+$/.test(pathname)) return true;
  let match;
  if ((match = pathname.match(/^\/news\/([a-z0-9-]+)$/))) return slugs.has(match[1]);
  if ((match = pathname.match(/^\/(?:exchanges|factbook)\/([a-z0-9-]+)$/))) return Boolean(venueDatabase[match[1]]);
  if ((match = pathname.match(/^\/topics\/([a-z0-9-]+)$/))) return TOPIC_SLUGS.includes(match[1]) || TOKENIZED_ASSET_SLUGS.includes(match[1]);
  if ((match = pathname.match(/^\/compare\/([a-z0-9-]+)$/))) return Boolean(parseComparePair(match[1]));
  if ((match = pathname.match(/^\/activities\/research\/([a-z0-9-]+)$/))) return Boolean(venueDatabase[match[1]]);
  return false;
}
const contentPath = (href) => {
  try {
    const url = new URL(href, "https://nexualpha.com");
    return parsePublicRoute(url.pathname.replace(/\/+$/, "") || "/", url.searchParams).contentPathname;
  } catch { return null; }
};

// ---- data pass -----------------------------------------------------------------------------------------------------
function scanPlain(slug, locale, field, text, { sentence = false } = {}) {
  if (!text) return;
  if (RAW_LINK.test(text)) add("raw-markdown-link", slug, locale, field, text.match(RAW_LINK)[0]);
  else if (STRONG_OR_CODE.test(text)) add("markdown-in-plain", slug, locale, field, text.match(STRONG_OR_CODE)[0]);
  if (LOCAL_PATH.test(text)) add("local-path", slug, locale, field, text.match(LOCAL_PATH)[0]);
  if (UNDEFINED.test(text) || NULL_FRAGMENT.test(text)) add("undefined-null", slug, locale, field, text);
  if (sentence) {
    const trimmed = text.trim();
    if (ELLIPSIS_END.test(trimmed)) add("dangling", slug, locale, field, `…${trimmed.slice(-80)}`);
    else if (!TERMINAL.test(trimmed)) add("dangling", slug, locale, field, `…${trimmed.slice(-80)}`);
  }
}

function scanBody(slug, locale, markdown) {
  const lines = String(markdown || "").split("\n");
  for (const line of lines) {
    const text = line.replace(/^\s*(?:#{1,6}\s+|[-*+]\s+|\d+[.)]\s+|>\s?)/, "");
    if (!text.trim()) continue;
    const cells = text.trim().startsWith("|") ? text.split("|").map((cell) => cell.trim()).filter(Boolean) : [text];
    for (const cell of cells) {
      const tokens = tokenizeInlineMarkdown(cell, { locale: "en" });
      const flat = (list) => list.flatMap((token) => (token.type === "text" ? [token.text] : token.children ? flat(token.children) : []));
      const visible = flat(tokens).join("");
      if (countRawMarkdownLinks(visible) || RAW_LINK.test(visible)) add("raw-markdown-link", slug, locale, "content", visible.match(RAW_LINK)?.[0] || visible);
      if (/^\s*(?:null|undefined|NaN)\s*$/i.test(cell) || UNDEFINED.test(visible)) add("undefined-null", slug, locale, "content", cell);
    }
    if (LOCAL_PATH.test(text)) add("local-path", slug, locale, "content", text.match(LOCAL_PATH)[0]);
    for (const match of text.matchAll(/\[(?:[^\[\]\n]|\[[^\[\]\n]*\])+\]\(\s*([^()\s]+)/g)) {
      const target = match[1];
      if (!target.startsWith("/") || target.startsWith("//")) continue;
      const resolved = resolveArticleLinkHref(target, "en");
      const pathname = contentPath(target);
      if (!resolved || !pathname || !internalTargetExists(pathname)) add("broken-internal", slug, locale, "content", target);
    }
  }
}

for (const article of articles) {
  const { slug } = article;
  for (const [locale, text] of editions(article.title)) scanPlain(slug, locale, "title", text);
  for (const [locale, text] of editions(article.summary)) scanPlain(slug, locale, "summary", text, { sentence: true });
  for (const [locale, text] of editions(article.content)) scanBody(slug, locale, text);
  for (const [locale, text] of editions(article.categoryName)) scanPlain(slug, locale, "categoryName", text);
  const seo = article.seo || {};
  scanPlain(slug, "seo", "seo.title", textOf(seo.title));
  scanPlain(slug, "seo", "seo.description", textOf(seo.description), { sentence: true });
  for (const [locale, text] of editions(seo.descriptions || seo.localizedDescriptions)) scanPlain(slug, locale, "seo.description", text, { sentence: true });
  scanPlain(slug, "aeo", "aeo.directAnswer", textOf(article.aeo?.directAnswer), { sentence: true });
  scanPlain(slug, "geo", "geo.citationSummary", textOf(article.geo?.citationSummary), { sentence: true });
  for (const source of Array.isArray(article.sources) ? article.sources : []) {
    scanPlain(slug, "source", "source.title", textOf(source?.title));
    if (LOCAL_PATH.test(` ${textOf(source?.url)}`) || !/^https?:\/\//i.test(textOf(source?.url))) add("local-path", slug, "source", "source.url", textOf(source?.url) || "(empty url)");
  }
  for (const target of Array.isArray(seo.internalLinkTargets) ? seo.internalLinkTargets : []) {
    const pathname = typeof target === "string" ? contentPath(target) : null;
    if (!pathname || !internalTargetExists(pathname)) add("broken-internal", slug, "seo", "seo.internalLinkTargets", target);
  }
}

// ---- rendered pass -------------------------------------------------------------------------------------------------
const rendered = { pages: 0, failedPages: [], internalLinks: 0, brokenLinks: [] };
async function pool(items, worker) {
  let next = 0;
  await Promise.all(Array.from({ length: Math.max(1, CONCURRENCY) }, async () => { while (next < items.length) { const item = items[next++]; await worker(item); } }));
}
const visibleMainText = (html) => {
  const body = html.replace(/<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>|<noscript\b[\s\S]*?<\/noscript>/gi, "");
  const start = body.search(/<main\b/i);
  const end = body.lastIndexOf("</main>");
  const main = start >= 0 ? body.slice(start, end > start ? end : undefined) : body;
  return { main, text: main.replace(/<[^>]+>/g, "\n").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&#x27;|&#39;/g, "'") };
};
if (BASE) {
  const pages = [];
  for (const article of articles) {
    for (const locale of new Set(["en", ...newsArticleAvailableLocales(article)])) pages.push({ slug: article.slug, locale, path: localizedPath(`/news/${article.slug}`, locale) });
  }
  const selected = MAX_PAGES > 0 ? pages.slice(0, MAX_PAGES) : pages;
  const internal = new Map();
  await pool(selected, async (page) => {
    let html = "";
    try {
      const response = await fetch(`${BASE}${page.path}`, { headers: { "user-agent": "NexuAlpha-QA-content-sweep", accept: "text/html" } });
      if (response.status !== 200) { rendered.failedPages.push({ ...page, status: response.status }); return; }
      html = await response.text();
    } catch (error) { rendered.failedPages.push({ ...page, status: 0, error: String(error?.message || error) }); return; }
    rendered.pages += 1;
    const { main, text } = visibleMainText(html);
    for (const line of text.split("\n").map((item) => item.trim()).filter(Boolean)) {
      if (RAW_LINK.test(line)) add("rendered-raw-markdown-link", page.slug, page.locale, page.path, line.match(RAW_LINK)[0]);
      if (/^(?:undefined|null|NaN|\[object Object\])$/.test(line) || UNDEFINED.test(line)) add("rendered-undefined-null", page.slug, page.locale, page.path, line);
      if (LOCAL_PATH.test(` ${line}`)) add("rendered-local-path", page.slug, page.locale, page.path, line.match(LOCAL_PATH)[0]);
    }
    for (const match of main.matchAll(/<a\b[^>]*href="([^"]+)"/g)) {
      const href = match[1].replace(/&amp;/g, "&");
      if (/^(?:https?:)?\/\//i.test(href) && !href.startsWith(BASE) && !/^https:\/\/nexualpha\.com\//.test(href)) continue;
      if (href.startsWith("#") || /^(?:mailto|tel|javascript):/i.test(href)) continue;
      // Host-mounted data files (/intel/*.json: market feed, partners) are not content pages; a local build has no mount.
      if (/^\/intel\/[^?]+\.json(?:\?|$)/.test(href.replace(/^https:\/\/nexualpha\.com/, ""))) continue;
      const url = new URL(href, `${BASE}/`);
      const key = `${url.pathname}${url.search}`;
      if (!internal.has(key)) internal.set(key, { href: key, from: page.path });
    }
  });
  rendered.internalLinks = internal.size;
  await pool([...internal.values()], async (link) => {
    try {
      const response = await fetch(`${BASE}${link.href}`, { headers: { "user-agent": "NexuAlpha-QA-content-sweep", accept: "text/html" }, redirect: "follow" });
      if (response.status !== 200) rendered.brokenLinks.push({ ...link, status: response.status });
      await response.arrayBuffer().catch(() => {});
    } catch (error) { rendered.brokenLinks.push({ ...link, status: 0, error: String(error?.message || error) }); }
  });
  for (const link of rendered.brokenLinks) add("rendered-broken-internal", "-", "-", link.from, `${link.href} -> ${link.status}`);
}

// ---- report --------------------------------------------------------------------------------------------------------
const counts = {};
for (const finding of findings) counts[finding.kind] = (counts[finding.kind] || 0) + 1;
const editionsCount = articles.reduce((sum, article) => sum + Object.keys(article.content || {}).length, 0);
console.log(`feed ${FEED}: ${articles.length} articles, ${editionsCount} locale editions`);
if (BASE) console.log(`rendered ${BASE}: ${rendered.pages} pages (${rendered.failedPages.length} not 200), ${rendered.internalLinks} internal links checked, ${rendered.brokenLinks.length} broken`);
for (const kind of ["raw-markdown-link", "markdown-in-plain", "dangling", "local-path", "undefined-null", "broken-internal", "rendered-raw-markdown-link", "rendered-undefined-null", "rendered-local-path", "rendered-broken-internal"]) {
  if (!BASE && kind.startsWith("rendered-")) continue;
  console.log(`  ${kind.padEnd(28)} ${counts[kind] || 0}`);
}
const byKind = {};
for (const finding of findings) (byKind[finding.kind] ||= []).push(finding);
for (const [kind, rows] of Object.entries(byKind)) {
  console.log(`\n${kind} (first 12):`);
  for (const row of rows.slice(0, 12)) console.log(`  ${row.slug} [${row.locale}] ${row.field}: ${row.sample}`);
}
if (OUT) writeFileSync(OUT, `${JSON.stringify({ feed: FEED, base: BASE || null, generatedAt: new Date().toISOString(), articles: articles.length, editions: editionsCount, counts, rendered: BASE ? { pages: rendered.pages, failedPages: rendered.failedPages, internalLinks: rendered.internalLinks, brokenLinks: rendered.brokenLinks } : null, findings }, null, 1)}\n`);
process.exitCode = findings.length ? 1 : 0;
