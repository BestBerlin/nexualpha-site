import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildIndexBacklogPriority,
  buildIndexBacklogPriorityReport,
  classifyBacklogUrl,
  parseSitemapUrls,
  renderMarkdown,
  routeMeta,
} from "../scripts/index-backlog-priority.mjs";

const sitemapXml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  "  <url><loc>https://nexualpha.com/exchanges/hyperliquid</loc></url>",
  "  <url><loc>https://nexualpha.com/ar/exchanges/hyperliquid</loc></url>",
  "  <url><loc>https://nexualpha.com/exchanges/uniswap</loc></url>",
  "  <url><loc>https://nexualpha.com/news/tokenized-treasuries-structure-access-risks</loc></url>",
  "  <url><loc>https://nexualpha.com/compare/bybit-vs-bitget</loc></url>",
  "  <url><loc>https://nexualpha.com/topics/derivatives</loc></url>",
  "  <url><loc>https://nexualpha.com/br</loc></url>",
  "  <url><loc>https://nexualpha.com/br/pix</loc></url>",
  "  <url><loc>https://nexualpha.com/exchanges/gmx</loc></url>",
  "</urlset>",
].join("\n");

const publicationReport = {
  excludedIndexedNoindex: [
    {
      url: "https://nexualpha.com/activities/research/gmx?locale=en",
      disposition: "current route robots policy is noindex",
    },
  ],
  excludedIndexedMissing: [
    {
      url: "https://nexualpha.com/exchanges/htx",
      disposition: "not in current route inventory",
    },
  ],
};

const gscIndexSnapshot = {
  submittedMainSitemapPages: 1583,
  indexed: 805,
  discoveredNotIndexed: 1025,
  crawledNotIndexed: 63,
  boundary: "Aggregate Search Console UI snapshot only. It is not assigned to individual sitemap URLs.",
};

const gscBaseline = {
  pages: [
    { page: "/exchanges/hyperliquid", clicks: 0, impressions: 135 },
    { page: "/news/tokenized-treasuries-structure-access-risks", clicks: 0, impressions: 42 },
    { page: "/exchanges/uniswap", clicks: 0, impressions: 34 },
    { page: "/compare/bybit-vs-bitget?locale=en", clicks: 0, impressions: 23 },
    { page: "/topics/derivatives", clicks: 0, impressions: 21 },
  ],
  queries: [
    { query: "hyperliquid fees", clicks: 0, impressions: 66 },
    { query: "tokenized treasuries", clicks: 0, impressions: 7 },
  ],
  countries: [
    { country: "巴西", clicks: 0, impressions: 20 },
  ],
};

test("route metadata strips locale prefixes without changing Brazil owner routes", () => {
  assert.deepEqual(routeMeta("https://nexualpha.com/ar/exchanges/hyperliquid"), {
    path: "/ar/exchanges/hyperliquid",
    locale: "ar",
    canonicalRoute: "/exchanges/hyperliquid",
    isLocaleExpansion: true,
  });
  assert.deepEqual(routeMeta("https://nexualpha.com/br/pix"), {
    path: "/br/pix",
    locale: "en",
    canonicalRoute: "/br/pix",
    isLocaleExpansion: false,
  });
});

test("priority owners, locale expansions, supporting pages and historical review candidates are separated", () => {
  const report = buildIndexBacklogPriority({
    sitemapUrls: parseSitemapUrls(sitemapXml),
    publicationReport,
    gscIndexSnapshot,
    gscBaseline,
  });

  assert.equal(report.status, "BACKLOG_READY");
  assert.equal(report.boundary.urlLevelGsc, "No URL-level GSC indexing export is assigned here.");
  assert.equal(report.summary.buckets["priority-owners"], 7);
  assert.equal(report.summary.buckets["low-priority-locale-expansions"], 1);
  assert.equal(report.summary.buckets["supporting-pages"], 1);
  assert.equal(report.summary.buckets["historical-or-noindex-review-candidates"], 2);

  const byUrl = Object.fromEntries(report.rows.map((row) => [row.url, row]));
  assert.equal(byUrl["https://nexualpha.com/exchanges/hyperliquid"].bucket, "priority-owners");
  assert.equal(byUrl["https://nexualpha.com/exchanges/hyperliquid"].observed.page.impressions, 135);
  assert.equal(byUrl["https://nexualpha.com/ar/exchanges/hyperliquid"].bucket, "low-priority-locale-expansions");
  assert.equal(byUrl["https://nexualpha.com/ar/exchanges/hyperliquid"].observed, null);
  assert.equal(byUrl["https://nexualpha.com/exchanges/gmx"].bucket, "supporting-pages");
  assert.equal(byUrl["https://nexualpha.com/activities/research/gmx?locale=en"].bucket, "historical-or-noindex-review-candidates");
  assert.equal(byUrl["https://nexualpha.com/exchanges/htx"].owner, "route-inventory-review");
});

test("classifier keeps localized owner variants as lower-priority operational inference", () => {
  const row = classifyBacklogUrl("https://nexualpha.com/ja/compare/bybit-vs-bitget");
  assert.equal(row.bucket, "low-priority-locale-expansions");
  assert.equal(row.owner, "bybit-vs-bitget");
  assert.match(row.inference, /Locale expansion/);
});

test("markdown states aggregate GSC boundary and lists owner checklist", () => {
  const report = buildIndexBacklogPriority({
    sitemapUrls: parseSitemapUrls(sitemapXml),
    publicationReport,
    gscIndexSnapshot,
    gscBaseline,
  });
  const markdown = renderMarkdown(report);

  assert.match(markdown, /URL-level GSC: No URL-level GSC indexing export is assigned here/);
  assert.match(markdown, /Discovered, currently not indexed: 1025/);
  assert.match(markdown, /hyperliquid/);
  assert.match(markdown, /brazil/);
  assert.match(markdown, /Historical Or Noindex Review Candidates/);
});

test("CLI builder writes JSON and Markdown from local evidence inputs", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "nexu-index-backlog-"));
  try {
    const sitemap = path.join(dir, "sitemap.xml");
    const publication = path.join(dir, "search-publication-report.json");
    const indexSnapshot = path.join(dir, "gsc-index.md");
    const baseline = path.join(dir, "gsc-baseline.md");
    const output = path.join(dir, "index-backlog.json");
    const markdown = path.join(dir, "index-backlog.md");

    await writeFile(sitemap, sitemapXml, "utf8");
    await writeFile(publication, JSON.stringify(publicationReport), "utf8");
    await writeFile(indexSnapshot, [
      "# Google Search Console indexing snapshot",
      "",
      "- Submitted main sitemap: success, 1,583 discovered pages.",
      "- Indexed: 805.",
      "- Discovered, currently not indexed: 1,025.",
      "- Crawled, currently not indexed: 63.",
    ].join("\n"), "utf8");
    await writeFile(baseline, [
      "## 主要页面",
      "",
      "| 页面 | 点击 | 曝光 |",
      "| --- | ---: | ---: |",
      "| `/exchanges/hyperliquid` | 0 | 135 |",
      "| `/compare/bybit-vs-bitget?locale=en` | 0 | 23 |",
      "",
      "## 主要查询",
      "",
      "| 查询 | 点击 | 曝光 |",
      "| --- | ---: | ---: |",
      "| `hyperliquid fees` | 0 | 66 |",
      "",
      "## 主要国家/地区",
      "",
      "| 国家/地区 | 点击 | 曝光 |",
      "| --- | ---: | ---: |",
      "| 巴西 | 0 | 20 |",
    ].join("\n"), "utf8");

    const result = await buildIndexBacklogPriorityReport({
      sitemap,
      publicationReport: publication,
      gscIndexSnapshot: indexSnapshot,
      gscBaseline: baseline,
      output,
      markdown,
    });

    assert.equal(result.report.status, "BACKLOG_READY");
    assert.equal(result.report.inputs.gscIndexSnapshot.submittedMainSitemapPages, 1583);
    assert.equal(JSON.parse(await readFile(output, "utf8")).inputs.gscIndexSnapshot.discoveredNotIndexed, 1025);
    assert.match(await readFile(markdown, "utf8"), /Index Backlog Priority/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
