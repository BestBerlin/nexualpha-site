// Read-only builder preview, NOT the scheduler and NOT a bypass of state/budgets. Never posts.
// usage: node preview.mjs [feed.json market.json]   (env X_TRENDING=off skips CoinGecko)
import { readFileSync } from 'node:fs';
import { articleMessage, englishArticles, marketMessage, dailyMessage, linkMessage, weightedLength, costClass, keywordContext } from './x-poster.mjs';
const json = async (url) => {
  const r = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error(`Feed HTTP ${r.status}`);
  return r.json();
};
const [feed, market] = process.argv.length === 4
  ? process.argv.slice(2).map((file) => JSON.parse(readFileSync(file, 'utf8')))
  : await Promise.all([json('https://nexualpha.com/content/news-feed-summary.json'), json('https://nexualpha.com/intel/market-events.json')]);
const now = Date.now();
const tagging = await keywordContext({ market, now });
console.log(JSON.stringify({ previewOnly: true, marketGeneratedAt: market.generatedAt, marketAgeMinutes: Math.round((now - Date.parse(market.generatedAt)) / 60000),
  dailyKeywords: tagging.keywords.slice(0, 8).map((k) => `${k.key}:${k.score} (${k.sources.join('+')})`), keywordSourceErrors: tagging.errors }));
const ctx = (key) => ({ ...tagging, now, key });
const tagsOf = (text) => text.match(/(?<![\w$#])(?:#[\p{L}\p{N}_]+|\$[A-Za-z][A-Za-z0-9_]*)/gu) || [];
const print = (kind, text, extra = {}) => console.log(`\n--- ${kind} | ${costClass(text)} | ${weightedLength(text)} weighted | tags: ${tagsOf(text).join(' ')}${extra.note ? ` | ${extra.note}` : ''}\n${text}`);
// Next 5 posts in scheduler order: newest eligible articles first (no state here, so newest five).
const articles = englishArticles(feed).filter((a) => Date.parse(a.publishedAt) <= now);
for (const a of articles.slice(0, 5)) print(`article ${a.slug}`, articleMessage(a, 1200, ctx(`article:${a.slug}`)));
if (articles[0]) print('article (280 fallback)', articleMessage(articles[0], 280, ctx(`article:${articles[0].slug}`)));
if (articles[0]) print('daily link', linkMessage(articles[0], ctx('link:preview')), { note: 'link post, $0.20' });
const actual = market.events?.find((e) => e.severity === 'high' && ['sharp-move', 'liquidation-spike', 'both-sides-liquidated'].includes(e.type));
print('market', marketMessage(actual || { type: 'liquidation-spike' }, market, ctx('market:preview')), { note: actual ? '' : 'synthetic event, real numbers' });
print('daily brief', dailyMessage(market, ctx('daily:preview')));
