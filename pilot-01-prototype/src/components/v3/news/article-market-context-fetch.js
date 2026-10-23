import { MARKET_ASSET_PATH } from '../../../data/market-events-assets.js';

// A multi-asset API request fails closed if any symbol is missing. Keep refreshing available rail rows
// during partial collector coverage by retrying each detected symbol only after that explicit 404.
export async function fetchArticleMarketContext(request, init, symbols, fetchImpl = fetch) {
  const response = await fetchImpl(request, init);
  if (response.status !== 404 || symbols.length < 2) return response;
  const parts = await Promise.all(symbols.map(async symbol => {
    const part = await fetchImpl(`${MARKET_ASSET_PATH}?symbol=${encodeURIComponent(symbol)}`, init);
    if (part.status === 404) return null;
    if (!part.ok) throw new Error(`market asset HTTP ${part.status}`);
    return part.json();
  }));
  const frames = parts.filter(Boolean);
  if (!frames.length) return response;
  // Never combine figures carrying different collector clocks. Keep the previous frame and retry later.
  const generatedAt = frames[0].generatedAt;
  if (!generatedAt || frames.some(frame => frame.generatedAt !== generatedAt || !Array.isArray(frame.rows))) {
    throw new Error('market asset snapshots disagree');
  }
  return Response.json({ generatedAt, stale: frames.some(frame => frame.stale === true), rows: frames.flatMap(frame => frame.rows) });
}
