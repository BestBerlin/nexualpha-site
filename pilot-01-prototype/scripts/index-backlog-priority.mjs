#!/usr/bin/env node

import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, "..");
const origin = "https://nexualpha.com";

const DEFAULT_SITEMAP = path.join(projectRoot, "dist", "client", "sitemap.xml");
const DEFAULT_PUBLICATION_REPORT = path.join(projectRoot, "public", "content", "search-publication-report.json");
const DEFAULT_GSC_INDEX_SNAPSHOT = path.join(projectRoot, "docs", "evidence", "four-week-growth-20260927", "gsc-indexing-visible-snapshot-20260928.md");
const DEFAULT_GSC_BASELINE = path.join(projectRoot, "docs", "evidence", "four-week-growth-20260927", "search-console-baseline-20260928.md");
const DEFAULT_OUTPUT = path.join(projectRoot, "docs", "evidence", "four-week-growth-20260927", "index-backlog-priority.json");
const DEFAULT_MARKDOWN = path.join(projectRoot, "docs", "evidence", "four-week-growth-20260927", "index-backlog-priority.md");

const LOCALE_PREFIXES = new Set(["ar", "de", "en", "es", "fr", "id", "ja", "ko", "pt-BR", "pt", "ru", "th", "tr", "uk", "ur", "vi", "zh-Hans", "zh-Hant"]);
const BRAZIL_ROUTES = new Set(["/br", "/br/comparar", "/br/conta", "/br/custos", "/br/kyc-cpf", "/br/pix", "/br/saque-pix"]);

const PRIORITY_OWNERS = new Map([
  ["/exchanges/hyperliquid", {
    owner: "hyperliquid",
    reason: "GSC visible page/query demand: /exchanges/hyperliquid and hyperliquid fees/funded-account/cashback queries.",
  }],
  ["/exchanges/uniswap", {
    owner: "uniswap",
    reason: "GSC visible page/query demand: /exchanges/uniswap and uniswap testnet query.",
  }],
  ["/news/tokenized-treasuries-structure-access-risks", {
    owner: "tokenized-treasuries",
    reason: "GSC visible page/query demand: tokenized treasury and tokenized treasuries queries.",
  }],
  ["/compare/bybit-vs-bitget", {
    owner: "bybit-vs-bitget",
    reason: "GSC visible page demand for the Bybit vs Bitget comparison route.",
  }],
  ["/topics/derivatives", {
    owner: "derivatives",
    reason: "GSC visible page demand for the derivatives topic route.",
  }],
]);

for (const route of BRAZIL_ROUTES) {
  PRIORITY_OWNERS.set(route, {
    owner: "brazil",
    reason: "Brazil owner route: local Pix, CPF/KYC, account and cost decision chain.",
  });
}

const SUPPORTING_RULES = [
  { pattern: /^\/compare\/hyperliquid-vs-dydx$/, owner: "hyperliquid", reason: "Supports Hyperliquid and derivatives comparison intent." },
  { pattern: /^\/exchanges\/(dydx|gmx|deribit|drift)$/, owner: "derivatives", reason: "Supports derivatives/perp DEX decision coverage." },
  { pattern: /^\/topics\/(no-kyc|compliant-exchanges|meme-coins)$/, owner: "topic-support", reason: "Supports topic discovery but is not the current GSC owner set." },
  { pattern: /^\/factbook\//, owner: "factbook", reason: "Supports entity authority and AI citation context." },
  { pattern: /^\/news\//, owner: "news-support", reason: "Supports freshness and source-backed topical authority." },
  { pattern: /^\/compare\//, owner: "comparison-support", reason: "Supports comparison intent outside the current owner set." },
  { pattern: /^\/exchanges\//, owner: "venue-support", reason: "Supports venue directory depth outside the current owner set." },
];

function parseArgs(argv) {
  const options = {
    sitemap: DEFAULT_SITEMAP,
    publicationReport: DEFAULT_PUBLICATION_REPORT,
    gscIndexSnapshot: DEFAULT_GSC_INDEX_SNAPSHOT,
    gscBaseline: DEFAULT_GSC_BASELINE,
    output: DEFAULT_OUTPUT,
    markdown: DEFAULT_MARKDOWN,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => {
      index += 1;
      if (index >= argv.length) throw new Error(`${arg} requires a value`);
      return argv[index];
    };

    if (arg === "--sitemap") options.sitemap = next();
    else if (arg === "--publication-report") options.publicationReport = next();
    else if (arg === "--gsc-index-snapshot") options.gscIndexSnapshot = next();
    else if (arg === "--gsc-baseline") options.gscBaseline = next();
    else if (arg === "--output") options.output = next();
    else if (arg === "--markdown") options.markdown = next();
    else if (arg === "--help" || arg === "-h") options.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function printHelp() {
  console.log([
    "Usage: node scripts/index-backlog-priority.mjs [options]",
    "",
    "Builds a source-bound indexing backlog priority report from sitemap, publication report, and GSC aggregate snapshots.",
    "It does not assign URL-level GSC indexing states unless a URL is observed in the supplied local evidence.",
    "",
    "Options:",
    "  --sitemap <file>               Default: dist/client/sitemap.xml",
    "  --publication-report <file>    Default: public/content/search-publication-report.json",
    "  --gsc-index-snapshot <file>    Default: docs/evidence/four-week-growth-20260927/gsc-indexing-visible-snapshot-20260928.md",
    "  --gsc-baseline <file>          Default: docs/evidence/four-week-growth-20260927/search-console-baseline-20260928.md",
    "  --output <file>                JSON report path",
    "  --markdown <file>              Markdown report path",
  ].join("\n"));
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function decodeXml(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'");
}

function normalizeUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  try {
    const url = new URL(raw, origin);
    url.hash = "";
    if (url.origin !== origin) return null;
    if (url.pathname !== "/" && url.pathname.endsWith("/")) {
      url.pathname = url.pathname.replace(/\/+$/, "");
    }
    return url.href;
  } catch {
    return null;
  }
}

export function parseSitemapUrls(xml) {
  return [...String(xml || "").matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)]
    .map((match) => normalizeUrl(decodeXml(match[1])))
    .filter(Boolean);
}

function normalizePathname(url) {
  const parsed = new URL(url, origin);
  const pathname = parsed.pathname !== "/" && parsed.pathname.endsWith("/")
    ? parsed.pathname.replace(/\/+$/, "")
    : parsed.pathname;
  return pathname || "/";
}

export function routeMeta(url) {
  const pathname = normalizePathname(url);
  const parts = pathname.split("/").filter(Boolean);
  const first = parts[0] || "";
  const locale = LOCALE_PREFIXES.has(first) ? first : "en";
  const canonicalRoute = locale === "en" || pathname === "/"
    ? pathname
    : `/${parts.slice(1).join("/")}` || "/";
  return {
    path: pathname,
    locale,
    canonicalRoute,
    isLocaleExpansion: locale !== "en",
  };
}

function parseNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number.parseFloat(String(value).replace(/,/g, "").replace(/%$/, "").trim());
  return Number.isFinite(number) ? number : null;
}

function parseMarkdownTable(markdown, heading) {
  const lines = String(markdown || "").split(/\r?\n/);
  const headingIndex = lines.findIndex((line) => line.trim() === heading);
  if (headingIndex === -1) return [];

  const tableLines = [];
  for (const line of lines.slice(headingIndex + 1)) {
    if (line.startsWith("## ") && tableLines.length) break;
    if (/^\|.+\|$/.test(line.trim())) tableLines.push(line.trim());
    else if (tableLines.length && line.trim() === "") break;
  }
  if (tableLines.length < 3) return [];

  const headers = tableLines[0].split("|").slice(1, -1).map((cell) => cell.trim());
  return tableLines.slice(2).map((line) => {
    const cells = line.split("|").slice(1, -1).map((cell) => cell.trim().replace(/^`|`$/g, ""));
    return Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""]));
  });
}

function parseGscIndexSnapshot(markdown) {
  const text = String(markdown || "");
  const matchNumber = (label) => {
    const match = text.match(new RegExp(`${label}:\\s*([0-9,]+)`, "i"));
    return match ? parseNumber(match[1]) : null;
  };
  const submittedMatch = text.match(/Submitted main sitemap:\s*success,\s*([0-9,]+)\s+discovered pages/i);
  return {
    source: "gsc-indexing-visible-snapshot",
    reportLastUpdated: text.match(/Report last updated by Google:\s*([^\n]+)/i)?.[1]?.trim() || null,
    submittedMainSitemapPages: submittedMatch ? parseNumber(submittedMatch[1]) : null,
    indexed: matchNumber("Indexed"),
    excludedNoindex: matchNumber("Excluded by `noindex`"),
    alternateCanonical: matchNumber("Alternate page with proper canonical"),
    redirect: matchNumber("Page with redirect"),
    discoveredNotIndexed: matchNumber("Discovered, currently not indexed"),
    crawledNotIndexed: matchNumber("Crawled, currently not indexed"),
    boundary: "Aggregate Search Console UI snapshot only. It is not assigned to individual sitemap URLs.",
  };
}

function parseGscBaseline(markdown) {
  const pages = parseMarkdownTable(markdown, "## 主要页面")
    .map((row) => ({
      page: row["页面"],
      clicks: parseNumber(row["点击"]),
      impressions: parseNumber(row["曝光"]),
    }))
    .filter((row) => row.page);
  const queries = parseMarkdownTable(markdown, "## 主要查询")
    .map((row) => ({
      query: row["查询"],
      clicks: parseNumber(row["点击"]),
      impressions: parseNumber(row["曝光"]),
    }))
    .filter((row) => row.query);
  const countries = parseMarkdownTable(markdown, "## 主要国家/地区")
    .map((row) => ({
      country: row["国家/地区"],
      clicks: parseNumber(row["点击"]),
      impressions: parseNumber(row["曝光"]),
    }))
    .filter((row) => row.country);
  return { pages, queries, countries };
}

function normalizeObservedPage(page) {
  if (!page) return null;
  try {
    return routeMeta(new URL(page, origin).href).canonicalRoute;
  } catch {
    return page.startsWith("/") ? routeMeta(`${origin}${page}`).canonicalRoute : null;
  }
}

function groupObservedSignals(gscBaseline) {
  const byRoute = new Map();
  for (const page of gscBaseline.pages || []) {
    const route = normalizeObservedPage(page.page);
    if (!route) continue;
    byRoute.set(route, { page });
  }
  return byRoute;
}

function supportingRuleFor(canonicalRoute) {
  return SUPPORTING_RULES.find((rule) => rule.pattern.test(canonicalRoute)) || null;
}

export function classifyBacklogUrl(url, observedSignals = new Map()) {
  const meta = routeMeta(url);
  const owner = PRIORITY_OWNERS.get(meta.canonicalRoute);
  const observed = meta.isLocaleExpansion ? null : observedSignals.get(meta.canonicalRoute) || null;

  if (meta.isLocaleExpansion && !BRAZIL_ROUTES.has(meta.canonicalRoute)) {
    return {
      ...meta,
      bucket: "low-priority-locale-expansions",
      owner: owner?.owner || supportingRuleFor(meta.canonicalRoute)?.owner || "locale-expansion",
      observed,
      inference: "Locale expansion of an indexable route. Keep published, but do not treat as the first crawl-budget owner until the canonical owner route is moving.",
    };
  }

  if (owner) {
    return {
      ...meta,
      bucket: "priority-owners",
      owner: owner.owner,
      observed,
      inference: owner.reason,
    };
  }

  const supporting = supportingRuleFor(meta.canonicalRoute);
  if (supporting) {
    return {
      ...meta,
      bucket: "supporting-pages",
      owner: supporting.owner,
      observed,
      inference: supporting.reason,
    };
  }

  return {
    ...meta,
    bucket: "supporting-pages",
    owner: "site-support",
    observed,
    inference: "Indexable route in the current sitemap with no current owner signal; monitor after owner pages.",
  };
}

function publicationReviewRows(publicationReport) {
  const noindex = (publicationReport.excludedIndexedNoindex || []).map((row) => ({
    url: normalizeUrl(row.url) || row.url,
    path: normalizeUrl(row.url) ? normalizePathname(row.url) : row.url,
    canonicalRoute: normalizeUrl(row.url) ? routeMeta(row.url).canonicalRoute : row.url,
    locale: normalizeUrl(row.url) ? routeMeta(row.url).locale : null,
    bucket: "historical-or-noindex-review-candidates",
    owner: "robots-policy-review",
    observed: {
      source: "search-publication-report",
      disposition: row.disposition,
    },
    inference: "Previously indexed or visible URL is now excluded because current route policy is noindex. Review only if business value has changed.",
  }));
  const missing = (publicationReport.excludedIndexedMissing || []).map((row) => ({
    url: normalizeUrl(row.url) || row.url,
    path: normalizeUrl(row.url) ? normalizePathname(row.url) : row.url,
    canonicalRoute: normalizeUrl(row.url) ? routeMeta(row.url).canonicalRoute : row.url,
    locale: normalizeUrl(row.url) ? routeMeta(row.url).locale : null,
    bucket: "historical-or-noindex-review-candidates",
    owner: "route-inventory-review",
    observed: {
      source: "search-publication-report",
      disposition: row.disposition,
    },
    inference: "Historical GSC URL is not in the current route inventory. Do not reintroduce unless it has a stronger owner purpose.",
  }));
  return [...noindex, ...missing];
}

function createSummary(rows) {
  const buckets = {};
  const owners = {};
  const ownerRoutes = {};
  for (const row of rows) {
    buckets[row.bucket] = (buckets[row.bucket] || 0) + 1;
    owners[row.owner] = (owners[row.owner] || 0) + 1;
    if (row.bucket === "priority-owners") {
      ownerRoutes[row.canonicalRoute] = (ownerRoutes[row.canonicalRoute] || 0) + 1;
    }
  }
  return { buckets, owners, ownerRoutes };
}

export function buildIndexBacklogPriority({ sitemapUrls = [], publicationReport = {}, gscIndexSnapshot = {}, gscBaseline = {} } = {}) {
  const observedSignals = groupObservedSignals(gscBaseline);
  const sitemapRows = sitemapUrls.map((url) => ({
    url,
    ...classifyBacklogUrl(url, observedSignals),
    source: "sitemap",
  }));
  const reviewRows = publicationReviewRows(publicationReport);
  const rows = [...sitemapRows, ...reviewRows];
  const ownerRows = rows.filter((row) => row.bucket === "priority-owners");
  const ownerChecklist = [...new Set(ownerRows.map((row) => row.owner))].sort().map((owner) => ({
    owner,
    urlCount: ownerRows.filter((row) => row.owner === owner).length,
    action: owner === "brazil"
      ? "Keep the seven Brazil decision routes as one conversion chain; deepen internal links from /br to Pix, CPF/KYC, costs and account pages."
      : "Make the English owner route the crawl and answer target first; use locale variants as support after the owner route earns clicks.",
  }));

  return {
    version: "nexualpha-index-backlog-priority-v1",
    generatedAt: new Date().toISOString(),
    status: sitemapUrls.length ? "BACKLOG_READY" : "INPUT_MISSING",
    boundary: {
      observed: "Sitemap URLs, publication exclusions, aggregate GSC indexing counts, and visible GSC page/query tables are local evidence.",
      inferred: "Backlog bucket, owner and action priority are operational inferences. They are not URL-level Search Console indexing states.",
      urlLevelGsc: "No URL-level GSC indexing export is assigned here.",
    },
    inputs: {
      sitemapUrls: sitemapUrls.length,
      publicationExcludedNoindex: publicationReport.excludedIndexedNoindex?.length ?? null,
      publicationExcludedMissing: publicationReport.excludedIndexedMissing?.length ?? null,
      gscIndexSnapshot,
      gscVisiblePages: gscBaseline.pages || [],
      gscVisibleQueries: gscBaseline.queries || [],
      gscVisibleCountries: gscBaseline.countries || [],
    },
    summary: createSummary(rows),
    ownerChecklist,
    rows,
  };
}

function topRows(rows, bucket, limit = 20) {
  return rows.filter((row) => row.bucket === bucket).slice(0, limit);
}

function renderRowTable(rows) {
  const lines = ["| Bucket | Owner | URL | Observed | Inference |", "| --- | --- | --- | --- | --- |"];
  for (const row of rows) {
    const observed = row.observed?.page
      ? `GSC page impressions ${row.observed.page.impressions ?? "unknown"}`
      : row.observed?.disposition || "sitemap only";
    lines.push(`| ${row.bucket} | ${row.owner} | ${row.url} | ${observed} | ${row.inference} |`);
  }
  return lines;
}

export function renderMarkdown(report) {
  const lines = [
    "# NexuAlpha Index Backlog Priority",
    "",
    `Generated: ${report.generatedAt}`,
    `Status: ${report.status}`,
    "",
    "## Evidence Boundary",
    "",
    `- Observed: ${report.boundary.observed}`,
    `- Inferred: ${report.boundary.inferred}`,
    `- URL-level GSC: ${report.boundary.urlLevelGsc}`,
    "",
    "## Aggregate GSC Snapshot",
    "",
    `- Submitted sitemap pages: ${report.inputs.gscIndexSnapshot.submittedMainSitemapPages ?? "unknown"}`,
    `- Indexed: ${report.inputs.gscIndexSnapshot.indexed ?? "unknown"}`,
    `- Discovered, currently not indexed: ${report.inputs.gscIndexSnapshot.discoveredNotIndexed ?? "unknown"}`,
    `- Crawled, currently not indexed: ${report.inputs.gscIndexSnapshot.crawledNotIndexed ?? "unknown"}`,
    `- Boundary: ${report.inputs.gscIndexSnapshot.boundary || "aggregate only"}`,
    "",
    "## Bucket Counts",
    "",
    "| Bucket | URLs |",
    "| --- | ---: |",
  ];

  for (const [bucket, count] of Object.entries(report.summary.buckets)) {
    lines.push(`| ${bucket} | ${count} |`);
  }

  lines.push("", "## Priority Owner Checklist", "", "| Owner | URLs | Action |", "| --- | ---: | --- |");
  for (const item of report.ownerChecklist) {
    lines.push(`| ${item.owner} | ${item.urlCount} | ${item.action} |`);
  }

  lines.push("", "## Priority Owners", "", ...renderRowTable(topRows(report.rows, "priority-owners", 40)));
  lines.push("", "## Supporting Pages", "", ...renderRowTable(topRows(report.rows, "supporting-pages", 30)));
  lines.push("", "## Low-Priority Locale Expansions", "", ...renderRowTable(topRows(report.rows, "low-priority-locale-expansions", 30)));
  lines.push("", "## Historical Or Noindex Review Candidates", "", ...renderRowTable(topRows(report.rows, "historical-or-noindex-review-candidates", 40)));
  lines.push("");
  return `${lines.join("\n")}\n`;
}

export async function buildIndexBacklogPriorityReport(options = {}) {
  const sitemapPath = path.resolve(options.sitemap || DEFAULT_SITEMAP);
  const publicationReportPath = path.resolve(options.publicationReport || DEFAULT_PUBLICATION_REPORT);
  const gscIndexSnapshotPath = path.resolve(options.gscIndexSnapshot || DEFAULT_GSC_INDEX_SNAPSHOT);
  const gscBaselinePath = path.resolve(options.gscBaseline || DEFAULT_GSC_BASELINE);

  const sitemapUrls = await fileExists(sitemapPath)
    ? parseSitemapUrls(await readFile(sitemapPath, "utf8"))
    : [];
  const publicationReport = await fileExists(publicationReportPath)
    ? JSON.parse(await readFile(publicationReportPath, "utf8"))
    : {};
  const gscIndexSnapshot = await fileExists(gscIndexSnapshotPath)
    ? parseGscIndexSnapshot(await readFile(gscIndexSnapshotPath, "utf8"))
    : { boundary: "GSC aggregate snapshot missing." };
  const gscBaseline = await fileExists(gscBaselinePath)
    ? parseGscBaseline(await readFile(gscBaselinePath, "utf8"))
    : { pages: [], queries: [], countries: [] };

  const report = buildIndexBacklogPriority({ sitemapUrls, publicationReport, gscIndexSnapshot, gscBaseline });
  const output = path.resolve(options.output || DEFAULT_OUTPUT);
  const markdown = path.resolve(options.markdown || DEFAULT_MARKDOWN);
  await mkdir(path.dirname(output), { recursive: true });
  await mkdir(path.dirname(markdown), { recursive: true });
  await writeFile(output, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await writeFile(markdown, renderMarkdown(report), "utf8");
  return { report, output, markdown };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) {
      printHelp();
    } else {
      const { report, output, markdown } = await buildIndexBacklogPriorityReport(options);
      console.log(`Index backlog priority: ${report.status}`);
      console.log(`JSON: ${output}`);
      console.log(`Markdown: ${markdown}`);
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
