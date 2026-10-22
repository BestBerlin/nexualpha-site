#!/usr/bin/env node
// Check the complete checked-in search-published article/edition pool, not a sample.
import { readFile, writeFile } from 'node:fs/promises';
import { articleSitemapLocales } from '../src/data/article-sitemap-seo.js';
import { articleRelatedLinks, recentEntityArticles } from '../src/data/article-related-links.js';
import { normalizeNewsFeed } from '../src/data/news-feed-client.js';
import { applyNewsSearchStateToFeed } from '../src/data/news-search-state.js';
import { parsePublicRoute } from '../src/data/locale-routing.js';
import { converterCoins } from '../src/data/converter.js';

const feed = JSON.parse(await readFile(new URL('../public/content/news-feed.json', import.meta.url), 'utf8'));
const articles = normalizeNewsFeed(applyNewsSearchStateToFeed(feed));
const allowedConverters = new Set(converterCoins().map(coin => coin.symbol.toLowerCase()));
const eligibilityCache = new Map();
const byLocale = {};
const relatedCounts = {};
const failures = [];
for (const article of articles) {
  if (article.seo?.noindex !== false) continue;
  for (const locale of articleSitemapLocales(article, articles, eligibilityCache)) {
    byLocale[locale] = (byLocale[locale] || 0) + 1;
    const related = recentEntityArticles(article, articles, 5, locale);
    relatedCounts[related.length] = (relatedCounts[related.length] || 0) + 1;
    const paths = articleRelatedLinks(article, locale).map(link => parsePublicRoute(new URL(link.href, 'https://nexualpha.com').pathname).contentPathname);
    if (related.length < 3 || related.length > 5) failures.push({ slug: article.slug, locale, reason: 'related-count', count: related.length });
    if (!paths.some(path => /^\/exchanges(?:\/|$)/.test(path))) failures.push({ slug: article.slug, locale, reason: 'missing-exchange-destination' });
    for (const path of paths) {
      const symbol = path.match(/^\/convert\/([a-z0-9]+)-to-usd$/)?.[1];
      if (symbol && !allowedConverters.has(symbol)) failures.push({ slug: article.slug, locale, reason: 'unsupported-converter', path });
    }
  }
}
const report = { scope: 'Checked-in feed, shared sitemap publication and article-link selectors; SSR/hydration equivalence verified separately.', feedGeneratedAt: feed.generatedAt, editions: Object.values(byLocale).reduce((sum, n) => sum + n, 0), byLocale, relatedCounts, failures };
if (process.argv[2]) await writeFile(process.argv[2], JSON.stringify(report, null, 2));
console.log(JSON.stringify(report));
if (!report.editions || failures.length) process.exitCode = 1;
