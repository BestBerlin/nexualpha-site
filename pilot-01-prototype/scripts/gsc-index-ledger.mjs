#!/usr/bin/env node

import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { COUNTRY_ROUTE_PREFIXES, parsePublicRoute } from "../src/data/locale-routing.js";
import { parseGscCsv } from "./gsc-opportunity-queue.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, "..");
const origin = "https://nexualpha.com";

// Use the materialized release sitemap by default. `public/sitemap.xml` is a
// source-tree artifact and can legitimately lag the built production set.
const DEFAULT_SITEMAP = path.join(projectRoot, "dist", "client", "sitemap.xml");
const DEFAULT_OUTPUT = path.join(projectRoot, "docs", "evidence", "four-week-growth-20260927", "gsc-index-ledger.json");
const DEFAULT_MARKDOWN = path.join(projectRoot, "docs", "evidence", "four-week-growth-20260927", "gsc-index-ledger.md");

export const INDEX_CLASSES = Object.freeze([
  "Indexed",
  "Crawled-not-indexed",
  "Discovered-not-indexed",
  "Duplicate-canonical",
  "Soft404",
  "Blocked",
  "Unknown",
]);

export const URL_CLASSES = Object.freeze([
  "home",
  "activity",
  "comparison",
  "venue-directory",
  "venue-profile",
  "factbook",
  "topic-hub",
  "news-article",
  "regional-decision",
  "embed",
  "utility",
  "other",
]);

export const GOVERNANCE_ACTIONS = Object.freeze([
  "retain",
  "merge",
  "noindex",
  "observe",
]);

const COUNTRY_BY_PREFIX = Object.freeze(
  Object.fromEntries(COUNTRY_ROUTE_PREFIXES.map((prefix) => [prefix, prefix.slice(1).toUpperCase()])),
);

function parseArgs(argv) {
  const options = {
    sitemap: DEFAULT_SITEMAP,
    gscExport: null,
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
    else if (arg === "--gsc-export" || arg === "--input") options.gscExport = next();
    else if (arg === "--output") options.output = next();
    else if (arg === "--markdown") options.markdown = next();
    else if (arg === "--help" || arg === "-h") options.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function printHelp() {
  console.log([
    "Usage: node scripts/gsc-index-ledger.mjs --sitemap <sitemap.xml> [--gsc-export <indexing.csv|json>] [options]",
    "",
    "Builds a fail-closed Search Console index classification ledger from sitemap URLs.",
    "If the GSC export is missing, every sitemap URL remains Unknown and search indexing is not treated as zero or complete.",
    "",
    "Options:",
    "  --sitemap <file>       Sitemap XML to read. Default: dist/client/sitemap.xml",
    "  --gsc-export <file>    Optional GSC page indexing export CSV or JSON.",
    "  --output <file>        JSON report path.",
    "  --markdown <file>      Markdown report path.",
  ].join("\n"));
}

async function fileExists(filePath) {
  if (!filePath) return false;
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

export function parseSitemapUrls(xml) {
  return [...String(xml || "").matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)]
    .map((match) => normalizeUrl(decodeXml(match[1])))
    .filter(Boolean);
}

function cleanHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[%()]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
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

function firstField(record, candidates) {
  for (const candidate of candidates) {
    if (Object.hasOwn(record, candidate)) return record[candidate];
  }
  return undefined;
}

function normalizeRecord(record) {
  return Object.fromEntries(
    Object.entries(record || {}).map(([key, value]) => [cleanHeader(key), value]),
  );
}

function indexingText(record) {
  const source = normalizeRecord(record);
  return [
    firstField(source, ["page_indexing_status", "indexing_status", "coverage_state", "status", "state", "validation_status"]),
    firstField(source, ["reason", "not_indexed_reason", "page_indexing_reason", "indexing_reason", "verdict", "coverage_issue", "issue"]),
    firstField(source, ["robots_txt_state", "robots", "canonical_status", "user_declared_canonical", "google_selected_canonical"]),
  ].filter((value) => value !== undefined && value !== null).join(" ");
}

export function classifyIndexingRow(record) {
  const text = indexingText(record).toLowerCase().replace(/\s+/g, " ").trim();
  if (!text) return "Unknown";
  if (/soft\s*404/.test(text)) return "Soft404";
  if (/\b(blocked|robots\.?txt|noindex|access denied|forbidden|403|unauthorized|crawl anomaly)\b/.test(text)) return "Blocked";
  if (/\b(duplicate|canonical|alternate page|proper canonical|user selected canonical|google chose different canonical)\b/.test(text)) return "Duplicate-canonical";
  if (/crawled[\s-]*(currently\s*)?not indexed|crawled[\s-]*not[\s-]*indexed/.test(text)) return "Crawled-not-indexed";
  if (/discovered[\s-]*(currently\s*)?not indexed|discovered[\s-]*not[\s-]*indexed/.test(text)) return "Discovered-not-indexed";
  if (/\b(indexed|submitted and indexed|page is indexed|url is on google)\b/.test(text) && !/\bnot indexed\b/.test(text)) return "Indexed";
  return "Unknown";
}

function rowUrl(record) {
  const source = normalizeRecord(record);
  const keys = Array.isArray(record?.keys) ? record.keys : [];
  const keyedUrl = keys.find((value) => typeof value === "string" && (/^https?:\/\//i.test(value) || value.startsWith("/")));
  return normalizeUrl(firstField(source, [
    "url",
    "page",
    "pages",
    "landing_page",
    "address",
    "inspection_url",
    "indexed_url",
  ]) ?? keyedUrl);
}

export function parseGscIndexExport(input, inputPath = "") {
  const text = String(input || "").trim();
  if (!text) return [];
  const lowerPath = String(inputPath || "").toLowerCase();
  const rows = lowerPath.endsWith(".csv") || (!text.startsWith("{") && !text.startsWith("["))
    ? parseGscCsv(text)
    : (() => {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) return parsed;
        if (Array.isArray(parsed.rows)) return parsed.rows;
        if (Array.isArray(parsed.data)) return parsed.data;
        if (Array.isArray(parsed.pages)) return parsed.pages;
        if (Array.isArray(parsed.urlInspectionResults)) return parsed.urlInspectionResults;
        return [];
      })();

  return rows.map((row, index) => ({
    sourceRow: index + 1,
    url: rowUrl(row),
    indexClass: classifyIndexingRow(row),
    rawStatus: indexingText(row) || null,
  })).filter((row) => row.url);
}

function routeCountry(url) {
  const parsed = new URL(url);
  const explicit = parsed.searchParams.get("country") || parsed.searchParams.get("market");
  if (explicit) return explicit.toUpperCase();
  const prefix = COUNTRY_ROUTE_PREFIXES.find((candidate) => parsed.pathname === candidate || parsed.pathname.startsWith(`${candidate}/`));
  return prefix ? COUNTRY_BY_PREFIX[prefix] : null;
}

function urlMeta(url) {
  const parsed = new URL(url);
  const publicRoute = parsePublicRoute(parsed.pathname, parsed.searchParams);
  const route = publicRoute.contentPathname;
  return {
    route,
    locale: publicRoute.locale,
    country: routeCountry(url),
    urlClass: classifyUrlRoute(route),
  };
}

export function classifyUrlRoute(route) {
  const normalized = String(route || "/");
  if (normalized === "/") return "home";
  if (normalized === "/activities") return "activity";
  if (normalized.startsWith("/compare/")) return "comparison";
  if (normalized === "/exchanges") return "venue-directory";
  if (normalized.startsWith("/exchanges/")) return "venue-profile";
  if (normalized.startsWith("/factbook/")) return "factbook";
  if (normalized.startsWith("/topics/")) return "topic-hub";
  if (normalized.startsWith("/news/")) return "news-article";
  if (/^\/(?:br|mx|eu|uk|jp|kr|hk|sg)(?:\/|$)/.test(normalized)) return "regional-decision";
  if (normalized.startsWith("/embed/")) return "embed";
  if (normalized === "/methodology" || normalized === "/partners" || normalized === "/rates" || normalized === "/telegram" || normalized === "/onchain") return "utility";
  return "other";
}

function createCountMap() {
  return Object.fromEntries(INDEX_CLASSES.map((name) => [name, 0]));
}

function bump(summary, key, indexClass) {
  const safeKey = key || "UNKNOWN";
  if (!summary[safeKey]) summary[safeKey] = createCountMap();
  summary[safeKey][indexClass] += 1;
}

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))];
}

function groupGscRowsByUrl(gscRows) {
  const byUrl = new Map();
  for (const row of gscRows) {
    if (!byUrl.has(row.url)) byUrl.set(row.url, []);
    byUrl.get(row.url).push(row);
  }
  return byUrl;
}

function resolveGscMatch(matches = []) {
  if (!matches.length) return null;
  const classes = uniqueValues(matches.map((row) => row.indexClass));
  const sourceRows = matches.map((row) => row.sourceRow).filter((row) => row !== null && row !== undefined);
  const rawStatuses = uniqueValues(matches.map((row) => row.rawStatus));

  if (classes.length > 1) {
    return {
      indexClass: "Unknown",
      source: "gsc-export-conflict",
      sourceRow: sourceRows[0] || null,
      sourceRows,
      rawStatus: `Conflicting GSC rows: ${classes.join(" | ")}`,
      rawStatuses,
    };
  }

  return {
    ...matches[0],
    source: "gsc-export",
    sourceRows,
    rawStatuses,
  };
}

export function classifyGovernance(row) {
  if (!row || row.indexClass === "Unknown") {
    return {
      governanceAction: "observe",
      governanceReason: "No supplied GSC evidence proves indexation, duplication, soft-404, or blocking. Keep the URL in the observation queue instead of deleting or noindexing it.",
    };
  }

  if (row.indexClass === "Indexed") {
    return {
      governanceAction: "retain",
      governanceReason: "GSC evidence says the URL is indexed; keep it unless a later page-intent review finds cannibalization or thin content.",
    };
  }

  if (row.indexClass === "Duplicate-canonical") {
    return {
      governanceAction: "merge",
      governanceReason: "GSC canonical evidence indicates consolidation work, not standalone expansion. Review canonicals and internal links before merging or redirecting.",
    };
  }

  if (row.indexClass === "Soft404" || row.indexClass === "Blocked") {
    return {
      governanceAction: "noindex",
      governanceReason: "GSC evidence indicates a non-indexable or blocked URL; keep it out of the sitemap and verify robots/canonical behavior before any removal.",
    };
  }

  if ((row.indexClass === "Crawled-not-indexed" || row.indexClass === "Discovered-not-indexed")
    && (row.urlClass === "news-article" || row.urlClass === "factbook")
    && row.locale !== "en") {
    return {
      governanceAction: "observe",
      governanceReason: "Low-differentiation locale news/factbook URL is not indexed. Hold it for page-value review rather than expanding more translated variants.",
    };
  }

  if (row.indexClass === "Crawled-not-indexed" || row.indexClass === "Discovered-not-indexed") {
    return {
      governanceAction: "observe",
      governanceReason: "GSC has not indexed the URL, but this class alone does not prove a delete/noindex decision. Review intent, internal links, and content depth.",
    };
  }

  return {
    governanceAction: "observe",
    governanceReason: "No stronger governance rule matched; keep the URL queued for human review.",
  };
}

export function buildIndexLedger({ sitemapUrls = [], gscRows = [], sitemapPath = null, gscExportPath = null } = {}) {
  const sitemapUrlCounts = new Map();
  for (const url of sitemapUrls) sitemapUrlCounts.set(url, (sitemapUrlCounts.get(url) || 0) + 1);
  const uniqueSitemapUrls = [...sitemapUrlCounts.keys()];
  const duplicateSitemapUrls = [...sitemapUrlCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([url, count]) => ({ url, count }));
  const byUrl = groupGscRowsByUrl(gscRows);
  const duplicateGscUrls = [...byUrl.entries()]
    .filter(([, rowsForUrl]) => rowsForUrl.length > 1)
    .map(([url, rowsForUrl]) => ({
      url,
      count: rowsForUrl.length,
      classes: uniqueValues(rowsForUrl.map((row) => row.indexClass)),
      sourceRows: rowsForUrl.map((row) => row.sourceRow),
    }));

  const sitemapRows = uniqueSitemapUrls.map((url) => {
    const matched = resolveGscMatch(byUrl.get(url));
    const meta = urlMeta(url);
    return {
      url,
      ...meta,
      indexClass: matched?.indexClass || "Unknown",
      source: matched?.source || "sitemap-only",
      sourceRow: matched?.sourceRow || null,
      sourceRows: matched?.sourceRows || [],
      rawStatus: matched?.rawStatus || null,
      rawStatuses: matched?.rawStatuses || [],
    };
  });
  const sitemapUrlSet = new Set(uniqueSitemapUrls);
  const gscOnlyRows = [...byUrl.entries()]
    .filter(([url]) => !sitemapUrlSet.has(url))
    .map(([url, matches]) => {
      const matched = resolveGscMatch(matches);
      const meta = urlMeta(url);
      return {
        url,
        ...meta,
        indexClass: matched?.indexClass || "Unknown",
        source: matched?.source === "gsc-export-conflict" ? "gsc-export-conflict" : "gsc-export-only",
        sourceRow: matched?.sourceRow || null,
        sourceRows: matched?.sourceRows || [],
        rawStatus: matched?.rawStatus || null,
        rawStatuses: matched?.rawStatuses || [],
      };
    });
  const rows = [...sitemapRows, ...gscOnlyRows]
    .map((row) => ({
      ...row,
      ...classifyGovernance(row),
    }));

  const summary = {
    byIndexClass: createCountMap(),
    byGovernanceAction: Object.fromEntries(GOVERNANCE_ACTIONS.map((name) => [name, 0])),
    byRoute: {},
    byLocale: {},
    byCountry: {},
    byUrlClass: {},
  };

  for (const row of rows) {
    summary.byIndexClass[row.indexClass] += 1;
    summary.byGovernanceAction[row.governanceAction] += 1;
    bump(summary.byRoute, row.route, row.indexClass);
    bump(summary.byLocale, row.locale, row.indexClass);
    bump(summary.byCountry, row.country, row.indexClass);
    bump(summary.byUrlClass, row.urlClass, row.indexClass);
  }

  const missingGsc = !gscExportPath;
  return {
    version: "nexualpha-gsc-index-ledger-v1",
    generatedAt: new Date().toISOString(),
    status: missingGsc ? "INPUT_MISSING" : "LEDGER_READY",
    inputBoundary: missingGsc
      ? "No GSC page indexing export was supplied. Sitemap URLs are listed as Unknown, not treated as indexed or not indexed."
      : "Only supplied GSC page indexing rows are used for classification. Sitemap URLs absent from the export remain Unknown.",
    inputs: {
      sitemap: sitemapPath,
      gscExport: gscExportPath || null,
    },
    totals: {
      sitemapUrls: uniqueSitemapUrls.length,
      sitemapInputUrls: sitemapUrls.length,
      duplicateSitemapUrls: duplicateSitemapUrls.length,
      gscRows: missingGsc ? null : gscRows.length,
      matchedGscRows: rows.filter((row) => row.source === "gsc-export").length,
      gscOnlyRows: missingGsc ? null : rows.filter((row) => row.source === "gsc-export-only").length,
      duplicateGscUrls: missingGsc ? null : duplicateGscUrls.length,
      conflictingGscUrls: missingGsc ? null : rows.filter((row) => row.source === "gsc-export-conflict").length,
      unknownRows: rows.filter((row) => row.indexClass === "Unknown").length,
    },
    summary,
    duplicateSitemapUrls,
    duplicateGscUrls: missingGsc ? [] : duplicateGscUrls,
    rows,
  };
}

export function buildMissingSitemapReport(sitemapPath = null, gscExportPath = null) {
  return {
    version: "nexualpha-gsc-index-ledger-v1",
    generatedAt: new Date().toISOString(),
    status: "INPUT_MISSING",
    inputBoundary: "No readable sitemap was supplied. URL-level index coverage is unknown, not zero.",
    inputs: {
      sitemap: sitemapPath,
      gscExport: gscExportPath || null,
    },
    totals: {
      sitemapUrls: null,
      gscRows: null,
      matchedGscRows: null,
      unknownRows: null,
    },
    summary: {
      byIndexClass: createCountMap(),
      byGovernanceAction: Object.fromEntries(GOVERNANCE_ACTIONS.map((name) => [name, 0])),
      byRoute: {},
      byLocale: {},
      byCountry: {},
      byUrlClass: {},
    },
    duplicateSitemapUrls: [],
    duplicateGscUrls: [],
    rows: [],
  };
}

function renderSummaryTable(title, summary) {
  const lines = [`## ${title}`, "", "| Key | Indexed | Crawled-not-indexed | Discovered-not-indexed | Duplicate-canonical | Soft404 | Blocked | Unknown |", "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |"];
  for (const [key, counts] of Object.entries(summary)) {
    lines.push(`| ${key} | ${counts.Indexed} | ${counts["Crawled-not-indexed"]} | ${counts["Discovered-not-indexed"]} | ${counts["Duplicate-canonical"]} | ${counts.Soft404} | ${counts.Blocked} | ${counts.Unknown} |`);
  }
  lines.push("");
  return lines;
}

function renderGovernanceTable(summary) {
  const counts = summary || {};
  return [
    "## By Governance Action",
    "",
    "| Retain | Merge | Noindex | Observe |",
    "| ---: | ---: | ---: | ---: |",
    `| ${counts.retain || 0} | ${counts.merge || 0} | ${counts.noindex || 0} | ${counts.observe || 0} |`,
    "",
  ];
}

export function renderMarkdown(report) {
  const lines = [
    "# NexuAlpha GSC Index Classification Ledger",
    "",
    `Generated: ${report.generatedAt}`,
    `Status: ${report.status}`,
    "",
    `Boundary: ${report.inputBoundary}`,
    "",
    "## Totals",
    "",
    `- Sitemap URLs: ${report.totals.sitemapUrls ?? "unknown"}`,
    `- Sitemap input URLs: ${report.totals.sitemapInputUrls ?? "unknown"}`,
    `- Duplicate sitemap URLs: ${report.totals.duplicateSitemapUrls ?? "unknown"}`,
    `- GSC rows: ${report.totals.gscRows ?? "unknown"}`,
    `- Matched GSC rows: ${report.totals.matchedGscRows ?? "unknown"}`,
    `- GSC-only rows: ${report.totals.gscOnlyRows ?? "unknown"}`,
    `- Duplicate GSC URLs: ${report.totals.duplicateGscUrls ?? "unknown"}`,
    `- Conflicting GSC URLs: ${report.totals.conflictingGscUrls ?? "unknown"}`,
    `- Unknown rows: ${report.totals.unknownRows ?? "unknown"}`,
    "",
  ];

  lines.push(...renderSummaryTable("By Index Class", { total: report.summary.byIndexClass }));
  lines.push(...renderGovernanceTable(report.summary.byGovernanceAction));
  lines.push(...renderSummaryTable("By URL Class", report.summary.byUrlClass || {}));
  lines.push(...renderSummaryTable("By Locale", report.summary.byLocale));
  lines.push(...renderSummaryTable("By Country", report.summary.byCountry));

  if (report.duplicateGscUrls?.length) {
    lines.push("## Duplicate GSC URL Rows", "", "Duplicate URL rows are retained as input diagnostics. Conflicting classes are kept Unknown at the URL level.", "", "| URL | Rows | Classes | Source rows |", "| --- | ---: | --- | --- |");
    for (const row of report.duplicateGscUrls) {
      lines.push(`| ${row.url} | ${row.count} | ${row.classes.join(", ")} | ${row.sourceRows.join(", ")} |`);
    }
    lines.push("");
  }

  lines.push("## URL Ledger", "", "| URL | Route | URL class | Locale | Country | Class | Governance | Source |", "| --- | --- | --- | --- | --- | --- | --- | --- |");
  for (const row of report.rows) {
    lines.push(`| ${row.url} | ${row.route} | ${row.urlClass} | ${row.locale} | ${row.country || ""} | ${row.indexClass} | ${row.governanceAction} | ${row.source} |`);
  }
  lines.push("");
  return `${lines.join("\n")}\n`;
}

export async function buildGscIndexLedger(options = {}) {
  const sitemapPath = path.resolve(options.sitemap || DEFAULT_SITEMAP);
  const gscExportPath = options.gscExport ? path.resolve(options.gscExport) : null;
  let report;

  if (!(await fileExists(sitemapPath))) {
    report = buildMissingSitemapReport(sitemapPath, gscExportPath);
  } else {
    const sitemapUrls = parseSitemapUrls(await readFile(sitemapPath, "utf8"));
    const gscRows = gscExportPath && await fileExists(gscExportPath)
      ? parseGscIndexExport(await readFile(gscExportPath, "utf8"), gscExportPath)
      : [];
    report = buildIndexLedger({
      sitemapUrls,
      gscRows,
      sitemapPath,
      gscExportPath: gscExportPath && await fileExists(gscExportPath) ? gscExportPath : null,
    });
  }

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
      const { report, output, markdown } = await buildGscIndexLedger(options);
      console.log(`GSC index ledger: ${report.status}`);
      console.log(`JSON: ${output}`);
      console.log(`Markdown: ${markdown}`);
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
