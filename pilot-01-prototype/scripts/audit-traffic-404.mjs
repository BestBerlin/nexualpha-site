#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, "..");
const defaultTraffic = path.join(projectRoot, "..", "artifacts", "seo", "traffic-crawler-baseline.json");
const defaultWholeSite = path.join(projectRoot, "..", "artifacts", "whole-site", "wave30-unified-final-local", "results.json");
const defaultOutput = path.join(projectRoot, "..", "artifacts", "seo", "wave31-traffic-404-audit.json");
const defaultMarkdown = path.join(projectRoot, "docs", "evidence", "wave31-traffic-404-audit-20260915.md");

const PROBE_RE = /(?:^|\/)(?:\.aws(?:\/|$)|\.env(?:\.|$)|\.git(?:\/|$)|_profiler(?:\/|$)|_vti_pvt(?:\/|$)|_environment$|phpinfo(?:\.php)?$|wp-admin(?:\/|$)|wp-includes(?:\/|$)|wp-login\.php$|wp-json(?:\/|$)|wp-sitemap\.xml$|wlwmanifest\.xml$|xmlrpc\.php$)|\.php$/i;
const HASHED_ASSET_RE = /^\/assets\/.+[-_][A-Za-z0-9_-]{6,}\.(?:js|css|map|png|jpe?g|webp|svg|ico|woff2?)$/i;
const STATIC_ASSET_RE = /\.(?:js|css|map|png|jpe?g|webp|svg|ico|json|xml|txt|woff2?)$/i;
const KNOWN_SITEMAP_ALIASES = new Set(["/sitemap_index.xml", "/sitemap-index.xml", "/news-sitemap.xml"]);
const KNOWN_API_PROBES = new Set(["/api/v1/agent/mcp", "/api/v1/agent/por-status"]);
const KNOWN_LEGACY_COMPARE_REDIRECTS = new Set([
  "/compare/aevo-vs-binance",
  "/compare/hashkey-vs-binance",
  "/compare/htx-vs-binance",
]);
const MALFORMED_PLACEHOLDER_ROUTES = new Set(["/exchanges/null"]);

function parseArgs(argv) {
  const options = { traffic: defaultTraffic, wholeSite: defaultWholeSite, output: defaultOutput, markdown: defaultMarkdown };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => {
      index += 1;
      if (index >= argv.length) throw new Error(`${arg} requires a value`);
      return argv[index];
    };
    if (arg === "--traffic") options.traffic = path.resolve(next());
    else if (arg === "--whole-site") options.wholeSite = path.resolve(next());
    else if (arg === "--output") options.output = path.resolve(next());
    else if (arg === "--markdown") options.markdown = path.resolve(next());
    else if (arg === "--help" || arg === "-h") options.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

function classifyPath(pathname) {
  if (PROBE_RE.test(pathname)) return { category: "hostile_or_platform_probe", action: "ignore_or_block_at_edge_only_if_volume_grows" };
  if (KNOWN_LEGACY_COMPARE_REDIRECTS.has(pathname)) return { category: "legacy_redirect_probe", action: "verify_worker_redirect_before_route_fix" };
  if (MALFORMED_PLACEHOLDER_ROUTES.has(pathname)) return { category: "malformed_placeholder_route", action: "verify_no_current_internal_link_before_route_fix" };
  if (KNOWN_API_PROBES.has(pathname)) return { category: "unsupported_api_probe", action: "no_public_route_fix_without_product_requirement" };
  if (KNOWN_SITEMAP_ALIASES.has(pathname)) return { category: "external_or_legacy_sitemap_probe", action: "monitor_only_unless_source_links_it" };
  if (pathname === "/favicon.ico") return { category: "browser_default_static_asset", action: "verify_current_build_contains_asset" };
  if (HASHED_ASSET_RE.test(pathname)) return { category: "stale_hashed_asset_request", action: "monitor_cache_churn_not_internal_link" };
  if (STATIC_ASSET_RE.test(pathname)) return { category: "static_asset_404", action: "check_current_build_reference_before_fixing" };
  return { category: "content_like_404", action: "investigate_referrer_and_internal_links" };
}

function normalizeStatusCount(statuses, status) {
  return Number(statuses?.[String(status)] ?? statuses?.[status] ?? 0);
}

function readRows(report) {
  const rows = Array.isArray(report?.top404Paths) ? report.top404Paths : [];
  return rows.map((row) => ({ path: row.path, requests: Number(row.requests || 0) })).filter((row) => row.path && row.requests > 0);
}

function summarizeWholeSite(wholeSite) {
  const summary = wholeSite?.summary || {};
  return {
    checkedAt: summary.checkedAt || null,
    buildId: summary.buildId || null,
    pages: Number(summary.pages || 0),
    indexableCanonicalPaths: Number(summary.indexableCanonicalPaths || 0),
    internalLinks: Number(summary.internalLinks || 0),
    issues: Number(summary.issues || 0),
    pass: Boolean(summary.pass),
    scope: summary.scope || null,
  };
}

export function auditTraffic404({ trafficReport, wholeSiteReport = null, generatedAt = new Date().toISOString() }) {
  const rows = readRows(trafficReport);
  const classifiedRows = rows.map((row) => ({ ...row, ...classifyPath(row.path) }));
  const categories = {};
  for (const row of classifiedRows) {
    categories[row.category] ||= { paths: 0, requests: 0 };
    categories[row.category].paths += 1;
    categories[row.category].requests += row.requests;
  }
  const wholeSite = summarizeWholeSite(wholeSiteReport);
  const internalLinkEvidence = wholeSite.pass && wholeSite.issues === 0 && wholeSite.internalLinks > 0
    ? "NO_FIRST_PARTY_INTERNAL_BROKEN_LINK_EVIDENCE"
    : "INTERNAL_LINK_EVIDENCE_UNAVAILABLE_OR_FAILING";
  const contentLikeRows = classifiedRows.filter((row) => row.category === "content_like_404");
  const recommendedFix = internalLinkEvidence === "NO_FIRST_PARTY_INTERNAL_BROKEN_LINK_EVIDENCE" && contentLikeRows.length === 0
    ? "NO_CODE_FIX_FROM_CURRENT_EVIDENCE"
    : "INVESTIGATE_CONTENT_LIKE_404S_BEFORE_FIX";
  return {
    generatedAt,
    inputBoundary: "Aggregated anonymous server-request evidence only. Counts are not unique users and do not prove indexing, ranking, AI citations, registrations, commissions or conversion lift.",
    total404Requests: normalizeStatusCount(trafficReport?.statuses, 404),
    classifiedTop404Requests: classifiedRows.reduce((sum, row) => sum + row.requests, 0),
    categories,
    top404Classified: classifiedRows,
    contentLike404Paths: contentLikeRows,
    wholeSiteEvidence: wholeSite,
    internalLinkEvidence,
    recommendedFix,
    operatorConclusion: recommendedFix === "NO_CODE_FIX_FROM_CURRENT_EVIDENCE"
      ? "The observed top 404 queue is dominated by hostile/platform probes, stale hashed assets, browser default asset requests and legacy sitemap/API probes. The current whole-site verifier reports zero issues across internal links, so this audit does not justify a first-party route/link change."
      : "Content-like 404s or missing whole-site evidence require referrer/internal-link investigation before changing routes or links.",
  };
}

export function render404AuditMarkdown(audit) {
  const lines = [
    "# Wave31 technical SEO 404 audit",
    "",
    `Generated: ${audit.generatedAt}`,
    "",
    `Boundary: ${audit.inputBoundary}`,
    "",
    "## Result",
    "",
    `- Total HTTP 404 requests in supplied traffic baseline: ${audit.total404Requests}`,
    `- Top-404 requests classified by this audit: ${audit.classifiedTop404Requests}`,
    `- Internal-link evidence: ${audit.internalLinkEvidence}`,
    `- Recommended fix: ${audit.recommendedFix}`,
    `- Operator conclusion: ${audit.operatorConclusion}`,
    "",
    "## Category summary",
    "",
    "| Category | Paths | Requests |",
    "| --- | ---: | ---: |",
    ...Object.entries(audit.categories).map(([category, data]) => `| ${category} | ${data.paths} | ${data.requests} |`),
    "",
    "## Top 404 classification",
    "",
    "| Path | Requests | Category | Action |",
    "| --- | ---: | --- | --- |",
    ...audit.top404Classified.map((row) => `| ${row.path} | ${row.requests} | ${row.category} | ${row.action} |`),
    "",
    "## Whole-site internal-link evidence",
    "",
    `- Build: ${audit.wholeSiteEvidence.buildId || "unknown"}`,
    `- Pages checked: ${audit.wholeSiteEvidence.pages}`,
    `- Indexable canonicals: ${audit.wholeSiteEvidence.indexableCanonicalPaths}`,
    `- Internal links checked: ${audit.wholeSiteEvidence.internalLinks}`,
    `- Issues: ${audit.wholeSiteEvidence.issues}`,
    `- Pass: ${audit.wholeSiteEvidence.pass}`,
    `- Scope: ${audit.wholeSiteEvidence.scope || "unknown"}`,
    "",
    "## Decision",
    "",
    audit.recommendedFix === "NO_CODE_FIX_FROM_CURRENT_EVIDENCE"
      ? "No first-party internal broken link is proven by the supplied evidence. This wave records the classification and does not add redirect/link changes for hostile scans, stale asset hashes or external legacy URLs."
      : "Do not change routes until the content-like 404 rows are tied to a first-party internal link, sitemap entry or owned campaign URL.",
    "",
  ];
  return `${lines.join("\n")}\n`;
}

export async function runAudit(options) {
  const trafficReport = JSON.parse(await readFile(options.traffic, "utf8"));
  let wholeSiteReport = null;
  try {
    wholeSiteReport = JSON.parse(await readFile(options.wholeSite, "utf8"));
  } catch {
    wholeSiteReport = null;
  }
  const audit = auditTraffic404({ trafficReport, wholeSiteReport });
  await mkdir(path.dirname(options.output), { recursive: true });
  await mkdir(path.dirname(options.markdown), { recursive: true });
  await writeFile(options.output, `${JSON.stringify(audit, null, 2)}\n`, "utf8");
  await writeFile(options.markdown, render404AuditMarkdown(audit), "utf8");
  return audit;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) {
      console.log("Usage: node scripts/audit-traffic-404.mjs [--traffic <json>] [--whole-site <results.json>] [--output <json>] [--markdown <md>]");
    } else {
      const audit = await runAudit(options);
      console.log(`404 audit: ${audit.recommendedFix}; ${audit.total404Requests} total 404 requests`);
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
