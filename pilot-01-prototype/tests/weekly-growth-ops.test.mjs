import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildContentPriorityQueue,
  buildOwnerPageBacklog,
  buildWeeklyGrowthOpsReport,
  checkCitationAssets,
  renderWeeklyGrowthMarkdown,
  summarizeGscIndexLedger,
  summarizeProductionRuntime,
  summarizeProtectedHashes,
  summarizeGscTrendWindow,
  summarizeContentAudit,
  summarizeTrafficBaseline,
  writeWeeklyGrowthOpsReport,
} from "../scripts/weekly-growth-ops.mjs";
import { collectLiveRuntimeHealth } from "../scripts/collect-live-runtime-health.mjs";

test("content audit gate blocks consolidation on high-confidence regression", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "nexu-content-audit-"));
  try {
    const auditPath = path.join(dir, "audit.json");
    await writeFile(auditPath, JSON.stringify({
      status: "REGRESSED",
      severity: { high: 2, medium: 4, advisory: 8 },
      baselineComparison: { delta: { high: 1, medium: -2, advisory: -3 } },
    }), "utf8");
    const result = await summarizeContentAudit(auditPath);
    assert.equal(result.gate, "BLOCK_CONSOLIDATION");
    assert.equal(result.highConfidenceSignals, 2);

    await writeFile(auditPath, JSON.stringify({
      status: "IMPROVED",
      severity: { high: 0, medium: 3, advisory: 6 },
      baselineComparison: { delta: { high: -4, medium: -2, advisory: -3 } },
    }), "utf8");
    const improved = await summarizeContentAudit(auditPath);
    assert.equal(improved.gate, "PASS");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("content queue combines explicit GSC, anonymous requests and crawler paths without calling them users", () => {
  const queue = buildContentPriorityQueue({
    gsc: {
      topOpportunities: [
        { priority: 1, page: "https://nexualpha.com/exchanges/hyperliquid?locale=en", impressions: 24, ctr: 0, position: 52.5, action: "expand_source_backed_body_and_internal_links", score: 2.4 },
      ],
    },
    traffic: {
      topHtmlPaths: [
        { path: "/exchanges/hyperliquid", requests: 81 },
        { path: "/news", requests: 260 },
      ],
      topCrawlerHtmlPaths: {
        Googlebot: [{ path: "/exchanges/hyperliquid", requests: 5 }],
        "OAI-SearchBot": [{ path: "/exchanges/hyperliquid", requests: 5 }, { path: "/activities", requests: 23 }],
      },
    },
  });

  assert.equal(queue[0].path, "/exchanges/hyperliquid");
  assert.equal(queue[0].otherAnonymousRequests, 81);
  assert.equal(queue[0].knownCrawlerRequests, 10);
  assert.deepEqual(queue[0].crawlerLabels, ["Googlebot", "OAI-SearchBot"]);
  assert.match(queue[0].boundary, /anonymous requests are not users/i);
  assert.ok(queue.some((item) => item.path === "/news"));
  assert.ok(queue.some((item) => item.path === "/activities"));
});

test("owner page backlog turns search evidence into page-level execution tasks", () => {
  const backlog = buildOwnerPageBacklog({
    gsc: {
      topOpportunities: [
        {
          priority: 1,
          page: "https://nexualpha.com/exchanges/hyperliquid?locale=en",
          query: "hyperliquid fees",
          market: "GLOBAL",
          action: "add_answer_block_table_faq_and_internal_links",
          contentBrief: {
            requiredSections: ["direct_answer", "fee_components", "source_dates"],
            schemaCandidates: ["FAQPage", "WebPage"],
            boundary: "GSC demand does not prove registration, KYC, funding, trading, commission, ranking growth or AI citation.",
          },
        },
      ],
    },
    contentPriorityQueue: [
      { path: "/news", action: "review_intent_answer_and_internal_cta", boundary: "Anonymous requests are not users." },
    ],
  });

  assert.equal(backlog.status, "BACKLOG_READY");
  assert.equal(backlog.totals.gscItems, 1);
  assert.equal(backlog.rows[0].owner, "Content operator");
  assert.equal(backlog.rows[0].page, "/exchanges/hyperliquid");
  assert.deepEqual(backlog.rows[0].requiredSections, ["direct_answer", "fee_components", "source_dates"]);
  assert.deepEqual(backlog.rows[0].schemaCandidates, ["FAQPage", "WebPage"]);
  assert.match(backlog.rows[0].evidenceRequired, /source_dates/);
  assert.match(backlog.rows[0].boundary, /does not prove registration/);
  assert.equal(backlog.rows[1].page, "/news");
  assert.match(backlog.rows[1].boundary, /Anonymous requests are not users/);
});

test("weekly protected hash defaults include regional CTA constitution", async () => {
  const { root } = await makeFixtureRoot();
  try {
    await writeFile(path.join(root, "src", "data", "regional-cta.js"), "export const regionalCta = [];\n", "utf8");
    const protectedHashes = await summarizeProtectedHashes(root, {
      "src/data/regional-cta.js": createHash("sha256").update("export const regionalCta = [];\n").digest("hex"),
    });

    assert.equal(protectedHashes.records[0].path, "src/data/regional-cta.js");
    assert.equal(protectedHashes.records[0].status, "MATCH");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>https://nexualpha.com/</loc>
    <xhtml:link rel="alternate" hreflang="en" href="https://nexualpha.com/" />
    <xhtml:link rel="alternate" hreflang="ja" href="https://nexualpha.com/ja" />
    <xhtml:link rel="alternate" hreflang="x-default" href="https://nexualpha.com/" />
  </url>
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

function partnerRegistrySource(bitgetUrls) {
  return `
export const CUSTOM_INVITE_CODES = {
  binance: "11350287",
  bitget: "nexu888",
  okx: "LUCKX",
  backpack: "luckybitcoin",
};

export const PARTNER_REGISTRATION_URLS = {
  binance: [
    "https://www.bsmkweb.cc/join?ref=11350287&utm_medium=web_share_copy",
    "https://www.bsmkweb.cc/join?ref=11350287",
    "https://www.binance.com/join?ref=11350287",
    "https://accounts.binance.com/register?ref=11350287",
  ],
  bitget: ${JSON.stringify(bitgetUrls, null, 2)},
  okx: [
    "https://www.okx.com/join/nexu888",
    "https://www.topzhjdgxcb.net/join/CANDY007",
    "https://www.topzhjdgxcb.net/join/BESTBERLIN2024",
    "https://www.topzhjdgxcb.net/join/INS898",
    "https://www.topzhjdgxcb.net/join/1836370407",
    "https://www.topzhjdgxcb.net/join/QICYQ",
    "https://www.topzhjdgxcb.net/join/BL686",
  ],
  backpack: [
    "https://backpack.exchange/join/luckybitcoin",
    "https://backpack.exchange/refer/LuckyBitcoin",
  ],
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
}

const publicCtaSource = `
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

const lockedBitgetUrls = [
  "https://partner.bitget.cafe/bg/C6PRAF",
  "https://partner.bitget.cafe/bg/neh7w5h9",
  "https://partner.bitget.cafe/bg/7nfg94491669857692277",
  "https://partner.bitget.cafe/bg/7nfg8123",
  "https://partner.bitget.cafe/bg/7nfg70121688265185866",
  "https://partner.bitget.cafe/bg/7nfg38641689775663839",
  "https://partner.bitget.com/bg/zc8pmupf",
  "https://www.bitget.com/expressly?channelCode=nexu888&vipCode=nexu888",
];

function sha256(text) {
  return createHash("sha256").update(text).digest("hex");
}

async function makeFixtureRoot(bitgetUrls = lockedBitgetUrls) {
  const root = await mkdtemp(path.join(os.tmpdir(), "nexu-weekly-growth-"));
  await mkdir(path.join(root, "public"), { recursive: true });
  await mkdir(path.join(root, "public", "research"), { recursive: true });
  await mkdir(path.join(root, "src", "data"), { recursive: true });
  await mkdir(path.join(root, "dist", "client"), { recursive: true });
  await mkdir(path.join(root, "artifacts", "operational-health"), { recursive: true });
  await mkdir(path.join(root, "docs", "evidence", "four-week-growth-20260927"), { recursive: true });
  await writeFile(path.join(root, "public", "sitemap.xml"), sitemap, "utf8");
  await writeFile(path.join(root, "public", "robots.txt"), robots, "utf8");
  await writeFile(path.join(root, "public", "llms.txt"), "# Public data boundary\nhttps://nexualpha.com/llms-full.txt\n", "utf8");
  await writeFile(path.join(root, "public", "llms-full.txt"), "# Full source index\n", "utf8");
  await writeFile(path.join(root, "public", "research", "example-matrix.json"), JSON.stringify({
    version: "2026-09-15",
    scope: "Source-bounded comparison fields; no live-rate promise.",
    fields: [{ id: "fee" }, { id: "funding" }],
  }), "utf8");
  await writeFile(path.join(root, "public", "research", "example-matrix.csv"), "field_id\nfee\nfunding\n", "utf8");
  await writeFile(path.join(root, "src", "data", "international-source-registry.js"), 'export const INTERNATIONAL_SOURCE_REVIEWED_AT = "2026-09-12";\n', "utf8");
  await writeFile(path.join(root, "src", "data", "topic-source-registry.js"), 'export const TOPIC_SOURCE_REVIEW_DATE = "2026-09-04T19:59:35Z";\n', "utf8");
  const registrySource = partnerRegistrySource(bitgetUrls);
  const venueDatabaseSource = "export const venues = [{ slug: 'binance' }, { slug: 'bitget' }];\n";
  const aeoRegistrySource = `export const AEO_HIGH_INTENT_VISIBILITY_BASELINE = Object.freeze([
  {
    id: "baseline-test",
    query: "Hyperliquid fees funding liquidation account checklist",
    targetUrl: "https://nexualpha.com/exchanges/hyperliquid",
    checkedAt: "2026-09-28",
    accuracy: "not-observed",
  },
]);\n`;
  await writeFile(path.join(root, "src", "data", "partner-registry.js"), registrySource, "utf8");
  await writeFile(path.join(root, "src", "data", "public-cta.js"), publicCtaSource, "utf8");
  await writeFile(path.join(root, "src", "data", "venue-database.js"), venueDatabaseSource, "utf8");
  await writeFile(path.join(root, "src", "data", "aeo-question-registry.js"), aeoRegistrySource, "utf8");
  await writeFile(path.join(root, "dist", "client", "version.json"), JSON.stringify({ version: "3.0.0", buildId: "3.0-test-observation" }), "utf8");
  await writeFile(path.join(root, "artifacts", "operational-health", "latest.json"), JSON.stringify({
    generatedAt: "2026-09-28T00:00:00.000Z",
    baseUrl: "http://127.0.0.1:4173/api/v1",
    status: "PASS",
    failures: [],
  }), "utf8");
  await writeFile(path.join(root, "docs", "evidence", "four-week-growth-20260927", "gsc-index-ledger.json"), JSON.stringify({
    version: "nexualpha-gsc-index-ledger-v1",
    generatedAt: "2026-09-28T00:00:00.000Z",
    status: "INPUT_MISSING",
    inputBoundary: "No GSC page indexing export was supplied. Sitemap URLs are listed as Unknown, not treated as indexed or not indexed.",
    totals: { sitemapUrls: 2, gscRows: null, unknownRows: 2, gscOnlyRows: null, conflictingGscUrls: null },
    summary: { byIndexClass: { Indexed: 0 } },
  }), "utf8");
  await writeFile(path.join(root, "docs", "evidence", "four-week-growth-20260927", "week3-aeo-public-search-observation-20260928.json"), JSON.stringify({
    observedAt: "2026-09-28",
    summary: { queries: 1, nexualphaObserved: 0, nexualphaNotObserved: 1, answerEngineCitationClaims: 0 },
    observations: [{ id: "baseline-test", status: "not-observed-in-returned-results", observedUrls: [] }],
  }), "utf8");
  return {
    root,
    expectedPartnerRegistrySha256: sha256(registrySource),
    expectedProtectedHashes: {
      "src/data/partner-registry.js": sha256(registrySource),
      "src/data/venue-database.js": sha256(venueDatabaseSource),
      "src/data/public-cta.js": sha256(publicCtaSource),
    },
  };
}

test("citation asset gate verifies paired, dated and reusable JSON/CSV evidence", async () => {
  const { root } = await makeFixtureRoot();
  try {
    const result = await checkCitationAssets(root);
    assert.equal(result.status, "PASS");
    assert.equal(result.metrics.assetCount, 1);
    assert.equal(result.metrics.assets[0].recordCount, 2);
    assert.equal(result.metrics.assets[0].csvRows, 2);

    await rm(path.join(root, "public", "research", "example-matrix.csv"));
    const missingPair = await checkCitationAssets(root);
    assert.equal(missingPair.status, "WARNING");
    assert.ok(missingPair.issues.includes("no_paired_json_csv_assets"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("weekly report keeps missing GSC input unknown while technical gates can pass", async () => {
  const { root, expectedPartnerRegistrySha256 } = await makeFixtureRoot();
  try {
    const report = await buildWeeklyGrowthOpsReport({ root, expectedPartnerRegistrySha256, generatedAt: "2026-09-14T00:00:00.000Z" });
    assert.equal(report.status, "READY_WITH_REVIEW_ITEMS");
    assert.equal(report.gsc.status, "UNKNOWN_GSC_INPUT");
    assert.equal(report.ctaFunnel.status, "INPUT_MISSING");
    assert.equal(report.gsc.totals.inputRows, null);
    assert.equal(report.checks.every((check) => check.status === "PASS"), true);
    assert.match(renderWeeklyGrowthMarkdown(report), /Top opportunities: unknown/);
    assert.match(renderWeeklyGrowthMarkdown(report), /Private CTA Funnel/);
    assert.match(renderWeeklyGrowthMarkdown(report), /Status: INPUT_MISSING/);
    assert.doesNotMatch(renderWeeklyGrowthMarkdown(report), /Input rows: 0/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("weekly report defaults to collector production.jsonl and its private archives", async () => {
  const { root, expectedPartnerRegistrySha256 } = await makeFixtureRoot();
  try {
    const analyticsDir = path.join(root, ".private", "analytics");
    await mkdir(analyticsDir, { recursive: true });
    const active = path.join(analyticsDir, "production.jsonl");
    const archive = path.join(analyticsDir, "production.jsonl-20260926");
    const session = randomUUID();
    await writeFile(active, "", "utf8");
    await writeFile(archive, [
      { ...ctaEvent("page_view", { session }), receivedAt: "2026-09-26T03:00:00.000Z", environment: "production" },
      { ...ctaEvent("cta_visible", { session, platform: "bitget" }), receivedAt: "2026-09-26T03:01:00.000Z", environment: "production" },
      { ...ctaEvent("referral_click", { session, platform: "bitget" }), receivedAt: "2026-09-26T03:02:00.000Z", environment: "production" },
    ].map(JSON.stringify).join("\n") + "\n", "utf8");

    const report = await buildWeeklyGrowthOpsReport({
      root,
      expectedPartnerRegistrySha256,
      ctaEnvironment: "production",
      ctaFrom: "2026-09-26T00:00:00Z",
      ctaTo: "2026-09-27T00:00:00Z",
      generatedAt: "2026-09-27T00:30:00.000Z",
    });
    const markdown = renderWeeklyGrowthMarkdown(report);

    assert.equal(report.ctaFunnel.status, "INSUFFICIENT_SAMPLE");
    assert.equal(report.ctaFunnel.sampleReadiness.status, "INSUFFICIENT_SAMPLE");
    assert.equal(report.ctaFunnel.totals.events, 3);
    assert.equal(report.ctaFunnel.totals.referralClicks, 1);
    assert.deepEqual(report.ctaFunnel.selection.sourceFiles, [archive, active]);
    assert.match(markdown, /Source files: 2/);
    assert.match(markdown, /production\.jsonl-20260926/);
    assert.match(markdown, /production\.jsonl/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("weekly observation snapshot reports runtime, ledger, hashes and AEO reminders without inferring commissions", async () => {
  const { root, expectedPartnerRegistrySha256, expectedProtectedHashes } = await makeFixtureRoot();
  try {
    const runtime = await summarizeProductionRuntime({
      root,
      versionFile: path.join(root, "dist", "client", "version.json"),
      productionHealth: path.join(root, "artifacts", "operational-health", "latest.json"),
      now: new Date("2026-09-28T00:00:00.000Z"),
    });
    const ledger = await summarizeGscIndexLedger(path.join(root, "docs", "evidence", "four-week-growth-20260927", "gsc-index-ledger.json"));
    const protectedHashes = await summarizeProtectedHashes(root, expectedProtectedHashes);

    assert.equal(runtime.buildId, "3.0-test-observation");
    assert.equal(runtime.health.status, "PASS");
    assert.equal(ledger.status, "INPUT_MISSING");
    assert.equal(ledger.totals.gscRows, null);
    assert.equal(ledger.totals.unknownRows, 2);
    assert.equal(protectedHashes.status, "MATCH");

    const report = await buildWeeklyGrowthOpsReport({
      root,
      expectedPartnerRegistrySha256,
      expectedProtectedHashes,
      generatedAt: "2026-09-28T00:00:00.000Z",
    });
    const markdown = renderWeeklyGrowthMarkdown(report);

    assert.equal(report.production.buildId, "3.0-test-observation");
    assert.equal(report.gscIndexLedger.status, "INPUT_MISSING");
    assert.equal(report.gscIndexLedger.totals.gscRows, null);
    assert.equal(report.protectedHashes.status, "MATCH");
    assert.equal(report.ctaFunnel.status, "INPUT_MISSING");
    assert.equal(report.ctaFunnel.partnerSideOutcomes.commissions, null);
    assert.equal(report.aeoObservation.status, "REMINDERS_READY");
    assert.equal(report.aeoObservation.reminders[0].previousStatus, "not-observed-in-returned-results");
    assert.match(markdown, /Production Version and Health/);
    assert.match(markdown, /Protected Commercial Hashes/);
    assert.match(markdown, /GSC Index Ledger/);
    assert.match(markdown, /AEO Query Reminders/);
    assert.match(markdown, /Partner commissions: null/);
    assert.match(markdown, /Answer-engine citation claims: 0/);
    assert.doesNotMatch(markdown, /Confirmed registrations: 0/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      const address = server.address();
      resolve(`http://127.0.0.1:${address.port}`);
    });
  });
}

test("live runtime collector requires explicit base URL and separates Core 503 from web readiness", async () => {
  await assert.rejects(() => collectLiveRuntimeHealth(), /LIVE_HEALTH_BASE_URL_REQUIRED/);

  const server = createServer((req, res) => {
    const json = (status, body) => {
      res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
      res.end(JSON.stringify(body));
    };
    if (req.url === "/version.json") json(200, { version: "3.0.0", buildId: "3.0-live-test" });
    else if (req.url === "/health/live") json(200, { status: "live", service: "nexualpha-web" });
    else if (req.url === "/health/web-ready") json(200, { status: "ready", service: "nexualpha-web" });
    else if (req.url === "/health/cta-ready") json(503, { status: "unavailable", configured: false, ready: false, reasonCode: "CTA_COLLECTOR_NOT_CONFIGURED" });
    else if (req.url === "/health/errors-ready") json(503, { status: "unavailable", configured: false, ready: false, reasonCode: "ERROR_MONITOR_NOT_CONFIGURED" });
    else if (req.url === "/health/dependencies") json(200, {
      status: "degraded",
      dependencies: {
        web: { ready: true, status: "ready" },
        cta: { ready: false, configured: false, status: "unavailable", reasonCode: "CTA_COLLECTOR_NOT_CONFIGURED" },
        core: { ready: false, configured: false, status: "unavailable", reasonCode: "CORE_API_ORIGIN_NOT_CONFIGURED" },
      },
    });
    else if (req.url === "/api/v1/health/ready") json(503, {
      status: "unavailable",
      coreApi: "not_configured",
      reasonCode: "CORE_API_ORIGIN_NOT_CONFIGURED",
      dependencies: { coreApi: { configured: false, ready: false } },
    });
    else json(404, { status: "missing" });
  });

  const baseUrl = await listen(server);
  try {
    const snapshot = await collectLiveRuntimeHealth({ baseUrl, generatedAt: "2026-09-28T00:00:00.000Z" });
    assert.equal(snapshot.source, "explicit-live-http");
    assert.equal(snapshot.status, "PASS");
    assert.deepEqual(snapshot.failures, []);
    assert.equal(snapshot.version.buildId, "3.0-live-test");
    assert.equal(snapshot.layers.web.ready.httpStatus, 200);
    assert.equal(snapshot.layers.core.httpStatus, 503);
    assert.equal(snapshot.layers.core.reasonCode, "CORE_API_ORIGIN_NOT_CONFIGURED");
    assert.ok(snapshot.degradedOptionalDependencies.includes("core"));
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("weekly runtime summary consumes explicit live snapshot without making Core 503 a site failure", async () => {
  const { root, expectedPartnerRegistrySha256 } = await makeFixtureRoot();
  try {
    const liveHealth = path.join(root, "artifacts", "operational-health", "live-runtime-latest.json");
    await writeFile(liveHealth, JSON.stringify({
      schemaVersion: "nexualpha-live-runtime-health-v1",
      source: "explicit-live-http",
      generatedAt: "2026-09-28T00:00:00.000Z",
      baseUrl: "https://nexualpha.com",
      policy: "Read-only live HTTP snapshot.",
      status: "PASS",
      failures: [],
      version: { httpStatus: 200, packageVersion: "3.0.0", buildId: "3.0-live-test" },
      layers: {
        web: {
          live: { httpStatus: 200, ok: true, status: "live", configured: null, ready: null, reasonCode: null },
          ready: { httpStatus: 200, ok: true, status: "ready", configured: null, ready: null, reasonCode: null },
        },
        cta: { httpStatus: 503, ok: true, status: "unavailable", configured: false, ready: false, reasonCode: "CTA_COLLECTOR_NOT_CONFIGURED" },
        errors: { httpStatus: 503, ok: true, status: "unavailable", configured: false, ready: false, reasonCode: "ERROR_MONITOR_NOT_CONFIGURED" },
        dependencies: { httpStatus: 200, ok: true, status: "degraded", configured: null, ready: null, reasonCode: null },
        core: { httpStatus: 503, ok: true, status: "unavailable", configured: false, ready: false, reasonCode: "CORE_API_ORIGIN_NOT_CONFIGURED" },
      },
      degradedOptionalDependencies: ["cta", "errors", "core"],
      recovery: null,
      endpoints: [],
    }), "utf8");

    const report = await buildWeeklyGrowthOpsReport({
      root,
      expectedPartnerRegistrySha256,
      productionHealth: liveHealth,
      generatedAt: "2026-09-28T00:00:00.000Z",
    });
    const markdown = renderWeeklyGrowthMarkdown(report);

    assert.equal(report.production.health.source, "explicit-live-http");
    assert.equal(report.production.health.status, "PASS");
    assert.equal(report.production.health.web.ok, true);
    assert.equal(report.production.health.web.live.status, "live");
    assert.equal(report.production.health.web.ready.status, "ready");
    assert.equal(report.production.health.core.reasonCode, "CORE_API_ORIGIN_NOT_CONFIGURED");
    assert.match(report.production.health.recovery.condition, /CORE_API_ORIGIN|CORE_API_BASE_URL/);
    assert.equal(report.production.health.failures.length, 0);
    assert.doesNotMatch(report.nextActions.map((item) => item.action).join("\n"), /Close production health failures/);
    assert.match(markdown, /Web live: live/);
    assert.match(markdown, /Web ready: ready/);
    assert.match(markdown, /Core readiness: unavailable/);
    assert.match(markdown, /Optional degraded: cta, errors, core/);
    assert.match(markdown, /Recovery condition: Configure CORE_API_ORIGIN or CORE_API_BASE_URL/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

function ctaEvent(type, overrides = {}) {
  return {
    version: 2,
    type,
    eventId: randomUUID(),
    session: overrides.session || randomUUID(),
    page: overrides.page || "/br",
    locale: overrides.locale || "pt-BR",
    source: overrides.source || "telegram",
    market: overrides.market || "BR",
    product: overrides.product || "spot",
    campaign: overrides.campaign || "br_pix",
    publisher: overrides.publisher || "telegram",
    device: overrides.device || "mobile",
    ...(type === "decision_select" ? { decision: overrides.decision || "bitget", placement: overrides.placement || "hero" } : {}),
    ...(["cta_visible", "outbound_handoff", "referral_click"].includes(type) ? { platform: overrides.platform || "bitget", placement: overrides.placement || "hero" } : {}),
    ...(type === "telegram_handoff" ? { decision: "telegram_research", placement: "telegram-handoff", telegramTarget: "bot", telegramReturnKind: "route", telegramReturnPath: "/telegram" } : {}),
  };
}

test("weekly report includes private CTA funnel and equal-window movement without calling clicks registrations", async () => {
  const { root, expectedPartnerRegistrySha256 } = await makeFixtureRoot();
  const dir = await mkdtemp(path.join(os.tmpdir(), "nexu-weekly-cta-"));
  try {
    const ctaData = path.join(dir, "cta.jsonl");
    const previousSession = randomUUID();
    const currentSession = randomUUID();
    const dropSession = randomUUID();
    const telegramDropSession = randomUUID();
    const rows = [
      { ...ctaEvent("page_view", { session: previousSession }), receivedAt: "2026-09-07T00:00:00.000Z", environment: "production" },
      { ...ctaEvent("page_view", { session: currentSession }), receivedAt: "2026-09-14T00:00:00.000Z", environment: "production" },
      { ...ctaEvent("decision_select", { session: currentSession }), receivedAt: "2026-09-14T00:02:00.000Z", environment: "production" },
      { ...ctaEvent("cta_visible", { session: currentSession }), receivedAt: "2026-09-14T00:03:00.000Z", environment: "production" },
      { ...ctaEvent("outbound_handoff", { session: currentSession }), receivedAt: "2026-09-14T00:04:00.000Z", environment: "production" },
      { ...ctaEvent("referral_click", { session: currentSession }), receivedAt: "2026-09-14T00:05:00.000Z", environment: "production" },
      { ...ctaEvent("telegram_handoff", { session: currentSession, source: "direct", publisher: "creator" }), receivedAt: "2026-09-14T00:06:00.000Z", environment: "production" },
      { ...ctaEvent("page_view", { session: dropSession, page: "/br" }), receivedAt: "2026-09-14T01:00:00.000Z", environment: "production" },
      { ...ctaEvent("cta_visible", { session: dropSession, page: "/br", platform: "binance" }), receivedAt: "2026-09-14T01:01:00.000Z", environment: "production" },
      { ...ctaEvent("page_view", { session: telegramDropSession, page: "/telegram", source: "telegram", publisher: "telegram" }), receivedAt: "2026-09-14T02:00:00.000Z", environment: "production" },
    ];
    await writeFile(ctaData, rows.map(JSON.stringify).join("\n") + "\n", "utf8");

    const report = await buildWeeklyGrowthOpsReport({
      root,
      expectedPartnerRegistrySha256,
      ctaData,
      ctaEnvironment: "production",
      ctaFrom: "2026-09-14T00:00:00Z",
      ctaTo: "2026-09-21T00:00:00Z",
      generatedAt: "2026-09-21T00:00:00.000Z",
    });
    const markdown = renderWeeklyGrowthMarkdown(report);

    assert.equal(report.ctaFunnel.status, "INSUFFICIENT_SAMPLE");
    assert.equal(report.ctaFunnel.weekOverWeek.status, "READY");
    assert.equal(report.ctaFunnel.dataQuality.status, "PASS");
    assert.ok(report.ctaFunnel.eventTaxonomy.some((row) => row.type === "partner_commission" && row.value === null));
    assert.equal(report.ctaFunnel.byCountry[0].country, "BR");
    assert.equal(report.ctaFunnel.byPlatform[0].platform, "bitget");
    assert.equal(report.ctaFunnel.totals.confirmedRegistrations, null);
    assert.equal(report.ctaFunnel.partnerSideOutcomes.kyc, null);
    assert.equal(report.ctaFunnel.weekOverWeek.current.partnerRegistrations, null);
    assert.equal(report.ctaFunnel.weekOverWeek.delta.partnerCommissions, null);
    assert.equal(report.ctaFunnel.dropOffQueues.visible_no_click_pages[0].page, "/br");
    assert.equal(report.ctaFunnel.dropOffQueues.platform_visible_no_click[0].platform, "binance");
    assert.ok(report.ctaFunnel.dropOffQueues.telegram_entry_no_decision.some((row) => row.page === "/telegram"));
    assert.equal(report.ctaFunnel.onsiteJourney.status, "READY");
    assert.equal(report.ctaFunnel.onsiteJourney.stages.find((row) => row.id === "external_handoff").sessions, 1);
    assert.equal(report.ctaFunnel.onsiteJourney.stages.find((row) => row.id === "telegram_handoff").sessions, 1);
    assert.equal(report.ctaFunnel.totals.telegramHandoffs, 1);
    assert.equal(report.ctaFunnel.onsiteJourney.telegramReturn.sessions, 3);
    assert.equal(report.ctaFunnel.onsiteJourney.byMarketProduct[0].partnerRegistrations, null);
    assert.equal(report.ctaFunnel.telegramSignals.status, "INSUFFICIENT_SAMPLE");
    assert.equal(report.ctaFunnel.telegramSignals.handoffSessions, 1);
    assert.equal(report.ctaFunnel.telegramSignals.returnReferralClicks, 1);
    assert.match(markdown, /Private CTA Funnel/);
    assert.match(markdown, /Sample readiness: INSUFFICIENT_SAMPLE/);
    assert.match(markdown, /Onsite CTA Journey/);
    assert.match(markdown, /Telegram Signals/);
    assert.match(markdown, /Telegram handoffs: 1/);
    assert.match(markdown, /telegram_return/);
    assert.match(markdown, /CTA Drop-off Queues/);
    assert.match(markdown, /visible_no_click_pages/);
    assert.match(markdown, /CTA Data Quality/);
    assert.match(markdown, /Partner KYC: null/);
    assert.match(markdown, /CTA Week-over-week/);
    assert.match(markdown, /Confirmed registrations: null/);
    assert.match(markdown, /no partner registration/);
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(dir, { recursive: true, force: true });
  }
});

test("weekly report summarizes a supplied GSC queue without inventing conversions", async () => {
  const { root, expectedPartnerRegistrySha256 } = await makeFixtureRoot();
  const dir = await mkdtemp(path.join(os.tmpdir(), "nexu-weekly-growth-out-"));
  try {
    const gscQueue = path.join(dir, "queue.json");
    await writeFile(gscQueue, JSON.stringify({
      status: "QUEUE_READY",
      totals: { inputRows: 2, rankedRows: 1, blockedRows: 1 },
      queue: [
        {
          page: "/exchanges/hyperliquid",
          query: "hyperliquid fees",
          market: "GLOBAL",
          intent: ["cost_or_payment", "venue"],
          impressions: 24,
          ctr: 0,
          position: 18.2,
          recommendedAction: "add_answer_block_table_faq_and_internal_links",
          opportunityScore: 3.4,
          contentBrief: {
            searchIntent: "hyperliquid fees",
            requiredSections: ["direct_answer", "fee_components", "source_dates"],
            schemaCandidates: ["FAQPage", "WebPage"],
            boundary: "GSC demand does not prove registration, KYC, funding, trading, commission, ranking growth or AI citation.",
          },
        },
      ],
    }), "utf8");

    const output = path.join(dir, "weekly.json");
    const markdown = path.join(dir, "weekly.md");
    const result = await writeWeeklyGrowthOpsReport({ root, expectedPartnerRegistrySha256, gscQueue, output, markdown, generatedAt: "2026-09-14T00:00:00.000Z" });

    assert.equal(result.report.gsc.topOpportunities[0].query, "hyperliquid fees");
    assert.deepEqual(result.report.gsc.topOpportunities[0].contentBrief.requiredSections, ["direct_answer", "fee_components", "source_dates"]);
    assert.equal(result.report.gscTrends.sevenDay.status, "UNKNOWN_GSC_TREND");
    assert.equal(result.report.gscTrends.twentyEightDay.totals.currentRows, null);
    assert.equal(result.report.gsc.status, "QUEUE_READY_WITH_BLOCKED_ROWS");
    assert.equal(result.report.status, "READY_WITH_REVIEW_ITEMS");
    assert.ok(result.report.nextActions.some((item) => item.action.includes("page-query GSC rows")));
    assert.ok(result.report.nextActions.some((item) => item.action.includes("current 7-day GSC export")));
    assert.match(await readFile(markdown, "utf8"), /hyperliquid fees/);
    assert.match(await readFile(markdown, "utf8"), /direct_answer, fee_components, source_dates/);
    assert.match(await readFile(markdown, "utf8"), /does not prove registration/);
    assert.match(await readFile(markdown, "utf8"), /GSC 7-Day Trend/);
    assert.match(await readFile(output, "utf8"), /This report measures SEO\/GEO\/AEO operating readiness/);
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(dir, { recursive: true, force: true });
  }
});

test("GSC trend baseline keeps missing previous window unknown instead of zero", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "nexu-gsc-trend-baseline-"));
  try {
    const currentPath = path.join(dir, "current.json");
    await writeFile(currentPath, JSON.stringify({
      rows: [
        { page: "https://nexualpha.com/exchanges/hyperliquid", clicks: 0, impressions: 24, ctr: "0%", position: 52.5 },
      ],
    }), "utf8");

    const trend = await summarizeGscTrendWindow({ currentPath, windowDays: 7 });

    assert.equal(trend.status, "BASELINE_ONLY");
    assert.equal(trend.totals.currentRows, 1);
    assert.equal(trend.totals.previousRows, null);
    assert.equal(trend.rows[0].delta.impressions, null);
    assert.equal(trend.rows[0].status, "BASELINE_ONLY");
    assert.ok(trend.rows[0].missing.includes("previous_window"));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("GSC trend accepts an authenticated visible snapshot without inferring query-to-page pairs", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "nexu-gsc-visible-snapshot-"));
  try {
    const currentPath = path.join(dir, "visible-snapshot.json");
    await writeFile(currentPath, JSON.stringify({
      source: "Authenticated Google Search Console visible performance report",
      window: { from: "2026-09-06", to: "2026-09-13" },
      totals: { clicks: 3, impressions: 178, ctr: 0.017, averagePosition: 32.5 },
      topQueries: [
        { query: "hyperliquid fees", clicks: 0, impressions: 18 },
        { query: "tokenized treasury", clicks: 0, impressions: 6 },
      ],
      topPages: [
        { page: "https://nexualpha.com/exchanges/hyperliquid", clicks: 0, impressions: 29 },
      ],
    }), "utf8");

    const trend = await summarizeGscTrendWindow({ currentPath, windowDays: 7 });

    assert.equal(trend.status, "BASELINE_ONLY");
    assert.equal(trend.totals.currentRows, 3);
    assert.deepEqual(trend.rows.map((row) => row.dimension), ["query", "query", "page"]);
    assert.equal(trend.rows[0].current.ctr, 0);
    assert.equal(trend.rows[0].current.position, null);
    assert.ok(trend.rows.every((row) => row.dimension !== "page_query"));
    assert.ok(trend.rows.every((row) => row.missing.includes("previous_window")));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("GSC trend compares only explicit same-dimension rows", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "nexu-gsc-trend-compare-"));
  try {
    const currentPath = path.join(dir, "current.csv");
    const previousPath = path.join(dir, "previous.csv");
    await writeFile(currentPath, [
      "Page,Query,Clicks,Impressions,CTR,Position",
      "https://nexualpha.com/exchanges/hyperliquid,,0,24,0%,52.5",
      ",hyperliquid fees,0,15,0%,63.3",
    ].join("\n"), "utf8");
    await writeFile(previousPath, [
      "Page,Query,Clicks,Impressions,CTR,Position",
      "https://nexualpha.com/exchanges/hyperliquid,,0,10,0%,70",
      ",hyperliquid fees,0,7,0%,80",
      "https://nexualpha.com/exchanges/uniswap,,0,4,0%,60",
    ].join("\n"), "utf8");

    const trend = await summarizeGscTrendWindow({ currentPath, previousPath, windowDays: 7 });
    const pageRow = trend.rows.find((row) => row.dimension === "page");
    const queryRow = trend.rows.find((row) => row.dimension === "query");

    assert.equal(trend.status, "TREND_READY");
    assert.equal(trend.totals.comparedRows, 2);
    assert.equal(pageRow.delta.impressions, 14);
    assert.equal(queryRow.delta.impressions, 8);
    assert.equal(pageRow.label, "/exchanges/hyperliquid");
    assert.equal(queryRow.label, "hyperliquid fees");
    assert.notEqual(pageRow.key, queryRow.key);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("weekly report classifies 7-day and 28-day GSC trend actions without pairing queries to pages", async () => {
  const { root, expectedPartnerRegistrySha256 } = await makeFixtureRoot();
  const dir = await mkdtemp(path.join(os.tmpdir(), "nexu-weekly-trends-"));
  try {
    const current7 = path.join(dir, "current-7.csv");
    const previous7 = path.join(dir, "previous-7.csv");
    const current28 = path.join(dir, "current-28.csv");
    await writeFile(current7, [
      "Page,Clicks,Impressions,CTR,Position",
      "https://nexualpha.com/news/hyperliquid-vs-dydx,0,6,0%,3.8",
    ].join("\n"), "utf8");
    await writeFile(previous7, [
      "Page,Clicks,Impressions,CTR,Position",
      "https://nexualpha.com/news/hyperliquid-vs-dydx,0,4,0%,4.2",
    ].join("\n"), "utf8");
    await writeFile(current28, [
      "Query,Clicks,Impressions,CTR,Position",
      "tokenized treasury,0,3,,82.7",
    ].join("\n"), "utf8");

    const report = await buildWeeklyGrowthOpsReport({
      root,
      expectedPartnerRegistrySha256,
      gscCurrent7: current7,
      gscPrevious7: previous7,
      gscCurrent28: current28,
      generatedAt: "2026-09-14T00:00:00.000Z",
    });

    assert.equal(report.gscTrends.sevenDay.status, "TREND_READY");
    assert.equal(report.gscTrends.sevenDay.rows[0].action, "rewrite_serp_title_meta_and_cta_bridge");
    assert.equal(report.gscTrends.twentyEightDay.status, "BASELINE_ONLY");
    assert.equal(report.gscTrends.twentyEightDay.rows[0].dimension, "query");
    assert.equal(report.gscTrends.twentyEightDay.rows[0].delta.impressions, null);
    assert.ok(report.nextActions.some((item) => item.action.includes("rewrite_serp_title_meta_and_cta_bridge")));
    assert.doesNotMatch(renderWeeklyGrowthMarkdown(report), /Input rows: 0/);
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(dir, { recursive: true, force: true });
  }
});

test("weekly report blocks when constitutional invitation registry hash changes", async () => {
  const goodFixture = await makeFixtureRoot();
  const expectedPartnerRegistrySha256 = goodFixture.expectedPartnerRegistrySha256;
  await rm(goodFixture.root, { recursive: true, force: true });

  const { root } = await makeFixtureRoot(["https://www.bitget.com/"]);
  try {
    const report = await buildWeeklyGrowthOpsReport({ root, expectedPartnerRegistrySha256, generatedAt: "2026-09-14T00:00:00.000Z" });
    const constitution = report.checks.find((check) => check.id === "invitation_constitution");
    assert.equal(report.status, "BLOCKED");
    assert.equal(constitution.status, "BLOCKED");
    assert.ok(constitution.issues.includes("partner_registry_hash_changed"));
    assert.equal(constitution.metrics.venues.bitget.publicCtaClusterOk, true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("weekly report consumes anonymous traffic evidence without calling requests users", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "nexu-traffic-weekly-"));
  const trafficReport = path.join(dir, "traffic.json");
  try {
    await writeFile(trafficReport, JSON.stringify({
      generatedAt: "2026-09-14T00:00:00.000Z",
      status: "READY",
      totals: { parsedRequests: 120, unparsedLines: 1 },
      statuses: { 200: 110, 404: 10 },
      crawlerUserAgentCounts: { Googlebot: 2 },
      topHtmlPaths: [{ path: "/br", requests: 12 }],
      top404Paths: [{ path: "/wp-admin/install.php", requests: 10 }],
    }), "utf8");
    const summary = await summarizeTrafficBaseline(trafficReport, new Date("2026-09-15T00:00:00.000Z"));
    assert.equal(summary.status, "READY");
    assert.equal(summary.ageDays, 1);
    assert.equal(summary.topHtmlPaths[0].path, "/br");
    const markdown = renderWeeklyGrowthMarkdown({
      generatedAt: "2026-09-15T00:00:00.000Z",
      status: "READY",
      boundary: "test",
      gsc: { status: "UNKNOWN_GSC_INPUT", totals: { inputRows: null, rankedRows: null, blockedRows: null }, topOpportunities: [] },
      traffic: summary,
      checks: [],
      nextActions: [],
    });
    assert.match(markdown, /Parsed requests: 120/);
    assert.match(markdown, /request counts are not unique users/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
