import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  buildDirectHomeFunnelDiagnostic,
  renderDirectHomeFunnelMarkdown,
  writeDirectHomeFunnelDiagnostic,
} from "../scripts/direct-home-funnel-diagnostic.mjs";

const runFile = promisify(execFile);
const scriptPath = fileURLToPath(new URL("../scripts/direct-home-funnel-diagnostic.mjs", import.meta.url));

function ctaEvent(type, overrides = {}) {
  const base = {
    version: 2,
    type,
    eventId: randomUUID(),
    session: overrides.session || randomUUID(),
    page: overrides.page || "/",
    locale: overrides.locale || "en",
    source: overrides.source || "direct",
    market: overrides.market || "global",
    product: overrides.product || "spot",
    campaign: overrides.campaign || "direct_home",
    publisher: overrides.publisher || "onsite",
    device: overrides.device || "mobile",
    accountStage: overrides.accountStage || "new_account",
    receivedAt: overrides.receivedAt || "2026-09-27T01:00:00.000Z",
    environment: overrides.environment || "production",
  };
  if (type === "decision_select") return { ...base, decision: overrides.decision || "bitget", placement: overrides.placement || "home-decision-panel" };
  if (["cta_visible", "outbound_handoff", "referral_click"].includes(type)) {
    return { ...base, platform: overrides.platform || "bitget", placement: overrides.placement || "home-decision-panel" };
  }
  return base;
}

test("direct homepage diagnostic fails closed when CTA input is missing", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "nexu-direct-missing-"));
  try {
    const report = await buildDirectHomeFunnelDiagnostic({
      ctaData: path.join(dir, "missing.jsonl"),
      minSessions: 2,
      generatedAt: "2026-09-28T00:00:00.000Z",
    });
    assert.equal(report.status, "INPUT_MISSING");
    assert.equal(report.totals.directHomeSessions, null);
    assert.match(renderDirectHomeFunnelMarkdown(report), /Traffic and CTA|Missing input is unknown|Status: INPUT_MISSING/s);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("direct homepage diagnostic blocks interpretation on insufficient sample", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "nexu-direct-small-"));
  try {
    const ctaData = path.join(dir, "cta.jsonl");
    const session = randomUUID();
    await writeFile(ctaData, [
      ctaEvent("page_view", { session }),
      ctaEvent("cta_visible", { session }),
      ctaEvent("decision_select", { session }),
      ctaEvent("referral_click", { session }),
    ].map(JSON.stringify).join("\n"), "utf8");

    const report = await buildDirectHomeFunnelDiagnostic({
      ctaData,
      minSessions: 2,
      generatedAt: "2026-09-28T00:00:00.000Z",
    });

    assert.equal(report.status, "INSUFFICIENT_SAMPLE");
    assert.equal(report.totals.directHomeSessions, 1);
    assert.equal(report.totals.sessionsWithReferralClick, 1);
    assert.equal(report.funnel.referralPerDirectHomeSession, 1);
    assert.equal(report.totals.confirmedRegistrations, null);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("direct homepage diagnostic reports page device locale visibility decision and referral buckets", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "nexu-direct-ready-"));
  try {
    const ctaData = path.join(dir, "cta.jsonl");
    const mobileBitget = randomUUID();
    const desktopBinance = randomUUID();
    const telegramSession = randomUUID();
    const rows = [
      ctaEvent("page_view", { session: mobileBitget, locale: "pt-BR", market: "BR", device: "mobile" }),
      ctaEvent("cta_visible", { session: mobileBitget, locale: "pt-BR", market: "BR", device: "mobile", platform: "bitget" }),
      ctaEvent("decision_select", { session: mobileBitget, locale: "pt-BR", market: "BR", device: "mobile", decision: "bitget" }),
      ctaEvent("outbound_handoff", { session: mobileBitget, locale: "pt-BR", market: "BR", device: "mobile", platform: "bitget" }),
      ctaEvent("referral_click", { session: mobileBitget, locale: "pt-BR", market: "BR", device: "mobile", platform: "bitget" }),
      ctaEvent("page_view", { session: mobileBitget, page: "/compare/bitget-vs-binance", locale: "pt-BR", market: "BR", device: "mobile" }),
      ctaEvent("page_view", { session: mobileBitget, page: "/exchanges/bitget", locale: "pt-BR", market: "BR", device: "mobile" }),
      ctaEvent("page_view", { session: desktopBinance, locale: "ja", market: "JP", device: "desktop" }),
      ctaEvent("cta_visible", { session: desktopBinance, locale: "ja", market: "JP", device: "desktop", platform: "binance" }),
      ctaEvent("decision_select", { session: desktopBinance, locale: "ja", market: "JP", device: "desktop", decision: "binance" }),
      ctaEvent("page_view", { session: desktopBinance, page: "/br/comparar", locale: "ja", market: "JP", device: "desktop" }),
      ctaEvent("page_view", { session: telegramSession, source: "telegram", locale: "en", market: "global" }),
      "{not-json",
    ];
    await writeFile(ctaData, rows.map((row) => typeof row === "string" ? row : JSON.stringify(row)).join("\n"), "utf8");

    const report = await buildDirectHomeFunnelDiagnostic({
      ctaData,
      minSessions: 2,
      fromUtc: "2026-09-27T00:00:00Z",
      toUtc: "2026-09-28T00:00:00Z",
      generatedAt: "2026-09-28T00:00:00.000Z",
    });
    const markdown = renderDirectHomeFunnelMarkdown(report);

    assert.equal(report.status, "READY");
    assert.equal(report.quality.invalidRows, 1);
    assert.equal(report.totals.directHomeSessions, 2);
    assert.equal(report.totals.pageViews, 5);
    assert.equal(report.totals.sessionsWithCtaVisible, 2);
    assert.equal(report.totals.sessionsWithDecision, 2);
    assert.equal(report.totals.sessionsWithReferralClick, 1);
    assert.equal(report.funnel.referralPerCtaVisibleSession, 0.5);
    assert.equal(report.byPage.find((row) => row.page === "/exchanges/bitget").pageViews, 1);
    assert.equal(report.byDevice.find((row) => row.device === "mobile").sessions, 1);
    assert.equal(report.byLocale.find((row) => row.locale === "pt-BR").sessions, 1);
    assert.equal(report.ctaVisibility.find((row) => row.platform === "bitget").ctaVisible, 1);
    assert.equal(report.decisions.find((row) => row.decision === "binance").decisions, 1);
    assert.equal(report.referrals.find((row) => row.platform === "bitget").referralClicks, 1);
    assert.equal(report.pathQuality.status, "PASS");
    assert.equal(report.pathQuality.homeToCompareSessions, 2);
    assert.equal(report.pathQuality.homeToDetailSessions, 1);
    assert.equal(report.pathQuality.completePathSessions, 1);
    assert.equal(report.pathQuality.completePathRate, 0.5);
    assert.equal(report.partnerSideOutcomes.kyc, null);
    assert.equal(report.partnerSideOutcomes.commissions, null);
    assert.ok(report.sessionPaths.some((row) => row.path === "/ > /compare/bitget-vs-binance > /exchanges/bitget"));
    assert.match(markdown, /Confirmed registrations: null/);
    assert.match(markdown, /Partner commissions: null/);
    assert.match(markdown, /Complete home to compare to detail to referral sessions: 1/);
    assert.doesNotMatch(markdown, /11350287|nexu888|LUCKX|luckybitcoin/i);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("direct homepage diagnostic keeps CTA visibility unknown when instrumentation is absent", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "nexu-direct-no-visible-"));
  try {
    const ctaData = path.join(dir, "cta.jsonl");
    const sessionA = randomUUID();
    const sessionB = randomUUID();
    await writeFile(ctaData, [
      ctaEvent("page_view", { session: sessionA, device: "mobile" }),
      ctaEvent("decision_select", { session: sessionA, decision: "bitget" }),
      ctaEvent("referral_click", { session: sessionA, platform: "bitget" }),
      ctaEvent("page_view", { session: sessionB, device: "desktop" }),
      ctaEvent("decision_select", { session: sessionB, decision: "binance" }),
    ].map(JSON.stringify).join("\n"), "utf8");

    const report = await buildDirectHomeFunnelDiagnostic({
      ctaData,
      minSessions: 2,
      generatedAt: "2026-09-28T00:00:00.000Z",
    });
    const markdown = renderDirectHomeFunnelMarkdown(report);

    assert.equal(report.status, "READY_WITH_VISIBILITY_INPUT_MISSING");
    assert.equal(report.totals.directHomeSessions, 2);
    assert.equal(report.totals.sessionsWithCtaVisible, null);
    assert.equal(report.totals.sessionsWithDecision, 2);
    assert.equal(report.totals.sessionsWithReferralClick, 1);
    assert.equal(report.funnel.ctaVisiblePerDirectHomeSession, null);
    assert.equal(report.instrumentation.ctaVisibility.status, "INPUT_MISSING");
    assert.equal(report.byPage.find((row) => row.page === "/").ctaVisible, null);
    assert.equal(report.pathQuality.status, "NEEDS_REVIEW");
    assert.ok(report.pathQuality.issues.includes("no_compare_step_observed"));
    assert.ok(report.pathQuality.issues.includes("no_detail_step_observed"));
    assert.match(markdown, /CTA visibility status: INPUT_MISSING/);
    assert.match(markdown, /Visibility rate is unknown, not zero/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("direct homepage diagnostic CLI writes JSON and Markdown and exits 2 on blocked sample", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "nexu-direct-cli-"));
  try {
    const ctaData = path.join(dir, "cta.jsonl");
    const output = path.join(dir, "diagnostic.json");
    const markdown = path.join(dir, "diagnostic.md");
    const session = randomUUID();
    await mkdir(path.dirname(output), { recursive: true });
    await writeFile(ctaData, JSON.stringify(ctaEvent("page_view", { session })) + "\n", "utf8");

    let result;
    try {
      result = await runFile(process.execPath, [
        scriptPath,
        "--cta-data", ctaData,
        "--output", output,
        "--markdown", markdown,
        "--min-sessions", "2",
      ], { timeout: 15000 });
    } catch (error) {
      result = error;
    }

    assert.equal(result.code, 2);
    assert.match(result.stdout, /INSUFFICIENT_SAMPLE/);
    assert.equal(JSON.parse(await readFile(output, "utf8")).status, "INSUFFICIENT_SAMPLE");
    assert.match(await readFile(markdown, "utf8"), /Minimum direct homepage sessions: 2/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("direct homepage diagnostic writer creates the requested evidence files", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "nexu-direct-write-"));
  try {
    const ctaData = path.join(dir, "cta.jsonl");
    const output = path.join(dir, "nested", "diagnostic.json");
    const markdown = path.join(dir, "nested", "diagnostic.md");
    const session = randomUUID();
    await writeFile(ctaData, [
      ctaEvent("page_view", { session }),
      ctaEvent("cta_visible", { session }),
    ].map(JSON.stringify).join("\n"), "utf8");

    const report = await writeDirectHomeFunnelDiagnostic({
      ctaData,
      output,
      markdown,
      minSessions: 1,
      generatedAt: "2026-09-28T00:00:00.000Z",
    });

    assert.equal(report.status, "READY");
    assert.equal(JSON.parse(await readFile(output, "utf8")).totals.sessionsWithCtaVisible, 1);
    assert.match(await readFile(markdown, "utf8"), /CTA Visibility/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
