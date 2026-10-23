// Run after npm run build. Captures actual route SSR with the checked-in article feed; no network or publication.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { render } from '../dist/ssr/entry-server.js';
const out = new URL('../docs/evidence/conversion-v2/', import.meta.url);
mkdirSync(out, { recursive: true });
const newsArticles = JSON.parse(readFileSync(new URL('../public/content/news-feed.json', import.meta.url), 'utf8')).articles;
const slug = 'okx-third-party-app-ip-whitelist-broker-api-key-checklist';
const samples = [
  ['zh-hans-exchanges-bitget.html', '/zh-hans/exchanges/bitget'],
  ['tr-exchanges-okx.html', '/tr/exchanges/okx'],
  ['zh-hans-article.html', `/zh-hans/news/${slug}`],
  ['en-article.html', `/news/${slug}`],
];
for (const [file, path] of samples) {
  const html = render(path, { newsArticles });
  const marker = path.includes('/news/') ? 'data-article-decision="signup"' : 'data-conversion-sticky';
  if (!html.includes(marker)) throw new Error(`Missing ${marker} on ${path}`);
  writeFileSync(new URL(file, out), `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SSR evidence: ${path}</title></head><body><div id="root">${html}</div></body></html>\n`);
  console.log(`${file}: ${path} — ${Buffer.byteLength(html)} bytes; ${marker} present`);
}
