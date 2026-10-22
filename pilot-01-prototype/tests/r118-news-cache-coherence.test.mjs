import { applyNewsSearchStateToFeed } from '../src/data/news-search-state.js';
import { articleRelatedPool } from '../src/data/article-related-links.js';
import { turkeyListingAllowed } from '../src/data/partner-geo-policy.js';
import { existsSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { routeInventory, PRERENDER_LOCALES } from '../scripts/generate-prerender-manifest.mjs';
import { normalizeNewsFeed, normalizeNewsFeedSummaries, projectNewsFeedForRoute } from '../src/data/news-feed-client.js';
import { planNewsCache } from '../scripts/refresh-news-prerender.mjs';
const read = p => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const feedText = readFileSync(new URL('../dist/client/content/news-feed.json', import.meta.url), 'utf8');
const rawFeed=applyNewsSearchStateToFeed(JSON.parse(feedText));
const articles = normalizeNewsFeed(rawFeed);
const summaries=normalizeNewsFeedSummaries(rawFeed);
const manifest = read('../dist/client/prerender-manifest.json');
const beforeAvailable = existsSync(new URL('../../live-runtime-control/dist/client/prerender-manifest.json', import.meta.url));
const before = beforeAvailable ? read('../../live-runtime-control/dist/client/prerender-manifest.json') : null;

test('current news feed has complete full-shell snapshots with matching fingerprints', () => {
  const fingerprint = createHash('sha256').update(feedText).digest('hex');
  for (const {pathname,locales,prerenderLocales} of routeInventory(articles).filter(r => r.pathname === '/news' || r.pathname.startsWith('/news/'))) {
    for (const locale of prerenderLocales || locales || PRERENDER_LOCALES) {
      const route = manifest.routes[`${pathname}|${locale}`]; assert.ok(route, `${pathname}|${locale}`);
      assert.equal(route.newsFeedFingerprint, fingerprint);
      const payload = read('../dist/client' + route.asset); assert.equal(payload.newsFeedFingerprint, fingerprint);
      const article=articles.find(a => pathname === `/news/${a.slug}`);
      let initial = pathname === '/news' ? summaries : articleRelatedPool(article,[article,...summaries.filter(a=>a.slug!==article.slug)],locale);
      if(locale==='tr')initial=initial.filter(a=>pathname===`/news/${a.slug}`||turkeyListingAllowed([a.slug,a.title?.tr||a.title?.en,a.summary?.tr||a.summary?.en,a.relatedVenues],{locale}));
      assert.deepEqual(payload.newsArticles, JSON.parse(JSON.stringify(projectNewsFeedForRoute(pathname, initial, locale))), `${pathname}|${locale}: body hydration data comes from current feed`);
      assert.match(payload.html, /id="policy"/); assert.match(payload.html, /class="nx-hdr"/);
    }
  }
});
test('readable cache expansion preserves publication authority and noindex boundaries', {skip: !beforeAvailable && 'Original R118 live-runtime-control publication snapshot is absent'}, () => {
  const published = m => Object.entries(m.routes).filter(([,r]) => r.searchPublished).map(([k]) => k).sort();
  assert.deepEqual(published(manifest), published(before));
  for (const [key,row] of Object.entries(manifest.routes)) {
    if (before.routes[key]) assert.equal(row.searchPublished, before.routes[key].searchPublished);
    else { assert.equal(row.searchPublished, false); const article = articles.find(a => row.pathname === `/news/${a.slug}`); assert.equal(article?.seo?.noindex, true); }
  }
});
test('refresh rejects newly introduced cache rows without explicit noindex', {skip: !beforeAvailable && 'Original R118 live-runtime-control publication snapshot is absent'}, () => {
  assert.throws(() => planNewsCache(articles.map(a => ({...a,seo:{...a.seo,noindex:false}})), before), /explicit noindex/);
});
