import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const required = [
  'server.mjs',
  'server/cta-collector.mjs',
  'server/analytics-bots.mjs',
  'server/error-monitor.mjs',
  'server/asset-path.mjs',
  'server/news-ssr.mjs',
  'dist/news-ssr/entry-server.js',
  'config/search-publication-baseline.json',
  'dist/client/index.html',
  'dist/client/version.json',
  'dist/server/index.js',
];
for (const relative of required) await access(path.join(root, relative));
const entry = await readFile(path.join(root, 'server.mjs'), 'utf8');
const imports = [...entry.matchAll(/from ['"]\.\/(server\/[^'"]+)['"]/g)].map((match) => match[1]);
for (const relative of imports) await access(path.join(root, relative));
const renderModule = await import(pathToFileURL(path.join(root, 'dist/news-ssr/entry-server.js')).href);
if (typeof renderModule.render !== 'function') throw new Error('NEWS_SSR_RUNTIME_RENDER_EXPORT_MISSING');
const result = { newsSsrRuntime: 'self-contained dist/news-ssr; checked import', status: 'PASS', requiredFiles: required.length, entryDependencies: imports };
console.log(JSON.stringify(result, null, 2));
