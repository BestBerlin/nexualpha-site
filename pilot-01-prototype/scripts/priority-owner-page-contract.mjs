#!/usr/bin/env node

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getBrazilSeo } from "../src/data/brazil-seo.js";
import { computeRouteSeo } from "../src/data/seo-injection.js";
import { readSitemapTree, sitemapPageUrls } from "./sitemap-tree.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_INPUT = path.join(projectRoot, "docs/evidence/four-week-growth-20260927/index-backlog-priority.json");
const DEFAULT_DIST = path.join(projectRoot, "dist/client");
const DEFAULT_JSON = path.join(projectRoot, "docs/evidence/four-week-growth-20260927/priority-owner-page-contract.json");
const DEFAULT_MARKDOWN = path.join(projectRoot, "docs/evidence/four-week-growth-20260927/priority-owner-page-contract.md");

const stripTags = (value) => String(value || "")
  .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
  .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
  .replace(/<[^>]+>/g, " ")
  .replace(/&(?:nbsp|amp|quot|#39);/g, " ")
  .replace(/\s+/g, " ")
  .trim();

const normalizeAnswer = (value) => stripTags(value)
  .toLowerCase()
  .replace(/[^\p{L}\p{N}]+/gu, " ")
  .replace(/\s+/g, " ")
  .trim();

const firstMatch = (html, expression) => expression.exec(html)?.[1] || "";
const has = (html, expression) => expression.test(html);

function extractJsonLdItems(html) {
  const scripts = [...String(html || "").matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const items = [];
  for (const [, body] of scripts) {
    try {
      const parsed = JSON.parse(body.trim());
      const queue = Array.isArray(parsed) ? [...parsed] : [parsed];
      while (queue.length) {
        const item = queue.shift();
        if (!item || typeof item !== "object") continue;
        if (Array.isArray(item["@graph"])) queue.push(...item["@graph"]);
        items.push(item);
      }
    } catch {
      // Invalid JSON-LD is handled by the missing schema checks below.
    }
  }
  return items;
}

function normalizeSchemaItems(schema) {
  const values = Array.isArray(schema) ? schema : [schema];
  return values.filter((item) => item && typeof item === "object");
}

function schemaTypeIncludes(item, type) {
  const value = item?.["@type"];
  return Array.isArray(value) ? value.includes(type) : value === type;
}

function nameOf(value) {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(nameOf).join(" ");
  return value?.name || "";
}

function sourceUrlsFromSchema(value) {
  const urls = [];
  const queue = Array.isArray(value) ? [...value] : [value];
  while (queue.length) {
    const item = queue.shift();
    if (!item) continue;
    if (typeof item === "string") {
      if (/^https:\/\//i.test(item)) urls.push(item);
      continue;
    }
    if (Array.isArray(item)) {
      queue.push(...item);
      continue;
    }
    if (typeof item === "object") {
      if (/^https:\/\//i.test(item.url || "")) urls.push(item.url);
      if (/^https:\/\//i.test(item["@id"] || "")) urls.push(item["@id"]);
    }
  }
  return [...new Set(urls)];
}

export function resolvePrerenderAsset({ pathname, locale, manifest }) {
  const entry = manifest?.routes?.[`${pathname}|${locale}`];
  return entry?.asset || null;
}

export function inspectPriorityOwnerPage({ url, html, locale, published = null, schemas = [] }) {
  const pathname = new URL(url).pathname;
  const jsonLdItems = [...extractJsonLdItems(html), ...normalizeSchemaItems(schemas)];
  const webPageSchema = jsonLdItems.find((item) => schemaTypeIncludes(item, "WebPage")) || null;
  const schemaSourceUrls = sourceUrlsFromSchema([webPageSchema?.isBasedOn, webPageSchema?.citation]);
  const schemaMainSources = schemaSourceUrls.slice(0, 4);
  const h1 = stripTags(firstMatch(html, /<h1\b[^>]*>([\s\S]*?)<\/h1>/i));
  const firstParagraph = stripTags(firstMatch(html, /<main\b[^>]*>[\s\S]*?<p\b[^>]*>([\s\S]*?)<\/p>/i));
  const links = [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)].map((match) => ({
    attrs: match[1],
    label: stripTags(match[2]),
    href: firstMatch(match[1], /href=["']([^"']+)["']/i),
  }));
  const internalLinks = links.filter((link) => link.href.startsWith("/")).length;
  const officialSourceLinks = links.filter((link) => /^https:\/\//i.test(link.href)
    && !/t\.me|nexualpha\.com/i.test(link.href)
    && !/data-cta-kind=["']registration/i.test(link.attrs)).length;
  const primaryCtas = links.filter((link) => /data-cta-kind=["']registration["']/i.test(link.attrs)
    || /data-growth-decision=/i.test(link.attrs));
  const alternativeLinks = links.filter((link) => /compare|comparar|alternative|alternativa|diret[oó]rio|directory/i.test(`${link.href} ${link.label}`));
  const telegramLinks = links.filter((link) => /t\.me\/NexuAlphaAssistantBot/i.test(link.href));
  const hasDate = /<time\b[^>]*(?:datetime|dateTime)=["'][^"']+["']/i.test(html)
    || /(?:reviewed|updated|verified|revisado|verificado|atualizado)[^<]{0,50}\b20\d{2}\b/i.test(stripTags(html));
  const canonical = has(html, /rel=["']canonical["']/i) ? true : null;
  const robotsNoindex = has(html, /(?:name=["']robots["'][^>]*content=["'][^"']*noindex|content=["'][^"']*noindex[^"']*["'][^>]*name=["']robots)/i);
  const answerFirst = h1.length >= 12 && firstParagraph.length >= 60;
  const h1DecisionIntent = /(?:compare|comparar|platform|exchange|pix|brl|kyc|cpf|custo|custos|cadastro|conta|saque|cripto|crypto|checklist|taxa|taxas|bybit|bitget|hyperliquid|uniswap|derivatives|tokenized|treasury|treasuries)/i.test(h1);
  const methodSignals = (stripTags(html).match(/\b(?:method|methodology|criteria|framework|matrix|checklist|how we|how to compare|m[eé]todo|metodologia|crit[eé]rios|matriz|como avaliamos|como comparar|evid[eê]ncia|evidence|source|fontes)\b/gi) || []).length;
  const portugueseMarkers = (stripTags(html).match(/\b(?:comparar|corretora|cadastro|taxa|conta|fontes|pr[oó]ximos|decis[aã]o|antes)\b/gi) || []).length;
  const englishFallback = locale === "pt-BR"
    ? ((stripTags(html).match(/\b(?:compare platforms|open account|view details|official sources|next steps|sign up)\b/gi) || []).length >= 2)
    : null;
  const schemaOwnerAttribution = /NexuAlpha Research Desk/i.test(nameOf(webPageSchema?.author))
    && /^NexuAlpha$/i.test(nameOf(webPageSchema?.publisher));
  const schemaReviewDate = /^\d{4}-\d{2}-\d{2}$/.test(String(webPageSchema?.dateModified || ""));
  const schemaContractRequired = pathname.startsWith("/br") || Boolean(webPageSchema);
  const schemaMainSourceWindow = schemaSourceUrls.length >= 2 && schemaMainSources.length <= 4;
  const ownerLevelNextAction = primaryCtas.some((link) => /data-growth-decision=/i.test(link.attrs) && /data-cta-placement=/i.test(link.attrs));

  const checks = {
    indexablePublication: published === null ? null : published && !robotsNoindex,
    canonical,
    answerFirst,
    h1DecisionIntent,
    methodExplanation: methodSignals > 0,
    reviewDate: hasDate,
    schemaOwnerAttribution: schemaContractRequired ? schemaOwnerAttribution : null,
    schemaReviewDate: schemaContractRequired ? schemaReviewDate : null,
    schemaMainSources: schemaContractRequired ? schemaMainSourceWindow : null,
    officialSources: officialSourceLinks > 0,
    primaryNextStep: primaryCtas.length > 0,
    ownerLevelNextAction,
    alternativeDecisionPath: alternativeLinks.length > 0,
    telegramReturnPath: telegramLinks.length > 0,
    internalLinks: internalLinks >= 3,
    portugueseContent: locale === "pt-BR" ? portugueseMarkers >= 5 : null,
    englishFallbackAbsent: locale === "pt-BR" ? !englishFallback : null,
  };
  const applicable = Object.values(checks).filter((value) => value !== null);
  return {
    url,
    pathname,
    locale,
    h1,
    summary: firstParagraph,
    counts: { internalLinks, officialSourceLinks, primaryCtas: primaryCtas.length, alternativeLinks: alternativeLinks.length, telegramLinks: telegramLinks.length, schemaMainSources: schemaMainSources.length },
    checks,
    passCount: applicable.filter(Boolean).length,
    applicableCount: applicable.length,
    gaps: Object.entries(checks).filter(([, value]) => value === false).map(([key]) => key),
  };
}

export function buildPriorityOwnerReport({ backlog, manifest, readAsset, publishedUrls = null, metadataForRoute = null }) {
  const owners = backlog.rows.filter((row) => row.bucket === "priority-owners");
  const pages = owners.map((row) => {
    const locale = row.path.startsWith("/br") ? "pt-BR" : "en";
    const asset = resolvePrerenderAsset({ pathname: row.path, locale, manifest });
    if (!asset) return { url: row.url, pathname: row.path, locale, status: "MISSING_ASSET", gaps: ["prerenderAsset"] };
    try {
      const payload = JSON.parse(readAsset(asset));
      const normalizedUrl = row.url.replace(/\/$/, "");
      const published = publishedUrls === null ? null : publishedUrls.has(row.url) || publishedUrls.has(normalizedUrl) || publishedUrls.has(`${normalizedUrl}/`);
      const metadata = typeof metadataForRoute === "function" ? metadataForRoute({ row, locale }) : null;
      const schemas = metadata?.schemas || metadata?.schema || [];
      return { status: "AUDITED", asset, ...inspectPriorityOwnerPage({ url: row.url, html: payload.html || "", locale, published, schemas }) };
    } catch (error) {
      return { url: row.url, pathname: row.path, locale, asset, status: "UNREADABLE_ASSET", error: error.message, gaps: ["prerenderAsset"] };
    }
  });
  const answerBuckets = new Map();
  for (const page of pages) {
    if (page.status !== "AUDITED") continue;
    const key = normalizeAnswer(page.summary || "");
    if (!key) continue;
    const bucket = answerBuckets.get(key) || [];
    bucket.push(page);
    answerBuckets.set(key, bucket);
  }
  for (const bucket of answerBuckets.values()) {
    const distinct = bucket.length === 1;
    for (const page of bucket) {
      page.checks.differentiatedDirectAnswer = distinct;
      if (!distinct) page.gaps.push("differentiatedDirectAnswer");
      page.applicableCount += 1;
      if (distinct) page.passCount += 1;
    }
  }
  const gapCounts = {};
  for (const page of pages) for (const gap of page.gaps || []) gapCounts[gap] = (gapCounts[gap] || 0) + 1;
  return {
    version: "nexualpha-priority-owner-contract-v1",
    generatedAt: new Date().toISOString(),
    boundary: "Signals are deterministic checks of current prerender output. They do not prove ranking, indexing, registration or commission.",
    summary: {
      pages: pages.length,
      audited: pages.filter((page) => page.status === "AUDITED").length,
      pagesWithGaps: pages.filter((page) => (page.gaps || []).length > 0).length,
      gapCounts,
    },
    pages,
  };
}

function metadataForPriorityRoute({ row, locale }) {
  if (row.path.startsWith("/br")) return getBrazilSeo(row.path);
  return computeRouteSeo({ url: row.url, locale });
}

export function renderMarkdown(report) {
  const lines = [
    "# NexuAlpha Priority Owner Page Contract",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    `Boundary: ${report.boundary}`,
    "",
    `- Pages: ${report.summary.pages}`,
    `- Audited: ${report.summary.audited}`,
    `- Pages with gaps: ${report.summary.pagesWithGaps}`,
    "",
    "| Page | Locale | Passed | Gaps |",
    "| --- | --- | ---: | --- |",
  ];
  for (const page of report.pages) {
    lines.push(`| ${page.pathname} | ${page.locale} | ${page.passCount ?? 0}/${page.applicableCount ?? 0} | ${(page.gaps || []).join(", ") || "none"} |`);
  }
  lines.push("", "## Gap totals", "");
  const gaps = Object.entries(report.summary.gapCounts);
  if (!gaps.length) lines.push("- None");
  else for (const [name, count] of gaps.sort((a, b) => b[1] - a[1])) lines.push(`- ${name}: ${count}`);
  lines.push("");
  return lines.join("\n");
}

function parseArgs(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index].startsWith("--")) values[argv[index].slice(2)] = argv[index + 1] && !argv[index + 1].startsWith("--") ? argv[++index] : true;
  }
  return values;
}

export function run(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const input = path.resolve(args.input || DEFAULT_INPUT);
  const dist = path.resolve(args.dist || DEFAULT_DIST);
  const outputJson = path.resolve(args.json || DEFAULT_JSON);
  const outputMarkdown = path.resolve(args.markdown || DEFAULT_MARKDOWN);
  const backlog = JSON.parse(readFileSync(input, "utf8"));
  const manifest = JSON.parse(readFileSync(path.join(dist, "prerender-manifest.json"), "utf8"));
  // sitemap.xml is an index; published pages are the <loc>s of its child sitemaps.
  const sitemapTree = readSitemapTree(path.join(dist, "sitemap.xml"));
  if (sitemapTree.missing.length) throw new Error(`Child sitemaps missing from ${dist}: ${sitemapTree.missing.join(", ")}`);
  const publishedUrls = new Set(sitemapPageUrls(sitemapTree));
  const report = buildPriorityOwnerReport({
    backlog,
    manifest,
    publishedUrls,
    metadataForRoute: metadataForPriorityRoute,
    readAsset: (asset) => readFileSync(path.join(dist, asset.replace(/^\//, "")), "utf8"),
  });
  mkdirSync(path.dirname(outputJson), { recursive: true });
  writeFileSync(outputJson, `${JSON.stringify(report, null, 2)}\n`);
  writeFileSync(outputMarkdown, renderMarkdown(report));
  console.log(JSON.stringify(report.summary));
  return report.summary.pagesWithGaps ? 2 : 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) process.exitCode = run();
