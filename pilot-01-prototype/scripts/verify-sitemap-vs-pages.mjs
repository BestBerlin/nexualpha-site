#!/usr/bin/env node
// Read-only deployment check. Node built-ins only; never submits URLs to engines.
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const decode = (text) => text.replace(/&(#x[\da-f]+|#\d+|amp|quot|apos|lt|gt);/gi, (all, entity) => {
  if (entity.startsWith('#')) {
    const code = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : Number(entity.slice(1));
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : all;
  }
  return ({ amp: '&', quot: '"', apos: "'", lt: '<', gt: '>' })[entity.toLowerCase()];
});
const tokens = (value) => value.toLowerCase().split(/[\s,]+/).filter(Boolean);
function attributes(tag) {
  const result = {};
  for (const match of tag.matchAll(/([^\s=<>/]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s<>"'=]+))/g)) {
    result[match[1].toLowerCase()] = decode(match[2] ?? match[3] ?? match[4]);
  }
  return result;
}

export function inspectPage(html, response, url) {
  const issues = [];
  if (response.status !== 200) issues.push(`HTTP ${response.status}`);
  if (response.url && response.url !== url) issues.push(`redirect -> ${response.url}`);
  if (!/\btext\/html\b/i.test(response.headers.get('content-type') || '')) issues.push('response is not HTML');
  // Body examples/comments/scripts must not masquerade as page-head directives.
  const head = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
    .match(/<head\b[^>]*>([\s\S]*?)<\/head\s*>/i)?.[1] || '';
  const canonicals = [];
  const robots = [];
  for (const match of head.matchAll(/<(?:meta|link)\b(?:"[^"]*"|'[^']*'|[^'">])*>/gi)) {
    const attrs = attributes(match[0]);
    if (/^<link\b/i.test(match[0]) && tokens(attrs.rel || '').includes('canonical')) canonicals.push(attrs.href || '');
    if (/^<meta\b/i.test(match[0]) && ['robots', 'googlebot'].includes((attrs.name || '').toLowerCase())) robots.push(...tokens(attrs.content || ''));
  }
  // Include generic and Googlebot HTTP directives; unrelated crawler rules do not apply.
  let applies = true;
  for (const part of (response.headers.get('x-robots-tag') || '').split(',')) {
    const scoped = part.trim().match(/^([\w-]+):\s*(.*)$/);
    const parameterDirective = scoped && ['max-snippet', 'max-image-preview', 'max-video-preview', 'unavailable_after'].includes(scoped[1].toLowerCase());
    if (scoped && !parameterDirective) applies = ['googlebot', 'robots'].includes(scoped[1].toLowerCase());
    if (applies) robots.push(...tokens(scoped && !parameterDirective ? scoped[2] : part));
  }
  if (robots.includes('noindex') || robots.includes('none')) issues.push('noindex');
  if (robots.includes('nofollow') || robots.includes('none')) issues.push('nofollow');
  if (canonicals.length !== 1) issues.push(`expected one canonical, found ${canonicals.length}`);
  for (const canonical of canonicals) {
    try {
      if (!canonical || new URL(canonical, url).href !== url) issues.push(`canonical -> ${canonical || '(empty)'}`);
    } catch { issues.push(`invalid canonical: ${canonical}`); }
  }
  return issues;
}

function parseSitemap(xml) {
  const text = xml.replace(/<!--[\s\S]*?-->/g, '');
  const root = text.match(/<(sitemapindex|urlset)\b[^>]*>/i)?.[1]?.toLowerCase();
  if (!root || !new RegExp(`</${root}\\s*>`, 'i').test(text)) throw new Error('invalid sitemap XML (expected sitemapindex or urlset)');
  const entry = root === 'sitemapindex' ? 'sitemap' : 'url';
  const locations = [];
  const blocks = [...text.matchAll(new RegExp(`<${entry}\\b[^>]*>([\\s\\S]*?)</${entry}\\s*>`, 'gi'))];
  if ((text.match(new RegExp(`<${entry}\\b`, 'gi')) || []).length !== blocks.length) throw new Error('invalid sitemap XML (unclosed entry)');
  for (const block of blocks) {
    const loc = block[1].match(/<loc\b[^>]*>([\s\S]*?)<\/loc\s*>/i)?.[1]?.trim();
    if (!loc) throw new Error('sitemap entry missing loc');
    locations.push(decode(loc.replace(/^<!\[CDATA\[([\s\S]*)\]\]>$/, '$1')));
  }
  return { index: root === 'sitemapindex', locations };
}

export async function verifySitemapVsPages({ base, sitemap, limit = Infinity, log = console.log, timeoutMs = 20_000, fetchImpl = fetch }) {
  const baseUrl = new URL(base);
  if (!['http:', 'https:'].includes(baseUrl.protocol)) throw new Error('--base must be an HTTP(S) URL');
  const initial = sitemap ? (/^https?:\/\//i.test(sitemap) ? new URL(sitemap) : pathToFileURL(path.resolve(sitemap))) : new URL('/sitemap.xml', baseUrl);
  const queue = [{ source: initial, depth: 0 }];
  const seenMaps = new Set();
  const urls = new Set();
  const inconsistencies = [];
  const record = (url, issues) => {
    inconsistencies.push({ url, issues });
    log(`INCONSISTENT ${url}: ${issues.join('; ')}`);
  };
  for (let i = 0; i < queue.length && urls.size < limit; i++) {
    const { source, depth } = queue[i];
    if (seenMaps.has(source.href)) continue;
    seenMaps.add(source.href);
    try {
      if (depth > 8) throw new Error('sitemap nesting exceeds 8 levels');
      let xml;
      if (source.protocol === 'file:') xml = await readFile(source, 'utf8');
      else {
        const response = await fetchImpl(source, { signal: AbortSignal.timeout(timeoutMs) });
        if (response.status !== 200) throw new Error(`HTTP ${response.status}`);
        xml = await response.text();
      }
      const parsed = parseSitemap(xml);
      for (const loc of parsed.locations) {
        // Relative child paths in a local sitemap resolve beside that file.
        const target = new URL(loc, parsed.index ? source : baseUrl);
        if (parsed.index) queue.push({ source: target, depth: depth + 1 });
        else {
          if (!['http:', 'https:'].includes(target.protocol) || target.hash) throw new Error(`invalid page URL: ${loc}`);
          urls.add(target.href);
          if (urls.size >= limit) break;
        }
      }
    } catch (error) { record(source.href, [`sitemap error: ${error.message}`]); }
  }
  const pages = [...urls];
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(8, pages.length) }, async () => {
    while (cursor < pages.length) {
      const url = pages[cursor++];
      try {
        const response = await fetchImpl(url, { signal: AbortSignal.timeout(timeoutMs) });
        const issues = inspectPage(await response.text(), response, url);
        if (issues.length) record(url, issues);
      } catch (error) { record(url, [`fetch error: ${error.message}`]); }
    }
  }));
  if (!pages.length && !inconsistencies.length) record(initial.href, ['sitemap contains no page URLs']);
  log(`Checked ${pages.length} page(s) from ${seenMaps.size} sitemap(s); ${inconsistencies.length} inconsistency record(s).${Number.isFinite(limit) ? ` Limit: ${limit}; this is a sample, not a full-site result.` : ''}`);
  return { checked: pages.length, sitemaps: seenMaps.size, inconsistencies };
}

export async function main(args = process.argv.slice(2)) {
  const options = {};
  for (let i = 0; i < args.length; i++) {
    const flag = args[i];
    if (flag === '--help') { console.log('Usage: node scripts/verify-sitemap-vs-pages.mjs --base https://nexualpha.com [--sitemap <file-or-url>] [--limit N]'); return 0; }
    if (!['--base', '--sitemap', '--limit'].includes(flag) || !args[i + 1] || args[i + 1].startsWith('--')) throw new Error(`Unknown or missing argument: ${flag}`);
    options[flag.slice(2)] = args[++i];
  }
  if (!options.base) throw new Error('--base is required');
  if (options.limit !== undefined) {
    if (!/^[1-9]\d*$/.test(options.limit) || !Number.isSafeInteger(Number(options.limit))) throw new Error('--limit must be a positive safe integer');
    options.limit = Number(options.limit);
  }
  const result = await verifySitemapVsPages(options);
  return result.inconsistencies.length ? 1 : 0;
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().then((code) => { process.exitCode = code; }).catch((error) => { console.error(error.message); process.exitCode = 1; });
}
