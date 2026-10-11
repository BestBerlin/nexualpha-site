// Read-only builder preview, NOT the scheduler and NOT a bypass of state/budgets.
import { readFileSync } from 'node:fs';
import { articleMessage, englishArticles, marketMessage, dailyMessage, weightedLength, costClass } from './x-poster.mjs';
const json = async (url) => {
  const r = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error(`Feed HTTP ${r.status}`);
  return r.json();
};
const [feed, market] = process.argv.length === 4
  ? process.argv.slice(2).map((file) => JSON.parse(readFileSync(file, 'utf8')))
  : await Promise.all([json('https://nexualpha.com/content/news-feed-summary.json'), json('https://nexualpha.com/intel/market-events.json')]);
console.log(JSON.stringify({ previewOnly: true, marketGeneratedAt: market.generatedAt, marketAgeMinutes: Math.round((Date.now() - Date.parse(market.generatedAt)) / 60000) }));
const print = (kind, text, extra = {}) => console.log(JSON.stringify({ kind, costClass: costClass(text), weightedLength: weightedLength(text), text, ...extra }));
for (const a of englishArticles(feed).slice(0, 5)) print('article', articleMessage(a), { slug: a.slug });
const actual = market.events?.find((e) => e.severity === 'high' && ['sharp-move', 'liquidation-spike', 'both-sides-liquidated'].includes(e.type));
// A medium top-mover is never promoted to a high alert. A missing high event means
// this example is explicitly synthetic, using the real snapshot's liquidation numbers.
print('market', marketMessage(actual || { type: 'liquidation-spike' }, market), { syntheticEvent: !actual });
print('daily', dailyMessage(market));
