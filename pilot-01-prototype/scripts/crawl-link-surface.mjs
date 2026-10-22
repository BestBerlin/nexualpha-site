#!/usr/bin/env node
// Read-only breadth-first crawl of a built preview. URL variants count separately.
// Fetch each document path once; fragments and outbound/API/asset routes are excluded.
import { writeFileSync } from 'node:fs';
import { internalFetch } from "./lib/internal-http.mjs";
// UA "NexuAlpha-internal/crawl-link-surface", paced to 2 req/s against remote hosts (scripts/lib/internal-http.mjs).
const fetch = internalFetch("crawl-link-surface");
const origin = process.argv[2] || 'http://127.0.0.1:4173';
const output = process.argv[3] || 'crawl-link-surface.json';
const queue = ['/'];
const seen = new Set(queue);
const results = [];
const linkedUrls = new Set(queue);
const decode = s => s.replace(/&amp;/g, '&').replace(/&#x27;/g, "'").replace(/&quot;/g, '"');
const eligible = path => !/^\/(?:go|api|assets|content|intel|og|brand|ref)(?:\/|$)/.test(path) && !/\.(?:json|xml|txt|csv|js|css|png|svg|webp|avif|pdf)$/i.test(path);
let cursor = 0;
while (cursor < queue.length) {
  const batch = queue.slice(cursor, cursor + 6); cursor += batch.length;
  await Promise.all(batch.map(async path => {
    const response = await fetch(origin + path, { redirect: 'manual', signal: AbortSignal.timeout(30000) });
    const html = response.status === 200 ? await response.text() : '';
    const canonical = html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/i)?.[1];
    const robots = html.match(/<meta[^>]+name="robots"[^>]+content="([^"]+)"/i)?.[1] || '';
    const canonicalUrl = canonical ? new URL(decode(canonical), origin) : null;
    const canonicalPath = canonicalUrl ? canonicalUrl.pathname + canonicalUrl.search : null;
    results.push({ path, status: response.status, indexable: response.status === 200 && !!canonicalPath && !robots.split(',').map(x => x.trim()).includes('noindex') && canonicalPath === path, canonical: canonicalPath });
    const documentHtml = html.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>|<style\b[^>]*>[\s\S]*?<\/style\s*>|<!--[\s\S]*?-->/gi, "");
    for (const match of documentHtml.matchAll(/<a\b[^>]*\s+href="([^"]+)"/gi)) {
      const url = new URL(decode(match[1]), origin + path);
      if (![new URL(origin).origin, 'https://nexualpha.com'].includes(url.origin) || !eligible(url.pathname)) continue;
      linkedUrls.add(url.pathname + url.search);
      // Crawl each document once; query variants remain in the discovered surface count.
      const next = url.pathname;
      if (!seen.has(next)) { seen.add(next); queue.push(next); }
    }
  }));
  if (Math.floor(cursor / 300) !== Math.floor((cursor - batch.length) / 300)) process.stderr.write(`${cursor}/${queue.length}\n`);
  if (queue.length > 30000) throw new Error('Unexpected crawl expansion above 30000 URLs');
}
const summary = { origin, crawlable: linkedUrls.size, documentsFetched: results.length, indexable: results.filter(r => r.indexable).length, parameterUrls: [...linkedUrls].filter(path => path.includes('?')).length, redirects: results.filter(r => r.status >= 300 && r.status < 400).length, errors: results.filter(r => r.status >= 400).length };
writeFileSync(output, JSON.stringify({ summary, linkedUrls: [...linkedUrls].sort(), results }, null, 2));
console.log(JSON.stringify(summary));
