#!/usr/bin/env node

import { createHash } from "node:crypto";
import { access, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseGscInput } from "./gsc-opportunity-queue.mjs";
import { isSitemapIndex, readSitemapTree, sitemapPageUrls } from "./sitemap-tree.mjs";
import { buildGrowthReportData } from "../server/growth-report.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, "..");

const DEFAULT_OUTPUT = path.join(projectRoot, "..", "artifacts", "seo", "weekly-growth-ops.json");
const DEFAULT_MARKDOWN = path.join(projectRoot, "..", "artifacts", "seo", "weekly-growth-ops.md");
const DEFAULT_TRAFFIC_REPORT = path.join(projectRoot, "..", "artifacts", "seo", "traffic-crawler-baseline.json");
const DEFAULT_VERSION_FILE = path.join(projectRoot, "dist", "client", "version.json");
const DEFAULT_OPERATIONAL_HEALTH = path.join(projectRoot, "artifacts", "operational-health", "latest.json");
const DEFAULT_GSC_INDEX_LEDGER = path.join(projectRoot, "docs", "evidence", "four-week-growth-20260927", "gsc-index-ledger.json");
const DEFAULT_AEO_OBSERVATION = path.join(projectRoot, "docs", "evidence", "four-week-growth-20260927", "week3-aeo-public-search-observation-20260928.json");

const REQUIRED_AI_BOTS = [
  "OAI-SearchBot",
  "GPTBot",
  "ChatGPT-User",
  "PerplexityBot",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "anthropic-ai",
  "Google-Extended",
  "Applebot-Extended",
  "Bingbot",
];

export const DEFAULT_PARTNER_REGISTRY_SHA256 = "8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a";
export const DEFAULT_PROTECTED_HASHES = Object.freeze({
  "src/data/partner-registry.js": DEFAULT_PARTNER_REGISTRY_SHA256,
  "src/data/venue-database.js": "0ce124afbe9f4758ce9ec093c79372550ce2e2e90a7342aa05ecc8d3482e1d52",
  "src/data/public-cta.js": "675875240d5fbb05498284a37f90a14488d6ace73d19b102caeb5add9e33f8e3",
  "src/data/regional-cta.js": "a2542bb137b6b6ff123a0d3c6b3a01b09e1e3a785ee223e3b4e04a3fe8aab665",
});

function parseArgs(argv) {
  const options = {
    root: projectRoot,
    gscQueue: null,
    gscCurrent: null,
    gscPrevious: null,
    gscCurrent7: null,
    gscPrevious7: null,
    gscCurrent28: null,
    gscPrevious28: null,
    trafficReport: DEFAULT_TRAFFIC_REPORT,
    contentAudit: null,
    ctaData: null,
    ctaEnvironment: "production",
    ctaFrom: null,
    ctaTo: null,
    versionFile: DEFAULT_VERSION_FILE,
    productionHealth: DEFAULT_OPERATIONAL_HEALTH,
    maxHealthAgeHours: 24,
    gscIndexLedger: DEFAULT_GSC_INDEX_LEDGER,
    aeoObservation: DEFAULT_AEO_OBSERVATION,
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

    if (arg === "--root") options.root = path.resolve(next());
    else if (arg === "--gsc-queue") options.gscQueue = next();
    else if (arg === "--gsc-current") options.gscCurrent = next();
    else if (arg === "--gsc-previous") options.gscPrevious = next();
    else if (arg === "--gsc-current-7") options.gscCurrent7 = next();
    else if (arg === "--gsc-previous-7") options.gscPrevious7 = next();
    else if (arg === "--gsc-current-28") options.gscCurrent28 = next();
    else if (arg === "--gsc-previous-28") options.gscPrevious28 = next();
    else if (arg === "--traffic-report") options.trafficReport = next();
    else if (arg === "--content-audit") options.contentAudit = next();
    else if (arg === "--cta-data") options.ctaData = next();
    else if (arg === "--cta-environment") options.ctaEnvironment = next();
    else if (arg === "--cta-from") options.ctaFrom = next();
    else if (arg === "--cta-to") options.ctaTo = next();
    else if (arg === "--version-file") options.versionFile = next();
    else if (arg === "--production-health") options.productionHealth = next();
    else if (arg === "--max-health-age-hours") options.maxHealthAgeHours = Number.parseInt(next(), 10);
    else if (arg === "--gsc-index-ledger") options.gscIndexLedger = next();
    else if (arg === "--aeo-observation") options.aeoObservation = next();
    else if (arg === "--output") options.output = next();
    else if (arg === "--markdown") options.markdown = next();
    else if (arg === "--help" || arg === "-h") options.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function printHelp() {
  console.log([
    "Usage: node scripts/weekly-growth-ops.mjs [options]",
    "",
    "Builds the weekly SEO/GEO/AEO operating report from local site gates and optional GSC opportunity data.",
    "Missing GSC input is reported as unknown, never as zero demand or zero conversion.",
    "",
    "Options:",
    "  --gsc-queue <file>   JSON output from scripts/gsc-opportunity-queue.mjs.",
    "  --gsc-current <file> Alias for --gsc-current-7.",
    "  --gsc-previous <file> Alias for --gsc-previous-7.",
    "  --gsc-current-7 <file> Current 7-day GSC page/query export or visible snapshot.",
    "  --gsc-previous-7 <file> Previous 7-day GSC page/query export or visible snapshot.",
    "  --gsc-current-28 <file> Current 28-day GSC page/query export or visible snapshot.",
    "  --gsc-previous-28 <file> Previous 28-day GSC page/query export or visible snapshot.",
    "  --traffic-report <file> Anonymous JSON output from scripts/nginx-traffic-baseline.mjs.",
    "  --content-audit <file> Baseline-aware JSON output from scripts/audit-indexable-content-duplication.mjs.",
    "  --cta-data <file>      Private first-party CTA JSONL from server/growth-report.mjs collector. Default: .private/analytics/production.jsonl plus production.jsonl-YYYYMMDD archives.",
    "  --cta-environment <env> CTA environment to report. Default: production.",
    "  --cta-from <utc>       Current CTA window start, inclusive UTC.",
    "  --cta-to <utc>         Current CTA window end, exclusive UTC.",
    "  --version-file <file>  Local built version.json for production/candidate version summary.",
    "  --production-health <file> Local read-only operational-health JSON report or explicit live snapshot from scripts/collect-live-runtime-health.mjs.",
    "  --max-health-age-hours <n> Mark production-health evidence stale after this age. Default: 24.",
    "  --gsc-index-ledger <file> Local GSC index ledger JSON. Missing export stays unknown.",
    "  --aeo-observation <file> Last AEO public-search observation JSON for next-query reminders.",
    "  --output <file>      JSON report path. Default: ../artifacts/seo/weekly-growth-ops.json",
    "  --markdown <file>    Markdown report path. Default: ../artifacts/seo/weekly-growth-ops.md",
    "  --root <dir>         Project root for tests or alternate candidates. Default: current prototype root.",
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

async function readTextIfExists(filePath) {
  return (await fileExists(filePath)) ? readFile(filePath, "utf8") : null;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function daysBetween(dateText, now = new Date()) {
  const parsed = new Date(dateText);
  if (Number.isNaN(parsed.getTime())) return null;
  return Math.floor((now.getTime() - parsed.getTime()) / 86_400_000);
}

function hoursBetween(dateText, now = new Date()) {
  const parsed = new Date(dateText);
  if (Number.isNaN(parsed.getTime())) return null;
  return Math.floor((now.getTime() - parsed.getTime()) / 3_600_000);
}

function statusFromIssues(issues, missingStatus = "BLOCKED") {
  return issues.length ? missingStatus : "PASS";
}

export async function checkSitemap(root = projectRoot) {
  const sitemapPath = path.join(root, "public", "sitemap.xml");
  const sitemap = await readTextIfExists(sitemapPath);
  if (!sitemap) {
    return { id: "sitemap_hreflang", status: "BLOCKED", summary: "public/sitemap.xml is missing.", metrics: null, issues: ["missing_sitemap"] };
  }

  // Since #118 sitemap.xml is a <sitemapindex>: count pages and hreflang across the child sitemaps it lists.
  const tree = readSitemapTree(sitemapPath);
  const childLocs = tree.files.filter(({ xml }) => isSitemapIndex(xml)).flatMap(({ xml }) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]));
  const locs = sitemapPageUrls(tree);
  const hreflangs = unique(tree.files.flatMap(({ xml }) => [...xml.matchAll(/hreflang="([^"]+)"/g)].map((match) => match[1])));
  const badLocs = [...childLocs, ...locs].filter((loc) => !/^https:\/\/nexualpha\.com\//.test(loc));
  const issues = [];
  if (!locs.length) issues.push("no_loc_entries");
  if (tree.missing.length) issues.push("missing_child_sitemaps");
  if (!hreflangs.length) issues.push("no_hreflang_alternates");
  if (!hreflangs.includes("x-default")) issues.push("missing_x_default");
  if (badLocs.length) issues.push("non_canonical_origin_locs");

  return {
    id: "sitemap_hreflang",
    status: statusFromIssues(issues, "NEEDS_REVIEW"),
    summary: "Sitemap canonical inventory and hreflang alternates are present for search engines and answer systems.",
    metrics: {
      locCount: locs.length,
      sitemapFileCount: tree.files.length,
      missingChildSitemaps: tree.missing,
      hreflangCount: hreflangs.length,
      hreflangs,
      badLocCount: badLocs.length,
    },
    issues,
  };
}

function agentBlockAllows(text, agent) {
  const pattern = new RegExp(`User-agent:\\s*${agent.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([\\s\\S]*?)(?=\\nUser-agent:|$)`, "i");
  const block = text.match(pattern)?.[1] || "";
  return /^Allow:\s*\/\s*$/im.test(block) && !/^Disallow:\s*\/\s*$/im.test(block);
}

export async function checkAiCrawlerAccess(root = projectRoot) {
  const robotsPath = path.join(root, "public", "robots.txt");
  const robots = await readTextIfExists(robotsPath);
  if (!robots) {
    return { id: "ai_crawler_access", status: "BLOCKED", summary: "public/robots.txt is missing.", metrics: null, issues: ["missing_robots"] };
  }

  const blocked = REQUIRED_AI_BOTS.filter((agent) => !agentBlockAllows(robots, agent));
  const sitemapRefs = [...robots.matchAll(/^Sitemap:\s*(\S+)/gim)].map((match) => match[1]);
  const issues = [];
  if (blocked.length) issues.push("required_ai_bot_not_explicitly_allowed");
  if (!sitemapRefs.length) issues.push("missing_sitemap_reference");

  return {
    id: "ai_crawler_access",
    status: statusFromIssues(issues, "NEEDS_REVIEW"),
    summary: "AI/search crawlers have explicit access and robots.txt advertises sitemap locations.",
    metrics: {
      requiredAgents: REQUIRED_AI_BOTS,
      allowedAgents: REQUIRED_AI_BOTS.filter((agent) => !blocked.includes(agent)),
      blockedAgents: blocked,
      sitemapRefs,
    },
    issues,
  };
}

export async function checkLlmsFiles(root = projectRoot) {
  const llms = await readTextIfExists(path.join(root, "public", "llms.txt"));
  const llmsFull = await readTextIfExists(path.join(root, "public", "llms-full.txt"));
  const issues = [];
  if (!llms) issues.push("missing_llms_txt");
  if (!llmsFull) issues.push("missing_llms_full_txt");
  if (llms && !/Public data boundary/i.test(llms)) issues.push("llms_txt_missing_public_boundary");
  if (llms && !/https:\/\/nexualpha\.com\/llms-full\.txt/i.test(llms)) issues.push("llms_txt_missing_full_index_link");

  return {
    id: "ai_extractable_index",
    status: statusFromIssues(issues, "NEEDS_REVIEW"),
    summary: "Machine-readable AI discovery files expose public boundaries and source-review entry points.",
    metrics: {
      llmsBytes: llms?.length ?? null,
      llmsFullBytes: llmsFull?.length ?? null,
      publicLinks: llms ? [...llms.matchAll(/https:\/\/nexualpha\.com\/[^\s)]+/g)].length : null,
    },
    issues,
  };
}

export async function checkCitationAssets(root = projectRoot) {
  const researchDir = path.join(root, "public", "research");
  const issues = [];
  let entries = [];
  try {
    entries = await readdir(researchDir, { withFileTypes: true });
  } catch {
    return {
      id: "citation_assets",
      status: "WARNING",
      summary: "No public research asset directory is available for reusable GEO/AEO evidence.",
      metrics: { assetCount: 0, assets: [] },
      issues: ["missing_public_research_directory"],
    };
  }

  const names = new Set(entries.filter((entry) => entry.isFile()).map((entry) => entry.name));
  const jsonNames = [...names].filter((name) => name.endsWith(".json")).sort();
  const assets = [];

  for (const jsonName of jsonNames) {
    const baseName = jsonName.slice(0, -5);
    const csvName = `${baseName}.csv`;
    if (!names.has(csvName)) continue;

    const jsonPath = path.join(researchDir, jsonName);
    const csvPath = path.join(researchDir, csvName);
    let parsed = null;
    let csv = "";
    const assetIssues = [];
    try {
      parsed = JSON.parse(await readFile(jsonPath, "utf8"));
    } catch {
      assetIssues.push("invalid_json");
    }
    try {
      csv = await readFile(csvPath, "utf8");
    } catch {
      assetIssues.push("unreadable_csv");
    }

    const arrays = parsed && typeof parsed === "object"
      ? Object.values(parsed).filter(Array.isArray)
      : [];
    const recordCount = arrays.reduce((max, value) => Math.max(max, value.length), 0);
    const csvRows = csv.trim() ? csv.trim().split(/\r?\n/).length - 1 : 0;
    const version = parsed?.version || parsed?.reviewedAt || parsed?.updatedAt || null;
    const boundary = parsed?.scope || parsed?.boundary || parsed?.methodology || null;
    if (!version) assetIssues.push("missing_version_or_review_date");
    if (!boundary) assetIssues.push("missing_scope_or_boundary");
    if (recordCount < 2) assetIssues.push("insufficient_json_records");
    if (csvRows < 2) assetIssues.push("insufficient_csv_rows");

    if (assetIssues.length) issues.push(`${baseName}:${assetIssues.join("+")}`);
    assets.push({ baseName, jsonName, csvName, version, recordCount, csvRows, issues: assetIssues });
  }

  if (!assets.length) issues.push("no_paired_json_csv_assets");
  return {
    id: "citation_assets",
    status: issues.length ? "WARNING" : "PASS",
    summary: "Public citation assets are paired as parseable JSON and CSV with dated evidence boundaries.",
    metrics: { assetCount: assets.length, assets },
    issues,
  };
}

export async function checkSourceFreshness(root = projectRoot, now = new Date()) {
  const files = [
    {
      id: "international_source_registry",
      file: "src/data/international-source-registry.js",
      pattern: /INTERNATIONAL_SOURCE_REVIEWED_AT\s*=\s*"([^"]+)"/,
      maxAgeDays: 45,
    },
    {
      id: "topic_source_registry",
      file: "src/data/topic-source-registry.js",
      pattern: /TOPIC_SOURCE_REVIEW_DATE\s*=\s*"([^"]+)"/,
      maxAgeDays: 45,
    },
  ];

  const records = [];
  const issues = [];
  for (const item of files) {
    const text = await readTextIfExists(path.join(root, item.file));
    const reviewedAt = text?.match(item.pattern)?.[1] || null;
    const ageDays = reviewedAt ? daysBetween(reviewedAt, now) : null;
    const stale = ageDays === null || ageDays > item.maxAgeDays;
    if (stale) issues.push(`${item.id}_stale_or_missing`);
    records.push({ ...item, reviewedAt, ageDays, stale });
  }

  return {
    id: "source_freshness",
    status: issues.length ? "WARNING" : "PASS",
    summary: "Source registries keep dated review signals for jurisdiction and topic pages.",
    metrics: { maxAgeDays: 45, records },
    issues,
  };
}

function arraysEqual(a, b) {
  return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((value, index) => value === b[index]);
}

function sha256(text) {
  return createHash("sha256").update(text).digest("hex");
}

function sameCode(left, right, alternatives = []) {
  const candidate = String(left || "").toLowerCase();
  const allowed = [right, ...(Array.isArray(alternatives) ? alternatives : [])]
    .map((value) => String(value || "").toLowerCase())
    .filter(Boolean);
  return Boolean(candidate) && allowed.includes(candidate);
}

export async function checkInvitationConstitution(root = projectRoot, options = {}) {
  const registryPath = path.join(root, "src", "data", "partner-registry.js");
  const publicCtaPath = path.join(root, "src", "data", "public-cta.js");
  const expectedHash = options.expectedPartnerRegistrySha256 || DEFAULT_PARTNER_REGISTRY_SHA256;
  const issues = [];
  const details = {
    partnerRegistrySha256: null,
    expectedPartnerRegistrySha256: expectedHash,
    venues: {},
  };

  try {
    const registrySource = await readFile(registryPath, "utf8");
    const actualHash = sha256(registrySource);
    details.partnerRegistrySha256 = actualHash;
    if (actualHash !== expectedHash) issues.push("partner_registry_hash_changed");

    const importNonce = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const registry = await import(`${pathToFileURL(registryPath).href}?weekly=${importNonce}`);
    const publicCta = await import(`${pathToFileURL(publicCtaPath).href}?weekly=${importNonce}`);
    for (const [slug, urls] of Object.entries(registry.PARTNER_REGISTRATION_URLS || {})) {
      const cta = publicCta.publicCtaForVenue?.(slug);
      const registryVenue = registry.partnerRegistry?.[slug] || {};
      const alternateRegistrationUrls = urls.slice(1);
      const registryPrimaryOk = registryVenue.registrationUrl === urls[0];
      const registryAlternatesOk = arraysEqual(registryVenue.alternateRegistrationUrls || [], alternateRegistrationUrls);
      const ctaClusterOk = arraysEqual(cta?.registrationUrls, urls);
      const primaryOk = cta?.registrationUrl === urls[0];
      const inviteOk = sameCode(cta?.inviteCode, registryVenue.inviteCode, registryVenue.inviteCodes);
      details.venues[slug] = {
        registryPrimaryOk,
        registryAlternatesOk,
        publicCtaClusterOk: ctaClusterOk,
        publicCtaPrimaryOk: primaryOk,
        inviteOk,
        expectedPrimary: urls[0],
        actualPrimary: cta?.registrationUrl || registryVenue.registrationUrl || null,
        urlCount: urls.length,
      };
      if (!registryPrimaryOk) issues.push(`${slug}_registry_primary_mismatch`);
      if (!registryAlternatesOk) issues.push(`${slug}_registry_alternates_mismatch`);
      if (!ctaClusterOk) issues.push(`${slug}_public_cta_cluster_changed`);
      if (!primaryOk) issues.push(`${slug}_public_cta_primary_mismatch`);
      if (!inviteOk) issues.push(`${slug}_invite_code_changed`);
    }
  } catch (error) {
    issues.push(`import_failed:${error.message}`);
  }

  return {
    id: "invitation_constitution",
    status: issues.length ? "BLOCKED" : "PASS",
    summary: "Constitutional invitation links are locked by partner-registry.js SHA-256 and projected consistently into public CTA surfaces.",
    metrics: details,
    issues,
  };
}

async function readJsonIfExists(filePath) {
  if (!filePath || !(await fileExists(filePath))) return null;
  return JSON.parse(await readFile(filePath, "utf8"));
}

function summarizeLayerFromLiveSnapshot(snapshot, key) {
  const layer = snapshot?.layers?.[key] || null;
  if (!layer) return null;
  return {
    httpStatus: layer.httpStatus ?? null,
    ok: layer.ok === true,
    status: layer.status || null,
    configured: layer.configured ?? null,
    ready: layer.ready ?? null,
    reasonCode: layer.reasonCode || null,
  };
}

function summarizeLayerFromEndpoint(snapshot, id) {
  const endpoint = (snapshot?.endpoints || []).find((item) => item.id === id);
  if (!endpoint) return null;
  const body = endpoint.body || {};
  return {
    httpStatus: endpoint.httpStatus ?? null,
    ok: endpoint.ok === true,
    status: body.status || null,
    configured: body.configured ?? null,
    ready: body.ready ?? null,
    reasonCode: body.reasonCode || body.errorCode || null,
  };
}

function coreRecoveryFromReason(core) {
  if (!core?.reasonCode) return null;
  if (core.reasonCode === "CORE_API_ORIGIN_NOT_CONFIGURED") {
    return {
      condition: "Configure CORE_API_ORIGIN or CORE_API_BASE_URL for the production runtime, then rerun scripts/collect-live-runtime-health.mjs and weekly-growth-ops with the fresh snapshot.",
    };
  }
  if (core.reasonCode === "CORE_API_UPSTREAM_UNAVAILABLE") {
    return {
      condition: "Restore Core API upstream health and routing, then rerun scripts/collect-live-runtime-health.mjs and weekly-growth-ops with the fresh snapshot.",
    };
  }
  return {
    condition: `Close Core readiness reason ${core.reasonCode}, then rerun scripts/collect-live-runtime-health.mjs and weekly-growth-ops with the fresh snapshot.`,
  };
}

function normalizeProductionHealthEvidence(health, { now = new Date(), maxHealthAgeHours = 24 } = {}) {
  if (!health) {
    return {
      status: "UNKNOWN_HEALTH_INPUT",
      generatedAt: null,
      baseUrl: null,
      source: null,
      schemaVersion: null,
      ageHours: null,
      stale: null,
      failures: null,
      degradedOptionalDependencies: null,
      web: null,
      cta: null,
      errors: null,
      core: null,
      dependencies: null,
      recovery: null,
      boundary: "No production-health evidence was supplied. Runtime state remains unknown.",
    };
  }

  const ageHours = health.generatedAt ? hoursBetween(health.generatedAt, now) : null;
  const stale = ageHours === null ? true : ageHours > maxHealthAgeHours;
  if (health.schemaVersion === "nexualpha-live-runtime-health-v1") {
    const live = health.layers?.web?.live || summarizeLayerFromEndpoint(health, "live");
    const webReady = health.layers?.web?.ready || summarizeLayerFromEndpoint(health, "webReady");
    const webOk = live?.ok === true && webReady?.ok === true;
    const core = summarizeLayerFromLiveSnapshot(health, "core") || summarizeLayerFromEndpoint(health, "coreReadiness");
    return {
      status: stale ? "STALE_LIVE_HEALTH_INPUT" : health.status || "UNKNOWN_LIVE_HEALTH_STATUS",
      generatedAt: health.generatedAt || null,
      baseUrl: health.baseUrl || null,
      source: health.source || "explicit-live-http",
      schemaVersion: health.schemaVersion,
      ageHours,
      stale,
      failures: Array.isArray(health.failures) ? health.failures : [],
      degradedOptionalDependencies: Array.isArray(health.degradedOptionalDependencies) ? health.degradedOptionalDependencies : [],
      web: { live, ready: webReady, ok: webOk },
      cta: summarizeLayerFromLiveSnapshot(health, "cta") || summarizeLayerFromEndpoint(health, "ctaReady"),
      errors: summarizeLayerFromLiveSnapshot(health, "errors") || summarizeLayerFromEndpoint(health, "errorsReady"),
      dependencies: summarizeLayerFromLiveSnapshot(health, "dependencies") || summarizeLayerFromEndpoint(health, "dependencies"),
      core,
      recovery: health.recovery || coreRecoveryFromReason(core),
      boundary: health.policy || "Explicit live runtime snapshot. Optional Core/CTA/error capability 503s are recorded separately from website readiness.",
    };
  }

  return {
    status: stale ? "STALE_HEALTH_INPUT" : health.status || "UNKNOWN_HEALTH_INPUT",
    generatedAt: health.generatedAt || null,
    baseUrl: health.baseUrl || null,
    source: "local-operational-health-file",
    schemaVersion: health.schemaVersion || null,
    ageHours,
    stale,
    failures: Array.isArray(health.failures) ? health.failures : [],
    degradedOptionalDependencies: Array.isArray(health.degradedOptionalDependencies) ? health.degradedOptionalDependencies : [],
    web: null,
    cta: null,
    errors: null,
    dependencies: null,
    core: null,
    recovery: health.recovery || null,
    boundary: "Legacy local operational-health file. Generate an explicit live snapshot with scripts/collect-live-runtime-health.mjs before treating production health as current.",
  };
}

export async function summarizeProductionRuntime({ root = projectRoot, versionFile = DEFAULT_VERSION_FILE, productionHealth = DEFAULT_OPERATIONAL_HEALTH, now = new Date(), maxHealthAgeHours = 24 } = {}) {
  const resolvedVersion = path.resolve(versionFile);
  const resolvedHealth = path.resolve(productionHealth);
  const version = await readJsonIfExists(resolvedVersion);
  const health = await readJsonIfExists(resolvedHealth);
  const normalizedHealth = normalizeProductionHealthEvidence(health, { now, maxHealthAgeHours });
  const liveVersion = health?.schemaVersion === "nexualpha-live-runtime-health-v1" ? health.version : null;
  return {
    status: version || health ? "OBSERVATION_READY" : "UNKNOWN_RUNTIME_INPUT",
    versionFile: (await fileExists(resolvedVersion)) ? resolvedVersion : null,
    healthFile: (await fileExists(resolvedHealth)) ? resolvedHealth : null,
    packageVersion: version?.version || liveVersion?.packageVersion || null,
    buildId: version?.buildId || liveVersion?.buildId || null,
    health: normalizedHealth,
    boundary: "Production/candidate version and health evidence only. Use an explicit live snapshot for current production state. This does not prove traffic, registrations, KYC, trades, commissions or conversion lift.",
  };
}

export async function summarizeProtectedHashes(root = projectRoot, expectedHashes = DEFAULT_PROTECTED_HASHES) {
  const records = [];
  for (const [relativePath, expectedSha256] of Object.entries(expectedHashes)) {
    const absolutePath = path.join(root, relativePath);
    const text = await readTextIfExists(absolutePath);
    const actualSha256 = text === null ? null : sha256(text);
    records.push({
      path: relativePath,
      expectedSha256,
      actualSha256,
      status: actualSha256 === null ? "MISSING" : actualSha256 === expectedSha256 ? "MATCH" : "CHANGED",
    });
  }
  return {
    status: records.every((record) => record.status === "MATCH") ? "MATCH" : "REVIEW_REQUIRED",
    records,
    boundary: "Protected commercial source hashes guard referral routes, venue data and public CTA projection. A match does not prove partner-side registration or commission.",
  };
}

export async function summarizeGscIndexLedger(gscIndexLedgerPath = DEFAULT_GSC_INDEX_LEDGER) {
  const resolved = path.resolve(gscIndexLedgerPath);
  const ledger = await readJsonIfExists(resolved);
  if (!ledger) {
    return {
      status: "UNKNOWN_GSC_INDEX_LEDGER",
      inputFile: null,
      totals: { sitemapUrls: null, gscRows: null, unknownRows: null, indexedRows: null },
      inputBoundary: "No local GSC index ledger was supplied. URL-level indexing state remains unknown.",
    };
  }

  return {
    status: ledger.status || "UNKNOWN_GSC_INDEX_LEDGER_STATUS",
    inputFile: resolved,
    generatedAt: ledger.generatedAt || null,
    totals: {
      sitemapUrls: ledger.totals?.sitemapUrls ?? null,
      gscRows: ledger.totals?.gscRows ?? null,
      unknownRows: ledger.totals?.unknownRows ?? null,
      indexedRows: ledger.summary?.byIndexClass?.Indexed ?? null,
      gscOnlyRows: ledger.totals?.gscOnlyRows ?? null,
      conflictingGscUrls: ledger.totals?.conflictingGscUrls ?? null,
    },
    inputBoundary: ledger.inputBoundary || "Only supplied GSC URL-level evidence may classify indexing. Missing GSC data remains unknown.",
  };
}

export async function buildAeoObservationReminders({ root = projectRoot, aeoObservation = DEFAULT_AEO_OBSERVATION } = {}) {
  let baseline = [];
  try {
    const registryPath = path.join(root, "src", "data", "aeo-question-registry.js");
    if (await fileExists(registryPath)) {
      const importNonce = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const registry = await import(`${pathToFileURL(registryPath).href}?weeklyAeo=${importNonce}`);
      baseline = Array.isArray(registry.AEO_HIGH_INTENT_VISIBILITY_BASELINE)
        ? registry.AEO_HIGH_INTENT_VISIBILITY_BASELINE
        : [];
    }
  } catch {
    baseline = [];
  }

  const observation = await readJsonIfExists(path.resolve(aeoObservation));
  const observedById = new Map((observation?.observations || []).map((item) => [item.id, item]));
  const reminders = baseline.map((item) => {
    const previous = observedById.get(item.id);
    return {
      id: item.id,
      query: item.query,
      targetUrl: item.targetUrl,
      previousStatus: previous?.status || item.accuracy || "unknown",
      reminder: "Re-run this verbatim query in the next observation window and record only observed public-search result presence. Do not convert result presence into answer-engine citation, registration or commission evidence.",
    };
  });

  return {
    status: baseline.length ? "REMINDERS_READY" : "UNKNOWN_AEO_BASELINE",
    baselineReviewedAt: baseline[0]?.checkedAt || null,
    lastObservationFile: observation ? path.resolve(aeoObservation) : null,
    lastObservedAt: observation?.observedAt || null,
    lastSummary: observation?.summary || null,
    reminders,
    boundary: "AEO reminders are a manual observation checklist. They do not prove AI Overview, ChatGPT, Perplexity, Gemini or answer-engine citation.",
  };
}

export async function summarizeGscQueue(gscQueuePath = null) {
  if (!gscQueuePath || !(await fileExists(gscQueuePath))) {
    return {
      status: "UNKNOWN_GSC_INPUT",
      inputFile: gscQueuePath ? path.resolve(gscQueuePath) : null,
      totals: { inputRows: null, rankedRows: null, blockedRows: null },
      topOpportunities: [],
      summary: "No GSC opportunity queue was supplied. Search demand, clicks, impressions, CTR and ranking movement remain unknown.",
    };
  }

  const report = JSON.parse(await readFile(gscQueuePath, "utf8"));
  const blockedRows = report.totals?.blockedRows ?? null;
  const status = report.status === "QUEUE_READY" && Number(blockedRows) > 0
    ? "QUEUE_READY_WITH_BLOCKED_ROWS"
    : report.status || "UNKNOWN_GSC_REPORT_STATUS";
  return {
    status,
    inputFile: path.resolve(gscQueuePath),
    totals: {
      inputRows: report.totals?.inputRows ?? null,
      rankedRows: report.totals?.rankedRows ?? null,
      blockedRows,
    },
    topOpportunities: (report.queue || []).slice(0, 10).map((row, index) => ({
      priority: index + 1,
      page: row.page || null,
      query: row.query || null,
      market: row.market || "GLOBAL",
      intent: row.intent || [],
      impressions: row.impressions ?? null,
      ctr: row.ctr ?? null,
      position: row.position ?? null,
      action: row.recommendedAction || "review_page_intent",
      score: row.opportunityScore ?? null,
      contentBrief: row.contentBrief ? {
        searchIntent: row.contentBrief.searchIntent || row.query || null,
        requiredSections: Array.isArray(row.contentBrief.requiredSections) ? row.contentBrief.requiredSections : [],
        schemaCandidates: Array.isArray(row.contentBrief.schemaCandidates) ? row.contentBrief.schemaCandidates : [],
        boundary: row.contentBrief.boundary || "Planning guidance only; search demand does not prove conversion or citation outcomes.",
      } : null,
    })),
    summary: Number(blockedRows) > 0
      ? "GSC opportunity data was supplied, but some rows lack the page, CTR or position fields required for evidence-based ranking."
      : "GSC opportunity queue was supplied; priorities are source-bound to that export.",
  };
}

function gscTrendKey(row) {
  if (row.page && row.query) return { dimension: "page_query", key: `${row.page}\t${row.query}`, label: `${row.page} | ${row.query}` };
  if (row.page) return { dimension: "page", key: row.page, label: row.page };
  if (row.query) return { dimension: "query", key: row.query, label: row.query };
  return { dimension: "unknown", key: null, label: "unknown" };
}

async function readGscRows(inputPath = null) {
  if (!inputPath || !(await fileExists(inputPath))) {
    return { status: "UNKNOWN_GSC_INPUT", inputFile: inputPath ? path.resolve(inputPath) : null, rows: [] };
  }
  const resolved = path.resolve(inputPath);
  const text = await readFile(resolved, "utf8");
  return { status: "READY", inputFile: resolved, rows: parseGscInput(text, resolved) };
}

function metricDelta(current, previous) {
  if (current === null || current === undefined || previous === null || previous === undefined) return null;
  return current - previous;
}

function classifyTrendAction(row) {
  const missing = [];
  if (row.current.impressions === null) missing.push("current_impressions");
  if (row.current.ctr === null) missing.push("current_ctr");
  if (row.current.position === null) missing.push("current_position");
  if (!row.hasPrevious) missing.push("previous_window");
  else {
    if (row.previous.impressions === null) missing.push("previous_impressions");
    if (row.previous.ctr === null) missing.push("previous_ctr");
    if (row.previous.position === null) missing.push("previous_position");
  }

  if (missing.length) {
    return {
      status: row.hasPrevious ? "PARTIAL_TREND_DATA" : "BASELINE_ONLY",
      action: row.hasPrevious ? "complete_gsc_export_before_trend_call" : "wait_for_next_complete_window",
      missing,
    };
  }

  if ((row.delta.clicks ?? 0) > 0 || (row.current.position <= 5 && row.current.ctr >= 0.05)) {
    return { status: "PROTECT_WINNER", action: "protect_winner_internal_links", missing };
  }
  if (row.current.position <= 10 && row.current.ctr < 0.02) {
    return { status: "HIGH_POSITION_LOW_CTR", action: "rewrite_serp_title_meta_and_cta_bridge", missing };
  }
  if ((row.delta.impressions ?? 0) > 0 && row.current.position > 10 && row.current.position <= 30) {
    return { status: "RISING_DEMAND_MID_POSITION", action: "refresh_answer_block_table_and_internal_links", missing };
  }
  if (row.current.position > 30) {
    return { status: "DISCOVERED_LOW_RANK", action: "expand_source_backed_body_and_internal_links", missing };
  }
  return { status: "MONITOR", action: "monitor_next_window", missing };
}

function compareGscRows(currentRows, previousRows) {
  const previousByKey = new Map();
  for (const previous of previousRows) {
    const meta = gscTrendKey(previous);
    if (meta.key) previousByKey.set(`${meta.dimension}:${meta.key}`, previous);
  }

  return currentRows.map((current) => {
    const meta = gscTrendKey(current);
    const previous = meta.key ? previousByKey.get(`${meta.dimension}:${meta.key}`) || null : null;
    const row = {
      dimension: meta.dimension,
      key: meta.key,
      label: meta.label,
      current: {
        clicks: current.clicks,
        impressions: current.impressions,
        ctr: current.ctr,
        position: current.position,
      },
      previous: previous ? {
        clicks: previous.clicks,
        impressions: previous.impressions,
        ctr: previous.ctr,
        position: previous.position,
      } : {
        clicks: null,
        impressions: null,
        ctr: null,
        position: null,
      },
      hasPrevious: Boolean(previous),
      delta: {
        clicks: previous ? metricDelta(current.clicks, previous.clicks) : null,
        impressions: previous ? metricDelta(current.impressions, previous.impressions) : null,
        ctr: previous ? metricDelta(current.ctr, previous.ctr) : null,
        position: previous ? metricDelta(current.position, previous.position) : null,
      },
    };
    const classification = classifyTrendAction(row);
    return { ...row, ...classification };
  });
}

export async function summarizeGscTrendWindow({ currentPath = null, previousPath = null, windowDays = 7 } = {}) {
  const current = await readGscRows(currentPath);
  const previous = await readGscRows(previousPath);

  if (current.status !== "READY") {
    return {
      status: "UNKNOWN_GSC_TREND",
      windowDays,
      boundary: "Trend movement is unknown because the current GSC export was not supplied. Missing data is not treated as zero.",
      currentInputFile: current.inputFile,
      previousInputFile: previous.inputFile,
      totals: { currentRows: null, previousRows: previous.status === "READY" ? previous.rows.length : null, comparedRows: null },
      rows: [],
    };
  }

  const rows = compareGscRows(current.rows, previous.status === "READY" ? previous.rows : []);
  const missingPreviousRows = rows.filter((row) => !row.hasPrevious).length;
  return {
    status: previous.status === "READY" ? "TREND_READY" : "BASELINE_ONLY",
    windowDays,
    boundary: "Rows are compared only by explicit matching dimension: page-to-page, query-to-query, or supplied page-query row to the same supplied page-query row. No query-to-page pairing is inferred.",
    currentInputFile: current.inputFile,
    previousInputFile: previous.inputFile,
    totals: {
      currentRows: current.rows.length,
      previousRows: previous.status === "READY" ? previous.rows.length : null,
      comparedRows: rows.length,
      missingPreviousRows,
    },
    rows: rows.slice(0, 25),
  };
}

async function summarizeGscTrends(options = {}) {
  const sevenCurrent = options.gscCurrent7 || options.gscCurrent || null;
  const sevenPrevious = options.gscPrevious7 || options.gscPrevious || null;
  const twentyEightCurrent = options.gscCurrent28 || null;
  const twentyEightPrevious = options.gscPrevious28 || null;
  return {
    sevenDay: await summarizeGscTrendWindow({ currentPath: sevenCurrent, previousPath: sevenPrevious, windowDays: 7 }),
    twentyEightDay: await summarizeGscTrendWindow({ currentPath: twentyEightCurrent, previousPath: twentyEightPrevious, windowDays: 28 }),
  };
}

export async function summarizeTrafficBaseline(trafficReportPath = DEFAULT_TRAFFIC_REPORT, now = new Date()) {
  if (!trafficReportPath || !(await fileExists(trafficReportPath))) {
    return {
      status: "UNKNOWN_TRAFFIC_INPUT",
      inputFile: trafficReportPath ? path.resolve(trafficReportPath) : null,
      ageDays: null,
      totals: { parsedRequests: null, unparsedLines: null },
      statuses: {},
      crawlerUserAgentCounts: {},
      htmlTrafficClasses: null,
      topHtmlPaths: [],
      topCrawlerHtmlPaths: {},
      top404Paths: [],
      summary: "No anonymous Nginx traffic baseline was supplied. Server requests and crawler user-agent counts remain unknown.",
    };
  }
  const report = JSON.parse(await readFile(trafficReportPath, "utf8"));
  return {
    status: report.status || "UNKNOWN_TRAFFIC_REPORT_STATUS",
    inputFile: path.resolve(trafficReportPath),
    ageDays: report.generatedAt ? daysBetween(report.generatedAt, now) : null,
    totals: {
      parsedRequests: report.totals?.parsedRequests ?? null,
      unparsedLines: report.totals?.unparsedLines ?? null,
    },
    statuses: report.statuses || {},
    crawlerUserAgentCounts: report.crawlerUserAgentCounts || {},
    htmlTrafficClasses: report.htmlTrafficClasses || null,
    topHtmlPaths: (report.topOtherContentHtmlPaths || report.topHtmlPaths || []).slice(0, 10),
    topCrawlerHtmlPaths: report.topCrawlerHtmlPaths || {},
    top404Paths: (report.top404Paths || []).slice(0, 10),
    summary: "Anonymous server-request evidence only. Counts are not unique users; crawler labels are unverified user-agent strings.",
  };
}

export async function summarizeContentAudit(contentAuditPath = null) {
  if (!contentAuditPath || !(await fileExists(contentAuditPath))) {
    return {
      status: "UNKNOWN_CONTENT_AUDIT",
      inputFile: contentAuditPath ? path.resolve(contentAuditPath) : null,
      highConfidenceSignals: null,
      mediumSignals: null,
      advisorySignals: null,
      delta: null,
      gate: "UNKNOWN",
      summary: "No baseline-aware content audit was supplied; duplicate-body, locale-fallback and thin-page movement is unknown.",
    };
  }
  const audit = JSON.parse(await readFile(contentAuditPath, "utf8"));
  const highConfidenceSignals = audit.severity?.high ?? null;
  const mediumSignals = audit.severity?.medium ?? null;
  const advisorySignals = audit.severity?.advisory ?? null;
  const delta = audit.baselineComparison?.delta || null;
  const regressed = audit.status === "REGRESSED" || Number(delta?.high || 0) > 0;
  const unresolvedHigh = Number.isFinite(highConfidenceSignals) && highConfidenceSignals > 0;
  return {
    status: audit.status || "UNKNOWN_CONTENT_AUDIT_STATUS",
    inputFile: path.resolve(contentAuditPath),
    highConfidenceSignals,
    mediumSignals,
    advisorySignals,
    delta,
    gate: regressed ? "BLOCK_CONSOLIDATION" : unresolvedHigh ? "REVIEW_HIGH_CONFIDENCE" : "PASS",
    summary: "High-confidence signals cover exact body duplication, locale fallback and thin pages. Metadata and repeated brand headings remain an editorial queue.",
  };
}

function publicPath(value) {
  if (!value) return null;
  try {
    const url = new URL(String(value), "https://nexualpha.com");
    if (url.origin !== "https://nexualpha.com") return null;
    return url.pathname.replace(/\/{2,}/g, "/") || "/";
  } catch {
    return null;
  }
}

export function buildContentPriorityQueue({ gsc, traffic, limit = 15 } = {}) {
  const rows = new Map();
  const ensure = (pathValue) => {
    const pathName = publicPath(pathValue);
    if (!pathName || pathName === "/") return null;
    if (!rows.has(pathName)) {
      rows.set(pathName, {
        path: pathName,
        gsc: null,
        otherAnonymousRequests: null,
        knownCrawlerRequests: 0,
        crawlerLabels: [],
      });
    }
    return rows.get(pathName);
  };

  for (const item of gsc?.topOpportunities || []) {
    const row = ensure(item.page);
    if (!row) continue;
    row.gsc = {
      priority: item.priority ?? null,
      impressions: item.impressions ?? null,
      ctr: item.ctr ?? null,
      position: item.position ?? null,
      action: item.action || "review_page_intent",
      score: item.score ?? null,
    };
  }

  for (const item of traffic?.topHtmlPaths || []) {
    const row = ensure(item.path);
    if (row) row.otherAnonymousRequests = Number.isFinite(Number(item.requests)) ? Number(item.requests) : null;
  }

  for (const [crawler, paths] of Object.entries(traffic?.topCrawlerHtmlPaths || {})) {
    for (const item of paths || []) {
      const row = ensure(item.path);
      if (!row) continue;
      row.knownCrawlerRequests += Number.isFinite(Number(item.requests)) ? Number(item.requests) : 0;
      if (!row.crawlerLabels.includes(crawler)) row.crawlerLabels.push(crawler);
    }
  }

  return [...rows.values()]
    .map((row) => {
      const gscWeight = row.gsc ? 10_000 - Math.min(9_999, (row.gsc.priority || 100) * 100) : 0;
      const anonymousWeight = row.otherAnonymousRequests === null ? 0 : Math.log1p(row.otherAnonymousRequests) * 10;
      const crawlerWeight = Math.log1p(row.knownCrawlerRequests) * 5;
      const action = row.gsc?.action
        || (row.otherAnonymousRequests !== null ? "review_intent_answer_and_internal_cta" : "protect_crawl_path_and_source_freshness");
      return {
        ...row,
        action,
        planningScore: Math.round((gscWeight + anonymousWeight + crawlerWeight) * 100) / 100,
        boundary: "Planning evidence only: anonymous requests are not users, crawler labels are unverified, and GSC rows do not prove conversions.",
      };
    })
    .sort((left, right) => right.planningScore - left.planningScore || left.path.localeCompare(right.path))
    .slice(0, limit);
}

function slugifyBacklogId(value) {
  return String(value || "unknown")
    .toLowerCase()
    .replace(/^https?:\/\/[^/]+/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "unknown";
}

function fallbackSectionsForAction(action = "") {
  const normalized = String(action).toLowerCase();
  if (normalized.includes("protect_winner")) return ["freshness_note", "internal_links", "answer_integrity_check"];
  if (normalized.includes("rewrite_serp")) return ["title_meta", "first_view_cta_bridge", "direct_answer"];
  if (normalized.includes("table") || normalized.includes("faq")) return ["direct_answer", "comparison_table", "faq", "source_dates", "internal_links"];
  if (normalized.includes("internal_links")) return ["direct_answer", "source_dates", "internal_links"];
  return ["direct_answer", "source_dates", "internal_links"];
}

function backlogEvidenceRequired(requiredSections) {
  const sections = requiredSections.length ? requiredSections.join(", ") : "direct_answer, source_dates, internal_links";
  return `Updated public page with ${sections}, dated source boundary, internal-link bridge and post-build SEO verification.`;
}

function addOwnerBacklogRow(rows, seen, row) {
  const page = publicPath(row.page) || row.page || null;
  if (!page) return;
  const key = `${page}\t${row.query || ""}\t${row.source}`;
  if (seen.has(key)) return;
  const requiredSections = Array.isArray(row.requiredSections) && row.requiredSections.length
    ? row.requiredSections
    : fallbackSectionsForAction(row.action);
  seen.add(key);
  rows.push({
    id: `${row.source}-${slugifyBacklogId(`${page}-${row.query || row.action || row.priority || rows.length + 1}`)}`,
    owner: row.owner || "Content operator",
    page,
    query: row.query || null,
    market: row.market || null,
    source: row.source,
    priority: row.priority ?? rows.length + 1,
    action: row.action || "review_page_intent",
    requiredSections,
    schemaCandidates: Array.isArray(row.schemaCandidates) ? row.schemaCandidates : [],
    acceptanceCriteria: [
      "Lead with a human-readable direct answer that can stand alone in search and AI summaries.",
      "Expose the required sections in visible HTML, not only in JavaScript-only state.",
      "Include dated source or boundary language for every factual or commercial claim.",
      "Add a relevant internal link bridge to comparison, venue, regional or methodology pages.",
      "Re-run the weekly growth report and the relevant SEO test after the edit.",
    ],
    evidenceRequired: row.evidenceRequired || backlogEvidenceRequired(requiredSections),
    boundary: row.boundary || "Execution backlog only. Completing this item does not prove ranking growth, AI citation, registration, KYC, deposit, trade or commission.",
  });
}

export function buildOwnerPageBacklog({ gsc, gscTrends, contentPriorityQueue, limit = 12 } = {}) {
  const rows = [];
  const seen = new Set();

  for (const item of gsc?.topOpportunities || []) {
    addOwnerBacklogRow(rows, seen, {
      owner: "Content operator",
      page: item.page,
      query: item.query,
      market: item.market,
      source: "gsc_opportunity",
      priority: item.priority,
      action: item.action,
      requiredSections: item.contentBrief?.requiredSections,
      schemaCandidates: item.contentBrief?.schemaCandidates,
      evidenceRequired: item.contentBrief
        ? backlogEvidenceRequired(item.contentBrief.requiredSections || [])
        : null,
      boundary: item.contentBrief?.boundary,
    });
  }

  for (const [label, trend] of Object.entries(gscTrends || {})) {
    for (const row of trend?.rows || []) {
      if (["monitor_next_window", "wait_for_next_complete_window", "complete_gsc_export_before_trend_call"].includes(row.action)) continue;
      const page = row.dimension === "page" || row.dimension === "page_query" ? row.label.split(" | ")[0] : null;
      addOwnerBacklogRow(rows, seen, {
        owner: row.action === "protect_winner_internal_links" ? "SEO operator" : "Content operator",
        page,
        query: row.dimension === "query" ? row.label : row.label.split(" | ")[1] || null,
        source: `${label}_gsc_trend`,
        priority: rows.length + 1,
        action: row.action,
        evidenceRequired: `${trend.windowDays}-day same-dimension GSC evidence plus updated page and SEO verification.`,
        boundary: trend.boundary,
      });
    }
  }

  for (const item of contentPriorityQueue || []) {
    if (rows.length >= limit) break;
    addOwnerBacklogRow(rows, seen, {
      owner: item.action === "protect_crawl_path_and_source_freshness" ? "Technical SEO operator" : "Content operator",
      page: item.path,
      source: "server_request_or_crawler_path",
      priority: rows.length + 1,
      action: item.action,
      evidenceRequired: "Updated page, crawl-path verification and a fresh anonymous traffic or weekly growth report.",
      boundary: item.boundary,
    });
  }

  return {
    status: rows.length ? "BACKLOG_READY" : "UNKNOWN_OWNER_PAGE_BACKLOG",
    totals: { items: rows.length, gscItems: rows.filter((row) => row.source === "gsc_opportunity").length },
    boundary: "Owner-page backlog is an execution queue derived from supplied GSC, trend and anonymous request evidence. It is not proof of rankings, AI citations, registrations or commissions.",
    rows: rows.slice(0, limit),
  };
}

function nextActionsFrom(report) {
  const actions = [];
  if (report.production?.status === "UNKNOWN_RUNTIME_INPUT" || report.production?.health?.status === "UNKNOWN_HEALTH_INPUT") {
    actions.push({
      owner: "Ops operator",
      action: "Generate or supply the production version and explicit live runtime health snapshot before declaring the observation window healthy.",
      evidenceRequired: "dist/client/version.json plus scripts/collect-live-runtime-health.mjs --base-url <explicit-url> output, or explicit replacement paths.",
    });
  } else if (report.production?.health?.stale || report.production?.health?.source !== "explicit-live-http") {
    actions.push({
      owner: "Ops operator",
      action: "Refresh production health with an explicit live runtime snapshot instead of relying on a stale or legacy local health file.",
      evidenceRequired: "node scripts/collect-live-runtime-health.mjs --base-url https://nexualpha.com --output artifacts/operational-health/live-runtime-latest.json, then rerun weekly-growth-ops with --production-health that file.",
    });
  } else if (report.production?.health?.failures?.length) {
    actions.push({
      owner: "Ops operator",
      action: `Close production health failures: ${report.production.health.failures.join(", ")}.`,
      evidenceRequired: "Fresh operational-health JSON showing PASS or a documented expected fallback with recovery condition.",
    });
  }

  if (report.protectedHashes?.status !== "MATCH") {
    actions.push({
      owner: "Growth operator",
      action: "Review protected commercial hash changes before relying on referral or CTA configuration.",
      evidenceRequired: "Expected partner registry, venue database and public CTA hashes match the protected baseline or a reviewed commercial change is documented.",
    });
  }

  if (report.gscIndexLedger?.status === "UNKNOWN_GSC_INDEX_LEDGER" || report.gscIndexLedger?.status === "INPUT_MISSING") {
    actions.push({
      owner: "SEO operator",
      action: "Supply a URL-level GSC page indexing export and rebuild the index ledger before claiming indexed/not-indexed movement.",
      evidenceRequired: "GSC URL-level page indexing export; sitemap-only rows remain Unknown when the export is missing.",
    });
  }

  if (report.aeoObservation?.status === "REMINDERS_READY") {
    actions.push({
      owner: "AEO operator",
      action: "Run the fixed AEO high-intent query set in the next observation window and record only observed public-search evidence.",
      evidenceRequired: "Dated observation JSON with exact query, target URL, observed URLs and explicit no-citation boundary.",
    });
  }

  if (report.ctaFunnel?.status === "INPUT_MISSING") {
    actions.push({
      owner: "Growth operator",
      action: "Supply the private first-party CTA JSONL export before making funnel movement or conversion-lift claims.",
      evidenceRequired: "Private CTA collector JSONL with receivedAt, environment and validated first-party events; no PII and no partner registration claim.",
    });
  } else if (report.ctaFunnel?.status === "INSUFFICIENT_SAMPLE") {
    actions.push({
      owner: "Growth operator",
      action: "Keep the CTA collector running until the selected window reaches the minimum first-party session sample before treating drop-off queues as operating priorities.",
      evidenceRequired: "weekly-growth-ops CTA funnel status READY with sampleReadiness observedSessions meeting the minimum; partner outcomes still remain null.",
    });
  } else if (report.ctaFunnel?.weekOverWeek?.status === "RANGE_REQUIRED") {
    actions.push({
      owner: "Growth operator",
      action: "Rerun weekly-growth-ops with --cta-from and --cta-to to produce an equal-window CTA week-over-week comparison.",
      evidenceRequired: "UTC current window and automatically derived previous equal window in the CTA funnel section.",
    });
  }

  if (report.gsc.status === "UNKNOWN_GSC_INPUT" || report.gsc.status === "INPUT_MISSING") {
    actions.push({
      owner: "SEO operator",
      action: "Export fresh GSC page-query rows and rerun gsc-opportunity-queue before claiming traffic growth.",
      evidenceRequired: "GSC export file or Search Console visible/API evidence.",
    });
  } else if (report.gsc.status === "QUEUE_READY_WITH_BLOCKED_ROWS") {
    actions.push({
      owner: "SEO operator",
      action: "Export page-query GSC rows with clicks, impressions, CTR and average position, then rebuild the opportunity queue.",
      evidenceRequired: "A fresh Search Console page-query export with no blocked partial rows.",
    });
  }

  if (report.traffic.status === "UNKNOWN_TRAFFIC_INPUT") {
    actions.push({
      owner: "SEO operator",
      action: "Generate an anonymous Nginx traffic baseline before prioritizing crawl paths from server logs.",
      evidenceRequired: "traffic-crawler-baseline.json with no IPs, query strings, referrers or raw user-agent strings.",
    });
  } else if ((report.traffic.statuses["404"] || 0) > 0) {
    actions.push({
      owner: "Technical SEO operator",
      action: "Review frequent 404 paths and separate hostile scans from broken internal assets or routes.",
      evidenceRequired: "Aggregate 404 path review and a verified fix for any first-party broken route.",
    });
  }

  if (report.contentAudit?.gate === "BLOCK_CONSOLIDATION") {
    actions.push({
      owner: "Technical SEO operator",
      action: "Stop URL consolidation and close the regressed exact-body, locale-fallback or thin-page signals first.",
      evidenceRequired: "A fresh baseline-aware content audit with no high-confidence regression.",
    });
  } else if (report.contentAudit?.gate === "REVIEW_HIGH_CONFIDENCE") {
    actions.push({
      owner: "Content operator",
      action: "Rewrite the remaining exact-body, locale-fallback or thin-page candidates before considering URL consolidation.",
      evidenceRequired: "A fresh content audit showing zero high-confidence signals.",
    });
  }

  for (const item of report.gsc.topOpportunities.slice(0, 5)) {
    actions.push({
      owner: "Content operator",
      action: `Improve ${item.page || "unknown page"} for "${item.query || "unknown query"}" using ${item.action}.`,
      evidenceRequired: "Updated page, visible source-backed answer block, internal links, and post-build SEO verification.",
    });
  }

  for (const [label, trend] of Object.entries(report.gscTrends || {})) {
    if (trend.status === "UNKNOWN_GSC_TREND") {
      actions.push({
        owner: "SEO operator",
        action: `Supply the current ${trend.windowDays}-day GSC export before making ${label} trend claims.`,
        evidenceRequired: "Search Console export or visible/API evidence for the same explicit dimension.",
      });
    } else if (trend.status === "BASELINE_ONLY") {
      actions.push({
        owner: "SEO operator",
        action: `Keep the ${trend.windowDays}-day GSC baseline and compare it against the next complete window.`,
        evidenceRequired: "Next Search Console export with matching page/query dimensions; missing previous rows stay unknown.",
      });
    }

    for (const row of (trend.rows || []).slice(0, 5)) {
      if (row.action === "wait_for_next_complete_window" || row.action === "complete_gsc_export_before_trend_call" || row.action === "monitor_next_window") continue;
      actions.push({
        owner: row.action === "protect_winner_internal_links" ? "SEO operator" : "Content operator",
        action: `${row.action} for ${row.dimension} "${row.label}".`,
        evidenceRequired: `${trend.windowDays}-day GSC row with explicit same-dimension comparison; no query-page pairing.`,
      });
    }
  }

  for (const check of report.checks.filter((item) => item.status !== "PASS")) {
    actions.push({
      owner: "Technical SEO operator",
      action: `Resolve ${check.id}: ${check.issues.join(", ") || check.status}.`,
      evidenceRequired: "Fresh weekly-growth-ops JSON showing PASS or documented accepted WARNING.",
    });
  }

  return actions;
}

export async function buildWeeklyGrowthOpsReport(options = {}) {
  const root = path.resolve(options.root || projectRoot);
  const generatedAt = options.generatedAt || new Date().toISOString();
  const now = options.now || new Date(generatedAt);
  const gsc = await summarizeGscQueue(options.gscQueue ? path.resolve(options.gscQueue) : null);
  const gscTrends = await summarizeGscTrends(options);
  const gscIndexLedger = await summarizeGscIndexLedger(options.gscIndexLedger ? path.resolve(options.gscIndexLedger) : path.join(root, "docs", "evidence", "four-week-growth-20260927", "gsc-index-ledger.json"));
  const traffic = await summarizeTrafficBaseline(options.trafficReport ? path.resolve(options.trafficReport) : DEFAULT_TRAFFIC_REPORT, now);
  const contentAudit = await summarizeContentAudit(options.contentAudit ? path.resolve(options.contentAudit) : null);
  const ctaFunnel = await buildGrowthReportData({
    inputFile: options.ctaData ? path.resolve(options.ctaData) : path.join(root, ".private", "analytics", "production.jsonl"),
    environment: options.ctaEnvironment || "production",
    fromUtc: options.ctaFrom || null,
    toUtc: options.ctaTo || null,
  });
  const production = await summarizeProductionRuntime({
    root,
    versionFile: options.versionFile ? path.resolve(options.versionFile) : path.join(root, "dist", "client", "version.json"),
    productionHealth: options.productionHealth ? path.resolve(options.productionHealth) : path.join(root, "artifacts", "operational-health", "latest.json"),
    now,
    maxHealthAgeHours: options.maxHealthAgeHours,
  });
  const protectedHashes = await summarizeProtectedHashes(root, options.expectedProtectedHashes || DEFAULT_PROTECTED_HASHES);
  const aeoObservation = await buildAeoObservationReminders({
    root,
    aeoObservation: options.aeoObservation ? path.resolve(options.aeoObservation) : path.join(root, "docs", "evidence", "four-week-growth-20260927", "week3-aeo-public-search-observation-20260928.json"),
  });
  const checks = [
    await checkSitemap(root),
    await checkAiCrawlerAccess(root),
    await checkLlmsFiles(root),
    await checkCitationAssets(root),
    await checkSourceFreshness(root, now),
    await checkInvitationConstitution(root, { expectedPartnerRegistrySha256: options.expectedPartnerRegistrySha256 }),
  ];

  const hardBlocked = checks.some((check) => check.status === "BLOCKED");
  const needsReview = checks.some((check) => check.status === "NEEDS_REVIEW" || check.status === "WARNING")
    || gsc.status === "QUEUE_READY_WITH_BLOCKED_ROWS"
    || ctaFunnel.status === "INPUT_MISSING"
    || ctaFunnel.status === "INSUFFICIENT_SAMPLE"
    || ctaFunnel.weekOverWeek?.status === "RANGE_REQUIRED";
  const status = hardBlocked ? "BLOCKED" : needsReview ? "READY_WITH_REVIEW_ITEMS" : "READY";
  const report = {
    generatedAt,
    project: "NexuAlpha",
    status,
    boundary: "This report measures SEO/GEO/AEO operating readiness and supplied GSC opportunity data only. It does not claim registrations, commissions, AI citations, indexing success or conversion lift.",
    production,
    protectedHashes,
    gsc,
    gscIndexLedger,
    gscTrends,
    ctaFunnel,
    aeoObservation,
    traffic,
    contentAudit,
    checks,
  };
  report.contentPriorityQueue = buildContentPriorityQueue({ gsc, traffic });
  report.ownerPageBacklog = buildOwnerPageBacklog({ gsc, gscTrends, contentPriorityQueue: report.contentPriorityQueue });
  report.nextActions = nextActionsFrom(report);
  return report;
}

function fmt(value) {
  return value === null || value === undefined ? "unknown" : String(value);
}

function fmtDelta(value, direction = "higher") {
  if (value === null || value === undefined) return "unknown";
  const rounded = Math.round(value * 1000) / 1000;
  if (rounded === 0) return "0";
  const prefix = rounded > 0 ? "+" : "";
  if (direction === "position") return `${prefix}${rounded}`;
  return `${prefix}${rounded}`;
}

function renderTrendSection(lines, title, trend) {
  lines.push(`## ${title}`, "", `- Status: ${trend.status}`, `- Current rows: ${fmt(trend.totals.currentRows)}`, `- Previous rows: ${fmt(trend.totals.previousRows)}`, `- Compared rows: ${fmt(trend.totals.comparedRows)}`, `- Missing previous rows: ${fmt(trend.totals.missingPreviousRows)}`, `- Boundary: ${trend.boundary}`, "");
  if (!trend.rows.length) {
    lines.push("- Trend rows: unknown until current GSC input is supplied.", "");
    return;
  }

  lines.push("| Dimension | Row | Impr. | Δ Impr. | Clicks | Δ Clicks | Pos. | Δ Pos. | Status | Action |", "| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |");
  for (const row of trend.rows.slice(0, 10)) {
    lines.push(`| ${row.dimension} | ${row.label} | ${fmt(row.current.impressions)} | ${fmtDelta(row.delta.impressions)} | ${fmt(row.current.clicks)} | ${fmtDelta(row.delta.clicks)} | ${fmt(row.current.position)} | ${fmtDelta(row.delta.position, "position")} | ${row.status} | ${row.action} |`);
  }
  lines.push("");
}

function renderCtaFunnelSection(lines, ctaFunnel) {
  const sourceFiles = Array.isArray(ctaFunnel?.selection?.sourceFiles) ? ctaFunnel.selection.sourceFiles : [];
  const sourceNames = sourceFiles.map((file) => path.basename(file)).join(", ") || "unknown";
  lines.push(
    "## Private CTA Funnel",
    "",
    `- Status: ${ctaFunnel?.status || "INPUT_MISSING"}`,
    `- Environment: ${ctaFunnel?.selection?.environment || "production"}`,
    `- Source files: ${sourceFiles.length || "unknown"} (${sourceNames})`,
    `- Sample readiness: ${ctaFunnel?.sampleReadiness?.status || ctaFunnel?.status || "INPUT_MISSING"}`,
    `- Sample sessions: ${fmt(ctaFunnel?.sampleReadiness?.observedSessions)} / ${fmt(ctaFunnel?.sampleReadiness?.minimumSessions)}`,
    `- Sample boundary: ${ctaFunnel?.sampleReadiness?.boundary || "First-party CTA sample readiness only."}`,
    `- Events: ${fmt(ctaFunnel?.totals?.events)}`,
    `- Measurable sessions: ${fmt(ctaFunnel?.totals?.uniqueSessions)}`,
    `- Page views: ${fmt(ctaFunnel?.totals?.uniquePageViews)}`,
    `- Decisions: ${fmt(ctaFunnel?.totals?.decisionSelections)}`,
    `- Visible CTAs: ${fmt(ctaFunnel?.totals?.visibleCtas)}`,
    `- Outbound handoffs: ${fmt(ctaFunnel?.totals?.outboundHandoffs)}`,
    `- Referral clicks: ${fmt(ctaFunnel?.totals?.referralClicks)}`,
    "- Confirmed registrations: null",
    "- Partner KYC: null",
    "- Partner deposits: null",
    "- Partner trades: null",
    "- Partner commissions: null",
    "- Boundary: first-party onsite CTA events only; no partner registration, KYC, trade, deposit or commission claim.",
    "",
  );

  if (ctaFunnel?.dataQuality) {
    lines.push(
      "### CTA Data Quality",
      "",
      `- Status: ${ctaFunnel.dataQuality.status}`,
      `- Input rows: ${fmt(ctaFunnel.dataQuality.inputRows)}`,
      `- Valid rows: ${fmt(ctaFunnel.dataQuality.validRows)}`,
      `- Invalid rows: ${fmt(ctaFunnel.dataQuality.invalidRows)}`,
      `- Observed event types: ${ctaFunnel.dataQuality.observedEventTypes?.length ? ctaFunnel.dataQuality.observedEventTypes.join(", ") : "unknown"}`,
      `- Issues: ${ctaFunnel.dataQuality.issues?.length ? ctaFunnel.dataQuality.issues.join(", ") : "none"}`,
      `- Boundary: ${ctaFunnel.dataQuality.boundary}`,
      "",
    );
  }

  const wow = ctaFunnel?.weekOverWeek || { status: "INPUT_MISSING", notes: ["CTA input is missing; movement is unknown."] };
  lines.push(`### CTA Week-over-week`, "", `- Status: ${wow.status}`, "");
  if (wow.status === "READY") {
    lines.push(
      `- Current: ${wow.window.currentFromUtc} to ${wow.window.currentToUtc} exclusive`,
      `- Previous: ${wow.window.previousFromUtc} to ${wow.window.previousToUtc} exclusive`,
      "",
      "| Metric | Current | Previous | Delta |",
      "| --- | ---: | ---: | ---: |",
    );
    for (const key of Object.keys(wow.current)) lines.push(`| ${key} | ${wow.current[key]} | ${wow.previous[key]} | ${wow.delta[key]} |`);
    lines.push("");
  } else {
    for (const note of wow.notes || []) lines.push(`- ${note}`);
    lines.push("");
  }

  if (ctaFunnel?.byCountry?.length) {
    lines.push("| Country | Market | Sessions | Page views | Decisions | Referral clicks |", "| --- | --- | ---: | ---: | ---: | ---: |");
    for (const item of ctaFunnel.byCountry.slice(0, 8)) lines.push(`| ${item.country} | ${item.market} | ${item.uniqueSessions} | ${item.uniquePageViews} | ${item.decisionSelections} | ${item.referralClicks} |`);
    lines.push("");
  }

  if (ctaFunnel?.byPlatform?.length) {
    lines.push("| Platform | Sessions | Decisions | Visible CTAs | Outbound handoffs | Referral clicks |", "| --- | ---: | ---: | ---: | ---: | ---: |");
    for (const item of ctaFunnel.byPlatform.slice(0, 8)) lines.push(`| ${item.platform} | ${item.uniqueSessions} | ${item.decisionSelections} | ${item.visibleCtas} | ${item.outboundHandoffs} | ${item.referralClicks} |`);
    lines.push("");
  }

  const journey = ctaFunnel?.onsiteJourney || { status: "INPUT_MISSING", boundary: "CTA input is missing; onsite journey is unknown." };
  lines.push(
    "### Onsite CTA Journey",
    "",
    `- Status: ${journey.status}`,
    `- Telegram handoffs: ${fmt(ctaFunnel?.totals?.telegramHandoffs)}`,
    `- Telegram return sessions: ${fmt(journey.telegramReturn?.sessions)}`,
    `- Telegram return decision rate: ${fmt(journey.telegramReturn?.decisionRate)}`,
    `- Telegram return referral-click rate: ${fmt(journey.telegramReturn?.referralClickRate)}`,
    `- Boundary: ${journey.boundary}`,
    "",
  );
  if (Array.isArray(journey.stages)) {
    lines.push("| Stage | Sessions | Page views | Decisions | Outbound handoffs | Referral clicks |", "| --- | ---: | ---: | ---: | ---: | ---: |");
    for (const item of journey.stages.slice(0, 8)) lines.push(`| ${item.id} | ${item.sessions} | ${item.pageViews} | ${item.decisions} | ${item.outboundHandoffs} | ${item.referralClicks} |`);
    lines.push("");
  }
  if (Array.isArray(journey.byMarketProduct) && journey.byMarketProduct.length) {
    lines.push("| Market | Product | Region/product | Shortlist | Compare | Detail | External handoff | Telegram return | Referral clicks |", "| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |");
    for (const item of journey.byMarketProduct.slice(0, 8)) lines.push(`| ${item.market} | ${item.product} | ${item.regionalProductSelectionSessions} | ${item.shortlistSessions} | ${item.compareSessions} | ${item.detailSessions} | ${item.externalHandoffSessions} | ${item.telegramReturnSessions} | ${item.referralClicks} |`);
    lines.push("");
  }

  const telegram = ctaFunnel?.telegramSignals || { status: "INPUT_MISSING", boundary: "CTA input is missing; Telegram signals are unknown." };
  lines.push(
    "### Telegram Signals",
    "",
    `- Status: ${telegram.status}`,
    `- Handoff sessions: ${fmt(telegram.handoffSessions)}`,
    `- Return sessions: ${fmt(telegram.returnSessions)}`,
    `- Return decision sessions: ${fmt(telegram.returnDecisionSessions)}`,
    `- Return referral-click sessions: ${fmt(telegram.returnReferralClickSessions)}`,
    `- Return referral clicks: ${fmt(telegram.returnReferralClicks)}`,
    `- Boundary: ${telegram.boundary}`,
    "",
  );
  if (Array.isArray(telegram.byEntry) && telegram.byEntry.length) {
    lines.push("| Entry | Page | Market | Product | Return sessions | Decisions | Referral-click sessions | Referral clicks | Partner registrations | Partner commissions |", "| --- | --- | --- | --- | ---: | ---: | ---: | ---: | --- | --- |");
    for (const item of telegram.byEntry.slice(0, 8)) lines.push(`| ${item.entry} | ${item.page} | ${item.market} | ${item.product} | ${item.returnSessions} | ${item.decisions} | ${item.referralClickSessions} | ${item.referralClicks} | ${fmt(item.partnerRegistrations)} | ${fmt(item.partnerCommissions)} |`);
    lines.push("");
  }

  const dropOff = ctaFunnel?.dropOffQueues || { status: "INPUT_MISSING", boundary: "CTA input is missing; drop-off queues are unknown." };
  lines.push(
    "### CTA Drop-off Queues",
    "",
    `- Status: ${dropOff.status}`,
    `- Boundary: ${dropOff.boundary}`,
    "",
  );
  renderDropOffQueueTable(lines, "visible_no_click_pages", dropOff.visible_no_click_pages, ["page", "market", "product", "visibleCtas", "referralClicks", "dropOffCtaViews"]);
  renderDropOffQueueTable(lines, "decision_no_handoff_pages", dropOff.decision_no_handoff_pages, ["page", "market", "product", "decisionSelections", "outboundHandoffs", "referralClicks", "dropOffDecisions"]);
  renderDropOffQueueTable(lines, "telegram_entry_no_decision", dropOff.telegram_entry_no_decision, ["entry", "page", "market", "product", "entrySessions", "decisionSelections", "dropOffSessions"]);
  renderDropOffQueueTable(lines, "platform_visible_no_click", dropOff.platform_visible_no_click, ["platform", "visibleCtas", "referralClicks", "dropOffCtaViews"]);
}

function renderDropOffQueueTable(lines, title, rows, columns) {
  lines.push(`#### ${title}`, "");
  if (!Array.isArray(rows)) {
    lines.push("- Rows: unknown.", "");
    return;
  }
  if (!rows.length) {
    lines.push("- Rows: none recorded in selection.", "");
    return;
  }
  lines.push(`| ${columns.join(" | ")} |`, `| ${columns.map(() => "---").join(" | ")} |`);
  for (const row of rows.slice(0, 8)) lines.push(`| ${columns.map((column) => row[column] ?? "unknown").join(" | ")} |`);
  lines.push("");
}

function unknownTrend(windowDays) {
  return {
    status: "UNKNOWN_GSC_TREND",
    windowDays,
    boundary: "Trend movement is unknown because the current GSC export was not supplied. Missing data is not treated as zero.",
    totals: { currentRows: null, previousRows: null, comparedRows: null, missingPreviousRows: null },
    rows: [],
  };
}

export function renderWeeklyGrowthMarkdown(report) {
  const lines = [
    "# NexuAlpha Weekly SEO/GEO/AEO Growth Ops",
    "",
    `Generated: ${report.generatedAt}`,
    `Status: ${report.status}`,
    "",
    `Boundary: ${report.boundary}`,
    "",
    "## Production Version and Health",
    "",
    `- Status: ${report.production?.status || "UNKNOWN_RUNTIME_INPUT"}`,
    `- Package version: ${fmt(report.production?.packageVersion)}`,
    `- Build ID: ${fmt(report.production?.buildId)}`,
    `- Health status: ${report.production?.health?.status || "UNKNOWN_HEALTH_INPUT"}`,
    `- Health generated: ${fmt(report.production?.health?.generatedAt)}`,
    `- Health source: ${fmt(report.production?.health?.source)}`,
    `- Health age hours: ${fmt(report.production?.health?.ageHours)}`,
    `- Health stale: ${fmt(report.production?.health?.stale)}`,
    `- Health base URL: ${fmt(report.production?.health?.baseUrl)}`,
    `- Health failures: ${report.production?.health?.failures?.length ? report.production.health.failures.join(", ") : "none"}`,
    `- Web live: ${fmt(report.production?.health?.web?.live?.status || report.production?.health?.web?.live?.httpStatus)}`,
    `- Web ready: ${fmt(report.production?.health?.web?.ready?.status || report.production?.health?.web?.ready?.httpStatus)}`,
    `- CTA ready: ${fmt(report.production?.health?.cta?.status || report.production?.health?.cta?.httpStatus)}`,
    `- Error monitor ready: ${fmt(report.production?.health?.errors?.status || report.production?.health?.errors?.httpStatus)}`,
    `- Core readiness: ${fmt(report.production?.health?.core?.status || report.production?.health?.core?.reasonCode || report.production?.health?.core?.httpStatus)}`,
    `- Optional degraded: ${report.production?.health?.degradedOptionalDependencies?.length ? report.production.health.degradedOptionalDependencies.join(", ") : "none"}`,
    `- Recovery condition: ${fmt(report.production?.health?.recovery?.condition)}`,
    `- Boundary: ${report.production?.boundary || "Production/candidate runtime evidence was not supplied."}`,
    "",
    "## Protected Commercial Hashes",
    "",
    `- Status: ${report.protectedHashes?.status || "UNKNOWN_PROTECTED_HASHES"}`,
    `- Boundary: ${report.protectedHashes?.boundary || "Protected hash evidence was not supplied."}`,
    "",
    "| File | Status | SHA-256 |",
    "| --- | --- | --- |",
  ];

  for (const record of report.protectedHashes?.records || []) {
    lines.push(`| ${record.path} | ${record.status} | ${record.actualSha256 || "missing"} |`);
  }
  lines.push(
    "",
    "## GSC Index Ledger",
    "",
    `- Status: ${report.gscIndexLedger?.status || "UNKNOWN_GSC_INDEX_LEDGER"}`,
    `- Sitemap URLs: ${fmt(report.gscIndexLedger?.totals?.sitemapUrls)}`,
    `- GSC URL rows: ${fmt(report.gscIndexLedger?.totals?.gscRows)}`,
    `- Indexed rows: ${fmt(report.gscIndexLedger?.totals?.indexedRows)}`,
    `- Unknown rows: ${fmt(report.gscIndexLedger?.totals?.unknownRows)}`,
    `- Boundary: ${report.gscIndexLedger?.inputBoundary || "URL-level indexing state remains unknown until a GSC export is supplied."}`,
    "",
    "## GSC Opportunity Input",
    "",
    `- Status: ${report.gsc.status}`,
    `- Input rows: ${fmt(report.gsc.totals.inputRows)}`,
    `- Ranked rows: ${fmt(report.gsc.totals.rankedRows)}`,
    `- Blocked rows: ${fmt(report.gsc.totals.blockedRows)}`,
    "",
  );

  if (report.gsc.topOpportunities.length) {
    lines.push("| Priority | Page | Query | Market | Position | CTR | Action |", "| ---: | --- | --- | --- | ---: | ---: | --- |");
    for (const item of report.gsc.topOpportunities) {
      const ctr = item.ctr === null ? "unknown" : `${Math.round(item.ctr * 10_000) / 100}%`;
      lines.push(`| ${item.priority} | ${fmt(item.page)} | ${fmt(item.query)} | ${fmt(item.market)} | ${fmt(item.position)} | ${ctr} | ${fmt(item.action)} |`);
    }
    lines.push("");
    const briefs = report.gsc.topOpportunities.filter((item) => item.contentBrief);
    if (briefs.length) {
      lines.push("### Search Content Briefs", "");
      for (const item of briefs) {
        lines.push(
          `- **${fmt(item.query || item.page)}**`,
          `  - Required sections: ${item.contentBrief.requiredSections.length ? item.contentBrief.requiredSections.join(", ") : "review required"}`,
          `  - Schema candidates: ${item.contentBrief.schemaCandidates.length ? item.contentBrief.schemaCandidates.join(", ") : "none"}`,
          `  - Boundary: ${item.contentBrief.boundary}`,
        );
      }
      lines.push("");
    }
  } else {
    lines.push("- Top opportunities: unknown until a GSC queue is supplied.", "");
  }

  const gscTrends = report.gscTrends || { sevenDay: unknownTrend(7), twentyEightDay: unknownTrend(28) };
  renderTrendSection(lines, "GSC 7-Day Trend", gscTrends.sevenDay);
  renderTrendSection(lines, "GSC 28-Day Trend", gscTrends.twentyEightDay);
  renderCtaFunnelSection(lines, report.ctaFunnel);

  lines.push(
    "## AEO Query Reminders",
    "",
    `- Status: ${report.aeoObservation?.status || "UNKNOWN_AEO_BASELINE"}`,
    `- Baseline reviewed: ${fmt(report.aeoObservation?.baselineReviewedAt)}`,
    `- Last observed: ${fmt(report.aeoObservation?.lastObservedAt)}`,
    `- Last observed queries: ${fmt(report.aeoObservation?.lastSummary?.queries)}`,
    `- Last NexuAlpha observed: ${fmt(report.aeoObservation?.lastSummary?.nexualphaObserved)}`,
    `- Answer-engine citation claims: ${fmt(report.aeoObservation?.lastSummary?.answerEngineCitationClaims)}`,
    `- Boundary: ${report.aeoObservation?.boundary || "AEO query baseline was not supplied."}`,
    "",
  );
  if (report.aeoObservation?.reminders?.length) {
    lines.push("| Query ID | Previous status | Target | Query |", "| --- | --- | --- | --- |");
    for (const item of report.aeoObservation.reminders.slice(0, 10)) {
      lines.push(`| ${item.id} | ${item.previousStatus} | ${item.targetUrl} | ${item.query} |`);
    }
    lines.push("");
  } else {
    lines.push("- Query reminders: unknown until the AEO baseline module is readable.", "");
  }

  lines.push(
    "## Indexable Content Quality",
    "",
    `- Status: ${report.contentAudit?.status || "UNKNOWN_CONTENT_AUDIT"}`,
    `- Gate: ${report.contentAudit?.gate || "UNKNOWN"}`,
    `- High-confidence signals: ${fmt(report.contentAudit?.highConfidenceSignals)}`,
    `- Description signals: ${fmt(report.contentAudit?.mediumSignals)}`,
    `- Advisory title/H1 signals: ${fmt(report.contentAudit?.advisorySignals)}`,
    `- Boundary: ${report.contentAudit?.summary || "Content-quality evidence was not supplied."}`,
    "",
    "## Anonymous Server Request Baseline",
    "",
    `- Status: ${report.traffic.status}`,
    `- Report age: ${fmt(report.traffic.ageDays)} days`,
    `- Parsed requests: ${fmt(report.traffic.totals.parsedRequests)}`,
    `- HTTP 404 requests: ${fmt(report.traffic.statuses["404"])}`,
    `- Automated-browser HTML requests: ${fmt(report.traffic.htmlTrafficClasses?.automationHtmlRequests)}`,
    `- Known-crawler HTML requests: ${fmt(report.traffic.htmlTrafficClasses?.knownCrawlerHtmlRequests)}`,
    `- Other anonymous HTML requests: ${fmt(report.traffic.htmlTrafficClasses?.otherHtmlRequests)}`,
    "- Boundary: request counts are not unique users; crawler labels are unverified user-agent strings.",
    "",
  );
  if (report.traffic.topHtmlPaths.length) {
    lines.push("| Other anonymous content-like path | Requests |", "| --- | ---: |");
    for (const item of report.traffic.topHtmlPaths) lines.push(`| ${item.path} | ${item.requests} |`);
    lines.push("");
  }

  lines.push("## Evidence-led Content Queue", "", "This queue merges supplied GSC rows with anonymous request and crawler-path evidence. It is a planning queue, not a user or conversion report.", "");
  if (report.contentPriorityQueue?.length) {
    lines.push("| Priority | Path | GSC position | GSC CTR | Other anonymous requests | Known crawler requests | Action |", "| ---: | --- | ---: | ---: | ---: | ---: | --- |");
    report.contentPriorityQueue.forEach((item, index) => {
      const ctr = item.gsc?.ctr === null || item.gsc?.ctr === undefined ? "unknown" : `${Math.round(item.gsc.ctr * 10_000) / 100}%`;
      lines.push(`| ${index + 1} | ${item.path} | ${fmt(item.gsc?.position)} | ${ctr} | ${fmt(item.otherAnonymousRequests)} | ${item.knownCrawlerRequests} | ${item.action} |`);
    });
    lines.push("");
  } else {
    lines.push("- No page-level evidence was supplied; content priority remains unknown.", "");
  }

  lines.push("## Owner Page Backlog", "", `- Status: ${report.ownerPageBacklog?.status || "UNKNOWN_OWNER_PAGE_BACKLOG"}`, `- Items: ${fmt(report.ownerPageBacklog?.totals?.items)}`, `- GSC items: ${fmt(report.ownerPageBacklog?.totals?.gscItems)}`, `- Boundary: ${report.ownerPageBacklog?.boundary || "Owner-page execution evidence was not supplied."}`, "");
  if (report.ownerPageBacklog?.rows?.length) {
    lines.push("| Priority | Owner | Page | Query | Source | Required sections | Action | Evidence |", "| ---: | --- | --- | --- | --- | --- | --- | --- |");
    for (const item of report.ownerPageBacklog.rows) {
      lines.push(`| ${item.priority} | ${item.owner} | ${item.page} | ${fmt(item.query)} | ${item.source} | ${item.requiredSections.join(", ")} | ${item.action} | ${item.evidenceRequired} |`);
    }
    lines.push("");
  } else {
    lines.push("- No owner-page backlog can be built until page-level GSC, trend or request evidence is supplied.", "");
  }

  lines.push("## Weekly Checklist", "", "| Check | Status | Issues |", "| --- | --- | --- |");
  for (const check of report.checks) {
    lines.push(`| ${check.id} | ${check.status} | ${check.issues.length ? check.issues.join(", ") : "none"} |`);
  }
  lines.push("", "## Next Actions", "");
  for (const action of report.nextActions) {
    lines.push(`- ${action.owner}: ${action.action} Evidence: ${action.evidenceRequired}`);
  }
  lines.push("");
  return `${lines.join("\n")}\n`;
}

export async function writeWeeklyGrowthOpsReport(options = {}) {
  const report = await buildWeeklyGrowthOpsReport(options);
  const output = path.resolve(options.output || DEFAULT_OUTPUT);
  const markdown = path.resolve(options.markdown || DEFAULT_MARKDOWN);
  await mkdir(path.dirname(output), { recursive: true });
  await mkdir(path.dirname(markdown), { recursive: true });
  await writeFile(output, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await writeFile(markdown, renderWeeklyGrowthMarkdown(report), "utf8");
  return { report, output, markdown };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) {
      printHelp();
    } else {
      const { report, output, markdown } = await writeWeeklyGrowthOpsReport(options);
      console.log(`Weekly growth ops: ${report.status}`);
      console.log(`JSON: ${output}`);
      console.log(`Markdown: ${markdown}`);
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
