import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildGscIndexLedger,
  buildIndexLedger,
  classifyGovernance,
  classifyIndexingRow,
  classifyUrlRoute,
  parseGscIndexExport,
  parseSitemapUrls,
  renderMarkdown,
} from "../scripts/gsc-index-ledger.mjs";

const sitemapXml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  "  <url><loc>https://nexualpha.com/</loc></url>",
  "  <url><loc>https://nexualpha.com/ja/exchanges/binance</loc></url>",
  "  <url><loc>https://nexualpha.com/br</loc></url>",
  "  <url><loc>https://nexualpha.com/compare/bybit-vs-bitget</loc></url>",
  "  <url><loc>https://nexualpha.com/exchanges/hyperliquid</loc></url>",
  "</urlset>",
].join("\n");

test("missing GSC indexing export keeps sitemap URLs unknown instead of zero or indexed", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "nexu-index-ledger-missing-"));
  try {
    const sitemap = path.join(dir, "sitemap.xml");
    const output = path.join(dir, "ledger.json");
    const markdown = path.join(dir, "ledger.md");
    await writeFile(sitemap, sitemapXml, "utf8");

    const result = await buildGscIndexLedger({
      sitemap,
      output,
      markdown,
    });

    assert.equal(result.report.status, "INPUT_MISSING");
    assert.equal(result.report.totals.sitemapUrls, 5);
    assert.equal(result.report.totals.sitemapInputUrls, 5);
    assert.equal(result.report.totals.duplicateSitemapUrls, 0);
    assert.equal(result.report.totals.gscRows, null);
    assert.equal(result.report.totals.unknownRows, 5);
    assert.equal(result.report.summary.byIndexClass.Unknown, 5);
    assert.equal(result.report.summary.byUrlClass.comparison.Unknown, 1);
    assert.equal(result.report.summary.byIndexClass.Indexed, 0);
    assert.equal(result.report.rows.every((row) => row.indexClass === "Unknown"), true);
    assert.equal(result.report.rows.find((row) => row.route === "/compare/bybit-vs-bitget").urlClass, "comparison");
    assert.match(await readFile(markdown, "utf8"), /No GSC page indexing export was supplied/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("Search Console CSV reasons are classified into the approved ledger classes", () => {
  const csv = [
    "URL,Page indexing status,Reason",
    "https://nexualpha.com/,Indexed,Page is indexed",
    "https://nexualpha.com/ja/exchanges/binance,Not indexed,Crawled - currently not indexed",
    "https://nexualpha.com/br,Not indexed,Discovered - currently not indexed",
    "https://nexualpha.com/compare/bybit-vs-bitget,Not indexed,Duplicate without user-selected canonical",
    "https://nexualpha.com/exchanges/hyperliquid,Not indexed,Blocked by robots.txt",
  ].join("\n");

  const rows = parseGscIndexExport(csv, "indexing.csv");
  const report = buildIndexLedger({
    sitemapUrls: parseSitemapUrls(sitemapXml),
    gscRows: rows,
    sitemapPath: "sitemap.xml",
    gscExportPath: "indexing.csv",
  });

  assert.equal(report.status, "LEDGER_READY");
  assert.deepEqual(report.summary.byIndexClass, {
    Indexed: 1,
    "Crawled-not-indexed": 1,
    "Discovered-not-indexed": 1,
    "Duplicate-canonical": 1,
    Soft404: 0,
    Blocked: 1,
    Unknown: 0,
  });
  assert.equal(report.summary.byLocale.ja["Crawled-not-indexed"], 1);
  assert.equal(report.summary.byCountry.BR["Discovered-not-indexed"], 1);
  assert.equal(report.summary.byUrlClass["venue-profile"]["Crawled-not-indexed"], 1);
  assert.equal(report.summary.byUrlClass["regional-decision"]["Discovered-not-indexed"], 1);
  assert.deepEqual(report.summary.byGovernanceAction, {
    retain: 1,
    merge: 1,
    noindex: 1,
    observe: 2,
  });
  assert.equal(report.summary.byRoute["/exchanges/binance"]["Crawled-not-indexed"], 1);
  assert.equal(report.rows.find((row) => row.route === "/compare/bybit-vs-bitget").indexClass, "Duplicate-canonical");
  assert.equal(report.rows.find((row) => row.route === "/compare/bybit-vs-bitget").governanceAction, "merge");
});

test("duplicate sitemap URLs are deduped and conflicting GSC URL rows fail closed", () => {
  const csv = [
    "URL,Page indexing status,Reason",
    "https://nexualpha.com/compare/bybit-vs-bitget,Indexed,Page is indexed",
    "https://nexualpha.com/compare/bybit-vs-bitget,Not indexed,Crawled - currently not indexed",
  ].join("\n");

  const report = buildIndexLedger({
    sitemapUrls: [
      "https://nexualpha.com/compare/bybit-vs-bitget",
      "https://nexualpha.com/compare/bybit-vs-bitget",
    ],
    gscRows: parseGscIndexExport(csv, "indexing.csv"),
    sitemapPath: "sitemap.xml",
    gscExportPath: "indexing.csv",
  });

  assert.equal(report.totals.sitemapInputUrls, 2);
  assert.equal(report.totals.sitemapUrls, 1);
  assert.equal(report.totals.duplicateSitemapUrls, 1);
  assert.equal(report.totals.duplicateGscUrls, 1);
  assert.equal(report.totals.conflictingGscUrls, 1);
  assert.equal(report.rows[0].indexClass, "Unknown");
  assert.equal(report.rows[0].source, "gsc-export-conflict");
  assert.equal(report.rows[0].governanceAction, "observe");
  assert.deepEqual(report.rows[0].sourceRows, [1, 2]);
  assert.match(renderMarkdown(report), /Duplicate GSC URL Rows/);
});

test("JSON exports support page arrays and soft 404 classification", () => {
  const input = JSON.stringify({
    pages: [
      { page: "https://nexualpha.com/exchanges/hyperliquid", status: "Not indexed", reason: "Soft 404" },
      { page: "https://nexualpha.com/br", status: "Indexed" },
    ],
  });

  const rows = parseGscIndexExport(input, "indexing.json");
  assert.equal(rows.length, 2);
  assert.equal(rows[0].indexClass, "Soft404");
  assert.equal(rows[1].indexClass, "Indexed");
});

test("unrecognized rows stay Unknown and markdown preserves the evidence boundary", () => {
  assert.equal(classifyIndexingRow({ url: "https://nexualpha.com/", status: "Needs attention" }), "Unknown");

  const report = buildIndexLedger({
    sitemapUrls: ["https://nexualpha.com/"],
    gscRows: [{ url: "https://nexualpha.com/", indexClass: "Unknown", sourceRow: 1, rawStatus: "Needs attention" }],
    sitemapPath: "sitemap.xml",
    gscExportPath: "indexing.csv",
  });
  const markdown = renderMarkdown(report);

  assert.equal(report.summary.byLocale.en.Unknown, 1);
  assert.match(markdown, /Only supplied GSC page indexing rows are used/);
  assert.match(markdown, /\| https:\/\/nexualpha.com\/ \| \/ \| home \| en \|  \| Unknown \| observe \| gsc-export \|/);
});

test("GSC-only unindexed samples receive executable governance dispositions", () => {
  const csv = [
    "URL,Page indexing status,Reason",
    "https://nexualpha.com/zh-hans/news/translated-low-difference,Not indexed,Crawled - currently not indexed",
    "https://nexualpha.com/ja/factbook/binance,Not indexed,Discovered - currently not indexed",
    "https://nexualpha.com/legacy-copy,Not indexed,Duplicate without user-selected canonical",
    "https://nexualpha.com/empty-old-page,Not indexed,Soft 404",
  ].join("\n");

  const report = buildIndexLedger({
    sitemapUrls: ["https://nexualpha.com/"],
    gscRows: parseGscIndexExport(csv, "indexing.csv"),
    sitemapPath: "sitemap.xml",
    gscExportPath: "indexing.csv",
  });

  assert.equal(report.totals.gscOnlyRows, 4);
  assert.equal(report.rows.find((row) => row.route === "/news/translated-low-difference").governanceAction, "observe");
  assert.equal(report.rows.find((row) => row.route === "/factbook/binance").governanceAction, "observe");
  assert.equal(report.rows.find((row) => row.route === "/legacy-copy").governanceAction, "merge");
  assert.equal(report.rows.find((row) => row.route === "/empty-old-page").governanceAction, "noindex");
  assert.deepEqual(report.summary.byGovernanceAction, {
    retain: 0,
    merge: 1,
    noindex: 1,
    observe: 3,
  });
  assert.match(renderMarkdown(report), /By Governance Action/);
});

test("governance classification keeps non-indexed evidence as review work unless canonical, soft404 or blocked", () => {
  assert.equal(classifyGovernance({ indexClass: "Indexed" }).governanceAction, "retain");
  assert.equal(classifyGovernance({ indexClass: "Duplicate-canonical" }).governanceAction, "merge");
  assert.equal(classifyGovernance({ indexClass: "Blocked" }).governanceAction, "noindex");
  assert.equal(classifyGovernance({ indexClass: "Crawled-not-indexed", urlClass: "news-article", locale: "zh-Hans" }).governanceAction, "observe");
});

test("URL route classifier provides stable Week 1 bucket names", () => {
  assert.equal(classifyUrlRoute("/"), "home");
  assert.equal(classifyUrlRoute("/compare/okx-vs-bybit"), "comparison");
  assert.equal(classifyUrlRoute("/exchanges/hyperliquid"), "venue-profile");
  assert.equal(classifyUrlRoute("/factbook/binance"), "factbook");
  assert.equal(classifyUrlRoute("/topics/no-kyc"), "topic-hub");
  assert.equal(classifyUrlRoute("/news/tokenized-treasury"), "news-article");
  assert.equal(classifyUrlRoute("/br/pix"), "regional-decision");
});

test("missing sitemap fails closed without attempting URL coverage claims", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "nexu-index-ledger-no-sitemap-"));
  try {
    const result = await buildGscIndexLedger({
      sitemap: path.join(dir, "missing-sitemap.xml"),
      output: path.join(dir, "ledger.json"),
      markdown: path.join(dir, "ledger.md"),
    });

    assert.equal(result.report.status, "INPUT_MISSING");
    assert.equal(result.report.totals.sitemapUrls, null);
    assert.deepEqual(result.report.rows, []);
    assert.match(await readFile(result.markdown, "utf8"), /No readable sitemap was supplied/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
