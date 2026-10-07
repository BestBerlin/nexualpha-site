#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { buildGscIndexLedger, parseGscIndexExport } from "./gsc-index-ledger.mjs";
import { buildGscOpportunityQueue, parseGscCsv, parseGscInput } from "./gsc-opportunity-queue.mjs";
import { writeWeeklyGrowthOpsReport } from "./weekly-growth-ops.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, "..");
const DEFAULT_OUTPUT_DIR = path.join(projectRoot, "docs", "evidence", "four-week-growth-20260927", "gsc-weekly-intake");

const INDEX_FIELD_CANDIDATES = new Set([
  "page_indexing_status",
  "indexing_status",
  "coverage_state",
  "status",
  "state",
  "validation_status",
  "reason",
  "not_indexed_reason",
  "page_indexing_reason",
  "indexing_reason",
  "verdict",
  "coverage_issue",
  "issue",
  "robots_txt_state",
  "robots",
  "canonical_status",
  "user_declared_canonical",
  "google_selected_canonical",
]);

const URL_FIELD_CANDIDATES = new Set(["url", "page", "pages", "landing_page", "address", "inspection_url", "indexed_url"]);

function parseArgs(argv) {
  const options = {
    root: projectRoot,
    sitemap: null,
    indexExport: null,
    performanceCurrent7: null,
    performancePrevious7: null,
    performanceCurrent28: null,
    performancePrevious28: null,
    siteSearchInput: null,
    outputDir: DEFAULT_OUTPUT_DIR,
    generatedAt: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => {
      index += 1;
      if (index >= argv.length) throw new Error(`${arg} requires a value`);
      return argv[index];
    };

    if (arg === "--root") options.root = path.resolve(next());
    else if (arg === "--sitemap") options.sitemap = next();
    else if (arg === "--index-export") options.indexExport = next();
    else if (arg === "--performance-current-7" || arg === "--gsc-current-7") options.performanceCurrent7 = next();
    else if (arg === "--performance-previous-7" || arg === "--gsc-previous-7") options.performancePrevious7 = next();
    else if (arg === "--performance-current-28" || arg === "--gsc-current-28") options.performanceCurrent28 = next();
    else if (arg === "--performance-previous-28" || arg === "--gsc-previous-28") options.performancePrevious28 = next();
    else if (arg === "--site-search-input" || arg === "--internal-search-input") options.siteSearchInput = next();
    else if (arg === "--output-dir") options.outputDir = next();
    else if (arg === "--generated-at") options.generatedAt = next();
    else if (arg === "--help" || arg === "-h") options.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function printHelp() {
  console.log([
    "Usage: node scripts/gsc-weekly-intake.mjs [options]",
    "",
    "Validates official Google Search Console exports and builds a weekly SEO/GEO/AEO evidence pack.",
    "Indexing exports feed only the URL-level index ledger. Performance exports feed only opportunity and trend reports.",
    "Aggregate visible snapshots are rejected for this intake so they cannot be presented as URL-level evidence.",
    "",
    "Options:",
    "  --index-export <file>           Official GSC page indexing CSV/JSON export.",
    "  --performance-current-7 <file>  Official GSC performance CSV/JSON export for the current 7-day window.",
    "  --performance-previous-7 <file> Official GSC performance CSV/JSON export for the previous 7-day window.",
    "  --performance-current-28 <file> Official GSC performance CSV/JSON export for the current 28-day window.",
    "  --performance-previous-28 <file> Official GSC performance CSV/JSON export for the previous 28-day window.",
    "  --site-search-input <file>       Optional onsite-search CSV/JSON export for strong-search weak-GSC flags.",
    "  --sitemap <file>                Sitemap XML used by the index ledger. Default: dist/client/sitemap.xml.",
    "  --output-dir <dir>              Evidence output directory.",
    "  --root <dir>                    Prototype root. Default: current prototype root.",
    "  --generated-at <iso>            Optional deterministic timestamp for tests.",
  ].join("\n"));
}

function cleanHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[%()]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function parseJsonRows(parsed) {
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed?.rows)) return parsed.rows;
  if (Array.isArray(parsed?.data)) return parsed.data;
  if (Array.isArray(parsed?.pages)) return parsed.pages;
  if (Array.isArray(parsed?.urlInspectionResults)) return parsed.urlInspectionResults;
  return [];
}

function parseRawRows(input, inputPath = "") {
  const text = String(input || "").trim();
  if (!text) return { rows: [], format: "empty", parsed: null };
  const lowerPath = String(inputPath || "").toLowerCase();
  if (lowerPath.endsWith(".csv") || (!text.startsWith("{") && !text.startsWith("["))) {
    return { rows: parseGscCsv(text), format: "csv", parsed: null };
  }
  const parsed = JSON.parse(text);
  return { rows: parseJsonRows(parsed), format: "json", parsed };
}

function isVisibleAggregateSnapshot(parsed) {
  if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") return false;
  const hasOfficialRows = Array.isArray(parsed.rows) || Array.isArray(parsed.data) || Array.isArray(parsed.pages) || Array.isArray(parsed.urlInspectionResults);
  const hasVisibleAggregates = Array.isArray(parsed.topQueries) || Array.isArray(parsed.topPages) || parsed.totals;
  return Boolean(hasVisibleAggregates && !hasOfficialRows);
}

function normalizedKeys(row) {
  return new Set(Object.keys(row || {}).map(cleanHeader));
}

function rowHasUrl(row) {
  const keys = normalizedKeys(row);
  if ([...URL_FIELD_CANDIDATES].some((field) => keys.has(field))) return true;
  return Array.isArray(row?.keys) && row.keys.some((value) => typeof value === "string" && (/^https?:\/\//i.test(value) || value.startsWith("/")));
}

function rowHasAnyField(row, candidates) {
  const keys = normalizedKeys(row);
  return [...candidates].some((field) => keys.has(field));
}

async function readExport(filePath) {
  const resolved = path.resolve(filePath);
  return { resolved, text: await readFile(resolved, "utf8") };
}

export async function validateIndexExport(filePath) {
  const { resolved, text } = await readExport(filePath);
  const raw = parseRawRows(text, resolved);
  if (isVisibleAggregateSnapshot(raw.parsed)) {
    throw new Error(`Index export rejected: ${resolved} looks like an aggregate visible snapshot, not a URL-level page indexing export.`);
  }

  const rawRows = raw.rows.length;
  const urlRows = raw.rows.filter(rowHasUrl).length;
  const statusRows = raw.rows.filter((row) => rowHasAnyField(row, INDEX_FIELD_CANDIDATES)).length;
  if (!rawRows || !urlRows || !statusRows) {
    throw new Error(`Index export rejected: ${resolved} must contain URL rows plus page indexing status/reason fields from GSC.`);
  }

  const parsedRows = parseGscIndexExport(text, resolved);
  if (!parsedRows.length) {
    throw new Error(`Index export rejected: ${resolved} did not produce any URL-level rows after normalization.`);
  }

  const unknownStatusRows = parsedRows.filter((row) => row.indexClass === "Unknown").length;
  return {
    kind: "gsc_page_indexing_export",
    inputFile: resolved,
    format: raw.format,
    rawRows,
    parsedRows: parsedRows.length,
    unknownStatusRows,
    status: unknownStatusRows === parsedRows.length ? "READY_WITH_UNKNOWN_STATUS" : "READY",
    boundary: "Validated as URL-level GSC page indexing evidence. Unknown classes remain Unknown and are not treated as indexed or not indexed.",
  };
}

export async function validatePerformanceExport(filePath, label = "performance") {
  const { resolved, text } = await readExport(filePath);
  const raw = parseRawRows(text, resolved);
  if (isVisibleAggregateSnapshot(raw.parsed)) {
    throw new Error(`Performance export rejected: ${resolved} looks like an aggregate visible snapshot. Use the official GSC CSV/JSON row export for this intake.`);
  }

  const rows = parseGscInput(text, resolved);
  const usableRows = rows.filter((row) => row.page || row.query);
  const metricRows = rows.filter((row) => row.clicks !== null || row.impressions !== null || row.ctr !== null || row.position !== null);
  if (!rows.length || !usableRows.length || !metricRows.length) {
    throw new Error(`Performance export rejected: ${resolved} must contain official GSC performance rows with page and/or query plus clicks/impressions/CTR/position fields.`);
  }

  const queryPageRows = rows.filter((row) => row.page && row.query).length;
  const pageOnlyRows = rows.filter((row) => row.page && !row.query).length;
  const queryOnlyRows = rows.filter((row) => row.query && !row.page).length;
  return {
    kind: "gsc_performance_export",
    label,
    inputFile: resolved,
    format: raw.format,
    rawRows: raw.rows.length,
    parsedRows: rows.length,
    queryPageRows,
    pageOnlyRows,
    queryOnlyRows,
    status: queryPageRows ? "READY_QUERY_PAGE" : pageOnlyRows || queryOnlyRows ? "READY_SEPARATE_DIMENSIONS" : "READY",
    boundary: "Validated as GSC performance evidence. Separate page-only and query-only rows are never paired as query-page proof.",
  };
}

function intakeMarkdown(manifest) {
  const lines = [
    "# NexuAlpha GSC Weekly Intake",
    "",
    `Generated: ${manifest.generatedAt}`,
    `Status: ${manifest.status}`,
    "",
    `Boundary: ${manifest.boundary}`,
    "",
    "## Validated Inputs",
    "",
    "| Label | Kind | Status | Rows | Boundary |",
    "| --- | --- | --- | ---: | --- |",
  ];

  for (const item of manifest.validations) {
    lines.push(`| ${item.label || item.kind} | ${item.kind} | ${item.status} | ${item.parsedRows ?? "unknown"} | ${item.boundary} |`);
  }
  if (!manifest.validations.length) lines.push("| none | none | INPUT_MISSING | unknown | No official GSC export was supplied. |");

  lines.push("", "## Outputs", "", "| Artifact | Path |", "| --- | --- |");
  for (const [name, outputPath] of Object.entries(manifest.outputs)) {
    if (outputPath) lines.push(`| ${name} | ${outputPath} |`);
  }
  lines.push("");
  return `${lines.join("\n")}\n`;
}

export async function runGscWeeklyIntake(options = {}) {
  const root = path.resolve(options.root || projectRoot);
  const outputDir = path.resolve(options.outputDir || DEFAULT_OUTPUT_DIR);
  const generatedAt = options.generatedAt || new Date().toISOString();
  await mkdir(outputDir, { recursive: true });

  const validations = [];
  if (options.indexExport) validations.push(await validateIndexExport(options.indexExport));

  const performanceInputs = [
    ["current_7_day", options.performanceCurrent7],
    ["previous_7_day", options.performancePrevious7],
    ["current_28_day", options.performanceCurrent28],
    ["previous_28_day", options.performancePrevious28],
  ].filter(([, file]) => file);
  for (const [label, file] of performanceInputs) {
    validations.push(await validatePerformanceExport(file, label));
  }

  const ledgerJson = path.join(outputDir, "gsc-index-ledger.json");
  const ledgerMarkdown = path.join(outputDir, "gsc-index-ledger.md");
  const ledger = await buildGscIndexLedger({
    sitemap: options.sitemap ? path.resolve(options.sitemap) : path.join(root, "dist", "client", "sitemap.xml"),
    gscExport: options.indexExport || null,
    output: ledgerJson,
    markdown: ledgerMarkdown,
  });

  const queueSource = options.performanceCurrent28 || options.performanceCurrent7 || null;
  let queue = null;
  const queueJson = path.join(outputDir, "gsc-opportunity-queue.json");
  const queueMarkdown = path.join(outputDir, "gsc-opportunity-queue.md");
  if (queueSource) {
    queue = await buildGscOpportunityQueue({
      input: queueSource,
      siteSearchInput: options.siteSearchInput || null,
      output: queueJson,
      markdown: queueMarkdown,
    });
  }

  const weeklyJson = path.join(outputDir, "weekly-growth-ops.json");
  const weeklyMarkdown = path.join(outputDir, "weekly-growth-ops.md");
  const weekly = await writeWeeklyGrowthOpsReport({
    root,
    gscQueue: queue?.output || null,
    gscCurrent7: options.performanceCurrent7 || null,
    gscPrevious7: options.performancePrevious7 || null,
    gscCurrent28: options.performanceCurrent28 || null,
    gscPrevious28: options.performancePrevious28 || null,
    gscIndexLedger: ledger.output,
    output: weeklyJson,
    markdown: weeklyMarkdown,
    generatedAt,
  });

  const manifest = {
    version: "nexualpha-gsc-weekly-intake-v1",
    generatedAt,
    status: "READY",
    boundary: "Only validated official GSC exports are imported. URL-level index claims come from page indexing exports only; performance rows guide trends/opportunities without proving indexation, registrations, commissions, or conversion lift.",
    root,
    validations,
    outputs: {
      manifestJson: path.join(outputDir, "gsc-weekly-intake.json"),
      manifestMarkdown: path.join(outputDir, "gsc-weekly-intake.md"),
      indexLedgerJson: ledger.output,
      indexLedgerMarkdown: ledger.markdown,
      opportunityQueueJson: queue?.output || null,
      opportunityQueueMarkdown: queue?.markdown || null,
      weeklyGrowthOpsJson: weekly.output,
      weeklyGrowthOpsMarkdown: weekly.markdown,
    },
  };

  await writeFile(manifest.outputs.manifestJson, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  await writeFile(manifest.outputs.manifestMarkdown, intakeMarkdown(manifest), "utf8");
  return { manifest, ledger, queue, weekly };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) {
      printHelp();
    } else {
      const { manifest } = await runGscWeeklyIntake(options);
      console.log(`GSC weekly intake: ${manifest.status}`);
      console.log(`JSON: ${manifest.outputs.manifestJson}`);
      console.log(`Markdown: ${manifest.outputs.manifestMarkdown}`);
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
