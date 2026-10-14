// Exhaustive build-manifest SSR -> React hydration audit. Run from the app directory after a strict build.
import { readFile, mkdir, appendFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import worker from '../worker/index.js';
import { localizedHref, COUNTRY_ROUTE_PREFIXES } from '../src/data/locale-routing.js';
import { contentTypeForAssetPath, resolveAssetPath } from '../server/asset-path.mjs';
import { createNewsSsrRenderer } from '../server/news-ssr.mjs';
import { createSsrHarness, hydrateInJsdom } from '../tests/helpers/ssr-hydration-harness.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const clientRoot = path.join(root, 'dist/client');
const manifest = JSON.parse(await readFile(path.join(clientRoot, 'prerender-manifest.json'), 'utf8'));
const out = path.resolve(root, '../.audit/hydration.jsonl');
await mkdir(path.dirname(out), { recursive: true });
await writeFile(out, '');
const assets = { async fetch(request) {
  const file = resolveAssetPath(clientRoot, new URL(request.url).pathname);
  return file ? new Response(await readFile(file), { headers: { 'content-type': contentTypeForAssetPath(file) } }) : new Response('Not Found', { status: 404 });
} };
const env = { ASSETS: assets, WORKER_POLLED_JSON_CACHE_SCOPE: {}, NEWS_SSR_RENDER: createNewsSsrRenderer(path.join(root, 'dist')), HOME_HERO_EXPERIMENT_FORCE: 'off' };
const routes = [...new Set(Object.values(manifest.routes).map(route => {
  const regional = COUNTRY_ROUTE_PREFIXES.some(prefix => route.pathname === prefix || route.pathname.startsWith(`${prefix}/`));
  return regional ? `${route.pathname}?locale=${encodeURIComponent(route.locale)}` : localizedHref(route.pathname, { locale: route.locale });
}))];
const limitArg = process.argv.find(arg => arg.startsWith('--limit='));
const limit = limitArg ? Number(limitArg.slice(8)) : routes.length;
const harness = await createSsrHarness();
let checked = 0, failures = 0, redirects = 0;
try {
  for (const pathname of routes.slice(0, limit)) {
    const url = `https://nexualpha.com${pathname}`;
    let row = { pathname };
    try {
      const response = await worker.fetch(new Request(url, { headers: { accept: 'text/html', 'user-agent': 'Mozilla/5.0 Chrome/140.0.0.0' } }), env);
      row.status = response.status;
      if ([301, 308].includes(response.status)) { row.redirect = response.headers.get('location'); redirects++; }
      else {
        const html = await response.text();
        if (response.status !== 200) throw new Error(`unexpected status ${response.status}`);
        const result = await hydrateInJsdom(harness.vite, html, url, { timeoutMs: 100, settleMs: 10 });
        row.errors = result.errors;
        if (result.errors.length) failures++;
      }
    } catch (error) { row.error = error.message; failures++; }
    checked++;
    await appendFile(out, `${JSON.stringify(row)}\n`);
    if (checked % 100 === 0) console.log(JSON.stringify({ checked, failures, redirects }));
  }
} finally { await harness.close(); }
console.log(JSON.stringify({ totalRoutes: routes.length, checked, failures, redirects, out }));
if (failures) process.exitCode = 1;
