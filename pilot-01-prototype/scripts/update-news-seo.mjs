#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { newsArticleAvailableLocales, newsSitemapLanguage, normalizeNewsFeed } from "../src/data/news-feed-client.js";
import { localizedPath, parsePublicRoute } from "../src/data/locale-routing.js";
import { INDEXABLE_LOCALES, routeInventory } from "./generate-prerender-manifest.mjs";
import {
  SEARCH_PUBLICATION_VERSION,
  buildSearchPublicationReport,
  loadSearchPublicationBaseline,
  selectPublicationNewsArticles,
  selectSitemapPublicationEntries,
  sitemapUrl,
} from "./sitemap-publication-policy.mjs";

const PUBLIC_ORIGIN = "https://nexualpha.com";
const NEWS_PUBLICATION_NAME = "NexuAlpha";
const NEWS_SITEMAP_LIMIT = 1000;
const NEWS_SITEMAP_FRESHNESS_WINDOW_MS = 2 * 24 * 60 * 60 * 1000;
const PUBLISHED_RESEARCH_HEADINGS = new Set([
  "## Published Source-Backed Research",
  "## Published research",
]);

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function xmlEscape(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function dateOnly(value, fallback) {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? fallback : new Date(timestamp).toISOString().slice(0, 10);
}

function finiteTimestamp(value) {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function newsSitemapLastmod(article, referenceTimestamp) {
  const publishedTimestamp = finiteTimestamp(article?.publishedAt);
  const updatedTimestamp = finiteTimestamp(article?.updatedAt);
  const candidate = updatedTimestamp ?? publishedTimestamp;
  const safeTimestamp = candidate !== null && candidate <= referenceTimestamp ? candidate : publishedTimestamp;
  return safeTimestamp === null ? null : new Date(safeTimestamp).toISOString().slice(0, 10);
}

function xmlUnescape(value) {
  return String(value)
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'");
}

function existingUrlBlocks(sitemap) {
  return [...String(sitemap || "").matchAll(/<url>\s*[\s\S]*?<\/url>/g)]
    .flatMap((match) => {
      const block = match[0];
      const loc = block.match(/<loc>([\s\S]*?)<\/loc>/)?.[1];
      return loc ? [{ loc: xmlUnescape(loc.trim()), block }] : [];
    });
}

function isManagedNewsUrl(url, origin) {
  try {
    const parsed = new URL(url);
    const expectedOrigin = new URL(origin);
    const route = parsePublicRoute(parsed.pathname, parsed.searchParams);
    return parsed.origin === expectedOrigin.origin
      && (route.contentPathname === "/news" || route.contentPathname.startsWith("/news/"));
  } catch {
    return false;
  }
}

function serializeUrl(entry) {
  return [
    "  <url>",
    `    <loc>${xmlEscape(entry.loc)}</loc>`,
    ...(entry.alternates || []).map((alternate) => `    <xhtml:link rel="alternate" hreflang="${alternate.hreflang}" href="${xmlEscape(alternate.href)}" />`),
    `    <lastmod>${entry.lastmod}</lastmod>`,
    `    <changefreq>${entry.changefreq}</changefreq>`,
    `    <priority>${entry.priority}</priority>`,
    "  </url>",
  ].join("\n");
}

function serializeUrlset(entries) {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...entries.map(serializeUrl),
    "</urlset>",
    "",
  ].join("\n");
}

function serializeNewsSitemap(entries) {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...entries.map((entry) => [
      "  <url>",
      `    <loc>${xmlEscape(entry.loc)}</loc>`,
      ...(entry.alternates || []).map((alternate) => `    <xhtml:link rel="alternate" hreflang="${alternate.hreflang}" href="${xmlEscape(alternate.href)}" />`),
      ...(entry.lastmod ? [`    <lastmod>${xmlEscape(entry.lastmod)}</lastmod>`] : []),
      "    <news:news>",
      "      <news:publication>",
      `        <news:name>${xmlEscape(NEWS_PUBLICATION_NAME)}</news:name>`,
      `        <news:language>${xmlEscape(entry.language)}</news:language>`,
      "      </news:publication>",
      `      <news:publication_date>${xmlEscape(entry.publicationDate)}</news:publication_date>`,
      `      <news:title>${xmlEscape(entry.title)}</news:title>`,
      "    </news:news>",
      "  </url>",
    ].join("\n")),
    "</urlset>",
    "",
  ].join("\n");
}

function mergeSitemap(existingSitemap, generatedUrls, origin) {
  const seen = new Set();
  const generatedByLoc = new Map(generatedUrls.map((entry) => [entry.loc, entry]));
  const preserved = existingUrlBlocks(existingSitemap)
    .flatMap(({ loc, block }) => {
      if (isManagedNewsUrl(loc, origin) || seen.has(loc)) return [];
      seen.add(loc);
      const generatedEntry = generatedByLoc.get(loc);
      return [{ loc, block: generatedEntry ? serializeUrl(generatedEntry) : block }];
    });
  const generated = generatedUrls
    .filter(({ loc }) => {
      if (seen.has(loc)) return false;
      seen.add(loc);
      return true;
    })
    .map((entry) => ({ loc: entry.loc, block: serializeUrl(entry) }));
  const blocks = [...preserved, ...generated];
  return {
    sitemap: serializeMergedBlocks(blocks),
    urls: blocks.map(({ loc }) => ({ loc })),
    preservedUrlCount: preserved.length,
  };
}

function serializeMergedBlocks(blocks) {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...blocks.map(({ block }) => block),
    "</urlset>",
    "",
  ].join("\n");
}

// llms.txt is an index for answer engines, not the archive: keep the newest articles with short summaries and
// point to llms-full.txt / the news library sitemap for the rest. (2026-10-10: the file had grown to 620 KB.)
const LLMS_RESEARCH_LIMIT = 80;
const LLMS_SUMMARY_CHARS = 140;
// Bulk sections that belong in llms-full.txt, dropped from llms.txt when carried over from an existing file.
const LLMS_FULL_ONLY_HEADINGS = new Set([
  "## Reviewed news article answers",
  "## Retrieval question inventory",
  "## Source-bound topic decision answers",
  "## Fiat funding and account-condition checklist",
]);

function shortSummary(text) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= LLMS_SUMMARY_CHARS) return clean;
  const cut = clean.slice(0, LLMS_SUMMARY_CHARS);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), 80)).replace(/[,;:\s]+$/, "")}…`;
}

function publishedResearchLines(articles, origin) {
  const newest = [...articles]
    .sort((a, b) => String(b.publishedAt || b.updatedAt || "").localeCompare(String(a.publishedAt || a.updatedAt || "")))
    .slice(0, LLMS_RESEARCH_LIMIT);
  const lines = newest.map((article) => {
    const title = cleanString(article.title?.en) || article.slug;
    const summary = cleanString(article.summary?.en) || "Source-backed NexuAlpha research.";
    return `- [${title}](${origin}/news/${article.slug}): ${shortSummary(summary)}`;
  });
  if (articles.length > newest.length) {
    lines.push(`- Older articles (${articles.length - newest.length} more): ${origin}/llms-full.txt and ${origin}/news-library-sitemap.xml.`);
  }
  return lines;
}

function dropFullOnlySections(lines) {
  const out = [];
  let skipping = false;
  for (const line of lines) {
    const t = line.trim();
    if (/^##\s/.test(t) || t === "---") skipping = LLMS_FULL_ONLY_HEADINGS.has(t);
    if (!skipping) out.push(line);
  }
  return out;
}

function mergeLlms(existingLlms, articles, origin, publicationReport) {
  const research = publishedResearchLines(articles, origin);
  const publicationLine = `- Search publication version: ${publicationReport.version}; sitemap URLs: ${publicationReport.totalUrls}; query-locale URLs: ${publicationReport.queryLocaleUrls}; published article canonicals: ${publicationReport.articleSlugs.length}.`;
  const existing = String(existingLlms || "").trimEnd();
  if (!existing) {
    return [
      "# NexuAlpha",
      "",
      "> NexuAlpha publishes independent, source-backed crypto platform, market-structure, risk and tokenized-asset research. Unknown or time-sensitive facts remain explicitly qualified.",
      "",
      "## Core pages",
      "",
      `- [NexuAlpha](${origin}/): Independent platform research and comparison.`,
      `- [Market News & Research](${origin}/news): Reviewed articles with visible source links.`,
      "",
      "## Published Source-Backed Research",
      "",
      publicationLine,
      "",
      ...research,
      "",
      "## Editorial boundary",
      "",
      "- Sources and verification limits are shown in each article.",
      "- Commercial destinations remain unavailable unless separately verified.",
      "- Publication and search-engine submission do not prove indexing or ranking.",
      "",
    ].join("\n");
  }

  const lines = dropFullOnlySections(existing.split(/\r?\n/));
  const start = lines.findIndex((line) => PUBLISHED_RESEARCH_HEADINGS.has(line.trim()));
  const heading = start >= 0 ? lines[start].trim() : "## Published Source-Backed Research";
  const replacement = [heading, "", publicationLine, "", ...research, ""];
  if (start < 0) return `${existing}\n\n${replacement.join("\n")}\n`;

  let end = start + 1;
  while (end < lines.length) {
    const line = lines[end].trim();
    if (end > start + 1 && (line === "---" || /^##\s/.test(line))) break;
    end += 1;
  }
  return `${[
    ...lines.slice(0, start),
    ...replacement,
    ...lines.slice(end),
  ].join("\n").trimEnd()}\n`;
}

async function readOptional(filePath) {
  try {
    return await readFile(filePath, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") return "";
    throw error;
  }
}

function recentIndexableNewsArticles(articles, generatedAt) {
  const reference = finiteTimestamp(generatedAt);
  if (reference === null) return [];
  const cutoff = reference - NEWS_SITEMAP_FRESHNESS_WINDOW_MS;
  return articles.filter((article) => {
    if (article?.seo?.noindex !== false) return false;
    const publishedAt = finiteTimestamp(article?.publishedAt);
    const lastmod = newsSitemapLastmod(article, reference);
    return publishedAt !== null && lastmod !== null && publishedAt >= cutoff && publishedAt <= reference;
  });
}

function newsSitemapEntries(articles, generatedAt, origin) {
  const href = (pathname, locale) => `${origin}${localizedPath(pathname, locale)}`;
  return recentIndexableNewsArticles(articles, generatedAt)
    .flatMap((article) => newsArticleAvailableLocales(article).map((locale) => {
      const title = cleanString(article.title?.[locale]) || cleanString(article.title?.en) || article.slug;
      return {
        loc: href(`/news/${article.slug}`, locale),
        language: newsSitemapLanguage(locale),
        publicationDate: new Date(Date.parse(article.publishedAt)).toISOString(),
        lastmod: newsSitemapLastmod(article, Date.parse(generatedAt)),
        alternates: [...newsArticleAvailableLocales(article), "x-default"].map((hreflang) => ({
          hreflang,
          href: href(`/news/${article.slug}`, hreflang === "x-default" ? "en" : hreflang),
        })),
        title,
      };
    }))
    .slice(0, NEWS_SITEMAP_LIMIT);
}

function publicationAlternates(publicationUrls, pathname) {
  const entries = publicationUrls
    .filter((entry) => entry.route?.pathname === pathname)
    .sort((a, b) => a.locale.localeCompare(b.locale));
  if (!entries.length) return [];
  const defaultEntry = entries.find((entry) => entry.locale === "en") || entries[0];
  return [
    ...entries.map((entry) => ({ hreflang: entry.locale, href: entry.loc || sitemapUrl(pathname, entry.locale) })),
    { hreflang: "x-default", href: defaultEntry.loc || sitemapUrl(pathname, defaultEntry.locale) },
  ];
}

export function buildNewsSeoFiles(feed, options = {}) {
  const origin = cleanString(options.origin) || PUBLIC_ORIGIN;
  const generatedDate = dateOnly(feed?.generatedAt, new Date().toISOString().slice(0, 10));
  const generatedAt = Number.isFinite(Date.parse(feed?.generatedAt)) ? feed.generatedAt : new Date().toISOString();
  const articles = normalizeNewsFeed(feed);
  const inventory = Array.isArray(options.inventory) ? options.inventory : routeInventory(articles);
  const policy = options.policy || loadSearchPublicationBaseline();
  const publication = selectSitemapPublicationEntries(inventory, articles, {
    policy,
    allLocales: options.allLocales || INDEXABLE_LOCALES,
  });
  const publicationReport = buildSearchPublicationReport(publication);
  const indexableArticles = selectPublicationNewsArticles(articles, publication);

  const generatedUrls = publication.urls.map(({ route, loc }) => {
    const article = articles.find((item) => route.pathname === `/news/${item.slug}`);
    const pathname = route.pathname;
    return {
      loc,
      lastmod: article ? dateOnly(article.updatedAt || article.publishedAt, generatedDate) : generatedDate,
      changefreq: pathname === "/news" ? "daily" : pathname.startsWith("/news/") ? "monthly" : "weekly",
      priority: pathname === "/" ? "1.0" : pathname === "/news" ? "0.9" : pathname.startsWith("/news/") ? "0.8" : "0.7",
      alternates: publicationAlternates(publication.urls, pathname),
    };
  });
  const newsSitemapUrls = newsSitemapEntries(indexableArticles, generatedAt, origin);

  const sitemapResult = mergeSitemap(options.existingSitemap, generatedUrls, origin);
  const llms = mergeLlms(options.existingLlms, indexableArticles, origin, publicationReport);

  return {
    sitemap: sitemapResult.sitemap,
    llms,
    newsSitemap: serializeNewsSitemap(newsSitemapUrls),
    newsSitemapUrls,
    urls: sitemapResult.urls,
    preservedUrlCount: sitemapResult.preservedUrlCount,
    articles,
    publication: {
      version: SEARCH_PUBLICATION_VERSION,
      articleSlugs: publicationReport.articleSlugs,
      stats: publication.stats,
    },
  };
}

export async function writeNewsSeoFiles(feedPath, sitemapPath, llmsPath, newsSitemapPath, options = {}) {
  if (newsSitemapPath && typeof newsSitemapPath === "object") {
    options = newsSitemapPath;
    newsSitemapPath = null;
  }
  const [feedText, existingSitemap, existingLlms] = await Promise.all([
    readFile(feedPath, "utf8"),
    readOptional(sitemapPath),
    readOptional(llmsPath),
  ]);
  const feed = JSON.parse(feedText);
  const result = buildNewsSeoFiles(feed, { ...options, existingSitemap, existingLlms });
  const writes = [
    writeFile(sitemapPath, result.sitemap),
    writeFile(llmsPath, result.llms),
  ];
  if (newsSitemapPath) writes.push(writeFile(newsSitemapPath, result.newsSitemap));
  await Promise.all(writes);
  return result;
}

async function main() {
  const [
    feedPath = "public/content/news-feed.json",
    sitemapPath = "public/sitemap.xml",
    llmsPath = "public/llms.txt",
    newsSitemapPath = "public/news-sitemap.xml",
  ] = process.argv.slice(2);
  const result = await writeNewsSeoFiles(path.resolve(feedPath), path.resolve(sitemapPath), path.resolve(llmsPath), path.resolve(newsSitemapPath));
  process.stdout.write(`${JSON.stringify({ urlCount: result.urls.length, articleCount: result.articles.length, newsSitemapUrlCount: result.newsSitemapUrls.length }, null, 2)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
