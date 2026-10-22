#!/usr/bin/env node
// Read-only SSR anchor crawl. Sitemap membership supplies targets, never crawl edges.
// Usage: node scripts/crawl-link-surface.mjs [origin] [report.json] [maxDepth=3]
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { JSDOM } from 'jsdom';
import { internalFetch } from './lib/internal-http.mjs';

const eligible = path => !/^\/(?:go|api|assets|content|intel|og|brand|ref)(?:\/|$)/.test(path) && !/\.(?:json|xml|txt|csv|js|css|png|svg|webp|avif|pdf)$/i.test(path);
const tokens = value => String(value || '').toLowerCase().split(/[\s,]+/).filter(Boolean);
export function documentLinks(html, origin, path = '/') {
  // Scripts (including JSON hydration), comments and styles are not navigational links.
  const markup = html.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>|<style\b[^>]*>[\s\S]*?<\/style\s*>|<!--[\s\S]*?-->/gi, '');
  // A fragment retains head metadata and anchors without allocating a browser Window per URL.
  const document = JSDOM.fragment(markup);
  const robots = [...document.querySelectorAll('meta[name]')].filter(el => /^(robots|googlebot)$/i.test(el.getAttribute('name'))).flatMap(el => tokens(el.getAttribute('content')));
  const canonical = document.querySelector('link[rel~="canonical"]')?.getAttribute('href');
  const links = robots.some(token => token === 'nofollow' || token === 'none') ? [] : [...document.querySelectorAll('a[href]')].filter(el => !tokens(el.getAttribute('rel')).includes('nofollow')).map(el => el.getAttribute('href'));
  return { canonical, robots, links };
}

export async function crawlLinkSurface({ origin = 'http://127.0.0.1:4173', fetch = internalFetch('crawl-link-surface'), maxDepth = 3, concurrency = 6, maxDocuments = 30000, sitemapPath = '/sitemap.xml', onProgress = () => {} } = {}) {
  const base = new URL(origin).origin;
  const allowed = new Set([base, 'https://nexualpha.com']);
  const localPath = (href, parent = '/') => {
    try { const url = new URL(href, base + parent); return allowed.has(url.origin) ? url.pathname + url.search : null; } catch { return null; }
  };
  const request = path => fetch(base + path, { redirect: 'manual', signal: AbortSignal.timeout(30000) });
  const targets = new Set();
  const sitemapCounts = {};
  const sitemapErrors = [];
  const maps = [sitemapPath];
  const visitedMaps = new Set();
  while (maps.length) {
    const path = maps.shift();
    if (visitedMaps.has(path)) continue;
    visitedMaps.add(path);
    if (visitedMaps.size > 1000) throw new Error('Unexpected sitemap expansion above 1000 files');
    try {
      const response = await request(path);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const dom = new JSDOM(await response.text(), { contentType: 'application/xml' });
      try {
        const xml = dom.window.document;
        if (!['sitemapindex', 'urlset'].includes(xml.documentElement.localName)) throw new Error('Not a sitemap index or URL set');
        const isIndex = xml.documentElement.localName === 'sitemapindex';
        const entries = [...xml.documentElement.children].filter(el => el.localName === (isIndex ? 'sitemap' : 'url'));
        const urls = [];
        for (const entry of entries) {
          const loc = [...entry.children].find(el => el.localName === 'loc')?.textContent.trim() || '';
          try {
            // A sitemap loc must be absolute. Never silently drop a foreign or broken URL
            // and then claim complete coverage of the remaining, smaller target inventory.
            const absolute = new URL(loc);
            const target = localPath(absolute.href);
            if (!target || !/^https?:$/.test(absolute.protocol) || absolute.hash || absolute.username || absolute.password) throw new Error('Unsupported sitemap URL');
            urls.push(target);
          } catch { sitemapErrors.push({ path, loc, error: 'Invalid, non-absolute or foreign sitemap loc' }); }
        }
        if (isIndex) maps.push(...urls); else { sitemapCounts[path] = urls.length; for (const url of urls) targets.add(url); }
      } finally { dom.window.close(); }
    } catch (error) { sitemapErrors.push({ path, error: error.message }); }
  }
  const depth = new Map([['/', 0]]);
  const parent = new Map();
  const linkedUrls = new Set(['/']);
  const results = new Map();
  let frontier = ['/'];
  // Separate layers preserve BFS shortest paths despite concurrent HTTP responses.
  for (let level = 0; level <= maxDepth && frontier.length; level++) {
    // At the boundary only sitemap targets need status/canonical validation. Other
    // documents cannot provide an edge within the allowed depth, so avoid rendering them.
    if (level === maxDepth) frontier = frontier.filter(path => targets.has(path));
    const next = new Set();
    let cursor = 0;
    const visit = async () => {
      while (cursor < frontier.length) {
        const path = frontier[cursor++];
        if (results.size >= maxDocuments) throw new Error(`Crawl exceeded ${maxDocuments} documents`);
        let result = { path, depth: level, parent: parent.get(path) || null, status: null, indexable: false };
        try {
          const response = await request(path);
          result.status = response.status;
          if (response.status === 200) {
            const info = documentLinks(await response.text(), base, path);
            result.canonical = info.canonical ? localPath(info.canonical, path) : null;
            const robots = [...info.robots, ...tokens(response.headers.get('x-robots-tag'))];
            result.indexable = result.canonical === path && !robots.includes('noindex') && !robots.includes('none');
            for (const href of robots.some(token => token === 'nofollow' || token === 'none') ? [] : info.links) {
              const url = localPath(href, path);
              if (!url || !eligible(new URL(url, base).pathname)) continue;
              linkedUrls.add(url);
              if (!depth.has(url)) { depth.set(url, level + 1); parent.set(url, path); next.add(url); }
            }
          }
          if (response.status >= 300 && response.status < 400) result.location = localPath(response.headers.get('location'), path);
        } catch (error) { result.error = error.message; }
        results.set(path, result);
        if (results.size % 100 === 0) onProgress({ documentsFetched: results.size, depth: level, frontier: frontier.length });
      }
    };
    await Promise.all(Array.from({ length: concurrency }, visit));
    frontier = [...next].sort();
  }
  const failures = [...targets].sort().flatMap(path => {
    const result = results.get(path);
    if (!result) return [{ path, reason: depth.has(path) ? 'depth-exceeded' : 'unreachable', discoveredDepth: depth.get(path) ?? null }];
    if (result.status !== 200 || !result.indexable) return [{ path, reason: result.error ? 'fetch-error' : result.status !== 200 ? 'non-200' : 'not-indexable', ...result }];
    return [];
  });
  const rows = [...results.values()].sort((a, b) => a.depth - b.depth || a.path.localeCompare(b.path));
  const summary = { origin: base, maxDepth, sitemapUrls: targets.size, sitemapFiles: visitedMaps.size, sitemapErrors: sitemapErrors.length, reachableIndexableSitemapUrls: targets.size - failures.length, depthFailures: failures.length, crawlable: linkedUrls.size, documentsFetched: results.size, indexable: rows.filter(r => r.indexable).length, parameterUrls: [...linkedUrls].filter(path => path.includes('?')).length, redirects: rows.filter(r => r.status >= 300 && r.status < 400).length, errors: rows.filter(r => r.error || r.status >= 400).length, passed: targets.size > 0 && failures.length === 0 && sitemapErrors.length === 0 };
  return { summary, sitemapCounts, sitemapErrors, failures, linkedUrls: [...linkedUrls].sort(), results: rows };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const maxDepth = Number(process.argv[4] || 3);
  if (!Number.isInteger(maxDepth) || maxDepth < 0) throw new Error('maxDepth must be a nonnegative integer');
  const report = await crawlLinkSurface({ origin: process.argv[2], maxDepth, onProgress: value => process.stderr.write(`${JSON.stringify(value)}\n`) });
  writeFileSync(process.argv[3] || 'crawl-link-surface.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report.summary));
  if (!report.summary.passed) process.exitCode = 1;
}
