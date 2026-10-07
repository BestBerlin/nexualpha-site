#!/usr/bin/env node

import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { priorityOwnerForQuery } from "../src/data/priority-query-owner-registry.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, "..");

const DEFAULT_OUTPUT = path.join(projectRoot, "..", "artifacts", "seo", "gsc-opportunity-queue.json");
const DEFAULT_MARKDOWN = path.join(projectRoot, "..", "artifacts", "seo", "gsc-opportunity-queue.md");

const INTENT_RULES = [
  { pattern: /\b(compare|comparison|vs|versus|alternative|alternatives|best|which)\b/i, intent: "comparison", weight: 1.35 },
  { pattern: /\b(fee|fees|cost|spread|funding|withdraw|deposit|pix|spei|brl|mxn|jpy)\b/i, intent: "cost_or_payment", weight: 1.3 },
  { pattern: /\b(register|signup|sign up|join|referral|invite|code|bonus)\b/i, intent: "signup", weight: 1.4 },
  { pattern: /\b(kyc|cpf|account|eligible|eligibility|available|country|region)\b/i, intent: "eligibility", weight: 1.2 },
  { pattern: /\b(binance|okx|bybit|bitget|backpack|hyperliquid|uniswap|dydx|mexc|gate|aerodrome|jupiter|raydium|pancakeswap|gmx|drift)\b/i, intent: "venue", weight: 1.15 },
];

const MARKET_RULES = [
  { pattern: /^\/br(?:\/|$)|\b(pix|brl|cpf|brazil|brasil)\b/i, market: "BR" },
  { pattern: /^\/mx(?:\/|$)|\b(spei|mxn|mexico|méxico)\b/i, market: "MX" },
  { pattern: /^\/jp(?:\/|$)|\b(jpy|japan|日本)\b/i, market: "JP" },
  { pattern: /^\/kr(?:\/|$)|\b(krw|korea|한국)\b/i, market: "KR" },
  { pattern: /^\/tr(?:\/|$)|\b(try|turkey|türkiye)\b/i, market: "TR" },
  { pattern: /^\/hk(?:\/|$)|\b(hkd|hong kong|香港)\b/i, market: "HK" },
  { pattern: /^\/eu(?:\/|$)|\b(eur|sepa|europe|european union)\b/i, market: "EU" },
  { pattern: /^\/uk(?:\/|$)|\b(gbp|faster payments|united kingdom|uk)\b/i, market: "UK" },
];

function parseArgs(argv) {
  const options = {
    input: null,
    output: DEFAULT_OUTPUT,
    markdown: DEFAULT_MARKDOWN,
    siteSearchInput: null,
    top: 25,
    minImpressions: 1,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => {
      index += 1;
      if (index >= argv.length) throw new Error(`${arg} requires a value`);
      return argv[index];
    };

    if (arg === "--input") options.input = next();
    else if (arg === "--output") options.output = next();
    else if (arg === "--markdown") options.markdown = next();
    else if (arg === "--site-search-input" || arg === "--internal-search-input") options.siteSearchInput = next();
    else if (arg === "--top") options.top = Number.parseInt(next(), 10);
    else if (arg === "--min-impressions") options.minImpressions = Number.parseInt(next(), 10);
    else if (arg === "--help" || arg === "-h") options.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }

  if (!Number.isInteger(options.top) || options.top < 1 || options.top > 500) {
    throw new Error("--top must be an integer from 1 to 500");
  }
  if (!Number.isInteger(options.minImpressions) || options.minImpressions < 0) {
    throw new Error("--min-impressions must be a non-negative integer");
  }

  return options;
}

function printHelp() {
  console.log([
    "Usage: node scripts/gsc-opportunity-queue.mjs --input <gsc.csv|gsc.json> [options]",
    "",
    "Builds a source-bound SEO content queue from Google Search Console page/query exports.",
    "Missing input or missing metric fields are reported as unknown/blocked, never as zero.",
    "",
    "Options:",
    "  --input <file>             GSC CSV or JSON export. Supports rows with page/query/clicks/impressions/ctr/position.",
    "  --site-search-input <file> Gated optional onsite-search CSV/JSON export with page/query/searches fields.",
    "  --output <file>            JSON report path. Default: ../artifacts/seo/gsc-opportunity-queue.json",
    "  --markdown <file>          Markdown report path. Default: ../artifacts/seo/gsc-opportunity-queue.md",
    "  --top <n>                  Maximum queue rows to keep. Default: 25.",
    "  --min-impressions <n>      Minimum impressions for ranked rows. Default: 1.",
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

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function parseNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const cleaned = String(value).trim().replace(/,/g, "");
  if (!cleaned || /^null$/i.test(cleaned) || /^unknown$/i.test(cleaned)) return null;
  const number = Number.parseFloat(cleaned.replace(/%$/, ""));
  return Number.isFinite(number) ? number : null;
}

function parseCtr(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return null;
    return value > 1 ? value / 100 : value;
  }
  const text = String(value).trim();
  if (!text) return null;
  const numeric = parseNumber(text);
  if (numeric === null) return null;
  return text.endsWith("%") || numeric > 1 ? numeric / 100 : numeric;
}

function splitCsvLine(line) {
  const cells = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(cell);
      cell = "";
    } else {
      cell += char;
    }
  }
  cells.push(cell);
  return cells.map((value) => value.trim());
}

export function parseGscCsv(input) {
  const lines = String(input || "")
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);
  if (!lines.length) return [];

  const headers = splitCsvLine(lines[0]).map(cleanHeader);
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    const record = {};
    headers.forEach((header, index) => {
      record[header] = cells[index] ?? "";
    });
    return record;
  });
}

function findField(record, candidates) {
  for (const name of candidates) {
    if (Object.hasOwn(record, name)) return record[name];
  }
  return undefined;
}

function normalizeUrlPath(value) {
  const raw = cleanString(value);
  if (!raw) return "";
  try {
    const url = new URL(raw, "https://nexualpha.com");
    return `${url.pathname}${url.search}` || "/";
  } catch {
    return raw.startsWith("/") ? raw : `/${raw}`;
  }
}

export function classifyUrlPath(page) {
  const normalized = String(page || "");
  if (!normalized) return "unknown";
  const pathname = normalized.split("?")[0] || "/";
  if (pathname === "/") return "home";
  if (pathname === "/activities") return "activity";
  if (pathname.startsWith("/compare/")) return "comparison";
  if (pathname === "/exchanges") return "venue-directory";
  if (pathname.startsWith("/exchanges/")) return "venue-profile";
  if (pathname.startsWith("/factbook/")) return "factbook";
  if (pathname.startsWith("/topics/")) return "topic-hub";
  if (pathname.startsWith("/news/")) return "news-article";
  if (/^\/(?:br|mx|eu|uk|jp|kr|hk|sg)(?:\/|$)/.test(pathname)) return "regional-decision";
  if (pathname.startsWith("/embed/")) return "embed";
  if (pathname === "/methodology" || pathname === "/partners" || pathname === "/rates" || pathname === "/telegram" || pathname === "/onchain") return "utility";
  return "other";
}

function rowGranularity({ page, query, country, device }) {
  if (page && query && country && device) return "query-page-country-device";
  if (page && query) return "query-page";
  if (page) return "page";
  if (query) return "query";
  return "aggregate-or-unknown";
}

export function normalizeGscRow(row, index = 0) {
  const source = row && typeof row === "object" ? row : {};
  const keys = Array.isArray(source.keys) ? source.keys.map((value) => cleanString(value)) : [];
  const pageFromKeys = keys.find((value) => value.startsWith("/") || /^https?:\/\//i.test(value)) || "";
  const queryFromKeys = keys.find((value) => value && value !== pageFromKeys) || "";

  const page = normalizeUrlPath(findField(source, ["page", "pages", "landing_page", "url", "path"]) ?? pageFromKeys);
  const query = cleanString(findField(source, ["query", "queries", "search_query", "keyword"]) ?? queryFromKeys);
  const clicks = parseNumber(findField(source, ["clicks", "click"]));
  const impressions = parseNumber(findField(source, ["impressions", "impression"]));
  const ctr = parseCtr(findField(source, ["ctr", "click_through_rate"]));
  const position = parseNumber(findField(source, ["position", "avg_position", "average_position", "averagePosition"]));
  const country = cleanString(findField(source, ["country", "countries", "country_code", "region"])) || null;
  const device = cleanString(findField(source, ["device", "devices"])) || null;

  return {
    sourceRow: index + 1,
    page: page || null,
    query: query || null,
    clicks,
    impressions,
    ctr,
    position,
    country,
    device,
    urlClass: classifyUrlPath(page || null),
    granularity: rowGranularity({ page: page || null, query: query || null, country, device }),
  };
}

export function parseGscInput(input, inputPath = "") {
  const text = String(input || "").trim();
  if (!text) return [];
  const lowerPath = String(inputPath || "").toLowerCase();

  if (lowerPath.endsWith(".csv") || (!text.startsWith("{") && !text.startsWith("["))) {
    return parseGscCsv(text).map(normalizeGscRow);
  }

  const parsed = JSON.parse(text);
  const visibleSnapshotMetric = ({ clicks, impressions, ctr, position, averagePosition }) => ({
    clicks,
    impressions,
    ctr: ctr ?? (Number.isFinite(Number(clicks)) && Number(impressions) > 0 ? Number(clicks) / Number(impressions) : undefined),
    position,
    averagePosition,
  });
  const rows = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed.rows)
      ? parsed.rows
      : Array.isArray(parsed.data)
        ? parsed.data
        : [
          ...(Array.isArray(parsed.topQueries)
            ? parsed.topQueries.map(({ query, ...metrics }) => ({ query, ...visibleSnapshotMetric(metrics) }))
            : []),
          ...(Array.isArray(parsed.topPages)
            ? parsed.topPages.map(({ page, ...metrics }) => ({ page, ...visibleSnapshotMetric(metrics) }))
            : []),
        ];
  return rows.map(normalizeGscRow);
}

export function normalizeSiteSearchRow(row, index = 0) {
  const source = row && typeof row === "object" ? row : {};
  const page = normalizeUrlPath(findField(source, ["page", "landing_page", "url", "path"]));
  const query = cleanString(findField(source, ["query", "search_query", "term", "keyword"]));
  const searches = parseNumber(findField(source, ["searches", "search_count", "count", "events", "sessions", "total_searches"]));

  return {
    sourceRow: index + 1,
    page: page || null,
    query: query || null,
    searches,
    status: page || query ? "READY" : "BLOCKED_MISSING_PAGE_OR_QUERY",
  };
}

export function parseSiteSearchInput(input, inputPath = "") {
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
      if (Array.isArray(parsed.searches)) return parsed.searches;
      return [];
    })();
  return rows.map(normalizeSiteSearchRow);
}

export function classifyIntent(row) {
  const text = `${row.query || ""} ${row.page || ""}`;
  const matched = INTENT_RULES.filter((rule) => rule.pattern.test(text));
  const intent = matched.length ? matched.map((rule) => rule.intent) : ["informational"];
  const intentWeight = matched.length ? Math.max(...matched.map((rule) => rule.weight)) : 1;
  const market = MARKET_RULES.find((rule) => rule.pattern.test(text))?.market || "GLOBAL";
  return { intent, intentWeight, market };
}

function round(value, digits = 4) {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function siteSearchKey(page, query) {
  return `${String(page || "").toLowerCase()}\n${String(query || "").toLowerCase()}`;
}

function buildSiteSearchLookup(siteSearchRows = []) {
  const lookup = {
    exact: new Map(),
    byQuery: new Map(),
    byPage: new Map(),
    rows: siteSearchRows,
  };

  for (const row of siteSearchRows) {
    if (row.searches === null || row.searches < 1 || row.status !== "READY") continue;
    if (row.page && row.query) lookup.exact.set(siteSearchKey(row.page, row.query), row);
    if (row.query) {
      const key = row.query.toLowerCase();
      const previous = lookup.byQuery.get(key);
      if (!previous || row.searches > previous.searches) lookup.byQuery.set(key, row);
    }
    if (row.page) {
      const key = row.page.toLowerCase();
      const previous = lookup.byPage.get(key);
      if (!previous || row.searches > previous.searches) lookup.byPage.set(key, row);
    }
  }

  return lookup;
}

function internalSearchSignal(row, lookup, options = {}) {
  if (!lookup) {
    return {
      status: "UNKNOWN",
      searches: null,
      match: null,
      reason: "SITE_SEARCH_INPUT_MISSING",
    };
  }

  const strongSearchMin = options.strongSearchMin ?? 10;
  const exact = row.page && row.query ? lookup.exact.get(siteSearchKey(row.page, row.query)) : null;
  const byQuery = row.query ? lookup.byQuery.get(row.query.toLowerCase()) : null;
  const byPage = row.page ? lookup.byPage.get(row.page.toLowerCase()) : null;
  const match = exact || byQuery || byPage || null;
  if (!match) {
    return {
      status: "NO_MATCH",
      searches: 0,
      match: null,
      reason: "NO_SITE_SEARCH_ROW_MATCHED",
    };
  }

  const weakSearchPerformance = (row.clicks ?? 0) <= 1 || (row.ctr ?? 1) < 0.02;
  const status = match.searches >= strongSearchMin && weakSearchPerformance ? "STRONG_SEARCH_WEAK_GSC" : "OBSERVED";
  return {
    status,
    searches: match.searches,
    match: {
      page: match.page,
      query: match.query,
      sourceRow: match.sourceRow,
      matchType: exact ? "page_query" : byQuery ? "query" : "page",
    },
    reason: status === "STRONG_SEARCH_WEAK_GSC"
      ? "Onsite search demand is strong while GSC clicks/CTR remain weak."
      : "Onsite search row matched, but it does not meet the strong-search weak-GSC threshold.",
  };
}

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "before", "best", "com", "for", "from", "how", "in", "is", "of", "or", "the", "to", "vs", "what", "when", "which", "why", "with",
]);

function stemToken(token) {
  return String(token || "")
    .replace(/ies$/, "y")
    .replace(/s$/, "");
}

function tokenizeForHint(value) {
  return [...new Set(String(value || "")
    .toLowerCase()
    .replace(/https?:\/\/(?:www\.)?nexualpha\.com/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .map(stemToken)
    .filter((token) => token.length >= 2 && !STOP_WORDS.has(token)))];
}

function conservativeActionForHint(queryRow, pageRow) {
  const text = `${queryRow.query || ""} ${pageRow.page || ""}`.toLowerCase();
  if (/tokenized|treasury|rwa|stock/.test(text)) return "add_source_bound_answer_block_and_entity_links";
  if (/fee|funding|cost|margin/.test(text)) return "add_fee_funding_table_and_first_answer";
  if (/testnet|deployment|wallet|route|mint/.test(text)) return "add_official_route_safety_checklist";
  if (/vs|compare|comparison|bybit|bitget|hyperliquid|dydx/.test(text)) return "add_comparison_answer_and_internal_links";
  return "review_title_meta_answer_block_and_internal_links";
}

function reviewedQueryOwnerPath(query) {
  return priorityOwnerForQuery(query)?.canonicalOwnerPath || null;
}

export function buildConservativeHints(rows, options = {}) {
  const top = options.top ?? 10;
  const pageRows = rows.filter((row) => row.page && !row.query && row.impressions !== null);
  const queryRows = rows.filter((row) => row.query && !row.page && row.impressions !== null);
  const hints = [];

  for (const queryRow of queryRows) {
    const queryTokens = tokenizeForHint(queryRow.query);
    if (!queryTokens.length) continue;

    const candidates = pageRows.map((pageRow) => {
      const pageTokens = tokenizeForHint(pageRow.page);
      const overlap = queryTokens.filter((token) => pageTokens.includes(token));
      const score = overlap.length / Math.max(queryTokens.length, 1);
      return { pageRow, overlap, score };
    }).filter((candidate) => candidate.overlap.length > 0);

    candidates
      .sort((a, b) => b.score - a.score || (b.pageRow.impressions ?? 0) - (a.pageRow.impressions ?? 0))
      .slice(0, 2)
      .forEach((candidate) => {
        const observedPage = candidate.pageRow.page;
        const recommendedOwnerPage = reviewedQueryOwnerPath(queryRow.query);
        hints.push({
          status: "CONSERVATIVE_HINT_NOT_QUERY_PAGE_EVIDENCE",
          page: recommendedOwnerPage || observedPage,
          observedPage,
          recommendedOwnerPage: recommendedOwnerPage || observedPage,
          query: queryRow.query,
          pageImpressions: candidate.pageRow.impressions,
          queryImpressions: queryRow.impressions,
          overlapTokens: candidate.overlap,
          confidence: candidate.score >= 0.5 ? "medium" : "low",
          hintScore: round((queryRow.impressions || 0) * candidate.score, 4),
          recommendedAction: conservativeActionForHint(queryRow, candidate.pageRow),
          evidenceBoundary: "Generated only from separate page-level and query-level GSC rows. observedPage preserves the page-only evidence; recommendedOwnerPage follows the reviewed owner registry and does not prove Google paired this query with either page.",
        });
      });
  }

  return hints
    .sort((a, b) => b.hintScore - a.hintScore || b.queryImpressions - a.queryImpressions || b.pageImpressions - a.pageImpressions)
    .slice(0, top);
}

function opportunityTypesFor(row, internalSearch) {
  const types = [];
  if (row.impressions !== null && row.ctr !== null && row.impressions >= 50 && row.ctr < 0.02) {
    types.push("HIGH_EXPOSURE_LOW_CTR");
  }
  if (row.position !== null && row.clicks !== null && row.impressions !== null && row.position <= 12 && row.clicks <= 1 && row.impressions >= 10) {
    types.push("NEAR_TOP_LOW_CLICK");
  }
  if (internalSearch?.status === "STRONG_SEARCH_WEAK_GSC") {
    types.push("STRONG_INTERNAL_SEARCH_WEAK_GSC");
  }
  if (!types.length) types.push("GENERAL_SEO_REVIEW");
  return types;
}

function recommendedActionForTypes(types, fallback) {
  if (types.includes("STRONG_INTERNAL_SEARCH_WEAK_GSC")) return "align_page_answer_with_internal_search_intent";
  if (types.includes("NEAR_TOP_LOW_CLICK")) return "rewrite_serp_title_meta_and_cta_bridge";
  return fallback;
}

function uniqueList(values) {
  return [...new Set(values.filter(Boolean))];
}

function contentBriefFor(row, { intent, market, urlClass }) {
  const searchIntent = row.query || row.page || "unknown";
  const requiredSections = ["direct_answer"];
  const aeoChecklist = [
    "Answer the observed query in the first screen with a neutral, source-bound summary.",
    "Keep FAQ answers consistent with visible body copy before adding FAQ schema.",
  ];
  const geoChecklist = [
    "Attach source names, source dates and limitation notes to facts that answer engines may quote.",
    "Prefer one canonical answer target for the observed intent instead of duplicating near-identical pages.",
  ];
  const commercialChecklist = [
    "Keep referral or registration claims fail-closed until destination, terms and disclosure are verified.",
    "Do not treat clicks, impressions, onsite searches or ranking hints as registrations, KYC, deposits, trades or commission.",
  ];
  const schemaCandidates = ["WebPage", "BreadcrumbList"];
  const internalLinkFocus = [];

  if (intent.includes("comparison") || urlClass === "comparison") {
    requiredSections.push("comparison_table");
    aeoChecklist.push("Separate who-should-use-which-platform guidance from promotional language.");
    internalLinkFocus.push("venue_profiles", "methodology_or_fee_explainer");
  }
  if (intent.includes("cost_or_payment")) {
    requiredSections.push("fee_or_funding_table");
    geoChecklist.push("Use source dates beside fee, funding or payment claims.");
    internalLinkFocus.push("cost_calculator_or_fee_methodology");
  }
  if (intent.includes("signup")) {
    requiredSections.push("signup_boundary");
    commercialChecklist.push("Mention registration only as a disclosed next step, not as a measured conversion result.");
  }
  if (intent.includes("eligibility") || urlClass === "regional-decision" || market !== "GLOBAL") {
    requiredSections.push("regional_eligibility_check");
    geoChecklist.push("State market availability and eligibility limits before any signup language.");
    internalLinkFocus.push("regional_decision_chain", "risk_or_policy_page");
  }
  if (intent.includes("venue") || urlClass === "venue-profile") {
    requiredSections.push("official_source_check");
    geoChecklist.push("Cite official venue docs before fee, product, campaign or eligibility claims.");
    internalLinkFocus.push("comparison_route", "venue_directory");
  }
  if (urlClass === "news-article" || urlClass === "factbook") {
    requiredSections.push("source_dates_and_limits");
    geoChecklist.push("Keep news and factbook pages citation-first; do not add unrelated signup detours.");
  }
  if (!requiredSections.includes("source_dates_and_limits")) {
    requiredSections.push("source_dates_and_limits");
  }
  requiredSections.push("next_step_internal_links");
  if (row.query) schemaCandidates.push("FAQPage");

  return {
    searchIntent,
    requiredSections: uniqueList(requiredSections),
    aeoChecklist: uniqueList(aeoChecklist),
    geoChecklist: uniqueList(geoChecklist),
    commercialChecklist: uniqueList(commercialChecklist),
    schemaCandidates: uniqueList(schemaCandidates),
    internalLinkFocus: uniqueList(internalLinkFocus.length ? internalLinkFocus : ["related_owner_page", "methodology"]),
    boundary: "This content brief turns supplied search evidence into editorial tasks. It does not prove registration, KYC, deposits, trades, commission, ranking gains or AI citation.",
  };
}

export function scoreOpportunity(row, context = {}) {
  const missing = [];
  if (row.impressions === null) missing.push("impressions");
  if (row.ctr === null) missing.push("ctr");
  if (row.position === null) missing.push("position");
  if (!row.page) missing.push("page");

  const { intent, intentWeight, market } = classifyIntent(row);
  const urlClass = row.urlClass || classifyUrlPath(row.page);
  const granularity = row.granularity || rowGranularity(row);
  const internalSearch = internalSearchSignal(row, context.siteSearchLookup, context);
  const contentBrief = contentBriefFor(row, { intent, market, urlClass });
  const recommendedOwnerPage = row.page && row.query ? reviewedQueryOwnerPath(row.query) : null;
  // Registry ownership is an editorial recommendation. Metrics and page remain
  // attached to the URL actually supplied with the observed query.
  const ownerEvidence = recommendedOwnerPage ? { observedPage: row.page, recommendedOwnerPage } : {};
  if (missing.length) {
    return {
      ...row,
      ...ownerEvidence,
      status: "BLOCKED_PARTIAL_GSC_METRICS",
      market,
      intent,
      intentWeight,
      urlClass,
      granularity,
      opportunityScore: null,
      recommendedAction: "request_complete_gsc_export",
      opportunityTypes: [],
      internalSearch,
      contentBrief,
      missingFields: missing,
    };
  }

  const impressions = Math.max(row.impressions, 0);
  const position = Math.max(row.position, 1);
  const ctr = Math.max(row.ctr, 0);
  const ctrGap = Math.max(0.02, 0.12 - ctr);
  const positionWeight = position <= 3 ? 0.4 : position <= 10 ? 0.9 : position <= 30 ? 1.3 : 0.75;
  const score = impressions * ctrGap * positionWeight * intentWeight;

  let recommendedAction = "refresh_title_meta_and_first_answer";
  if (position > 30) recommendedAction = "expand_source_backed_body_and_internal_links";
  else if (position <= 10 && ctr < 0.02) recommendedAction = "rewrite_serp_title_meta_and_cta_bridge";
  else if (position > 10 && position <= 30) recommendedAction = "add_answer_block_table_faq_and_internal_links";
  const opportunityTypes = opportunityTypesFor(row, internalSearch);

  return {
    ...row,
    ...ownerEvidence,
    status: row.query ? "RANKED_QUERY_PAGE_FROM_GSC_EXPORT" : "RANKED_PAGE_LEVEL_FROM_GSC_EXPORT",
    market,
    intent,
    intentWeight,
    urlClass,
    granularity,
    opportunityScore: round(score, 4),
    recommendedAction: recommendedActionForTypes(opportunityTypes, recommendedAction),
    opportunityTypes,
    internalSearch,
    contentBrief,
    missingFields: [],
  };
}

export function buildOpportunityQueue(rows, options = {}) {
  const minImpressions = options.minImpressions ?? 1;
  const top = options.top ?? 25;
  const siteSearchRows = options.siteSearchRows || [];
  const siteSearchLookup = siteSearchRows.length ? buildSiteSearchLookup(siteSearchRows) : null;
  const normalized = rows.map((row, index) => scoreOpportunity(normalizeGscRow(row, index), {
    siteSearchLookup,
    strongSearchMin: options.strongSearchMin,
  }));
  const blocked = normalized.filter((row) => !row.status.startsWith("RANKED_"));
  const pageOnlyRows = normalized.filter((row) => row.page && !row.query);
  const queryOnlyRows = normalized.filter((row) => row.query && !row.page);
  const queryPageRows = normalized.filter((row) => row.page && row.query);
  const aggregateRows = normalized.filter((row) => !row.page && !row.query);
  const conservativeHints = buildConservativeHints(normalized, { top });
  const ranked = normalized
    .filter((row) => row.status.startsWith("RANKED_") && row.impressions >= minImpressions)
    .sort((a, b) => b.opportunityScore - a.opportunityScore || b.impressions - a.impressions || a.position - b.position)
    .slice(0, top);

  return {
    status: rows.length ? "QUEUE_READY" : "NO_GSC_ROWS",
    generatedAt: new Date().toISOString(),
    inputBoundary: "Only supplied GSC rows are ranked. Missing exports or missing fields remain unknown and are not treated as zero.",
    totals: {
      inputRows: rows.length,
      rankedRows: ranked.length,
      blockedRows: blocked.length,
      pageOnlyRows: pageOnlyRows.length,
      queryOnlyRows: queryOnlyRows.length,
      queryPageRows: queryPageRows.length,
      aggregateRows: aggregateRows.length,
      conservativeHintRows: conservativeHints.length,
      siteSearchRows: siteSearchRows.length,
      minImpressions,
    },
    inputCompleteness: {
      status: queryPageRows.length ? "QUERY_PAGE_EXPORT_AVAILABLE" : pageOnlyRows.length ? "PAGE_LEVEL_ONLY" : queryOnlyRows.length ? "QUERY_LEVEL_ONLY" : "UNKNOWN",
      pageOnlyRows: pageOnlyRows.length,
      queryOnlyRows: queryOnlyRows.length,
      queryPageRows: queryPageRows.length,
      aggregateRows: aggregateRows.length,
      blocker: queryPageRows.length
        ? null
        : "Export Google Search Console rows with page and query together, plus clicks, impressions, CTR and position. Page-only or query-only snapshots can guide low-risk edits but cannot prove query-page demand.",
      hintBoundary: conservativeHints.length
        ? "Conservative hints are generated from separate page-only and query-only rows. They are planning aids, not ranking proof."
        : null,
      internalSearch: siteSearchRows.length
        ? {
          status: "READY",
          rows: siteSearchRows.length,
          boundary: "Onsite-search input is used only to flag demand alignment. It does not prove Google query-page ranking, registration, or conversion.",
        }
        : {
          status: "INPUT_MISSING",
          rows: null,
          boundary: "No onsite-search export was supplied. Strong internal-search demand remains unknown, not zero.",
        },
    },
    queue: ranked,
    conservativeHints,
    blocked,
  };
}

export function buildMissingInputReport(inputFile = null) {
  return {
    status: "INPUT_MISSING",
    generatedAt: new Date().toISOString(),
    inputFile,
    inputBoundary: "No GSC export was supplied or readable. Search demand, clicks, impressions, CTR and position are unknown, not zero.",
    totals: {
      inputRows: null,
      rankedRows: null,
      blockedRows: null,
      siteSearchRows: null,
      minImpressions: null,
    },
    inputCompleteness: {
      status: "UNKNOWN",
      internalSearch: {
        status: "INPUT_MISSING",
        rows: null,
        boundary: "No GSC export or onsite-search export was supplied. Demand remains unknown, not zero.",
      },
    },
    queue: [],
    blocked: [],
  };
}

export function renderMarkdown(report) {
  const lines = [
    "# NexuAlpha GSC Content Opportunity Queue",
    "",
    `Generated: ${report.generatedAt}`,
    `Status: ${report.status}`,
    "",
    `Boundary: ${report.inputBoundary}`,
    "",
  ];

  if (report.status === "INPUT_MISSING") {
    lines.push("## Summary", "", "- Input rows: unknown", "- Ranked rows: unknown", "- Search demand: unknown", "");
    return `${lines.join("\n")}\n`;
  }

  lines.push(
    "## Summary",
    "",
    `- Input rows: ${report.totals.inputRows}`,
    `- Ranked rows: ${report.totals.rankedRows}`,
    `- Blocked partial rows: ${report.totals.blockedRows}`,
    `- Page-only rows: ${report.totals.pageOnlyRows ?? 0}`,
    `- Query-only rows: ${report.totals.queryOnlyRows ?? 0}`,
    `- Query-page rows: ${report.totals.queryPageRows ?? 0}`,
    `- Aggregate/unknown rows: ${report.totals.aggregateRows ?? 0}`,
    `- Conservative hint rows: ${report.totals.conservativeHintRows ?? 0}`,
    `- Onsite-search rows: ${report.totals.siteSearchRows ?? 0}`,
    `- Minimum impressions: ${report.totals.minImpressions}`,
    "",
    "## Data Completeness",
    "",
    `- Status: ${report.inputCompleteness?.status ?? "UNKNOWN"}`,
    `- Query-page blocker: ${report.inputCompleteness?.blocker ?? "none"}`,
    `- Hint boundary: ${report.inputCompleteness?.hintBoundary ?? "none"}`,
    `- Onsite-search status: ${report.inputCompleteness?.internalSearch?.status ?? "UNKNOWN"}`,
    `- Onsite-search boundary: ${report.inputCompleteness?.internalSearch?.boundary ?? "unknown"}`,
    "",
    "## Queue",
    "",
  );

  if (!report.queue.length) {
    lines.push("No ranked rows met the current input and minimum-impression filters.", "");
  } else {
    lines.push("| Priority | Page | URL class | Granularity | Country | Device | Query | Impr. | CTR | Pos. | Types | Onsite search | Intent | Market | Action |", "| --- | --- | --- | --- | --- | --- | --- | ---: | ---: | ---: | --- | --- | --- | --- | --- |");
    report.queue.forEach((row, index) => {
      const ctr = row.ctr === null ? "unknown" : `${round(row.ctr * 100, 2)}%`;
      const onsite = row.internalSearch?.status === "UNKNOWN" ? "unknown" : `${row.internalSearch?.status || "unknown"}:${row.internalSearch?.searches ?? "unknown"}`;
      lines.push(`| ${index + 1} | ${row.page || "unknown"} | ${row.urlClass || "unknown"} | ${row.granularity || "unknown"} | ${row.country || "unknown"} | ${row.device || "unknown"} | ${row.query || "unknown"} | ${row.impressions ?? "unknown"} | ${ctr} | ${row.position ?? "unknown"} | ${(row.opportunityTypes || []).join(", ")} | ${onsite} | ${row.intent.join(", ")} | ${row.market} | ${row.recommendedAction} |`);
    });
    lines.push("");
  }

  if (report.conservativeHints?.length) {
    lines.push(
      "## Conservative Hints",
      "",
      "These rows are planning aids from separate page-only and query-only Search Console rows. They are not query-page evidence.",
      "",
      "| Priority | Recommended owner | Observed page hint | URL class | Query | Page impr. | Query impr. | Overlap | Confidence | Action |",
      "| --- | --- | --- | --- | --- | ---: | ---: | --- | --- | --- |",
    );
    report.conservativeHints.forEach((row, index) => {
      lines.push(`| ${index + 1} | ${row.recommendedOwnerPage || row.page} | ${row.observedPage || row.page} | ${classifyUrlPath(row.recommendedOwnerPage || row.page)} | ${row.query} | ${row.pageImpressions} | ${row.queryImpressions} | ${row.overlapTokens.join(", ")} | ${row.confidence} | ${row.recommendedAction} |`);
    });
    lines.push("");
  }

  if (report.queue.length) {
    lines.push(
      "## Content Briefs",
      "",
      "Commercial boundary: these briefs guide source-bound page edits. They do not prove registrations, KYC, deposits, trades, commissions, ranking gains or AI citation.",
      "",
      "| Priority | Page | Search intent | Required sections | AEO checklist | GEO checklist | Commercial checklist | Schema candidates | Internal links |",
      "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    );
    report.queue.forEach((row, index) => {
      const brief = row.contentBrief || contentBriefFor(row, { intent: row.intent || [], market: row.market || "GLOBAL", urlClass: row.urlClass || classifyUrlPath(row.page) });
      lines.push(`| ${index + 1} | ${row.page || "unknown"} | ${brief.searchIntent} | ${brief.requiredSections.join(", ")} | ${brief.aeoChecklist.join("; ")} | ${brief.geoChecklist.join("; ")} | ${brief.commercialChecklist.join("; ")} | ${brief.schemaCandidates.join(", ")} | ${brief.internalLinkFocus.join(", ")} |`);
    });
    lines.push("");
  }

  if (report.blocked.length) {
    lines.push("## Blocked Rows", "", "| Source row | Page | URL class | Granularity | Query | Missing fields |", "| ---: | --- | --- | --- | --- | --- |");
    report.blocked.forEach((row) => {
      lines.push(`| ${row.sourceRow} | ${row.page || "unknown"} | ${row.urlClass || "unknown"} | ${row.granularity || "unknown"} | ${row.query || "unknown"} | ${row.missingFields.join(", ")} |`);
    });
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
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

export async function buildGscOpportunityQueue(options = {}) {
  const inputFile = options.input ? path.resolve(options.input) : null;
  let report;

  if (!inputFile || !(await fileExists(inputFile))) {
    report = buildMissingInputReport(inputFile);
  } else {
    const input = await readFile(inputFile, "utf8");
    const rows = parseGscInput(input, inputFile);
    const siteSearchFile = options.siteSearchInput ? path.resolve(options.siteSearchInput) : null;
    const siteSearchRows = siteSearchFile && await fileExists(siteSearchFile)
      ? parseSiteSearchInput(await readFile(siteSearchFile, "utf8"), siteSearchFile)
      : [];
    report = buildOpportunityQueue(rows, {
      minImpressions: options.minImpressions,
      top: options.top,
      siteSearchRows,
      strongSearchMin: options.strongSearchMin,
    });
    report.inputFile = inputFile;
    report.siteSearchInputFile = siteSearchFile;
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
      const { report, output, markdown } = await buildGscOpportunityQueue(options);
      console.log(`GSC opportunity queue: ${report.status}`);
      console.log(`JSON: ${output}`);
      console.log(`Markdown: ${markdown}`);
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
