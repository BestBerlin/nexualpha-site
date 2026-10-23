#!/usr/bin/env node
// Offline build-graph estimates, not observed browser traffic. Counts the shell
// and route hydration preloads; scroll/interaction-only imports stay deferred.
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';
import { localeAliasRedirect, parsePublicRoute } from '../src/data/locale-routing.js';

export const TARGET_PATHS = ['/exchanges/bitget', '/compare/binance-vs-okx', '/funding-rates'];
const METHOD = 'Vite manifest static closure of browser entry plus modulePathsForRoute hydration roots and mandatory English/route locale copy packs; raw and per-file gzip level 6 estimates; scroll/interaction-only dynamic imports excluded; no browser network measurement';

export function publishedEnglishArticle(articles, priorPath) {
  // The production feed stores bilingual editions in title/content maps, while
  // some fixtures and older feeds use explicit locale/language fields.
  return articles.find((item) => (item.locale === 'en' || item.language === 'en' || (typeof item.title?.en === 'string' && typeof item.content?.en === 'string'))
    && item.slug && item.seo?.noindex === false && (!priorPath || `/news/${item.slug}` === priorPath));
}

function assetPath(file) {
  if (typeof file !== 'string' || !file.endsWith('.js') || path.posix.isAbsolute(file) || file.split('/').includes('..')) throw new Error(`Invalid JavaScript asset path: ${file}`);
  return file;
}

export function moduleAsset(modulePath, moduleOwners) {
  const source = modulePath.replace(/^\.\//, '').replace(/^\//, '');
  const key = source.startsWith('src/') ? source : `src/${source}`;
  const file = moduleOwners[key]?.file;
  if (!file) throw new Error(`No built module ownership for ${modulePath}`);
  return assetPath(file);
}

export function staticJavaScriptClosure(manifest, rootFiles) {
  const byFile = new Map(Object.values(manifest).filter((entry) => entry.file).map((entry) => [entry.file, entry]));
  const files = new Set();
  function visit(file) {
    assetPath(file);
    if (files.has(file)) return;
    const chunk = byFile.get(file);
    if (!chunk) throw new Error(`JavaScript asset missing from Vite manifest: ${file}`);
    files.add(file);
    for (const key of chunk.imports || []) {
      const dependency = manifest[key];
      if (!dependency) throw new Error(`Missing static import ${key} in ${file}`);
      if (dependency.file?.endsWith('.js')) visit(dependency.file);
    }
  }
  for (const file of rootFiles) visit(file);
  return [...files].sort();
}

export function localeCopyRoots(manifest, filenames, locale = 'en') {
  if (!manifest) return [];
  const runtime = assetPath(manifest.runtime);
  if (!filenames.includes(runtime)) return [];
  return [...new Set(['en', locale])].map((code) => {
    if (!manifest.locales?.[code]) throw new Error(`Missing mandatory locale copy pack: ${code}`);
    return assetPath(manifest.locales[code]);
  });
}

export function routeLocale(pathname) {
  const url = new URL(pathname, 'https://nexualpha.com');
  const resolved = new URL(localeAliasRedirect(url) || url, url.origin);
  return parsePublicRoute(resolved.pathname, resolved.searchParams).locale || 'en';
}

export async function measureRoute({ clientRoot, manifest, moduleOwners, entryFile, pathname, modulePaths, localeCopyManifest }) {
  const roots = [...new Set([entryFile, ...modulePaths.map((source) => moduleAsset(source, moduleOwners))])];
  const staticFiles = staticJavaScriptClosure(manifest, roots);
  const localeRoots = localeCopyRoots(localeCopyManifest, staticFiles, routeLocale(pathname));
  roots.push(...localeRoots.filter((file) => !roots.includes(file)));
  const filenames = localeRoots.length ? staticJavaScriptClosure(manifest, roots) : staticFiles;
  const files = await Promise.all(filenames.map(async (file) => {
    const body = await readFile(path.join(clientRoot, file));
    return { file, bytes: body.length, gzipBytes: gzipSync(body, { level: 6 }).length };
  }));
  return { pathname, roots, localeCopyRoots: localeRoots, jsRequests: files.length, js: {
    bytes: files.reduce((sum, file) => sum + file.bytes, 0),
    gzipBytes: files.reduce((sum, file) => sum + file.gzipBytes, 0),
  }, files };
}

function validateRows(snapshot, label) {
  if (!Array.isArray(snapshot?.rows)) throw new Error(`${label} has no rows`);
  const rows = new Map();
  for (const row of snapshot.rows) {
    if (rows.has(row.pathname)) throw new Error(`${label} repeats ${row.pathname}`);
    if (!Number.isInteger(row.jsRequests) || row.jsRequests <= 0 || !Number.isFinite(row.js?.bytes) || row.js.bytes <= 0 || !Number.isFinite(row.js?.gzipBytes) || row.js.gzipBytes <= 0) throw new Error(`${label} has invalid sizes for ${row.pathname}`);
    rows.set(row.pathname, row);
  }
  return rows;
}

export function compareSnapshots(before, after, requiredPaths, minimumReduction = 0.4) {
  const baseline = validateRows(before, 'Baseline');
  const current = validateRows(after, 'Current');
  const required = new Set(requiredPaths);
  for (const pathname of required) if (!baseline.has(pathname) || !current.has(pathname)) throw new Error(`Missing required comparison route: ${pathname}`);
  return [...current.values()].map((row) => {
    const old = baseline.get(row.pathname);
    if (!old) throw new Error(`No baseline for ${row.pathname}`);
    const requestReduction = 1 - row.jsRequests / old.jsRequests;
    const gzipReduction = 1 - row.js.gzipBytes / old.js.gzipBytes;
    return { pathname: row.pathname, beforeRequests: old.jsRequests, afterRequests: row.jsRequests,
      beforeBytes: old.js.bytes, afterBytes: row.js.bytes,
      beforeGzipBytes: old.js.gzipBytes, afterGzipBytes: row.js.gzipBytes,
      requestReduction, gzipReduction, target: required.has(row.pathname),
      passed: !required.has(row.pathname) || (requestReduction + Number.EPSILON >= minimumReduction && gzipReduction + Number.EPSILON >= minimumReduction) };
  });
}

function printTable(snapshot) {
  console.log('Offline JavaScript estimates (per-file gzip level 6; deferred widgets excluded)');
  const comparison = new Map((snapshot.comparison || []).map((row) => [row.pathname, row]));
  console.table(snapshot.rows.map((row) => {
    const delta = comparison.get(row.pathname);
    const result = { Route: row.pathname, Files: row.jsRequests, 'Raw KiB': (row.js.bytes / 1024).toFixed(1), 'Gzip KiB': (row.js.gzipBytes / 1024).toFixed(1) };
    if (delta) Object.assign(result, { 'Before files': delta.beforeRequests, 'Before raw KiB': (delta.beforeBytes / 1024).toFixed(1), 'Before gzip KiB': (delta.beforeGzipBytes / 1024).toFixed(1), 'Fewer requests': `${(delta.requestReduction * 100).toFixed(1)}%`, 'Less gzip': `${(delta.gzipReduction * 100).toFixed(1)}%`, Gate: delta.target ? (delta.passed ? 'PASS' : 'FAIL') : 'control' });
    return result;
  }));
}

export async function main(args = process.argv.slice(2)) {
  const options = {};
  // Extra hydration roots allow an explicitly loaded locale copy module to be
  // counted even when its loader is outside modulePathsForRoute. Repeat as needed.
  const extraModules = new Map();
  for (let at = 0; at < args.length; at++) {
    const flag = args[at];
    if (flag === '--strict') { options.strict = true; continue; }
    if (!['--output', '--compare', '--client-root', '--route-module'].includes(flag) || !args[at + 1] || args[at + 1].startsWith('--')) throw new Error(`Invalid option: ${flag}`);
    const value = args[++at];
    if (flag === '--route-module') {
      const split = value.indexOf('=');
      if (split < 1 || split === value.length - 1) throw new Error('--route-module expects /route=./source/module.js');
      const pathname = value.slice(0, split);
      extraModules.set(pathname, [...(extraModules.get(pathname) || []), value.slice(split + 1)]);
    } else options[flag.slice(2)] = value;
  }
  if (options.strict && !options.compare) throw new Error('--strict requires --compare baseline.json');
  if (options.output && options.compare && path.resolve(options.output) === path.resolve(options.compare)) throw new Error('Output must not overwrite the baseline');
  const clientRoot = path.resolve(options['client-root'] || 'dist/client');
  const [manifest, moduleOwners, feed, baseline, localeCopyManifest] = await Promise.all([
    readFile(path.join(clientRoot, '.vite/manifest.json'), 'utf8').then(JSON.parse),
    readFile(path.join(clientRoot, 'style-modules.json'), 'utf8').then(JSON.parse),
    readFile(path.join(clientRoot, 'content/news-feed.json'), 'utf8').then(JSON.parse),
    options.compare ? readFile(options.compare, 'utf8').then(JSON.parse) : null,
    readFile(path.join(clientRoot, 'locale-copy-manifest.json'), 'utf8').then(JSON.parse).catch((error) => { if (error.code === 'ENOENT') return null; throw error; }),
  ]);
  const entries = Object.entries(manifest).filter(([, chunk]) => chunk.isEntry && chunk.file?.endsWith('.js'));
  const entry = entries.find(([key]) => key === 'index.html') || (entries.length === 1 ? entries[0] : null);
  if (!entry) throw new Error('Cannot identify a unique browser entry in the Vite manifest');
  const articles = Array.isArray(feed) ? feed : feed.articles || feed.items || [];
  const priorArticlePath = baseline?.rows?.find((row) => row.pathname?.startsWith('/news/'))?.pathname;
  const article = publishedEnglishArticle(articles, priorArticlePath);
  if (!article) throw new Error('No matching published English news article to measure');
  const articlePath = `/news/${article.slug}`;
  const homeRoutes = [['/', 'home']];
  // Older snapshots may contain only the English control; preserve their route
  // set while fresh snapshots also expose the Chinese locale payload cost.
  if (!baseline || baseline.rows?.some((row) => row.pathname === '/zh-hans')) homeRoutes.push(['/zh-hans', 'home']);
  const routes = [...homeRoutes, [TARGET_PATHS[0], 'venue'], [articlePath, 'newsDetail'], [TARGET_PATHS[1], 'compare'], [TARGET_PATHS[2], 'fundingRates']];
  for (const pathname of extraModules.keys()) if (!routes.some(([route]) => route === pathname)) throw new Error(`Extra module supplied for an unmeasured route: ${pathname}`);
  const { modulePathsForRoute } = await import('../src/data/route-module-cache.js');
  const rows = [];
  for (const [pathname, name] of routes) rows.push(await measureRoute({ clientRoot, manifest, moduleOwners, entryFile: entry[1].file, pathname, localeCopyManifest,
    modulePaths: [...modulePathsForRoute({ name }, pathname), ...(extraModules.get(pathname) || [])] }));
  const snapshot = { method: METHOD, rows };
  if (baseline) {
    snapshot.baselineMethod = baseline.method;
    snapshot.baselineHasFileInventory = baseline.rows.every((row) => Array.isArray(row.files));
    snapshot.comparison = compareSnapshots(baseline, snapshot, [...TARGET_PATHS, articlePath]);
  }
  if (options.output) await writeFile(options.output, JSON.stringify(snapshot, null, 2) + '\n');
  printTable(snapshot);
  if (baseline && !snapshot.baselineHasFileInventory) console.log('Baseline contains legacy aggregate sizes only; current snapshot records every filename and size.');
  if (options.strict && snapshot.comparison.some((row) => !row.passed)) process.exitCode = 1;
  return snapshot;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
