#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { routeInventory, PRERENDER_LOCALES } from './generate-prerender-manifest.mjs';
import { normalizeNewsFeed, normalizeNewsFeedSummaries, projectNewsFeedForRoute } from '../src/data/news-feed-client.js';
import { localizedPath, parsePublicRoute } from '../src/data/locale-routing.js';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export function planNewsCache(articles, manifest) {
  const planned = routeInventory(articles).filter(r => r.pathname === '/news' || r.pathname.startsWith('/news/'))
    .flatMap(r => (r.prerenderLocales || r.locales || PRERENDER_LOCALES).map(locale => ({ pathname: r.pathname, locale, key: `${r.pathname}|${locale}` })));
  for (const r of planned) {
    if (!manifest.routes[r.key]) {
      const article = articles.find(a => r.pathname === `/news/${a.slug}`);
      if (article?.seo?.noindex !== true) throw new Error(`New display cache requires explicit noindex: ${r.key}`);
    }
  }
  return planned;
}

export async function refreshNewsPrerender({ clientDir = path.join(projectRoot, 'dist/client'), render } = {}) {
  const manifestPath = path.join(clientDir, 'prerender-manifest.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const originalPublished = Object.entries(manifest.routes).filter(([,r]) => r.searchPublished).map(([k]) => k).sort();
  const feedText = readFileSync(path.join(clientDir, 'content/news-feed.json'), 'utf8');
  const raw = JSON.parse(feedText);
  const articles = normalizeNewsFeed(raw);
  const summaries = normalizeNewsFeedSummaries(raw);
  const fingerprint = createHash('sha256').update(feedText).digest('hex');
  const planned = planNewsCache(articles, manifest);
  if (!render) ({ render } = await import(pathToFileURL(path.join(projectRoot, 'dist/ssr/entry-server.js')).href));
  const writes = [];
  const added = [];
  for (const r of planned) {
    const existing = manifest.routes[r.key];
    const asset = existing?.asset || `/prerender/${r.locale}/${r.pathname.slice(1)}.json`;
    const initial = r.pathname === '/news' ? summaries : articles.filter(a => r.pathname === `/news/${a.slug}`);
    let href = localizedPath(r.pathname, r.locale);
    if (parsePublicRoute(new URL(href, 'https://nexualpha.com').pathname).locale !== r.locale) href += `?locale=${encodeURIComponent(r.locale)}`;
    let html = (await render(href, { newsArticles: initial })).replace(/<link\s+rel="preload"\s+as="image"[^>]*\/>/g, '');
    if (!/<h1\b/i.test(html) || !/id="policy"/.test(html) || !/class="v2-header/.test(html)) throw new Error(`Incomplete news shell: ${r.key}`);
    if (existing) {
      const old = JSON.parse(readFileSync(path.join(clientDir, existing.asset), 'utf8'));
      const expiries = old.html.match(/tg_expires=\d+/g) || [];
      const nextExpiries = html.match(/tg_expires=\d+/g) || [];
      if (expiries.length !== nextExpiries.length) throw new Error(`Existing Telegram shape changed: ${r.key}`);
      let i = 0; html = html.replace(/tg_expires=\d+/g, () => expiries[i++]);
    }
    writes.push({ asset, payload: { html, newsArticles: projectNewsFeedForRoute(r.pathname, initial, r.locale), newsFeedFingerprint: fingerprint } });
    manifest.routes[r.key] = existing ? { ...existing, newsFeedFingerprint: fingerprint } : { pathname: r.pathname, locale: r.locale, asset, searchPublished: false, newsFeedFingerprint: fingerprint };
    if (!existing) added.push(r.key);
  }
  const nextPublished = Object.entries(manifest.routes).filter(([,r]) => r.searchPublished).map(([k]) => k).sort();
  if (JSON.stringify(nextPublished) !== JSON.stringify(originalPublished)) throw new Error('Search publication set changed');
  // Validate everything before changing local assets; commit the manifest last.
  for (const { asset, payload } of writes) {
    const target = path.join(clientDir, asset); mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target + '.r118-tmp', JSON.stringify(payload) + '\n'); renameSync(target + '.r118-tmp', target);
  }
  writeFileSync(manifestPath + '.r118-tmp', JSON.stringify(manifest) + '\n'); renameSync(manifestPath + '.r118-tmp', manifestPath);
  return { refreshed: writes.length, added, fingerprint, publicationKeysUnchanged: true };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log(JSON.stringify(await refreshNewsPrerender(), null, 2));
