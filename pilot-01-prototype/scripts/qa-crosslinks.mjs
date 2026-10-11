#!/usr/bin/env node
// Crawl check for tool <-> article cross-links and topic clusters (links-l10n lane 2026-10-11; scorecard D4 + C5).
//
//   node scripts/qa-crosslinks.mjs [--base=https://nexualpha.com] [--feed=public/content/news-feed.json]
//        [--locales=en,tr,...|all] [--max-articles=40] [--out=report.json] [--concurrency=6]
//
// D4 (tool -> articles): every tool page (/liquidations, /funding-rates, /rates, /compare, /activities) in every
//   requested locale must carry >= 3 server-rendered article links inside its "Related research" block
//   (<section data-tool-articles>) and each linked article must answer 200.
// D4 (article -> tool): every article that discusses a tool's subject must link back to that tool page. "Discusses" is
//   the mapping in src/data/topic-clusters.js applied to the feed (--feed); without a feed, the articles the tool pages
//   list are checked. Article pages are fetched as raw HTML (no JavaScript), so only server-rendered links count.
// C5 (topic clusters): every cluster's main page answers 200 and the cluster's articles link to it.
// Exit code 1 when any check fails. Read-only GETs; safe against production.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TOPIC_CLUSTERS, TOOL_CLUSTER_IDS, articleMatchesCluster } from "../src/data/topic-clusters.js";
import { LOCALE_PREFIX_BY_CODE, localizedPath } from "../src/data/locale-routing.js";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const arg = (name, fallback) => {
  const hit = process.argv.slice(2).find((value) => value === `--${name}` || value.startsWith(`--${name}=`));
  if (!hit) return fallback;
  return hit.includes("=") ? hit.slice(hit.indexOf("=") + 1) : "true";
};
const BASE = String(arg("base", "https://nexualpha.com")).replace(/\/$/, "");
const FEED = arg("feed", path.join(root, "public/content/news-feed.json"));
const LOCALES = (() => {
  const value = arg("locales", "all");
  return value === "all" ? Object.keys(LOCALE_PREFIX_BY_CODE) : value.split(",").map((item) => item.trim()).filter(Boolean);
})();
const MAX_ARTICLES = Number(arg("max-articles", "40"));
const CONCURRENCY = Number(arg("concurrency", "6"));
const OUT = arg("out", null);

const pageCache = new Map();
async function fetchPage(pathname) {
  if (!pageCache.has(pathname)) {
    pageCache.set(pathname, (async () => {
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          const response = await fetch(`${BASE}${pathname}`, { headers: { "user-agent": "NexuAlpha-QA-crosslinks", accept: "text/html" }, redirect: "manual" });
          return { status: response.status, html: response.status === 200 ? await response.text() : "" };
        } catch (error) {
          if (attempt === 2) return { status: 0, html: "", error: String(error?.message || error) };
        }
      }
      return { status: 0, html: "" };
    })());
  }
  return pageCache.get(pathname);
}

async function pool(items, worker) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.max(1, CONCURRENCY) }, async () => {
    while (next < items.length) { const index = next++; results[index] = await worker(items[index], index); }
  }));
  return results;
}

const decode = (value) => String(value).replace(/&amp;/g, "&").replace(/&quot;/g, "\"").replace(/&#x27;|&#39;/g, "'");
const stripScripts = (html) => html.replace(/<script\b[\s\S]*?<\/script>/gi, "");
const pathOf = (href) => { try { const url = new URL(decode(href), BASE); return url.origin === new URL(BASE).origin ? url.pathname : null; } catch { return null; } };

/** Article links inside the server-rendered tool block. */
function toolBlockLinks(html, tool) {
  const body = stripScripts(html);
  const start = body.search(new RegExp(`<section\\b[^>]*data-tool-articles="${tool.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
  if (start < 0) return null;
  const end = body.indexOf("</section>", start);
  const block = body.slice(start, end < 0 ? undefined : end);
  return [...block.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*data-tool-article="([a-z0-9-]+)"/g)].map((match) => ({ slug: match[2], href: decode(match[1]) }));
}

/**
 * Does the raw article HTML link to `target` (a content path such as /funding-rates) from inside <main>? Header,
 * navigation and footer links (every page links the tools from its menu) do not count. Locale prefixes are ignored.
 */
function linksTo(html, target) {
  const full = stripScripts(html);
  const start = full.search(/<main\b/i);
  const end = full.lastIndexOf("</main>");
  const body = start >= 0 ? full.slice(start, end > start ? end : undefined) : full;
  for (const match of body.matchAll(/<a\b[^>]*href="([^"]+)"/g)) {
    const pathname = pathOf(match[1]);
    if (!pathname) continue;
    const segments = pathname.split("/").filter(Boolean);
    const content = segments.length && Object.values(LOCALE_PREFIX_BY_CODE).includes(segments[0]) ? `/${segments.slice(1).join("/")}` : pathname;
    if ((content || "/") === target) return true;
  }
  return false;
}

let feedArticles = [];
try {
  feedArticles = JSON.parse(readFileSync(FEED, "utf8")).articles.filter((article) => article?.slug && (!article.status || article.status === "PUBLISHED"));
} catch (error) {
  console.log(`feed not readable (${FEED}): ${error.message}; the reverse check uses the articles the tool pages list`);
}
const liveSlugs = new Set();

const report = { base: BASE, feed: feedArticles.length ? FEED : null, generatedAt: new Date().toISOString(), locales: LOCALES, d4: { toolPages: [], articleBacklinks: [] }, c5: { clusters: [] }, failures: [] };
const fail = (kind, detail) => report.failures.push({ kind, ...detail });

// ---- D4: tool pages -> articles ------------------------------------------------------------------------------------
const toolJobs = TOOL_CLUSTER_IDS.flatMap((tool) => LOCALES.map((locale) => ({ tool, locale, pathname: localizedPath(`/${tool}`, locale) })));
const listedByTool = new Map(TOOL_CLUSTER_IDS.map((tool) => [tool, new Set()]));
await pool(toolJobs, async ({ tool, locale, pathname }) => {
  const page = await fetchPage(pathname);
  const links = page.status === 200 ? toolBlockLinks(page.html, tool) : null;
  const row = { tool, locale, path: pathname, status: page.status, articleLinks: links ? links.length : 0, slugs: links ? links.map((link) => link.slug) : [] };
  report.d4.toolPages.push(row);
  if (page.status !== 200) fail("tool-page-status", row);
  else if (!links) fail("tool-page-no-block", row);
  else if (links.length < 3) fail("tool-page-too-few-articles", row);
  for (const link of links || []) { listedByTool.get(tool).add(link.slug); liveSlugs.add(link.slug); }
});
// Every linked article answers 200 (English edition; the localized href resolves to the same page).
const linkedSlugs = [...liveSlugs];
await pool(linkedSlugs, async (slug) => {
  const page = await fetchPage(`/news/${slug}`);
  if (page.status !== 200) fail("tool-linked-article-status", { slug, status: page.status });
});

// ---- D4: articles -> tool pages ------------------------------------------------------------------------------------
const clusterArticles = (cluster) => (feedArticles.length ? feedArticles.filter((article) => articleMatchesCluster(article, cluster)) : []);
for (const tool of TOOL_CLUSTER_IDS) {
  const cluster = TOPIC_CLUSTERS.find((item) => item.id === tool);
  const fromFeed = clusterArticles(cluster).sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)).map((article) => article.slug);
  const candidates = [...new Set([...listedByTool.get(tool), ...fromFeed])].slice(0, Math.max(MAX_ARTICLES, listedByTool.get(tool).size));
  const results = await pool(candidates, async (slug) => {
    const page = await fetchPage(`/news/${slug}`);
    return { slug, status: page.status, linksBack: page.status === 200 && linksTo(page.html, cluster.path) };
  });
  const checked = results.filter((row) => row.status === 200);
  const missing = checked.filter((row) => !row.linksBack).map((row) => row.slug);
  const notFound = results.filter((row) => row.status !== 200).map((row) => ({ slug: row.slug, status: row.status }));
  report.d4.articleBacklinks.push({ tool, path: cluster.path, relevantInFeed: fromFeed.length, checked: checked.length, linkBack: checked.length - missing.length, missing, notFound });
  for (const slug of missing) fail("article-missing-tool-link", { tool, slug });
}

// ---- C5: topic clusters --------------------------------------------------------------------------------------------
for (const cluster of TOPIC_CLUSTERS) {
  const main = await fetchPage(cluster.path);
  const slugs = clusterArticles(cluster).sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)).map((article) => article.slug).slice(0, MAX_ARTICLES);
  const results = await pool(slugs, async (slug) => {
    const page = await fetchPage(`/news/${slug}`);
    return { slug, status: page.status, linksToMain: page.status === 200 && linksTo(page.html, cluster.path) };
  });
  const checked = results.filter((row) => row.status === 200);
  const missing = checked.filter((row) => !row.linksToMain).map((row) => row.slug);
  report.c5.clusters.push({ id: cluster.id, kind: cluster.kind, main: cluster.path, mainStatus: main.status, articlesInFeed: clusterArticles(cluster).length, checked: checked.length, linkToMain: checked.length - missing.length, missing });
  if (main.status !== 200) fail("cluster-main-status", { id: cluster.id, path: cluster.path, status: main.status });
  for (const slug of missing) fail("article-missing-cluster-link", { id: cluster.id, slug });
}

// ---- summary -------------------------------------------------------------------------------------------------------
const pages = report.d4.toolPages;
const okPages = pages.filter((row) => row.status === 200 && row.articleLinks >= 3).length;
console.log(`base ${BASE}  feed ${report.feed ? `${feedArticles.length} articles` : "none"}`);
console.log(`D4 tool pages with >= 3 article links: ${okPages}/${pages.length}`);
for (const tool of TOOL_CLUSTER_IDS) {
  const rows = pages.filter((row) => row.tool === tool);
  const counts = rows.map((row) => row.articleLinks);
  console.log(`  ${tool.padEnd(14)} min ${Math.min(...counts)} max ${Math.max(...counts)} links (${rows.filter((row) => row.articleLinks >= 3).length}/${rows.length} pages)`);
}
console.log("D4 articles linking back to their tool:");
for (const row of report.d4.articleBacklinks) console.log(`  ${row.tool.padEnd(14)} ${row.linkBack}/${row.checked} (relevant in feed: ${row.relevantInFeed}${row.notFound.length ? `, ${row.notFound.length} not 200` : ""})`);
console.log("C5 clusters (main page status, articles linking to it):");
for (const row of report.c5.clusters) console.log(`  ${row.id.padEnd(22)} ${String(row.mainStatus).padEnd(4)} ${row.main.padEnd(40)} ${row.linkToMain}/${row.checked} (in feed: ${row.articlesInFeed})`);
console.log(`failures: ${report.failures.length}`);
for (const failure of report.failures.slice(0, 30)) console.log(`  ${JSON.stringify(failure)}`);
if (OUT) writeFileSync(OUT, `${JSON.stringify(report, null, 1)}\n`);
process.exitCode = report.failures.length ? 1 : 0;
