#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { DEPOSIT_ROOTS } from "../src/data/deposit-routes.js";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { contentTypeForAssetPath, resolveAssetPath } from "../server/asset-path.mjs";
import { createFundingMatrixReader } from "../server/funding-matrix.mjs";
import { createFxFeed, FX_JSON_PATH } from "../server/fx-feed.mjs";
import { createLiquidationLevelsFeed, LIQUIDATION_LEVELS_PATH } from "../server/liquidation-levels-feed.mjs";
import { marketEventsReaderFromEnv } from "../server/market-events-feed.mjs";
import { createNewsSsrRenderer } from "../server/news-ssr.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const defaultSiteOrigin = "https://nexualpha.com";
const localePrefixByCode = Object.freeze({
  en: "",
  "zh-Hans": "zh-hans",
  "zh-Hant": "zh-hant",
  es: "es",
  "pt-BR": "pt-br",
  fr: "fr",
  de: "de",
  ja: "ja",
  ko: "ko",
  ar: "ar",
  tr: "tr",
  ru: "ru",
  id: "id-id",
  vi: "vi",
  it: "it",
  ur: "ur",
  uk: "uk-ua",
});
const localePrefixes = new Set(Object.values(localePrefixByCode).filter(Boolean));
const countryRoutePrefixes = ["/br", "/mx", "/tw", "/id", "/vn", "/hk", "/eu", "/uk", "/us", "/jp", "/kr", "/sg", "/int"];
const globalRoutePrefixes = [...DEPOSIT_ROOTS, "/crypto-cards", "/exchanges", "/compare", "/topics", "/factbook", "/activities", "/news", "/markets", "/academy", "/licenses", "/flash", "/coins", "/convert", "/glossary", "/tokenized-stocks"];
const globalExactRoutes = new Set(["/", "/rates", "/onchain", "/methodology", "/about", "/editorial-policy", "/privacy", "/terms", "/contact", "/partners", "/telegram", "/liquidations", "/liquidations/heatmap", "/funding-rates", "/etf-flows", "/calendar", "/funding-rates/matrix"]);

export function decodeHtml(value) {
  return String(value || "")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#34;/g, "\"")
    .replace(/&#x27;|&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

export function normalizeCanonicalPath(href, { baseUrl = defaultSiteOrigin } = {}) {
  try {
    const parsed = new URL(decodeHtml(href), baseUrl);
    if (parsed.origin !== new URL(baseUrl).origin) return null;
    const decodedPath = decodeURIComponent(parsed.pathname).replace(/\/{2,}/g, "/");
    return decodedPath !== "/" ? decodedPath.replace(/\/+$/, "") : "/";
  } catch {
    return null;
  }
}

export function stripNonBodyLinks(html) {
  return String(html || "")
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "")
    .replace(/<template\b[\s\S]*?<\/template>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");
}

export function extractPlainInternalAnchors(html, { baseUrl = defaultSiteOrigin } = {}) {
  const links = [];
  const body = stripNonBodyLinks(html);
  const anchorPattern = /<a\b([^>]*)>/gi;
  for (const match of body.matchAll(anchorPattern)) {
    const attrs = match[1] || "";
    const hrefMatch = attrs.match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/i);
    if (!hrefMatch) continue;
    const href = hrefMatch[1] ?? hrefMatch[2] ?? hrefMatch[3];
    const canonicalPath = normalizeCanonicalPath(href, { baseUrl });
    if (!canonicalPath) continue;
    links.push({ href: decodeHtml(href), canonicalPath });
  }
  return links;
}

export function hasNoindex(html) {
  const headEnd = String(html || "").search(/<\/head>/i);
  const head = headEnd >= 0 ? String(html || "").slice(0, headEnd) : String(html || "");
  for (const match of head.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = match[0];
    if (!/\b(?:name|http-equiv)\s*=\s*(?:"robots"|'robots'|robots|"(?:x-)?robots-tag"|'(?:x-)?robots-tag'|(?:x-)?robots-tag)/i.test(tag)) continue;
    const content = tag.match(/\bcontent\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/i);
    if (content && /\bnoindex\b/i.test(content[1] ?? content[2] ?? content[3] ?? "")) return true;
  }
  return false;
}

export function routeType(canonicalPath) {
  const segments = String(canonicalPath || "/").split("/").filter(Boolean);
  const contentSegments = localePrefixes.has((segments[0] || "").toLowerCase()) ? segments.slice(1) : segments;
  if (contentSegments.length === 0) return "/";
  if (contentSegments.length === 1) return `/${contentSegments[0]}`;
  if (["news", "exchanges", "compare", "coins", "academy", "glossary", "licenses"].includes(contentSegments[0])) return `/${contentSegments[0]}/:slug`;
  if (contentSegments.length === 2) return `/${contentSegments[0]}/:slug`;
  return `/${contentSegments[0]}/${contentSegments[1]}/:slug`;
}

function hasPathPrefix(pathname, prefix) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function isLocalePathEligible(pathname) {
  const normalized = normalizeCanonicalPath(pathname) || "/";
  if (normalized === "/embed/calculator") return false;
  if (countryRoutePrefixes.some((prefix) => hasPathPrefix(normalized, prefix))) return false;
  if (["/api", "/assets", "/brand", "/content", "/ref"].some((prefix) => hasPathPrefix(normalized, prefix))) return false;
  return globalExactRoutes.has(normalized) || globalRoutePrefixes.some((prefix) => hasPathPrefix(normalized, prefix));
}

export function manifestRouteCanonicalPath(route) {
  const pathname = normalizeCanonicalPath(route?.pathname || "/") || "/";
  const locale = route?.locale || "en";
  const prefix = localePrefixByCode[locale];
  if (!prefix || !isLocalePathEligible(pathname)) return pathname;
  return pathname === "/" ? `/${prefix}` : `/${prefix}${pathname}`;
}

export function htmlFileToCanonicalPath(filePath, htmlRoot) {
  const relative = path.relative(htmlRoot, filePath).split(path.sep).join("/");
  if (relative === "index.html") return "/";
  if (!relative.endsWith("/index.html")) return null;
  return `/${relative.slice(0, -"/index.html".length)}`.replace(/\/{2,}/g, "/").replace(/\/+$/, "") || "/";
}

export function findHtmlFiles(root) {
  const files = [];
  if (!root || !existsSync(root)) return files;
  const visit = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith(".")) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (["assets", "node_modules"].includes(entry.name)) continue;
        visit(full);
      } else if (entry.isFile() && entry.name === "index.html") {
        files.push(full);
      }
    }
  };
  visit(root);
  return files.sort();
}

export function readHtmlInventory(htmlRoot) {
  const manifestPath = path.join(htmlRoot || "", "prerender-manifest.json");
  if (existsSync(manifestPath)) return readPrerenderInventory(htmlRoot, manifestPath);

  const pages = new Map();
  for (const file of findHtmlFiles(htmlRoot)) {
    const canonicalPath = htmlFileToCanonicalPath(file, htmlRoot);
    if (!canonicalPath) continue;
    const html = readFileSync(file, "utf8");
    pages.set(canonicalPath, {
      canonicalPath,
      file,
      noindex: hasNoindex(html),
      routeType: routeType(canonicalPath),
      links: extractPlainInternalAnchors(html),
    });
  }
  return [...pages.values()];
}

export function readPrerenderInventory(clientRoot, manifestPath = path.join(clientRoot, "prerender-manifest.json")) {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const pages = new Map();
  for (const route of Object.values(manifest.routes || {})) {
    if (!route || typeof route !== "object") continue;
    const canonicalPath = manifestRouteCanonicalPath(route);
    const asset = typeof route.asset === "string" ? route.asset.replace(/^\//, "") : "";
    const file = path.join(clientRoot, asset);
    if (!asset || !existsSync(file)) continue;
    const payload = JSON.parse(readFileSync(file, "utf8"));
    const html = typeof payload.html === "string" ? payload.html : "";
    const row = {
      canonicalPath,
      file,
      noindex: route.searchPublished === false || hasNoindex(html),
      routeType: routeType(canonicalPath),
      links: extractPlainInternalAnchors(html),
    };
    const previous = pages.get(canonicalPath);
    if (!previous) {
      pages.set(canonicalPath, row);
    } else {
      previous.noindex = previous.noindex && row.noindex;
      previous.links.push(...row.links);
      previous.file = previous.file === row.file ? previous.file : manifestPath;
    }
  }
  return [...pages.values()].sort((a, b) => a.canonicalPath.localeCompare(b.canonicalPath));
}

export function sitemapLocs(xml) {
  return [...String(xml || "").matchAll(/<loc>([^<]+)<\/loc>/gi)].map((match) => decodeHtml(match[1].trim()));
}

export function isSitemapIndex(xml) {
  return /<sitemapindex[\s>]/i.test(String(xml || ""));
}

export function readSitemapInventory(sitemapPath, { baseUrl = defaultSiteOrigin, maxDepth = 2 } = {}) {
  const pagePaths = new Set();
  const files = [];
  const missingSitemaps = [];
  if (!sitemapPath || !existsSync(sitemapPath)) return { pagePaths: [], files, missingSitemaps };

  const visit = (file, depth) => {
    const xml = readFileSync(file, "utf8");
    files.push(file);
    const locs = sitemapLocs(xml);
    if (isSitemapIndex(xml)) {
      if (depth >= maxDepth) throw new Error(`Sitemap index nesting is too deep at ${file}`);
      for (const loc of locs) {
        let child;
        try {
          child = path.join(path.dirname(file), path.basename(new URL(loc).pathname));
        } catch {
          missingSitemaps.push(loc);
          continue;
        }
        if (existsSync(child)) visit(child, depth + 1);
        else missingSitemaps.push(loc);
      }
      return;
    }
    for (const loc of locs) {
      const canonicalPath = normalizeCanonicalPath(loc, { baseUrl });
      if (canonicalPath) pagePaths.add(canonicalPath);
    }
  };

  visit(sitemapPath, 0);
  return { pagePaths: [...pagePaths].sort(), files, missingSitemaps };
}

export function auditInternalInlinks({ pages, sitemapPagePaths = [], baseUrl = defaultSiteOrigin, minInlinks = 3 } = {}) {
  const byPath = new Map(pages.map((page) => [page.canonicalPath, page]));
  const sitemapSet = new Set(sitemapPagePaths);
  const requiredPaths = sitemapPagePaths.length ? [...sitemapSet] : pages.filter((page) => !page.noindex).map((page) => page.canonicalPath);
  const inboundReferrers = new Map(requiredPaths.map((pathname) => [pathname, new Set()]));
  const allInboundReferrers = new Map(pages.map((page) => [page.canonicalPath, new Set()]));

  for (const page of pages) {
    for (const link of page.links) {
      const target = normalizeCanonicalPath(link.canonicalPath, { baseUrl });
      if (!target || target === page.canonicalPath) continue;
      if (allInboundReferrers.has(target)) allInboundReferrers.get(target).add(page.canonicalPath);
      if (inboundReferrers.has(target)) inboundReferrers.get(target).add(page.canonicalPath);
    }
  }

  const missingHtml = requiredPaths.filter((pathname) => !byPath.has(pathname)).sort();
  const indexablePages = requiredPaths
    .filter((pathname) => byPath.has(pathname))
    .map((pathname) => byPath.get(pathname))
    .filter((page) => !page.noindex);
  const noindexInSitemap = requiredPaths.filter((pathname) => byPath.get(pathname)?.noindex).sort();
  const lowInlinks = indexablePages
    .map((page) => ({
      path: page.canonicalPath,
      routeType: page.routeType,
      inlinks: inboundReferrers.get(page.canonicalPath)?.size || 0,
      referrers: [...(inboundReferrers.get(page.canonicalPath) || [])].sort(),
    }))
    .filter((row) => row.inlinks < minInlinks)
    .sort((a, b) => a.inlinks - b.inlinks || a.path.localeCompare(b.path));

  const routeTypes = new Map();
  for (const page of indexablePages) {
    if (!routeTypes.has(page.routeType)) routeTypes.set(page.routeType, { routeType: page.routeType, pages: 0, totalInbound: 0, pagesWithInbound: 0 });
    const row = routeTypes.get(page.routeType);
    const count = inboundReferrers.get(page.canonicalPath)?.size || 0;
    row.pages += 1;
    row.totalInbound += count;
    if (count > 0) row.pagesWithInbound += 1;
  }
  const zeroInboundRouteTypes = [...routeTypes.values()]
    .filter((row) => row.totalInbound === 0)
    .map((row) => row.routeType)
    .sort();

  return {
    generatedAt: new Date().toISOString(),
    minInlinks,
    stats: {
      htmlPages: pages.length,
      indexablePages: indexablePages.length,
      noindexPages: pages.filter((page) => page.noindex).length,
      sitemapPages: sitemapPagePaths.length,
      missingHtml: missingHtml.length,
      lowInlinks: lowInlinks.length,
      routeTypes: routeTypes.size,
    },
    missingHtml,
    noindexInSitemap,
    lowInlinks,
    routeTypes: [...routeTypes.values()].sort((a, b) => a.routeType.localeCompare(b.routeType)),
    zeroInboundRouteTypes,
  };
}

async function pool(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.max(1, Math.min(limit, items.length || 1)) }, async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await worker(items[index], index);
    }
  }));
  return results;
}

export async function createBuiltWorkerHarness({ root = projectRoot } = {}) {
  const distRoot = path.join(root, "dist");
  const clientRoot = path.join(distRoot, "client");
  const workerPath = path.join(distRoot, "server", "index.js");
  if (!existsSync(workerPath) || !existsSync(clientRoot)) {
    return null;
  }

  const { default: worker } = await import(pathToFileURL(workerPath));
  const renderNews = createNewsSsrRenderer(distRoot);
  const fundingMatrix = createFundingMatrixReader({ enabled: false });
  const marketEvents = marketEventsReaderFromEnv({}, {
    fetchImpl: async () => new Response("{}", { status: 503, headers: { "content-type": "application/json" } }),
  });
  const liquidationLevels = createLiquidationLevelsFeed({ fetchImpl: async () => new Response("{}", { status: 503 }), sources: {}, log: () => {} });
  const fx = createFxFeed({ enabled: false, log: () => {} });
  const assets = {
    async fetch(request) {
      const url = new URL(request.url);
      const filePath = resolveAssetPath(clientRoot, url.pathname);
      if (!filePath) return new Response("missing", { status: 404 });
      return new Response(request.method === "HEAD" ? null : readFileSync(filePath), {
        status: 200,
        headers: { "content-type": contentTypeForAssetPath(filePath), "cache-control": "no-cache" },
      });
    },
  };

  return {
    clientRoot,
    close() {
      fx.stop?.();
      liquidationLevels.stop?.();
      fundingMatrix.stop?.();
      marketEvents.stop?.();
    },
    async fetch(request) {
      const url = new URL(request.url);
      if (url.pathname === FX_JSON_PATH) return fx.respond(request.method);
      if (url.pathname === LIQUIDATION_LEVELS_PATH) return liquidationLevels.respond(request.method);
      return worker.fetch(request, {
        ASSETS: assets,
        NEWS_SSR_RENDER: renderNews,
        FUNDING_MATRIX_READ: fundingMatrix.read,
        MARKET_EVENTS_READ: marketEvents.read,
        LIQUIDATION_LEVELS_READ: liquidationLevels.read,
        FX_SNAPSHOT_READ: fx.read,
      });
    },
  };
}

export async function renderSitemapPagesWithWorker({ paths, root = projectRoot, baseUrl = defaultSiteOrigin, concurrency = 8, inspectPage = null, includeLinks = true } = {}) {
  const harness = await createBuiltWorkerHarness({ root });
  if (!harness) {
    return { pages: [], errors: paths.map((pathname) => ({ path: pathname, status: 0, error: "built-worker-unavailable" })) };
  }

  const pages = [];
  const errors = [];
  try {
    await pool(paths, concurrency, async (pathname) => {
      try {
        const request = new Request(new URL(pathname, baseUrl), { headers: { accept: "text/html", "user-agent": "NexuAlpha-Internal-Inlink-Audit" } });
        const response = await harness.fetch(request);
        const contentType = response.headers.get("content-type") || "";
        if (response.status !== 200 || !/text\/html/i.test(contentType)) {
          errors.push({ path: pathname, status: response.status, contentType });
          return;
        }
        const html = await response.text();
        const inspected = typeof inspectPage === "function"
          ? await inspectPage({
              path: pathname,
              html,
              status: response.status,
              headers: response.headers,
              url: response.url || request.url,
            })
          : null;
        pages.push({
          canonicalPath: normalizeCanonicalPath(pathname, { baseUrl }),
          file: `worker:${pathname}`,
          noindex: hasNoindex(html),
          routeType: routeType(pathname),
          links: includeLinks ? extractPlainInternalAnchors(html, { baseUrl }) : [],
          ...(inspected && typeof inspected === "object" ? inspected : {}),
        });
      } catch (error) {
        errors.push({ path: pathname, status: 0, error: String(error?.message || error) });
      }
    });
  } finally {
    harness.close?.();
  }
  return { pages: pages.sort((a, b) => (a.path || a.canonicalPath || "").localeCompare(b.path || b.canonicalPath || "")), errors: errors.sort((a, b) => a.path.localeCompare(b.path)) };
}

export function defaultHtmlRoot(root = projectRoot) {
  for (const candidate of ["dist/client", "dist/sites", "dist"]) {
    const full = path.join(root, candidate);
    if (existsSync(full) && findHtmlFiles(full).length) return full;
  }
  return path.join(root, "dist", "client");
}

export function defaultSitemapPath(root = projectRoot) {
  for (const candidate of ["dist/client/sitemap.xml", "dist/sitemap.xml", "public/sitemap.xml"]) {
    const full = path.join(root, candidate);
    if (existsSync(full)) return full;
  }
  return path.join(root, "dist", "client", "sitemap.xml");
}

export function parseArgs(argv) {
  const options = { root: projectRoot, baseUrl: defaultSiteOrigin, minInlinks: 3, pretty: false, output: null, htmlRoot: null, sitemap: null, renderMissing: true, concurrency: 8 };
  const next = (args, index, flag) => {
    if (!args[index + 1] || args[index + 1].startsWith("--")) throw new Error(`${flag} requires a value`);
    return args[index + 1];
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--pretty") options.pretty = true;
    else if (arg === "--root") options.root = path.resolve(next(argv, index++, arg));
    else if (arg.startsWith("--root=")) options.root = path.resolve(arg.slice("--root=".length));
    else if (arg === "--html-root") options.htmlRoot = path.resolve(next(argv, index++, arg));
    else if (arg.startsWith("--html-root=")) options.htmlRoot = path.resolve(arg.slice("--html-root=".length));
    else if (arg === "--sitemap") options.sitemap = path.resolve(next(argv, index++, arg));
    else if (arg.startsWith("--sitemap=")) options.sitemap = path.resolve(arg.slice("--sitemap=".length));
    else if (arg === "--out" || arg === "--output") options.output = path.resolve(next(argv, index++, arg));
    else if (arg.startsWith("--out=")) options.output = path.resolve(arg.slice("--out=".length));
    else if (arg.startsWith("--output=")) options.output = path.resolve(arg.slice("--output=".length));
    else if (arg === "--base-url") options.baseUrl = next(argv, index++, arg).replace(/\/$/, "");
    else if (arg.startsWith("--base-url=")) options.baseUrl = arg.slice("--base-url=".length).replace(/\/$/, "");
    else if (arg === "--min-inlinks") options.minInlinks = Number(next(argv, index++, arg));
    else if (arg.startsWith("--min-inlinks=")) options.minInlinks = Number(arg.slice("--min-inlinks=".length));
    else if (arg === "--render-missing") options.renderMissing = true;
    else if (arg === "--no-render-missing") options.renderMissing = false;
    else if (arg === "--concurrency") options.concurrency = Number(next(argv, index++, arg));
    else if (arg.startsWith("--concurrency=")) options.concurrency = Number(arg.slice("--concurrency=".length));
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!Number.isFinite(options.minInlinks) || options.minInlinks < 0) throw new Error("--min-inlinks must be a non-negative number");
  if (!Number.isFinite(options.concurrency) || options.concurrency < 1) throw new Error("--concurrency must be a positive number");
  if (!options.htmlRoot) options.htmlRoot = defaultHtmlRoot(options.root);
  if (!options.sitemap) options.sitemap = defaultSitemapPath(options.root);
  return options;
}

export function runAudit(options) {
  const pages = readHtmlInventory(options.htmlRoot);
  const sitemap = readSitemapInventory(options.sitemap, { baseUrl: options.baseUrl });
  const report = auditInternalInlinks({ pages, sitemapPagePaths: sitemap.pagePaths, baseUrl: options.baseUrl, minInlinks: options.minInlinks });
  report.inputs = {
    htmlRoot: options.htmlRoot,
    sitemap: options.sitemap,
    sitemapFiles: sitemap.files,
    missingSitemaps: sitemap.missingSitemaps,
  };
  report.failures = [
    ...report.missingHtml.map((pathname) => ({ kind: "sitemap-url-missing-html", path: pathname })),
    ...report.zeroInboundRouteTypes.map((type) => ({ kind: "route-type-zero-inbound", routeType: type })),
  ];
  return report;
}

export async function runAuditComplete(options) {
  const pages = readHtmlInventory(options.htmlRoot);
  const sitemap = readSitemapInventory(options.sitemap, { baseUrl: options.baseUrl });
  const known = new Set(pages.map((page) => page.canonicalPath));
  const missingBeforeRender = sitemap.pagePaths.filter((pathname) => !known.has(pathname));
  let rendered = { pages: [], errors: [] };
  if (options.renderMissing && missingBeforeRender.length) {
    rendered = await renderSitemapPagesWithWorker({
      paths: missingBeforeRender,
      root: options.root,
      baseUrl: options.baseUrl,
      concurrency: options.concurrency,
    });
  }
  const mergedPages = [...pages];
  const mergedKnown = new Set(known);
  for (const page of rendered.pages) {
    if (!page?.canonicalPath || mergedKnown.has(page.canonicalPath)) continue;
    mergedPages.push(page);
    mergedKnown.add(page.canonicalPath);
  }
  const report = auditInternalInlinks({ pages: mergedPages, sitemapPagePaths: sitemap.pagePaths, baseUrl: options.baseUrl, minInlinks: options.minInlinks });
  report.inputs = {
    htmlRoot: options.htmlRoot,
    sitemap: options.sitemap,
    sitemapFiles: sitemap.files,
    missingSitemaps: sitemap.missingSitemaps,
    renderMissing: options.renderMissing,
    renderedPages: rendered.pages.length,
    renderErrors: rendered.errors.length,
    renderErrorsSample: rendered.errors.slice(0, 25),
  };
  report.failures = [
    ...report.missingHtml.map((pathname) => ({ kind: "sitemap-url-missing-html", path: pathname })),
    ...report.zeroInboundRouteTypes.map((type) => ({ kind: "route-type-zero-inbound", routeType: type })),
  ];
  return report;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const options = parseArgs(process.argv.slice(2));
    const report = await runAuditComplete(options);
    const json = `${JSON.stringify(report, null, options.pretty ? 2 : 0)}\n`;
    if (options.output) writeFileSync(options.output, json);
    else process.stdout.write(json);
    process.exitCode = report.failures.length ? 1 : 0;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
  }
}
