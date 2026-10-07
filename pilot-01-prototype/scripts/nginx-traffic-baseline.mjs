#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, "..");
const defaultOutput = path.join(projectRoot, "..", "artifacts", "seo", "traffic-crawler-baseline.json");
const defaultMarkdown = path.join(projectRoot, "..", "artifacts", "seo", "traffic-crawler-baseline.md");

export const CRAWLER_PATTERNS = {
  Googlebot: /Googlebot/i,
  Bingbot: /bingbot/i,
  "OAI-SearchBot": /OAI-SearchBot/i,
  GPTBot: /GPTBot/i,
  "ChatGPT-User": /ChatGPT-User/i,
  PerplexityBot: /PerplexityBot/i,
  "Claude-SearchBot": /Claude-SearchBot/i,
  "Claude-User": /Claude-User/i,
};

export const AUTOMATION_PATTERNS = {
  HeadlessChrome: /HeadlessChrome/i,
  Lighthouse: /Chrome-Lighthouse|Lighthouse/i,
};

function referralSource(referrer) {
  if (!referrer || referrer === "-") return null;
  try {
    const hostname = new URL(referrer).hostname.toLowerCase();
    if (hostname === "chatgpt.com" || hostname.endsWith(".chatgpt.com") || hostname === "chat.openai.com") return "ChatGPT";
  } catch {
    return null;
  }
  return null;
}

function parseArgs(argv) {
  const options = { input: null, output: defaultOutput, markdown: defaultMarkdown, top: 20 };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => {
      index += 1;
      if (index >= argv.length) throw new Error(`${arg} requires a value`);
      return argv[index];
    };
    if (arg === "--input") {
      const value = next();
      options.input = value === "-" ? "-" : path.resolve(value);
    }
    else if (arg === "--output") options.output = path.resolve(next());
    else if (arg === "--markdown") options.markdown = path.resolve(next());
    else if (arg === "--top") options.top = Number.parseInt(next(), 10);
    else if (arg === "--help" || arg === "-h") options.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!Number.isInteger(options.top) || options.top < 1 || options.top > 100) throw new Error("--top must be an integer from 1 to 100");
  return options;
}

function cleanPath(requestTarget) {
  try {
    const parsed = new URL(requestTarget, "https://nexualpha.com");
    return parsed.pathname.replace(/\/{2,}/g, "/") || "/";
  } catch {
    return String(requestTarget || "/").split(/[?#]/, 1)[0] || "/";
  }
}

function isHtmlLike(pathname) {
  if (pathname === "/api" || pathname.startsWith("/api/") || pathname.startsWith("/.well-known/")) return false;
  const last = pathname.split("/").pop() || "";
  return !last.includes(".") || /\.(?:html?)$/i.test(last);
}

function isLikelyProbe(pathname) {
  return /(?:^|\/)(?:\.aws(?:\/|$)|\.env(?:\.|$)|\.git(?:\/|$)|_profiler(?:\/|$)|_environment$|phpinfo(?:\.php)?$|wp-admin(?:\/|$)|wp-includes(?:\/|$)|wp-login\.php$|wp-json(?:\/|$)|xmlrpc\.php$)|\.php$/i.test(pathname);
}

function increment(map, key) {
  map.set(key, (map.get(key) || 0) + 1);
}

function ranked(map, limit) {
  return [...map.entries()]
    .map(([key, requests]) => ({ key, requests }))
    .sort((left, right) => right.requests - left.requests || left.key.localeCompare(right.key))
    .slice(0, limit);
}

export function parseCombinedLogLine(line) {
  const request = line.match(/"([A-Z]+)\s+(\S+)\s+HTTP\/[0-9.]+"\s+(\d{3})\s+/);
  if (!request) return null;
  const quoted = [...line.matchAll(/"([^"]*)"/g)].map((match) => match[1]);
  return {
    method: request[1],
    pathname: cleanPath(request[2]),
    status: Number.parseInt(request[3], 10),
    referralSource: referralSource(quoted.at(-2) || ""),
    userAgent: quoted.at(-1) || "",
  };
}

export function analyzeNginxTraffic(logText, options = {}) {
  const top = options.top || 20;
  const statuses = new Map();
  const htmlPaths = new Map();
  const notFoundPaths = new Map();
  const contentNotFoundPaths = new Map();
  const otherContentHtmlPaths = new Map();
  const crawlerCounts = Object.fromEntries(Object.keys(CRAWLER_PATTERNS).map((name) => [name, 0]));
  const crawlerHtmlPaths = Object.fromEntries(Object.keys(CRAWLER_PATTERNS).map((name) => [name, new Map()]));
  const automationCounts = Object.fromEntries(Object.keys(AUTOMATION_PATTERNS).map((name) => [name, 0]));
  const referralCounts = { ChatGPT: 0 };
  const referralHtmlPaths = { ChatGPT: new Map() };
  let parsedRequests = 0;
  let unparsedLines = 0;
  let htmlRequests = 0;
  let automationHtmlRequests = 0;
  let knownCrawlerHtmlRequests = 0;
  let otherHtmlRequests = 0;

  for (const line of String(logText || "").split(/\r?\n/)) {
    if (!line.trim()) continue;
    const record = parseCombinedLogLine(line);
    if (!record) {
      unparsedLines += 1;
      continue;
    }
    parsedRequests += 1;
    increment(statuses, String(record.status));
    const htmlLike = (record.method === "GET" || record.method === "HEAD") && isHtmlLike(record.pathname);
    const automationMatches = Object.entries(AUTOMATION_PATTERNS).filter(([, pattern]) => pattern.test(record.userAgent));
    const crawlerMatches = Object.entries(CRAWLER_PATTERNS).filter(([, pattern]) => pattern.test(record.userAgent));
    for (const [name] of automationMatches) automationCounts[name] += 1;
    if (record.referralSource) referralCounts[record.referralSource] += 1;
    if (htmlLike) {
      htmlRequests += 1;
      increment(htmlPaths, record.pathname);
      if (automationMatches.length) automationHtmlRequests += 1;
      else if (crawlerMatches.length) knownCrawlerHtmlRequests += 1;
      else {
        otherHtmlRequests += 1;
        if (!isLikelyProbe(record.pathname)) increment(otherContentHtmlPaths, record.pathname);
      }
      if (record.referralSource) increment(referralHtmlPaths[record.referralSource], record.pathname);
    }
    if (record.status === 404) {
      increment(notFoundPaths, record.pathname);
      if (htmlLike && !automationMatches.length && !isLikelyProbe(record.pathname)) increment(contentNotFoundPaths, record.pathname);
    }
    for (const [name] of crawlerMatches) {
      crawlerCounts[name] += 1;
      if (htmlLike) increment(crawlerHtmlPaths[name], record.pathname);
    }
  }

  return {
    generatedAt: options.generatedAt || new Date().toISOString(),
    status: parsedRequests ? "READY" : "NO_PARSEABLE_REQUESTS",
    boundary: "Anonymous Nginx request aggregation only. Counts are not unique users and do not prove indexing, ranking, AI citations, registrations, commissions or conversion lift. Crawler labels come from user-agent strings and are not verified identities.",
    totals: { parsedRequests, unparsedLines },
    htmlTrafficClasses: {
      htmlRequests,
      automationHtmlRequests,
      knownCrawlerHtmlRequests,
      otherHtmlRequests,
      boundary: "Other HTML requests are anonymous non-matching requests, not verified people or unique visitors.",
    },
    statuses: Object.fromEntries([...statuses.entries()].sort(([a], [b]) => Number(a) - Number(b))),
    crawlerUserAgentCounts: crawlerCounts,
    automationUserAgentCounts: automationCounts,
    referralSourceCounts: referralCounts,
    referralBoundary: "Referral labels come from normalized HTTP Referer hostnames. Headers may be missing or spoofed, so counts do not prove a ChatGPT citation, unique visitor, human visit, registration or conversion. Raw referrers and query strings are not retained.",
    topReferralHtmlPaths: Object.fromEntries(Object.entries(referralHtmlPaths).map(([name, paths]) => [
      name,
      ranked(paths, top).map(({ key, requests }) => ({ path: key, requests })),
    ])),
    topCrawlerHtmlPaths: Object.fromEntries(Object.entries(crawlerHtmlPaths).map(([name, paths]) => [
      name,
      ranked(paths, top).map(({ key, requests }) => ({ path: key, requests })),
    ])),
    topHtmlPaths: ranked(htmlPaths, top).map(({ key, requests }) => ({ path: key, requests })),
    topOtherContentHtmlPaths: ranked(otherContentHtmlPaths, top).map(({ key, requests }) => ({ path: key, requests })),
    topContent404Paths: ranked(contentNotFoundPaths, top).map(({ key, requests }) => ({ path: key, requests })),
    top404Paths: ranked(notFoundPaths, top).map(({ key, requests }) => ({ path: key, requests })),
  };
}

export function renderTrafficMarkdown(report) {
  const lines = [
    "# NexuAlpha Anonymous Traffic and Crawler Baseline",
    "",
    `Generated: ${report.generatedAt}`,
    `Status: ${report.status}`,
    "",
    `Boundary: ${report.boundary}`,
    "",
    "## Request totals",
    "",
    `- Parsed requests: ${report.totals.parsedRequests}`,
    `- Unparsed lines: ${report.totals.unparsedLines}`,
    `- HTML-like requests: ${report.htmlTrafficClasses.htmlRequests}`,
    `- Automated-browser HTML requests: ${report.htmlTrafficClasses.automationHtmlRequests}`,
    `- Known-crawler HTML requests: ${report.htmlTrafficClasses.knownCrawlerHtmlRequests}`,
    `- Other anonymous HTML requests: ${report.htmlTrafficClasses.otherHtmlRequests}`,
    `- Other-request boundary: ${report.htmlTrafficClasses.boundary}`,
    "",
    "| HTTP status | Requests |",
    "| ---: | ---: |",
    ...Object.entries(report.statuses).map(([status, requests]) => `| ${status} | ${requests} |`),
    "",
    "## Search and answer crawler user-agent strings",
    "",
    "| Label | Requests |",
    "| --- | ---: |",
    ...Object.entries(report.crawlerUserAgentCounts).map(([name, requests]) => `| ${name} | ${requests} |`),
    "",
    "## Normalized referral-source labels",
    "",
    `Boundary: ${report.referralBoundary}`,
    "",
    "| Referral label | Requests |",
    "| --- | ---: |",
    ...Object.entries(report.referralSourceCounts).map(([name, requests]) => `| ${name} | ${requests} |`),
    "",
    ...Object.entries(report.topReferralHtmlPaths).flatMap(([name, rows]) => [
      `### ${name} referred HTML paths`,
      "",
      "| Path | Requests |",
      "| --- | ---: |",
      ...rows.map((item) => `| ${item.path} | ${item.requests} |`),
      "",
    ]),
    "",
    "## Automated browser user-agent strings",
    "",
    "| Label | Requests |",
    "| --- | ---: |",
    ...Object.entries(report.automationUserAgentCounts).map(([name, requests]) => `| ${name} | ${requests} |`),
    "",
    "## Frequently requested crawler HTML paths",
    "",
    ...Object.entries(report.topCrawlerHtmlPaths).flatMap(([name, rows]) => [
      `### ${name}`,
      "",
      "| Path | Requests |",
      "| --- | ---: |",
      ...rows.map((item) => `| ${item.path} | ${item.requests} |`),
      "",
    ]),
    "",
    "## Frequently requested HTML-like paths",
    "",
    "| Path | Requests |",
    "| --- | ---: |",
    ...report.topHtmlPaths.map((item) => `| ${item.path} | ${item.requests} |`),
    "",
    "## Other anonymous content-like paths",
    "",
    "Automated browsers, known crawler labels and common probe paths are excluded from this table. These requests are still not verified people or unique visitors.",
    "",
    "| Path | Requests |",
    "| --- | ---: |",
    ...report.topOtherContentHtmlPaths.map((item) => `| ${item.path} | ${item.requests} |`),
    "",
    "## Content-like 404 paths",
    "",
    "These HTML-like paths are the useful SEO recovery queue. Scanner requests for files such as WordPress or environment files stay in the full 404 table below.",
    "",
    "| Path | Requests |",
    "| --- | ---: |",
    ...report.topContent404Paths.map((item) => `| ${item.path} | ${item.requests} |`),
    "",
    "## Frequent 404 paths",
    "",
    "| Path | Requests |",
    "| --- | ---: |",
    ...report.top404Paths.map((item) => `| ${item.path} | ${item.requests} |`),
    "",
  ];
  return `${lines.join("\n")}\n`;
}

export async function writeTrafficBaseline(options) {
  if (!options.input) throw new Error("--input is required");
  const input = options.input === "-"
    ? await new Promise((resolve, reject) => {
        let text = "";
        process.stdin.setEncoding("utf8");
        process.stdin.on("data", (chunk) => { text += chunk; });
        process.stdin.on("end", () => resolve(text));
        process.stdin.on("error", reject);
      })
    : await readFile(options.input, "utf8");
  const report = analyzeNginxTraffic(input, options);
  await mkdir(path.dirname(options.output), { recursive: true });
  await mkdir(path.dirname(options.markdown), { recursive: true });
  await writeFile(options.output, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await writeFile(options.markdown, renderTrafficMarkdown(report), "utf8");
  return report;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) {
      console.log("Usage: node scripts/nginx-traffic-baseline.mjs --input <nginx-access.log|-> [--output <json>] [--markdown <md>] [--top <1-100>]");
    } else {
      const report = await writeTrafficBaseline(options);
      console.log(`Traffic baseline: ${report.status}; parsed ${report.totals.parsedRequests} requests`);
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
