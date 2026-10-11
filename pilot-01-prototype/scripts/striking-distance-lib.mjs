// Pure helpers for `search-engines.mjs striking` (no network, no secrets): turn Search Console rows with
// dimensions [query, page] into a per-page "striking distance" list — pages that already earn impressions but
// sit at average position 4–30, i.e. close enough to page one that on-page work can move them.

export const STRIKING_MIN_POSITION = 4;
export const STRIKING_MAX_POSITION = 30;
export const STRIKING_MIN_IMPRESSIONS = 3;

const round1 = (n) => Math.round(n * 10) / 10;

export function isStrikingRow(row, { minPosition = STRIKING_MIN_POSITION, maxPosition = STRIKING_MAX_POSITION, minImpressions = STRIKING_MIN_IMPRESSIONS } = {}) {
  return Boolean(row && Array.isArray(row.keys) && row.keys.length >= 2
    && typeof row.position === "number" && row.position >= minPosition && row.position <= maxPosition
    && Number(row.impressions) >= minImpressions);
}

// Closeness to the top 10: 1.0 at position <= 4 down to ~0.04 at position 30 (linear).
export function closenessToTop10(position) {
  if (typeof position !== "number" || !Number.isFinite(position)) return 0;
  return Math.max(0, Math.min(1, (31 - position) / 27));
}

// rows: [{ keys: [query, page], clicks, impressions, ctr, position }]
// Returns pages sorted by score (impressions × closeness of the impression-weighted position).
export function groupStrikingRows(rows, { site = "https://nexualpha.com/", topQueries = 5, ...filter } = {}) {
  const byPage = new Map();
  for (const row of rows || []) {
    if (!isStrikingRow(row, filter)) continue;
    const [query, pageUrl] = row.keys;
    const page = String(pageUrl).startsWith(site) ? `/${String(pageUrl).slice(site.length)}` : String(pageUrl);
    const entry = byPage.get(page) || { page, url: pageUrl, impressions: 0, clicks: 0, weightedPosition: 0, bestPosition: Infinity, queries: [] };
    entry.impressions += row.impressions;
    entry.clicks += row.clicks || 0;
    entry.weightedPosition += row.position * row.impressions;
    entry.bestPosition = Math.min(entry.bestPosition, row.position);
    entry.queries.push({ query, impressions: row.impressions, clicks: row.clicks || 0, position: round1(row.position) });
    byPage.set(page, entry);
  }
  return [...byPage.values()].map((e) => {
    const avgPosition = e.weightedPosition / e.impressions;
    const queries = e.queries.sort((a, b) => b.impressions - a.impressions || a.position - b.position);
    return {
      page: e.page,
      url: e.url,
      impressions: e.impressions,
      clicks: e.clicks,
      avgPosition: round1(avgPosition),
      bestPosition: round1(e.bestPosition),
      queryCount: queries.length,
      score: round1(e.impressions * closenessToTop10(avgPosition)),
      topQueries: queries.slice(0, topQueries),
    };
  }).sort((a, b) => b.score - a.score || b.impressions - a.impressions || a.page.localeCompare(b.page));
}

const cell = (s) => String(s).replace(/\|/g, "\\|").replace(/\s+/g, " ");

export function strikingMarkdownTable(pages, { limit = Infinity } = {}) {
  const lines = ["| # | Page | Top queries (impr / clicks / pos) | Total impr | Best pos | Avg pos | Score |", "|---|---|---|---:|---:|---:|---:|"];
  pages.slice(0, limit).forEach((p, i) => {
    const q = p.topQueries.map((x) => `${cell(x.query)} (${x.impressions} / ${x.clicks} / ${x.position})`).join("<br>");
    lines.push(`| ${i + 1} | \`${cell(p.page)}\` | ${q} | ${p.impressions} | ${p.bestPosition} | ${p.avgPosition} | ${p.score} |`);
  });
  return lines.join("\n");
}

// Merge the 90- and 28-day lists into one target ranking: 90 days carries volume, 28 days recency.
export function mergeStrikingWindows(long, short) {
  const recent = new Map((short || []).map((p) => [p.page, p]));
  const merged = (long || []).map((p) => {
    const r = recent.get(p.page);
    return { page: p.page, score: round1(p.score + (r ? r.score : 0)), d90: p, d28: r || null };
  });
  for (const r of short || []) if (!merged.some((m) => m.page === r.page)) merged.push({ page: r.page, score: r.score, d90: null, d28: r });
  return merged.sort((a, b) => b.score - a.score || a.page.localeCompare(b.page));
}
