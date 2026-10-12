#!/usr/bin/env node
// T10 indexation recovery (2026-10-12): builds the reversible thin-page list the site reads through
// pilot-01-prototype/src/data/news-search-state.generated.js (regenerate with scripts/generate-news-search-state.mjs).
//
//   node ops/newsroom/build-thin-noindex-list.mjs --feed <news-feed.json> --out ops/newsroom/thin-noindex-2026-10-12.json \
//     [--gsc <pages-90d.json>] [--clicks <slug-counts.json>] [--backlinks <bing-link-counts.json>]
//
// A page is flagged `noindex-thin` only when ALL hold: search-published today, English title matches the template
// pattern, 0 Google impressions (any locale URL) in the last 90 days, 0 recorded /go or site clicks, no detected
// external backlink, and no hard-coded internal link from a curated page (src/, worker/). Pages stay live (200,
// noindex,follow) and drop out of every sitemap. Undo: delete the slug from `noindex`, regenerate, deploy.
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { isoDay, newsUrlParts, searchAnalytics } from "./measure/gsc.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const arg = (name, fallback = null) => { const index = process.argv.indexOf(`--${name}`); return index > 0 ? process.argv[index + 1] : fallback; };
const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));

export const TEMPLATE_TITLE = /\b(Radar|Checklist|Controls?|Map|Readiness|Boundary|Boundaries|Guardrails|Matrix|Lifecycle|Disclosure)\b/i;

// Obvious duplicates (AUDIT 2026-10-12 §1 "Repeated angles"): weaker -> stronger, rel=canonical only (no redirect).
export const CANONICAL_CONSOLIDATIONS = [
  { slug: "october-10-crypto-crash-one-year-later-liquidity-leverage-liquidations", canonicalSlug: "october-10-crypto-crash-one-year-later-liquidity-leverage", reason: "Same 'October 10 crash one year later' retrospective published a day later under a new slug; the 10-10 edition has the only impression." },
  { slug: "okx-unified-tokenized-stocks-what-you-own-dividends-hours", canonicalSlug: "binance-bstocks-vs-tradfi-perps-what-you-own-hours-dividends", reason: "Tokenized-stock 'what you own' explainer, 5th repeat of the angle; consolidated into the one that earned impressions and has the most primary sources (8)." },
  { slug: "securitize-stocks-tokenized-us-equities-solana-what-you-own", canonicalSlug: "binance-bstocks-vs-tradfi-perps-what-you-own-hours-dividends", reason: "Tokenized-stock 'what you own' explainer repeat (no primary document)." },
  { slug: "imf-tokenized-us-stocks-after-hours-volatility-liquidity-what-it-means", canonicalSlug: "binance-bstocks-vs-tradfi-perps-what-you-own-hours-dividends", reason: "Tokenized-stock 'what it means for you' explainer repeat." },
  { slug: "bybit-us-stocks-etfs-usdc-alpaca-what-you-own", canonicalSlug: "binance-bstocks-vs-tradfi-perps-what-you-own-hours-dividends", reason: "Tokenized-stock 'what you own' explainer repeat (no primary document)." },
  { slug: "crypto-liquidations-overnight-longs-wiped-then-shorts-squeezed-asia-open", canonicalSlug: "crypto-liquidations-shorts-85-percent-negative-funding-bitcoin-83k", reason: "Second own-data liquidation recap for the same primary query 'crypto liquidations today' ($4.1M vs $11.9M recap with more sources)." },
];

const title = (article) => (article?.title && typeof article.title === "object" ? article.title.en || Object.values(article.title)[0] : article?.title) || "";

async function main() {
  const feedPath = arg("feed", path.join(repoRoot, "pilot-01-prototype/public/content/news-feed.json"));
  const outPath = arg("out", path.join(repoRoot, "ops/newsroom/thin-noindex-2026-10-12.json"));
  const feed = readJson(feedPath);
  const articles = (feed.articles || []).filter((article) => article?.status === "PUBLISHED");
  const end = isoDay(Date.now()), start = isoDay(Date.now() - 90 * 864e5);
  const gsc = arg("gsc") ? readJson(arg("gsc")) : { start, end, rows: await searchAnalytics({ startDate: start, endDate: end, dimensions: ["page"] }) };
  const impressions = new Map(), clicks = new Map();
  for (const row of gsc.rows) {
    const parts = newsUrlParts(row.keys[0]);
    if (!parts) continue;
    impressions.set(parts.slug, (impressions.get(parts.slug) || 0) + row.impressions);
    clicks.set(parts.slug, (clicks.get(parts.slug) || 0) + row.clicks);
  }
  const siteClicks = arg("clicks") ? readJson(arg("clicks")) : {};
  const backlinkRows = arg("backlinks") ? readJson(arg("backlinks")) : [];
  const backlinked = new Set(backlinkRows.map((row) => newsUrlParts(row.Url || row.url)?.slug).filter(Boolean));
  const curated = new Set(execFileSync("grep", ["-rhoE", "/news/[a-z0-9][a-z0-9-]{6,}", "src", "worker", "server"], { cwd: path.join(repoRoot, "pilot-01-prototype"), encoding: "utf8" })
    .split("\n").map((line) => line.replace("/news/", "").trim()).filter(Boolean));
  const canonicalSlugs = new Set(CANONICAL_CONSOLIDATIONS.map((item) => item.slug));

  const noindex = [], kept = { impressions: [], clicks: [], backlinks: [], curatedLink: [] };
  let alreadyNoindex = 0, templateTotal = 0;
  for (const article of articles) {
    const match = title(article).match(TEMPLATE_TITLE);
    if (!match) continue;
    templateTotal += 1;
    if (article.seo?.noindex !== false) { alreadyNoindex += 1; continue; }
    if (canonicalSlugs.has(article.slug)) continue;
    const row = { slug: article.slug, publishedAt: article.publishedAt, matched: match[1] };
    if ((impressions.get(article.slug) || 0) > 0) { kept.impressions.push({ ...row, impressions: impressions.get(article.slug) }); continue; }
    if ((siteClicks[article.slug] || 0) > 0 || (clicks.get(article.slug) || 0) > 0) { kept.clicks.push(row); continue; }
    if (backlinked.has(article.slug)) { kept.backlinks.push(row); continue; }
    if (curated.has(article.slug)) { kept.curatedLink.push(row); continue; }
    noindex.push({ ...row, title: title(article), reason: "template-title-0-impressions-90d" });
  }
  noindex.sort((a, b) => a.slug.localeCompare(b.slug));
  const flagged = new Set([...noindex.map((item) => item.slug), ...canonicalSlugs]);
  const strong = articles
    .filter((article) => article.seo?.noindex === false && !flagged.has(article.slug) && (impressions.get(article.slug) || 0) > 0)
    .map((article) => ({ slug: article.slug, impressions: impressions.get(article.slug), clicks: clicks.get(article.slug) || 0 }))
    .sort((a, b) => b.impressions - a.impressions || b.clicks - a.clicks || a.slug.localeCompare(b.slug))
    .slice(0, 100);
  const known = new Set(articles.map((article) => article.slug));
  for (const item of CANONICAL_CONSOLIDATIONS) {
    if (!known.has(item.slug) || !known.has(item.canonicalSlug)) throw new Error(`canonical pair not in feed: ${item.slug} -> ${item.canonicalSlug}`);
  }
  const out = {
    version: 1,
    decidedAt: "2026-10-12",
    decision: "T10 indexation recovery (lead decision, reversible). Pages stay live at the same URL with HTTP 200; nothing is deleted or redirected.",
    undo: "Remove a slug from `noindex` (or a row from `canonical`), run `node scripts/generate-news-search-state.mjs` in pilot-01-prototype, deploy. The page returns to index,follow and to the sitemaps on the next request.",
    policy: {
      templateTitlePattern: TEMPLATE_TITLE.source,
      window: { start: gsc.start, end: gsc.end, source: "GSC Search Analytics, page dimension, dataState=all, every locale URL of the slug" },
      exclusions: ["≥1 Google impression in the window", "≥1 /go or site click (BaoTa /data/private/nexualpha/clicks/go-clicks.jsonl)", "external backlink detected (Bing Webmaster GetLinkCounts)", "hard-coded /news/<slug> link from a curated page in src/, worker/ or server/"],
      noindex: "robots noindex,follow (meta + head), removed from sitemap-articles-*.xml, news-sitemap.xml, hreflang alternates and llms lists",
      canonical: "rel=canonical to the stronger article, robots index,follow, removed from sitemaps",
    },
    counts: {
      feedPublished: articles.length,
      templateTitles: templateTotal,
      alreadyNoindex,
      noindex: noindex.length,
      canonical: CANONICAL_CONSOLIDATIONS.length,
      keptForImpressions: kept.impressions.length,
      keptForClicks: kept.clicks.length,
      keptForBacklinks: kept.backlinks.length,
      keptForCuratedLinks: kept.curatedLink.length,
      strong: strong.length,
    },
    checks: { clickLogNewsSlugs: Object.keys(siteClicks).length, backlinkPagesDetected: backlinked.size },
    noindex,
    canonical: CANONICAL_CONSOLIDATIONS,
    kept,
    strong,
  };
  writeFileSync(outPath, `${JSON.stringify(out, null, 2)}\n`);
  console.log(JSON.stringify(out.counts));
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) await main();
