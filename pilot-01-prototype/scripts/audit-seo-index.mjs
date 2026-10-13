#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  defaultSitemapPath,
  decodeHtml,
  createBuiltWorkerHarness,
  manifestRouteCanonicalPath,
  renderSitemapPagesWithWorker,
} from "./audit-internal-inlinks.mjs";
import { parsePublicRoute } from "../src/data/locale-routing.js";
import { sitemapContentDates } from "./sitemap-content-dates.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const defaultBaseUrl = "https://nexualpha.com";

const unique = (values) => [...new Set(values.filter(Boolean))];
const sample = (values, limit = 25) => values.slice(0, limit);

// Preserve the request URL: stripping a query, slash, or escape can hide a redirect.
export function auditUrlKey(value, { baseUrl = defaultBaseUrl } = {}) {
  if (!value) return null;
  try {
    const url = new URL(decodeHtml(value), baseUrl);
    if (url.origin !== new URL(baseUrl).origin || url.hash) return null;
    return `${url.pathname}${url.search}`;
  } catch { return null; }
}

function attr(tag, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = String(tag || "").match(new RegExp(`\\b${escaped}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>` + "`" + `]+))`, "i"));
  return match ? (match[1] ?? match[2] ?? match[3] ?? "") : "";
}

function xmlBlocks(xml, tag) {
  return [...String(xml || "").matchAll(new RegExp(`<${tag}\\b[\\s\\S]*?<\\/${tag}>`, "gi"))].map((match) => match[0]);
}

function xmlValue(block, tag) {
  const match = String(block || "").match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? decodeHtml(match[1].trim()) : null;
}

export function parseSitemapXml(xml, { baseUrl = defaultBaseUrl } = {}) {
  if (!/<(?:sitemapindex|urlset)\b/i.test(xml) || !/<\/(?:sitemapindex|urlset)>/i.test(xml)) throw new Error("Invalid sitemap XML");
  if (/<sitemapindex[\s>]/i.test(xml)) {
    return {
      kind: "index",
      sitemaps: xmlBlocks(xml, "sitemap").map((block) => ({
        loc: xmlValue(block, "loc"),
        lastmod: xmlValue(block, "lastmod"),
      })).filter((entry) => entry.loc),
      urls: [],
    };
  }

  return {
    kind: "urlset",
    sitemaps: [],
    urls: xmlBlocks(xml, "url").map((block) => {
      const loc = xmlValue(block, "loc");
      return {
        loc,
        path: auditUrlKey(loc, { baseUrl }),
        lastmod: xmlValue(block, "lastmod"),
        alternates: [...block.matchAll(/<xhtml:link\b[^>]*>/gi)].map((match) => {
          const tag = match[0];
          const rel = attr(tag, "rel");
          const hreflang = attr(tag, "hreflang");
          const href = attr(tag, "href");
          return rel === "alternate" && hreflang && href
            ? { hreflang, href: decodeHtml(href), path: auditUrlKey(href, { baseUrl }) }
            : null;
        }).filter(Boolean),
      };
    }).filter((entry) => entry.loc),
  };
}

export function readBuiltSitemapTree(sitemapPath, { baseUrl = defaultBaseUrl, maxDepth = 2 } = {}) {
  const files = [];
  const missingSitemaps = [];
  const urls = [];
  const seenFiles = new Set();

  function visit(file, depth) {
    if (seenFiles.has(file)) return;
    seenFiles.add(file);
    if (!existsSync(file)) {
      missingSitemaps.push(file);
      return;
    }
    const xml = readFileSync(file, "utf8");
    files.push(file);
    const parsed = parseSitemapXml(xml, { baseUrl });
    if (parsed.kind === "index") {
      if (depth >= maxDepth) throw new Error(`Sitemap index nesting is too deep at ${file}`);
      for (const child of parsed.sitemaps) {
        try {
          visit(path.join(path.dirname(file), path.basename(new URL(child.loc).pathname)), depth + 1);
        } catch {
          missingSitemaps.push(child.loc);
        }
      }
      return;
    }
    urls.push(...parsed.urls.map((entry) => ({ ...entry, sitemapFile: file })));
  }

  visit(sitemapPath, 0);
  urls.sort((a, b) => String(a.path || a.loc).localeCompare(String(b.path || b.loc)));
  return { files, missingSitemaps, urls };
}

async function readCompleteSitemapTree(sitemapPath, { root, baseUrl = defaultBaseUrl } = {}) {
  const clientRoot = path.join(root, "dist", "client");
  const knownRuntimeChildren = new Set(["/news-sitemap.xml"]);
  const files = [];
  const missingSitemaps = [];
  const urls = [];
  const seenNames = new Set();
  const harness = await createBuiltWorkerHarness({ root });

  const addXml = (name, xml, source) => {
    seenNames.add(name);
    const parsed = parseSitemapXml(xml, { baseUrl });
    if (parsed.kind === "urlset") urls.push(...parsed.urls.map((entry) => ({ ...entry, sitemapFile: source })));
    return parsed;
  };

  const rootXml = readFileSync(sitemapPath, "utf8");
  files.push(sitemapPath);
  const rootIndex = addXml("/sitemap.xml", rootXml, sitemapPath);
  const indexChildren = rootIndex.sitemaps.map((entry) => {
    const key = auditUrlKey(entry.loc, { baseUrl });
    if (!key) throw new Error(`Invalid sitemap child URL: ${entry.loc}`);
    return key;
  });
  const builtChildren = existsSync(clientRoot)
    ? readdirSync(clientRoot).filter((name) => /^(?:sitemap-|news-sitemap).*\.xml$/.test(name)).map((name) => `/${name}`)
    : [];

  try {
    const queue = unique([...indexChildren, ...builtChildren, ...knownRuntimeChildren]).map((pathname) => ({ pathname, depth: 1 }));
    for (let index = 0; index < queue.length; index += 1) {
      const { pathname: childPath, depth } = queue[index];
      if (seenNames.has(childPath)) continue;
      if (depth > 8) throw new Error(`Sitemap nesting is too deep: ${childPath}`);
      const enqueue = (parsed) => {
        for (const child of parsed.sitemaps) {
          const key = auditUrlKey(child.loc, { baseUrl });
          if (!key) throw new Error(`Invalid sitemap child URL: ${child.loc}`);
          queue.push({ pathname: key, depth: depth + 1 });
        }
      };
      const localFile = path.join(clientRoot, childPath.slice(1));
      if (existsSync(localFile) && !knownRuntimeChildren.has(childPath)) {
        files.push(localFile);
        enqueue(addXml(childPath, readFileSync(localFile, "utf8"), localFile));
        continue;
      }
      if (!harness) {
        missingSitemaps.push(`${baseUrl}${childPath}`);
        continue;
      }
      const response = await harness.fetch(new Request(new URL(childPath, baseUrl), { headers: { accept: "application/xml,text/xml,*/*" } }));
      if (response.status !== 200) {
        missingSitemaps.push(`${baseUrl}${childPath}`);
        continue;
      }
      enqueue(addXml(childPath, await response.text(), `worker:${childPath}`));
    }
  } finally {
    harness?.close?.();
  }

  urls.sort((a, b) => String(a.path || a.loc).localeCompare(String(b.path || b.loc)));
  return { files, missingSitemaps, urls, indexEntries: rootIndex.sitemaps, sitemapNames: [...seenNames].sort() };
}

function parseRobots(content) {
  const groups = [];
  let current = null;
  let previousKey = null;
  for (const rawLine of String(content || "").split(/\r?\n/)) {
    const line = rawLine.replace(/#.*/, "").trim();
    if (!line) continue;
    const match = line.match(/^([^:]+):\s*(.*)$/);
    if (!match) continue;
    const key = match[1].trim().toLowerCase();
    const value = match[2].trim();
    if (key === "user-agent") {
      if (current && previousKey === "user-agent") {
        current.agents.push(value.toLowerCase());
      } else {
        current = { agents: [value.toLowerCase()], disallow: [], allow: [] };
        groups.push(current);
      }
    } else if (current && key === "disallow") {
      current.disallow.push(value);
    } else if (current && key === "allow") {
      current.allow.push(value);
    }
    previousKey = key;
  }
  return groups;
}

function robotsRuleMatches(rule, pathname) {
  if (!rule) return false;
  const escaped = rule.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replaceAll("*", ".*").replace(/\\\$$/, "$");
  return new RegExp(`^${escaped}`).test(pathname);
}

function agentMatchLength(candidate, agent) {
  if (candidate === "*") return 1;
  return agent.startsWith(candidate) ? candidate.length : 0;
}

function ruleSpecificity(rule) {
  return String(rule || "").replaceAll("*", "").replace(/\$$/, "").length;
}

function robotsBlocks(groups, pathname, agent = "googlebot") {
  const matched = groups
    .map((group) => ({ group, score: Math.max(0, ...group.agents.map((candidate) => agentMatchLength(candidate, agent))) }))
    .filter((entry) => entry.score > 0);
  const bestScore = Math.max(0, ...matched.map((entry) => entry.score));
  const rules = matched.filter((entry) => entry.score === bestScore).flatMap(({ group }) => [
    ...group.allow.map((rule) => ({ type: "allow", rule })),
    ...group.disallow.map((rule) => ({ type: "disallow", rule })),
  ]).filter((entry) => robotsRuleMatches(entry.rule, pathname));
  if (!rules.length) return null;
  rules.sort((a, b) => ruleSpecificity(b.rule) - ruleSpecificity(a.rule) || (a.type === "allow" ? -1 : 1));
  return rules[0].type === "disallow" ? rules[0].rule : null;
}

export function parseHeadMetadata(html, { baseUrl = defaultBaseUrl } = {}) {
  const head = String(html || "").match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] || String(html || "");
  const lang = attr(String(html || "").match(/<html\b[^>]*>/i)?.[0] || "", "lang");
  const title = decodeHtml(head.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, " ").trim() || "");
  const meta = [...head.matchAll(/<meta\b[^>]*>/gi)].map((match) => match[0]);
  const robots = meta
    .filter((tag) => /(?:^|\s)(?:name|http-equiv)\s*=\s*(?:"(?:googlebot|robots)"|'(?:googlebot|robots)'|(?:googlebot|robots)|"(?:x-)?robots-tag"|'(?:x-)?robots-tag'|(?:x-)?robots-tag)/i.test(tag))
    .map((tag) => attr(tag, "content"))
    .filter(Boolean)
    .join(",")
    .toLowerCase();
  const robotsTokens = robots.split(",").map((token) => token.trim()).filter(Boolean);
  const descriptionTag = meta.find((tag) => /\bname\s*=\s*(?:"description"|'description'|description)/i.test(tag));
  const description = decodeHtml(descriptionTag ? attr(descriptionTag, "content") : "").replace(/\s+/g, " ").trim();
  const canonicalHref = attr(head.match(/<link\b[^>]*\brel\s*=\s*(?:"canonical"|'canonical'|canonical)[^>]*>/i)?.[0] || "", "href");
  const alternates = [...head.matchAll(/<link\b[^>]*\brel\s*=\s*(?:"alternate"|'alternate'|alternate)[^>]*>/gi)].map((match) => ({
    hreflang: attr(match[0], "hreflang"),
    href: decodeHtml(attr(match[0], "href")),
  })).filter((entry) => entry.hreflang && entry.href).map((entry) => ({
    ...entry,
    path: auditUrlKey(entry.href, { baseUrl }),
  }));
  const languageLinks = [...String(html || "").matchAll(/<a\b[^>]*>/gi)]
    .map((match) => match[0])
    .filter((tag) => attr(tag, "class").split(/\s+/).includes("nx-lang__opt"))
    .map((tag) => ({ hreflang: attr(tag, "hreflang"), href: decodeHtml(attr(tag, "href")) }))
    .map((entry) => {
      try {
        const target = new URL(entry.href, baseUrl);
        // Fragments preserve browser decision context without changing the requested locale document.
        target.hash = "";
        return { ...entry, path: auditUrlKey(target.href, { baseUrl }) };
      } catch {
        return { ...entry, path: null };
      }
    });
  return {
    title,
    description,
    lang,
    languageLinks,
    robots,
    noindex: robotsTokens.includes("noindex") || robotsTokens.includes("none"),
    indexFollow: robotsTokens.includes("index") && robotsTokens.includes("follow") && !robotsTokens.some((token) => ["noindex", "nofollow", "none"].includes(token)),
    canonicalHref: decodeHtml(canonicalHref),
    canonicalPath: auditUrlKey(canonicalHref, { baseUrl }),
    alternates,
  };
}

function validLastmod(value) {
  return typeof value === "string"
    && /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z)?$/.test(value)
    && Number.isFinite(Date.parse(value));
}

function localeFromPath(pathname) {
  const first = String(pathname || "/").split("/").filter(Boolean)[0] || "";
  return {
    "zh-hans": "zh-Hans",
    "zh-hant": "zh-Hant",
    "pt-br": "pt-BR",
    "id-id": "id",
    "uk-ua": "uk",
  }[first] || (["es", "fr", "de", "ja", "ko", "ar", "tr", "ru", "vi", "it", "ur"].includes(first) ? first : "en");
}

function duplicateRows(pages, field) {
  const groups = new Map();
  for (const page of pages) {
    const locale = page.locale || "unknown";
    const value = String(page[field] || "").trim().toLowerCase();
    if (!value) continue;
    const key = `${locale}\n${value}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(page.path);
  }
  return [...groups.entries()]
    .map(([key, paths]) => {
      const [locale, value] = key.split("\n");
      return { locale, value, count: paths.length, paths: paths.slice(0, 10) };
    })
    .filter((row) => row.count > 1)
    .sort((a, b) => b.count - a.count || a.locale.localeCompare(b.locale));
}

function mapSignature(map) {
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}=${value}`).join("\n");
}

function contentKeyForPath(pathname) {
  try {
    const url = new URL(pathname, defaultBaseUrl);
    return parsePublicRoute(url.pathname, url.searchParams).contentPathname || pathname;
  } catch {
    return pathname;
  }
}

export function headerRobotsFlags(value) {
  let scope = "*";
  const directives = [];
  for (const part of String(value || "").toLowerCase().split(",")) {
    let directive = part.trim();
    const scoped = directive.match(/^([a-z*-]+)\s*:\s*(.*)$/);
    if (scoped) { scope = scoped[1]; directive = scoped[2]; }
    if (["*", "googlebot", "robots"].includes(scope)) directives.push(directive);
  }
  return {
    noindex: directives.includes("noindex") || directives.includes("none"),
    nofollow: directives.includes("nofollow") || directives.includes("none"),
  };
}

function readManifestPaths(clientRoot) {
  const manifestPath = path.join(clientRoot, "prerender-manifest.json");
  if (!existsSync(manifestPath)) return [];
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  return unique(Object.values(manifest.routes || {}).map((route) => manifestRouteCanonicalPath(route))).sort();
}

export function validateIndexConsistency({ pages = [], sitemap = { urls: [], missingSitemaps: [], files: [] }, robotsContent = "", baseUrl = defaultBaseUrl, sampleLimit = 10, expectedLastmod = null } = {}) {
  const pageByPath = new Map(pages.map((page) => [page.path || page.canonicalPath, page]));
  const failures = [...(sitemap.missingSitemaps || []).map((loc) => ({ kind: "missing-sitemap-child", loc }))];
  const robotsGroups = parseRobots(robotsContent);
  const sitemapPaths = unique((sitemap.urls || []).map((entry) => entry.path)).sort();
  const sitemapSet = new Set(sitemapPaths);

  for (const entry of sitemap.urls || []) {
    if (!entry.path) { failures.push({ kind: "invalid-sitemap-url", loc: entry.loc }); continue; }
    const page = pageByPath.get(entry.path);
    if (!page) {
      failures.push({ kind: "sitemap-url-not-rendered", path: entry.path, loc: entry.loc });
      continue;
    }
    if (page.responseStatus !== 200) failures.push({ kind: "sitemap-url-non-200", path: entry.path, status: page.responseStatus });
    if (page.responseUrl && new URL(page.responseUrl).href !== entry.loc) failures.push({ kind: "sitemap-url-redirected", path: entry.path, responseUrl: page.responseUrl });
    if (!page.canonicalHref || page.canonicalHref !== entry.loc) failures.push({ kind: "canonical-not-self", path: entry.path, loc: entry.loc, canonicalHref: page.canonicalHref || null });
    if ((entry.alternates || []).length) {
      const sitemapAlternates = new Map(entry.alternates.map((alternate) => [alternate.hreflang, alternate.href]));
      const headAlternates = new Map((page.alternates || []).map((alternate) => [alternate.hreflang, alternate.href]));
      if (mapSignature(sitemapAlternates) !== mapSignature(headAlternates)) failures.push({ kind: "sitemap-head-hreflang-mismatch", path: entry.path });
    }
    if (page.noindex || !page.indexFollow) failures.push({ kind: "sitemap-url-not-index-follow", path: entry.path, robots: page.robots || "" });
    const blockedBy = robotsBlocks(robotsGroups, entry.path);
    if (blockedBy) failures.push({ kind: "robots-blocks-indexable", path: entry.path, rule: blockedBy });
    if (entry.lastmod && !validLastmod(entry.lastmod)) failures.push({ kind: "invalid-lastmod", path: entry.path, lastmod: entry.lastmod });
    if (entry.lastmod && expectedLastmod) {
      const expected = expectedLastmod(entry.loc);
      if (!expected) failures.push({ kind: "unverified-content-lastmod", path: entry.path, lastmod: entry.lastmod });
      else if (entry.lastmod.slice(0, 10) !== expected) failures.push({ kind: "content-lastmod-mismatch", path: entry.path, lastmod: entry.lastmod, expected });
    }
  }

  for (const entry of sitemap.indexEntries || []) {
    if (!entry.lastmod) continue;
    const name = path.basename(new URL(entry.loc).pathname);
    const childDates = (sitemap.urls || []).filter((row) => path.basename(row.sitemapFile || "") === name && row.lastmod).map((row) => row.lastmod.slice(0, 10)).sort();
    const newest = childDates.at(-1);
    if (!validLastmod(entry.lastmod) || (newest && entry.lastmod.slice(0, 10) !== newest)) {
      failures.push({ kind: "sitemap-index-lastmod-mismatch", loc: entry.loc, lastmod: entry.lastmod, expected: newest || null });
    }
  }

  for (const page of pages) {
    const pagePath = page.path || page.canonicalPath;
    const blockedBy = !page.noindex ? robotsBlocks(robotsGroups, pagePath) : null;
    if (blockedBy) failures.push({ kind: "robots-blocks-indexable-corpus", path: pagePath, rule: blockedBy });
    if (page.noindex && sitemapSet.has(pagePath)) failures.push({ kind: "noindex-in-sitemap", path: pagePath });
    if (page.noindex && page.alternates?.length) failures.push({ kind: "noindex-has-hreflang", path: pagePath, alternates: page.alternates.length });
    if (!page.noindex && !page.canonicalHref) failures.push({ kind: "missing-canonical", path: pagePath });
    if (!page.noindex && (!page.title || !page.description)) failures.push({ kind: "missing-search-metadata", path: pagePath });
    const languageTargets = new Set((page.alternates || []).filter((entry) => entry.hreflang !== "x-default").map((entry) => `${entry.hreflang}|${entry.path}`));
    for (const link of page.languageLinks || []) {
      if (!link.path || !languageTargets.has(`${link.hreflang}|${link.path}`)) {
        failures.push({ kind: "language-link-not-in-hreflang", path: pagePath, href: link.href, hreflang: link.hreflang });
      }
    }
    if (page.canonicalPath && page.canonicalPath !== pagePath) {
      const target = pageByPath.get(page.canonicalPath);
      if (!target) failures.push({ kind: "canonical-target-not-rendered", path: pagePath, canonicalPath: page.canonicalPath });
      else if (target.noindex) failures.push({ kind: "canonical-target-noindex", path: pagePath, canonicalPath: page.canonicalPath });
      else if (target.canonicalPath !== page.canonicalPath) failures.push({ kind: "canonical-chain", path: pagePath, canonicalPath: page.canonicalPath, targetCanonicalPath: target.canonicalPath });
    }
  }

  const members = pages.filter((page) => !page.noindex && page.responseStatus === 200 && page.canonicalPath === page.path);
  const memberByPath = new Map(members.map((page) => [page.path, page]));
  const parents = new Map(members.map((page) => [page.path, page.path]));
  const find = (key) => {
    if (parents.get(key) !== key) parents.set(key, find(parents.get(key)));
    return parents.get(key);
  };
  const join = (left, right) => {
    if (parents.has(left) && parents.has(right)) parents.set(find(right), find(left));
  };
  const routeOwner = new Map();
  for (const page of members) {
    const key = contentKeyForPath(page.path);
    if (routeOwner.has(key)) join(page.path, routeOwner.get(key));
    else routeOwner.set(key, page.path);
    // Translated slugs (the Brazil deadline topic) are still members of one reciprocal cluster.
    for (const alternate of page.alternates || []) join(page.path, alternate.path);
  }
  const contentClusters = new Map();
  for (const page of members) {
    const key = find(page.path);
    if (!contentClusters.has(key)) contentClusters.set(key, []);
    contentClusters.get(key).push(page);
  }
  for (const cluster of contentClusters.values()) {
    const expected = new Map();
    for (const page of cluster) {
      const locale = page.lang || localeFromPath(page.path);
      if (expected.has(locale) && expected.get(locale) !== page.canonicalHref) {
        failures.push({ kind: "hreflang-duplicate-locale", path: page.path, locale });
      }
      expected.set(locale, page.canonicalHref);
    }
    const declaredDefault = cluster[0].alternates?.find((alternate) => alternate.hreflang === "x-default");
    const defaultTarget = declaredDefault && memberByPath.get(declaredDefault.path);
    expected.set("x-default", defaultTarget?.canonicalHref || expected.get("en") || cluster[0].canonicalHref);
    const expectedSignature = mapSignature(expected);
    for (const page of cluster) {
      const actual = new Map((page.alternates || []).map((alternate) => [alternate.hreflang, alternate.href]));
      if (mapSignature(actual) !== expectedSignature) failures.push({ kind: "hreflang-cluster-incomplete", path: page.path });
    }
  }

  for (const page of pages) {
    const pagePath = page.path || page.canonicalPath;
    if (page.noindex || !page.alternates?.length) continue;
    const sourceMap = hreflangMap(page);
    const sourceSignature = hreflangSignature(page);
    if (!sourceMap.has("x-default")) failures.push({ kind: "hreflang-missing-x-default", path: pagePath });
    for (const alternate of page.alternates) {
      const target = pageByPath.get(alternate.path);
      if (!target) failures.push({ kind: "hreflang-target-not-rendered", path: pagePath, alternate: alternate.href });
      else if (target.responseStatus !== 200 || target.noindex || target.canonicalHref !== alternate.href) failures.push({ kind: "hreflang-target-not-indexable-self-canonical", path: pagePath, target: alternate.path, status: target.responseStatus, noindex: target.noindex, canonicalHref: target.canonicalHref || null });
      else if (hreflangSignature(target) !== sourceSignature) failures.push({ kind: "hreflang-not-reciprocal", path: pagePath, target: alternate.path });
    }
  }

  const indexableCorpus = pages.map((page) => ({
    ...page,
    locale: page.lang || localeFromPath(page.path || page.canonicalPath),
  })).filter((page) => !page.noindex);
  for (const row of duplicateRows(indexableCorpus, "title")) failures.push({ kind: "duplicate-title", ...row });
  for (const row of duplicateRows(indexableCorpus, "description")) failures.push({ kind: "duplicate-description", ...row });

  const byKind = {};
  for (const failure of failures) byKind[failure.kind] = (byKind[failure.kind] || 0) + 1;
  return {
    ok: failures.length === 0,
    failures,
    failuresByKind: byKind,
    samples: Object.fromEntries(Object.keys(byKind).sort().map((kind) => [kind, sample(failures.filter((failure) => failure.kind === kind), sampleLimit)])),
  };
}

async function renderSeoPages({ paths, root, baseUrl, concurrency, maxPasses = 4 }) {
  const pages = new Map();
  const errors = [];
  const queued = new Set(paths);
  let pass = 0;

  while (pass < maxPasses) {
    const batch = [...queued].filter((pathname) => !pages.has(pathname));
    queued.clear();
    if (!batch.length) break;
    const rendered = await renderSitemapPagesWithWorker({
      paths: batch.sort(),
      root,
      baseUrl,
      concurrency,
      includeLinks: false,
      inspectPage: ({ path: pathname, html, status, headers, url }) => ({
        path: auditUrlKey(pathname, { baseUrl }),
        responseStatus: status,
        responseUrl: url,
        contentType: headers.get("content-type") || "",
      ...(() => {
        const meta = parseHeadMetadata(html, { baseUrl });
        const headerRobots = headers.get("x-robots-tag") || "";
        const headerFlags = headerRobotsFlags(headerRobots);
        return {
          ...meta,
          robots: unique([meta.robots, headerRobots.toLowerCase()]).filter(Boolean).join(","),
          noindex: meta.noindex || headerFlags.noindex,
          indexFollow: meta.indexFollow && !headerFlags.noindex && !headerFlags.nofollow,
        };
      })(),
      }),
    });
    errors.push(...rendered.errors);
    for (const page of rendered.pages) {
      const pagePath = page.path || page.canonicalPath;
      if (pagePath) pages.set(pagePath, page);
    }
    for (const page of rendered.pages) {
      if (page.canonicalPath && !pages.has(page.canonicalPath)) queued.add(page.canonicalPath);
      for (const alternate of page.alternates || []) {
        if (alternate.path && !pages.has(alternate.path)) queued.add(alternate.path);
      }
    }
    pass += 1;
  }

  return { pages: [...pages.values()].sort((a, b) => (a.path || a.canonicalPath).localeCompare(b.path || b.canonicalPath)), errors, pending: [...queued].sort() };
}

function hreflangMap(page) {
  return new Map((page.alternates || []).map((alternate) => [alternate.hreflang, alternate.path]));
}

function hreflangSignature(page) {
  return [...hreflangMap(page).entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}=${value}`).join("\n");
}

export async function runSeoIndexAudit(options) {
  const sitemapPath = options.sitemap || defaultSitemapPath(options.root);
  const clientRoot = path.join(options.root, "dist", "client");
  if (!existsSync(sitemapPath) || !existsSync(clientRoot)) {
    return {
      generatedAt: new Date().toISOString(),
      ok: false,
      stats: { sitemapUrls: 0, renderedPages: 0, manifestRoutes: 0, failures: 1 },
      failures: [{ kind: "missing-built-site", sitemap: sitemapPath, clientRoot }],
      samples: {},
    };
  }

  const sitemap = await readCompleteSitemapTree(sitemapPath, { root: options.root, baseUrl: options.baseUrl });
  const sitemapPaths = unique(sitemap.urls.map((entry) => entry.path)).sort();
  const manifestPaths = readManifestPaths(clientRoot);
  const alternatePaths = unique(sitemap.urls.flatMap((entry) => entry.alternates.map((alternate) => alternate.path))).sort();
  const pathsToRender = unique([...sitemapPaths, ...manifestPaths, ...alternatePaths]).sort();
  const rendered = await renderSeoPages({
    paths: pathsToRender,
    root: options.root,
    baseUrl: options.baseUrl,
    concurrency: options.concurrency,
  });

  const robotsPath = path.join(clientRoot, "robots.txt");
  const robotsContent = existsSync(robotsPath) ? readFileSync(robotsPath, "utf8") : "";
  // A caller may retain the inspected metadata for rule-level diagnostics without rerendering the site.
  if (options.onCorpus) await options.onCorpus({ pages: rendered.pages, sitemap, robotsContent });
  const contentDates = sitemapContentDates(clientRoot);
  const validation = validateIndexConsistency({
    expectedLastmod: (loc) => contentDates.expected(loc),
    pages: rendered.pages,
    sitemap,
    robotsContent,
    baseUrl: options.baseUrl,
    sampleLimit: options.sampleLimit,
  });
  for (const error of rendered.errors) validation.failures.push({ kind: "worker-render-error", ...error });
  for (const pathname of rendered.pending) validation.failures.push({ kind: "render-target-not-reached", path: pathname });
  const byKind = {};
  for (const failure of validation.failures) byKind[failure.kind] = (byKind[failure.kind] || 0) + 1;
  return {
    generatedAt: new Date().toISOString(),
    ok: validation.failures.length === 0,
    stats: {
      sitemapFiles: sitemap.files.length,
      sitemapUrls: sitemap.urls.length,
      contentLastmodsChecked: sitemap.urls.filter((entry) => entry.lastmod).length,
      manifestRoutes: manifestPaths.length,
      hreflangTargets: alternatePaths.length,
      renderedPages: rendered.pages.length,
      renderErrors: rendered.errors.length,
      failures: validation.failures.length,
    },
    failuresByKind: byKind,
    samples: Object.fromEntries(Object.keys(byKind).sort().map((kind) => [kind, sample(validation.failures.filter((failure) => failure.kind === kind), options.sampleLimit)])),
    inputs: {
      root: options.root,
      sitemap: sitemapPath,
      baseUrl: options.baseUrl,
    },
  };
}

export function parseArgs(argv) {
  const options = { root: projectRoot, baseUrl: defaultBaseUrl, sitemap: null, output: null, pretty: false, concurrency: 8, sampleLimit: 10 };
  const next = (args, index, flag) => {
    if (!args[index + 1] || args[index + 1].startsWith("--")) throw new Error(`${flag} requires a value`);
    return args[index + 1];
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--root") options.root = path.resolve(next(argv, index++, arg));
    else if (arg.startsWith("--root=")) options.root = path.resolve(arg.slice("--root=".length));
    else if (arg === "--sitemap") options.sitemap = path.resolve(next(argv, index++, arg));
    else if (arg.startsWith("--sitemap=")) options.sitemap = path.resolve(arg.slice("--sitemap=".length));
    else if (arg === "--base-url") options.baseUrl = next(argv, index++, arg).replace(/\/$/, "");
    else if (arg.startsWith("--base-url=")) options.baseUrl = arg.slice("--base-url=".length).replace(/\/$/, "");
    else if (arg === "--output" || arg === "--out") options.output = path.resolve(next(argv, index++, arg));
    else if (arg.startsWith("--output=")) options.output = path.resolve(arg.slice("--output=".length));
    else if (arg.startsWith("--out=")) options.output = path.resolve(arg.slice("--out=".length));
    else if (arg === "--concurrency") options.concurrency = Number(next(argv, index++, arg));
    else if (arg.startsWith("--concurrency=")) options.concurrency = Number(arg.slice("--concurrency=".length));
    else if (arg === "--sample-limit") options.sampleLimit = Number(next(argv, index++, arg));
    else if (arg.startsWith("--sample-limit=")) options.sampleLimit = Number(arg.slice("--sample-limit=".length));
    else if (arg === "--pretty") options.pretty = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!Number.isFinite(options.concurrency) || options.concurrency < 1) throw new Error("--concurrency must be a positive number");
  if (!Number.isFinite(options.sampleLimit) || options.sampleLimit < 1) throw new Error("--sample-limit must be a positive number");
  return options;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const options = parseArgs(process.argv.slice(2));
    const report = await runSeoIndexAudit(options);
    const json = `${JSON.stringify(report, null, options.pretty ? 2 : 0)}\n`;
    if (options.output) writeFileSync(options.output, json);
    else process.stdout.write(json);
    process.exitCode = report.ok ? 0 : 1;
  } catch (error) {
    console.error(error.stack || error.message);
    process.exitCode = 2;
  }
}
