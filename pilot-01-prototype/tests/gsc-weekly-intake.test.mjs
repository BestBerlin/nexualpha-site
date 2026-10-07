import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  runGscWeeklyIntake,
  validateIndexExport,
  validatePerformanceExport,
} from "../scripts/gsc-weekly-intake.mjs";

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://nexualpha.com/</loc></url>
  <url><loc>https://nexualpha.com/exchanges/hyperliquid</loc></url>
  <url><loc>https://nexualpha.com/news/hyperliquid-vs-dydx</loc></url>
</urlset>
`;

const robots = `User-agent: OAI-SearchBot
Allow: /

User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Claude-SearchBot
Allow: /

User-agent: Claude-User
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: Bingbot
Allow: /

Sitemap: https://nexualpha.com/sitemap.xml
`;

const partnerRegistry = `
export const CUSTOM_INVITE_CODES = {
  binance: "11350287",
  bitget: "nexu888",
};

export const PARTNER_REGISTRATION_URLS = {
  binance: ["https://www.binance.com/join?ref=11350287"],
  bitget: ["https://partner.bitget.cafe/bg/C6PRAF"],
};

export const partnerRegistry = Object.fromEntries(Object.entries(PARTNER_REGISTRATION_URLS).map(([slug, urls]) => [
  slug,
  {
    inviteCode: CUSTOM_INVITE_CODES[slug],
    registrationUrl: urls[0],
    alternateRegistrationUrls: urls.slice(1),
  },
]));
`;

const publicCta = `
import { PARTNER_REGISTRATION_URLS, partnerRegistry } from "./partner-registry.js";

export function publicCtaForVenue(slug) {
  const urls = PARTNER_REGISTRATION_URLS[slug] || [];
  const partner = partnerRegistry[slug] || {};
  return {
    registrationUrl: urls[0],
    registrationUrls: urls,
    inviteCode: partner.inviteCode,
  };
}
`;

async function makeRoot() {
  const root = await mkdtemp(path.join(os.tmpdir(), "nexu-gsc-intake-root-"));
  await mkdir(path.join(root, "dist", "client"), { recursive: true });
  await mkdir(path.join(root, "public", "research"), { recursive: true });
  await mkdir(path.join(root, "src", "data"), { recursive: true });
  await mkdir(path.join(root, "artifacts", "operational-health"), { recursive: true });
  await mkdir(path.join(root, "docs", "evidence", "four-week-growth-20260927"), { recursive: true });
  await writeFile(path.join(root, "dist", "client", "sitemap.xml"), sitemapXml, "utf8");
  await writeFile(path.join(root, "dist", "client", "version.json"), JSON.stringify({ version: "3.0.0", buildId: "gsc-intake-test" }), "utf8");
  await writeFile(path.join(root, "public", "sitemap.xml"), sitemapXml, "utf8");
  await writeFile(path.join(root, "public", "robots.txt"), robots, "utf8");
  await writeFile(path.join(root, "public", "llms.txt"), "# Public data boundary\nhttps://nexualpha.com/llms-full.txt\n", "utf8");
  await writeFile(path.join(root, "public", "llms-full.txt"), "# Full source index\n", "utf8");
  await writeFile(path.join(root, "public", "research", "fee-matrix.json"), JSON.stringify({
    version: "2026-09-28",
    scope: "Test source-bounded research asset.",
    rows: [{ id: "one" }, { id: "two" }],
  }), "utf8");
  await writeFile(path.join(root, "public", "research", "fee-matrix.csv"), "id\none\ntwo\n", "utf8");
  await writeFile(path.join(root, "src", "data", "international-source-registry.js"), 'export const INTERNATIONAL_SOURCE_REVIEWED_AT = "2026-09-28";\n', "utf8");
  await writeFile(path.join(root, "src", "data", "topic-source-registry.js"), 'export const TOPIC_SOURCE_REVIEW_DATE = "2026-09-28T00:00:00Z";\n', "utf8");
  await writeFile(path.join(root, "src", "data", "partner-registry.js"), partnerRegistry, "utf8");
  await writeFile(path.join(root, "src", "data", "public-cta.js"), publicCta, "utf8");
  await writeFile(path.join(root, "src", "data", "venue-database.js"), "export const venues = [];\n", "utf8");
  await writeFile(path.join(root, "src", "data", "aeo-question-registry.js"), "export const AEO_HIGH_INTENT_VISIBILITY_BASELINE = [];\n", "utf8");
  await writeFile(path.join(root, "artifacts", "operational-health", "latest.json"), JSON.stringify({ status: "PASS", generatedAt: "2026-09-28T00:00:00.000Z", failures: [] }), "utf8");
  await writeFile(path.join(root, "docs", "evidence", "four-week-growth-20260927", "week3-aeo-public-search-observation-20260928.json"), JSON.stringify({ observations: [] }), "utf8");
  return root;
}

test("GSC weekly intake builds a source-bound ledger, queue and weekly report from official exports", async () => {
  const root = await makeRoot();
  const dir = await mkdtemp(path.join(os.tmpdir(), "nexu-gsc-intake-"));
  try {
    const indexExport = path.join(dir, "index.csv");
    const current7 = path.join(dir, "current-7.csv");
    const previous7 = path.join(dir, "previous-7.csv");
    await writeFile(indexExport, [
      "URL,Page indexing status,Reason",
      "https://nexualpha.com/,Indexed,Page is indexed",
      "https://nexualpha.com/exchanges/hyperliquid,Not indexed,Crawled - currently not indexed",
    ].join("\n"), "utf8");
    await writeFile(current7, [
      "Page,Query,Clicks,Impressions,CTR,Position",
      "https://nexualpha.com/exchanges/hyperliquid,hyperliquid fees,0,24,0%,18.2",
      "https://nexualpha.com/news/hyperliquid-vs-dydx,,0,6,0%,3.8",
    ].join("\n"), "utf8");
    await writeFile(previous7, [
      "Page,Query,Clicks,Impressions,CTR,Position",
      "https://nexualpha.com/exchanges/hyperliquid,hyperliquid fees,0,10,0%,22.5",
    ].join("\n"), "utf8");

    const result = await runGscWeeklyIntake({
      root,
      indexExport,
      performanceCurrent7: current7,
      performancePrevious7: previous7,
      outputDir: path.join(dir, "out"),
      generatedAt: "2026-09-28T00:00:00.000Z",
    });

    assert.equal(result.manifest.status, "READY");
    assert.equal(result.manifest.validations.find((item) => item.kind === "gsc_page_indexing_export").parsedRows, 2);
    assert.equal(result.ledger.report.status, "LEDGER_READY");
    assert.equal(result.ledger.report.totals.gscRows, 2);
    assert.equal(result.queue.report.totals.queryPageRows, 1);
    assert.equal(result.weekly.report.gscTrends.sevenDay.status, "TREND_READY");
    assert.equal(result.weekly.report.gscIndexLedger.totals.gscRows, 2);

    const manifestMarkdown = await readFile(result.manifest.outputs.manifestMarkdown, "utf8");
    assert.match(manifestMarkdown, /URL-level index claims come from page indexing exports only/);
    const weeklyMarkdown = await readFile(result.weekly.markdown, "utf8");
    assert.match(weeklyMarkdown, /GSC URL rows: 2/);
    assert.match(weeklyMarkdown, /no query-page pairing/i);
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(dir, { recursive: true, force: true });
  }
});

test("GSC weekly intake rejects aggregate visible snapshots as official performance exports", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "nexu-gsc-intake-snapshot-"));
  try {
    const snapshot = path.join(dir, "visible.json");
    await writeFile(snapshot, JSON.stringify({
      source: "Authenticated Google Search Console visible performance report",
      totals: { clicks: 3, impressions: 178 },
      topQueries: [{ query: "hyperliquid fees", impressions: 18 }],
      topPages: [{ page: "https://nexualpha.com/exchanges/hyperliquid", impressions: 29 }],
    }), "utf8");

    await assert.rejects(
      () => validatePerformanceExport(snapshot, "current_7_day"),
      /aggregate visible snapshot/,
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("GSC weekly intake rejects performance exports when used as URL-level indexing evidence", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "nexu-gsc-intake-wrong-kind-"));
  try {
    const performance = path.join(dir, "performance.csv");
    await writeFile(performance, [
      "Page,Query,Clicks,Impressions,CTR,Position",
      "https://nexualpha.com/exchanges/hyperliquid,hyperliquid fees,0,24,0%,18.2",
    ].join("\n"), "utf8");

    await assert.rejects(
      () => validateIndexExport(performance),
      /page indexing status\/reason fields/,
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
