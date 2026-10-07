import assert from "node:assert/strict";
import test from "node:test";

import { auditTraffic404, render404AuditMarkdown } from "../scripts/audit-traffic-404.mjs";

const trafficReport = {
  statuses: { 200: 40, 404: 15 },
  top404Paths: [
    { path: "/wp-admin/install.php", requests: 4 },
    { path: "/assets/index-oldhash123.js", requests: 2 },
    { path: "/favicon.ico", requests: 1 },
    { path: "/news-sitemap.xml", requests: 1 },
    { path: "/api/v1/agent/mcp", requests: 1 },
    { path: "/compare/aevo-vs-binance", requests: 3 },
    { path: "/exchanges/null", requests: 2 },
    { path: "/missing-page", requests: 1 },
  ],
};

const passingWholeSite = {
  summary: {
    buildId: "3.0-test",
    pages: 10,
    indexableCanonicalPaths: 7,
    internalLinks: 50,
    issues: 0,
    pass: true,
    scope: "test scope",
  },
};

test("classifies 404 sources before recommending route fixes", () => {
  const audit = auditTraffic404({ trafficReport, wholeSiteReport: passingWholeSite, generatedAt: "2026-09-15T00:00:00.000Z" });
  assert.equal(audit.total404Requests, 15);
  assert.equal(audit.categories.hostile_or_platform_probe.requests, 4);
  assert.equal(audit.categories.stale_hashed_asset_request.requests, 2);
  assert.equal(audit.categories.browser_default_static_asset.requests, 1);
  assert.equal(audit.categories.external_or_legacy_sitemap_probe.requests, 1);
  assert.equal(audit.categories.unsupported_api_probe.requests, 1);
  assert.equal(audit.categories.legacy_redirect_probe.requests, 3);
  assert.equal(audit.categories.malformed_placeholder_route.requests, 2);
  assert.equal(audit.categories.content_like_404.requests, 1);
  assert.equal(audit.recommendedFix, "INVESTIGATE_CONTENT_LIKE_404S_BEFORE_FIX");
});

test("does not invent a fix when only probes and stale assets are observed", () => {
  const noContentTraffic = {
    statuses: { 404: 9 },
    top404Paths: trafficReport.top404Paths.filter((row) => row.path !== "/missing-page"),
  };
  const audit = auditTraffic404({ trafficReport: noContentTraffic, wholeSiteReport: passingWholeSite, generatedAt: "2026-09-15T00:00:00.000Z" });
  assert.equal(audit.contentLike404Paths.length, 0);
  assert.equal(audit.internalLinkEvidence, "NO_FIRST_PARTY_INTERNAL_BROKEN_LINK_EVIDENCE");
  assert.equal(audit.recommendedFix, "NO_CODE_FIX_FROM_CURRENT_EVIDENCE");
});

test("markdown reports boundaries without leaking user-level claims", () => {
  const audit = auditTraffic404({ trafficReport, wholeSiteReport: passingWholeSite, generatedAt: "2026-09-15T00:00:00.000Z" });
  const markdown = render404AuditMarkdown(audit);
  assert.match(markdown, /Counts are not unique users/);
  assert.match(markdown, /do not prove indexing, ranking/);
  assert.match(markdown, /Do not change routes until/);
});
