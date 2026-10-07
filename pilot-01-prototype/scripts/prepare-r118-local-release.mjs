#!/usr/bin/env node
// Local-only packaging: no production transport or publication authority changes.
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { isDeepStrictEqual } from 'node:util';
import { routeInventory, PRERENDER_LOCALES } from './generate-prerender-manifest.mjs';
import { normalizeNewsFeed, normalizeNewsFeedSummaries, projectNewsFeedForRoute } from '../src/data/news-feed-client.js';
import { refreshNewsPrerender } from './refresh-news-prerender.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const read = filename => JSON.parse(readFileSync(filename, 'utf8'));

export function verifyPinnedInputs(projectRoot, pins) {
  if (pins.sourceFiles) {
    const current = ['src', 'worker'].flatMap(dir => readdirSync(path.join(projectRoot, dir), { recursive: true, withFileTypes: true }).filter(e => e.isFile()).map(e => path.relative(projectRoot, path.join(e.parentPath, e.name)))).sort();
    if (!isDeepStrictEqual(current, pins.sourceFiles)) throw new Error('Source inventory changed; rebuild and review required');
  }
  for (const [name, expected] of Object.entries(pins.hashes)) {
    if (sha(readFileSync(path.join(projectRoot, name))) !== expected) throw new Error(`Pinned input changed; rebuild and review required: ${name}`);
  }
}

export function verifyNewsCache(clientDir, pins) {
  const text = readFileSync(path.join(clientDir, 'content/news-feed.json'), 'utf8');
  const raw = JSON.parse(text), articles = normalizeNewsFeed(raw), fingerprint = sha(text);
  const manifest = read(path.join(clientDir, 'prerender-manifest.json'));
  const published = Object.entries(manifest.routes).filter(([, row]) => row.searchPublished).map(([key]) => key).sort();
  if (!isDeepStrictEqual(published, pins.publishedKeys)) throw new Error('Search publication authority changed');
  for (const slug of pins.noindexSlugs) {
    if (articles.find(a => a.slug === slug)?.seo?.noindex !== true) throw new Error(`Explicit noindex lost: ${slug}`);
  }
  const expectedKeys = [];
  for (const route of routeInventory(articles)) {
    for (const locale of route.prerenderLocales || route.locales || PRERENDER_LOCALES) {
      const key = `${route.pathname}|${locale}`; expectedKeys.push(key);
      const row = manifest.routes[key];
      if (!row || row.pathname !== route.pathname || row.locale !== locale) throw new Error(`Missing or invalid cache row: ${key}`);
      if (route.pathname !== '/news' && !route.pathname.startsWith('/news/')) continue;
      if (row.newsFeedFingerprint !== fingerprint) throw new Error(`Manifest fingerprint mismatch: ${key}`);
      if (pins.noindexSlugs.includes(route.pathname.slice('/news/'.length)) && row.searchPublished !== false) throw new Error(`Unreviewed cache published: ${key}`);
      if (!row.asset?.startsWith('/prerender/') || row.asset.split('/').includes('..')) throw new Error(`Invalid cache asset: ${key}`);
      const payload = read(path.join(clientDir, row.asset));
      if (payload.newsFeedFingerprint !== fingerprint) throw new Error(`Payload fingerprint mismatch: ${key}`);
      const initial = route.pathname === '/news' ? normalizeNewsFeedSummaries(raw) : articles.filter(a => route.pathname === `/news/${a.slug}`);
      if (!isDeepStrictEqual(payload.newsArticles, projectNewsFeedForRoute(route.pathname, initial, locale))) throw new Error(`Cache body data mismatch: ${key}`);
      if (!/<h1\b/i.test(payload.html) || !/id="policy"/.test(payload.html) || !/class="v2-header/.test(payload.html)) throw new Error(`Incomplete news shell: ${key}`);
    }
  }
  if (!isDeepStrictEqual(Object.keys(manifest.routes).sort(), expectedKeys.sort())) throw new Error('Route inventory mismatch');
  return { fingerprint, routeCount: expectedKeys.length, publishedCount: published.length, noindexArticles: pins.noindexSlugs.length };
}

export async function prepareLocalRelease({ projectRoot = root, output, pins = read(path.join(root, 'ops/release/r118-local-input-pins.json')) } = {}) {
  if (!output?.endsWith('.tgz') || existsSync(output)) throw new Error('A new local .tgz output path is required');
  // Reject stale/source-drifted candidates before generating any package.
  verifyPinnedInputs(projectRoot, pins);
  verifyNewsCache(path.join(projectRoot, 'dist/client'), pins);
  const stage = mkdtempSync(path.join(tmpdir(), 'nexualpha-r118-local-'));
  const temporaryPackage = path.join(stage, 'candidate.tgz');
  try {
    cpSync(path.join(projectRoot, 'dist'), path.join(stage, 'dist'), { recursive: true });
    await refreshNewsPrerender({ clientDir: path.join(stage, 'dist/client') });
    const verification = verifyNewsCache(path.join(stage, 'dist/client'), pins);
    // Protected live content must remain untouched by refresh.
    for (const [name, expected] of Object.entries(pins.hashes).filter(([name]) => name.startsWith('dist/'))) {
      if (sha(readFileSync(path.join(stage, name))) !== expected) throw new Error(`Protected runtime input changed: ${name}`);
    }
    // macOS tar must not inject AppleDouble/xattr sidecars into runtime packages.
    execFileSync('tar', ['-czf', temporaryPackage, '-C', stage, 'dist'], { env: { ...process.env, COPYFILE_DISABLE: '1' } });
    verifyPinnedInputs(projectRoot, pins); // guard against concurrent source changes
    if (existsSync(output)) throw new Error('Output appeared during preparation; refusing replacement');
    // Copy to same destination directory before rename, preserving old packages.
    const pending = output + '.pending';
    if (existsSync(pending)) throw new Error('Pending output already exists');
    cpSync(temporaryPackage, pending, { errorOnExist: true, force: false });
    renameSync(pending, output);
    const receipt = { scope: 'local-only', ...verification, package: path.resolve(output), sha256: sha(readFileSync(output)) };
    writeFileSync(output + '.json', JSON.stringify(receipt, null, 2) + '\n');
    return receipt;
  } finally { rmSync(stage, { recursive: true, force: true }); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.length !== 2 || args[0] !== '--output') throw new Error('Usage: node scripts/prepare-r118-local-release.mjs --output /absolute/new-package.tgz');
  console.log(JSON.stringify(await prepareLocalRelease({ output: path.resolve(args[1]) }), null, 2));
}
