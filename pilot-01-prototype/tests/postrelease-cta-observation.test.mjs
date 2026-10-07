import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { buildPostreleaseCtaObservation, renderPostreleaseCtaObservationMarkdown } from "../../scripts/postrelease-cta-observation.mjs";

function event(type, overrides = {}) {
  return {
    version: 2,
    type,
    eventId: randomUUID(),
    session: overrides.session || randomUUID(),
    page: overrides.page || "/",
    locale: overrides.locale || "en",
    source: overrides.source || "direct",
    market: overrides.market || "unknown",
    product: overrides.product || "spot",
    campaign: overrides.campaign || "organic",
    publisher: overrides.publisher || "direct",
    device: overrides.device || "mobile",
    ...(type === "decision_select" ? { decision: overrides.decision || "binance", placement: overrides.placement || "hero" } : {}),
    ...(["cta_visible", "outbound_handoff", "referral_click"].includes(type)
      ? { platform: overrides.platform || "binance", placement: overrides.placement || "hero" }
      : {}),
    ...overrides,
  };
}

async function writeJsonl(filePath, rows) {
  await writeFile(filePath, rows.map((row) => JSON.stringify(row)).join("\n") + "\n", "utf8");
}

test("postrelease CTA observation includes archives, excludes probe-like rows and does not expose raw identifiers", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "nexu-postrelease-cta-"));
  try {
    const active = path.join(dir, "production.jsonl");
    const archive = path.join(dir, "production.jsonl-20260928");
    const naturalA = randomUUID();
    const naturalB = randomUUID();
    const dropped = randomUUID();
    const probe = randomUUID();

    await writeJsonl(archive, [
      { ...event("page_view", { session: naturalA, page: "/", campaign: "organic" }), receivedAt: "2026-09-28T01:00:00.000Z", environment: "production" },
      { ...event("cta_visible", { session: naturalA, page: "/", platform: "binance", placement: "home-primary" }), receivedAt: "2026-09-28T01:01:00.000Z", environment: "production" },
      { ...event("referral_click", { session: naturalA, page: "/", platform: "binance", placement: "home-primary" }), receivedAt: "2026-09-28T01:02:00.000Z", environment: "production" },
      { ...event("page_view", { session: probe, page: "/", campaign: "playwright-smoke" }), receivedAt: "2026-09-28T01:03:00.000Z", environment: "production" },
      { ...event("cta_visible", { session: probe, page: "/", platform: "okx", placement: "qa-probe" }), receivedAt: "2026-09-28T01:04:00.000Z", environment: "production" },
      { ...event("referral_click", { session: probe, page: "/", platform: "okx", placement: "qa-probe" }), receivedAt: "2026-09-28T01:05:00.000Z", environment: "production" },
    ]);
    await writeJsonl(active, [
      { ...event("page_view", { session: naturalB, page: "/ja", locale: "ja", product: "spot" }), receivedAt: "2026-09-28T02:00:00.000Z", environment: "production" },
      { ...event("cta_visible", { session: naturalB, page: "/ja", locale: "ja", platform: "bitget", placement: "home-primary" }), receivedAt: "2026-09-28T02:01:00.000Z", environment: "production" },
      { ...event("outbound_handoff", { session: naturalB, page: "/ja", locale: "ja", platform: "bitget", placement: "home-primary" }), receivedAt: "2026-09-28T02:02:00.000Z", environment: "production" },
      { ...event("page_view", { session: dropped, page: "/exchanges/bitget", locale: "en" }), receivedAt: "2026-09-28T03:00:00.000Z", environment: "production" },
      { ...event("cta_visible", { session: dropped, page: "/exchanges/bitget", platform: "bitget", placement: "venue-primary" }), receivedAt: "2026-09-28T03:01:00.000Z", environment: "production" },
      { ...event("page_view", { session: randomUUID(), page: "/", campaign: "latest-news" }), receivedAt: "2026-09-28T04:00:00.000Z", environment: "production" },
      { ...event("cta_visible", { session: randomUUID(), page: "/", source: "headless" }), receivedAt: "2026-09-28T04:01:00.000Z", environment: "production" },
      { ...event("page_view", { session: randomUUID(), page: "/before" }), receivedAt: "2026-09-27T23:59:00.000Z", environment: "production" },
    ]);

    const report = await buildPostreleaseCtaObservation({
      releaseStartedAtUtc: "2026-09-28T00:00:00.000Z",
      ctaData: active,
      generatedAt: "2026-09-28T05:00:00.000Z",
    });
    const markdown = renderPostreleaseCtaObservationMarkdown(report);

    assert.equal(report.status, "OBSERVATION_PENDING");
    assert.equal(report.releaseBoundary.releaseStartedAtUtc, "2026-09-28T00:00:00.000Z");
    assert.deepEqual(report.selection.sourceFiles, [archive, active]);
    assert.equal(report.excludedProbeLikeRows, 4);
    assert.equal(report.postNaturalRows, 9);
    assert.equal(report.sampleGate.uniquePageViews, 4);
    assert.equal(report.sampleGate.visibleCtaPageViews, 3);
    assert.equal(report.sampleGate.mode, "OBSERVATION_PENDING");
    assert.equal(report.winner, null);
    assert.equal(report.uplift, null);
    assert.equal(report.queues.page[0].page, "/exchanges/bitget");
    assert.equal(report.queues.platform.find((row) => row.platform === "bitget").visible, 2);
    assert.equal(report.queues.placement.find((row) => row.placement === "venue-primary").visibleNoClick, 1);
    assert.equal(report.queues.page.some((row) => row.page === "/before"), false);
    assert.equal(JSON.stringify(report).includes(naturalA), false);
    assert.equal(JSON.stringify(report).includes(probe), false);
    assert.doesNotMatch(markdown, /session|eventId|playwright-smoke|qa-probe|headless/);
    assert.match(markdown, /Winner: null/);
    assert.match(markdown, /Excluded probe-like rows: 4/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("postrelease CTA observation allows directional queues when either sample gate is reached", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "nexu-postrelease-cta-directional-"));
  try {
    const active = path.join(dir, "production.jsonl");
    const rows = [];
    for (let index = 0; index < 30; index += 1) {
      const session = randomUUID();
      rows.push({ ...event("page_view", { session, page: "/" }), receivedAt: `2026-09-28T01:${String(index).padStart(2, "0")}:00.000Z`, environment: "production" });
      rows.push({ ...event("cta_visible", { session, page: "/", platform: index % 2 ? "okx" : "binance", placement: "home-primary" }), receivedAt: `2026-09-28T01:${String(index).padStart(2, "0")}:10.000Z`, environment: "production" });
    }
    await writeJsonl(active, rows);

    const report = await buildPostreleaseCtaObservation({
      releaseStartedAtUtc: "2026-09-28T00:00:00.000Z",
      ctaData: active,
      generatedAt: "2026-09-28T02:00:00.000Z",
    });

    assert.equal(report.status, "DIRECTIONAL_OBSERVATION_ONLY");
    assert.equal(report.sampleGate.uniquePageViews, 30);
    assert.equal(report.sampleGate.visibleCtaPageViews, 30);
    assert.equal(report.sampleGate.mode, "DIRECTIONAL_OBSERVATION_ONLY");
    assert.equal(report.winner, null);
    assert.equal(report.uplift, null);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("postrelease CTA observation rejects missing release boundaries", async () => {
  await assert.rejects(
    () => buildPostreleaseCtaObservation({ ctaData: "/tmp/missing.jsonl" }),
    /releaseStartedAtUtc is required/,
  );
});
