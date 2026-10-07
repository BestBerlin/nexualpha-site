#!/usr/bin/env node

import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { CTA_ENVIRONMENTS, validateCta } from "../server/cta-collector.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, "..");
const defaultEvidenceDir = path.join(projectRoot, "docs", "evidence", "four-week-growth-20260927");
const defaultOutput = path.join(defaultEvidenceDir, "direct-home-funnel-diagnostic.json");
const defaultMarkdown = path.join(defaultEvidenceDir, "direct-home-funnel-diagnostic.md");
const DEFAULT_HOME_PAGES = ["/"];
const DEFAULT_MIN_SESSIONS = 10;
const DEFAULT_COMPARE_PATH_RE = /^\/(?:compare|br\/comparar)(?:\/|$)/;
const DEFAULT_DETAIL_PATH_RE = /^\/exchanges\/[a-z0-9-]+(?:\/|$)/;
const PARTNER_SIDE_OUTCOMES = Object.freeze({
  registrations: null,
  kyc: null,
  deposits: null,
  trades: null,
  commissions: null,
  status: "UNAVAILABLE",
  reason: "Direct-home diagnostics use first-party CTA events only; no partner-side conversion source is connected.",
});

function parseArgs(argv) {
  const options = {
    ctaData: process.env.CTA_DATA_FILE || path.join(projectRoot, ".private", "analytics", "production.jsonl"),
    environment: process.env.GROWTH_REPORT_ENVIRONMENT || process.env.CTA_ENVIRONMENT || "production",
    fromUtc: process.env.GROWTH_REPORT_FROM_UTC || null,
    toUtc: process.env.GROWTH_REPORT_TO_UTC || null,
    minSessions: DEFAULT_MIN_SESSIONS,
    homePages: [...DEFAULT_HOME_PAGES],
    output: defaultOutput,
    markdown: defaultMarkdown,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => {
      index += 1;
      if (index >= argv.length) throw new Error(`${arg} requires a value`);
      return argv[index];
    };

    if (arg === "--cta-data") options.ctaData = path.resolve(next());
    else if (arg === "--environment") options.environment = next();
    else if (arg === "--from-utc") options.fromUtc = next();
    else if (arg === "--to-utc") options.toUtc = next();
    else if (arg === "--min-sessions") options.minSessions = Number.parseInt(next(), 10);
    else if (arg === "--home-page") options.homePages.push(next());
    else if (arg === "--output") options.output = path.resolve(next());
    else if (arg === "--markdown") options.markdown = path.resolve(next());
    else if (arg === "--help" || arg === "-h") options.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }

  options.homePages = [...new Set(options.homePages)];
  if (!CTA_ENVIRONMENTS.has(options.environment)) throw new Error("DIRECT_FUNNEL_ENVIRONMENT_INVALID");
  if (!Number.isInteger(options.minSessions) || options.minSessions < 1) throw new Error("DIRECT_FUNNEL_MIN_SESSIONS_INVALID");
  if (!options.homePages.length || options.homePages.some((page) => typeof page !== "string" || !page.startsWith("/"))) {
    throw new Error("DIRECT_FUNNEL_HOME_PAGE_INVALID");
  }
  parseUtc(options.fromUtc, "FROM");
  parseUtc(options.toUtc, "TO");
  const from = options.fromUtc ? Date.parse(normalizeUtc(options.fromUtc)) : null;
  const to = options.toUtc ? Date.parse(normalizeUtc(options.toUtc)) : null;
  if (from !== null && to !== null && from >= to) throw new Error("DIRECT_FUNNEL_RANGE_INVALID");
  return options;
}

function printHelp() {
  console.log([
    "Usage: node scripts/direct-home-funnel-diagnostic.mjs --cta-data <production.jsonl> [options]",
    "",
    "Builds a fail-closed diagnostic for direct homepage sessions using private first-party CTA JSONL.",
    "Outputs aggregate session/page/device/locale/CTA visibility/decision/referral buckets only.",
    "",
    "Options:",
    "  --cta-data <file>      Private CTA JSONL input. Defaults to CTA_DATA_FILE or .private/analytics/production.jsonl.",
    "  --environment <env>    CTA environment. Default: production.",
    "  --from-utc <utc>       Inclusive UTC window start.",
    "  --to-utc <utc>         Exclusive UTC window end.",
    "  --min-sessions <n>     Minimum direct homepage sessions before READY. Default: 10.",
    "  --home-page <path>     Homepage path to include. Can be repeated; / is always included by default.",
    "  --output <file>        JSON output path.",
    "  --markdown <file>      Markdown output path.",
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

function normalizeUtc(value) {
  return value?.replace(/(?<=:\d{2})Z$/, ".000Z") || value;
}

function parseUtc(value, label) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string"
    || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)
    || !Number.isFinite(Date.parse(value))
    || new Date(value).toISOString() !== normalizeUtc(value)) {
    throw new Error(`DIRECT_FUNNEL_${label}_UTC_INVALID`);
  }
  return Date.parse(value);
}

function toClientEvent(row) {
  const { receivedAt, environment, ...event } = row || {};
  void receivedAt;
  void environment;
  return event;
}

async function readRows(filePath) {
  let text = "";
  try {
    text = await readFile(filePath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return { missing: true, rows: [], invalidJsonRows: 0 };
    throw error;
  }

  let invalidJsonRows = 0;
  const rows = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      rows.push(JSON.parse(line));
    } catch {
      invalidJsonRows += 1;
    }
  }
  return { missing: false, rows, invalidJsonRows };
}

function addToSet(map, key, value) {
  const bucket = map.get(key) || new Set();
  bucket.add(value);
  map.set(key, bucket);
}

function addMetricBucket(map, key, identity, row) {
  const bucket = map.get(key) || {
    ...identity,
    _sessions: new Set(),
    _pageViews: new Set(),
    _ctaVisible: new Set(),
    _decisions: new Set(),
    _outboundHandoffs: new Set(),
    _referralClicks: new Set(),
  };
  bucket._sessions.add(row.session);
  if (row.type === "page_view") bucket._pageViews.add(`${row.session}|${row.page}|${row.market}|${row.product}|${row.accountStage || "unknown"}`);
  if (row.type === "cta_visible") bucket._ctaVisible.add(`${row.session}|${row.page}|${row.platform}|${row.placement}`);
  if (row.type === "decision_select") bucket._decisions.add(`${row.session}|${row.page}|${row.decision}|${row.placement}`);
  if (row.type === "outbound_handoff") bucket._outboundHandoffs.add(`${row.session}|${row.page}|${row.platform}|${row.placement}`);
  if (row.type === "referral_click") bucket._referralClicks.add(`${row.session}|${row.platform}`);
  map.set(key, bucket);
}

function serializeMetricBuckets(map, identitySorter = (row) => JSON.stringify(row)) {
  return [...map.values()].map((bucket) => ({
    ...Object.fromEntries(Object.entries(bucket).filter(([key]) => !key.startsWith("_"))),
    sessions: bucket._sessions.size,
    pageViews: bucket._pageViews.size,
    ctaVisible: bucket._ctaVisible.size,
    decisions: bucket._decisions.size,
    outboundHandoffs: bucket._outboundHandoffs.size,
    referralClicks: bucket._referralClicks.size,
  })).sort((left, right) => right.referralClicks - left.referralClicks
    || right.outboundHandoffs - left.outboundHandoffs
    || right.decisions - left.decisions
    || right.ctaVisible - left.ctaVisible
    || right.pageViews - left.pageViews
    || right.sessions - left.sessions
    || identitySorter(left).localeCompare(identitySorter(right)));
}

function ratio(numerator, denominator) {
  return denominator > 0 ? Number((numerator / denominator).toFixed(4)) : null;
}

function sessionSummary(events) {
  const pages = new Set();
  let device = "unknown";
  let locale = "unknown";
  let homePage = null;
  const ctaVisible = new Set();
  const decisions = new Set();
  const outboundHandoffs = new Set();
  const referralClicks = new Set();
  for (const event of events) {
    if (event.type === "page_view") {
      pages.add(event.page);
      if (device === "unknown" && event.device) device = event.device;
      if (locale === "unknown" && event.locale) locale = event.locale;
      if (!homePage) homePage = event.page;
    }
    if (event.type === "cta_visible") ctaVisible.add(`${event.platform}|${event.placement}`);
    if (event.type === "decision_select") decisions.add(`${event.decision}|${event.placement}`);
    if (event.type === "outbound_handoff") outboundHandoffs.add(`${event.platform}|${event.placement}`);
    if (event.type === "referral_click") referralClicks.add(event.platform);
  }
  return { pages, device, locale, homePage, ctaVisible, decisions, outboundHandoffs, referralClicks };
}

function isComparePath(page) {
  return DEFAULT_COMPARE_PATH_RE.test(String(page || ""));
}

function isDetailPath(page) {
  return DEFAULT_DETAIL_PATH_RE.test(String(page || ""));
}

function buildPathQuality(sessionSummaries) {
  const sessions = sessionSummaries.length;
  const homeToCompareSessions = sessionSummaries.filter((summary) => [...summary.pages].some(isComparePath)).length;
  const homeToDetailSessions = sessionSummaries.filter((summary) => [...summary.pages].some(isDetailPath)).length;
  const completePathSessions = sessionSummaries.filter((summary) => [...summary.pages].some(isComparePath)
    && [...summary.pages].some(isDetailPath)
    && summary.referralClicks.size > 0).length;
  const issues = [];
  if (sessions > 0 && homeToCompareSessions === 0) issues.push("no_compare_step_observed");
  if (sessions > 0 && homeToDetailSessions === 0) issues.push("no_detail_step_observed");
  if (sessions > 0 && completePathSessions === 0) issues.push("no_complete_home_compare_detail_referral_path");
  return {
    status: issues.length ? "NEEDS_REVIEW" : "PASS",
    sessions,
    homeToCompareSessions,
    homeToDetailSessions,
    completePathSessions,
    homeToCompareRate: ratio(homeToCompareSessions, sessions),
    homeToDetailRate: ratio(homeToDetailSessions, sessions),
    completePathRate: ratio(completePathSessions, sessions),
    expectedPath: "home_page_view -> compare_page_view -> exchange_detail_page_view -> referral_click",
    boundary: "Path quality is based on first-party page_view and referral_click events only; it does not prove registration, KYC, deposit, trade or commission.",
    issues,
  };
}

export async function buildDirectHomeFunnelDiagnostic(options = {}) {
  const ctaData = options.ctaData || process.env.CTA_DATA_FILE || path.join(projectRoot, ".private", "analytics", "production.jsonl");
  const environment = options.environment || process.env.GROWTH_REPORT_ENVIRONMENT || process.env.CTA_ENVIRONMENT || "production";
  if (!CTA_ENVIRONMENTS.has(environment)) throw new Error("DIRECT_FUNNEL_ENVIRONMENT_INVALID");
  const from = parseUtc(options.fromUtc ?? null, "FROM");
  const to = parseUtc(options.toUtc ?? null, "TO");
  if (from !== null && to !== null && from >= to) throw new Error("DIRECT_FUNNEL_RANGE_INVALID");
  const homePages = [...new Set(options.homePages || DEFAULT_HOME_PAGES)];
  const minSessions = Number.isInteger(options.minSessions) ? options.minSessions : DEFAULT_MIN_SESSIONS;
  if (minSessions < 1) throw new Error("DIRECT_FUNNEL_MIN_SESSIONS_INVALID");

  const input = await readRows(ctaData);
  const base = {
    generatedAt: options.generatedAt || new Date().toISOString(),
    status: "INPUT_MISSING",
    sourceFile: path.resolve(ctaData),
    boundary: "First-party CTA JSONL aggregate only. Counts are sessions and events, not verified people, accounts, registrations, deposits, trades, commissions or partner-side conversion.",
    selection: {
      environment,
      fromUtc: from === null ? null : new Date(from).toISOString(),
      toUtc: to === null ? null : new Date(to).toISOString(),
      endExclusive: true,
      source: "direct",
      homePages,
      minSessions,
    },
    quality: {
      inputRows: input.rows.length + input.invalidJsonRows,
      validRows: 0,
      invalidRows: input.invalidJsonRows,
      selectedRows: 0,
    },
    instrumentation: {
      ctaVisibility: {
        status: "INPUT_MISSING",
        observedEvents: null,
        affectedDirectHomeSessions: null,
        reason: "CTA input file is missing.",
      },
    },
    totals: {
      directHomeSessions: null,
      pageViews: null,
      sessionsWithCtaVisible: null,
      sessionsWithDecision: null,
      sessionsWithOutboundHandoff: null,
      sessionsWithReferralClick: null,
      confirmedRegistrations: null,
    },
    partnerSideOutcomes: { ...PARTNER_SIDE_OUTCOMES },
    pathQuality: {
      status: "INPUT_MISSING",
      sessions: null,
      homeToCompareSessions: null,
      homeToDetailSessions: null,
      completePathSessions: null,
      homeToCompareRate: null,
      homeToDetailRate: null,
      completePathRate: null,
      expectedPath: "home_page_view -> compare_page_view -> exchange_detail_page_view -> referral_click",
      boundary: "Input is missing; path quality is unknown, not zero.",
      issues: ["input_missing"],
    },
    funnel: {
      ctaVisiblePerDirectHomeSession: null,
      decisionPerDirectHomeSession: null,
      referralPerDirectHomeSession: null,
      referralPerCtaVisibleSession: null,
      outboundPerReferralSession: null,
    },
    byPage: [],
    byDevice: [],
    byLocale: [],
    ctaVisibility: [],
    decisions: [],
    referrals: [],
    sessionPaths: [],
    notes: [
      "Missing input is unknown, not zero.",
      "Sample gates block interpretation when direct homepage sessions are below the configured minimum.",
      "This diagnostic never exposes raw event rows, referrers, IPs, emails, partner account identifiers, invitation links or commission data.",
    ],
  };

  if (input.missing) return base;

  const validRows = [];
  for (const row of input.rows) {
    const valid = validateCta(toClientEvent(row))
      && (row.environment || "local-preview") === environment
      && Number.isFinite(Date.parse(row.receivedAt));
    if (valid) validRows.push(row);
  }
  const selectedRows = validRows.filter((row) => {
    const timestamp = Date.parse(row.receivedAt);
    return (from === null || timestamp >= from) && (to === null || timestamp < to);
  });
  base.quality.validRows = validRows.length;
  base.quality.invalidRows = input.rows.length - validRows.length + input.invalidJsonRows;
  base.quality.selectedRows = selectedRows.length;

  const homeSessionIds = new Set(selectedRows
    .filter((row) => row.type === "page_view" && row.source === "direct" && homePages.includes(row.page))
    .map((row) => row.session));
  const sessionRows = selectedRows.filter((row) => homeSessionIds.has(row.session));
  const eventsBySession = new Map();
  for (const row of sessionRows) {
    const rows = eventsBySession.get(row.session) || [];
    rows.push(row);
    eventsBySession.set(row.session, rows);
  }

  const byPage = new Map();
  const byDevice = new Map();
  const byLocale = new Map();
  const ctaVisibility = new Map();
  const decisions = new Map();
  const referrals = new Map();
  const pathBuckets = new Map();
  const sessionsWithCtaVisible = new Set();
  const sessionsWithDecision = new Set();
  const sessionsWithOutboundHandoff = new Set();
  const sessionsWithReferralClick = new Set();
  let pageViews = 0;

  for (const row of sessionRows) {
    const device = row.device || "unknown";
    const locale = row.locale || "unknown";
    addMetricBucket(byPage, row.page, { page: row.page }, row);
    addMetricBucket(byDevice, device, { device }, row);
    addMetricBucket(byLocale, locale, { locale }, row);
    if (row.type === "page_view") pageViews += 1;
    if (row.type === "cta_visible") {
      sessionsWithCtaVisible.add(row.session);
      addMetricBucket(ctaVisibility, `${row.platform}|${row.placement}|${row.page}`, {
        platform: row.platform,
        placement: row.placement,
        page: row.page,
      }, row);
    }
    if (row.type === "decision_select") {
      sessionsWithDecision.add(row.session);
      addMetricBucket(decisions, `${row.decision}|${row.placement}|${row.page}`, {
        decision: row.decision,
        placement: row.placement,
        page: row.page,
      }, row);
    }
    if (row.type === "outbound_handoff") sessionsWithOutboundHandoff.add(row.session);
    if (row.type === "referral_click") {
      sessionsWithReferralClick.add(row.session);
      addMetricBucket(referrals, `${row.platform}|${row.placement}|${row.page}`, {
        platform: row.platform,
        placement: row.placement,
        page: row.page,
      }, row);
    }
  }

  for (const [session, events] of eventsBySession) {
    const summary = sessionSummary(events.sort((a, b) => String(a.receivedAt || "").localeCompare(String(b.receivedAt || ""))));
    const pathKey = [...summary.pages].join(" > ") || "unknown";
    addToSet(pathBuckets, pathKey, session);
  }

  const directHomeSessions = homeSessionIds.size;
  const sessionSummaries = [...eventsBySession.values()].map((events) => sessionSummary(events));
  const pathQuality = buildPathQuality(sessionSummaries);
  const ctaVisibilityObserved = sessionsWithCtaVisible.size > 0;
  const applyVisibilityUnknown = (rows) => rows.map((row) => ctaVisibilityObserved ? row : { ...row, ctaVisible: null });
  return {
    ...base,
    status: directHomeSessions < minSessions ? "INSUFFICIENT_SAMPLE"
      : ctaVisibilityObserved ? "READY" : "READY_WITH_VISIBILITY_INPUT_MISSING",
    instrumentation: {
      ctaVisibility: {
        status: ctaVisibilityObserved ? "RECORDED_EVENTS" : "INPUT_MISSING",
        observedEvents: ctaVisibilityObserved ? sessionsWithCtaVisible.size : 0,
        affectedDirectHomeSessions: directHomeSessions,
        reason: ctaVisibilityObserved
          ? "At least one cta_visible event was recorded inside direct homepage sessions."
          : "No cta_visible events were recorded inside direct homepage sessions. Visibility rate is unknown, not zero.",
      },
    },
    totals: {
      directHomeSessions,
      pageViews,
      sessionsWithCtaVisible: ctaVisibilityObserved ? sessionsWithCtaVisible.size : null,
      sessionsWithDecision: sessionsWithDecision.size,
      sessionsWithOutboundHandoff: sessionsWithOutboundHandoff.size,
      sessionsWithReferralClick: sessionsWithReferralClick.size,
      confirmedRegistrations: null,
    },
    partnerSideOutcomes: { ...PARTNER_SIDE_OUTCOMES },
    pathQuality,
    funnel: {
      ctaVisiblePerDirectHomeSession: ctaVisibilityObserved ? ratio(sessionsWithCtaVisible.size, directHomeSessions) : null,
      decisionPerDirectHomeSession: ratio(sessionsWithDecision.size, directHomeSessions),
      referralPerDirectHomeSession: ratio(sessionsWithReferralClick.size, directHomeSessions),
      referralPerCtaVisibleSession: ctaVisibilityObserved ? ratio(sessionsWithReferralClick.size, sessionsWithCtaVisible.size) : null,
      outboundPerReferralSession: ratio(sessionsWithOutboundHandoff.size, sessionsWithReferralClick.size),
    },
    byPage: applyVisibilityUnknown(serializeMetricBuckets(byPage, (row) => row.page)),
    byDevice: applyVisibilityUnknown(serializeMetricBuckets(byDevice, (row) => row.device)),
    byLocale: applyVisibilityUnknown(serializeMetricBuckets(byLocale, (row) => row.locale)),
    ctaVisibility: serializeMetricBuckets(ctaVisibility, (row) => `${row.platform}|${row.placement}|${row.page}`),
    decisions: serializeMetricBuckets(decisions, (row) => `${row.decision}|${row.placement}|${row.page}`),
    referrals: serializeMetricBuckets(referrals, (row) => `${row.platform}|${row.placement}|${row.page}`),
    sessionPaths: [...pathBuckets.entries()]
      .map(([pathKey, sessions]) => ({ path: pathKey, sessions: sessions.size }))
      .sort((left, right) => right.sessions - left.sessions || left.path.localeCompare(right.path))
      .slice(0, 20),
  };
}

function table(headers, rows, emptyRow) {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map((header) => header === headers[0] ? "---" : "---:").join(" | ")} |`,
    ...(rows.length ? rows : [emptyRow]).map((row) => `| ${row.join(" | ")} |`),
  ].join("\n");
}

export function renderDirectHomeFunnelMarkdown(report) {
  return `# NexuAlpha Direct Homepage Funnel Diagnostic

Generated: ${report.generatedAt}

Status: ${report.status}

Source: ${report.sourceFile}

Boundary: ${report.boundary}

## Selection

- Environment: ${report.selection.environment}
- UTC interval: ${report.selection.fromUtc || "unbounded"} inclusive to ${report.selection.toUtc || "unbounded"} exclusive
- Source: ${report.selection.source}
- Home pages: ${report.selection.homePages.join(", ")}
- Minimum direct homepage sessions: ${report.selection.minSessions}

## Totals

- Direct homepage sessions: ${report.totals.directHomeSessions}
- Page views inside those sessions: ${report.totals.pageViews}
- Sessions with CTA visible: ${report.totals.sessionsWithCtaVisible}
- Sessions with decision: ${report.totals.sessionsWithDecision}
- Sessions with outbound handoff: ${report.totals.sessionsWithOutboundHandoff}
- Sessions with referral click: ${report.totals.sessionsWithReferralClick}
- Confirmed registrations: null
- Partner KYC: null
- Partner deposits: null
- Partner trades: null
- Partner commissions: null

## Instrumentation

- CTA visibility status: ${report.instrumentation.ctaVisibility.status}
- CTA visibility observed events: ${report.instrumentation.ctaVisibility.observedEvents}
- CTA visibility note: ${report.instrumentation.ctaVisibility.reason}

## Path Quality

- Status: ${report.pathQuality.status}
- Expected path: ${report.pathQuality.expectedPath}
- Home to compare sessions: ${report.pathQuality.homeToCompareSessions}
- Home to detail sessions: ${report.pathQuality.homeToDetailSessions}
- Complete home to compare to detail to referral sessions: ${report.pathQuality.completePathSessions}
- Boundary: ${report.pathQuality.boundary}
- Issues: ${report.pathQuality.issues.length ? report.pathQuality.issues.join(", ") : "none"}

## Funnel

${table(
    ["Metric", "Rate"],
    Object.entries(report.funnel).map(([key, value]) => [key, value === null ? "null" : String(value)]),
    ["none", "null"],
  )}

## Pages

${table(["Page", "Sessions", "Page views", "CTA visible", "Decisions", "Referral clicks"], report.byPage.map((row) => [row.page, row.sessions, row.pageViews, row.ctaVisible, row.decisions, row.referralClicks]), ["none", 0, 0, 0, 0, 0])}

## Devices

${table(["Device", "Sessions", "Page views", "CTA visible", "Decisions", "Referral clicks"], report.byDevice.map((row) => [row.device, row.sessions, row.pageViews, row.ctaVisible, row.decisions, row.referralClicks]), ["none", 0, 0, 0, 0, 0])}

## Locales

${table(["Locale", "Sessions", "Page views", "CTA visible", "Decisions", "Referral clicks"], report.byLocale.map((row) => [row.locale, row.sessions, row.pageViews, row.ctaVisible, row.decisions, row.referralClicks]), ["none", 0, 0, 0, 0, 0])}

## CTA Visibility

${table(["Platform", "Placement", "Page", "Sessions", "Visible CTAs"], report.ctaVisibility.map((row) => [row.platform, row.placement, row.page, row.sessions, row.ctaVisible]), ["none", "none", "none", 0, 0])}

## Decisions

${table(["Decision", "Placement", "Page", "Sessions", "Decisions"], report.decisions.map((row) => [row.decision, row.placement, row.page, row.sessions, row.decisions]), ["none", "none", "none", 0, 0])}

## Referrals

${table(["Platform", "Placement", "Page", "Sessions", "Outbound handoffs", "Referral clicks"], report.referrals.map((row) => [row.platform, row.placement, row.page, row.sessions, row.outboundHandoffs, row.referralClicks]), ["none", "none", "none", 0, 0, 0])}

## Session Paths

${table(["Path", "Sessions"], report.sessionPaths.map((row) => [row.path, row.sessions]), ["none", 0])}

## Notes

${report.notes.map((note) => `- ${note}`).join("\n")}
`;
}

export async function writeDirectHomeFunnelDiagnostic(options = {}) {
  const report = await buildDirectHomeFunnelDiagnostic(options);
  await mkdir(path.dirname(options.output || defaultOutput), { recursive: true });
  await mkdir(path.dirname(options.markdown || defaultMarkdown), { recursive: true });
  await writeFile(options.output || defaultOutput, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await writeFile(options.markdown || defaultMarkdown, renderDirectHomeFunnelMarkdown(report), "utf8");
  return report;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) {
      printHelp();
    } else {
      const report = await writeDirectHomeFunnelDiagnostic(options);
      console.log(`Direct home funnel: ${report.status}; direct homepage sessions ${report.totals.directHomeSessions}`);
      if (report.status === "INPUT_MISSING" || report.status === "INSUFFICIENT_SAMPLE") process.exitCode = 2;
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
