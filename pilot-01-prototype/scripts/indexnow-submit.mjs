#!/usr/bin/env node

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { isSitemapIndex, readSitemapTree } from "./sitemap-tree.mjs";

const DEFAULT_ORIGIN = "https://nexualpha.com";
const DEFAULT_ENDPOINT = "https://api.indexnow.org/indexnow";
const MAX_INDEXNOW_BATCH = 10000;

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, "..");

function xmlUnescape(value) {
  return String(value)
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'");
}

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function parseArgs(argv) {
  const options = {
    submit: false,
    checkLive: false,
    origin: DEFAULT_ORIGIN,
    endpoint: DEFAULT_ENDPOINT,
    sitemap: path.join(projectRoot, "public", "sitemap.xml"),
    keyFile: null,
    changedUrls: null,
    maxUrls: 500,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => {
      index += 1;
      if (index >= argv.length) throw new Error(`${arg} requires a value`);
      return argv[index];
    };
    if (arg === "--submit") options.submit = true;
    else if (arg === "--check-live") options.checkLive = true;
    else if (arg === "--origin") options.origin = next();
    else if (arg === "--endpoint") options.endpoint = next();
    else if (arg === "--sitemap") options.sitemap = next();
    else if (arg === "--key-file") options.keyFile = next();
    else if (arg === "--changed-urls") options.changedUrls = next();
    else if (arg === "--max-urls") options.maxUrls = Number.parseInt(next(), 10);
    else if (arg === "--help" || arg === "-h") options.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }

  if (!Number.isInteger(options.maxUrls) || options.maxUrls < 1 || options.maxUrls > MAX_INDEXNOW_BATCH) {
    throw new Error(`--max-urls must be an integer from 1 to ${MAX_INDEXNOW_BATCH}`);
  }
  return options;
}

function printHelp() {
  console.log([
    "Usage: node scripts/indexnow-submit.mjs [options]",
    "",
    "Default mode is dry-run. Add --submit to POST to IndexNow.",
    "",
    "Options:",
    "  --changed-urls <file>  Limit submission candidates to URLs listed in a text or JSON file.",
    "  --check-live           HEAD/GET candidates and keep only HTTP 200 URLs.",
    "  --submit               Submit the filtered batch to the IndexNow endpoint.",
    "  --max-urls <n>         Maximum URLs in this run. Default: 500.",
    "  --key-file <file>      Public IndexNow key file. Defaults to auto-detecting public/*.txt.",
    "  --sitemap <file>       Sitemap path. Default: public/sitemap.xml.",
    "  --origin <url>         Canonical site origin. Default: https://nexualpha.com.",
    "  --endpoint <url>       IndexNow endpoint. Default: https://api.indexnow.org/indexnow.",
  ].join("\n"));
}

export function parseSitemapUrls(sitemapXml, origin = DEFAULT_ORIGIN) {
  const expectedOrigin = new URL(origin).origin;
  const seen = new Set();
  const urls = [];
  for (const match of String(sitemapXml || "").matchAll(/<loc>([\s\S]*?)<\/loc>/g)) {
    try {
      const url = new URL(xmlUnescape(match[1].trim()));
      url.hash = "";
      const href = url.toString();
      if (url.origin !== expectedOrigin || seen.has(href)) continue;
      seen.add(href);
      urls.push(href);
    } catch {
      // Ignore malformed sitemap entries; they cannot be submitted safely.
    }
  }
  return urls;
}

// sitemap.xml is a <sitemapindex> since #118: its <loc>s are child sitemaps, not pages. Read the index and its child
// files (beside it in public/) through sitemap-tree and keep only the page URLs of each <urlset>.
export function loadSitemapUrls(sitemapPath, origin = DEFAULT_ORIGIN) {
  const tree = readSitemapTree(sitemapPath);
  if (tree.missing.length) throw new Error(`Child sitemaps missing next to ${sitemapPath}: ${tree.missing.join(", ")}`);
  return parseSitemapUrls(tree.files.filter(({ xml }) => !isSitemapIndex(xml)).map(({ xml }) => xml).join("\n"), origin);
}

export function parseChangedUrls(input) {
  const text = String(input || "").trim();
  if (!text) return [];
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed.map(String);
    if (Array.isArray(parsed.urls)) return parsed.urls.map(String);
    if (Array.isArray(parsed.urlList)) return parsed.urlList.map(String);
  } catch {
    // Fall back to line/comma separated text below.
  }
  return text
    .split(/[\r\n,]+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function selectIndexNowCandidates({ sitemapUrls, changedUrls = null, origin = DEFAULT_ORIGIN, maxUrls = 500 }) {
  const expectedOrigin = new URL(origin).origin;
  const canonical = new Set(sitemapUrls);
  const source = Array.isArray(changedUrls) && changedUrls.length > 0 ? changedUrls : sitemapUrls;
  const rejected = [];
  const seen = new Set();
  const urls = [];

  for (const value of source) {
    try {
      const url = new URL(value, origin);
      url.hash = "";
      const href = url.toString();
      if (url.origin !== expectedOrigin) {
        rejected.push({ url: String(value), reason: "wrong-origin" });
      } else if (!canonical.has(href)) {
        rejected.push({ url: href, reason: "not-in-sitemap" });
      } else if (!seen.has(href)) {
        seen.add(href);
        urls.push(href);
      }
    } catch {
      rejected.push({ url: String(value), reason: "invalid-url" });
    }
    if (urls.length >= maxUrls) break;
  }

  return { urls, rejected };
}

async function discoverKeyFile(publicDir) {
  const entries = await readdir(publicDir, { withFileTypes: true });
  const candidates = entries
    .filter((entry) => entry.isFile() && /^[A-Za-z0-9-]{8,128}\.txt$/.test(entry.name))
    .map((entry) => path.join(publicDir, entry.name));
  for (const candidate of candidates) {
    const filenameKey = path.basename(candidate, ".txt");
    const contentKey = cleanString(await readFile(candidate, "utf8"));
    if (filenameKey === contentKey) return candidate;
  }
  throw new Error("No valid root IndexNow key file was found in public/");
}

export async function loadIndexNowKey({ keyFile = null, publicDir = path.join(projectRoot, "public"), origin = DEFAULT_ORIGIN } = {}) {
  const resolved = keyFile ? path.resolve(projectRoot, keyFile) : await discoverKeyFile(publicDir);
  const key = cleanString(await readFile(resolved, "utf8"));
  if (!/^[A-Za-z0-9-]{8,128}$/.test(key)) throw new Error("IndexNow key file has an invalid key format");
  return {
    key,
    keyFile: resolved,
    keyLocation: `${new URL(origin).origin}/${path.basename(resolved)}`,
  };
}

async function isHttp200(url, fetchImpl = globalThis.fetch) {
  const head = await fetchImpl(url, { method: "HEAD", redirect: "manual" });
  if (head.status === 200) return true;
  if (head.status === 405 || head.status === 403) {
    const get = await fetchImpl(url, { method: "GET", redirect: "manual" });
    return get.status === 200;
  }
  return false;
}

export async function filterHttp200(urls, fetchImpl = globalThis.fetch) {
  const accepted = [];
  const rejected = [];
  for (const url of urls) {
    if (await isHttp200(url, fetchImpl)) accepted.push(url);
    else rejected.push({ url, reason: "not-http-200" });
  }
  return { urls: accepted, rejected };
}

export function buildIndexNowPayload({ origin = DEFAULT_ORIGIN, key, keyLocation, urls }) {
  const host = new URL(origin).host;
  return {
    host,
    key,
    keyLocation,
    urlList: urls,
  };
}

export async function submitIndexNowPayload({ endpoint = DEFAULT_ENDPOINT, payload, fetchImpl = globalThis.fetch }) {
  const response = await fetchImpl(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload),
  });
  return { status: response.status, ok: response.status === 200 || response.status === 202 };
}

export async function planIndexNowRun(options, fetchImpl = globalThis.fetch) {
  const sitemapUrls = loadSitemapUrls(path.resolve(projectRoot, options.sitemap), options.origin);
  const changedUrls = options.changedUrls
    ? parseChangedUrls(await readFile(path.resolve(projectRoot, options.changedUrls), "utf8"))
    : null;
  const selected = selectIndexNowCandidates({
    sitemapUrls,
    changedUrls,
    origin: options.origin,
    maxUrls: options.maxUrls,
  });
  const live = options.checkLive || options.submit
    ? await filterHttp200(selected.urls, fetchImpl)
    : { urls: selected.urls, rejected: [] };
  const key = await loadIndexNowKey({ keyFile: options.keyFile, origin: options.origin });
  return {
    dryRun: !options.submit,
    sitemapUrlCount: sitemapUrls.length,
    changedUrlCount: changedUrls?.length ?? null,
    urls: live.urls,
    rejected: [...selected.rejected, ...live.rejected],
    key,
    payload: buildIndexNowPayload({
      origin: options.origin,
      key: key.key,
      keyLocation: key.keyLocation,
      urls: live.urls,
    }),
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const plan = await planIndexNowRun(options);
  const summary = {
    mode: plan.dryRun ? "dry-run" : "submit",
    sitemapUrlCount: plan.sitemapUrlCount,
    changedUrlCount: plan.changedUrlCount,
    candidateUrlCount: plan.urls.length,
    rejectedUrlCount: plan.rejected.length,
    keyLocation: plan.key.keyLocation.replace(/\/[^/]+\.txt$/, "/[indexnow-key].txt"),
    urls: plan.urls,
    rejected: plan.rejected.slice(0, 50),
  };

  if (plan.dryRun) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  if (plan.urls.length === 0) throw new Error("No canonical HTTP 200 URLs to submit");
  const result = await submitIndexNowPayload({ endpoint: options.endpoint, payload: plan.payload });
  console.log(JSON.stringify({ ...summary, submitStatus: result.status, acceptedByEndpoint: result.ok }, null, 2));
  if (!result.ok) process.exitCode = 1;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`IndexNow failed: ${error.message}`);
    process.exitCode = 1;
  });
}
