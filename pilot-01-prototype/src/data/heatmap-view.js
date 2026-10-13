// Chart labels are Singapore Time (UTC+8, no DST), the site clock.
const SGT_OFFSET_MS = 8 * 3600 * 1000;
export function heatmapPartnerHref(slug, locale = 'en') {
 return `/go/${encodeURIComponent(slug)}?src=liq-heatmap&locale=${encodeURIComponent(locale)}`;
}

export function timelineRows(window, symbol = 'ALL') {
 return (window?.buckets || []).map(row => {
  const selected = symbol === 'ALL' ? row : (Array.isArray(row.symbols) ? row.symbols.find(item => item.symbol === symbol) : row.symbols?.[symbol]);
  return { t:Number.isFinite(row.t) ? row.t : Date.parse(row.start), observed:row.observed, label:new Date(new Date(row.start || row.t).getTime() + SGT_OFFSET_MS).toISOString().slice(window.bucketMs === 300000 ? 11 : 5,window.bucketMs === 300000 ? 16 : 13).replace('T',' '), longUsd:selected?.longUsd || 0, shortUsd:selected?.shortUsd || 0 };
 });
}
