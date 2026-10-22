#!/usr/bin/env node
// Exercise the packaged Worker and production SSR renderer without opening a socket.
// Useful in restricted worktrees; this is rendered HTML evidence, not browser/HTTP evidence.
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createNewsSsrRenderer } from '../server/news-ssr.mjs';
import { crawlLinkSurface } from './crawl-link-surface.mjs';

const root = path.resolve(import.meta.dirname, '..');
const dist = path.join(root, 'dist');
const client = path.join(dist, 'client');
const worker = (await import(pathToFileURL(path.join(dist, 'server/index.js')).href)).default;
const types = { '.html': 'text/html', '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain', '.css': 'text/css', '.js': 'application/javascript', '.svg': 'image/svg+xml' };
const env = {
  ASSETS: { async fetch(request) {
    const pathname = decodeURIComponent(new URL(request.url).pathname);
    const file = path.resolve(client, `.${pathname === '/' ? '/index.html' : pathname}`);
    if (!file.startsWith(`${client}${path.sep}`)) return new Response('missing', { status: 404 });
    try { return new Response(await readFile(file), { headers: { 'content-type': types[path.extname(file)] || 'application/octet-stream' } }); }
    catch (error) { if (['ENOENT', 'EISDIR'].includes(error.code)) return new Response('missing', { status: 404 }); throw error; }
  } },
  NEWS_SSR_RENDER: createNewsSsrRenderer(dist),
};
const report = await crawlLinkSurface({
  origin: 'https://nexualpha.com',
  fetch: url => worker.fetch(new Request(url, { headers: { accept: 'text/html', 'user-agent': 'NexuAlpha-internal/crawl-built-link-surface' } }), env),
  maxDepth: 3,
  onProgress: value => process.stderr.write(`${JSON.stringify(value)}\n`),
});
report.summary.validationMode = 'packaged-worker-and-production-ssr-in-process';
await writeFile(process.argv[2] || 'crawl-built-link-surface.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report.summary));
if (!report.summary.passed) process.exitCode = 1;
